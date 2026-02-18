"""SQLModel Message entity per data-model.md."""

import uuid
from datetime import datetime

from sqlalchemy import Index, Text
from sqlmodel import Column, Field, SQLModel


class Message(SQLModel, table=True):
    """Message entity — belongs to a conversation, immutable once created."""

    __tablename__ = "messages"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    conversation_id: uuid.UUID = Field(
        foreign_key="conversations.id", index=True, nullable=False
    )
    user_id: str = Field(index=True, nullable=False)
    role: str = Field(nullable=False)  # "user" or "assistant"
    content: str = Field(sa_column=Column(Text, nullable=False))
    created_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)

    __table_args__ = (
        Index("idx_message_convo_created", "conversation_id", "created_at"),
    )
