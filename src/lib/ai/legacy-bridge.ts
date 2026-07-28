import { classifyIntent } from "./intents";

/** Legacy helper — off-topic if intent classifier says so */
export function isOffTopic(text: string): boolean {
  return classifyIntent(text) === "OFF_TOPIC";
}

export function isLeeGsPizzaTopic(text: string): boolean {
  return classifyIntent(text) !== "OFF_TOPIC";
}
