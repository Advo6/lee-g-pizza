"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { MessageCircle, X, Send, ChefHat, Loader2 } from "lucide-react";
import { useCart } from "@/lib/cart-context";
import { cn } from "@/lib/utils";
import type { ChatMessage } from "@/lib/utils";
import { ChatMessageBody } from "@/components/ChatMessageBody";

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content:
        "Hey! 👋 I'm your AI Pizza Chef at Lee-G's. Ask me about our menu, prices, hours, delivery, or what customers order most — e.g. \"Which pizza should I order?\" or \"Add a large Beef Mayo with extra cheese\"!",
      timestamp: new Date().toISOString(),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionId] = useState(() => {
    if (typeof window !== "undefined") {
      let id = localStorage.getItem("lee-g-chat-session");
      if (!id) {
        id = crypto.randomUUID();
        localStorage.setItem("lee-g-chat-session", id);
      }
      return id;
    }
    return "web-session";
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { addItem, items } = useCart();

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: ChatMessage = {
      role: "user",
      content: text,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat/web", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          message: text,
          history: messages.filter((m) => m.role !== "system"),
          cartItems: items,
        }),
      });

      const data = await res.json();

      if (data.cartItem) {
        addItem(data.cartItem);
      }

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.reply,
          timestamp: new Date().toISOString(),
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, I'm having trouble connecting. Please try again!",
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Toggle button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full shadow-glow transition-all duration-300 print:hidden",
          isOpen
            ? "bg-charcoal-800 text-stone-400 hover:text-white"
            : "bg-gradient-to-br from-brand-orange to-brand-red text-white hover:scale-105"
        )}
        aria-label="Open AI Pizza Chef chat"
      >
        {isOpen ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </button>

      {/* Chat panel */}
      {isOpen && (
        <div className="fixed bottom-24 right-4 z-40 flex h-[min(520px,calc(100vh-8rem))] w-[min(380px,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-charcoal-700 bg-charcoal-900 shadow-2xl animate-slide-up print:hidden">
          {/* Header */}
          <div className="flex items-center gap-3 border-b border-charcoal-700 bg-charcoal-800/80 px-4 py-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-orange/20">
              <ChefHat className="h-5 w-5 text-brand-orange" />
            </div>
            <div>
              <h3 className="font-semibold text-white">AI Pizza Chef</h3>
              <p className="text-xs text-green-400">Online • Lee-G&apos;s Pizza</p>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={cn(
                  "max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
                  msg.role === "user"
                    ? "ml-auto bg-brand-orange/20 text-stone-100 rounded-br-md"
                    : "mr-auto bg-charcoal-800 text-stone-300 rounded-bl-md"
                )}
              >
                {msg.role === "assistant" ? (
                  <ChatMessageBody content={msg.content} />
                ) : (
                  msg.content
                )}
              </div>
            ))}
            {loading && (
              <div className="mr-auto flex items-center gap-2 rounded-2xl bg-charcoal-800 px-4 py-2.5 text-sm text-stone-400">
                <Loader2 className="h-4 w-4 animate-spin" />
                Thinking...
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t border-charcoal-700 p-3">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                sendMessage();
              }}
              className="flex gap-2"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about menu or order..."
                className="input-field !py-2.5 text-sm"
                disabled={loading}
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-orange text-white transition-colors hover:bg-brand-orange-dark disabled:opacity-50"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
