"use client";

import { useState, useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import { GuidedTour } from "./guided-tour";

const TOUR_KEY_PREFIX = "pulse_tour_completed_";

interface TourGateProps {
  role: "shipper" | "carrier";
}

export function TourGate({ role }: TourGateProps) {
  const [showTour, setShowTour] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const key = TOUR_KEY_PREFIX + role;
    const completed = localStorage.getItem(key);
    if (!completed) {
      const timer = setTimeout(() => setShowTour(true), 600);
      return () => clearTimeout(timer);
    }
  }, [role]);

  function handleComplete() {
    localStorage.setItem(TOUR_KEY_PREFIX + role, "true");
    setShowTour(false);
  }

  if (!mounted) return null;

  return (
    <AnimatePresence>
      {showTour && <GuidedTour role={role} onComplete={handleComplete} />}
    </AnimatePresence>
  );
}

export function resetTourForRole(role: "shipper" | "carrier") {
  localStorage.removeItem(TOUR_KEY_PREFIX + role);
}
