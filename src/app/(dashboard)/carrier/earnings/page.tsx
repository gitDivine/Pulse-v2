import { createServerSupabase } from "@/lib/supabase/server";
import { Topbar } from "@/components/dashboard/topbar";
import { Card, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatNaira, timeAgo } from "@/lib/utils/format";
import { TRIP_STATUS_LABELS } from "@/lib/constants";
import { Banknote, TrendingUp, Clock, CheckCircle } from "lucide-react";

export default async function EarningsPage() {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: trips } = await supabase
    .from("trips")
    .select(`
      id, trip_number, agreed_amount, status, paid_at, created_at,
      loads(origin_city, origin_state, destination_city, destination_state)
    `)
    .eq("carrier_id", user!.id)
    .order("created_at", { ascending: false });

  const allTrips = (trips || []) as any[];
  const confirmedTrips = allTrips.filter((t) => t.status === "confirmed");
  const pendingTrips = allTrips.filter((t) => ["delivered"].includes(t.status));
  const activeTrips = allTrips.filter((t) => ["pending", "pickup", "in_transit"].includes(t.status));

  const totalEarned = confirmedTrips.reduce((sum: number, t: any) => sum + t.agreed_amount, 0);
  const pendingPayout = pendingTrips.reduce((sum: number, t: any) => sum + t.agreed_amount, 0);
  const inProgress = activeTrips.reduce((sum: number, t: any) => sum + t.agreed_amount, 0);

  const stats = [
    { label: "Total Earned", value: formatNaira(totalEarned), icon: Banknote, color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20" },
    { label: "Pending Payout", value: formatNaira(pendingPayout), icon: Clock, color: "text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20" },
    { label: "In Progress", value: formatNaira(inProgress), icon: TrendingUp, color: "text-blue-600 bg-blue-50 dark:bg-blue-900/20" },
    { label: "Completed Trips", value: confirmedTrips.length.toString(), icon: CheckCircle, color: "text-purple-600 bg-purple-50 dark:bg-purple-900/20" },
  ];

  return (
    <div>
      <Topbar title="Earnings" />

      <div className="p-6 space-y-6">
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

        {/* Transaction history */}
        <Card>
          <CardTitle className="mb-4">Transaction History</CardTitle>
          {allTrips.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400 py-8 text-center">
              No transactions yet. Complete trips to start earning.
            </p>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-white/5">
              {allTrips.map((trip) => {
                const load = trip.loads as any;
                const statusInfo = TRIP_STATUS_LABELS[trip.status] || { label: trip.status, color: "bg-gray-100 text-gray-800" };
                return (
                  <div key={trip.id} className="flex items-center justify-between py-3">
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {load?.origin_city} → {load?.destination_city}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {trip.trip_number} · {timeAgo(trip.created_at)}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge className={statusInfo.color}>{statusInfo.label}</Badge>
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">
                        {formatNaira(trip.agreed_amount)}
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
