import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase, createServiceRoleSupabase } from "@/lib/supabase/server";

// PATCH /api/loads/[id]/bids/[bidId] — accept or reject a bid
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; bidId: string }> }
) {
  try {
    const { id: loadId, bidId } = await params;
    const supabase = await createServerSupabase();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { status } = body; // "accepted" or "rejected"

    if (!["accepted", "rejected"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ error: "Server misconfigured: missing service role key" }, { status: 500 });
    }

    // Use service role for cross-table operations
    const serviceSupabase = await createServiceRoleSupabase();

    // Verify the shipper owns this load
    const { data: load } = await serviceSupabase
      .from("loads")
      .select("id, shipper_id, load_number")
      .eq("id", loadId)
      .eq("shipper_id", user.id)
      .single();

    if (!load) {
      return NextResponse.json({ error: "Load not found" }, { status: 404 });
    }

    // Update the bid
    const { data: bidData, error: bidError } = await serviceSupabase
      .from("bids")
      .update({ status })
      .eq("id", bidId)
      .eq("load_id", loadId)
      .select("id, load_id, carrier_id, vehicle_id, amount, status")
      .single();

    if (bidError) throw bidError;
    const bid = bidData as any;

    if (status === "accepted") {
      // Reject all other pending bids
      await serviceSupabase
        .from("bids")
        .update({ status: "rejected" })
        .eq("load_id", loadId)
        .neq("id", bidId)
        .eq("status", "pending");

      // Update load status
      await serviceSupabase
        .from("loads")
        .update({ status: "accepted", accepted_bid_id: bidId })
        .eq("id", loadId);

      // Create trip
      const { data: tripData } = await serviceSupabase
        .from("trips")
        .insert({
          load_id: loadId,
          carrier_id: bid.carrier_id,
          vehicle_id: bid.vehicle_id,
          agreed_amount: bid.amount,
        })
        .select("id, trip_number")
        .single();
      const trip = tripData as any;

      // Notify carrier (non-blocking — don't break accept if notification fails)
      serviceSupabase.from("notifications").insert({
        user_id: bid.carrier_id,
        title: "Bid accepted!",
        body: `Your bid on load ${load.load_number} was accepted. Prepare for pickup.`,
        priority: "critical",
        action_url: `/carrier/trips/${trip?.id}`,
      }).then(() => {});

      return NextResponse.json({ bid, trip });
    }

    // Notify carrier of rejection (non-blocking)
    serviceSupabase.from("notifications").insert({
      user_id: bid.carrier_id,
      title: "Bid not selected",
      body: `Your bid on load ${load.load_number} was not selected.`,
      priority: "low",
    }).then(() => {});

    return NextResponse.json({ bid });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Accept bid error:", message);
    return NextResponse.json({ error: `Failed to update bid: ${message}` }, { status: 500 });
  }
}
