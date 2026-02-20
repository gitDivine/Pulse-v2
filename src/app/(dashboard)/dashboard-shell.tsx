"use client";

import { useState } from "react";
import { Sidebar } from "@/components/dashboard/sidebar";
import { X } from "lucide-react";

interface DashboardShellProps {
  children: React.ReactNode;
  businessName: string;
  businessSlug: string;
}

export function DashboardShell({ children, businessName, businessSlug }: DashboardShellProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Desktop sidebar */}
      <div className="hidden lg:block">
        <Sidebar businessName={businessName} businessSlug={businessSlug} />
      </div>

      {/* Mobile sidebar overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-black/50"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="fixed left-0 top-0 h-full">
            <Sidebar businessName={businessName} businessSlug={businessSlug} />
          </div>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="fixed right-4 top-4 rounded-full bg-white p-2 shadow-lg"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      )}

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
