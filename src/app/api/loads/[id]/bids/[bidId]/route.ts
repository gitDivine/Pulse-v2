import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase, createServiceRoleSupabase } from "@/lib/supabase/server";

function formatKobo(kobo: number): string {
  return `₦${(kobo / 100).toLocaleString()}`;
}

// PATCH /api/loads/[id]/bids/[bidId] — accept, reject, or withdraw a bid
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
    const { status } = body; // "accepted", "rejected", or "withdrawn"

    if (!["accepted", "rejected", "withdrawn"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ error: "Server misconfigured: missing service role key" }, { status: 500 });
    }

    // Use service role for cross-table operations
    const serviceSupabase = await createServiceRoleSupabase();

    // --- Carrier withdrawing their own bid ---
    if (status === "withdrawn") {
      const { data: bidData, error: bidError } = await serviceSupabase
        .from("bids")
        .select("id, load_id, carrier_id, amount, status, loads(load_number, shipper_id)")
        .eq("id", bidId)
        .eq("load_id", loadId)
        .eq("carrier_id", user.id)
        .single();

      if (bidError || !bidData) {
        return NextResponse.json({ error: "Bid not found" }, { status: 404 });
      }

      const bid = bidData as any;

      if (bid.status !== "pending") {
        return NextResponse.json({ error: "Only pending bids can be withdrawn" }, { status: 400 });
      }

      const { data: updated, error: updateError } = await serviceSupabase
        .from("bids")
        .update({ status: "withdrawn" })
        .eq("id", bidId)
        .select("id, load_id, carrier_id, vehicle_id, amount, status")
        .single();

      if (updateError) throw updateError;

      // Notify shipper (non-blocking)
      serviceSupabase.from("notifications").insert({
        user_id: bid.loads.shipper_id,
        title: "Bid withdrawn",
        body: `A carrier withdrew their ${formatKobo(bid.amount)} bid on load ${bid.loads.load_number}.`,
        priority: "normal",
        action_url: `/shipper/loads/${loadId}`,
      }).then(() => {});

      return NextResponse.json({ bid: updated });
    }

    // --- Shipper accepting or rejecting a bid ---
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
    const message = err instanceof Error ? err.message : JSON.stringify(err);
    console.error("Accept bid error:", message);
    return NextResponse.json({ error: `Failed to update bid: ${message}` }, { status: 500 });
  }
}
