"""OpenAI Agents SDK agent configuration and runner.

Creates a per-request Agent + MCPServerStdio instance.
No state is cached between requests.

When OPENAI_API_KEY is not configured, falls back to a dev agent
that parses intent locally and calls MCP tools directly.
"""

import json
import logging
import os
import sys
from pathlib import Path

from app.config import settings

logger = logging.getLogger(__name__)

# The OpenAI Agents SDK reads OPENAI_API_KEY and OPENAI_BASE_URL from the environment
os.environ.setdefault("OPENAI_API_KEY", settings.openai_api_key)
if settings.openai_base_url:
    os.environ.setdefault("OPENAI_BASE_URL", settings.openai_base_url)

# Backend root directory — needed as cwd for the MCP subprocess
_BACKEND_DIR = str(Path(__file__).resolve().parent.parent.parent)

# System instruction that constrains agent behavior
SYSTEM_INSTRUCTIONS = """\
You are TaskAssistant, a helpful task management assistant.

## RULES — YOU MUST FOLLOW THESE EXACTLY:

1. **ALWAYS use tools** for any task operation. NEVER fabricate task data.
   - To create a task → use the `add_task` tool
   - To list tasks → use the `list_tasks` tool
   - To complete a task → use the `complete_task` tool
   - To delete a task → use the `delete_task` tool
   - To update a task → use the `update_task` tool

2. **Confirm actions** ONLY after the tool has executed successfully.
   - If a tool returns success, confirm the action to the user.
   - If a tool returns an error, explain the error to the user.

3. **Ask for clarification** when the user's intent is ambiguous.
   - If the user says something vague like "do that thing", ask what they mean.
   - If the user references a task by name and multiple tasks could match, ask which one.

4. **Stay in scope**: You only manage tasks. For off-topic questions, respond politely
   that you can only help with task management.

5. **Be concise and conversational**. Use natural language, not JSON.

6. **The user_id parameter** is always provided in tool calls — never ask the user for it.
"""


def _has_openai_key() -> bool:
    """Check if a real API key is configured (OpenAI or Groq)."""
    key = settings.openai_api_key
    return bool(key and key.strip() and not key.startswith("sk-your")
                and key != "sk-your-openai-api-key")


def _get_mcp_server_command() -> list[str]:
    """Return the command to launch the MCP task tools server as a subprocess."""
    return [
        sys.executable,
        "-m",
        "app.mcp_server.task_tools",
    ]


def _build_subprocess_env() -> dict[str, str]:
    """Build environment variables for the MCP subprocess.

    The subprocess needs DATABASE_URL and other settings from our .env
    since it creates its own DB engine on import.
    """
    env = os.environ.copy()
    env["DATABASE_URL"] = settings.database_url
    return env


# ---------------------------------------------------------------------------
# Dev fallback agent — runs when no OpenAI key is configured
# ---------------------------------------------------------------------------

async def _run_dev_fallback(messages: list, user_id: str):
    """Simple intent-based agent that calls MCP tools directly.

    Parses the latest user message for task intent and invokes the
    corresponding MCP tool function. Returns a fake RunResult-like object.
    """
    from app.mcp_server.task_tools import (
        add_task,
        complete_task,
        delete_task,
        list_tasks,
        update_task,
    )

    # Get the latest user message (strip the [user_id: ...] prefix)
    last_msg = ""
    for m in reversed(messages):
        if m.get("role") == "user":
            last_msg = m["content"]
            break

    # Strip the user_id prefix we add in chat_service
    if last_msg.startswith("[user_id:"):
        closing = last_msg.find("]")
        if closing != -1:
            last_msg = last_msg[closing + 1:].strip()

    lower = last_msg.lower()
    tool_name = None
    tool_result = None

    try:
        if any(kw in lower for kw in ["add", "create", "new", "make"]):
            # Extract title from message — everything after the keyword
            title = last_msg
            for prefix in ["add task ", "create task ", "add a task ", "create a task ",
                           "new task ", "make a task ", "add ", "create ", "make ", "new "]:
                if lower.startswith(prefix):
                    title = last_msg[len(prefix):].strip()
                    break
            title = title.strip('"\'') or "Untitled Task"
            tool_name = "add_task"
            tool_result = await add_task(user_id=user_id, title=title)

        elif any(kw in lower for kw in ["list", "show", "view", "my task", "all task", "get task"]):
            tool_name = "list_tasks"
            tool_result = await list_tasks(user_id=user_id)

        elif any(kw in lower for kw in ["complete", "done", "finish", "mark done"]):
            tool_name = "complete_task"
            # Try to extract task ID — look for UUID-like pattern
            import re
            uuid_match = re.search(r'[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}', lower)
            if uuid_match:
                tool_result = await complete_task(user_id=user_id, task_id=uuid_match.group())
            else:
                return _DevResult("Which task would you like to complete? Please provide the task name or ID.")

        elif any(kw in lower for kw in ["delete", "remove"]):
            tool_name = "delete_task"
            import re
            uuid_match = re.search(r'[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}', lower)
            if uuid_match:
                tool_result = await delete_task(user_id=user_id, task_id=uuid_match.group())
            else:
                return _DevResult("Which task would you like to delete? Please provide the task name or ID.")

        elif any(kw in lower for kw in ["update", "edit", "change", "rename"]):
            tool_name = "update_task"
            return _DevResult("To update a task, please provide the task ID and the new title or description.")

        elif any(kw in lower for kw in ["hello", "hi", "hey", "help"]):
            return _DevResult(
                "👋 Hi! I'm TaskAssistant (running in dev mode — no OpenAI key configured).\n\n"
                "I can help you manage your tasks. Try:\n"
                "• \"Add task Buy groceries\"\n"
                "• \"Show my tasks\"\n"
                "• \"Complete task <id>\"\n"
                "• \"Delete task <id>\"\n\n"
                "💡 To enable full AI mode, add your OPENAI_API_KEY to backend/.env"
            )
        else:
            return _DevResult(
                "🤖 I'm running in dev mode (no OpenAI key).\n\n"
                "I understand these commands:\n"
                "• **Add/Create** — \"add task <title>\"\n"
                "• **List/Show** — \"show my tasks\"\n"
                "• **Complete** — \"complete task <id>\"\n"
                "• **Delete** — \"delete task <id>\"\n\n"
                "💡 For full natural language support, add OPENAI_API_KEY to backend/.env"
            )

    except Exception as e:
        logger.error("Dev fallback tool call failed: %s", e)
        return _DevResult(f"Sorry, something went wrong: {e}")

    # Parse tool result and build a friendly response
    if tool_result:
        try:
            data = json.loads(tool_result) if isinstance(tool_result, str) else tool_result
        except (json.JSONDecodeError, TypeError):
            data = {"success": False, "error": str(tool_result)}

        if data.get("success"):
            return _DevResult(
                _format_tool_success(tool_name, data.get("data", {})),
                tool_calls=[{"tool": tool_name, "args": {"user_id": user_id}}],
            )
        else:
            return _DevResult(f"❌ {data.get('error', 'Unknown error')}")

    return _DevResult("I couldn't understand that. Try 'add task', 'show tasks', etc.")


def _format_tool_success(tool_name: str, data: dict) -> str:
    """Format a successful tool result into a friendly message."""
    if tool_name == "add_task":
        return f"✅ Task created: **{data.get('title', 'Untitled')}**"

    if tool_name == "list_tasks":
        tasks = data.get("tasks", [])
        count = data.get("count", len(tasks))
        if count == 0:
            return "📋 You don't have any tasks yet. Try \"add task Buy groceries\"!"
        lines = [f"📋 **Your Tasks** ({count}):"]
        for t in tasks:
            status = "✅" if t.get("completed") else "⬜"
            lines.append(f"  {status} {t.get('title', 'Untitled')} (`{t.get('id', '?')[:8]}...`)")
        return "\n".join(lines)

    if tool_name == "complete_task":
        return f"✅ Task completed: **{data.get('title', 'task')}**"

    if tool_name == "delete_task":
        return f"🗑️ Task deleted: **{data.get('title', 'task')}**"

    if tool_name == "update_task":
        return f"✏️ Task updated: **{data.get('title', 'task')}**"

    return f"Done! ({tool_name})"


class _DevResult:
    """Minimal RunResult-like object for the dev fallback agent."""

    def __init__(self, text: str, tool_calls: list | None = None):
        self.final_output = text
        self._tool_calls = tool_calls or []

    @property
    def raw_responses(self):
        return []


# ---------------------------------------------------------------------------
# Main entry point
# ---------------------------------------------------------------------------

async def run_agent(messages: list, user_id: str):
    """Run the TaskAssistant agent with conversation history.

    Creates fresh Agent + MCPServerStdio per invocation (stateless).
    Falls back to dev agent when no OpenAI key is configured.

    Args:
        messages: Conversation history as list of dicts with 'role' and 'content'.
        user_id: The authenticated user's ID (injected into tool calls context).

    Returns:
        RunResult with final_output and tool call metadata.
    """
    if not _has_openai_key():
        logger.info("No OpenAI API key — using dev fallback agent")
        return await _run_dev_fallback(messages, user_id)

    from openai import AsyncOpenAI
    from agents import Agent, Runner, RunConfig
    from agents.models.openai_chatcompletions import OpenAIChatCompletionsModel
    from agents.mcp import MCPServerStdio

    # Build an OpenAI-compatible client (works with Groq, OpenAI, etc.)
    client_kwargs: dict = {"api_key": settings.openai_api_key}
    if settings.openai_base_url:
        client_kwargs["base_url"] = settings.openai_base_url
    openai_client = AsyncOpenAI(**client_kwargs)

    model = OpenAIChatCompletionsModel(
        model=settings.openai_model,
        openai_client=openai_client,
    )

    mcp_command = _get_mcp_server_command()

    async with MCPServerStdio(
        name="TaskTools",
        params={
            "command": mcp_command[0],
            "args": mcp_command[1:],
            "cwd": _BACKEND_DIR,
            "env": _build_subprocess_env(),
        },
        client_session_timeout_seconds=30,
    ) as mcp_server:
        agent = Agent(
            name="TaskAssistant",
            instructions=SYSTEM_INSTRUCTIONS,
            mcp_servers=[mcp_server],
            model=model,
        )

        result = await Runner.run(
            agent,
            input=messages,
            run_config=RunConfig(tracing_disabled=True),
        )
        return result
