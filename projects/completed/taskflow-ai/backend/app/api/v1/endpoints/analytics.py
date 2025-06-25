from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status, Query, BackgroundTasks
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func, desc, asc, extract
from uuid import UUID
from datetime import datetime, date, timedelta
import json

from app.api import deps
from app.core.config import settings
from app.db.session import get_db
from app.models import (
    Team, User, TeamMembership, Task, Project, Activity,
    TeamAnalytics, UserAnalytics, AnalyticsInsight, AnalyticsReport
)
from app.schemas.analytics import (
    AnalyticsQuery, TeamAnalyticsResponse, UserAnalyticsResponse,
    TeamPerformanceReport, AnalyticsInsightsResponse, AnalyticsInsight as AnalyticsInsightSchema,
    DashboardMetrics, TeamDashboard, AnalyticsExportRequest, AnalyticsExportResponse,
    CustomReport, CustomReportConfig, RealTimeMetrics, LiveDashboardData
)
from app.services.analytics_service import analytics_service
from app.worker.tasks import generate_analytics_report_task, export_analytics_data_task

router = APIRouter()


@router.get("/teams/{team_id}/dashboard", response_model=TeamDashboard)
def get_team_dashboard(
    team_id: UUID,
    date_range: str = Query("30d", regex="^(7d|30d|90d|1y)$"),
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_user)
):
    """Get team dashboard data with key metrics and charts"""
    
    # Check if user is member of the team
    membership = db.query(TeamMembership).filter(
        and_(
            TeamMembership.team_id == team_id,
            TeamMembership.user_id == current_user.id,
            TeamMembership.status == "active"
        )
    ).first()
    
    if not membership:
        raise HTTPException(status_code=404, detail="Team not found")
    
    team = db.query(Team).filter(Team.id == team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    
    # Calculate date range
    end_date = datetime.utcnow().date()
    days_map = {"7d": 7, "30d": 30, "90d": 90, "1y": 365}
    start_date = end_date - timedelta(days=days_map[date_range])
    
    # Get dashboard metrics
    dashboard_data = analytics_service.calculate_team_dashboard_metrics(
        db=db,
        team_id=team_id,
        start_date=start_date,
        end_date=end_date
    )
    
    # Get recent insights
    recent_insights = db.query(AnalyticsInsight).filter(
        and_(
            AnalyticsInsight.team_id == team_id,
            AnalyticsInsight.status == "active"
        )
    ).order_by(desc(AnalyticsInsight.created_at)).limit(5).all()
    
    # Get member count and active projects
    member_count = db.query(TeamMembership).filter(
        and_(TeamMembership.team_id == team_id, TeamMembership.status == "active")
    ).count()
    
    active_projects = db.query(Project).filter(
        and_(Project.team_id == team_id, Project.status == "active")
    ).count()
    
    return TeamDashboard(
        team_id=team_id,
        team_name=team.name,
        metrics=dashboard_data["metrics"],
        member_count=member_count,
        active_projects=active_projects,
        recent_insights=recent_insights,
        performance_chart_data=dashboard_data["performance_chart_data"]
    )


@router.get("/teams/{team_id}/productivity", response_model=TeamAnalyticsResponse)
def get_team_productivity_analytics(
    team_id: UUID,
    start_date: date = Query(..., description="Start date for analytics"),
    end_date: date = Query(..., description="End date for analytics"),
    compare_previous: bool = Query(True, description="Include previous period comparison"),
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_user)
):
    """Get comprehensive team productivity analytics"""
    
    # Check permissions
    membership = db.query(TeamMembership).filter(
        and_(
            TeamMembership.team_id == team_id,
            TeamMembership.user_id == current_user.id,
            TeamMembership.status == "active"
        )
    ).first()
    
    if not membership:
        raise HTTPException(status_code=404, detail="Team not found")
    
    team = db.query(Team).filter(Team.id == team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    
    # Calculate analytics
    analytics_data = analytics_service.calculate_team_analytics(
        db=db,
        team_id=team_id,
        start_date=start_date,
        end_date=end_date,
        compare_previous=compare_previous
    )
    
    return TeamAnalyticsResponse(
        team_id=team_id,
        team_name=team.name,
        **analytics_data
    )


@router.get("/teams/{team_id}/performance", response_model=TeamPerformanceReport)
def get_team_performance_report(
    team_id: UUID,
    start_date: date = Query(...),
    end_date: date = Query(...),
    sort_by: str = Query("productivity_score", regex="^(tasks_completed|productivity_score|avg_completion_time)$"),
    order: str = Query("desc", regex="^(asc|desc)$"),
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_user)
):
    """Get team performance report with member rankings"""
    
    # Check permissions (admin/owner only)
    membership = db.query(TeamMembership).filter(
        and_(
            TeamMembership.team_id == team_id,
            TeamMembership.user_id == current_user.id,
            TeamMembership.role.in_(["owner", "admin"]),
            TeamMembership.status == "active"
        )
    ).first()
    
    if not membership:
        raise HTTPException(
            status_code=403,
            detail="Insufficient permissions to view performance report"
        )
    
    team = db.query(Team).filter(Team.id == team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    
    # Calculate performance report
    performance_data = analytics_service.calculate_team_performance_report(
        db=db,
        team_id=team_id,
        start_date=start_date,
        end_date=end_date,
        sort_by=sort_by,
        order=order
    )
    
    return TeamPerformanceReport(
        team_id=team_id,
        team_name=team.name,
        period_start=datetime.combine(start_date, datetime.min.time()),
        period_end=datetime.combine(end_date, datetime.max.time()),
        **performance_data
    )


@router.get("/users/{user_id}/analytics", response_model=UserAnalyticsResponse)
def get_user_analytics(
    user_id: UUID,
    start_date: date = Query(...),
    end_date: date = Query(...),
    team_id: Optional[UUID] = Query(None, description="Filter by specific team"),
    compare_previous: bool = Query(True),
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_user)
):
    """Get individual user analytics"""
    
    # Check permissions (users can only view their own analytics, or admins can view any)
    if user_id != current_user.id:
        # Check if current user is admin of any shared team
        shared_teams = db.query(TeamMembership.team_id).filter(
            and_(
                TeamMembership.user_id == current_user.id,
                TeamMembership.role.in_(["owner", "admin"]),
                TeamMembership.status == "active"
            )
        ).subquery()
        
        target_user_teams = db.query(TeamMembership).filter(
            and_(
                TeamMembership.user_id == user_id,
                TeamMembership.team_id.in_(shared_teams),
                TeamMembership.status == "active"
            )
        ).first()
        
        if not target_user_teams:
            raise HTTPException(
                status_code=403,
                detail="Insufficient permissions to view user analytics"
            )
    
    # Get target user
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Calculate analytics
    analytics_data = analytics_service.calculate_user_analytics(
        db=db,
        user_id=user_id,
        start_date=start_date,
        end_date=end_date,
        team_id=team_id,
        compare_previous=compare_previous
    )
    
    return UserAnalyticsResponse(
        user_id=user_id,
        user_name=user.full_name or user.email,
        **analytics_data
    )


@router.get("/teams/{team_id}/insights", response_model=AnalyticsInsightsResponse)
def get_team_insights(
    team_id: UUID,
    status: str = Query("active", regex="^(active|dismissed|all)$"),
    category: Optional[str] = Query(None),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_user)
):
    """Get AI-generated insights for the team"""
    
    # Check permissions
    membership = db.query(TeamMembership).filter(
        and_(
            TeamMembership.team_id == team_id,
            TeamMembership.user_id == current_user.id,
            TeamMembership.status == "active"
        )
    ).first()
    
    if not membership:
        raise HTTPException(status_code=404, detail="Team not found")
    
    # Build query
    query = db.query(AnalyticsInsight).filter(AnalyticsInsight.team_id == team_id)
    
    if status != "all":
        query = query.filter(AnalyticsInsight.status == status)
    
    if category:
        query = query.filter(AnalyticsInsight.category == category)
    
    # Get counts
    total = query.count()
    active_count = db.query(AnalyticsInsight).filter(
        and_(
            AnalyticsInsight.team_id == team_id,
            AnalyticsInsight.status == "active"
        )
    ).count()
    dismissed_count = db.query(AnalyticsInsight).filter(
        and_(
            AnalyticsInsight.team_id == team_id,
            AnalyticsInsight.status == "dismissed"
        )
    ).count()
    
    # Get insights with pagination
    insights = query.order_by(
        desc(AnalyticsInsight.impact_score),
        desc(AnalyticsInsight.created_at)
    ).offset(offset).limit(limit).all()
    
    return AnalyticsInsightsResponse(
        insights=insights,
        total=total,
        active_count=active_count,
        dismissed_count=dismissed_count
    )


@router.post("/teams/{team_id}/insights/generate")
def generate_team_insights(
    team_id: UUID,
    background_tasks: BackgroundTasks,
    force_regenerate: bool = Query(False, description="Force regeneration of recent insights"),
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_user)
):
    """Generate AI insights for the team"""
    
    # Check permissions (admin/owner only)
    membership = db.query(TeamMembership).filter(
        and_(
            TeamMembership.team_id == team_id,
            TeamMembership.user_id == current_user.id,
            TeamMembership.role.in_(["owner", "admin"]),
            TeamMembership.status == "active"
        )
    ).first()
    
    if not membership:
        raise HTTPException(
            status_code=403,
            detail="Insufficient permissions to generate insights"
        )
    
    # Check if insights were recently generated (unless forced)
    if not force_regenerate:
        recent_insights = db.query(AnalyticsInsight).filter(
            and_(
                AnalyticsInsight.team_id == team_id,
                AnalyticsInsight.created_at > datetime.utcnow() - timedelta(hours=6)
            )
        ).first()
        
        if recent_insights:
            raise HTTPException(
                status_code=429,
                detail="Insights were recently generated. Use force_regenerate=true to override."
            )
    
    # Schedule insight generation
    background_tasks.add_task(
        analytics_service.generate_team_insights,
        db=db,
        team_id=team_id,
        force_regenerate=force_regenerate
    )
    
    return {"message": "Insight generation started", "team_id": team_id}


@router.put("/insights/{insight_id}/dismiss")
def dismiss_insight(
    insight_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_user)
):
    """Dismiss an analytics insight"""
    
    insight = db.query(AnalyticsInsight).filter(AnalyticsInsight.id == insight_id).first()
    if not insight:
        raise HTTPException(status_code=404, detail="Insight not found")
    
    # Check permissions
    if insight.team_id:
        membership = db.query(TeamMembership).filter(
            and_(
                TeamMembership.team_id == insight.team_id,
                TeamMembership.user_id == current_user.id,
                TeamMembership.status == "active"
            )
        ).first()
        if not membership:
            raise HTTPException(status_code=404, detail="Insight not found")
    elif insight.user_id:
        if insight.user_id != current_user.id:
            raise HTTPException(status_code=404, detail="Insight not found")
    
    # Dismiss insight
    insight.status = "dismissed"
    insight.dismissed_at = datetime.utcnow()
    
    db.commit()
    
    return {"message": "Insight dismissed"}


@router.get("/teams/{team_id}/live", response_model=LiveDashboardData)
def get_live_dashboard_data(
    team_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_user)
):
    """Get real-time dashboard data for live updates"""
    
    # Check permissions
    membership = db.query(TeamMembership).filter(
        and_(
            TeamMembership.team_id == team_id,
            TeamMembership.user_id == current_user.id,
            TeamMembership.status == "active"
        )
    ).first()
    
    if not membership:
        raise HTTPException(status_code=404, detail="Team not found")
    
    # Get real-time metrics
    live_data = analytics_service.get_live_dashboard_data(db=db, team_id=team_id)
    
    return live_data


@router.post("/teams/{team_id}/export", response_model=AnalyticsExportResponse)
def export_analytics_data(
    team_id: UUID,
    export_request: AnalyticsExportRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_user)
):
    """Export analytics data in various formats"""
    
    # Check permissions
    membership = db.query(TeamMembership).filter(
        and_(
            TeamMembership.team_id == team_id,
            TeamMembership.user_id == current_user.id,
            TeamMembership.status == "active"
        )
    ).first()
    
    if not membership:
        raise HTTPException(status_code=404, detail="Team not found")
    
    # Generate export ID
    export_id = UUID()
    
    # Schedule export task
    background_tasks.add_task(
        export_analytics_data_task,
        export_id=export_id,
        team_id=team_id,
        user_id=current_user.id,
        export_request=export_request.dict()
    )
    
    return AnalyticsExportResponse(
        export_id=export_id,
        download_url=f"{settings.FRONTEND_URL}/api/v1/analytics/exports/{export_id}/download",
        expires_at=datetime.utcnow() + timedelta(hours=24),
        file_size=0,  # Will be updated when export completes
        format=export_request.format
    )


@router.get("/teams/{team_id}/reports", response_model=List[CustomReport])
def get_custom_reports(
    team_id: UUID,
    active_only: bool = Query(True),
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_user)
):
    """Get custom analytics reports for the team"""
    
    # Check permissions
    membership = db.query(TeamMembership).filter(
        and_(
            TeamMembership.team_id == team_id,
            TeamMembership.user_id == current_user.id,
            TeamMembership.status == "active"
        )
    ).first()
    
    if not membership:
        raise HTTPException(status_code=404, detail="Team not found")
    
    query = db.query(AnalyticsReport).filter(AnalyticsReport.team_id == team_id)
    
    if active_only:
        query = query.filter(AnalyticsReport.is_active == True)
    
    reports = query.order_by(desc(AnalyticsReport.created_at)).all()
    
    return reports


@router.post("/teams/{team_id}/reports", response_model=CustomReport)
def create_custom_report(
    team_id: UUID,
    report_config: CustomReportConfig,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_user)
):
    """Create a custom analytics report"""
    
    # Check permissions (admin/owner only)
    membership = db.query(TeamMembership).filter(
        and_(
            TeamMembership.team_id == team_id,
            TeamMembership.user_id == current_user.id,
            TeamMembership.role.in_(["owner", "admin"]),
            TeamMembership.status == "active"
        )
    ).first()
    
    if not membership:
        raise HTTPException(
            status_code=403,
            detail="Insufficient permissions to create reports"
        )
    
    # Create report
    report = AnalyticsReport(
        team_id=team_id,
        created_by_id=current_user.id,
        name=report_config.name,
        description=report_config.description,
        report_type=report_config.report_type,
        config=json.dumps({
            "metrics": report_config.metrics,
            "filters": report_config.filters,
            "chart_configs": report_config.chart_configs
        }),
        recipients=json.dumps(report_config.recipients) if report_config.recipients else None,
        schedule_type=report_config.schedule_type,
        schedule_config=json.dumps({"recipients": report_config.recipients}) if report_config.recipients else None
    )
    
    # Set next generation time for scheduled reports
    if report.schedule_type != "manual":
        report.next_generation_at = analytics_service.calculate_next_generation_time(
            report.schedule_type
        )
    
    db.add(report)
    db.commit()
    db.refresh(report)
    
    return report


@router.put("/reports/{report_id}", response_model=CustomReport)
def update_custom_report(
    report_id: UUID,
    report_config: CustomReportConfig,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_user)
):
    """Update a custom analytics report"""
    
    report = db.query(AnalyticsReport).filter(AnalyticsReport.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    
    # Check permissions
    membership = db.query(TeamMembership).filter(
        and_(
            TeamMembership.team_id == report.team_id,
            TeamMembership.user_id == current_user.id,
            TeamMembership.role.in_(["owner", "admin"]),
            TeamMembership.status == "active"
        )
    ).first()
    
    if not membership:
        raise HTTPException(
            status_code=403,
            detail="Insufficient permissions to update report"
        )
    
    # Update report
    report.name = report_config.name
    report.description = report_config.description
    report.report_type = report_config.report_type
    report.config = json.dumps({
        "metrics": report_config.metrics,
        "filters": report_config.filters,
        "chart_configs": report_config.chart_configs
    })
    report.recipients = json.dumps(report_config.recipients) if report_config.recipients else None
    report.schedule_type = report_config.schedule_type
    report.schedule_config = json.dumps({"recipients": report_config.recipients}) if report_config.recipients else None
    
    # Update next generation time if schedule changed
    if report.schedule_type != "manual":
        report.next_generation_at = analytics_service.calculate_next_generation_time(
            report.schedule_type
        )
    else:
        report.next_generation_at = None
    
    db.commit()
    db.refresh(report)
    
    return report


@router.delete("/reports/{report_id}")
def delete_custom_report(
    report_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_user)
):
    """Delete a custom analytics report"""
    
    report = db.query(AnalyticsReport).filter(AnalyticsReport.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    
    # Check permissions
    membership = db.query(TeamMembership).filter(
        and_(
            TeamMembership.team_id == report.team_id,
            TeamMembership.user_id == current_user.id,
            TeamMembership.role.in_(["owner", "admin"]),
            TeamMembership.status == "active"
        )
    ).first()
    
    if not membership:
        raise HTTPException(
            status_code=403,
            detail="Insufficient permissions to delete report"
        )
    
    db.delete(report)
    db.commit()
    
    return {"message": "Report deleted successfully"}


@router.post("/reports/{report_id}/generate")
def generate_custom_report(
    report_id: UUID,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_user)
):
    """Manually generate a custom report"""
    
    report = db.query(AnalyticsReport).filter(AnalyticsReport.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    
    # Check permissions
    membership = db.query(TeamMembership).filter(
        and_(
            TeamMembership.team_id == report.team_id,
            TeamMembership.user_id == current_user.id,
            TeamMembership.status == "active"
        )
    ).first()
    
    if not membership:
        raise HTTPException(status_code=404, detail="Report not found")
    
    # Schedule report generation
    background_tasks.add_task(
        generate_analytics_report_task,
        report_id=report_id,
        manual_trigger=True,
        triggered_by_user_id=current_user.id
    )
    
    return {"message": "Report generation started", "report_id": report_id}