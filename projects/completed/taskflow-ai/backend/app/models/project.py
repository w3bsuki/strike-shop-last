from sqlalchemy import Column, String, Text, Boolean, ForeignKey, DateTime, Integer
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
import uuid
from app.db.base_class import Base


class Project(Base):
    __tablename__ = "project"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False, index=True)
    description = Column(Text, nullable=True)
    color = Column(String, default='#3B82F6')  # Hex color for UI
    icon = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    is_archived = Column(Boolean, default=False)
    
    # Dates
    start_date = Column(DateTime(timezone=True), nullable=True)
    end_date = Column(DateTime(timezone=True), nullable=True)
    
    # AI predictions
    ai_predicted_completion = Column(DateTime(timezone=True), nullable=True)
    ai_health_score = Column(Integer, default=100)  # 0-100
    ai_risk_factors = Column(Text, nullable=True)  # JSON string
    
    # Relationships
    team_id = Column(UUID(as_uuid=True), ForeignKey('team.id'), nullable=False)
    
    # Relationships
    team = relationship("Team", back_populates="projects")
    tasks = relationship("Task", back_populates="project", cascade="all, delete-orphan")