import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase, createServiceRoleSupabase } from "@/lib/supabase/server";

const VALID_STATUSES = ["available", "busy", "offline", "hidden"];

// GET /api/carrier/availability — get current carrier availability
export async function GET() {
  try {
    const supabase = await createServerSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const serviceSupabase = createServiceRoleSupabase();
    const { data, error } = await serviceSupabase
      .from("profiles")
      .select("availability_status, last_active_at")
      .eq("id", user.id)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      status: data?.availability_status || "offline",
      last_active_at: data?.last_active_at || null,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed to fetch availability" }, { status: 500 });
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

    const serviceSupabase = createServiceRoleSupabase();

    // Verify user is a carrier
    const { data: profile, error: profileError } = await serviceSupabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profileError) {
      return NextResponse.json({ error: profileError.message }, { status: 500 });
    }

    if (profile?.role !== "carrier") {
      return NextResponse.json({ error: "Only carriers can set availability" }, { status: 403 });
    }

    const { error } = await serviceSupabase
      .from("profiles")
      .update({ availability_status: status as any, last_active_at: new Date().toISOString() } as any)
      .eq("id", user.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ status });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed to update availability" }, { status: 500 });
  }
}
