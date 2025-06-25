"""
Advanced rate limiting middleware with Redis backend.
Implements sliding window rate limiting with different strategies.
"""

import time
import hashlib
from typing import Optional, Dict, Any, Callable
from fastapi import Request, Response
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
import redis.asyncio as redis
import json
import logging

from src.config import settings
from src.exceptions import RateLimitExceededError

logger = logging.getLogger(__name__)


class RateLimitStrategy:
    """Base class for rate limiting strategies."""
    
    async def is_allowed(
        self,
        redis_client: redis.Redis,
        key: str,
        limit: int,
        window: int
    ) -> tuple[bool, Dict[str, Any]]:
        """
        Check if request is allowed under rate limit.
        
        Args:
            redis_client: Redis connection
            key: Rate limit key
            limit: Request limit
            window: Time window in seconds
            
        Returns:
            Tuple of (is_allowed, rate_limit_info)
        """
        raise NotImplementedError


class SlidingWindowStrategy(RateLimitStrategy):
    """
    Sliding window rate limiting strategy.
    Most accurate but slightly more expensive.
    """
    
    async def is_allowed(
        self,
        redis_client: redis.Redis,
        key: str,
        limit: int,
        window: int
    ) -> tuple[bool, Dict[str, Any]]:
        now = time.time()
        window_start = now - window
        
        # Use Redis pipeline for atomic operations
        pipe = redis_client.pipeline()
        
        # Remove old entries
        pipe.zremrangebyscore(key, 0, window_start)
        
        # Count current entries
        pipe.zcard(key)
        
        # Add current request
        pipe.zadd(key, {str(now): now})
        
        # Set expiration
        pipe.expire(key, window + 1)
        
        results = await pipe.execute()
        current_count = results[1]
        
        if current_count >= limit:
            # Remove the request we just added since it's not allowed
            await redis_client.zrem(key, str(now))
            
            # Get the oldest request time to calculate reset time
            oldest = await redis_client.zrange(key, 0, 0, withscores=True)
            reset_time = int(oldest[0][1] + window) if oldest else int(now + window)
            
            return False, {
                "limit": limit,
                "remaining": 0,
                "reset": reset_time,
                "retry_after": int(reset_time - now)
            }
        
        return True, {
            "limit": limit,
            "remaining": limit - current_count - 1,
            "reset": int(now + window),
            "retry_after": 0
        }


class FixedWindowStrategy(RateLimitStrategy):
    """
    Fixed window rate limiting strategy.
    Less accurate but more efficient.
    """
    
    async def is_allowed(
        self,
        redis_client: redis.Redis,
        key: str,
        limit: int,
        window: int
    ) -> tuple[bool, Dict[str, Any]]:
        now = int(time.time())
        window_key = f"{key}:{now // window}"
        
        # Increment counter
        pipe = redis_client.pipeline()
        pipe.incr(window_key)
        pipe.expire(window_key, window)
        results = await pipe.execute()
        
        current_count = results[0]
        
        if current_count > limit:
            reset_time = ((now // window) + 1) * window
            return False, {
                "limit": limit,
                "remaining": 0,
                "reset": reset_time,
                "retry_after": reset_time - now
            }
        
        reset_time = ((now // window) + 1) * window
        return True, {
            "limit": limit,
            "remaining": limit - current_count,
            "reset": reset_time,
            "retry_after": 0
        }


class RateLimitConfig:
    """Configuration for rate limiting rules."""
    
    def __init__(
        self,
        limit: int,
        window: int,
        strategy: RateLimitStrategy = None,
        key_func: Callable[[Request], str] = None,
        exempt_func: Callable[[Request], bool] = None,
        error_message: str = None
    ):
        self.limit = limit
        self.window = window
        self.strategy = strategy or SlidingWindowStrategy()
        self.key_func = key_func or self._default_key_func
        self.exempt_func = exempt_func
        self.error_message = error_message or f"Rate limit exceeded: {limit} requests per {window} seconds"
    
    def _default_key_func(self, request: Request) -> str:
        """Default key function using client IP."""
        client_ip = self._get_client_ip(request)
        return f"rate_limit:{client_ip}"
    
    def _get_client_ip(self, request: Request) -> str:
        """Get client IP address with proxy support."""
        # Check for forwarded headers
        forwarded_for = request.headers.get("X-Forwarded-For")
        if forwarded_for:
            # Take the first IP in the chain
            return forwarded_for.split(",")[0].strip()
        
        real_ip = request.headers.get("X-Real-IP")
        if real_ip:
            return real_ip
        
        # Fallback to direct connection IP
        return request.client.host if request.client else "unknown"


class RateLimiter:
    """
    Advanced rate limiter with Redis backend.
    
    Features:
    - Multiple rate limiting strategies
    - Per-endpoint and global rate limits
    - IP-based and user-based limiting
    - Sliding and fixed window algorithms
    - Configurable exemptions
    - Detailed rate limit headers
    """
    
    def __init__(self):
        self.redis = redis.from_url(settings.redis.url)
        self.global_config = RateLimitConfig(
            limit=settings.security.rate_limit_per_minute,
            window=60,
            strategy=SlidingWindowStrategy()
        )
        self.endpoint_configs: Dict[str, RateLimitConfig] = {}
        self._setup_default_configs()
    
    def _setup_default_configs(self):
        """Setup default rate limiting configurations."""
        # Authentication endpoints (stricter limits)
        auth_config = RateLimitConfig(
            limit=settings.security.auth_rate_limit_per_minute,
            window=60,
            strategy=SlidingWindowStrategy(),
            key_func=lambda req: f"auth_rate_limit:{self._get_client_ip(req)}",
            error_message="Too many authentication attempts. Please try again later."
        )
        
        self.endpoint_configs.update({
            "/api/v1/auth/login": auth_config,
            "/api/v1/auth/register": auth_config,
            "/api/v1/auth/refresh": auth_config,
            "/api/v1/auth/forgot-password": RateLimitConfig(
                limit=3,  # Very strict for password reset
                window=300,  # 5 minutes
                strategy=SlidingWindowStrategy(),
                key_func=lambda req: f"password_reset:{self._get_client_ip(req)}",
                error_message="Too many password reset attempts. Please wait 5 minutes."
            )
        })
    
    def add_endpoint_config(self, path: str, config: RateLimitConfig):
        """Add rate limiting configuration for specific endpoint."""
        self.endpoint_configs[path] = config
    
    async def check_rate_limit(self, request: Request) -> tuple[bool, Dict[str, Any]]:
        """
        Check if request should be rate limited.
        
        Args:
            request: FastAPI request object
            
        Returns:
            Tuple of (is_allowed, rate_limit_info)
        """
        # Get endpoint-specific config or use global
        path = request.url.path
        config = self.endpoint_configs.get(path, self.global_config)
        
        # Check if request is exempt
        if config.exempt_func and config.exempt_func(request):
            return True, {}
        
        # Generate rate limit key
        key = config.key_func(request)
        
        # Check rate limit
        try:
            is_allowed, info = await config.strategy.is_allowed(
                self.redis, key, config.limit, config.window
            )
            
            if not is_allowed:
                logger.warning(
                    f"Rate limit exceeded for {key} on {path}. "
                    f"Limit: {config.limit}/{config.window}s"
                )
            
            return is_allowed, info
            
        except Exception as e:
            logger.error(f"Rate limiting error: {e}")
            # In case of Redis failure, allow request but log error
            return True, {}
    
    def _get_client_ip(self, request: Request) -> str:
        """Get client IP address with proxy support."""
        forwarded_for = request.headers.get("X-Forwarded-For")
        if forwarded_for:
            return forwarded_for.split(",")[0].strip()
        
        real_ip = request.headers.get("X-Real-IP")
        if real_ip:
            return real_ip
        
        return request.client.host if request.client else "unknown"
    
    async def reset_rate_limit(self, key: str) -> bool:
        """
        Reset rate limit for a specific key.
        
        Args:
            key: Rate limit key to reset
            
        Returns:
            True if key was reset, False otherwise
        """
        try:
            result = await self.redis.delete(key)
            return result > 0
        except Exception as e:
            logger.error(f"Error resetting rate limit for {key}: {e}")
            return False
    
    async def get_rate_limit_info(self, key: str, config: RateLimitConfig) -> Dict[str, Any]:
        """
        Get current rate limit information for a key.
        
        Args:
            key: Rate limit key
            config: Rate limit configuration
            
        Returns:
            Rate limit information
        """
        try:
            _, info = await config.strategy.is_allowed(
                self.redis, key, config.limit, config.window
            )
            return info
        except Exception as e:
            logger.error(f"Error getting rate limit info for {key}: {e}")
            return {}
    
    async def close(self):
        """Close Redis connection."""
        try:
            await self.redis.close()
        except Exception as e:
            logger.error(f"Error closing Redis connection: {e}")


class RateLimitMiddleware(BaseHTTPMiddleware):
    """
    FastAPI middleware for rate limiting.
    Automatically applies rate limits to all requests.
    """
    
    def __init__(self, app, rate_limiter: RateLimiter = None):
        super().__init__(app)
        self.rate_limiter = rate_limiter or RateLimiter()
    
    async def dispatch(self, request: Request, call_next):
        """Process request with rate limiting."""
        # Skip rate limiting for health checks and metrics
        if request.url.path in ["/health", "/metrics", "/docs", "/openapi.json"]:
            return await call_next(request)
        
        # Check rate limit
        is_allowed, rate_info = await self.rate_limiter.check_rate_limit(request)
        
        if not is_allowed:
            # Create rate limit exceeded response
            headers = {
                "X-RateLimit-Limit": str(rate_info.get("limit", 0)),
                "X-RateLimit-Remaining": str(rate_info.get("remaining", 0)),
                "X-RateLimit-Reset": str(rate_info.get("reset", 0)),
                "Retry-After": str(rate_info.get("retry_after", 60))
            }
            
            error_response = {
                "error": True,
                "message": "Rate limit exceeded",
                "error_code": "RATE_LIMIT_EXCEEDED",
                "status_code": 429,
                "retry_after": rate_info.get("retry_after", 60)
            }
            
            return JSONResponse(
                status_code=429,
                content=error_response,
                headers=headers
            )
        
        # Process request
        response = await call_next(request)
        
        # Add rate limit headers to response
        if rate_info:
            response.headers["X-RateLimit-Limit"] = str(rate_info.get("limit", 0))
            response.headers["X-RateLimit-Remaining"] = str(rate_info.get("remaining", 0))
            response.headers["X-RateLimit-Reset"] = str(rate_info.get("reset", 0))
        
        return response


# User-based rate limiting functions
async def create_user_rate_limiter(user_id: str, redis_client: redis.Redis) -> RateLimiter:
    """
    Create a rate limiter for authenticated users.
    
    Args:
        user_id: User identifier
        redis_client: Redis connection
        
    Returns:
        Configured rate limiter
    """
    limiter = RateLimiter()
    
    # Higher limits for authenticated users
    user_config = RateLimitConfig(
        limit=settings.security.rate_limit_per_minute * 2,  # 2x global limit
        window=60,
        strategy=SlidingWindowStrategy(),
        key_func=lambda req: f"user_rate_limit:{user_id}",
        error_message="User rate limit exceeded"
    )
    
    # Override global config for authenticated users
    limiter.global_config = user_config
    
    return limiter


# Global rate limiter instance
rate_limiter = RateLimiter()