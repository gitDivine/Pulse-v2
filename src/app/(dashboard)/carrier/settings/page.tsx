"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Topbar } from "@/components/dashboard/topbar";
import { Card, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { NIGERIAN_STATES } from "@/lib/constants";
import { Save, EyeOff, Eye, RotateCcw } from "lucide-react";
import { GuidedTour } from "@/components/dashboard/guided-tour";
import { resetTourForRole } from "@/components/dashboard/tour-gate";

export default function CarrierSettingsPage() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const [fullName, setFullName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [phone, setPhone] = useState("");
  const [state, setState] = useState("");
  const [city, setCity] = useState("");
  const [email, setEmail] = useState("");
  const [isDiscoverable, setIsDiscoverable] = useState(true);
  const [togglingVisibility, setTogglingVisibility] = useState(false);
  const [showTour, setShowTour] = useState(false);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setEmail(user.email || "");

      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, company_name, phone, state, city, is_discoverable")
        .eq("id", user.id)
        .single();

      if (profile) {
        setFullName(profile.full_name);
        setCompanyName(profile.company_name || "");
        setPhone(profile.phone || "");
        setState(profile.state || "");
        setCity(profile.city || "");
        setIsDiscoverable((profile as any).is_discoverable !== false);
      }
      setLoading(false);
    }
    load();
  }, [supabase]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage("");

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: fullName,
        company_name: companyName || null,
        phone: phone || null,
        state: state || null,
        city: city || null,
      })
      .eq("id", user.id);

    setSaving(false);
    setMessage(error ? "Failed to save" : "Saved successfully");
  }

  if (loading) {
    return (
      <div>
        <Topbar title="Settings" />
        <div className="p-6">
          <div className="h-64 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div>
      <Topbar title="Settings" />
      <div className="p-6 max-w-2xl">
        <Card>
          <CardTitle className="mb-4">Profile Settings</CardTitle>
          <form onSubmit={handleSave} className="space-y-4">
            <Input label="Email" value={email} disabled />
            <Input
              label="Full Name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
            <Input
              label="Company / Fleet Name"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
            />
            <Input
              label="Phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
            <div className="grid grid-cols-2 gap-3">
              <Select
                label="State"
                value={state}
                onChange={(e) => setState(e.target.value)}
                options={NIGERIAN_STATES.map((s) => ({ value: s, label: s }))}
              />
              <Input
                label="City"
                value={city}
                onChange={(e) => setCity(e.target.value)}
              />
            </div>
            {message && (
              <p className={`text-sm ${message.includes("Failed") ? "text-red-600" : "text-emerald-600"}`}>
                {message}
              </p>
            )}
            <Button type="submit" loading={saving}>
              <Save className="h-4 w-4 mr-1" /> Save Changes
            </Button>
          </form>
        </Card>

        {/* Directory Visibility */}
        <Card className="mt-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle className="mb-1">Directory Visibility</CardTitle>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {isDiscoverable
                  ? "Your profile is visible to shippers in the carrier directory. They can find, favorite, and invite you to bid."
                  : "Your profile is hidden from the carrier directory. Shippers won't see you when browsing carriers."}
              </p>
            </div>
            <button
              onClick={async () => {
                setTogglingVisibility(true);
                const newValue = !isDiscoverable;
                setIsDiscoverable(newValue);
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) { setTogglingVisibility(false); return; }
                const { error } = await supabase
                  .from("profiles")
                  .update({ is_discoverable: newValue } as any)
                  .eq("id", user.id);
                if (error) setIsDiscoverable(!newValue);
                setTogglingVisibility(false);
              }}
              disabled={togglingVisibility}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ${
                isDiscoverable ? "bg-orange-500" : "bg-gray-300 dark:bg-gray-600"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform transition-transform duration-200 ${
                  isDiscoverable ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>
          <div className={`mt-3 flex items-center gap-2 text-xs font-medium ${
            isDiscoverable ? "text-emerald-600 dark:text-emerald-400" : "text-gray-500 dark:text-gray-400"
          }`}>
            {isDiscoverable ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
            {isDiscoverable ? "Visible in directory" : "Hidden from directory"}
          </div>
        </Card>

        <Card className="mt-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle className="mb-1">Guided Tour</CardTitle>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Replay the platform walkthrough to learn about all features.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => { resetTourForRole("carrier"); setShowTour(true); }}
            >
              <RotateCcw className="h-4 w-4 mr-1" /> Replay
            </Button>
          </div>
        </Card>
      </div>

      {showTour && <GuidedTour role="carrier" onComplete={() => setShowTour(false)} />}
    </div>
  );
}
