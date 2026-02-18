# Phase 3 SDD Orchestrator

## Skill Name
phase3-sdd-orchestrator

## Type
Workflow Automation Skill

## Purpose
Enforce strict Spec-Driven Development (SDD) lifecycle for Phase III (AI Chatbot with MCP).
This skill ensures implementation never begins without validated specification, architecture plan, and task breakdown.

## When to Activate
Automatically activate when:
- A new Phase III feature is requested
- MCP tools are modified
- Chat behavior changes
- Agent logic is introduced
- Any backend/frontend coding is about to start

## Workflow Enforcement Rules

### STEP 1 — REQUIRE SPECIFICATION
If no spec exists:
→ STOP execution
→ Ask user to run `/sp.specify`
→ Refuse to generate code

### STEP 2 — REQUIRE ARCHITECTURE PLAN
If no plan exists:
→ Require `/sp.plan`
→ Validate architecture includes:
  - FastAPI endpoint structure
  - Agents SDK orchestration
  - MCP server exposure
  - Stateless conversation flow
  - Database persistence

### STEP 3 — REQUIRE TASK GENERATION
If tasks not defined:
→ Require `/sp.tasks`
→ Ensure tasks include:
  - Clear acceptance criteria
  - Dependency ordering
  - Test cases per task
  - File references for implementation

### STEP 4 — VALIDATE BEFORE IMPLEMENTATION
Before any code generation:
→ Verify spec exists at `specs/<feature>/spec.md`
→ Verify plan exists at `specs/<feature>/plan.md`
→ Verify tasks exist at `specs/<feature>/tasks.md`
→ Only then proceed with implementation via `/sp.implement`

### STEP 5 — POST-IMPLEMENTATION
After implementation:
→ Run integration checks
→ Validate against acceptance criteria in tasks
→ Create PHR record
→ Suggest ADR if architectural decisions were made

## Gate Checks Summary

| Gate | Required Artifact | Command | Blocker |
|------|-------------------|---------|---------|
| Spec Gate | `specs/<feature>/spec.md` | `/sp.specify` | No code without spec |
| Plan Gate | `specs/<feature>/plan.md` | `/sp.plan` | No code without plan |
| Task Gate | `specs/<feature>/tasks.md` | `/sp.tasks` | No code without tasks |
| Implement Gate | All above validated | `/sp.implement` | Execute tasks in order |

## Error Responses

When a gate check fails, respond with:
```
🚫 SDD Gate Violation: <gate-name>
Required artifact missing: <artifact-path>
Action: Run `<command>` before proceeding.
Implementation blocked until all gates pass.
```

## Phase III Specific Validations

For any Phase III work, additionally verify:
- **MCP Tools**: Tool contracts defined in spec before implementation
- **Agent Runtime**: Agent configuration and message lifecycle documented in plan
- **Chat API**: Endpoint contracts and orchestration flow specified
- **Statelessness**: Backend statelessness guarantee documented and enforced
- **Database Models**: Schema changes defined in spec with migration strategy
