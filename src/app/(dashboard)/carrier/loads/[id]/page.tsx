"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Topbar } from "@/components/dashboard/topbar";
import { Card, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { formatNaira, timeAgo, formatWeight } from "@/lib/utils/format";
import { LOAD_STATUS_LABELS, CARGO_TYPES } from "@/lib/constants";
import { MapPin, Package, Star, Send, XCircle, ArrowRight } from "lucide-react";
import { useToast } from "@/components/ui/toast";

export default function CarrierLoadDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const supabase = createClient();
  const [load, setLoad] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [bidLoading, setBidLoading] = useState(false);
  const [error, setError] = useState("");
  const [existingBid, setExistingBid] = useState<any>(null);

  // Bid form
  const [bidAmount, setBidAmount] = useState("");
  const [estimatedHours, setEstimatedHours] = useState("");
  const [bidMessage, setBidMessage] = useState("");
  const [vehicleId, setVehicleId] = useState("");
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [withdrawLoading, setWithdrawLoading] = useState(false);
  const [withdrawConfirm, setWithdrawConfirm] = useState(false);
  const [tripId, setTripId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    async function fetchData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [loadRes, vehiclesRes] = await Promise.all([
        fetch(`/api/loads/${id}`),
        fetch("/api/vehicles"),
      ]);

      const loadData = await loadRes.json();
      const vehiclesData = await vehiclesRes.json();
      setLoad(loadData.load);
      setVehicles(vehiclesData.vehicles || []);

      // Check if user already has an active bid (not withdrawn)
      const { data: bids } = await supabase
        .from("bids")
        .select("*")
        .eq("load_id", id)
        .eq("carrier_id", user.id)
        .neq("status", "withdrawn")
        .single();

      if (bids) {
        setExistingBid(bids);
        // If bid was accepted, fetch the trip
        if ((bids as any).status === "accepted") {
          const { data: trip } = await supabase
            .from("trips")
            .select("id")
            .eq("load_id", id)
            .eq("carrier_id", user.id)
            .single();
          if (trip) setTripId(trip.id);
        }
      } else if (loadData.load?.budget_amount) {
        // Pre-fill bid amount with shipper's budget (kobo → naira)
        setBidAmount(String(loadData.load.budget_amount / 100));
      }
      setLoading(false);
    }
    fetchData();
  }, [id, supabase]);

  async function handleBid(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setBidLoading(true);

    try {
      const res = await fetch(`/api/loads/${id}/bids`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: parseInt(bidAmount) * 100, // naira to kobo
          estimated_hours: estimatedHours ? parseInt(estimatedHours) : null,
          message: bidMessage || null,
          vehicle_id: vehicleId || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to place bid");
      }

      const data = await res.json();
      setExistingBid(data.bid);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBidLoading(false);
    }
  }

  async function handleWithdraw() {
    setWithdrawLoading(true);
    try {
      const res = await fetch(`/api/loads/${id}/bids/${existingBid.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "withdrawn" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to withdraw bid");
      setExistingBid(null);
      setBidAmount(load?.budget_amount ? String(load.budget_amount / 100) : "");
      setBidMessage("");
      setEstimatedHours("");
      setVehicleId("");
      setWithdrawConfirm(false);
      toast("Bid withdrawn — you can bid again", "success");
    } catch (err: any) {
      toast(err.message || "Failed to withdraw bid", "error");
    } finally {
      setWithdrawLoading(false);
    }
  }

  if (loading) {
    return (
      <div>
        <Topbar title="Load Detail" />
        <div className="p-6 space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!load) {
    return (
      <div>
        <Topbar title="Load Detail" />
        <div className="p-6 text-center py-12">
          <p className="text-gray-500">Load not found</p>
        </div>
      </div>
    );
  }

  const statusInfo = LOAD_STATUS_LABELS[load.status] || { label: load.status, color: "bg-gray-100 text-gray-800" };
  const cargoLabel = CARGO_TYPES.find((c) => c.value === load.cargo_type)?.label || load.cargo_type;
  const shipper = load.profiles;

  return (
    <div>
      <Topbar title={load.load_number} />

      <div className="p-6 space-y-4 max-w-3xl">
        {/* Route */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <Badge className={statusInfo.color}>{statusInfo.label}</Badge>
            <span className="text-xs text-gray-500">{timeAgo(load.created_at)}</span>
          </div>

          <div className="flex items-start gap-3">
            <div className="flex flex-col items-center gap-1">
              <div className="h-3 w-3 rounded-full border-2 border-orange-500 bg-white dark:bg-[#111]" />
              <div className="w-0.5 h-8 bg-gray-200 dark:bg-gray-700" />
              <div className="h-3 w-3 rounded-full bg-orange-500" />
            </div>
            <div className="flex-1 space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{load.origin_address}</p>
                <p className="text-xs text-gray-500">{load.origin_city}, {load.origin_state}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{load.destination_address}</p>
                <p className="text-xs text-gray-500">{load.destination_city}, {load.destination_state}</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Cargo + Shipper */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card>
            <CardTitle className="mb-3">Cargo</CardTitle>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Type</span>
                <span className="font-medium text-gray-900 dark:text-white">{cargoLabel}</span>
              </div>
              {load.weight_kg && (
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Weight</span>
                  <span className="font-medium text-gray-900 dark:text-white">{formatWeight(load.weight_kg)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Qty</span>
                <span className="font-medium text-gray-900 dark:text-white">{load.quantity}</span>
              </div>
              {load.budget_amount && (
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Budget</span>
                  <span className="font-bold text-orange-600">{formatNaira(load.budget_amount)}</span>
                </div>
              )}
            </div>
          </Card>

          <Card>
            <CardTitle className="mb-3">Shipper</CardTitle>
            <div className="space-y-2 text-sm">
              <p className="font-medium text-gray-900 dark:text-white">
                {shipper?.company_name || shipper?.full_name}
              </p>
              {shipper?.avg_rating > 0 && (
                <div className="flex items-center gap-1 text-yellow-600">
                  <Star className="h-3.5 w-3.5 fill-current" />
                  {shipper.avg_rating.toFixed(1)} ({shipper.total_reviews} reviews)
                </div>
              )}
              <p className="text-gray-500 dark:text-gray-400">
                {load.bid_count} bid{load.bid_count !== 1 ? "s" : ""} so far
              </p>
            </div>
          </Card>
        </div>

        {load.special_instructions && (
          <Card className="border-orange-200 dark:border-orange-500/20 bg-orange-50 dark:bg-orange-500/5">
            <p className="text-sm text-orange-700 dark:text-orange-400">
              <strong>Note:</strong> {load.special_instructions}
            </p>
          </Card>
        )}

        {/* Bid form or existing bid */}
        {existingBid ? (
          <Card className={`${
            existingBid.status === "withdrawn" ? "border-gray-200 dark:border-white/10" :
            existingBid.status === "accepted" ? "border-green-200 dark:border-green-500/20 bg-green-50 dark:bg-green-500/5" :
            "border-blue-200 dark:border-blue-500/20 bg-blue-50 dark:bg-blue-500/5"
          }`}>
            <CardTitle className="mb-2">Your Bid</CardTitle>
            <div className="flex items-center justify-between">
              <p className="text-lg font-bold text-gray-900 dark:text-white">{formatNaira(existingBid.amount)}</p>
              <Badge className={
                existingBid.status === "accepted" ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" :
                existingBid.status === "rejected" ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400" :
                existingBid.status === "withdrawn" ? "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400" :
                "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
              }>
                {existingBid.status}
              </Badge>
            </div>
            {existingBid.status === "accepted" && tripId && (
              <Button
                className="w-full mt-3"
                onClick={() => router.push(`/carrier/trips/${tripId}`)}
              >
                Go to Trip <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            )}
            {existingBid.message && (
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">{existingBid.message}</p>
            )}
            {existingBid.status === "pending" && (
              <div className="mt-3 pt-3 border-t border-blue-100 dark:border-blue-500/10">
                {!withdrawConfirm ? (
                  <button
                    onClick={() => setWithdrawConfirm(true)}
                    className="flex items-center gap-1.5 text-sm text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                  >
                    <XCircle className="h-4 w-4" />
                    Withdraw bid
                  </button>
                ) : (
                  <div>
                    <p className="text-sm text-gray-900 dark:text-white font-medium mb-2">
                      Withdraw this bid?
                    </p>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={handleWithdraw}
                        loading={withdrawLoading}
                      >
                        Yes, withdraw
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setWithdrawConfirm(false)}
                      >
                        Keep it
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </Card>
        ) : (load.status === "posted" || load.status === "bidding") ? (
          <Card>
            <CardTitle className="mb-3">Place Your Bid</CardTitle>
            <form onSubmit={handleBid} className="space-y-3">
              <div>
                <Input
                  label="Your Price (₦)"
                  type="number"
                  placeholder="Enter amount in Naira"
                  value={bidAmount}
                  onChange={(e) => setBidAmount(e.target.value)}
                  required
                  min={1}
                />
                {load.budget_amount && (
                  <p className={`text-xs mt-1 ${load.is_negotiable ? "text-gray-400 dark:text-gray-500" : "text-orange-600 dark:text-orange-400"}`}>
                    {load.is_negotiable
                      ? `Shipper's budget: ${formatNaira(load.budget_amount)} (negotiable)`
                      : `Shipper's fixed price: ${formatNaira(load.budget_amount)}`}
                  </p>
                )}
              </div>
              <Input
                label="Estimated Delivery Time (hours)"
                type="number"
                placeholder="e.g. 24"
                value={estimatedHours}
                onChange={(e) => setEstimatedHours(e.target.value)}
              />
              {vehicles.length > 0 && (
                <Select
                  label="Vehicle"
                  placeholder="Select a vehicle"
                  value={vehicleId}
                  onChange={(e) => setVehicleId(e.target.value)}
                  options={vehicles.map((v: any) => ({
                    value: v.id,
                    label: `${v.plate_number} — ${v.vehicle_type} (${v.capacity_kg}kg)`,
                  }))}
                />
              )}
              <Input
                label="Message (optional)"
                placeholder="e.g. I can pick up today"
                value={bidMessage}
                onChange={(e) => setBidMessage(e.target.value)}
              />
              {error && <p className="text-sm text-red-600">{error}</p>}
              <Button type="submit" loading={bidLoading} className="w-full">
                <Send className="h-4 w-4 mr-1" /> Submit Bid
              </Button>
            </form>
          </Card>
        ) : null}
      </div>
    </div>
  );
}
