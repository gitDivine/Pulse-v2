"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { Topbar } from "@/components/dashboard/topbar";
import { Card, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatNaira, timeAgo, formatWeight, formatDuration, formatDateShort, getPickupUrgency } from "@/lib/utils/format";
import { LOAD_STATUS_LABELS, BID_STATUS_LABELS, TRIP_STATUS_LABELS, CARGO_TYPES, DISPUTE_TYPES, DISPUTE_STATUS_LABELS, AVAILABILITY_STATUS_LABELS, PLATFORM_FEE_RATE } from "@/lib/constants";
import { Select } from "@/components/ui/select";
import { MapPin, ArrowRight, Package, Star, Clock, CheckCircle, Truck, Copy, XCircle, Users, AlertTriangle, Upload, X, MessageSquare, ShieldCheck, ShieldAlert, UserCircle, Calendar } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { ProfilePreview } from "@/components/dashboard/profile-preview";
import Link from "next/link";
import { TripChat } from "@/components/dashboard/trip-chat";
import { TripReview } from "@/components/dashboard/trip-review";

export default function LoadDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [load, setLoad] = useState<any>(null);
  const [bids, setBids] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [cancelConfirm, setCancelConfirm] = useState(false);
  const [showDisputeForm, setShowDisputeForm] = useState(false);
  const [dispute, setDispute] = useState<any>(null);
  const [disputeType, setDisputeType] = useState("");
  const [disputeDesc, setDisputeDesc] = useState("");
  const [evidenceUrls, setEvidenceUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [previewUserId, setPreviewUserId] = useState<string | null>(null);
  const [confirmDisputedDelivery, setConfirmDisputedDelivery] = useState(false);
  const [confirmDelivery, setConfirmDelivery] = useState(false);
  const [confirmAcceptBid, setConfirmAcceptBid] = useState<string | null>(null);
  const [trip, setTrip] = useState<any>(null);
  const supabase = createClient();
  const { toast } = useToast();

  useEffect(() => {
    async function fetchData() {
      const [loadRes, bidsRes] = await Promise.all([
        fetch(`/api/loads/${id}`),
        fetch(`/api/loads/${id}/bids`),
      ]);
      const loadData = await loadRes.json();
      const bidsData = await bidsRes.json();
      setLoad(loadData.load);
      setBids(bidsData.bids || []);
      setLoading(false);

      // Fetch trip and dispute info
      const { data: tripData } = await supabase
        .from("trips")
        .select("id, status, trip_number, carrier_id, agreed_amount, platform_fee, total_amount")
        .eq("load_id", id)
        .single();
      if (tripData) {
        setTrip(tripData);
        const disputeRes = await fetch(`/api/disputes?trip_id=${tripData.id}`);
        const disputeData = await disputeRes.json();
        if (disputeData.disputes?.length > 0) {
          setDispute(disputeData.disputes[0]);
        }
      }
    }
    fetchData();
  }, [id]);

  async function handleBidAction(bidId: string, status: "accepted" | "rejected") {
    setActionLoading(bidId);
    try {
      const res = await fetch(`/api/loads/${id}/bids/${bidId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(`Error: ${data.error || "Failed to update bid"}`);
        return;
      }
      // Refresh data
      const [loadRes, bidsRes] = await Promise.all([
        fetch(`/api/loads/${id}`),
        fetch(`/api/loads/${id}/bids`),
      ]);
      setLoad((await loadRes.json()).load);
      setBids((await bidsRes.json()).bids || []);
    } catch (err) {
      alert("Network error. Please try again.");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleConfirmDelivery() {
    setActionLoading("confirm");
    try {
      if (!trip) return;

      await fetch(`/api/trips/${trip.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "confirmed" }),
      });

      // Auto-resolve any open dispute on this trip (redelivery accepted)
      if (dispute && dispute.status !== "resolved") {
        await fetch(`/api/disputes/${dispute.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "resolve", resolution_note: "Redelivery accepted — delivery confirmed" }),
        });
        setDispute((prev: any) => prev ? { ...prev, status: "resolved" } : null);
      }

      setTrip((prev: any) => prev ? { ...prev, status: "confirmed" } : null);

      // Refresh
      const loadRes = await fetch(`/api/loads/${id}`);
      setLoad((await loadRes.json()).load);
    } finally {
      setActionLoading(null);
    }
  }

  async function handleCancelLoad() {
    setActionLoading("cancel");
    try {
      const res = await fetch(`/api/loads/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "cancelled" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to cancel load");
      setLoad(data.load);
      setBids((prev) => prev.map((b) => b.status === "pending" ? { ...b, status: "rejected" } : b));
      setCancelConfirm(false);
      toast("Load cancelled", "success");
    } catch (err: any) {
      toast(err.message || "Failed to cancel load", "error");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleUploadEvidence(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/disputes/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setEvidenceUrls((prev) => [...prev, data.url]);
    } catch (err: any) {
      toast(err.message || "Upload failed", "error");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  async function handleFileDispute() {
    if (!disputeType || !disputeDesc.trim()) {
      toast("Please select an issue type and describe the problem", "warning");
      return;
    }
    setActionLoading("dispute");
    try {
      const { data: trip } = await supabase
        .from("trips")
        .select("id")
        .eq("load_id", id)
        .single();
      if (!trip) throw new Error("Trip not found");

      const res = await fetch("/api/disputes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          trip_id: trip.id,
          type: disputeType,
          description: disputeDesc,
          evidence_urls: evidenceUrls,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setDispute(data.dispute);
      setShowDisputeForm(false);
      toast("Dispute filed. The carrier has been notified.", "success");
      // Refresh load
      const loadRes = await fetch(`/api/loads/${id}`);
      setLoad((await loadRes.json()).load);
    } catch (err: any) {
      toast(err.message || "Failed to file dispute", "error");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleResolveDispute() {
    if (!dispute) return;
    setActionLoading("resolve");
    try {
      const res = await fetch(`/api/disputes/${dispute.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "resolve" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setDispute(data.dispute);
      toast("Dispute resolved. Delivery confirmed.", "success");
      const loadRes = await fetch(`/api/loads/${id}`);
      setLoad((await loadRes.json()).load);
    } catch (err: any) {
      toast(err.message || "Failed to resolve dispute", "error");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleEscalateDispute() {
    if (!dispute) return;
    setActionLoading("escalate");
    try {
      const res = await fetch(`/api/disputes/${dispute.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "escalate" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setDispute(data.dispute);
      toast("Dispute escalated for review", "info");
    } catch (err: any) {
      toast(err.message || "Failed to escalate dispute", "error");
    } finally {
      setActionLoading(null);
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

  // Build duplicate URL with all load fields as search params
  const duplicateParams = new URLSearchParams({
    duplicate: "1",
    origin_address: load.origin_address || "",
    origin_landmark: load.origin_landmark || "",
    origin_city: load.origin_city || "",
    origin_state: load.origin_state || "",
    dest_address: load.destination_address || "",
    dest_landmark: load.destination_landmark || "",
    dest_city: load.destination_city || "",
    dest_state: load.destination_state || "",
    cargo_type: load.cargo_type || "general",
    cargo_description: load.cargo_description || "",
    weight_kg: load.weight_kg ? String(load.weight_kg) : "",
    quantity: load.quantity ? String(load.quantity) : "1",
    special_instructions: load.special_instructions || "",
    budget_amount: load.budget_amount ? String(load.budget_amount / 100) : "",
    is_negotiable: String(load.is_negotiable ?? true),
  });

  return (
    <div>
      <Topbar title={load.load_number} />

      <div className="p-6 space-y-4 max-w-3xl">
        {/* Status + Route */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Badge className={statusInfo.color}>{statusInfo.label}</Badge>
              <span className="text-xs text-gray-500 dark:text-gray-400">{timeAgo(load.created_at)}</span>
            </div>
            <div className="flex items-center gap-2">
              {(load.status === "posted" || load.status === "bidding") && (
                <Link href={`/shipper/carriers?load_id=${id}`}>
                  <Button size="sm" variant="outline">
                    <Users className="h-3.5 w-3.5 mr-1" /> Invite Carriers
                  </Button>
                </Link>
              )}
              <Link href={`/shipper/post-load?${duplicateParams}`}>
                <Button size="sm" variant="outline">
                  <Copy className="h-3.5 w-3.5 mr-1" /> Post Again
                </Button>
              </Link>
            </div>
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
                {load.origin_landmark && <p className="text-xs text-gray-400">Near: {load.origin_landmark}</p>}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{load.destination_address}</p>
                <p className="text-xs text-gray-500">{load.destination_city}, {load.destination_state}</p>
                {load.destination_landmark && <p className="text-xs text-gray-400">Near: {load.destination_landmark}</p>}
              </div>
            </div>
          </div>
        </Card>

        {/* Cargo Details */}
        <Card>
          <CardTitle className="mb-3">Cargo Details</CardTitle>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-gray-500 dark:text-gray-400">Type</p>
              <p className="font-medium text-gray-900 dark:text-white">{cargoLabel}</p>
            </div>
            {load.weight_kg && (
              <div>
                <p className="text-gray-500 dark:text-gray-400">Weight</p>
                <p className="font-medium text-gray-900 dark:text-white">{formatWeight(load.weight_kg)}</p>
              </div>
            )}
            <div>
              <p className="text-gray-500 dark:text-gray-400">Quantity</p>
              <p className="font-medium text-gray-900 dark:text-white">{load.quantity}</p>
            </div>
            {load.budget_amount && (
              <div>
                <p className="text-gray-500 dark:text-gray-400">Budget</p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {formatNaira(load.budget_amount)} {load.is_negotiable && "(negotiable)"}
                </p>
              </div>
            )}
            {load.pickup_date && (
              <div>
                <p className="text-gray-500 dark:text-gray-400">Pickup Date</p>
                <div className="flex items-center gap-2">
                  <p className="font-medium text-gray-900 dark:text-white">{formatDateShort(load.pickup_date)}</p>
                  {getPickupUrgency(load.pickup_date) && (
                    <Badge className={`${getPickupUrgency(load.pickup_date)!.color} text-[10px] px-1.5 py-0`}>
                      {getPickupUrgency(load.pickup_date)!.label}
                    </Badge>
                  )}
                </div>
              </div>
            )}
            {load.delivery_date && (
              <div>
                <p className="text-gray-500 dark:text-gray-400">Delivery Date</p>
                <p className="font-medium text-gray-900 dark:text-white">{formatDateShort(load.delivery_date)}</p>
              </div>
            )}
          </div>
          {load.cargo_description && (
            <p className="mt-3 text-sm text-gray-600 dark:text-gray-300">{load.cargo_description}</p>
          )}
          {load.special_instructions && (
            <p className="mt-2 text-sm text-orange-600 dark:text-orange-400">
              Note: {load.special_instructions}
            </p>
          )}
        </Card>

        {/* Trip progress (visible when a trip exists and not yet confirmed/completed) */}
        {trip && !["confirmed", "completed"].includes(load.status) && (
          <Card className="border-blue-200 dark:border-blue-500/20 bg-blue-50 dark:bg-blue-500/5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Truck className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                <p className="font-medium text-gray-900 dark:text-white text-sm">Trip Progress</p>
              </div>
              <Badge className={TRIP_STATUS_LABELS[trip.status]?.color || "bg-gray-100 text-gray-800"}>
                {TRIP_STATUS_LABELS[trip.status]?.label || trip.status}
              </Badge>
            </div>
          </Card>
        )}

        {/* Chat — only when a trip exists */}
        {trip && <TripChat tripId={trip.id} />}

        {/* Payment Summary — visible when trip exists */}
        {trip && trip.agreed_amount > 0 && (
          <Card>
            <CardTitle className="mb-3">Payment Summary</CardTitle>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Carrier fee</span>
                <span className="text-gray-900 dark:text-white">{formatNaira(trip.agreed_amount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Platform fee (7%)</span>
                <span className="text-gray-900 dark:text-white">{formatNaira(trip.platform_fee)}</span>
              </div>
              <div className="border-t border-gray-200 dark:border-white/10 pt-2 flex justify-between font-semibold">
                <span className="text-gray-900 dark:text-white">Total</span>
                <span className="text-gray-900 dark:text-white">{formatNaira(trip.total_amount)}</span>
              </div>
            </div>
          </Card>
        )}

        {/* Review — after trip is confirmed */}
        {trip && (load.status === "completed" || trip.status === "confirmed") && trip.carrier_id && (
          <TripReview tripId={trip.id} revieweeId={trip.carrier_id} revieweeLabel="carrier" />
        )}

        {/* Delivery confirmation + dispute */}
        {load.status === "delivered" && !showDisputeForm && (
          <Card className="border-emerald-200 dark:border-emerald-500/20 bg-emerald-50 dark:bg-emerald-500/5">
            <div className="flex items-center gap-3">
              <Truck className="h-8 w-8 text-emerald-600 shrink-0" />
              <div className="flex-1">
                <p className="font-medium text-emerald-800 dark:text-emerald-400">
                  Carrier reports delivery complete
                </p>
                <p className="text-sm text-emerald-600 dark:text-emerald-500">
                  Please confirm you received your goods in good condition.
                </p>
              </div>
            </div>
            {!confirmDelivery ? (
              <div className="flex gap-2 mt-3">
                <Button
                  onClick={() => setConfirmDelivery(true)}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                >
                  <CheckCircle className="h-4 w-4 mr-1" /> Confirm Delivery
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowDisputeForm(true)}
                  className="flex-1 border-red-300 dark:border-red-500/30 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10"
                >
                  <AlertTriangle className="h-4 w-4 mr-1" /> Report Issue
                </Button>
              </div>
            ) : (
              <div className="mt-3 rounded-lg bg-yellow-50 dark:bg-yellow-500/10 border border-yellow-200 dark:border-yellow-500/20 p-3">
                <div className="flex items-start gap-2 mb-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-yellow-800 dark:text-yellow-300">
                      Are you sure?
                    </p>
                    <p className="text-xs text-yellow-700 dark:text-yellow-400 mt-0.5">
                      This confirms the delivery was completed successfully. Payment will be released to the carrier. This cannot be undone.
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={handleConfirmDelivery}
                    loading={actionLoading === "confirm"}
                    className="bg-emerald-600 hover:bg-emerald-700"
                  >
                    <CheckCircle className="h-3.5 w-3.5 mr-1" /> Yes, confirm delivery
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setConfirmDelivery(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </Card>
        )}

        {/* Dispute form */}
        {showDisputeForm && !dispute && (
          <Card className="border-red-200 dark:border-red-500/20 bg-red-50/50 dark:bg-red-500/5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                <h3 className="font-medium text-gray-900 dark:text-white">Report an Issue</h3>
              </div>
              <button
                onClick={() => setShowDisputeForm(false)}
                className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10"
              >
                <X className="h-4 w-4 text-gray-400" />
              </button>
            </div>

            <div className="space-y-3">
              <Select
                label="What went wrong?"
                value={disputeType}
                onChange={(e) => setDisputeType(e.target.value)}
                options={DISPUTE_TYPES.map((d) => ({ value: d.value, label: d.label }))}
                placeholder="Select issue type"
              />

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Describe the issue
                </label>
                <textarea
                  value={disputeDesc}
                  onChange={(e) => setDisputeDesc(e.target.value)}
                  placeholder="Please describe what happened in detail..."
                  rows={3}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3.5 py-2.5 text-sm text-gray-900 dark:text-white bg-white dark:bg-white/5 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-shadow resize-none"
                />
              </div>

              {/* Evidence upload */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Evidence photos (optional)
                </label>
                <div className="flex flex-wrap gap-2">
                  {evidenceUrls.map((url, i) => (
                    <div key={i} className="relative h-16 w-16 rounded-lg overflow-hidden border border-gray-200 dark:border-white/10">
                      <img src={url} alt={`Evidence ${i + 1}`} className="h-full w-full object-cover" />
                      <button
                        onClick={() => setEvidenceUrls((prev) => prev.filter((_, j) => j !== i))}
                        className="absolute top-0.5 right-0.5 rounded-full bg-black/50 p-0.5"
                      >
                        <X className="h-3 w-3 text-white" />
                      </button>
                    </div>
                  ))}
                  {evidenceUrls.length < 5 && (
                    <label className="flex h-16 w-16 cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-orange-400 dark:hover:border-orange-500 transition-colors">
                      {uploading ? (
                        <div className="h-4 w-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Upload className="h-4 w-4 text-gray-400" />
                      )}
                      <input type="file" accept="image/*" className="hidden" onChange={handleUploadEvidence} disabled={uploading} />
                    </label>
                  )}
                </div>
                <p className="text-[11px] text-gray-400">Up to 5 photos, max 5MB each</p>
              </div>

              <div className="flex gap-2 pt-1">
                <Button
                  variant="danger"
                  onClick={handleFileDispute}
                  loading={actionLoading === "dispute"}
                  className="flex-1"
                >
                  <AlertTriangle className="h-4 w-4 mr-1" /> File Dispute
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowDisputeForm(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Active dispute status */}
        {dispute && (
          <Card className="border-red-200 dark:border-red-500/20 bg-red-50/50 dark:bg-red-500/5">
            <div className="flex items-start gap-3 mb-3">
              <ShieldAlert className="h-6 w-6 text-red-500 shrink-0 mt-0.5" />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-medium text-gray-900 dark:text-white">Dispute Filed</h3>
                  <Badge className={DISPUTE_STATUS_LABELS[dispute.status]?.color || "bg-gray-100 text-gray-800"}>
                    {DISPUTE_STATUS_LABELS[dispute.status]?.label || dispute.status}
                  </Badge>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {DISPUTE_TYPES.find((d) => d.value === dispute.type)?.label || dispute.type}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{dispute.description}</p>
                {dispute.evidence_urls?.length > 0 && (
                  <div className="flex gap-2 mt-2">
                    {dispute.evidence_urls.map((url: string, i: number) => (
                      <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="h-12 w-12 rounded-lg overflow-hidden border border-gray-200 dark:border-white/10 block">
                        <img src={url} alt={`Evidence ${i + 1}`} className="h-full w-full object-cover" />
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Carrier response */}
            {dispute.carrier_response && (
              <div className="mt-3 rounded-lg bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <MessageSquare className="h-3.5 w-3.5 text-gray-400" />
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Carrier Response</p>
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-300">{dispute.carrier_response}</p>
              </div>
            )}

            {/* Actions */}
            {dispute.status !== "resolved" && dispute.status !== "escalated" && (
              <div className="flex gap-2 mt-3">
                {dispute.carrier_response && (
                  <Button
                    size="sm"
                    onClick={handleResolveDispute}
                    loading={actionLoading === "resolve"}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                  >
                    <ShieldCheck className="h-4 w-4 mr-1" /> Accept & Resolve
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleEscalateDispute}
                  loading={actionLoading === "escalate"}
                  className="flex-1"
                >
                  <ShieldAlert className="h-4 w-4 mr-1" /> Escalate
                </Button>
              </div>
            )}

            {/* Confirm delivery despite dispute (e.g., filed by mistake) */}
            {dispute.status !== "resolved" && dispute.status !== "escalated" && (load.status === "disputed" || load.status === "delivered") && (
              <div className="mt-3 pt-3 border-t border-red-200 dark:border-red-500/20">
                {!confirmDisputedDelivery ? (
                  <button
                    onClick={() => setConfirmDisputedDelivery(true)}
                    className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                  >
                    <CheckCircle className="h-3.5 w-3.5" />
                    Actually, confirm delivery instead
                  </button>
                ) : (
                  <div className="rounded-lg bg-yellow-50 dark:bg-yellow-500/10 border border-yellow-200 dark:border-yellow-500/20 p-3">
                    <div className="flex items-start gap-2 mb-2">
                      <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-yellow-800 dark:text-yellow-300">
                          Are you sure?
                        </p>
                        <p className="text-xs text-yellow-700 dark:text-yellow-400 mt-0.5">
                          This will resolve the open dispute and confirm delivery. Payment will be released to the carrier. This action cannot be undone.
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={handleConfirmDelivery}
                        loading={actionLoading === "confirm"}
                        className="bg-emerald-600 hover:bg-emerald-700"
                      >
                        <CheckCircle className="h-3.5 w-3.5 mr-1" /> Yes, confirm delivery
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setConfirmDisputedDelivery(false)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {dispute.status === "resolved" && (
              <div className="mt-3 flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400">
                <ShieldCheck className="h-4 w-4" />
                Dispute resolved — delivery confirmed
              </div>
            )}
          </Card>
        )}

        {/* Bids */}
        <Card>
          <CardTitle className="mb-3">
            Bids ({bids.length})
          </CardTitle>

          {bids.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400 py-4 text-center">
              No bids yet. Carriers will start bidding soon.
            </p>
          ) : (
            <div className="space-y-3">
              {bids.map((bid, i) => {
                const bidStatus = BID_STATUS_LABELS[bid.status] || { label: bid.status, color: "bg-gray-100 text-gray-800" };
                const carrier = bid.profiles;
                return (
                  <motion.div
                    key={bid.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="rounded-xl border border-gray-200 dark:border-white/10 p-4"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <button
                          type="button"
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); setPreviewUserId(bid.carrier_id); }}
                          className="flex items-center gap-1.5 text-sm font-medium text-gray-900 dark:text-white hover:text-orange-600 dark:hover:text-orange-400 transition-colors text-left"
                        >
                          <div className="relative shrink-0">
                            <UserCircle className="h-4 w-4 text-gray-400" />
                            {carrier?.availability_status && carrier.availability_status !== "hidden" && (
                              <span
                                className={`absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full border border-white dark:border-[#1a1a1a] ${
                                  AVAILABILITY_STATUS_LABELS[carrier.availability_status]?.dotColor || "bg-gray-400"
                                }`}
                              />
                            )}
                          </div>
                          {carrier?.company_name || carrier?.full_name || "Unknown Carrier"}
                        </button>
                        <div className="flex items-center gap-2 mt-0.5">
                          {carrier?.avg_rating > 0 && (
                            <span className="flex items-center gap-0.5 text-xs text-yellow-600">
                              <Star className="h-3 w-3 fill-current" />
                              {carrier.avg_rating.toFixed(1)}
                            </span>
                          )}
                          {bid.estimated_hours && (
                            <span className="flex items-center gap-0.5 text-xs text-gray-500">
                              <Clock className="h-3 w-3" />
                              {formatDuration(bid.estimated_hours)}
                            </span>
                          )}
                        </div>
                        {bid.message && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{bid.message}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-gray-900 dark:text-white">{formatNaira(bid.amount)}</p>
                        <Badge className={bidStatus.color}>{bidStatus.label}</Badge>
                      </div>
                    </div>

                    {bid.status === "pending" && load.status !== "accepted" && load.status !== "completed" && (
                      confirmAcceptBid === bid.id ? (
                        <div className="mt-3 rounded-lg bg-yellow-50 dark:bg-yellow-500/10 border border-yellow-200 dark:border-yellow-500/20 p-3">
                          <div className="flex items-start gap-2 mb-2">
                            <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400 shrink-0 mt-0.5" />
                            <div className="flex-1">
                              <p className="text-sm font-medium text-yellow-800 dark:text-yellow-300">
                                Accept this bid?
                              </p>
                              <div className="mt-1.5 space-y-1 text-xs text-yellow-700 dark:text-yellow-400">
                                <div className="flex justify-between">
                                  <span>Carrier fee</span>
                                  <span className="font-medium">{formatNaira(bid.amount)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Platform fee (7%)</span>
                                  <span className="font-medium">{formatNaira(Math.round(bid.amount * PLATFORM_FEE_RATE))}</span>
                                </div>
                                <div className="flex justify-between border-t border-yellow-300 dark:border-yellow-500/30 pt-1 font-semibold">
                                  <span>You pay</span>
                                  <span>{formatNaira(bid.amount + Math.round(bid.amount * PLATFORM_FEE_RATE))}</span>
                                </div>
                              </div>
                              <p className="text-xs text-yellow-600 dark:text-yellow-500 mt-1.5">
                                A trip will be created and all other pending bids will be rejected.
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => { setConfirmAcceptBid(null); handleBidAction(bid.id, "accepted"); }}
                              loading={actionLoading === bid.id}
                            >
                              Yes, accept bid
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setConfirmAcceptBid(null)}
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex gap-2 mt-3">
                          <Button
                            size="sm"
                            onClick={() => setConfirmAcceptBid(bid.id)}
                            className="flex-1"
                          >
                            Accept Bid
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleBidAction(bid.id, "rejected")}
                            loading={actionLoading === bid.id}
                            className="flex-1"
                          >
                            Reject
                          </Button>
                        </div>
                      )
                    )}
                  </motion.div>
                );
              })}
            </div>
          )}
        </Card>

        {/* Cancel Load */}
        {!["cancelled", "completed", "in_transit", "delivered"].includes(load.status) && (
          <Card className="border-red-100 dark:border-red-500/10">
            {!cancelConfirm ? (
              <button
                onClick={() => setCancelConfirm(true)}
                className="flex items-center gap-2 text-sm text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 transition-colors"
              >
                <XCircle className="h-4 w-4" />
                Cancel this load
              </button>
            ) : (
              <div>
                <p className="text-sm text-gray-900 dark:text-white font-medium mb-1">
                  Are you sure you want to cancel this load?
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                  {bids.filter((b) => b.status === "pending").length > 0
                    ? `${bids.filter((b) => b.status === "pending").length} pending bid(s) will be rejected and carriers will be notified.`
                    : "This action cannot be undone."}
                </p>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={handleCancelLoad}
                    loading={actionLoading === "cancel"}
                  >
                    Yes, cancel load
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setCancelConfirm(false)}
                  >
                    Keep it
                  </Button>
                </div>
              </div>
            )}
          </Card>
        )}
      </div>

      <ProfilePreview userId={previewUserId} onClose={() => setPreviewUserId(null)} />
    </div>
  );
}
