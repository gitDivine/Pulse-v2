import { createServerSupabase } from "@/lib/supabase/server";
import { Topbar } from "@/components/dashboard/topbar";
import { Card, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatNaira, timeAgo } from "@/lib/utils/format";
import { ORDER_STATUS_LABELS } from "@/lib/constants";
import {
  ShoppingCart,
  Package,
  Banknote,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";

export default async function DashboardPage() {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: business } = await supabase
    .from("businesses")
    .select("id")
    .eq("owner_id", user!.id)
    .single();

  const businessId = business!.id;

  // Fetch stats in parallel
  const [ordersRes, productsRes, recentOrdersRes] = await Promise.all([
    supabase
      .from("orders")
      .select("status, total")
      .eq("business_id", businessId),
    supabase
      .from("products")
      .select("id, stock_quantity, low_stock_threshold")
      .eq("business_id", businessId),
    supabase
      .from("orders")
      .select("id, order_number, buyer_name, total, status, created_at")
      .eq("business_id", businessId)
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const orders = ordersRes.data || [];
  const products = productsRes.data || [];
  const recentOrders = recentOrdersRes.data || [];

  const totalRevenue = orders
    .filter((o) => ["paid", "preparing", "shipped", "delivered"].includes(o.status))
    .reduce((sum, o) => sum + o.total, 0);

  const pendingOrders = orders.filter((o) => o.status === "pending").length;
  const lowStockProducts = products.filter(
    (p) => p.stock_quantity <= p.low_stock_threshold
  ).length;

  const stats = [
    { label: "Total Revenue", value: formatNaira(totalRevenue), icon: Banknote, color: "text-green-600 bg-green-50" },
    { label: "Total Orders", value: orders.length.toString(), icon: ShoppingCart, color: "text-blue-600 bg-blue-50" },
    { label: "Products", value: products.length.toString(), icon: Package, color: "text-purple-600 bg-purple-50" },
    { label: "Pending Orders", value: pendingOrders.toString(), icon: TrendingUp, color: "text-orange-600 bg-orange-50" },
  ];

  return (
    <div>
      <Topbar title="Overview" />

      <div className="p-6 space-y-6">
        {/* Stats grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.label}>
                <div className="flex items-center gap-4">
                  <div className={`rounded-lg p-2.5 ${stat.color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">{stat.label}</p>
                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Low stock alert */}
        {lowStockProducts > 0 && (
          <div className="rounded-lg border border-orange-200 bg-orange-50 p-4">
            <p className="text-sm font-medium text-orange-800">
              {lowStockProducts} product{lowStockProducts > 1 ? "s" : ""} running low on stock.{" "}
              <Link href="/dashboard/products" className="underline">
                View products
              </Link>
            </p>
          </div>
        )}

        {/* Recent orders */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <CardTitle>Recent Orders</CardTitle>
            <Link
              href="/dashboard/orders"
              className="text-sm text-orange-600 hover:text-orange-700 font-medium"
            >
              View all
            </Link>
          </div>

          {recentOrders.length === 0 ? (
            <p className="text-sm text-gray-500 py-8 text-center">
              No orders yet. Share your storefront to start receiving orders.
            </p>
          ) : (
            <div className="divide-y divide-gray-100">
              {recentOrders.map((order) => {
                const statusInfo = ORDER_STATUS_LABELS[order.status] || {
                  label: order.status,
                  color: "bg-gray-100 text-gray-800",
                };
                return (
                  <div key={order.id} className="flex items-center justify-between py-3">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {order.order_number}
                      </p>
                      <p className="text-xs text-gray-500">
                        {order.buyer_name} &middot; {timeAgo(order.created_at)}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge className={statusInfo.color}>{statusInfo.label}</Badge>
                      <span className="text-sm font-medium text-gray-900">
                        {formatNaira(order.total)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
