import { createServerSupabase, createServiceRoleSupabase } from "@/lib/supabase/server";
import { Topbar } from "@/components/dashboard/topbar";
import { Card, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatNaira, timeAgo } from "@/lib/utils/format";
import { TRIP_STATUS_LABELS } from "@/lib/constants";
import {
  Search,
  Truck,
  Banknote,
  UserCircle,
} from "lucide-react";
import Link from "next/link";
import { AvailabilityToggle } from "@/components/dashboard/availability-toggle";
import { RatingCard } from "@/components/dashboard/rating-card";

export default async function CarrierDashboardPage() {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();

  const serviceSupabase = await createServiceRoleSupabase();

  const [availableLoadsRes, tripsRes, recentTripsRes, profileRes] = await Promise.all([
    supabase
      .from("loads")
      .select("id", { count: "exact" })
      .in("status", ["posted", "bidding"]),
    supabase
      .from("trips")
      .select("id, agreed_amount, status")
      .eq("carrier_id", user!.id),
    serviceSupabase
      .from("trips")
      .select(`
        id, trip_number, agreed_amount, status, created_at,
        loads(
          origin_city, origin_state, destination_city, destination_state,
          cargo_type, cargo_description, shipper_id,
          profiles!loads_shipper_id_fkey(full_name, company_name)
        )
      `)
      .eq("carrier_id", user!.id)
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("profiles")
      .select("avg_rating, total_reviews, availability_status")
      .eq("id", user!.id)
      .single(),
  ]);

  const availableCount = availableLoadsRes.count || 0;
  const trips = tripsRes.data || [];
  const recentTrips = (recentTripsRes.data || []) as any[];

  // Fallback: fetch shipper profiles for trips where the join didn't resolve
  const missing = recentTrips.filter((t) => t.loads && !t.loads.profiles && t.loads.shipper_id);
  if (missing.length > 0) {
    const ids = [...new Set(missing.map((t) => t.loads.shipper_id))] as string[];
    const { data: profiles } = await serviceSupabase
      .from("profiles")
      .select("id, full_name, company_name")
      .in("id", ids);
    if (profiles) {
      const map = Object.fromEntries(profiles.map((p) => [p.id, p]));
      for (const t of missing) {
        t.loads.profiles = map[t.loads.shipper_id] || null;
      }
    }
  }
  const profile = profileRes.data;

  const activeTrips = trips.filter((t) => ["pending", "pickup", "in_transit"].includes(t.status)).length;
  const totalEarnings = trips
    .filter((t) => ["confirmed"].includes(t.status))
    .reduce((sum, t) => sum + t.agreed_amount, 0);

  const stats = [
    { label: "Available Loads", value: availableCount.toString(), icon: Search, color: "text-blue-600 bg-blue-50 dark:bg-blue-900/20" },
    { label: "Active Trips", value: activeTrips.toString(), icon: Truck, color: "text-orange-600 bg-orange-50 dark:bg-orange-900/20" },
    { label: "Total Earnings", value: formatNaira(totalEarnings), icon: Banknote, color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20" },
  ];

  return (
    <div>
      <Topbar title="Overview" />

      <div className="p-6 space-y-6">
        {/* Availability toggle */}
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Your status</p>
          <AvailabilityToggle initialStatus={profile?.availability_status || "offline"} />
        </div>

        {/* Stats */}
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
          <RatingCard
            userId={user!.id}
            avgRating={profile?.avg_rating ?? null}
            totalReviews={profile?.total_reviews ?? 0}
          />
        </div>

        {/* Find loads CTA */}
        <Link
          href="/carrier/load-board"
          className="block rounded-2xl border-2 border-dashed border-blue-300 dark:border-blue-500/30 bg-blue-50 dark:bg-blue-500/5 p-6 text-center hover:bg-blue-100 dark:hover:bg-blue-500/10 transition-colors"
        >
          <Search className="h-8 w-8 mx-auto text-blue-500 mb-2" />
          <p className="font-semibold text-blue-700 dark:text-blue-400">Browse Available Loads</p>
          <p className="text-sm text-blue-600/70 dark:text-blue-400/60 mt-1">
            {availableCount} load{availableCount !== 1 ? "s" : ""} available for bidding
          </p>
        </Link>

        {/* Recent trips */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <CardTitle>Recent Trips</CardTitle>
            <Link
              href="/carrier/trips"
              className="text-sm text-orange-600 hover:text-orange-700 font-medium"
            >
              View all
            </Link>
          </div>

          {recentTrips.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400 py-8 text-center">
              No trips yet. Start bidding on loads to get your first trip.
            </p>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-white/5">
              {recentTrips.map((trip: any) => {
                const statusInfo = TRIP_STATUS_LABELS[trip.status] || { label: trip.status, color: "bg-gray-100 text-gray-800" };
                const load = trip.loads as any;
                const shipperName = load?.profiles?.company_name || load?.profiles?.full_name;
                return (
                  <Link
                    key={trip.id}
                    href={`/carrier/trips/${trip.id}`}
                    className="flex items-center justify-between py-3 hover:bg-gray-50 dark:hover:bg-white/5 -mx-2 px-2 rounded-lg transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {load?.origin_city}, {load?.origin_state} → {load?.destination_city}, {load?.destination_state}
                      </p>
                      {load?.cargo_description && (
                        <p className="text-xs text-gray-600 dark:text-gray-300 mt-0.5 line-clamp-1">
                          {load.cargo_description}
                        </p>
                      )}
                      <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        <span>{trip.trip_number} · {timeAgo(trip.created_at)}</span>
                        {shipperName && (
                          <>
                            <span>·</span>
                            <span className="flex items-center gap-0.5">
                              <UserCircle className="h-3 w-3" />
                              {shipperName}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0 ml-3">
                      <Badge className={statusInfo.color}>{statusInfo.label}</Badge>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {formatNaira(trip.agreed_amount)}
                      </span>
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
