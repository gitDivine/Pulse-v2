"use client";

import { useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { NIGERIAN_STATES } from "@/lib/constants";
import { formatNaira } from "@/lib/utils/format";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import Link from "next/link";

export default function CheckoutPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const slug = params.slug as string;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [orderCreated, setOrderCreated] = useState(false);
  const [orderNumber, setOrderNumber] = useState("");

  // Buyer details
  const [buyerName, setBuyerName] = useState("");
  const [buyerPhone, setBuyerPhone] = useState("");
  const [buyerEmail, setBuyerEmail] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [deliveryState, setDeliveryState] = useState("");
  const [deliveryCity, setDeliveryCity] = useState("");
  const [notes, setNotes] = useState("");

  // Cart data comes from URL params (JSON encoded)
  const cartData = searchParams.get("cart");
  const cart = cartData ? JSON.parse(decodeURIComponent(cartData)) : [];
  const subtotal = cart.reduce(
    (sum: number, item: { price: number; quantity: number }) =>
      sum + item.price * item.quantity,
    0
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug,
          buyerName,
          buyerPhone,
          buyerEmail: buyerEmail || null,
          deliveryAddress,
          deliveryState,
          deliveryCity,
          notes: notes || null,
          items: cart,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create order");
      }

      const data = await res.json();
      setOrderNumber(data.orderNumber);
      setOrderCreated(true);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  if (orderCreated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center">
          <div className="mx-auto h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
            <ShieldCheck className="h-8 w-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Order Submitted</h1>
          <p className="mt-2 text-sm text-gray-600">
            Your order <span className="font-semibold">{orderNumber}</span> has been submitted.
            The seller will review and verify availability, then send you a payment link.
          </p>
          <p className="mt-4 text-xs text-gray-400">
            No payment has been charged. You&apos;ll only pay after the seller confirms your order.
          </p>
          <Link href={`/store/${slug}`}>
            <Button variant="outline" className="mt-6">
              Back to store
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="mx-auto max-w-2xl px-4 py-4">
          <Link
            href={`/store/${slug}`}
            className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to store
          </Link>
          <h1 className="mt-2 text-xl font-bold text-gray-900">Checkout</h1>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Order summary */}
          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <h2 className="text-sm font-semibold text-gray-900 mb-3">Order Summary</h2>
            {cart.map((item: { id: string; name: string; price: number; quantity: number }) => (
              <div key={item.id} className="flex justify-between py-1">
                <span className="text-sm text-gray-600">
                  {item.name} &times; {item.quantity}
                </span>
                <span className="text-sm text-gray-900">{formatNaira(item.price * item.quantity)}</span>
              </div>
            ))}
            <div className="flex justify-between pt-3 border-t mt-3">
              <span className="text-sm font-semibold text-gray-900">Subtotal</span>
              <span className="text-sm font-bold text-gray-900">{formatNaira(subtotal)}</span>
            </div>
            <p className="text-xs text-gray-400 mt-1">Delivery fee will be confirmed by the seller</p>
          </div>

          {/* Contact details */}
          <div className="rounded-xl border border-gray-200 bg-white p-4 space-y-3">
            <h2 className="text-sm font-semibold text-gray-900">Your Details</h2>
            <Input
              label="Full Name"
              placeholder="Your full name"
              value={buyerName}
              onChange={(e) => setBuyerName(e.target.value)}
              required
            />
            <Input
              label="Phone Number"
              type="tel"
              placeholder="08012345678"
              value={buyerPhone}
              onChange={(e) => setBuyerPhone(e.target.value)}
              required
            />
            <Input
              label="Email (optional)"
              type="email"
              placeholder="you@example.com"
              value={buyerEmail}
              onChange={(e) => setBuyerEmail(e.target.value)}
            />
          </div>

          {/* Delivery address */}
          <div className="rounded-xl border border-gray-200 bg-white p-4 space-y-3">
            <h2 className="text-sm font-semibold text-gray-900">Delivery Address</h2>
            <Input
              label="Address (use landmarks)"
              placeholder="e.g. Off Bode Thomas, after the blue mosque, second gate"
              value={deliveryAddress}
              onChange={(e) => setDeliveryAddress(e.target.value)}
              required
            />
            <div className="grid grid-cols-2 gap-3">
              <Select
                label="State"
                placeholder="Select state"
                value={deliveryState}
                onChange={(e) => setDeliveryState(e.target.value)}
                options={NIGERIAN_STATES.map((s) => ({ value: s, label: s }))}
                required
              />
              <Input
                label="City"
                placeholder="e.g. Ikeja"
                value={deliveryCity}
                onChange={(e) => setDeliveryCity(e.target.value)}
                required
              />
            </div>
            <Input
              label="Notes for delivery (optional)"
              placeholder="Any special instructions"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 text-center">{error}</p>
          )}

          <Button type="submit" loading={loading} className="w-full" size="lg">
            Submit Order
          </Button>

          <p className="text-xs text-gray-400 text-center">
            You won&apos;t be charged now. The seller will verify your order and send a payment link.
          </p>
        </form>
      </main>
    </div>
  );
}
