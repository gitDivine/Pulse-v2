"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardTitle } from "@/components/ui/card";
import { APP_URL } from "@/lib/constants";
import { QRCodeCanvas } from "qrcode.react";
import {
  Copy,
  Check,
  Download,
  ExternalLink,
  Bell,
  Store,
} from "lucide-react";

interface SettingsViewProps {
  profile: {
    id: string;
    full_name: string;
    email: string | null;
    phone: string | null;
  };
  business: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    quiet_hours_start: string | null;
    quiet_hours_end: string | null;
  };
}

export function SettingsView({ profile, business }: SettingsViewProps) {
  const [copied, setCopied] = useState(false);
  const [quietStart, setQuietStart] = useState(business.quiet_hours_start || "23:00");
  const [quietEnd, setQuietEnd] = useState(business.quiet_hours_end || "07:00");
  const [savingQuiet, setSavingQuiet] = useState(false);
  const qrRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const supabase = createClient();

  const storeUrl = `${APP_URL}/store/${business.slug}`;

  function copyLink() {
    navigator.clipboard.writeText(storeUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function downloadQR() {
    const canvas = qrRef.current?.querySelector("canvas");
    if (!canvas) return;
    const url = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.download = `${business.slug}-qr-code.png`;
    link.href = url;
    link.click();
  }

  async function saveQuietHours() {
    setSavingQuiet(true);
    await supabase
      .from("businesses")
      .update({
        quiet_hours_start: quietStart,
        quiet_hours_end: quietEnd,
      })
      .eq("id", business.id);
    setSavingQuiet(false);
    router.refresh();
  }

  return (
    <div className="max-w-2xl space-y-6">
      {/* Storefront link & QR */}
      <Card>
        <div className="flex items-center gap-2 mb-4">
          <Store className="h-5 w-5 text-orange-600" />
          <CardTitle>Your Storefront</CardTitle>
        </div>

        <div className="flex items-center gap-2 mb-4">
          <div className="flex-1 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700 truncate">
            {storeUrl}
          </div>
          <Button size="sm" variant="outline" onClick={copyLink}>
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copied ? "Copied" : "Copy"}
          </Button>
          <a href={storeUrl} target="_blank" rel="noopener noreferrer">
            <Button size="sm" variant="outline">
              <ExternalLink className="h-4 w-4" />
            </Button>
          </a>
        </div>

        <p className="text-sm text-gray-500 mb-4">
          Share this link on your Instagram bio, WhatsApp status, or anywhere your customers are.
          Print the QR code below for your physical shop.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-6 p-4 rounded-lg bg-gray-50 border border-gray-200">
          <div ref={qrRef} className="bg-white p-3 rounded-lg">
            <QRCodeCanvas
              value={storeUrl}
              size={160}
              level="M"
              marginSize={2}
            />
          </div>
          <div className="text-center sm:text-left">
            <p className="text-sm font-medium text-gray-900">{business.name}</p>
            <p className="text-xs text-gray-500 mt-1">Scan to visit store</p>
            <Button size="sm" variant="outline" onClick={downloadQR} className="mt-3">
              <Download className="h-4 w-4" />
              Download QR Code
            </Button>
          </div>
        </div>
      </Card>

      {/* Quiet hours */}
      <Card>
        <div className="flex items-center gap-2 mb-4">
          <Bell className="h-5 w-5 text-orange-600" />
          <CardTitle>Quiet Hours</CardTitle>
        </div>
        <p className="text-sm text-gray-500 mb-4">
          During quiet hours, non-urgent notifications are silently queued and delivered as a morning summary.
          Critical notifications (payments, disputes) always come through immediately.
        </p>
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Start (silent from)"
            type="time"
            value={quietStart}
            onChange={(e) => setQuietStart(e.target.value)}
          />
          <Input
            label="End (resume at)"
            type="time"
            value={quietEnd}
            onChange={(e) => setQuietEnd(e.target.value)}
          />
        </div>
        <Button
          size="sm"
          onClick={saveQuietHours}
          loading={savingQuiet}
          className="mt-3"
        >
          Save quiet hours
        </Button>
      </Card>

      {/* Account info */}
      <Card>
        <CardTitle className="mb-4">Account</CardTitle>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Name</span>
            <span className="text-gray-900">{profile.full_name}</span>
          </div>
          {profile.email && (
            <div className="flex justify-between">
              <span className="text-gray-500">Email</span>
              <span className="text-gray-900">{profile.email}</span>
            </div>
          )}
          {profile.phone && (
            <div className="flex justify-between">
              <span className="text-gray-500">Phone</span>
              <span className="text-gray-900">{profile.phone}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-gray-500">Store slug</span>
            <span className="text-gray-900 font-mono text-xs">{business.slug}</span>
          </div>
        </div>
      </Card>
    </div>
  );
}
