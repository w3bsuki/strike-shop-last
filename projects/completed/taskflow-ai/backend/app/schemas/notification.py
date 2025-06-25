from typing import Optional, List, Dict, Any
from pydantic import BaseModel, ConfigDict
from uuid import UUID
from datetime import datetime


# Notification Schemas
class NotificationBase(BaseModel):
    type: str
    title: str
    message: str
    data: Optional[str] = None
    priority: str = "normal"
    category: Optional[str] = None


class NotificationCreate(NotificationBase):
    user_id: UUID
    related_task_id: Optional[UUID] = None
    related_team_id: Optional[UUID] = None
    related_project_id: Optional[UUID] = None


class NotificationUpdate(BaseModel):
    is_read: Optional[bool] = None


class Notification(NotificationBase):
    id: UUID
    user_id: UUID
    is_read: bool
    read_at: Optional[datetime] = None
    email_sent: bool = False
    email_sent_at: Optional[datetime] = None
    push_sent: bool = False
    push_sent_at: Optional[datetime] = None
    related_task_id: Optional[UUID] = None
    related_team_id: Optional[UUID] = None
    related_project_id: Optional[UUID] = None
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


class NotificationResponse(BaseModel):
    notifications: List[Notification]
    total: int
    unread_count: int
    page: int
    per_page: int


class NotificationBulkUpdate(BaseModel):
    notification_ids: List[UUID]
    is_read: bool


# Notification Preferences
class NotificationPreferenceBase(BaseModel):
    email_enabled: bool = True
    email_task_assigned: bool = True
    email_task_completed: bool = True
    email_mentions: bool = True
    email_team_invites: bool = True
    email_digest_frequency: str = "daily"
    
    push_enabled: bool = True
    push_task_assigned: bool = True
    push_task_completed: bool = False
    push_mentions: bool = True
    push_team_invites: bool = True
    
    quiet_hours_enabled: bool = False
    quiet_hours_start: Optional[str] = None
    quiet_hours_end: Optional[str] = None
    quiet_hours_timezone: str = "UTC"


class NotificationPreferenceCreate(NotificationPreferenceBase):
    pass


class NotificationPreferenceUpdate(NotificationPreferenceBase):
    pass


class NotificationPreference(NotificationPreferenceBase):
    id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    model_config = ConfigDict(from_attributes=True)


# Real-time notification
class WebSocketNotification(BaseModel):
    type: str = "notification"
    data: Notification


class MentionNotification(BaseModel):
    type: str = "mention"
    mentioned_by: str
    content: str
    task_id: Optional[UUID] = None
    comment_id: Optional[UUID] = None


# Email notification data
class EmailNotificationData(BaseModel):
    template: str
    subject: str
    recipient: str
    context: Dict[str, Any]
    priority: str = "normal"


# Push notification data
class PushNotificationData(BaseModel):
    title: str
    body: str
    data: Optional[Dict[str, Any]] = None
    icon: Optional[str] = None
    badge: Optional[str] = None