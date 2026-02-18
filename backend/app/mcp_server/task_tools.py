"""MCP Server exposing task management tools via FastMCP.

Each tool is stateless: opens its own DB session, executes, commits, closes.
All tools scope queries by user_id for tenant isolation.

Run as subprocess: python -m app.mcp_server.task_tools
"""

import json
import logging
import sys
import uuid
from pathlib import Path

logger = logging.getLogger(__name__)

# Ensure the backend directory is on sys.path when running as subprocess
_backend_dir = str(Path(__file__).resolve().parent.parent.parent)
if _backend_dir not in sys.path:
    sys.path.insert(0, _backend_dir)

from mcp.server.fastmcp import FastMCP
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.database import engine
from app.models.task import Task, TaskStatus

mcp = FastMCP("TaskTools")


async def _get_session() -> AsyncSession:
    """Create a fresh async DB session for a single tool invocation."""
    return AsyncSession(engine)


@mcp.tool()
async def add_task(user_id: str, title: str, description: str = "") -> str:
    """Create a new task for the user. Use when the user wants to add, create, or make a new task."""
    if not title or not title.strip():
        return json.dumps({"success": False, "error": "Title is required"})
    if len(title) > 200:
        return json.dumps({"success": False, "error": "Title must be 200 characters or less"})
    if description and len(description) > 1000:
        return json.dumps({"success": False, "error": "Description must be 1000 characters or less"})

    logger.info("add_task called: user_id=%s, title=%s", user_id, title[:50])
    session = await _get_session()
    try:
        task = Task(
            title=title.strip(),
            description=description.strip() if description else None,
            status=TaskStatus.pending,
            user_id=user_id,
        )
        session.add(task)
        await session.commit()
        await session.refresh(task)
        logger.info("add_task success: task_id=%s", task.id)
        return json.dumps({
            "success": True,
            "data": {
                "id": str(task.id),
                "title": task.title,
                "description": task.description,
                "completed": False,
            },
        })
    except Exception as e:
        await session.rollback()
        logger.error("add_task failed: %s", e)
        return json.dumps({"success": False, "error": f"Database error: {e}"})
    finally:
        await session.close()


@mcp.tool()
async def list_tasks(user_id: str, status: str = "") -> str:
    """List all tasks for the user. Optionally filter by status ('pending' or 'completed'). Use when the user wants to see, show, view, or list their tasks."""
    if status and status not in ("pending", "completed"):
        return json.dumps({"success": False, "error": "Status must be 'pending', 'completed', or empty"})

    session = await _get_session()
    try:
        query = select(Task).where(Task.user_id == user_id)
        if status:
            query = query.where(Task.status == status)
        query = query.order_by(Task.created_at.desc())
        result = await session.exec(query)
        tasks = list(result.all())
        return json.dumps({
            "success": True,
            "data": {
                "tasks": [
                    {
                        "id": str(t.id),
                        "title": t.title,
                        "description": t.description,
                        "completed": t.status == TaskStatus.completed,
                        "priority": t.priority.value if t.priority else "medium",
                        "created_at": t.created_at.isoformat() if t.created_at else None,
                    }
                    for t in tasks
                ],
                "count": len(tasks),
            },
        })
    except Exception as e:
        return json.dumps({"success": False, "error": f"Database error: {e}"})
    finally:
        await session.close()


@mcp.tool()
async def complete_task(user_id: str, task_id: str) -> str:
    """Mark a task as completed. Use when the user wants to complete, finish, or mark done a task."""
    try:
        task_uuid = uuid.UUID(task_id)
    except ValueError:
        return json.dumps({"success": False, "error": "Invalid task ID format"})

    session = await _get_session()
    try:
        query = select(Task).where(Task.id == task_uuid, Task.user_id == user_id)
        result = await session.exec(query)
        task = result.first()
        if not task:
            return json.dumps({"success": False, "error": "Task not found"})
        if task.status == TaskStatus.completed:
            return json.dumps({"success": False, "error": "Task is already completed"})

        task.status = TaskStatus.completed
        session.add(task)
        await session.commit()
        await session.refresh(task)
        return json.dumps({
            "success": True,
            "data": {
                "id": str(task.id),
                "title": task.title,
                "completed": True,
            },
        })
    except Exception as e:
        await session.rollback()
        return json.dumps({"success": False, "error": f"Database error: {e}"})
    finally:
        await session.close()


@mcp.tool()
async def delete_task(user_id: str, task_id: str) -> str:
    """Delete a task permanently. Use when the user wants to delete or remove a task."""
    try:
        task_uuid = uuid.UUID(task_id)
    except ValueError:
        return json.dumps({"success": False, "error": "Invalid task ID format"})

    session = await _get_session()
    try:
        query = select(Task).where(Task.id == task_uuid, Task.user_id == user_id)
        result = await session.exec(query)
        task = result.first()
        if not task:
            return json.dumps({"success": False, "error": "Task not found"})

        title = task.title
        task_id_str = str(task.id)
        await session.delete(task)
        await session.commit()
        return json.dumps({
            "success": True,
            "data": {
                "id": task_id_str,
                "title": title,
                "deleted": True,
            },
        })
    except Exception as e:
        await session.rollback()
        return json.dumps({"success": False, "error": f"Database error: {e}"})
    finally:
        await session.close()


@mcp.tool()
async def update_task(
    user_id: str, task_id: str, title: str = "", description: str = ""
) -> str:
    """Update a task's title or description. Use when the user wants to rename, edit, change, or update a task."""
    try:
        task_uuid = uuid.UUID(task_id)
    except ValueError:
        return json.dumps({"success": False, "error": "Invalid task ID format"})

    if not title and not description:
        return json.dumps({"success": False, "error": "No fields to update"})
    if title and len(title) > 200:
        return json.dumps({"success": False, "error": "Title must be 200 characters or less"})
    if description and len(description) > 1000:
        return json.dumps({"success": False, "error": "Description must be 1000 characters or less"})

    session = await _get_session()
    try:
        query = select(Task).where(Task.id == task_uuid, Task.user_id == user_id)
        result = await session.exec(query)
        task = result.first()
        if not task:
            return json.dumps({"success": False, "error": "Task not found"})

        if title:
            task.title = title.strip()
        if description:
            task.description = description.strip()

        session.add(task)
        await session.commit()
        await session.refresh(task)
        return json.dumps({
            "success": True,
            "data": {
                "id": str(task.id),
                "title": task.title,
                "description": task.description,
                "completed": task.status == TaskStatus.completed,
            },
        })
    except Exception as e:
        await session.rollback()
        return json.dumps({"success": False, "error": f"Database error: {e}"})
    finally:
        await session.close()


if __name__ == "__main__":
    mcp.run(transport="stdio")
