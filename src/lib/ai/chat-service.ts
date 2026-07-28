import { OFF_TOPIC_REDIRECT, RECOMMENDATION_FOLLOW_UP } from "./constants";
import { polishChatReply } from "./format-reply";
import {
  classifyIntent,
  isVagueRecommendationRequest,
  parseSessionMemory,
  serializeSessionMemory,
  updateMemoryFromText,
} from "./intents";
import { formatCartSummary, getMenuSummary, resolveCartItem } from "./menu-service";
import { runChatCompletion } from "./openai-client";
import { buildSystemPrompt, goodbyeReply, greetingReply } from "./prompts";
import { recommendCombos, recommendPizza, recommendSides } from "./recommendations";
import { AI_TOOLS, buildRagContext, executeToolCall, extractOrderNumber, getOrderTrackingReply } from "./tools";
import type { CartItem } from "@/lib/utils";
import type { ChatCompletionMessage, ChatContext, SessionMemory } from "./types";

export interface ChatRunResult {
  reply: string;
  cartAction?: Omit<CartItem, "id">;
  memory: SessionMemory;
}

function finish(result: Omit<ChatRunResult, "reply"> & { reply: string }): ChatRunResult {
  return { ...result, reply: polishChatReply(result.reply) };
}

export async function runChat(
  messages: ChatCompletionMessage[],
  context: ChatContext,
  sessionMemoryRaw?: string | null
): Promise<ChatRunResult> {
  const lastUser = [...messages].reverse().find((m) => m.role === "user");
  const userText = lastUser?.content || "";
  let memory = parseSessionMemory(sessionMemoryRaw);
  memory = updateMemoryFromText(userText, memory);

  const intent = classifyIntent(userText);
  memory.lastIntent = intent;

  const orderNumber = extractOrderNumber(userText);
  if (orderNumber) {
    return {
      reply: await getOrderTrackingReply(orderNumber),
      memory,
    };
  }
  if (intent === "ORDER_TRACKING") {
    return {
      reply:
        "Please send your Lee-G's order number (example: LG-ABC123-XYZ) and I'll track it for you.",
      memory,
    };
  }

  if (intent === "OFF_TOPIC") {
    return { reply: OFF_TOPIC_REDIRECT, memory };
  }

  if (intent === "GREETING") {
    return { reply: greetingReply(), memory };
  }

  if (intent === "GOODBYE") {
    return { reply: goodbyeReply(), memory };
  }

  if (intent === "PIZZA_RECOMMENDATION") {
    if (isVagueRecommendationRequest(userText, memory)) {
      memory.pendingRecommendation = true;
      return { reply: RECOMMENDATION_FOLLOW_UP, memory };
    }
    return {
      reply: await recommendPizza({ memory, userText, limit: 3 }),
      memory,
    };
  }

  if (intent === "COMBO") {
    return { reply: await recommendCombos(), memory };
  }

  if (intent === "SIDES") {
    return { reply: await recommendSides(), memory };
  }

  if (intent === "CART") {
    return { reply: formatCartSummary(context.cartItems || []), memory };
  }

  if (memory.pendingRecommendation) {
    memory.pendingRecommendation = false;
    return {
      reply: await recommendPizza({ memory, userText, limit: 3 }),
      memory,
    };
  }

  const ragContext = await buildRagContext(userText);
  const instructions = await buildSystemPrompt(ragContext, memory);

  let cartAction: Omit<CartItem, "id"> | undefined;

  const llm = await runChatCompletion({
    instructions,
    messages,
    tools: AI_TOOLS,
    onToolCall: async (name, args) => {
      const out = await executeToolCall(name, args, context, memory);
      if (out.cartAction) cartAction = out.cartAction;
      return out;
    },
  });

  if (llm.reply) {
    return { reply: llm.reply, cartAction, memory };
  }

  return mockChat(messages, context, memory, ragContext);
}

async function mockChat(
  messages: ChatCompletionMessage[],
  context: ChatContext,
  memory: SessionMemory,
  ragContext: string
): Promise<ChatRunResult> {
  const lastUser = [...messages].reverse().find((m) => m.role === "user");
  const text = (lastUser?.content || "").toLowerCase();
  const intent = classifyIntent(text);

  if (intent === "OFF_TOPIC") {
    return { reply: OFF_TOPIC_REDIRECT, memory };
  }

  if (text.includes("menu") || intent === "MENU_SEARCH") {
    return {
      reply: `Here's our live menu:\n\n${await getMenuSummary()}\n\nAsk me to recommend something or say "Add a large Beef Mayo".`,
      memory,
    };
  }

  if (intent === "PIZZA_RECOMMENDATION") {
    return {
      reply: await recommendPizza({ memory, userText: text, limit: 3 }),
      memory,
    };
  }

  if (/\b(add|get me|give me)\b/.test(text)) {
    const resolved = await resolveCartItem({
      productName: "Beef Mayo",
      size: text.includes("large") ? "Large" : "Medium",
      quantity: 1,
    });
    if (resolved.success && resolved.item) {
      return {
        reply: resolved.message,
        cartAction: context.channel === "WEB" ? resolved.item : undefined,
        memory,
      };
    }
  }

  if (ragContext.length > 50) {
    return {
      reply: `Here's what I found about Lee-G's Pizza:\n\n${ragContext.slice(0, 1200)}\n\nWant menu search, a recommendation, or help adding to cart?`,
      memory,
    };
  }

  return {
    reply:
      "I'm your Lee-G's Pizza Assistant. Ask about the menu, hours, delivery, recommendations, or say what you'd like to order!",
    memory,
  };
}

/** @deprecated Use runChat — kept for existing API route */
export async function callAI(
  messages: ChatCompletionMessage[],
  context: ChatContext,
  sessionMemoryRaw?: string | null
): Promise<{ reply: string; cartAction?: Omit<CartItem, "id">; memory?: SessionMemory }> {
  const result = await runChat(messages, context, sessionMemoryRaw);
  return finish(result);
}

export { serializeSessionMemory, parseSessionMemory };
