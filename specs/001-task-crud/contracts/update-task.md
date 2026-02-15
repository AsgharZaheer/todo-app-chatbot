# Contract: Update Task

**Endpoint**: `PATCH /api/tasks/{id}`
**Auth**: Required (JWT Bearer token)
**User Story**: US2 (Update and Complete Tasks)
**Functional Requirements**: FR-003, FR-006, FR-007

## Request

**Headers**:
- `Authorization: Bearer <jwt_token>` (required)
- `Content-Type: application/json`

**Path Parameters**:

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | UUID | Task identifier |

**Body** (partial update — only include fields to change):
```json
{
  "title": "Buy organic groceries",
  "priority": "high",
  "tags": ["shopping", "health"]
}
```

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `title` | string | No | 1-200 characters |
| `description` | string | No | Max 1000 characters; send `null` to clear |
| `priority` | string | No | "low", "medium", "high" |
| `tags` | string[] | No | Array of non-empty strings |
| `due_date` | string (ISO 8601) | No | Valid datetime; send `null` to clear |
| `recurrence` | string | No | "none", "daily", "weekly", "monthly" |

## Response

**Success (200 OK)**:
```json
{
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "title": "Buy organic groceries",
    "description": "Milk, eggs, bread",
    "status": "pending",
    "priority": "high",
    "tags": ["shopping", "health"],
    "due_date": "2026-02-15T18:00:00Z",
    "recurrence": "weekly",
    "created_at": "2026-02-12T10:30:00Z",
    "updated_at": "2026-02-12T11:00:00Z"
  },
  "error": null,
  "meta": null
}
```

**Not Found (404)**: Task does not exist or belongs to another user.

**Validation Error (422)**: Same shape as create-task validation errors.

**Auth Error (401)**: Missing or invalid JWT token.

## Validation Rules

- Same field constraints as create-task
- If recurrence is changed to non-"none" and due_date is null (existing or
  in this update), return validation error (FR-012)
- `updated_at` is set to current server timestamp
- `status` cannot be changed via this endpoint (use toggle endpoint)
