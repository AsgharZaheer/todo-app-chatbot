---

description: "Task list for Task CRUD feature implementation"
---

# Tasks: Task CRUD

**Input**: Design documents from `/specs/001-task-crud/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/

**Tests**: Test tasks are included as the user explicitly requested full test coverage in objectives.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4)
- Include exact file paths in descriptions

## Path Conventions

- **Web app**: `backend/app/`, `frontend/src/`
- Paths are relative to repository root

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure for both backend and frontend

- [x] T001 Create backend project structure: `backend/app/__init__.py`, `backend/app/models/__init__.py`, `backend/app/schemas/__init__.py`, `backend/app/routers/__init__.py`, `backend/app/services/__init__.py`, `backend/app/middleware/__init__.py`, `backend/app/utils/__init__.py`, `backend/tests/__init__.py`
- [x] T002 Create `backend/requirements.txt` with dependencies: fastapi, uvicorn[standard], sqlmodel, asyncpg, pydantic[email], python-jose[cryptography], python-dotenv, httpx, pytest, pytest-asyncio
- [x] T003 [P] Create `backend/.env.example` with template variables: DATABASE_URL, JWT_SECRET, CORS_ORIGINS
- [x] T004 [P] Create frontend project: initialize Next.js 16+ with TypeScript and Tailwind CSS in `frontend/` directory, create `frontend/src/types/task.ts`, `frontend/src/lib/`, `frontend/src/hooks/`, `frontend/src/components/ui/`
- [x] T005 [P] Create `frontend/.env.local.example` with template variables: NEXT_PUBLIC_API_URL, NEXT_PUBLIC_BETTER_AUTH_URL

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**CRITICAL**: No user story work can begin until this phase is complete

- [x] T006 Implement backend configuration in `backend/app/config.py`: load DATABASE_URL, JWT_SECRET, CORS_ORIGINS from environment variables using Pydantic BaseSettings
- [x] T007 Implement async database engine and session factory in `backend/app/database.py`: create async SQLModel engine with asyncpg, create async session maker, create `get_session` dependency
- [x] T008 Implement SQLModel Task entity in `backend/app/models/task.py`: all 11 fields from data-model.md (id UUID PK, title, description, status enum, priority enum, tags ARRAY, due_date, recurrence enum, user_id, created_at, updated_at), define indexes (idx_task_user_id, idx_task_user_status, idx_task_tags GIN)
- [x] T009 Implement Pydantic request/response schemas in `backend/app/schemas/task.py`: TaskCreate (title required 1-200 chars, optional fields), TaskUpdate (all optional, partial update), TaskResponse (full task representation), TaskListResponse (array with meta.total), ErrorResponse (code, message, details array)
- [x] T010 Implement consistent response helper in `backend/app/utils/responses.py`: `success_response(data, meta)` and `error_response(code, message, details)` returning `{ data, error, meta }` envelope
- [x] T011 Implement JWT authentication dependency in `backend/app/middleware/auth.py`: validate Bearer token from Authorization header, extract user_id claim, return 401 on missing/invalid token. Reference contract: all endpoints require JWT
- [x] T012 Implement FastAPI app factory in `backend/app/main.py`: create app, configure CORS with explicit origins from config, mount task router under `/api`, add exception handlers for consistent error responses
- [x] T013 [P] Implement TypeScript Task interfaces in `frontend/src/types/task.ts`: Task, TaskCreate, TaskUpdate, TaskListResponse, ApiResponse<T> (matching `{ data, error, meta }` envelope), ErrorDetail
- [x] T014 [P] Implement Better Auth client configuration in `frontend/src/lib/auth.ts`: initialize Better Auth client, export auth helpers, configure JWT plugin
- [x] T015 [P] Implement typed API client in `frontend/src/lib/api-client.ts`: base fetch wrapper that attaches JWT from auth session as Bearer token, handles `{ data, error, meta }` response envelope, typed methods for each endpoint (createTask, listTasks, getTask, updateTask, deleteTask, toggleTask)
- [x] T016 [P] Implement auth hook in `frontend/src/hooks/useAuth.ts`: expose current user, isAuthenticated, token, login/logout functions from Better Auth
- [x] T017 [P] Implement root layout in `frontend/src/app/layout.tsx`: wrap with Better Auth provider, add global styles, configure metadata

**Checkpoint**: Foundation ready — user story implementation can now begin

---

## Phase 3: User Story 1 — Create and View Tasks (Priority: P1) MVP

**Goal**: Authenticated users can create tasks and see them in a list

**Independent Test**: Log in, create a task with various field combinations, verify it appears in the list with correct data

### Tests for User Story 1

> **Write these tests FIRST, ensure they FAIL before implementation**

- [x] T018 [P] [US1] Backend contract test for POST /api/tasks in `backend/tests/test_tasks_api.py`: test creating task with title only (201), test creating task with all fields (201), test validation error on empty title (422), test validation error on recurrence without due_date (422), test 401 on missing auth
- [x] T019 [P] [US1] Backend contract test for GET /api/tasks in `backend/tests/test_tasks_api.py`: test listing user's tasks returns only their tasks (200), test empty list (200), test 401 on missing auth
- [x] T020 [P] [US1] Backend service unit test in `backend/tests/test_task_service.py`: test create_task validates title length, test create_task sets defaults (status=pending, priority=medium, recurrence=none), test list_tasks filters by user_id
- [x] T021 [P] [US1] Frontend component test for TaskForm in `frontend/tests/components/TaskForm.test.tsx`: test renders create form with all fields, test validates title is required, test submits form with correct data shape

### Implementation for User Story 1

- [x] T022 [US1] Implement task_service.create_task in `backend/app/services/task_service.py`: validate input per Task Intelligence Skill rules (title 1-200, description max 1000, priority enum, recurrence requires due_date per FR-012), set defaults, persist via SQLModel, return created task
- [x] T023 [US1] Implement task_service.list_tasks in `backend/app/services/task_service.py`: query tasks filtered by user_id (FR-006 tenant isolation), order by created_at descending, return list with total count
- [x] T024 [US1] Implement POST /api/tasks endpoint in `backend/app/routers/tasks.py`: accept TaskCreate body, call auth dependency for user_id, call task_service.create_task, return 201 with `{ data, error, meta }` envelope. Reference: `specs/001-task-crud/contracts/create-task.md`
- [x] T025 [US1] Implement GET /api/tasks endpoint in `backend/app/routers/tasks.py`: call auth dependency for user_id, call task_service.list_tasks, return 200 with data array and meta.total. Reference: `specs/001-task-crud/contracts/list-tasks.md`
- [x] T026 [P] [US1] Implement client-side validators in `frontend/src/lib/validators.ts`: validateTitle (1-200 chars required), validateDescription (max 1000), validatePriority (low/medium/high), validateRecurrence (requires due_date if not "none"), return field-level error messages
- [x] T027 [US1] Implement useTasks data fetching hook in `frontend/src/hooks/useTasks.ts`: SWR-based hook calling api-client.listTasks, expose tasks array, loading state, error state, mutate function for optimistic updates
- [x] T028 [US1] Implement TaskForm component in `frontend/src/components/TaskForm.tsx`: form with title (required), description, priority select, tags input, due_date picker, recurrence select. Client-side validation using validators.ts. On submit call api-client.createTask and mutate task list
- [x] T029 [US1] Implement TaskCard component in `frontend/src/components/TaskCard.tsx`: display task title, status badge, priority indicator, tags, due date. Placeholder slots for toggle and delete actions (implemented in US2/US3)
- [x] T030 [US1] Implement TaskList component in `frontend/src/components/TaskList.tsx`: render array of TaskCard items, empty state message when no tasks, loading skeleton state
- [x] T031 [US1] Implement task list page in `frontend/src/app/tasks/page.tsx`: protected route (redirect to login if unauthenticated per acceptance scenario 4), render TaskForm for creation and TaskList for display, wire up useTasks hook

**Checkpoint**: User Story 1 fully functional — users can create and view tasks (MVP)

---

## Phase 4: User Story 2 — Update and Complete Tasks (Priority: P2)

**Goal**: Users can edit task fields and toggle completion status

**Independent Test**: Create a task, edit its title, toggle completion, verify changes persist after reload

### Tests for User Story 2

- [x] T032 [P] [US2] Backend contract test for GET /api/tasks/{id} in `backend/tests/test_tasks_api.py`: test get own task (200), test get non-existent task (404), test get other user's task returns 404 (not 403 — security), test 401 on missing auth
- [x] T033 [P] [US2] Backend contract test for PATCH /api/tasks/{id} in `backend/tests/test_tasks_api.py`: test update title (200), test partial update priority only (200), test update other user's task (404), test validation error on title >200 chars (422)
- [x] T034 [P] [US2] Backend contract test for PATCH /api/tasks/{id}/toggle in `backend/tests/test_tasks_api.py`: test toggle pending→completed (200), test toggle completed→pending (200), test toggle other user's task (404)
- [x] T035 [P] [US2] Backend service unit test in `backend/tests/test_task_service.py`: test get_task filters by user_id, test update_task applies partial changes, test toggle_task flips status

### Implementation for User Story 2

- [x] T036 [US2] Implement task_service.get_task in `backend/app/services/task_service.py`: query by id AND user_id (tenant isolation), return task or None
- [x] T037 [US2] Implement task_service.update_task in `backend/app/services/task_service.py`: validate partial update fields per Task Intelligence Skill rules, enforce recurrence+due_date coupling (FR-012), update only provided fields, set updated_at, return updated task
- [x] T038 [US2] Implement task_service.toggle_task in `backend/app/services/task_service.py`: flip status pending↔completed, set updated_at, return updated task
- [x] T039 [US2] Implement GET /api/tasks/{id} endpoint in `backend/app/routers/tasks.py`: auth dependency, call task_service.get_task, return 200 or 404. Reference: `specs/001-task-crud/contracts/get-task.md`
- [x] T040 [US2] Implement PATCH /api/tasks/{id} endpoint in `backend/app/routers/tasks.py`: accept TaskUpdate body, auth dependency, call task_service.update_task, return 200 or 404/422. Reference: `specs/001-task-crud/contracts/update-task.md`
- [x] T041 [US2] Implement PATCH /api/tasks/{id}/toggle endpoint in `backend/app/routers/tasks.py`: auth dependency, call task_service.toggle_task, return 200 or 404. Reference: `specs/001-task-crud/contracts/toggle-task.md`
- [x] T042 [US2] Add toggle action to TaskCard in `frontend/src/components/TaskCard.tsx`: checkbox/button that calls api-client.toggleTask, optimistic UI update (flip status immediately, revert on error), visual indicator for completed status (strikethrough or muted styling)
- [x] T043 [US2] Implement TaskForm edit mode in `frontend/src/components/TaskForm.tsx`: accept optional existing task prop, pre-fill fields with current values, on submit call api-client.updateTask instead of createTask, mutate task list after update
- [x] T044 [US2] Implement task detail/edit page in `frontend/src/app/tasks/[id]/page.tsx`: protected route, fetch task by id via api-client.getTask, render TaskForm in edit mode, handle 404 with error message, back link to task list

**Checkpoint**: Users can create, view, update, and toggle tasks

---

## Phase 5: User Story 3 — Delete Tasks (Priority: P3)

**Goal**: Users can permanently delete tasks they no longer need

**Independent Test**: Create a task, delete it, verify it no longer appears in the list

### Tests for User Story 3

- [x] T045 [P] [US3] Backend contract test for DELETE /api/tasks/{id} in `backend/tests/test_tasks_api.py`: test delete own task (200 with deleted:true), test delete non-existent task (404), test delete other user's task (404), test 401 on missing auth
- [x] T046 [P] [US3] Backend service unit test in `backend/tests/test_task_service.py`: test delete_task removes from DB, test delete_task returns None for non-existent/other-user tasks

### Implementation for User Story 3

- [x] T047 [US3] Implement task_service.delete_task in `backend/app/services/task_service.py`: query by id AND user_id, delete permanently (no soft-delete per FR-005), return True/False
- [x] T048 [US3] Implement DELETE /api/tasks/{id} endpoint in `backend/app/routers/tasks.py`: auth dependency, call task_service.delete_task, return 200 with `{ id, deleted: true }` or 404. Reference: `specs/001-task-crud/contracts/delete-task.md`
- [x] T049 [US3] Add delete action to TaskCard in `frontend/src/components/TaskCard.tsx`: delete button with confirmation dialog ("Are you sure?" per acceptance scenario 1), call api-client.deleteTask on confirm, remove from list via useTasks mutate

**Checkpoint**: Full CRUD operational — create, view, update, toggle, delete

---

## Phase 6: User Story 4 — Filter and Organize Tasks (Priority: P4)

**Goal**: Users can filter tasks by status, priority, and tags

**Independent Test**: Create tasks with different statuses/priorities/tags, apply filters, verify correct filtering

### Tests for User Story 4

- [x] T050 [P] [US4] Backend contract test for GET /api/tasks with filters in `backend/tests/test_tasks_api.py`: test filter by status=pending, test filter by priority=high, test filter by tag=work, test combined filters, test clear filters returns all
- [x] T051 [P] [US4] Frontend component test for TaskFilters in `frontend/tests/components/TaskFilters.test.tsx`: test renders filter controls (status, priority, tag), test filter change triggers callback, test clear filters resets state

### Implementation for User Story 4

- [x] T052 [US4] Extend task_service.list_tasks in `backend/app/services/task_service.py`: add optional filter parameters (status, priority, tag), apply WHERE clauses with AND logic, tag filter uses PostgreSQL array contains operator
- [x] T053 [US4] Extend GET /api/tasks endpoint in `backend/app/routers/tasks.py`: accept optional query params (status, priority, tag), pass to task_service.list_tasks. Reference: `specs/001-task-crud/contracts/list-tasks.md`
- [x] T054 [US4] Implement TaskFilters component in `frontend/src/components/TaskFilters.tsx`: status dropdown (all/pending/completed), priority dropdown (all/low/medium/high), tag text input for filter, clear filters button
- [x] T055 [US4] Integrate filters into task list page in `frontend/src/app/tasks/page.tsx`: add TaskFilters above TaskList, pass filter state as query params to useTasks hook, update API call when filters change

**Checkpoint**: All 4 user stories functional — full feature complete

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Integration validation, boundary checks, and documentation

- [x] T056 [P] Create `backend/tests/conftest.py`: test database fixtures (in-memory SQLite or test Neon DB), mock JWT auth fixture returning test user_id, async httpx test client fixture
- [x] T057 [P] Create `frontend/tests/lib/api-client.test.ts`: test API client attaches JWT header, test response envelope parsing, test error handling for 401/404/422
- [x] T058 Run api-contract-enforcer agent: validate all frontend API calls in `frontend/src/lib/api-client.ts` match backend route definitions in `backend/app/routers/tasks.py` and response shapes match contracts in `specs/001-task-crud/contracts/`
- [x] T059 Run monorepo-boundary-guard agent: validate no cross-imports between `frontend/` and `backend/`, verify layer-scoped environment variables, check Docker readiness
- [x] T060 Run integration-gatekeeper agent: validate full flow end-to-end — login → create task → view list → update task → toggle completion → delete task → verify empty list
- [x] T061 [P] Update `specs/001-task-crud/quickstart.md` with any adjustments discovered during implementation
- [x] T062 Run full test suites: `pytest backend/tests/` and `npm test` in `frontend/` — verify all tests pass

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion — BLOCKS all user stories
- **User Stories (Phase 3-6)**: All depend on Foundational phase completion
  - US1 (P1): Can start immediately after Phase 2
  - US2 (P2): Can start after Phase 2; integrates with US1 components (TaskCard, TaskForm)
  - US3 (P3): Can start after Phase 2; integrates with US1 components (TaskCard)
  - US4 (P4): Can start after Phase 2; extends US1 list endpoint and page
- **Polish (Phase 7)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: No dependencies on other stories — standalone MVP
- **User Story 2 (P2)**: Extends TaskCard (from US1) with toggle action, extends TaskForm with edit mode
- **User Story 3 (P3)**: Extends TaskCard (from US1) with delete action
- **User Story 4 (P4)**: Extends list endpoint and page (from US1) with filter support

### Within Each User Story

- Tests MUST be written and FAIL before implementation
- Backend service before endpoints
- Backend endpoints before frontend components that call them
- Frontend components before pages that compose them

### Parallel Opportunities

- **Phase 1**: T003, T004, T005 can run in parallel
- **Phase 2**: T013, T014, T015, T016, T017 can run in parallel (frontend); T006→T007→T008→T009→T010→T011→T012 sequential (backend dependencies)
- **Phase 3 (US1)**: T018, T019, T020, T21 tests in parallel; T026 parallel with backend; T029, T030 parallel after T028
- **Phase 4 (US2)**: T032, T033, T034, T035 tests in parallel
- **Phase 5 (US3)**: T045, T046 tests in parallel
- **Phase 6 (US4)**: T050, T051 tests in parallel
- **Phase 7**: T056, T057, T061 in parallel

---

## Parallel Example: User Story 1

```bash
# Launch all tests for User Story 1 together:
Task: "Backend contract test POST /api/tasks" (T018)
Task: "Backend contract test GET /api/tasks" (T019)
Task: "Backend service unit test" (T020)
Task: "Frontend TaskForm test" (T021)

# After tests fail (expected), launch backend service:
Task: "Implement task_service.create_task" (T022)
Task: "Implement task_service.list_tasks" (T023)

# Then endpoints (depend on service):
Task: "POST /api/tasks endpoint" (T024)
Task: "GET /api/tasks endpoint" (T025)

# Frontend in parallel with backend (after T013/T015):
Task: "Client-side validators" (T026)

# Then frontend components:
Task: "useTasks hook" (T027)
Task: "TaskForm component" (T028)
Task: "TaskCard component" (T029) — parallel with T030
Task: "TaskList component" (T030) — parallel with T029

# Finally the page:
Task: "Task list page" (T031)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL — blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Test US1 independently
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Demo (MVP!)
3. Add User Story 2 → Test independently → Demo
4. Add User Story 3 → Test independently → Demo
5. Add User Story 4 → Test independently → Demo
6. Run Polish phase → Full feature complete

---

## Notes

- All endpoint URLs use `/api/tasks` (NOT `/api/{user_id}/tasks`) — user_id comes from JWT, not URL path
- Response envelope `{ data, error, meta }` is mandatory on all endpoints
- Tenant isolation is enforced at the service layer, not the router layer
- Agent validation (Phase 7) is a cross-cutting concern that runs after all stories
- Total tasks: 62 (T001-T062)
