# Contract: Get Task

**Endpoint**: `GET /api/tasks/{id}`
**Auth**: Required (JWT Bearer token)
**User Story**: US2 (Update and Complete Tasks)
**Functional Requirements**: FR-002, FR-006

## Request

**Headers**:
- `Authorization: Bearer <jwt_token>` (required)

**Path Parameters**:

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | UUID | Task identifier |

## Response

**Success (200 OK)**:
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

**Not Found (404)**:
```json
{
  "data": null,
  "error": {
    "code": "NOT_FOUND",
    "message": "Task not found",
    "details": []
  },
  "meta": null
}
```

**Auth Error (401)**: Missing or invalid JWT token.

## Notes

- Returns 404 if task does not exist OR belongs to another user (FR-006)
- Does not reveal whether the task exists for another user (security)
