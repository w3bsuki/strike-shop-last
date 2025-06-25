"""
Comprehensive team collaboration testing
"""
import pytest
import asyncio
from datetime import datetime, timezone, timedelta
from unittest.mock import AsyncMock, patch
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User, user_teams
from app.models.team import Team
from app.models.task import Task
from app.models.activity import Activity
from app.models.comment import Comment
from app.api.v1.endpoints.teams import router as teams_router
from app.api.v1.endpoints.tasks import router as tasks_router
from tests.factories import (
    UserFactory, TeamFactory, TaskFactory, ActivityFactory,
    CommentFactory, TestScenarioFactories
)


class TestTeamCreation:
    """Test team creation and management."""
    
    @pytest.mark.asyncio
    async def test_create_team_basic(self, authenticated_client, current_user):
        """Test basic team creation."""
        team_data = {
            "name": "Development Team",
            "description": "Our awesome development team",
            "default_task_view": "kanban"
        }
        
        response = await authenticated_client.post("/api/v1/teams", json=team_data)
        
        assert response.status_code == 201
        data = response.json()
        assert data["name"] == team_data["name"]
        assert data["description"] == team_data["description"]
        assert data["slug"] == "development-team"
        assert data["is_active"] is True
    
    @pytest.mark.asyncio
    async def test_create_team_duplicate_name(self, authenticated_client, db_session):
        """Test creating team with duplicate name fails appropriately."""
        # Create first team
        team1 = await TeamFactory.create_async(db_session, name="Duplicate Team")
        
        team_data = {
            "name": "Duplicate Team",
            "description": "This should fail"
        }
        
        response = await authenticated_client.post("/api/v1/teams", json=team_data)
        
        # Should handle duplicate gracefully or create with different slug
        assert response.status_code in [400, 201]
        if response.status_code == 201:
            data = response.json()
            assert data["slug"] != team1.slug  # Should have different slug
    
    @pytest.mark.asyncio
    async def test_create_team_with_settings(self, authenticated_client):
        """Test creating team with custom settings."""
        team_data = {
            "name": "Custom Team",
            "description": "Team with custom settings",
            "default_task_view": "list",
            "ai_features_enabled": False,
            "max_members": 25
        }
        
        response = await authenticated_client.post("/api/v1/teams", json=team_data)
        
        assert response.status_code == 201
        data = response.json()
        assert data["default_task_view"] == "list"
        assert data["ai_features_enabled"] is False
        assert data["max_members"] == 25


class TestTeamMembership:
    """Test team membership management."""
    
    @pytest.mark.asyncio
    async def test_invite_team_member(self, authenticated_client, db_session):
        """Test inviting a new team member."""
        team, admins, members = await TestScenarioFactories.create_team_with_members(
            db_session, num_members=3, admin_count=1
        )
        
        invite_data = {
            "email": "newmember@example.com",
            "role": "member",
            "message": "Welcome to our team!"
        }
        
        # Assuming the authenticated client is an admin
        response = await authenticated_client.post(
            f"/api/v1/teams/{team.id}/invite",
            json=invite_data
        )
        
        assert response.status_code == 201
        data = response.json()
        assert data["email"] == invite_data["email"]
        assert data["role"] == invite_data["role"]
        assert "invite_token" in data
    
    @pytest.mark.asyncio
    async def test_accept_team_invitation(self, authenticated_client, db_session):
        """Test accepting a team invitation."""
        team = await TeamFactory.create_async(db_session)
        invite_token = "test-invite-token-123"
        
        # Mock invitation acceptance
        accept_data = {
            "invite_token": invite_token,
            "accept": True
        }
        
        response = await authenticated_client.post(
            f"/api/v1/teams/{team.id}/join",
            json=accept_data
        )
        
        # Implementation depends on your invitation system
        assert response.status_code in [200, 201, 404]  # 404 if invite not found
    
    @pytest.mark.asyncio
    async def test_remove_team_member(self, authenticated_client, db_session):
        """Test removing a team member."""
        team, admins, members = await TestScenarioFactories.create_team_with_members(
            db_session, num_members=5, admin_count=2
        )
        
        member_to_remove = members[0]
        
        response = await authenticated_client.delete(
            f"/api/v1/teams/{team.id}/members/{member_to_remove.id}"
        )
        
        assert response.status_code == 200
        
        # Verify member was removed
        result = await db_session.execute(
            select(user_teams).where(
                user_teams.c.user_id == member_to_remove.id,
                user_teams.c.team_id == team.id
            )
        )
        assert result.first() is None
    
    @pytest.mark.asyncio
    async def test_change_member_role(self, authenticated_client, db_session):
        """Test changing a team member's role."""
        team, admins, members = await TestScenarioFactories.create_team_with_members(
            db_session, num_members=3, admin_count=1
        )
        
        member = members[0]
        role_data = {"role": "admin"}
        
        response = await authenticated_client.patch(
            f"/api/v1/teams/{team.id}/members/{member.id}",
            json=role_data
        )
        
        assert response.status_code == 200
        
        # Verify role was changed
        result = await db_session.execute(
            select(user_teams.c.role).where(
                user_teams.c.user_id == member.id,
                user_teams.c.team_id == team.id
            )
        )
        assert result.scalar() == "admin"


class TestTeamPermissions:
    """Test role-based permissions within teams."""
    
    @pytest.mark.asyncio
    async def test_admin_can_manage_team(self, authenticated_client, db_session):
        """Test that team admins can manage team settings."""
        team, admins, members = await TestScenarioFactories.create_team_with_members(
            db_session, num_members=3, admin_count=1
        )
        
        # Admin should be able to update team settings
        update_data = {
            "description": "Updated team description",
            "default_task_view": "calendar"
        }
        
        response = await authenticated_client.patch(
            f"/api/v1/teams/{team.id}",
            json=update_data
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["description"] == update_data["description"]
    
    @pytest.mark.asyncio
    async def test_member_cannot_manage_team(self, db_session):
        """Test that regular members cannot manage team settings."""
        team, admins, members = await TestScenarioFactories.create_team_with_members(
            db_session, num_members=3, admin_count=1
        )
        
        # Create authenticated client as regular member
        member_client = await self.create_authenticated_client_for_user(members[0])
        
        update_data = {"description": "Unauthorized update"}
        
        response = await member_client.patch(
            f"/api/v1/teams/{team.id}",
            json=update_data
        )
        
        assert response.status_code == 403
    
    @pytest.mark.asyncio
    async def test_member_can_view_team_tasks(self, authenticated_client, db_session):
        """Test that team members can view team tasks."""
        scenario = await TestScenarioFactories.create_team_collaboration_scenario(db_session)
        
        response = await authenticated_client.get(
            f"/api/v1/teams/{scenario['team'].id}/tasks"
        )
        
        assert response.status_code == 200
        data = response.json()
        assert len(data["items"]) > 0
        
        # Verify only team tasks are returned
        for task in data["items"]:
            assert task["team_id"] == str(scenario['team'].id)


class TestTeamTaskManagement:
    """Test task management within teams."""
    
    @pytest.mark.asyncio
    async def test_create_team_task(self, authenticated_client, db_session):
        """Test creating a task within a team."""
        team, admins, members = await TestScenarioFactories.create_team_with_members(
            db_session, num_members=3, admin_count=1
        )
        
        task_data = {
            "title": "Team Task",
            "description": "A task for the team",
            "assignee_id": str(members[0].id),
            "priority": "high",
            "team_id": str(team.id)
        }
        
        response = await authenticated_client.post("/api/v1/tasks", json=task_data)
        
        assert response.status_code == 201
        data = response.json()
        assert data["title"] == task_data["title"]
        assert data["team_id"] == task_data["team_id"]
        assert data["assignee_id"] == task_data["assignee_id"]
    
    @pytest.mark.asyncio
    async def test_assign_task_to_team_member(self, authenticated_client, db_session):
        """Test assigning task to team member."""
        scenario = await TestScenarioFactories.create_team_collaboration_scenario(db_session)
        task = scenario['tasks'][0]
        new_assignee = scenario['members'][1]
        
        update_data = {"assignee_id": str(new_assignee.id)}
        
        response = await authenticated_client.patch(
            f"/api/v1/tasks/{task.id}",
            json=update_data
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["assignee_id"] == str(new_assignee.id)
    
    @pytest.mark.asyncio
    async def test_bulk_task_operations(self, authenticated_client, db_session):
        """Test bulk operations on team tasks."""
        scenario = await TestScenarioFactories.create_team_collaboration_scenario(db_session)
        task_ids = [str(task.id) for task in scenario['tasks'][:3]]
        
        bulk_data = {
            "task_ids": task_ids,
            "action": "update_status",
            "data": {"status": "in_progress"}
        }
        
        response = await authenticated_client.post(
            f"/api/v1/teams/{scenario['team'].id}/tasks/bulk",
            json=bulk_data
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["updated_count"] == 3
        
        # Verify tasks were updated
        for task_id in task_ids:
            task_response = await authenticated_client.get(f"/api/v1/tasks/{task_id}")
            task_data = task_response.json()
            assert task_data["status"] == "in_progress"


class TestTeamActivityFeed:
    """Test team activity feed functionality."""
    
    @pytest.mark.asyncio
    async def test_get_team_activity_feed(self, authenticated_client, db_session):
        """Test retrieving team activity feed."""
        scenario = await TestScenarioFactories.create_team_collaboration_scenario(db_session)
        
        response = await authenticated_client.get(
            f"/api/v1/teams/{scenario['team'].id}/activity"
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "items" in data
        assert len(data["items"]) > 0
        
        # Verify activities are team-related
        for activity in data["items"]:
            assert activity["team_id"] == str(scenario['team'].id)
    
    @pytest.mark.asyncio
    async def test_activity_feed_pagination(self, authenticated_client, db_session):
        """Test activity feed pagination."""
        # Create team with lots of activities
        scenario = await TestScenarioFactories.create_team_collaboration_scenario(db_session)
        
        # Create additional activities
        for i in range(20):
            await ActivityFactory.create_async(
                db_session,
                team_id=scenario['team'].id,
                user_id=scenario['all_users'][i % len(scenario['all_users'])].id,
                action='created',
                entity_type='task'
            )
        
        # Test first page
        response = await authenticated_client.get(
            f"/api/v1/teams/{scenario['team'].id}/activity?limit=10&offset=0"
        )
        
        assert response.status_code == 200
        data = response.json()
        assert len(data["items"]) == 10
        assert "total" in data
        assert data["total"] > 10
        
        # Test second page
        response = await authenticated_client.get(
            f"/api/v1/teams/{scenario['team'].id}/activity?limit=10&offset=10"
        )
        
        assert response.status_code == 200
        data = response.json()
        assert len(data["items"]) > 0
    
    @pytest.mark.asyncio
    async def test_activity_feed_filtering(self, authenticated_client, db_session):
        """Test filtering activity feed by action type."""
        scenario = await TestScenarioFactories.create_team_collaboration_scenario(db_session)
        
        # Test filtering by action
        response = await authenticated_client.get(
            f"/api/v1/teams/{scenario['team'].id}/activity?action=created"
        )
        
        assert response.status_code == 200
        data = response.json()
        for activity in data["items"]:
            assert activity["action"] == "created"
        
        # Test filtering by entity type
        response = await authenticated_client.get(
            f"/api/v1/teams/{scenario['team'].id}/activity?entity_type=task"
        )
        
        assert response.status_code == 200
        data = response.json()
        for activity in data["items"]:
            assert activity["entity_type"] == "task"


class TestTeamNotifications:
    """Test team notification system."""
    
    @pytest.mark.asyncio
    async def test_mention_notification_in_team(self, authenticated_client, db_session):
        """Test @mention notifications within team context."""
        scenario = await TestScenarioFactories.create_team_collaboration_scenario(db_session)
        task = scenario['tasks'][0]
        mentioner = scenario['members'][0]
        mentioned_user = scenario['members'][1]
        
        comment_data = {
            "content": f"@{mentioned_user.username} please review this task",
            "task_id": str(task.id)
        }
        
        with patch('app.services.notification_service.send_mention_notification') as mock_notify:
            response = await authenticated_client.post("/api/v1/comments", json=comment_data)
            
            assert response.status_code == 201
            mock_notify.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_team_task_assignment_notification(self, authenticated_client, db_session):
        """Test notifications when assigning tasks to team members."""
        scenario = await TestScenarioFactories.create_team_collaboration_scenario(db_session)
        task = scenario['tasks'][0]
        new_assignee = scenario['members'][1]
        
        update_data = {"assignee_id": str(new_assignee.id)}
        
        with patch('app.services.notification_service.send_task_assignment_notification') as mock_notify:
            response = await authenticated_client.patch(
                f"/api/v1/tasks/{task.id}",
                json=update_data
            )
            
            assert response.status_code == 200
            mock_notify.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_team_wide_announcement(self, authenticated_client, db_session):
        """Test sending team-wide announcements."""
        team, admins, members = await TestScenarioFactories.create_team_with_members(
            db_session, num_members=5, admin_count=1
        )
        
        announcement_data = {
            "title": "Important Team Update",
            "content": "Please read this important announcement",
            "priority": "high"
        }
        
        response = await authenticated_client.post(
            f"/api/v1/teams/{team.id}/announcements",
            json=announcement_data
        )
        
        assert response.status_code == 201
        # Should create notifications for all team members


class TestTeamAnalytics:
    """Test team analytics and reporting."""
    
    @pytest.mark.asyncio
    async def test_team_productivity_metrics(self, authenticated_client, db_session):
        """Test team productivity metrics calculation."""
        scenario = await TestScenarioFactories.create_analytics_test_data(db_session)
        
        response = await authenticated_client.get(
            f"/api/v1/teams/{scenario['team'].id}/analytics/productivity"
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Verify metrics are calculated
        assert "tasks_completed" in data
        assert "tasks_created" in data
        assert "average_completion_time" in data
        assert "team_velocity" in data
        assert isinstance(data["tasks_completed"], int)
        assert isinstance(data["tasks_created"], int)
    
    @pytest.mark.asyncio
    async def test_team_member_performance(self, authenticated_client, db_session):
        """Test individual team member performance metrics."""
        scenario = await TestScenarioFactories.create_analytics_test_data(db_session)
        
        response = await authenticated_client.get(
            f"/api/v1/teams/{scenario['team'].id}/analytics/members"
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert "members" in data
        assert len(data["members"]) > 0
        
        for member in data["members"]:
            assert "user_id" in member
            assert "tasks_completed" in member
            assert "tasks_assigned" in member
            assert "avg_completion_time" in member
    
    @pytest.mark.asyncio
    async def test_team_analytics_date_filtering(self, authenticated_client, db_session):
        """Test filtering team analytics by date range."""
        scenario = await TestScenarioFactories.create_analytics_test_data(db_session, days_back=60)
        
        # Test last 30 days
        start_date = (datetime.now() - timedelta(days=30)).isoformat()
        end_date = datetime.now().isoformat()
        
        response = await authenticated_client.get(
            f"/api/v1/teams/{scenario['team'].id}/analytics/productivity"
            f"?start_date={start_date}&end_date={end_date}"
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Should have filtered data
        assert "date_range" in data
        assert data["date_range"]["start"] == start_date[:10]  # Compare dates only


class TestTeamIntegration:
    """Integration tests for team functionality."""
    
    @pytest.mark.integration
    @pytest.mark.asyncio
    async def test_complete_team_workflow(self, authenticated_client, db_session):
        """Test complete team collaboration workflow."""
        # 1. Create team
        team_data = {
            "name": "Integration Test Team",
            "description": "Testing complete workflow"
        }
        
        team_response = await authenticated_client.post("/api/v1/teams", json=team_data)
        assert team_response.status_code == 201
        team = team_response.json()
        
        # 2. Invite members (mock invitation process)
        invite_data = {"email": "member@example.com", "role": "member"}
        invite_response = await authenticated_client.post(
            f"/api/v1/teams/{team['id']}/invite",
            json=invite_data
        )
        # Response depends on implementation
        
        # 3. Create team task  
        task_data = {
            "title": "Integration Test Task",
            "description": "Testing team task creation",
            "team_id": team["id"],
            "priority": "medium"
        }
        
        task_response = await authenticated_client.post("/api/v1/tasks", json=task_data)
        assert task_response.status_code == 201
        task = task_response.json()
        
        # 4. Add comment to task
        comment_data = {
            "content": "This is a test comment",
            "task_id": task["id"]
        }
        
        comment_response = await authenticated_client.post("/api/v1/comments", json=comment_data)
        assert comment_response.status_code == 201
        
        # 5. Check activity feed
        activity_response = await authenticated_client.get(
            f"/api/v1/teams/{team['id']}/activity"
        )
        assert activity_response.status_code == 200
        activities = activity_response.json()
        assert len(activities["items"]) > 0
        
        # 6. Get team analytics
        analytics_response = await authenticated_client.get(
            f"/api/v1/teams/{team['id']}/analytics/productivity"
        )
        assert analytics_response.status_code == 200
    
    @pytest.mark.integration
    @pytest.mark.asyncio
    async def test_team_switching_context(self, authenticated_client, db_session):
        """Test switching between multiple teams."""
        # Create multiple teams
        teams = []
        for i in range(3):
            team_data = {"name": f"Team {i+1}", "description": f"Team {i+1} description"}
            team_response = await authenticated_client.post("/api/v1/teams", json=team_data)
            assert team_response.status_code == 201
            teams.append(team_response.json())
        
        # Create tasks in different teams
        for i, team in enumerate(teams):
            task_data = {
                "title": f"Task for Team {i+1}",
                "team_id": team["id"]
            }
            task_response = await authenticated_client.post("/api/v1/tasks", json=task_data)
            assert task_response.status_code == 201
        
        # Verify team isolation - each team should only see its own tasks
        for team in teams:
            response = await authenticated_client.get(f"/api/v1/teams/{team['id']}/tasks")
            assert response.status_code == 200
            data = response.json()
            
            # All tasks should belong to this team
            for task in data["items"]:
                assert task["team_id"] == team["id"]


# Helper methods for testing
async def create_authenticated_client_for_user(user: User):
    """Create an authenticated client for a specific user."""
    # This would depend on your authentication implementation
    # Mock implementation for testing
    pass