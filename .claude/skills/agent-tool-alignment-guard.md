# Agent Tool Alignment Guard

## Skill Name
agent-tool-alignment-guard

## Type
Validation / Behavior Enforcement Skill

## Purpose
Ensure the AI Agent ALWAYS uses MCP tools to perform task operations.
Prevents the assistant from fabricating answers instead of executing real actions.

The AI must act as an orchestrator — NOT a knowledge chatbot.

## When to Activate
Automatically activate when:
- Agent instructions are written
- Tool definitions are registered
- Prompt engineering is updated
- Chat responses are generated
- Natural language parsing is introduced

## Behavioral Rules

### RULE 1 — NO DIRECT ANSWERS FOR TASK ACTIONS
If the user intent involves task management:
- ❌ Agent must NOT respond conversationally
- ✔ Agent MUST call an MCP tool

Example violation:
```
User: "Add a task to buy milk"
Agent says: "Sure, added!" (without tool call)
```
This is **forbidden**.

### RULE 2 — INTENT → TOOL MAPPING REQUIRED
Intent must resolve to:

| User Intent | Required MCP Tool |
|---|---|
| create / add | `add_task` |
| list / show / get | `list_tasks` |
| complete / done / finish | `complete_task` |
| delete / remove | `delete_task` |
| update / change / edit | `update_task` |

No alternative execution paths allowed.

### RULE 3 — TOOL CALL BEFORE RESPONSE
Agent workflow must be:
1. Understand intent
2. Invoke MCP tool
3. Receive structured result
4. Generate confirmation message

Never respond before tool execution.

### RULE 4 — NO SYNTHETIC DATA
Disallow:
- ❌ Mocked tasks
- ❌ Generated IDs
- ❌ Assumed database results

All outputs must originate from MCP tool responses.

### RULE 5 — MULTI-STEP OPERATIONS MUST CHAIN TOOLS
If action requires lookup first, tools must be composed.

Example: "Delete the meeting task"
```
Agent must:
1. list_tasks → find matching task
2. identify task by ID
3. delete_task → execute deletion
```

Tool composition REQUIRED for ambiguous references.

### RULE 6 — FRIENDLY RESPONSE AFTER REAL ACTION
After tool execution, agent should confirm:
- ✔ Natural language
- ✔ Human-readable
- ✔ Based on actual tool result

Example:
```
"Your task 'Buy groceries' has been created."
```

Never fabricate confirmation without tool result.

### RULE 7 — ERROR HANDLING THROUGH TOOL RESULTS
If tool fails:
- Agent must explain using the returned error
- Never invent recovery or fake success
- Surface the actual error message to user in friendly language

Example:
```
Tool returns: {"error": "task_not_found", "message": "No task with ID 42"}
Agent says: "I couldn't find that task. It may have already been deleted."
```

## Output Expectation
Validate that:
- ✔ Every actionable user intent triggers a tool call
- ✔ No conversational shortcuts for CRUD operations
- ✔ All responses are grounded in tool results
- ✔ Multi-step operations chain tools correctly
- ✔ Errors are surfaced from tool responses, not fabricated

## Failure Response
If violations detected:
```
🚫 Agent-Tool Alignment Violation Detected
Rule: <RULE_NUMBER> — <RULE_NAME>
Violation: <description of breach>
Location: <file:line or agent instruction>
Required: Intent → MCP Tool → Response
Found: <violating pattern (e.g., direct response without tool call)>
Action: STOP implementation. Ensure all task actions route through MCP tools.
```

## Correct Agent Flow
```
┌──────────────┐
│  User Message │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ Parse Intent  │
│ (NLP layer)   │
└──────┬───────┘
       │
       ▼
┌──────────────┐     ┌─────────────┐
│ Map to MCP   │────▶│ Execute MCP │
│ Tool          │     │ Tool        │
└──────────────┘     └──────┬──────┘
                            │
                            ▼
                     ┌─────────────┐
                     │ Tool Result  │
                     │ (structured) │
                     └──────┬──────┘
                            │
                            ▼
                     ┌─────────────┐
                     │ Generate     │
                     │ Friendly     │
                     │ Response     │
                     └──────┬──────┘
                            │
                            ▼
                     ┌─────────────┐
                     │ Return to    │
                     │ User         │
                     └─────────────┘
```

## Incorrect Patterns (BLOCKED)

```
User Message → Agent responds directly (NO TOOL CALL) ❌
User Message → Agent generates fake data ❌
User Message → Agent assumes DB result ❌
User Message → Agent skips tool, says "Done!" ❌
```

## Validation Checklist

| # | Check | Pass Criteria |
|---|-------|---------------|
| 1 | No direct answers | Task intents always trigger tool calls |
| 2 | Intent mapping | Every CRUD intent maps to specific MCP tool |
| 3 | Tool-first workflow | Tool executes before response is generated |
| 4 | No synthetic data | All IDs, results, confirmations from tool output |
| 5 | Tool chaining | Ambiguous references resolved via list → action |
| 6 | Friendly responses | Confirmations are natural and grounded in results |
| 7 | Error transparency | Failures surfaced from tool errors, not invented |
