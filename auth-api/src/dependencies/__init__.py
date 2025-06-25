"""Dependencies module for FastAPI dependency injection."""

from .auth import (
    get_current_user,
    get_current_active_user,
    get_current_verified_user,
    get_optional_current_user,
    get_client_ip,
    get_user_agent,
    RequireRole,
    RequirePermission,
    require_admin,
    require_moderator,
    require_user_management,
    require_system_access
)

__all__ = [
    "get_current_user",
    "get_current_active_user",
    "get_current_verified_user",
    "get_optional_current_user",
    "get_client_ip",
    "get_user_agent",
    "RequireRole",
    "RequirePermission",
    "require_admin",
    "require_moderator",
    "require_user_management",
    "require_system_access"
]