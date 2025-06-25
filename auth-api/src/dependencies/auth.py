"""
Authentication dependencies for FastAPI endpoints.
Provides secure authentication and authorization logic.
"""

from typing import Optional
from fastapi import Depends, HTTPException, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import logging

from src.database import get_async_session
from src.models import User
from src.services.auth_service import auth_service
from src.exceptions import (
    AuthenticationError,
    InvalidTokenError,
    TokenExpiredError,
    AccountLockedError
)

logger = logging.getLogger(__name__)

# Security scheme for OpenAPI documentation
security = HTTPBearer(
    scheme_name="Bearer Token",
    description="JWT Bearer token authentication"
)


async def get_current_user(
    request: Request,
    credentials: HTTPAuthorizationCredentials = Depends(security),
    session: AsyncSession = Depends(get_async_session)
) -> User:
    """
    Get current authenticated user from JWT token.
    
    Args:
        request: FastAPI request object
        credentials: HTTP Bearer credentials
        session: Database session
        
    Returns:
        Current authenticated user
        
    Raises:
        AuthenticationError: If authentication fails
        InvalidTokenError: If token is invalid
        TokenExpiredError: If token has expired
    """
    try:
        # Verify and decode the access token
        payload = auth_service.verify_access_token(credentials.credentials)
        user_id = payload.get("sub")
        
        if not user_id:
            logger.warning("Token missing user ID")
            raise AuthenticationError("Invalid token")
        
        # Fetch user from database
        result = await session.execute(
            select(User).where(User.id == user_id)
        )
        user = result.scalar_one_or_none()
        
        if not user:
            logger.warning(f"User not found for ID: {user_id}")
            raise AuthenticationError("User not found")
        
        # Check if user account is still valid
        can_login, reason = user.can_login()
        if not can_login:
            logger.warning(f"Authentication attempt for invalid account: {user.email}")
            if user.is_account_locked():
                raise AccountLockedError(reason)
            else:
                raise AuthenticationError(reason)
        
        # Log successful authentication (for monitoring)
        client_ip = get_client_ip(request)
        logger.info(f"Authenticated user {user.email} from IP {client_ip}")
        
        return user
        
    except (InvalidTokenError, TokenExpiredError, AuthenticationError):
        # Re-raise authentication errors as-is
        raise
    except Exception as e:
        logger.error(f"Authentication error: {e}")
        raise AuthenticationError("Authentication failed")


async def get_current_active_user(
    current_user: User = Depends(get_current_user)
) -> User:
    """
    Get current authenticated and active user.
    
    Args:
        current_user: Current authenticated user
        
    Returns:
        Active user
        
    Raises:
        AuthenticationError: If user is not active
    """
    if not current_user.is_active:
        logger.warning(f"Inactive user attempted access: {current_user.email}")
        raise AuthenticationError("Account is inactive")
    
    return current_user


async def get_current_verified_user(
    current_user: User = Depends(get_current_active_user)
) -> User:
    """
    Get current authenticated, active, and verified user.
    
    Args:
        current_user: Current active user
        
    Returns:
        Verified user
        
    Raises:
        AuthenticationError: If user is not verified
    """
    if not current_user.is_verified:
        logger.warning(f"Unverified user attempted access: {current_user.email}")
        raise AuthenticationError("Email verification required")
    
    return current_user


async def get_optional_current_user(
    request: Request,
    session: AsyncSession = Depends(get_async_session),
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(
        HTTPBearer(auto_error=False)
    )
) -> Optional[User]:
    """
    Get current user if authenticated, otherwise return None.
    Useful for optional authentication endpoints.
    
    Args:
        request: FastAPI request object
        session: Database session
        credentials: Optional HTTP Bearer credentials
        
    Returns:
        Current user or None if not authenticated
    """
    if not credentials:
        return None
    
    try:
        return await get_current_user(request, credentials, session)
    except (AuthenticationError, InvalidTokenError, TokenExpiredError):
        return None
    except Exception as e:
        logger.warning(f"Optional authentication failed: {e}")
        return None


def get_client_ip(request: Request) -> str:
    """
    Extract client IP address from request.
    
    Args:
        request: FastAPI request object
        
    Returns:
        Client IP address
    """
    # Check for forwarded headers (proxy/load balancer)
    forwarded_for = request.headers.get("X-Forwarded-For")
    if forwarded_for:
        # Take the first IP in the chain (original client)
        return forwarded_for.split(",")[0].strip()
    
    real_ip = request.headers.get("X-Real-IP")
    if real_ip:
        return real_ip
    
    # Fallback to direct connection IP
    return request.client.host if request.client else "unknown"


def get_user_agent(request: Request) -> Optional[str]:
    """
    Extract user agent from request.
    
    Args:
        request: FastAPI request object
        
    Returns:
        User agent string or None
    """
    return request.headers.get("User-Agent")


class RequireRole:
    """
    Dependency class for role-based access control.
    Can be extended to implement role hierarchies.
    """
    
    def __init__(self, required_roles: list[str]):
        self.required_roles = required_roles
    
    def __call__(self, current_user: User = Depends(get_current_verified_user)) -> User:
        """
        Check if current user has required roles.
        
        Args:
            current_user: Current verified user
            
        Returns:
            User if authorized
            
        Raises:
            AuthenticationError: If user lacks required roles
        """
        # Note: This is a placeholder for role-based access control
        # In a full implementation, you would have a roles system
        # For now, we'll use metadata or extend the User model
        
        user_role = current_user.get_metadata("role", "user")
        
        if user_role not in self.required_roles:
            logger.warning(
                f"User {current_user.email} attempted access requiring roles "
                f"{self.required_roles} but has role {user_role}"
            )
            raise AuthenticationError("Insufficient permissions")
        
        return current_user


class RequirePermission:
    """
    Dependency class for permission-based access control.
    Can be extended for fine-grained permissions.
    """
    
    def __init__(self, required_permissions: list[str]):
        self.required_permissions = required_permissions
    
    def __call__(self, current_user: User = Depends(get_current_verified_user)) -> User:
        """
        Check if current user has required permissions.
        
        Args:
            current_user: Current verified user
            
        Returns:
            User if authorized
            
        Raises:
            AuthenticationError: If user lacks required permissions
        """
        # Note: This is a placeholder for permission-based access control
        # In a full implementation, you would have a permissions system
        
        user_permissions = current_user.get_metadata("permissions", [])
        
        missing_permissions = set(self.required_permissions) - set(user_permissions)
        if missing_permissions:
            logger.warning(
                f"User {current_user.email} attempted access requiring permissions "
                f"{self.required_permissions} but lacks {missing_permissions}"
            )
            raise AuthenticationError("Insufficient permissions")
        
        return current_user


# Convenience functions for common role requirements
require_admin = RequireRole(["admin", "superuser"])
require_moderator = RequireRole(["admin", "superuser", "moderator"])

# Example permission requirements
require_user_management = RequirePermission(["user:read", "user:write"])
require_system_access = RequirePermission(["system:read", "system:write"])