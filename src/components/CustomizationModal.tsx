"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { X, ChevronLeft, ChevronRight, Check } from "lucide-react";
import { useCart } from "@/lib/cart-context";
import {
  CRUST_SURCHARGE,
  CRUST_TYPES,
  formatCurrency,
  getProductPrice,
  getToppingPrice,
  type CrustType,
  PIZZA_SIZES,
  type PizzaSize,
} from "@/lib/utils";
import type { MenuProduct, MenuTopping } from "@/lib/ai";
import { cn } from "@/lib/utils";

interface CustomizationModalProps {
  product: MenuProduct | null;
  toppings: MenuTopping[];
  onClose: () => void;
}

export default function CustomizationModal({
  product,
  toppings,
  onClose,
}: CustomizationModalProps) {
  const { addItem } = useCart();
  const [step, setStep] = useState(1);
  const [size, setSize] = useState<PizzaSize>("Medium");
  const [crust, setCrust] = useState<CrustType>("Classic");
  const [selectedToppings, setSelectedToppings] = useState<Set<string>>(new Set());
  const [quantity, setQuantity] = useState(1);

  const isSide = product?.category === "SIDE";
  const isCombo = product?.category === "COMBO";
  const isFixedPriceItem = isSide || isCombo;
  const canAddToppings = !isSide;
  const totalSteps = isSide ? 1 : 3;

  useEffect(() => {
    if (product) {
      setStep(1);
      setSize("Medium");
      setCrust("Classic");
      setSelectedToppings(new Set());
      setQuantity(1);
    }
  }, [product]);

  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handleClose]);

  const basePrice = useMemo(() => {
    if (!product) return 0;
    if (isFixedPriceItem) return product.priceFixed ?? 0;
    return getProductPrice(product, size) + CRUST_SURCHARGE[crust][size];
  }, [product, isFixedPriceItem, size, crust]);

  const toppingsList = useMemo(() => {
    if (!canAddToppings) return [];
    return toppings
      .filter((t) => selectedToppings.has(t.id))
      .map((t) => ({
        id: t.id,
        name: t.name,
        price: getToppingPrice(t),
      }));
  }, [toppings, selectedToppings, canAddToppings]);

  const toppingsPrice = useMemo(
    () => toppingsList.reduce((s, t) => s + t.price, 0),
    [toppingsList]
  );

  const unitPrice = basePrice + toppingsPrice;
  const totalPrice = unitPrice * quantity;

  const toggleTopping = (id: string) => {
    setSelectedToppings((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleAddToCart = () => {
    if (!product) return;
    addItem({
      productId: product.id,
      name: product.name,
      size: isFixedPriceItem ? undefined : size,
      crust: isFixedPriceItem ? undefined : crust,
      toppings: toppingsList,
      basePrice,
      toppingsPrice,
      totalPrice,
      quantity,
    });
    handleClose();
  };

  if (!product) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={handleClose}
      />

      <div className="relative flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl border border-charcoal-700 bg-charcoal-900 shadow-2xl sm:rounded-3xl animate-slide-up">
        {/* Header */}
        <div className="relative h-36 shrink-0">
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-charcoal-900 via-charcoal-900/60 to-transparent" />
          <button
            onClick={handleClose}
            className="absolute right-4 top-4 rounded-full bg-charcoal-950/70 p-2 text-white backdrop-blur-sm transition-colors hover:bg-charcoal-800"
          >
            <X className="h-5 w-5" />
          </button>
          <div className="absolute bottom-4 left-5 right-5">
            <h2 className="text-xl font-bold text-white">{product.name}</h2>
            {!isSide && (
              <div className="mt-2 flex gap-1">
                {Array.from({ length: totalSteps }, (_, i) => (
                  <div
                    key={i}
                    className={cn(
                      "h-1 flex-1 rounded-full transition-colors",
                      i + 1 <= step ? "bg-brand-orange" : "bg-charcoal-700"
                    )}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5">
          {/* Step 1: Size & Crust, combo details, or direct add for sides */}
          {(step === 1 || isSide) && (
            <div className="space-y-6">
              {!isFixedPriceItem && (
                <>
                  <div>
                    <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-stone-400">
                      Choose Size
                    </h3>
                    <div className="grid grid-cols-2 gap-2">
                      {PIZZA_SIZES.map((s) => (
                        <button
                          key={s}
                          onClick={() => setSize(s)}
                          className={cn(
                            "rounded-xl border p-3 text-center transition-all",
                            size === s
                              ? "border-brand-orange bg-brand-orange/10 text-brand-orange"
                              : "border-charcoal-600 text-stone-300 hover:border-charcoal-500"
                          )}
                        >
                          <p className="font-semibold">{s}</p>
                          <p className="mt-0.5 text-sm text-brand-gold">
                            {formatCurrency(getProductPrice(product, s))}
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-stone-400">
                      Crust Type
                    </h3>
                    <div className="space-y-2">
                      {CRUST_TYPES.map((c) => (
                        <button
                          key={c}
                          onClick={() => setCrust(c)}
                          className={cn(
                            "flex w-full items-center justify-between rounded-xl border px-4 py-3 transition-all",
                            crust === c
                              ? "border-brand-orange bg-brand-orange/10"
                              : "border-charcoal-600 hover:border-charcoal-500"
                          )}
                        >
                          <span className="font-medium text-stone-200">{c}</span>
                          {CRUST_SURCHARGE[c][size] > 0 && (
                            <span className="text-sm text-brand-gold">
                              +{formatCurrency(CRUST_SURCHARGE[c][size])}
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {isFixedPriceItem && (
                <div>
                  <p className="text-stone-400">{product.description}</p>
                  <p className="mt-3 text-2xl font-bold text-brand-gold">
                    {formatCurrency(product.priceFixed ?? 0)}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Toppings */}
          {step === 2 && canAddToppings && (
            <div className="space-y-5">
              <div>
                <h3 className="mb-2 text-sm font-semibold uppercase tracking-wider text-stone-400">
                  Extra Toppings
                </h3>
                <div className="space-y-2">
                  {toppings.map((t) => (
                    <label
                      key={t.id}
                      className={cn(
                        "flex cursor-pointer items-center justify-between rounded-xl border px-4 py-3 transition-all",
                        selectedToppings.has(t.id)
                          ? "border-brand-orange bg-brand-orange/10"
                          : "border-charcoal-600 hover:border-charcoal-500"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={selectedToppings.has(t.id)}
                          onChange={() => toggleTopping(t.id)}
                          className="h-4 w-4 rounded border-charcoal-500 accent-brand-orange"
                        />
                        <span className="font-medium text-stone-200">{t.name}</span>
                      </div>
                      <span className="text-sm text-brand-gold">
                        +{formatCurrency(t.priceMedium)}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Review */}
          {step === 3 && !isSide && (
            <div className="space-y-4">
              <div className="card p-4">
                <h3 className="font-semibold text-white">Your Order</h3>
                <div className="mt-3 space-y-2 text-sm">
                  {!isFixedPriceItem && (
                    <>
                      <div className="flex justify-between text-stone-400">
                        <span>Size</span>
                        <span className="text-stone-200">{size}</span>
                      </div>
                      <div className="flex justify-between text-stone-400">
                        <span>Crust</span>
                        <span className="text-stone-200">{crust}</span>
                      </div>
                    </>
                  )}
                  {toppingsList.length > 0 && (
                    <div className="flex justify-between text-stone-400">
                      <span>Extras</span>
                      <span className="text-right text-stone-200">
                        {toppingsList.map((t) => t.name).join(", ")}
                      </span>
                    </div>
                  )}
                  <div className="border-t border-charcoal-700 pt-2">
                    <div className="flex justify-between">
                      <span className="text-stone-400">Base</span>
                      <span>{formatCurrency(basePrice)}</span>
                    </div>
                    {toppingsPrice > 0 && (
                      <div className="flex justify-between">
                        <span className="text-stone-400">Toppings</span>
                        <span>{formatCurrency(toppingsPrice)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm text-stone-400">Quantity</label>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="flex h-10 w-10 items-center justify-center rounded-xl border border-charcoal-600 text-lg font-bold hover:border-brand-orange"
                  >
                    −
                  </button>
                  <span className="w-8 text-center text-lg font-bold">{quantity}</span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="flex h-10 w-10 items-center justify-center rounded-xl border border-charcoal-600 text-lg font-bold hover:border-brand-orange"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-charcoal-700 p-5">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm text-stone-400">Total</span>
            <span className="text-2xl font-bold text-brand-gold">
              {formatCurrency(totalPrice)}
            </span>
          </div>

          <div className="flex gap-2">
            {step > 1 && !isSide && (
              <button
                onClick={() => setStep(step - 1)}
                className="btn-secondary !px-4"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
            )}

            {isSide ? (
              <button onClick={handleAddToCart} className="btn-primary flex-1">
                <Check className="h-4 w-4" />
                Add to Cart — {formatCurrency(totalPrice)}
              </button>
            ) : step < 3 ? (
              <button
                onClick={() => setStep(step + 1)}
                className="btn-primary flex-1"
              >
                Continue
                <ChevronRight className="h-4 w-4" />
              </button>
            ) : (
              <button onClick={handleAddToCart} className="btn-primary flex-1">
                <Check className="h-4 w-4" />
                Add to Cart — {formatCurrency(totalPrice)}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
