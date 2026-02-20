"use client";

import { useState } from "react";
import { formatNaira } from "@/lib/utils/format";
import { Button } from "@/components/ui/button";
import { ShoppingCart, MessageCircle, MapPin, X, Plus, Minus } from "lucide-react";
import { ChatWidget } from "@/components/chat/chat-widget";

interface Business {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logo_url: string | null;
  cover_url: string | null;
  category: string;
  city: string | null;
  state: string | null;
}

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  compare_at_price: number | null;
  images: string[];
  stock_quantity: number;
  category: string | null;
}

interface CartItem {
  product: Product;
  quantity: number;
}

interface StorefrontViewProps {
  business: Business;
  products: Product[];
}

export function StorefrontView({ business, products }: StorefrontViewProps) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [showChat, setShowChat] = useState(false);

  function addToCart(product: Product) {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: Math.min(item.quantity + 1, product.stock_quantity) }
            : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  }

  function updateQuantity(productId: string, delta: number) {
    setCart((prev) =>
      prev
        .map((item) =>
          item.product.id === productId
            ? { ...item, quantity: item.quantity + delta }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  }

  const cartTotal = cart.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="mx-auto max-w-5xl px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{business.name}</h1>
              {business.city && business.state && (
                <p className="mt-1 flex items-center gap-1 text-sm text-gray-500">
                  <MapPin className="h-3.5 w-3.5" />
                  {business.city}, {business.state}
                </p>
              )}
              {business.description && (
                <p className="mt-2 text-sm text-gray-600 max-w-lg">{business.description}</p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowChat(true)}
                className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
              >
                <MessageCircle className="h-4 w-4" />
                Chat
              </button>
              <button
                onClick={() => setShowCart(true)}
                className="relative flex items-center gap-2 rounded-lg bg-orange-600 px-3 py-2 text-sm text-white hover:bg-orange-700 transition-colors"
              >
                <ShoppingCart className="h-4 w-4" />
                Cart
                {cartCount > 0 && (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-[10px] font-bold text-orange-600">
                    {cartCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Products grid */}
      <main className="mx-auto max-w-5xl px-4 py-8">
        <p className="mb-6 text-sm text-gray-500">
          {products.length} product{products.length !== 1 ? "s" : ""}
        </p>

        {products.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-lg font-medium text-gray-900">No products available</p>
            <p className="mt-1 text-sm text-gray-500">Check back later for new items.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {products.map((product) => (
              <div
                key={product.id}
                className="group rounded-xl border border-gray-200 bg-white overflow-hidden hover:shadow-md transition-shadow"
              >
                {/* Product image placeholder */}
                <div className="aspect-square bg-gray-100 flex items-center justify-center">
                  {product.images.length > 0 ? (
                    <img
                      src={product.images[0]}
                      alt={product.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="text-3xl text-gray-300">
                      {product.name.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="p-3">
                  <p className="text-sm font-medium text-gray-900 truncate">{product.name}</p>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="text-sm font-bold text-gray-900">
                      {formatNaira(product.price)}
                    </span>
                    {product.compare_at_price && product.compare_at_price > product.price && (
                      <span className="text-xs text-gray-400 line-through">
                        {formatNaira(product.compare_at_price)}
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-xs text-gray-400">
                    {product.stock_quantity > 0
                      ? `${product.stock_quantity} in stock`
                      : "Out of stock"}
                  </p>
                  <Button
                    size="sm"
                    className="mt-3 w-full"
                    disabled={product.stock_quantity === 0}
                    onClick={() => addToCart(product)}
                  >
                    {product.stock_quantity === 0 ? "Out of stock" : "Add to cart"}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Cart slide-over */}
      {showCart && (
        <div className="fixed inset-0 z-50">
          <div className="fixed inset-0 bg-black/50" onClick={() => setShowCart(false)} />
          <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-xl">
            <div className="flex h-full flex-col">
              <div className="flex items-center justify-between border-b px-6 py-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  Cart ({cartCount})
                </h2>
                <button onClick={() => setShowCart(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-6 py-4">
                {cart.length === 0 ? (
                  <p className="text-center text-sm text-gray-500 py-8">Your cart is empty</p>
                ) : (
                  <div className="space-y-4">
                    {cart.map((item) => (
                      <div key={item.product.id} className="flex items-center gap-4">
                        <div className="h-16 w-16 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                          <span className="text-lg text-gray-300">
                            {item.product.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {item.product.name}
                          </p>
                          <p className="text-sm text-gray-500">
                            {formatNaira(item.product.price)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => updateQuantity(item.product.id, -1)}
                            className="rounded-md border p-1 hover:bg-gray-50"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="text-sm font-medium w-6 text-center">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.product.id, 1)}
                            className="rounded-md border p-1 hover:bg-gray-50"
                            disabled={item.quantity >= item.product.stock_quantity}
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {cart.length > 0 && (
                <div className="border-t px-6 py-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Subtotal</span>
                    <span className="text-lg font-bold text-gray-900">{formatNaira(cartTotal)}</span>
                  </div>
                  <Button className="w-full" size="lg">
                    Proceed to checkout
                  </Button>
                  <p className="text-xs text-gray-400 text-center">
                    Delivery fee calculated at checkout
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Chat widget */}
      {showChat && (
        <ChatWidget
          businessId={business.id}
          businessName={business.name}
          onClose={() => setShowChat(false)}
        />
      )}

      {/* Floating chat button (when chat is closed) */}
      {!showChat && (
        <button
          onClick={() => setShowChat(true)}
          className="fixed bottom-6 right-6 flex h-14 w-14 items-center justify-center rounded-full bg-orange-600 text-white shadow-lg hover:bg-orange-700 transition-all hover:scale-105 active:scale-95"
        >
          <MessageCircle className="h-6 w-6" />
        </button>
      )}

      {/* PULSE branding */}
      <footer className="border-t border-gray-200 bg-white py-4 text-center">
        <p className="text-xs text-gray-400">
          Powered by <span className="font-semibold text-orange-500">PULSE</span> &mdash; Africa&apos;s Commerce Nervous System
        </p>
      </footer>
    </div>
  );
}
