import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleSupabase } from "@/lib/supabase/server";

// Initialize Paystack payment for a trip
export async function POST(request: NextRequest) {
  try {
    const { tripId } = await request.json();
    if (!tripId) {
      return NextResponse.json({ error: "Missing trip ID" }, { status: 400 });
    }

    const supabase = await createServiceRoleSupabase();

    const { data: trip } = await supabase
      .from("trips")
      .select(`
        id, trip_number, agreed_amount, platform_fee, total_amount, status, carrier_id,
        loads(shipper_id, load_number)
      `)
      .eq("id", tripId)
      .single();

    if (!trip) {
      return NextResponse.json({ error: "Trip not found" }, { status: 404 });
    }

    const t = trip as any;
    if (t.status !== "confirmed") {
      return NextResponse.json({ error: "Trip must be confirmed before payment" }, { status: 400 });
    }

    const paystackKey = process.env.PAYSTACK_SECRET_KEY;
    if (!paystackKey || paystackKey === "your_paystack_secret_key_here") {
      return NextResponse.json({ error: "Payment not configured" }, { status: 500 });
    }

    // Get shipper email for payment
    const load = t.loads as any;
    const { data: shipper } = await supabase
      .from("profiles")
      .select("email, phone, full_name")
      .eq("id", load.shipper_id)
      .single();

    const res = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${paystackKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: t.total_amount, // Carrier amount + platform fee, in kobo
        email: shipper?.email || `${shipper?.phone}@pulse.ng`,
        reference: `PLS-${t.trip_number}-${Date.now()}`,
        callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/shipper/dashboard`,
        metadata: {
          trip_id: t.id,
          trip_number: t.trip_number,
          carrier_id: t.carrier_id,
        },
      }),
    });

    const data = await res.json();

    if (!data.status) {
      return NextResponse.json({ error: "Failed to initialize payment" }, { status: 500 });
    }

    await supabase
      .from("trips")
      .update({ payment_reference: data.data.reference })
      .eq("id", t.id);

    return NextResponse.json({
      authorization_url: data.data.authorization_url,
      reference: data.data.reference,
    });
  } catch {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
