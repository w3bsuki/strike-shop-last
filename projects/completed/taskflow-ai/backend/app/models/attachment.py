from sqlalchemy import Column, String, Integer, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
import uuid
from app.db.base_class import Base


class Attachment(Base):
    __tablename__ = "attachment"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    filename = Column(String, nullable=False)
    file_url = Column(String, nullable=False)
    file_type = Column(String, nullable=True)  # MIME type
    file_size = Column(Integer, nullable=True)  # in bytes
    
    # Relationships
    task_id = Column(UUID(as_uuid=True), ForeignKey('task.id'), nullable=False)
    uploaded_by_id = Column(UUID(as_uuid=True), ForeignKey('user.id'), nullable=False)
    
    # Relationships
    task = relationship("Task", back_populates="attachments")
    uploaded_by = relationship("User")