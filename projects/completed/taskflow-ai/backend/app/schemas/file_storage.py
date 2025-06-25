from typing import Optional, List
from pydantic import BaseModel, ConfigDict
from uuid import UUID
from datetime import datetime


# File Upload Schemas
class FileUploadBase(BaseModel):
    filename: str
    content_type: str
    file_size: int


class FileUploadRequest(BaseModel):
    filename: str
    content_type: str
    file_size: int
    task_id: Optional[UUID] = None
    comment_id: Optional[UUID] = None
    team_id: Optional[UUID] = None


class FileUploadResponse(BaseModel):
    upload_url: str
    file_id: UUID
    expires_at: datetime


class FileAttachmentBase(BaseModel):
    filename: str
    original_filename: str
    content_type: str
    file_size: int
    is_public: bool = False


class FileAttachmentCreate(FileAttachmentBase):
    file_path: str
    uploaded_by_id: UUID
    task_id: Optional[UUID] = None
    comment_id: Optional[UUID] = None
    team_id: Optional[UUID] = None


class FileAttachmentUpdate(BaseModel):
    filename: Optional[str] = None
    is_public: Optional[bool] = None


class FileAttachment(FileAttachmentBase):
    id: UUID
    file_path: str
    file_hash: Optional[str] = None
    is_image: bool
    image_width: Optional[int] = None
    image_height: Optional[int] = None
    thumbnail_path: Optional[str] = None
    
    uploaded_by_id: UUID
    access_token: Optional[str] = None
    expires_at: Optional[datetime] = None
    download_count: int
    
    virus_scan_status: str
    virus_scan_result: Optional[str] = None
    scanned_at: Optional[datetime] = None
    
    task_id: Optional[UUID] = None
    comment_id: Optional[UUID] = None
    team_id: Optional[UUID] = None
    
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    # Uploader details
    uploaded_by_name: Optional[str] = None
    uploaded_by_avatar: Optional[str] = None
    
    model_config = ConfigDict(from_attributes=True)


class FileAttachmentResponse(BaseModel):
    files: List[FileAttachment]
    total: int
    page: int
    per_page: int


# File Access and Download
class FileAccessRequest(BaseModel):
    access_token: Optional[str] = None


class FileDownloadResponse(BaseModel):
    download_url: str
    expires_at: datetime
    filename: str
    content_type: str
    file_size: int


# Storage Quota
class StorageQuotaBase(BaseModel):
    quota_bytes: int


class StorageQuotaUpdate(StorageQuotaBase):
    pass


class StorageQuota(StorageQuotaBase):
    id: UUID
    user_id: Optional[UUID] = None
    team_id: Optional[UUID] = None
    used_bytes: int
    files_count: int
    last_calculated_at: datetime
    
    # Calculated fields
    usage_percentage: float
    available_bytes: int
    
    model_config = ConfigDict(from_attributes=True)


# File Management
class FileBulkOperation(BaseModel):
    file_ids: List[UUID]
    action: str  # delete, move, change_visibility


class FileSearchQuery(BaseModel):
    query: Optional[str] = None
    content_type: Optional[str] = None
    file_size_min: Optional[int] = None
    file_size_max: Optional[int] = None
    uploaded_after: Optional[datetime] = None
    uploaded_before: Optional[datetime] = None
    task_id: Optional[UUID] = None
    team_id: Optional[UUID] = None


class FileStats(BaseModel):
    total_files: int
    total_size_bytes: int
    files_by_type: dict
    recent_uploads: List[FileAttachment]
    largest_files: List[FileAttachment]
    storage_trend: List[dict]


# Image Processing
class ImageProcessingRequest(BaseModel):
    width: Optional[int] = None
    height: Optional[int] = None
    quality: Optional[int] = 85
    format: Optional[str] = None  # jpeg, png, webp


class ImageProcessingResponse(BaseModel):
    processed_url: str
    thumbnail_url: str
    expires_at: datetime