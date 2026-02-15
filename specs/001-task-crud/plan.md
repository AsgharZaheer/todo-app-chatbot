# Implementation Plan: Task CRUD

**Branch**: `001-task-crud` | **Date**: 2026-02-12 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-task-crud/spec.md`

## Summary

Implement full-stack Task CRUD for the Phase 2 Todo App. Authenticated
users create, view, update, delete, and toggle completion of tasks via
a Next.js frontend that calls a FastAPI backend. Tasks are persisted in
Neon PostgreSQL via SQLModel. JWT tokens issued by Better Auth gate all
API access. The backend enforces tenant isolation (user can only access
own tasks), input validation (per Task Intelligence Skill rules), and
returns consistent JSON responses. The frontend renders a responsive
Tailwind-styled task list with inline editing and filtering.

## Technical Context

**Language/Version**: Python 3.11+ (backend), TypeScript strict (frontend)
**Primary Dependencies**: FastAPI, SQLModel, Pydantic v2 (backend); Next.js 16+ App Router, Tailwind CSS (frontend); Better Auth + JWT plugin (auth)
**Storage**: Neon Serverless PostgreSQL (managed, connection via async driver `asyncpg`)
**Testing**: pytest + httpx (backend), Vitest + React Testing Library (frontend)
**Target Platform**: Web application (modern browsers, responsive mobile)
**Project Type**: Web (frontend + backend monorepo)
**Performance Goals**: Task list loads <2s for 100 tasks (SC-002), toggle completion <500ms perceived (SC-006), 50 concurrent users (SC-007)
**Constraints**: All endpoints require JWT auth, tenant isolation on every query, validation per Task Intelligence Skill rules
**Scale/Scope**: 50 concurrent users, up to 500 tasks per user, 4 user stories, 12 functional requirements

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Gate | Status |
|-----------|------|--------|
| I. Spec-Driven | Spec exists at `specs/001-task-crud/spec.md` with 12 FRs, 17 acceptance scenarios | PASS |
| II. Agentic Development | Plan assigns agents to domains: backend-domain-agent (API/models), bff-frontend-guardian (UI), auth-security-integrator (JWT), api-contract-enforcer (contracts), integration-gatekeeper (E2E) | PASS |
| III. Reusability | Task Intelligence Skill rules mapped to FR-001/FR-007 validation; consistent `{ data, error, meta }` response shape | PASS |
| IV. Security-First | JWT required on all endpoints (FR-009), tenant isolation (FR-006), no hardcoded secrets, explicit CORS | PASS |
| V. Monorepo Boundaries | `frontend/` and `backend/` strictly separated, layer-scoped env vars, no cross-imports | PASS |
| VI. Simplicity | Smallest viable diff per task, no bulk ops, no pagination, no custom sorting beyond default | PASS |

**Gate result**: ALL PASS — proceed to Phase 0.

## Project Structure

### Documentation (this feature)

```text
specs/001-task-crud/
├── plan.md              # This file
├── research.md          # Phase 0: technology decisions
├── data-model.md        # Phase 1: entity schema
├── quickstart.md        # Phase 1: developer setup guide
├── contracts/           # Phase 1: API endpoint contracts
│   ├── create-task.md
│   ├── list-tasks.md
│   ├── get-task.md
│   ├── update-task.md
│   ├── delete-task.md
│   └── toggle-task.md
└── checklists/
    └── requirements.md  # Spec quality checklist
```

### Source Code (repository root)

```text
backend/
├── app/
│   ├── main.py              # FastAPI app factory, CORS, router mounting
│   ├── config.py            # Settings from env vars (DATABASE_URL, JWT_SECRET, etc.)
│   ├── database.py          # Async SQLModel engine + session factory
│   ├── models/
│   │   └── task.py          # SQLModel Task entity
│   ├── schemas/
│   │   └── task.py          # Pydantic request/response schemas
│   ├── routers/
│   │   └── tasks.py         # /api/tasks endpoints
│   ├── services/
│   │   └── task_service.py  # Business logic (CRUD, validation, tenant filtering)
│   ├── middleware/
│   │   └── auth.py          # JWT validation dependency
│   └── utils/
│       └── responses.py     # Consistent { data, error, meta } helper
├── tests/
│   ├── conftest.py          # Fixtures (test DB, auth headers, client)
│   ├── test_tasks_api.py    # Endpoint contract tests
│   └── test_task_service.py # Service unit tests
├── requirements.txt
├── .env.example
└── alembic/                 # Database migrations (if needed)
    └── ...

frontend/
├── src/
│   ├── app/
│   │   ├── layout.tsx           # Root layout with auth provider
│   │   ├── page.tsx             # Landing/redirect
│   │   └── tasks/
│   │       ├── page.tsx         # Task list page (US1, US4)
│   │       └── [id]/
│   │           └── page.tsx     # Task detail/edit page (US2)
│   ├── components/
│   │   ├── TaskList.tsx         # Renders list of TaskCard items
│   │   ├── TaskCard.tsx         # Single task display with toggle/delete
│   │   ├── TaskForm.tsx         # Create/edit form with validation
│   │   ├── TaskFilters.tsx      # Filter controls (status, priority, tags)
│   │   └── ui/                  # Shared UI primitives (Button, Input, etc.)
│   ├── lib/
│   │   ├── api-client.ts        # Typed fetch wrapper for backend API
│   │   ├── auth.ts              # Better Auth client config
│   │   └── validators.ts        # Client-side validation (mirrors backend)
│   ├── hooks/
│   │   ├── useTasks.ts          # Data fetching hook (SWR/React Query pattern)
│   │   └── useAuth.ts           # Auth state hook
│   └── types/
│       └── task.ts              # TypeScript interfaces for Task
├── tests/
│   ├── components/
│   │   └── TaskCard.test.tsx
│   └── lib/
│       └── api-client.test.ts
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── next.config.ts
└── .env.local.example
```

**Structure Decision**: Web application layout (Option 2) selected per
Constitution Principle V (Monorepo Boundary Enforcement). `backend/` and
`frontend/` are fully independent with no cross-imports. Each has its
own dependency management, tests, and environment configuration.

## Complexity Tracking

> No Constitution Check violations — table intentionally empty.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| — | — | — |

## Agent Assignment

| Domain | Agent | Responsibilities |
|--------|-------|-----------------|
| API endpoints, models, services | backend-domain-agent | Implement FastAPI routes, SQLModel Task model, Pydantic schemas, task_service.py |
| Frontend components, pages | bff-frontend-guardian | Implement Next.js pages, React components, API client, hooks |
| JWT middleware, CORS, auth | auth-security-integrator | Implement JWT validation dependency, configure CORS, secure all routes |
| API contract validation | api-contract-enforcer | Validate frontend API calls match backend endpoints, response shapes |
| Layer separation | monorepo-boundary-guard | Validate no cross-imports between frontend/ and backend/ |
| End-to-end integration | integration-gatekeeper | Validate full flow: login → create task → view → update → delete |

## Skill Integration

| Skill | Used By | Purpose |
|-------|---------|---------|
| Task Intelligence | backend-domain-agent, bff-frontend-guardian | Validation rules: title 1-200 chars, description max 1000, priority enum, recurrence+due_date coupling |
| Recurrence Logic | backend-domain-agent | Validate recurrence requires due_date (FR-012), store recurrence enum |

## Data Flow

```text
User → Next.js Page → API Client (+ JWT header) → FastAPI Router
  → Auth Middleware (validate JWT, extract user_id)
  → Task Service (business logic + validation)
  → SQLModel (DB query with user_id filter)
  → Neon PostgreSQL

Response: PostgreSQL → SQLModel → Pydantic schema → JSON { data, error, meta }
  → Next.js → React state → UI update
```
