# Quickstart: Conversational Task Management with MCP Integration

**Feature**: 001-ai-chatbot-mcp
**Date**: 2026-02-16

## Prerequisites

- Python 3.11+
- Node.js 18+
- Neon PostgreSQL database (existing from Phase I/II)
- OpenAI API key

## Backend Setup

### 1. Install new dependencies

```bash
cd backend
pip install -r requirements.txt
```

New packages added to `requirements.txt`:
- `openai-agents` — Agent orchestration + MCP client
- `mcp[cli]` — MCP server SDK
- `openai` — Required by openai-agents

### 2. Configure environment

Add to `backend/.env`:

```env
# Existing (unchanged)
DATABASE_URL=postgresql+asyncpg://...
JWT_SECRET=your-jwt-secret
CORS_ORIGINS=http://localhost:3000

# New for Phase III
OPENAI_API_KEY=sk-...your-openai-api-key
OPENAI_MODEL=gpt-4o-mini
```

### 3. Start backend

```bash
cd backend
uvicorn app.main:app --reload --port 8000
```

New tables (`conversations`, `messages`) auto-created on startup.

## Frontend Setup

### 1. No new dependencies required

Chat UI uses existing React + Tailwind.

### 2. Start frontend

```bash
cd frontend
npm run dev
```

### 3. Access chat

Navigate to `http://localhost:3000/chat`

## Testing the Chat

### Quick test via curl

```bash
# Get a JWT token first (existing auth)
TOKEN=$(curl -s -X POST http://localhost:8000/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "password123"}' \
  | jq -r '.data.token')

# Send a chat message
curl -X POST http://localhost:8000/api/${USER_ID}/chat \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"message": "Add a task to buy groceries"}'
```

### Expected response

```json
{
  "data": {
    "conversation_id": "uuid-...",
    "response": "Your task 'Buy groceries' has been created.",
    "tool_calls": [
      {"tool": "add_task", "args": {"title": "Buy groceries"}}
    ]
  },
  "error": null,
  "meta": {"timestamp": "2026-02-16T..."}
}
```

## Running Tests

```bash
# Backend tests
cd backend
pytest tests/ -v

# Frontend tests
cd frontend
npm test
```

## Architecture Summary

```
Frontend (/chat) → POST /api/{user_id}/chat → FastAPI → Agent (OpenAI) → MCP Tools → Neon PostgreSQL
```

All conversation state persisted in DB. Server is fully stateless.
