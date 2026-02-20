import Link from "next/link";
import {
  MapPin,
  Truck,
  ShoppingBag,
  Package,
  ArrowRight,
  Zap,
  Shield,
  Globe,
} from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="border-b border-gray-100">
        <div className="mx-auto max-w-6xl flex items-center justify-between px-6 py-4">
          <span className="text-2xl font-bold text-orange-500">PULSE</span>
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700 transition-colors"
            >
              Get started free
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-6 py-20 lg:py-32">
        <div className="max-w-3xl">
          <p className="text-sm font-medium text-orange-600 mb-4">
            SCOUT &middot; HAUL &middot; FLOW &middot; CONVOY
          </p>
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 lg:text-6xl lg:leading-tight">
            Africa&apos;s Commerce{" "}
            <span className="text-orange-500">Nervous System</span>
          </h1>
          <p className="mt-6 text-lg text-gray-600 max-w-2xl leading-relaxed">
            One platform to manage your orders, inventory, payments, customer
            communication, and logistics. Built for how African businesses actually
            work.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-4">
            <Link
              href="/signup"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-orange-600 px-6 py-3 text-base font-medium text-white hover:bg-orange-700 transition-colors"
            >
              Start selling for free
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="#engines"
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 px-6 py-3 text-base font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              See how it works
            </Link>
          </div>
        </div>
      </section>

      {/* Four engines */}
      <section id="engines" className="border-t border-gray-100 bg-gray-50 py-20">
        <div className="mx-auto max-w-6xl px-6">
          <p className="text-sm font-medium text-orange-600 mb-2">Four Engines, One System</p>
          <h2 className="text-3xl font-bold text-gray-900">
            Everything connected. Everything intelligent.
          </h2>

          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: MapPin,
                name: "SCOUT",
                label: "Location Layer",
                description:
                  "Crowdsourced address intelligence. Makes every location findable using landmarks, not postcodes.",
                color: "text-blue-600 bg-blue-50",
              },
              {
                icon: Truck,
                name: "HAUL",
                label: "Movement Layer",
                description:
                  "The freight marketplace. Find carriers, build relationships, coordinate shipments with full transparency.",
                color: "text-green-600 bg-green-50",
              },
              {
                icon: ShoppingBag,
                name: "FLOW",
                label: "Commerce Layer",
                description:
                  "Your business operating system. Orders, inventory, payments, and customer communication in one place.",
                color: "text-orange-600 bg-orange-50",
              },
              {
                icon: Package,
                name: "CONVOY",
                label: "Shared Freight",
                description:
                  "Share a truck with other businesses heading the same way. Pay a fraction of the full freight cost.",
                color: "text-purple-600 bg-purple-50",
              },
            ].map((engine) => {
              const Icon = engine.icon;
              return (
                <div
                  key={engine.name}
                  className="rounded-xl border border-gray-200 bg-white p-6 hover:shadow-md transition-shadow"
                >
                  <div className={`inline-flex rounded-lg p-2.5 ${engine.color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-4 text-lg font-bold text-gray-900">{engine.name}</h3>
                  <p className="text-sm text-orange-600">{engine.label}</p>
                  <p className="mt-2 text-sm text-gray-600 leading-relaxed">
                    {engine.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Value props */}
      <section className="py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid grid-cols-1 gap-12 sm:grid-cols-3">
            {[
              {
                icon: Zap,
                title: "AI prepares. You decide.",
                description:
                  "Every recommendation is staged for your approval. No money moves, no carrier dispatches without your explicit say-so.",
              },
              {
                icon: Shield,
                title: "Built for trust",
                description:
                  "Verified carriers, transparent pricing, dispute resolution, and buyer protection. Trust is the foundation.",
              },
              {
                icon: Globe,
                title: "$0 to start",
                description:
                  "No setup fees, no monthly minimums. You only pay transaction fees when you actually sell. Start with nothing, grow with revenue.",
              },
            ].map((prop) => {
              const Icon = prop.icon;
              return (
                <div key={prop.title}>
                  <Icon className="h-6 w-6 text-orange-500" />
                  <h3 className="mt-3 text-lg font-semibold text-gray-900">{prop.title}</h3>
                  <p className="mt-2 text-sm text-gray-600 leading-relaxed">{prop.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-gray-100 bg-gray-900 py-20">
        <div className="mx-auto max-w-6xl px-6 text-center">
          <h2 className="text-3xl font-bold text-white">
            Ready to run your business properly?
          </h2>
          <p className="mt-4 text-gray-400 max-w-lg mx-auto">
            Join PULSE and get a complete commerce operating system — orders, inventory, payments, logistics — all in one place.
          </p>
          <Link
            href="/signup"
            className="mt-8 inline-flex items-center gap-2 rounded-lg bg-orange-600 px-8 py-3.5 text-base font-medium text-white hover:bg-orange-700 transition-colors"
          >
            Get started for free
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-8">
        <div className="mx-auto max-w-6xl px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-sm text-gray-400">
            &copy; {new Date().getFullYear()} PULSE. Built for African commerce.
          </span>
          <div className="flex gap-6 text-sm text-gray-400">
            <span>SCOUT</span>
            <span>HAUL</span>
            <span>FLOW</span>
            <span>CONVOY</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
