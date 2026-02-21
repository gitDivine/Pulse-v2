"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Topbar } from "@/components/dashboard/topbar";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatNaira, timeAgo } from "@/lib/utils/format";
import { TRIP_STATUS_LABELS, CARGO_TYPES } from "@/lib/constants";
import { MapPin, ArrowRight, Truck, UserCircle } from "lucide-react";
import Link from "next/link";

const STATUS_FILTERS = ["all", "pending", "pickup", "in_transit", "delivered", "confirmed", "disputed"];

export default function CarrierTripsPage() {
  const [trips, setTrips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    async function fetchTrips() {
      const url = filter === "all" ? "/api/carrier/trips" : `/api/carrier/trips?status=${filter}`;
      const res = await fetch(url);
      const data = await res.json();
      setTrips(data.trips || []);
      setLoading(false);
    }
    setLoading(true);
    fetchTrips();
  }, [filter]);

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
              <div key={i} className="h-28 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse" />
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
              const cargoLabel = load ? (CARGO_TYPES.find((c) => c.value === load.cargo_type)?.label || load.cargo_type) : "";
              const shipperName = load?.profiles?.company_name || load?.profiles?.full_name;
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
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-white">
                            <MapPin className="h-3.5 w-3.5 text-orange-500 shrink-0" />
                            <span className="truncate">
                              {load?.origin_city}, {load?.origin_state}
                            </span>
                            <ArrowRight className="h-3 w-3 text-gray-400 shrink-0" />
                            <span className="truncate">
                              {load?.destination_city}, {load?.destination_state}
                            </span>
                          </div>
                          {load?.cargo_description && (
                            <p className="text-xs text-gray-600 dark:text-gray-300 mt-1 ml-[22px] line-clamp-1">
                              {load.cargo_description}
                            </p>
                          )}
                          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mt-1 ml-[22px]">
                            <span>{trip.trip_number} · {cargoLabel} · {timeAgo(trip.created_at)}</span>
                          </div>
                          {shipperName && (
                            <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 mt-1 ml-[22px]">
                              <UserCircle className="h-3 w-3" />
                              <span>{shipperName}</span>
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col items-end gap-1 shrink-0 ml-3">
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
