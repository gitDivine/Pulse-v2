"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { Topbar } from "@/components/dashboard/topbar";
import { Card, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatNaira, timeAgo } from "@/lib/utils/format";
import { TRIP_STATUS_LABELS, CARGO_TYPES, DISPUTE_TYPES, DISPUTE_STATUS_LABELS } from "@/lib/constants";
import { useToast } from "@/components/ui/toast";
import { MapPin, Truck, CheckCircle, ArrowRight, Clock, ShieldAlert, MessageSquare, Send, UserCircle, Star, Phone } from "lucide-react";
import { ProfilePreview } from "@/components/dashboard/profile-preview";

const TRIP_FLOW = ["pending", "pickup", "in_transit", "delivered", "confirmed"];

export default function TripDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [trip, setTrip] = useState<any>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [dispute, setDispute] = useState<any>(null);
  const [responseText, setResponseText] = useState("");
  const [respondLoading, setRespondLoading] = useState(false);
  const [previewUserId, setPreviewUserId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    async function fetchData() {
      const [tripRes, eventsRes] = await Promise.all([
        fetch(`/api/trips/${id}`),
        fetch(`/api/trips/${id}/tracking`),
      ]);
      const tripData = await tripRes.json();
      const eventsData = await eventsRes.json();
      setTrip(tripData.trip);
      setEvents(eventsData.events || []);
      setLoading(false);

      // Check for dispute
      const disputeRes = await fetch(`/api/disputes?trip_id=${id}`);
      const disputeData = await disputeRes.json();
      if (disputeData.disputes?.length > 0) {
        setDispute(disputeData.disputes[0]);
      }
    }
    fetchData();
  }, [id]);

  const statusConfirmMessages: Record<string, string> = {
    pickup: "Confirm you're at the pickup location?",
    in_transit: "Confirm cargo is loaded and you're starting transit?",
    delivered: "Confirm this load has been delivered? This cannot be undone.",
  };

  async function updateStatus(newStatus: string) {
    const message = statusConfirmMessages[newStatus];
    if (message && !window.confirm(message)) return;

    setActionLoading(true);
    try {
      const res = await fetch(`/api/trips/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        const data = await res.json();
        setTrip((prev: any) => ({ ...prev, ...data.trip, loads: data.trip.loads || prev?.loads }));
        // Refresh events
        const eventsRes = await fetch(`/api/trips/${id}/tracking`);
        setEvents((await eventsRes.json()).events || []);
      }
    } finally {
      setActionLoading(false);
    }
  }

  async function handleRespondToDispute() {
    if (!dispute || !responseText.trim()) {
      toast("Please write a response", "warning");
      return;
    }
    setRespondLoading(true);
    try {
      const res = await fetch(`/api/disputes/${dispute.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ carrier_response: responseText }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setDispute(data.dispute);
      setResponseText("");
      toast("Response sent to shipper", "success");
    } catch (err: any) {
      toast(err.message || "Failed to respond", "error");
    } finally {
      setRespondLoading(false);
    }
  }

  if (loading) {
    return (
      <div>
        <Topbar title="Trip Detail" />
        <div className="p-6 space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!trip) {
    return (
      <div>
        <Topbar title="Trip Detail" />
        <div className="p-6 text-center py-12">
          <p className="text-gray-500">Trip not found</p>
        </div>
      </div>
    );
  }

  const statusInfo = TRIP_STATUS_LABELS[trip.status] || { label: trip.status, color: "bg-gray-100 text-gray-800" };
  const load = trip.loads;
  const currentStepIndex = TRIP_FLOW.indexOf(trip.status);
  const nextStatus = currentStepIndex < TRIP_FLOW.length - 2 ? TRIP_FLOW[currentStepIndex + 1] : null;
  const cargoLabel = load ? (CARGO_TYPES.find((c) => c.value === load.cargo_type)?.label || load.cargo_type) : "";

  const nextActionLabels: Record<string, string> = {
    pickup: "I'm at pickup location",
    in_transit: "Cargo loaded, start transit",
    delivered: "Mark as delivered",
  };

  return (
    <div>
      <Topbar title={trip.trip_number} />

      <div className="p-6 space-y-4 max-w-3xl">
        {/* Status + Amount */}
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <Badge className={statusInfo.color}>{statusInfo.label}</Badge>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                {formatNaira(trip.agreed_amount)}
              </p>
            </div>
            {nextStatus && trip.status !== "confirmed" && trip.status !== "delivered" && (
              <Button
                onClick={() => updateStatus(nextStatus)}
                loading={actionLoading}
              >
                {nextActionLabels[nextStatus] || `Update to ${nextStatus}`}
              </Button>
            )}
          </div>
        </Card>

        {/* Progress */}
        <Card>
          <CardTitle className="mb-4">Trip Progress</CardTitle>
          <div className="flex items-center gap-1">
            {TRIP_FLOW.map((step, i) => {
              const isCompleted = i <= currentStepIndex;
              const isCurrent = i === currentStepIndex;
              const label = TRIP_STATUS_LABELS[step]?.label || step;
              return (
                <div key={step} className="flex items-center gap-1 flex-1">
                  <motion.div
                    animate={{
                      backgroundColor: isCompleted ? "rgb(249 115 22)" : "rgb(229 231 235)",
                      scale: isCurrent ? 1.2 : 1,
                    }}
                    className="h-3 w-3 rounded-full shrink-0"
                  />
                  <span className={`text-[10px] font-medium hidden sm:block ${isCompleted ? "text-orange-600 dark:text-orange-400" : "text-gray-400"}`}>
                    {label}
                  </span>
                  {i < TRIP_FLOW.length - 1 && (
                    <div className={`flex-1 h-0.5 rounded-full ${i < currentStepIndex ? "bg-orange-500" : "bg-gray-200 dark:bg-gray-700"}`} />
                  )}
                </div>
              );
            })}
          </div>
        </Card>

        {/* Route */}
        {load && (
          <Card>
            <CardTitle className="mb-3">Route</CardTitle>
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
            <div className="mt-3 flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
              <span>{cargoLabel}</span>
              {load.weight_kg && <span>{load.weight_kg}kg</span>}
            </div>
          </Card>
        )}

        {/* Shipper Info */}
        {load?.profiles && (
          <Card>
            <CardTitle className="mb-3">Shipper</CardTitle>
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => setPreviewUserId(load.shipper_id)}
                  className="flex items-center gap-1.5 font-medium text-gray-900 dark:text-white hover:text-orange-600 dark:hover:text-orange-400 transition-colors"
                >
                  <UserCircle className="h-4 w-4 text-gray-400" />
                  {load.profiles.company_name || load.profiles.full_name}
                </button>
                {load.profiles.avg_rating > 0 && (
                  <div className="flex items-center gap-1 text-yellow-600">
                    <Star className="h-3.5 w-3.5 fill-current" />
                    <span className="text-sm">{load.profiles.avg_rating.toFixed(1)}</span>
                  </div>
                )}
              </div>
              {load.profiles.phone && (
                <a
                  href={`tel:${load.profiles.phone}`}
                  className="flex items-center gap-1.5 text-sm text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 transition-colors"
                >
                  <Phone className="h-4 w-4" />
                  Call
                </a>
              )}
            </div>
          </Card>
        )}

        {/* Dispute */}
        {dispute && (
          <Card className="border-red-200 dark:border-red-500/20 bg-red-50/50 dark:bg-red-500/5">
            <div className="flex items-start gap-3">
              <ShieldAlert className="h-6 w-6 text-red-500 shrink-0 mt-0.5" />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-medium text-gray-900 dark:text-white">Dispute</h3>
                  <Badge className={DISPUTE_STATUS_LABELS[dispute.status]?.color || "bg-gray-100 text-gray-800"}>
                    {DISPUTE_STATUS_LABELS[dispute.status]?.label || dispute.status}
                  </Badge>
                </div>
                <p className="text-sm font-medium text-red-700 dark:text-red-400">
                  {DISPUTE_TYPES.find((d) => d.value === dispute.type)?.label || dispute.type}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{dispute.description}</p>
                {dispute.evidence_urls?.length > 0 && (
                  <div className="flex gap-2 mt-2">
                    {dispute.evidence_urls.map((url: string, i: number) => (
                      <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="h-12 w-12 rounded-lg overflow-hidden border border-gray-200 dark:border-white/10 block">
                        <img src={url} alt={`Evidence ${i + 1}`} className="h-full w-full object-cover" />
                      </a>
                    ))}
                  </div>
                )}

                {/* Carrier's own response */}
                {dispute.carrier_response && (
                  <div className="mt-3 rounded-lg bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 p-3">
                    <div className="flex items-center gap-1.5 mb-1">
                      <MessageSquare className="h-3.5 w-3.5 text-gray-400" />
                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Your Response</p>
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300">{dispute.carrier_response}</p>
                  </div>
                )}

                {/* Response form */}
                {dispute.status === "open" && !dispute.carrier_response && (
                  <div className="mt-3 space-y-2">
                    <textarea
                      value={responseText}
                      onChange={(e) => setResponseText(e.target.value)}
                      placeholder="Explain your side of the situation..."
                      rows={3}
                      className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3.5 py-2.5 text-sm text-gray-900 dark:text-white bg-white dark:bg-white/5 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-shadow resize-none"
                    />
                    <Button
                      size="sm"
                      onClick={handleRespondToDispute}
                      loading={respondLoading}
                    >
                      <Send className="h-3.5 w-3.5 mr-1" /> Send Response
                    </Button>
                  </div>
                )}

                {dispute.status === "resolved" && (
                  <div className="mt-3 flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400">
                    <CheckCircle className="h-4 w-4" />
                    Dispute resolved — delivery confirmed
                  </div>
                )}

                {dispute.status === "escalated" && (
                  <p className="mt-3 text-sm text-purple-600 dark:text-purple-400">
                    This dispute has been escalated for review.
                  </p>
                )}
              </div>
            </div>
          </Card>
        )}

        {/* Tracking Timeline */}
        {events.length > 0 && (
          <Card>
            <CardTitle className="mb-3">Tracking History</CardTitle>
            <div className="space-y-3">
              {events.map((event, i) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex gap-3"
                >
                  <div className="flex flex-col items-center">
                    <div className="h-2 w-2 rounded-full bg-orange-500 mt-1.5" />
                    {i < events.length - 1 && <div className="w-0.5 flex-1 bg-gray-200 dark:bg-gray-700 mt-1" />}
                  </div>
                  <div className="flex-1 pb-3">
                    <p className="text-sm text-gray-900 dark:text-white">{event.description}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{timeAgo(event.created_at)}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </Card>
        )}
      </div>

      <ProfilePreview userId={previewUserId} onClose={() => setPreviewUserId(null)} />
    </div>
  );
}
