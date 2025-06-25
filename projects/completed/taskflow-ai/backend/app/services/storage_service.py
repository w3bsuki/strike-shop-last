import os
import hashlib
import mimetypes
from typing import Optional, List, Dict, Any, BinaryIO
from pathlib import Path
from uuid import UUID, uuid4
from datetime import datetime, timedelta
import boto3
from botocore.exceptions import ClientError
import magic
from PIL import Image
import secrets
import logging

from app.core.config import settings
from app.models import FileAttachment, FileStorageQuota, FileAccessLog
from sqlalchemy.orm import Session

logger = logging.getLogger(__name__)


class StorageService:
    """Service for managing file uploads and storage"""
    
    def __init__(self):
        self.backend = settings.STORAGE_BACKEND
        self.upload_dir = Path(settings.UPLOAD_DIR)
        self.max_file_size = settings.MAX_FILE_SIZE
        self.allowed_types = settings.ALLOWED_FILE_TYPES
        
        # S3 configuration
        if self.backend == "s3":
            self.s3_client = boto3.client(
                's3',
                aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
                aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
                region_name=settings.AWS_S3_REGION
            )
            self.bucket_name = settings.AWS_S3_BUCKET
        else:
            # Ensure local upload directory exists
            self.upload_dir.mkdir(parents=True, exist_ok=True)
    
    def validate_file(self, file_data: bytes, filename: str, content_type: str) -> Dict[str, Any]:
        """Validate file before upload"""
        
        validation_result = {
            "valid": True,
            "errors": [],
            "file_info": {}
        }
        
        # Check file size
        file_size = len(file_data)
        if file_size > self.max_file_size:
            validation_result["valid"] = False
            validation_result["errors"].append(f"File size ({file_size} bytes) exceeds maximum allowed size ({self.max_file_size} bytes)")
        
        # Detect actual MIME type
        try:
            detected_type = magic.from_buffer(file_data, mime=True)
            validation_result["file_info"]["detected_type"] = detected_type
        except:
            detected_type = content_type
        
        # Check allowed file types
        if detected_type not in self.allowed_types:
            validation_result["valid"] = False
            validation_result["errors"].append(f"File type '{detected_type}' is not allowed")
        
        # Additional validation for images
        if detected_type.startswith('image/'):
            try:
                image = Image.open(io.BytesIO(file_data))
                validation_result["file_info"]["image_width"] = image.width
                validation_result["file_info"]["image_height"] = image.height
                validation_result["file_info"]["is_image"] = True
            except Exception as e:
                validation_result["valid"] = False
                validation_result["errors"].append(f"Invalid image file: {e}")
        else:
            validation_result["file_info"]["is_image"] = False
        
        # Calculate file hash for deduplication
        file_hash = hashlib.sha256(file_data).hexdigest()
        validation_result["file_info"]["file_hash"] = file_hash
        
        return validation_result
    
    def check_storage_quota(
        self,
        db: Session,
        user_id: Optional[UUID] = None,
        team_id: Optional[UUID] = None,
        file_size: int = 0
    ) -> Dict[str, Any]:
        """Check if upload would exceed storage quota"""
        
        quota_info = {
            "within_quota": True,
            "quota_bytes": 0,
            "used_bytes": 0,
            "available_bytes": 0,
            "error": None
        }
        
        # Get or create quota record
        quota = None
        if team_id:
            quota = db.query(FileStorageQuota).filter(
                FileStorageQuota.team_id == team_id
            ).first()
            if not quota:
                quota = FileStorageQuota(
                    team_id=team_id,
                    quota_bytes=settings.DEFAULT_TEAM_QUOTA,
                    used_bytes=0,
                    files_count=0
                )
                db.add(quota)
                db.commit()
        elif user_id:
            quota = db.query(FileStorageQuota).filter(
                FileStorageQuota.user_id == user_id
            ).first()
            if not quota:
                quota = FileStorageQuota(
                    user_id=user_id,
                    quota_bytes=settings.DEFAULT_USER_QUOTA,
                    used_bytes=0,
                    files_count=0
                )
                db.add(quota)
                db.commit()
        
        if quota:
            quota_info["quota_bytes"] = quota.quota_bytes
            quota_info["used_bytes"] = quota.used_bytes
            quota_info["available_bytes"] = quota.quota_bytes - quota.used_bytes
            
            if quota.used_bytes + file_size > quota.quota_bytes:
                quota_info["within_quota"] = False
                quota_info["error"] = f"Upload would exceed storage quota. Available: {quota_info['available_bytes']} bytes, Requested: {file_size} bytes"
        
        return quota_info
    
    def upload_file(
        self,
        db: Session,
        file_data: bytes,
        filename: str,
        content_type: str,
        uploaded_by_id: UUID,
        task_id: Optional[UUID] = None,
        comment_id: Optional[UUID] = None,
        team_id: Optional[UUID] = None,
        is_public: bool = False
    ) -> FileAttachment:
        """Upload file and create database record"""
        
        # Validate file
        validation = self.validate_file(file_data, filename, content_type)
        if not validation["valid"]:
            raise ValueError(f"File validation failed: {'; '.join(validation['errors'])}")
        
        file_info = validation["file_info"]
        file_size = len(file_data)
        
        # Check storage quota
        quota_check = self.check_storage_quota(db, uploaded_by_id, team_id, file_size)
        if not quota_check["within_quota"]:
            raise ValueError(quota_check["error"])
        
        # Generate unique filename
        file_extension = Path(filename).suffix.lower()
        unique_filename = f"{uuid4()}{file_extension}"
        
        # Upload to storage backend
        if self.backend == "s3":
            file_path = self._upload_to_s3(file_data, unique_filename, content_type)
        else:
            file_path = self._upload_to_local(file_data, unique_filename)
        
        # Generate access token for private files
        access_token = None
        if not is_public:
            access_token = secrets.token_urlsafe(32)
        
        # Create database record
        attachment = FileAttachment(
            filename=unique_filename,
            original_filename=filename,
            content_type=file_info["detected_type"],
            file_size=file_size,
            file_path=file_path,
            file_hash=file_info["file_hash"],
            is_image=file_info["is_image"],
            image_width=file_info.get("image_width"),
            image_height=file_info.get("image_height"),
            uploaded_by_id=uploaded_by_id,
            is_public=is_public,
            access_token=access_token,
            task_id=task_id,
            comment_id=comment_id,
            team_id=team_id,
            virus_scan_status="pending"
        )
        
        db.add(attachment)
        
        # Generate thumbnail for images
        if file_info["is_image"]:
            try:
                thumbnail_path = self._generate_thumbnail(file_data, unique_filename)
                attachment.thumbnail_path = thumbnail_path
            except Exception as e:
                logger.warning(f"Failed to generate thumbnail for {filename}: {e}")
        
        # Update storage quota
        self._update_storage_quota(db, uploaded_by_id, team_id, file_size, increment=True)
        
        db.commit()
        db.refresh(attachment)
        
        # Schedule virus scan
        self._schedule_virus_scan(attachment.id)
        
        return attachment
    
    def get_file_content(self, file_attachment: FileAttachment) -> bytes:
        """Get file content from storage"""
        
        if self.backend == "s3":
            return self._get_from_s3(file_attachment.file_path)
        else:
            return self._get_from_local(file_attachment.file_path)
    
    def generate_download_url(
        self,
        file_attachment: FileAttachment,
        expires_in_seconds: int = 3600
    ) -> str:
        """Generate a temporary download URL"""
        
        if self.backend == "s3":
            return self._generate_s3_presigned_url(
                file_attachment.file_path,
                expires_in_seconds,
                file_attachment.original_filename
            )
        else:
            # For local storage, return API endpoint with access token
            return f"/api/v1/files/{file_attachment.id}/download?token={file_attachment.access_token}"
    
    def delete_file(
        self,
        db: Session,
        file_attachment: FileAttachment
    ) -> bool:
        """Delete file from storage and database"""
        
        try:
            # Delete from storage
            if self.backend == "s3":
                self._delete_from_s3(file_attachment.file_path)
                if file_attachment.thumbnail_path:
                    self._delete_from_s3(file_attachment.thumbnail_path)
            else:
                self._delete_from_local(file_attachment.file_path)
                if file_attachment.thumbnail_path:
                    self._delete_from_local(file_attachment.thumbnail_path)
            
            # Update storage quota
            self._update_storage_quota(
                db,
                file_attachment.uploaded_by_id,
                file_attachment.team_id,
                file_attachment.file_size,
                increment=False
            )
            
            # Delete database record
            db.delete(file_attachment)
            db.commit()
            
            return True
            
        except Exception as e:
            logger.error(f"Failed to delete file {file_attachment.id}: {e}")
            return False
    
    def log_file_access(
        self,
        db: Session,
        file_id: UUID,
        user_id: UUID,
        action: str,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None
    ):
        """Log file access for security and analytics"""
        
        access_log = FileAccessLog(
            file_id=file_id,
            user_id=user_id,
            action=action,
            ip_address=ip_address,
            user_agent=user_agent
        )
        
        db.add(access_log)
        db.commit()
    
    def check_file_permissions(
        self,
        file_attachment: FileAttachment,
        user_id: UUID,
        db: Session
    ) -> bool:
        """Check if user has permission to access file"""
        
        # Public files are accessible to everyone
        if file_attachment.is_public:
            return True
        
        # File owner always has access
        if file_attachment.uploaded_by_id == user_id:
            return True
        
        # Check team membership if file belongs to a team
        if file_attachment.team_id:
            from app.models import TeamMembership
            membership = db.query(TeamMembership).filter(
                and_(
                    TeamMembership.team_id == file_attachment.team_id,
                    TeamMembership.user_id == user_id,
                    TeamMembership.status == "active"
                )
            ).first()
            return membership is not None
        
        # Check task access if file belongs to a task
        if file_attachment.task_id:
            from app.models import Task
            task = db.query(Task).filter(Task.id == file_attachment.task_id).first()
            if task:
                # Check if user is assigned to task or is in the same team
                if task.assignee_id == user_id or task.creator_id == user_id:
                    return True
                if task.team_id:
                    from app.models import TeamMembership
                    membership = db.query(TeamMembership).filter(
                        and_(
                            TeamMembership.team_id == task.team_id,
                            TeamMembership.user_id == user_id,
                            TeamMembership.status == "active"
                        )
                    ).first()
                    return membership is not None
        
        return False
    
    # Private methods for storage backends
    
    def _upload_to_s3(self, file_data: bytes, filename: str, content_type: str) -> str:
        """Upload file to S3"""
        
        key = f"uploads/{filename}"
        
        try:
            self.s3_client.put_object(
                Bucket=self.bucket_name,
                Key=key,
                Body=file_data,
                ContentType=content_type,
                ServerSideEncryption='AES256'
            )
            return key
        except ClientError as e:
            logger.error(f"Failed to upload to S3: {e}")
            raise
    
    def _upload_to_local(self, file_data: bytes, filename: str) -> str:
        """Upload file to local storage"""
        
        # Organize files by date
        today = datetime.now().strftime("%Y/%m/%d")
        upload_path = self.upload_dir / today
        upload_path.mkdir(parents=True, exist_ok=True)
        
        file_path = upload_path / filename
        
        try:
            with open(file_path, 'wb') as f:
                f.write(file_data)
            return str(file_path.relative_to(self.upload_dir))
        except Exception as e:
            logger.error(f"Failed to upload to local storage: {e}")
            raise
    
    def _get_from_s3(self, key: str) -> bytes:
        """Get file content from S3"""
        
        try:
            response = self.s3_client.get_object(Bucket=self.bucket_name, Key=key)
            return response['Body'].read()
        except ClientError as e:
            logger.error(f"Failed to get file from S3: {e}")
            raise
    
    def _get_from_local(self, file_path: str) -> bytes:
        """Get file content from local storage"""
        
        full_path = self.upload_dir / file_path
        
        try:
            with open(full_path, 'rb') as f:
                return f.read()
        except Exception as e:
            logger.error(f"Failed to get file from local storage: {e}")
            raise
    
    def _delete_from_s3(self, key: str):
        """Delete file from S3"""
        
        try:
            self.s3_client.delete_object(Bucket=self.bucket_name, Key=key)
        except ClientError as e:
            logger.error(f"Failed to delete from S3: {e}")
            raise
    
    def _delete_from_local(self, file_path: str):
        """Delete file from local storage"""
        
        full_path = self.upload_dir / file_path
        
        try:
            if full_path.exists():
                full_path.unlink()
        except Exception as e:
            logger.error(f"Failed to delete from local storage: {e}")
            raise
    
    def _generate_s3_presigned_url(
        self,
        key: str,
        expires_in: int,
        filename: str
    ) -> str:
        """Generate presigned URL for S3 download"""
        
        try:
            response = self.s3_client.generate_presigned_url(
                'get_object',
                Params={
                    'Bucket': self.bucket_name,
                    'Key': key,
                    'ResponseContentDisposition': f'attachment; filename="{filename}"'
                },
                ExpiresIn=expires_in
            )
            return response
        except ClientError as e:
            logger.error(f"Failed to generate presigned URL: {e}")
            raise
    
    def _generate_thumbnail(self, file_data: bytes, filename: str) -> Optional[str]:
        """Generate thumbnail for image files"""
        
        try:
            import io
            
            # Open image
            image = Image.open(io.BytesIO(file_data))
            
            # Create thumbnail
            thumbnail_size = (200, 200)
            image.thumbnail(thumbnail_size, Image.Resampling.LANCZOS)
            
            # Save thumbnail
            thumbnail_filename = f"thumb_{filename}"
            
            if self.backend == "s3":
                # Save to S3
                thumbnail_buffer = io.BytesIO()
                image.save(thumbnail_buffer, format='JPEG', quality=80)
                thumbnail_data = thumbnail_buffer.getvalue()
                
                thumbnail_key = f"thumbnails/{thumbnail_filename}"
                self.s3_client.put_object(
                    Bucket=self.bucket_name,
                    Key=thumbnail_key,
                    Body=thumbnail_data,
                    ContentType='image/jpeg'
                )
                return thumbnail_key
            else:
                # Save to local storage
                thumbnail_dir = self.upload_dir / "thumbnails"
                thumbnail_dir.mkdir(exist_ok=True)
                
                thumbnail_path = thumbnail_dir / thumbnail_filename
                image.save(thumbnail_path, format='JPEG', quality=80)
                return str(thumbnail_path.relative_to(self.upload_dir))
                
        except Exception as e:
            logger.error(f"Failed to generate thumbnail: {e}")
            return None
    
    def _update_storage_quota(
        self,
        db: Session,
        user_id: UUID,
        team_id: Optional[UUID],
        file_size: int,
        increment: bool = True
    ):
        """Update storage quota usage"""
        
        quota = None
        if team_id:
            quota = db.query(FileStorageQuota).filter(
                FileStorageQuota.team_id == team_id
            ).first()
        else:
            quota = db.query(FileStorageQuota).filter(
                FileStorageQuota.user_id == user_id
            ).first()
        
        if quota:
            if increment:
                quota.used_bytes += file_size
                quota.files_count += 1
            else:
                quota.used_bytes = max(0, quota.used_bytes - file_size)
                quota.files_count = max(0, quota.files_count - 1)
            
            quota.last_calculated_at = datetime.utcnow()
            db.commit()
    
    def _schedule_virus_scan(self, file_id: UUID):
        """Schedule virus scan for uploaded file"""
        
        # This would integrate with a virus scanning service
        # For now, we'll mark files as clean after a delay
        from app.worker.tasks import scan_file_for_viruses
        scan_file_for_viruses.delay(str(file_id))


# Global storage service instance
storage_service = StorageService()


# Convenience functions
def upload_file(
    db: Session,
    file_data: bytes,
    filename: str,
    content_type: str,
    uploaded_by_id: UUID,
    **kwargs
) -> FileAttachment:
    """Convenience function to upload file"""
    return storage_service.upload_file(
        db=db,
        file_data=file_data,
        filename=filename,
        content_type=content_type,
        uploaded_by_id=uploaded_by_id,
        **kwargs
    )


def check_file_permissions(
    file_attachment: FileAttachment,
    user_id: UUID,
    db: Session
) -> bool:
    """Convenience function to check file permissions"""
    return storage_service.check_file_permissions(
        file_attachment=file_attachment,
        user_id=user_id,
        db=db
    )