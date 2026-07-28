"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Search, Clock, CheckCircle2, Bike, Flame, ClipboardList, Printer } from "lucide-react";
import { cn, formatCurrency, STATUS_COLORS, STATUS_LABELS } from "@/lib/utils";

interface TrackedOrder {
  orderNumber: string;
  customerName: string;
  orderType: string;
  status: string;
  channel: string;
  paymentStatus: string;
  total: number;
  createdAt: string;
  completedAt: string | null;
}

const STEPS = ["RECEIVED", "BAKING", "OUT_FOR_DELIVERY", "COMPLETED"];

const STEP_ICONS = {
  RECEIVED: ClipboardList,
  BAKING: Flame,
  OUT_FOR_DELIVERY: Bike,
  READY_FOR_PICKUP: Clock,
  COMPLETED: CheckCircle2,
};

export default function TrackOrderPage() {
  const [orderNumber, setOrderNumber] = useState("");
  const [order, setOrder] = useState<TrackedOrder | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const trackOrder = useCallback(async (value = orderNumber) => {
    const trimmed = value.trim();
    if (!trimmed) {
      setError("Please enter your order number.");
      return;
    }

    setLoading(true);
    setError("");
    setOrder(null);

    try {
      const res = await fetch(`/api/orders/track?orderNumber=${encodeURIComponent(trimmed)}`);
      const data = await res.json();

      if (!data.success) {
        setError(data.error || "Order not found.");
        return;
      }

      setOrder(data.order);
    } catch {
      setError("Could not check your order right now. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [orderNumber]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const initialOrder = params.get("order");
    if (initialOrder) {
      setOrderNumber(initialOrder);
      trackOrder(initialOrder);
    }
  }, [trackOrder]);

  const activeSteps = useMemo(() => {
    if (order?.orderType === "PICKUP") {
      return ["RECEIVED", "BAKING", "READY_FOR_PICKUP", "COMPLETED"];
    }
    return STEPS;
  }, [order?.orderType]);

  const currentIndex = order ? activeSteps.indexOf(order.status) : -1;

  return (
    <main className="mx-auto max-w-3xl px-4 py-12 md:px-6">
      <div className="mb-8 text-center">
        <p className="mb-3 text-sm font-semibold uppercase tracking-[0.3em] text-brand-orange">
          Order Tracking
        </p>
        <h1 className="section-title">Track Your Lee-G&apos;s Order</h1>
        <p className="mt-3 text-stone-400">
          Enter the unique order number you received after checkout.
        </p>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          trackOrder();
        }}
        className="card mb-6 flex flex-col gap-3 p-4 sm:flex-row"
      >
        <input
          value={orderNumber}
          onChange={(e) => setOrderNumber(e.target.value.toUpperCase())}
          placeholder="Example: LG-MABC123-XYZ"
          className="input-field"
        />
        <button disabled={loading} className="btn-primary shrink-0">
          <Search className="h-4 w-4" />
          {loading ? "Checking..." : "Track"}
        </button>
      </form>

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
          {error}
        </div>
      )}

      {order && (
        <section className="card p-6">
          <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="font-mono text-brand-orange">{order.orderNumber}</p>
              <h2 className="mt-1 text-2xl font-bold text-white">
                Hi {order.customerName}, your order is {STATUS_LABELS[order.status] || order.status}
              </h2>
              <p className="mt-2 text-sm text-stone-400">
                {order.orderType === "DELIVERY" ? "Delivery" : "Pickup"} • {order.channel} •{" "}
                {formatCurrency(order.total)}
              </p>
            </div>
            <span
              className={cn(
                "rounded-full border px-3 py-1 text-sm font-semibold",
                STATUS_COLORS[order.status]
              )}
            >
              {STATUS_LABELS[order.status] || order.status}
            </span>
          </div>

          <div className="grid gap-3 sm:grid-cols-4">
            {activeSteps.map((step, index) => {
              const Icon = STEP_ICONS[step as keyof typeof STEP_ICONS] || Clock;
              const isDone = currentIndex >= index || order.status === "COMPLETED";
              const isCurrent = order.status === step;

              return (
                <div
                  key={step}
                  className={cn(
                    "rounded-xl border p-4 text-center",
                    isDone
                      ? "border-brand-orange/40 bg-brand-orange/10 text-white"
                      : "border-charcoal-700 bg-charcoal-900 text-stone-500",
                    isCurrent && "shadow-glow"
                  )}
                >
                  <Icon className="mx-auto mb-2 h-5 w-5" />
                  <p className="text-sm font-semibold">{STATUS_LABELS[step] || step}</p>
                </div>
              );
            })}
          </div>

          <p className="mt-6 text-sm text-stone-500">
            Status updates are emailed to the address entered at checkout when staff update the
            order.
          </p>

          {order.status === "COMPLETED" && (
            <Link
              href={`/receipt?order=${encodeURIComponent(order.orderNumber)}`}
              className="btn-primary mt-5 inline-flex"
            >
              <Printer className="h-4 w-4" />
              Print Receipt
            </Link>
          )}
        </section>
      )}
    </main>
  );
}
