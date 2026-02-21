import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleSupabase } from "@/lib/supabase/server";
import crypto from "crypto";

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get("x-paystack-signature");
    const secret = process.env.PAYSTACK_SECRET_KEY;

    if (!secret || !signature) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify webhook signature
    const hash = crypto
      .createHmac("sha512", secret)
      .update(body)
      .digest("hex");

    if (hash !== signature) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const event = JSON.parse(body);

    if (event.event === "charge.success") {
      const { reference, metadata } = event.data;
      const tripId = metadata?.trip_id;

      if (!tripId) {
        return NextResponse.json({ error: "No trip ID in metadata" }, { status: 400 });
      }

      const supabase = await createServiceRoleSupabase();

      // Update trip as paid
      await supabase
        .from("trips")
        .update({
          paid_at: new Date().toISOString(),
          payment_reference: reference,
        })
        .eq("id", tripId);

      // Get trip details for notification
      const { data: trip } = await supabase
        .from("trips")
        .select("carrier_id, trip_number, agreed_amount, platform_fee, total_amount, loads(shipper_id, load_number)")
        .eq("id", tripId)
        .single();

      const t = trip as any;
      if (t) {
        // Notify carrier of payment
        await supabase.from("notifications").insert({
          user_id: t.carrier_id,
          title: "Payment received",
          body: `Payment of ${t.agreed_amount / 100} naira received for trip ${t.trip_number}.`,
          priority: "critical",
          action_url: `/carrier/earnings`,
        });
      }
    }

    return NextResponse.json({ received: true });
  } catch {
    return NextResponse.json({ error: "Webhook error" }, { status: 500 });
  }
}
