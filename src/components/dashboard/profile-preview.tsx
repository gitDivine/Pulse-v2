"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { VEHICLE_TYPES, VERIFICATION_LABELS } from "@/lib/constants";
import {
  X, MapPin, Phone, Star, Truck, Shield, Calendar,
  Package, CheckCircle, Building2,
} from "lucide-react";

interface ProfilePreviewProps {
  userId: string | null;
  onClose: () => void;
}

export function ProfilePreview({ userId, onClose }: ProfilePreviewProps) {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    fetch(`/api/profiles/${userId}`)
      .then((r) => r.json())
      .then((data) => setProfile(data.profile))
      .catch(() => setProfile(null))
      .finally(() => setLoading(false));
  }, [userId]);

  const memberSince = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString("en-NG", { month: "long", year: "numeric" })
    : "";

  const verif = profile?.verification_level ? VERIFICATION_LABELS[profile.verification_level] : null;

  return (
    <AnimatePresence>
      {userId && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="relative w-full sm:max-w-sm bg-white dark:bg-[#111] rounded-t-2xl sm:rounded-2xl border border-gray-200 dark:border-white/10 shadow-xl overflow-hidden"
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-10 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
            >
              <X className="h-5 w-5 text-gray-400" />
            </button>

            {loading ? (
              <div className="p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-14 w-14 rounded-full bg-gray-100 dark:bg-gray-800 animate-pulse" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-32 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
                    <div className="h-3 w-20 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
                  </div>
                </div>
                <div className="h-16 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse" />
                <div className="h-12 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse" />
              </div>
            ) : !profile ? (
              <div className="p-6 text-center py-12">
                <p className="text-gray-500">Profile not found</p>
              </div>
            ) : (
              <div className="p-6">
                {/* Header */}
                <div className="flex items-start gap-3 pr-8">
                  <div className="h-14 w-14 rounded-full bg-orange-100 dark:bg-orange-500/10 flex items-center justify-center shrink-0">
                    <span className="text-xl font-bold text-orange-600 dark:text-orange-400">
                      {(profile.full_name || "?")[0].toUpperCase()}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                      {profile.company_name || profile.full_name}
                    </h3>
                    {profile.company_name && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{profile.full_name}</p>
                    )}
                    <Badge className={
                      profile.role === "carrier"
                        ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 mt-1"
                        : "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 mt-1"
                    }>
                      {profile.role === "carrier" ? "Carrier" : "Shipper"}
                    </Badge>
                  </div>
                </div>

                {/* Details grid */}
                <div className="mt-4 space-y-2.5">
                  {/* Phone */}
                  {profile.phone && (
                    <a
                      href={`tel:${profile.phone}`}
                      className="flex items-center gap-2.5 text-sm text-gray-700 dark:text-gray-300 hover:text-orange-600 dark:hover:text-orange-400 transition-colors"
                    >
                      <Phone className="h-4 w-4 text-gray-400 shrink-0" />
                      {profile.phone}
                    </a>
                  )}

                  {/* Location */}
                  {(profile.city || profile.state) && (
                    <div className="flex items-center gap-2.5 text-sm text-gray-700 dark:text-gray-300">
                      <MapPin className="h-4 w-4 text-gray-400 shrink-0" />
                      {[profile.city, profile.state].filter(Boolean).join(", ")}
                    </div>
                  )}

                  {/* Member since */}
                  {memberSince && (
                    <div className="flex items-center gap-2.5 text-sm text-gray-500 dark:text-gray-400">
                      <Calendar className="h-4 w-4 text-gray-400 shrink-0" />
                      Member since {memberSince}
                    </div>
                  )}

                  {/* Verification */}
                  {verif && (
                    <div className="flex items-center gap-2.5 text-sm">
                      <Shield className="h-4 w-4 text-gray-400 shrink-0" />
                      <Badge className={verif.color}>{verif.label}</Badge>
                    </div>
                  )}
                </div>

                {/* Stats bar */}
                <div className="mt-4 flex items-center gap-4 rounded-lg bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 px-4 py-3">
                  {/* Rating */}
                  <div className="text-center flex-1">
                    <div className="flex items-center justify-center gap-1">
                      <Star className={`h-4 w-4 ${profile.avg_rating > 0 ? "fill-yellow-400 text-yellow-400" : "text-gray-300 dark:text-gray-600"}`} />
                      <span className="text-lg font-bold text-gray-900 dark:text-white">
                        {profile.avg_rating > 0 ? profile.avg_rating.toFixed(1) : "—"}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400">
                      {profile.total_reviews > 0 ? `${profile.total_reviews} review${profile.total_reviews !== 1 ? "s" : ""}` : "No reviews"}
                    </p>
                  </div>

                  <div className="w-px h-8 bg-gray-200 dark:bg-white/10" />

                  {/* Role-specific stat */}
                  {profile.role === "carrier" ? (
                    <>
                      <div className="text-center flex-1">
                        <div className="flex items-center justify-center gap-1">
                          <CheckCircle className="h-4 w-4 text-emerald-500" />
                          <span className="text-lg font-bold text-gray-900 dark:text-white">
                            {profile.stats?.completedTrips || 0}
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-500 dark:text-gray-400">Deliveries</p>
                      </div>
                      <div className="w-px h-8 bg-gray-200 dark:bg-white/10" />
                      <div className="text-center flex-1">
                        <div className="flex items-center justify-center gap-1">
                          <Truck className="h-4 w-4 text-blue-500" />
                          <span className="text-lg font-bold text-gray-900 dark:text-white">
                            {profile.fleet_size || 0}
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-500 dark:text-gray-400">Fleet</p>
                      </div>
                    </>
                  ) : (
                    <div className="text-center flex-1">
                      <div className="flex items-center justify-center gap-1">
                        <Package className="h-4 w-4 text-orange-500" />
                        <span className="text-lg font-bold text-gray-900 dark:text-white">
                          {profile.stats?.totalLoads || 0}
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400">Loads posted</p>
                    </div>
                  )}
                </div>

                {/* Vehicle types for carriers */}
                {profile.role === "carrier" && profile.vehicle_types?.length > 0 && (
                  <div className="mt-3">
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Vehicles</p>
                    <div className="flex flex-wrap gap-1.5">
                      {profile.vehicle_types.map((vt: string) => {
                        const vtInfo = VEHICLE_TYPES.find((v) => v.value === vt);
                        return (
                          <Badge key={vt} className="bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                            {vtInfo?.icon} {vtInfo?.label || vt}
                          </Badge>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Reviews placeholder */}
                <div className="mt-4 pt-3 border-t border-gray-100 dark:border-white/5">
                  <p className="text-xs text-gray-400 dark:text-gray-500 text-center">
                    Reviews coming soon
                  </p>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
