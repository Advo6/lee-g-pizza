import {
  formatProductDetail,
  getMenuProducts,
  getPopularProducts,
  searchMenu,
} from "./menu-service";
import type { MenuProduct, RecommendParams, SessionMemory } from "./types";

function scoreProduct(product: MenuProduct, memory: SessionMemory, text: string): number {
  const hay = `${product.name} ${product.description}`.toLowerCase();
  let score = 0;

  if (memory.surpriseMe) score += 1;
  if (memory.likesChicken && hay.includes("chicken")) score += 5;
  if (memory.likesBeef && hay.includes("beef")) score += 5;
  if (memory.likesSpicy && (hay.includes("chilli") || hay.includes("chili"))) score += 5;
  if (memory.likesCheese && (hay.includes("cheese") || hay.includes("creamy"))) score += 3;
  if (memory.budgetSensitive && product.priceMedium != null && product.priceMedium <= 55)
    score += 4;
  if (memory.wantsFilling && (product.category === "COMBO" || product.category === "TRIPLE_DECKER"))
    score += 4;
  if (memory.feedingGroup && product.category === "COMBO") score += 6;

  if (/\b(chicken)\b/i.test(text) && hay.includes("chicken")) score += 5;
  if (/\b(beef)\b/i.test(text) && hay.includes("beef")) score += 5;
  if (/\b(spicy|chilli|chili)\b/i.test(text) && hay.includes("chilli")) score += 5;
  if (/\b(cheese|cheesy)\b/i.test(text)) score += 2;
  if (/\b(affordable|cheap|budget)\b/i.test(text) && product.priceMedium != null && product.priceMedium <= 55)
    score += 4;
  if (/\b(filling|large|combo|family|four|4 people)\b/i.test(text) && product.category === "COMBO")
    score += 5;

  return score;
}

export async function recommendPizza(params: RecommendParams): Promise<string> {
  const { memory, userText, limit = 3 } = params;
  const products = await getMenuProducts();
  const popular = await getPopularProducts(8);
  const popularBoost = new Map(popular.map((p, i) => [p.product!.id, 8 - i]));

  const scored = products
    .map((p) => ({
      p,
      score: scoreProduct(p, memory, userText) + (popularBoost.get(p.id) ?? 0),
    }))
    .sort((a, b) => b.score - a.score);

  let picks = scored.filter((s) => s.score > 0).slice(0, limit).map((s) => s.p);
  if (!picks.length) {
    picks = popular.slice(0, limit).map((x) => x.product!).filter(Boolean);
  }

  if (!picks.length) {
    const fallback = await searchMenu("pizza", limit);
    if (!fallback.length) return "I couldn't find menu items right now. Please try again in a moment.";
    return formatRecommendationList(fallback, memory, userText, false);
  }

  const fromOrders = picks.some((p) => popularBoost.has(p.id));
  return formatRecommendationList(picks, memory, userText, fromOrders);
}

function formatRecommendationList(
  picks: MenuProduct[],
  memory: SessionMemory,
  userText: string,
  usedOrderData: boolean
): string {
  const intro = usedOrderData
    ? "Based on what customers order most — and what you told me — I'd suggest:"
    : "Here's what I'd suggest from our menu:";

  const reasonParts: string[] = [];
  if (memory.likesChicken || /\bchicken\b/i.test(userText)) reasonParts.push("you enjoy chicken");
  if (memory.likesBeef || /\bbeef\b/i.test(userText)) reasonParts.push("you like beef");
  if (memory.likesSpicy || /\bspicy|chilli\b/i.test(userText))
    reasonParts.push("you asked for something spicy");
  if (memory.likesCheese) reasonParts.push("you love cheese");
  if (memory.budgetSensitive) reasonParts.push("you wanted something affordable");
  if (memory.feedingGroup) reasonParts.push("you're feeding a group");
  if (memory.surpriseMe) reasonParts.push("you asked for a surprise pick");

  const reason =
    reasonParts.length > 0
      ? `Since ${reasonParts.join(" and ")}, these are great fits.`
      : "These are customer favourites at Lee-G's.";

  let reply = `${intro}\n\n`;
  picks.forEach((p, index) => {
    const detail = formatProductDetail(p).replace(/^🍕 /, `${index + 1}. `);
    reply += `${detail}\n\n`;
  });
  reply += `${reason}\n\n`;
  reply += `Want me to add one to your cart?\nSay something like: "Add a large ${picks[0]?.name ?? "Beef Mayo"}".`;
  return reply.trim();
}

export async function recommendCombos(limit = 4): Promise<string> {
  const products = await getMenuProducts();
  const combos = products.filter((p) => p.category === "COMBO").slice(0, limit);
  if (!combos.length) return "We don't have combos loaded right now.";
  let reply = "Our combo deals:\n\n";
  combos.forEach((c, index) => {
    const detail = formatProductDetail(c).replace(/^🍕 /, `${index + 1}. `);
    reply += `${detail}\n\n`;
  });
  return reply.trim();
}

export async function recommendSides(limit = 4): Promise<string> {
  const products = await getMenuProducts();
  const sides = products.filter((p) => p.category === "SIDE").slice(0, limit);
  if (!sides.length) return "We don't have sides loaded right now.";
  let reply = "Our sides & meals:\n\n";
  sides.forEach((s, index) => {
    const detail = formatProductDetail(s).replace(/^🍕 /, `${index + 1}. `);
    reply += `${detail}\n\n`;
  });
  return reply.trim();
}
