"use client";

import { Bell, Menu, Check, ExternalLink } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { timeAgo } from "@/lib/utils/format";
import Link from "next/link";

interface TopbarProps {
  title: string;
  onMenuClick?: () => void;
}

export function Topbar({ title, onMenuClick }: TopbarProps) {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch unread count on mount + poll every 30s
  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  async function fetchUnreadCount() {
    try {
      const res = await fetch("/api/notifications?limit=1&unread_only=true");
      const data = await res.json();
      setUnreadCount(data.unread_count || 0);
    } catch {}
  }

  async function fetchNotifications() {
    setLoading(true);
    try {
      const res = await fetch("/api/notifications?limit=15");
      const data = await res.json();
      setNotifications(data.notifications || []);
      setUnreadCount(data.unread_count || 0);
    } catch {}
    setLoading(false);
  }

  function toggleDropdown() {
    if (!open) fetchNotifications();
    setOpen(!open);
  }

  async function markAsRead(id: string) {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notification_id: id }),
    });
  }

  async function markAllRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnreadCount(0);
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mark_all: true }),
    });
  }

  const priorityDot: Record<string, string> = {
    critical: "bg-red-500",
    normal: "bg-orange-500",
    low: "bg-gray-400",
  };

  return (
    <header className="flex items-center justify-between border-b border-gray-200 dark:border-white/5 bg-white dark:bg-[#111] px-6 py-4">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="lg:hidden rounded-lg p-1.5 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5"
        >
          <Menu className="h-5 w-5" />
        </button>
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white">{title}</h1>
      </div>

      <div className="relative" ref={dropdownRef}>
        <button
          onClick={toggleDropdown}
          className="relative rounded-lg p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-orange-500 text-[10px] font-bold text-white">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>

        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
              className="absolute right-0 top-full mt-2 w-[360px] max-w-[calc(100vw-2rem)] rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#111] shadow-xl z-50"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-white/5">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Notifications</h3>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className="flex items-center gap-1 text-xs text-orange-600 dark:text-orange-400 hover:underline"
                  >
                    <Check className="h-3 w-3" /> Mark all read
                  </button>
                )}
              </div>

              {/* List */}
              <div className="max-h-[400px] overflow-y-auto">
                {loading ? (
                  <div className="space-y-1 p-2">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-16 rounded-lg bg-gray-50 dark:bg-gray-800/50 animate-pulse" />
                    ))}
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="py-10 text-center">
                    <Bell className="h-8 w-8 mx-auto text-gray-300 dark:text-gray-600 mb-2" />
                    <p className="text-sm text-gray-400">No notifications yet</p>
                  </div>
                ) : (
                  <div className="py-1">
                    {notifications.map((n) => (
                      <div
                        key={n.id}
                        className={`group relative px-4 py-3 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors ${
                          !n.is_read ? "bg-orange-50/50 dark:bg-orange-500/5" : ""
                        }`}
                      >
                        <div className="flex gap-3">
                          {/* Priority dot */}
                          <div className={`mt-1.5 h-2 w-2 rounded-full shrink-0 ${
                            !n.is_read ? (priorityDot[n.priority] || "bg-orange-500") : "bg-transparent"
                          }`} />
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm ${!n.is_read ? "font-medium text-gray-900 dark:text-white" : "text-gray-600 dark:text-gray-400"}`}>
                              {n.title}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">{n.body}</p>
                            <p className="text-[10px] text-gray-400 mt-1">{timeAgo(n.created_at)}</p>
                          </div>
                          {/* Actions */}
                          <div className="flex items-start gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                            {!n.is_read && (
                              <button
                                onClick={() => markAsRead(n.id)}
                                className="p-1 rounded hover:bg-gray-100 dark:hover:bg-white/10"
                                title="Mark as read"
                              >
                                <Check className="h-3.5 w-3.5 text-gray-400" />
                              </button>
                            )}
                            {n.action_url && (
                              <Link
                                href={n.action_url}
                                onClick={() => {
                                  if (!n.is_read) markAsRead(n.id);
                                  setOpen(false);
                                }}
                                className="p-1 rounded hover:bg-gray-100 dark:hover:bg-white/10"
                                title="View"
                              >
                                <ExternalLink className="h-3.5 w-3.5 text-gray-400" />
                              </Link>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
}
