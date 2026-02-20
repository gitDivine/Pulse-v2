import { createServerSupabase } from "@/lib/supabase/server";
import { Topbar } from "@/components/dashboard/topbar";
import { ProductList } from "./product-list";

export default async function ProductsPage() {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: business } = await supabase
    .from("businesses")
    .select("id")
    .eq("owner_id", user!.id)
    .single();

  const { data: products } = await supabase
    .from("products")
    .select("id, business_id, name, description, price, compare_at_price, images, category, stock_quantity, low_stock_threshold, is_published, created_at, updated_at")
    .eq("business_id", business!.id)
    .order("created_at", { ascending: false });

  return (
    <div>
      <Topbar title="Products" />
      <div className="p-6">
        <ProductList products={products || []} businessId={business!.id} />
      </div>
    </div>
  );
}
