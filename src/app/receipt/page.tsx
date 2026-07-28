"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, MapPin, Printer } from "lucide-react";
import ContactPhoneButton from "@/components/ContactPhoneButton";
import { formatCurrency, STATUS_LABELS, STORE_INFO, type CartItem } from "@/lib/utils";

interface ReceiptOrder {
  orderNumber: string;
  customerName: string;
  orderType: string;
  status: string;
  paymentStatus: string;
  paymentMethod: string | null;
  items: string;
  subtotal: number;
  deliveryFee: number;
  total: number;
  address: string | null;
  createdAt: string;
  completedAt: string | null;
}

export default function ReceiptPage() {
  const [order, setOrder] = useState<ReceiptOrder | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const loadReceipt = useCallback(async () => {
    const params = new URLSearchParams(window.location.search);
    const orderNumber = params.get("order")?.trim();

    if (!orderNumber) {
      setError("Order number is missing.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`/api/orders/track?orderNumber=${encodeURIComponent(orderNumber)}`);
      const data = await res.json();

      if (!data.success) {
        setError(data.error || "Receipt not found.");
        return;
      }

      setOrder(data.order);
    } catch {
      setError("Could not load the receipt right now.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReceipt();
  }, [loadReceipt]);

  const items: CartItem[] = order ? JSON.parse(order.items || "[]") : [];
  const orderDate = order
    ? new Date(order.completedAt || order.createdAt).toLocaleString("en-ZA", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

  return (
    <main className="mx-auto max-w-2xl px-4 py-10 print:m-0 print:max-w-none print:bg-white print:p-0 print:text-black">
      <div className="mb-6 flex items-center justify-between gap-3 print:hidden">
        <Link href="/track" className="inline-flex items-center gap-2 text-sm text-stone-400">
          <ArrowLeft className="h-4 w-4" />
          Back to tracking
        </Link>
        {order && (
          <button onClick={() => window.print()} className="btn-primary !py-2 text-sm">
            <Printer className="h-4 w-4" />
            Print Receipt
          </button>
        )}
      </div>

      {loading && <p className="text-stone-400">Loading receipt...</p>}

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
          {error}
        </div>
      )}

      {order && (
        <section className="card p-6 print:break-inside-avoid print:border-none print:bg-white print:p-0 print:text-[10.5px] print:leading-tight print:shadow-none">
          <div className="border-b border-charcoal-700 pb-5 print:border-gray-300 print:pb-1.5">
            <h1 className="font-display text-4xl text-white print:text-2xl print:text-black">
              Lee-G&apos;s Pizza
            </h1>
            <p className="text-sm text-stone-400 print:text-xs print:text-gray-600">
              Customer Receipt
            </p>
          </div>

          <div className="mt-5 grid gap-4 text-sm sm:grid-cols-2 print:mt-2.5 print:grid-cols-2 print:gap-1.5 print:text-[10.5px]">
            <div>
              <p className="text-stone-500 print:text-gray-500">Order Number</p>
              <p className="font-mono font-semibold text-brand-orange print:text-black">
                {order.orderNumber}
              </p>
            </div>
            <div>
              <p className="text-stone-500 print:text-gray-500">Date & Time</p>
              <p className="text-white print:text-black">{orderDate}</p>
            </div>
            <div>
              <p className="text-stone-500 print:text-gray-500">Customer</p>
              <p className="text-white print:text-black">{order.customerName}</p>
            </div>
            <div>
              <p className="text-stone-500 print:text-gray-500">Order Type</p>
              <p className="text-white print:text-black">
                {order.orderType === "DELIVERY" ? "Delivery" : "Pickup"}
              </p>
            </div>
            {order.address && (
              <div className="sm:col-span-2">
                <p className="text-stone-500 print:text-gray-500">Delivery Address</p>
                <p className="text-white print:text-black">{order.address}</p>
              </div>
            )}
          </div>

          <div className="mt-6 border-t border-charcoal-700 pt-5 print:mt-2.5 print:border-gray-300 print:pt-2.5">
            <h2 className="mb-3 font-semibold text-white print:mb-2 print:text-black">Items</h2>
            <div className="space-y-3 print:space-y-1">
              {items.map((item) => (
                <div key={item.id} className="flex justify-between gap-4 text-sm print:text-[10.5px]">
                  <div>
                    <p className="text-white print:text-black">
                      {item.quantity}x {item.name}
                      {item.size ? ` (${item.size})` : ""}
                    </p>
                    {item.toppings?.length > 0 && (
                      <p className="text-xs text-brand-orange print:text-gray-600">
                        Toppings: {item.toppings.map((topping) => topping.name).join(", ")}
                      </p>
                    )}
                  </div>
                  <p className="font-semibold text-white print:text-black">
                    {formatCurrency(item.totalPrice)}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 space-y-2 border-t border-charcoal-700 pt-5 text-sm print:mt-2.5 print:space-y-1 print:border-gray-300 print:pt-2.5 print:text-[10.5px]">
            <div className="flex justify-between text-stone-400 print:text-gray-700">
              <span>Subtotal</span>
              <span>{formatCurrency(order.subtotal)}</span>
            </div>
            <div className="flex justify-between text-stone-400 print:text-gray-700">
              <span>Delivery</span>
              <span>{formatCurrency(order.deliveryFee)}</span>
            </div>
            <div className="flex justify-between text-xl font-bold text-brand-gold print:text-base print:text-black">
              <span>Total</span>
              <span>{formatCurrency(order.total)}</span>
            </div>
          </div>

          <div className="mt-6 grid gap-3 border-t border-charcoal-700 pt-5 text-sm sm:grid-cols-2 print:mt-2.5 print:grid-cols-2 print:gap-1.5 print:border-gray-300 print:pt-2.5 print:text-[10.5px]">
            <p className="text-stone-400 print:text-gray-700">
              Payment:{" "}
              <span className="font-semibold text-white print:text-black">
                {order.paymentStatus === "paid" ? "Paid" : "Unpaid"}
              </span>
            </p>
            <p className="text-stone-400 print:text-gray-700">
              Status:{" "}
              <span className="font-semibold text-white print:text-black">
                {STATUS_LABELS[order.status] || order.status}
              </span>
            </p>
          </div>

          <div className="mt-6 border-t border-charcoal-700 pt-5 text-sm print:mt-3 print:border-gray-300 print:pt-2.5 print:text-[10px]">
            <h2 className="font-display text-2xl tracking-wide text-white print:text-base print:text-gray-500">
              {STORE_INFO.name}
            </h2>
            <p className="mt-1 text-stone-400 print:text-gray-600">{STORE_INFO.tagline}</p>

            <div className="mt-3 grid gap-1.5 text-stone-400 print:mt-2 print:text-gray-700">
              <p className="font-semibold uppercase tracking-wide text-white print:text-black">
                Contact
              </p>
              <ContactPhoneButton className="gap-2" iconClassName="h-3.5 w-3.5 print:h-3 print:w-3" />
              <p className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 print:h-3 print:w-3" />
                {STORE_INFO.location}
              </p>
            </div>

            <p className="mt-4 border-t border-charcoal-700 pt-3 text-center text-xs text-stone-500 print:mt-2 print:border-gray-300 print:pt-2 print:text-[9px] print:text-gray-500">
              © {new Date().getFullYear()} {STORE_INFO.name}. All rights reserved.
            </p>
          </div>
        </section>
      )}
    </main>
  );
}
