"""
Pydantic schemas for authentication endpoints.
Provides comprehensive validation and serialization.
"""

from datetime import datetime
from typing import Optional, Dict, Any
from pydantic import BaseModel, EmailStr, Field, validator
from uuid import UUID
import re


class UserRegistrationSchema(BaseModel):
    """Schema for user registration."""
    
    email: EmailStr = Field(
        ...,
        description="User email address",
        example="user@example.com"
    )
    
    password: str = Field(
        ...,
        min_length=8,
        max_length=128,
        description="User password (min 8 characters)",
        example="SecurePass123!"
    )
    
    first_name: Optional[str] = Field(
        None,
        min_length=1,
        max_length=100,
        description="User first name",
        example="John"
    )
    
    last_name: Optional[str] = Field(
        None,
        min_length=1,
        max_length=100,
        description="User last name",
        example="Doe"
    )
    
    @validator("password")
    def validate_password_strength(cls, v):
        """Validate password strength requirements."""
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters long")
        
        if not re.search(r'[A-Z]', v):
            raise ValueError("Password must contain at least one uppercase letter")
        
        if not re.search(r'[a-z]', v):
            raise ValueError("Password must contain at least one lowercase letter")
        
        if not re.search(r'\d', v):
            raise ValueError("Password must contain at least one number")
        
        if not re.search(r'[!@#$%^&*(),.?":{}|<>]', v):
            raise ValueError("Password must contain at least one special character")
        
        # Check for common passwords
        common_passwords = {
            "password", "123456", "password123", "admin", "qwerty",
            "letmein", "welcome", "monkey", "dragon"
        }
        if v.lower() in common_passwords:
            raise ValueError("Password is too common")
        
        return v
    
    @validator("first_name", "last_name")
    def validate_names(cls, v):
        """Validate name fields."""
        if v is not None:
            # Remove extra whitespace
            v = v.strip()
            if not v:
                return None
            
            # Check for valid characters (letters, spaces, hyphens, apostrophes)
            if not re.match(r"^[a-zA-Z\s'-]+$", v):
                raise ValueError("Name contains invalid characters")
        
        return v


class UserLoginSchema(BaseModel):
    """Schema for user login."""
    
    email: EmailStr = Field(
        ...,
        description="User email address",
        example="user@example.com"
    )
    
    password: str = Field(
        ...,
        min_length=1,
        max_length=128,
        description="User password",
        example="SecurePass123!"
    )


class TokenRefreshSchema(BaseModel):
    """Schema for token refresh."""
    
    refresh_token: str = Field(
        ...,
        description="Refresh token",
        example="eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
    )


class PasswordResetRequestSchema(BaseModel):
    """Schema for password reset request."""
    
    email: EmailStr = Field(
        ...,
        description="User email address",
        example="user@example.com"
    )


class PasswordResetConfirmSchema(BaseModel):
    """Schema for password reset confirmation."""
    
    token: str = Field(
        ...,
        description="Password reset token",
        example="abc123def456"
    )
    
    new_password: str = Field(
        ...,
        min_length=8,
        max_length=128,
        description="New password",
        example="NewSecurePass123!"
    )
    
    @validator("new_password")
    def validate_password_strength(cls, v):
        """Validate password strength requirements."""
        return UserRegistrationSchema.validate_password_strength(v)


class PasswordChangeSchema(BaseModel):
    """Schema for password change."""
    
    current_password: str = Field(
        ...,
        description="Current password",
        example="OldPassword123!"
    )
    
    new_password: str = Field(
        ...,
        min_length=8,
        max_length=128,
        description="New password",
        example="NewSecurePass123!"
    )
    
    @validator("new_password")
    def validate_password_strength(cls, v):
        """Validate password strength requirements."""
        return UserRegistrationSchema.validate_password_strength(v)
    
    @validator("new_password")
    def validate_passwords_different(cls, v, values):
        """Ensure new password is different from current."""
        if "current_password" in values and v == values["current_password"]:
            raise ValueError("New password must be different from current password")
        return v


# Response Schemas
class UserResponseSchema(BaseModel):
    """Schema for user response data."""
    
    id: UUID = Field(
        ...,
        description="User ID",
        example="123e4567-e89b-12d3-a456-426614174000"
    )
    
    email: EmailStr = Field(
        ...,
        description="User email address",
        example="user@example.com"
    )
    
    first_name: Optional[str] = Field(
        None,
        description="User first name",
        example="John"
    )
    
    last_name: Optional[str] = Field(
        None,
        description="User last name",
        example="Doe"
    )
    
    is_active: bool = Field(
        ...,
        description="Account active status",
        example=True
    )
    
    is_verified: bool = Field(
        ...,
        description="Email verification status",
        example=True
    )
    
    created_at: datetime = Field(
        ...,
        description="Account creation timestamp",
        example="2023-01-01T00:00:00Z"
    )
    
    last_login_at: Optional[datetime] = Field(
        None,
        description="Last login timestamp",
        example="2023-12-01T12:00:00Z"
    )
    
    class Config:
        from_attributes = True
        json_encoders = {
            datetime: lambda v: v.isoformat(),
            UUID: lambda v: str(v)
        }


class TokenResponseSchema(BaseModel):
    """Schema for authentication token response."""
    
    access_token: str = Field(
        ...,
        description="JWT access token",
        example="eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
    )
    
    refresh_token: str = Field(
        ...,
        description="Refresh token",
        example="abc123def456ghi789"
    )
    
    token_type: str = Field(
        default="bearer",
        description="Token type",
        example="bearer"
    )
    
    expires_in: int = Field(
        ...,
        description="Access token expiration time in seconds",
        example=900
    )
    
    refresh_expires_in: int = Field(
        ...,
        description="Refresh token expiration time in seconds",
        example=604800
    )
    
    issued_at: str = Field(
        ...,
        description="Token issuance timestamp",
        example="2023-12-01T12:00:00Z"
    )


class AuthenticationResponseSchema(BaseModel):
    """Schema for authentication response."""
    
    user: UserResponseSchema = Field(
        ...,
        description="User information"
    )
    
    tokens: TokenResponseSchema = Field(
        ...,
        description="Authentication tokens"
    )
    
    message: str = Field(
        default="Authentication successful",
        description="Response message",
        example="Authentication successful"
    )


class MessageResponseSchema(BaseModel):
    """Schema for simple message responses."""
    
    message: str = Field(
        ...,
        description="Response message",
        example="Operation completed successfully"
    )
    
    success: bool = Field(
        default=True,
        description="Operation success status",
        example=True
    )


class ErrorResponseSchema(BaseModel):
    """Schema for error responses."""
    
    error: bool = Field(
        default=True,
        description="Error flag",
        example=True
    )
    
    message: str = Field(
        ...,
        description="Error message",
        example="An error occurred"
    )
    
    error_code: Optional[str] = Field(
        None,
        description="Specific error code",
        example="VALIDATION_ERROR"
    )
    
    status_code: int = Field(
        ...,
        description="HTTP status code",
        example=400
    )
    
    details: Optional[Dict[str, Any]] = Field(
        None,
        description="Additional error details",
        example={"field": "email", "issue": "invalid format"}
    )


class ValidationErrorResponseSchema(BaseModel):
    """Schema for validation error responses."""
    
    error: bool = Field(
        default=True,
        description="Error flag",
        example=True
    )
    
    message: str = Field(
        default="Validation failed",
        description="Error message",
        example="Validation failed"
    )
    
    error_code: str = Field(
        default="VALIDATION_ERROR",
        description="Error code",
        example="VALIDATION_ERROR"
    )
    
    status_code: int = Field(
        default=422,
        description="HTTP status code",
        example=422
    )
    
    validation_errors: list = Field(
        ...,
        description="List of validation errors",
        example=[
            {
                "field": "email",
                "message": "Invalid email format",
                "type": "value_error"
            }
        ]
    )


# Health Check Schema
class HealthCheckSchema(BaseModel):
    """Schema for health check response."""
    
    status: str = Field(
        ...,
        description="Service status",
        example="healthy"
    )
    
    timestamp: datetime = Field(
        ...,
        description="Health check timestamp",
        example="2023-12-01T12:00:00Z"
    )
    
    version: str = Field(
        ...,
        description="API version",
        example="1.0.0"
    )
    
    database: str = Field(
        ...,
        description="Database connection status",
        example="connected"
    )
    
    redis: str = Field(
        ...,
        description="Redis connection status",
        example="connected"
    )
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }