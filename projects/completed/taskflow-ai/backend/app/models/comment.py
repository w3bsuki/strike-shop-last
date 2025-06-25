from sqlalchemy import Column, Text, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID, ARRAY
import uuid
from app.db.base_class import Base


class Comment(Base):
    __tablename__ = "comment"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    content = Column(Text, nullable=False)
    
    # For mentions (@username)
    mentioned_user_ids = Column(ARRAY(UUID(as_uuid=True)), default=[])
    
    # Relationships
    task_id = Column(UUID(as_uuid=True), ForeignKey('task.id'), nullable=False)
    author_id = Column(UUID(as_uuid=True), ForeignKey('user.id'), nullable=False)
    parent_comment_id = Column(UUID(as_uuid=True), ForeignKey('comment.id'), nullable=True)
    
    # Relationships
    task = relationship("Task", back_populates="comments")
    author = relationship("User", back_populates="comments")
    parent_comment = relationship("Comment", remote_side=[id], backref="replies")