import { createServerSupabase } from "@/lib/supabase/server";
import { Topbar } from "@/components/dashboard/topbar";
import { Card, CardTitle } from "@/components/ui/card";
import { formatNaira } from "@/lib/utils/format";

export default async function AnalyticsPage() {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: business } = await supabase
    .from("businesses")
    .select("id")
    .eq("owner_id", user!.id)
    .single();

  const businessId = business!.id;

  // Fetch analytics data
  const [ordersRes, productsRes, conversationsRes] = await Promise.all([
    supabase
      .from("orders")
      .select("status, total, created_at, delivery_state")
      .eq("business_id", businessId),
    supabase
      .from("products")
      .select("id, name, stock_quantity, low_stock_threshold")
      .eq("business_id", businessId),
    supabase
      .from("conversations")
      .select("id, created_at")
      .eq("business_id", businessId),
  ]);

  const orders = ordersRes.data || [];
  const products = productsRes.data || [];
  const conversations = conversationsRes.data || [];

  const paidStatuses = ["paid", "confirmed", "preparing", "shipped", "delivered"];
  const paidOrders = orders.filter((o) => paidStatuses.includes(o.status));
  const totalRevenue = paidOrders.reduce((sum, o) => sum + o.total, 0);
  const avgOrderValue = paidOrders.length > 0 ? totalRevenue / paidOrders.length : 0;

  // Orders by status
  const statusBreakdown = orders.reduce((acc, o) => {
    acc[o.status] = (acc[o.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Top delivery states
  const stateBreakdown = paidOrders.reduce((acc, o) => {
    const state = o.delivery_state || "Unknown";
    acc[state] = (acc[state] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const topStates = Object.entries(stateBreakdown)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  // Low stock products
  const lowStock = products.filter(
    (p) => p.stock_quantity <= p.low_stock_threshold
  );

  return (
    <div>
      <Topbar title="Analytics" />
      <div className="p-6 space-y-6 max-w-4xl">
        {/* Key metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <p className="text-sm text-gray-500">Total Revenue</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{formatNaira(totalRevenue)}</p>
          </Card>
          <Card>
            <p className="text-sm text-gray-500">Avg Order Value</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{formatNaira(avgOrderValue)}</p>
          </Card>
          <Card>
            <p className="text-sm text-gray-500">Conversations</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{conversations.length}</p>
          </Card>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Order status breakdown */}
          <Card>
            <CardTitle className="mb-3">Orders by Status</CardTitle>
            {Object.keys(statusBreakdown).length === 0 ? (
              <p className="text-sm text-gray-400">No orders yet</p>
            ) : (
              <div className="space-y-2">
                {Object.entries(statusBreakdown).map(([status, count]) => (
                  <div key={status} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 capitalize">{status.replace("_", " ")}</span>
                    <span className="text-sm font-medium text-gray-900">{count}</span>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Top delivery regions */}
          <Card>
            <CardTitle className="mb-3">Top Delivery Regions</CardTitle>
            {topStates.length === 0 ? (
              <p className="text-sm text-gray-400">No delivery data yet</p>
            ) : (
              <div className="space-y-2">
                {topStates.map(([state, count]) => (
                  <div key={state} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">{state}</span>
                    <span className="text-sm font-medium text-gray-900">{count} orders</span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Low stock alert */}
        {lowStock.length > 0 && (
          <Card>
            <CardTitle className="mb-3">Low Stock Products</CardTitle>
            <div className="space-y-2">
              {lowStock.map((p) => (
                <div key={p.id} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">{p.name}</span>
                  <span className="text-sm font-medium text-red-600">
                    {p.stock_quantity} left
                  </span>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
