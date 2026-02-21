import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";

// GET /api/reviews?reviewee_id=X or ?trip_id=X
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const revieweeId = searchParams.get("reviewee_id");
    const tripId = searchParams.get("trip_id");

    let query = supabase
      .from("reviews")
      .select("id, trip_id, reviewer_id, reviewee_id, rating, comment, created_at, profiles:reviewer_id(full_name, company_name)")
      .order("created_at", { ascending: false });

    if (revieweeId) {
      query = query.eq("reviewee_id", revieweeId).limit(10);
    } else if (tripId) {
      query = query.eq("trip_id", tripId);
    } else {
      return NextResponse.json({ error: "reviewee_id or trip_id required" }, { status: 400 });
    }

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json({ reviews: data || [] });
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

    const { data, error } = await supabase
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
