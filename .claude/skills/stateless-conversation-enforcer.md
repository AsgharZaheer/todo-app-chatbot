# Stateless Conversation Enforcer

## Skill Name
stateless-conversation-enforcer

## Type
Validation / Verification Skill

## Purpose
Guarantee that the chatbot system remains fully STATELESS.
Ensures conversation context is always stored in the database and never held in memory.

This skill prevents hidden session state, memory leaks, or server-side coupling.

## When to Activate
Automatically activate when:
- Chat endpoint is implemented or modified
- Conversation logic is added
- Agent runner is configured
- Message persistence is introduced
- Any caching or session handling appears

## Statelessness Rules

### RULE 1 — NO SERVER MEMORY
Reject any use of:
- ❌ In-memory conversation storage
- ❌ Global variables holding chat history
- ❌ Session-based storage
- ❌ Runtime state persistence

Server must forget everything after each request.

### RULE 2 — DATABASE IS THE SINGLE SOURCE OF TRUTH
Every request must:
1. Fetch conversation from database
2. Build message array for Agent
3. Execute agent run
4. Store assistant response back to database

Conversation must be reconstructable purely from DB records.

### RULE 3 — REQUEST-INDEPENDENT EXECUTION
Each API call must work in isolation.
System must support:
- ✔ Server restarts without data loss
- ✔ Horizontal scaling
- ✔ Load-balanced routing
- ✔ Reproducible requests

### RULE 4 — NO HIDDEN CONTEXT PASSING
Disallow:
- ❌ Passing prior messages through backend memory
- ❌ Agent instances reused across requests
- ❌ Cached tool outputs

Each run must rebuild context explicitly.

### RULE 5 — STRICT MESSAGE PERSISTENCE MODEL
Validate existence of:
- `conversations` table (session container)
- `messages` table (chat history)

Every user message and assistant reply MUST be saved before response is returned.

### RULE 6 — IDEMPOTENT CHAT ENDPOINT
POST /chat must behave like a pure function:
```
Input + DB State → Deterministic Output
```

No hidden side effects allowed.

## Output Expectation
Produce a validation report confirming:
- ✔ Stateless request cycle enforced
- ✔ No runtime memory dependency
- ✔ Conversation durability guaranteed
- ✔ Architecture supports horizontal scaling

## Failure Response
If violations detected:
```
🚫 Statelessness Violation Detected
Rule: <RULE_NUMBER> — <RULE_NAME>
Violation: <description of breach>
Location: <file:line or component>
Required: DB-driven stateless request cycle
Found: <actual violating pattern>
Action: STOP implementation. Remove server-side state and persist to database.
```

## Stateless Request Lifecycle

```
┌─────────┐     ┌─────────────┐     ┌──────────┐     ┌────────┐
│  Client  │────▶│  POST /chat  │────▶│  Fetch   │────▶│   DB   │
│          │     │  (stateless) │     │  history  │     │        │
└─────────┘     └──────┬──────┘     └──────────┘     └───┬────┘
                       │                                   │
                       ▼                                   │
                ┌─────────────┐                           │
                │ Build Agent  │◀──────────────────────────┘
                │  messages[]  │    (conversation from DB)
                └──────┬──────┘
                       │
                       ▼
                ┌─────────────┐     ┌──────────┐     ┌────────┐
                │  Agent.run() │────▶│  MCP     │────▶│   DB   │
                │  (one-shot)  │     │  Tools   │     │        │
                └──────┬──────┘     └──────────┘     └────────┘
                       │
                       ▼
                ┌─────────────┐     ┌────────┐
                │ Save reply   │────▶│   DB   │
                │ to messages  │     │        │
                └──────┬──────┘     └────────┘
                       │
                       ▼
                ┌─────────────┐
                │  Return JSON │
                │  to client   │
                └─────────────┘
```

## Validation Checklist

| # | Check | Pass Criteria |
|---|-------|---------------|
| 1 | No server memory | Zero in-memory conversation state |
| 2 | DB is source of truth | All history fetched from DB per request |
| 3 | Request independence | Each request works without prior request context |
| 4 | No hidden context | No reused agent instances or cached outputs |
| 5 | Message persistence | Both user and assistant messages saved to DB |
| 6 | Idempotent endpoint | POST /chat is a pure function of input + DB state |

## Anti-Patterns to Detect

| Anti-Pattern | Example | Fix |
|---|---|---|
| Global chat history | `chat_history = []` at module level | Remove; fetch from DB per request |
| Session store | `request.session["messages"]` | Remove; use conversation_id + DB |
| Agent reuse | `agent = Agent()` stored globally | Create new agent runner per request |
| Cached context | `@lru_cache` on conversation fetch | Remove cache; always read fresh from DB |
| Memory append | `messages.append()` across requests | Build messages[] fresh each request |
