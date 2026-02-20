import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";

// GET /api/trips/[id]/tracking — tracking history
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createServerSupabase();

    const { data, error } = await supabase
      .from("tracking_events")
      .select("*")
      .eq("trip_id", id)
      .order("created_at", { ascending: true });

    if (error) throw error;

    return NextResponse.json({ events: data });
  } catch {
    return NextResponse.json({ error: "Failed to fetch tracking" }, { status: 500 });
  }
}

// POST /api/trips/[id]/tracking — add tracking event
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
      .from("tracking_events")
      .insert({
        trip_id: id,
        event_type: body.event_type || "status_update",
        description: body.description || null,
        latitude: body.latitude || null,
        longitude: body.longitude || null,
        photo_url: body.photo_url || null,
        created_by: user.id,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ event: data }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to add tracking event" }, { status: 500 });
  }
}
