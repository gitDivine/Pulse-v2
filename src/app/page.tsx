"use client";

import Link from "next/link";
import { motion, useMotionValue, useTransform } from "framer-motion";
import {
  MapPin,
  Truck,
  ShoppingBag,
  Package,
  ArrowRight,
  Zap,
  Shield,
  Globe,
  Sun,
  Moon,
  ChevronRight,
} from "lucide-react";
import {
  FadeIn,
  StaggerChildren,
  StaggerItem,
  AnimatedCounter,
  TiltCard,
} from "@/components/ui/motion";
import { useTheme } from "@/components/theme-provider";

const engines = [
  {
    icon: MapPin,
    name: "SCOUT",
    label: "Location Layer",
    description:
      "Crowdsourced address intelligence. Makes every location findable using landmarks, not postcodes.",
    color: "text-blue-500",
    bg: "bg-blue-500/10",
    border: "border-blue-500/20",
    glow: "group-hover:shadow-blue-500/10",
  },
  {
    icon: Truck,
    name: "HAUL",
    label: "Movement Layer",
    description:
      "The freight marketplace. Find carriers, build relationships, coordinate shipments with full transparency.",
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
    glow: "group-hover:shadow-emerald-500/10",
  },
  {
    icon: ShoppingBag,
    name: "FLOW",
    label: "Commerce Layer",
    description:
      "Your business operating system. Orders, inventory, payments, and customer communication in one place.",
    color: "text-orange-500",
    bg: "bg-orange-500/10",
    border: "border-orange-500/20",
    glow: "group-hover:shadow-orange-500/10",
    active: true,
  },
  {
    icon: Package,
    name: "CONVOY",
    label: "Shared Freight",
    description:
      "Share a truck with other businesses heading the same way. Pay a fraction of the full freight cost.",
    color: "text-purple-500",
    bg: "bg-purple-500/10",
    border: "border-purple-500/20",
    glow: "group-hover:shadow-purple-500/10",
  },
];

const valueProps = [
  {
    icon: Zap,
    title: "AI prepares. You decide.",
    description:
      "Every recommendation is staged for your approval. No money moves, no carrier dispatches without your say-so.",
  },
  {
    icon: Shield,
    title: "Built for trust",
    description:
      "Verified carriers, transparent pricing, dispute resolution, and buyer protection. Trust is the foundation.",
  },
  {
    icon: Globe,
    title: "$0 to start",
    description:
      "No setup fees, no monthly minimums. You only pay transaction fees when you sell. Start with nothing, grow with revenue.",
  },
];

const stats = [
  { value: 100, suffix: "+", label: "SMEs Ready" },
  { value: 0, suffix: "", label: "Setup Cost" },
  { value: 4, suffix: "", label: "Engines" },
  { value: 36, suffix: "", label: "Nigerian States" },
];

export default function Home() {
  const { theme, toggleTheme } = useTheme();
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  function handleMouseMove(e: React.MouseEvent) {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    mouseX.set((e.clientX - left) / width);
    mouseY.set((e.clientY - top) / height);
  }

  const gradientX = useTransform(mouseX, [0, 1], ["20%", "80%"]);
  const gradientY = useTransform(mouseY, [0, 1], ["20%", "80%"]);

  return (
    <div className="min-h-screen bg-white dark:bg-[#0a0a0a] transition-colors duration-300">
      {/* Nav */}
      <motion.nav
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="fixed top-0 inset-x-0 z-50 glass border-b border-gray-200/50 dark:border-white/5"
      >
        <div className="mx-auto max-w-6xl flex items-center justify-between px-6 py-3">
          <Link href="/" className="flex items-center gap-2">
            <motion.span
              className="text-2xl font-bold gradient-text"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              PULSE
            </motion.span>
          </Link>
          <div className="flex items-center gap-3">
            <motion.button
              onClick={toggleTheme}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="p-2 rounded-lg text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
            >
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </motion.button>
            <Link
              href="/login"
              className="text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              Log in
            </Link>
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <Link
                href="/signup"
                className="rounded-full bg-orange-600 px-5 py-2 text-sm font-medium text-white hover:bg-orange-700 transition-colors shadow-lg shadow-orange-600/20"
              >
                Get started free
              </Link>
            </motion.div>
          </div>
        </div>
      </motion.nav>

      {/* Hero */}
      <section
        className="relative pt-28 pb-20 lg:pt-40 lg:pb-32 overflow-hidden mesh-gradient"
        onMouseMove={handleMouseMove}
      >
        {/* Animated dot grid */}
        <div className="absolute inset-0 dot-grid opacity-60" />

        {/* Mouse-following gradient orb */}
        <motion.div
          className="absolute w-[600px] h-[600px] rounded-full opacity-30 blur-[120px] pointer-events-none"
          style={{
            background: "radial-gradient(circle, rgba(249,115,22,0.3), transparent 70%)",
            left: gradientX,
            top: gradientY,
            x: "-50%",
            y: "-50%",
          }}
        />

        <div className="relative mx-auto max-w-6xl px-6">
          <FadeIn>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 rounded-full border border-orange-200 dark:border-orange-500/20 bg-orange-50 dark:bg-orange-500/10 px-4 py-1.5 text-sm text-orange-700 dark:text-orange-400 mb-6"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500" />
              </span>
              Now live — FLOW Engine
            </motion.div>
          </FadeIn>

          <div className="max-w-3xl">
            <FadeIn delay={0.1}>
              <h1 className="text-5xl font-bold tracking-tight text-gray-900 dark:text-white lg:text-7xl lg:leading-[1.1]">
                Africa&apos;s Commerce{" "}
                <span className="gradient-text">Nervous System</span>
              </h1>
            </FadeIn>

            <FadeIn delay={0.2}>
              <p className="mt-6 text-lg text-gray-600 dark:text-gray-400 max-w-2xl leading-relaxed">
                One platform to manage your orders, inventory, payments, customer
                communication, and logistics. Built for how African businesses actually
                work.
              </p>
            </FadeIn>

            <FadeIn delay={0.3}>
              <div className="mt-8 flex flex-col sm:flex-row gap-4">
                <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                  <Link
                    href="/signup"
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-orange-600 px-7 py-3.5 text-base font-medium text-white hover:bg-orange-700 transition-colors shadow-xl shadow-orange-600/25"
                  >
                    Start selling for free
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </motion.div>
                <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                  <Link
                    href="#engines"
                    className="inline-flex items-center justify-center gap-2 rounded-full border border-gray-300 dark:border-white/10 px-7 py-3.5 text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                  >
                    See how it works
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                </motion.div>
              </div>
            </FadeIn>
          </div>

          {/* Stats bar */}
          <FadeIn delay={0.5}>
            <div className="mt-16 grid grid-cols-2 sm:grid-cols-4 gap-8 max-w-2xl">
              {stats.map((stat) => (
                <div key={stat.label}>
                  <AnimatedCounter
                    value={stat.value}
                    suffix={stat.suffix}
                    prefix={stat.label === "Setup Cost" ? "$" : ""}
                    className="text-3xl font-bold text-gray-900 dark:text-white"
                  />
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-500">{stat.label}</p>
                </div>
              ))}
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Four Engines */}
      <section id="engines" className="py-24 border-t border-gray-100 dark:border-white/5">
        <div className="mx-auto max-w-6xl px-6">
          <FadeIn>
            <p className="text-sm font-semibold text-orange-600 dark:text-orange-400 mb-3 tracking-wide uppercase">
              Four Engines, One System
            </p>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white lg:text-4xl">
              Everything connected.{" "}
              <span className="text-gray-400 dark:text-gray-600">Everything intelligent.</span>
            </h2>
          </FadeIn>

          <StaggerChildren className="mt-14 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4" staggerDelay={0.1}>
            {engines.map((engine) => {
              const Icon = engine.icon;
              return (
                <StaggerItem key={engine.name}>
                  <TiltCard>
                    <div
                      className={`group relative rounded-2xl border bg-white dark:bg-[#111] p-6 transition-all duration-300 hover:shadow-xl ${engine.border} ${engine.glow} ${
                        engine.active ? "ring-2 ring-orange-500/20" : ""
                      }`}
                    >
                      {engine.active && (
                        <span className="absolute -top-2.5 right-4 rounded-full bg-orange-600 px-2.5 py-0.5 text-[10px] font-bold text-white uppercase tracking-wider">
                          Live
                        </span>
                      )}
                      <div className={`inline-flex rounded-xl p-3 ${engine.bg}`}>
                        <Icon className={`h-5 w-5 ${engine.color}`} />
                      </div>
                      <h3 className="mt-4 text-lg font-bold text-gray-900 dark:text-white">
                        {engine.name}
                      </h3>
                      <p className={`text-sm font-medium ${engine.color}`}>{engine.label}</p>
                      <p className="mt-3 text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                        {engine.description}
                      </p>
                    </div>
                  </TiltCard>
                </StaggerItem>
              );
            })}
          </StaggerChildren>
        </div>
      </section>

      {/* Value props */}
      <section className="py-24 bg-gray-50 dark:bg-[#0a0a0a] border-t border-gray-100 dark:border-white/5">
        <div className="mx-auto max-w-6xl px-6">
          <StaggerChildren className="grid grid-cols-1 gap-12 sm:grid-cols-3" staggerDelay={0.15}>
            {valueProps.map((prop) => {
              const Icon = prop.icon;
              return (
                <StaggerItem key={prop.title}>
                  <div className="group">
                    <motion.div
                      whileHover={{ rotate: -10, scale: 1.1 }}
                      transition={{ type: "spring", stiffness: 400, damping: 15 }}
                      className="inline-flex rounded-xl bg-orange-500/10 p-3"
                    >
                      <Icon className="h-6 w-6 text-orange-500" />
                    </motion.div>
                    <h3 className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">
                      {prop.title}
                    </h3>
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                      {prop.description}
                    </p>
                  </div>
                </StaggerItem>
              );
            })}
          </StaggerChildren>
        </div>
      </section>

      {/* CTA */}
      <section className="relative py-24 overflow-hidden">
        {/* Gradient background */}
        <div className="absolute inset-0 bg-gray-900" />
        <div className="absolute inset-0 bg-gradient-to-br from-orange-600/10 via-transparent to-purple-600/10" />
        <div className="absolute inset-0 dot-grid opacity-20" />

        <div className="relative mx-auto max-w-6xl px-6 text-center">
          <FadeIn>
            <h2 className="text-4xl font-bold text-white lg:text-5xl">
              Ready to run your business{" "}
              <span className="gradient-text">properly?</span>
            </h2>
          </FadeIn>
          <FadeIn delay={0.15}>
            <p className="mt-6 text-gray-400 max-w-lg mx-auto text-lg">
              Join PULSE and get a complete commerce operating system — orders, inventory, payments, logistics — all in one place.
            </p>
          </FadeIn>
          <FadeIn delay={0.3}>
            <motion.div className="mt-10" whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 rounded-full bg-orange-600 px-8 py-4 text-base font-medium text-white hover:bg-orange-700 transition-colors shadow-2xl shadow-orange-600/30"
              >
                Get started for free
                <ArrowRight className="h-4 w-4" />
              </Link>
            </motion.div>
          </FadeIn>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 dark:border-white/5 py-8 bg-white dark:bg-[#0a0a0a]">
        <div className="mx-auto max-w-6xl px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-sm text-gray-400">
            &copy; {new Date().getFullYear()} PULSE. Built for African commerce.
          </span>
          <div className="flex gap-6 text-sm text-gray-400">
            {["SCOUT", "HAUL", "FLOW", "CONVOY"].map((name) => (
              <motion.span
                key={name}
                whileHover={{ color: "#f97316", y: -1 }}
                className="cursor-default"
              >
                {name}
              </motion.span>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
