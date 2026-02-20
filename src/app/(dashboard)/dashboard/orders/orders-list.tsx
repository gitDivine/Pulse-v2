"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { formatNaira, timeAgo } from "@/lib/utils/format";
import { ORDER_STATUS_LABELS } from "@/lib/constants";
import { ShoppingCart, ChevronDown, ChevronUp, Check, X, Truck } from "lucide-react";

interface OrderItem {
  id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

interface Order {
  id: string;
  order_number: string;
  buyer_name: string;
  buyer_phone: string;
  delivery_address: string;
  delivery_city: string | null;
  delivery_state: string | null;
  status: string;
  subtotal: number;
  delivery_fee: number;
  total: number;
  notes: string | null;
  created_at: string;
  order_items: OrderItem[];
}

interface OrdersListProps {
  orders: Order[];
}

export function OrdersList({ orders }: OrdersListProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("all");
  const [loading, setLoading] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const filteredOrders = filter === "all"
    ? orders
    : orders.filter((o) => o.status === filter);

  const statusCounts = orders.reduce((acc, o) => {
    acc[o.status] = (acc[o.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  async function updateStatus(orderId: string, status: string) {
    setLoading(orderId);
    const updates: Record<string, unknown> = { status };
    if (status === "confirmed") updates.confirmed_at = new Date().toISOString();
    if (status === "shipped") updates.shipped_at = new Date().toISOString();
    if (status === "delivered") updates.delivered_at = new Date().toISOString();
    if (status === "cancelled") updates.cancelled_at = new Date().toISOString();

    await supabase.from("orders").update(updates).eq("id", orderId);
    setLoading(null);
    router.refresh();
  }

  const filterTabs = [
    { value: "all", label: "All", count: orders.length },
    { value: "pending", label: "Pending", count: statusCounts.pending || 0 },
    { value: "paid", label: "Paid", count: statusCounts.paid || 0 },
    { value: "confirmed", label: "Confirmed", count: statusCounts.confirmed || 0 },
    { value: "shipped", label: "Shipped", count: statusCounts.shipped || 0 },
    { value: "delivered", label: "Delivered", count: statusCounts.delivered || 0 },
  ];

  return (
    <div className="space-y-4">
      {/* Filter tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {filterTabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setFilter(tab.value)}
            className={`flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
              filter === tab.value
                ? "bg-orange-100 text-orange-700"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {tab.label}
            {tab.count > 0 && (
              <span className="text-xs">({tab.count})</span>
            )}
          </button>
        ))}
      </div>

      {/* Orders */}
      {filteredOrders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <ShoppingCart className="h-12 w-12 text-gray-300 mb-4" />
          <p className="text-lg font-medium text-gray-900">No orders yet</p>
          <p className="mt-1 text-sm text-gray-500">Orders will appear here when buyers purchase from your store.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredOrders.map((order) => {
            const statusInfo = ORDER_STATUS_LABELS[order.status] || {
              label: order.status,
              color: "bg-gray-100 text-gray-800",
            };
            const isExpanded = expandedId === order.id;

            return (
              <Card key={order.id} className="p-0 overflow-hidden">
                {/* Order header */}
                <button
                  onClick={() => setExpandedId(isExpanded ? null : order.id)}
                  className="flex w-full items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-gray-900">
                        {order.order_number}
                      </span>
                      <Badge className={statusInfo.color}>{statusInfo.label}</Badge>
                    </div>
                    <p className="mt-1 text-sm text-gray-500">
                      {order.buyer_name} &middot; {timeAgo(order.created_at)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-gray-900">
                      {formatNaira(order.total)}
                    </span>
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4 text-gray-400" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-gray-400" />
                    )}
                  </div>
                </button>

                {/* Expanded details */}
                {isExpanded && (
                  <div className="border-t border-gray-100 p-4 space-y-4">
                    {/* Items */}
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase mb-2">Items</p>
                      {order.order_items.map((item) => (
                        <div key={item.id} className="flex justify-between py-1">
                          <span className="text-sm text-gray-700">
                            {item.product_name} &times; {item.quantity}
                          </span>
                          <span className="text-sm text-gray-900">
                            {formatNaira(item.total_price)}
                          </span>
                        </div>
                      ))}
                      <div className="flex justify-between pt-2 border-t mt-2">
                        <span className="text-sm font-medium text-gray-900">Total</span>
                        <span className="text-sm font-bold text-gray-900">{formatNaira(order.total)}</span>
                      </div>
                    </div>

                    {/* Delivery info */}
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase mb-1">Delivery</p>
                      <p className="text-sm text-gray-700">{order.delivery_address}</p>
                      {order.delivery_city && (
                        <p className="text-sm text-gray-500">{order.delivery_city}, {order.delivery_state}</p>
                      )}
                      <p className="text-sm text-gray-500 mt-1">{order.buyer_phone}</p>
                    </div>

                    {order.notes && (
                      <div>
                        <p className="text-xs font-medium text-gray-500 uppercase mb-1">Notes</p>
                        <p className="text-sm text-gray-700">{order.notes}</p>
                      </div>
                    )}

                    {/* Actions — consent zone three */}
                    <div className="flex gap-2 pt-2">
                      {order.status === "paid" && (
                        <Button
                          size="sm"
                          onClick={() => updateStatus(order.id, "confirmed")}
                          loading={loading === order.id}
                        >
                          <Check className="h-4 w-4" />
                          Confirm Order
                        </Button>
                      )}
                      {order.status === "confirmed" && (
                        <Button
                          size="sm"
                          onClick={() => updateStatus(order.id, "shipped")}
                          loading={loading === order.id}
                        >
                          <Truck className="h-4 w-4" />
                          Mark Shipped
                        </Button>
                      )}
                      {order.status === "shipped" && (
                        <Button
                          size="sm"
                          onClick={() => updateStatus(order.id, "delivered")}
                          loading={loading === order.id}
                        >
                          <Check className="h-4 w-4" />
                          Mark Delivered
                        </Button>
                      )}
                      {["pending", "paid", "confirmed"].includes(order.status) && (
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => {
                            if (confirm("Cancel this order?")) {
                              updateStatus(order.id, "cancelled");
                            }
                          }}
                          loading={loading === order.id}
                        >
                          <X className="h-4 w-4" />
                          Cancel
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
