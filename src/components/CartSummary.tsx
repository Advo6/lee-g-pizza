"use client";

import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { useCart } from "@/lib/cart-context";
import { formatCurrency } from "@/lib/utils";

export default function CartSummary() {
  const { itemCount, subtotal } = useCart();

  if (itemCount === 0) return null;

  return (
    <div className="fixed bottom-24 left-1/2 z-30 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 animate-slide-up">
      <div className="flex items-center justify-between gap-4 rounded-2xl border border-brand-orange/30 bg-charcoal-900/95 px-5 py-4 shadow-glow backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-brand-orange/20">
            <ShoppingCart className="h-5 w-5 text-brand-orange" />
            <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-brand-red text-xs font-bold text-white">
              {itemCount}
            </span>
          </div>
          <div>
            <p className="text-sm text-stone-400">
              {itemCount} item{itemCount !== 1 ? "s" : ""}
            </p>
            <p className="text-lg font-bold text-white">{formatCurrency(subtotal)}</p>
          </div>
        </div>

        <Link href="/checkout" className="btn-primary !px-5 !py-2.5 text-sm whitespace-nowrap">
          Checkout
        </Link>
      </div>
    </div>
  );
}
