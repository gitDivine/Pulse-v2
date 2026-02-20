import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";

// GET /api/loads/[id] — load detail
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createServerSupabase();

    const { data, error } = await supabase
      .from("loads")
      .select("*, profiles!loads_shipper_id_fkey(full_name, company_name, avg_rating, total_reviews, phone)")
      .eq("id", id)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "Load not found" }, { status: 404 });
    }

    return NextResponse.json({ load: data });
  } catch {
    return NextResponse.json({ error: "Failed to fetch load" }, { status: 500 });
  }
}

// PATCH /api/loads/[id] — update load status
export async function PATCH(
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
      .from("loads")
      .update(body)
      .eq("id", id)
      .eq("shipper_id", user.id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ load: data });
  } catch {
    return NextResponse.json({ error: "Failed to update load" }, { status: 500 });
  }
}
