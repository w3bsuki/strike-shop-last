from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import and_, desc, func, or_
from uuid import UUID
from datetime import datetime

from app.api import deps
from app.db.session import get_db
from app.models import Notification, NotificationPreference, User
from app.schemas.notification import (
    Notification as NotificationSchema,
    NotificationResponse,
    NotificationUpdate,
    NotificationBulkUpdate,
    NotificationPreference as NotificationPreferenceSchema,
    NotificationPreferenceCreate,
    NotificationPreferenceUpdate
)
from app.services.notification_service import notification_service

router = APIRouter()


@router.get("/", response_model=NotificationResponse)
def get_notifications(
    unread_only: bool = Query(False, description="Only return unread notifications"),
    category: Optional[str] = Query(None, description="Filter by category"),
    limit: int = Query(50, ge=1, le=100, description="Number of notifications to return"),
    offset: int = Query(0, ge=0, description="Number of notifications to skip"),
    page: int = Query(1, ge=1, description="Page number"),
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_user)
):
    """Get user notifications with filtering and pagination"""
    
    # Calculate offset from page
    if page > 1:
        offset = (page - 1) * limit
    
    notifications, total, unread_count = notification_service.get_user_notifications(
        db=db,
        user_id=current_user.id,
        unread_only=unread_only,
        category=category,
        limit=limit,
        offset=offset
    )
    
    return NotificationResponse(
        notifications=notifications,
        total=total,
        unread_count=unread_count,
        page=page,
        per_page=limit
    )


@router.put("/{notification_id}", response_model=NotificationSchema)
def update_notification(
    notification_id: UUID,
    notification_update: NotificationUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_user)
):
    """Update a notification (mark as read/unread)"""
    
    notification = db.query(Notification).filter(
        and_(
            Notification.id == notification_id,
            Notification.user_id == current_user.id
        )
    ).first()
    
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")
    
    # Update notification
    if notification_update.is_read is not None:
        notification.is_read = notification_update.is_read
        if notification_update.is_read:
            notification.read_at = datetime.utcnow()
        else:
            notification.read_at = None
    
    db.commit()
    db.refresh(notification)
    
    return notification


@router.put("/bulk", response_model=dict)
def bulk_update_notifications(
    bulk_update: NotificationBulkUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_user)
):
    """Bulk update notifications (mark multiple as read/unread)"""
    
    updated_count = notification_service.mark_as_read(
        db=db,
        notification_ids=bulk_update.notification_ids,
        user_id=current_user.id
    )
    
    return {
        "message": f"Updated {updated_count} notifications",
        "updated_count": updated_count
    }


@router.delete("/{notification_id}")
def delete_notification(
    notification_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_user)
):
    """Delete a notification"""
    
    notification = db.query(Notification).filter(
        and_(
            Notification.id == notification_id,
            Notification.user_id == current_user.id
        )
    ).first()
    
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")
    
    db.delete(notification)
    db.commit()
    
    return {"message": "Notification deleted successfully"}


@router.get("/preferences", response_model=NotificationPreferenceSchema)
def get_notification_preferences(
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_user)
):
    """Get user notification preferences"""
    
    preferences = notification_service.get_user_preferences(db, current_user.id)
    
    if not preferences:
        # Return default preferences
        return NotificationPreferenceSchema(
            id=UUID("00000000-0000-0000-0000-000000000000"),
            user_id=current_user.id,
            created_at=datetime.utcnow()
        )
    
    return preferences


@router.put("/preferences", response_model=NotificationPreferenceSchema)
def update_notification_preferences(
    preferences_update: NotificationPreferenceUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_user)
):
    """Update user notification preferences"""
    
    preferences = notification_service.create_user_preferences(
        db=db,
        user_id=current_user.id,
        preferences=preferences_update.dict(exclude_unset=True)
    )
    
    return preferences


@router.post("/mark-all-read")
def mark_all_notifications_read(
    category: Optional[str] = Query(None, description="Only mark notifications in this category as read"),
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_user)
):
    """Mark all notifications as read"""
    
    query = db.query(Notification).filter(
        and_(
            Notification.user_id == current_user.id,
            Notification.is_read == False
        )
    )
    
    if category:
        query = query.filter(Notification.category == category)
    
    # Get all unread notification IDs
    notification_ids = [n.id for n in query.all()]
    
    if notification_ids:
        updated_count = notification_service.mark_as_read(
            db=db,
            notification_ids=notification_ids,
            user_id=current_user.id
        )
        
        return {
            "message": f"Marked {updated_count} notifications as read",
            "updated_count": updated_count
        }
    else:
        return {
            "message": "No unread notifications found",
            "updated_count": 0
        }


@router.get("/unread-count", response_model=dict)
def get_unread_count(
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_user)
):
    """Get count of unread notifications"""
    
    unread_count = db.query(Notification).filter(
        and_(
            Notification.user_id == current_user.id,
            Notification.is_read == False
        )
    ).count()
    
    # Get count by category
    category_counts = {}
    categories = db.query(Notification.category, func.count(Notification.id)).filter(
        and_(
            Notification.user_id == current_user.id,
            Notification.is_read == False,
            Notification.category.isnot(None)
        )
    ).group_by(Notification.category).all()
    
    for category, count in categories:
        category_counts[category] = count
    
    return {
        "total_unread": unread_count,
        "by_category": category_counts
    }