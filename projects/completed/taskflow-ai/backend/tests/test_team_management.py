import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from uuid import UUID, uuid4
from datetime import datetime, timedelta

from app.main import app
from app.models import Team, User, TeamMembership, TeamInvitation
from tests.factories import UserFactory, TeamFactory


class TestTeamManagement:
    """Test team management endpoints"""
    
    def test_create_team(self, client: TestClient, db: Session, test_user: User):
        """Test creating a new team"""
        team_data = {
            "name": "Test Team",
            "slug": "test-team",
            "description": "A test team",
            "default_task_view": "kanban",
            "ai_features_enabled": True,
            "max_members": 25
        }
        
        response = client.post(
            "/api/v1/teams/",
            json=team_data,
            headers={"Authorization": f"Bearer {test_user.access_token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == team_data["name"]
        assert data["slug"] == team_data["slug"]
        
        # Check that user is added as owner
        membership = db.query(TeamMembership).filter(
            TeamMembership.team_id == data["id"],
            TeamMembership.user_id == test_user.id
        ).first()
        assert membership is not None
        assert membership.role == "owner"
    
    def test_get_team_with_stats(self, client: TestClient, db: Session, test_user: User, test_team: Team):
        """Test getting team details with statistics"""
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
            f"/api/v1/teams/{test_team.id}",
            headers={"Authorization": f"Bearer {test_user.access_token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == str(test_team.id)
        assert data["name"] == test_team.name
        assert "members_count" in data
        assert "projects_count" in data
        assert "tasks_count" in data
    
    def test_update_team_permissions(self, client: TestClient, db: Session, test_user: User, test_team: Team):
        """Test updating team with insufficient permissions"""
        # Add user as member (not admin/owner)
        membership = TeamMembership(
            user_id=test_user.id,
            team_id=test_team.id,
            role="member",
            status="active",
            joined_at=datetime.utcnow()
        )
        db.add(membership)
        db.commit()
        
        update_data = {"name": "Updated Team Name"}
        
        response = client.put(
            f"/api/v1/teams/{test_team.id}",
            json=update_data,
            headers={"Authorization": f"Bearer {test_user.access_token}"}
        )
        
        assert response.status_code == 403
    
    def test_get_team_members(self, client: TestClient, db: Session, test_user: User, test_team: Team):
        """Test getting team members with pagination"""
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
            f"/api/v1/teams/{test_team.id}/members",
            headers={"Authorization": f"Bearer {test_user.access_token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "members" in data
        assert "total" in data
        assert "page" in data
        assert "per_page" in data
        assert data["total"] >= 1
    
    def test_add_team_member(self, client: TestClient, db: Session, test_user: User, test_team: Team):
        """Test adding a member to team"""
        # Make test_user an admin
        membership = TeamMembership(
            user_id=test_user.id,
            team_id=test_team.id,
            role="admin",
            status="active",
            joined_at=datetime.utcnow()
        )
        db.add(membership)
        
        # Create another user to add
        new_user = UserFactory()
        db.add(new_user)
        db.commit()
        
        member_data = {
            "user_id": str(new_user.id),
            "role": "member"
        }
        
        response = client.post(
            f"/api/v1/teams/{test_team.id}/members",
            json=member_data,
            headers={"Authorization": f"Bearer {test_user.access_token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["user_id"] == str(new_user.id)
        assert data["role"] == "member"
    
    def test_create_team_invitations(self, client: TestClient, db: Session, test_user: User, test_team: Team):
        """Test creating team invitations"""
        # Make test_user an admin
        membership = TeamMembership(
            user_id=test_user.id,
            team_id=test_team.id,
            role="admin",
            status="active",
            joined_at=datetime.utcnow()
        )
        db.add(membership)
        db.commit()
        
        invitation_data = {
            "invitations": [
                {
                    "email": "test@example.com",
                    "role": "member",
                    "message": "Welcome to our team!"
                },
                {
                    "email": "admin@example.com",
                    "role": "admin"
                }
            ],
            "send_email": False  # Don't actually send emails in tests
        }
        
        response = client.post(
            f"/api/v1/teams/{test_team.id}/invitations",
            json=invitation_data,
            headers={"Authorization": f"Bearer {test_user.access_token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 2
        assert data[0]["email"] == "test@example.com"
        assert data[0]["role"] == "member"
    
    def test_accept_team_invitation(self, client: TestClient, db: Session, test_user: User, test_team: Team):
        """Test accepting a team invitation"""
        # Create an invitation
        invitation = TeamInvitation(
            team_id=test_team.id,
            invited_by_id=test_user.id,
            email=test_user.email,  # Use same email as test user
            role="member",
            token="test_token_123",
            status="pending",
            expires_at=datetime.utcnow() + timedelta(days=7)
        )
        db.add(invitation)
        db.commit()
        
        accept_data = {"token": "test_token_123"}
        
        response = client.post(
            "/api/v1/teams/invitations/accept",
            json=accept_data,
            headers={"Authorization": f"Bearer {test_user.access_token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "team_id" in data
        assert data["team_id"] == str(test_team.id)
        
        # Check that membership was created
        membership = db.query(TeamMembership).filter(
            TeamMembership.team_id == test_team.id,
            TeamMembership.user_id == test_user.id
        ).first()
        assert membership is not None
        assert membership.role == "member"
    
    def test_bulk_member_operation(self, client: TestClient, db: Session, test_user: User, test_team: Team):
        """Test bulk member operations"""
        # Make test_user an owner
        membership = TeamMembership(
            user_id=test_user.id,
            team_id=test_team.id,
            role="owner",
            status="active",
            joined_at=datetime.utcnow()
        )
        db.add(membership)
        
        # Create additional users and add them to team
        users = []
        for i in range(3):
            user = UserFactory()
            users.append(user)
            db.add(user)
            
            member = TeamMembership(
                user_id=user.id,
                team_id=test_team.id,
                role="member",
                status="active",
                joined_at=datetime.utcnow()
            )
            db.add(member)
        
        db.commit()
        
        # Change role for multiple users
        operation_data = {
            "user_ids": [str(user.id) for user in users[:2]],
            "action": "change_role",
            "role": "admin"
        }
        
        response = client.post(
            f"/api/v1/teams/{test_team.id}/members/bulk",
            json=operation_data,
            headers={"Authorization": f"Bearer {test_user.access_token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["affected_count"] == 2
    
    def test_get_team_roles(self, client: TestClient):
        """Test getting available team roles"""
        response = client.get("/api/v1/teams/roles")
        
        assert response.status_code == 200
        data = response.json()
        assert "roles" in data
        roles = data["roles"]
        
        role_names = [role["role"] for role in roles]
        assert "owner" in role_names
        assert "admin" in role_names
        assert "member" in role_names
        assert "viewer" in role_names
    
    def test_get_team_activity(self, client: TestClient, db: Session, test_user: User, test_team: Team):
        """Test getting team activity log"""
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
            f"/api/v1/teams/{test_team.id}/activity",
            headers={"Authorization": f"Bearer {test_user.access_token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "activities" in data
        assert "total" in data
        assert "page" in data
        assert "per_page" in data