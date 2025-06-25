from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func
from uuid import UUID
import json
import re
from datetime import datetime, timedelta
import logging

from app.models import (
    Notification, NotificationPreference, User, Task, Team, Project,
    TeamMembership
)
from app.schemas.notification import (
    NotificationCreate, WebSocketNotification, MentionNotification,
    EmailNotificationData, PushNotificationData
)
from app.core.config import settings
from app.websocket.manager import websocket_manager
from app.services.email_service import send_task_assignment_email, send_mention_notification_email
from app.worker.tasks import send_email_task, send_push_notification_task

logger = logging.getLogger(__name__)


class NotificationService:
    """Service for managing notifications and real-time updates"""
    
    def __init__(self):
        self.mention_pattern = re.compile(r'@(\w+)')
    
    def create_notification(
        self,
        db: Session,
        user_id: UUID,
        type: str,
        title: str,
        message: str,
        data: Optional[Dict[str, Any]] = None,
        priority: str = "normal",
        category: Optional[str] = None,
        related_task_id: Optional[UUID] = None,
        related_team_id: Optional[UUID] = None,
        related_project_id: Optional[UUID] = None,
        send_email: bool = True,
        send_push: bool = True,
        send_realtime: bool = True
    ) -> Notification:
        """Create a new notification and send via configured channels"""
        
        # Create notification record
        notification = Notification(
            user_id=user_id,
            type=type,
            title=title,
            message=message,
            data=json.dumps(data) if data else None,
            priority=priority,
            category=category,
            related_task_id=related_task_id,
            related_team_id=related_team_id,
            related_project_id=related_project_id
        )
        
        db.add(notification)
        db.flush()
        
        # Get user preferences
        preferences = self.get_user_preferences(db, user_id)
        
        # Send real-time notification
        if send_realtime:
            self._send_realtime_notification(notification)
        
        # Schedule email notification
        if send_email and preferences and self._should_send_email(preferences, type):
            self._schedule_email_notification(notification, preferences)
        
        # Schedule push notification
        if send_push and preferences and self._should_send_push(preferences, type):
            self._schedule_push_notification(notification, preferences)
        
        db.commit()
        return notification
    
    def get_user_preferences(self, db: Session, user_id: UUID) -> Optional[NotificationPreference]:
        """Get user notification preferences"""
        return db.query(NotificationPreference).filter(
            NotificationPreference.user_id == user_id
        ).first()
    
    def create_user_preferences(
        self,
        db: Session,
        user_id: UUID,
        preferences: Dict[str, Any]
    ) -> NotificationPreference:
        """Create or update user notification preferences"""
        
        existing = self.get_user_preferences(db, user_id)
        
        if existing:
            for key, value in preferences.items():
                if hasattr(existing, key):
                    setattr(existing, key, value)
            db.commit()
            return existing
        else:
            new_preferences = NotificationPreference(
                user_id=user_id,
                **preferences
            )
            db.add(new_preferences)
            db.commit()
            return new_preferences
    
    def mark_as_read(
        self,
        db: Session,
        notification_ids: List[UUID],
        user_id: UUID
    ) -> int:
        """Mark notifications as read"""
        
        count = db.query(Notification).filter(
            and_(
                Notification.id.in_(notification_ids),
                Notification.user_id == user_id,
                Notification.is_read == False
            )
        ).update({
            'is_read': True,
            'read_at': datetime.utcnow()
        }, synchronize_session=False)
        
        db.commit()
        return count
    
    def get_user_notifications(
        self,
        db: Session,
        user_id: UUID,
        unread_only: bool = False,
        category: Optional[str] = None,
        limit: int = 50,
        offset: int = 0
    ) -> tuple[List[Notification], int, int]:
        """Get user notifications with filtering"""
        
        query = db.query(Notification).filter(Notification.user_id == user_id)
        
        if unread_only:
            query = query.filter(Notification.is_read == False)
        
        if category:
            query = query.filter(Notification.category == category)
        
        # Get counts
        total = query.count()
        unread_count = db.query(Notification).filter(
            and_(
                Notification.user_id == user_id,
                Notification.is_read == False
            )
        ).count()
        
        # Apply pagination and ordering
        notifications = query.order_by(
            Notification.created_at.desc()
        ).offset(offset).limit(limit).all()
        
        return notifications, total, unread_count
    
    def process_mentions(
        self,
        db: Session,
        content: str,
        mentioned_by_user_id: UUID,
        context_type: str,
        context_id: UUID,
        team_id: UUID,
        exclude_user_ids: Optional[List[UUID]] = None
    ) -> List[Notification]:
        """Process @mentions in content and create notifications"""
        
        if not content:
            return []
        
        # Find mentions
        mentions = self.mention_pattern.findall(content)
        if not mentions:
            return []
        
        # Get mentioned users
        mentioned_users = db.query(User).filter(
            User.username.in_(mentions)
        ).all()
        
        if not mentioned_users:
            return []
        
        # Get context details
        context_title = ""
        context_url = ""
        
        if context_type == "task":
            task = db.query(Task).filter(Task.id == context_id).first()
            if task:
                context_title = task.title
                context_url = f"{settings.FRONTEND_URL}/tasks/{context_id}"
        elif context_type == "project":
            project = db.query(Project).filter(Project.id == context_id).first()
            if project:
                context_title = project.name
                context_url = f"{settings.FRONTEND_URL}/projects/{context_id}"
        
        # Get team name
        team = db.query(Team).filter(Team.id == team_id).first()
        team_name = team.name if team else "Unknown Team"
        
        # Get mentioned by user
        mentioned_by_user = db.query(User).filter(User.id == mentioned_by_user_id).first()
        mentioned_by_name = mentioned_by_user.full_name or mentioned_by_user.email if mentioned_by_user else "Someone"
        
        notifications = []
        exclude_user_ids = exclude_user_ids or []
        
        for user in mentioned_users:
            # Skip if user should be excluded
            if user.id in exclude_user_ids or user.id == mentioned_by_user_id:
                continue
            
            # Check if user is member of the team
            membership = db.query(TeamMembership).filter(
                and_(
                    TeamMembership.team_id == team_id,
                    TeamMembership.user_id == user.id,
                    TeamMembership.status == "active"
                )
            ).first()
            
            if not membership:
                continue
            
            # Create notification
            notification = self.create_notification(
                db=db,
                user_id=user.id,
                type="mention",
                title=f"{mentioned_by_name} mentioned you",
                message=f"You were mentioned in {context_type}: {context_title}",
                data={
                    "mentioned_by_id": str(mentioned_by_user_id),
                    "mentioned_by_name": mentioned_by_name,
                    "context_type": context_type,
                    "context_id": str(context_id),
                    "context_title": context_title,
                    "context_url": context_url,
                    "content_excerpt": content[:200] + "..." if len(content) > 200 else content
                },
                priority="normal",
                category="collaboration",
                related_task_id=context_id if context_type == "task" else None,
                related_project_id=context_id if context_type == "project" else None,
                related_team_id=team_id
            )
            
            notifications.append(notification)
            
            # Send mention-specific email
            if self._should_send_mention_email(user.id, db):
                send_mention_notification_email.delay(
                    email=user.email,
                    mentioned_by_name=mentioned_by_name,
                    content=content,
                    context_type=context_type,
                    context_title=context_title,
                    context_url=context_url,
                    team_name=team_name
                )
        
        return notifications
    
    def notify_task_assigned(
        self,
        db: Session,
        task: Task,
        assigned_by_user_id: UUID,
        previous_assignee_id: Optional[UUID] = None
    ):
        """Send notification when task is assigned"""
        
        if not task.assignee_id or task.assignee_id == assigned_by_user_id:
            return
        
        # Get users
        assignee = db.query(User).filter(User.id == task.assignee_id).first()
        assigned_by = db.query(User).filter(User.id == assigned_by_user_id).first()
        team = db.query(Team).filter(Team.id == task.team_id).first()
        
        if not assignee or not assigned_by:
            return
        
        # Create notification
        self.create_notification(
            db=db,
            user_id=task.assignee_id,
            type="task_assigned",
            title="New task assigned",
            message=f"{assigned_by.full_name or assigned_by.email} assigned you a task: {task.title}",
            data={
                "task_id": str(task.id),
                "task_title": task.title,
                "assigned_by_id": str(assigned_by_user_id),
                "assigned_by_name": assigned_by.full_name or assigned_by.email,
                "team_name": team.name if team else None,
                "due_date": task.due_date.isoformat() if task.due_date else None
            },
            priority="normal",
            category="task",
            related_task_id=task.id,
            related_team_id=task.team_id
        )
        
        # Send task assignment email
        if self._should_send_task_assignment_email(task.assignee_id, db):
            send_task_assignment_email.delay(
                email=assignee.email,
                assignee_name=assignee.full_name or assignee.email,
                task_title=task.title,
                task_description=task.description or "",
                assigned_by_name=assigned_by.full_name or assigned_by.email,
                team_name=team.name if team else "Unknown Team",
                task_id=str(task.id),
                due_date=task.due_date
            )
    
    def notify_task_completed(
        self,
        db: Session,
        task: Task,
        completed_by_user_id: UUID
    ):
        """Send notification when task is completed"""
        
        # Notify task creator if different from completer
        if task.creator_id and task.creator_id != completed_by_user_id:
            completed_by = db.query(User).filter(User.id == completed_by_user_id).first()
            
            if completed_by:
                self.create_notification(
                    db=db,
                    user_id=task.creator_id,
                    type="task_completed",
                    title="Task completed",
                    message=f"{completed_by.full_name or completed_by.email} completed task: {task.title}",
                    data={
                        "task_id": str(task.id),
                        "task_title": task.title,
                        "completed_by_id": str(completed_by_user_id),
                        "completed_by_name": completed_by.full_name or completed_by.email
                    },
                    priority="low",
                    category="task",
                    related_task_id=task.id,
                    related_team_id=task.team_id
                )
    
    def _send_realtime_notification(self, notification: Notification):
        """Send real-time notification via WebSocket"""
        try:
            ws_notification = WebSocketNotification(data=notification)
            websocket_manager.send_to_user(
                user_id=str(notification.user_id),
                message=ws_notification.dict()
            )
        except Exception as e:
            logger.error(f"Failed to send real-time notification: {e}")
    
    def _schedule_email_notification(self, notification: Notification, preferences: NotificationPreference):
        """Schedule email notification via Celery"""
        try:
            # Check quiet hours
            if self._is_quiet_hours(preferences):
                return
            
            email_data = EmailNotificationData(
                template="notification_generic",
                subject=notification.title,
                recipient=notification.user.email,
                context={
                    "notification": notification.__dict__,
                    "user_name": notification.user.full_name or notification.user.email
                },
                priority=notification.priority
            )
            
            send_email_task.delay(email_data.dict())
            
        except Exception as e:
            logger.error(f"Failed to schedule email notification: {e}")
    
    def _schedule_push_notification(self, notification: Notification, preferences: NotificationPreference):
        """Schedule push notification via Celery"""
        try:
            # Check quiet hours
            if self._is_quiet_hours(preferences):
                return
            
            push_data = PushNotificationData(
                title=notification.title,
                body=notification.message,
                data={
                    "notification_id": str(notification.id),
                    "type": notification.type,
                    "category": notification.category
                }
            )
            
            send_push_notification_task.delay(
                user_id=str(notification.user_id),
                push_data=push_data.dict()
            )
            
        except Exception as e:
            logger.error(f"Failed to schedule push notification: {e}")
    
    def _should_send_email(self, preferences: NotificationPreference, notification_type: str) -> bool:
        """Check if email should be sent based on preferences"""
        if not preferences.email_enabled:
            return False
        
        type_mapping = {
            "task_assigned": preferences.email_task_assigned,
            "task_completed": preferences.email_task_completed,
            "mention": preferences.email_mentions,
            "team_invite": preferences.email_team_invites
        }
        
        return type_mapping.get(notification_type, True)
    
    def _should_send_push(self, preferences: NotificationPreference, notification_type: str) -> bool:
        """Check if push notification should be sent based on preferences"""
        if not preferences.push_enabled:
            return False
        
        type_mapping = {
            "task_assigned": preferences.push_task_assigned,
            "task_completed": preferences.push_task_completed,
            "mention": preferences.push_mentions,
            "team_invite": preferences.push_team_invites
        }
        
        return type_mapping.get(notification_type, True)
    
    def _should_send_task_assignment_email(self, user_id: UUID, db: Session) -> bool:
        """Check if task assignment email should be sent"""
        preferences = self.get_user_preferences(db, user_id)
        return preferences and preferences.email_enabled and preferences.email_task_assigned
    
    def _should_send_mention_email(self, user_id: UUID, db: Session) -> bool:
        """Check if mention email should be sent"""
        preferences = self.get_user_preferences(db, user_id)
        return preferences and preferences.email_enabled and preferences.email_mentions
    
    def _is_quiet_hours(self, preferences: NotificationPreference) -> bool:
        """Check if current time is within user's quiet hours"""
        if not preferences.quiet_hours_enabled:
            return False
        
        # Implementation would check current time against quiet hours
        # This is a simplified version
        return False


# Global notification service instance
notification_service = NotificationService()


# Convenience functions
def create_notification(
    db: Session,
    user_id: UUID,
    type: str,
    title: str,
    message: str,
    **kwargs
) -> Notification:
    """Convenience function to create notification"""
    return notification_service.create_notification(
        db=db,
        user_id=user_id,
        type=type,
        title=title,
        message=message,
        **kwargs
    )


def process_mentions(
    db: Session,
    content: str,
    mentioned_by_user_id: UUID,
    context_type: str,
    context_id: UUID,
    team_id: UUID,
    **kwargs
) -> List[Notification]:
    """Convenience function to process mentions"""
    return notification_service.process_mentions(
        db=db,
        content=content,
        mentioned_by_user_id=mentioned_by_user_id,
        context_type=context_type,
        context_id=context_id,
        team_id=team_id,
        **kwargs
    )