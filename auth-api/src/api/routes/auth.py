"""
Authentication API routes with comprehensive security features.
Implements OWASP security guidelines and industry best practices.
"""

from typing import Dict, Any
from fastapi import APIRouter, Depends, Request, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import logging

from src.database import get_async_session
from src.models import User
from src.services.auth_service import auth_service
from src.dependencies import (
    get_current_user, 
    get_current_active_user,
    get_client_ip,
    get_user_agent
)
from src.schemas import (
    UserRegistrationSchema,
    UserLoginSchema,
    TokenRefreshSchema,
    PasswordResetRequestSchema,
    PasswordResetConfirmSchema,
    PasswordChangeSchema,
    UserResponseSchema,
    TokenResponseSchema,
    AuthenticationResponseSchema,
    MessageResponseSchema,
    ErrorResponseSchema
)
from src.exceptions import (
    AuthenticationError,
    UserAlreadyExistsError,
    ValidationError,
    InvalidTokenError,
    TokenExpiredError,
    AccountLockedError
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post(
    "/register",
    response_model=AuthenticationResponseSchema,
    status_code=status.HTTP_201_CREATED,
    summary="Register new user",
    description="Create a new user account with email and password",
    responses={
        201: {"description": "User registered successfully"},
        400: {"model": ErrorResponseSchema, "description": "Invalid input"},
        409: {"model": ErrorResponseSchema, "description": "User already exists"},
        422: {"model": ErrorResponseSchema, "description": "Validation error"}
    }
)
async def register_user(
    user_data: UserRegistrationSchema,
    request: Request,
    session: AsyncSession = Depends(get_async_session)
) -> Dict[str, Any]:
    """
    Register a new user account.
    
    This endpoint creates a new user with the provided information.
    Passwords are automatically hashed using bcrypt.
    """
    try:
        # Check if user already exists
        result = await session.execute(
            select(User).where(User.email == user_data.email.lower())
        )
        existing_user = result.scalar_one_or_none()
        
        if existing_user:
            logger.warning(f"Registration attempt for existing email: {user_data.email}")
            raise UserAlreadyExistsError()
        
        # Create new user
        new_user = User(
            email=user_data.email.lower(),
            first_name=user_data.first_name,
            last_name=user_data.last_name
        )
        
        # Set password (automatically hashed)
        new_user.set_password(user_data.password)
        
        # Add user to session
        session.add(new_user)
        await session.flush()  # Get the user ID
        
        # Generate authentication tokens
        client_ip = get_client_ip(request)
        user_agent = get_user_agent(request)
        
        tokens = await auth_service._generate_token_pair(
            session, new_user, user_agent, client_ip
        )
        
        await session.commit()
        
        logger.info(f"New user registered: {new_user.email}")
        
        return {
            "user": UserResponseSchema.from_orm(new_user),
            "tokens": TokenResponseSchema(**tokens),
            "message": "User registered successfully"
        }
        
    except UserAlreadyExistsError:
        raise
    except ValidationError:
        raise
    except Exception as e:
        await session.rollback()
        logger.error(f"Registration error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Registration failed"
        )


@router.post(
    "/login",
    response_model=AuthenticationResponseSchema,
    summary="User login",
    description="Authenticate user with email and password",
    responses={
        200: {"description": "Login successful"},
        401: {"model": ErrorResponseSchema, "description": "Invalid credentials"},
        403: {"model": ErrorResponseSchema, "description": "Account locked"},
        422: {"model": ErrorResponseSchema, "description": "Validation error"}
    }
)
async def login_user(
    login_data: UserLoginSchema,
    request: Request,
    session: AsyncSession = Depends(get_async_session)
) -> Dict[str, Any]:
    """
    Authenticate user and return access/refresh tokens.
    
    This endpoint validates user credentials and returns JWT tokens
    for authenticated access to protected endpoints.
    """
    try:
        client_ip = get_client_ip(request)
        user_agent = get_user_agent(request)
        
        # Authenticate user
        user, tokens = await auth_service.authenticate_user(
            session=session,
            email=login_data.email,
            password=login_data.password,
            user_agent=user_agent,
            ip_address=client_ip
        )
        
        return {
            "user": UserResponseSchema.from_orm(user),
            "tokens": TokenResponseSchema(**tokens),
            "message": "Authentication successful"
        }
        
    except (AuthenticationError, AccountLockedError):
        raise
    except Exception as e:
        logger.error(f"Login error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Authentication failed"
        )


@router.post(
    "/refresh",
    response_model=TokenResponseSchema,
    summary="Refresh access token",
    description="Get new access token using refresh token",
    responses={
        200: {"description": "Token refreshed successfully"},
        401: {"model": ErrorResponseSchema, "description": "Invalid or expired refresh token"},
        422: {"model": ErrorResponseSchema, "description": "Validation error"}
    }
)
async def refresh_token(
    refresh_data: TokenRefreshSchema,
    request: Request,
    session: AsyncSession = Depends(get_async_session)
) -> Dict[str, Any]:
    """
    Refresh access token using a valid refresh token.
    
    This endpoint implements refresh token rotation for enhanced security.
    The old refresh token is invalidated and a new pair is issued.
    """
    try:
        client_ip = get_client_ip(request)
        user_agent = get_user_agent(request)
        
        # Refresh tokens
        tokens = await auth_service.refresh_tokens(
            session=session,
            refresh_token=refresh_data.refresh_token,
            user_agent=user_agent,
            ip_address=client_ip
        )
        
        return TokenResponseSchema(**tokens)
        
    except (InvalidTokenError, TokenExpiredError, AuthenticationError):
        raise
    except Exception as e:
        logger.error(f"Token refresh error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Token refresh failed"
        )


@router.post(
    "/logout",
    response_model=MessageResponseSchema,
    summary="User logout",
    description="Logout user and revoke refresh token",
    responses={
        200: {"description": "Logout successful"},
        401: {"model": ErrorResponseSchema, "description": "Authentication required"}
    }
)
async def logout_user(
    refresh_data: TokenRefreshSchema,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_async_session)
) -> Dict[str, Any]:
    """
    Logout user and revoke the provided refresh token.
    
    This endpoint invalidates the refresh token to prevent further use.
    The access token will expire naturally.
    """
    try:
        # Revoke the specific refresh token
        success = await auth_service.revoke_refresh_token(
            session=session,
            refresh_token=refresh_data.refresh_token,
            user_id=current_user.id
        )
        
        if success:
            logger.info(f"User {current_user.email} logged out successfully")
            return {
                "message": "Logout successful",
                "success": True
            }
        else:
            return {
                "message": "Logout completed (token already invalid)",
                "success": True
            }
            
    except Exception as e:
        logger.error(f"Logout error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Logout failed"
        )


@router.post(
    "/logout-all",
    response_model=MessageResponseSchema,
    summary="Logout from all devices",
    description="Revoke all refresh tokens for the user",
    responses={
        200: {"description": "All sessions terminated"},
        401: {"model": ErrorResponseSchema, "description": "Authentication required"}
    }
)
async def logout_all_devices(
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_async_session)
) -> Dict[str, Any]:
    """
    Logout user from all devices by revoking all refresh tokens.
    
    This endpoint invalidates all refresh tokens for the user,
    effectively logging them out from all devices.
    """
    try:
        # Revoke all refresh tokens for the user
        revoked_count = await auth_service.revoke_all_user_tokens(
            session=session,
            user_id=current_user.id
        )
        
        logger.info(f"User {current_user.email} logged out from all devices ({revoked_count} tokens)")
        
        return {
            "message": f"Logged out from all devices ({revoked_count} sessions terminated)",
            "success": True
        }
        
    except Exception as e:
        logger.error(f"Logout all error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Logout failed"
        )


@router.post(
    "/change-password",
    response_model=MessageResponseSchema,
    summary="Change password",
    description="Change user password with current password verification",
    responses={
        200: {"description": "Password changed successfully"},
        400: {"model": ErrorResponseSchema, "description": "Invalid current password"},
        401: {"model": ErrorResponseSchema, "description": "Authentication required"},
        422: {"model": ErrorResponseSchema, "description": "Validation error"}
    }
)
async def change_password(
    password_data: PasswordChangeSchema,
    current_user: User = Depends(get_current_active_user),
    session: AsyncSession = Depends(get_async_session)
) -> Dict[str, Any]:
    """
    Change user password with current password verification.
    
    This endpoint requires the current password for security.
    After password change, all refresh tokens are revoked.
    """
    try:
        # Verify current password
        if not current_user.verify_password(password_data.current_password):
            logger.warning(f"Invalid current password attempt for user {current_user.email}")
            raise AuthenticationError("Current password is incorrect")
        
        # Set new password
        current_user.set_password(password_data.new_password)
        
        # Revoke all refresh tokens for security
        await auth_service.revoke_all_user_tokens(
            session=session,
            user_id=current_user.id
        )
        
        await session.commit()
        
        logger.info(f"Password changed for user {current_user.email}")
        
        return {
            "message": "Password changed successfully. Please login again.",
            "success": True
        }
        
    except AuthenticationError:
        raise
    except Exception as e:
        await session.rollback()
        logger.error(f"Password change error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Password change failed"
        )


@router.get(
    "/me",
    response_model=UserResponseSchema,
    summary="Get current user",
    description="Get current authenticated user information",
    responses={
        200: {"description": "User information retrieved"},
        401: {"model": ErrorResponseSchema, "description": "Authentication required"}
    }
)
async def get_current_user_info(
    current_user: User = Depends(get_current_active_user)
) -> UserResponseSchema:
    """
    Get current authenticated user information.
    
    This endpoint returns the profile information of the
    currently authenticated user.
    """
    return UserResponseSchema.from_orm(current_user)


@router.get(
    "/verify-token",
    response_model=Dict[str, Any],
    summary="Verify access token",
    description="Verify if the current access token is valid",
    responses={
        200: {"description": "Token is valid"},
        401: {"model": ErrorResponseSchema, "description": "Invalid or expired token"}
    }
)
async def verify_token(
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Verify if the current access token is valid.
    
    This endpoint can be used by client applications to
    check token validity without making other API calls.
    """
    return {
        "valid": True,
        "user_id": str(current_user.id),
        "email": current_user.email,
        "is_active": current_user.is_active,
        "is_verified": current_user.is_verified
    }