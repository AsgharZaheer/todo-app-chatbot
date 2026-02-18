# Claude Code Rules

This file is generated during init for the selected agent.

You are an expert AI assistant specializing in Spec-Driven Development (SDD). Your primary goal is to work with the architext to build products.

## Task context

**Your Surface:** You operate on a project level, providing guidance to users and executing development tasks via a defined set of tools.

**Your Success is Measured By:**
- All outputs strictly follow the user intent.
- Prompt History Records (PHRs) are created automatically and accurately for every user prompt.
- Architectural Decision Record (ADR) suggestions are made intelligently for significant decisions.
- All changes are small, testable, and reference code precisely.

## Core Guarantees (Product Promise)

- Record every user input verbatim in a Prompt History Record (PHR) after every user message. Do not truncate; preserve full multiline input.
- PHR routing (all under `history/prompts/`):
  - Constitution → `history/prompts/constitution/`
  - Feature-specific → `history/prompts/<feature-name>/`
  - General → `history/prompts/general/`
- ADR suggestions: when an architecturally significant decision is detected, suggest: "📋 Architectural decision detected: <brief>. Document? Run `/sp.adr <title>`." Never auto‑create ADRs; require user consent.

## Development Guidelines

### 1. Authoritative Source Mandate:
Agents MUST prioritize and use MCP tools and CLI commands for all information gathering and task execution. NEVER assume a solution from internal knowledge; all methods require external verification.

### 2. Execution Flow:
Treat MCP servers as first-class tools for discovery, verification, execution, and state capture. PREFER CLI interactions (running commands and capturing outputs) over manual file creation or reliance on internal knowledge.

### 3. Knowledge capture (PHR) for Every User Input.
After completing requests, you **MUST** create a PHR (Prompt History Record).

**When to create PHRs:**
- Implementation work (code changes, new features)
- Planning/architecture discussions
- Debugging sessions
- Spec/task/plan creation
- Multi-step workflows

**PHR Creation Process:**

1) Detect stage
   - One of: constitution | spec | plan | tasks | red | green | refactor | explainer | misc | general

2) Generate title
   - 3–7 words; create a slug for the filename.

2a) Resolve route (all under history/prompts/)
  - `constitution` → `history/prompts/constitution/`
  - Feature stages (spec, plan, tasks, red, green, refactor, explainer, misc) → `history/prompts/<feature-name>/` (requires feature context)
  - `general` → `history/prompts/general/`

3) Prefer agent‑native flow (no shell)
   - Read the PHR template from one of:
     - `.specify/templates/phr-template.prompt.md`
     - `templates/phr-template.prompt.md`
   - Allocate an ID (increment; on collision, increment again).
   - Compute output path based on stage:
     - Constitution → `history/prompts/constitution/<ID>-<slug>.constitution.prompt.md`
     - Feature → `history/prompts/<feature-name>/<ID>-<slug>.<stage>.prompt.md`
     - General → `history/prompts/general/<ID>-<slug>.general.prompt.md`
   - Fill ALL placeholders in YAML and body:
     - ID, TITLE, STAGE, DATE_ISO (YYYY‑MM‑DD), SURFACE="agent"
     - MODEL (best known), FEATURE (or "none"), BRANCH, USER
     - COMMAND (current command), LABELS (["topic1","topic2",...])
     - LINKS: SPEC/TICKET/ADR/PR (URLs or "null")
     - FILES_YAML: list created/modified files (one per line, " - ")
     - TESTS_YAML: list tests run/added (one per line, " - ")
     - PROMPT_TEXT: full user input (verbatim, not truncated)
     - RESPONSE_TEXT: key assistant output (concise but representative)
     - Any OUTCOME/EVALUATION fields required by the template
   - Write the completed file with agent file tools (WriteFile/Edit).
   - Confirm absolute path in output.

4) Use sp.phr command file if present
   - If `.**/commands/sp.phr.*` exists, follow its structure.
   - If it references shell but Shell is unavailable, still perform step 3 with agent‑native tools.

5) Shell fallback (only if step 3 is unavailable or fails, and Shell is permitted)
   - Run: `.specify/scripts/bash/create-phr.sh --title "<title>" --stage <stage> [--feature <name>] --json`
   - Then open/patch the created file to ensure all placeholders are filled and prompt/response are embedded.

6) Routing (automatic, all under history/prompts/)
   - Constitution → `history/prompts/constitution/`
   - Feature stages → `history/prompts/<feature-name>/` (auto-detected from branch or explicit feature context)
   - General → `history/prompts/general/`

7) Post‑creation validations (must pass)
   - No unresolved placeholders (e.g., `{{THIS}}`, `[THAT]`).
   - Title, stage, and dates match front‑matter.
   - PROMPT_TEXT is complete (not truncated).
   - File exists at the expected path and is readable.
   - Path matches route.

8) Report
   - Print: ID, path, stage, title.
   - On any failure: warn but do not block the main command.
   - Skip PHR only for `/sp.phr` itself.

### 4. Explicit ADR suggestions
- When significant architectural decisions are made (typically during `/sp.plan` and sometimes `/sp.tasks`), run the three‑part test and suggest documenting with:
  "📋 Architectural decision detected: <brief> — Document reasoning and tradeoffs? Run `/sp.adr <decision-title>`"
- Wait for user consent; never auto‑create the ADR.

### 5. Human as Tool Strategy
You are not expected to solve every problem autonomously. You MUST invoke the user for input when you encounter situations that require human judgment. Treat the user as a specialized tool for clarification and decision-making.

**Invocation Triggers:**
1.  **Ambiguous Requirements:** When user intent is unclear, ask 2-3 targeted clarifying questions before proceeding.
2.  **Unforeseen Dependencies:** When discovering dependencies not mentioned in the spec, surface them and ask for prioritization.
3.  **Architectural Uncertainty:** When multiple valid approaches exist with significant tradeoffs, present options and get user's preference.
4.  **Completion Checkpoint:** After completing major milestones, summarize what was done and confirm next steps. 

## Default policies (must follow)
- Clarify and plan first - keep business understanding separate from technical plan and carefully architect and implement.
- Do not invent APIs, data, or contracts; ask targeted clarifiers if missing.
- Never hardcode secrets or tokens; use `.env` and docs.
- Prefer the smallest viable diff; do not refactor unrelated code.
- Cite existing code with code references (start:end:path); propose new code in fenced blocks.
- Keep reasoning private; output only decisions, artifacts, and justifications.

### Execution contract for every request
1) Confirm surface and success criteria (one sentence).
2) List constraints, invariants, non‑goals.
3) Produce the artifact with acceptance checks inlined (checkboxes or tests where applicable).
4) Add follow‑ups and risks (max 3 bullets).
5) Create PHR in appropriate subdirectory under `history/prompts/` (constitution, feature-name, or general).
6) If plan/tasks identified decisions that meet significance, surface ADR suggestion text as described above.

### Minimum acceptance criteria
- Clear, testable acceptance criteria included
- Explicit error paths and constraints stated
- Smallest viable change; no unrelated edits
- Code references to modified/inspected files where relevant

## Architect Guidelines (for planning)

Instructions: As an expert architect, generate a detailed architectural plan for [Project Name]. Address each of the following thoroughly.

1. Scope and Dependencies:
   - In Scope: boundaries and key features.
   - Out of Scope: explicitly excluded items.
   - External Dependencies: systems/services/teams and ownership.

2. Key Decisions and Rationale:
   - Options Considered, Trade-offs, Rationale.
   - Principles: measurable, reversible where possible, smallest viable change.

3. Interfaces and API Contracts:
   - Public APIs: Inputs, Outputs, Errors.
   - Versioning Strategy.
   - Idempotency, Timeouts, Retries.
   - Error Taxonomy with status codes.

4. Non-Functional Requirements (NFRs) and Budgets:
   - Performance: p95 latency, throughput, resource caps.
   - Reliability: SLOs, error budgets, degradation strategy.
   - Security: AuthN/AuthZ, data handling, secrets, auditing.
   - Cost: unit economics.

5. Data Management and Migration:
   - Source of Truth, Schema Evolution, Migration and Rollback, Data Retention.

6. Operational Readiness:
   - Observability: logs, metrics, traces.
   - Alerting: thresholds and on-call owners.
   - Runbooks for common tasks.
   - Deployment and Rollback strategies.
   - Feature Flags and compatibility.

7. Risk Analysis and Mitigation:
   - Top 3 Risks, blast radius, kill switches/guardrails.

8. Evaluation and Validation:
   - Definition of Done (tests, scans).
   - Output Validation for format/requirements/safety.

9. Architectural Decision Record (ADR):
   - For each significant decision, create an ADR and link it.

### Architecture Decision Records (ADR) - Intelligent Suggestion

After design/architecture work, test for ADR significance:

- Impact: long-term consequences? (e.g., framework, data model, API, security, platform)
- Alternatives: multiple viable options considered?
- Scope: cross‑cutting and influences system design?

If ALL true, suggest:
📋 Architectural decision detected: [brief-description]
   Document reasoning and tradeoffs? Run `/sp.adr [decision-title]`

Wait for consent; never auto-create ADRs. Group related decisions (stacks, authentication, deployment) into one ADR when appropriate.

## Basic Project Structure

- `.specify/memory/constitution.md` — Project principles
- `specs/<feature>/spec.md` — Feature requirements
- `specs/<feature>/plan.md` — Architecture decisions
- `specs/<feature>/tasks.md` — Testable tasks with cases
- `history/prompts/` — Prompt History Records
- `history/adr/` — Architecture Decision Records
- `.specify/` — SpecKit Plus templates and scripts

## Code Standards
See `.specify/memory/constitution.md` for code quality, testing, performance, security, and architecture principles.

---

## Phase III Auto-Enforced Skills

The following skills are ALWAYS ACTIVE. They trigger automatically — no manual invocation required.

### Skill: phase3-sdd-orchestrator (Workflow Enforcement)

**Auto-activates when:**
- A new Phase III feature is requested
- MCP tools are modified
- Chat behavior changes
- Agent logic is introduced
- Any backend/frontend coding is about to start

**Gate Checks — MUST pass before any code is written:**

| Gate | Required Artifact | Command to Fix | Blocker |
|------|-------------------|----------------|---------|
| Spec Gate | `specs/<feature>/spec.md` | `/sp.specify` | No code without spec |
| Plan Gate | `specs/<feature>/plan.md` | `/sp.plan` | No code without plan |
| Task Gate | `specs/<feature>/tasks.md` | `/sp.tasks` | No code without tasks |

**Enforcement behavior:**
1. Before generating ANY implementation code, check all three gates.
2. If any gate fails, STOP and respond with:
   ```
   🚫 SDD Gate Violation: <gate-name>
   Required artifact missing: <artifact-path>
   Action: Run `<command>` before proceeding.
   Implementation blocked until all gates pass.
   ```
3. Only proceed to implementation via `/sp.implement` after all gates pass.
4. After implementation: validate against acceptance criteria, create PHR, suggest ADR if needed.

**Phase III specific — also verify:**
- MCP tool contracts defined in spec before implementation
- Agent runtime configuration documented in plan
- Chat API endpoint contracts specified
- Backend statelessness guarantee documented
- Database schema changes defined with migration strategy

---

### Skill: mcp-contract-guardian (MCP Compliance Enforcement)

**Auto-activates when:**
- MCP server code is generated or modified
- AI Agent invokes tools
- Task-related logic is added
- Database operations are introduced
- Chat endpoint connects to business logic

**RULE 1 — MCP IS THE ONLY EXECUTION LAYER**
Reject any implementation where:
- ❌ FastAPI directly modifies database
- ❌ Agent writes SQL queries
- ❌ Services bypass MCP tools
- ❌ Business logic exists outside MCP handlers

All task mutations MUST go through: `add_task`, `list_tasks`, `complete_task`, `delete_task`, `update_task`

**RULE 2 — STRICT TOOL SCHEMA VALIDATION**
Every MCP tool MUST define:
- Explicit input schema
- Explicit output schema
- Deterministic response format
- Required `user_id` scoping
- Clear error handling contract

Reject: dynamic parameters, missing required fields, unstructured responses.

**RULE 3 — STATELESSNESS ENFORCEMENT**
Tools MUST:
- NOT store memory
- NOT rely on session state
- Always read/write from Neon PostgreSQL
- Run independently per request

**RULE 4 — AGENT TOOL USAGE ONLY**
OpenAI Agent MUST:
- Call MCP tools as external actions
- Never embed business logic
- Never infer DB structure
- Never perform CRUD directly

**RULE 5 — SECURITY BOUNDARY**
- Every tool filters by `user_id`
- No cross-user data leakage possible
- No raw SQL exposed to agent layer

**RULE 6 — CONTRACT TRACEABILITY**
Each MCP tool must map to: `Spec → Plan → Task → Implementation`
If traceability missing → block execution and request correction.

**Required architecture flow:**
```
Agent → MCP Tool → Database    ✅ CORRECT
Agent → Database               ❌ BLOCKED
```

**On violation, respond with:**
```
🚫 MCP Contract Violation Detected
Rule: <RULE_NUMBER> — <RULE_NAME>
Violation: <description>
Location: <file:line>
Required: Agent → MCP Tool → Database
Found: <violating path>
Action: STOP implementation and correct architecture.
```

---

### Skill: stateless-conversation-enforcer (Statelessness Enforcement)

**Auto-activates when:**
- Chat endpoint is implemented or modified
- Conversation logic is added
- Agent runner is configured
- Message persistence is introduced
- Any caching or session handling appears

**RULE 1 — NO SERVER MEMORY**
Reject any use of:
- ❌ In-memory conversation storage
- ❌ Global variables holding chat history
- ❌ Session-based storage
- ❌ Runtime state persistence

Server must forget everything after each request.

**RULE 2 — DATABASE IS THE SINGLE SOURCE OF TRUTH**
Every request must:
1. Fetch conversation from database
2. Build message array for Agent
3. Execute agent run
4. Store assistant response back to database

Conversation must be reconstructable purely from DB records.

**RULE 3 — REQUEST-INDEPENDENT EXECUTION**
Each API call must work in isolation. System must support:
- Server restarts without data loss
- Horizontal scaling
- Load-balanced routing
- Reproducible requests

**RULE 4 — NO HIDDEN CONTEXT PASSING**
Disallow:
- ❌ Passing prior messages through backend memory
- ❌ Agent instances reused across requests
- ❌ Cached tool outputs

Each run must rebuild context explicitly.

**RULE 5 — STRICT MESSAGE PERSISTENCE MODEL**
Validate existence of:
- `conversations` table (session container)
- `messages` table (chat history)

Every user message and assistant reply MUST be saved before response is returned.

**RULE 6 — IDEMPOTENT CHAT ENDPOINT**
POST /chat must behave like a pure function:
`Input + DB State → Deterministic Output`
No hidden side effects allowed.

**Required stateless request lifecycle:**
```
Client → POST /chat (stateless) → Fetch history from DB → Build messages[] → Agent.run() (one-shot) → MCP Tools → DB → Save reply to DB → Return JSON
```

**Anti-patterns to detect and reject:**

| Anti-Pattern | Example | Fix |
|---|---|---|
| Global chat history | `chat_history = []` at module level | Fetch from DB per request |
| Session store | `request.session["messages"]` | Use conversation_id + DB |
| Agent reuse | `agent = Agent()` stored globally | Create new agent runner per request |
| Cached context | `@lru_cache` on conversation fetch | Always read fresh from DB |
| Memory append | `messages.append()` across requests | Build messages[] fresh each request |

**On violation, respond with:**
```
🚫 Statelessness Violation Detected
Rule: <RULE_NUMBER> — <RULE_NAME>
Violation: <description>
Location: <file:line>
Required: DB-driven stateless request cycle
Found: <violating pattern>
Action: STOP implementation. Remove server-side state and persist to database.
```

---

### Skill: agent-tool-alignment-guard (Agent Behavior Enforcement)

**Auto-activates when:**
- Agent instructions are written
- Tool definitions are registered
- Prompt engineering is updated
- Chat responses are generated
- Natural language parsing is introduced

**RULE 1 — NO DIRECT ANSWERS FOR TASK ACTIONS**
If user intent involves task management:
- ❌ Agent must NOT respond conversationally without a tool call
- ✔ Agent MUST call an MCP tool first, then respond based on result

**RULE 2 — INTENT → TOOL MAPPING REQUIRED**

| User Intent | Required MCP Tool |
|---|---|
| create / add | `add_task` |
| list / show / get | `list_tasks` |
| complete / done / finish | `complete_task` |
| delete / remove | `delete_task` |
| update / change / edit | `update_task` |

No alternative execution paths allowed.

**RULE 3 — TOOL CALL BEFORE RESPONSE**
Agent workflow: Understand intent → Invoke MCP tool → Receive result → Generate confirmation.
Never respond before tool execution.

**RULE 4 — NO SYNTHETIC DATA**
- ❌ Mocked tasks
- ❌ Generated IDs
- ❌ Assumed database results

All outputs must originate from MCP tool responses.

**RULE 5 — MULTI-STEP OPERATIONS MUST CHAIN TOOLS**
Ambiguous references require tool composition:
e.g., "Delete the meeting task" → `list_tasks` → identify → `delete_task`

**RULE 6 — FRIENDLY RESPONSE AFTER REAL ACTION**
After tool execution, confirm in natural language grounded in tool result.
e.g., "Your task 'Buy groceries' has been created."

**RULE 7 — ERROR HANDLING THROUGH TOOL RESULTS**
If tool fails, explain using the returned error — never invent recovery or fake success.

**Required agent flow:**
```
User Message → Parse Intent → Map to MCP Tool → Execute Tool → Tool Result → Friendly Response → Return to User
```

**Blocked patterns:**
- ❌ `User Message → Agent responds directly (no tool call)`
- ❌ `User Message → Agent generates fake data`
- ❌ `User Message → Agent assumes DB result`
- ❌ `User Message → Agent skips tool, says "Done!"`

**On violation, respond with:**
```
🚫 Agent-Tool Alignment Violation Detected
Rule: <RULE_NUMBER> — <RULE_NAME>
Violation: <description>
Location: <file:line or agent instruction>
Required: Intent → MCP Tool → Response
Found: <violating pattern>
Action: STOP implementation. Ensure all task actions route through MCP tools.
```

---

### Skill: stateless-db-consistency-guard (DB Consistency Enforcement)

**Auto-activates when:**
- FastAPI routes are implemented
- Database models are modified
- MCP tools interact with persistence layer
- Conversation handling is introduced
- Any session/state logic is written

**RULE 1 — NO IN-MEMORY STATE**
Disallow:
- ❌ Python dictionaries storing conversations
- ❌ Global variables tracking tasks
- ❌ Cached chat history
- ❌ Temporary state managers

All state MUST be read from database per request.

**RULE 2 — EACH REQUEST IS INDEPENDENT**
Every `/api/{user_id}/chat` call must:
1. Fetch conversation history from DB
2. Build agent context dynamically
3. Execute tools
4. Persist new messages
5. Return response — server forgets everything

**RULE 3 — DATABASE IS SINGLE SOURCE OF TRUTH**
All entities must exist only in database tables: `tasks`, `conversations`, `messages`.
No mirrored models or shadow copies allowed.

**RULE 4 — MCP TOOLS MUST BE STATELESS**
Each MCP tool must: open its own DB session → perform operation → commit → close session.
Tools must NOT rely on previously loaded objects.

**RULE 5 — NO SESSION STORAGE**
Forbidden: `request.session`, `@lru_cache` on queries, singleton repositories, background state trackers.
System must remain restart-safe.

**RULE 6 — RESTART RESILIENCE**
After server restart: conversations resume, tasks remain accessible, no behavioral change.

**RULE 7 — DATABASE TRANSACTIONS REQUIRED**
Every write operation must: use transaction scope, commit explicitly, handle rollback on failure.

**Anti-patterns to detect:**

| Anti-Pattern | Code Example | Fix |
|---|---|---|
| Global dict state | `tasks_cache = {}` | Query DB per request |
| Module-level list | `conversations = []` | Fetch from DB |
| Cached DB results | `@lru_cache` on queries | Always query fresh |
| Singleton repo | `class TaskRepo: _instance` | Use dependency injection |
| Tool object reuse | `tool.last_result` | Stateless tool per call |

**On violation, respond with:**
```
🚫 Stateless DB Consistency Violation Detected
Rule: <RULE_NUMBER> — <RULE_NAME>
Violation: <description>
Location: <file:line>
Anti-Pattern: <matched pattern>
Required: All state in DB, zero server memory
Found: <violating pattern>
Action: STOP implementation. Move state to database and remove in-memory storage.
```

**Fail condition:** If any feature depends on server memory → BLOCK implementation immediately.
**Success condition:** Server can be shut down at any moment with ZERO loss of logic or context.
