import type { LucideIcon } from "lucide-react";
import {
  Sparkles, PlusCircle, Package, Users, Banknote, Rocket,
  Search, Gavel, MapPin, Wallet, Radio, Star,
} from "lucide-react";

export interface TourStep {
  id: string;
  icon: LucideIcon;
  title: string;
  description: string;
  cta?: { label: string; href: string };
}

export const SHIPPER_TOUR_STEPS: TourStep[] = [
  {
    id: "welcome",
    icon: Sparkles,
    title: "Welcome to PULSE!",
    description: "Let's show you how to ship smarter. This quick tour will walk you through the key features.",
  },
  {
    id: "post-load",
    icon: PlusCircle,
    title: "Post a Load",
    description: "Create a shipment with your route, cargo details, and budget. Carriers will start bidding within minutes.",
  },
  {
    id: "my-loads",
    icon: Package,
    title: "Track Your Loads",
    description: "See all your loads in one place. Review incoming bids, accept a carrier, and track delivery progress in real-time.",
  },
  {
    id: "find-carriers",
    icon: Users,
    title: "Find Carriers",
    description: "Browse verified carriers, save your favourites, and invite them directly to bid on your loads.",
  },
  {
    id: "payment",
    icon: Banknote,
    title: "Transparent Pricing",
    description: "A 7% platform fee is added at checkout. Carriers receive exactly what they bid — no hidden costs.",
  },
  {
    id: "reviews",
    icon: Star,
    title: "Ratings & Reviews",
    description: "After a delivery is confirmed, rate your carrier. Your rating is visible on your dashboard — tap it to see all your reviews.",
  },
  {
    id: "done",
    icon: Rocket,
    title: "You're all set!",
    description: "Start by posting your first load and let carriers come to you.",
    cta: { label: "Post your first load", href: "/shipper/post-load" },
  },
];

export const CARRIER_TOUR_STEPS: TourStep[] = [
  {
    id: "welcome",
    icon: Sparkles,
    title: "Welcome to PULSE!",
    description: "Let's help you find loads and grow your business. Here's a quick tour of everything you need.",
  },
  {
    id: "load-board",
    icon: Search,
    title: "Load Board",
    description: "Browse available loads, filter by route and cargo type, and see shipper invitations — all in one place.",
  },
  {
    id: "bidding",
    icon: Gavel,
    title: "Place Bids",
    description: "Bid on loads that match your route. Track all your bids on the My Bids page — pending, accepted, or withdrawn.",
  },
  {
    id: "trips",
    icon: MapPin,
    title: "Manage Trips",
    description: "Once your bid is accepted, manage the delivery here. Update pickup, transit, and delivery status, and chat with the shipper.",
  },
  {
    id: "earnings",
    icon: Wallet,
    title: "Track Earnings",
    description: "See your completed trips and payment history. You receive exactly what you bid — no deductions.",
  },
  {
    id: "availability",
    icon: Radio,
    title: "Set Your Availability",
    description: "Toggle your status so shippers can find you in the carrier directory. It updates automatically when you're active.",
  },
  {
    id: "reviews",
    icon: Star,
    title: "Ratings & Reviews",
    description: "After a delivery is confirmed, both you and the shipper can leave reviews. Your rating shows on your dashboard — tap it to see all feedback.",
  },
  {
    id: "done",
    icon: Rocket,
    title: "You're ready to haul!",
    description: "Start by browsing the load board and placing your first bid.",
    cta: { label: "Browse the load board", href: "/carrier/load-board" },
  },
];

export function getTourSteps(role: "shipper" | "carrier"): TourStep[] {
  return role === "shipper" ? SHIPPER_TOUR_STEPS : CARRIER_TOUR_STEPS;
}
