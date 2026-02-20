import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleSupabase } from "@/lib/supabase/server";
import crypto from "crypto";

// Initialize Paystack payment for an order
export async function POST(request: NextRequest) {
  try {
    const { orderId } = await request.json();
    if (!orderId) {
      return NextResponse.json({ error: "Missing order ID" }, { status: 400 });
    }

    const supabase = await createServiceRoleSupabase();

    const { data: order } = await supabase
      .from("orders")
      .select("id, order_number, total, buyer_email, buyer_phone, buyer_name, status")
      .eq("id", orderId)
      .single();

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (order.status !== "payment_sent") {
      return NextResponse.json({ error: "Order is not ready for payment" }, { status: 400 });
    }

    const paystackKey = process.env.PAYSTACK_SECRET_KEY;
    if (!paystackKey || paystackKey === "your_paystack_secret_key_here") {
      return NextResponse.json({ error: "Payment not configured" }, { status: 500 });
    }

    // Initialize transaction
    const res = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${paystackKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: order.total, // Already in kobo
        email: order.buyer_email || `${order.buyer_phone}@pulse.ng`,
        reference: `PLS-${order.order_number}-${Date.now()}`,
        callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/payments/verify`,
        metadata: {
          order_id: order.id,
          order_number: order.order_number,
          buyer_name: order.buyer_name,
        },
      }),
    });

    const data = await res.json();

    if (!data.status) {
      return NextResponse.json({ error: "Failed to initialize payment" }, { status: 500 });
    }

    // Store reference
    await supabase
      .from("orders")
      .update({ payment_reference: data.data.reference })
      .eq("id", order.id);

    return NextResponse.json({
      authorization_url: data.data.authorization_url,
      reference: data.data.reference,
    });
  } catch {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
