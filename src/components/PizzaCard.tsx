"use client";

import { useState } from "react";
import Image from "next/image";
import { Plus } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import type { MenuProduct } from "@/lib/ai";

const FALLBACK_PIZZA_IMAGE =
  "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&q=80";

interface PizzaCardProps {
  product: MenuProduct;
  onCustomize: (product: MenuProduct) => void;
}

export default function PizzaCard({ product, onCustomize }: PizzaCardProps) {
  const [imageSrc, setImageSrc] = useState(
    product.imageUrl || FALLBACK_PIZZA_IMAGE
  );
  const isFixedPriceItem = product.category === "SIDE" || product.category === "COMBO";
  const isCombo = product.category === "COMBO";
  const fromPrice = isFixedPriceItem
    ? product.priceFixed
    : product.priceMedium;

  const categoryBadge: Record<string, string> = {
    STANDARD: "Standard",
    DOUBLE_DECKER: "Double Decker",
    TRIPLE_DECKER: "Triple Decker",
    COMBO: "Combo",
    SIDE: "Side",
  };

  return (
    <article className="card group overflow-hidden transition-all duration-300 hover:border-brand-orange/30 hover:shadow-glow">
      <div className="relative aspect-[4/3] overflow-hidden">
        <Image
          src={imageSrc}
          alt={product.name}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          onError={() => {
            if (imageSrc !== FALLBACK_PIZZA_IMAGE) {
              setImageSrc(FALLBACK_PIZZA_IMAGE);
            }
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-charcoal-950 via-transparent to-transparent" />
        <span className="absolute left-3 top-3 rounded-full bg-charcoal-950/80 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-brand-orange backdrop-blur-sm">
          {categoryBadge[product.category] || product.category}
        </span>
      </div>

      <div className="p-5">
        <h3 className="text-lg font-bold text-white">{product.name}</h3>
        <p className="mt-1 line-clamp-2 text-sm text-stone-400">{product.description}</p>

        <div className="mt-4 flex items-end justify-between gap-3">
          <div>
            <p className="text-xs text-stone-500">{isFixedPriceItem ? "Price" : "From"}</p>
            <p className="text-xl font-bold text-brand-gold">
              {formatCurrency(fromPrice ?? 0)}
              {!isFixedPriceItem && (
                <span className="ml-1 text-xs font-normal text-stone-500">/ med</span>
              )}
            </p>
          </div>

          <button
            onClick={() => onCustomize(product)}
            className="btn-primary !px-4 !py-2.5 text-sm"
          >
            <Plus className="h-4 w-4" />
            {isCombo ? "Customize" : isFixedPriceItem ? "Add to Cart" : "Customize"}
          </button>
        </div>
      </div>
    </article>
  );
}
