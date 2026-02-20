import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";

// GET /api/loads — list loads (filterable)
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabase();
    const { searchParams } = new URL(request.url);

    const status = searchParams.get("status");
    const originState = searchParams.get("origin_state");
    const destinationState = searchParams.get("destination_state");
    const cargoType = searchParams.get("cargo_type");
    const shipperId = searchParams.get("shipper_id");
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = parseInt(searchParams.get("offset") || "0");

    let query = supabase
      .from("loads")
      .select("*, profiles!loads_shipper_id_fkey(full_name, company_name, avg_rating, total_reviews)", { count: "exact" });

    if (status) query = query.eq("status", status as any);
    if (originState) query = query.eq("origin_state", originState as any);
    if (destinationState) query = query.eq("destination_state", destinationState as any);
    if (cargoType) query = query.eq("cargo_type", cargoType as any);
    if (shipperId) query = query.eq("shipper_id", shipperId as any);

    const { data, count, error } = await query
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    return NextResponse.json({ loads: data, total: count });
  } catch {
    return NextResponse.json({ error: "Failed to fetch loads" }, { status: 500 });
  }
}

// POST /api/loads — create a new load
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabase();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    console.log("Create load body:", JSON.stringify({ origin_city: body.origin_city, origin_state: body.origin_state, dest_city: body.destination_city, dest_state: body.destination_state }));

    const { data, error } = await supabase
      .from("loads")
      .insert({
        shipper_id: user.id,
        origin_address: body.origin_address,
        origin_landmark: body.origin_landmark || null,
        origin_city: body.origin_city,
        origin_state: body.origin_state,
        origin_lga: body.origin_lga || null,
        destination_address: body.destination_address,
        destination_landmark: body.destination_landmark || null,
        destination_city: body.destination_city,
        destination_state: body.destination_state,
        destination_lga: body.destination_lga || null,
        cargo_type: body.cargo_type || "general",
        cargo_description: body.cargo_description || null,
        weight_kg: body.weight_kg || null,
        quantity: body.quantity || 1,
        special_instructions: body.special_instructions || null,
        budget_amount: body.budget_amount || null,
        is_negotiable: body.is_negotiable ?? true,
        pickup_date: body.pickup_date,
        delivery_date: body.delivery_date || null,
        status: body.status || "posted",
      })
      .select()
      .single();

    if (error) throw error;

    console.log("Created load:", JSON.stringify({ id: (data as any)?.id, origin_city: (data as any)?.origin_city, origin_state: (data as any)?.origin_state }));
    return NextResponse.json({ load: data }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : JSON.stringify(err);
    console.error("Create load error:", message);
    return NextResponse.json({ error: `Failed to create load: ${message}` }, { status: 500 });
  }
}
