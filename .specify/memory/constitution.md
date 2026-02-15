<!--
  Sync Impact Report
  ==================
  Version change: 0.0.0 (template) → 1.0.0 (initial ratification)
  Modified principles: N/A (first fill from template placeholders)
  Added sections:
    - 6 Core Principles (Spec-Driven, Agentic Development, Reusability,
      Security-First, Monorepo Boundary Enforcement, Simplicity & YAGNI)
    - Technology Stack (frontend, backend, auth, agentic dev stack)
    - Development Workflow (SDD pipeline, agent-gated, quality gates)
    - Governance (amendment procedure, versioning, compliance)
  Removed sections: None
  Templates requiring updates:
    - .specify/templates/plan-template.md — ✅ Compatible
      (Constitution Check section already references constitution gates)
    - .specify/templates/spec-template.md — ✅ Compatible
      (User stories, requirements, success criteria align with principles)
    - .specify/templates/tasks-template.md — ✅ Compatible
      (Phase structure, parallel markers, user story org all aligned)
  Follow-up TODOs: None
-->

# Hackathon Todo – Phase 2 Constitution

## Core Principles

### I. Spec-Driven Development

All implementation work MUST reference an approved specification under
`specs/<feature>/spec.md` before any code is written. No code changes are
permitted without a traced spec, plan, or task artifact. Agents MUST refuse
to produce implementation output if the corresponding spec is missing or
in Draft status without explicit user override.

- Every feature follows: Specify → Plan → Tasks → Implement
- Specs are the single source of truth for requirements
- Plans are the single source of truth for architecture
- Tasks are the single source of truth for execution order

### II. Agentic Development

Development is performed by pre-defined agents orchestrated through
Claude Code and Spec-Kit Plus. Manual coding is NOT allowed. All code
MUST be produced by agents operating within their defined boundaries.

- **spec-orchestrator**: Gates all work through the spec pipeline
- **backend-domain-agent**: Owns FastAPI endpoints, models, services
- **bff-frontend-guardian**: Owns Next.js components and BFF patterns
- **auth-security-integrator**: Owns JWT, Better Auth, CORS, sessions
- **api-contract-enforcer**: Validates frontend-backend API contracts
- **monorepo-boundary-guard**: Enforces layer separation
- **integration-gatekeeper**: Validates end-to-end system integration
- Agents MUST NOT operate outside their defined domain boundaries
- Human-as-tool: Agents MUST invoke the user for ambiguous requirements,
  architectural uncertainty, or unforeseen dependencies

### III. Reusability & Skill Standardization

Reusable domain logic MUST be captured as skills (structured guidance
documents) that standardize behavior across agents. Skills define
validation rules, data shapes, and processing logic that all agents
reference rather than reinvent.

- Task handling (create, update, validate) follows the Task Intelligence
  Skill definitions
- Validation rules (field lengths, allowed values, required fields) are
  defined once and referenced everywhere
- API response shapes are consistent: `{ data, error, meta }` pattern
- Skills are living documents updated when domain rules change

### IV. Security-First

Authentication and authorization are non-negotiable prerequisites.
No endpoint may be exposed without proper auth middleware. User data
MUST be isolated per-tenant using JWT claims.

- Better Auth with JWT plugin handles frontend auth
- FastAPI middleware validates JWT tokens on every protected route
- User ID from JWT claims is the sole source of identity in backend
- CORS policies MUST be explicit (no wildcard origins in production)
- Secrets MUST use environment variables; never hardcoded
- All security events MUST be logged (login, logout, auth failures)

### V. Monorepo Boundary Enforcement

The project follows a strict monorepo layout with enforced boundaries
between layers. No cross-layer imports, no shared secrets, no hardcoded
URLs between frontend and backend.

- `frontend/` — Next.js 16+ (App Router), TypeScript, Tailwind CSS
- `backend/` — Python FastAPI, SQLModel ORM, Neon PostgreSQL
- `specs/` — Feature specifications, plans, and tasks
- `.specify/` — SpecKit Plus templates, scripts, and memory
- Frontend MUST NOT import backend modules or reference backend paths
- Backend MUST NOT reference frontend paths or components
- Environment variables MUST be layer-scoped (not shared across layers)
- Structure MUST be Docker-ready without refactoring

### VI. Simplicity & YAGNI

Start with the smallest viable implementation. Do not add features,
abstractions, or infrastructure beyond what the current task requires.
Complexity MUST be justified in writing.

- Prefer the smallest viable diff for every change
- Do not create helpers or abstractions for one-time operations
- Three similar lines of code is better than a premature abstraction
- Do not design for hypothetical future requirements
- If complexity is needed, document it in the Complexity Tracking table
  in the implementation plan

## Technology Stack

| Layer | Technology | Version / Notes |
|-------|-----------|-----------------|
| Frontend Framework | Next.js (App Router) | 16+ |
| Frontend Language | TypeScript | Strict mode |
| Frontend Styling | Tailwind CSS | Latest |
| Backend Framework | FastAPI | Latest |
| Backend Language | Python | 3.11+ |
| ORM | SQLModel | Latest |
| Database | Neon Serverless PostgreSQL | Managed |
| Authentication | Better Auth + JWT plugin | Frontend-initiated |
| Agentic Dev | Claude Code + Spec-Kit Plus | Phase 2 agents |

## Development Workflow

### SDD Pipeline

Every feature MUST progress through the full pipeline:

1. **Specify** (`/sp.specify`) — Capture requirements as user stories
   with acceptance scenarios and priority levels
2. **Plan** (`/sp.plan`) — Research, design architecture, define
   contracts and data models
3. **Tasks** (`/sp.tasks`) — Break plan into dependency-ordered,
   testable implementation tasks
4. **Implement** (`/sp.implement`) — Execute tasks via agents in
   dependency order

### Agent-Gated Quality

- **spec-orchestrator** MUST be invoked before any code is written
- **api-contract-enforcer** MUST validate after any API change
- **monorepo-boundary-guard** MUST validate before merges
- **integration-gatekeeper** MUST validate after multi-component work
- **auth-security-integrator** MUST review any new endpoint

### Quality Gates

- No unresolved `NEEDS CLARIFICATION` markers in specs before planning
- No code without a traced task ID
- All API responses follow consistent JSON structure
- All inputs validated at system boundaries
- PHR (Prompt History Record) created for every significant interaction

## Governance

This constitution supersedes all other development practices for the
Hackathon Todo Phase 2 project. All agents, specs, plans, and tasks
MUST comply with these principles.

### Amendment Procedure

1. Propose amendment with rationale and impact analysis
2. Update constitution with Sync Impact Report
3. Propagate changes to dependent templates
4. Version bump following semantic versioning:
   - **MAJOR**: Principle removal or incompatible redefinition
   - **MINOR**: New principle or materially expanded guidance
   - **PATCH**: Clarifications, wording, non-semantic refinements

### Compliance

- Every spec MUST pass a Constitution Check before planning
- Every plan MUST reference constitution principles in its gates
- Complexity violations MUST be documented and justified
- Agents MUST refuse work that violates these principles

**Version**: 1.0.0 | **Ratified**: 2026-02-12 | **Last Amended**: 2026-02-12
