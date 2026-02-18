"""Chat API endpoint — POST /api/{user_id}/chat per contract."""

import logging

from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel.ext.asyncio.session import AsyncSession

from app.database import get_session
from app.middleware.auth import get_current_user_id
from app.schemas.chat import ChatRequest, ChatResponse
from app.services import chat_service
from app.utils.responses import error_response, success_response

logger = logging.getLogger(__name__)

router = APIRouter(tags=["chat"])


@router.post("/api/{user_id}/chat")
async def chat(
    user_id: str,
    body: ChatRequest,
    current_user_id: str = Depends(get_current_user_id),
    session: AsyncSession = Depends(get_session),
) -> dict:
    """Send a message to the AI task assistant and receive a response.

    Path user_id must match the JWT sub claim (FR-012).
    """
    # Validate path user_id matches JWT subject
    if user_id != current_user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=error_response("FORBIDDEN", "Forbidden"),
        )

    try:
        response: ChatResponse = await chat_service.handle_chat(
            user_id=user_id,
            message=body.message,
            conversation_id=body.conversation_id,
            session=session,
        )
        return success_response(response.model_dump(mode="json"))

    except ValueError as e:
        # Conversation not found or ownership mismatch
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=error_response("NOT_FOUND", str(e)),
        )

    except RuntimeError as e:
        # OpenAI API or MCP execution failure
        logger.error("Chat service error: %s", e)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=error_response(
                "SERVICE_ERROR", "Service temporarily unavailable"
            ),
        )
