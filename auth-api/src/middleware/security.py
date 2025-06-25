"""
Security middleware implementing OWASP guidelines and best practices.
Provides comprehensive protection against common web vulnerabilities.
"""

import time
import secrets
from typing import Optional, List, Dict, Any
from fastapi import Request, Response
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.middleware.cors import CORSMiddleware
from starlette.middleware.trustedhost import TrustedHostMiddleware
import logging

from src.config import settings

logger = logging.getLogger(__name__)


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """
    Middleware to add security headers following OWASP guidelines.
    
    Implements protection against:
    - XSS attacks
    - Clickjacking
    - MIME type sniffing
    - Information disclosure
    - Man-in-the-middle attacks
    """
    
    def __init__(self, app):
        super().__init__(app)
        self.security_headers = self._get_security_headers()
    
    def _get_security_headers(self) -> Dict[str, str]:
        """Generate security headers based on environment."""
        headers = {
            # Prevent XSS attacks
            "X-Content-Type-Options": "nosniff",
            "X-Frame-Options": "DENY",
            "X-XSS-Protection": "1; mode=block",
            
            # Content Security Policy
            "Content-Security-Policy": (
                "default-src 'self'; "
                "script-src 'self' 'unsafe-inline' 'unsafe-eval'; "
                "style-src 'self' 'unsafe-inline'; "
                "img-src 'self' data: https:; "
                "font-src 'self' data:; "
                "connect-src 'self'; "
                "frame-ancestors 'none'; "
                "base-uri 'self'; "
                "form-action 'self'"
            ),
            
            # Referrer policy
            "Referrer-Policy": "strict-origin-when-cross-origin",
            
            # Feature policy
            "Permissions-Policy": (
                "geolocation=(), "
                "microphone=(), "
                "camera=(), "
                "magnetometer=(), "
                "gyroscope=(), "
                "speaker=(), "
                "vibrate=(), "
                "fullscreen=(), "
                "payment=()"
            ),
            
            # Server information
            "Server": "FastAPI",
            
            # Cache control for sensitive responses
            "Cache-Control": "no-cache, no-store, must-revalidate",
            "Pragma": "no-cache",
            "Expires": "0"
        }
        
        # Add HSTS header for production HTTPS
        if settings.is_production:
            headers["Strict-Transport-Security"] = (
                "max-age=31536000; includeSubDomains; preload"
            )
        
        return headers
    
    async def dispatch(self, request: Request, call_next):
        """Add security headers to all responses."""
        response = await call_next(request)
        
        # Add security headers
        for header, value in self.security_headers.items():
            response.headers[header] = value
        
        # Add request ID for tracing
        request_id = getattr(request.state, "request_id", None)
        if request_id:
            response.headers["X-Request-ID"] = request_id
        
        return response


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    """
    Middleware for comprehensive request/response logging.
    
    Features:
    - Request timing
    - Request/response logging
    - Error tracking
    - Security event logging
    """
    
    def __init__(self, app):
        super().__init__(app)
    
    async def dispatch(self, request: Request, call_next):
        """Log request and response information."""
        # Generate unique request ID
        request_id = secrets.token_hex(8)
        request.state.request_id = request_id
        
        # Extract client information
        client_ip = self._get_client_ip(request)
        user_agent = request.headers.get("User-Agent", "unknown")
        
        start_time = time.time()
        
        # Log incoming request
        logger.info(
            f"Request started",
            extra={
                "request_id": request_id,
                "method": request.method,
                "url": str(request.url),
                "client_ip": client_ip,
                "user_agent": user_agent,
                "content_length": request.headers.get("Content-Length"),
                "content_type": request.headers.get("Content-Type")
            }
        )
        
        # Process request
        try:
            response = await call_next(request)
            
            # Calculate processing time
            process_time = time.time() - start_time
            
            # Log response
            logger.info(
                f"Request completed",
                extra={
                    "request_id": request_id,
                    "status_code": response.status_code,
                    "process_time": f"{process_time:.3f}s",
                    "response_size": response.headers.get("Content-Length")
                }
            )
            
            # Add timing header
            response.headers["X-Process-Time"] = f"{process_time:.3f}"
            
            return response
            
        except Exception as e:
            # Log error
            process_time = time.time() - start_time
            logger.error(
                f"Request failed",
                extra={
                    "request_id": request_id,
                    "error": str(e),
                    "error_type": type(e).__name__,
                    "process_time": f"{process_time:.3f}s"
                },
                exc_info=True
            )
            raise
    
    def _get_client_ip(self, request: Request) -> str:
        """Extract client IP address."""
        forwarded_for = request.headers.get("X-Forwarded-For")
        if forwarded_for:
            return forwarded_for.split(",")[0].strip()
        
        real_ip = request.headers.get("X-Real-IP")
        if real_ip:
            return real_ip
        
        return request.client.host if request.client else "unknown"


class InputSanitizationMiddleware(BaseHTTPMiddleware):
    """
    Middleware for input sanitization and validation.
    
    Provides protection against:
    - SQL injection attempts
    - XSS payload detection
    - Path traversal attacks
    - Malicious input patterns
    """
    
    def __init__(self, app):
        super().__init__(app)
        self.suspicious_patterns = [
            # SQL injection patterns
            r"union\s+select", r"drop\s+table", r"insert\s+into",
            r"delete\s+from", r"update\s+set", r"exec\s*\(",
            r"script>", r"javascript:", r"vbscript:",
            
            # XSS patterns
            r"<script", r"</script>", r"onclick\s*=", r"onerror\s*=",
            r"onload\s*=", r"document\.cookie", r"document\.write",
            
            # Path traversal
            r"\.\./", r"\.\.\\", r"~root", r"~admin",
            
            # Command injection
            r";\s*cat\s", r";\s*ls\s", r";\s*rm\s", r";\s*chmod\s",
            r"\|\s*nc\s", r"\|\s*netcat\s"
        ]
    
    async def dispatch(self, request: Request, call_next):
        """Sanitize and validate input."""
        try:
            # Check URL for suspicious patterns
            url_path = str(request.url.path).lower()
            query_string = str(request.url.query).lower()
            
            if self._contains_suspicious_content(url_path) or \
               self._contains_suspicious_content(query_string):
                logger.warning(
                    f"Suspicious request detected",
                    extra={
                        "client_ip": self._get_client_ip(request),
                        "url": str(request.url),
                        "user_agent": request.headers.get("User-Agent")
                    }
                )
                return JSONResponse(
                    status_code=400,
                    content={
                        "error": True,
                        "message": "Invalid request",
                        "error_code": "INVALID_INPUT"
                    }
                )
            
            # Check headers for suspicious content
            for header_name, header_value in request.headers.items():
                if self._contains_suspicious_content(header_value.lower()):
                    logger.warning(
                        f"Suspicious header detected: {header_name}",
                        extra={
                            "client_ip": self._get_client_ip(request),
                            "header": header_name,
                            "value": header_value[:100]  # Truncate for logging
                        }
                    )
                    return JSONResponse(
                        status_code=400,
                        content={
                            "error": True,
                            "message": "Invalid request headers",
                            "error_code": "INVALID_HEADERS"
                        }
                    )
            
            return await call_next(request)
            
        except Exception as e:
            logger.error(f"Input sanitization error: {e}")
            return await call_next(request)  # Allow request to proceed on error
    
    def _contains_suspicious_content(self, content: str) -> bool:
        """Check if content contains suspicious patterns."""
        import re
        
        for pattern in self.suspicious_patterns:
            if re.search(pattern, content, re.IGNORECASE):
                return True
        return False
    
    def _get_client_ip(self, request: Request) -> str:
        """Extract client IP address."""
        forwarded_for = request.headers.get("X-Forwarded-For")
        if forwarded_for:
            return forwarded_for.split(",")[0].strip()
        
        real_ip = request.headers.get("X-Real-IP")
        if real_ip:
            return real_ip
        
        return request.client.host if request.client else "unknown"


class ContentTypeValidationMiddleware(BaseHTTPMiddleware):
    """
    Middleware to validate Content-Type headers and prevent content type confusion.
    """
    
    def __init__(self, app):
        super().__init__(app)
        self.allowed_content_types = {
            "application/json",
            "application/x-www-form-urlencoded",
            "multipart/form-data",
            "text/plain"
        }
    
    async def dispatch(self, request: Request, call_next):
        """Validate content type for requests with body."""
        # Only check for methods that typically have bodies
        if request.method in ["POST", "PUT", "PATCH"]:
            content_type = request.headers.get("Content-Type", "").split(";")[0].strip()
            
            if content_type and content_type not in self.allowed_content_types:
                logger.warning(
                    f"Invalid content type: {content_type}",
                    extra={
                        "client_ip": self._get_client_ip(request),
                        "method": request.method,
                        "url": str(request.url)
                    }
                )
                return JSONResponse(
                    status_code=415,
                    content={
                        "error": True,
                        "message": "Unsupported media type",
                        "error_code": "UNSUPPORTED_MEDIA_TYPE"
                    }
                )
        
        return await call_next(request)
    
    def _get_client_ip(self, request: Request) -> str:
        """Extract client IP address."""
        forwarded_for = request.headers.get("X-Forwarded-For")
        if forwarded_for:
            return forwarded_for.split(",")[0].strip()
        
        real_ip = request.headers.get("X-Real-IP")
        if real_ip:
            return real_ip
        
        return request.client.host if request.client else "unknown"


def setup_cors_middleware(app):
    """
    Setup CORS middleware with secure configuration.
    """
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.security.cors_origins,
        allow_credentials=True,
        allow_methods=settings.security.cors_methods,
        allow_headers=settings.security.cors_headers,
        expose_headers=["X-Request-ID", "X-Process-Time", "X-RateLimit-Remaining"],
        max_age=3600  # Cache preflight responses for 1 hour
    )


def setup_trusted_host_middleware(app):
    """
    Setup trusted host middleware to prevent Host header attacks.
    """
    if settings.is_production:
        # In production, restrict to specific hosts
        allowed_hosts = ["api.yourdomain.com", "auth.yourdomain.com"]
    else:
        # In development, allow localhost and common development hosts
        allowed_hosts = ["localhost", "127.0.0.1", "0.0.0.0", "*.localhost"]
    
    app.add_middleware(
        TrustedHostMiddleware,
        allowed_hosts=allowed_hosts
    )


# Security middleware setup function
def setup_security_middleware(app):
    """
    Setup all security middleware in the correct order.
    
    Order is important:
    1. Trusted host validation
    2. CORS handling
    3. Security headers
    4. Input sanitization
    5. Content type validation
    6. Request logging
    """
    # Setup middleware in reverse order (last added = first executed)
    app.add_middleware(RequestLoggingMiddleware)
    app.add_middleware(ContentTypeValidationMiddleware)
    app.add_middleware(InputSanitizationMiddleware)
    app.add_middleware(SecurityHeadersMiddleware)
    setup_cors_middleware(app)
    setup_trusted_host_middleware(app)