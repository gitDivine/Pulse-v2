"use client";

import { useState, useEffect } from "react";
import { AVAILABILITY_STATUS_LABELS } from "@/lib/constants";
import { useToast } from "@/components/ui/toast";

const STATUSES = ["available", "busy", "offline"] as const;

export function AvailabilityToggle({ initialStatus }: { initialStatus: string }) {
  const { toast } = useToast();
  const [status, setStatus] = useState(initialStatus);
  const [updating, setUpdating] = useState(false);

  // Sync with server on mount (in case server-rendered value is stale)
  useEffect(() => {
    fetch("/api/carrier/availability")
      .then((r) => r.json())
      .then((data) => { if (data.status) setStatus(data.status); })
      .catch(() => {});
  }, []);

  async function handleChange(newStatus: string) {
    if (newStatus === status || updating) return;
    const prev = status;
    setStatus(newStatus);
    setUpdating(true);

    try {
      const res = await fetch("/api/carrier/availability", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatus(prev);
        toast(data.error || "Failed to update status", "error");
      }
    } catch {
      setStatus(prev);
      toast("Failed to update status", "error");
    } finally {
      setUpdating(false);
    }
  }

  return (
    <div className="flex items-center gap-1.5 rounded-full bg-gray-100 dark:bg-gray-800 p-1">
      {STATUSES.map((s) => {
        const info = AVAILABILITY_STATUS_LABELS[s];
        const active = status === s;
        return (
          <button
            key={s}
            onClick={() => handleChange(s)}
            disabled={updating}
            className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
              active
                ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
            }`}
          >
            <span className={`h-2 w-2 rounded-full ${info.dotColor}`} />
            {info.label}
          </button>
        );
      })}
    </div>
  );
}
