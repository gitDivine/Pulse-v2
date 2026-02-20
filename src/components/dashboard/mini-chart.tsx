"use client";

import { motion } from "framer-motion";

// Animated bar chart for dashboard stats
export function MiniBarChart({
  data,
  color = "#f97316",
  height = 48,
}: {
  data: number[];
  color?: string;
  height?: number;
}) {
  const max = Math.max(...data, 1);

  return (
    <div className="flex items-end gap-1" style={{ height }}>
      {data.map((value, i) => (
        <motion.div
          key={i}
          className="flex-1 rounded-sm"
          style={{ backgroundColor: color, opacity: 0.2 + (value / max) * 0.8 }}
          initial={{ height: 0 }}
          animate={{ height: `${Math.max((value / max) * 100, 4)}%` }}
          transition={{
            type: "spring",
            stiffness: 300,
            damping: 25,
            delay: i * 0.05,
          }}
        />
      ))}
    </div>
  );
}

// Animated ring/donut chart
export function MiniRingChart({
  value,
  max,
  size = 40,
  strokeWidth = 4,
  color = "#f97316",
}: {
  value: number;
  max: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = max > 0 ? value / max : 0;

  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        className="text-gray-100 dark:text-gray-800"
      />
      <motion.circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        initial={{ strokeDashoffset: circumference }}
        animate={{ strokeDashoffset: circumference * (1 - progress) }}
        transition={{ type: "spring", stiffness: 100, damping: 20, delay: 0.3 }}
      />
    </svg>
  );
}

// Sparkline
export function Sparkline({
  data,
  color = "#f97316",
  height = 32,
  width = 100,
}: {
  data: number[];
  color?: string;
  height?: number;
  width?: number;
}) {
  if (data.length < 2) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;

  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / range) * (height - 4) - 2;
    return `${x},${y}`;
  });

  const pathD = `M ${points.join(" L ")}`;

  return (
    <svg width={width} height={height} className="overflow-visible">
      <motion.path
        d={pathD}
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
      />
    </svg>
  );
}
