# Contract: Toggle Task Completion

**Endpoint**: `PATCH /api/tasks/{id}/toggle`
**Auth**: Required (JWT Bearer token)
**User Story**: US2 (Update and Complete Tasks)
**Functional Requirements**: FR-004, FR-006

## Request

**Headers**:
- `Authorization: Bearer <jwt_token>` (required)

**Path Parameters**:

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | UUID | Task identifier |

**Body**: None required. The server toggles the current status.

## Response

**Success (200 OK)**:
```json
{
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "title": "Buy groceries",
    "description": "Milk, eggs, bread",
    "status": "completed",
    "priority": "medium",
    "tags": ["shopping", "home"],
    "due_date": "2026-02-15T18:00:00Z",
    "recurrence": "weekly",
    "created_at": "2026-02-12T10:30:00Z",
    "updated_at": "2026-02-12T11:15:00Z"
  },
  "error": null,
  "meta": null
}
```

**Not Found (404)**: Task does not exist or belongs to another user.

**Auth Error (401)**: Missing or invalid JWT token.

## Notes

- Toggles: "pending" → "completed", "completed" → "pending"
- `updated_at` is set to current server timestamp
- SC-006: Frontend should display toggle result in <500ms perceived time
- Separate from PATCH /api/tasks/{id} to enable single-click UX without
  requiring a request body
