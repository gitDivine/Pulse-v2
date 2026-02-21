import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase, createServiceRoleSupabase } from "@/lib/supabase/server";

// GET /api/reviews?reviewee_id=X or ?trip_id=X
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const serviceSupabase = await createServiceRoleSupabase();
    const { searchParams } = new URL(request.url);
    const revieweeId = searchParams.get("reviewee_id");
    const tripId = searchParams.get("trip_id");

    if (!revieweeId && !tripId) {
      return NextResponse.json({ error: "reviewee_id or trip_id required" }, { status: 400 });
    }

    // Fetch reviews
    let query = serviceSupabase
      .from("reviews")
      .select("id, trip_id, reviewer_id, reviewee_id, rating, comment, created_at")
      .order("created_at", { ascending: false });

    if (revieweeId) {
      query = query.eq("reviewee_id", revieweeId).limit(10);
    } else {
      query = query.eq("trip_id", tripId!);
    }

    const { data: reviews, error } = await query;
    if (error) throw error;
    if (!reviews || reviews.length === 0) {
      return NextResponse.json({ reviews: [] });
    }

    // Batch-fetch reviewer profiles separately (avoids FK join issues)
    const reviewerIds = [...new Set(reviews.map((r) => r.reviewer_id))];
    const { data: profiles } = await serviceSupabase
      .from("profiles")
      .select("id, full_name, company_name")
      .in("id", reviewerIds);

    const profileMap: Record<string, { full_name: string; company_name: string | null }> = {};
    for (const p of profiles || []) profileMap[p.id] = p;

    const enriched = reviews.map((r) => ({
      ...r,
      profiles: profileMap[r.reviewer_id] || null,
    }));

    return NextResponse.json({ reviews: enriched });
  } catch {
    return NextResponse.json({ error: "Failed to fetch reviews" }, { status: 500 });
  }
}

// POST /api/reviews — create a review
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabase();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const rating = Number(body.rating);
    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json({ error: "Rating must be 1-5" }, { status: 400 });
    }

    // Use service role to bypass RLS for insert + trigger
    const serviceSupabase = await createServiceRoleSupabase();
    const { data, error } = await serviceSupabase
      .from("reviews")
      .insert({
        trip_id: body.trip_id,
        reviewer_id: user.id,
        reviewee_id: body.reviewee_id,
        rating,
        comment: body.comment || null,
      })
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json({ error: "You already reviewed this trip" }, { status: 409 });
      }
      throw error;
    }

    return NextResponse.json({ review: data }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create review" }, { status: 500 });
  }
}
