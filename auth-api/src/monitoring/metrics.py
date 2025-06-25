"""
Prometheus metrics integration for comprehensive monitoring.
Provides performance, security, and business metrics collection.
"""

import time
import functools
from typing import Dict, Any, Optional, Callable
from prometheus_client import (
    Counter, Histogram, Gauge, Info, 
    generate_latest, CONTENT_TYPE_LATEST,
    CollectorRegistry, REGISTRY
)
from fastapi import Request, Response
from fastapi.responses import Response as FastAPIResponse
import logging

from src.config import settings

logger = logging.getLogger(__name__)

# Create custom registry for our metrics
app_registry = CollectorRegistry()

# === Application Metrics ===

# Request metrics
http_requests_total = Counter(
    'http_requests_total',
    'Total number of HTTP requests',
    ['method', 'endpoint', 'status_code'],
    registry=app_registry
)

http_request_duration = Histogram(
    'http_request_duration_seconds',
    'HTTP request duration in seconds',
    ['method', 'endpoint'],
    buckets=[0.1, 0.25, 0.5, 1.0, 2.5, 5.0, 10.0],
    registry=app_registry
)

http_request_size = Histogram(
    'http_request_size_bytes',
    'HTTP request size in bytes',
    ['method', 'endpoint'],
    buckets=[100, 1000, 10000, 100000, 1000000],
    registry=app_registry
)

http_response_size = Histogram(
    'http_response_size_bytes',
    'HTTP response size in bytes',
    ['method', 'endpoint'],
    buckets=[100, 1000, 10000, 100000, 1000000],
    registry=app_registry
)

# === Authentication Metrics ===

auth_attempts_total = Counter(
    'auth_attempts_total',
    'Total number of authentication attempts',
    ['status', 'method'],  # success/failure, login/register/refresh
    registry=app_registry
)

auth_failures_total = Counter(
    'auth_failures_total',
    'Total number of authentication failures',
    ['reason'],  # invalid_credentials, account_locked, etc.
    registry=app_registry
)

active_sessions = Gauge(
    'active_sessions_total',
    'Number of active user sessions',
    registry=app_registry
)

token_refresh_total = Counter(
    'token_refresh_total',
    'Total number of token refresh attempts',
    ['status'],  # success/failure
    registry=app_registry
)

password_changes_total = Counter(
    'password_changes_total',
    'Total number of password changes',
    registry=app_registry
)

# === Security Metrics ===

security_events_total = Counter(
    'security_events_total',
    'Total number of security events',
    ['event_type', 'severity'],
    registry=app_registry
)

rate_limit_hits_total = Counter(
    'rate_limit_hits_total',
    'Total number of rate limit violations',
    ['endpoint', 'limit_type'],
    registry=app_registry
)

suspicious_requests_total = Counter(
    'suspicious_requests_total',
    'Total number of suspicious requests detected',
    ['type'],  # sql_injection, xss, path_traversal, etc.
    registry=app_registry
)

account_lockouts_total = Counter(
    'account_lockouts_total',
    'Total number of account lockouts',
    registry=app_registry
)

# === Database Metrics ===

database_connections = Gauge(
    'database_connections_active',
    'Number of active database connections',
    registry=app_registry
)

database_query_duration = Histogram(
    'database_query_duration_seconds',
    'Database query duration in seconds',
    ['operation', 'table'],
    buckets=[0.01, 0.05, 0.1, 0.25, 0.5, 1.0, 2.5],
    registry=app_registry
)

database_errors_total = Counter(
    'database_errors_total',
    'Total number of database errors',
    ['error_type'],
    registry=app_registry
)

# === Cache Metrics ===

cache_operations_total = Counter(
    'cache_operations_total',
    'Total number of cache operations',
    ['operation', 'status'],  # get/set/delete, hit/miss/error
    registry=app_registry
)

cache_hit_ratio = Gauge(
    'cache_hit_ratio',
    'Cache hit ratio (0-1)',
    registry=app_registry
)

# === Business Metrics ===

users_registered_total = Counter(
    'users_registered_total',
    'Total number of users registered',
    registry=app_registry
)

active_users = Gauge(
    'active_users_total',
    'Number of active users',
    registry=app_registry
)

api_errors_total = Counter(
    'api_errors_total',
    'Total number of API errors',
    ['error_code', 'endpoint'],
    registry=app_registry
)

# === Application Info ===

app_info = Info(
    'app_info',
    'Application information',
    registry=app_registry
)

# Set application info
app_info.info({
    'version': settings.api_version,
    'environment': settings.environment,
    'name': settings.api_title
})


class MetricsCollector:
    """
    Central metrics collector for the authentication API.
    Provides high-level methods for recording metrics.
    """
    
    def __init__(self):
        self.cache_hits = 0
        self.cache_misses = 0
    
    def record_request(
        self,
        method: str,
        endpoint: str,
        status_code: int,
        duration: float,
        request_size: Optional[int] = None,
        response_size: Optional[int] = None
    ):
        """Record HTTP request metrics."""
        # Normalize endpoint (remove path parameters)
        normalized_endpoint = self._normalize_endpoint(endpoint)
        
        http_requests_total.labels(
            method=method,
            endpoint=normalized_endpoint,
            status_code=status_code
        ).inc()
        
        http_request_duration.labels(
            method=method,
            endpoint=normalized_endpoint
        ).observe(duration)
        
        if request_size:
            http_request_size.labels(
                method=method,
                endpoint=normalized_endpoint
            ).observe(request_size)
        
        if response_size:
            http_response_size.labels(
                method=method,
                endpoint=normalized_endpoint
            ).observe(response_size)
    
    def record_auth_attempt(self, method: str, success: bool, failure_reason: Optional[str] = None):
        """Record authentication attempt."""
        status = "success" if success else "failure"
        auth_attempts_total.labels(status=status, method=method).inc()
        
        if not success and failure_reason:
            auth_failures_total.labels(reason=failure_reason).inc()
    
    def record_security_event(self, event_type: str, severity: str):
        """Record security event."""
        security_events_total.labels(
            event_type=event_type,
            severity=severity
        ).inc()
    
    def record_rate_limit_hit(self, endpoint: str, limit_type: str):
        """Record rate limit violation."""
        rate_limit_hits_total.labels(
            endpoint=self._normalize_endpoint(endpoint),
            limit_type=limit_type
        ).inc()
    
    def record_suspicious_request(self, request_type: str):
        """Record suspicious request detection."""
        suspicious_requests_total.labels(type=request_type).inc()
    
    def record_account_lockout(self):
        """Record account lockout event."""
        account_lockouts_total.inc()
    
    def record_database_query(self, operation: str, table: str, duration: float):
        """Record database query metrics."""
        database_query_duration.labels(
            operation=operation,
            table=table
        ).observe(duration)
    
    def record_database_error(self, error_type: str):
        """Record database error."""
        database_errors_total.labels(error_type=error_type).inc()
    
    def record_cache_operation(self, operation: str, hit: bool):
        """Record cache operation."""
        status = "hit" if hit else "miss"
        cache_operations_total.labels(
            operation=operation,
            status=status
        ).inc()
        
        # Update hit ratio
        if hit:
            self.cache_hits += 1
        else:
            self.cache_misses += 1
        
        total_operations = self.cache_hits + self.cache_misses
        if total_operations > 0:
            hit_ratio = self.cache_hits / total_operations
            cache_hit_ratio.set(hit_ratio)
    
    def record_user_registration(self):
        """Record user registration."""
        users_registered_total.inc()
    
    def record_token_refresh(self, success: bool):
        """Record token refresh attempt."""
        status = "success" if success else "failure"
        token_refresh_total.labels(status=status).inc()
    
    def record_password_change(self):
        """Record password change."""
        password_changes_total.inc()
    
    def record_api_error(self, error_code: str, endpoint: str):
        """Record API error."""
        api_errors_total.labels(
            error_code=error_code,
            endpoint=self._normalize_endpoint(endpoint)
        ).inc()
    
    def update_active_sessions(self, count: int):
        """Update active sessions count."""
        active_sessions.set(count)
    
    def update_active_users(self, count: int):
        """Update active users count."""
        active_users.set(count)
    
    def update_database_connections(self, count: int):
        """Update database connections count."""
        database_connections.set(count)
    
    def _normalize_endpoint(self, endpoint: str) -> str:
        """
        Normalize endpoint path for metrics.
        Replace path parameters with placeholders.
        """
        import re
        
        # Replace UUIDs with placeholder
        endpoint = re.sub(
            r'/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}',
            '/{id}',
            endpoint
        )
        
        # Replace numeric IDs with placeholder
        endpoint = re.sub(r'/\d+', '/{id}', endpoint)
        
        return endpoint


# Global metrics collector instance
metrics = MetricsCollector()


def metrics_middleware(app):
    """
    Middleware to automatically collect HTTP request metrics.
    """
    @app.middleware("http")
    async def collect_metrics(request: Request, call_next):
        start_time = time.time()
        
        # Get request size
        request_size = None
        if hasattr(request, "headers"):
            content_length = request.headers.get("content-length")
            if content_length:
                try:
                    request_size = int(content_length)
                except ValueError:
                    pass
        
        # Process request
        response = await call_next(request)
        
        # Calculate duration
        duration = time.time() - start_time
        
        # Get response size
        response_size = None
        if hasattr(response, "headers"):
            content_length = response.headers.get("content-length")
            if content_length:
                try:
                    response_size = int(content_length)
                except ValueError:
                    pass
        
        # Record metrics
        metrics.record_request(
            method=request.method,
            endpoint=request.url.path,
            status_code=response.status_code,
            duration=duration,
            request_size=request_size,
            response_size=response_size
        )
        
        return response


def timed_operation(operation_type: str, table: Optional[str] = None):
    """
    Decorator to time database operations.
    
    Args:
        operation_type: Type of operation (select, insert, update, delete)
        table: Database table name
    """
    def decorator(func):
        @functools.wraps(func)
        async def wrapper(*args, **kwargs):
            start_time = time.time()
            try:
                result = await func(*args, **kwargs)
                duration = time.time() - start_time
                
                if table:
                    metrics.record_database_query(operation_type, table, duration)
                
                return result
            except Exception as e:
                duration = time.time() - start_time
                
                # Record error
                error_type = type(e).__name__
                metrics.record_database_error(error_type)
                
                if table:
                    metrics.record_database_query(operation_type, table, duration)
                
                raise
        return wrapper
    return decorator


async def get_metrics() -> str:
    """
    Get Prometheus metrics in text format.
    
    Returns:
        Metrics in Prometheus text format
    """
    try:
        return generate_latest(app_registry)
    except Exception as e:
        logger.error(f"Error generating metrics: {e}")
        return "# Error generating metrics\n"


async def get_metrics_response() -> FastAPIResponse:
    """
    Get metrics as FastAPI Response with proper content type.
    
    Returns:
        FastAPI Response with metrics
    """
    metrics_text = await get_metrics()
    return FastAPIResponse(
        content=metrics_text,
        media_type=CONTENT_TYPE_LATEST
    )