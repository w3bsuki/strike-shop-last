from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query, BackgroundTasks
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func
from uuid import UUID
import secrets
from datetime import datetime, timedelta

from app.api import deps
from app.core.config import settings
from app.db.session import get_db
from app.models import (
    Team, User, TeamMembership, TeamInvitation, 
    Task, Project, Activity
)
from app.schemas.team_management import (
    TeamMember, TeamMemberCreate, TeamMemberUpdate, TeamMembersResponse,
    TeamInvitation as TeamInvitationSchema, TeamInvitationCreate, 
    TeamInvitationBulk, TeamInvitationsResponse, TeamInvitationAccept,
    BulkMemberOperation, TeamRolesResponse, TeamRolePermissions,
    TeamActivityLog, TeamActivityResponse
)
from app.schemas.team import Team as TeamSchema, TeamCreate, TeamUpdate, TeamWithStats
from app.services.email_service import send_team_invitation_email
from app.services.notification_service import create_notification

router = APIRouter()

# Team CRUD Operations
@router.post("/", response_model=TeamSchema)
def create_team(
    *,
    db: Session = Depends(get_db),
    team_in: TeamCreate,
    current_user: User = Depends(deps.get_current_active_user)
):
    """Create a new team with the current user as owner"""
    
    # Check if slug is unique
    existing_team = db.query(Team).filter(Team.slug == team_in.slug).first()
    if existing_team:
        raise HTTPException(
            status_code=400,
            detail="A team with this slug already exists"
        )
    
    # Create team
    team = Team(**team_in.dict())
    db.add(team)
    db.flush()
    
    # Add creator as owner
    membership = TeamMembership(
        user_id=current_user.id,
        team_id=team.id,
        role="owner",
        status="active",
        joined_at=datetime.utcnow()
    )
    db.add(membership)
    
    # Log activity
    activity = Activity(
        user_id=current_user.id,
        team_id=team.id,
        action="team_created",
        details=f"Created team '{team.name}'"
    )
    db.add(activity)
    
    db.commit()
    db.refresh(team)
    return team


@router.get("/{team_id}", response_model=TeamWithStats)
def get_team(
    team_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_user)
):
    """Get team details with statistics"""
    
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
    
    # Get statistics
    members_count = db.query(TeamMembership).filter(
        and_(TeamMembership.team_id == team_id, TeamMembership.status == "active")
    ).count()
    
    projects_count = db.query(Project).filter(Project.team_id == team_id).count()
    
    tasks_count = db.query(Task).filter(Task.team_id == team_id).count()
    
    completed_tasks_count = db.query(Task).filter(
        and_(Task.team_id == team_id, Task.status == "completed")
    ).count()
    
    # Convert to response model
    team_dict = team.__dict__.copy()
    team_dict.update({
        "members_count": members_count,
        "projects_count": projects_count,
        "tasks_count": tasks_count,
        "completed_tasks_count": completed_tasks_count
    })
    
    return TeamWithStats(**team_dict)


@router.put("/{team_id}", response_model=TeamSchema)
def update_team(
    team_id: UUID,
    team_update: TeamUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_user)
):
    """Update team details (requires admin/owner role)"""
    
    # Check permissions
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
            detail="Insufficient permissions to update team"
        )
    
    team = db.query(Team).filter(Team.id == team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    
    # Update team fields
    update_data = team_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(team, field, value)
    
    # Log activity
    activity = Activity(
        user_id=current_user.id,
        team_id=team_id,
        action="team_updated",
        details=f"Updated team settings"
    )
    db.add(activity)
    
    db.commit()
    db.refresh(team)
    return team


# Team Member Management
@router.get("/{team_id}/members", response_model=TeamMembersResponse)
def get_team_members(
    team_id: UUID,
    page: int = Query(1, ge=1),
    per_page: int = Query(50, ge=1, le=100),
    role: Optional[str] = Query(None),
    status: Optional[str] = Query(None, regex="^(active|invited|suspended)$"),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_user)
):
    """Get team members with filtering and pagination"""
    
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
    
    # Build query
    query = db.query(TeamMembership).join(User).filter(
        TeamMembership.team_id == team_id
    )
    
    # Apply filters
    if role:
        query = query.filter(TeamMembership.role == role)
    
    if status:
        query = query.filter(TeamMembership.status == status)
    
    if search:
        query = query.filter(
            or_(
                User.full_name.ilike(f"%{search}%"),
                User.email.ilike(f"%{search}%"),
                User.username.ilike(f"%{search}%")
            )
        )
    
    # Get total count
    total = query.count()
    
    # Apply pagination
    offset = (page - 1) * per_page
    members = query.offset(offset).limit(per_page).all()
    
    # Convert to response model with user details
    member_data = []
    for member in members:
        member_dict = member.__dict__.copy()
        member_dict.update({
            "user_email": member.user.email,
            "user_full_name": member.user.full_name,
            "user_avatar_url": member.user.avatar_url
        })
        member_data.append(TeamMember(**member_dict))
    
    return TeamMembersResponse(
        members=member_data,
        total=total,
        page=page,
        per_page=per_page
    )


@router.post("/{team_id}/members", response_model=TeamMember)
def add_team_member(
    team_id: UUID,
    member_data: TeamMemberCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_user)
):
    """Add a user to the team (requires admin/owner role)"""
    
    # Check permissions
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
            detail="Insufficient permissions to add members"
        )
    
    # Check if user exists
    user = db.query(User).filter(User.id == member_data.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Check if user is already a member
    existing_membership = db.query(TeamMembership).filter(
        and_(
            TeamMembership.team_id == team_id,
            TeamMembership.user_id == member_data.user_id
        )
    ).first()
    
    if existing_membership:
        raise HTTPException(
            status_code=400, 
            detail="User is already a member of this team"
        )
    
    # Create membership
    new_membership = TeamMembership(
        user_id=member_data.user_id,
        team_id=team_id,
        role=member_data.role,
        permissions=member_data.permissions,
        notification_settings=member_data.notification_settings,
        status="active",
        invited_by_id=current_user.id,
        joined_at=datetime.utcnow()
    )
    db.add(new_membership)
    
    # Log activity
    activity = Activity(
        user_id=current_user.id,
        team_id=team_id,
        action="member_added",
        details=f"Added {user.full_name or user.email} as {member_data.role}"
    )
    db.add(activity)
    
    # Create notification for the new member
    create_notification(
        db=db,
        user_id=member_data.user_id,
        type="team_added",
        title="Added to Team",
        message=f"You have been added to the team by {current_user.full_name or current_user.email}",
        related_team_id=team_id
    )
    
    db.commit()
    db.refresh(new_membership)
    
    # Return with user details
    member_dict = new_membership.__dict__.copy()
    member_dict.update({
        "user_email": user.email,
        "user_full_name": user.full_name,
        "user_avatar_url": user.avatar_url
    })
    
    return TeamMember(**member_dict)


@router.put("/{team_id}/members/{member_id}", response_model=TeamMember)
def update_team_member(
    team_id: UUID,
    member_id: UUID,
    member_update: TeamMemberUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_user)
):
    """Update team member role and permissions"""
    
    # Check permissions
    current_membership = db.query(TeamMembership).filter(
        and_(
            TeamMembership.team_id == team_id,
            TeamMembership.user_id == current_user.id,
            TeamMembership.status == "active"
        )
    ).first()
    
    if not current_membership:
        raise HTTPException(status_code=404, detail="Team not found")
    
    # Get member to update
    member = db.query(TeamMembership).filter(
        and_(
            TeamMembership.id == member_id,
            TeamMembership.team_id == team_id
        )
    ).first()
    
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")
    
    # Check permissions (owners can update anyone, admins can update members/viewers)
    if current_membership.role == "owner":
        # Owners can update anyone except they can't demote themselves if they're the only owner
        if (member.user_id == current_user.id and 
            member_update.role and member_update.role != "owner"):
            owner_count = db.query(TeamMembership).filter(
                and_(
                    TeamMembership.team_id == team_id,
                    TeamMembership.role == "owner",
                    TeamMembership.status == "active"
                )
            ).count()
            if owner_count <= 1:
                raise HTTPException(
                    status_code=400,
                    detail="Cannot demote the only owner of the team"
                )
    elif current_membership.role == "admin":
        # Admins can only update members and viewers
        if member.role in ["owner", "admin"] and member.user_id != current_user.id:
            raise HTTPException(
                status_code=403,
                detail="Insufficient permissions to update this member"
            )
    else:
        # Members can only update themselves (limited fields)
        if member.user_id != current_user.id:
            raise HTTPException(
                status_code=403,
                detail="Can only update your own membership"
            )
    
    # Update fields
    update_data = member_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(member, field, value)
    
    # Log activity if role changed
    if member_update.role and member_update.role != member.role:
        activity = Activity(
            user_id=current_user.id,
            team_id=team_id,
            action="member_role_changed",
            details=f"Changed {member.user.full_name or member.user.email} role to {member_update.role}"
        )
        db.add(activity)
    
    db.commit()
    db.refresh(member)
    
    # Return with user details
    member_dict = member.__dict__.copy()
    member_dict.update({
        "user_email": member.user.email,
        "user_full_name": member.user.full_name,
        "user_avatar_url": member.user.avatar_url
    })
    
    return TeamMember(**member_dict)


@router.delete("/{team_id}/members/{member_id}")
def remove_team_member(
    team_id: UUID,
    member_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_user)
):
    """Remove a member from the team"""
    
    # Check permissions
    current_membership = db.query(TeamMembership).filter(
        and_(
            TeamMembership.team_id == team_id,
            TeamMembership.user_id == current_user.id,
            TeamMembership.role.in_(["owner", "admin"]),
            TeamMembership.status == "active"
        )
    ).first()
    
    if not current_membership:
        raise HTTPException(
            status_code=403,
            detail="Insufficient permissions to remove members"
        )
    
    # Get member to remove
    member = db.query(TeamMembership).filter(
        and_(
            TeamMembership.id == member_id,
            TeamMembership.team_id == team_id
        )
    ).first()
    
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")
    
    # Prevent removing the only owner
    if member.role == "owner":
        owner_count = db.query(TeamMembership).filter(
            and_(
                TeamMembership.team_id == team_id,
                TeamMembership.role == "owner",
                TeamMembership.status == "active"
            )
        ).count()
        if owner_count <= 1:
            raise HTTPException(
                status_code=400,
                detail="Cannot remove the only owner of the team"
            )
    
    # Remove member
    db.delete(member)
    
    # Log activity
    activity = Activity(
        user_id=current_user.id,
        team_id=team_id,
        action="member_removed",
        details=f"Removed {member.user.full_name or member.user.email} from team"
    )
    db.add(activity)
    
    db.commit()
    
    return {"message": "Member removed successfully"}


# Team Invitations
@router.post("/{team_id}/invitations", response_model=List[TeamInvitationSchema])
def create_team_invitations(
    team_id: UUID,
    invitations: TeamInvitationBulk,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_user)
):
    """Send team invitations via email"""
    
    # Check permissions
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
            detail="Insufficient permissions to invite members"
        )
    
    team = db.query(Team).filter(Team.id == team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    
    created_invitations = []
    
    for invitation_data in invitations.invitations:
        # Check if user is already a member
        existing_user = db.query(User).filter(User.email == invitation_data.email).first()
        if existing_user:
            existing_membership = db.query(TeamMembership).filter(
                and_(
                    TeamMembership.team_id == team_id,
                    TeamMembership.user_id == existing_user.id
                )
            ).first()
            if existing_membership:
                continue  # Skip existing members
        
        # Check for existing pending invitation
        existing_invitation = db.query(TeamInvitation).filter(
            and_(
                TeamInvitation.team_id == team_id,
                TeamInvitation.email == invitation_data.email,
                TeamInvitation.status == "pending"
            )
        ).first()
        
        if existing_invitation:
            continue  # Skip existing pending invitations
        
        # Create invitation
        token = secrets.token_urlsafe(32)
        invitation = TeamInvitation(
            team_id=team_id,
            invited_by_id=current_user.id,
            email=invitation_data.email,
            role=invitation_data.role,
            message=invitation_data.message,
            token=token,
            expires_at=datetime.utcnow() + timedelta(days=7)
        )
        db.add(invitation)
        db.flush()
        
        # Send email if requested
        if invitations.send_email:
            background_tasks.add_task(
                send_team_invitation_email,
                email=invitation_data.email,
                team_name=team.name,
                invited_by_name=current_user.full_name or current_user.email,
                invitation_token=token,
                custom_message=invitation_data.message
            )
        
        # Prepare response data
        invitation_dict = invitation.__dict__.copy()
        invitation_dict.update({
            "team_name": team.name,
            "invited_by_name": current_user.full_name or current_user.email
        })
        created_invitations.append(TeamInvitationSchema(**invitation_dict))
    
    # Log activity
    if created_invitations:
        activity = Activity(
            user_id=current_user.id,
            team_id=team_id,
            action="invitations_sent",
            details=f"Sent {len(created_invitations)} team invitations"
        )
        db.add(activity)
    
    db.commit()
    return created_invitations


@router.post("/invitations/accept", response_model=dict)
def accept_team_invitation(
    invitation_data: TeamInvitationAccept,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_user)
):
    """Accept a team invitation"""
    
    # Find invitation
    invitation = db.query(TeamInvitation).filter(
        and_(
            TeamInvitation.token == invitation_data.token,
            TeamInvitation.status == "pending",
            TeamInvitation.expires_at > datetime.utcnow()
        )
    ).first()
    
    if not invitation:
        raise HTTPException(
            status_code=404,
            detail="Invalid or expired invitation"
        )
    
    # Check if the current user's email matches the invitation
    if current_user.email != invitation.email:
        raise HTTPException(
            status_code=400,
            detail="Invitation email does not match your account"
        )
    
    # Check if user is already a member
    existing_membership = db.query(TeamMembership).filter(
        and_(
            TeamMembership.team_id == invitation.team_id,
            TeamMembership.user_id == current_user.id
        )
    ).first()
    
    if existing_membership:
        raise HTTPException(
            status_code=400,
            detail="You are already a member of this team"
        )
    
    # Create membership
    membership = TeamMembership(
        user_id=current_user.id,
        team_id=invitation.team_id,
        role=invitation.role,
        status="active",
        invited_by_id=invitation.invited_by_id,
        invited_at=invitation.created_at,
        joined_at=datetime.utcnow()
    )
    db.add(membership)
    
    # Update invitation
    invitation.status = "accepted"
    invitation.accepted_at = datetime.utcnow()
    invitation.accepted_by_id = current_user.id
    
    # Log activity
    activity = Activity(
        user_id=current_user.id,
        team_id=invitation.team_id,
        action="invitation_accepted",
        details=f"{current_user.full_name or current_user.email} joined the team"
    )
    db.add(activity)
    
    db.commit()
    
    return {"message": "Invitation accepted successfully", "team_id": invitation.team_id}


# Additional endpoints for bulk operations, roles, and activity logs...
@router.post("/{team_id}/members/bulk", response_model=dict)
def bulk_member_operation(
    team_id: UUID,
    operation: BulkMemberOperation,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_user)
):
    """Perform bulk operations on team members"""
    
    # Check permissions
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
            detail="Insufficient permissions for bulk operations"
        )
    
    # Perform operation based on action
    affected_count = 0
    
    if operation.action == "remove":
        # Remove selected members
        members_to_remove = db.query(TeamMembership).filter(
            and_(
                TeamMembership.team_id == team_id,
                TeamMembership.user_id.in_(operation.user_ids),
                TeamMembership.role != "owner"  # Prevent removing owners
            )
        ).all()
        
        for member in members_to_remove:
            db.delete(member)
            affected_count += 1
    
    elif operation.action == "change_role" and operation.role:
        # Change role for selected members
        members_to_update = db.query(TeamMembership).filter(
            and_(
                TeamMembership.team_id == team_id,
                TeamMembership.user_id.in_(operation.user_ids)
            )
        ).all()
        
        for member in members_to_update:
            # Don't change owner role unless there are multiple owners
            if member.role == "owner" and operation.role != "owner":
                owner_count = db.query(TeamMembership).filter(
                    and_(
                        TeamMembership.team_id == team_id,
                        TeamMembership.role == "owner",
                        TeamMembership.status == "active"
                    )
                ).count()
                if owner_count <= 1:
                    continue
            
            member.role = operation.role
            affected_count += 1
    
    # Log activity
    if affected_count > 0:
        activity = Activity(
            user_id=current_user.id,
            team_id=team_id,
            action=f"bulk_{operation.action}",
            details=f"Performed {operation.action} on {affected_count} members"
        )
        db.add(activity)
    
    db.commit()
    
    return {
        "message": f"Bulk operation completed",
        "affected_count": affected_count
    }


@router.get("/roles", response_model=TeamRolesResponse)
def get_team_roles():
    """Get available team roles and their permissions"""
    
    roles = [
        TeamRolePermissions(
            role="owner",
            permissions=[
                "team.manage", "team.delete", "members.manage", "members.invite",
                "members.remove", "projects.manage", "tasks.manage", "settings.manage"
            ],
            description="Full access to team management and settings"
        ),
        TeamRolePermissions(
            role="admin",
            permissions=[
                "members.invite", "members.manage", "projects.manage", 
                "tasks.manage", "settings.view"
            ],
            description="Can manage members, projects, and tasks"
        ),
        TeamRolePermissions(
            role="member",
            permissions=[
                "projects.view", "projects.create", "tasks.manage", "tasks.view"
            ],
            description="Can create and manage projects and tasks"
        ),
        TeamRolePermissions(
            role="viewer",
            permissions=["projects.view", "tasks.view"],
            description="Read-only access to projects and tasks"
        )
    ]
    
    return TeamRolesResponse(roles=roles)


@router.get("/{team_id}/activity", response_model=TeamActivityResponse)
def get_team_activity(
    team_id: UUID,
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    action_type: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_active_user)
):
    """Get team activity log with filtering and pagination"""
    
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
    
    # Build query
    query = db.query(Activity).join(User).filter(Activity.team_id == team_id)
    
    if action_type:
        query = query.filter(Activity.action.ilike(f"%{action_type}%"))
    
    # Get total count
    total = query.count()
    
    # Apply pagination and ordering
    offset = (page - 1) * per_page
    activities = query.order_by(Activity.created_at.desc()).offset(offset).limit(per_page).all()
    
    # Convert to response model
    activity_data = []
    for activity in activities:
        activity_dict = activity.__dict__.copy()
        activity_dict.update({
            "user_full_name": activity.user.full_name,
            "user_avatar_url": activity.user.avatar_url
        })
        activity_data.append(TeamActivityLog(**activity_dict))
    
    return TeamActivityResponse(
        activities=activity_data,
        total=total,
        page=page,
        per_page=per_page
    )