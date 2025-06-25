"""
Custom exceptions for the Authentication API.
Provides comprehensive error handling with security considerations.
"""

from typing import Optional, Dict, Any
from fastapi import HTTPException
from starlette.status import (
    HTTP_400_BAD_REQUEST,
    HTTP_401_UNAUTHORIZED,
    HTTP_403_FORBIDDEN,
    HTTP_404_NOT_FOUND,
    HTTP_409_CONFLICT,
    HTTP_422_UNPROCESSABLE_ENTITY,
    HTTP_429_TOO_MANY_REQUESTS,
    HTTP_500_INTERNAL_SERVER_ERROR
)


class BaseAPIException(HTTPException):
    """
    Base exception class for API errors.
    Provides consistent error structure and logging.
    """
    
    def __init__(
        self,
        status_code: int,
        detail: str,
        error_code: Optional[str] = None,
        extra_data: Optional[Dict[str, Any]] = None
    ):
        super().__init__(status_code=status_code, detail=detail)
        self.error_code = error_code
        self.extra_data = extra_data or {}
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert exception to dictionary for JSON response."""
        result = {
            "error": True,
            "message": self.detail,
            "status_code": self.status_code
        }
        
        if self.error_code:
            result["error_code"] = self.error_code
        
        if self.extra_data:
            result.update(self.extra_data)
        
        return result


# Authentication and Authorization Exceptions
class AuthenticationError(BaseAPIException):
    """Raised when authentication fails."""
    
    def __init__(
        self,
        detail: str = "Authentication failed",
        error_code: str = "AUTH_FAILED",
        extra_data: Optional[Dict[str, Any]] = None
    ):
        super().__init__(
            status_code=HTTP_401_UNAUTHORIZED,
            detail=detail,
            error_code=error_code,
            extra_data=extra_data
        )


class AuthorizationError(BaseAPIException):
    """Raised when user lacks required permissions."""
    
    def __init__(
        self,
        detail: str = "Insufficient permissions",
        error_code: str = "INSUFFICIENT_PERMISSIONS",
        extra_data: Optional[Dict[str, Any]] = None
    ):
        super().__init__(
            status_code=HTTP_403_FORBIDDEN,
            detail=detail,
            error_code=error_code,
            extra_data=extra_data
        )


class AccountLockedError(BaseAPIException):
    """Raised when account is locked due to security reasons."""
    
    def __init__(
        self,
        detail: str = "Account is temporarily locked",
        error_code: str = "ACCOUNT_LOCKED",
        extra_data: Optional[Dict[str, Any]] = None
    ):
        super().__init__(
            status_code=HTTP_403_FORBIDDEN,
            detail=detail,
            error_code=error_code,
            extra_data=extra_data
        )


# Token-related Exceptions
class InvalidTokenError(BaseAPIException):
    """Raised when token is invalid or malformed."""
    
    def __init__(
        self,
        detail: str = "Invalid token",
        error_code: str = "INVALID_TOKEN",
        extra_data: Optional[Dict[str, Any]] = None
    ):
        super().__init__(
            status_code=HTTP_401_UNAUTHORIZED,
            detail=detail,
            error_code=error_code,
            extra_data=extra_data
        )


class TokenExpiredError(BaseAPIException):
    """Raised when token has expired."""
    
    def __init__(
        self,
        detail: str = "Token has expired",
        error_code: str = "TOKEN_EXPIRED",
        extra_data: Optional[Dict[str, Any]] = None
    ):
        super().__init__(
            status_code=HTTP_401_UNAUTHORIZED,
            detail=detail,
            error_code=error_code,
            extra_data=extra_data
        )


# Validation Exceptions
class ValidationError(BaseAPIException):
    """Raised when input validation fails."""
    
    def __init__(
        self,
        detail: str = "Validation failed",
        error_code: str = "VALIDATION_ERROR",
        extra_data: Optional[Dict[str, Any]] = None
    ):
        super().__init__(
            status_code=HTTP_422_UNPROCESSABLE_ENTITY,
            detail=detail,
            error_code=error_code,
            extra_data=extra_data
        )


class PasswordValidationError(ValidationError):
    """Raised when password doesn't meet security requirements."""
    
    def __init__(
        self,
        detail: str = "Password doesn't meet security requirements",
        error_code: str = "WEAK_PASSWORD",
        extra_data: Optional[Dict[str, Any]] = None
    ):
        super().__init__(
            detail=detail,
            error_code=error_code,
            extra_data=extra_data
        )


# Resource Exceptions
class ResourceNotFoundError(BaseAPIException):
    """Raised when requested resource is not found."""
    
    def __init__(
        self,
        detail: str = "Resource not found",
        error_code: str = "RESOURCE_NOT_FOUND",
        extra_data: Optional[Dict[str, Any]] = None
    ):
        super().__init__(
            status_code=HTTP_404_NOT_FOUND,
            detail=detail,
            error_code=error_code,
            extra_data=extra_data
        )


class ResourceConflictError(BaseAPIException):
    """Raised when resource already exists or conflicts with existing data."""
    
    def __init__(
        self,
        detail: str = "Resource conflict",
        error_code: str = "RESOURCE_CONFLICT",
        extra_data: Optional[Dict[str, Any]] = None
    ):
        super().__init__(
            status_code=HTTP_409_CONFLICT,
            detail=detail,
            error_code=error_code,
            extra_data=extra_data
        )


class UserAlreadyExistsError(ResourceConflictError):
    """Raised when attempting to create user with existing email."""
    
    def __init__(
        self,
        detail: str = "User with this email already exists",
        error_code: str = "USER_EXISTS",
        extra_data: Optional[Dict[str, Any]] = None
    ):
        super().__init__(
            detail=detail,
            error_code=error_code,
            extra_data=extra_data
        )


# Rate Limiting Exceptions
class RateLimitExceededError(BaseAPIException):
    """Raised when rate limit is exceeded."""
    
    def __init__(
        self,
        detail: str = "Rate limit exceeded",
        error_code: str = "RATE_LIMIT_EXCEEDED",
        retry_after: Optional[int] = None,
        extra_data: Optional[Dict[str, Any]] = None
    ):
        if retry_after:
            extra_data = extra_data or {}
            extra_data["retry_after"] = retry_after
        
        super().__init__(
            status_code=HTTP_429_TOO_MANY_REQUESTS,
            detail=detail,
            error_code=error_code,
            extra_data=extra_data
        )


# System Exceptions
class DatabaseError(BaseAPIException):
    """Raised when database operation fails."""
    
    def __init__(
        self,
        detail: str = "Database operation failed",
        error_code: str = "DATABASE_ERROR",
        extra_data: Optional[Dict[str, Any]] = None
    ):
        super().__init__(
            status_code=HTTP_500_INTERNAL_SERVER_ERROR,
            detail=detail,
            error_code=error_code,
            extra_data=extra_data
        )


class ExternalServiceError(BaseAPIException):
    """Raised when external service call fails."""
    
    def __init__(
        self,
        detail: str = "External service unavailable",
        error_code: str = "EXTERNAL_SERVICE_ERROR",
        extra_data: Optional[Dict[str, Any]] = None
    ):
        super().__init__(
            status_code=HTTP_500_INTERNAL_SERVER_ERROR,
            detail=detail,
            error_code=error_code,
            extra_data=extra_data
        )


class ConfigurationError(BaseAPIException):
    """Raised when configuration is invalid or missing."""
    
    def __init__(
        self,
        detail: str = "Configuration error",
        error_code: str = "CONFIG_ERROR",
        extra_data: Optional[Dict[str, Any]] = None
    ):
        super().__init__(
            status_code=HTTP_500_INTERNAL_SERVER_ERROR,
            detail=detail,
            error_code=error_code,
            extra_data=extra_data
        )


# Helper Functions
def handle_database_error(error: Exception) -> DatabaseError:
    """
    Convert database exceptions to standardized API exceptions.
    
    Args:
        error: Original database exception
        
    Returns:
        Standardized database error
    """
    error_message = str(error)
    
    # Don't expose sensitive database information in production
    if "duplicate key" in error_message.lower():
        return ResourceConflictError("Resource already exists")
    elif "foreign key" in error_message.lower():
        return ValidationError("Invalid reference")
    elif "not null" in error_message.lower():
        return ValidationError("Required field missing")
    else:
        return DatabaseError("Database operation failed")


def sanitize_error_message(message: str, is_production: bool = True) -> str:
    """
    Sanitize error messages to prevent information leakage.
    
    Args:
        message: Original error message
        is_production: Whether running in production
        
    Returns:
        Sanitized error message
    """
    if not is_production:
        return message
    
    # In production, return generic messages for security
    sensitive_keywords = [
        "sql", "database", "connection", "query", "table",
        "column", "constraint", "index", "password", "hash"
    ]
    
    message_lower = message.lower()
    if any(keyword in message_lower for keyword in sensitive_keywords):
        return "An error occurred while processing your request"
    
    return message