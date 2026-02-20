"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Topbar } from "@/components/dashboard/topbar";
import { Card, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { VEHICLE_TYPES } from "@/lib/constants";
import { Truck, Plus, X, Trash2 } from "lucide-react";
import type { VehicleType } from "@/types/database";

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState("");

  const [vehicleType, setVehicleType] = useState<VehicleType | "">("");
  const [plateNumber, setPlateNumber] = useState("");
  const [capacityKg, setCapacityKg] = useState("");
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");

  useEffect(() => {
    fetchVehicles();
  }, []);

  async function fetchVehicles() {
    const res = await fetch("/api/vehicles");
    const data = await res.json();
    setVehicles(data.vehicles || []);
    setLoading(false);
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setFormLoading(true);

    try {
      const res = await fetch("/api/vehicles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vehicle_type: vehicleType,
          plate_number: plateNumber,
          capacity_kg: parseInt(capacityKg),
          make: make || null,
          model: model || null,
        }),
      });

      if (!res.ok) throw new Error("Failed to add vehicle");

      setShowForm(false);
      setVehicleType("");
      setPlateNumber("");
      setCapacityKg("");
      setMake("");
      setModel("");
      fetchVehicles();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setFormLoading(false);
    }
  }

  async function handleDelete(id: string) {
    await fetch(`/api/vehicles/${id}`, { method: "DELETE" });
    setVehicles((prev) => prev.filter((v) => v.id !== id));
  }

  return (
    <div>
      <Topbar title="My Vehicles" />

      <div className="p-6 space-y-4 max-w-2xl">
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500 dark:text-gray-400">{vehicles.length} vehicle{vehicles.length !== 1 ? "s" : ""}</p>
          <Button onClick={() => setShowForm(!showForm)} size="sm">
            {showForm ? <X className="h-4 w-4 mr-1" /> : <Plus className="h-4 w-4 mr-1" />}
            {showForm ? "Cancel" : "Add Vehicle"}
          </Button>
        </div>

        {/* Add form */}
        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <Card>
                <CardTitle className="mb-3">Add Vehicle</CardTitle>
                <form onSubmit={handleAdd} className="space-y-3">
                  <Select
                    label="Vehicle Type"
                    placeholder="Select type"
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
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      label="Make (optional)"
                      placeholder="e.g. Toyota"
                      value={make}
                      onChange={(e) => setMake(e.target.value)}
                    />
                    <Input
                      label="Model (optional)"
                      placeholder="e.g. Dyna"
                      value={model}
                      onChange={(e) => setModel(e.target.value)}
                    />
                  </div>
                  {error && <p className="text-sm text-red-600">{error}</p>}
                  <Button type="submit" loading={formLoading} className="w-full">
                    Add Vehicle
                  </Button>
                </form>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Vehicle list */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="h-20 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse" />
            ))}
          </div>
        ) : vehicles.length === 0 ? (
          <div className="text-center py-12">
            <Truck className="h-12 w-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
            <p className="text-gray-500 dark:text-gray-400">No vehicles yet</p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
              Add your first vehicle to start bidding on loads
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {vehicles.map((vehicle, i) => {
              const typeInfo = VEHICLE_TYPES.find((v) => v.value === vehicle.vehicle_type);
              return (
                <motion.div
                  key={vehicle.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Card>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{typeInfo?.icon || "🚛"}</span>
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {vehicle.plate_number}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {typeInfo?.label || vehicle.vehicle_type} · {vehicle.capacity_kg}kg
                            {vehicle.make && ` · ${vehicle.make} ${vehicle.model || ""}`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={vehicle.is_verified ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
                          {vehicle.is_verified ? "Verified" : "Pending"}
                        </Badge>
                        <button
                          onClick={() => handleDelete(vehicle.id)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
