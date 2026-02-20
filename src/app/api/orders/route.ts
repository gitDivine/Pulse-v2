import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleSupabase } from "@/lib/supabase/server";
import { normalizePhone } from "@/lib/utils/format";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      slug,
      buyerName,
      buyerPhone,
      buyerEmail,
      deliveryAddress,
      deliveryState,
      deliveryCity,
      notes,
      items,
    } = body;

    if (!slug || !buyerName || !buyerPhone || !deliveryAddress || !items?.length) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const supabase = await createServiceRoleSupabase();

    // Find business by slug
    const { data: business, error: bizError } = await supabase
      .from("businesses")
      .select("id, owner_id")
      .eq("slug", slug)
      .eq("is_published", true)
      .single();

    if (bizError || !business) {
      return NextResponse.json({ error: "Store not found" }, { status: 404 });
    }

    // Calculate totals
    let subtotal = 0;
    const orderItems = [];

    for (const item of items) {
      const { data: product } = await supabase
        .from("products")
        .select("id, name, price, stock_quantity")
        .eq("id", item.id)
        .eq("business_id", business.id)
        .single();

      if (!product) {
        return NextResponse.json(
          { error: `Product not found: ${item.name}` },
          { status: 400 }
        );
      }

      if (product.stock_quantity < item.quantity) {
        return NextResponse.json(
          { error: `Insufficient stock for ${product.name}. Only ${product.stock_quantity} available.` },
          { status: 400 }
        );
      }

      const totalPrice = product.price * item.quantity;
      subtotal += totalPrice;

      orderItems.push({
        product_id: product.id,
        product_name: product.name,
        quantity: item.quantity,
        unit_price: product.price,
        total_price: totalPrice,
      });
    }

    // Create order (status: pending — waiting for seller to verify and send payment link)
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        business_id: business.id,
        buyer_name: buyerName,
        buyer_phone: normalizePhone(buyerPhone),
        buyer_email: buyerEmail,
        delivery_address: deliveryAddress,
        delivery_state: deliveryState,
        delivery_city: deliveryCity,
        subtotal,
        delivery_fee: 0,
        total: subtotal,
        notes,
        status: "pending",
      })
      .select("id, order_number")
      .single();

    if (orderError || !order) {
      return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
    }

    // Create order items
    const itemsWithOrderId = orderItems.map((item) => ({
      ...item,
      order_id: order.id,
    }));

    await supabase.from("order_items").insert(itemsWithOrderId);

    // Notify seller
    await supabase.from("notifications").insert({
      user_id: business.owner_id,
      title: "New order received",
      body: `${buyerName} placed an order for ${formatOrderSummary(orderItems)}. Review and verify stock before sending payment link.`,
      priority: "critical",
      action_url: "/dashboard/orders",
    });

    return NextResponse.json({
      orderId: order.id,
      orderNumber: order.order_number,
    });
  } catch {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

function formatOrderSummary(items: { product_name: string; quantity: number }[]): string {
  if (items.length === 1) {
    return `${items[0].quantity}x ${items[0].product_name}`;
  }
  return `${items.length} items`;
}
