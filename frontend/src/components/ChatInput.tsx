"use client";

import { useState } from "react";

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
}

export default function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [text, setText] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || disabled) return;
    onSend(text.trim());
    setText("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex items-end gap-3 p-4 border-t"
      style={{
        background: "var(--bg-secondary)",
        borderColor: "var(--border-light)",
      }}
    >
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Type a message... (Enter to send, Shift+Enter for new line)"
        disabled={disabled}
        rows={1}
        className="flex-1 px-4 py-3 rounded-xl border text-sm resize-none outline-none"
        style={{
          background: "var(--bg-primary)",
          borderColor: "var(--input-border)",
          color: "var(--text-primary)",
          maxHeight: "120px",
        }}
        maxLength={2000}
      />
      <button
        type="submit"
        disabled={disabled || !text.trim()}
        className="p-3 rounded-xl text-white disabled:opacity-40"
        style={{
          background: "var(--accent-primary)",
          boxShadow: "0 2px 8px rgba(99, 102, 241, 0.3)",
        }}
        aria-label="Send message"
      >
        {disabled ? (
          <div
            className="w-5 h-5 border-2 rounded-full animate-spin"
            style={{
              borderColor: "rgba(255,255,255,0.3)",
              borderTopColor: "#ffffff",
            }}
          />
        ) : (
          <svg
            className="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
            />
          </svg>
        )}
      </button>
    </form>
  );
}
