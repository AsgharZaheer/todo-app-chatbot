# Data Model: Task CRUD

**Feature**: 001-task-crud
**Date**: 2026-02-12
**Phase**: 1 (Design & Contracts)

## Entities

### Task

The core entity representing a user's to-do item. Scoped to a single
user via `user_id` foreign key (tenant isolation).

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| `id` | UUID | PK, auto-generated | Server-generated, not user-provided |
| `title` | String | NOT NULL, 1-200 chars | Required field per FR-001 |
| `description` | String | Nullable, max 1000 chars | Optional per FR-001 |
| `status` | Enum("pending","completed") | NOT NULL, default "pending" | FR-004: toggleable |
| `priority` | Enum("low","medium","high") | NOT NULL, default "medium" | Assumption: default "medium" |
| `tags` | Array[String] | NOT NULL, default [] | Free-text labels, PostgreSQL ARRAY (R5) |
| `due_date` | DateTime (ISO 8601) | Nullable | Optional; required if recurrence is set (FR-012) |
| `recurrence` | Enum("none","daily","weekly","monthly") | NOT NULL, default "none" | FR-012: requires due_date |
| `user_id` | String | NOT NULL, FK → User(id) | Tenant isolation key (FR-006) |
| `created_at` | DateTime | NOT NULL, auto server timestamp | Immutable after creation |
| `updated_at` | DateTime | NOT NULL, auto server timestamp | Updated on every mutation |

**Indexes**:
- `idx_task_user_id` on `user_id` — primary access pattern (all queries filter by user)
- `idx_task_user_status` on `(user_id, status)` — filter by completion status
- `idx_task_tags` GIN index on `tags` — filter by tags

### User (External)

User identity comes from Better Auth. The backend does NOT manage a
local User table — it trusts the `user_id` claim from the validated JWT.
The `user_id` field on Task references this external identity.

## Validation Rules (from Task Intelligence Skill)

| Field | Rule | Error Code |
|-------|------|------------|
| `title` | Required, 1-200 characters | `VALIDATION_ERROR` |
| `description` | Optional, max 1000 characters | `VALIDATION_ERROR` |
| `priority` | Must be one of: low, medium, high | `VALIDATION_ERROR` |
| `recurrence` | Must be one of: none, daily, weekly, monthly | `VALIDATION_ERROR` |
| `recurrence` | If not "none", `due_date` MUST be set | `VALIDATION_ERROR` |
| `due_date` | Must be valid ISO 8601 datetime if provided | `VALIDATION_ERROR` |
| `tags` | Each tag must be a non-empty string | `VALIDATION_ERROR` |

## State Transitions

```text
Task.status:
  "pending" ←→ "completed"  (toggle via PATCH /api/tasks/{id}/toggle)

No other status values exist. No soft-delete — deletion is permanent (FR-005).
```

## Relationships

```text
User (1) ──── owns ────→ (N) Task
  └── user_id (FK, from JWT claim, NOT a local table)
```
