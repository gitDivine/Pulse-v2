export const APP_NAME = "PULSE";
export const APP_TAGLINE = "Africa's Commerce Nervous System";
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export const NIGERIAN_STATES = [
  "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue",
  "Borno", "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu",
  "FCT", "Gombe", "Imo", "Jigawa", "Kaduna", "Kano", "Katsina", "Kebbi",
  "Kogi", "Kwara", "Lagos", "Nasarawa", "Niger", "Ogun", "Ondo", "Osun",
  "Oyo", "Plateau", "Rivers", "Sokoto", "Taraba", "Yobe", "Zamfara",
] as const;

export const BUSINESS_CATEGORIES = [
  "Fashion & Clothing",
  "Food & Beverages",
  "Electronics & Gadgets",
  "Beauty & Skincare",
  "Home & Furniture",
  "Health & Pharmacy",
  "Agriculture & Farm Produce",
  "Building & Construction",
  "Auto Parts & Accessories",
  "Books & Stationery",
  "Fabric & Textiles",
  "General Merchandise",
] as const;

export const NOTIFICATION_PRIORITIES = {
  critical: { label: "Critical", respectsQuietHours: false },
  normal: { label: "Normal", respectsQuietHours: true },
  low: { label: "Low", respectsQuietHours: true },
} as const;

export const ORDER_STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending: { label: "Pending", color: "bg-yellow-100 text-yellow-800" },
  confirmed: { label: "Confirmed", color: "bg-blue-100 text-blue-800" },
  payment_sent: { label: "Payment Sent", color: "bg-purple-100 text-purple-800" },
  paid: { label: "Paid", color: "bg-green-100 text-green-800" },
  preparing: { label: "Preparing", color: "bg-indigo-100 text-indigo-800" },
  shipped: { label: "Shipped", color: "bg-cyan-100 text-cyan-800" },
  delivered: { label: "Delivered", color: "bg-emerald-100 text-emerald-800" },
  cancelled: { label: "Cancelled", color: "bg-red-100 text-red-800" },
  disputed: { label: "Disputed", color: "bg-orange-100 text-orange-800" },
};
