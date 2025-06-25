"""API module for the authentication service."""

from .routes import auth_router, health_router

__all__ = ["auth_router", "health_router"]