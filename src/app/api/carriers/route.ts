import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase, createServiceRoleSupabase } from "@/lib/supabase/server";

// GET /api/carriers — list carriers with filters
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const state = searchParams.get("state");
    const vehicleType = searchParams.get("vehicle_type");
    const minRating = searchParams.get("min_rating");
    const search = searchParams.get("search");
    const availability = searchParams.get("availability");
    const favoritesOnly = searchParams.get("favorites_only") === "true";
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = parseInt(searchParams.get("offset") || "0");

    const serviceSupabase = createServiceRoleSupabase();

    // Pre-filter: favorite carrier IDs
    let favoriteCarrierIds: string[] | null = null;
    if (favoritesOnly) {
      const { data: favs } = await serviceSupabase
        .from("favorites")
        .select("carrier_id")
        .eq("shipper_id", user.id);
      favoriteCarrierIds = (favs || []).map((f: any) => f.carrier_id);
      if (favoriteCarrierIds.length === 0) {
        return NextResponse.json({ carriers: [], total: 0 });
      }
    }

    // Pre-filter: carrier IDs with matching vehicle type
    let vehicleOwnerIds: string[] | null = null;
    if (vehicleType) {
      const { data: vehicles } = await serviceSupabase
        .from("vehicles")
        .select("owner_id")
        .eq("vehicle_type", vehicleType as any)
        .eq("is_active", true);
      vehicleOwnerIds = [...new Set((vehicles || []).map((v: any) => v.owner_id))];
      if (vehicleOwnerIds.length === 0) {
        return NextResponse.json({ carriers: [], total: 0 });
      }
    }

    let query = serviceSupabase
      .from("profiles")
      .select("id, full_name, company_name, state, city, fleet_size, avg_rating, total_reviews, verification_level, avatar_url, availability_status, last_active_at, created_at", { count: "exact" })
      .eq("role", "carrier" as any)
      .eq("is_discoverable", true);

    if (availability) query = query.eq("availability_status", availability as any);
    if (state) query = query.eq("state", state);
    if (minRating) query = query.gte("avg_rating", parseFloat(minRating));
    if (search) query = query.or(`full_name.ilike.%${search}%,company_name.ilike.%${search}%`);
    if (favoriteCarrierIds) query = query.in("id", favoriteCarrierIds);
    if (vehicleOwnerIds) query = query.in("id", vehicleOwnerIds);

    const { data, count, error } = await query
      .order("avg_rating", { ascending: false })
      .order("total_reviews", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    // Batch-fetch vehicle types for returned carriers
    const carrierIds = (data || []).map((c: any) => c.id);
    const vehicleMap: Record<string, string[]> = {};
    if (carrierIds.length > 0) {
      const { data: allVehicles } = await serviceSupabase
        .from("vehicles")
        .select("owner_id, vehicle_type")
        .in("owner_id", carrierIds)
        .eq("is_active", true);

      for (const v of allVehicles || []) {
        if (!vehicleMap[v.owner_id]) vehicleMap[v.owner_id] = [];
        if (!vehicleMap[v.owner_id].includes(v.vehicle_type)) {
          vehicleMap[v.owner_id].push(v.vehicle_type);
        }
      }
    }

    const STALE_MS = 30 * 60 * 1000; // 30 minutes
    const now = Date.now();

    const carriers = (data || []).map((c: any) => {
      // Override "available" → "offline" if inactive >30 min
      // "busy" is trip-triggered (DB trigger) so it stays regardless of app activity
      let status = c.availability_status;
      if (status === "available") {
        const lastActive = c.last_active_at ? new Date(c.last_active_at).getTime() : 0;
        if (now - lastActive > STALE_MS) status = "offline";
      }
      return { ...c, availability_status: status, vehicle_types: vehicleMap[c.id] || [] };
    });

    return NextResponse.json({ carriers, total: count });
  } catch {
    return NextResponse.json({ error: "Failed to fetch carriers" }, { status: 500 });
  }
}
