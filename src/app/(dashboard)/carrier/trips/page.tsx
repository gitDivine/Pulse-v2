"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { Topbar } from "@/components/dashboard/topbar";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatNaira, timeAgo } from "@/lib/utils/format";
import { TRIP_STATUS_LABELS } from "@/lib/constants";
import { MapPin, ArrowRight, Truck } from "lucide-react";
import Link from "next/link";

const STATUS_FILTERS = ["all", "pending", "pickup", "in_transit", "delivered", "confirmed"];

export default function CarrierTripsPage() {
  const [trips, setTrips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const supabase = createClient();

  useEffect(() => {
    async function fetchTrips() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      let query = supabase
        .from("trips")
        .select(`
          *,
          loads(origin_city, origin_state, destination_city, destination_state, cargo_type)
        `)
        .eq("carrier_id", user.id)
        .order("created_at", { ascending: false });

      if (filter !== "all") query = query.eq("status", filter as any);

      const { data } = await query;
      setTrips(data || []);
      setLoading(false);
    }
    fetchTrips();
  }, [filter, supabase]);

  return (
    <div>
      <Topbar title="My Trips" />

      <div className="p-6 space-y-4">
        {/* Filters */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {STATUS_FILTERS.map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                filter === s
                  ? "bg-orange-500 text-white"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
              }`}
            >
              {s === "all" ? "All" : TRIP_STATUS_LABELS[s]?.label || s}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse" />
            ))}
          </div>
        ) : trips.length === 0 ? (
          <div className="text-center py-12">
            <Truck className="h-12 w-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
            <p className="text-gray-500 dark:text-gray-400">No trips found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {trips.map((trip, i) => {
              const statusInfo = TRIP_STATUS_LABELS[trip.status] || { label: trip.status, color: "bg-gray-100 text-gray-800" };
              const load = trip.loads as any;
              return (
                <motion.div
                  key={trip.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Link href={`/carrier/trips/${trip.id}`}>
                    <Card className="hover:shadow-md transition-shadow cursor-pointer">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-white">
                            <MapPin className="h-3.5 w-3.5 text-orange-500 shrink-0" />
                            {load?.origin_city}, {load?.origin_state}
                            <ArrowRight className="h-3 w-3 text-gray-400" />
                            {load?.destination_city}, {load?.destination_state}
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {trip.trip_number} · {timeAgo(trip.created_at)}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <Badge className={statusInfo.color}>{statusInfo.label}</Badge>
                          <span className="text-sm font-semibold text-gray-900 dark:text-white">
                            {formatNaira(trip.agreed_amount)}
                          </span>
                        </div>
                      </div>
                    </Card>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
