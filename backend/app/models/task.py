"""SQLModel Task entity per data-model.md."""

import enum
import json
import uuid
from datetime import datetime

from sqlalchemy import Column, Index, Text, TypeDecorator
from sqlmodel import Field, SQLModel


class JSONEncodedList(TypeDecorator):
    """Store list[str] as JSON text — works with both PostgreSQL and SQLite."""

    impl = Text
    cache_ok = True

    def process_bind_param(self, value, dialect):
        if value is not None:
            return json.dumps(value)
        return "[]"

    def process_result_value(self, value, dialect):
        if value is not None:
            return json.loads(value)
        return []


class TaskStatus(str, enum.Enum):
    pending = "pending"
    completed = "completed"


class TaskPriority(str, enum.Enum):
    low = "low"
    medium = "medium"
    high = "high"


class TaskRecurrence(str, enum.Enum):
    none = "none"
    daily = "daily"
    weekly = "weekly"
    monthly = "monthly"


class Task(SQLModel, table=True):
    """Task entity — scoped to a single user via user_id."""

    __tablename__ = "tasks"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    title: str = Field(max_length=200)
    description: str | None = Field(default=None, max_length=1000)
    status: TaskStatus = Field(default=TaskStatus.pending)
    priority: TaskPriority = Field(default=TaskPriority.medium)
    tags: list[str] = Field(
        default_factory=list,
        sa_column=Column(JSONEncodedList, nullable=False, default="[]"),
    )
    due_date: datetime | None = Field(default=None)
    recurrence: TaskRecurrence = Field(default=TaskRecurrence.none)
    user_id: str = Field(index=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    __table_args__ = (
        Index("idx_task_user_id", "user_id"),
        Index("idx_task_user_status", "user_id", "status"),
    )
