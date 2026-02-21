import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase, createServiceRoleSupabase } from "@/lib/supabase/server";

// GET /api/trips/[id] — trip detail
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createServerSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const serviceSupabase = await createServiceRoleSupabase();
    const { data, error } = await serviceSupabase
      .from("trips")
      .select(`
        *,
        loads(*,
          profiles!loads_shipper_id_fkey(full_name, company_name, phone, avg_rating)
        ),
        profiles!trips_carrier_id_fkey(full_name, company_name, phone, avg_rating),
        vehicles(vehicle_type, plate_number)
      `)
      .eq("id", id)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "Trip not found" }, { status: 404 });
    }

    const trip = data as any;

    // Fallback: if shipper profile wasn't resolved through the join, fetch separately
    if (trip.loads && !trip.loads.profiles && trip.loads.shipper_id) {
      const { data: shipperProfile } = await serviceSupabase
        .from("profiles")
        .select("full_name, company_name, phone, avg_rating")
        .eq("id", trip.loads.shipper_id)
        .single();
      if (shipperProfile) {
        trip.loads.profiles = shipperProfile;
      }
    }

    return NextResponse.json({ trip });
  } catch {
    return NextResponse.json({ error: "Failed to fetch trip" }, { status: 500 });
  }
}

// PATCH /api/trips/[id] — update trip status
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createServerSupabase();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { status } = body;

    const serviceSupabase = await createServiceRoleSupabase();

    const updateData: Record<string, unknown> = { status };

    if (status === "pickup") updateData.started_at = new Date().toISOString();
    if (status === "in_transit") updateData.picked_up_at = new Date().toISOString();
    if (status === "delivered") updateData.delivered_at = new Date().toISOString();
    if (status === "confirmed") updateData.confirmed_at = new Date().toISOString();

    const { data: trip, error } = await serviceSupabase
      .from("trips")
      .update(updateData)
      .eq("id", id)
      .select("*, loads(*, profiles!loads_shipper_id_fkey(full_name, company_name, phone, avg_rating)), profiles!trips_carrier_id_fkey(full_name, company_name, phone, avg_rating), vehicles(vehicle_type, plate_number)")
      .single();

    if (error) throw error;
    const t = trip as any;

    // Update load status to match
    if (status === "in_transit") {
      await serviceSupabase.from("loads").update({ status: "in_transit" as any }).eq("id", t.load_id);
    } else if (status === "delivered") {
      await serviceSupabase.from("loads").update({ status: "delivered" as any }).eq("id", t.load_id);
    } else if (status === "confirmed") {
      await serviceSupabase.from("loads").update({ status: "completed" as any }).eq("id", t.load_id);

      // SCOUT V1: Save delivery-confirmed addresses to the address database
      const loadData = t.loads as any;
      if (loadData) {
        const upsertAddress = async (addr: string, landmark: string | null, city: string, state: string, lga: string | null) => {
          // Check for existing address (case-insensitive match)
          const { data: existing } = await serviceSupabase
            .from("addresses")
            .select("id, delivery_count")
            .ilike("raw_address", addr)
            .ilike("city", city)
            .ilike("state", state)
            .limit(1)
            .single();

          if (existing) {
            const newCount = (existing.delivery_count || 0) + 1;
            const confidence = Math.min(1.0, 0.3 + newCount * 0.1);
            await serviceSupabase.from("addresses").update({
              delivery_count: newCount,
              confidence_score: confidence,
              landmark: landmark || undefined,
              lga: lga || undefined,
            } as any).eq("id", existing.id);
          } else {
            await serviceSupabase.from("addresses").insert({
              raw_address: addr,
              landmark: landmark || null,
              city,
              state,
              lga: lga || null,
              contributor_id: user.id,
              confidence_score: 0.3,
            } as any);
          }
        };

        // Upsert both origin and destination (non-blocking)
        Promise.all([
          upsertAddress(loadData.origin_address, loadData.origin_landmark, loadData.origin_city, loadData.origin_state, loadData.origin_lga),
          upsertAddress(loadData.destination_address, loadData.destination_landmark, loadData.destination_city, loadData.destination_state, loadData.destination_lga),
        ]).catch(() => {}); // Don't block the response if address save fails
      }
    }

    // Notify the other party
    const load = t.loads as { shipper_id: string; load_number: string };
    const isCarrier = t.carrier_id === user.id;
    const notifyUserId = isCarrier ? load.shipper_id : t.carrier_id;

    const statusMessages: Record<string, string> = {
      pickup: `Carrier is heading to pickup for load ${load.load_number}`,
      in_transit: `Load ${load.load_number} is now in transit`,
      delivered: `Load ${load.load_number} has been delivered. Please confirm.`,
      confirmed: `Delivery of load ${load.load_number} has been confirmed.`,
    };

    if (statusMessages[status]) {
      await serviceSupabase.from("notifications").insert({
        user_id: notifyUserId,
        title: "Trip update",
        body: statusMessages[status],
        priority: status === "delivered" ? "critical" : "normal",
        action_url: isCarrier ? `/shipper/loads/${t.load_id}` : `/carrier/trips/${id}`,
      });
    }

    // Create tracking event
    await serviceSupabase.from("tracking_events").insert({
      trip_id: id,
      event_type: "status_update",
      description: `Trip status changed to ${status}`,
      created_by: user.id,
    });

    return NextResponse.json({ trip: t });
  } catch {
    return NextResponse.json({ error: "Failed to update trip" }, { status: 500 });
  }
}
