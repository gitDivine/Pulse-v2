"use client";

import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";
import {
  MapPin,
  Truck,
  Package,
  ArrowRight,
  Shield,
  Star,
  Zap,
  Search,
  CheckCircle,
  Sun,
  Moon,
} from "lucide-react";
import { useRef, useState, useEffect } from "react";
import { useTheme } from "@/components/theme-provider";
import { FadeIn, StaggerChildren, StaggerItem, AnimatedCounter } from "@/components/ui/motion";

const howItWorks = [
  {
    step: "01",
    title: "Post Your Load",
    description: "Describe what you're shipping, where it's going, and your budget. It takes less than 2 minutes.",
    icon: Package,
    color: "from-orange-500 to-red-500",
  },
  {
    step: "02",
    title: "Get Bids from Carriers",
    description: "Verified carriers compete for your load. Compare prices, ratings, and delivery times.",
    icon: Search,
    color: "from-blue-500 to-cyan-500",
  },
  {
    step: "03",
    title: "Track & Confirm Delivery",
    description: "Follow your shipment in real-time. Confirm delivery and release payment securely.",
    icon: CheckCircle,
    color: "from-emerald-500 to-green-500",
  },
];

const features = [
  {
    title: "For Shippers",
    items: [
      "Post loads in under 2 minutes",
      "Get competitive bids from carriers",
      "Real-time tracking & updates",
      "Secure escrow payments",
      "Rate and review carriers",
    ],
    cta: "Start Shipping",
    href: "/signup",
    icon: Package,
    gradient: "from-orange-500 to-red-500",
  },
  {
    title: "For Carriers",
    items: [
      "Browse available loads nearby",
      "Bid on loads that match your route",
      "Manage your fleet and earnings",
      "Build trust with ratings",
      "Get paid securely after delivery",
    ],
    cta: "Start Earning",
    href: "/signup",
    icon: Truck,
    gradient: "from-blue-500 to-cyan-500",
  },
];

const stats = [
  { label: "Nigerian States", value: 37, suffix: "+" },
  { label: "Cargo Types", value: 8, suffix: "" },
  { label: "Upfront Cost", value: 0, prefix: "₦", suffix: "" },
  { label: "Commission", value: 0, prefix: "", suffix: "%" },
];

export default function HomePage() {
  const { theme, toggleTheme } = useTheme();
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: containerRef });
  const heroY = useTransform(scrollYProgress, [0, 0.3], [0, -50]);

  return (
    <div ref={containerRef} className="min-h-screen bg-white dark:bg-[#0a0a0a] text-gray-900 dark:text-white overflow-hidden">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-white/80 dark:bg-[#0a0a0a]/80 border-b border-gray-200/50 dark:border-white/5">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold gradient-text">PULSE</span>
            <span className="rounded-full bg-orange-100 dark:bg-orange-500/10 px-2 py-0.5 text-[10px] font-bold text-orange-600 dark:text-orange-400 uppercase tracking-wider">
              Logistics
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white transition-colors"
            >
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            <Link
              href="/login"
              className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="rounded-full bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700 transition-colors shadow-lg shadow-orange-600/20"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-32 pb-20 px-6">
        {/* Background effects */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-1/4 w-96 h-96 rounded-full bg-orange-500/10 dark:bg-orange-500/5 blur-3xl" />
          <div className="absolute top-40 right-1/4 w-80 h-80 rounded-full bg-blue-500/10 dark:bg-blue-500/5 blur-3xl" />
        </div>

        <motion.div style={{ y: heroY }} className="relative max-w-4xl mx-auto text-center">
          <FadeIn>
            <div className="inline-flex items-center gap-2 rounded-full border border-orange-200 dark:border-orange-500/20 bg-orange-50 dark:bg-orange-500/10 px-4 py-1.5 text-sm text-orange-700 dark:text-orange-400 mb-6">
              <Zap className="h-3.5 w-3.5" />
              Africa&apos;s Logistics Nervous System
            </div>
          </FadeIn>

          <FadeIn delay={0.1}>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1]">
              Move Anything,{" "}
              <span className="gradient-text">Anywhere</span>{" "}
              in Nigeria
            </h1>
          </FadeIn>

          <FadeIn delay={0.2}>
            <p className="mt-6 text-lg sm:text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed">
              Post loads, get competitive bids from verified carriers, and track your shipments in real-time.
              Zero upfront cost. Zero commission.
            </p>
          </FadeIn>

          <FadeIn delay={0.3}>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/signup"
                className="group flex items-center gap-2 rounded-full bg-orange-600 px-8 py-3.5 text-base font-semibold text-white hover:bg-orange-700 transition-all shadow-xl shadow-orange-600/25 hover:shadow-orange-600/40"
              >
                Ship Now
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/signup"
                className="flex items-center gap-2 rounded-full border border-gray-300 dark:border-white/10 px-8 py-3.5 text-base font-semibold hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
              >
                <Truck className="h-4 w-4" />
                Start Earning as a Carrier
              </Link>
            </div>
          </FadeIn>
        </motion.div>
      </section>

      {/* Stats */}
      <section className="py-16 px-6 border-y border-gray-200/50 dark:border-white/5 bg-gray-50/50 dark:bg-white/[0.02]">
        <div className="max-w-4xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-8">
          {stats.map((stat, i) => (
            <FadeIn key={stat.label} delay={i * 0.1}>
              <div className="text-center">
                <p className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
                  {stat.prefix}
                  <AnimatedCounter value={stat.value} />
                  {stat.suffix}
                </p>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{stat.label}</p>
              </div>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <FadeIn>
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold">
                How It <span className="gradient-text">Works</span>
              </h2>
              <p className="mt-4 text-gray-600 dark:text-gray-400 max-w-xl mx-auto">
                Three simple steps to move your goods across Nigeria
              </p>
            </div>
          </FadeIn>

          <StaggerChildren>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {howItWorks.map((item) => {
                const Icon = item.icon;
                return (
                  <StaggerItem key={item.step}>
                    <div className="relative rounded-2xl border border-gray-200 dark:border-white/10 p-6 bg-white dark:bg-[#111] hover:shadow-lg transition-shadow">
                      <span className="text-4xl font-bold text-gray-100 dark:text-gray-800 absolute top-4 right-4">
                        {item.step}
                      </span>
                      <div className={`inline-flex rounded-xl bg-gradient-to-br ${item.color} p-3 mb-4`}>
                        <Icon className="h-6 w-6 text-white" />
                      </div>
                      <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                        {item.description}
                      </p>
                    </div>
                  </StaggerItem>
                );
              })}
            </div>
          </StaggerChildren>
        </div>
      </section>

      {/* For Shippers / For Carriers */}
      <section className="py-20 px-6 bg-gray-50/50 dark:bg-white/[0.02]">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {features.map((section, i) => {
              const Icon = section.icon;
              return (
                <FadeIn key={section.title} delay={i * 0.15}>
                  <div className="rounded-2xl border border-gray-200 dark:border-white/10 p-8 bg-white dark:bg-[#111] hover:shadow-lg transition-shadow h-full flex flex-col">
                    <div className={`inline-flex rounded-xl bg-gradient-to-br ${section.gradient} p-3 mb-4 self-start`}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold mb-4">{section.title}</h3>
                    <ul className="space-y-3 flex-1">
                      {section.items.map((item) => (
                        <li key={item} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                          <CheckCircle className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                    <Link
                      href={section.href}
                      className={`mt-6 inline-flex items-center gap-2 rounded-full bg-gradient-to-r ${section.gradient} px-6 py-2.5 text-sm font-semibold text-white hover:opacity-90 transition-opacity self-start`}
                    >
                      {section.cta}
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </FadeIn>
              );
            })}
          </div>
        </div>
      </section>

      {/* Trust indicators */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <FadeIn>
            <h2 className="text-3xl sm:text-4xl font-bold mb-12">
              Built on <span className="gradient-text">Trust</span>
            </h2>
          </FadeIn>

          <StaggerChildren>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
              {[
                { icon: Shield, title: "Verified Carriers", desc: "Every carrier goes through verification before they can bid on loads" },
                { icon: Zap, title: "Secure Payments", desc: "Payments held securely until delivery is confirmed by the shipper" },
                { icon: Star, title: "Ratings & Reviews", desc: "Transparent ratings help you choose the best carriers for your loads" },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <StaggerItem key={item.title}>
                    <div className="text-center">
                      <div className="inline-flex rounded-xl bg-orange-50 dark:bg-orange-500/10 p-3 mb-4">
                        <Icon className="h-6 w-6 text-orange-600" />
                      </div>
                      <h3 className="font-semibold mb-2">{item.title}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{item.desc}</p>
                    </div>
                  </StaggerItem>
                );
              })}
            </div>
          </StaggerChildren>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6">
        <FadeIn>
          <div className="max-w-3xl mx-auto text-center rounded-3xl bg-gradient-to-br from-orange-600 to-red-600 p-12 shadow-2xl shadow-orange-600/20">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Ready to move your goods?
            </h2>
            <p className="text-orange-100 text-lg mb-8">
              Join thousands of shippers and carriers on PULSE. Free to start, no hidden fees.
            </p>
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 rounded-full bg-white px-8 py-3.5 text-base font-semibold text-orange-600 hover:bg-orange-50 transition-colors shadow-lg"
            >
              Create Free Account
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </FadeIn>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 dark:border-white/5 py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold gradient-text">PULSE</span>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              SCOUT · HAUL · CONVOY
            </span>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            &copy; {new Date().getFullYear()} PULSE. Built for African logistics.
          </p>
        </div>
      </footer>
    </div>
  );
}
