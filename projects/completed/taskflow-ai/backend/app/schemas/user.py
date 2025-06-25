from typing import Optional, List
from pydantic import BaseModel, EmailStr, ConfigDict
from uuid import UUID
from datetime import datetime


# Base properties
class UserBase(BaseModel):
    email: Optional[EmailStr] = None
    username: Optional[str] = None
    full_name: Optional[str] = None
    is_active: bool = True
    is_superuser: bool = False
    avatar_url: Optional[str] = None
    timezone: str = "UTC"
    notification_preferences: str = "all"


# Properties to receive via API on creation
class UserCreate(UserBase):
    email: EmailStr
    username: str
    password: str


# Properties to receive via API on update
class UserUpdate(UserBase):
    password: Optional[str] = None


# Properties to return via API
class User(UserBase):
    id: UUID
    is_verified: bool
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    model_config = ConfigDict(from_attributes=True)


# Additional properties stored in DB
class UserInDB(User):
    hashed_password: str