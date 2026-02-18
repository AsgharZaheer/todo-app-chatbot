"use client";

import { useEffect, useRef } from "react";
import type { ChatMessage as ChatMessageType } from "../types/chat";
import ChatMessage from "./ChatMessage";

interface ChatHistoryProps {
  messages: ChatMessageType[];
  loading?: boolean;
}

export default function ChatHistory({ messages, loading }: ChatHistoryProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  if (messages.length === 0 && !loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center max-w-md">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ background: "var(--accent-primary-light)" }}
          >
            <svg
              className="w-8 h-8"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              style={{ color: "var(--accent-primary)" }}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
          </div>
          <h3
            className="text-lg font-semibold mb-2"
            style={{ color: "var(--text-primary)" }}
          >
            Start a conversation
          </h3>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            Ask me to manage your tasks! Try: &ldquo;Add a task to buy
            groceries&rdquo; or &ldquo;Show my tasks&rdquo;
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4">
      {messages.map((msg) => (
        <ChatMessage key={msg.id} message={msg} />
      ))}
      {loading && (
        <div className="flex justify-start mb-4">
          <div
            className="rounded-2xl rounded-bl-md px-4 py-3 border"
            style={{
              background: "var(--bg-secondary)",
              borderColor: "var(--border-light)",
            }}
          >
            <div className="flex items-center gap-2">
              <div
                className="w-2 h-2 rounded-full animate-bounce"
                style={{
                  background: "var(--accent-primary)",
                  animationDelay: "0ms",
                }}
              />
              <div
                className="w-2 h-2 rounded-full animate-bounce"
                style={{
                  background: "var(--accent-primary)",
                  animationDelay: "150ms",
                }}
              />
              <div
                className="w-2 h-2 rounded-full animate-bounce"
                style={{
                  background: "var(--accent-primary)",
                  animationDelay: "300ms",
                }}
              />
            </div>
          </div>
        </div>
      )}
      <div ref={bottomRef} />
    </div>
  );
}
