import { notFound } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";
import { StorefrontView } from "./storefront-view";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const supabase = await createServerSupabase();
  const { data: business } = await supabase
    .from("businesses")
    .select("name, description")
    .eq("slug", slug)
    .eq("is_published", true)
    .single();

  if (!business) return { title: "Store not found" };

  return {
    title: `${business.name} — PULSE`,
    description: business.description || `Shop at ${business.name} on PULSE`,
  };
}

export default async function StorePage({ params }: Props) {
  const { slug } = await params;
  const supabase = await createServerSupabase();

  const { data: business } = await supabase
    .from("businesses")
    .select("id, name, slug, description, logo_url, cover_url, category, city, state")
    .eq("slug", slug)
    .eq("is_published", true)
    .single();

  if (!business) notFound();

  const { data: products } = await supabase
    .from("products")
    .select("id, name, description, price, compare_at_price, images, stock_quantity, category")
    .eq("business_id", business.id)
    .eq("is_published", true)
    .order("created_at", { ascending: false });

  return (
    <StorefrontView business={business} products={products || []} />
  );
}
