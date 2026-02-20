import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";

// GET /api/addresses — search addresses (SCOUT)
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabase();
    const { searchParams } = new URL(request.url);

    const query = searchParams.get("q");
    const state = searchParams.get("state");
    const city = searchParams.get("city");
    const limit = parseInt(searchParams.get("limit") || "10");

    let dbQuery = supabase
      .from("addresses")
      .select("id, raw_address, parsed_address, landmark, city, state, lga, latitude, longitude, confidence_score");

    if (query) dbQuery = dbQuery.ilike("raw_address", `%${query}%`);
    if (state) dbQuery = dbQuery.eq("state", state);
    if (city) dbQuery = dbQuery.ilike("city", `%${city}%`);

    const { data, error } = await dbQuery
      .order("confidence_score", { ascending: false })
      .limit(limit);

    if (error) throw error;

    return NextResponse.json({ addresses: data });
  } catch {
    return NextResponse.json({ error: "Failed to search addresses" }, { status: 500 });
  }
}

// POST /api/addresses — contribute an address
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabase();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    const { data, error } = await supabase
      .from("addresses")
      .insert({
        raw_address: body.raw_address,
        landmark: body.landmark || null,
        city: body.city,
        state: body.state,
        lga: body.lga || null,
        latitude: body.latitude || null,
        longitude: body.longitude || null,
        contributor_id: user.id,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ address: data }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to add address" }, { status: 500 });
  }
}
