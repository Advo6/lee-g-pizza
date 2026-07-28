import {
  CRUST_SURCHARGE,
  CRUST_TYPES,
  PIZZA_SIZES,
  STORE_INFO,
  STATUS_LABELS,
  formatCurrency,
  formatStoreHours,
  getWhatsAppUrl,
} from "@/lib/utils";
import { DELIVERY_FEE } from "./constants";
import { EFT_BANK_DETAILS, PAYMENT_METHODS } from "@/lib/payments";
import { getMenuProducts, getMenuToppings } from "./menu-service";
import type { KnowledgeChunk, MenuProduct } from "./types";

function inferTags(product: MenuProduct): string[] {
  const text = `${product.name} ${product.description}`.toLowerCase();
  const tags: string[] = [product.category.toLowerCase()];
  if (text.includes("chicken")) tags.push("chicken");
  if (text.includes("beef")) tags.push("beef");
  if (text.includes("chilli") || text.includes("chili") || text.includes("spicy"))
    tags.push("spicy");
  if (text.includes("cheese") || text.includes("creamy")) tags.push("cheese");
  if (text.includes("pepperoni")) tags.push("meat");
  if (text.includes("combo")) tags.push("combo", "deal");
  if (product.category === "SIDE") tags.push("side", "filling");
  if (product.category === "COMBO") tags.push("combo", "deal", "sharing");
  if (product.priceMedium != null && product.priceMedium <= 55) tags.push("affordable");
  if (product.priceLarge != null && product.priceLarge >= 110) tags.push("premium");
  return [...new Set(tags)];
}

export function getStaticFaqs(): KnowledgeChunk[] {
  return [
    {
      id: "faq-drinks",
      type: "faq",
      title: "Drinks",
      text: "Lee-G's Pizza combos and sides often include pops/cold drinks as part of combo meals (see Combos and Fries & Pops items on the menu). We do not list separate dessert items on the current website menu.",
      tags: ["drinks", "dessert", "faq"],
    },
    {
      id: "faq-loyalty",
      type: "faq",
      title: "Loyalty program",
      text: "There is no loyalty program listed on the Lee-G's Pizza website at this time. Orders and rewards are handled through standard checkout.",
      tags: ["loyalty", "rewards", "faq"],
    },
    {
      id: "faq-delivery-area",
      type: "faq",
      title: "Delivery areas",
      text: `Lee-G's Pizza is based in Phalaborwa (${STORE_INFO.location}). Delivery is available through the website checkout; enter your full delivery address at checkout. Delivery fee is ${formatCurrency(DELIVERY_FEE)}. Specific suburb lists are not stored in the system — contact us on WhatsApp ${STORE_INFO.phone} if you are unsure.`,
      tags: ["delivery", "area", "faq"],
    },
    {
      id: "faq-delivery-time",
      type: "faq",
      title: "Delivery time",
      text: "Estimated preparation and delivery times are not fixed in the system. After you order, track your order status online with your order number. Times vary by how busy the store is.",
      tags: ["delivery", "time", "eta", "faq"],
    },
    {
      id: "faq-vegetarian",
      type: "faq",
      title: "Vegetarian options",
      text: "Lee-G's menu is meat-forward. We do not currently offer a dedicated vegetarian pizza on the menu. Sides like fries may suit non-meat eaters — ask about sides or combos without meat toppings.",
      tags: ["vegetarian", "veggie", "faq"],
    },
    {
      id: "faq-sizes",
      type: "faq",
      title: "Pizza sizes",
      text: "Pizzas are available in Medium and Large only. We do not offer Small sizes on the website.",
      tags: ["size", "medium", "large", "faq"],
    },
  ];
}

export async function buildKnowledgeIndex(): Promise<KnowledgeChunk[]> {
  const products = await getMenuProducts();
  const toppings = await getMenuToppings();
  const chunks: KnowledgeChunk[] = [];

  for (const p of products) {
    chunks.push({
      id: `product-${p.id}`,
      type: "product",
      title: p.name,
      productId: p.id,
      tags: inferTags(p),
      text: [
        `Product: ${p.name}`,
        `Category: ${p.category}`,
        `Description: ${p.description}`,
        p.priceFixed != null
          ? `Price: R${p.priceFixed}`
          : `Prices: Medium R${p.priceMedium}, Large R${p.priceLarge}`,
        "Sizes for pizzas: Medium and Large only.",
        "Extra toppings available on pizzas: Extra Meat, Extra Cheese.",
      ].join("\n"),
    });
  }

  for (const t of toppings) {
    chunks.push({
      id: `topping-${t.id}`,
      type: "topping",
      title: t.name,
      tags: ["topping", t.category.toLowerCase()],
      text: `Extra topping: ${t.name}. Category: ${t.category}. Price: R${t.priceMedium} on Medium or Large pizzas.`,
    });
  }

  chunks.push({
    id: "store-info",
    type: "store",
    title: "Store information",
    tags: ["store", "contact", "hours", "location"],
    text: [
      `Store: ${STORE_INFO.name}`,
      `Tagline: ${STORE_INFO.tagline}`,
      `Location: ${STORE_INFO.location}`,
      `Phone/WhatsApp: ${STORE_INFO.phone}`,
      `WhatsApp URL: ${getWhatsAppUrl()}`,
      `Working hours:\n${formatStoreHours()}`,
    ].join("\n"),
  });

  chunks.push({
    id: "policy-checkout",
    type: "policy",
    title: "Checkout and payment",
    tags: ["checkout", "payment", "policy"],
    text: [
      "Orders are placed on the Lee-G's Pizza website: add items to cart, open Checkout, choose Pickup or Delivery.",
      `Delivery fee: ${formatCurrency(DELIVERY_FEE)}. Pickup: no delivery fee.`,
      `Payment methods: ${PAYMENT_METHODS.map((m) => m.label).join(", ")}.`,
      `EFT: ${EFT_BANK_DETAILS.bank}, ${EFT_BANK_DETAILS.accountName}, use your order number as reference.`,
      "Email confirmations and tracking links are sent after checkout.",
      "WhatsApp is for contact only — not for placing orders.",
    ].join("\n"),
  });

  chunks.push({
    id: "policy-tracking",
    type: "policy",
    title: "Order tracking",
    tags: ["track", "order", "status"],
    text: `Order statuses: ${Object.values(STATUS_LABELS).join(", ")}. Customers track orders on the Track Order page with their unique order number (format LG-XXXX-XXX).`,
  });

  chunks.push({
    id: "policy-crust",
    type: "policy",
    title: "Crust options",
    tags: ["crust", "customize"],
    text: `Crust types: ${CRUST_TYPES.join(", ")}. Stuffed Crust surcharge: Medium +R${CRUST_SURCHARGE["Stuffed Crust"].Medium}, Large +R${CRUST_SURCHARGE["Stuffed Crust"].Large}. Pizza sizes: ${PIZZA_SIZES.join(", ")} only.`,
  });

  chunks.push(...getStaticFaqs());

  return chunks;
}
