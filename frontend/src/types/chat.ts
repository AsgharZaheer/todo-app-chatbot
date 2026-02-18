/** TypeScript interfaces for Chat -- mirrors backend chat schemas. */

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

export interface ToolCallInfo {
  tool: string;
  args: Record<string, unknown>;
}

export interface ChatResponseData {
  conversation_id: string;
  response: string;
  tool_calls: ToolCallInfo[];
}

export interface ChatApiResponse {
  data: ChatResponseData | null;
  error: { code: string; message: string; details: unknown[] } | null;
  meta: Record<string, unknown> | null;
}
