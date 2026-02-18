"""SQLModel Conversation entity per data-model.md."""

import uuid
from datetime import datetime

from sqlalchemy import Index
from sqlmodel import Field, SQLModel


class Conversation(SQLModel, table=True):
    """Conversation entity — scoped to a single user via user_id."""

    __tablename__ = "conversations"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    user_id: str = Field(index=True, nullable=False)
    created_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)
    updated_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)

    __table_args__ = (Index("idx_conversation_user_id", "user_id"),)
