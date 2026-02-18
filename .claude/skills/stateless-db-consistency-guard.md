# Stateless DB Consistency Guard

## Skill Name
stateless-db-consistency-guard

## Type
Validation / Architecture Enforcement Skill

## Purpose
Ensure strict stateless server behavior and guarantee that ALL application state
(tasks, conversations, messages) is persisted ONLY in the database.

Prevents accidental in-memory storage, caching, or hidden state that would break
horizontal scalability and MCP design principles.

## When to Activate
Automatically activate when:
- FastAPI routes are implemented
- Database models are modified
- MCP tools interact with persistence layer
- Conversation handling is introduced
- Any session/state logic is written

## Architecture Rules

### RULE 1 — NO IN-MEMORY STATE
Disallow:
- ❌ Python dictionaries storing conversations
- ❌ Global variables tracking tasks
- ❌ Cached chat history
- ❌ Temporary state managers

All state MUST be read from database per request.

### RULE 2 — EACH REQUEST IS INDEPENDENT
Every `/api/{user_id}/chat` call must:
1. Fetch conversation history from DB
2. Build agent context dynamically
3. Execute tools
4. Persist new messages
5. Return response

Server must forget everything after response.

### RULE 3 — DATABASE IS SINGLE SOURCE OF TRUTH
All entities must exist only in database tables:
- `tasks`
- `conversations`
- `messages`

No mirrored models or shadow copies allowed.

### RULE 4 — MCP TOOLS MUST BE STATELESS
Each MCP tool must:
- ✔ Open its own DB session
- ✔ Perform operation
- ✔ Commit
- ✔ Close session

Tools must NOT rely on previously loaded objects.

### RULE 5 — NO SESSION STORAGE
Forbidden patterns:
- ❌ `request.session`
- ❌ Memory cache (`@lru_cache`, `functools.cache`, in-memory dicts)
- ❌ Singleton repositories
- ❌ Background state trackers

System must remain restart-safe.

### RULE 6 — RESTART RESILIENCE VALIDATION
After simulated server restart:
- ✔ Conversations must resume correctly
- ✔ Tasks must remain accessible
- ✔ No behavioral change allowed

If any data is lost on restart, architecture is broken.

### RULE 7 — DATABASE TRANSACTIONS REQUIRED
Every write operation must:
- ✔ Use transaction scope
- ✔ Commit explicitly
- ✔ Handle rollback on failure

Ensures MCP tools remain deterministic.

## Correct Architecture Flow

```
┌──────────────────────────────────────────────────────────┐
│                    FastAPI Server                         │
│                  (ZERO STATE)                             │
│                                                          │
│  ┌─────────┐    ┌──────────┐    ┌─────────────┐        │
│  │ Request  │───▶│ Fetch DB │───▶│ Build Agent │        │
│  │ arrives  │    │ history  │    │ context     │        │
│  └─────────┘    └──────────┘    └──────┬──────┘        │
│                                         │                │
│                                         ▼                │
│                                  ┌─────────────┐        │
│                                  │ Agent.run()  │        │
│                                  │ (one-shot)   │        │
│                                  └──────┬──────┘        │
│                                         │                │
│                                         ▼                │
│                                  ┌─────────────┐        │
│                                  │  MCP Tools   │        │
│                                  │ (stateless)  │        │
│                                  └──────┬──────┘        │
│                                         │                │
│                                         ▼                │
│  ┌─────────┐    ┌──────────┐    ┌─────────────┐        │
│  │ Return   │◀──│ Persist  │◀──│ Tool result  │        │
│  │ response │    │ to DB    │    │             │        │
│  └─────────┘    └──────────┘    └─────────────┘        │
│                                                          │
│              Server forgets EVERYTHING                   │
└──────────────────────────────────────────────────────────┘
                         │
                         ▼
              ┌─────────────────┐
              │  Neon PostgreSQL │
              │  (SINGLE SOURCE │
              │   OF TRUTH)     │
              │                 │
              │  ┌───────────┐  │
              │  │ tasks     │  │
              │  ├───────────┤  │
              │  │ convos    │  │
              │  ├───────────┤  │
              │  │ messages  │  │
              │  └───────────┘  │
              └─────────────────┘
```

## Anti-Patterns to Detect

| # | Anti-Pattern | Code Example | Why It's Wrong | Fix |
|---|---|---|---|---|
| 1 | Global dict state | `tasks_cache = {}` | Lost on restart | Query DB per request |
| 2 | Module-level list | `conversations = []` | In-memory accumulation | Fetch from DB |
| 3 | Cached DB results | `@lru_cache` on queries | Stale data across requests | Always query fresh |
| 4 | Singleton repo | `class TaskRepo: _instance` | Holds state between requests | Use dependency injection |
| 5 | Session storage | `request.session["data"]` | Server-side sessions | Use DB + conversation_id |
| 6 | Background tracker | `threading.local()` | Thread-bound state | Remove entirely |
| 7 | Lazy-loaded cache | `if not self._loaded: ...` | Hidden statefulness | Load from DB each time |
| 8 | Tool object reuse | `tool.last_result` | Cross-request leakage | Stateless tool per call |

## MCP Tool Statelessness Template

Every MCP tool implementation must follow this pattern:
```python
# CORRECT — Stateless MCP tool
async def add_task(user_id: str, title: str, ...):
    async with get_db_session() as session:  # New session per call
        task = Task(user_id=user_id, title=title, ...)
        session.add(task)
        await session.commit()              # Explicit commit
        await session.refresh(task)         # Read committed state
        return task.to_dict()               # Return, session closes
    # Session closed — no state retained
```

```python
# WRONG — Stateful MCP tool
class TaskTool:
    def __init__(self):
        self.session = get_session()  # ❌ Persistent session
        self.cache = {}               # ❌ In-memory cache

    async def add_task(self, ...):
        self.cache[id] = task         # ❌ State retained
```

## Validation Checklist

| # | Check | Pass Criteria |
|---|-------|---------------|
| 1 | No in-memory state | Zero global/module-level mutable state for app data |
| 2 | Request independence | Each request fetches all context from DB |
| 3 | DB is sole source | tasks, conversations, messages exist only in DB tables |
| 4 | Stateless MCP tools | Each tool opens/commits/closes its own DB session |
| 5 | No session storage | No `request.session`, no memory caches for app data |
| 6 | Restart resilience | Full functionality preserved after server restart |
| 7 | Explicit transactions | Every write uses transaction scope with commit/rollback |

## Failure Response

If violations detected:
```
🚫 Stateless DB Consistency Violation Detected
Rule: <RULE_NUMBER> — <RULE_NAME>
Violation: <description of breach>
Location: <file:line or component>
Anti-Pattern: <matched anti-pattern from table>
Required: All state in DB, zero server memory
Found: <actual violating pattern>
Action: STOP implementation. Move state to database and remove in-memory storage.
```

## Output Expectation
Guarantee system behaves like a true distributed AI service:
- **Stateless** — Zero in-process state between requests
- **Horizontally scalable** — Any instance can handle any request
- **Failure-safe** — Server crash loses zero data or context
- **Deterministic** — Same input + DB state = same output

## Fail Condition
If any feature depends on server memory → **BLOCK implementation immediately**.

## Success Condition
Server can be shut down at any moment with **ZERO loss** of logic or context.
All conversations, tasks, and messages survive restarts and instance changes.
