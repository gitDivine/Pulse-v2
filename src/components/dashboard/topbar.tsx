"use client";

import { Bell, Menu } from "lucide-react";
import { useState } from "react";

interface TopbarProps {
  title: string;
  onMenuClick?: () => void;
}

export function Topbar({ title, onMenuClick }: TopbarProps) {
  return (
    <header className="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="lg:hidden rounded-lg p-1.5 text-gray-500 hover:bg-gray-100"
        >
          <Menu className="h-5 w-5" />
        </button>
        <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
      </div>

      <div className="flex items-center gap-3">
        <button className="relative rounded-lg p-2 text-gray-500 hover:bg-gray-100 transition-colors">
          <Bell className="h-5 w-5" />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-orange-500" />
        </button>
      </div>
    </header>
  );
}
