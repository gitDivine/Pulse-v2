"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { Topbar } from "@/components/dashboard/topbar";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatNaira, timeAgo } from "@/lib/utils/format";
import { LOAD_STATUS_LABELS } from "@/lib/constants";
import { Package, MapPin, ArrowRight, Copy, UserCircle } from "lucide-react";
import { ProfilePreview } from "@/components/dashboard/profile-preview";
import Link from "next/link";

const STATUS_FILTERS = ["all", "posted", "bidding", "accepted", "in_transit", "delivered", "completed", "disputed", "cancelled"];

export default function ShipperLoadsPage() {
  const [loads, setLoads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [previewUserId, setPreviewUserId] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    async function fetchLoads() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      let query = supabase
        .from("loads")
        .select("*, trips(id, carrier_id, trip_number, status)")
        .eq("shipper_id", user.id)
        .order("created_at", { ascending: false });

      if (filter !== "all") query = query.eq("status", filter as any);

      const { data } = await query;
      const loadsList = data || [];

      // Batch-fetch carrier profiles for loads that have trips
      const carrierIds = [...new Set(
        loadsList.flatMap((l: any) => {
          const t = Array.isArray(l.trips) ? l.trips : l.trips ? [l.trips] : [];
          return t.map((tr: any) => tr.carrier_id).filter(Boolean);
        })
      )];

      let carrierMap: Record<string, any> = {};
      if (carrierIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, full_name, company_name")
          .in("id", carrierIds);
        for (const p of profiles || []) carrierMap[p.id] = p;
      }

      // Attach carrier profile to each load's trip
      const enriched = loadsList.map((l: any) => {
        const t = Array.isArray(l.trips) ? l.trips[0] : l.trips;
        return { ...l, _carrier: t ? carrierMap[t.carrier_id] || null : null, _trip: t || null };
      });

      setLoads(enriched);
      setLoading(false);
    }
    fetchLoads();
  }, [filter, supabase]);

  return (
    <div>
      <Topbar title="My Loads" />

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
              {s === "all" ? "All" : LOAD_STATUS_LABELS[s]?.label || s}
            </button>
          ))}
        </div>

        {/* Loads list */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse" />
            ))}
          </div>
        ) : loads.length === 0 ? (
          <div className="text-center py-12">
            <Package className="h-12 w-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
            <p className="text-gray-500 dark:text-gray-400">No loads found</p>
            <Link
              href="/shipper/post-load"
              className="inline-block mt-4 text-sm font-medium text-orange-600 hover:text-orange-700"
            >
              Post your first load
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {loads.map((load, i) => {
              const statusInfo = LOAD_STATUS_LABELS[load.status] || { label: load.status, color: "bg-gray-100 text-gray-800" };
              const carrier = load._carrier;
              const trip = load._trip;
              return (
                <motion.div
                  key={load.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Link href={`/shipper/loads/${load.id}`}>
                    <Card className="hover:shadow-md transition-shadow cursor-pointer">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 text-sm text-gray-900 dark:text-white font-medium">
                            <MapPin className="h-3.5 w-3.5 text-orange-500 shrink-0" />
                            {load.origin_city}, {load.origin_state}
                            <ArrowRight className="h-3 w-3 text-gray-400" />
                            {load.destination_city}, {load.destination_state}
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {load.load_number}{load.cargo_description ? ` — ${load.cargo_description}` : ""} · {load.cargo_type} · {load.bid_count} bid{load.bid_count !== 1 ? "s" : ""} · {timeAgo(load.created_at)}
                          </p>
                          {carrier && (
                            <div className="flex items-center gap-1.5 mt-1 text-xs">
                              <button
                                type="button"
                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setPreviewUserId(trip.carrier_id); }}
                                className="flex items-center gap-1 text-gray-500 dark:text-gray-400 hover:text-orange-600 dark:hover:text-orange-400 transition-colors"
                              >
                                <UserCircle className="h-3 w-3" />
                                {carrier.company_name || carrier.full_name}
                              </button>
                            </div>
                          )}
                        </div>
                        <div className="flex items-start gap-2">
                          <Link
                            href={`/shipper/post-load?${new URLSearchParams({
                              duplicate: "1",
                              origin_address: load.origin_address || "",
                              origin_city: load.origin_city || "",
                              origin_state: load.origin_state || "",
                              dest_address: load.destination_address || "",
                              dest_city: load.destination_city || "",
                              dest_state: load.destination_state || "",
                              cargo_type: load.cargo_type || "general",
                              cargo_description: load.cargo_description || "",
                              weight_kg: load.weight_kg ? String(load.weight_kg) : "",
                              quantity: load.quantity ? String(load.quantity) : "1",
                              special_instructions: load.special_instructions || "",
                              budget_amount: load.budget_amount ? String(load.budget_amount / 100) : "",
                              is_negotiable: String(load.is_negotiable ?? true),
                            })}`}
                            onClick={(e) => e.stopPropagation()}
                            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 transition-colors shrink-0"
                            title="Post Again"
                          >
                            <Copy className="h-3.5 w-3.5 text-gray-400 hover:text-orange-500" />
                          </Link>
                          <div className="flex flex-col items-end gap-1">
                            <Badge className={statusInfo.color}>{statusInfo.label}</Badge>
                            {load.budget_amount && (
                              <span className="text-sm font-semibold text-gray-900 dark:text-white">
                                {formatNaira(load.budget_amount)}
                              </span>
                            )}
                          </div>
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

      <ProfilePreview userId={previewUserId} onClose={() => setPreviewUserId(null)} />
    </div>
  );
}
