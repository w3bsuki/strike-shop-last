from typing import Optional, List
from pydantic import BaseModel, EmailStr, ConfigDict
from uuid import UUID
from datetime import datetime


# Team Membership Schemas
class TeamMemberBase(BaseModel):
    role: str = "member"
    permissions: Optional[str] = None
    notification_settings: Optional[str] = None


class TeamMemberCreate(TeamMemberBase):
    user_id: UUID


class TeamMemberUpdate(BaseModel):
    role: Optional[str] = None
    permissions: Optional[str] = None
    notification_settings: Optional[str] = None
    is_favorite: Optional[bool] = None


class TeamMember(TeamMemberBase):
    id: UUID
    user_id: UUID
    team_id: UUID
    status: str
    invited_at: datetime
    joined_at: Optional[datetime] = None
    last_active_at: Optional[datetime] = None
    is_favorite: bool
    
    # User details (populated from relationship)
    user_email: Optional[str] = None
    user_full_name: Optional[str] = None
    user_avatar_url: Optional[str] = None
    
    model_config = ConfigDict(from_attributes=True)


# Team Invitation Schemas
class TeamInvitationBase(BaseModel):
    email: EmailStr
    role: str = "member"
    message: Optional[str] = None


class TeamInvitationCreate(TeamInvitationBase):
    pass


class TeamInvitationBulk(BaseModel):
    invitations: List[TeamInvitationBase]
    send_email: bool = True


class TeamInvitation(TeamInvitationBase):
    id: UUID
    team_id: UUID
    invited_by_id: UUID
    token: str
    status: str
    expires_at: datetime
    accepted_at: Optional[datetime] = None
    accepted_by_id: Optional[UUID] = None
    
    # Team details
    team_name: Optional[str] = None
    invited_by_name: Optional[str] = None
    
    model_config = ConfigDict(from_attributes=True)


class TeamInvitationAccept(BaseModel):
    token: str


# Team Management Responses
class TeamMembersResponse(BaseModel):
    members: List[TeamMember]
    total: int
    page: int
    per_page: int


class TeamInvitationsResponse(BaseModel):
    invitations: List[TeamInvitation]
    total: int
    page: int
    per_page: int


class BulkMemberOperation(BaseModel):
    user_ids: List[UUID]
    action: str  # remove, change_role, update_permissions
    role: Optional[str] = None
    permissions: Optional[str] = None


class TeamRolePermissions(BaseModel):
    role: str
    permissions: List[str]
    description: str


class TeamRolesResponse(BaseModel):
    roles: List[TeamRolePermissions]


# Team Activity Log
class TeamActivityLog(BaseModel):
    id: UUID
    user_id: UUID
    action: str
    target_type: str
    target_id: Optional[UUID] = None
    details: Optional[str] = None
    created_at: datetime
    
    # User details
    user_full_name: Optional[str] = None
    user_avatar_url: Optional[str] = None
    
    model_config = ConfigDict(from_attributes=True)


class TeamActivityResponse(BaseModel):
    activities: List[TeamActivityLog]
    total: int
    page: int
    per_page: int