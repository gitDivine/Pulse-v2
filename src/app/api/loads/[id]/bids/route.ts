import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase, createServiceRoleSupabase } from "@/lib/supabase/server";

// GET /api/loads/[id]/bids — list bids for a load
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createServerSupabase();

    const { data, error } = await supabase
      .from("bids")
      .select("*, profiles!bids_carrier_id_fkey(full_name, company_name, avg_rating, total_reviews, availability_status)")
      .eq("load_id", id)
      .order("created_at", { ascending: true });

    if (error) throw error;

    return NextResponse.json({ bids: data });
  } catch {
    return NextResponse.json({ error: "Failed to fetch bids" }, { status: 500 });
  }
}

// POST /api/loads/[id]/bids — place a bid
export async function POST(
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
    const serviceSupabase = await createServiceRoleSupabase();

    // Verify load exists and is biddable
    const { data: load, error: loadError } = await serviceSupabase
      .from("loads")
      .select("id, shipper_id, load_number, status")
      .eq("id", id)
      .single();

    if (loadError || !load) {
      return NextResponse.json({ error: "Load not found" }, { status: 404 });
    }

    const loadInfo = load as any;
    if (!["posted", "bidding"].includes(loadInfo.status)) {
      return NextResponse.json({ error: "This load is no longer accepting bids" }, { status: 400 });
    }

    // Check for existing active bid
    const { data: existingBid } = await serviceSupabase
      .from("bids")
      .select("id, status")
      .eq("load_id", id)
      .eq("carrier_id", user.id)
      .single();

    if (existingBid) {
      const existing = existingBid as any;
      if (existing.status === "withdrawn") {
        // Re-bid: update the withdrawn bid instead of inserting
        const { data: updated, error: updateError } = await serviceSupabase
          .from("bids")
          .update({
            vehicle_id: body.vehicle_id || null,
            amount: body.amount,
            estimated_hours: body.estimated_hours || null,
            message: body.message || null,
            status: "pending",
          })
          .eq("id", existing.id)
          .select()
          .single();

        if (updateError) {
          return NextResponse.json({ error: `Failed to place bid: ${updateError.message}` }, { status: 500 });
        }

        // Update invitation status (trigger only fires on INSERT, not UPDATE)
        await serviceSupabase
          .from("bid_invitations")
          .update({ status: "bid_placed" })
          .eq("load_id", id)
          .eq("carrier_id", user.id)
          .in("status", ["pending", "viewed"]);

        // Notify shipper
        const { data: carrier } = await serviceSupabase
          .from("profiles")
          .select("full_name, company_name")
          .eq("id", user.id)
          .single();

        await serviceSupabase.from("notifications").insert({
          user_id: loadInfo.shipper_id,
          title: "New bid received",
          body: `${(carrier as any)?.company_name || (carrier as any)?.full_name} placed a bid on load ${loadInfo.load_number}`,
          priority: "normal",
          action_url: `/shipper/loads/${id}`,
        });

        return NextResponse.json({ bid: updated }, { status: 201 });
      }
      return NextResponse.json({ error: "You already have an active bid on this load" }, { status: 409 });
    }

    // New bid
    const { data, error } = await serviceSupabase
      .from("bids")
      .insert({
        load_id: id,
        carrier_id: user.id,
        vehicle_id: body.vehicle_id || null,
        amount: body.amount,
        estimated_hours: body.estimated_hours || null,
        message: body.message || null,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: `Failed to place bid: ${error.message}` }, { status: 500 });
    }

    // Notify shipper
    const { data: carrier } = await serviceSupabase
      .from("profiles")
      .select("full_name, company_name")
      .eq("id", user.id)
      .single();

    await serviceSupabase.from("notifications").insert({
      user_id: loadInfo.shipper_id,
      title: "New bid received",
      body: `${(carrier as any)?.company_name || (carrier as any)?.full_name} placed a bid on load ${loadInfo.load_number}`,
      priority: "normal",
      action_url: `/shipper/loads/${id}`,
    });

    return NextResponse.json({ bid: data }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: `Failed to place bid: ${message}` }, { status: 500 });
  }
}
