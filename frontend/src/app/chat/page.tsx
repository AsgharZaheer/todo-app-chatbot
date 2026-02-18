"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "../../hooks/useAuth";
import { useChat } from "../../hooks/useChat";
import ChatHistory from "../../components/ChatHistory";
import ChatInput from "../../components/ChatInput";

export default function ChatPage() {
  const router = useRouter();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const { messages, loading, error, sendMessage, clearChat } = useChat();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [authLoading, isAuthenticated, router]);

  if (authLoading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "var(--bg-primary)" }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-5 h-5 border-2 rounded-full animate-spin"
            style={{
              borderColor: "var(--accent-primary-light)",
              borderTopColor: "var(--accent-primary)",
            }}
          />
          <span style={{ color: "var(--text-muted)" }}>Loading...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: "var(--bg-primary)" }}
    >
      {/* Top navigation */}
      <nav
        className="flex items-center justify-between px-6 py-3 border-b"
        style={{
          background: "var(--bg-secondary)",
          borderColor: "var(--border-light)",
        }}
      >
        <div className="flex items-center gap-4">
          <Link href="/tasks" className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm"
              style={{ background: "var(--accent-primary)" }}
            >
              T
            </div>
            <span
              className="text-lg font-bold"
              style={{ color: "var(--text-primary)" }}
            >
              Taskflow
            </span>
          </Link>
          <span
            className="text-xs px-2.5 py-1 rounded-full font-medium"
            style={{
              background: "var(--accent-primary-light)",
              color: "var(--accent-primary)",
            }}
          >
            AI Chat
          </span>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/tasks"
            className="px-3 py-1.5 rounded-lg text-xs font-medium border"
            style={{
              borderColor: "var(--border-medium)",
              color: "var(--text-secondary)",
            }}
          >
            My Tasks
          </Link>
          <button
            onClick={clearChat}
            className="px-3 py-1.5 rounded-lg text-xs font-medium"
            style={{
              background: "var(--accent-primary-light)",
              color: "var(--accent-primary)",
            }}
          >
            New Chat
          </button>
        </div>
      </nav>

      {/* Error banner */}
      {error && (
        <div
          className="px-6 py-2 text-sm text-center"
          style={{
            background: "var(--status-danger-bg)",
            color: "var(--status-danger)",
          }}
        >
          {error}
        </div>
      )}

      {/* Chat area */}
      <div className="flex-1 flex flex-col max-w-3xl mx-auto w-full">
        <ChatHistory messages={messages} loading={loading} />
        <ChatInput
          onSend={(text) => sendMessage(user.id, text)}
          disabled={loading}
        />
      </div>
    </div>
  );
}
