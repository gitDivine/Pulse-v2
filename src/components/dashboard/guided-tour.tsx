"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { X, ArrowRight, ArrowLeft, SkipForward } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getTourSteps } from "@/lib/constants/tour-steps";

interface GuidedTourProps {
  role: "shipper" | "carrier";
  onComplete: () => void;
}

const spring = { type: "spring" as const, stiffness: 400, damping: 30 };
const gentle = { type: "spring" as const, stiffness: 200, damping: 25 };

export function GuidedTour({ role, onComplete }: GuidedTourProps) {
  const router = useRouter();
  const steps = getTourSteps(role);
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(1);

  const step = steps[current];
  const isFirst = current === 0;
  const isLast = current === steps.length - 1;
  const Icon = step.icon;

  const next = useCallback(() => {
    if (isLast) {
      onComplete();
      if (step.cta) router.push(step.cta.href);
      return;
    }
    setDirection(1);
    setCurrent((c) => c + 1);
  }, [isLast, step, onComplete, router]);

  const back = useCallback(() => {
    if (isFirst) return;
    setDirection(-1);
    setCurrent((c) => c - 1);
  }, [isFirst]);

  const variants = {
    enter: (dir: number) => ({ x: dir > 0 ? 80 : -80, opacity: 0, scale: 0.95 }),
    center: { x: 0, opacity: 1, scale: 1 },
    exit: (dir: number) => ({ x: dir > 0 ? -80 : 80, opacity: 0, scale: 0.95 }),
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center" role="dialog" aria-modal="true" aria-label="Platform tour">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onComplete}
      />

      {/* Card */}
      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 40, scale: 0.95 }}
        transition={spring}
        className="relative z-10 w-full max-w-md mx-4 mb-6 sm:mb-0 rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#111] shadow-2xl overflow-hidden"
      >
        {/* Close button */}
        {!isLast && (
          <button
            onClick={onComplete}
            className="absolute right-4 top-4 p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors z-10"
          >
            <X className="h-4 w-4" />
          </button>
        )}

        {/* Step content */}
        <div className="px-6 pt-8 pb-4">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={step.id}
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={gentle}
              className="flex flex-col items-center text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ ...spring, delay: 0.1 }}
                className="mb-4 rounded-2xl bg-orange-100 dark:bg-orange-500/15 p-4"
              >
                <Icon className="h-8 w-8 text-orange-600 dark:text-orange-400" />
              </motion.div>

              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {step.title}
              </h2>

              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 leading-relaxed max-w-xs">
                {step.description}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Progress dots */}
        <div className="flex justify-center gap-1.5 py-3">
          {steps.map((_, i) => (
            <motion.div
              key={i}
              layout
              className={`h-1.5 rounded-full transition-colors ${
                i === current
                  ? "bg-orange-500 w-6"
                  : i < current
                  ? "bg-orange-300 dark:bg-orange-500/40 w-1.5"
                  : "bg-gray-200 dark:bg-gray-700 w-1.5"
              }`}
              transition={spring}
            />
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 border-t border-gray-100 dark:border-white/5 px-6 py-4">
          {!isFirst ? (
            <Button variant="ghost" size="sm" onClick={back}>
              <ArrowLeft className="h-4 w-4 mr-1" /> Back
            </Button>
          ) : (
            <Button variant="ghost" size="sm" onClick={onComplete} className="text-gray-400">
              <SkipForward className="h-4 w-4 mr-1" /> Skip tour
            </Button>
          )}
          <div className="flex-1" />
          <Button size="sm" onClick={next}>
            {isLast ? (step.cta?.label || "Get started") : "Next"}
            {!isLast && <ArrowRight className="h-4 w-4 ml-1" />}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
