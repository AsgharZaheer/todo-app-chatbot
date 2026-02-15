"""Task CRUD API endpoints under /api/tasks."""

import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlmodel.ext.asyncio.session import AsyncSession

from app.database import get_session
from app.middleware.auth import get_current_user_id
from app.models.task import TaskPriority, TaskStatus
from app.schemas.task import TaskCreate, TaskResponse, TaskUpdate
from app.services import task_service
from app.utils.responses import error_response, success_response

router = APIRouter(prefix="/api/tasks", tags=["tasks"])


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_task(
    data: TaskCreate,
    user_id: str = Depends(get_current_user_id),
    session: AsyncSession = Depends(get_session),
) -> dict:
    """Create a new task. Ref: contracts/create-task.md"""
    task = await task_service.create_task(session, user_id, data)
    return success_response(TaskResponse.model_validate(task).model_dump(mode="json"))


@router.get("")
async def list_tasks(
    user_id: str = Depends(get_current_user_id),
    session: AsyncSession = Depends(get_session),
    task_status: TaskStatus | None = Query(None, alias="status"),
    priority: TaskPriority | None = None,
    tag: str | None = None,
) -> dict:
    """List tasks for authenticated user. Ref: contracts/list-tasks.md"""
    tasks = await task_service.list_tasks(
        session, user_id, status=task_status, priority=priority, tag=tag
    )
    task_list = [
        TaskResponse.model_validate(t).model_dump(mode="json") for t in tasks
    ]
    return success_response(task_list, meta={"total": len(task_list)})


@router.get("/{task_id}")
async def get_task(
    task_id: uuid.UUID,
    user_id: str = Depends(get_current_user_id),
    session: AsyncSession = Depends(get_session),
) -> dict:
    """Get a single task. Ref: contracts/get-task.md"""
    task = await task_service.get_task(session, user_id, task_id)
    if task is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=error_response("NOT_FOUND", "Task not found"),
        )
    return success_response(TaskResponse.model_validate(task).model_dump(mode="json"))


@router.patch("/{task_id}")
async def update_task(
    task_id: uuid.UUID,
    data: TaskUpdate,
    user_id: str = Depends(get_current_user_id),
    session: AsyncSession = Depends(get_session),
) -> dict:
    """Update task fields. Ref: contracts/update-task.md"""
    try:
        task = await task_service.update_task(session, user_id, task_id, data)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=error_response(
                "VALIDATION_ERROR",
                "Task validation failed",
                [{"field": "recurrence", "message": str(e)}],
            ),
        )
    if task is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=error_response("NOT_FOUND", "Task not found"),
        )
    return success_response(TaskResponse.model_validate(task).model_dump(mode="json"))


@router.patch("/{task_id}/toggle")
async def toggle_task(
    task_id: uuid.UUID,
    user_id: str = Depends(get_current_user_id),
    session: AsyncSession = Depends(get_session),
) -> dict:
    """Toggle task completion. Ref: contracts/toggle-task.md"""
    task = await task_service.toggle_task(session, user_id, task_id)
    if task is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=error_response("NOT_FOUND", "Task not found"),
        )
    return success_response(TaskResponse.model_validate(task).model_dump(mode="json"))


@router.delete("/{task_id}")
async def delete_task(
    task_id: uuid.UUID,
    user_id: str = Depends(get_current_user_id),
    session: AsyncSession = Depends(get_session),
) -> dict:
    """Delete a task permanently. Ref: contracts/delete-task.md"""
    deleted = await task_service.delete_task(session, user_id, task_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=error_response("NOT_FOUND", "Task not found"),
        )
    return success_response({"id": str(task_id), "deleted": True})
