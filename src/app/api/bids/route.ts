import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase, createServiceRoleSupabase } from "@/lib/supabase/server";

// GET /api/bids — fetch all bids for the current carrier
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status"); // pending, accepted, rejected, withdrawn
    const limit = parseInt(searchParams.get("limit") || "50");

    const serviceSupabase = await createServiceRoleSupabase();

    let query = serviceSupabase
      .from("bids")
      .select(`
        id, load_id, vehicle_id, amount, estimated_hours, message, status, created_at,
        loads(id, load_number, origin_city, origin_state, destination_city, destination_state, cargo_type, weight_kg, budget_amount, status, pickup_date, profiles!loads_shipper_id_fkey(full_name, company_name))
      `)
      .eq("carrier_id", user.id)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (status) {
      query = query.eq("status", status as any);
    }

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json({ bids: data || [] });
  } catch {
    return NextResponse.json({ error: "Failed to fetch bids" }, { status: 500 });
  }
}
