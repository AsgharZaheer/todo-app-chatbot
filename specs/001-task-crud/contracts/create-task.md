# Contract: Create Task

**Endpoint**: `POST /api/tasks`
**Auth**: Required (JWT Bearer token)
**User Story**: US1 (Create and View Tasks)
**Functional Requirement**: FR-001

## Request

**Headers**:
- `Authorization: Bearer <jwt_token>` (required)
- `Content-Type: application/json`

**Body**:
```json
{
  "title": "Buy groceries",
  "description": "Milk, eggs, bread",
  "priority": "medium",
  "tags": ["shopping", "home"],
  "due_date": "2026-02-15T18:00:00Z",
  "recurrence": "weekly"
}
```

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `title` | string | Yes | 1-200 characters |
| `description` | string | No | Max 1000 characters |
| `priority` | string | No | "low", "medium", "high"; default "medium" |
| `tags` | string[] | No | Array of non-empty strings; default [] |
| `due_date` | string (ISO 8601) | No | Valid datetime |
| `recurrence` | string | No | "none", "daily", "weekly", "monthly"; default "none" |

## Response

**Success (201 Created)**:
```json
{
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "title": "Buy groceries",
    "description": "Milk, eggs, bread",
    "status": "pending",
    "priority": "medium",
    "tags": ["shopping", "home"],
    "due_date": "2026-02-15T18:00:00Z",
    "recurrence": "weekly",
    "created_at": "2026-02-12T10:30:00Z",
    "updated_at": "2026-02-12T10:30:00Z"
  },
  "error": null,
  "meta": null
}
```

**Validation Error (422)**:
```json
{
  "data": null,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Task validation failed",
    "details": [
      { "field": "title", "message": "Title is required and must be 1-200 characters" }
    ]
  },
  "meta": null
}
```

**Auth Error (401)**: Missing or invalid JWT token.

## Validation Rules

- Title required, 1-200 chars
- If recurrence is not "none", due_date MUST be provided (FR-012)
- `user_id` is extracted from JWT — never provided by client
