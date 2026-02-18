# Research: Conversational Task Management with MCP Integration

**Feature**: 001-ai-chatbot-mcp
**Date**: 2026-02-16

## Research Findings

### 1. OpenAI Agents SDK — MCP Integration Pattern

**Decision**: Use `openai-agents` SDK with `MCPServerStdio` for in-process MCP server connection.

**Rationale**: The Agents SDK provides native MCP support via `mcp_servers` parameter on the `Agent` class. Tools are auto-discovered via the MCP `list_tools()` protocol, eliminating manual registration. `MCPServerStdio` spawns the MCP server as a subprocess communicating via stdin/stdout.

**Alternatives considered**:
- `MCPServerSse`: Deprecated by MCP project. Not recommended for new integrations.
- Streamable HTTP transport: More complex setup, unnecessary for in-process server.
- Native function tools (without MCP): Would bypass MCP isolation requirement from spec.

### 2. MCP Python SDK — Tool Registration

**Decision**: Use `FastMCP` from `mcp.server.fastmcp` with `@mcp.tool()` decorator for tool registration.

**Rationale**: FastMCP provides the highest-level API. Decorators auto-generate JSON schemas from Python type hints. Docstrings become tool descriptions. Supports async functions natively.

**Alternatives considered**:
- Low-level `mcp.server.Server`: More boilerplate, manual schema definition. Rejected for simplicity.
- Custom tool wrapper: Unnecessary — FastMCP handles all requirements.

### 3. Conversation History — Sliding Window

**Decision**: Fetch last 20 messages per request. Pass as `list[TResponseInputItem]` to `Runner.run()`.

**Rationale**: Clarified during `/sp.clarify` session. 20 messages provides sufficient context for task management without exceeding token limits or incurring excessive cost. The `Runner.run()` `input` parameter accepts a list of message objects for conversation history.

**Alternatives considered**:
- Unlimited history: Token overflow risk, cost scales linearly.
- 50 messages: Higher cost, diminishing returns for task management context.
- Session-based (SDK Sessions): Would introduce server-side state, violating statelessness requirement.

### 4. Agent Execution — Per-Request Instantiation

**Decision**: Create new `Agent` and `MCPServerStdio` instances per request. No caching or reuse.

**Rationale**: Statelessness requirement demands no server-side state between requests. Creating instances per-request ensures zero state leakage. The overhead is acceptable given the dominant cost is the OpenAI API call itself.

**Alternatives considered**:
- Cached agent singleton: Violates statelessness. Could leak context between users.
- Connection pooling for MCP: Stdio transport is process-based, not poolable.

### 5. Database Models — Conversation + Message

**Decision**: Two new SQLModel tables: `conversations` (session container) and `messages` (chat history). Foreign key from messages to conversations.

**Rationale**: Matches spec entities exactly. Conversation groups messages; messages store role + content. Composite index on `(conversation_id, created_at)` enables efficient sliding window query.

**Alternatives considered**:
- Single `chat_history` table: Loses conversation grouping capability.
- JSON column for messages: Loses queryability, harder to enforce sliding window.

### 6. MCP Server Transport

**Decision**: Use stdio transport (in-process subprocess) via `MCPServerStdio`.

**Rationale**: Simplest deployment model — no network configuration needed. MCP server runs alongside FastAPI. No authentication needed between components since it's same-process.

**Alternatives considered**:
- SSE transport: Deprecated by MCP project.
- Streamable HTTP: Adds network complexity for no benefit in single-process deployment.
- Separate MCP service: Over-engineered for this use case, adds operational burden.
