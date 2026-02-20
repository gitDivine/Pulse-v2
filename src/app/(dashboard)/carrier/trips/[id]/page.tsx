"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { Topbar } from "@/components/dashboard/topbar";
import { Card, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatNaira, timeAgo } from "@/lib/utils/format";
import { TRIP_STATUS_LABELS, CARGO_TYPES } from "@/lib/constants";
import { MapPin, Truck, CheckCircle, ArrowRight, Clock } from "lucide-react";

const TRIP_FLOW = ["pending", "pickup", "in_transit", "delivered", "confirmed"];

export default function TripDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [trip, setTrip] = useState<any>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

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
    }
    fetchData();
  }, [id]);

  async function updateStatus(newStatus: string) {
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
    </div>
  );
}
