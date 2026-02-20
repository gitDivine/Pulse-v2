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
      const orderId = metadata?.order_id;

      if (!orderId) {
        return NextResponse.json({ error: "No order ID in metadata" }, { status: 400 });
      }

      const supabase = await createServiceRoleSupabase();

      // Update order to paid
      await supabase
        .from("orders")
        .update({
          status: "paid",
          paid_at: new Date().toISOString(),
          payment_reference: reference,
        })
        .eq("id", orderId);

      // Notify seller — critical priority (bypasses quiet hours)
      const { data: order } = await supabase
        .from("orders")
        .select("business_id, order_number, total, buyer_name")
        .eq("id", orderId)
        .single();

      if (order) {
        const { data: business } = await supabase
          .from("businesses")
          .select("owner_id")
          .eq("id", order.business_id)
          .single();

        if (business) {
          await supabase.from("notifications").insert({
            user_id: business.owner_id,
            title: "Payment received",
            body: `${order.buyer_name} paid for order ${order.order_number}. Please confirm the order.`,
            priority: "critical",
            action_url: "/dashboard/orders",
          });
        }
      }
    }

    return NextResponse.json({ received: true });
  } catch {
    return NextResponse.json({ error: "Webhook error" }, { status: 500 });
  }
}
