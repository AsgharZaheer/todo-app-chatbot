"""Stateless chat orchestration service.

Implements the full request lifecycle:
1. Load/create conversation from DB
2. Fetch last 20 messages (sliding window)
3. Store user message
4. Build agent input from history
5. Run agent with MCP tools
6. Extract response and tool calls
7. Store assistant message
8. Return ChatResponse

NO state is held between requests.
"""

import logging
import uuid
from datetime import datetime

from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.agents.task_agent import run_agent
from app.models.conversation import Conversation
from app.models.message import Message
from app.schemas.chat import ChatResponse, ToolCallInfo

logger = logging.getLogger(__name__)

SLIDING_WINDOW_SIZE = 20


async def handle_chat(
    user_id: str,
    message: str,
    conversation_id: uuid.UUID | None,
    session: AsyncSession,
) -> ChatResponse:
    """Process a chat message through the full stateless pipeline.

    Args:
        user_id: Authenticated user's ID.
        message: User's natural language message.
        conversation_id: Existing conversation to continue, or None for new.
        session: Async DB session (from FastAPI dependency).

    Returns:
        ChatResponse with conversation_id, assistant response, and tool call metadata.

    Raises:
        ValueError: If conversation_id doesn't exist or belongs to another user.
        RuntimeError: If OpenAI API or MCP execution fails.
    """
    # Step 1: Load or create conversation
    conversation = await _load_or_create_conversation(
        session, user_id, conversation_id
    )
    # Capture the ID as a plain value — subsequent commits expire ORM attributes
    # and lazy-loading fails in async context (MissingGreenlet).
    conv_id: uuid.UUID = conversation.id

    # Step 2: Fetch message history (sliding window)
    history = await _fetch_message_history(session, conv_id)

    # Step 3: Store user message BEFORE agent run
    await _store_message(session, conv_id, user_id, "user", message)

    # Step 4: Build agent input from history + new message
    agent_messages = _build_agent_input(history, message, user_id)

    # Step 5: Run agent with MCP tools
    try:
        result = await run_agent(agent_messages, user_id)
    except Exception as e:
        logger.error("Agent execution failed: %s", e)
        raise RuntimeError(f"AI service temporarily unavailable: {e}") from e

    # Step 6: Extract response and tool calls
    assistant_text = result.final_output or "I'm sorry, I couldn't process that request."
    tool_calls = _extract_tool_calls(result)

    # Step 7: Store assistant message AFTER agent run
    await _store_message(
        session, conv_id, user_id, "assistant", assistant_text
    )

    # Update conversation timestamp
    stmt = select(Conversation).where(Conversation.id == conv_id)
    result_conv = await session.exec(stmt)
    conv = result_conv.first()
    if conv:
        conv.updated_at = datetime.utcnow()
        session.add(conv)
        await session.commit()

    # Step 8: Return response
    return ChatResponse(
        conversation_id=conv_id,
        response=assistant_text,
        tool_calls=tool_calls,
    )


async def _load_or_create_conversation(
    session: AsyncSession,
    user_id: str,
    conversation_id: uuid.UUID | None,
) -> Conversation:
    """Load existing conversation or create a new one."""
    if conversation_id is not None:
        query = select(Conversation).where(
            Conversation.id == conversation_id,
            Conversation.user_id == user_id,
        )
        result = await session.exec(query)
        conversation = result.first()
        if not conversation:
            raise ValueError("Conversation not found")
        return conversation

    # Create new conversation
    conversation = Conversation(user_id=user_id)
    session.add(conversation)
    await session.commit()
    await session.refresh(conversation)
    return conversation


async def _fetch_message_history(
    session: AsyncSession, conversation_id: uuid.UUID
) -> list[dict]:
    """Fetch last N messages for sliding window context.

    Returns plain dicts (role, content) to avoid MissingGreenlet errors
    when ORM objects are accessed after subsequent commits.
    """
    query = (
        select(Message)
        .where(Message.conversation_id == conversation_id)
        .order_by(Message.created_at.desc())
        .limit(SLIDING_WINDOW_SIZE)
    )
    result = await session.exec(query)
    messages = [{"role": m.role, "content": m.content} for m in result.all()]
    # Reverse to chronological order (oldest first)
    messages.reverse()
    return messages


async def _store_message(
    session: AsyncSession,
    conversation_id: uuid.UUID,
    user_id: str,
    role: str,
    content: str,
) -> Message:
    """Persist a message to the database."""
    msg = Message(
        conversation_id=conversation_id,
        user_id=user_id,
        role=role,
        content=content,
    )
    session.add(msg)
    await session.commit()
    await session.refresh(msg)
    return msg


def _build_agent_input(
    history: list[dict], new_message: str, user_id: str
) -> list[dict]:
    """Transform DB message history into Agent SDK input format.

    The agent needs user_id context for tool calls, so we prepend it
    as a system-level context note in the first user message.
    """
    # history is already a list of {"role": ..., "content": ...} dicts
    messages = list(history)

    # Add the new user message with user_id context for tools
    messages.append({
        "role": "user",
        "content": f"[user_id: {user_id}] {new_message}",
    })

    return messages


def _extract_tool_calls(result) -> list[ToolCallInfo]:
    """Extract tool call metadata from the agent RunResult."""
    tool_calls = []
    try:
        # Walk through the result's raw responses to find tool calls
        if hasattr(result, "raw_responses"):
            for response in result.raw_responses:
                if hasattr(response, "output"):
                    for item in response.output:
                        if hasattr(item, "type") and item.type == "function_call":
                            import json

                            try:
                                args = json.loads(item.arguments) if isinstance(item.arguments, str) else item.arguments
                            except (json.JSONDecodeError, TypeError):
                                args = {}
                            tool_calls.append(ToolCallInfo(
                                tool=item.name,
                                args=args,
                            ))
    except Exception as e:
        logger.warning("Could not extract tool calls: %s", e)

    return tool_calls
