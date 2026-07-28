import { prisma } from "@/lib/prisma";
import {
  CRUST_SURCHARGE,
  getProductPrice,
  getToppingPrice,
  normalizePizzaSize,
  type CartItem,
} from "@/lib/utils";
import type { MenuProduct, MenuTopping, ResolvedCartParams } from "./types";

export async function getMenuProducts(): Promise<MenuProduct[]> {
  return prisma.product.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
  });
}

export async function getMenuToppings(): Promise<MenuTopping[]> {
  return prisma.topping.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
  });
}

export function formatProductPrice(product: MenuProduct): string {
  if (product.priceFixed != null) return `R${product.priceFixed}`;
  return `M R${product.priceMedium} / L R${product.priceLarge}`;
}

export async function getMenuSummary(): Promise<string> {
  const products = await getMenuProducts();
  const toppings = await getMenuToppings();

  let summary = "=== LEE-G'S PIZZA MENU (LIVE FROM DATABASE) ===\n\n";

  const categories = ["STANDARD", "DOUBLE_DECKER", "TRIPLE_DECKER", "COMBO", "SIDE"] as const;
  const labels: Record<string, string> = {
    STANDARD: "Standard Pizzas",
    DOUBLE_DECKER: "Double Decker Pizzas",
    TRIPLE_DECKER: "Triple Decker Pizzas",
    COMBO: "Combos (deals)",
    SIDE: "Sides & meals",
  };

  for (const cat of categories) {
    const items = products.filter((p) => p.category === cat);
    if (items.length === 0) continue;
    summary += `${labels[cat]}:\n`;
    for (const p of items) {
      summary += `- ${p.name}: ${formatProductPrice(p)} — ${p.description}\n`;
    }
    summary += "\n";
  }

  summary += "Extra Toppings:\n";
  for (const t of toppings) {
    summary += `- ${t.name} (${t.category}): R${t.priceMedium}\n`;
  }

  return summary;
}

export async function resolveCartItem(
  params: ResolvedCartParams
): Promise<{ success: boolean; item?: Omit<CartItem, "id">; message: string }> {
  const { productName, crust = "Classic", toppingNames = [], quantity = 1 } = params;
  const size = normalizePizzaSize(params.size);

  const products = await prisma.product.findMany({ where: { isActive: true } });
  const search = productName.toLowerCase();
  const matches = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search) || search.includes(p.name.toLowerCase())
  );
  const product = matches.sort((a, b) => {
    const aExact = a.name.toLowerCase() === search ? 0 : 1;
    const bExact = b.name.toLowerCase() === search ? 0 : 1;
    if (aExact !== bExact) return aExact - bExact;
    return a.name.length - b.name.length;
  })[0];

  if (!product) {
    return {
      success: false,
      message: `Sorry, I couldn't find "${productName}" on our menu. Ask me to search the menu or recommend something.`,
    };
  }

  const isSide = product.category === "SIDE";
  const isFixedPriceItem = isSide || product.category === "COMBO";
  const effectiveSize = isFixedPriceItem ? undefined : size;

  let basePrice = getProductPrice(product, effectiveSize);
  if (!isFixedPriceItem && effectiveSize) {
    basePrice += CRUST_SURCHARGE[crust][effectiveSize];
  }

  const allToppings = await getMenuToppings();
  const selectedToppings: { id: string; name: string; price: number }[] = [];
  let toppingsPrice = 0;

  if (!isSide) {
    for (const tn of toppingNames) {
      const topping = allToppings.find((t) =>
        t.name.toLowerCase().includes(tn.toLowerCase())
      );
      if (topping) {
        const price = getToppingPrice(topping);
        selectedToppings.push({ id: topping.id, name: topping.name, price });
        toppingsPrice += price;
      }
    }
  }

  const unitPrice = basePrice + toppingsPrice;

  return {
    success: true,
    message: `Added ${quantity}x ${product.name}${effectiveSize ? ` (${effectiveSize})` : ""} to your cart!`,
    item: {
      productId: product.id,
      name: product.name,
      size: effectiveSize,
      crust: isFixedPriceItem ? undefined : crust,
      toppings: selectedToppings,
      basePrice,
      toppingsPrice,
      totalPrice: unitPrice * quantity,
      quantity,
    },
  };
}

export async function getPopularProducts(limit = 5) {
  const orders = await prisma.order.findMany({ select: { items: true } });
  const counts = new Map<string, number>();

  for (const order of orders) {
    try {
      const items = JSON.parse(order.items) as Array<{ name?: string; quantity?: number }>;
      for (const item of items) {
        const name = item.name?.trim();
        if (!name) continue;
        counts.set(name, (counts.get(name) ?? 0) + (item.quantity || 1));
      }
    } catch {
      /* skip */
    }
  }

  const products = await getMenuProducts();
  const ranked = [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([name, orderCount]) => ({
      name,
      orderCount,
      product: products.find((p) => p.name.toLowerCase() === name.toLowerCase()),
    }));

  return ranked.filter((r) => r.product);
}

export async function searchMenu(query: string, limit = 8): Promise<MenuProduct[]> {
  const products = await getMenuProducts();
  const q = query.toLowerCase().trim();
  if (!q) return products.slice(0, limit);

  const scored = products
    .map((p) => {
      const hay = `${p.name} ${p.description} ${p.category}`.toLowerCase();
      let score = 0;
      for (const token of q.split(/\s+/)) {
        if (token.length < 2) continue;
        if (p.name.toLowerCase().includes(token)) score += 4;
        if (hay.includes(token)) score += 1;
      }
      return { p, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score);

  return (scored.length ? scored.map((x) => x.p) : products).slice(0, limit);
}

export async function getProductByName(name: string): Promise<MenuProduct | null> {
  const products = await getMenuProducts();
  const n = name.toLowerCase();
  return (
    products.find((p) => p.name.toLowerCase() === n) ||
    products.find((p) => p.name.toLowerCase().includes(n) || n.includes(p.name.toLowerCase())) ||
    null
  );
}

export function formatProductDetail(product: MenuProduct, reason?: string): string {
  const lines: string[] = [];

  lines.push(`🍕 ${product.name}`);
  lines.push(product.description);
  lines.push("");
  lines.push(`Price: ${formatProductPrice(product)}`);

  if (product.priceFixed != null) {
    lines.push("Type: Combo / side (fixed price)");
  } else {
    lines.push("Sizes: Medium or Large");
    lines.push("Add-ons: Extra Meat (R15), Extra Cheese (R17)");
    lines.push("Crust: Classic, Thin & Crispy, or Stuffed Crust (stuffed costs extra)");
  }

  if (reason) {
    lines.push("");
    lines.push(`Why: ${reason}`);
  }

  return lines.join("\n");
}

export function formatCartSummary(items: CartItem[]): string {
  if (!items.length) return "Your cart is empty. Browse the menu and tell me what to add!";
  let total = 0;
  let lines = "Your cart:\n";
  for (const item of items) {
    total += item.totalPrice;
    lines += `• ${item.quantity}x ${item.name}${item.size ? ` (${item.size})` : ""} — R${item.totalPrice.toFixed(2)}\n`;
  }
  lines += `\nSubtotal: R${total.toFixed(2)}`;
  lines += "\n\nGo to Checkout on the website to pay and place your order.";
  return lines;
}
