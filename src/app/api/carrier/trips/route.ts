import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase, createServiceRoleSupabase } from "@/lib/supabase/server";

// GET /api/carrier/trips — carrier's trips with shipper info
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    const serviceSupabase = await createServiceRoleSupabase();
    let query = serviceSupabase
      .from("trips")
      .select(`
        *,
        loads(
          origin_city, origin_state, destination_city, destination_state,
          cargo_type, description,
          profiles!loads_shipper_id_fkey(full_name, company_name)
        )
      `)
      .eq("carrier_id", user.id)
      .order("created_at", { ascending: false });

    if (status && status !== "all") {
      query = query.eq("status", status as any);
    }

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json({ trips: data || [] });
  } catch {
    return NextResponse.json({ error: "Failed to fetch trips" }, { status: 500 });
  }
}
