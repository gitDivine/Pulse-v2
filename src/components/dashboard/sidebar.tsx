"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  Package,
  Truck,
  Search,
  MapPin,
  Settings,
  LogOut,
  Sun,
  Moon,
  PlusCircle,
  Wallet,
  Users,
  Gavel,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useTheme } from "@/components/theme-provider";

const shipperNavItems = [
  { href: "/shipper/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/shipper/post-load", label: "Post a Load", icon: PlusCircle },
  { href: "/shipper/loads", label: "My Loads", icon: Package },
  { href: "/shipper/carriers", label: "Find Carriers", icon: Users },
  { href: "/shipper/settings", label: "Settings", icon: Settings },
];

const carrierNavItems = [
  { href: "/carrier/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/carrier/load-board", label: "Load Board", icon: Search },
  { href: "/carrier/bids", label: "My Bids", icon: Gavel },
  { href: "/carrier/trips", label: "My Trips", icon: MapPin },
  { href: "/carrier/vehicles", label: "Vehicles", icon: Truck },
  { href: "/carrier/earnings", label: "Earnings", icon: Wallet },
  { href: "/carrier/settings", label: "Settings", icon: Settings },
];

interface SidebarProps {
  userName: string;
  companyName?: string;
  role: "shipper" | "carrier";
  onNavigate?: () => void;
}

export function Sidebar({ userName, companyName, role, onNavigate }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const { theme, toggleTheme } = useTheme();

  const navItems = role === "shipper" ? shipperNavItems : carrierNavItems;
  const [unreadMessages, setUnreadMessages] = useState(0);

  useEffect(() => {
    fetch("/api/trips/unread")
      .then((r) => r.json())
      .then((data) => setUnreadMessages(data.total || 0))
      .catch(() => {});
    // Poll every 30s
    const interval = setInterval(() => {
      fetch("/api/trips/unread")
        .then((r) => r.json())
        .then((data) => setUnreadMessages(data.total || 0))
        .catch(() => {});
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <aside className="flex h-screen w-64 flex-col border-r border-gray-200 dark:border-white/5 bg-white dark:bg-[#111]">
      {/* Logo */}
      <div className="flex items-center gap-2 border-b border-gray-200 dark:border-white/5 px-6 py-4">
        <span className="text-xl font-bold gradient-text">PULSE</span>
        <span className="rounded-full bg-orange-100 dark:bg-orange-500/10 px-2 py-0.5 text-[10px] font-bold text-orange-600 dark:text-orange-400 uppercase tracking-wider">
          {role === "shipper" ? "Ship" : "Haul"}
        </span>
      </div>

      {/* User info */}
      <div className="border-b border-gray-200 dark:border-white/5 px-6 py-3">
        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
          {companyName || userName}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{role}</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const isActive =
            item.href === `/${role}/dashboard`
              ? pathname === `/${role}/dashboard`
              : pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className="relative block"
            >
              <motion.div
                whileHover={{ x: 2 }}
                whileTap={{ scale: 0.98 }}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-orange-50 dark:bg-orange-500/10 text-orange-700 dark:text-orange-400"
                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white"
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="sidebar-active"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full bg-orange-500"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <Icon className="h-[18px] w-[18px]" />
                {item.label}
                {unreadMessages > 0 && (
                  (role === "carrier" && item.href === "/carrier/trips") ||
                  (role === "shipper" && item.href === "/shipper/loads")
                ) && (
                  <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white">
                    {unreadMessages}
                  </span>
                )}
              </motion.div>
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="border-t border-gray-200 dark:border-white/5 px-3 py-3 space-y-1">
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={toggleTheme}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          {theme === "dark" ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
          {theme === "dark" ? "Light mode" : "Dark mode"}
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400 transition-colors"
        >
          <LogOut className="h-[18px] w-[18px]" />
          Log out
        </motion.button>
      </div>
    </aside>
  );
}
