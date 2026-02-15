"""Task business logic — CRUD, validation, and tenant filtering."""

import uuid
from datetime import datetime

from sqlalchemy import text
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.models.task import Task, TaskRecurrence, TaskStatus
from app.schemas.task import TaskCreate, TaskUpdate


async def create_task(
    session: AsyncSession, user_id: str, data: TaskCreate
) -> Task:
    """Create a new task for the given user."""
    task = Task(
        title=data.title,
        description=data.description,
        status=TaskStatus.pending,
        priority=data.priority,
        tags=data.tags,
        due_date=data.due_date,
        recurrence=data.recurrence,
        user_id=user_id,
    )
    session.add(task)
    await session.commit()
    await session.refresh(task)
    return task


async def list_tasks(
    session: AsyncSession,
    user_id: str,
    *,
    status: TaskStatus | None = None,
    priority: str | None = None,
    tag: str | None = None,
) -> list[Task]:
    """List tasks for a user with optional filters."""
    query = select(Task).where(Task.user_id == user_id)

    if status is not None:
        query = query.where(Task.status == status)
    if priority is not None:
        query = query.where(Task.priority == priority)
    if tag is not None:
        # JSON-encoded list stored as text: search for tag in the JSON string
        query = query.where(
            text("tags LIKE :tag_pattern").bindparams(tag_pattern=f'%"{tag}"%')
        )

    query = query.order_by(Task.created_at.desc())
    result = await session.exec(query)
    return list(result.all())


async def get_task(
    session: AsyncSession, user_id: str, task_id: uuid.UUID
) -> Task | None:
    """Get a single task by ID, scoped to user (tenant isolation)."""
    query = select(Task).where(Task.id == task_id, Task.user_id == user_id)
    result = await session.exec(query)
    return result.first()


async def update_task(
    session: AsyncSession,
    user_id: str,
    task_id: uuid.UUID,
    data: TaskUpdate,
) -> Task | None:
    """Update task fields. Returns None if not found/not owned."""
    task = await get_task(session, user_id, task_id)
    if task is None:
        return None

    update_data = data.model_dump(exclude_unset=True)

    # Enforce recurrence+due_date coupling (FR-012)
    new_recurrence = update_data.get("recurrence", task.recurrence)
    new_due_date = update_data.get("due_date", task.due_date)
    if new_recurrence != TaskRecurrence.none and new_due_date is None:
        raise ValueError(
            "Recurrence requires a due date. "
            "Set a due_date or change recurrence to 'none'."
        )

    for field, value in update_data.items():
        setattr(task, field, value)

    task.updated_at = datetime.utcnow()
    session.add(task)
    await session.commit()
    await session.refresh(task)
    return task


async def toggle_task(
    session: AsyncSession, user_id: str, task_id: uuid.UUID
) -> Task | None:
    """Toggle task status between pending and completed."""
    task = await get_task(session, user_id, task_id)
    if task is None:
        return None

    task.status = (
        TaskStatus.completed
        if task.status == TaskStatus.pending
        else TaskStatus.pending
    )
    task.updated_at = datetime.utcnow()
    session.add(task)
    await session.commit()
    await session.refresh(task)
    return task


async def delete_task(
    session: AsyncSession, user_id: str, task_id: uuid.UUID
) -> bool:
    """Delete a task permanently. Returns False if not found/not owned."""
    task = await get_task(session, user_id, task_id)
    if task is None:
        return False

    await session.delete(task)
    await session.commit()
    return True
