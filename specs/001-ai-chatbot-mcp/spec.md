# Feature Specification: Conversational Task Management System with MCP Integration

**Feature Branch**: `001-ai-chatbot-mcp`
**Created**: 2026-02-16
**Status**: Draft
**Input**: User description: "Phase III — Conversational AI interface for todo task management using OpenAI Agents SDK and MCP tools"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Create Task via Natural Language (Priority: P1)

A user opens the chat interface and types a natural language request like "Add a task to buy groceries" or "Create a task: Prepare quarterly report". The AI agent understands the intent, invokes the `add_task` MCP tool with the extracted title and optional description, and confirms the creation with a friendly conversational response including the task details.

**Why this priority**: Task creation is the most fundamental operation. Without it, no other task management features have meaning. This validates the entire Agent → MCP Tool → Database pipeline end-to-end.

**Independent Test**: Can be fully tested by sending a create-intent message through the chat endpoint and verifying a new task appears in the database with correct attributes. Delivers immediate value by enabling hands-free task creation.

**Acceptance Scenarios**:

1. **Given** an authenticated user with no tasks, **When** the user sends "Add a task to buy groceries", **Then** the agent calls `add_task` with title "Buy groceries" and the response confirms "Your task 'Buy groceries' has been created."
2. **Given** an authenticated user, **When** the user sends "Create a task: Review PR #42 - need to check the auth middleware changes", **Then** the agent calls `add_task` with title "Review PR #42" and description "need to check the auth middleware changes" and confirms creation.
3. **Given** an authenticated user, **When** the user sends an ambiguous message like "groceries", **Then** the agent asks for clarification before invoking any tool.

---

### User Story 2 - List and Query Tasks via Conversation (Priority: P1)

A user asks the chatbot to show their tasks using natural language like "Show me my tasks", "What's on my list?", or "Show my completed tasks". The agent invokes the `list_tasks` MCP tool with optional status filtering and presents the results in a readable conversational format.

**Why this priority**: Viewing tasks is essential for all subsequent operations (complete, delete, update). Users need to see what exists before they can act on it. Co-equal with creation as a core operation.

**Independent Test**: Can be tested by pre-populating tasks and sending list-intent messages, verifying the response includes all matching tasks with correct details.

**Acceptance Scenarios**:

1. **Given** a user with 3 pending tasks, **When** the user sends "Show me my tasks", **Then** the agent calls `list_tasks` and responds with all 3 tasks listed in a readable format.
2. **Given** a user with both pending and completed tasks, **When** the user sends "Show my completed tasks", **Then** the agent calls `list_tasks` with status filter "completed" and shows only completed tasks.
3. **Given** a user with no tasks, **When** the user sends "What's on my list?", **Then** the agent responds conversationally that there are no tasks yet and suggests creating one.

---

### User Story 3 - Complete Task via Conversation (Priority: P2)

A user tells the chatbot to mark a task as done, e.g., "Mark 'buy groceries' as done" or "Complete task 3". The agent identifies the target task (via lookup if needed), invokes the `complete_task` MCP tool, and confirms the completion conversationally.

**Why this priority**: Completing tasks is a primary workflow action, but depends on task creation and listing being functional first.

**Independent Test**: Can be tested by creating a task, then sending a completion-intent message and verifying the task status changes to "completed" in the database.

**Acceptance Scenarios**:

1. **Given** a user with a pending task titled "Buy groceries", **When** the user sends "Mark buy groceries as done", **Then** the agent calls `list_tasks` to find the task, then calls `complete_task` with the task ID, and confirms "Your task 'Buy groceries' has been marked as complete."
2. **Given** a user with a task already completed, **When** the user sends "Complete buy groceries", **Then** the agent responds that the task is already completed.
3. **Given** a user referencing a non-existent task, **When** the user sends "Complete the meeting task", **Then** the agent responds that no matching task was found.

---

### User Story 4 - Delete Task via Conversation (Priority: P2)

A user requests deletion of a task, e.g., "Delete the groceries task" or "Remove task buy groceries". The agent locates the task, invokes the `delete_task` MCP tool, and confirms removal.

**Why this priority**: Deletion is a destructive action needed for task lifecycle management, but secondary to create/list/complete.

**Independent Test**: Can be tested by creating a task, sending a delete-intent message, and verifying the task no longer exists in the database.

**Acceptance Scenarios**:

1. **Given** a user with a task titled "Buy groceries", **When** the user sends "Delete the groceries task", **Then** the agent calls `list_tasks` to find it, then calls `delete_task`, and confirms "Your task 'Buy groceries' has been deleted."
2. **Given** a user referencing a non-existent task, **When** the user sends "Delete the meeting notes task", **Then** the agent responds that no matching task was found.

---

### User Story 5 - Update Task via Conversation (Priority: P3)

A user asks to modify an existing task, e.g., "Change the title of groceries task to Weekly groceries" or "Update the description of review PR task". The agent identifies the task, invokes the `update_task` MCP tool with the new values, and confirms the update.

**Why this priority**: Updating is a convenience feature that enhances the experience but is not essential for the core create-complete-delete lifecycle.

**Independent Test**: Can be tested by creating a task, sending an update-intent message, and verifying the task fields are updated in the database.

**Acceptance Scenarios**:

1. **Given** a user with a task titled "Buy groceries", **When** the user sends "Rename groceries task to Weekly grocery run", **Then** the agent calls `list_tasks` to find it, then calls `update_task` with the new title, and confirms the change.
2. **Given** a user with a task, **When** the user sends "Add a description to my groceries task: Remember to get organic produce", **Then** the agent updates the description field and confirms.

---

### User Story 6 - Multi-Turn Conversation Continuity (Priority: P2)

A user has an ongoing conversation with the chatbot across multiple messages. The system maintains context by persisting all messages in the database and reconstructing the conversation history for each new request. The user can reference previous messages naturally (e.g., "Also delete that one" after discussing a specific task).

**Why this priority**: Conversation continuity is what makes this a chatbot rather than a single-command system. It's essential for a natural user experience.

**Independent Test**: Can be tested by sending a sequence of related messages and verifying the agent maintains contextual understanding across turns.

**Acceptance Scenarios**:

1. **Given** a user who just created a task, **When** the user sends "Now show me all my tasks", **Then** the agent responds with the full task list including the just-created task, demonstrating context awareness.
2. **Given** a conversation with 10 previous messages, **When** the user sends a new message, **Then** the system fetches all prior messages from the database, builds the agent context correctly, and responds coherently.
3. **Given** a server that has been restarted, **When** the user continues a previous conversation using the same conversation_id, **Then** all prior messages are preserved and the agent responds with full context.

---

### User Story 7 - Chat Interface in Frontend (Priority: P3)

A user accesses a chat interface within the existing task management application. The interface provides a message input area, displays conversation history with clear visual distinction between user and assistant messages, and shows indicators when the agent is processing or using tools.

**Why this priority**: The frontend chat UI enhances user experience but the core value is in the backend conversational engine. A basic functional interface is sufficient for P3.

**Independent Test**: Can be tested by rendering the chat component, sending messages through it, and verifying messages appear with correct formatting and role distinction.

**Acceptance Scenarios**:

1. **Given** a user on the chat page, **When** they type a message and submit, **Then** the message appears in the chat history as a user message, a loading indicator shows, and the agent's response appears as an assistant message.
2. **Given** a user with existing conversation history, **When** they navigate to the chat page, **Then** previous messages are loaded and displayed correctly.
3. **Given** the agent uses MCP tools during processing, **When** the response is returned, **Then** the tool calls used are visible to the user as metadata.

---

### Edge Cases

- What happens when the user sends an empty message? The system returns a validation error without invoking the agent.
- What happens when the user sends a message unrelated to task management? The agent responds conversationally but does not invoke any MCP tools.
- What happens when multiple tasks match a vague reference (e.g., "delete the task")? The agent asks for clarification by listing matching tasks.
- What happens when the database is unreachable during a tool call? The MCP tool returns a structured error and the agent communicates the failure to the user.
- What happens when the OpenAI API is unavailable? The chat endpoint returns a service unavailable error with a user-friendly message.
- What happens when a conversation_id references a conversation belonging to a different user? The system rejects the request with an authorization error.
- What happens when the agent encounters a tool execution failure mid-conversation? The agent explains what went wrong using the tool's error response, not fabricated information.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide a chat endpoint at `POST /api/{user_id}/chat` that accepts a message and optional conversation_id, and returns an assistant response with tool call metadata.
- **FR-002**: System MUST use the OpenAI Agents SDK to orchestrate AI reasoning and natural language understanding.
- **FR-003**: System MUST expose task operations exclusively through an MCP Server built with the Official MCP SDK, providing five tools: `add_task`, `list_tasks`, `complete_task`, `delete_task`, `update_task`.
- **FR-004**: System MUST persist all conversation state (conversations and messages) in the database with zero in-memory state retention on the server.
- **FR-005**: System MUST map user natural language intents to the correct MCP tool: create→`add_task`, list/show→`list_tasks`, complete/done→`complete_task`, delete/remove→`delete_task`, update/change→`update_task`.
- **FR-006**: System MUST store every user message and assistant reply in the `messages` table before returning the response.
- **FR-007**: System MUST fetch the last 20 messages of conversation history from the database at the start of each request to build agent context — no reliance on server memory. Older messages are preserved in the database but not sent to the AI model.
- **FR-008**: System MUST create a new conversation automatically when no `conversation_id` is provided in the request.
- **FR-009**: System MUST scope all task operations by `user_id` to prevent cross-user data access.
- **FR-010**: System MUST return structured error responses when tools fail, and the agent must communicate failures using actual tool error messages.
- **FR-011**: System MUST support the agent chaining multiple tool calls within a single request when the user intent requires it (e.g., "list my tasks and delete the first one").
- **FR-012**: System MUST validate that the `user_id` in the URL path matches the authenticated user's identity.
- **FR-013**: System MUST provide a frontend chat interface that displays conversation history, supports message input, and shows tool call metadata.
- **FR-014**: Each MCP tool MUST validate its inputs, return structured JSON responses, and persist changes using SQLModel with explicit transaction management.
- **FR-015**: The AI agent MUST confirm every action conversationally after tool execution — never before, never without actually executing the tool.

### Key Entities

- **Task**: Represents a user's todo item. Attributes: user_id, id, title, description (optional), completed (boolean), created_at, updated_at. Owned by a single user. All operations scoped by user_id.
- **Conversation**: Represents a chat session. Attributes: user_id, id, created_at, updated_at. Groups related messages together. Owned by a single user.
- **Message**: Represents a single message in a conversation. Attributes: user_id, id, conversation_id (references Conversation), role (user/assistant), content, created_at. Ordered by creation time within a conversation.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can create, list, complete, delete, and update tasks entirely through natural language conversation without using the traditional task management UI.
- **SC-002**: Conversations persist across server restarts with zero data loss — users can resume any conversation after downtime.
- **SC-003**: The system correctly maps natural language intent to the appropriate MCP tool in at least 90% of clear, unambiguous requests.
- **SC-004**: Each chat request completes within 10 seconds end-to-end (including AI reasoning, tool execution, and database persistence).
- **SC-005**: The system handles 50 concurrent chat sessions without degradation, enabled by the stateless architecture.
- **SC-006**: No task data is accessible across user boundaries — 100% tenant isolation maintained through user_id scoping in every MCP tool.
- **SC-007**: Users receive clear, actionable error messages when tool execution fails, with zero fabricated or assumed results.
- **SC-008**: The chat interface displays conversation history, distinguishes between user and assistant messages, and shows tool call metadata.

## Clarifications

### Session 2026-02-16

- Q: What is the maximum conversation history sent to the AI agent per request? → A: Sliding window of last 20 messages.

## Assumptions

- The existing Phase I/II authentication system (JWT-based, HS256, stored in localStorage) will be used to authenticate chat requests. The `user_id` is extracted from the JWT's `sub` claim.
- The existing Task model (with UUID id, title, description, status, priority, tags, due_date, recurrence, user_id, timestamps) will be reused. The Phase III MCP tools will operate on the `completed` field (mapping status "pending"/"completed") and the core fields (title, description).
- The existing Neon PostgreSQL database will be extended with two new tables (`conversations`, `messages`) while preserving the existing `tasks` and `users` tables.
- The OpenAI API key will be provided via environment variable (`OPENAI_API_KEY`).
- The MCP Server runs in-process with the FastAPI backend (stdio transport), not as a separate service.
- The chat endpoint uses the existing CORS configuration from Phase I/II.
- The frontend chat interface will be a new page/route within the existing Next.js application, coexisting with the existing task management UI.
- The system targets the OpenAI `gpt-4o-mini` model by default (configurable via environment variable) to balance cost and capability.
