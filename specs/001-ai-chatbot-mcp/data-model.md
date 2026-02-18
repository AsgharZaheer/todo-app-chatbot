# Data Model: Conversational Task Management with MCP Integration

**Feature**: 001-ai-chatbot-mcp
**Date**: 2026-02-16

## Existing Entities (No Changes)

### Task (existing — `tasks` table)
| Field | Type | Constraints |
|-------|------|-------------|
| id | UUID | PK, auto-generated |
| title | str | max 200 chars, required |
| description | str | max 1000 chars, nullable |
| status | enum | "pending" / "completed" |
| priority | enum | "low" / "medium" / "high" |
| tags | list[str] | JSON-encoded |
| due_date | datetime | nullable |
| recurrence | enum | "none" / "daily" / "weekly" / "monthly" |
| user_id | str | indexed, required |
| created_at | datetime | auto-set |
| updated_at | datetime | auto-updated |

**Indexes**: `idx_task_user_id`, `idx_task_user_status`

### User (existing — `users` table)
| Field | Type | Constraints |
|-------|------|-------------|
| id | UUID | PK, auto-generated |
| name | str | max 100 chars |
| email | str | unique, indexed, max 255 |
| hashed_password | str | max 255 |
| created_at | datetime | auto-set |

## New Entities

### Conversation (`conversations` table)
| Field | Type | Constraints |
|-------|------|-------------|
| id | UUID | PK, auto-generated |
| user_id | str | indexed, required, NOT NULL |
| created_at | datetime | auto-set, NOT NULL |
| updated_at | datetime | auto-updated, NOT NULL |

**Indexes**: `idx_conversation_user_id` on `(user_id)`

**Business Rules**:
- A conversation belongs to exactly one user
- A user can have multiple conversations
- Conversations are never deleted (soft persistence for history)

### Message (`messages` table)
| Field | Type | Constraints |
|-------|------|-------------|
| id | UUID | PK, auto-generated |
| conversation_id | UUID | FK → conversations.id, indexed, NOT NULL |
| user_id | str | indexed, required, NOT NULL |
| role | str | enum: "user" / "assistant", NOT NULL |
| content | text | required, NOT NULL |
| created_at | datetime | auto-set, NOT NULL |

**Indexes**: `idx_message_convo_created` on `(conversation_id, created_at)` — optimized for sliding window query

**Business Rules**:
- A message belongs to exactly one conversation
- A message has a role: "user" (from human) or "assistant" (from AI agent)
- Messages are immutable once created (no updates or deletes)
- Messages are ordered by `created_at` within a conversation
- Sliding window: last 20 messages fetched per request for agent context

## Entity Relationships

```
User (1) ──── (*) Task
User (1) ──── (*) Conversation
Conversation (1) ──── (*) Message
```

- User owns Tasks (existing relationship, unchanged)
- User owns Conversations (new)
- Conversation contains Messages (new)
- All queries scoped by `user_id` for tenant isolation

## State Transitions

### Task Status (via MCP tools)
```
pending ──[complete_task]──> completed
```
Note: MCP `complete_task` tool sets status to "completed". No reverse transition via chat (matches spec scope).

### Conversation Lifecycle
```
(none) ──[first message, no conversation_id]──> created
created ──[subsequent messages]──> updated (updated_at refreshed)
```
Conversations are never closed or deleted.

### Message Lifecycle
```
(none) ──[user sends message]──> user message stored
(none) ──[agent responds]──> assistant message stored
```
Messages are append-only. No updates or deletes.
