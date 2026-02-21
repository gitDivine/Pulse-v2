"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sidebar } from "@/components/dashboard/sidebar";
import { TourGate } from "@/components/dashboard/tour-gate";
import { X, Menu } from "lucide-react";

interface DashboardShellProps {
  children: React.ReactNode;
  userName: string;
  companyName?: string;
  role: "shipper" | "carrier";
}

export function DashboardShell({ children, userName, companyName, role }: DashboardShellProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-[#0a0a0a]">
      {/* Desktop sidebar */}
      <div className="hidden lg:block">
        <Sidebar userName={userName} companyName={companyName} role={role} />
      </div>

      {/* Mobile menu button */}
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={() => setMobileMenuOpen(true)}
        className="fixed top-4 left-4 z-40 lg:hidden rounded-xl bg-white dark:bg-[#111] border border-gray-200 dark:border-white/10 p-2.5 shadow-lg"
      >
        <Menu className="h-5 w-5 text-gray-700 dark:text-gray-300" />
      </motion.button>

      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setMobileMenuOpen(false)}
            />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 400, damping: 35 }}
              className="fixed left-0 top-0 h-full"
            >
              <Sidebar userName={userName} companyName={companyName} role={role} onNavigate={() => setMobileMenuOpen(false)} />
            </motion.div>
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed right-4 top-4 rounded-full bg-white dark:bg-[#111] p-2 shadow-lg"
            >
              <X className="h-5 w-5" />
            </motion.button>
          </div>
        )}
      </AnimatePresence>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        >
          {children}
        </motion.div>
      </main>

      <TourGate role={role} />
    </div>
  );
}
