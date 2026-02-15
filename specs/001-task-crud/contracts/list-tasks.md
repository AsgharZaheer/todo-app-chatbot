# Contract: List Tasks

**Endpoint**: `GET /api/tasks`
**Auth**: Required (JWT Bearer token)
**User Story**: US1 (Create and View Tasks), US4 (Filter and Organize)
**Functional Requirements**: FR-002, FR-006, FR-010

## Request

**Headers**:
- `Authorization: Bearer <jwt_token>` (required)

**Query Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `status` | string | No | Filter by "pending" or "completed" |
| `priority` | string | No | Filter by "low", "medium", or "high" |
| `tag` | string | No | Filter by tag (exact match, single tag) |

## Response

**Success (200 OK)**:
```json
{
  "data": [
    {
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
    }
  ],
  "error": null,
  "meta": {
    "total": 1
  }
}
```

**Empty list (200 OK)**:
```json
{
  "data": [],
  "error": null,
  "meta": {
    "total": 0
  }
}
```

**Auth Error (401)**: Missing or invalid JWT token.

## Notes

- Returns ONLY tasks belonging to the authenticated user (FR-006)
- Default sort: `created_at` descending (newest first)
- No pagination for Phase 2 (supports up to 500 tasks per user)
- Filters are optional and combinable (AND logic)
