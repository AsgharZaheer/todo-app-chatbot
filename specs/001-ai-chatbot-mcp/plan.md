# Implementation Plan: Conversational Task Management with MCP Integration

**Branch**: `001-ai-chatbot-mcp` | **Date**: 2026-02-16 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-ai-chatbot-mcp/spec.md`

## Summary

Build a stateless conversational AI interface that allows users to manage todo tasks via natural language. The system uses FastAPI as a request translator and persistence coordinator, OpenAI Agents SDK for AI reasoning, and an MCP Server (via Official MCP Python SDK) exposing five task tools. All conversation state is persisted in Neon PostgreSQL — the server holds zero runtime state.

## Technical Context

**Language/Version**: Python 3.11+ (backend), TypeScript 5 (frontend)
**Primary Dependencies**: FastAPI, OpenAI Agents SDK (`openai-agents`), MCP Python SDK (`mcp` v1.26+), SQLModel, Next.js 16
**Storage**: Neon Serverless PostgreSQL (existing), extended with `conversations` and `messages` tables
**Testing**: pytest + pytest-asyncio (backend), Jest 30 (frontend)
**Target Platform**: Linux server (Docker), Vercel/static hosting (frontend)
**Project Type**: Web application (monorepo: `/backend` + `/frontend`)
**Performance Goals**: <10s end-to-end per chat request (SC-004), 50 concurrent sessions (SC-005)
**Constraints**: Stateless backend, MCP-only business logic, sliding window of 20 messages (FR-007)
**Scale/Scope**: Single-tenant per user, horizontally scalable via stateless design

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Evidence |
|-----------|--------|----------|
| I. Spec-Driven Development | PASS | Spec at `specs/001-ai-chatbot-mcp/spec.md` with 15 FRs, 8 SCs, approved checklist |
| II. Agentic Development | PASS | Plan produced by agent; implementation via `/sp.tasks` → `/sp.implement` |
| III. Reusability & Skill Standardization | PASS | MCP tools are reusable; `{ data, error, meta }` response pattern preserved |
| IV. Security-First | PASS | JWT auth reused from Phase I/II; user_id scoping in all tools (FR-009, FR-012) |
| V. Monorepo Boundary Enforcement | PASS | Backend in `/backend`, frontend in `/frontend`, no cross-imports |
| VI. Simplicity & YAGNI | PASS | Minimal new code: 2 new models, 5 MCP tools, 1 API endpoint, 1 frontend page |

## Project Structure

### Documentation (this feature)

```text
specs/001-ai-chatbot-mcp/
├── plan.md              # This file
├── spec.md              # Feature specification
├── research.md          # Phase 0 research output
├── data-model.md        # Phase 1 data model
├── quickstart.md        # Phase 1 setup guide
├── contracts/           # Phase 1 API contracts
│   └── chat-api.md      # Chat endpoint contract
├── checklists/
│   └── requirements.md  # Spec quality checklist
└── tasks.md             # Phase 2 output (via /sp.tasks)
```

### Source Code (repository root)

```text
backend/
├── app/
│   ├── __init__.py
│   ├── main.py                  # FastAPI app factory (existing, extended)
│   ├── config.py                # Settings (existing, extended with OPENAI_API_KEY)
│   ├── database.py              # Async engine factory (existing)
│   ├── middleware/
│   │   └── auth.py              # JWT auth dependency (existing)
│   ├── models/
│   │   ├── task.py              # Task SQLModel (existing)
│   │   ├── user.py              # User SQLModel (existing)
│   │   ├── conversation.py      # NEW: Conversation SQLModel
│   │   └── message.py           # NEW: Message SQLModel
│   ├── routers/
│   │   ├── auth.py              # Auth endpoints (existing)
│   │   ├── tasks.py             # Task CRUD endpoints (existing)
│   │   └── chat.py              # NEW: Chat endpoint router
│   ├── schemas/
│   │   ├── auth.py              # Auth schemas (existing)
│   │   ├── task.py              # Task schemas (existing)
│   │   └── chat.py              # NEW: Chat request/response schemas
│   ├── services/
│   │   ├── task_service.py      # Task business logic (existing)
│   │   └── chat_service.py      # NEW: Chat orchestration service
│   ├── agents/
│   │   ├── __init__.py
│   │   └── task_agent.py        # NEW: Agent config + runner
│   └── mcp_server/
│       ├── __init__.py
│       └── task_tools.py        # NEW: MCP server with 5 task tools
├── tests/
│   ├── conftest.py              # Test fixtures (existing, extended)
│   ├── test_task_service.py     # Existing tests
│   ├── test_tasks_api.py        # Existing tests
│   ├── test_chat_api.py         # NEW: Chat endpoint tests
│   ├── test_mcp_tools.py        # NEW: MCP tool unit tests
│   └── test_chat_service.py     # NEW: Chat service tests
├── requirements.txt             # Extended with new dependencies
└── Dockerfile                   # Existing

frontend/
├── src/
│   ├── app/
│   │   ├── chat/
│   │   │   └── page.tsx         # NEW: Chat page
│   │   ├── tasks/               # Existing task pages
│   │   ├── layout.tsx           # Existing (add chat nav link)
│   │   └── page.tsx             # Existing landing page
│   ├── components/
│   │   ├── ChatMessage.tsx      # NEW: Single message component
│   │   ├── ChatInput.tsx        # NEW: Message input component
│   │   ├── ChatHistory.tsx      # NEW: Message list component
│   │   ├── TaskCard.tsx         # Existing
│   │   └── ...                  # Other existing components
│   ├── hooks/
│   │   ├── useChat.ts           # NEW: Chat data hook
│   │   └── useAuth.ts           # Existing
│   ├── lib/
│   │   ├── api-client.ts        # Existing (extend with chat methods)
│   │   └── auth.ts              # Existing
│   └── types/
│       ├── task.ts              # Existing
│       └── chat.ts              # NEW: Chat type definitions
└── tests/
    └── components/
        └── ChatMessage.test.tsx # NEW: Chat component tests
```

**Structure Decision**: Web application structure (Option 2). Extends existing `/backend` and `/frontend` directories. New code organized under existing patterns: routers, models, schemas, services in backend; app pages, components, hooks in frontend. Two new backend directories: `agents/` (agent configuration) and `mcp_server/` (MCP tool definitions).

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| `agents/` directory | Separates AI orchestration from business logic | Inline in chat_service would mix concerns and violate MCP isolation principle |
| `mcp_server/` directory | MCP tools must be isolated from FastAPI routes | Embedding in routers would create direct DB access from API layer |

---

## System Architecture

### Component Boundaries

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend (Next.js)                       │
│  /chat page → useChat hook → api-client → POST /api/{uid}/chat │
└──────────────────────────────┬──────────────────────────────────┘
                               │ HTTP
┌──────────────────────────────▼──────────────────────────────────┐
│                    FastAPI Application Layer                     │
│                                                                 │
│  chat.py router                                                 │
│    ├── Authenticate (JWT middleware)                             │
│    ├── Validate request (Pydantic schema)                       │
│    └── Delegate to chat_service                                 │
│                                                                 │
│  chat_service.py (orchestrator — NO business logic)             │
│    ├── 1. Load/create conversation from DB                      │
│    ├── 2. Fetch last 20 messages from DB                        │
│    ├── 3. Store user message in DB                              │
│    ├── 4. Build message history for agent                       │
│    ├── 5. Run agent via Runner.run()                            │
│    ├── 6. Extract assistant response + tool calls               │
│    ├── 7. Store assistant message in DB                         │
│    └── 8. Return response                                       │
│                                                                 │
│  task_agent.py (agent configuration — NO business logic)        │
│    ├── Agent(name, instructions, mcp_servers, model)            │
│    └── Runner.run(agent, input=messages) → RunResult            │
└──────────────────────────────┬──────────────────────────────────┘
                               │ MCP stdio
┌──────────────────────────────▼──────────────────────────────────┐
│                      MCP Server Layer                            │
│                                                                 │
│  task_tools.py (FastMCP server)                                 │
│    ├── add_task(user_id, title, description?)                   │
│    ├── list_tasks(user_id, status?)                             │
│    ├── complete_task(user_id, task_id)                          │
│    ├── delete_task(user_id, task_id)                            │
│    └── update_task(user_id, task_id, title?, description?)      │
│                                                                 │
│  Each tool:                                                     │
│    ├── Opens own DB session                                     │
│    ├── Validates inputs                                         │
│    ├── Executes query (scoped by user_id)                       │
│    ├── Commits transaction                                      │
│    └── Returns structured JSON result                           │
└──────────────────────────────┬──────────────────────────────────┘
                               │ async SQL
┌──────────────────────────────▼──────────────────────────────────┐
│                   Neon PostgreSQL Database                       │
│                                                                 │
│  Tables: users, tasks (existing)                                │
│          conversations, messages (NEW)                           │
└─────────────────────────────────────────────────────────────────┘
```

### 1. FastAPI Application Layer

**Route Design**:
- Single new endpoint: `POST /api/{user_id}/chat`
- Mounted on existing FastAPI app via `app.include_router(chat_router)`
- Protected by existing JWT auth middleware

**Dependency Injection**:
- `get_current_user_id` — existing JWT extraction dependency
- `get_db_session` — existing async session factory
- No new singletons or global state

**Request Lifecycle**:
1. Request arrives → JWT validated → user_id extracted
2. Validate user_id path param matches JWT sub claim (FR-012)
3. Pydantic schema validates request body
4. Delegate to `chat_service.handle_chat()`
5. Return structured response

**Stateless Guarantees**:
- No module-level mutable state
- No `request.session` usage
- No cached conversations or agent instances
- Fresh DB session per request via async context manager

### 2. Agent Orchestration Layer

**Agent Configuration**:
- Single `Agent` instance created per request (not cached)
- `name`: "TaskAssistant"
- `instructions`: System prompt defining task management behavior, tool usage rules, and confirmation patterns
- `model`: Configurable via `OPENAI_MODEL` env var (default: `gpt-4o-mini`)
- `mcp_servers`: List containing the task MCP server

**Tool Registration**:
- MCP server passed to Agent via `mcp_servers=[mcp_server]`
- Agent auto-discovers tools via MCP `list_tools()` protocol
- No manual tool registration needed — MCP handles it

**Prompt Strategy**:
- System instruction explicitly constrains agent to use MCP tools for all task operations
- Agent instructed to never fabricate task data
- Agent instructed to confirm actions only after tool execution
- Agent instructed to ask for clarification on ambiguous references

**Conversation Reconstruction**:
- Fetch last 20 messages from DB ordered by `created_at`
- Transform to `list[TResponseInputItem]` format expected by Runner.run()
- Pass as `input` parameter (list format, not string)

**Runner Execution Model**:
- `Runner.run(agent, input=messages)` — async execution
- Agent may call multiple tools in sequence (multi-tool chaining supported by SDK)
- `RunResult.final_output` contains the assistant's text response
- Tool calls extracted from run result for metadata

### 3. MCP Server Layer

**Tool Exposure Design**:
- Built with `FastMCP` from `mcp.server.fastmcp`
- 5 tools registered via `@mcp.tool()` decorator
- Each tool receives `user_id` as first parameter for scoping
- Tools are the ONLY path to database mutations for task data

**Validation Boundaries**:
- Each tool validates its own inputs (type checking via Python type hints)
- `user_id` must be non-empty string
- `task_id` must be valid UUID
- `title` must be non-empty, max 200 chars
- `description` optional, max 1000 chars
- `status` filter must be "pending" or "completed" if provided

**Error Propagation Model**:
- Tools return structured JSON: `{"success": true/false, "data": {...}, "error": "..."}`
- Database errors caught and returned as tool errors (not exceptions)
- Agent receives error text and communicates it conversationally to user

**Stateless Execution Pattern**:
- Each tool opens its own async DB session
- Session created → query executed → committed → session closed
- No tool retains state between invocations
- No shared objects between tools

### 4. Persistence Layer

**SQLModel Schema** (new models):

**Conversation**:
- `id`: UUID, primary key, auto-generated
- `user_id`: str, indexed, required
- `created_at`: datetime, auto-set
- `updated_at`: datetime, auto-updated

**Message**:
- `id`: UUID, primary key, auto-generated
- `conversation_id`: UUID, foreign key → conversations.id, indexed
- `user_id`: str, indexed, required
- `role`: str, enum ("user", "assistant")
- `content`: text, required
- `created_at`: datetime, auto-set

**Indexes**: `idx_message_conversation_id` on `(conversation_id, created_at)` for efficient history retrieval.

**Transaction Boundaries**:
- Chat service: single transaction for storing user message
- Chat service: single transaction for storing assistant response
- MCP tools: each tool uses its own transaction
- All transactions use explicit `commit()` and `rollback()` on failure

**Migration Strategy**:
- Auto-create tables via `SQLModel.metadata.create_all()` (matches existing Phase I/II pattern)
- No breaking changes to existing tables

**Connection Lifecycle**:
- Async engine with `asyncpg` (existing pattern)
- Session created per-request via `async with` context manager
- Neon serverless-compatible: no persistent connection pool assumptions
- Connection string from `DATABASE_URL` env var (existing)

### 5. Conversation State Strategy

**Loaded**: On each request, `chat_service` queries `messages` table filtered by `conversation_id` and `user_id`, ordered by `created_at ASC`, limited to last 20 rows.

**Injected into Agent Context**: Messages transformed from DB rows to the `list[TResponseInputItem]` format:
- `role: "user"` → `{"role": "user", "content": "..."}`
- `role: "assistant"` → `{"role": "assistant", "content": "..."}`

Passed as `input` parameter to `Runner.run()`.

**Persisted per Request**:
1. User message stored BEFORE agent execution
2. Agent runs with history + new user message
3. Assistant response stored AFTER agent execution
4. Both messages reference same `conversation_id`

**Reconstructed without Memory**: Every request rebuilds context purely from DB. No server-side caches, no session storage, no global variables. After response is sent, server retains zero knowledge of the conversation.

---

## Request Flow Design (Detailed)

```
1. Client sends POST /api/{user_id}/chat
   Body: { "message": "Add a task to buy groceries", "conversation_id": null }

2. FastAPI Route (chat.py):
   ├── JWT middleware extracts user_id from token
   ├── Validate: path user_id == JWT user_id (FR-012)
   ├── Pydantic validates ChatRequest schema
   └── Call chat_service.handle_chat(user_id, message, conversation_id)

3. Chat Service (chat_service.py):
   ├── 3a. If no conversation_id: create new Conversation in DB, get ID
   ├── 3b. If conversation_id: verify it belongs to user_id
   ├── 3c. Fetch last 20 messages for conversation from DB
   ├── 3d. Store new user message in DB (role="user")
   ├── 3e. Build messages list: history + new user message
   ├── 3f. Create MCP server instance (MCPServerStdio)
   ├── 3g. Create Agent with instructions + mcp_server
   ├── 3h. Run: result = await Runner.run(agent, input=messages)
   │        ├── Agent analyzes intent → "create task"
   │        ├── Agent calls MCP tool: add_task(user_id, "Buy groceries")
   │        │   ├── Tool opens DB session
   │        │   ├── Creates Task row
   │        │   ├── Commits
   │        │   └── Returns {"success": true, "data": {"id": "...", "title": "Buy groceries"}}
   │        └── Agent generates: "Your task 'Buy groceries' has been created."
   ├── 3i. Extract final_output and tool_calls from RunResult
   ├── 3j. Store assistant message in DB (role="assistant")
   └── 3k. Return ChatResponse

4. Response to Client:
   {
     "conversation_id": "uuid-...",
     "response": "Your task 'Buy groceries' has been created.",
     "tool_calls": [{"tool": "add_task", "args": {"title": "Buy groceries"}}]
   }
```

**Error Handling Path**:
- JWT invalid → 401 Unauthorized (existing middleware)
- user_id mismatch → 403 Forbidden
- Invalid request body → 422 Validation Error (Pydantic)
- Conversation not found / wrong user → 404 Not Found
- DB unreachable → 503 Service Unavailable with structured error
- OpenAI API unavailable → 503 Service Unavailable with user-friendly message
- MCP tool error → Agent receives error, communicates to user conversationally

**Multi-Tool Chaining**: The OpenAI Agents SDK handles this natively. When the agent determines multiple tools are needed (e.g., "list tasks and delete the first one"), it executes them sequentially within a single `Runner.run()` call. No special orchestration needed.

---

## MCP Tool Execution Model

**Registration**: Tools registered via `@mcp.tool()` decorator on `FastMCP` server instance. Each tool's docstring becomes the tool description for the AI agent. Python type hints generate the JSON schema automatically.

**Validation**: Input validation occurs at two levels:
1. MCP SDK validates types via Python type hints
2. Tool function validates business rules (non-empty title, valid UUID, user_id scoping)

**Statelessness**: Each tool invocation:
1. Receives all required parameters (no state carried over)
2. Opens a fresh async DB session
3. Executes the operation
4. Returns result and closes session

**Results Returned**: Tools return Python dicts/strings. The MCP SDK serializes them and the Agents SDK passes them to the model as tool results. The agent then formulates a natural language response.

---

## Agent Runtime Model

**Prompt Construction**: System instructions define:
- Role: "You are a task management assistant"
- Behavior: "ALWAYS use tools for task operations, NEVER fabricate data"
- Confirmation: "Confirm actions ONLY after tool execution succeeds"
- Clarification: "Ask for clarification when user references are ambiguous"
- Boundaries: "Only manage tasks — for unrelated questions, respond conversationally without tools"

**History Injection**: Last 20 messages from DB, transformed to SDK's input format. Passed as `input` parameter list (not appended to system prompt).

**Hallucination Minimization**:
- System prompt explicitly forbids fabricating task data
- All task information must come from tool results
- Error responses must use actual tool errors
- Agent cannot claim actions completed without tool execution

**Tool Selection Constraint**: Agent receives exactly 5 tools via MCP server. No additional tools available. Model selects based on intent matching to tool descriptions.

---

## Database Access Pattern

**Session Lifecycle**: One async session per DB operation scope. Chat service creates sessions for conversation/message operations. MCP tools create separate sessions for task operations. All sessions are scoped to `async with` blocks.

**Async Strategy**: All DB operations use `await` with `asyncpg` driver. SQLModel's async session provides `select()`, `add()`, `commit()`, `refresh()`.

**Neon Serverless Constraints**:
- No long-lived connection pools (Neon handles pooling)
- SSL required for all connections
- Connection string includes `sslmode=require`
- Existing `database.py` engine factory handles this

**Retry/Connection Pooling**: Rely on Neon's built-in connection pooling. No application-level retry logic — if DB is unreachable, return 503 error immediately.

---

## Scalability Design

**Horizontal Scaling**: Any backend instance can handle any request. Zero server-side state means no session affinity required. Load balancer can round-robin freely.

**Cold Starts**: MCP server starts per-request (stdio transport). Agent created per-request. First request may be slightly slower due to MCP tool discovery, but subsequent requests within the same process benefit from Python module caching.

**Parallel Requests**: Each request runs independently. No shared mutable state. Async FastAPI handles concurrent requests within a single process. Multiple processes/containers handle higher concurrency.

**Load-Balanced Deployment**: Deploy N identical containers behind a load balancer. Each container runs `uvicorn` with the same code and env vars. No shared state — only the database is shared.

---

## Security Model

**User Isolation**: Every MCP tool receives `user_id` and filters ALL queries by it. `conversation_id` ownership verified against `user_id`. No query ever runs without `WHERE user_id = :user_id`.

**Input Validation**:
- JWT validated on every request (existing middleware)
- Path `user_id` must match JWT `sub` claim
- Request body validated by Pydantic schemas
- MCP tool inputs validated by type hints + business rules
- Message content: max 2000 characters

**MCP Trust Constraints**:
- MCP server runs in-process (stdio) — no network exposure
- Tools only accessible via the agent within a request
- No external MCP connections accepted
- Agent cannot call tools outside the registered MCP server

---

## New Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `openai-agents` | latest | Agent orchestration + MCP client |
| `mcp` | >=1.26.0 | MCP server SDK for tool exposure |
| `openai` | latest | Required by openai-agents |

**Frontend**: No new npm dependencies. Chat UI built with existing React + Tailwind.

---

## Environment Variables (New)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `OPENAI_API_KEY` | Yes | — | OpenAI API key for agent model |
| `OPENAI_MODEL` | No | `gpt-4o-mini` | Model for agent reasoning |
