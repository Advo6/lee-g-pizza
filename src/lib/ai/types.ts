import type { CartItem, CrustType, PizzaSize } from "@/lib/utils";

export interface MenuProduct {
  id: string;
  name: string;
  description: string;
  category: string;
  imageUrl: string;
  priceSmall: number | null;
  priceMedium: number | null;
  priceLarge: number | null;
  priceFixed: number | null;
}

export interface MenuTopping {
  id: string;
  name: string;
  category: string;
  priceMedium: number;
  priceLarge: number;
}

export type ChatRole = "system" | "user" | "assistant" | "tool";

export interface ChatCompletionMessage {
  role: ChatRole;
  content: string | null;
  tool_calls?: Array<{
    id: string;
    type: "function";
    function: { name: string; arguments: string };
  }>;
  tool_call_id?: string;
}

export interface ChatContext {
  phone?: string;
  channel: "WEB";
  cartItems?: CartItem[];
}

export interface SessionMemory {
  likesChicken?: boolean;
  likesBeef?: boolean;
  likesSpicy?: boolean;
  likesCheese?: boolean;
  budgetSensitive?: boolean;
  wantsFilling?: boolean;
  feedingGroup?: boolean;
  surpriseMe?: boolean;
  lastIntent?: string;
  pendingRecommendation?: boolean;
}

export interface KnowledgeChunk {
  id: string;
  type: "product" | "topping" | "policy" | "faq" | "store";
  title: string;
  text: string;
  tags: string[];
  productId?: string;
  embedding?: number[];
}

export type ChatIntent =
  | "GREETING"
  | "GOODBYE"
  | "SMALL_TALK"
  | "PIZZA_RECOMMENDATION"
  | "MENU_SEARCH"
  | "INGREDIENT_QUESTION"
  | "VEGETARIAN"
  | "SPICY"
  | "CHICKEN"
  | "BEEF"
  | "CHEESE"
  | "PRICE"
  | "COMBO"
  | "SIDES"
  | "DELIVERY"
  | "STORE_HOURS"
  | "PAYMENT"
  | "CHECKOUT"
  | "ORDER_STATUS"
  | "ORDER_TRACKING"
  | "CART"
  | "FAQ"
  | "ADD_TO_CART"
  | "OFF_TOPIC"
  | "GENERAL_LEE_G";

export interface RecommendParams {
  memory: SessionMemory;
  userText: string;
  limit?: number;
}

export interface ResolvedCartParams {
  productName: string;
  size?: PizzaSize;
  crust?: CrustType;
  toppingNames?: string[];
  quantity?: number;
}
