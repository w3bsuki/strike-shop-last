import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from uuid import UUID, uuid4
from datetime import datetime, date, timedelta

from app.main import app
from app.models import Team, User, TeamMembership, Task, AnalyticsInsight
from app.services.analytics_service import analytics_service
from tests.factories import UserFactory, TeamFactory, TaskFactory


class TestAnalytics:
    """Test analytics endpoints and services"""
    
    def test_get_team_dashboard(self, client: TestClient, db: Session, test_user: User, test_team: Team):
        """Test getting team dashboard data"""
        # Add user to team
        membership = TeamMembership(
            user_id=test_user.id,
            team_id=test_team.id,
            role="member",
            status="active",
            joined_at=datetime.utcnow()
        )
        db.add(membership)
        
        # Create some tasks for the team
        for i in range(5):
            task = TaskFactory(team_id=test_team.id, creator_id=test_user.id)
            db.add(task)
        
        db.commit()
        
        response = client.get(
            f"/api/v1/analytics/teams/{test_team.id}/dashboard",
            headers={"Authorization": f"Bearer {test_user.access_token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "team_id" in data
        assert "team_name" in data
        assert "metrics" in data
        assert "member_count" in data
        assert "active_projects" in data
        assert "recent_insights" in data
        assert "performance_chart_data" in data
        
        metrics = data["metrics"]
        assert "total_tasks" in metrics
        assert "completed_tasks" in metrics
        assert "completion_rate" in metrics
    
    def test_get_team_productivity_analytics(self, client: TestClient, db: Session, test_user: User, test_team: Team):
        """Test getting team productivity analytics"""
        # Add user to team
        membership = TeamMembership(
            user_id=test_user.id,
            team_id=test_team.id,
            role="member",
            status="active",
            joined_at=datetime.utcnow()
        )
        db.add(membership)
        db.commit()
        
        end_date = date.today()
        start_date = end_date - timedelta(days=30)
        
        response = client.get(
            f"/api/v1/analytics/teams/{test_team.id}/productivity",
            params={
                "start_date": start_date.isoformat(),
                "end_date": end_date.isoformat(),
                "compare_previous": True
            },
            headers={"Authorization": f"Bearer {test_user.access_token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "team_id" in data
        assert "team_name" in data
        assert "current_period" in data
        assert "trends" in data
        assert "insights" in data
        assert "recommendations" in data
    
    def test_get_team_performance_report_admin_only(self, client: TestClient, db: Session, test_user: User, test_team: Team):
        """Test that performance report requires admin permissions"""
        # Add user as regular member
        membership = TeamMembership(
            user_id=test_user.id,
            team_id=test_team.id,
            role="member",
            status="active",
            joined_at=datetime.utcnow()
        )
        db.add(membership)
        db.commit()
        
        end_date = date.today()
        start_date = end_date - timedelta(days=30)
        
        response = client.get(
            f"/api/v1/analytics/teams/{test_team.id}/performance",
            params={
                "start_date": start_date.isoformat(),
                "end_date": end_date.isoformat()
            },
            headers={"Authorization": f"Bearer {test_user.access_token}"}
        )
        
        assert response.status_code == 403
    
    def test_get_team_performance_report_admin(self, client: TestClient, db: Session, test_user: User, test_team: Team):
        """Test getting team performance report as admin"""
        # Add user as admin
        membership = TeamMembership(
            user_id=test_user.id,
            team_id=test_team.id,
            role="admin",
            status="active",
            joined_at=datetime.utcnow()
        )
        db.add(membership)
        db.commit()
        
        end_date = date.today()
        start_date = end_date - timedelta(days=30)
        
        response = client.get(
            f"/api/v1/analytics/teams/{test_team.id}/performance",
            params={
                "start_date": start_date.isoformat(),
                "end_date": end_date.isoformat(),
                "sort_by": "productivity_score",
                "order": "desc"
            },
            headers={"Authorization": f"Bearer {test_user.access_token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "team_id" in data
        assert "team_name" in data
        assert "members" in data
        assert "team_averages" in data
        assert "top_performers" in data
        assert "improvement_areas" in data
    
    def test_get_user_analytics_own_data(self, client: TestClient, db: Session, test_user: User, test_team: Team):
        """Test getting user's own analytics data"""
        # Add user to team and create some tasks
        membership = TeamMembership(
            user_id=test_user.id,
            team_id=test_team.id,
            role="member",
            status="active",
            joined_at=datetime.utcnow()
        )
        db.add(membership)
        
        for i in range(3):
            task = TaskFactory(
                team_id=test_team.id,
                creator_id=test_user.id,
                assignee_id=test_user.id
            )
            db.add(task)
        
        db.commit()
        
        end_date = date.today()
        start_date = end_date - timedelta(days=30)
        
        response = client.get(
            f"/api/v1/analytics/users/{test_user.id}/analytics",
            params={
                "start_date": start_date.isoformat(),
                "end_date": end_date.isoformat(),
                "team_id": str(test_team.id)
            },
            headers={"Authorization": f"Bearer {test_user.access_token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "user_id" in data
        assert "user_name" in data
        assert "current_period" in data
        assert "trends" in data
        assert "insights" in data
    
    def test_get_team_insights(self, client: TestClient, db: Session, test_user: User, test_team: Team):
        """Test getting team insights"""
        # Add user to team
        membership = TeamMembership(
            user_id=test_user.id,
            team_id=test_team.id,
            role="member",
            status="active",
            joined_at=datetime.utcnow()
        )
        db.add(membership)
        
        # Create some sample insights
        insight = AnalyticsInsight(
            team_id=test_team.id,
            type="productivity",
            category="performance",
            title="Team Productivity Trend",
            description="Your team's productivity has increased by 15% this week",
            confidence_score=0.85,
            impact_score=0.7,
            is_actionable=True,
            status="active"
        )
        db.add(insight)
        db.commit()
        
        response = client.get(
            f"/api/v1/analytics/teams/{test_team.id}/insights",
            headers={"Authorization": f"Bearer {test_user.access_token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "insights" in data
        assert "total" in data
        assert "active_count" in data
        assert "dismissed_count" in data
        assert len(data["insights"]) >= 1
    
    def test_generate_team_insights_admin_only(self, client: TestClient, db: Session, test_user: User, test_team: Team):
        """Test that insight generation requires admin permissions"""
        # Add user as regular member
        membership = TeamMembership(
            user_id=test_user.id,
            team_id=test_team.id,
            role="member",
            status="active",
            joined_at=datetime.utcnow()
        )
        db.add(membership)
        db.commit()
        
        response = client.post(
            f"/api/v1/analytics/teams/{test_team.id}/insights/generate",
            headers={"Authorization": f"Bearer {test_user.access_token}"}
        )
        
        assert response.status_code == 403
    
    def test_dismiss_insight(self, client: TestClient, db: Session, test_user: User, test_team: Team):
        """Test dismissing an analytics insight"""
        # Add user to team
        membership = TeamMembership(
            user_id=test_user.id,
            team_id=test_team.id,
            role="member",
            status="active",
            joined_at=datetime.utcnow()
        )
        db.add(membership)
        
        # Create an insight
        insight = AnalyticsInsight(
            team_id=test_team.id,
            type="productivity",
            category="performance",
            title="Test Insight",
            description="Test insight description",
            status="active"
        )
        db.add(insight)
        db.commit()
        
        response = client.put(
            f"/api/v1/analytics/insights/{insight.id}/dismiss",
            headers={"Authorization": f"Bearer {test_user.access_token}"}
        )
        
        assert response.status_code == 200
        
        # Verify insight was dismissed
        db.refresh(insight)
        assert insight.status == "dismissed"
        assert insight.dismissed_at is not None
    
    def test_get_live_dashboard_data(self, client: TestClient, db: Session, test_user: User, test_team: Team):
        """Test getting live dashboard data"""
        # Add user to team
        membership = TeamMembership(
            user_id=test_user.id,
            team_id=test_team.id,
            role="member",
            status="active",
            joined_at=datetime.utcnow()
        )
        db.add(membership)
        db.commit()
        
        response = client.get(
            f"/api/v1/analytics/teams/{test_team.id}/live",
            headers={"Authorization": f"Bearer {test_user.access_token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "current_metrics" in data
        assert "hourly_activity" in data
        assert "recent_completions" in data
        assert "active_members" in data
        
        metrics = data["current_metrics"]
        assert "timestamp" in metrics
        assert "active_users" in metrics
        assert "tasks_completed_today" in metrics
        assert "new_tasks_today" in metrics
        assert "team_activity_score" in metrics
    
    def test_export_analytics_data(self, client: TestClient, db: Session, test_user: User, test_team: Team):
        """Test exporting analytics data"""
        # Add user to team
        membership = TeamMembership(
            user_id=test_user.id,
            team_id=test_team.id,
            role="member",
            status="active",
            joined_at=datetime.utcnow()
        )
        db.add(membership)
        db.commit()
        
        export_request = {
            "query": {
                "start_date": "2024-01-01",
                "end_date": "2024-01-31",
                "team_id": str(test_team.id)
            },
            "format": "json",
            "include_charts": False
        }
        
        response = client.post(
            f"/api/v1/analytics/teams/{test_team.id}/export",
            json=export_request,
            headers={"Authorization": f"Bearer {test_user.access_token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "export_id" in data
        assert "download_url" in data
        assert "expires_at" in data
        assert "format" in data
        assert data["format"] == "json"
    
    def test_analytics_service_calculate_team_metrics(self, db: Session, test_team: Team):
        """Test analytics service team metrics calculation"""
        end_date = date.today()
        start_date = end_date - timedelta(days=30)
        
        # Create some tasks for testing
        for i in range(10):
            task = TaskFactory(
                team_id=test_team.id,
                status="completed" if i < 6 else "in_progress",
                created_at=datetime.now() - timedelta(days=i),
                completed_at=datetime.now() - timedelta(days=i-1) if i < 6 else None
            )
            db.add(task)
        db.commit()
        
        dashboard_data = analytics_service.calculate_team_dashboard_metrics(
            db=db,
            team_id=test_team.id,
            start_date=start_date,
            end_date=end_date
        )
        
        assert "metrics" in dashboard_data
        assert "performance_chart_data" in dashboard_data
        
        metrics = dashboard_data["metrics"]
        assert metrics.total_tasks >= 10
        assert metrics.completed_tasks >= 6
        assert 0 <= metrics.completion_rate <= 100
    
    def test_analytics_service_calculate_user_metrics(self, db: Session, test_user: User, test_team: Team):
        """Test analytics service user metrics calculation"""
        end_date = date.today()
        start_date = end_date - timedelta(days=30)
        
        # Create tasks assigned to user
        for i in range(5):
            task = TaskFactory(
                team_id=test_team.id,
                assignee_id=test_user.id,
                status="completed" if i < 3 else "in_progress",
                created_at=datetime.now() - timedelta(days=i),
                completed_at=datetime.now() - timedelta(days=i-1) if i < 3 else None
            )
            db.add(task)
        db.commit()
        
        analytics_data = analytics_service.calculate_user_analytics(
            db=db,
            user_id=test_user.id,
            start_date=start_date,
            end_date=end_date,
            team_id=test_team.id
        )
        
        assert "current_period" in analytics_data
        assert "trends" in analytics_data
        assert "insights" in analytics_data
        
        current = analytics_data["current_period"]
        assert current.tasks_completed >= 3
        assert current.tasks_assigned >= 5