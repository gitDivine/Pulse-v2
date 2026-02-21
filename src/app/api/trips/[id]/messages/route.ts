import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase, createServiceRoleSupabase } from "@/lib/supabase/server";

// GET /api/trips/[id]/messages — fetch messages for a trip
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

    // Verify user is part of this trip
    const { data: trip } = await serviceSupabase
      .from("trips")
      .select("id, carrier_id, load_id")
      .eq("id", id)
      .single();

    if (!trip) return NextResponse.json({ error: "Trip not found" }, { status: 404 });
    const { data: tripLoad } = await serviceSupabase
      .from("loads")
      .select("shipper_id")
      .eq("id", trip.load_id)
      .single();
    const shipperId = tripLoad?.shipper_id;
    if (trip.carrier_id !== user.id && shipperId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Fetch messages with sender info
    const { data: messages, error } = await serviceSupabase
      .from("trip_messages")
      .select("id, trip_id, sender_id, body, image_url, read_at, created_at" as any)
      .eq("trip_id", id)
      .order("created_at", { ascending: true });

    if (error) throw error;

    // Mark unread messages from the other party as read
    await serviceSupabase
      .from("trip_messages")
      .update({ read_at: new Date().toISOString() })
      .eq("trip_id", id)
      .neq("sender_id", user.id)
      .is("read_at", null);

    return NextResponse.json({ messages: messages || [] });
  } catch {
    return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 });
  }
}

// POST /api/trips/[id]/messages — send a message
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createServerSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { body, image_url } = await request.json();
    if (!body || typeof body !== "string" || body.trim().length === 0) {
      return NextResponse.json({ error: "Message body is required" }, { status: 400 });
    }
    if (body.length > 2000) {
      return NextResponse.json({ error: "Message too long (max 2000 chars)" }, { status: 400 });
    }

    const serviceSupabase = await createServiceRoleSupabase();

    // Verify user is part of this trip
    const { data: postTrip } = await serviceSupabase
      .from("trips")
      .select("id, carrier_id, load_id, trip_number")
      .eq("id", id)
      .single();

    if (!postTrip) return NextResponse.json({ error: "Trip not found" }, { status: 404 });
    const { data: postLoad } = await serviceSupabase
      .from("loads")
      .select("id, shipper_id, load_number")
      .eq("id", postTrip.load_id)
      .single();
    if (postTrip.carrier_id !== user.id && postLoad?.shipper_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Insert message
    const { data: message, error } = await serviceSupabase
      .from("trip_messages")
      .insert({
        trip_id: id,
        sender_id: user.id,
        body: body.trim(),
        image_url: image_url || null,
      })
      .select("id, trip_id, sender_id, body, image_url, read_at, created_at" as any)
      .single();

    if (error) throw error;

    // Send notification to the other party
    const recipientId = user.id === postTrip.carrier_id ? postLoad?.shipper_id : postTrip.carrier_id;
    if (recipientId) {
      const senderProfile = await serviceSupabase
        .from("profiles")
        .select("full_name, company_name")
        .eq("id", user.id)
        .single();
      const senderName = senderProfile.data?.company_name || senderProfile.data?.full_name || "Someone";
      const actionUrl = user.id === postTrip.carrier_id
        ? `/shipper/loads/${postLoad?.id || ""}`
        : `/carrier/trips/${id}`;

      await serviceSupabase.from("notifications").insert({
        user_id: recipientId,
        title: `New message from ${senderName}`,
        body: body.trim().length > 80 ? body.trim().slice(0, 80) + "…" : body.trim(),
        priority: "normal",
        action_url: actionUrl,
      });
    }

    return NextResponse.json({ message }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }
}
