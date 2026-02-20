import { createServerSupabase } from "@/lib/supabase/server";
import { Topbar } from "@/components/dashboard/topbar";
import { OrdersList } from "./orders-list";

export default async function OrdersPage() {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: business } = await supabase
    .from("businesses")
    .select("id")
    .eq("owner_id", user!.id)
    .single();

  const { data: orders } = await supabase
    .from("orders")
    .select("id, order_number, buyer_name, buyer_phone, delivery_address, delivery_city, delivery_state, status, subtotal, delivery_fee, total, notes, created_at, order_items(id, product_name, quantity, unit_price, total_price)")
    .eq("business_id", business!.id)
    .order("created_at", { ascending: false });

  return (
    <div>
      <Topbar title="Orders" />
      <div className="p-6">
        <OrdersList orders={orders || []} />
      </div>
    </div>
  );
}
