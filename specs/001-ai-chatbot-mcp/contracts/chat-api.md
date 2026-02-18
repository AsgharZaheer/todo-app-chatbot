# API Contract: Chat Endpoint

**Feature**: 001-ai-chatbot-mcp
**Date**: 2026-02-16

## POST /api/{user_id}/chat

Send a message to the AI task assistant and receive a response.

### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| user_id | string | Yes | Authenticated user's ID (must match JWT `sub` claim) |

### Request Headers

| Header | Value | Required |
|--------|-------|----------|
| Authorization | Bearer {jwt_token} | Yes |
| Content-Type | application/json | Yes |

### Request Body

```json
{
  "message": "string (required, max 2000 chars)",
  "conversation_id": "string | null (optional, UUID)"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| message | string | Yes | User's natural language message, max 2000 characters |
| conversation_id | string (UUID) | No | Existing conversation to continue. If null/omitted, creates new conversation |

### Response Body (200 OK)

```json
{
  "data": {
    "conversation_id": "uuid-string",
    "response": "string",
    "tool_calls": [
      {
        "tool": "string",
        "args": {}
      }
    ]
  },
  "error": null,
  "meta": {
    "timestamp": "ISO-8601"
  }
}
```

| Field | Type | Description |
|-------|------|-------------|
| data.conversation_id | string (UUID) | Conversation ID (new or existing) |
| data.response | string | AI assistant's natural language response |
| data.tool_calls | array | List of MCP tools invoked during this request |
| data.tool_calls[].tool | string | Tool name (e.g., "add_task", "list_tasks") |
| data.tool_calls[].args | object | Arguments passed to the tool |

### Error Responses

| Status | Condition | Body |
|--------|-----------|------|
| 401 | Missing or invalid JWT | `{"data": null, "error": {"message": "Unauthorized", "code": "AUTH_ERROR"}, "meta": {...}}` |
| 403 | user_id does not match JWT sub claim | `{"data": null, "error": {"message": "Forbidden", "code": "FORBIDDEN"}, "meta": {...}}` |
| 404 | conversation_id not found or belongs to another user | `{"data": null, "error": {"message": "Conversation not found", "code": "NOT_FOUND"}, "meta": {...}}` |
| 422 | Invalid request body (missing message, too long) | `{"data": null, "error": {"message": "Validation error", "code": "VALIDATION_ERROR", "details": [...]}, "meta": {...}}` |
| 503 | OpenAI API or database unavailable | `{"data": null, "error": {"message": "Service temporarily unavailable", "code": "SERVICE_ERROR"}, "meta": {...}}` |

### Response Envelope

All responses follow existing `{ data, error, meta }` pattern from Phase I/II.

## MCP Tool Contracts

### add_task

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| user_id | string | Yes | Owner of the task |
| title | string | Yes | Task title, max 200 chars |
| description | string | No | Task description, max 1000 chars |

**Returns**: `{"success": true, "data": {"id": "uuid", "title": "...", "description": "...", "completed": false}}`

### list_tasks

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| user_id | string | Yes | Owner of the tasks |
| status | string | No | Filter: "pending" or "completed" |

**Returns**: `{"success": true, "data": {"tasks": [...], "count": N}}`

### complete_task

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| user_id | string | Yes | Owner of the task |
| task_id | string | Yes | UUID of the task to complete |

**Returns**: `{"success": true, "data": {"id": "uuid", "title": "...", "completed": true}}`
**Error**: `{"success": false, "error": "Task not found"}` if task_id invalid or belongs to another user

### delete_task

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| user_id | string | Yes | Owner of the task |
| task_id | string | Yes | UUID of the task to delete |

**Returns**: `{"success": true, "data": {"id": "uuid", "title": "...", "deleted": true}}`
**Error**: `{"success": false, "error": "Task not found"}` if task_id invalid or belongs to another user

### update_task

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| user_id | string | Yes | Owner of the task |
| task_id | string | Yes | UUID of the task to update |
| title | string | No | New title, max 200 chars |
| description | string | No | New description, max 1000 chars |

**Returns**: `{"success": true, "data": {"id": "uuid", "title": "...", "description": "...", "completed": false}}`
**Error**: `{"success": false, "error": "Task not found"}` or `{"success": false, "error": "No fields to update"}`
