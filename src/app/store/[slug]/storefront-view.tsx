"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import { formatNaira } from "@/lib/utils/format";
import { Button } from "@/components/ui/button";
import { ShoppingCart, MessageCircle, MapPin, X, Plus, Minus, Check, ShoppingBag } from "lucide-react";
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
  const [addedId, setAddedId] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  // Extract unique categories
  const categories = useMemo(() => {
    const cats = new Set(products.map((p) => p.category).filter(Boolean));
    return Array.from(cats) as string[];
  }, [products]);

  const filteredProducts = activeCategory
    ? products.filter((p) => p.category === activeCategory)
    : products;

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
    // Show added feedback
    setAddedId(product.id);
    setTimeout(() => setAddedId(null), 1200);
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
    <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a0a]">
      {/* Header */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-white dark:bg-[#111] border-b border-gray-200 dark:border-white/5"
      >
        <div className="mx-auto max-w-5xl px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{business.name}</h1>
              {business.city && business.state && (
                <p className="mt-1 flex items-center gap-1 text-sm text-gray-500">
                  <MapPin className="h-3.5 w-3.5" />
                  {business.city}, {business.state}
                </p>
              )}
              {business.description && (
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 max-w-lg">{business.description}</p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowChat(true)}
                className="flex items-center gap-2 rounded-full border border-gray-200 dark:border-white/10 px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
              >
                <MessageCircle className="h-4 w-4" />
                Chat
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowCart(true)}
                className="relative flex items-center gap-2 rounded-full bg-orange-600 px-4 py-2 text-sm text-white hover:bg-orange-700 transition-colors shadow-lg shadow-orange-600/20"
              >
                <ShoppingCart className="h-4 w-4" />
                Cart
                <AnimatePresence mode="wait">
                  {cartCount > 0 && (
                    <motion.span
                      key={cartCount}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-[10px] font-bold text-orange-600"
                    >
                      {cartCount}
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.button>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Products */}
      <main className="mx-auto max-w-5xl px-4 py-8">
        {/* Category filter */}
        {categories.length > 1 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 flex flex-wrap gap-2"
          >
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setActiveCategory(null)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                !activeCategory
                  ? "bg-orange-600 text-white shadow-md shadow-orange-600/20"
                  : "bg-white dark:bg-[#111] border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-400 hover:bg-gray-50"
              }`}
            >
              All ({products.length})
            </motion.button>
            {categories.map((cat) => (
              <motion.button
                key={cat}
                whileTap={{ scale: 0.95 }}
                onClick={() => setActiveCategory(cat)}
                className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                  activeCategory === cat
                    ? "bg-orange-600 text-white shadow-md shadow-orange-600/20"
                    : "bg-white dark:bg-[#111] border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-400 hover:bg-gray-50"
                }`}
              >
                {cat}
              </motion.button>
            ))}
          </motion.div>
        )}

        <p className="mb-6 text-sm text-gray-500">
          {filteredProducts.length} product{filteredProducts.length !== 1 ? "s" : ""}
        </p>

        {filteredProducts.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <ShoppingBag className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-lg font-medium text-gray-900 dark:text-white">No products available</p>
            <p className="mt-1 text-sm text-gray-500">Check back later for new items.</p>
          </motion.div>
        ) : (
          <LayoutGroup>
            <motion.div layout className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              <AnimatePresence mode="popLayout">
                {filteredProducts.map((product, i) => (
                  <motion.div
                    key={product.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ type: "spring", stiffness: 300, damping: 25, delay: i * 0.03 }}
                    whileHover={{ y: -4 }}
                    className="group rounded-2xl border border-gray-200 dark:border-white/5 bg-white dark:bg-[#111] overflow-hidden hover:shadow-xl transition-shadow"
                  >
                    {/* Product image */}
                    <div className="aspect-square bg-gray-100 dark:bg-gray-900 flex items-center justify-center overflow-hidden relative">
                      {product.images.length > 0 ? (
                        <img
                          src={product.images[0]}
                          alt={product.name}
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                      ) : (
                        <span className="text-4xl font-light text-gray-300 dark:text-gray-700">
                          {product.name.charAt(0).toUpperCase()}
                        </span>
                      )}
                      {product.compare_at_price && product.compare_at_price > product.price && (
                        <span className="absolute top-2 left-2 rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-bold text-white">
                          {Math.round((1 - product.price / product.compare_at_price) * 100)}% OFF
                        </span>
                      )}
                    </div>
                    <div className="p-3">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{product.name}</p>
                      <div className="mt-1 flex items-center gap-2">
                        <span className="text-sm font-bold text-gray-900 dark:text-white">
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
                      <motion.div whileTap={{ scale: 0.95 }} className="mt-3">
                        <Button
                          size="sm"
                          className="w-full"
                          variant={addedId === product.id ? "secondary" : "primary"}
                          disabled={product.stock_quantity === 0}
                          onClick={() => addToCart(product)}
                        >
                          {addedId === product.id ? (
                            <>
                              <Check className="h-3.5 w-3.5" />
                              Added
                            </>
                          ) : product.stock_quantity === 0 ? (
                            "Out of stock"
                          ) : (
                            "Add to cart"
                          )}
                        </Button>
                      </motion.div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          </LayoutGroup>
        )}
      </main>

      {/* Cart bottom sheet / slide-over */}
      <AnimatePresence>
        {showCart && (
          <div className="fixed inset-0 z-50">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setShowCart(false)}
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 400, damping: 35 }}
              className="fixed right-0 top-0 h-full w-full max-w-md bg-white dark:bg-[#111] shadow-2xl"
            >
              <div className="flex h-full flex-col">
                <div className="flex items-center justify-between border-b border-gray-200 dark:border-white/5 px-6 py-4">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Cart ({cartCount})
                  </h2>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setShowCart(false)}
                    className="rounded-full p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </motion.button>
                </div>

                <div className="flex-1 overflow-y-auto px-6 py-4">
                  {cart.length === 0 ? (
                    <div className="text-center py-12">
                      <ShoppingCart className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-sm text-gray-500">Your cart is empty</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <AnimatePresence>
                        {cart.map((item) => (
                          <motion.div
                            key={item.product.id}
                            layout
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20, height: 0 }}
                            className="flex items-center gap-4"
                          >
                            <div className="h-16 w-16 rounded-xl bg-gray-100 dark:bg-gray-900 flex items-center justify-center shrink-0 overflow-hidden">
                              {item.product.images.length > 0 ? (
                                <img src={item.product.images[0]} alt="" className="h-full w-full object-cover" />
                              ) : (
                                <span className="text-lg text-gray-300">
                                  {item.product.name.charAt(0).toUpperCase()}
                                </span>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                {item.product.name}
                              </p>
                              <p className="text-sm text-gray-500">
                                {formatNaira(item.product.price)}
                              </p>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <motion.button
                                whileTap={{ scale: 0.85 }}
                                onClick={() => updateQuantity(item.product.id, -1)}
                                className="rounded-lg border border-gray-200 dark:border-white/10 p-1.5 hover:bg-gray-50 dark:hover:bg-white/5"
                              >
                                <Minus className="h-3 w-3" />
                              </motion.button>
                              <span className="text-sm font-medium w-6 text-center text-gray-900 dark:text-white">
                                {item.quantity}
                              </span>
                              <motion.button
                                whileTap={{ scale: 0.85 }}
                                onClick={() => updateQuantity(item.product.id, 1)}
                                className="rounded-lg border border-gray-200 dark:border-white/10 p-1.5 hover:bg-gray-50 dark:hover:bg-white/5"
                                disabled={item.quantity >= item.product.stock_quantity}
                              >
                                <Plus className="h-3 w-3" />
                              </motion.button>
                            </div>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                  )}
                </div>

                {cart.length > 0 && (
                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="border-t border-gray-200 dark:border-white/5 px-6 py-4 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Subtotal</span>
                      <span className="text-lg font-bold text-gray-900 dark:text-white">{formatNaira(cartTotal)}</span>
                    </div>
                    <motion.div whileTap={{ scale: 0.98 }}>
                      <Button className="w-full shadow-lg shadow-orange-600/20" size="lg">
                        Proceed to checkout
                      </Button>
                    </motion.div>
                    <p className="text-xs text-gray-400 text-center">
                      Delivery fee calculated at checkout
                    </p>
                  </motion.div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Chat widget */}
      <AnimatePresence>
        {showChat && (
          <ChatWidget
            businessId={business.id}
            businessName={business.name}
            onClose={() => setShowChat(false)}
          />
        )}
      </AnimatePresence>

      {/* Floating chat button */}
      <AnimatePresence>
        {!showChat && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setShowChat(true)}
            className="fixed bottom-6 right-6 flex h-14 w-14 items-center justify-center rounded-full bg-orange-600 text-white shadow-xl shadow-orange-600/30 z-40"
          >
            <MessageCircle className="h-6 w-6" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="border-t border-gray-200 dark:border-white/5 bg-white dark:bg-[#111] py-4 text-center">
        <p className="text-xs text-gray-400">
          Powered by <span className="font-semibold text-orange-500">PULSE</span> &mdash; Africa&apos;s Commerce Nervous System
        </p>
      </footer>
    </div>
  );
}
