import { NextResponse } from "next/server";
import { createServerSupabase, createServiceRoleSupabase } from "@/lib/supabase/server";

// GET /api/trips/unread — get total unread message count + per-trip counts
export async function GET() {
  try {
    const supabase = await createServerSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const serviceSupabase = await createServiceRoleSupabase();

    // Get all trips the user is part of (as carrier or shipper)
    const { data: carrierTrips } = await serviceSupabase
      .from("trips")
      .select("id")
      .eq("carrier_id", user.id);

    const { data: shipperLoads } = await serviceSupabase
      .from("loads")
      .select("id")
      .eq("shipper_id", user.id);

    const shipperLoadIds = (shipperLoads || []).map((l) => l.id);
    let shipperTrips: { id: string }[] = [];
    if (shipperLoadIds.length > 0) {
      const { data } = await serviceSupabase
        .from("trips")
        .select("id")
        .in("load_id", shipperLoadIds);
      shipperTrips = data || [];
    }

    const tripIds = new Set<string>();
    for (const t of carrierTrips || []) tripIds.add(t.id);
    for (const t of shipperTrips) tripIds.add(t.id);

    if (tripIds.size === 0) {
      return NextResponse.json({ total: 0, trips: {} });
    }

    // Count unread messages not sent by the current user
    const { data: unread } = await serviceSupabase
      .from("trip_messages")
      .select("trip_id")
      .in("trip_id", Array.from(tripIds))
      .neq("sender_id", user.id)
      .is("read_at", null);

    const perTrip: Record<string, number> = {};
    let total = 0;
    for (const m of unread || []) {
      perTrip[m.trip_id] = (perTrip[m.trip_id] || 0) + 1;
      total++;
    }

    return NextResponse.json({ total, trips: perTrip });
  } catch {
    return NextResponse.json({ error: "Failed to fetch unread count" }, { status: 500 });
  }
}
