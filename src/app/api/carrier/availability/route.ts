import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase, createServiceRoleSupabase } from "@/lib/supabase/server";

const VALID_STATUSES = ["available", "busy", "offline"];

// GET /api/carrier/availability — get current carrier availability
export async function GET() {
  try {
    const supabase = await createServerSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data } = await supabase
      .from("profiles")
      .select("availability_status, last_active_at")
      .eq("id", user.id)
      .single();

    return NextResponse.json({ status: data?.availability_status || "offline" });
  } catch {
    return NextResponse.json({ error: "Failed to fetch availability" }, { status: 500 });
  }
}

// PATCH /api/carrier/availability — update carrier availability
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createServerSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { status } = await request.json();
    if (!VALID_STATUSES.includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const serviceSupabase = await createServiceRoleSupabase();

    // Verify user is a carrier
    const { data: profile } = await serviceSupabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "carrier") {
      return NextResponse.json({ error: "Only carriers can set availability" }, { status: 403 });
    }

    const { error } = await serviceSupabase
      .from("profiles")
      .update({ availability_status: status, last_active_at: new Date().toISOString() })
      .eq("id", user.id);

    if (error) throw error;

    return NextResponse.json({ status });
  } catch {
    return NextResponse.json({ error: "Failed to update availability" }, { status: 500 });
  }
}
