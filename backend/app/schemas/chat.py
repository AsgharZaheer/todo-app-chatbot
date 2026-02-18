"""Pydantic request/response schemas for the Chat endpoint."""

import uuid

from pydantic import BaseModel, Field


class ChatRequest(BaseModel):
    """Incoming chat message from the user."""

    message: str = Field(min_length=1, max_length=2000)
    conversation_id: uuid.UUID | None = None


class ToolCallInfo(BaseModel):
    """Metadata about a single MCP tool invocation."""

    tool: str
    args: dict


class ChatResponse(BaseModel):
    """AI assistant response returned to the client."""

    conversation_id: uuid.UUID
    response: str
    tool_calls: list[ToolCallInfo] = []
