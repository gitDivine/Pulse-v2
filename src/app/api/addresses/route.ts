import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase, createServiceRoleSupabase } from "@/lib/supabase/server";

// GET /api/addresses — search addresses (SCOUT)
// Supports autocomplete: searches raw_address + landmark, ordered by confidence
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const serviceSupabase = await createServiceRoleSupabase();
    const { searchParams } = new URL(request.url);

    const query = searchParams.get("q");
    const state = searchParams.get("state");
    const city = searchParams.get("city");
    const limit = parseInt(searchParams.get("limit") || "8");

    let dbQuery = serviceSupabase
      .from("addresses")
      .select("id, raw_address, parsed_address, landmark, city, state, lga, latitude, longitude, confidence_score, delivery_count");

    if (query) {
      // Search both address and landmark
      dbQuery = dbQuery.or(`raw_address.ilike.%${query}%,landmark.ilike.%${query}%`);
    }
    if (state) dbQuery = dbQuery.ilike("state", state);
    if (city) dbQuery = dbQuery.ilike("city", `%${city}%`);

    const { data, error } = await dbQuery
      .order("delivery_count", { ascending: false })
      .order("confidence_score", { ascending: false })
      .limit(limit);

    if (error) throw error;

    return NextResponse.json({ addresses: data || [] });
  } catch {
    return NextResponse.json({ error: "Failed to search addresses" }, { status: 500 });
  }
}

// POST /api/addresses — contribute an address manually
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabase();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const serviceSupabase = await createServiceRoleSupabase();

    const { data, error } = await serviceSupabase
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
      } as any)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ address: data }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to add address" }, { status: 500 });
  }
}
