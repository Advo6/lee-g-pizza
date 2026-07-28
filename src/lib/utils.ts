import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return `R${amount.toFixed(2)}`;
}

export function generateOrderNumber(): string {
  const prefix = "LG";
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(email.trim());
}

export function normalizeSouthAfricanPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");

  if (digits.startsWith("27") && digits.length === 11) {
    return `0${digits.slice(2)}`;
  }

  return digits;
}

export function isValidSouthAfricanPhone(phone: string): boolean {
  const normalized = normalizeSouthAfricanPhone(phone);
  return /^0[1-8][0-9]{8}$/.test(normalized);
}

export type PizzaSize = "Medium" | "Large";

export const PIZZA_SIZES: PizzaSize[] = ["Medium", "Large"];

export const DEFAULT_PIZZA_SIZE: PizzaSize = "Medium";

/** Maps legacy/invalid sizes to Medium — Lee-G's only offers Medium & Large */
export function normalizePizzaSize(size?: string | null): PizzaSize {
  if (size?.toLowerCase() === "large") return "Large";
  return "Medium";
}

export type CrustType = "Classic" | "Thin & Crispy" | "Stuffed Crust";

export interface CartTopping {
  id: string;
  name: string;
  price: number;
}

export interface CartItem {
  id: string;
  productId: string;
  name: string;
  size?: PizzaSize;
  crust?: CrustType;
  toppings: CartTopping[];
  basePrice: number;
  toppingsPrice: number;
  totalPrice: number;
  quantity: number;
}

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
  timestamp?: string;
}

export const CRUST_TYPES: CrustType[] = ["Classic", "Thin & Crispy", "Stuffed Crust"];

export const CRUST_SURCHARGE: Record<CrustType, Record<PizzaSize, number>> = {
  Classic: { Medium: 0, Large: 0 },
  "Thin & Crispy": { Medium: 0, Large: 0 },
  "Stuffed Crust": { Medium: 8, Large: 12 },
};

export const STATUS_COLORS: Record<string, string> = {
  RECEIVED: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  BAKING: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  OUT_FOR_DELIVERY: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  READY_FOR_PICKUP: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  COMPLETED: "bg-green-500/20 text-green-400 border-green-500/30",
};

export const STATUS_LABELS: Record<string, string> = {
  RECEIVED: "Received",
  BAKING: "Baking",
  OUT_FOR_DELIVERY: "Out for Delivery",
  READY_FOR_PICKUP: "Ready for Pickup",
  COMPLETED: "Completed",
};

export const STORE_INFO = {
  name: "Lee-G's Pizza",
  phone: "+27 71 745 1135",
  whatsapp: "27717451135",
  location: "Big Ben's Shop, Ga-Selwane Mokhoanana, PHALABORWA",
  tagline: "Phalaborwa's Finest — Hot, Fresh & Loaded",
};

export const STORE_HOURS = [
  { day: "Monday", hours: "08:24 – 20:00" },
  { day: "Tuesday", hours: "08:00 – 20:00" },
  { day: "Wednesday", hours: "08:00 – 20:00" },
  { day: "Thursday", hours: "08:00 – 20:00" },
  { day: "Friday", hours: "08:00 – 20:00" },
  { day: "Saturday", hours: "08:00 – 20:00" },
  { day: "Sunday", hours: "Closed" },
] as const;

export function formatStoreHours(): string {
  return STORE_HOURS.map(({ day, hours }) => `${day}: ${hours}`).join("\n");
}

export function getWhatsAppUrl(message?: string): string {
  const url = `https://wa.me/${STORE_INFO.whatsapp}`;
  return message ? `${url}?text=${encodeURIComponent(message)}` : url;
}

export function getProductPrice(
  product: {
    priceMedium?: number | null;
    priceLarge?: number | null;
    priceFixed?: number | null;
  },
  size?: PizzaSize
): number {
  if (product.priceFixed != null) return product.priceFixed;
  const effectiveSize = size ?? DEFAULT_PIZZA_SIZE;
  return effectiveSize === "Large"
    ? (product.priceLarge ?? 0)
    : (product.priceMedium ?? 0);
}

export function getToppingPrice(topping: { priceMedium: number; priceLarge: number }): number {
  return topping.priceMedium;
}
