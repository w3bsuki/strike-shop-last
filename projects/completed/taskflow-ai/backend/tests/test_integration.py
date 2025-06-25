"""
Integration tests for complete workflows
"""
import pytest
import asyncio
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from unittest.mock import patch, Mock

from app.models.task import TaskStatus, TaskPriority
from tests.factories import UserFactory, TaskFactory


class TestCompleteWorkflows:
    """Test complete user workflows end-to-end."""

    @pytest.mark.integration
    @pytest.mark.asyncio
    async def test_complete_task_lifecycle(self, client: AsyncClient, db_session: AsyncSession):
        """Test complete task lifecycle from creation to completion."""
        
        # 1. Register user
        user_data = {
            "email": "lifecycle@example.com",
            "password": "testpass123",
            "name": "Lifecycle User"
        }
        
        response = await client.post("/api/v1/auth/register", json=user_data)
        assert response.status_code == 201
        
        auth_data = response.json()
        token = auth_data["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        # 2. Create a task
        task_data = {
            "title": "Complete Integration Task",
            "description": "A task for integration testing",
            "priority": TaskPriority.HIGH.value,
            "tags": ["integration", "testing"]
        }
        
        response = await client.post("/api/v1/tasks", json=task_data, headers=headers)
        assert response.status_code == 201
        
        created_task = response.json()
        task_id = created_task["id"]
        assert created_task["status"] == TaskStatus.TODO.value
        
        # 3. Update task to in progress
        response = await client.put(
            f"/api/v1/tasks/{task_id}",
            json={"status": TaskStatus.IN_PROGRESS.value},
            headers=headers
        )
        assert response.status_code == 200
        
        # 4. Add a comment
        comment_data = {"content": "Starting work on this task"}
        response = await client.post(
            f"/api/v1/tasks/{task_id}/comments",
            json=comment_data,
            headers=headers
        )
        assert response.status_code == 201
        
        # 5. Get AI suggestions for task improvement
        with patch('app.services.ai.AIService.analyze_task_complexity') as mock_ai:
            mock_ai.return_value = {
                "complexity_score": 75,
                "estimated_hours": 8,
                "recommendations": ["Break into smaller subtasks"]
            }
            
            response = await client.get(
                f"/api/v1/ai/tasks/{task_id}/complexity",
                headers=headers
            )
            assert response.status_code == 200
            ai_analysis = response.json()
            assert ai_analysis["complexity_score"] == 75
        
        # 6. Update task priority based on AI recommendation
        response = await client.put(
            f"/api/v1/tasks/{task_id}",
            json={"priority": TaskPriority.URGENT.value},
            headers=headers
        )
        assert response.status_code == 200
        
        # 7. Complete the task
        response = await client.put(
            f"/api/v1/tasks/{task_id}",
            json={
                "status": TaskStatus.COMPLETED.value,
                "actual_hours": 6
            },
            headers=headers
        )
        assert response.status_code == 200
        
        completed_task = response.json()
        assert completed_task["status"] == TaskStatus.COMPLETED.value
        assert completed_task["actual_hours"] == 6
        
        # 8. Verify task appears in analytics
        response = await client.get("/api/v1/tasks/analytics", headers=headers)
        assert response.status_code == 200
        
        analytics = response.json()
        assert analytics["status_distribution"]["completed"] >= 1
        assert analytics["completion_rate"] > 0

    @pytest.mark.integration
    @pytest.mark.asyncio
    async def test_team_collaboration_workflow(self, client: AsyncClient, db_session: AsyncSession):
        """Test team collaboration workflow."""
        
        # Create team members
        users = []
        for i in range(3):
            user_data = {
                "email": f"teamuser{i}@example.com",
                "password": "testpass123",
                "name": f"Team User {i}"
            }
            
            response = await client.post("/api/v1/auth/register", json=user_data)
            assert response.status_code == 201
            
            auth_data = response.json()
            users.append({
                "id": auth_data["user"]["id"],
                "token": auth_data["access_token"],
                "email": user_data["email"]
            })
        
        # Team lead (first user) creates a task
        lead = users[0]
        task_data = {
            "title": "Team Collaboration Task",
            "description": "A task requiring team collaboration",
            "priority": TaskPriority.HIGH.value
        }
        
        response = await client.post(
            "/api/v1/tasks",
            json=task_data,
            headers={"Authorization": f"Bearer {lead['token']}"}
        )
        assert response.status_code == 201
        
        task = response.json()
        task_id = task["id"]
        
        # Assign task to team member
        assignee = users[1]
        response = await client.post(
            f"/api/v1/tasks/{task_id}/assign",
            json={"assignee_id": assignee["id"]},
            headers={"Authorization": f"Bearer {lead['token']}"}
        )
        assert response.status_code == 200
        
        # Assignee updates task status
        response = await client.put(
            f"/api/v1/tasks/{task_id}",
            json={"status": TaskStatus.IN_PROGRESS.value},
            headers={"Authorization": f"Bearer {assignee['token']}"}
        )
        assert response.status_code == 200
        
        # Team member adds comment
        reviewer = users[2]
        response = await client.post(
            f"/api/v1/tasks/{task_id}/comments",
            json={"content": "Looks good, proceeding with review"},
            headers={"Authorization": f"Bearer {reviewer['token']}"}
        )
        assert response.status_code == 201
        
        # Assignee completes task
        response = await client.put(
            f"/api/v1/tasks/{task_id}",
            json={"status": TaskStatus.COMPLETED.value},
            headers={"Authorization": f"Bearer {assignee['token']}"}
        )
        assert response.status_code == 200

    @pytest.mark.integration
    @pytest.mark.asyncio
    async def test_ai_driven_workflow(self, client: AsyncClient, db_session: AsyncSession):
        """Test AI-driven task management workflow."""
        
        # Register user
        user_data = {
            "email": "aiuser@example.com",
            "password": "testpass123",
            "name": "AI User"
        }
        
        response = await client.post("/api/v1/auth/register", json=user_data)
        assert response.status_code == 201
        
        auth_data = response.json()
        token = auth_data["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        # 1. Get AI task suggestions
        with patch('app.services.ai.AIService.suggest_tasks_from_context') as mock_suggest:
            mock_suggest.return_value = [
                {
                    "title": "Prepare presentation slides",
                    "description": "Create slides for client meeting",
                    "priority": "high"
                },
                {
                    "title": "Research competitor analysis",
                    "description": "Analyze market competitors",
                    "priority": "medium"
                }
            ]
            
            response = await client.post(
                "/api/v1/ai/suggest-tasks",
                json={"context": "I have a client meeting next week"},
                headers=headers
            )
            assert response.status_code == 200
            
            suggestions = response.json()["suggestions"]
            assert len(suggestions) == 2
        
        # 2. Create tasks from AI suggestions
        task_ids = []
        for suggestion in suggestions:
            response = await client.post(
                "/api/v1/tasks",
                json=suggestion,
                headers=headers
            )
            assert response.status_code == 201
            task_ids.append(response.json()["id"])
        
        # 3. Get AI productivity analysis
        with patch('app.services.ai.AIService.analyze_productivity_patterns') as mock_analyze:
            mock_analyze.return_value = {
                "productivity_score": 78,
                "completion_rate": 0.82,
                "insights": [
                    "You work best in the morning",
                    "Break large tasks into smaller ones"
                ],
                "recommendations": [
                    "Schedule important tasks for 9-11 AM",
                    "Take breaks every 2 hours"
                ]
            }
            
            response = await client.post("/api/v1/ai/analyze-productivity", headers=headers)
            assert response.status_code == 200
            
            analysis = response.json()
            assert analysis["productivity_score"] == 78
            assert len(analysis["insights"]) == 2
        
        # 4. Get AI task prioritization
        with patch('app.services.ai.AIService.suggest_task_prioritization') as mock_prioritize:
            mock_prioritize.return_value = {
                "prioritized_tasks": [
                    {
                        "task_id": task_ids[0],
                        "suggested_priority": "urgent",
                        "reason": "Client meeting deadline approaching"
                    }
                ],
                "insights": ["Focus on client-facing tasks first"]
            }
            
            response = await client.get("/api/v1/ai/prioritization", headers=headers)
            assert response.status_code == 200
            
            prioritization = response.json()
            assert len(prioritization["prioritized_tasks"]) == 1
        
        # 5. Apply AI-suggested priority changes
        priority_update = prioritization["prioritized_tasks"][0]
        response = await client.put(
            f"/api/v1/tasks/{priority_update['task_id']}",
            json={"priority": priority_update["suggested_priority"]},
            headers=headers
        )
        assert response.status_code == 200

    @pytest.mark.integration
    @pytest.mark.asyncio
    async def test_bulk_operations_workflow(self, client: AsyncClient, db_session: AsyncSession):
        """Test bulk operations workflow."""
        
        # Register user
        user_data = {
            "email": "bulkuser@example.com",
            "password": "testpass123",
            "name": "Bulk User"
        }
        
        response = await client.post("/api/v1/auth/register", json=user_data)
        assert response.status_code == 201
        
        auth_data = response.json()
        token = auth_data["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        # Create multiple tasks
        task_ids = []
        for i in range(5):
            task_data = {
                "title": f"Bulk Task {i+1}",
                "description": f"Task {i+1} for bulk operations",
                "priority": TaskPriority.MEDIUM.value
            }
            
            response = await client.post("/api/v1/tasks", json=task_data, headers=headers)
            assert response.status_code == 201
            task_ids.append(response.json()["id"])
        
        # Bulk update tasks
        bulk_update_data = {
            "task_ids": task_ids[:3],  # Update first 3 tasks
            "updates": {
                "status": TaskStatus.IN_PROGRESS.value,
                "priority": TaskPriority.HIGH.value
            }
        }
        
        response = await client.post(
            "/api/v1/tasks/bulk-update",
            json=bulk_update_data,
            headers=headers
        )
        assert response.status_code == 200
        
        updated_tasks = response.json()["updated_tasks"]
        assert len(updated_tasks) == 3
        
        for task in updated_tasks:
            assert task["status"] == TaskStatus.IN_PROGRESS.value
            assert task["priority"] == TaskPriority.HIGH.value
        
        # Bulk delete remaining tasks
        response = await client.post(
            "/api/v1/tasks/bulk-delete",
            json={"task_ids": task_ids[3:]},  # Delete last 2 tasks
            headers=headers
        )
        assert response.status_code == 200
        
        result = response.json()
        assert result["deleted_count"] == 2
        
        # Verify remaining tasks
        response = await client.get("/api/v1/tasks", headers=headers)
        assert response.status_code == 200
        
        remaining_tasks = response.json()["items"]
        assert len(remaining_tasks) == 3  # Only first 3 tasks remain

    @pytest.mark.integration
    @pytest.mark.asyncio
    async def test_error_handling_workflow(self, client: AsyncClient, db_session: AsyncSession):
        """Test error handling in various workflows."""
        
        # 1. Test unauthorized access
        response = await client.get("/api/v1/tasks")
        assert response.status_code == 401
        
        # 2. Register user
        user_data = {
            "email": "erroruser@example.com",
            "password": "testpass123",
            "name": "Error User"
        }
        
        response = await client.post("/api/v1/auth/register", json=user_data)
        assert response.status_code == 201
        
        auth_data = response.json()
        token = auth_data["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        # 3. Test creating task with invalid data
        invalid_task_data = {
            "title": "",  # Empty title
            "priority": "invalid_priority"
        }
        
        response = await client.post("/api/v1/tasks", json=invalid_task_data, headers=headers)
        assert response.status_code == 422
        
        # 4. Test accessing non-existent task
        response = await client.get("/api/v1/tasks/99999", headers=headers)
        assert response.status_code == 404
        
        # 5. Test AI service error handling
        with patch('app.services.ai.AIService.suggest_tasks_from_context') as mock_suggest:
            mock_suggest.side_effect = Exception("AI Service Error")
            
            response = await client.post(
                "/api/v1/ai/suggest-tasks",
                json={"context": "Test context"},
                headers=headers
            )
            # Should handle error gracefully
            assert response.status_code in [500, 503]
        
        # 6. Test database connection error simulation
        # This would require more complex setup to simulate database failures
        
        # 7. Test rate limiting (if implemented)
        # Make rapid requests to test rate limiting
        for i in range(10):
            response = await client.get("/api/v1/tasks", headers=headers)
            # Should not fail due to rate limiting in normal circumstances
            assert response.status_code == 200

    @pytest.mark.integration
    @pytest.mark.asyncio
    async def test_real_time_updates_workflow(self, client: AsyncClient, db_session: AsyncSession):
        """Test real-time updates through WebSocket integration."""
        
        # Register two users
        users = []
        for i in range(2):
            user_data = {
                "email": f"realtimeuser{i}@example.com",
                "password": "testpass123",
                "name": f"Realtime User {i}"
            }
            
            response = await client.post("/api/v1/auth/register", json=user_data)
            assert response.status_code == 201
            
            auth_data = response.json()
            users.append({
                "id": auth_data["user"]["id"],
                "token": auth_data["access_token"]
            })
        
        # Mock WebSocket manager to test real-time notifications
        with patch('app.websocket.manager.ConnectionManager.send_personal_message') as mock_send:
            # User 1 creates a task
            task_data = {
                "title": "Real-time Task",
                "description": "Task for real-time testing"
            }
            
            response = await client.post(
                "/api/v1/tasks",
                json=task_data,
                headers={"Authorization": f"Bearer {users[0]['token']}"}
            )
            assert response.status_code == 201
            
            task = response.json()
            task_id = task["id"]
            
            # Should trigger WebSocket notification for task creation
            mock_send.assert_called()
            
            # User 1 assigns task to User 2
            response = await client.post(
                f"/api/v1/tasks/{task_id}/assign",
                json={"assignee_id": users[1]["id"]},
                headers={"Authorization": f"Bearer {users[0]['token']}"}
            )
            assert response.status_code == 200
            
            # Should trigger WebSocket notification for assignment
            assert mock_send.call_count >= 2
            
            # User 2 updates task status
            response = await client.put(
                f"/api/v1/tasks/{task_id}",
                json={"status": TaskStatus.IN_PROGRESS.value},
                headers={"Authorization": f"Bearer {users[1]['token']}"}
            )
            assert response.status_code == 200
            
            # Should trigger WebSocket notification for status change
            assert mock_send.call_count >= 3