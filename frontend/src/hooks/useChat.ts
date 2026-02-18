"use client";

import { useCallback, useState } from "react";
import { sendChatMessage } from "../lib/api-client";
import type { ChatMessage, ToolCallInfo } from "../types/chat";

/** Chat state hook — manages messages, conversation, loading, and errors. */
export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = useCallback(
    async (userId: string, text: string) => {
      if (!text.trim()) return;

      setError(null);
      setLoading(true);

      // Optimistically add user message
      const userMsg: ChatMessage = {
        id: `temp-${Date.now()}`,
        role: "user",
        content: text,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, userMsg]);

      try {
        const resp = await sendChatMessage(userId, text, conversationId);

        if (resp.error) {
          setError(resp.error.message);
          // Remove optimistic user message on error
          setMessages((prev) => prev.filter((m) => m.id !== userMsg.id));
          return;
        }

        if (resp.data) {
          setConversationId(resp.data.conversation_id);

          // Add assistant message
          const assistantMsg: ChatMessage = {
            id: `assistant-${Date.now()}`,
            role: "assistant",
            content: resp.data.response,
            created_at: new Date().toISOString(),
          };
          setMessages((prev) => [...prev, assistantMsg]);
        }
      } catch (e) {
        setError(
          e instanceof Error ? e.message : "Failed to send message"
        );
        // Remove optimistic user message on error
        setMessages((prev) => prev.filter((m) => m.id !== userMsg.id));
      } finally {
        setLoading(false);
      }
    },
    [conversationId]
  );

  const clearChat = useCallback(() => {
    setMessages([]);
    setConversationId(null);
    setError(null);
  }, []);

  return {
    messages,
    conversationId,
    loading,
    error,
    sendMessage,
    clearChat,
  };
}
