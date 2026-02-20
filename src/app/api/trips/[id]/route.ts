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

    const { data, error } = await supabase
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

    return NextResponse.json({ trip: data });
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
      .select("*, loads(shipper_id, load_number)")
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
