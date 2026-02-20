"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Topbar } from "@/components/dashboard/topbar";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import { NIGERIAN_STATES, VEHICLE_TYPES, RATING_OPTIONS, VERIFICATION_LABELS } from "@/lib/constants";
import {
  Star, Heart, MapPin, Truck, Shield, Search,
  ChevronLeft, ChevronRight, Send, X, Users,
} from "lucide-react";
import Link from "next/link";

const PAGE_SIZE = 20;

export default function CarrierDirectoryPage() {
  const { toast } = useToast();

  // Carrier list state
  const [carriers, setCarriers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);

  // Favorites
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [togglingFav, setTogglingFav] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [stateFilter, setStateFilter] = useState("");
  const [vehicleTypeFilter, setVehicleTypeFilter] = useState("");
  const [ratingFilter, setRatingFilter] = useState("");
  const [favoritesOnly, setFavoritesOnly] = useState(false);

  // Invite modal
  const [inviteCarrier, setInviteCarrier] = useState<any | null>(null);
  const [myLoads, setMyLoads] = useState<any[]>([]);
  const [loadsLoading, setLoadsLoading] = useState(false);
  const [selectedLoadId, setSelectedLoadId] = useState("");
  const [inviting, setInviting] = useState(false);

  // Search debounce
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => {
    debounceRef.current = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(debounceRef.current);
  }, [search]);

  // Reset page on filter change
  useEffect(() => { setPage(0); }, [stateFilter, vehicleTypeFilter, ratingFilter, debouncedSearch, favoritesOnly]);

  // Fetch carriers
  useEffect(() => {
    async function fetchCarriers() {
      setLoading(true);
      const params = new URLSearchParams();
      if (stateFilter) params.set("state", stateFilter);
      if (vehicleTypeFilter) params.set("vehicle_type", vehicleTypeFilter);
      if (ratingFilter) params.set("min_rating", ratingFilter);
      if (debouncedSearch) params.set("search", debouncedSearch);
      if (favoritesOnly) params.set("favorites_only", "true");
      params.set("limit", String(PAGE_SIZE));
      params.set("offset", String(page * PAGE_SIZE));

      try {
        const res = await fetch(`/api/carriers?${params}`);
        const data = await res.json();
        setCarriers(data.carriers || []);
        setTotal(data.total || 0);
      } catch {
        toast("Failed to load carriers", "error");
      } finally {
        setLoading(false);
      }
    }
    fetchCarriers();
  }, [stateFilter, vehicleTypeFilter, ratingFilter, debouncedSearch, favoritesOnly, page]);

  // Fetch favorites on mount
  useEffect(() => {
    async function fetchFavorites() {
      try {
        const res = await fetch("/api/favorites");
        const data = await res.json();
        setFavorites(new Set(data.favorites || []));
      } catch {}
    }
    fetchFavorites();
  }, []);

  async function toggleFavorite(carrierId: string) {
    if (togglingFav) return;
    setTogglingFav(carrierId);
    const isFav = favorites.has(carrierId);

    // Optimistic update
    setFavorites((prev) => {
      const next = new Set(prev);
      if (isFav) next.delete(carrierId);
      else next.add(carrierId);
      return next;
    });

    try {
      if (isFav) {
        await fetch(`/api/favorites/${carrierId}`, { method: "DELETE" });
      } else {
        await fetch("/api/favorites", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ carrier_id: carrierId }),
        });
      }
    } catch {
      // Revert on failure
      setFavorites((prev) => {
        const next = new Set(prev);
        if (isFav) next.add(carrierId);
        else next.delete(carrierId);
        return next;
      });
      toast("Failed to update favorite", "error");
    } finally {
      setTogglingFav(null);
    }
  }

  async function openInviteModal(carrier: any) {
    setInviteCarrier(carrier);
    setSelectedLoadId("");
    setLoadsLoading(true);

    try {
      const res = await fetch("/api/loads?status=posted&limit=50");
      const data = await res.json();
      // Also fetch bidding loads
      const res2 = await fetch("/api/loads?status=bidding&limit=50");
      const data2 = await res2.json();
      setMyLoads([...(data.loads || []), ...(data2.loads || [])]);
    } catch {
      setMyLoads([]);
    } finally {
      setLoadsLoading(false);
    }
  }

  async function sendInvitation() {
    if (!inviteCarrier || !selectedLoadId) return;
    setInviting(true);

    try {
      const res = await fetch("/api/bid-invitations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ load_id: selectedLoadId, carrier_id: inviteCarrier.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send invitation");

      toast(`Invitation sent to ${inviteCarrier.company_name || inviteCarrier.full_name}`, "success");
      setInviteCarrier(null);
    } catch (err: any) {
      toast(err.message || "Failed to send invitation", "error");
    } finally {
      setInviting(false);
    }
  }

  const offset = page * PAGE_SIZE;

  return (
    <div>
      <Topbar title="Find Carriers" />

      <div className="p-6 space-y-4 max-w-5xl">
        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="relative lg:col-span-2">
            <Input
              placeholder="Search by name or company..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          </div>
          <Select
            value={stateFilter}
            onChange={(e) => setStateFilter(e.target.value)}
            options={[{ value: "", label: "Any state" }, ...NIGERIAN_STATES.map((s) => ({ value: s, label: s }))]}
          />
          <Select
            value={vehicleTypeFilter}
            onChange={(e) => setVehicleTypeFilter(e.target.value)}
            options={[{ value: "", label: "Any vehicle" }, ...VEHICLE_TYPES.map((v) => ({ value: v.value, label: v.label }))]}
          />
          <Select
            value={ratingFilter}
            onChange={(e) => setRatingFilter(e.target.value)}
            options={RATING_OPTIONS.map((r) => ({ value: r.value, label: r.label }))}
          />
        </div>

        {/* Favorites toggle */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFavoritesOnly(!favoritesOnly)}
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              favoritesOnly
                ? "bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-500/20"
                : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700"
            }`}
          >
            <Heart className={`h-3 w-3 ${favoritesOnly ? "fill-current" : ""}`} />
            Favorites only
          </button>
          {!loading && (
            <span className="text-xs text-gray-400">
              {total} carrier{total !== 1 ? "s" : ""} found
            </span>
          )}
        </div>

        {/* Results */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-52 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse" />
            ))}
          </div>
        ) : carriers.length === 0 ? (
          <div className="text-center py-16">
            <Users className="h-12 w-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
            <p className="text-gray-500 dark:text-gray-400">
              {favoritesOnly
                ? "You haven't favorited any carriers yet"
                : "No carriers match your filters"}
            </p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
              {favoritesOnly
                ? "Browse the directory and heart the ones you like"
                : "Try broadening your search"}
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {carriers.map((carrier, i) => {
                const verif = VERIFICATION_LABELS[carrier.verification_level];
                return (
                  <motion.div
                    key={carrier.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                  >
                    <Card className="relative hover:shadow-md hover:border-orange-200 dark:hover:border-orange-500/20 transition-all">
                      {/* Favorite heart */}
                      <button
                        onClick={() => toggleFavorite(carrier.id)}
                        disabled={togglingFav === carrier.id}
                        className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
                      >
                        <Heart
                          className={`h-4 w-4 transition-colors ${
                            favorites.has(carrier.id)
                              ? "fill-red-500 text-red-500"
                              : "text-gray-400 hover:text-red-400"
                          }`}
                        />
                      </button>

                      {/* Carrier info */}
                      <div className="flex items-start gap-3 pr-8">
                        <div className="h-10 w-10 rounded-full bg-orange-100 dark:bg-orange-500/10 flex items-center justify-center shrink-0">
                          <span className="text-sm font-bold text-orange-600 dark:text-orange-400">
                            {(carrier.full_name || "?")[0].toUpperCase()}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {carrier.company_name || carrier.full_name}
                          </p>
                          {carrier.company_name && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{carrier.full_name}</p>
                          )}
                        </div>
                      </div>

                      {/* Location */}
                      {carrier.state && (
                        <div className="flex items-center gap-1 mt-2 text-xs text-gray-500 dark:text-gray-400">
                          <MapPin className="h-3 w-3" />
                          {carrier.city ? `${carrier.city}, ` : ""}{carrier.state}
                        </div>
                      )}

                      {/* Rating + fleet */}
                      <div className="flex items-center gap-2 mt-2">
                        {carrier.avg_rating > 0 ? (
                          <span className="flex items-center gap-0.5 text-xs text-yellow-600">
                            <Star className="h-3 w-3 fill-current" />
                            {carrier.avg_rating.toFixed(1)}
                            <span className="text-gray-400 ml-0.5">({carrier.total_reviews})</span>
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">No reviews yet</span>
                        )}
                        {carrier.fleet_size > 0 && (
                          <span className="flex items-center gap-0.5 text-xs text-gray-500 dark:text-gray-400">
                            <Truck className="h-3 w-3" /> {carrier.fleet_size}
                          </span>
                        )}
                      </div>

                      {/* Vehicle type badges */}
                      {carrier.vehicle_types?.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {carrier.vehicle_types.slice(0, 3).map((vt: string) => {
                            const vtInfo = VEHICLE_TYPES.find((v) => v.value === vt);
                            return (
                              <Badge key={vt} className="bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                                {vtInfo?.label || vt}
                              </Badge>
                            );
                          })}
                          {carrier.vehicle_types.length > 3 && (
                            <Badge className="bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                              +{carrier.vehicle_types.length - 3}
                            </Badge>
                          )}
                        </div>
                      )}

                      {/* Verification */}
                      {verif && (
                        <div className="mt-2">
                          <Badge className={verif.color}>
                            <Shield className="h-3 w-3 mr-0.5" />
                            {verif.label}
                          </Badge>
                        </div>
                      )}

                      {/* Invite button */}
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full mt-3"
                        onClick={() => openInviteModal(carrier)}
                      >
                        <Send className="h-3.5 w-3.5 mr-1" /> Invite to Bid
                      </Button>
                    </Card>
                  </motion.div>
                );
              })}
            </div>

            {/* Pagination */}
            {total > PAGE_SIZE && (
              <div className="flex items-center justify-between pt-2">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {offset + 1}–{Math.min(offset + PAGE_SIZE, total)} of {total}
                </p>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="outline" disabled={offset + PAGE_SIZE >= total} onClick={() => setPage((p) => p + 1)}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Invite Modal */}
      <AnimatePresence>
        {inviteCarrier && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setInviteCarrier(null)}
            />
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className="relative w-full sm:max-w-md bg-white dark:bg-[#111] rounded-t-2xl sm:rounded-2xl border border-gray-200 dark:border-white/10 p-6 shadow-xl"
            >
              <button
                onClick={() => setInviteCarrier(null)}
                className="absolute top-4 right-4 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
              >
                <X className="h-5 w-5 text-gray-400" />
              </button>

              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                Invite {inviteCarrier.company_name || inviteCarrier.full_name}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                Select a load to invite this carrier to bid on.
              </p>

              {loadsLoading ? (
                <div className="h-20 rounded-lg bg-gray-100 dark:bg-gray-800 animate-pulse" />
              ) : myLoads.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-sm text-gray-400 mb-2">No active loads available.</p>
                  <Link href="/shipper/post-load">
                    <Button size="sm" variant="outline">Post a Load</Button>
                  </Link>
                </div>
              ) : (
                <>
                  <Select
                    label="Select Load"
                    value={selectedLoadId}
                    onChange={(e) => setSelectedLoadId(e.target.value)}
                    options={[
                      { value: "", label: "Choose a load..." },
                      ...myLoads.map((l: any) => ({
                        value: l.id,
                        label: `${l.load_number || "Load"} — ${l.origin_city} → ${l.destination_city}`,
                      })),
                    ]}
                  />
                  <Button
                    className="w-full mt-4"
                    disabled={!selectedLoadId}
                    loading={inviting}
                    onClick={sendInvitation}
                  >
                    <Send className="h-4 w-4 mr-1" /> Send Invitation
                  </Button>
                </>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
