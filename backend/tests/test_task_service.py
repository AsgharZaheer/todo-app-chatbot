"""Unit tests for task_service — covers T020, T035, T046."""

import uuid
from datetime import datetime

import pytest
from sqlmodel.ext.asyncio.session import AsyncSession

from app.models.task import TaskPriority, TaskRecurrence, TaskStatus
from app.schemas.task import TaskCreate, TaskUpdate
from app.services import task_service

# Constants matching conftest.py
TEST_USER_ID = "test-user-001"
TEST_USER_ID_2 = "test-user-002"


# ─── US1: create_task & list_tasks ───────────────────────────────────


@pytest.mark.asyncio
class TestCreateTask:
    """T020 — create_task validates title length, sets defaults, list_tasks filters by user_id."""

    async def test_create_task_minimal(self, session: AsyncSession):
        """Create task with title only — defaults are set."""
        data = TaskCreate(title="Buy groceries")
        task = await task_service.create_task(session, TEST_USER_ID, data)

        assert task.title == "Buy groceries"
        assert task.status == TaskStatus.pending
        assert task.priority == TaskPriority.medium
        assert task.recurrence == TaskRecurrence.none
        assert task.user_id == TEST_USER_ID
        assert task.description is None
        assert task.tags == []

    async def test_create_task_all_fields(self, session: AsyncSession):
        """Create task with every field populated."""
        data = TaskCreate(
            title="Weekly report",
            description="Prepare status report",
            priority=TaskPriority.high,
            tags=["work", "weekly"],
            due_date=datetime(2026, 3, 1),
            recurrence=TaskRecurrence.weekly,
        )
        task = await task_service.create_task(session, TEST_USER_ID, data)

        assert task.title == "Weekly report"
        assert task.description == "Prepare status report"
        assert task.priority == TaskPriority.high
        assert task.tags == ["work", "weekly"]
        assert task.recurrence == TaskRecurrence.weekly

    async def test_list_tasks_filters_by_user(self, session: AsyncSession):
        """list_tasks only returns tasks belonging to the requesting user."""
        await task_service.create_task(
            session, TEST_USER_ID, TaskCreate(title="User1 task")
        )
        await task_service.create_task(
            session, TEST_USER_ID_2, TaskCreate(title="User2 task")
        )

        user1_tasks = await task_service.list_tasks(session, TEST_USER_ID)
        assert len(user1_tasks) == 1
        assert user1_tasks[0].title == "User1 task"

    async def test_list_tasks_ordered_desc(self, session: AsyncSession):
        """Tasks are returned newest first."""
        await task_service.create_task(
            session, TEST_USER_ID, TaskCreate(title="First")
        )
        await task_service.create_task(
            session, TEST_USER_ID, TaskCreate(title="Second")
        )

        tasks = await task_service.list_tasks(session, TEST_USER_ID)
        assert tasks[0].title == "Second"
        assert tasks[1].title == "First"


# ─── US2: get_task, update_task, toggle_task ─────────────────────────


@pytest.mark.asyncio
class TestGetUpdateToggle:
    """T035 — get_task filters by user_id, update_task applies partial, toggle_task flips status."""

    async def test_get_task_own(self, session: AsyncSession):
        """User can retrieve their own task."""
        created = await task_service.create_task(
            session, TEST_USER_ID, TaskCreate(title="My task")
        )
        found = await task_service.get_task(session, TEST_USER_ID, created.id)
        assert found is not None
        assert found.id == created.id

    async def test_get_task_other_user_returns_none(self, session: AsyncSession):
        """Attempting to get another user's task returns None (tenant isolation)."""
        created = await task_service.create_task(
            session, TEST_USER_ID, TaskCreate(title="Private")
        )
        found = await task_service.get_task(session, TEST_USER_ID_2, created.id)
        assert found is None

    async def test_get_nonexistent_returns_none(self, session: AsyncSession):
        """Non-existent task ID returns None."""
        found = await task_service.get_task(
            session, TEST_USER_ID, uuid.uuid4()
        )
        assert found is None

    async def test_update_partial(self, session: AsyncSession):
        """Partial update only modifies specified fields."""
        created = await task_service.create_task(
            session,
            TEST_USER_ID,
            TaskCreate(title="Original", priority=TaskPriority.low),
        )
        updated = await task_service.update_task(
            session,
            TEST_USER_ID,
            created.id,
            TaskUpdate(title="Changed"),
        )
        assert updated is not None
        assert updated.title == "Changed"
        assert updated.priority == TaskPriority.low  # unchanged

    async def test_update_recurrence_without_due_date_raises(
        self, session: AsyncSession
    ):
        """Setting recurrence without due_date raises ValueError (FR-012)."""
        created = await task_service.create_task(
            session, TEST_USER_ID, TaskCreate(title="No date")
        )
        with pytest.raises(ValueError, match="Recurrence requires a due date"):
            await task_service.update_task(
                session,
                TEST_USER_ID,
                created.id,
                TaskUpdate(recurrence=TaskRecurrence.daily),
            )

    async def test_toggle_pending_to_completed(self, session: AsyncSession):
        """Toggle flips pending → completed."""
        created = await task_service.create_task(
            session, TEST_USER_ID, TaskCreate(title="Toggle me")
        )
        assert created.status == TaskStatus.pending

        toggled = await task_service.toggle_task(
            session, TEST_USER_ID, created.id
        )
        assert toggled is not None
        assert toggled.status == TaskStatus.completed

    async def test_toggle_completed_to_pending(self, session: AsyncSession):
        """Toggle flips completed → pending."""
        created = await task_service.create_task(
            session, TEST_USER_ID, TaskCreate(title="Toggle back")
        )
        await task_service.toggle_task(session, TEST_USER_ID, created.id)
        toggled = await task_service.toggle_task(
            session, TEST_USER_ID, created.id
        )
        assert toggled is not None
        assert toggled.status == TaskStatus.pending


# ─── US3: delete_task ────────────────────────────────────────────────


@pytest.mark.asyncio
class TestDeleteTask:
    """T046 — delete_task removes from DB, returns False for non-existent/other-user."""

    async def test_delete_own_task(self, session: AsyncSession):
        """User can delete their own task."""
        created = await task_service.create_task(
            session, TEST_USER_ID, TaskCreate(title="Delete me")
        )
        result = await task_service.delete_task(
            session, TEST_USER_ID, created.id
        )
        assert result is True

        # Verify it's gone
        found = await task_service.get_task(session, TEST_USER_ID, created.id)
        assert found is None

    async def test_delete_other_user_returns_false(self, session: AsyncSession):
        """Cannot delete another user's task."""
        created = await task_service.create_task(
            session, TEST_USER_ID, TaskCreate(title="Not yours")
        )
        result = await task_service.delete_task(
            session, TEST_USER_ID_2, created.id
        )
        assert result is False

    async def test_delete_nonexistent_returns_false(self, session: AsyncSession):
        """Deleting non-existent task returns False."""
        result = await task_service.delete_task(
            session, TEST_USER_ID, uuid.uuid4()
        )
        assert result is False
