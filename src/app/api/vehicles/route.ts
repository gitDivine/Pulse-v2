import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";

// GET /api/vehicles — my vehicles
export async function GET() {
  try {
    const supabase = await createServerSupabase();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data, error } = await supabase
      .from("vehicles")
      .select("*")
      .eq("owner_id", user.id)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json({ vehicles: data });
  } catch {
    return NextResponse.json({ error: "Failed to fetch vehicles" }, { status: 500 });
  }
}

// POST /api/vehicles — add vehicle
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabase();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    const { data, error } = await supabase
      .from("vehicles")
      .insert({
        owner_id: user.id,
        vehicle_type: body.vehicle_type,
        plate_number: body.plate_number.toUpperCase(),
        capacity_kg: body.capacity_kg,
        make: body.make || null,
        model: body.model || null,
        year: body.year || null,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ vehicle: data }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to add vehicle" }, { status: 500 });
  }
}
