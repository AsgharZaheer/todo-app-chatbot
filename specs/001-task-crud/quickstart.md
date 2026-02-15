# Quickstart: Task CRUD

**Feature**: 001-task-crud
**Date**: 2026-02-12

## Prerequisites

- Python 3.11+
- Node.js 18+ and npm
- A Neon PostgreSQL database (free tier works)
- Git

## Backend Setup

```bash
cd backend

# Create and activate virtual environment
python -m venv venv
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your values:
#   DATABASE_URL=postgresql+asyncpg://<user>:<pass>@<host>/<db>?sslmode=require
#   JWT_SECRET=<your-better-auth-jwt-secret>
#   CORS_ORIGINS=http://localhost:3000

# Start the development server (tables auto-created on startup)
uvicorn app.main:app --reload --port 8000
```

Backend will be available at `http://localhost:8000`.
API docs at `http://localhost:8000/docs`.

## Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Configure environment
cp .env.local.example .env.local
# Edit .env.local with your values:
#   NEXT_PUBLIC_API_URL=http://localhost:8000
#   NEXT_PUBLIC_BETTER_AUTH_URL=<your-better-auth-url>

# Start the development server
npm run dev
```

Frontend will be available at `http://localhost:3000`.

## Verify Setup

1. Open `http://localhost:3000` in your browser
2. Log in (or register) via Better Auth
3. Create a task with title "Test task"
4. Verify it appears in the task list
5. Toggle completion — status should change to "completed"
6. Delete the task — it should disappear from the list

## API Quick Test (curl)

```bash
# Get a JWT token (from Better Auth login flow)
TOKEN="your-jwt-token-here"

# Create a task
curl -X POST http://localhost:8000/api/tasks \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title": "Test task", "priority": "high"}'

# List tasks
curl http://localhost:8000/api/tasks \
  -H "Authorization: Bearer $TOKEN"

# Toggle completion (replace {id} with actual task ID)
curl -X PATCH http://localhost:8000/api/tasks/{id}/toggle \
  -H "Authorization: Bearer $TOKEN"

# Delete task
curl -X DELETE http://localhost:8000/api/tasks/{id} \
  -H "Authorization: Bearer $TOKEN"
```

## Running Tests

### Backend Tests (36 tests)

```bash
cd backend
pip install aiosqlite pytest-asyncio  # test-only deps
python -m pytest tests/ -v
```

### Frontend Tests (22 tests)

```bash
cd frontend
npm test
```

## Environment Variables

### Backend (.env)

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | Neon PostgreSQL connection string (asyncpg format) |
| `JWT_SECRET` | Yes | Secret key for JWT token validation (from Better Auth) |
| `CORS_ORIGINS` | Yes | Comma-separated allowed origins |

### Frontend (.env.local)

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_API_URL` | Yes | Backend API base URL |
| `NEXT_PUBLIC_BETTER_AUTH_URL` | Yes | Better Auth service URL |
