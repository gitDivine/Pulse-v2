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
      .select("*, profiles!bids_carrier_id_fkey(full_name, company_name, avg_rating, total_reviews)")
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

    const { data, error } = await supabase
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

    if (error) throw error;

    // Notify shipper
    const serviceSupabase = await createServiceRoleSupabase();
    const { data: load } = await serviceSupabase
      .from("loads")
      .select("shipper_id, load_number")
      .eq("id", id)
      .single();

    if (load) {
      const { data: carrier } = await serviceSupabase
        .from("profiles")
        .select("full_name, company_name")
        .eq("id", user.id)
        .single();

      await serviceSupabase.from("notifications").insert({
        user_id: load.shipper_id,
        title: "New bid received",
        body: `${carrier?.company_name || carrier?.full_name} placed a bid on load ${load.load_number}`,
        priority: "normal",
        action_url: `/shipper/loads/${id}`,
      });
    }

    return NextResponse.json({ bid: data }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to place bid" }, { status: 500 });
  }
}
