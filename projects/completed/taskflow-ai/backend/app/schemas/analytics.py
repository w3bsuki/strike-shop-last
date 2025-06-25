from typing import Optional, List, Dict, Any
from pydantic import BaseModel, ConfigDict
from uuid import UUID
from datetime import datetime, date


# Analytics Query Parameters
class AnalyticsQuery(BaseModel):
    start_date: date
    end_date: date
    team_id: Optional[UUID] = None
    user_id: Optional[UUID] = None
    metric_types: Optional[List[str]] = None
    group_by: str = "day"  # day, week, month


# Team Analytics
class TeamProductivityMetrics(BaseModel):
    period_start: datetime
    period_end: datetime
    tasks_created: int
    tasks_completed: int
    tasks_in_progress: int
    tasks_overdue: int
    avg_completion_time_hours: Optional[float] = None
    productivity_score: Optional[float] = None
    velocity: Optional[float] = None
    active_members: int
    comments_count: int
    mentions_count: int


class TeamAnalyticsResponse(BaseModel):
    team_id: UUID
    team_name: str
    current_period: TeamProductivityMetrics
    previous_period: TeamProductivityMetrics
    trends: Dict[str, float]  # percentage changes
    insights: List[str]
    recommendations: List[str]


# User Analytics
class UserProductivityMetrics(BaseModel):
    period_start: datetime
    period_end: datetime
    tasks_created: int
    tasks_completed: int
    tasks_assigned: int
    avg_completion_time_hours: Optional[float] = None
    productivity_score: Optional[float] = None
    focus_time_hours: Optional[float] = None
    comments_made: int
    mentions_received: int
    login_count: int
    active_days: int


class UserAnalyticsResponse(BaseModel):
    user_id: UUID
    user_name: str
    current_period: UserProductivityMetrics
    previous_period: UserProductivityMetrics
    trends: Dict[str, float]
    team_ranking: Optional[int] = None
    insights: List[str]


# Comparative Analytics
class TeamMemberPerformance(BaseModel):
    user_id: UUID
    user_name: str
    user_avatar_url: Optional[str] = None
    tasks_completed: int
    productivity_score: Optional[float] = None
    avg_completion_time_hours: Optional[float] = None
    collaboration_score: Optional[float] = None


class TeamPerformanceReport(BaseModel):
    team_id: UUID
    team_name: str
    period_start: datetime
    period_end: datetime
    members: List[TeamMemberPerformance]
    team_averages: TeamProductivityMetrics
    top_performers: List[TeamMemberPerformance]
    improvement_areas: List[str]


# Analytics Insights
class AnalyticsInsightBase(BaseModel):
    type: str
    category: str
    title: str
    description: str
    supporting_data: Optional[str] = None
    confidence_score: Optional[float] = None
    impact_score: Optional[float] = None
    is_actionable: bool = False


class AnalyticsInsightCreate(AnalyticsInsightBase):
    team_id: Optional[UUID] = None
    user_id: Optional[UUID] = None


class AnalyticsInsight(AnalyticsInsightBase):
    id: UUID
    team_id: Optional[UUID] = None
    user_id: Optional[UUID] = None
    status: str
    viewed_at: Optional[datetime] = None
    dismissed_at: Optional[datetime] = None
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


class AnalyticsInsightsResponse(BaseModel):
    insights: List[AnalyticsInsight]
    total: int
    active_count: int
    dismissed_count: int


# Dashboard Data
class DashboardMetrics(BaseModel):
    total_tasks: int
    completed_tasks: int
    in_progress_tasks: int
    overdue_tasks: int
    completion_rate: float
    avg_completion_time: Optional[float] = None
    productivity_trend: List[Dict[str, Any]]
    recent_activities: List[Dict[str, Any]]


class TeamDashboard(BaseModel):
    team_id: UUID
    team_name: str
    metrics: DashboardMetrics
    member_count: int
    active_projects: int
    recent_insights: List[AnalyticsInsight]
    performance_chart_data: List[Dict[str, Any]]


# Export Formats
class AnalyticsExportRequest(BaseModel):
    query: AnalyticsQuery
    format: str = "json"  # json, csv, xlsx
    include_charts: bool = False
    sections: Optional[List[str]] = None


class AnalyticsExportResponse(BaseModel):
    export_id: UUID
    download_url: str
    expires_at: datetime
    file_size: int
    format: str


# Custom Reports
class CustomReportConfig(BaseModel):
    name: str
    description: Optional[str] = None
    report_type: str
    metrics: List[str]
    filters: Dict[str, Any]
    chart_configs: List[Dict[str, Any]]
    schedule_type: str = "manual"
    recipients: Optional[List[str]] = None


class CustomReport(CustomReportConfig):
    id: UUID
    team_id: UUID
    created_by_id: UUID
    is_active: bool
    last_generated_at: Optional[datetime] = None
    next_generation_at: Optional[datetime] = None
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


# Real-time Analytics
class RealTimeMetrics(BaseModel):
    timestamp: datetime
    active_users: int
    tasks_completed_today: int
    new_tasks_today: int
    team_activity_score: float


class LiveDashboardData(BaseModel):
    current_metrics: RealTimeMetrics
    hourly_activity: List[Dict[str, Any]]
    recent_completions: List[Dict[str, Any]]
    active_members: List[Dict[str, Any]]