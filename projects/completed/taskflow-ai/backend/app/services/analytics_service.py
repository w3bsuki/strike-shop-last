from typing import List, Optional, Dict, Any, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func, desc, asc, extract, text
from uuid import UUID
from datetime import datetime, date, timedelta
import json
import logging
from statistics import mean, median

from app.models import (
    Team, User, TeamMembership, Task, Project, Activity, Comment,
    TeamAnalytics, UserAnalytics, AnalyticsInsight
)
from app.schemas.analytics import (
    TeamProductivityMetrics, UserProductivityMetrics, DashboardMetrics,
    TeamMemberPerformance, RealTimeMetrics, LiveDashboardData
)
from app.services.ai_service import ai_service

logger = logging.getLogger(__name__)


class AnalyticsService:
    """Service for calculating analytics and generating insights"""
    
    def calculate_team_dashboard_metrics(
        self,
        db: Session,
        team_id: UUID,
        start_date: date,
        end_date: date
    ) -> Dict[str, Any]:
        """Calculate dashboard metrics for a team"""
        
        # Base query for team tasks within date range
        base_query = db.query(Task).filter(
            and_(
                Task.team_id == team_id,
                Task.created_at >= start_date,
                Task.created_at <= end_date
            )
        )
        
        # Calculate basic metrics
        total_tasks = base_query.count()
        completed_tasks = base_query.filter(Task.status == "completed").count()
        in_progress_tasks = base_query.filter(Task.status == "in_progress").count()
        
        # Calculate overdue tasks
        overdue_tasks = base_query.filter(
            and_(
                Task.due_date < datetime.utcnow(),
                Task.status.in_(["todo", "in_progress"])
            )
        ).count()
        
        # Calculate completion rate
        completion_rate = (completed_tasks / total_tasks * 100) if total_tasks > 0 else 0
        
        # Calculate average completion time
        completed_tasks_with_time = db.query(Task).filter(
            and_(
                Task.team_id == team_id,
                Task.status == "completed",
                Task.completed_at.isnot(None),
                Task.created_at >= start_date,
                Task.created_at <= end_date
            )
        ).all()
        
        avg_completion_time = None
        if completed_tasks_with_time:
            completion_times = []
            for task in completed_tasks_with_time:
                if task.completed_at and task.created_at:
                    delta = task.completed_at - task.created_at
                    completion_times.append(delta.total_seconds() / 3600)  # hours
            
            if completion_times:
                avg_completion_time = mean(completion_times)
        
        # Get productivity trend (daily data for the period)
        productivity_trend = self._calculate_productivity_trend(
            db, team_id, start_date, end_date
        )
        
        # Get recent activities
        recent_activities = db.query(Activity).filter(
            Activity.team_id == team_id
        ).order_by(desc(Activity.created_at)).limit(10).all()
        
        activity_data = []
        for activity in recent_activities:
            activity_data.append({
                "id": str(activity.id),
                "user_name": activity.user.full_name or activity.user.email,
                "action": activity.action,
                "details": activity.details,
                "created_at": activity.created_at.isoformat()
            })
        
        metrics = DashboardMetrics(
            total_tasks=total_tasks,
            completed_tasks=completed_tasks,
            in_progress_tasks=in_progress_tasks,
            overdue_tasks=overdue_tasks,
            completion_rate=completion_rate,
            avg_completion_time=avg_completion_time,
            productivity_trend=productivity_trend,
            recent_activities=activity_data
        )
        
        # Generate performance chart data
        performance_chart_data = self._generate_performance_chart_data(
            db, team_id, start_date, end_date
        )
        
        return {
            "metrics": metrics,
            "performance_chart_data": performance_chart_data
        }
    
    def calculate_team_analytics(
        self,
        db: Session,
        team_id: UUID,
        start_date: date,
        end_date: date,
        compare_previous: bool = True
    ) -> Dict[str, Any]:
        """Calculate comprehensive team analytics"""
        
        # Current period metrics
        current_metrics = self._calculate_team_period_metrics(
            db, team_id, start_date, end_date
        )
        
        # Previous period metrics for comparison
        previous_metrics = None
        trends = {}
        
        if compare_previous:
            period_duration = end_date - start_date
            prev_end_date = start_date - timedelta(days=1)
            prev_start_date = prev_end_date - period_duration
            
            previous_metrics = self._calculate_team_period_metrics(
                db, team_id, prev_start_date, prev_end_date
            )
            
            # Calculate trends (percentage change)
            trends = self._calculate_trends(current_metrics, previous_metrics)
        
        # Generate insights and recommendations
        insights = self._generate_team_insights_text(current_metrics, previous_metrics)
        recommendations = self._generate_team_recommendations(current_metrics, previous_metrics)
        
        return {
            "current_period": current_metrics,
            "previous_period": previous_metrics,
            "trends": trends,
            "insights": insights,
            "recommendations": recommendations
        }
    
    def calculate_user_analytics(
        self,
        db: Session,
        user_id: UUID,
        start_date: date,
        end_date: date,
        team_id: Optional[UUID] = None,
        compare_previous: bool = True
    ) -> Dict[str, Any]:
        """Calculate individual user analytics"""
        
        # Current period metrics
        current_metrics = self._calculate_user_period_metrics(
            db, user_id, start_date, end_date, team_id
        )
        
        # Previous period metrics for comparison
        previous_metrics = None
        trends = {}
        
        if compare_previous:
            period_duration = end_date - start_date
            prev_end_date = start_date - timedelta(days=1)
            prev_start_date = prev_end_date - period_duration
            
            previous_metrics = self._calculate_user_period_metrics(
                db, user_id, prev_start_date, prev_end_date, team_id
            )
            
            trends = self._calculate_trends(current_metrics, previous_metrics)
        
        # Calculate team ranking if team_id provided
        team_ranking = None
        if team_id:
            team_ranking = self._calculate_user_team_ranking(
                db, user_id, team_id, start_date, end_date
            )
        
        # Generate insights
        insights = self._generate_user_insights_text(current_metrics, previous_metrics)
        
        return {
            "current_period": current_metrics,
            "previous_period": previous_metrics,
            "trends": trends,
            "team_ranking": team_ranking,
            "insights": insights
        }
    
    def calculate_team_performance_report(
        self,
        db: Session,
        team_id: UUID,
        start_date: date,
        end_date: date,
        sort_by: str = "productivity_score",
        order: str = "desc"
    ) -> Dict[str, Any]:
        """Calculate team performance report with member rankings"""
        
        # Get team members
        members = db.query(User).join(TeamMembership).filter(
            and_(
                TeamMembership.team_id == team_id,
                TeamMembership.status == "active"
            )
        ).all()
        
        member_performances = []
        
        for member in members:
            # Calculate member metrics
            metrics = self._calculate_user_period_metrics(
                db, member.id, start_date, end_date, team_id
            )
            
            # Calculate collaboration score
            collaboration_score = self._calculate_collaboration_score(
                db, member.id, team_id, start_date, end_date
            )
            
            member_performance = TeamMemberPerformance(
                user_id=member.id,
                user_name=member.full_name or member.email,
                user_avatar_url=member.avatar_url,
                tasks_completed=metrics.tasks_completed,
                productivity_score=metrics.productivity_score,
                avg_completion_time_hours=metrics.avg_completion_time_hours,
                collaboration_score=collaboration_score
            )
            
            member_performances.append(member_performance)
        
        # Sort members
        reverse_order = order == "desc"
        if sort_by == "tasks_completed":
            member_performances.sort(key=lambda x: x.tasks_completed, reverse=reverse_order)
        elif sort_by == "productivity_score":
            member_performances.sort(
                key=lambda x: x.productivity_score or 0, reverse=reverse_order
            )
        elif sort_by == "avg_completion_time":
            member_performances.sort(
                key=lambda x: x.avg_completion_time_hours or float('inf'), 
                reverse=not reverse_order  # Lower is better for completion time
            )
        
        # Calculate team averages
        team_averages = self._calculate_team_period_metrics(
            db, team_id, start_date, end_date
        )
        
        # Get top performers (top 3)
        top_performers = member_performances[:3] if member_performances else []
        
        # Generate improvement areas
        improvement_areas = self._generate_team_improvement_areas(
            member_performances, team_averages
        )
        
        return {
            "members": member_performances,
            "team_averages": team_averages,
            "top_performers": top_performers,
            "improvement_areas": improvement_areas
        }
    
    def get_live_dashboard_data(self, db: Session, team_id: UUID) -> LiveDashboardData:
        """Get real-time dashboard data"""
        
        now = datetime.utcnow()
        today = now.date()
        
        # Current metrics
        active_users = db.query(func.count(func.distinct(Activity.user_id))).filter(
            and_(
                Activity.team_id == team_id,
                Activity.created_at >= now - timedelta(hours=1)
            )
        ).scalar() or 0
        
        tasks_completed_today = db.query(Task).filter(
            and_(
                Task.team_id == team_id,
                Task.status == "completed",
                func.date(Task.completed_at) == today
            )
        ).count()
        
        new_tasks_today = db.query(Task).filter(
            and_(
                Task.team_id == team_id,
                func.date(Task.created_at) == today
            )
        ).count()
        
        # Team activity score (based on recent activities)
        recent_activities = db.query(Activity).filter(
            and_(
                Activity.team_id == team_id,
                Activity.created_at >= now - timedelta(hours=24)
            )
        ).count()
        
        team_activity_score = min(recent_activities / 10.0, 10.0)  # Scale to 0-10
        
        current_metrics = RealTimeMetrics(
            timestamp=now,
            active_users=active_users,
            tasks_completed_today=tasks_completed_today,
            new_tasks_today=new_tasks_today,
            team_activity_score=team_activity_score
        )
        
        # Hourly activity for the last 24 hours
        hourly_activity = self._get_hourly_activity(db, team_id, now - timedelta(hours=24), now)
        
        # Recent completions
        recent_completions = db.query(Task).filter(
            and_(
                Task.team_id == team_id,
                Task.status == "completed",
                Task.completed_at >= now - timedelta(hours=6)
            )
        ).order_by(desc(Task.completed_at)).limit(5).all()
        
        completion_data = []
        for task in recent_completions:
            completion_data.append({
                "task_id": str(task.id),
                "task_title": task.title,
                "completed_by": task.assignee.full_name if task.assignee else "Unknown",
                "completed_at": task.completed_at.isoformat()
            })
        
        # Active members (recently active)
        active_members = db.query(User).join(Activity).filter(
            and_(
                Activity.team_id == team_id,
                Activity.created_at >= now - timedelta(hours=2)
            )
        ).distinct().limit(10).all()
        
        member_data = []
        for member in active_members:
            member_data.append({
                "user_id": str(member.id),
                "user_name": member.full_name or member.email,
                "user_avatar_url": member.avatar_url,
                "last_activity": self._get_user_last_activity(db, member.id, team_id)
            })
        
        return LiveDashboardData(
            current_metrics=current_metrics,
            hourly_activity=hourly_activity,
            recent_completions=completion_data,
            active_members=member_data
        )
    
    async def generate_team_insights(
        self,
        db: Session,
        team_id: UUID,
        force_regenerate: bool = False
    ):
        """Generate AI-powered insights for a team"""
        
        try:
            # Get team data for the last 30 days
            end_date = datetime.utcnow().date()
            start_date = end_date - timedelta(days=30)
            
            team_data = self.calculate_team_analytics(
                db, team_id, start_date, end_date, compare_previous=True
            )
            
            # Get team context
            team = db.query(Team).filter(Team.id == team_id).first()
            member_count = db.query(TeamMembership).filter(
                and_(TeamMembership.team_id == team_id, TeamMembership.status == "active")
            ).count()
            
            # Prepare data for AI analysis
            analysis_data = {
                "team_name": team.name,
                "member_count": member_count,
                "metrics": team_data["current_period"].__dict__,
                "trends": team_data["trends"],
                "period": f"{start_date} to {end_date}"
            }
            
            # Generate insights using AI
            insights = await ai_service.generate_team_insights(analysis_data)
            
            # Save insights to database
            for insight_data in insights:
                existing_insight = db.query(AnalyticsInsight).filter(
                    and_(
                        AnalyticsInsight.team_id == team_id,
                        AnalyticsInsight.type == insight_data["type"],
                        AnalyticsInsight.category == insight_data["category"],
                        AnalyticsInsight.created_at >= datetime.utcnow() - timedelta(days=7)
                    )
                ).first()
                
                if existing_insight and not force_regenerate:
                    continue
                
                insight = AnalyticsInsight(
                    team_id=team_id,
                    type=insight_data["type"],
                    category=insight_data["category"],
                    title=insight_data["title"],
                    description=insight_data["description"],
                    supporting_data=json.dumps(insight_data.get("supporting_data", {})),
                    confidence_score=insight_data.get("confidence_score", 0.8),
                    impact_score=insight_data.get("impact_score", 0.5),
                    is_actionable=insight_data.get("is_actionable", False)
                )
                
                db.add(insight)
            
            db.commit()
            logger.info(f"Generated {len(insights)} insights for team {team_id}")
            
        except Exception as e:
            logger.error(f"Failed to generate insights for team {team_id}: {e}")
    
    def calculate_next_generation_time(self, schedule_type: str) -> datetime:
        """Calculate next generation time for scheduled reports"""
        
        now = datetime.utcnow()
        
        if schedule_type == "daily":
            return now + timedelta(days=1)
        elif schedule_type == "weekly":
            # Next Monday
            days_ahead = 7 - now.weekday()
            if days_ahead == 7:
                days_ahead = 0
            return (now + timedelta(days=days_ahead)).replace(hour=9, minute=0, second=0, microsecond=0)
        elif schedule_type == "monthly":
            # First day of next month
            if now.month == 12:
                return now.replace(year=now.year + 1, month=1, day=1, hour=9, minute=0, second=0, microsecond=0)
            else:
                return now.replace(month=now.month + 1, day=1, hour=9, minute=0, second=0, microsecond=0)
        
        return now + timedelta(days=1)
    
    # Private helper methods
    
    def _calculate_team_period_metrics(
        self,
        db: Session,
        team_id: UUID,
        start_date: date,
        end_date: date
    ) -> TeamProductivityMetrics:
        """Calculate team metrics for a specific period"""
        
        # Convert dates to datetime for database queries
        start_datetime = datetime.combine(start_date, datetime.min.time())
        end_datetime = datetime.combine(end_date, datetime.max.time())
        
        # Task metrics
        tasks_created = db.query(Task).filter(
            and_(
                Task.team_id == team_id,
                Task.created_at >= start_datetime,
                Task.created_at <= end_datetime
            )
        ).count()
        
        tasks_completed = db.query(Task).filter(
            and_(
                Task.team_id == team_id,
                Task.status == "completed",
                Task.completed_at >= start_datetime,
                Task.completed_at <= end_datetime
            )
        ).count()
        
        tasks_in_progress = db.query(Task).filter(
            and_(
                Task.team_id == team_id,
                Task.status == "in_progress",
                Task.created_at <= end_datetime
            )
        ).count()
        
        tasks_overdue = db.query(Task).filter(
            and_(
                Task.team_id == team_id,
                Task.due_date < end_datetime,
                Task.status.in_(["todo", "in_progress"])
            )
        ).count()
        
        # Calculate average completion time
        completed_tasks = db.query(Task).filter(
            and_(
                Task.team_id == team_id,
                Task.status == "completed",
                Task.completed_at >= start_datetime,
                Task.completed_at <= end_datetime,
                Task.created_at.isnot(None),
                Task.completed_at.isnot(None)
            )
        ).all()
        
        avg_completion_time_hours = None
        if completed_tasks:
            completion_times = []
            for task in completed_tasks:
                delta = task.completed_at - task.created_at
                completion_times.append(delta.total_seconds() / 3600)
            avg_completion_time_hours = mean(completion_times)
        
        # Calculate productivity score (0-100)
        productivity_score = None
        if tasks_created > 0:
            completion_rate = tasks_completed / tasks_created
            overdue_rate = tasks_overdue / tasks_created if tasks_created > 0 else 0
            productivity_score = max(0, min(100, (completion_rate * 100) - (overdue_rate * 20)))
        
        # Calculate velocity (tasks per day)
        period_days = (end_date - start_date).days + 1
        velocity = tasks_completed / period_days if period_days > 0 else 0
        
        # Active members
        active_members = db.query(func.count(func.distinct(Activity.user_id))).filter(
            and_(
                Activity.team_id == team_id,
                Activity.created_at >= start_datetime,
                Activity.created_at <= end_datetime
            )
        ).scalar() or 0
        
        # Comments and mentions
        comments_count = db.query(Comment).join(Task).filter(
            and_(
                Task.team_id == team_id,
                Comment.created_at >= start_datetime,
                Comment.created_at <= end_datetime
            )
        ).count()
        
        # For mentions, we would need to parse comment content
        mentions_count = 0  # Simplified for now
        
        return TeamProductivityMetrics(
            period_start=start_datetime,
            period_end=end_datetime,
            tasks_created=tasks_created,
            tasks_completed=tasks_completed,
            tasks_in_progress=tasks_in_progress,
            tasks_overdue=tasks_overdue,
            avg_completion_time_hours=avg_completion_time_hours,
            productivity_score=productivity_score,
            velocity=velocity,
            active_members=active_members,
            comments_count=comments_count,
            mentions_count=mentions_count
        )
    
    def _calculate_user_period_metrics(
        self,
        db: Session,
        user_id: UUID,
        start_date: date,
        end_date: date,
        team_id: Optional[UUID] = None
    ) -> UserProductivityMetrics:
        """Calculate user metrics for a specific period"""
        
        start_datetime = datetime.combine(start_date, datetime.min.time())
        end_datetime = datetime.combine(end_date, datetime.max.time())
        
        # Base query
        base_query = db.query(Task)
        if team_id:
            base_query = base_query.filter(Task.team_id == team_id)
        
        # Task metrics
        tasks_created = base_query.filter(
            and_(
                Task.creator_id == user_id,
                Task.created_at >= start_datetime,
                Task.created_at <= end_datetime
            )
        ).count()
        
        tasks_completed = base_query.filter(
            and_(
                Task.assignee_id == user_id,
                Task.status == "completed",
                Task.completed_at >= start_datetime,
                Task.completed_at <= end_datetime
            )
        ).count()
        
        tasks_assigned = base_query.filter(
            and_(
                Task.assignee_id == user_id,
                Task.created_at >= start_datetime,
                Task.created_at <= end_datetime
            )
        ).count()
        
        # Calculate completion time and productivity
        completed_user_tasks = base_query.filter(
            and_(
                Task.assignee_id == user_id,
                Task.status == "completed",
                Task.completed_at >= start_datetime,
                Task.completed_at <= end_datetime,
                Task.created_at.isnot(None),
                Task.completed_at.isnot(None)
            )
        ).all()
        
        avg_completion_time_hours = None
        if completed_user_tasks:
            completion_times = []
            for task in completed_user_tasks:
                delta = task.completed_at - task.created_at
                completion_times.append(delta.total_seconds() / 3600)
            avg_completion_time_hours = mean(completion_times)
        
        # Simple productivity score
        productivity_score = None
        if tasks_assigned > 0:
            completion_rate = tasks_completed / tasks_assigned
            productivity_score = completion_rate * 100
        
        # Focus time (simplified - based on task completion patterns)
        focus_time_hours = None
        if completed_user_tasks:
            focus_time_hours = len(completed_user_tasks) * 2  # Assume 2 hours per task
        
        # Comments made
        comments_made = db.query(Comment).join(Task).filter(
            and_(
                Comment.author_id == user_id,
                Comment.created_at >= start_datetime,
                Comment.created_at <= end_datetime
            )
        )
        if team_id:
            comments_made = comments_made.filter(Task.team_id == team_id)
        comments_made = comments_made.count()
        
        # Mentions received (simplified)
        mentions_received = 0
        
        # Activity metrics
        activity_query = db.query(Activity).filter(
            and_(
                Activity.user_id == user_id,
                Activity.created_at >= start_datetime,
                Activity.created_at <= end_datetime
            )
        )
        if team_id:
            activity_query = activity_query.filter(Activity.team_id == team_id)
        
        login_count = activity_query.filter(Activity.action == "login").count()
        active_days = activity_query.with_entities(
            func.count(func.distinct(func.date(Activity.created_at)))
        ).scalar() or 0
        
        return UserProductivityMetrics(
            period_start=start_datetime,
            period_end=end_datetime,
            tasks_created=tasks_created,
            tasks_completed=tasks_completed,
            tasks_assigned=tasks_assigned,
            avg_completion_time_hours=avg_completion_time_hours,
            productivity_score=productivity_score,
            focus_time_hours=focus_time_hours,
            comments_made=comments_made,
            mentions_received=mentions_received,
            login_count=login_count,
            active_days=active_days
        )
    
    def _calculate_trends(self, current: Any, previous: Any) -> Dict[str, float]:
        """Calculate percentage trends between current and previous metrics"""
        
        trends = {}
        
        if not previous:
            return trends
        
        # Define metrics to compare
        metrics_to_compare = [
            'tasks_created', 'tasks_completed', 'tasks_in_progress', 'tasks_overdue',
            'productivity_score', 'velocity', 'active_members', 'comments_count'
        ]
        
        for metric in metrics_to_compare:
            current_value = getattr(current, metric, 0) or 0
            previous_value = getattr(previous, metric, 0) or 0
            
            if previous_value > 0:
                change = ((current_value - previous_value) / previous_value) * 100
                trends[metric] = round(change, 2)
            elif current_value > 0:
                trends[metric] = 100.0  # New metric appeared
            else:
                trends[metric] = 0.0
        
        return trends
    
    def _generate_team_insights_text(self, current: Any, previous: Any) -> List[str]:
        """Generate text insights for team analytics"""
        
        insights = []
        
        if current.productivity_score:
            if current.productivity_score >= 80:
                insights.append("Your team is performing exceptionally well with high productivity scores!")
            elif current.productivity_score >= 60:
                insights.append("Good team performance with room for improvement in task completion rates.")
            else:
                insights.append("Team productivity could be improved - consider reviewing workload distribution.")
        
        if current.tasks_overdue > 0:
            overdue_percentage = (current.tasks_overdue / current.tasks_created) * 100 if current.tasks_created > 0 else 0
            if overdue_percentage > 20:
                insights.append(f"High number of overdue tasks ({overdue_percentage:.1f}%) - consider deadline management.")
        
        if current.avg_completion_time_hours:
            if current.avg_completion_time_hours > 72:  # More than 3 days
                insights.append("Tasks are taking longer than expected to complete - consider breaking down complex tasks.")
        
        return insights
    
    def _generate_team_recommendations(self, current: Any, previous: Any) -> List[str]:
        """Generate recommendations for team improvement"""
        
        recommendations = []
        
        if current.productivity_score and current.productivity_score < 70:
            recommendations.append("Schedule a team retrospective to identify bottlenecks and improvement opportunities.")
        
        if current.tasks_overdue > current.tasks_completed:
            recommendations.append("Implement better deadline planning and regular task review meetings.")
        
        if current.active_members < (current.tasks_created / 10):  # Low activity ratio
            recommendations.append("Encourage more team collaboration and task participation.")
        
        if current.comments_count < current.tasks_completed:
            recommendations.append("Promote more communication through task comments and updates.")
        
        return recommendations
    
    def _generate_user_insights_text(self, current: Any, previous: Any) -> List[str]:
        """Generate text insights for user analytics"""
        
        insights = []
        
        if current.productivity_score:
            if current.productivity_score >= 90:
                insights.append("Excellent productivity! You're completing tasks efficiently.")
            elif current.productivity_score >= 70:
                insights.append("Good productivity with consistent task completion.")
            else:
                insights.append("Consider focusing on completing assigned tasks to improve productivity.")
        
        if current.tasks_completed > 0 and current.avg_completion_time_hours:
            if current.avg_completion_time_hours < 24:
                insights.append("You're completing tasks quickly - great efficiency!")
            elif current.avg_completion_time_hours > 120:
                insights.append("Tasks are taking longer to complete - consider time management strategies.")
        
        return insights
    
    def _calculate_collaboration_score(
        self,
        db: Session,
        user_id: UUID,
        team_id: UUID,
        start_date: date,
        end_date: date
    ) -> float:
        """Calculate collaboration score based on comments, mentions, and team interactions"""
        
        start_datetime = datetime.combine(start_date, datetime.min.time())
        end_datetime = datetime.combine(end_date, datetime.max.time())
        
        # Comments made on others' tasks
        comments_score = db.query(Comment).join(Task).filter(
            and_(
                Comment.author_id == user_id,
                Task.team_id == team_id,
                Task.assignee_id != user_id,  # Commenting on others' tasks
                Comment.created_at >= start_datetime,
                Comment.created_at <= end_datetime
            )
        ).count()
        
        # Normalize to 0-100 scale
        collaboration_score = min(100, comments_score * 10)
        
        return collaboration_score
    
    def _calculate_user_team_ranking(
        self,
        db: Session,
        user_id: UUID,
        team_id: UUID,
        start_date: date,
        end_date: date
    ) -> Optional[int]:
        """Calculate user's ranking within the team"""
        
        # Get all team members and their completion counts
        members_performance = db.query(
            User.id,
            func.count(Task.id).label('completed_tasks')
        ).join(TeamMembership).outerjoin(Task, and_(
            Task.assignee_id == User.id,
            Task.status == "completed",
            Task.completed_at >= datetime.combine(start_date, datetime.min.time()),
            Task.completed_at <= datetime.combine(end_date, datetime.max.time())
        )).filter(
            and_(
                TeamMembership.team_id == team_id,
                TeamMembership.status == "active"
            )
        ).group_by(User.id).order_by(desc('completed_tasks')).all()
        
        # Find user's rank
        for rank, (member_id, _) in enumerate(members_performance, 1):
            if member_id == user_id:
                return rank
        
        return None
    
    def _calculate_productivity_trend(
        self,
        db: Session,
        team_id: UUID,
        start_date: date,
        end_date: date
    ) -> List[Dict[str, Any]]:
        """Calculate daily productivity trend"""
        
        trend_data = []
        current_date = start_date
        
        while current_date <= end_date:
            day_start = datetime.combine(current_date, datetime.min.time())
            day_end = datetime.combine(current_date, datetime.max.time())
            
            completed = db.query(Task).filter(
                and_(
                    Task.team_id == team_id,
                    Task.status == "completed",
                    Task.completed_at >= day_start,
                    Task.completed_at <= day_end
                )
            ).count()
            
            created = db.query(Task).filter(
                and_(
                    Task.team_id == team_id,
                    Task.created_at >= day_start,
                    Task.created_at <= day_end
                )
            ).count()
            
            trend_data.append({
                "date": current_date.isoformat(),
                "tasks_completed": completed,
                "tasks_created": created,
                "completion_rate": (completed / created * 100) if created > 0 else 0
            })
            
            current_date += timedelta(days=1)
        
        return trend_data
    
    def _generate_performance_chart_data(
        self,
        db: Session,
        team_id: UUID,
        start_date: date,
        end_date: date
    ) -> List[Dict[str, Any]]:
        """Generate performance chart data for visualization"""
        
        # Weekly aggregation for longer periods
        chart_data = []
        period_length = (end_date - start_date).days
        
        if period_length > 30:
            # Weekly aggregation
            current_date = start_date
            while current_date <= end_date:
                week_end = min(current_date + timedelta(days=6), end_date)
                
                week_data = self._calculate_team_period_metrics(
                    db, team_id, current_date, week_end
                )
                
                chart_data.append({
                    "period": f"{current_date.isoformat()} - {week_end.isoformat()}",
                    "productivity_score": week_data.productivity_score,
                    "velocity": week_data.velocity,
                    "completion_rate": (week_data.tasks_completed / week_data.tasks_created * 100) if week_data.tasks_created > 0 else 0
                })
                
                current_date += timedelta(days=7)
        else:
            # Daily aggregation
            chart_data = self._calculate_productivity_trend(db, team_id, start_date, end_date)
        
        return chart_data
    
    def _get_hourly_activity(
        self,
        db: Session,
        team_id: UUID,
        start_datetime: datetime,
        end_datetime: datetime
    ) -> List[Dict[str, Any]]:
        """Get hourly activity data"""
        
        hourly_data = []
        current_hour = start_datetime.replace(minute=0, second=0, microsecond=0)
        
        while current_hour <= end_datetime:
            hour_end = current_hour + timedelta(hours=1)
            
            activity_count = db.query(Activity).filter(
                and_(
                    Activity.team_id == team_id,
                    Activity.created_at >= current_hour,
                    Activity.created_at < hour_end
                )
            ).count()
            
            hourly_data.append({
                "hour": current_hour.strftime("%H:00"),
                "activity_count": activity_count
            })
            
            current_hour = hour_end
        
        return hourly_data
    
    def _get_user_last_activity(
        self,
        db: Session,
        user_id: UUID,
        team_id: UUID
    ) -> Optional[str]:
        """Get user's last activity timestamp"""
        
        last_activity = db.query(Activity).filter(
            and_(
                Activity.user_id == user_id,
                Activity.team_id == team_id
            )
        ).order_by(desc(Activity.created_at)).first()
        
        if last_activity:
            return last_activity.created_at.isoformat()
        
        return None
    
    def _generate_team_improvement_areas(
        self,
        member_performances: List[TeamMemberPerformance],
        team_averages: TeamProductivityMetrics
    ) -> List[str]:
        """Generate improvement areas based on team performance"""
        
        improvement_areas = []
        
        if not member_performances:
            return improvement_areas
        
        # Check for uneven performance distribution
        productivity_scores = [m.productivity_score for m in member_performances if m.productivity_score]
        if productivity_scores:
            score_range = max(productivity_scores) - min(productivity_scores)
            if score_range > 40:
                improvement_areas.append("Consider workload balancing to reduce performance gaps between team members")
        
        # Check average completion times
        completion_times = [m.avg_completion_time_hours for m in member_performances if m.avg_completion_time_hours]
        if completion_times:
            avg_time = mean(completion_times)
            if avg_time > 48:  # More than 2 days
                improvement_areas.append("Focus on breaking down complex tasks to reduce completion times")
        
        # Check collaboration scores
        collab_scores = [m.collaboration_score for m in member_performances if m.collaboration_score]
        if collab_scores:
            avg_collab = mean(collab_scores)
            if avg_collab < 30:
                improvement_areas.append("Encourage more team collaboration and communication")
        
        return improvement_areas


# Global analytics service instance
analytics_service = AnalyticsService()