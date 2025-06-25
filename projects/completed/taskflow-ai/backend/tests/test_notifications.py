import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from uuid import UUID, uuid4
from datetime import datetime

from app.main import app
from app.models import Notification, NotificationPreference, User
from app.services.notification_service import notification_service
from tests.factories import UserFactory, NotificationFactory


class TestNotifications:
    """Test notification endpoints and services"""
    
    def test_get_notifications(self, client: TestClient, db: Session, test_user: User):
        """Test getting user notifications"""
        # Create some notifications
        notifications = []
        for i in range(5):
            notification = NotificationFactory(user_id=test_user.id)
            notifications.append(notification)
            db.add(notification)
        db.commit()
        
        response = client.get(
            "/api/v1/notifications/",
            headers={"Authorization": f"Bearer {test_user.access_token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "notifications" in data
        assert "total" in data
        assert "unread_count" in data
        assert data["total"] >= 5
    
    def test_get_notifications_with_filters(self, client: TestClient, db: Session, test_user: User):
        """Test getting notifications with filters"""
        # Create notifications with different categories
        task_notification = NotificationFactory(
            user_id=test_user.id,
            category="task",
            is_read=False
        )
        team_notification = NotificationFactory(
            user_id=test_user.id,
            category="team",
            is_read=True
        )
        
        db.add_all([task_notification, team_notification])
        db.commit()
        
        # Test category filter
        response = client.get(
            "/api/v1/notifications/?category=task",
            headers={"Authorization": f"Bearer {test_user.access_token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert len(data["notifications"]) >= 1
        assert all(n["category"] == "task" for n in data["notifications"])
        
        # Test unread filter
        response = client.get(
            "/api/v1/notifications/?unread_only=true",
            headers={"Authorization": f"Bearer {test_user.access_token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert all(not n["is_read"] for n in data["notifications"])
    
    def test_update_notification(self, client: TestClient, db: Session, test_user: User):
        """Test marking notification as read"""
        notification = NotificationFactory(user_id=test_user.id, is_read=False)
        db.add(notification)
        db.commit()
        
        update_data = {"is_read": True}
        
        response = client.put(
            f"/api/v1/notifications/{notification.id}",
            json=update_data,
            headers={"Authorization": f"Bearer {test_user.access_token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["is_read"] == True
        assert "read_at" in data
    
    def test_bulk_update_notifications(self, client: TestClient, db: Session, test_user: User):
        """Test bulk marking notifications as read"""
        notifications = []
        for i in range(3):
            notification = NotificationFactory(user_id=test_user.id, is_read=False)
            notifications.append(notification)
            db.add(notification)
        db.commit()
        
        notification_ids = [str(n.id) for n in notifications]
        bulk_data = {
            "notification_ids": notification_ids,
            "is_read": True
        }
        
        response = client.put(
            "/api/v1/notifications/bulk",
            json=bulk_data,
            headers={"Authorization": f"Bearer {test_user.access_token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["updated_count"] == 3
    
    def test_delete_notification(self, client: TestClient, db: Session, test_user: User):
        """Test deleting a notification"""
        notification = NotificationFactory(user_id=test_user.id)
        db.add(notification)
        db.commit()
        
        response = client.delete(
            f"/api/v1/notifications/{notification.id}",
            headers={"Authorization": f"Bearer {test_user.access_token}"}
        )
        
        assert response.status_code == 200
        
        # Verify notification was deleted
        deleted_notification = db.query(Notification).filter(
            Notification.id == notification.id
        ).first()
        assert deleted_notification is None
    
    def test_get_notification_preferences_default(self, client: TestClient, db: Session, test_user: User):
        """Test getting default notification preferences"""
        response = client.get(
            "/api/v1/notifications/preferences",
            headers={"Authorization": f"Bearer {test_user.access_token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "email_enabled" in data
        assert "push_enabled" in data
        assert "email_digest_frequency" in data
    
    def test_update_notification_preferences(self, client: TestClient, db: Session, test_user: User):
        """Test updating notification preferences"""
        preferences_data = {
            "email_enabled": False,
            "push_enabled": True,
            "email_task_assigned": False,
            "email_digest_frequency": "weekly",
            "quiet_hours_enabled": True,
            "quiet_hours_start": "22:00",
            "quiet_hours_end": "08:00"
        }
        
        response = client.put(
            "/api/v1/notifications/preferences",
            json=preferences_data,
            headers={"Authorization": f"Bearer {test_user.access_token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["email_enabled"] == False
        assert data["push_enabled"] == True
        assert data["email_digest_frequency"] == "weekly"
        assert data["quiet_hours_enabled"] == True
    
    def test_mark_all_notifications_read(self, client: TestClient, db: Session, test_user: User):
        """Test marking all notifications as read"""
        # Create unread notifications
        for i in range(5):
            notification = NotificationFactory(user_id=test_user.id, is_read=False)
            db.add(notification)
        db.commit()
        
        response = client.post(
            "/api/v1/notifications/mark-all-read",
            headers={"Authorization": f"Bearer {test_user.access_token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["updated_count"] >= 5
    
    def test_get_unread_count(self, client: TestClient, db: Session, test_user: User):
        """Test getting unread notification count"""
        # Create unread notifications with different categories
        task_notification = NotificationFactory(
            user_id=test_user.id,
            category="task",
            is_read=False
        )
        team_notification = NotificationFactory(
            user_id=test_user.id,
            category="team",
            is_read=False
        )
        read_notification = NotificationFactory(
            user_id=test_user.id,
            category="task",
            is_read=True
        )
        
        db.add_all([task_notification, team_notification, read_notification])
        db.commit()
        
        response = client.get(
            "/api/v1/notifications/unread-count",
            headers={"Authorization": f"Bearer {test_user.access_token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "total_unread" in data
        assert "by_category" in data
        assert data["total_unread"] >= 2
        assert "task" in data["by_category"]
        assert "team" in data["by_category"]
    
    def test_create_notification_service(self, db: Session, test_user: User):
        """Test notification service create function"""
        notification = notification_service.create_notification(
            db=db,
            user_id=test_user.id,
            type="test_notification",
            title="Test Notification",
            message="This is a test notification",
            data={"test_key": "test_value"},
            priority="high",
            category="test",
            send_email=False,
            send_push=False,
            send_realtime=False
        )
        
        assert notification.user_id == test_user.id
        assert notification.type == "test_notification"
        assert notification.title == "Test Notification"
        assert notification.priority == "high"
        assert notification.category == "test"
        assert notification.is_read == False
    
    def test_process_mentions(self, db: Session, test_user: User):
        """Test mention processing in content"""
        # Create another user to mention
        mentioned_user = UserFactory(username="testuser")
        db.add(mentioned_user)
        
        # Create a team for context
        from tests.factories import TeamFactory
        test_team = TeamFactory()
        db.add(test_team)
        
        # Add both users to team
        from app.models import TeamMembership
        membership1 = TeamMembership(
            user_id=test_user.id,
            team_id=test_team.id,
            role="member",
            status="active",
            joined_at=datetime.utcnow()
        )
        membership2 = TeamMembership(
            user_id=mentioned_user.id,
            team_id=test_team.id,
            role="member",
            status="active",
            joined_at=datetime.utcnow()
        )
        db.add_all([membership1, membership2])
        db.commit()
        
        content = "Hey @testuser, can you help me with this task?"
        
        notifications = notification_service.process_mentions(
            db=db,
            content=content,
            mentioned_by_user_id=test_user.id,
            context_type="task",
            context_id=uuid4(),
            team_id=test_team.id
        )
        
        assert len(notifications) == 1
        assert notifications[0].user_id == mentioned_user.id
        assert notifications[0].type == "mention"
        assert "@testuser" in content