import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase, createServiceRoleSupabase } from "@/lib/supabase/server";

// GET /api/loads/[id] — load detail
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
      .from("loads")
      .select("*, profiles!loads_shipper_id_fkey(full_name, company_name, avg_rating, total_reviews, phone)")
      .eq("id", id)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "Load not found" }, { status: 404 });
    }

    return NextResponse.json({ load: data });
  } catch {
    return NextResponse.json({ error: "Failed to fetch load" }, { status: 500 });
  }
}

// PATCH /api/loads/[id] — update load status
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

    // Cancellation logic — reject bids, notify carriers
    if (status === "cancelled") {
      const serviceSupabase = createServiceRoleSupabase();

      // Verify ownership
      const { data: load, error: loadError } = await serviceSupabase
        .from("loads")
        .select("id, shipper_id, load_number, status")
        .eq("id", id)
        .eq("shipper_id", user.id)
        .single();

      if (loadError || !load) {
        return NextResponse.json({ error: "Load not found" }, { status: 404 });
      }

      const l = load as any;

      // Don't allow cancelling loads that are already in transit or completed
      if (["in_transit", "delivered", "completed"].includes(l.status)) {
        return NextResponse.json({ error: "Cannot cancel a load that is already in transit or completed" }, { status: 400 });
      }

      // Get all pending bids to notify carriers
      const { data: pendingBids } = await serviceSupabase
        .from("bids")
        .select("id, carrier_id")
        .eq("load_id", id)
        .eq("status", "pending");

      // Reject all pending bids
      await serviceSupabase
        .from("bids")
        .update({ status: "rejected" as any })
        .eq("load_id", id)
        .eq("status", "pending" as any);

      // Cancel the load
      const { data: updated, error: updateError } = await serviceSupabase
        .from("loads")
        .update({ status: "cancelled" as any })
        .eq("id", id)
        .select()
        .single();

      if (updateError) throw updateError;

      // Notify all carriers who had pending bids (non-blocking)
      for (const bid of pendingBids || []) {
        serviceSupabase.from("notifications").insert({
          user_id: (bid as any).carrier_id,
          title: "Load cancelled",
          body: `Load ${l.load_number} has been cancelled by the shipper.`,
          priority: "normal" as any,
        }).then(() => {});
      }

      // If there was an accepted bid/trip, cancel that too
      if (l.status === "accepted") {
        const { data: trip } = await serviceSupabase
          .from("trips")
          .select("id, carrier_id")
          .eq("load_id", id)
          .single();

        if (trip) {
          const t = trip as any;
          await serviceSupabase
            .from("trips")
            .update({ status: "disputed" as any })
            .eq("id", t.id);

          serviceSupabase.from("notifications").insert({
            user_id: t.carrier_id,
            title: "Trip cancelled",
            body: `Load ${l.load_number} has been cancelled. The trip has been marked as disputed.`,
            priority: "critical" as any,
            action_url: `/carrier/trips/${t.id}`,
          }).then(() => {});
        }
      }

      return NextResponse.json({ load: updated });
    }

    // Default: pass-through update (for non-cancellation updates)
    const { data, error } = await supabase
      .from("loads")
      .update(body)
      .eq("id", id)
      .eq("shipper_id", user.id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ load: data });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : JSON.stringify(err);
    return NextResponse.json({ error: `Failed to update load: ${message}` }, { status: 500 });
  }
}
