# Tasks: Conversational Task Management with MCP Integration

**Input**: Design documents from `/specs/001-ai-chatbot-mcp/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/chat-api.md

**Tests**: Included as quality gate checkpoints per the spec's 10-stage delivery structure.

**Organization**: Tasks follow the user's mandated 10 Controlled Delivery Stages, then mapped to user stories for independent testing.

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup — Environment & Project Initialization

**Purpose**: Prepare runtime, dependencies, configuration boundaries (Stage 1)

- [x] T001 Add `openai-agents`, `mcp[cli]`, and `openai` to `backend/requirements.txt`
- [x] T002 [P] Add `OPENAI_API_KEY` and `OPENAI_MODEL` settings to `backend/app/config.py` using pydantic-settings
- [x] T003 [P] Create `backend/app/agents/__init__.py` empty module file
- [x] T004 [P] Create `backend/app/mcp_server/__init__.py` empty module file
- [x] T005 [P] Add `.env.example` entries for `OPENAI_API_KEY` and `OPENAI_MODEL=gpt-4o-mini`

---

## Phase 2: Foundational — Database Schema & Persistence (Stages 2–3)

**Purpose**: Define SQLModel entities and persistence infrastructure. MUST complete before any user story work.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [x] T006 [P] Create Conversation SQLModel in `backend/app/models/conversation.py` per data-model.md (id UUID PK, user_id str indexed, created_at, updated_at)
- [x] T007 [P] Create Message SQLModel in `backend/app/models/message.py` per data-model.md (id UUID PK, conversation_id FK, user_id str indexed, role enum, content text, created_at; composite index on conversation_id+created_at)
- [x] T008 Import Conversation and Message models in `backend/app/main.py` so SQLModel.metadata.create_all() auto-creates tables on startup
- [x] T009 Create Pydantic schemas in `backend/app/schemas/chat.py`: ChatRequest (message str max 2000, conversation_id optional UUID), ChatResponse (conversation_id, response, tool_calls list), ToolCallInfo (tool str, args dict)
- [x] T010 Verify new tables are created by starting the backend and checking database for `conversations` and `messages` tables

**Checkpoint — Database Operational (Quality Gate QG-1)**:
- **Test Scenario**: Start FastAPI server, connect to Neon PostgreSQL
- **Expected**: `conversations` and `messages` tables exist with correct columns and indexes
- **Failure Condition**: Tables missing, columns mismatched, or FK constraint absent

---

## Phase 3: MCP Server — Tool Construction (Stage 4)

**Purpose**: Build the MCP Server with FastMCP and register tool stubs before implementing business logic.

- [x] T011 Create FastMCP server instance in `backend/app/mcp_server/task_tools.py` using `from mcp.server.fastmcp import FastMCP; mcp = FastMCP("TaskTools")`
- [x] T012 Register `add_task` tool stub with `@mcp.tool()` decorator in `backend/app/mcp_server/task_tools.py` — signature: `(user_id: str, title: str, description: str = "") -> str`, docstring describing create intent
- [x] T013 [P] Register `list_tasks` tool stub with `@mcp.tool()` in `backend/app/mcp_server/task_tools.py` — signature: `(user_id: str, status: str = "") -> str`, docstring describing list intent
- [x] T014 [P] Register `complete_task` tool stub with `@mcp.tool()` in `backend/app/mcp_server/task_tools.py` — signature: `(user_id: str, task_id: str) -> str`, docstring describing completion intent
- [x] T015 [P] Register `delete_task` tool stub with `@mcp.tool()` in `backend/app/mcp_server/task_tools.py` — signature: `(user_id: str, task_id: str) -> str`, docstring describing delete intent
- [x] T016 [P] Register `update_task` tool stub with `@mcp.tool()` in `backend/app/mcp_server/task_tools.py` — signature: `(user_id: str, task_id: str, title: str = "", description: str = "") -> str`, docstring describing update intent

---

## Phase 4: MCP Tool Implementations (Stage 5)

**Purpose**: Implement stateless, DB-driven business logic inside each MCP tool. Each tool opens its own DB session, executes, commits, and closes.

### US1 — add_task Tool

- [x] T017 [US1] Implement `add_task` in `backend/app/mcp_server/task_tools.py` — open async DB session, create Task row (user_id, title, description, status="pending"), commit, return JSON `{"success": true, "data": {"id", "title", "description", "completed": false}}`
- [x] T018 [US1] Add input validation to `add_task`: reject empty title, enforce max 200 chars title, max 1000 chars description

### US2 — list_tasks Tool

- [x] T019 [US2] Implement `list_tasks` in `backend/app/mcp_server/task_tools.py` — open async DB session, query tasks WHERE user_id matches, optional status filter, return JSON `{"success": true, "data": {"tasks": [...], "count": N}}`
- [x] T020 [US2] Add validation: status must be "pending", "completed", or empty string

### US3 — complete_task Tool

- [x] T021 [US3] Implement `complete_task` in `backend/app/mcp_server/task_tools.py` — open async DB session, find task by task_id AND user_id, set status="completed", commit, return JSON result. Return error if not found or already completed.

### US4 — delete_task Tool

- [x] T022 [US4] Implement `delete_task` in `backend/app/mcp_server/task_tools.py` — open async DB session, find task by task_id AND user_id, delete row, commit, return JSON `{"success": true, "data": {"id", "title", "deleted": true}}`. Return error if not found.

### US5 — update_task Tool

- [x] T023 [US5] Implement `update_task` in `backend/app/mcp_server/task_tools.py` — open async DB session, find task by task_id AND user_id, update provided fields (title, description), commit, return JSON result. Return error if not found or no fields provided.

**Checkpoint — MCP Tools Callable Independently (Quality Gate QG-2)**:
- **Test Scenario**: Call each tool function directly with test user_id and verify DB mutations
- **Expected**: Each tool creates/reads/updates/deletes correctly, returns structured JSON, scopes by user_id
- **Failure Condition**: Tool accesses wrong user's data, returns unstructured response, or fails to commit

---

## Phase 5: Agent Orchestration Layer (Stage 6)

**Purpose**: Configure OpenAI Agent with MCP server binding, system prompt, and safety guardrails.

- [x] T024 Create agent factory function in `backend/app/agents/task_agent.py` that returns a configured `Agent` instance with: name="TaskAssistant", model from `OPENAI_MODEL` setting, mcp_servers list
- [x] T025 Write system instruction prompt in `backend/app/agents/task_agent.py` defining: role (task management assistant), behavior rules (ALWAYS use tools, NEVER fabricate data), confirmation rules (confirm ONLY after tool execution), clarification rules (ask when ambiguous), boundaries (only task management, respond conversationally for off-topic)
- [x] T026 Create agent runner function in `backend/app/agents/task_agent.py` that accepts message history as `list` input and calls `Runner.run(agent, input=messages)`, returns `RunResult`

**Checkpoint — Agent Invokes Tools (Quality Gate QG-3)**:
- **Test Scenario**: Create agent with MCP server, send "Add a task called test", verify tool invocation
- **Expected**: Agent calls `add_task` MCP tool, returns confirmation text via `RunResult.final_output`
- **Failure Condition**: Agent responds without tool call, fabricates data, or raises exception

---

## Phase 6: Stateless Chat Execution Pipeline (Stage 7)

**Purpose**: Implement the full request lifecycle: history reconstruction → agent run → persistence → response. This is the core orchestration layer.

### US6 — Conversation Continuity

- [x] T027 [US6] Create `chat_service.py` in `backend/app/services/chat_service.py` with `handle_chat(user_id, message, conversation_id, db_session)` function
- [x] T028 [US6] Implement conversation load/create logic in `chat_service.py`: if conversation_id provided, verify ownership (user_id match) and fetch; if null, create new Conversation row
- [x] T029 [US6] Implement message history fetch in `chat_service.py`: query last 20 messages for conversation ordered by created_at ASC (FR-007 sliding window)
- [x] T030 [US6] Implement message persistence in `chat_service.py`: store user message (role="user") BEFORE agent run, store assistant message (role="assistant") AFTER agent run
- [x] T031 [US6] Implement agent execution in `chat_service.py`: build message list from DB history + new user message, transform to SDK input format, call agent runner, extract final_output and tool_calls from RunResult
- [x] T032 [US6] Implement response construction in `chat_service.py`: build ChatResponse with conversation_id, response text, and tool_calls metadata
- [x] T033 [US6] Add error handling in `chat_service.py`: catch OpenAI API errors (return 503), catch DB errors (return 503), catch conversation-not-found (return 404)

**Checkpoint — Stateless Behavior Confirmed (Quality Gate QG-4)**:
- **Test Scenario**: Send chat message, restart server, send follow-up with same conversation_id
- **Expected**: Conversation resumes with full history, no data loss, agent responds with context
- **Failure Condition**: History lost after restart, or server holds in-memory state between requests

---

## Phase 7: API Surface (Stage 8)

**Purpose**: Expose POST `/api/{user_id}/chat` endpoint per the contract.

- [x] T034 Create chat router in `backend/app/routers/chat.py` with `POST /api/{user_id}/chat` endpoint
- [x] T035 Add JWT authentication dependency to chat endpoint using existing `get_current_user_id` middleware
- [x] T036 Add user_id path-vs-JWT validation in chat router: reject with 403 if path user_id != JWT sub claim (FR-012)
- [x] T037 Wire ChatRequest Pydantic schema for request validation (message required, max 2000 chars; conversation_id optional UUID)
- [x] T038 Delegate to `chat_service.handle_chat()` and return ChatResponse wrapped in `{ data, error, meta }` envelope using existing `success_response()` utility
- [x] T039 Mount chat router in `backend/app/main.py` via `app.include_router(chat_router)`

**Checkpoint — End-to-End Conversational Workflow (Quality Gate QG-5)**:
- **Test Scenario**: Send POST to `/api/{user_id}/chat` with "Add a task to buy groceries"
- **Expected**: Returns 200 with conversation_id, response confirming task created, tool_calls including add_task
- **Failure Condition**: 500 error, missing conversation_id, no tool_calls metadata, or fabricated response

---

## Phase 8: User Story 1 — Create Task via Natural Language (P1) 🎯 MVP

**Goal**: User sends natural language create-intent, agent calls add_task, confirms creation.

**Independent Test**: POST message "Add a task to buy groceries" → verify task in DB + confirmation response.

- [ ] T040 [US1] End-to-end test: send "Add a task to buy groceries" via chat endpoint, verify response includes "created" confirmation and tool_calls contains add_task
- [ ] T041 [US1] End-to-end test: send "Create a task: Review PR - check auth changes" and verify title/description extraction
- [ ] T042 [US1] End-to-end test: send ambiguous message "groceries" and verify agent asks for clarification without tool call

**Checkpoint**: User Story 1 fully functional — users can create tasks via natural language.

---

## Phase 9: User Story 2 — List and Query Tasks (P1)

**Goal**: User asks to see tasks, agent calls list_tasks with optional filters, presents results.

**Independent Test**: Pre-populate tasks, send "Show me my tasks" → verify all tasks returned.

- [ ] T043 [US2] End-to-end test: create 3 tasks, send "Show me my tasks", verify response lists all 3
- [ ] T044 [US2] End-to-end test: send "Show my completed tasks", verify status filter applied
- [ ] T045 [US2] End-to-end test: with no tasks, send "What's on my list?", verify empty-list response

**Checkpoint**: User Stories 1 AND 2 both work — create and list via conversation.

---

## Phase 10: User Story 3 — Complete Task (P2)

**Goal**: User tells chatbot to mark task done, agent finds task and calls complete_task.

**Independent Test**: Create task, send "Mark buy groceries as done" → verify status changed.

- [ ] T046 [US3] End-to-end test: create pending task, send "Mark buy groceries as done", verify completion confirmation and DB status change
- [ ] T047 [US3] End-to-end test: try completing already-completed task, verify appropriate response
- [ ] T048 [US3] End-to-end test: reference non-existent task, verify "not found" response

---

## Phase 11: User Story 4 — Delete Task (P2)

**Goal**: User requests task deletion, agent finds task and calls delete_task.

**Independent Test**: Create task, send "Delete the groceries task" → verify task removed from DB.

- [ ] T049 [US4] End-to-end test: create task, send "Delete the groceries task", verify deletion confirmation and task removed from DB
- [ ] T050 [US4] End-to-end test: reference non-existent task for deletion, verify "not found" response

---

## Phase 12: User Story 5 — Update Task (P3)

**Goal**: User requests task modification, agent finds task and calls update_task.

**Independent Test**: Create task, send "Rename groceries task to Weekly grocery run" → verify title changed.

- [ ] T051 [US5] End-to-end test: create task, send "Rename groceries task to Weekly grocery run", verify title updated in DB
- [ ] T052 [US5] End-to-end test: send "Add a description to my groceries task: Remember organic produce", verify description updated

---

## Phase 13: User Story 6 — Multi-Turn Conversation Continuity (P2)

**Goal**: System maintains context across multiple messages via DB-persisted history.

**Independent Test**: Send sequence of related messages, verify contextual understanding across turns.

- [ ] T053 [US6] End-to-end test: send "Add a task to buy groceries", then "Now show me all my tasks" in same conversation, verify context maintained
- [ ] T054 [US6] End-to-end test: verify conversation with 10+ messages correctly fetches last 20 from DB
- [ ] T055 [US6] End-to-end test: restart server, continue conversation with same conversation_id, verify history preserved

---

## Phase 14: User Story 7 — Chat Interface Frontend (P3)

**Goal**: Frontend chat page with message display, input, and tool call metadata.

**Independent Test**: Open /chat, send message, verify UI displays user and assistant messages.

- [x] T056 [P] [US7] Create chat TypeScript types in `frontend/src/types/chat.ts`: ChatMessage (id, role, content, created_at), ChatResponse (conversation_id, response, tool_calls), ToolCallInfo (tool, args)
- [x] T057 [P] [US7] Add chat API methods to `frontend/src/lib/api-client.ts`: `sendMessage(userId, message, conversationId?)` calling POST `/api/{user_id}/chat`
- [x] T058 [US7] Create `useChat` hook in `frontend/src/hooks/useChat.ts`: manages messages state, conversation_id, sendMessage function, loading state, error state
- [x] T059 [P] [US7] Create ChatMessage component in `frontend/src/components/ChatMessage.tsx`: renders single message with role-based styling (user right-aligned, assistant left-aligned), tool call metadata display
- [x] T060 [P] [US7] Create ChatInput component in `frontend/src/components/ChatInput.tsx`: text input with send button, disabled during loading, Enter key submit
- [x] T061 [US7] Create ChatHistory component in `frontend/src/components/ChatHistory.tsx`: renders list of ChatMessage components, auto-scroll to bottom on new message, loading skeleton
- [x] T062 [US7] Create chat page in `frontend/src/app/chat/page.tsx`: compose ChatHistory + ChatInput using useChat hook, require authentication
- [x] T063 [US7] Add "Chat" navigation link to `frontend/src/app/layout.tsx` pointing to /chat route

---

## Phase 15: Observability, Validation & Reliability (Stage 10)

**Purpose**: Logging, validation checkpoints, graceful error handling across all layers.

- [x] T064 Add structured logging to `chat_service.py`: log request start, conversation load, agent execution time, tool calls made, response sent
- [x] T065 [P] Add structured logging to MCP tools in `task_tools.py`: log tool invocation, user_id, operation result, errors
- [x] T066 [P] Add graceful error handling for OpenAI API failures in `chat_service.py`: catch timeout/rate-limit/auth errors, return 503 with user-friendly message
- [x] T067 [P] Add graceful error handling for DB connection failures in MCP tools: catch connection errors, return structured error JSON
- [x] T068 Validate all edge cases from spec: empty message (422), non-task messages (conversational response), cross-user conversation_id (404), tool failure mid-conversation (error from tool response)
- [ ] T069 Run quickstart.md validation: follow setup guide end-to-end and verify curl test produces expected output

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — start immediately
- **Phase 2 (Database)**: Depends on Phase 1 — BLOCKS all subsequent phases
- **Phase 3 (MCP Stubs)**: Depends on Phase 2 (needs models for type references)
- **Phase 4 (MCP Impl)**: Depends on Phase 3 (stubs must exist)
- **Phase 5 (Agent)**: Depends on Phase 3 (needs MCP server for binding)
- **Phase 6 (Pipeline)**: Depends on Phases 4 + 5 (needs working tools + agent)
- **Phase 7 (API)**: Depends on Phase 6 (needs chat_service)
- **Phases 8–13 (User Stories)**: Depend on Phase 7 (need working endpoint) — can run sequentially in priority order
- **Phase 14 (Frontend)**: Depends on Phase 7 (needs working API) — can run in PARALLEL with Phases 8–13
- **Phase 15 (Reliability)**: Depends on all prior phases

### User Story Dependencies

- **US1 (Create Task)**: Depends on Phase 7 — No story dependencies
- **US2 (List Tasks)**: Depends on Phase 7 — No story dependencies (can parallel with US1)
- **US3 (Complete Task)**: Depends on Phase 7 — Logically needs US1+US2 working for full test
- **US4 (Delete Task)**: Depends on Phase 7 — Logically needs US1+US2 working for full test
- **US5 (Update Task)**: Depends on Phase 7 — Logically needs US1+US2 working for full test
- **US6 (Continuity)**: Built in Phase 6, tested in Phase 13 — Needs Phase 7
- **US7 (Frontend)**: Depends on Phase 7 — Independent of other stories

### Parallel Opportunities

- **Phase 1**: T002–T005 all parallelizable (different files)
- **Phase 2**: T006, T007 parallelizable (different model files)
- **Phase 3**: T013–T016 parallelizable (tool stubs in same file but independent decorators)
- **Phase 4**: US1–US5 tool implementations can be parallelized
- **Phase 7**: API wiring mostly sequential
- **Phase 14**: Frontend tasks T056, T057, T059, T060 parallelizable (different files)
- **Phases 8–13 vs Phase 14**: User story E2E tests can run in parallel with frontend development

---

## Parallel Example: Phases 4–5

```bash
# Parallel batch 1: MCP tool implementations (all different operations, same file but independent functions)
T017, T019, T021, T022, T023  # add_task, list_tasks, complete_task, delete_task, update_task

# Parallel batch 2: Validation additions
T018, T020  # Input validation for add_task and list_tasks

# Sequential: Agent config (depends on MCP server)
T024 → T025 → T026
```

## Parallel Example: Phase 14

```bash
# Parallel batch 1: Types + API client + Components (different files)
T056, T057, T059, T060

# Sequential: Hook → Page → Navigation (depends on prior)
T058 → T061 → T062 → T063
```

---

## Quality Gate Summary

| Gate | After Phase | Test | Pass Criteria |
|------|-------------|------|---------------|
| QG-1 | Phase 2 | DB tables exist | conversations + messages tables with correct schema |
| QG-2 | Phase 4 | MCP tools callable | Each tool CRUDs correctly, scoped by user_id |
| QG-3 | Phase 5 | Agent invokes tools | Agent calls add_task when given create intent |
| QG-4 | Phase 6 | Stateless confirmed | Conversation survives server restart |
| QG-5 | Phase 7 | E2E chat works | Full request → tool → response cycle completes |

---

## Implementation Strategy

**MVP Scope**: Phases 1–8 (Setup → Create Task E2E). Delivers the full pipeline validated with US1.

**Incremental Delivery**:
1. Phases 1–2: Foundation (database + schemas)
2. Phases 3–5: Backend engine (MCP + Agent)
3. Phases 6–7: Pipeline + API (stateless chat)
4. Phase 8: MVP validation (US1 create task)
5. Phases 9–13: Remaining user stories
6. Phase 14: Frontend chat UI
7. Phase 15: Hardening + observability

**Total Tasks**: 69
**Per User Story**: US1 (6), US2 (5), US3 (4), US4 (3), US5 (3), US6 (10), US7 (8)
**Infrastructure**: 30 (Phases 1–7, 15)
