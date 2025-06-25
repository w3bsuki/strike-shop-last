from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Text, func
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
import uuid
from app.db.base_class import Base


class TeamMembership(Base):
    """Enhanced team membership model with roles and permissions"""
    __tablename__ = "team_membership"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey('user.id'), nullable=False)
    team_id = Column(UUID(as_uuid=True), ForeignKey('team.id'), nullable=False)
    
    # Role and permissions
    role = Column(String, nullable=False, default='member')  # owner, admin, member, viewer
    permissions = Column(Text, nullable=True)  # JSON string of custom permissions
    
    # Status and dates
    status = Column(String, default='active')  # active, invited, suspended
    invited_by_id = Column(UUID(as_uuid=True), ForeignKey('user.id'), nullable=True)
    invited_at = Column(DateTime(timezone=True), server_default=func.now())
    joined_at = Column(DateTime(timezone=True), nullable=True)
    last_active_at = Column(DateTime(timezone=True), nullable=True)
    
    # Settings
    is_favorite = Column(Boolean, default=False)
    notification_settings = Column(Text, nullable=True)  # JSON string
    
    # Relationships
    user = relationship("User", foreign_keys=[user_id])
    team = relationship("Team")
    invited_by = relationship("User", foreign_keys=[invited_by_id])
    
    __table_args__ = (
        # Unique constraint to prevent duplicate memberships
        {'extend_existing': True}
    )


class TeamInvitation(Base):
    """Team invitation tokens for email invitations"""
    __tablename__ = "team_invitation"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    team_id = Column(UUID(as_uuid=True), ForeignKey('team.id'), nullable=False)
    invited_by_id = Column(UUID(as_uuid=True), ForeignKey('user.id'), nullable=False)
    
    # Invitation details
    email = Column(String, nullable=False)
    role = Column(String, nullable=False, default='member')
    token = Column(String, unique=True, nullable=False, index=True)
    message = Column(Text, nullable=True)
    
    # Status and expiration
    status = Column(String, default='pending')  # pending, accepted, expired, cancelled
    expires_at = Column(DateTime(timezone=True), nullable=False)
    accepted_at = Column(DateTime(timezone=True), nullable=True)
    accepted_by_id = Column(UUID(as_uuid=True), ForeignKey('user.id'), nullable=True)
    
    # Relationships
    team = relationship("Team")
    invited_by = relationship("User", foreign_keys=[invited_by_id])
    accepted_by = relationship("User", foreign_keys=[accepted_by_id])