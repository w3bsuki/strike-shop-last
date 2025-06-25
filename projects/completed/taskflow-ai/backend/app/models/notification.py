from sqlalchemy import Column, String, Text, Boolean, DateTime, ForeignKey, Integer, func
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
import uuid
from app.db.base_class import Base


class Notification(Base):
    """User notifications for various events"""
    __tablename__ = "notification"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey('user.id'), nullable=False)
    
    # Notification content
    type = Column(String, nullable=False)  # task_assigned, task_completed, mention, team_invite, etc.
    title = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    
    # Metadata
    data = Column(Text, nullable=True)  # JSON string with additional data
    priority = Column(String, default='normal')  # low, normal, high, urgent
    category = Column(String, nullable=True)  # task, team, project, system
    
    # Status and tracking
    is_read = Column(Boolean, default=False)
    read_at = Column(DateTime(timezone=True), nullable=True)
    
    # Delivery channels
    email_sent = Column(Boolean, default=False)
    email_sent_at = Column(DateTime(timezone=True), nullable=True)
    push_sent = Column(Boolean, default=False)
    push_sent_at = Column(DateTime(timezone=True), nullable=True)
    
    # Related entities (optional)
    related_task_id = Column(UUID(as_uuid=True), ForeignKey('task.id'), nullable=True)
    related_team_id = Column(UUID(as_uuid=True), ForeignKey('team.id'), nullable=True)
    related_project_id = Column(UUID(as_uuid=True), ForeignKey('project.id'), nullable=True)
    
    # Relationships
    user = relationship("User")
    related_task = relationship("Task")
    related_team = relationship("Team")
    related_project = relationship("Project")


class NotificationPreference(Base):
    """User notification preferences"""
    __tablename__ = "notification_preference"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey('user.id'), nullable=False, unique=True)
    
    # Email preferences
    email_enabled = Column(Boolean, default=True)
    email_task_assigned = Column(Boolean, default=True)
    email_task_completed = Column(Boolean, default=True)
    email_mentions = Column(Boolean, default=True)
    email_team_invites = Column(Boolean, default=True)
    email_digest_frequency = Column(String, default='daily')  # never, daily, weekly
    
    # Push notification preferences
    push_enabled = Column(Boolean, default=True)
    push_task_assigned = Column(Boolean, default=True)
    push_task_completed = Column(Boolean, default=False)
    push_mentions = Column(Boolean, default=True)
    push_team_invites = Column(Boolean, default=True)
    
    # Quiet hours
    quiet_hours_enabled = Column(Boolean, default=False)
    quiet_hours_start = Column(String, nullable=True)  # HH:MM format
    quiet_hours_end = Column(String, nullable=True)  # HH:MM format
    quiet_hours_timezone = Column(String, default='UTC')
    
    # Relationship
    user = relationship("User")


class NotificationDigest(Base):
    """Scheduled notification digests"""
    __tablename__ = "notification_digest"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey('user.id'), nullable=False)
    
    # Digest details
    frequency = Column(String, nullable=False)  # daily, weekly
    last_sent_at = Column(DateTime(timezone=True), nullable=True)
    next_send_at = Column(DateTime(timezone=True), nullable=False)
    
    # Content tracking
    notifications_count = Column(Integer, default=0)
    email_sent = Column(Boolean, default=False)
    
    # Relationship
    user = relationship("User")