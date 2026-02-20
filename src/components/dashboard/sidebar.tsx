"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  MessageSquare,
  Settings,
  BarChart3,
  LogOut,
  Store,
  Bell,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

const navItems = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/products", label: "Products", icon: Package },
  { href: "/dashboard/orders", label: "Orders", icon: ShoppingCart },
  { href: "/dashboard/inbox", label: "Inbox", icon: MessageSquare },
  { href: "/dashboard/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

interface SidebarProps {
  businessName: string;
  businessSlug: string;
}

export function Sidebar({ businessName, businessSlug }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <aside className="flex h-screen w-64 flex-col border-r border-gray-200 bg-white">
      {/* Logo */}
      <div className="flex items-center gap-2 border-b border-gray-200 px-6 py-4">
        <span className="text-xl font-bold text-orange-500">PULSE</span>
        <span className="text-xs text-gray-400">FLOW</span>
      </div>

      {/* Business name */}
      <div className="border-b border-gray-200 px-6 py-3">
        <p className="text-sm font-medium text-gray-900 truncate">{businessName}</p>
        <Link
          href={`/store/${businessSlug}`}
          target="_blank"
          className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-orange-600"
        >
          <Store className="h-3 w-3" />
          View storefront
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const isActive =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-orange-50 text-orange-700"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              <Icon className="h-4.5 w-4.5" />
              {item.label}
              {item.label === "Inbox" && (
                <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-orange-500 text-[10px] font-bold text-white">
                  3
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="border-t border-gray-200 px-3 py-3">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
        >
          <LogOut className="h-4.5 w-4.5" />
          Log out
        </button>
      </div>
    </aside>
  );
}
