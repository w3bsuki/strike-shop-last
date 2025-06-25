from sqlalchemy import Column, String, Text, ForeignKey, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
import uuid
from app.db.base_class import Base


class Activity(Base):
    __tablename__ = "activity"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    action = Column(String, nullable=False)  # created, updated, completed, commented, etc.
    entity_type = Column(String, nullable=False)  # task, project, comment, etc.
    entity_id = Column(UUID(as_uuid=True), nullable=False)
    
    # Store changes or additional data
    activity_data = Column(JSON, default={})
    
    # Description for display
    description = Column(Text, nullable=True)
    
    # Relationships
    user_id = Column(UUID(as_uuid=True), ForeignKey('user.id'), nullable=False)
    task_id = Column(UUID(as_uuid=True), ForeignKey('task.id'), nullable=True)
    team_id = Column(UUID(as_uuid=True), ForeignKey('team.id'), nullable=False)
    
    # Relationships
    user = relationship("User", back_populates="activities")
    task = relationship("Task", back_populates="activities")