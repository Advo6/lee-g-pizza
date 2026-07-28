import { prisma } from "@/lib/prisma";
import { STATUS_LABELS, formatCurrency, normalizePizzaSize, type CartItem, type CrustType } from "@/lib/utils";
import { DELIVERY_FEE } from "./constants";
import {
  formatCartSummary,
  formatProductDetail,
  getMenuSummary,
  getProductByName,
  getPopularProducts,
  resolveCartItem,
  searchMenu,
} from "./menu-service";
import { recommendCombos, recommendPizza, recommendSides } from "./recommendations";
import { retrieveContext, searchKnowledge } from "./retrieval";
import type { ChatContext, SessionMemory } from "./types";

function extractOrderNumber(text: string): string | null {
  const match = text.toUpperCase().match(/\bLG-[A-Z0-9]+-[A-Z0-9]+\b/);
  return match?.[0] ?? null;
}

export async function getOrderTrackingReply(orderNumber: string): Promise<string> {
  const order = await prisma.order.findUnique({ where: { orderNumber } });
  if (!order) {
    return `I couldn't find order ${orderNumber}. Please check the number and try again.`;
  }
  const status = STATUS_LABELS[order.status] || order.status;
  const orderType = order.orderType === "DELIVERY" ? "Delivery" : "Pickup";
  const trackUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/track?order=${order.orderNumber}`;
  return `Order ${order.orderNumber} is currently: ${status}.\nType: ${orderType}\nTotal: ${formatCurrency(order.total)}\nPayment: ${order.paymentStatus}\nTrack online: ${trackUrl}`;
}

export const AI_TOOLS = [
  {
    type: "function" as const,
    function: {
      name: "searchMenu",
      description: "Search the live Lee-G's menu by keyword or category",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "Search text e.g. chicken, combo, spicy" },
          limit: { type: "number" },
        },
        required: ["query"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "getPizzaDetails",
      description: "Get full details for one menu item by name",
      parameters: {
        type: "object",
        properties: { productName: { type: "string" } },
        required: ["productName"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "recommendPizza",
      description: "Recommend pizzas based on customer preferences and order popularity",
      parameters: {
        type: "object",
        properties: {
          preference: {
            type: "string",
            description: "e.g. chicken, beef, spicy, cheese, affordable, filling, surprise",
          },
        },
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "searchCombos",
      description: "List combo deals and promotions",
      parameters: { type: "object", properties: {}, required: [] },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "findSides",
      description: "List sides and meal options",
      parameters: { type: "object", properties: {}, required: [] },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "searchFAQs",
      description: "Search policies and FAQs (delivery, payment, hours, loyalty, etc.)",
      parameters: {
        type: "object",
        properties: { query: { type: "string" } },
        required: ["query"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "get_menu",
      description: "Get the complete live menu with prices",
      parameters: { type: "object", properties: {}, required: [] },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "get_popular_items",
      description: "Items customers order most often",
      parameters: { type: "object", properties: {}, required: [] },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "add_to_cart",
      description: "Add a menu item to the customer's website cart",
      parameters: {
        type: "object",
        properties: {
          productName: { type: "string" },
          size: { type: "string", enum: ["Medium", "Large"] },
          crust: { type: "string", enum: ["Classic", "Thin & Crispy", "Stuffed Crust"] },
          toppingNames: { type: "array", items: { type: "string" } },
          quantity: { type: "number" },
        },
        required: ["productName"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "calculate_price",
      description: "Calculate price for a pizza with size, crust, and toppings",
      parameters: {
        type: "object",
        properties: {
          productName: { type: "string" },
          size: { type: "string", enum: ["Medium", "Large"] },
          crust: { type: "string", enum: ["Classic", "Thin & Crispy", "Stuffed Crust"] },
          toppingNames: { type: "array", items: { type: "string" } },
        },
        required: ["productName", "size"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "viewCart",
      description: "Show the customer's current cart contents",
      parameters: { type: "object", properties: {}, required: [] },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "checkout",
      description: "Guide the customer to complete checkout on the website",
      parameters: { type: "object", properties: {}, required: [] },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "trackOrder",
      description: "Track order by unique order number",
      parameters: {
        type: "object",
        properties: { orderNumber: { type: "string" } },
        required: ["orderNumber"],
      },
    },
  },
];

export async function executeToolCall(
  name: string,
  args: Record<string, unknown>,
  context: ChatContext,
  memory: SessionMemory
): Promise<{ result: string; cartAction?: Omit<CartItem, "id"> }> {
  switch (name) {
    case "searchMenu": {
      const query = String(args.query || "");
      const limit = Number(args.limit) || 6;
      const items = await searchMenu(query, limit);
      if (!items.length) return { result: `No menu items matched "${query}".` };
      return {
        result: items
          .map((p, i) => `${i + 1}. ${formatProductDetail(p)}`)
          .join("\n\n"),
      };
    }
    case "getPizzaDetails": {
      const product = await getProductByName(String(args.productName || ""));
      if (!product) return { result: "Item not found on the live menu." };
      return { result: formatProductDetail(product) };
    }
    case "recommendPizza": {
      const pref = String(args.preference || "");
      const merged = { ...memory, ...(pref ? { surpriseMe: pref.includes("surprise") } : {}) };
      return { result: await recommendPizza({ memory: merged, userText: pref, limit: 3 }) };
    }
    case "searchCombos":
      return { result: await recommendCombos() };
    case "findSides":
      return { result: await recommendSides() };
    case "searchFAQs": {
      const chunks = await searchKnowledge(String(args.query || "faq"), "faq", 4);
      if (!chunks.length) {
        const policy = await searchKnowledge(String(args.query || ""), "policy", 3);
        return {
          result: policy.map((c) => c.text).join("\n\n") || "No FAQ match found.",
        };
      }
      return { result: chunks.map((c) => c.text).join("\n\n") };
    }
    case "get_menu":
      return { result: await getMenuSummary() };
    case "get_popular_items": {
      const popular = await getPopularProducts(5);
      if (!popular.length) return { result: "No order history yet." };
      return {
        result: popular
          .map((p) => `${p.name} — ordered ${p.orderCount} time(s)`)
          .join("\n"),
      };
    }
    case "add_to_cart": {
      const resolved = await resolveCartItem({
        productName: args.productName as string,
        size: normalizePizzaSize(args.size as string | undefined),
        crust: args.crust as CrustType | undefined,
        toppingNames: args.toppingNames as string[] | undefined,
        quantity: (args.quantity as number) || 1,
      });
      if (resolved.success && resolved.item) {
        return { result: resolved.message, cartAction: resolved.item };
      }
      return { result: resolved.message };
    }
    case "calculate_price": {
      const resolved = await resolveCartItem({
        productName: args.productName as string,
        size: normalizePizzaSize(args.size as string | undefined),
        crust: args.crust as CrustType | undefined,
        toppingNames: args.toppingNames as string[] | undefined,
        quantity: 1,
      });
      if (resolved.success && resolved.item) {
        return {
          result: `${args.productName} (${args.size}): R${resolved.item.basePrice + resolved.item.toppingsPrice}`,
        };
      }
      return { result: resolved.message };
    }
    case "viewCart":
      return { result: formatCartSummary(context.cartItems || []) };
    case "checkout":
      return {
        result: `To checkout: open the Cart / Checkout page on the website, enter your details, choose Pickup or Delivery (delivery fee ${formatCurrency(DELIVERY_FEE)}), and pay with Apple Pay, Google Pay, or EFT.`,
      };
    case "trackOrder": {
      const num = String(args.orderNumber || "");
      return { result: await getOrderTrackingReply(num) };
    }
    case "track_order":
      return {
        result: await getOrderTrackingReply(String(args.orderNumber || "")),
      };
    default:
      return { result: "Unknown tool." };
  }
}

export async function buildRagContext(userMessage: string): Promise<string> {
  return retrieveContext(userMessage, 8);
}

export { extractOrderNumber };
