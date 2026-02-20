import { createServerSupabase } from "@/lib/supabase/server";
import { Topbar } from "@/components/dashboard/topbar";
import { Card, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatNaira, timeAgo } from "@/lib/utils/format";
import { LOAD_STATUS_LABELS } from "@/lib/constants";
import {
  Package,
  Banknote,
  TrendingUp,
  Truck,
} from "lucide-react";
import Link from "next/link";

export default async function ShipperDashboardPage() {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();

  const [loadsRes, tripsRes, recentLoadsRes] = await Promise.all([
    supabase
      .from("loads")
      .select("id, status, budget_amount, bid_count")
      .eq("shipper_id", user!.id),
    supabase
      .from("trips")
      .select("id, agreed_amount, status")
      .eq("load_id", user!.id), // will get via loads join below
    supabase
      .from("loads")
      .select("id, load_number, origin_city, origin_state, destination_city, destination_state, cargo_type, status, budget_amount, bid_count, created_at")
      .eq("shipper_id", user!.id)
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const loads = loadsRes.data || [];
  const recentLoads = recentLoadsRes.data || [];

  const activeLoads = loads.filter((l) => ["posted", "bidding", "accepted", "in_transit"].includes(l.status)).length;
  const completedLoads = loads.filter((l) => l.status === "completed").length;
  const totalBids = loads.reduce((sum, l) => sum + (l.bid_count || 0), 0);
  const totalSpend = loads
    .filter((l) => l.status === "completed")
    .reduce((sum, l) => sum + (l.budget_amount || 0), 0);

  const stats = [
    { label: "Active Loads", value: activeLoads.toString(), icon: Package, color: "text-blue-600 bg-blue-50 dark:bg-blue-900/20" },
    { label: "Total Bids", value: totalBids.toString(), icon: TrendingUp, color: "text-orange-600 bg-orange-50 dark:bg-orange-900/20" },
    { label: "Completed", value: completedLoads.toString(), icon: Truck, color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20" },
    { label: "Total Spend", value: formatNaira(totalSpend), icon: Banknote, color: "text-purple-600 bg-purple-50 dark:bg-purple-900/20" },
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
                    <p className="text-sm text-gray-500 dark:text-gray-400">{stat.label}</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Quick action */}
        <Link
          href="/shipper/post-load"
          className="block rounded-2xl border-2 border-dashed border-orange-300 dark:border-orange-500/30 bg-orange-50 dark:bg-orange-500/5 p-6 text-center hover:bg-orange-100 dark:hover:bg-orange-500/10 transition-colors"
        >
          <Package className="h-8 w-8 mx-auto text-orange-500 mb-2" />
          <p className="font-semibold text-orange-700 dark:text-orange-400">Post a New Load</p>
          <p className="text-sm text-orange-600/70 dark:text-orange-400/60 mt-1">
            Find carriers to move your goods
          </p>
        </Link>

        {/* Recent loads */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <CardTitle>Recent Loads</CardTitle>
            <Link
              href="/shipper/loads"
              className="text-sm text-orange-600 hover:text-orange-700 font-medium"
            >
              View all
            </Link>
          </div>

          {recentLoads.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400 py-8 text-center">
              No loads yet. Post your first load to get started.
            </p>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-white/5">
              {recentLoads.map((load) => {
                const statusInfo = LOAD_STATUS_LABELS[load.status] || {
                  label: load.status,
                  color: "bg-gray-100 text-gray-800",
                };
                return (
                  <Link
                    key={load.id}
                    href={`/shipper/loads/${load.id}`}
                    className="flex items-center justify-between py-3 hover:bg-gray-50 dark:hover:bg-white/5 -mx-2 px-2 rounded-lg transition-colors"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {load.origin_city}, {load.origin_state} → {load.destination_city}, {load.destination_state}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {load.load_number} · {load.bid_count} bid{load.bid_count !== 1 ? "s" : ""} · {timeAgo(load.created_at)}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge className={statusInfo.color}>{statusInfo.label}</Badge>
                      {load.budget_amount && (
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {formatNaira(load.budget_amount)}
                        </span>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
