from fastapi import Request, HTTPException
from fastapi.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware

from app.core.config import settings


# Create limiter instance
limiter = Limiter(
    key_func=get_remote_address,
    default_limits=[f"{settings.RATE_LIMIT_PER_HOUR}/hour"]
)


# Rate limit configurations for different endpoints
rate_limits = {
    # Auth endpoints - stricter limits
    "/api/v1/auth/login": f"{5}/minute",
    "/api/v1/auth/register": f"{3}/minute",
    "/api/v1/auth/refresh": f"{10}/minute",
    
    # AI endpoints - expensive operations (more restrictive)
    "/api/v1/tasks/*/ai/*": f"{15}/minute",
    "/api/v1/tasks/ai/*": f"{15}/minute",
    "/api/v1/tasks/ai/semantic-search": f"{10}/minute",
    "/api/v1/tasks/ai/batch-update-priorities": f"{5}/minute",
    "/api/v1/tasks/ai/generate-embeddings": f"{3}/minute",
    
    # General API endpoints
    "/api/v1/*": f"{settings.RATE_LIMIT_PER_MINUTE}/minute",
}


def get_rate_limit_key(request: Request) -> str:
    """Get rate limit key based on IP and user ID if authenticated"""
    # Get IP address
    ip = get_remote_address(request)
    
    # Try to get user ID from request state (set by auth middleware)
    user_id = getattr(request.state, "user_id", None)
    
    if user_id:
        return f"{ip}:{user_id}"
    return ip


# Custom rate limit exceeded handler
async def custom_rate_limit_exceeded_handler(request: Request, exc: RateLimitExceeded):
    response = JSONResponse(
        content={
            "detail": f"Rate limit exceeded: {exc.detail}",
            "type": "rate_limit_error"
        },
        status_code=429,
    )
    response.headers["Retry-After"] = str(exc.retry_after)
    response.headers["X-RateLimit-Limit"] = str(exc.limit)
    response.headers["X-RateLimit-Remaining"] = "0"
    response.headers["X-RateLimit-Reset"] = str(exc.reset)
    
    return response


# Middleware to add user ID to request state
async def add_user_to_request(request: Request, call_next):
    # Try to extract user ID from JWT token if present
    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        try:
            from jose import jwt
            token = auth_header.split(" ")[1]
            payload = jwt.decode(
                token, 
                settings.SECRET_KEY, 
                algorithms=[settings.ALGORITHM]
            )
            request.state.user_id = payload.get("sub")
        except:
            pass
    
    response = await call_next(request)
    return response