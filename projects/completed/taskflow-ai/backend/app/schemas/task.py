from typing import Optional, List, Dict, Any
from pydantic import BaseModel, ConfigDict
from uuid import UUID
from datetime import datetime


class TaskBase(BaseModel):
    title: str
    description: Optional[str] = None
    status: str = "todo"
    priority: str = "medium"
    due_date: Optional[datetime] = None
    start_date: Optional[datetime] = None
    estimated_hours: Optional[float] = None
    project_id: Optional[UUID] = None
    assignee_id: Optional[UUID] = None
    parent_task_id: Optional[UUID] = None
    custom_fields: Dict[str, Any] = {}


class TaskCreate(TaskBase):
    team_id: UUID
    natural_language_input: Optional[str] = None  # For AI parsing


class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    priority: Optional[str] = None
    due_date: Optional[datetime] = None
    start_date: Optional[datetime] = None
    estimated_hours: Optional[float] = None
    assignee_id: Optional[UUID] = None
    project_id: Optional[UUID] = None
    parent_task_id: Optional[UUID] = None
    position: Optional[int] = None
    custom_fields: Optional[Dict[str, Any]] = None


class TaskAIMetadata(BaseModel):
    ai_priority_score: Optional[float] = None
    ai_estimated_hours: Optional[float] = None
    ai_complexity_score: Optional[float] = None
    ai_suggested_assignee_id: Optional[UUID] = None
    ai_tags: List[str] = []
    ai_predicted_completion: Optional[datetime] = None
    ai_bottleneck_risk: float = 0.0


class Task(TaskBase):
    id: UUID
    team_id: UUID
    creator_id: UUID
    position: int
    actual_hours: float
    completed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    # AI fields
    ai_priority_score: Optional[float] = None
    ai_estimated_hours: Optional[float] = None
    ai_complexity_score: Optional[float] = None
    ai_suggested_assignee_id: Optional[UUID] = None
    ai_tags: List[str] = []
    ai_predicted_completion: Optional[datetime] = None
    ai_bottleneck_risk: float = 0.0
    
    model_config = ConfigDict(from_attributes=True)


class TaskWithRelations(Task):
    creator: Optional[Dict[str, Any]] = None
    assignee: Optional[Dict[str, Any]] = None
    project: Optional[Dict[str, Any]] = None
    subtasks: List["Task"] = []
    dependencies: List[Dict[str, Any]] = []
    comments_count: int = 0
    attachments_count: int = 0