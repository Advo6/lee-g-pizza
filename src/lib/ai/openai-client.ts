import { CHAT_MODEL } from "./constants";
import type { ChatCompletionMessage } from "./types";

type ToolDef = {
  type: "function";
  function: { name: string; description?: string; parameters?: Record<string, unknown> };
};

export async function runChatCompletion(params: {
  instructions: string;
  messages: ChatCompletionMessage[];
  tools: ToolDef[];
  onToolCall: (
    name: string,
    args: Record<string, unknown>
  ) => Promise<{ result: string; cartAction?: unknown }>;
}): Promise<{ reply: string; cartAction?: unknown }> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return { reply: "" };

  const responsesResult = await tryResponsesApi(apiKey, params);
  if (responsesResult) return responsesResult;

  return runChatCompletionsApi(apiKey, params);
}

async function tryResponsesApi(
  apiKey: string,
  params: {
    instructions: string;
    messages: ChatCompletionMessage[];
    tools: ToolDef[];
    onToolCall: (
      name: string,
      args: Record<string, unknown>
    ) => Promise<{ result: string; cartAction?: unknown }>;
  }
): Promise<{ reply: string; cartAction?: unknown } | null> {
  const lastUser = [...params.messages].reverse().find((m) => m.role === "user");
  const input = lastUser?.content || "";

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: CHAT_MODEL,
      instructions: params.instructions,
      input,
      tools: params.tools.map((t) => ({
        type: "function",
        name: t.function.name,
        description: t.function.description,
        parameters: t.function.parameters,
      })),
    }),
  });

  if (!response.ok) return null;

  const data = await response.json();
  const output = data.output as Array<Record<string, unknown>> | undefined;
  if (!output?.length) {
    const text = data.output_text as string | undefined;
    if (text) return { reply: text };
    return null;
  }

  let cartAction: unknown;
  for (const item of output) {
    if (item.type === "function_call") {
      const name = item.name as string;
      const args = JSON.parse((item.arguments as string) || "{}") as Record<string, unknown>;
      const { result, cartAction: action } = await params.onToolCall(name, args);
      if (action) cartAction = action;
      if (result) return { reply: result, cartAction };
    }
    if (item.type === "message") {
      const content = item.content as Array<{ text?: string }> | undefined;
      const text = content?.[0]?.text;
      if (text) return { reply: text, cartAction };
    }
  }

  return null;
}

async function runChatCompletionsApi(
  apiKey: string,
  params: {
    instructions: string;
    messages: ChatCompletionMessage[];
    tools: ToolDef[];
    onToolCall: (
      name: string,
      args: Record<string, unknown>
    ) => Promise<{ result: string; cartAction?: unknown }>;
  }
): Promise<{ reply: string; cartAction?: unknown }> {
  const fullMessages: ChatCompletionMessage[] = [
    { role: "system", content: params.instructions },
    ...params.messages.filter((m) => m.role !== "system"),
  ];

  let response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: CHAT_MODEL,
      messages: fullMessages,
      tools: params.tools,
      tool_choice: "auto",
    }),
  });

  let data = await response.json();
  let choice = data.choices?.[0]?.message as ChatCompletionMessage | undefined;
  let cartAction: unknown;

  while (choice?.tool_calls?.length) {
    const toolResults: ChatCompletionMessage[] = [];
    for (const tc of choice.tool_calls) {
      const args = JSON.parse(tc.function.arguments || "{}") as Record<string, unknown>;
      const { result, cartAction: action } = await params.onToolCall(
        tc.function.name,
        args
      );
      if (action) cartAction = action;
      toolResults.push({ role: "tool", tool_call_id: tc.id, content: result });
    }

    response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: CHAT_MODEL,
        messages: [...fullMessages, choice, ...toolResults],
        tools: params.tools,
      }),
    });

    data = await response.json();
    choice = data.choices?.[0]?.message;
  }

  return {
    reply: choice?.content || "",
    cartAction,
  };
}
