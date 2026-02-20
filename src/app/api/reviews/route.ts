import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";

// POST /api/reviews — create a review
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabase();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    const { data, error } = await supabase
      .from("reviews")
      .insert({
        trip_id: body.trip_id,
        reviewer_id: user.id,
        reviewee_id: body.reviewee_id,
        rating: body.rating,
        comment: body.comment || null,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ review: data }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create review" }, { status: 500 });
  }
}
