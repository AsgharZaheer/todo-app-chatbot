# Contract: Delete Task

**Endpoint**: `DELETE /api/tasks/{id}`
**Auth**: Required (JWT Bearer token)
**User Story**: US3 (Delete Tasks)
**Functional Requirements**: FR-005, FR-006

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
    "deleted": true
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

- Deletion is permanent (no soft-delete per spec)
- Returns 404 if task does not exist OR belongs to another user (FR-006)
- Only the owning user can delete their task
