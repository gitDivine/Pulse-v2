"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Topbar } from "@/components/dashboard/topbar";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import { formatNaira, timeAgo, formatWeight } from "@/lib/utils/format";
import { NIGERIAN_STATES, CARGO_TYPES, LOAD_STATUS_LABELS } from "@/lib/constants";
import { MapPin, ArrowRight, Package, Star, Calendar, Mail, Check, Undo2 } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function LoadBoardPage() {
  const supabase = createClient();
  const [tab, setTab] = useState<"loads" | "invitations">("loads");
  const [loads, setLoads] = useState<any[]>([]);
  const [invitations, setInvitations] = useState<any[]>([]);
  const [inviteCount, setInviteCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [inviteLoading, setInviteLoading] = useState(true);
  const [originState, setOriginState] = useState("");
  const [destState, setDestState] = useState("");
  const [cargoType, setCargoType] = useState("");
  const [myBids, setMyBids] = useState<Record<string, string>>({}); // load_id → bid status

  useEffect(() => {
    async function fetchLoads() {
      setLoading(true);
      const params = new URLSearchParams();
      params.set("status", "posted");
      if (originState) params.set("origin_state", originState);
      if (destState) params.set("destination_state", destState);
      if (cargoType) params.set("cargo_type", cargoType);
      params.set("limit", "50");

      const res = await fetch(`/api/loads?${params}`);
      const data = await res.json();
      setLoads(data.loads || []);
      setLoading(false);
    }
    fetchLoads();
  }, [originState, destState, cargoType]);

  // Fetch carrier's bids to show badges on load cards
  useEffect(() => {
    async function fetchMyBids() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("bids")
        .select("load_id, status")
        .eq("carrier_id", user.id);
      if (data) {
        const map: Record<string, string> = {};
        for (const bid of data) {
          // If multiple bids exist (withdrawn + new), prefer the non-withdrawn one
          if (!map[bid.load_id] || bid.status !== "withdrawn") {
            map[bid.load_id] = bid.status;
          }
        }
        setMyBids(map);
      }
    }
    fetchMyBids();
  }, [supabase]);

  // Fetch invitations on mount
  useEffect(() => {
    async function fetchInvitations() {
      setInviteLoading(true);
      try {
        const res = await fetch("/api/bid-invitations");
        const data = await res.json();
        setInvitations(data.invitations || []);
        setInviteCount(data.total || 0);
      } catch {}
      setInviteLoading(false);
    }
    fetchInvitations();
  }, []);

  return (
    <div>
      <Topbar title="Load Board" />

      <div className="p-6 space-y-4">
        {/* Tabs */}
        <div className="flex gap-1 rounded-lg bg-gray-100 dark:bg-white/5 p-1">
          <button
            onClick={() => setTab("loads")}
            className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              tab === "loads"
                ? "bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-white shadow-sm"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
            }`}
          >
            All Loads
          </button>
          <button
            onClick={() => setTab("invitations")}
            className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
              tab === "invitations"
                ? "bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-white shadow-sm"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
            }`}
          >
            Invitations
            {inviteCount > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-orange-500 text-[11px] font-bold text-white px-1">
                {inviteCount}
              </span>
            )}
          </button>
        </div>

        {tab === "loads" ? (
          <>
            {/* Filters */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Select
                label="Origin State"
                placeholder="Any state"
                value={originState}
                onChange={(e) => setOriginState(e.target.value)}
                options={[{ value: "", label: "Any state" }, ...NIGERIAN_STATES.map((s) => ({ value: s, label: s }))]}
              />
              <Select
                label="Destination State"
                placeholder="Any state"
                value={destState}
                onChange={(e) => setDestState(e.target.value)}
                options={[{ value: "", label: "Any state" }, ...NIGERIAN_STATES.map((s) => ({ value: s, label: s }))]}
              />
              <Select
                label="Cargo Type"
                placeholder="Any type"
                value={cargoType}
                onChange={(e) => setCargoType(e.target.value)}
                options={[{ value: "", label: "Any type" }, ...CARGO_TYPES.map((c) => ({ value: c.value, label: c.label }))]}
              />
            </div>

            {/* Load Results */}
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-28 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse" />
                ))}
              </div>
            ) : loads.length === 0 ? (
              <div className="text-center py-12">
                <Package className="h-12 w-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
                <p className="text-gray-500 dark:text-gray-400">No loads match your filters</p>
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Try broadening your search</p>
              </div>
            ) : (
              <div className="space-y-3">
                {loads.map((load, i) => {
                  const shipper = load.profiles;
                  const cargoLabel = CARGO_TYPES.find((c) => c.value === load.cargo_type)?.label || load.cargo_type;
                  const bidStatus = myBids[load.id];
                  return (
                    <motion.div
                      key={load.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.03 }}
                    >
                      <Link href={`/carrier/loads/${load.id}`}>
                        <Card className="hover:shadow-md hover:border-orange-200 dark:hover:border-orange-500/20 transition-all cursor-pointer">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-white">
                                <MapPin className="h-3.5 w-3.5 text-orange-500 shrink-0" />
                                {load.origin_city}, {load.origin_state}
                                <ArrowRight className="h-3 w-3 text-gray-400" />
                                {load.destination_city}, {load.destination_state}
                                {bidStatus === "pending" && (
                                  <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 text-[10px] ml-auto shrink-0">
                                    <Check className="h-3 w-3 mr-0.5" />You bid
                                  </Badge>
                                )}
                                {bidStatus === "withdrawn" && (
                                  <Badge className="bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400 text-[10px] ml-auto shrink-0">
                                    <Undo2 className="h-3 w-3 mr-0.5" />Withdrew
                                  </Badge>
                                )}
                              </div>
                              <div className="flex flex-wrap items-center gap-2 mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                                <span className="flex items-center gap-1">
                                  <Package className="h-3 w-3" />
                                  {cargoLabel}
                                </span>
                                {load.weight_kg && <span>· {formatWeight(load.weight_kg)}</span>}
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  Pickup: {new Date(load.pickup_date).toLocaleDateString("en-NG", { day: "numeric", month: "short" })}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 mt-1.5 text-xs">
                                <span className="text-gray-500 dark:text-gray-400">
                                  {shipper?.company_name || shipper?.full_name}
                                </span>
                                {shipper?.avg_rating > 0 && (
                                  <span className="flex items-center gap-0.5 text-yellow-600">
                                    <Star className="h-3 w-3 fill-current" />
                                    {shipper.avg_rating.toFixed(1)}
                                  </span>
                                )}
                                <span className="text-gray-400">· {load.bid_count} bid{load.bid_count !== 1 ? "s" : ""}</span>
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              {load.budget_amount ? (
                                <p className="text-lg font-bold text-gray-900 dark:text-white">
                                  {formatNaira(load.budget_amount)}
                                </p>
                              ) : (
                                <p className="text-sm font-medium text-orange-600 dark:text-orange-400">Open</p>
                              )}
                              {load.is_negotiable && (
                                <p className="text-xs text-gray-400">Negotiable</p>
                              )}
                            </div>
                          </div>
                        </Card>
                      </Link>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </>
        ) : (
          /* Invitations Tab */
          inviteLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-28 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse" />
              ))}
            </div>
          ) : invitations.length === 0 ? (
            <div className="text-center py-12">
              <Mail className="h-12 w-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
              <p className="text-gray-500 dark:text-gray-400">No invitations yet</p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                Shippers will invite you when they need your services
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {invitations.map((inv: any, i: number) => {
                const load = inv.loads;
                const shipper = load?.profiles;
                const cargoLabel = CARGO_TYPES.find((c) => c.value === load?.cargo_type)?.label || load?.cargo_type;
                return (
                  <motion.div
                    key={inv.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                  >
                    <Link href={`/carrier/loads/${load?.id}`}>
                      <Card className="hover:shadow-md hover:border-orange-200 dark:hover:border-orange-500/20 transition-all cursor-pointer border-orange-100 dark:border-orange-500/10">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge className="bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 text-[10px]">
                                Invited {timeAgo(inv.created_at)}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-white">
                              <MapPin className="h-3.5 w-3.5 text-orange-500 shrink-0" />
                              {load?.origin_city}, {load?.origin_state}
                              <ArrowRight className="h-3 w-3 text-gray-400" />
                              {load?.destination_city}, {load?.destination_state}
                            </div>
                            <div className="flex flex-wrap items-center gap-2 mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                              <span className="flex items-center gap-1">
                                <Package className="h-3 w-3" />
                                {cargoLabel}
                              </span>
                              {load?.weight_kg && <span>· {formatWeight(load.weight_kg)}</span>}
                            </div>
                            <div className="flex items-center gap-2 mt-1.5 text-xs">
                              <span className="text-gray-500 dark:text-gray-400">
                                {shipper?.company_name || shipper?.full_name}
                              </span>
                              {shipper?.avg_rating > 0 && (
                                <span className="flex items-center gap-0.5 text-yellow-600">
                                  <Star className="h-3 w-3 fill-current" />
                                  {shipper.avg_rating.toFixed(1)}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            {load?.budget_amount ? (
                              <p className="text-lg font-bold text-gray-900 dark:text-white">
                                {formatNaira(load.budget_amount)}
                              </p>
                            ) : (
                              <p className="text-sm font-medium text-orange-600 dark:text-orange-400">Open</p>
                            )}
                            {load?.is_negotiable && (
                              <p className="text-xs text-gray-400">Negotiable</p>
                            )}
                          </div>
                        </div>
                      </Card>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          )
        )}
      </div>
    </div>
  );
}
