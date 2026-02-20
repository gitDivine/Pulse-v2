import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase, createServiceRoleSupabase } from "@/lib/supabase/server";

// GET /api/favorites — list current user's favorite carrier IDs
export async function GET() {
  try {
    const supabase = await createServerSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data, error } = await supabase
      .from("favorites")
      .select("carrier_id")
      .eq("shipper_id", user.id);

    if (error) throw error;

    return NextResponse.json({ favorites: (data || []).map((f: any) => f.carrier_id) });
  } catch {
    return NextResponse.json({ error: "Failed to fetch favorites" }, { status: 500 });
  }
}

// POST /api/favorites — add a favorite carrier
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { carrier_id } = await request.json();
    if (!carrier_id) {
      return NextResponse.json({ error: "carrier_id is required" }, { status: 400 });
    }

    const { error } = await supabase
      .from("favorites")
      .insert({ shipper_id: user.id, carrier_id });

    // Handle duplicate gracefully
    if (error?.code === "23505") {
      return NextResponse.json({ success: true });
    }
    if (error) throw error;

    return NextResponse.json({ success: true }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to add favorite" }, { status: 500 });
  }
}
