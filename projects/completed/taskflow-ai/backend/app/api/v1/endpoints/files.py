from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File, Request
from fastapi.responses import StreamingResponse, RedirectResponse
from sqlalchemy.orm import Session
from sqlalchemy import and_, desc, func, or_
from uuid import UUID
import io
from datetime import datetime, timedelta

from app.api import deps
from app.db.session import get_db
from app.models import FileAttachment, User, Task, Team, TeamMembership
from app.schemas.file_storage import (
    FileAttachment as FileAttachmentSchema,
    FileAttachmentResponse,
    FileUploadResponse,
    FileDownloadResponse,
    StorageQuota,
    FileBulkOperation,
    FileSearchQuery,
    FileStats
)
from app.services.storage_service import storage_service

router = APIRouter()


@router.post("/upload", response_model=FileAttachmentSchema)
async def upload_file(
    file: UploadFile = File(...),
    task_id: Optional[UUID] = Query(None, description="Attach to specific task"),
    comment_id: Optional[UUID] = Query(None, description="Attach to specific comment"),
    team_id: Optional[UUID] = Query(None, description="Attach to specific team"),
    is_public: bool = Query(False, description="Make file publicly accessible"),
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_user)
):
    """Upload a file with optional attachment to task, comment, or team"""
    
    # Validate file
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file provided")
    
    # Read file content
    file_content = await file.read()
    
    if len(file_content) == 0:
        raise HTTPException(status_code=400, detail="Empty file provided")
    
    # Check permissions if attaching to specific entities
    if task_id:
        task = db.query(Task).filter(Task.id == task_id).first()
        if not task:
            raise HTTPException(status_code=404, detail="Task not found")
        
        # Check if user has access to the task
        if task.team_id:
            membership = db.query(TeamMembership).filter(
                and_(
                    TeamMembership.team_id == task.team_id,
                    TeamMembership.user_id == current_user.id,
                    TeamMembership.status == "active"
                )
            ).first()
            if not membership:
                raise HTTPException(status_code=403, detail="No access to this task")
    
    if team_id:
        membership = db.query(TeamMembership).filter(
            and_(
                TeamMembership.team_id == team_id,
                TeamMembership.user_id == current_user.id,
                TeamMembership.status == "active"
            )
        ).first()
        if not membership:
            raise HTTPException(status_code=403, detail="No access to this team")
    
    try:
        # Upload file
        attachment = storage_service.upload_file(
            db=db,
            file_data=file_content,
            filename=file.filename,
            content_type=file.content_type or "application/octet-stream",
            uploaded_by_id=current_user.id,
            task_id=task_id,
            comment_id=comment_id,
            team_id=team_id,
            is_public=is_public
        )
        
        # Add uploader details for response
        attachment_dict = attachment.__dict__.copy()
        attachment_dict.update({
            "uploaded_by_name": current_user.full_name or current_user.email,
            "uploaded_by_avatar": current_user.avatar_url
        })
        
        return FileAttachmentSchema(**attachment_dict)
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="File upload failed")


@router.get("/", response_model=FileAttachmentResponse)
def get_files(
    task_id: Optional[UUID] = Query(None, description="Filter by task"),
    team_id: Optional[UUID] = Query(None, description="Filter by team"),
    content_type: Optional[str] = Query(None, description="Filter by content type"),
    search: Optional[str] = Query(None, description="Search in filename"),
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_user)
):
    """Get files with filtering and pagination"""
    
    # Build base query - only files user has access to
    query = db.query(FileAttachment).filter(
        or_(
            FileAttachment.uploaded_by_id == current_user.id,
            FileAttachment.is_public == True,
            and_(
                FileAttachment.team_id.isnot(None),
                FileAttachment.team_id.in_(
                    db.query(TeamMembership.team_id).filter(
                        and_(
                            TeamMembership.user_id == current_user.id,
                            TeamMembership.status == "active"
                        )
                    )
                )
            )
        )
    )
    
    # Apply filters
    if task_id:
        query = query.filter(FileAttachment.task_id == task_id)
    
    if team_id:
        query = query.filter(FileAttachment.team_id == team_id)
    
    if content_type:
        query = query.filter(FileAttachment.content_type.like(f"{content_type}%"))
    
    if search:
        query = query.filter(
            or_(
                FileAttachment.filename.ilike(f"%{search}%"),
                FileAttachment.original_filename.ilike(f"%{search}%")
            )
        )
    
    # Get total count
    total = query.count()
    
    # Apply pagination
    offset = (page - 1) * per_page
    files = query.order_by(desc(FileAttachment.created_at)).offset(offset).limit(per_page).all()
    
    # Add uploader details to files
    file_data = []
    for file_attachment in files:
        file_dict = file_attachment.__dict__.copy()
        file_dict.update({
            "uploaded_by_name": file_attachment.uploaded_by.full_name or file_attachment.uploaded_by.email,
            "uploaded_by_avatar": file_attachment.uploaded_by.avatar_url
        })
        file_data.append(FileAttachmentSchema(**file_dict))
    
    return FileAttachmentResponse(
        files=file_data,
        total=total,
        page=page,
        per_page=per_page
    )


@router.get("/{file_id}", response_model=FileAttachmentSchema)
def get_file(
    file_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_user)
):
    """Get file details"""
    
    file_attachment = db.query(FileAttachment).filter(FileAttachment.id == file_id).first()
    if not file_attachment:
        raise HTTPException(status_code=404, detail="File not found")
    
    # Check permissions
    if not storage_service.check_file_permissions(file_attachment, current_user.id, db):
        raise HTTPException(status_code=404, detail="File not found")
    
    # Add uploader details
    file_dict = file_attachment.__dict__.copy()
    file_dict.update({
        "uploaded_by_name": file_attachment.uploaded_by.full_name or file_attachment.uploaded_by.email,
        "uploaded_by_avatar": file_attachment.uploaded_by.avatar_url
    })
    
    return FileAttachmentSchema(**file_dict)


@router.get("/{file_id}/download")
async def download_file(
    file_id: UUID,
    request: Request,
    token: Optional[str] = Query(None, description="Access token for private files"),
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_user)
):
    """Download file content"""
    
    file_attachment = db.query(FileAttachment).filter(FileAttachment.id == file_id).first()
    if not file_attachment:
        raise HTTPException(status_code=404, detail="File not found")
    
    # Check permissions
    if not file_attachment.is_public:
        if not token or token != file_attachment.access_token:
            if not storage_service.check_file_permissions(file_attachment, current_user.id, db):
                raise HTTPException(status_code=404, detail="File not found")
    
    # Log file access
    storage_service.log_file_access(
        db=db,
        file_id=file_id,
        user_id=current_user.id,
        action="download",
        ip_address=request.client.host,
        user_agent=request.headers.get("user-agent")
    )
    
    # Update download count
    file_attachment.download_count += 1
    db.commit()
    
    # For S3, redirect to presigned URL
    if storage_service.backend == "s3":
        download_url = storage_service.generate_download_url(file_attachment, expires_in_seconds=3600)
        return RedirectResponse(url=download_url)
    else:
        # For local storage, stream file content
        try:
            file_content = storage_service.get_file_content(file_attachment)
            
            def iterfile():
                with io.BytesIO(file_content) as file_stream:
                    yield from file_stream
            
            return StreamingResponse(
                iterfile(),
                media_type=file_attachment.content_type,
                headers={
                    "Content-Disposition": f"attachment; filename={file_attachment.original_filename}"
                }
            )
        except Exception as e:
            raise HTTPException(status_code=500, detail="Failed to download file")


@router.get("/{file_id}/url", response_model=FileDownloadResponse)
def get_download_url(
    file_id: UUID,
    expires_in: int = Query(3600, ge=300, le=86400, description="URL expiration in seconds"),
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_user)
):
    """Get temporary download URL for file"""
    
    file_attachment = db.query(FileAttachment).filter(FileAttachment.id == file_id).first()
    if not file_attachment:
        raise HTTPException(status_code=404, detail="File not found")
    
    # Check permissions
    if not storage_service.check_file_permissions(file_attachment, current_user.id, db):
        raise HTTPException(status_code=404, detail="File not found")
    
    # Generate download URL
    download_url = storage_service.generate_download_url(file_attachment, expires_in)
    
    return FileDownloadResponse(
        download_url=download_url,
        expires_at=datetime.utcnow() + timedelta(seconds=expires_in),
        filename=file_attachment.original_filename,
        content_type=file_attachment.content_type,
        file_size=file_attachment.file_size
    )


@router.delete("/{file_id}")
def delete_file(
    file_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_user)
):
    """Delete a file"""
    
    file_attachment = db.query(FileAttachment).filter(FileAttachment.id == file_id).first()
    if not file_attachment:
        raise HTTPException(status_code=404, detail="File not found")
    
    # Check permissions (only owner or team admin can delete)
    can_delete = False
    
    if file_attachment.uploaded_by_id == current_user.id:
        can_delete = True
    elif file_attachment.team_id:
        membership = db.query(TeamMembership).filter(
            and_(
                TeamMembership.team_id == file_attachment.team_id,
                TeamMembership.user_id == current_user.id,
                TeamMembership.role.in_(["owner", "admin"]),
                TeamMembership.status == "active"
            )
        ).first()
        can_delete = membership is not None
    
    if not can_delete:
        raise HTTPException(status_code=403, detail="Insufficient permissions to delete file")
    
    # Log file access
    storage_service.log_file_access(
        db=db,
        file_id=file_id,
        user_id=current_user.id,
        action="delete"
    )
    
    # Delete file
    success = storage_service.delete_file(db, file_attachment)
    
    if success:
        return {"message": "File deleted successfully"}
    else:
        raise HTTPException(status_code=500, detail="Failed to delete file")


@router.get("/quota/status", response_model=StorageQuota)
def get_storage_quota(
    team_id: Optional[UUID] = Query(None, description="Get team quota instead of user quota"),
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_user)
):
    """Get storage quota status"""
    
    if team_id:
        # Check team membership
        membership = db.query(TeamMembership).filter(
            and_(
                TeamMembership.team_id == team_id,
                TeamMembership.user_id == current_user.id,
                TeamMembership.status == "active"
            )
        ).first()
        if not membership:
            raise HTTPException(status_code=404, detail="Team not found")
    
    # Get quota info
    quota_info = storage_service.check_storage_quota(
        db=db,
        user_id=current_user.id if not team_id else None,
        team_id=team_id,
        file_size=0
    )
    
    if not quota_info["within_quota"] and quota_info["error"]:
        # This means quota record doesn't exist, which shouldn't happen
        raise HTTPException(status_code=500, detail="Quota information not available")
    
    usage_percentage = (quota_info["used_bytes"] / quota_info["quota_bytes"] * 100) if quota_info["quota_bytes"] > 0 else 0
    
    return StorageQuota(
        id=UUID("00000000-0000-0000-0000-000000000000"),  # Placeholder
        user_id=current_user.id if not team_id else None,
        team_id=team_id,
        quota_bytes=quota_info["quota_bytes"],
        used_bytes=quota_info["used_bytes"],
        files_count=0,  # Would need separate query
        last_calculated_at=datetime.utcnow(),
        usage_percentage=usage_percentage,
        available_bytes=quota_info["available_bytes"]
    )


@router.post("/bulk-operation")
def bulk_file_operation(
    operation: FileBulkOperation,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_user)
):
    """Perform bulk operations on files"""
    
    # Get files user has permission to modify
    files = db.query(FileAttachment).filter(
        and_(
            FileAttachment.id.in_(operation.file_ids),
            or_(
                FileAttachment.uploaded_by_id == current_user.id,
                # Team admin can modify team files
                and_(
                    FileAttachment.team_id.isnot(None),
                    FileAttachment.team_id.in_(
                        db.query(TeamMembership.team_id).filter(
                            and_(
                                TeamMembership.user_id == current_user.id,
                                TeamMembership.role.in_(["owner", "admin"]),
                                TeamMembership.status == "active"
                            )
                        )
                    )
                )
            )
        )
    ).all()
    
    if not files:
        raise HTTPException(status_code=404, detail="No files found or insufficient permissions")
    
    affected_count = 0
    
    if operation.action == "delete":
        for file_attachment in files:
            success = storage_service.delete_file(db, file_attachment)
            if success:
                affected_count += 1
    
    elif operation.action == "change_visibility":
        # This would require additional parameters in the operation
        pass
    
    return {
        "message": f"Bulk operation '{operation.action}' completed",
        "affected_count": affected_count,
        "total_requested": len(operation.file_ids)
    }


@router.get("/stats/overview", response_model=FileStats)
def get_file_stats(
    team_id: Optional[UUID] = Query(None, description="Get stats for specific team"),
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_user)
):
    """Get file storage statistics"""
    
    # Build base query based on permissions
    base_query = db.query(FileAttachment)
    
    if team_id:
        # Check team membership
        membership = db.query(TeamMembership).filter(
            and_(
                TeamMembership.team_id == team_id,
                TeamMembership.user_id == current_user.id,
                TeamMembership.status == "active"
            )
        ).first()
        if not membership:
            raise HTTPException(status_code=404, detail="Team not found")
        
        base_query = base_query.filter(FileAttachment.team_id == team_id)
    else:
        # User's files and public files they have access to
        base_query = base_query.filter(
            or_(
                FileAttachment.uploaded_by_id == current_user.id,
                and_(
                    FileAttachment.team_id.in_(
                        db.query(TeamMembership.team_id).filter(
                            and_(
                                TeamMembership.user_id == current_user.id,
                                TeamMembership.status == "active"
                            )
                        )
                    )
                )
            )
        )
    
    # Calculate statistics
    total_files = base_query.count()
    total_size = db.query(func.sum(FileAttachment.file_size)).filter(
        FileAttachment.id.in_(base_query.with_entities(FileAttachment.id))
    ).scalar() or 0
    
    # Files by type
    type_stats = base_query.with_entities(
        FileAttachment.content_type,
        func.count(FileAttachment.id).label('count'),
        func.sum(FileAttachment.file_size).label('total_size')
    ).group_by(FileAttachment.content_type).all()
    
    files_by_type = {}
    for content_type, count, size in type_stats:
        files_by_type[content_type] = {
            "count": count,
            "total_size": size or 0
        }
    
    # Recent uploads (last 10)
    recent_uploads = base_query.order_by(
        desc(FileAttachment.created_at)
    ).limit(10).all()
    
    recent_upload_data = []
    for file_attachment in recent_uploads:
        file_dict = file_attachment.__dict__.copy()
        file_dict.update({
            "uploaded_by_name": file_attachment.uploaded_by.full_name or file_attachment.uploaded_by.email,
            "uploaded_by_avatar": file_attachment.uploaded_by.avatar_url
        })
        recent_upload_data.append(FileAttachmentSchema(**file_dict))
    
    # Largest files (top 10)
    largest_files = base_query.order_by(
        desc(FileAttachment.file_size)
    ).limit(10).all()
    
    largest_file_data = []
    for file_attachment in largest_files:
        file_dict = file_attachment.__dict__.copy()
        file_dict.update({
            "uploaded_by_name": file_attachment.uploaded_by.full_name or file_attachment.uploaded_by.email,
            "uploaded_by_avatar": file_attachment.uploaded_by.avatar_url
        })
        largest_file_data.append(FileAttachmentSchema(**file_dict))
    
    # Storage trend (simplified - would need time-series data)
    storage_trend = []  # This would require more complex querying
    
    return FileStats(
        total_files=total_files,
        total_size_bytes=total_size,
        files_by_type=files_by_type,
        recent_uploads=recent_upload_data,
        largest_files=largest_file_data,
        storage_trend=storage_trend
    )