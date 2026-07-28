import type { ChatIntent, SessionMemory } from "./types";

const RECOMMENDATION_PHRASES =
  /\b(recommend|recommendation|suggest|suggestion|choose|pick|best|favourite|favorite|popular|top|nice|tasty|hungry|don't know what|do not know what|something good|what should i (?:order|get|eat|try)|help me choose|surprise me|any suggestions|can you pick|pick for me|what(?:'s| is) your best)\b/i;

const GREETING = /^(hi|hey|hello|howdy|good morning|good afternoon|good evening)\b/i;
const GOODBYE = /\b(bye|goodbye|see you|thanks|thank you|cheers)\b/i;

export function classifyIntent(text: string): ChatIntent {
  const t = text.toLowerCase().trim();
  if (!t) return "GENERAL_LEE_G";
  if (GREETING.test(t)) return "GREETING";
  if (GOODBYE.test(t)) return "GOODBYE";

  if (RECOMMENDATION_PHRASES.test(t) || /\bwhich pizza\b/.test(t)) return "PIZZA_RECOMMENDATION";
  if (/\b(add|get me|give me|i want|i'll take|i would like)\b/.test(t) && /\b(pizza|combo|fries|wings|burger|pepperoni|beef|chicken)\b/.test(t))
    return "ADD_TO_CART";
  if (/\b(track|tracking|order status|where is my order|LG-[A-Z0-9]+-[A-Z0-9]+)\b/i.test(text))
    return "ORDER_TRACKING";
  if (/\b(cart|my order so far)\b/.test(t)) return "CART";
  if (/\b(checkout|pay|payment|eft|apple pay|google pay)\b/.test(t)) return "PAYMENT";
  if (/\b(how (?:do|to) order|checkout process|order online)\b/.test(t)) return "CHECKOUT";
  if (/\b(deliver|delivery|delivery fee|pickup|collect)\b/.test(t)) return "DELIVERY";
  if (/\b(hour|hours|open|close|closed|working hours)\b/.test(t)) return "STORE_HOURS";
  if (/\b(price|cost|how much|affordable|cheap)\b/.test(t)) return "PRICE";
  if (/\b(combo|deal|promotion|special)\b/.test(t)) return "COMBO";
  if (/\b(side|sides|fries|wings|chips|burger)\b/.test(t)) return "SIDES";
  if (/\b(vegetarian|veggie|no meat|don't eat meat)\b/.test(t)) return "VEGETARIAN";
  if (/\b(spicy|chilli|chili|hot)\b/.test(t)) return "SPICY";
  if (/\b(chicken)\b/.test(t)) return "CHICKEN";
  if (/\b(beef)\b/.test(t)) return "BEEF";
  if (/\b(cheese|cheesy)\b/.test(t)) return "CHEESE";
  if (/\b(ingredient|what's in|what is in|contain)\b/.test(t)) return "INGREDIENT_QUESTION";
  if (/\b(menu|search|find|do you have|looking for)\b/.test(t)) return "MENU_SEARCH";
  if (/\b(compare|versus|vs|difference between)\b/.test(t)) return "MENU_SEARCH";
  if (/\b(faq|policy|refund|allerg)\b/.test(t)) return "FAQ";

  if (isOffTopicStrict(t)) return "OFF_TOPIC";
  return "GENERAL_LEE_G";
}

function isOffTopicStrict(t: string): boolean {
  const offTopic =
    /\b(weather|politics|election|homework|math|python code|javascript|write code|world cup|fifa|bitcoin|stock market|who is nelson mandela|capital of|quantum|essay|joke|doctor|symptoms)\b/i;
  const leeG =
    /\b(pizza|lee-?g|menu|order|delivery|pickup|phalaborwa|combo|beef|chicken|pepperoni|track|checkout|payment|hour|cart)\b/i;
  return offTopic.test(t) && !leeG.test(t);
}

export function isVagueRecommendationRequest(text: string, memory: SessionMemory): boolean {
  if (!RECOMMENDATION_PHRASES.test(text.toLowerCase())) return false;
  const hasPreference =
    memory.likesChicken ||
    memory.likesBeef ||
    memory.likesSpicy ||
    memory.likesCheese ||
    memory.budgetSensitive ||
    memory.wantsFilling ||
    memory.feedingGroup ||
    memory.surpriseMe;
  const mentionsPreference =
    /\b(chicken|beef|spicy|cheese|cheap|affordable|filling|family|four people|combo|surprise)\b/i.test(
      text
    );
  return !hasPreference && !mentionsPreference;
}

export function updateMemoryFromText(text: string, memory: SessionMemory): SessionMemory {
  const t = text.toLowerCase();
  const next = { ...memory };
  if (/\b(chicken)\b/.test(t)) next.likesChicken = true;
  if (/\b(beef)\b/.test(t)) next.likesBeef = true;
  if (/\b(spicy|chilli|chili|hot)\b/.test(t)) next.likesSpicy = true;
  if (/\b(cheese|cheesy)\b/.test(t)) next.likesCheese = true;
  if (/\b(cheap|affordable|budget|save money)\b/.test(t)) next.budgetSensitive = true;
  if (/\b(filling|hungry|big meal|loaded)\b/.test(t)) next.wantsFilling = true;
  if (/\b(family|four people|4 people|sharing|group)\b/.test(t)) next.feedingGroup = true;
  if (/\b(surprise me|anything|you pick|choose for me)\b/.test(t)) next.surpriseMe = true;
  return next;
}

export function parseSessionMemory(raw: string | null | undefined): SessionMemory {
  if (!raw) return {};
  try {
    const data = JSON.parse(raw) as { preferences?: SessionMemory };
    return data.preferences ?? {};
  } catch {
    return {};
  }
}

export function serializeSessionMemory(memory: SessionMemory, existingRaw?: string | null): string {
  let base: Record<string, unknown> = {};
  if (existingRaw) {
    try {
      base = JSON.parse(existingRaw) as Record<string, unknown>;
    } catch {
      base = {};
    }
  }
  return JSON.stringify({ ...base, preferences: memory });
}
