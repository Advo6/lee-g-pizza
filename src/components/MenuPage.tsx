"use client";

import { useState } from "react";
import { Flame, Star, Truck } from "lucide-react";
import PizzaCard from "@/components/PizzaCard";
import CustomizationModal from "@/components/CustomizationModal";
import CartSummary from "@/components/CartSummary";
import { STORE_INFO } from "@/lib/utils";
import type { MenuProduct, MenuTopping } from "@/lib/ai";

interface MenuPageProps {
  products: MenuProduct[];
  toppings: MenuTopping[];
}

const CATEGORY_SECTIONS = [
  { key: "STANDARD", title: "Standard Pizzas", subtitle: "Our classic favourites — Medium & Large" },
  { key: "DOUBLE_DECKER", title: "Double Decker", subtitle: "Two layers of pure indulgence" },
  { key: "TRIPLE_DECKER", title: "Triple Decker", subtitle: "Three stacked layers — go big or go home" },
  { key: "COMBO", title: "Combos", subtitle: "Lee-G's combo deals with add-ons and fries" },
  { key: "SIDE", title: "Sides", subtitle: "Fries, wings, pops, and burgers" },
];

export default function MenuPage({ products, toppings }: MenuPageProps) {
  const [selectedProduct, setSelectedProduct] = useState<MenuProduct | null>(null);

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-charcoal-800">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-red/10 via-charcoal-950 to-brand-orange/5" />
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-brand-orange/10 blur-3xl" />
        <div className="absolute -bottom-10 -left-10 h-48 w-48 rounded-full bg-brand-red/10 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-4 py-16 md:px-6 md:py-24">
          <div className="max-w-2xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-brand-orange/30 bg-brand-orange/10 px-4 py-1.5 text-sm text-brand-orange">
              <Flame className="h-4 w-4" />
              Hot & Fresh — Phalaborwa
            </div>
            <h1 className="section-title">
              ORDER <span className="text-brand-orange">HOT</span> PIZZA
            </h1>
            <p className="mt-4 text-lg text-stone-400">
              {STORE_INFO.tagline}. From creamy chicken classics to loaded triple deckers —
              delivered or ready for pickup.
            </p>

            <div className="mt-8 flex flex-wrap gap-6">
              <div className="flex items-center gap-2 text-sm text-stone-400">
                <Star className="h-4 w-4 text-brand-gold" />
                Premium ingredients
              </div>
              <div className="flex items-center gap-2 text-sm text-stone-400">
                <Truck className="h-4 w-4 text-brand-orange" />
                Delivery & Pickup
              </div>
              <div className="flex items-center gap-2 text-sm text-stone-400">
                <Flame className="h-4 w-4 text-brand-red" />
                Baked fresh to order
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Menu sections */}
      <div className="mx-auto max-w-7xl px-4 py-12 md:px-6">
        {CATEGORY_SECTIONS.map(({ key, title, subtitle }) => {
          const items = products.filter((p) => p.category === key);
          if (items.length === 0) return null;

          return (
            <section key={key} className="mb-16">
              <div className="mb-8">
                <h2 className="font-display text-3xl tracking-wide text-white md:text-4xl">
                  {title}
                </h2>
                <p className="mt-1 text-stone-500">{subtitle}</p>
              </div>

              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {items.map((product) => (
                  <PizzaCard
                    key={product.id}
                    product={product}
                    onCustomize={setSelectedProduct}
                  />
                ))}
              </div>
            </section>
          );
        })}
      </div>

      <CustomizationModal
        product={selectedProduct}
        toppings={toppings}
        onClose={() => setSelectedProduct(null)}
      />

      <CartSummary />
      <div className="h-24" />
    </>
  );
}
