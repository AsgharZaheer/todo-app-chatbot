# MCP Contract Guardian

## Skill Name
mcp-contract-guardian

## Type
Validation / Verification Skill

## Purpose
Ensure strict compliance between AI Agent behavior and MCP Tool contracts.
Prevents misuse, schema drift, or unauthorized database access outside MCP tools.

This skill guarantees that ALL task operations flow through MCP tools only.

## When to Activate
Automatically activate when:
- MCP server code is generated or modified
- AI Agent invokes tools
- Task-related logic is added
- Database operations are introduced
- Chat endpoint connects to business logic

## Validation Rules

### RULE 1 — MCP IS THE ONLY EXECUTION LAYER
Reject any implementation where:
- ❌ FastAPI directly modifies database
- ❌ Agent writes SQL queries
- ❌ Services bypass MCP tools
- ❌ Business logic exists outside MCP handlers

All mutations MUST go through:
- `add_task`
- `list_tasks`
- `complete_task`
- `delete_task`
- `update_task`

### RULE 2 — STRICT TOOL SCHEMA VALIDATION
Ensure each tool defines:
- Explicit input schema
- Explicit output schema
- Deterministic response format
- Required `user_id` scoping
- Clear error handling contract

Reject:
- ❌ Dynamic parameters
- ❌ Missing required fields
- ❌ Unstructured responses

### RULE 3 — STATELESSNESS ENFORCEMENT
Validate that tools:
- Do NOT store memory
- Do NOT rely on session state
- Always read/write from Neon PostgreSQL
- Can run independently per request

### RULE 4 — AGENT TOOL USAGE ONLY
Ensure OpenAI Agent:
- Calls MCP tools as external actions
- Never embeds business logic
- Never infers DB structure
- Never performs CRUD directly

### RULE 5 — SECURITY BOUNDARY
Verify:
- Every tool filters by `user_id`
- No cross-user data leakage possible
- No raw SQL exposed to agent layer

### RULE 6 — CONTRACT TRACEABILITY
Each MCP tool must map to:
```
Spec → Plan → Task → Implementation
```

If traceability missing:
→ Block execution and request correction.

## Output Expectation
Produce a validation report confirming:
- ✔ MCP isolation maintained
- ✔ Stateless guarantees intact
- ✔ Tool schema respected
- ✔ Agent orchestration clean

## Failure Response
If violations detected:
```
🚫 MCP Contract Violation Detected
Rule: <RULE_NUMBER> — <RULE_NAME>
Violation: <description of breach>
Location: <file:line or component>
Required: Agent → MCP Tool → Database
Found: <actual violating path>
Action: STOP implementation and correct architecture.
```

## Success Condition
System behaves as:
```
Agent → MCP Tool → Database
```

Never:
```
Agent → Database
```

This preserves:
- **Scalability** — Stateless tools scale horizontally
- **Security** — user_id scoping prevents data leakage
- **Evaluability** — Deterministic tool contracts enable testing
- **MCP Architecture** — Clean separation of concerns maintained

## Validation Checklist

| # | Check | Pass Criteria |
|---|-------|---------------|
| 1 | MCP isolation | All DB mutations go through MCP tools |
| 2 | Tool schemas | Input/output schemas explicit and typed |
| 3 | Statelessness | No in-memory state between requests |
| 4 | Agent boundary | Agent uses tools only, no direct CRUD |
| 5 | Security scope | All queries filtered by `user_id` |
| 6 | Traceability | Every tool maps to spec → plan → task |
