"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { BUSINESS_CATEGORIES, NIGERIAN_STATES } from "@/lib/constants";
import { generateSlug } from "@/lib/utils/format";

export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const supabase = createClient();

  // Step 1: Profile
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");

  // Step 2: Business
  const [businessName, setBusinessName] = useState("");
  const [category, setCategory] = useState("");
  const [state, setState] = useState("");
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");
  const [businessDescription, setBusinessDescription] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Create profile
      const { error: profileError } = await supabase.from("profiles").insert({
        id: user.id,
        role: "seller",
        phone: phone || null,
        email: user.email || null,
        full_name: fullName,
        verification_level: "phone",
      });
      if (profileError) throw profileError;

      // Create business
      const slug = generateSlug(businessName);
      const { error: bizError } = await supabase.from("businesses").insert({
        owner_id: user.id,
        name: businessName,
        slug,
        description: businessDescription || null,
        category,
        state,
        city,
        address: address || null,
        phone: phone || null,
        is_published: true,
      });
      if (bizError) throw bizError;

      router.push("/dashboard");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900">Set up your business</h2>
      <p className="mt-2 text-sm text-gray-600">
        Step {step} of 2 — {step === 1 ? "Your details" : "Business details"}
      </p>

      {/* Progress bar */}
      <div className="mt-6 flex gap-2">
        <div className={`h-1.5 flex-1 rounded-full ${step >= 1 ? "bg-orange-500" : "bg-gray-200"}`} />
        <div className={`h-1.5 flex-1 rounded-full ${step >= 2 ? "bg-orange-500" : "bg-gray-200"}`} />
      </div>

      <form onSubmit={step === 2 ? handleSubmit : (e) => { e.preventDefault(); setStep(2); }} className="mt-8 space-y-4">
        {step === 1 ? (
          <>
            <Input
              label="Full Name"
              placeholder="Enter your full name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
            <Input
              label="Phone Number (optional)"
              type="tel"
              placeholder="08012345678"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
            <Button type="submit" className="w-full">
              Continue
            </Button>
          </>
        ) : (
          <>
            <Input
              label="Business Name"
              placeholder="e.g. Temi's Skincare"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              required
            />
            <Select
              label="Category"
              placeholder="Select a category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              options={BUSINESS_CATEGORIES.map((c) => ({ value: c, label: c }))}
              required
            />
            <div className="grid grid-cols-2 gap-3">
              <Select
                label="State"
                placeholder="Select state"
                value={state}
                onChange={(e) => setState(e.target.value)}
                options={NIGERIAN_STATES.map((s) => ({ value: s, label: s }))}
                required
              />
              <Input
                label="City"
                placeholder="e.g. Ikeja"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                required
              />
            </div>
            <Input
              label="Business Address"
              placeholder="Describe your location with landmarks"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
            <Input
              label="Brief Description (optional)"
              placeholder="What does your business sell?"
              value={businessDescription}
              onChange={(e) => setBusinessDescription(e.target.value)}
            />
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="flex gap-3">
              <Button type="button" variant="outline" onClick={() => setStep(1)} className="flex-1">
                Back
              </Button>
              <Button type="submit" loading={loading} className="flex-1">
                Launch my store
              </Button>
            </div>
          </>
        )}
      </form>
    </div>
  );
}
