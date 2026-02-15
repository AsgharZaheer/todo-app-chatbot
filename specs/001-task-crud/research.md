# Research: Task CRUD

**Feature**: 001-task-crud
**Date**: 2026-02-12
**Phase**: 0 (Outline & Research)

## Research Questions

No NEEDS CLARIFICATION items existed in Technical Context — all technology
choices were defined by the constitution. This document records rationale
for key implementation decisions.

## Decisions

### R1: Database Driver for Neon PostgreSQL

**Decision**: Use `asyncpg` via SQLModel's async session support.

**Rationale**: Neon Serverless PostgreSQL is wire-compatible with standard
PostgreSQL. `asyncpg` is the fastest async driver for Python and works
natively with SQLAlchemy/SQLModel async engines. Neon's serverless model
requires connection pooling awareness — use Neon's built-in pooler
endpoint (`-pooler` suffix) for connection strings.

**Alternatives considered**:
- `psycopg2` (sync) — rejected; FastAPI benefits from async I/O
- `psycopg3` (async) — viable but `asyncpg` has better performance
  benchmarks and wider SQLAlchemy/SQLModel community support

### R2: Frontend Data Fetching Pattern

**Decision**: Use SWR (stale-while-revalidate) via a custom `useTasks`
hook wrapping the native `fetch` API with JWT headers.

**Rationale**: SWR provides automatic caching, revalidation, and
optimistic UI updates. It is lightweight (no heavy state management
library needed) and pairs well with Next.js App Router. React Query
is an alternative but adds more complexity than needed for Phase 2 scope.

**Alternatives considered**:
- React Query (TanStack Query) — more features than needed; adds bundle size
- Plain `useEffect` + `fetch` — no caching, no automatic revalidation
- Next.js Server Actions — viable for mutations but less control over
  caching and optimistic updates for list operations

### R3: Authentication Token Flow

**Decision**: Better Auth issues JWT on login. Frontend stores token
in httpOnly cookie (managed by Better Auth). API client reads token
from cookie and sends as `Authorization: Bearer <token>` header.
Backend validates JWT signature and extracts `user_id` claim.

**Rationale**: httpOnly cookies prevent XSS token theft. Better Auth's
JWT plugin handles token issuance and refresh. The backend only needs
to validate signatures — it does not manage sessions.

**Alternatives considered**:
- localStorage token storage — rejected; vulnerable to XSS
- Session-based auth — rejected; adds server-side state, conflicts with
  stateless FastAPI design
- Better Auth session tokens (non-JWT) — rejected; harder to validate
  in a cross-origin FastAPI backend without Better Auth SDK on Python side

### R4: API Response Envelope

**Decision**: All API responses use `{ data, error, meta }` envelope.

**Rationale**: Consistent response shape simplifies frontend error handling
and enables the api-contract-enforcer agent to validate shapes automatically.
Aligns with Constitution Principle III (Reusability).

```json
{
  "data": { ... } | [ ... ] | null,
  "error": { "code": "VALIDATION_ERROR", "message": "...", "details": [...] } | null,
  "meta": { "total": 42, "timestamp": "2026-02-12T..." } | null
}
```

**Alternatives considered**:
- Raw response (no envelope) — rejected; inconsistent error handling
- JSON:API format — over-engineered for this scope

### R5: Tags Storage Strategy

**Decision**: Store tags as a PostgreSQL `ARRAY` column of strings.

**Rationale**: Tags are free-text labels with no taxonomy (per spec
Assumptions). PostgreSQL native arrays support indexing with GIN for
efficient filtering. Simpler than a separate tags table + join for
Phase 2 scope.

**Alternatives considered**:
- Separate `tags` table with many-to-many relationship — over-engineered
  for free-text labels without taxonomy
- JSON column — less query-friendly for filtering than native arrays
- Comma-separated string — poor query performance, no type safety

### R6: Frontend Validation Approach

**Decision**: Mirror backend validation rules in `validators.ts` using
the same constraints (title 1-200 chars, description max 1000, etc.).
Validate on the client before submission; backend re-validates independently.

**Rationale**: Client-side validation provides instant UX feedback.
Backend validation is the authoritative gate (never trust client input).
Mirroring rules ensures consistent error messages.

**Alternatives considered**:
- Backend-only validation — poor UX (round-trip for every validation error)
- Shared validation schema (e.g., Zod published as npm package) — cross-layer
  dependency violates Constitution Principle V (Monorepo Boundaries)
