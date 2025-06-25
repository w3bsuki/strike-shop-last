from sqlalchemy import Column, String, Integer, Float, DateTime, ForeignKey, Text, Boolean, func
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
import uuid
from app.db.base_class import Base


class TeamAnalytics(Base):
    """Team productivity analytics and metrics"""
    __tablename__ = "team_analytics"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    team_id = Column(UUID(as_uuid=True), ForeignKey('team.id'), nullable=False)
    
    # Time period
    period_type = Column(String, nullable=False)  # daily, weekly, monthly
    period_start = Column(DateTime(timezone=True), nullable=False)
    period_end = Column(DateTime(timezone=True), nullable=False)
    
    # Task metrics
    tasks_created = Column(Integer, default=0)
    tasks_completed = Column(Integer, default=0)
    tasks_in_progress = Column(Integer, default=0)
    tasks_overdue = Column(Integer, default=0)
    
    # Performance metrics
    avg_completion_time_hours = Column(Float, nullable=True)
    productivity_score = Column(Float, nullable=True)  # 0-100 scale
    velocity = Column(Float, nullable=True)  # Tasks completed per time period
    
    # Collaboration metrics
    active_members = Column(Integer, default=0)
    comments_count = Column(Integer, default=0)
    mentions_count = Column(Integer, default=0)
    
    # AI insights
    ai_insights = Column(Text, nullable=True)  # JSON string with insights
    recommendations = Column(Text, nullable=True)  # JSON string with recommendations
    
    # Relationship
    team = relationship("Team")


class UserAnalytics(Base):
    """Individual user productivity analytics"""
    __tablename__ = "user_analytics"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey('user.id'), nullable=False)
    team_id = Column(UUID(as_uuid=True), ForeignKey('team.id'), nullable=True)
    
    # Time period
    period_type = Column(String, nullable=False)  # daily, weekly, monthly
    period_start = Column(DateTime(timezone=True), nullable=False)
    period_end = Column(DateTime(timezone=True), nullable=False)
    
    # Task metrics
    tasks_created = Column(Integer, default=0)
    tasks_completed = Column(Integer, default=0)
    tasks_assigned = Column(Integer, default=0)
    
    # Performance metrics
    avg_completion_time_hours = Column(Float, nullable=True)
    productivity_score = Column(Float, nullable=True)
    focus_time_hours = Column(Float, nullable=True)
    
    # Collaboration metrics
    comments_made = Column(Integer, default=0)
    mentions_received = Column(Integer, default=0)
    
    # Activity metrics
    login_count = Column(Integer, default=0)
    active_days = Column(Integer, default=0)
    
    # Relationships
    user = relationship("User")
    team = relationship("Team")


class AnalyticsInsight(Base):
    """AI-generated insights and recommendations"""
    __tablename__ = "analytics_insight"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Target (team or user)
    team_id = Column(UUID(as_uuid=True), ForeignKey('team.id'), nullable=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey('user.id'), nullable=True)
    
    # Insight details
    type = Column(String, nullable=False)  # productivity, bottleneck, trend, recommendation
    category = Column(String, nullable=False)  # performance, collaboration, efficiency
    title = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    
    # Data and metrics
    supporting_data = Column(Text, nullable=True)  # JSON string with data
    confidence_score = Column(Float, nullable=True)  # 0-1 confidence
    impact_score = Column(Float, nullable=True)  # 0-1 impact estimation
    
    # Status
    status = Column(String, default='active')  # active, dismissed, archived
    is_actionable = Column(Boolean, default=False)
    
    # Tracking
    viewed_at = Column(DateTime(timezone=True), nullable=True)
    dismissed_at = Column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    team = relationship("Team")
    user = relationship("User")


class AnalyticsReport(Base):
    """Scheduled analytics reports"""
    __tablename__ = "analytics_report"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    team_id = Column(UUID(as_uuid=True), ForeignKey('team.id'), nullable=False)
    created_by_id = Column(UUID(as_uuid=True), ForeignKey('user.id'), nullable=False)
    
    # Report details
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    report_type = Column(String, nullable=False)  # team_summary, productivity, performance
    
    # Configuration
    config = Column(Text, nullable=False)  # JSON string with report configuration
    recipients = Column(Text, nullable=True)  # JSON array of email addresses
    
    # Scheduling
    schedule_type = Column(String, nullable=False)  # manual, daily, weekly, monthly
    schedule_config = Column(Text, nullable=True)  # JSON string with schedule details
    
    # Status
    is_active = Column(Boolean, default=True)
    last_generated_at = Column(DateTime(timezone=True), nullable=True)
    next_generation_at = Column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    team = relationship("Team")
    created_by = relationship("User")