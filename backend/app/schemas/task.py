"""Pydantic request/response schemas for Task CRUD."""

import uuid
from datetime import datetime

from pydantic import BaseModel, Field, field_validator

from app.models.task import TaskPriority, TaskRecurrence, TaskStatus


class TaskCreate(BaseModel):
    """Schema for creating a task."""

    title: str = Field(min_length=1, max_length=200)
    description: str | None = Field(default=None, max_length=1000)
    priority: TaskPriority = Field(default=TaskPriority.medium)
    tags: list[str] = Field(default_factory=list)
    due_date: datetime | None = None
    recurrence: TaskRecurrence = Field(default=TaskRecurrence.none)

    @field_validator("tags")
    @classmethod
    def validate_tags(cls, v: list[str]) -> list[str]:
        for tag in v:
            if not tag or not tag.strip():
                raise ValueError("Each tag must be a non-empty string")
        return [tag.strip() for tag in v]

    @field_validator("recurrence")
    @classmethod
    def validate_recurrence_requires_due_date(
        cls, v: TaskRecurrence, info: object
    ) -> TaskRecurrence:
        if v != TaskRecurrence.none:
            due_date = info.data.get("due_date") if hasattr(info, "data") else None
            if due_date is None:
                raise ValueError(
                    "Recurrence requires a due date. "
                    "Set a due_date or change recurrence to 'none'."
                )
        return v


class TaskUpdate(BaseModel):
    """Schema for partial task update. All fields optional."""

    title: str | None = Field(default=None, min_length=1, max_length=200)
    description: str | None = None
    priority: TaskPriority | None = None
    tags: list[str] | None = None
    due_date: datetime | None = None
    recurrence: TaskRecurrence | None = None

    @field_validator("tags")
    @classmethod
    def validate_tags(cls, v: list[str] | None) -> list[str] | None:
        if v is not None:
            for tag in v:
                if not tag or not tag.strip():
                    raise ValueError("Each tag must be a non-empty string")
            return [tag.strip() for tag in v]
        return v


class TaskResponse(BaseModel):
    """Full task representation in API responses."""

    id: uuid.UUID
    title: str
    description: str | None
    status: TaskStatus
    priority: TaskPriority
    tags: list[str]
    due_date: datetime | None
    recurrence: TaskRecurrence
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ErrorDetail(BaseModel):
    """Single validation error detail."""

    field: str
    message: str


class ErrorResponse(BaseModel):
    """Error envelope."""

    code: str
    message: str
    details: list[ErrorDetail] = []
