import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase, createServiceRoleSupabase } from "@/lib/supabase/server";

// GET /api/disputes — list disputes for the current user
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const tripId = searchParams.get("trip_id");

    const serviceSupabase = await createServiceRoleSupabase();

    let query = serviceSupabase
      .from("disputes")
      .select(`
        *,
        trips(trip_number, carrier_id, agreed_amount,
          loads(load_number, origin_city, origin_state, destination_city, destination_state,
            profiles!loads_shipper_id_fkey(full_name, company_name)
          ),
          profiles!trips_carrier_id_fkey(full_name, company_name)
        )
      `)
      .order("created_at", { ascending: false });

    if (tripId) {
      query = query.eq("trip_id", tripId);
    } else {
      // Return disputes where user is shipper (filed_by) or carrier (trip.carrier_id)
      // We'll filter after fetch since Supabase can't do OR across relations easily
      query = query.limit(50);
    }

    const { data, error } = await query;
    if (error) throw error;

    // Filter to only show disputes relevant to this user
    const disputes = tripId
      ? data
      : (data || []).filter((d: any) => {
          return d.filed_by === user.id || d.trips?.carrier_id === user.id;
        });

    return NextResponse.json({ disputes });
  } catch {
    return NextResponse.json({ error: "Failed to fetch disputes" }, { status: 500 });
  }
}

// POST /api/disputes — file a new dispute
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { trip_id, type, description, evidence_urls } = body;

    if (!trip_id || !type || !description) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const serviceSupabase = await createServiceRoleSupabase();

    // Verify trip exists and user is the shipper
    const { data: trip, error: tripError } = await serviceSupabase
      .from("trips")
      .select("id, load_id, carrier_id, status, loads(shipper_id, load_number)")
      .eq("id", trip_id)
      .single();

    if (tripError || !trip) {
      return NextResponse.json({ error: "Trip not found" }, { status: 404 });
    }

    const t = trip as any;
    if (t.loads?.shipper_id !== user.id) {
      return NextResponse.json({ error: "Only the shipper can file a dispute" }, { status: 403 });
    }

    if (!["delivered", "confirmed"].includes(t.status)) {
      return NextResponse.json({ error: "Disputes can only be filed on delivered or confirmed trips" }, { status: 400 });
    }

    // Check for existing dispute
    const { data: existing } = await serviceSupabase
      .from("disputes")
      .select("id")
      .eq("trip_id", trip_id)
      .single();

    if (existing) {
      return NextResponse.json({ error: "A dispute already exists for this trip" }, { status: 409 });
    }

    // Create dispute
    const { data: dispute, error: insertError } = await serviceSupabase
      .from("disputes")
      .insert({
        trip_id,
        load_id: t.load_id,
        filed_by: user.id,
        type,
        description,
        evidence_urls: evidence_urls || [],
      })
      .select()
      .single();

    if (insertError) {
      return NextResponse.json({ error: `Failed to file dispute: ${insertError.message}` }, { status: 500 });
    }

    // Notify carrier
    const { data: shipper } = await serviceSupabase
      .from("profiles")
      .select("full_name, company_name")
      .eq("id", user.id)
      .single();

    await serviceSupabase.from("notifications").insert({
      user_id: t.carrier_id,
      title: "Dispute filed",
      body: `${(shipper as any)?.company_name || (shipper as any)?.full_name} filed a dispute on load ${t.loads.load_number}. Please review and respond.`,
      priority: "critical",
      action_url: `/carrier/trips/${trip_id}`,
    });

    // Create tracking event
    await serviceSupabase.from("tracking_events").insert({
      trip_id,
      event_type: "issue",
      description: `Dispute filed: ${type.replace(/_/g, " ")}`,
      created_by: user.id,
    });

    return NextResponse.json({ dispute }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: `Failed to file dispute: ${message}` }, { status: 500 });
  }
}
