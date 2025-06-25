"""
Test task endpoints
"""
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime, timezone
from unittest.mock import patch

from app.models.task import TaskStatus, TaskPriority
from tests.factories import TaskFactory, UserFactory, TestScenarioFactories


class TestTaskEndpoints:
    """Test task CRUD endpoints."""

    @pytest.mark.asyncio
    async def test_create_task(self, authenticated_client: AsyncClient, db_session: AsyncSession):
        """Test creating a new task."""
        task_data = {
            "title": "New Task",
            "description": "Task description",
            "priority": TaskPriority.HIGH.value,
            "due_date": "2024-12-31T23:59:59Z",
            "tags": ["work", "urgent"]
        }
        
        response = await authenticated_client.post("/api/v1/tasks", json=task_data)
        
        assert response.status_code == 201
        data = response.json()
        assert data["title"] == task_data["title"]
        assert data["description"] == task_data["description"]
        assert data["priority"] == task_data["priority"]
        assert data["status"] == TaskStatus.TODO.value
        assert data["tags"] == task_data["tags"]

    @pytest.mark.asyncio
    async def test_create_task_minimal_data(self, authenticated_client: AsyncClient):
        """Test creating a task with minimal required data."""
        task_data = {
            "title": "Minimal Task"
        }
        
        response = await authenticated_client.post("/api/v1/tasks", json=task_data)
        
        assert response.status_code == 201
        data = response.json()
        assert data["title"] == "Minimal Task"
        assert data["status"] == TaskStatus.TODO.value
        assert data["priority"] == TaskPriority.MEDIUM.value

    @pytest.mark.asyncio
    async def test_create_task_invalid_data(self, authenticated_client: AsyncClient):
        """Test creating a task with invalid data."""
        invalid_data = [
            {},  # Missing title
            {"title": ""},  # Empty title
            {"title": "Task", "priority": "invalid"},  # Invalid priority
            {"title": "Task", "status": "invalid"},  # Invalid status
        ]
        
        for data in invalid_data:
            response = await authenticated_client.post("/api/v1/tasks", json=data)
            assert response.status_code == 422

    @pytest.mark.asyncio
    async def test_get_tasks(self, authenticated_client: AsyncClient, db_session: AsyncSession):
        """Test getting all tasks for authenticated user."""
        user, tasks = await TestScenarioFactories.create_user_with_tasks(db_session, num_tasks=5)
        
        response = await authenticated_client.get("/api/v1/tasks")
        
        assert response.status_code == 200
        data = response.json()
        
        # Should return paginated results
        assert "items" in data
        assert "total" in data
        assert "page" in data
        assert "pages" in data
        
        # Should only return user's tasks
        assert len(data["items"]) == 5

    @pytest.mark.asyncio
    async def test_get_tasks_with_filters(self, authenticated_client: AsyncClient, db_session: AsyncSession):
        """Test getting tasks with filters."""
        user, tasks_by_status = await TestScenarioFactories.create_task_board_scenario(db_session)
        
        # Filter by status
        response = await authenticated_client.get(
            "/api/v1/tasks", 
            params={"status": TaskStatus.TODO.value}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert len(data["items"]) == 3  # 3 TODO tasks
        
        # Filter by priority
        response = await authenticated_client.get(
            "/api/v1/tasks", 
            params={"priority": TaskPriority.HIGH.value}
        )
        
        assert response.status_code == 200

    @pytest.mark.asyncio
    async def test_get_tasks_with_search(self, authenticated_client: AsyncClient, db_session: AsyncSession):
        """Test searching tasks."""
        user = await UserFactory.create_async(db_session)
        await TaskFactory.create_async(
            db_session, 
            title="Important Meeting",
            created_by=user.id,
            assignee_id=user.id
        )
        await TaskFactory.create_async(
            db_session, 
            title="Code Review",
            created_by=user.id,
            assignee_id=user.id
        )
        
        response = await authenticated_client.get(
            "/api/v1/tasks", 
            params={"search": "meeting"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert len(data["items"]) == 1
        assert "meeting" in data["items"][0]["title"].lower()

    @pytest.mark.asyncio
    async def test_get_task_by_id(self, authenticated_client: AsyncClient, db_session: AsyncSession, test_task):
        """Test getting a specific task by ID."""
        response = await authenticated_client.get(f"/api/v1/tasks/{test_task.id}")
        
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == test_task.id
        assert data["title"] == test_task.title

    @pytest.mark.asyncio
    async def test_get_task_not_found(self, authenticated_client: AsyncClient):
        """Test getting a non-existent task."""
        response = await authenticated_client.get("/api/v1/tasks/999")
        
        assert response.status_code == 404

    @pytest.mark.asyncio
    async def test_get_task_not_owned(self, authenticated_client: AsyncClient, db_session: AsyncSession):
        """Test getting a task not owned by the user."""
        other_user = await UserFactory.create_async(db_session)
        other_task = await TaskFactory.create_async(
            db_session, 
            created_by=other_user.id,
            assignee_id=other_user.id
        )
        
        response = await authenticated_client.get(f"/api/v1/tasks/{other_task.id}")
        
        assert response.status_code == 404

    @pytest.mark.asyncio
    async def test_update_task(self, authenticated_client: AsyncClient, db_session: AsyncSession, test_task):
        """Test updating a task."""
        update_data = {
            "title": "Updated Task Title",
            "status": TaskStatus.IN_PROGRESS.value,
            "priority": TaskPriority.URGENT.value,
            "tags": ["updated", "important"]
        }
        
        response = await authenticated_client.put(
            f"/api/v1/tasks/{test_task.id}", 
            json=update_data
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["title"] == update_data["title"]
        assert data["status"] == update_data["status"]
        assert data["priority"] == update_data["priority"]
        assert data["tags"] == update_data["tags"]

    @pytest.mark.asyncio
    async def test_update_task_partial(self, authenticated_client: AsyncClient, test_task):
        """Test partial task update."""
        update_data = {
            "status": TaskStatus.COMPLETED.value
        }
        
        response = await authenticated_client.put(
            f"/api/v1/tasks/{test_task.id}", 
            json=update_data
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == TaskStatus.COMPLETED.value
        assert data["title"] == test_task.title  # Should remain unchanged

    @pytest.mark.asyncio
    async def test_update_task_invalid_data(self, authenticated_client: AsyncClient, test_task):
        """Test updating task with invalid data."""
        invalid_updates = [
            {"title": ""},  # Empty title
            {"priority": "invalid"},  # Invalid priority
            {"status": "invalid"},  # Invalid status
        ]
        
        for update_data in invalid_updates:
            response = await authenticated_client.put(
                f"/api/v1/tasks/{test_task.id}", 
                json=update_data
            )
            assert response.status_code == 422

    @pytest.mark.asyncio
    async def test_update_task_not_found(self, authenticated_client: AsyncClient):
        """Test updating a non-existent task."""
        response = await authenticated_client.put(
            "/api/v1/tasks/999", 
            json={"title": "Updated"}
        )
        
        assert response.status_code == 404

    @pytest.mark.asyncio
    async def test_delete_task(self, authenticated_client: AsyncClient, test_task):
        """Test deleting a task."""
        response = await authenticated_client.delete(f"/api/v1/tasks/{test_task.id}")
        
        assert response.status_code == 204
        
        # Verify task is deleted
        response = await authenticated_client.get(f"/api/v1/tasks/{test_task.id}")
        assert response.status_code == 404

    @pytest.mark.asyncio
    async def test_delete_task_not_found(self, authenticated_client: AsyncClient):
        """Test deleting a non-existent task."""
        response = await authenticated_client.delete("/api/v1/tasks/999")
        
        assert response.status_code == 404

    @pytest.mark.asyncio
    async def test_bulk_update_tasks(self, authenticated_client: AsyncClient, db_session: AsyncSession):
        """Test bulk updating multiple tasks."""
        user, tasks = await TestScenarioFactories.create_user_with_tasks(db_session, num_tasks=3)
        task_ids = [task.id for task in tasks[:2]]
        
        bulk_update_data = {
            "task_ids": task_ids,
            "updates": {
                "status": TaskStatus.IN_PROGRESS.value,
                "priority": TaskPriority.HIGH.value
            }
        }
        
        response = await authenticated_client.post("/api/v1/tasks/bulk-update", json=bulk_update_data)
        
        assert response.status_code == 200
        data = response.json()
        assert len(data["updated_tasks"]) == 2
        
        for task_data in data["updated_tasks"]:
            assert task_data["status"] == TaskStatus.IN_PROGRESS.value
            assert task_data["priority"] == TaskPriority.HIGH.value

    @pytest.mark.asyncio
    async def test_bulk_delete_tasks(self, authenticated_client: AsyncClient, db_session: AsyncSession):
        """Test bulk deleting multiple tasks."""
        user, tasks = await TestScenarioFactories.create_user_with_tasks(db_session, num_tasks=3)
        task_ids = [task.id for task in tasks[:2]]
        
        response = await authenticated_client.post("/api/v1/tasks/bulk-delete", json={
            "task_ids": task_ids
        })
        
        assert response.status_code == 200
        data = response.json()
        assert data["deleted_count"] == 2

    @pytest.mark.asyncio
    async def test_get_task_analytics(self, authenticated_client: AsyncClient, db_session: AsyncSession):
        """Test getting task analytics."""
        user, tasks_by_status = await TestScenarioFactories.create_task_board_scenario(db_session)
        
        response = await authenticated_client.get("/api/v1/tasks/analytics")
        
        assert response.status_code == 200
        data = response.json()
        
        assert "status_distribution" in data
        assert "priority_distribution" in data
        assert "completion_rate" in data
        assert "overdue_count" in data

    @pytest.mark.asyncio
    async def test_assign_task(self, authenticated_client: AsyncClient, db_session: AsyncSession, test_task):
        """Test assigning a task to a user."""
        assignee = await UserFactory.create_async(db_session)
        
        response = await authenticated_client.post(
            f"/api/v1/tasks/{test_task.id}/assign",
            json={"assignee_id": assignee.id}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["assignee_id"] == assignee.id

    @pytest.mark.asyncio 
    async def test_add_task_comment(self, authenticated_client: AsyncClient, test_task):
        """Test adding a comment to a task."""
        comment_data = {
            "content": "This is a test comment"
        }
        
        response = await authenticated_client.post(
            f"/api/v1/tasks/{test_task.id}/comments",
            json=comment_data
        )
        
        assert response.status_code == 201
        data = response.json()
        assert data["content"] == comment_data["content"]

    @pytest.mark.asyncio
    async def test_get_task_comments(self, authenticated_client: AsyncClient, test_task):
        """Test getting task comments."""
        # Add a comment first
        await authenticated_client.post(
            f"/api/v1/tasks/{test_task.id}/comments",
            json={"content": "Test comment"}
        )
        
        response = await authenticated_client.get(f"/api/v1/tasks/{test_task.id}/comments")
        
        assert response.status_code == 200
        data = response.json()
        assert len(data) >= 1
        assert data[0]["content"] == "Test comment"