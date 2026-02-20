"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { NIGERIAN_STATES, VEHICLE_TYPES } from "@/lib/constants";
import { Truck, Package, ArrowRight, ArrowLeft } from "lucide-react";
import type { UserRole, VehicleType } from "@/types/database";

export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const supabase = createClient();

  // Step 1: Role
  const [role, setRole] = useState<"shipper" | "carrier" | "">("");

  // Step 2: Profile
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [state, setState] = useState("");
  const [city, setCity] = useState("");

  // Step 3 (carrier only): First vehicle
  const [vehicleType, setVehicleType] = useState<VehicleType | "">("");
  const [plateNumber, setPlateNumber] = useState("");
  const [capacityKg, setCapacityKg] = useState("");

  const totalSteps = role === "carrier" ? 3 : 2;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error: profileError } = await supabase.from("profiles").insert({
        id: user.id,
        role: role as UserRole,
        phone: phone || null,
        email: user.email || null,
        full_name: fullName,
        company_name: companyName || null,
        state: state || null,
        city: city || null,
        verification_level: "phone",
      });
      if (profileError) throw profileError;

      if (role === "carrier" && vehicleType && plateNumber) {
        const { error: vehicleError } = await supabase.from("vehicles").insert({
          owner_id: user.id,
          vehicle_type: vehicleType as VehicleType,
          plate_number: plateNumber.toUpperCase(),
          capacity_kg: parseInt(capacityKg) || 0,
        });
        if (vehicleError) throw vehicleError;
      }

      router.push(role === "shipper" ? "/shipper/dashboard" : "/carrier/dashboard");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  function nextStep(e: React.FormEvent) {
    e.preventDefault();
    setStep((s) => s + 1);
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Get started with PULSE</h2>
      <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
        Step {step} of {totalSteps} —{" "}
        {step === 1 ? "Choose your role" : step === 2 ? "Your details" : "Add your first vehicle"}
      </p>

      {/* Progress bar */}
      <div className="mt-6 flex gap-2">
        {Array.from({ length: totalSteps }).map((_, i) => (
          <motion.div
            key={i}
            className={`h-1.5 flex-1 rounded-full ${
              step > i ? "bg-orange-500" : "bg-gray-200 dark:bg-gray-700"
            }`}
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: i * 0.1 }}
          />
        ))}
      </div>

      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="mt-8 space-y-4"
          >
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">How will you use PULSE?</p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <motion.button
                type="button"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => { setRole("shipper"); setStep(2); }}
                className="flex flex-col items-center gap-3 rounded-2xl border-2 border-gray-200 dark:border-gray-700 hover:border-orange-300 p-6 transition-colors"
              >
                <div className="rounded-xl bg-orange-100 dark:bg-orange-500/20 p-3">
                  <Package className="h-8 w-8 text-orange-600" />
                </div>
                <div className="text-center">
                  <p className="font-semibold text-gray-900 dark:text-white">I need to ship goods</p>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Post loads and find carriers
                  </p>
                </div>
              </motion.button>

              <motion.button
                type="button"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => { setRole("carrier"); setStep(2); }}
                className="flex flex-col items-center gap-3 rounded-2xl border-2 border-gray-200 dark:border-gray-700 hover:border-orange-300 p-6 transition-colors"
              >
                <div className="rounded-xl bg-orange-100 dark:bg-orange-500/20 p-3">
                  <Truck className="h-8 w-8 text-orange-600" />
                </div>
                <div className="text-center">
                  <p className="font-semibold text-gray-900 dark:text-white">I transport goods</p>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Find loads and earn money
                  </p>
                </div>
              </motion.button>
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.form
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            onSubmit={role === "carrier" ? nextStep : handleSubmit}
            className="mt-8 space-y-4"
          >
            <Input
              label="Full Name"
              placeholder="Enter your full name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
            <Input
              label={role === "carrier" ? "Company / Fleet Name" : "Company / Business Name"}
              placeholder={role === "carrier" ? "e.g. Divine Logistics" : "e.g. Divine Enterprises"}
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
            />
            <Input
              label="Phone Number"
              type="tel"
              placeholder="08012345678"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
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
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="flex gap-3">
              <Button type="button" variant="outline" onClick={() => setStep(1)} className="flex-1">
                <ArrowLeft className="h-4 w-4 mr-1" /> Back
              </Button>
              <Button type="submit" loading={loading && role !== "carrier"} className="flex-1">
                {role === "carrier" ? "Continue" : "Get Started"} <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </motion.form>
        )}

        {step === 3 && role === "carrier" && (
          <motion.form
            key="step3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            onSubmit={handleSubmit}
            className="mt-8 space-y-4"
          >
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Add your first vehicle to start receiving load offers.
            </p>
            <Select
              label="Vehicle Type"
              placeholder="Select vehicle type"
              value={vehicleType}
              onChange={(e) => setVehicleType(e.target.value as VehicleType)}
              options={VEHICLE_TYPES.map((v) => ({ value: v.value, label: `${v.icon} ${v.label}` }))}
              required
            />
            <Input
              label="Plate Number"
              placeholder="e.g. ABC-123-XY"
              value={plateNumber}
              onChange={(e) => setPlateNumber(e.target.value)}
              required
            />
            <Input
              label="Capacity (kg)"
              type="number"
              placeholder="e.g. 5000"
              value={capacityKg}
              onChange={(e) => setCapacityKg(e.target.value)}
              required
              min={1}
            />
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="flex gap-3">
              <Button type="button" variant="outline" onClick={() => setStep(2)} className="flex-1">
                <ArrowLeft className="h-4 w-4 mr-1" /> Back
              </Button>
              <Button type="submit" loading={loading} className="flex-1">
                Get Started <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}
