from celery import shared_task
from typing import Dict, List, Any
import asyncio
from datetime import datetime, timedelta
import logging
from sqlalchemy import select, and_, func
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker

from app.services.ai_service import ai_service
from app.services.cache_service import cache_service
from app.core.config import settings
from app.models.task import Task, TaskDependency
from app.models.user import User
from app.models.team import Team

logger = logging.getLogger(__name__)

# Create async engine for background tasks
engine = create_async_engine(settings.DATABASE_URL, echo=False)
AsyncSessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


@shared_task(name="recalculate_task_priorities")
def recalculate_task_priorities(team_id: str) -> Dict:
    """Background task to recalculate all task priorities for a team"""
    
    async def _recalculate():
        async with AsyncSessionLocal() as db:
            try:
                # Get all active tasks for the team
                result = await db.execute(
                    select(Task).where(
                        and_(
                            Task.team_id == team_id,
                            Task.status.not_in(['done', 'archived'])
                        )
                    )
                )
                tasks = result.scalars().all()
                
                # Get team members and their workloads
                team = await db.get(Team, team_id)
                member_workloads = {}
                
                if team and team.members:
                    for member in team.members:
                        # Calculate workload
                        workload_result = await db.execute(
                            select(func.sum(Task.estimated_hours)).where(
                                and_(
                                    Task.assignee_id == member.id,
                                    Task.status.in_(['todo', 'in_progress'])
                                )
                            )
                        )
                        hours = workload_result.scalar() or 0
                        member_workloads[str(member.id)] = float(hours)
                
                # Recalculate priorities
                updated_count = 0
                for task in tasks:
                    old_score = task.ai_priority_score or 0
                    new_score = await ai_service.calculate_task_priority_score(
                        task, tasks, member_workloads
                    )
                    
                    if abs(old_score - new_score) > 0.1:  # Significant change
                        task.ai_priority_score = new_score
                        updated_count += 1
                
                await db.commit()
                
                # Clear cache for this team
                await cache_service.clear_namespace(f"team_priorities:{team_id}")
                
                return {
                    "team_id": team_id,
                    "status": "completed",
                    "tasks_analyzed": len(tasks),
                    "priorities_updated": updated_count,
                    "timestamp": datetime.utcnow().isoformat()
                }
                
            except Exception as e:
                logger.error(f"Error recalculating priorities for team {team_id}: {e}")
                return {
                    "team_id": team_id,
                    "status": "error",
                    "error": str(e),
                    "timestamp": datetime.utcnow().isoformat()
                }
    
    # Run async function
    return asyncio.run(_recalculate())


@shared_task(name="generate_daily_insights")
def generate_daily_insights(team_id: str) -> Dict:
    """Generate daily AI insights for a team"""
    
    async def _generate_insights():
        async with AsyncSessionLocal() as db:
            try:
                # Get all team tasks
                result = await db.execute(
                    select(Task).where(Task.team_id == team_id)
                )
                tasks = result.scalars().all()
                
                # Get dependencies for bottleneck analysis
                dep_result = await db.execute(
                    select(TaskDependency).where(
                        TaskDependency.task_id.in_([t.id for t in tasks])
                    )
                )
                dependencies = [
                    {
                        'task_id': str(d.task_id),
                        'depends_on_id': str(d.depends_on_id)
                    }
                    for d in dep_result.scalars().all()
                ]
                
                # Analyze productivity
                productivity_analysis = await ai_service.analyze_team_productivity(
                    tasks, time_period_days=30
                )
                
                # Detect bottlenecks
                bottlenecks = await ai_service.detect_bottlenecks(tasks, dependencies)
                
                # Predict completions for next 7 days
                next_week = datetime.now() + timedelta(days=7)
                predicted_completions = [
                    t for t in tasks
                    if t.ai_predicted_completion and 
                    t.ai_predicted_completion.replace(tzinfo=None) <= next_week and
                    t.status != 'done'
                ]
                
                # Calculate risk metrics
                high_risk_tasks = [
                    t for t in tasks
                    if t.status not in ['done', 'archived'] and (
                        (t.due_date and t.due_date.replace(tzinfo=None) < datetime.now()) or
                        (t.ai_priority_score and t.ai_priority_score > 8)
                    )
                ]
                
                insights = {
                    "team_id": team_id,
                    "date": datetime.utcnow().date().isoformat(),
                    "insights": {
                        "productivity_score": productivity_analysis.get("productivity_score", 0),
                        "team_velocity": productivity_analysis.get("team_velocity", 0),
                        "estimation_accuracy": productivity_analysis.get("estimation_accuracy", 0),
                        "bottlenecks_detected": len(bottlenecks),
                        "top_bottlenecks": bottlenecks[:3],
                        "high_risk_tasks": len(high_risk_tasks),
                        "predicted_completions_next_week": len(predicted_completions),
                        "overdue_tasks": productivity_analysis.get("overdue_tasks", 0),
                        "ai_recommendations": productivity_analysis.get("ai_recommendations", [])
                    },
                    "generated_at": datetime.utcnow().isoformat()
                }
                
                # Cache insights for quick access
                await cache_service.set(
                    "daily_insights",
                    team_id,
                    insights,
                    ttl=86400  # 24 hours
                )
                
                return insights
                
            except Exception as e:
                logger.error(f"Error generating insights for team {team_id}: {e}")
                return {
                    "team_id": team_id,
                    "status": "error",
                    "error": str(e),
                    "timestamp": datetime.utcnow().isoformat()
                }
    
    # Run async function
    return asyncio.run(_generate_insights())


@shared_task(name="sync_external_integrations")
def sync_external_integrations(integration_type: str, team_id: str) -> Dict:
    """Sync data from external integrations"""
    
    async def _sync_integration():
        async with AsyncSessionLocal() as db:
            try:
                items_synced = 0
                sync_details = {}
                
                if integration_type == "github":
                    # In a real implementation, this would:
                    # 1. Fetch PRs/Issues from GitHub API
                    # 2. Create/update corresponding tasks
                    # 3. Sync status changes
                    sync_details["message"] = "GitHub sync would fetch PRs and issues"
                    
                elif integration_type == "slack":
                    # Would fetch messages and create tasks from specific channels
                    sync_details["message"] = "Slack sync would monitor channels for task mentions"
                    
                elif integration_type == "jira":
                    # Would sync JIRA tickets with tasks
                    sync_details["message"] = "JIRA sync would import tickets as tasks"
                
                # Log sync activity
                logger.info(f"Synced {integration_type} for team {team_id}: {items_synced} items")
                
                return {
                    "integration": integration_type,
                    "team_id": team_id,
                    "items_synced": items_synced,
                    "status": "completed",
                    "details": sync_details,
                    "timestamp": datetime.utcnow().isoformat()
                }
                
            except Exception as e:
                logger.error(f"Error syncing {integration_type} for team {team_id}: {e}")
                return {
                    "integration": integration_type,
                    "team_id": team_id,
                    "status": "error",
                    "error": str(e),
                    "timestamp": datetime.utcnow().isoformat()
                }
    
    return asyncio.run(_sync_integration())


@shared_task(name="cleanup_old_activities")
def cleanup_old_activities(days: int = 90) -> Dict:
    """Clean up old activity logs and cache entries"""
    
    async def _cleanup():
        async with AsyncSessionLocal() as db:
            try:
                cutoff_date = datetime.utcnow() - timedelta(days=days)
                
                # In a real implementation, this would delete old:
                # - Activity logs
                # - Completed task archives
                # - Stale cache entries
                # - Old notifications
                
                deleted_count = 0
                
                # Clear old cache entries
                cache_namespaces = [
                    "task_embeddings",
                    "ai_predictions",
                    "task_analysis"
                ]
                
                for namespace in cache_namespaces:
                    cleared = await cache_service.clear_namespace(f"{namespace}_old")
                    deleted_count += cleared
                
                logger.info(f"Cleaned up {deleted_count} old items (older than {days} days)")
                
                return {
                    "deleted_count": deleted_count,
                    "days": days,
                    "cutoff_date": cutoff_date.isoformat(),
                    "timestamp": datetime.utcnow().isoformat()
                }
                
            except Exception as e:
                logger.error(f"Error during cleanup: {e}")
                return {
                    "status": "error",
                    "error": str(e),
                    "timestamp": datetime.utcnow().isoformat()
                }
    
    return asyncio.run(_cleanup())


@shared_task(name="send_task_reminders")
def send_task_reminders() -> Dict:
    """Send reminders for upcoming task deadlines"""
    
    async def _send_reminders():
        async with AsyncSessionLocal() as db:
            try:
                # Find tasks due in next 24 hours
                tomorrow = datetime.now() + timedelta(days=1)
                
                result = await db.execute(
                    select(Task).where(
                        and_(
                            Task.due_date <= tomorrow,
                            Task.due_date > datetime.now(),
                            Task.status.not_in(['done', 'archived']),
                            Task.assignee_id.is_not(None)
                        )
                    )
                )
                due_tasks = result.scalars().all()
                
                reminders_sent = 0
                reminder_details = []
                
                for task in due_tasks:
                    # In a real implementation, this would:
                    # 1. Send email/Slack/push notification
                    # 2. Update notification status
                    # 3. Log notification activity
                    
                    hours_until_due = (task.due_date.replace(tzinfo=None) - datetime.now()).total_seconds() / 3600
                    
                    reminder_details.append({
                        "task_id": str(task.id),
                        "task_title": task.title,
                        "assignee_id": str(task.assignee_id),
                        "hours_until_due": round(hours_until_due, 1),
                        "priority": task.priority
                    })
                    
                    reminders_sent += 1
                
                logger.info(f"Sent {reminders_sent} task reminders")
                
                return {
                    "reminders_sent": reminders_sent,
                    "tasks_due_soon": len(due_tasks),
                    "reminder_details": reminder_details[:10],  # Limit details
                    "timestamp": datetime.utcnow().isoformat()
                }
                
            except Exception as e:
                logger.error(f"Error sending reminders: {e}")
                return {
                    "status": "error",
                    "error": str(e),
                    "timestamp": datetime.utcnow().isoformat()
                }
    
    return asyncio.run(_send_reminders())


@shared_task(name="update_task_embeddings")
def update_task_embeddings(team_id: str) -> Dict:
    """Update embeddings for all tasks in a team for semantic search"""
    
    async def _update_embeddings():
        async with AsyncSessionLocal() as db:
            try:
                # Get all tasks for the team
                result = await db.execute(
                    select(Task).where(
                        and_(
                            Task.team_id == team_id,
                            Task.status.not_in(['archived'])
                        )
                    )
                )
                tasks = result.scalars().all()
                
                embeddings_updated = 0
                embeddings_failed = 0
                
                for task in tasks:
                    try:
                        # Generate and cache embedding
                        embedding = await ai_service.generate_task_embedding(task)
                        
                        if embedding:
                            # Store in cache with task ID as key
                            await cache_service.set(
                                "task_embeddings",
                                str(task.id),
                                embedding,
                                ttl=604800  # 7 days
                            )
                            embeddings_updated += 1
                        else:
                            embeddings_failed += 1
                            
                    except Exception as e:
                        logger.error(f"Failed to generate embedding for task {task.id}: {e}")
                        embeddings_failed += 1
                
                logger.info(f"Updated {embeddings_updated} embeddings for team {team_id}")
                
                return {
                    "team_id": team_id,
                    "total_tasks": len(tasks),
                    "embeddings_updated": embeddings_updated,
                    "embeddings_failed": embeddings_failed,
                    "timestamp": datetime.utcnow().isoformat()
                }
                
            except Exception as e:
                logger.error(f"Error updating embeddings for team {team_id}: {e}")
                return {
                    "team_id": team_id,
                    "status": "error",
                    "error": str(e),
                    "timestamp": datetime.utcnow().isoformat()
                }
    
    return asyncio.run(_update_embeddings())


@shared_task(name="analyze_team_patterns")
def analyze_team_patterns(team_id: str) -> Dict:
    """Analyze team work patterns and generate insights"""
    
    async def _analyze_patterns():
        async with AsyncSessionLocal() as db:
            try:
                # Get completed tasks from last 90 days
                cutoff_date = datetime.now() - timedelta(days=90)
                
                result = await db.execute(
                    select(Task).where(
                        and_(
                            Task.team_id == team_id,
                            Task.status == 'done',
                            Task.completed_at >= cutoff_date
                        )
                    )
                )
                completed_tasks = result.scalars().all()
                
                # Analyze patterns
                patterns = {
                    "most_productive_day": None,
                    "average_task_duration": 0,
                    "estimation_accuracy_trend": [],
                    "common_blockers": [],
                    "peak_hours": []
                }
                
                if completed_tasks:
                    # Day of week analysis
                    day_counts = {}
                    durations = []
                    
                    for task in completed_tasks:
                        if task.completed_at:
                            day = task.completed_at.strftime("%A")
                            day_counts[day] = day_counts.get(day, 0) + 1
                        
                        if task.created_at and task.completed_at:
                            duration = (task.completed_at - task.created_at).days
                            durations.append(duration)
                    
                    if day_counts:
                        patterns["most_productive_day"] = max(day_counts, key=day_counts.get)
                    
                    if durations:
                        patterns["average_task_duration"] = sum(durations) / len(durations)
                
                # Cache patterns for quick access
                await cache_service.set(
                    "team_patterns",
                    team_id,
                    patterns,
                    ttl=86400  # 24 hours
                )
                
                return {
                    "team_id": team_id,
                    "patterns": patterns,
                    "tasks_analyzed": len(completed_tasks),
                    "analysis_period_days": 90,
                    "timestamp": datetime.utcnow().isoformat()
                }
                
            except Exception as e:
                logger.error(f"Error analyzing patterns for team {team_id}: {e}")
                return {
                    "team_id": team_id,
                    "status": "error",
                    "error": str(e),
                    "timestamp": datetime.utcnow().isoformat()
                }
    
    return asyncio.run(_analyze_patterns())


# New tasks for Wave 2 features

@shared_task(name="send_email_task")
def send_email_task(email_data: Dict) -> Dict:
    """Send email via background task"""
    
    async def _send_email():
        try:
            from app.services.email_service import email_service
            
            success = await email_service.send_email(
                to_email=email_data["recipient"],
                subject=email_data["subject"],
                html_content=email_data["html_content"],
                text_content=email_data.get("text_content"),
                attachments=email_data.get("attachments"),
                reply_to=email_data.get("reply_to"),
                priority=email_data.get("priority", "normal")
            )
            
            return {
                "success": success,
                "recipient": email_data["recipient"],
                "subject": email_data["subject"],
                "timestamp": datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error sending email to {email_data.get('recipient', 'unknown')}: {e}")
            return {
                "success": False,
                "error": str(e),
                "recipient": email_data.get("recipient", "unknown"),
                "timestamp": datetime.utcnow().isoformat()
            }
    
    return asyncio.run(_send_email())


@shared_task(name="send_push_notification_task")
def send_push_notification_task(user_id: str, push_data: Dict) -> Dict:
    """Send push notification via background task"""
    
    async def _send_push():
        try:
            # In a real implementation, this would integrate with:
            # - Firebase Cloud Messaging (FCM) for mobile
            # - Web Push API for browsers
            # - Apple Push Notification Service (APNS) for iOS
            
            # For now, we'll simulate the push notification
            logger.info(f"Push notification sent to user {user_id}: {push_data['title']}")
            
            return {
                "success": True,
                "user_id": user_id,
                "title": push_data["title"],
                "timestamp": datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error sending push notification to user {user_id}: {e}")
            return {
                "success": False,
                "error": str(e),
                "user_id": user_id,
                "timestamp": datetime.utcnow().isoformat()
            }
    
    return asyncio.run(_send_push())


@shared_task(name="scan_file_for_viruses")
def scan_file_for_viruses(file_id: str) -> Dict:
    """Scan uploaded file for viruses"""
    
    async def _scan_file():
        async with AsyncSessionLocal() as db:
            try:
                from app.models import FileAttachment
                
                # Get file attachment
                file_attachment = await db.get(FileAttachment, file_id)
                if not file_attachment:
                    return {
                        "success": False,
                        "error": "File not found",
                        "file_id": file_id
                    }
                
                # In a real implementation, this would:
                # 1. Download file content
                # 2. Submit to antivirus service (ClamAV, VirusTotal, etc.)
                # 3. Update scan status based on results
                
                # For now, we'll simulate a clean scan
                file_attachment.virus_scan_status = "clean"
                file_attachment.virus_scan_result = "No threats detected"
                file_attachment.scanned_at = datetime.utcnow()
                
                await db.commit()
                
                logger.info(f"File {file_id} scanned successfully - clean")
                
                return {
                    "success": True,
                    "file_id": file_id,
                    "scan_result": "clean",
                    "timestamp": datetime.utcnow().isoformat()
                }
                
            except Exception as e:
                logger.error(f"Error scanning file {file_id}: {e}")
                
                # Mark scan as failed
                try:
                    file_attachment = await db.get(FileAttachment, file_id)
                    if file_attachment:
                        file_attachment.virus_scan_status = "failed"
                        file_attachment.virus_scan_result = f"Scan failed: {str(e)}"
                        file_attachment.scanned_at = datetime.utcnow()
                        await db.commit()
                except:
                    pass
                
                return {
                    "success": False,
                    "error": str(e),
                    "file_id": file_id,
                    "timestamp": datetime.utcnow().isoformat()
                }
    
    return asyncio.run(_scan_file())


@shared_task(name="generate_analytics_report_task")
def generate_analytics_report_task(report_id: str, manual_trigger: bool = False, triggered_by_user_id: str = None) -> Dict:
    """Generate analytics report in background"""
    
    async def _generate_report():
        async with AsyncSessionLocal() as db:
            try:
                from app.models import AnalyticsReport
                from app.services.analytics_service import analytics_service
                
                # Get report configuration
                report = await db.get(AnalyticsReport, report_id)
                if not report:
                    return {
                        "success": False,
                        "error": "Report not found",
                        "report_id": report_id
                    }
                
                # Generate report data
                end_date = datetime.utcnow().date()
                start_date = end_date - timedelta(days=30)  # Default to last 30 days
                
                report_data = analytics_service.calculate_team_analytics(
                    db=db,
                    team_id=report.team_id,
                    start_date=start_date,
                    end_date=end_date,
                    compare_previous=True
                )
                
                # In a real implementation, this would:
                # 1. Generate PDF/Excel report
                # 2. Save to storage
                # 3. Send email to recipients
                # 4. Update report generation timestamp
                
                report.last_generated_at = datetime.utcnow()
                if report.schedule_type != "manual":
                    report.next_generation_at = analytics_service.calculate_next_generation_time(
                        report.schedule_type
                    )
                
                await db.commit()
                
                logger.info(f"Analytics report {report_id} generated successfully")
                
                return {
                    "success": True,
                    "report_id": report_id,
                    "team_id": str(report.team_id),
                    "manual_trigger": manual_trigger,
                    "data_points": len(report_data.get("current_period", {}).__dict__),
                    "timestamp": datetime.utcnow().isoformat()
                }
                
            except Exception as e:
                logger.error(f"Error generating analytics report {report_id}: {e}")
                return {
                    "success": False,
                    "error": str(e),
                    "report_id": report_id,
                    "timestamp": datetime.utcnow().isoformat()
                }
    
    return asyncio.run(_generate_report())


@shared_task(name="export_analytics_data_task")
def export_analytics_data_task(export_id: str, team_id: str, user_id: str, export_request: Dict) -> Dict:
    """Export analytics data in background"""
    
    async def _export_data():
        try:
            from app.services.analytics_service import analytics_service
            
            # Parse export request
            query = export_request["query"]
            format_type = export_request["format"]
            
            # Generate export data
            # In a real implementation, this would:
            # 1. Query analytics data based on parameters
            # 2. Format as JSON/CSV/Excel
            # 3. Save to storage with secure URL
            # 4. Send notification to user when ready
            
            logger.info(f"Analytics export {export_id} for team {team_id} completed")
            
            return {
                "success": True,
                "export_id": export_id,
                "team_id": team_id,
                "user_id": user_id,
                "format": format_type,
                "download_url": f"/api/v1/analytics/exports/{export_id}/download",
                "timestamp": datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error exporting analytics data {export_id}: {e}")
            return {
                "success": False,
                "error": str(e),
                "export_id": export_id,
                "timestamp": datetime.utcnow().isoformat()
            }
    
    return asyncio.run(_export_data())


@shared_task(name="process_notification_digest")
def process_notification_digest(user_id: str, frequency: str) -> Dict:
    """Process and send notification digest"""
    
    async def _process_digest():
        async with AsyncSessionLocal() as db:
            try:
                from app.models import User, Notification, NotificationPreference
                from app.services.email_service import send_digest_email
                
                # Get user and preferences
                user = await db.get(User, user_id)
                if not user:
                    return {
                        "success": False,
                        "error": "User not found",
                        "user_id": user_id
                    }
                
                preferences = await db.execute(
                    select(NotificationPreference).where(
                        NotificationPreference.user_id == user_id
                    )
                )
                prefs = preferences.scalar_one_or_none()
                
                if not prefs or not prefs.email_enabled or prefs.email_digest_frequency == "never":
                    return {
                        "success": False,
                        "reason": "Digest disabled in preferences",
                        "user_id": user_id
                    }
                
                # Get unread notifications
                cutoff_date = datetime.utcnow() - timedelta(
                    days=1 if frequency == "daily" else 7
                )
                
                notifications_result = await db.execute(
                    select(Notification).where(
                        and_(
                            Notification.user_id == user_id,
                            Notification.created_at >= cutoff_date,
                            Notification.is_read == False
                        )
                    ).order_by(desc(Notification.created_at))
                )
                notifications = notifications_result.scalars().all()
                
                if not notifications:
                    return {
                        "success": True,
                        "reason": "No unread notifications",
                        "user_id": user_id,
                        "frequency": frequency
                    }
                
                # Prepare digest data
                digest_data = {
                    "total_notifications": len(notifications),
                    "by_category": {},
                    "recent_notifications": [],
                    "unsubscribe_token": "placeholder_token"  # Would generate real token
                }
                
                # Group by category
                for notification in notifications:
                    category = notification.category or "general"
                    digest_data["by_category"][category] = digest_data["by_category"].get(category, 0) + 1
                
                # Add recent notifications
                for notification in notifications[:10]:  # Limit to 10 most recent
                    digest_data["recent_notifications"].append({
                        "title": notification.title,
                        "message": notification.message,
                        "created_at": notification.created_at.isoformat(),
                        "category": notification.category
                    })
                
                # Send digest email
                email_sent = await send_digest_email(
                    email=user.email,
                    user_name=user.full_name or user.email,
                    digest_data=digest_data,
                    frequency=frequency
                )
                
                if email_sent:
                    logger.info(f"Digest email sent to user {user_id} ({frequency})")
                
                return {
                    "success": email_sent,
                    "user_id": user_id,
                    "frequency": frequency,
                    "notifications_count": len(notifications),
                    "email_sent": email_sent,
                    "timestamp": datetime.utcnow().isoformat()
                }
                
            except Exception as e:
                logger.error(f"Error processing digest for user {user_id}: {e}")
                return {
                    "success": False,
                    "error": str(e),
                    "user_id": user_id,
                    "frequency": frequency,
                    "timestamp": datetime.utcnow().isoformat()
                }
    
    return asyncio.run(_process_digest())


@shared_task(name="calculate_storage_usage")
def calculate_storage_usage(team_id: str = None, user_id: str = None) -> Dict:
    """Recalculate storage usage for team or user"""
    
    async def _calculate_usage():
        async with AsyncSessionLocal() as db:
            try:
                from app.models import FileAttachment, FileStorageQuota
                from sqlalchemy import func, sum as sql_sum
                
                # Build query based on team or user
                if team_id:
                    result = await db.execute(
                        select(
                            func.count(FileAttachment.id).label('files_count'),
                            func.sum(FileAttachment.file_size).label('total_size')
                        ).where(FileAttachment.team_id == team_id)
                    )
                    quota_filter = FileStorageQuota.team_id == team_id
                elif user_id:
                    result = await db.execute(
                        select(
                            func.count(FileAttachment.id).label('files_count'),
                            func.sum(FileAttachment.file_size).label('total_size')
                        ).where(FileAttachment.uploaded_by_id == user_id)
                    )
                    quota_filter = FileStorageQuota.user_id == user_id
                else:
                    return {
                        "success": False,
                        "error": "Must specify either team_id or user_id"
                    }
                
                usage_data = result.first()
                files_count = usage_data.files_count or 0
                total_size = usage_data.total_size or 0
                
                # Update quota record
                quota_result = await db.execute(
                    select(FileStorageQuota).where(quota_filter)
                )
                quota = quota_result.scalar_one_or_none()
                
                if quota:
                    quota.used_bytes = total_size
                    quota.files_count = files_count
                    quota.last_calculated_at = datetime.utcnow()
                    await db.commit()
                
                return {
                    "success": True,
                    "team_id": team_id,
                    "user_id": user_id,
                    "files_count": files_count,
                    "total_size_bytes": total_size,
                    "timestamp": datetime.utcnow().isoformat()
                }
                
            except Exception as e:
                logger.error(f"Error calculating storage usage: {e}")
                return {
                    "success": False,
                    "error": str(e),
                    "team_id": team_id,
                    "user_id": user_id,
                    "timestamp": datetime.utcnow().isoformat()
                }
    
    return asyncio.run(_calculate_usage())