"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Topbar } from "@/components/dashboard/topbar";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatNaira, timeAgo } from "@/lib/utils/format";
import { BID_STATUS_LABELS, CARGO_TYPES } from "@/lib/constants";
import { MapPin, ArrowRight, Package, Gavel, UserCircle } from "lucide-react";
import { ProfilePreview } from "@/components/dashboard/profile-preview";
import Link from "next/link";

type BidFilter = "all" | "pending" | "accepted" | "rejected" | "withdrawn";

export default function CarrierBidsPage() {
  const [bids, setBids] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<BidFilter>("all");
  const [previewUserId, setPreviewUserId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchBids() {
      setLoading(true);
      const params = new URLSearchParams();
      if (filter !== "all") params.set("status", filter);

      const res = await fetch(`/api/bids?${params}`);
      const data = await res.json();
      setBids(data.bids || []);
      setLoading(false);
    }
    fetchBids();
  }, [filter]);

  const filters: { value: BidFilter; label: string }[] = [
    { value: "all", label: "All" },
    { value: "pending", label: "Pending" },
    { value: "accepted", label: "Accepted" },
    { value: "rejected", label: "Rejected" },
    { value: "withdrawn", label: "Withdrawn" },
  ];

  return (
    <div>
      <Topbar title="My Bids" />

      <div className="p-6 space-y-4">
        {/* Filter pills */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {filters.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                filter === f.value
                  ? "bg-orange-500 text-white"
                  : "bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/10"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Results */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-28 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse" />
            ))}
          </div>
        ) : bids.length === 0 ? (
          <div className="text-center py-12">
            <Gavel className="h-12 w-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
            <p className="text-gray-500 dark:text-gray-400">
              {filter === "all" ? "You haven't placed any bids yet" : `No ${filter} bids`}
            </p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
              Browse the <Link href="/carrier/load-board" className="text-orange-500 hover:underline">load board</Link> to find loads
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {bids.map((bid, i) => {
              const load = bid.loads;
              const shipper = load?.profiles;
              const statusInfo = BID_STATUS_LABELS[bid.status] || { label: bid.status, color: "bg-gray-100 text-gray-800" };
              const cargoLabel = CARGO_TYPES.find((c) => c.value === load?.cargo_type)?.label || load?.cargo_type;

              return (
                <motion.div
                  key={bid.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                >
                  <Link href={`/carrier/loads/${load?.id}`}>
                    <Card className={`hover:shadow-md transition-all cursor-pointer ${
                      bid.status === "accepted"
                        ? "border-green-200 dark:border-green-500/20 hover:border-green-300 dark:hover:border-green-500/30"
                        : "hover:border-orange-200 dark:hover:border-orange-500/20"
                    }`}>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          {/* Route */}
                          <div className="flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-white">
                            <MapPin className="h-3.5 w-3.5 text-orange-500 shrink-0" />
                            {load?.origin_city}, {load?.origin_state}
                            <ArrowRight className="h-3 w-3 text-gray-400" />
                            {load?.destination_city}, {load?.destination_state}
                          </div>

                          {/* Cargo + Load number */}
                          <div className="flex flex-wrap items-center gap-2 mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                            <span>{load?.load_number}</span>
                            <span className="flex items-center gap-1">
                              <Package className="h-3 w-3" />
                              {cargoLabel}
                            </span>
                          </div>

                          {/* Shipper + time */}
                          <div className="flex items-center gap-2 mt-1.5 text-xs">
                            <button
                              type="button"
                              onClick={(e) => { e.preventDefault(); e.stopPropagation(); setPreviewUserId(load?.shipper_id); }}
                              className="flex items-center gap-1 text-gray-500 dark:text-gray-400 hover:text-orange-600 dark:hover:text-orange-400 transition-colors"
                            >
                              <UserCircle className="h-3 w-3" />
                              {shipper?.company_name || shipper?.full_name}
                            </button>
                            <span className="text-gray-400">· {timeAgo(bid.created_at)}</span>
                          </div>
                        </div>

                        {/* Amount + Status */}
                        <div className="text-right shrink-0 space-y-1.5">
                          <p className="text-lg font-bold text-gray-900 dark:text-white">
                            {formatNaira(bid.amount)}
                          </p>
                          <Badge className={statusInfo.color}>{statusInfo.label}</Badge>
                          {load?.budget_amount && bid.amount !== load.budget_amount && (
                            <p className="text-[11px] text-gray-400">
                              Budget: {formatNaira(load.budget_amount)}
                            </p>
                          )}
                        </div>
                      </div>

                      {bid.message && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 line-clamp-1">
                          &ldquo;{bid.message}&rdquo;
                        </p>
                      )}
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
