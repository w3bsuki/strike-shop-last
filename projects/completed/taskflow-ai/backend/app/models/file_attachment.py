from sqlalchemy import Column, String, Integer, Boolean, DateTime, ForeignKey, Text, func
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
import uuid
from app.db.base_class import Base


class FileAttachment(Base):
    """File attachments for tasks, comments, and teams"""
    __tablename__ = "file_attachment"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # File details
    filename = Column(String, nullable=False)
    original_filename = Column(String, nullable=False)
    content_type = Column(String, nullable=False)
    file_size = Column(Integer, nullable=False)  # Size in bytes
    file_path = Column(String, nullable=False)  # S3 key or local path
    
    # File metadata
    file_hash = Column(String, nullable=True)  # SHA-256 for deduplication
    is_image = Column(Boolean, default=False)
    image_width = Column(Integer, nullable=True)
    image_height = Column(Integer, nullable=True)
    thumbnail_path = Column(String, nullable=True)
    
    # Upload details
    uploaded_by_id = Column(UUID(as_uuid=True), ForeignKey('user.id'), nullable=False)
    
    # Security and access
    is_public = Column(Boolean, default=False)
    access_token = Column(String, nullable=True)  # For secure access
    expires_at = Column(DateTime(timezone=True), nullable=True)
    download_count = Column(Integer, default=0)
    
    # Virus scanning
    virus_scan_status = Column(String, default='pending')  # pending, clean, infected, failed
    virus_scan_result = Column(Text, nullable=True)
    scanned_at = Column(DateTime(timezone=True), nullable=True)
    
    # Related entities
    task_id = Column(UUID(as_uuid=True), ForeignKey('task.id'), nullable=True)
    comment_id = Column(UUID(as_uuid=True), ForeignKey('comment.id'), nullable=True)
    team_id = Column(UUID(as_uuid=True), ForeignKey('team.id'), nullable=True)
    
    # Relationships
    uploaded_by = relationship("User")
    task = relationship("Task")
    comment = relationship("Comment")
    team = relationship("Team")


class FileStorageQuota(Base):
    """Storage quota tracking per team/user"""
    __tablename__ = "file_storage_quota"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Owner (either user or team)
    user_id = Column(UUID(as_uuid=True), ForeignKey('user.id'), nullable=True)
    team_id = Column(UUID(as_uuid=True), ForeignKey('team.id'), nullable=True)
    
    # Quota details
    quota_bytes = Column(Integer, nullable=False)  # Total allowed bytes
    used_bytes = Column(Integer, default=0)  # Currently used bytes
    files_count = Column(Integer, default=0)  # Number of files
    
    # Tracking
    last_calculated_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    user = relationship("User")
    team = relationship("Team")


class FileAccessLog(Base):
    """Log file access for security and analytics"""
    __tablename__ = "file_access_log"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    file_id = Column(UUID(as_uuid=True), ForeignKey('file_attachment.id'), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey('user.id'), nullable=False)
    
    # Access details
    action = Column(String, nullable=False)  # view, download, delete
    ip_address = Column(String, nullable=True)
    user_agent = Column(String, nullable=True)
    
    # Tracking
    accessed_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    file_attachment = relationship("FileAttachment")
    user = relationship("User")