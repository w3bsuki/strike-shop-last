from sqlalchemy import Column, String, Text, Integer, Float, Boolean, ForeignKey, DateTime, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID, ARRAY
import uuid
from datetime import datetime
from app.db.base_class import Base


class Task(Base):
    __tablename__ = "task"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String, nullable=False, index=True)
    description = Column(Text, nullable=True)
    
    # Status and priority
    status = Column(String, default='todo')  # todo, in_progress, review, done, archived
    priority = Column(String, default='medium')  # low, medium, high, urgent
    
    # AI-powered fields
    ai_priority_score = Column(Float, nullable=True)  # 0.0 to 1.0
    ai_estimated_hours = Column(Float, nullable=True)
    ai_complexity_score = Column(Float, nullable=True)  # 0.0 to 1.0
    ai_suggested_assignee_id = Column(UUID(as_uuid=True), nullable=True)
    ai_tags = Column(ARRAY(String), default=[])
    ai_predicted_completion = Column(DateTime(timezone=True), nullable=True)
    ai_bottleneck_risk = Column(Float, default=0.0)  # 0.0 to 1.0
    
    # Dates
    due_date = Column(DateTime(timezone=True), nullable=True)
    start_date = Column(DateTime(timezone=True), nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    
    # Time tracking
    estimated_hours = Column(Float, nullable=True)
    actual_hours = Column(Float, default=0.0)
    
    # Relationships
    team_id = Column(UUID(as_uuid=True), ForeignKey('team.id'), nullable=False)
    project_id = Column(UUID(as_uuid=True), ForeignKey('project.id'), nullable=True)
    creator_id = Column(UUID(as_uuid=True), ForeignKey('user.id'), nullable=False)
    assignee_id = Column(UUID(as_uuid=True), ForeignKey('user.id'), nullable=True)
    parent_task_id = Column(UUID(as_uuid=True), ForeignKey('task.id'), nullable=True)
    
    # Custom fields for flexibility
    custom_fields = Column(JSON, default={})
    
    # Position for ordering (used in kanban boards)
    position = Column(Integer, default=0)
    
    # Relationships
    team = relationship("Team", back_populates="tasks")
    project = relationship("Project", back_populates="tasks")
    creator = relationship("User", foreign_keys=[creator_id], back_populates="created_tasks")
    assignee = relationship("User", foreign_keys=[assignee_id], back_populates="assigned_tasks")
    parent_task = relationship("Task", remote_side=[id], backref="subtasks")
    comments = relationship("Comment", back_populates="task", cascade="all, delete-orphan")
    attachments = relationship("Attachment", back_populates="task", cascade="all, delete-orphan")
    activities = relationship("Activity", back_populates="task", cascade="all, delete-orphan")
    
    # Dependencies
    dependencies = relationship(
        "TaskDependency",
        foreign_keys="TaskDependency.task_id",
        back_populates="task",
        cascade="all, delete-orphan"
    )
    dependents = relationship(
        "TaskDependency",
        foreign_keys="TaskDependency.depends_on_id",
        back_populates="depends_on",
        cascade="all, delete-orphan"
    )


class TaskDependency(Base):
    __tablename__ = "task_dependency"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    task_id = Column(UUID(as_uuid=True), ForeignKey('task.id'), nullable=False)
    depends_on_id = Column(UUID(as_uuid=True), ForeignKey('task.id'), nullable=False)
    dependency_type = Column(String, default='finish_to_start')  # finish_to_start, start_to_start, etc.
    
    # Relationships
    task = relationship("Task", foreign_keys=[task_id], back_populates="dependencies")
    depends_on = relationship("Task", foreign_keys=[depends_on_id], back_populates="dependents")