"use client";

import type { ReactNode } from "react";
import { polishChatReply } from "@/lib/ai/format-reply";

/** Renders chat text with line breaks, bullets, and simple **bold** */
export function formatChatInline(text: string): ReactNode[] {
  const parts: ReactNode[] = [];
  const regex = /\*\*([^*]+)\*\*/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    parts.push(
      <strong key={`b-${key++}`} className="font-semibold text-stone-100">
        {match[1]}
      </strong>
    );
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts.length ? parts : [text];
}

export function ChatMessageBody({ content }: { content: string }) {
  const normalized = polishChatReply(content);
  const lines = normalized.split("\n");

  return (
    <div className="space-y-1.5 break-words text-sm leading-relaxed">
      {lines.map((line, index) => {
        const trimmed = line.trim();

        if (!trimmed) {
          return <div key={index} className="h-1" aria-hidden />;
        }

        if (trimmed === "---" || trimmed === "—") {
          return <hr key={index} className="border-charcoal-600" />;
        }

        const isBullet = /^[•\-*]\s/.test(trimmed);
        const isNumbered = /^\d+\.\s/.test(trimmed);

        if (isBullet || isNumbered) {
          return (
            <p key={index} className="pl-0.5 text-stone-300">
              {formatChatInline(trimmed)}
            </p>
          );
        }

        const isSubDetail = /^(Price|Sizes|Add-ons|Crust|Type|Why):/i.test(trimmed);

        if (isSubDetail) {
          return (
            <p key={index} className="pl-3 text-stone-400">
              {formatChatInline(trimmed)}
            </p>
          );
        }

        const isTitleLine = /^(\d+\.\s|🍕)/.test(trimmed);

        return (
          <p
            key={index}
            className={isTitleLine ? "font-medium text-stone-200" : "text-stone-300"}
          >
            {formatChatInline(trimmed)}
          </p>
        );
      })}
    </div>
  );
}
