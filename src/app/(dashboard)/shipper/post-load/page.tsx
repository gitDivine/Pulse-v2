"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Topbar } from "@/components/dashboard/topbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { NIGERIAN_STATES, CARGO_TYPES } from "@/lib/constants";
import { MapPin, Package, Banknote, CheckCircle, ArrowLeft, ArrowRight } from "lucide-react";

const STEPS = [
  { label: "Pickup", icon: MapPin },
  { label: "Delivery", icon: MapPin },
  { label: "Cargo", icon: Package },
  { label: "Budget", icon: Banknote },
];

export default function PostLoadPage() {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();

  // Pickup
  const [originAddress, setOriginAddress] = useState("");
  const [originLandmark, setOriginLandmark] = useState("");
  const [originCity, setOriginCity] = useState("");
  const [originState, setOriginState] = useState("");

  // Delivery
  const [destAddress, setDestAddress] = useState("");
  const [destLandmark, setDestLandmark] = useState("");
  const [destCity, setDestCity] = useState("");
  const [destState, setDestState] = useState("");

  // Cargo
  const [cargoType, setCargoType] = useState("general");
  const [cargoDescription, setCargoDescription] = useState("");
  const [weightKg, setWeightKg] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [specialInstructions, setSpecialInstructions] = useState("");

  // Budget & Schedule
  const [budgetAmount, setBudgetAmount] = useState("");
  const [isNegotiable, setIsNegotiable] = useState(true);
  const [pickupDate, setPickupDate] = useState("");
  const [deliveryDate, setDeliveryDate] = useState("");

  // Pre-fill from search params (duplicate load)
  useEffect(() => {
    if (!searchParams.get("duplicate")) return;
    // Route (pre-filled, shipper skips past these)
    setOriginAddress(searchParams.get("origin_address") || "");
    setOriginLandmark(searchParams.get("origin_landmark") || "");
    setOriginCity(searchParams.get("origin_city") || "");
    setOriginState(searchParams.get("origin_state") || "");
    setDestAddress(searchParams.get("dest_address") || "");
    setDestLandmark(searchParams.get("dest_landmark") || "");
    setDestCity(searchParams.get("dest_city") || "");
    setDestState(searchParams.get("dest_state") || "");
    // Cargo (pre-filled but shipper lands here to change)
    setCargoType(searchParams.get("cargo_type") || "general");
    setCargoDescription(searchParams.get("cargo_description") || "");
    setWeightKg(searchParams.get("weight_kg") || "");
    setQuantity(searchParams.get("quantity") || "1");
    setSpecialInstructions(searchParams.get("special_instructions") || "");
    // Budget (pre-filled, dates left empty for fresh entry)
    if (searchParams.get("budget_amount")) setBudgetAmount(searchParams.get("budget_amount")!);
    setIsNegotiable(searchParams.get("is_negotiable") !== "false");
    // Skip to Cargo step — route is already filled, cargo is what changes
    setStep(2);
  }, [searchParams]);

  async function handleSubmit() {
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/loads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          origin_address: originAddress,
          origin_landmark: originLandmark || null,
          origin_city: originCity,
          origin_state: originState,
          destination_address: destAddress,
          destination_landmark: destLandmark || null,
          destination_city: destCity,
          destination_state: destState,
          cargo_type: cargoType,
          cargo_description: cargoDescription || null,
          weight_kg: weightKg ? parseInt(weightKg) : null,
          quantity: parseInt(quantity) || 1,
          special_instructions: specialInstructions || null,
          budget_amount: budgetAmount ? parseInt(budgetAmount) * 100 : null,
          is_negotiable: isNegotiable,
          pickup_date: pickupDate,
          delivery_date: deliveryDate || null,
          status: "posted",
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to post load");
      router.push(`/shipper/loads/${data.load.id}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  function nextStep(e: React.FormEvent) {
    e.preventDefault();
    if (step < STEPS.length - 1) setStep(step + 1);
    else handleSubmit();
  }

  return (
    <div>
      <Topbar title="Post a Load" />

      <div className="max-w-2xl mx-auto p-6">
        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-8">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            return (
              <div key={i} className="flex items-center gap-2 flex-1">
                <motion.div
                  animate={{
                    backgroundColor: i <= step ? "rgb(249 115 22)" : "rgb(229 231 235)",
                    color: i <= step ? "white" : "rgb(156 163 175)",
                  }}
                  className="flex items-center justify-center h-8 w-8 rounded-full text-xs font-bold shrink-0"
                >
                  {i < step ? <CheckCircle className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                </motion.div>
                <span className={`text-xs font-medium hidden sm:block ${i <= step ? "text-orange-600 dark:text-orange-400" : "text-gray-400"}`}>
                  {s.label}
                </span>
                {i < STEPS.length - 1 && (
                  <div className={`flex-1 h-0.5 rounded-full ${i < step ? "bg-orange-500" : "bg-gray-200 dark:bg-gray-700"}`} />
                )}
              </div>
            );
          })}
        </div>

        <AnimatePresence mode="wait">
          <motion.form
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            onSubmit={nextStep}
            className="space-y-4"
          >
            {step === 0 && (
              <>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Where is the pickup?</h3>
                <Input
                  label="Pickup Address"
                  placeholder="e.g. 12 Allen Avenue, Ikeja"
                  value={originAddress}
                  onChange={(e) => setOriginAddress(e.target.value)}
                  required
                />
                <Input
                  label="Landmark (optional)"
                  placeholder="e.g. Opposite Shoprite"
                  value={originLandmark}
                  onChange={(e) => setOriginLandmark(e.target.value)}
                />
                <div className="grid grid-cols-2 gap-3">
                  <Select
                    label="State"
                    placeholder="Select state"
                    value={originState}
                    onChange={(e) => setOriginState(e.target.value)}
                    options={NIGERIAN_STATES.map((s) => ({ value: s, label: s }))}
                    required
                  />
                  <Input
                    label="City"
                    placeholder="e.g. Ikeja"
                    value={originCity}
                    onChange={(e) => setOriginCity(e.target.value)}
                    required
                  />
                </div>
              </>
            )}

            {step === 1 && (
              <>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Where should it be delivered?</h3>
                <Input
                  label="Delivery Address"
                  placeholder="e.g. 5 Aba Road, Port Harcourt"
                  value={destAddress}
                  onChange={(e) => setDestAddress(e.target.value)}
                  required
                />
                <Input
                  label="Landmark (optional)"
                  placeholder="e.g. Near First Bank"
                  value={destLandmark}
                  onChange={(e) => setDestLandmark(e.target.value)}
                />
                <div className="grid grid-cols-2 gap-3">
                  <Select
                    label="State"
                    placeholder="Select state"
                    value={destState}
                    onChange={(e) => setDestState(e.target.value)}
                    options={NIGERIAN_STATES.map((s) => ({ value: s, label: s }))}
                    required
                  />
                  <Input
                    label="City"
                    placeholder="e.g. Port Harcourt"
                    value={destCity}
                    onChange={(e) => setDestCity(e.target.value)}
                    required
                  />
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">What are you shipping?</h3>
                <Select
                  label="Cargo Type"
                  value={cargoType}
                  onChange={(e) => setCargoType(e.target.value)}
                  options={CARGO_TYPES.map((c) => ({ value: c.value, label: c.label }))}
                  required
                />
                <Input
                  label="Description (optional)"
                  placeholder="e.g. 20 bags of rice"
                  value={cargoDescription}
                  onChange={(e) => setCargoDescription(e.target.value)}
                />
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="Weight (kg)"
                    type="number"
                    placeholder="e.g. 1000"
                    value={weightKg}
                    onChange={(e) => setWeightKg(e.target.value)}
                    min={1}
                  />
                  <Input
                    label="Quantity"
                    type="number"
                    placeholder="e.g. 1"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    min={1}
                  />
                </div>
                <Input
                  label="Special Instructions (optional)"
                  placeholder="e.g. Handle with care, keep upright"
                  value={specialInstructions}
                  onChange={(e) => setSpecialInstructions(e.target.value)}
                />
              </>
            )}

            {step === 3 && (
              <>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Budget & Schedule</h3>
                <Input
                  label="Budget (₦)"
                  type="number"
                  placeholder="Leave empty for open bids"
                  value={budgetAmount}
                  onChange={(e) => setBudgetAmount(e.target.value)}
                  min={0}
                />
                <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                  <input
                    type="checkbox"
                    checked={isNegotiable}
                    onChange={(e) => setIsNegotiable(e.target.checked)}
                    className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                  />
                  Price is negotiable
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="Pickup Date"
                    type="date"
                    value={pickupDate}
                    onChange={(e) => setPickupDate(e.target.value)}
                    required
                  />
                  <Input
                    label="Delivery Date (optional)"
                    type="date"
                    value={deliveryDate}
                    onChange={(e) => setDeliveryDate(e.target.value)}
                  />
                </div>
              </>
            )}

            {error && <p className="text-sm text-red-600">{error}</p>}

            <div className="flex gap-3 pt-4">
              {step > 0 && (
                <Button type="button" variant="outline" onClick={() => setStep(step - 1)} className="flex-1">
                  <ArrowLeft className="h-4 w-4 mr-1" /> Back
                </Button>
              )}
              <Button type="submit" loading={loading && step === STEPS.length - 1} className="flex-1">
                {step < STEPS.length - 1 ? (
                  <>Continue <ArrowRight className="h-4 w-4 ml-1" /></>
                ) : (
                  "Post Load"
                )}
              </Button>
            </div>
          </motion.form>
        </AnimatePresence>
      </div>
    </div>
  );
}
