"use client";

import type { ChatMessage as ChatMessageType } from "../types/chat";

interface ChatMessageProps {
  message: ChatMessageType;
}

export default function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === "user";

  return (
    <div
      className={`flex ${isUser ? "justify-end" : "justify-start"} mb-4`}
    >
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-3 ${
          isUser ? "rounded-br-md" : "rounded-bl-md"
        }`}
        style={{
          background: isUser ? "var(--accent-primary)" : "var(--bg-secondary)",
          color: isUser ? "#ffffff" : "var(--text-primary)",
          boxShadow: "var(--shadow-sm)",
          border: isUser ? "none" : "1px solid var(--border-light)",
        }}
      >
        {!isUser && (
          <div
            className="text-xs font-semibold mb-1"
            style={{ color: "var(--accent-primary)" }}
          >
            TaskAssistant
          </div>
        )}
        <div className="text-sm leading-relaxed whitespace-pre-wrap">
          {message.content}
        </div>
        <div
          className="text-xs mt-1.5 opacity-60"
          style={{ color: isUser ? "#ffffff" : "var(--text-muted)" }}
        >
          {new Date(message.created_at).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </div>
      </div>
    </div>
  );
}
