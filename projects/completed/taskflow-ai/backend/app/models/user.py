from sqlalchemy import Boolean, Column, Integer, String, ForeignKey, Table, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
import uuid
from app.db.base_class import Base


# Association table for many-to-many relationship between users and teams
user_teams = Table(
    'user_teams',
    Base.metadata,
    Column('user_id', UUID(as_uuid=True), ForeignKey('user.id'), primary_key=True),
    Column('team_id', UUID(as_uuid=True), ForeignKey('team.id'), primary_key=True),
    Column('role', String, default='member'),  # member, admin, owner
    Column('joined_at', DateTime(timezone=True), server_default='now()')
)


class User(Base):
    __tablename__ = "user"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String, unique=True, index=True, nullable=False)
    username = Column(String, unique=True, index=True, nullable=False)
    full_name = Column(String, nullable=True)
    hashed_password = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    is_superuser = Column(Boolean, default=False)
    is_verified = Column(Boolean, default=False)
    
    # Profile fields
    avatar_url = Column(String, nullable=True)
    timezone = Column(String, default='UTC')
    notification_preferences = Column(String, default='all')  # JSON string
    
    # Relationships
    teams = relationship("Team", secondary=user_teams, back_populates="members")
    created_tasks = relationship("Task", foreign_keys="Task.creator_id", back_populates="creator")
    assigned_tasks = relationship("Task", foreign_keys="Task.assignee_id", back_populates="assignee")
    comments = relationship("Comment", back_populates="author")
    activities = relationship("Activity", back_populates="user")