import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase, createServiceRoleSupabase } from "@/lib/supabase/server";

// POST /api/bid-invitations — invite a carrier to bid on a load
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { load_id, carrier_id } = await request.json();
    if (!load_id || !carrier_id) {
      return NextResponse.json({ error: "load_id and carrier_id are required" }, { status: 400 });
    }

    const serviceSupabase = createServiceRoleSupabase();

    // Verify load belongs to this shipper and is biddable
    const { data: load, error: loadError } = await serviceSupabase
      .from("loads")
      .select("id, load_number, shipper_id, status, origin_city, destination_city")
      .eq("id", load_id)
      .single();

    if (loadError || !load) {
      return NextResponse.json({ error: "Load not found" }, { status: 404 });
    }
    if ((load as any).shipper_id !== user.id) {
      return NextResponse.json({ error: "Not your load" }, { status: 403 });
    }
    if (!["posted", "bidding"].includes((load as any).status)) {
      return NextResponse.json({ error: "Load is no longer accepting bids" }, { status: 400 });
    }

    // Insert invitation
    const { error: insertError } = await serviceSupabase
      .from("bid_invitations")
      .insert({
        load_id,
        shipper_id: user.id,
        carrier_id,
      });

    // Handle duplicate
    if (insertError?.code === "23505") {
      return NextResponse.json({ error: "You've already invited this carrier for this load" }, { status: 409 });
    }
    if (insertError) throw insertError;

    // Get shipper name for notification
    const { data: profile } = await serviceSupabase
      .from("profiles")
      .select("full_name, company_name")
      .eq("id", user.id)
      .single();

    const shipperName = (profile as any)?.company_name || (profile as any)?.full_name || "A shipper";
    const loadInfo = load as any;

    // Send notification to carrier (non-blocking)
    serviceSupabase.from("notifications").insert({
      user_id: carrier_id,
      title: "Invited to bid",
      body: `${shipperName} invited you to bid on load ${loadInfo.load_number} (${loadInfo.origin_city} → ${loadInfo.destination_city})`,
      priority: "normal" as any,
      action_url: `/carrier/loads/${load_id}`,
    }).then(() => {});

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : JSON.stringify(err);
    return NextResponse.json({ error: `Failed to send invitation: ${message}` }, { status: 500 });
  }
}
