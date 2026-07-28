import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { callAI, serializeSessionMemory } from "@/lib/ai";
import type { CartItem, ChatMessage } from "@/lib/utils";

export async function POST(req: NextRequest) {
  try {
    const { sessionId, message, history, cartItems } = await req.json();

    if (!message?.trim()) {
      return NextResponse.json({ error: "Message required" }, { status: 400 });
    }

    const sid = sessionId || "web-anonymous";

    let session = await prisma.chatSession.findUnique({
      where: { sessionId: sid },
    });

    if (!session) {
      session = await prisma.chatSession.create({
        data: {
          sessionId: sid,
          channel: "WEB",
          messages: "[]",
        },
      });
    }

    const existingMessages: ChatMessage[] = JSON.parse(session.messages || "[]");
    const conversationHistory = (history || existingMessages).map(
      (m: ChatMessage) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })
    );

    conversationHistory.push({ role: "user" as const, content: message });

    const { reply, cartAction, memory } = await callAI(
      conversationHistory,
      {
        channel: "WEB",
        cartItems: (cartItems as CartItem[]) || [],
      },
      session.cartData
    );

    const updatedMessages: ChatMessage[] = [
      ...existingMessages,
      { role: "user", content: message, timestamp: new Date().toISOString() },
      { role: "assistant", content: reply, timestamp: new Date().toISOString() },
    ];

    await prisma.chatSession.update({
      where: { id: session.id },
      data: {
        messages: JSON.stringify(updatedMessages),
        cartData: memory ? serializeSessionMemory(memory, session.cartData) : session.cartData,
      },
    });

    return NextResponse.json({
      reply,
      cartItem: cartAction || null,
    });
  } catch (error) {
    console.error("Web chat error:", error);
    return NextResponse.json(
      { error: "Chat service unavailable" },
      { status: 500 }
    );
  }
}
