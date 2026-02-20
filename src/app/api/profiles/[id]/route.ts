import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase, createServiceRoleSupabase } from "@/lib/supabase/server";

// GET /api/profiles/[id] — public profile data
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createServerSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const serviceSupabase = await createServiceRoleSupabase();

    // Fetch profile
    const { data: profile, error } = await serviceSupabase
      .from("profiles")
      .select("id, full_name, company_name, phone, role, state, city, avatar_url, verification_level, fleet_size, avg_rating, total_reviews, created_at")
      .eq("id", id)
      .single();

    if (error || !profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    // Fetch vehicle types for carriers
    let vehicleTypes: string[] = [];
    if (profile.role === "carrier") {
      const { data: vehicles } = await serviceSupabase
        .from("vehicles")
        .select("vehicle_type")
        .eq("owner_id", id);
      vehicleTypes = [...new Set((vehicles || []).map((v: any) => v.vehicle_type))];
    }

    // Fetch stats
    let stats: any = {};
    if (profile.role === "shipper") {
      const { count } = await serviceSupabase
        .from("loads")
        .select("id", { count: "exact", head: true })
        .eq("shipper_id", id);
      stats.totalLoads = count || 0;
    } else {
      const { count } = await serviceSupabase
        .from("trips")
        .select("id", { count: "exact", head: true })
        .eq("carrier_id", id)
        .eq("status", "confirmed");
      stats.completedTrips = count || 0;
    }

    return NextResponse.json({
      profile: {
        ...profile,
        vehicle_types: vehicleTypes,
        stats,
      },
    });
  } catch {
    return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 });
  }
}
