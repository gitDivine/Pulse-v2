import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase, createServiceRoleSupabase } from "@/lib/supabase/server";

// GET /api/disputes/[id] — get a single dispute
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
      .from("disputes")
      .select(`
        *,
        trips(trip_number, carrier_id, agreed_amount,
          loads(load_number, shipper_id, origin_city, origin_state, destination_city, destination_state),
          profiles!trips_carrier_id_fkey(full_name, company_name)
        ),
        profiles!disputes_filed_by_fkey(full_name, company_name)
      `)
      .eq("id", id)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "Dispute not found" }, { status: 404 });
    }

    return NextResponse.json({ dispute: data });
  } catch {
    return NextResponse.json({ error: "Failed to fetch dispute" }, { status: 500 });
  }
}

// PATCH /api/disputes/[id] — respond to or resolve a dispute
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createServerSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const serviceSupabase = await createServiceRoleSupabase();

    // Fetch dispute with trip info
    const { data: dispute, error: fetchError } = await serviceSupabase
      .from("disputes")
      .select("*, trips(carrier_id, load_id, loads(shipper_id, load_number))")
      .eq("id", id)
      .single();

    if (fetchError || !dispute) {
      return NextResponse.json({ error: "Dispute not found" }, { status: 404 });
    }

    const d = dispute as any;
    const isCarrier = d.trips?.carrier_id === user.id;
    const isShipper = d.filed_by === user.id;

    // Carrier responding
    if (body.carrier_response && isCarrier) {
      if (d.status !== "open") {
        return NextResponse.json({ error: "Dispute is no longer open for response" }, { status: 400 });
      }

      const { data: updated, error: updateError } = await serviceSupabase
        .from("disputes")
        .update({
          carrier_response: body.carrier_response,
          status: "carrier_responded",
        })
        .eq("id", id)
        .select()
        .single();

      if (updateError) throw updateError;

      // Notify shipper
      await serviceSupabase.from("notifications").insert({
        user_id: d.filed_by,
        title: "Carrier responded to dispute",
        body: `The carrier has responded to your dispute on load ${d.trips.loads.load_number}. Please review.`,
        priority: "normal",
        action_url: `/shipper/loads/${d.trips.load_id}`,
      });

      await serviceSupabase.from("tracking_events").insert({
        trip_id: d.trip_id,
        event_type: "issue",
        description: "Carrier responded to dispute",
        created_by: user.id,
      });

      return NextResponse.json({ dispute: updated });
    }

    // Shipper resolving (accepting resolution)
    if (body.action === "resolve" && isShipper) {
      const { data: updated, error: updateError } = await serviceSupabase
        .from("disputes")
        .update({
          status: "resolved",
          resolution_note: body.resolution_note || "Resolved by shipper",
          resolved_by: user.id,
          resolved_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single();

      if (updateError) throw updateError;

      // Restore trip to confirmed
      await serviceSupabase
        .from("trips")
        .update({ status: "confirmed", confirmed_at: new Date().toISOString() })
        .eq("id", d.trip_id);

      await serviceSupabase
        .from("loads")
        .update({ status: "completed" as any })
        .eq("id", d.trips.load_id);

      // Notify carrier
      await serviceSupabase.from("notifications").insert({
        user_id: d.trips.carrier_id,
        title: "Dispute resolved",
        body: `The dispute on load ${d.trips.loads.load_number} has been resolved.`,
        priority: "normal",
        action_url: `/carrier/trips/${d.trip_id}`,
      });

      await serviceSupabase.from("tracking_events").insert({
        trip_id: d.trip_id,
        event_type: "status_update",
        description: "Dispute resolved — delivery confirmed",
        created_by: user.id,
      });

      return NextResponse.json({ dispute: updated });
    }

    // Shipper escalating
    if (body.action === "escalate" && isShipper) {
      const { data: updated, error: updateError } = await serviceSupabase
        .from("disputes")
        .update({ status: "escalated" })
        .eq("id", id)
        .select()
        .single();

      if (updateError) throw updateError;

      // Notify carrier
      await serviceSupabase.from("notifications").insert({
        user_id: d.trips.carrier_id,
        title: "Dispute escalated",
        body: `The shipper has escalated the dispute on load ${d.trips.loads.load_number}.`,
        priority: "critical",
        action_url: `/carrier/trips/${d.trip_id}`,
      });

      await serviceSupabase.from("tracking_events").insert({
        trip_id: d.trip_id,
        event_type: "issue",
        description: "Dispute escalated by shipper",
        created_by: user.id,
      });

      return NextResponse.json({ dispute: updated });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch {
    return NextResponse.json({ error: "Failed to update dispute" }, { status: 500 });
  }
}
