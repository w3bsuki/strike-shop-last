from sqlalchemy import Column, String, Text, Boolean, Integer
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
import uuid
from app.db.base_class import Base
from app.models.user import user_teams


class Team(Base):
    __tablename__ = "team"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False, index=True)
    slug = Column(String, unique=True, nullable=False, index=True)
    description = Column(Text, nullable=True)
    logo_url = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    
    # Team settings
    default_task_view = Column(String, default='kanban')  # kanban, list, calendar, gantt
    ai_features_enabled = Column(Boolean, default=True)
    max_members = Column(Integer, default=50)
    
    # Relationships
    members = relationship("User", secondary=user_teams, back_populates="teams")
    projects = relationship("Project", back_populates="team", cascade="all, delete-orphan")
    tasks = relationship("Task", back_populates="team", cascade="all, delete-orphan")