export const APP_NAME = "PULSE";
export const APP_TAGLINE = "Africa's Logistics Nervous System";
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export const NIGERIAN_STATES = [
  "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue",
  "Borno", "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu",
  "FCT", "Gombe", "Imo", "Jigawa", "Kaduna", "Kano", "Katsina", "Kebbi",
  "Kogi", "Kwara", "Lagos", "Nasarawa", "Niger", "Ogun", "Ondo", "Osun",
  "Oyo", "Plateau", "Rivers", "Sokoto", "Taraba", "Yobe", "Zamfara",
] as const;

export const CARGO_TYPES = [
  { value: "general", label: "General Cargo" },
  { value: "fragile", label: "Fragile Items" },
  { value: "perishable", label: "Perishable Goods" },
  { value: "livestock", label: "Livestock" },
  { value: "heavy_machinery", label: "Heavy Machinery" },
  { value: "documents", label: "Documents" },
  { value: "electronics", label: "Electronics" },
  { value: "building_materials", label: "Building Materials" },
] as const;

export const VEHICLE_TYPES = [
  { value: "motorcycle", label: "Motorcycle", icon: "🏍️" },
  { value: "car", label: "Car", icon: "🚗" },
  { value: "van", label: "Van", icon: "🚐" },
  { value: "pickup_truck", label: "Pickup Truck", icon: "🛻" },
  { value: "box_truck", label: "Box Truck", icon: "📦" },
  { value: "flatbed", label: "Flatbed", icon: "🚛" },
  { value: "trailer", label: "Trailer", icon: "🚚" },
  { value: "refrigerated", label: "Refrigerated", icon: "❄️" },
] as const;

export const LOAD_STATUS_LABELS: Record<string, { label: string; color: string }> = {
  draft: { label: "Draft", color: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300" },
  posted: { label: "Posted", color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400" },
  bidding: { label: "Bidding", color: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400" },
  accepted: { label: "Accepted", color: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400" },
  in_transit: { label: "In Transit", color: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400" },
  delivered: { label: "Delivered", color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400" },
  completed: { label: "Completed", color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" },
  cancelled: { label: "Cancelled", color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400" },
};

export const BID_STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending: { label: "Pending", color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400" },
  accepted: { label: "Accepted", color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" },
  rejected: { label: "Rejected", color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400" },
  withdrawn: { label: "Withdrawn", color: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300" },
};

export const TRIP_STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending: { label: "Pending Pickup", color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400" },
  pickup: { label: "At Pickup", color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400" },
  in_transit: { label: "In Transit", color: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400" },
  delivered: { label: "Delivered", color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400" },
  confirmed: { label: "Confirmed", color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" },
  disputed: { label: "Disputed", color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400" },
};

export const RATING_OPTIONS = [
  { value: "", label: "Any rating" },
  { value: "3", label: "3+ stars" },
  { value: "4", label: "4+ stars" },
  { value: "4.5", label: "4.5+ stars" },
] as const;

export const VERIFICATION_LABELS: Record<string, { label: string; color: string }> = {
  phone: { label: "Phone Verified", color: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300" },
  bvn_nin: { label: "ID Verified", color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400" },
  cac: { label: "CAC Verified", color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" },
};

export const NOTIFICATION_PRIORITIES = {
  critical: { label: "Critical", respectsQuietHours: false },
  normal: { label: "Normal", respectsQuietHours: true },
  low: { label: "Low", respectsQuietHours: true },
} as const;
