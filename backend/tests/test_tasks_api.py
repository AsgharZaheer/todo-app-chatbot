"""Contract tests for Task CRUD API endpoints."""

import pytest
import pytest_asyncio
from httpx import AsyncClient

from tests.conftest import TEST_USER_ID, TEST_USER_ID_2, make_auth_header


@pytest.mark.asyncio
class TestCreateTask:
    """POST /api/tasks — Ref: contracts/create-task.md"""

    async def test_create_task_title_only(self, client: AsyncClient):
        """US1: Create task with only title → 201, defaults applied."""
        resp = await client.post(
            "/api/tasks",
            json={"title": "Test task"},
            headers=make_auth_header(),
        )
        assert resp.status_code == 201
        data = resp.json()["data"]
        assert data["title"] == "Test task"
        assert data["status"] == "pending"
        assert data["priority"] == "medium"
        assert data["tags"] == []
        assert data["recurrence"] == "none"
        assert data["description"] is None

    async def test_create_task_all_fields(self, client: AsyncClient):
        """US1: Create task with all fields → 201."""
        resp = await client.post(
            "/api/tasks",
            json={
                "title": "Full task",
                "description": "A detailed description",
                "priority": "high",
                "tags": ["work", "urgent"],
                "due_date": "2026-03-01T18:00:00Z",
                "recurrence": "weekly",
            },
            headers=make_auth_header(),
        )
        assert resp.status_code == 201
        data = resp.json()["data"]
        assert data["title"] == "Full task"
        assert data["priority"] == "high"
        assert data["tags"] == ["work", "urgent"]
        assert data["recurrence"] == "weekly"

    async def test_create_task_empty_title_rejected(self, client: AsyncClient):
        """US1: Empty title → 422 validation error."""
        resp = await client.post(
            "/api/tasks",
            json={"title": ""},
            headers=make_auth_header(),
        )
        assert resp.status_code == 422

    async def test_create_task_recurrence_without_due_date_rejected(
        self, client: AsyncClient
    ):
        """US1: Recurrence without due_date → 422."""
        resp = await client.post(
            "/api/tasks",
            json={"title": "Recurring task", "recurrence": "daily"},
            headers=make_auth_header(),
        )
        assert resp.status_code == 422

    async def test_create_task_no_auth(self, client: AsyncClient):
        """US1: No auth header → 401/403."""
        resp = await client.post("/api/tasks", json={"title": "No auth"})
        assert resp.status_code in (401, 403)


@pytest.mark.asyncio
class TestListTasks:
    """GET /api/tasks — Ref: contracts/list-tasks.md"""

    async def test_list_empty(self, client: AsyncClient):
        """US1: No tasks → 200 with empty array."""
        resp = await client.get("/api/tasks", headers=make_auth_header())
        assert resp.status_code == 200
        body = resp.json()
        assert body["data"] == []
        assert body["meta"]["total"] == 0

    async def test_list_own_tasks_only(self, client: AsyncClient):
        """US1: Only returns tasks for authenticated user (tenant isolation)."""
        # Create task for user 1
        await client.post(
            "/api/tasks",
            json={"title": "User1 task"},
            headers=make_auth_header(TEST_USER_ID),
        )
        # Create task for user 2
        await client.post(
            "/api/tasks",
            json={"title": "User2 task"},
            headers=make_auth_header(TEST_USER_ID_2),
        )
        # User 1 should only see their task
        resp = await client.get(
            "/api/tasks", headers=make_auth_header(TEST_USER_ID)
        )
        assert resp.status_code == 200
        data = resp.json()["data"]
        assert len(data) == 1
        assert data[0]["title"] == "User1 task"

    async def test_list_no_auth(self, client: AsyncClient):
        """US1: No auth → 401/403."""
        resp = await client.get("/api/tasks")
        assert resp.status_code in (401, 403)


@pytest.mark.asyncio
class TestGetTask:
    """GET /api/tasks/{id} — Ref: contracts/get-task.md"""

    async def test_get_own_task(self, client: AsyncClient):
        """US2: Get own task → 200."""
        create_resp = await client.post(
            "/api/tasks",
            json={"title": "My task"},
            headers=make_auth_header(),
        )
        task_id = create_resp.json()["data"]["id"]
        resp = await client.get(
            f"/api/tasks/{task_id}", headers=make_auth_header()
        )
        assert resp.status_code == 200
        assert resp.json()["data"]["title"] == "My task"

    async def test_get_other_users_task_returns_404(self, client: AsyncClient):
        """US2: Get other user's task → 404 (not 403)."""
        create_resp = await client.post(
            "/api/tasks",
            json={"title": "Secret task"},
            headers=make_auth_header(TEST_USER_ID),
        )
        task_id = create_resp.json()["data"]["id"]
        resp = await client.get(
            f"/api/tasks/{task_id}",
            headers=make_auth_header(TEST_USER_ID_2),
        )
        assert resp.status_code == 404

    async def test_get_nonexistent_task(self, client: AsyncClient):
        """US2: Non-existent task → 404."""
        resp = await client.get(
            "/api/tasks/00000000-0000-0000-0000-000000000000",
            headers=make_auth_header(),
        )
        assert resp.status_code == 404


@pytest.mark.asyncio
class TestUpdateTask:
    """PATCH /api/tasks/{id} — Ref: contracts/update-task.md"""

    async def test_update_title(self, client: AsyncClient):
        """US2: Update title → 200."""
        create_resp = await client.post(
            "/api/tasks",
            json={"title": "Old title"},
            headers=make_auth_header(),
        )
        task_id = create_resp.json()["data"]["id"]
        resp = await client.patch(
            f"/api/tasks/{task_id}",
            json={"title": "New title"},
            headers=make_auth_header(),
        )
        assert resp.status_code == 200
        assert resp.json()["data"]["title"] == "New title"

    async def test_update_other_users_task_returns_404(
        self, client: AsyncClient
    ):
        """US2: Update other user's task → 404."""
        create_resp = await client.post(
            "/api/tasks",
            json={"title": "Private task"},
            headers=make_auth_header(TEST_USER_ID),
        )
        task_id = create_resp.json()["data"]["id"]
        resp = await client.patch(
            f"/api/tasks/{task_id}",
            json={"title": "Hacked"},
            headers=make_auth_header(TEST_USER_ID_2),
        )
        assert resp.status_code == 404


@pytest.mark.asyncio
class TestToggleTask:
    """PATCH /api/tasks/{id}/toggle — Ref: contracts/toggle-task.md"""

    async def test_toggle_pending_to_completed(self, client: AsyncClient):
        """US2: Toggle pending → completed."""
        create_resp = await client.post(
            "/api/tasks",
            json={"title": "Toggle me"},
            headers=make_auth_header(),
        )
        task_id = create_resp.json()["data"]["id"]
        resp = await client.patch(
            f"/api/tasks/{task_id}/toggle", headers=make_auth_header()
        )
        assert resp.status_code == 200
        assert resp.json()["data"]["status"] == "completed"

    async def test_toggle_completed_to_pending(self, client: AsyncClient):
        """US2: Toggle completed → pending."""
        create_resp = await client.post(
            "/api/tasks",
            json={"title": "Toggle back"},
            headers=make_auth_header(),
        )
        task_id = create_resp.json()["data"]["id"]
        # Toggle to completed
        await client.patch(
            f"/api/tasks/{task_id}/toggle", headers=make_auth_header()
        )
        # Toggle back to pending
        resp = await client.patch(
            f"/api/tasks/{task_id}/toggle", headers=make_auth_header()
        )
        assert resp.status_code == 200
        assert resp.json()["data"]["status"] == "pending"

    async def test_toggle_other_users_task(self, client: AsyncClient):
        """US2: Toggle other user's task → 404."""
        create_resp = await client.post(
            "/api/tasks",
            json={"title": "Not yours"},
            headers=make_auth_header(TEST_USER_ID),
        )
        task_id = create_resp.json()["data"]["id"]
        resp = await client.patch(
            f"/api/tasks/{task_id}/toggle",
            headers=make_auth_header(TEST_USER_ID_2),
        )
        assert resp.status_code == 404


@pytest.mark.asyncio
class TestDeleteTask:
    """DELETE /api/tasks/{id} — Ref: contracts/delete-task.md"""

    async def test_delete_own_task(self, client: AsyncClient):
        """US3: Delete own task → 200 with deleted:true."""
        create_resp = await client.post(
            "/api/tasks",
            json={"title": "Delete me"},
            headers=make_auth_header(),
        )
        task_id = create_resp.json()["data"]["id"]
        resp = await client.delete(
            f"/api/tasks/{task_id}", headers=make_auth_header()
        )
        assert resp.status_code == 200
        assert resp.json()["data"]["deleted"] is True

    async def test_delete_then_get_returns_404(self, client: AsyncClient):
        """US3: Deleted task is gone."""
        create_resp = await client.post(
            "/api/tasks",
            json={"title": "Gone soon"},
            headers=make_auth_header(),
        )
        task_id = create_resp.json()["data"]["id"]
        await client.delete(
            f"/api/tasks/{task_id}", headers=make_auth_header()
        )
        resp = await client.get(
            f"/api/tasks/{task_id}", headers=make_auth_header()
        )
        assert resp.status_code == 404

    async def test_delete_other_users_task(self, client: AsyncClient):
        """US3: Delete other user's task → 404."""
        create_resp = await client.post(
            "/api/tasks",
            json={"title": "Protected"},
            headers=make_auth_header(TEST_USER_ID),
        )
        task_id = create_resp.json()["data"]["id"]
        resp = await client.delete(
            f"/api/tasks/{task_id}",
            headers=make_auth_header(TEST_USER_ID_2),
        )
        assert resp.status_code == 404


@pytest.mark.asyncio
class TestFilterTasks:
    """GET /api/tasks?status=&priority=&tag= — Ref: contracts/list-tasks.md"""

    async def test_filter_by_status(self, client: AsyncClient):
        """US4: Filter by status=pending."""
        headers = make_auth_header()
        await client.post(
            "/api/tasks", json={"title": "Pending task"}, headers=headers
        )
        create2 = await client.post(
            "/api/tasks", json={"title": "Will complete"}, headers=headers
        )
        task_id = create2.json()["data"]["id"]
        await client.patch(f"/api/tasks/{task_id}/toggle", headers=headers)

        resp = await client.get(
            "/api/tasks?status=pending", headers=headers
        )
        assert resp.status_code == 200
        data = resp.json()["data"]
        assert len(data) == 1
        assert data[0]["title"] == "Pending task"

    async def test_filter_by_priority(self, client: AsyncClient):
        """US4: Filter by priority=high."""
        headers = make_auth_header()
        await client.post(
            "/api/tasks",
            json={"title": "High", "priority": "high"},
            headers=headers,
        )
        await client.post(
            "/api/tasks",
            json={"title": "Low", "priority": "low"},
            headers=headers,
        )
        resp = await client.get(
            "/api/tasks?priority=high", headers=headers
        )
        assert resp.status_code == 200
        data = resp.json()["data"]
        assert len(data) == 1
        assert data[0]["priority"] == "high"

    async def test_filter_by_tag(self, client: AsyncClient):
        """US4: Filter by tag."""
        headers = make_auth_header()
        await client.post(
            "/api/tasks",
            json={"title": "Work task", "tags": ["work"]},
            headers=headers,
        )
        await client.post(
            "/api/tasks",
            json={"title": "Home task", "tags": ["home"]},
            headers=headers,
        )
        resp = await client.get("/api/tasks?tag=work", headers=headers)
        assert resp.status_code == 200
        data = resp.json()["data"]
        assert len(data) == 1
        assert data[0]["title"] == "Work task"
