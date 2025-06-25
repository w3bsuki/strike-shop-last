from typing import Optional, List
from pydantic import BaseModel, ConfigDict
from uuid import UUID
from datetime import datetime


class TeamBase(BaseModel):
    name: str
    description: Optional[str] = None
    logo_url: Optional[str] = None
    default_task_view: str = "kanban"
    ai_features_enabled: bool = True
    max_members: int = 50


class TeamCreate(TeamBase):
    slug: str


class TeamUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    logo_url: Optional[str] = None
    default_task_view: Optional[str] = None
    ai_features_enabled: Optional[bool] = None
    max_members: Optional[int] = None
    is_active: Optional[bool] = None


class Team(TeamBase):
    id: UUID
    slug: str
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    model_config = ConfigDict(from_attributes=True)


class TeamWithStats(Team):
    members_count: int = 0
    projects_count: int = 0
    tasks_count: int = 0
    completed_tasks_count: int = 0