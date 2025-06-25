"""
Prometheus metrics endpoint for monitoring.
"""

from fastapi import APIRouter, Response
from prometheus_client import (
    Counter, Histogram, Gauge, 
    generate_latest, CONTENT_TYPE_LATEST,
    CollectorRegistry
)
import time
import psutil
import os

# Create a custom registry to avoid duplicate metrics
REGISTRY = CollectorRegistry()

# Request metrics
REQUEST_COUNT = Counter(
    'http_requests_total',
    'Total HTTP requests',
    ['method', 'endpoint', 'status'],
    registry=REGISTRY
)

REQUEST_DURATION = Histogram(
    'http_request_duration_seconds',
    'HTTP request duration in seconds',
    ['method', 'endpoint'],
    registry=REGISTRY
)

# Task metrics
TASK_COUNT = Counter(
    'tasks_total',
    'Total number of tasks',
    ['status', 'task_type'],
    registry=REGISTRY
)

TASK_DURATION = Histogram(
    'task_duration_seconds',
    'Task execution duration in seconds',
    ['task_type'],
    registry=REGISTRY
)

# Active users gauge
ACTIVE_USERS = Gauge(
    'active_users',
    'Number of active users',
    registry=REGISTRY
)

# WebSocket connections gauge
WEBSOCKET_CONNECTIONS = Gauge(
    'websocket_connections',
    'Number of active WebSocket connections',
    registry=REGISTRY
)

# System metrics
SYSTEM_CPU_USAGE = Gauge(
    'system_cpu_usage_percent',
    'System CPU usage percentage',
    registry=REGISTRY
)

SYSTEM_MEMORY_USAGE = Gauge(
    'system_memory_usage_percent',
    'System memory usage percentage',
    registry=REGISTRY
)

SYSTEM_DISK_USAGE = Gauge(
    'system_disk_usage_percent',
    'System disk usage percentage',
    registry=REGISTRY
)

# Database metrics
DB_CONNECTION_POOL_SIZE = Gauge(
    'database_connection_pool_size',
    'Database connection pool size',
    registry=REGISTRY
)

DB_CONNECTION_POOL_USED = Gauge(
    'database_connection_pool_used',
    'Number of used database connections',
    registry=REGISTRY
)

# Redis metrics
REDIS_CONNECTED_CLIENTS = Gauge(
    'redis_connected_clients',
    'Number of Redis connected clients',
    registry=REGISTRY
)

REDIS_USED_MEMORY = Gauge(
    'redis_used_memory_bytes',
    'Redis used memory in bytes',
    registry=REGISTRY
)

router = APIRouter()


def update_system_metrics():
    """Update system metrics."""
    try:
        # CPU usage
        cpu_percent = psutil.cpu_percent(interval=1)
        SYSTEM_CPU_USAGE.set(cpu_percent)
        
        # Memory usage
        memory = psutil.virtual_memory()
        SYSTEM_MEMORY_USAGE.set(memory.percent)
        
        # Disk usage
        disk = psutil.disk_usage('/')
        SYSTEM_DISK_USAGE.set(disk.percent)
        
    except Exception as e:
        print(f"Error updating system metrics: {e}")


@router.get("/metrics")
async def get_metrics() -> Response:
    """
    Prometheus metrics endpoint.
    Returns metrics in Prometheus text format.
    """
    # Update system metrics before generating response
    update_system_metrics()
    
    # Generate metrics
    metrics_data = generate_latest(REGISTRY)
    
    return Response(
        content=metrics_data,
        media_type=CONTENT_TYPE_LATEST
    )


# Middleware helper to track request metrics
class MetricsMiddleware:
    """Middleware to track HTTP request metrics."""
    
    @staticmethod
    def track_request(method: str, endpoint: str, status_code: int, duration: float):
        """Track request metrics."""
        REQUEST_COUNT.labels(
            method=method,
            endpoint=endpoint,
            status=str(status_code)
        ).inc()
        
        REQUEST_DURATION.labels(
            method=method,
            endpoint=endpoint
        ).observe(duration)
    
    @staticmethod
    def track_task(task_type: str, status: str, duration: float = None):
        """Track task metrics."""
        TASK_COUNT.labels(
            status=status,
            task_type=task_type
        ).inc()
        
        if duration is not None:
            TASK_DURATION.labels(
                task_type=task_type
            ).observe(duration)
    
    @staticmethod
    def set_active_users(count: int):
        """Set active users count."""
        ACTIVE_USERS.set(count)
    
    @staticmethod
    def set_websocket_connections(count: int):
        """Set WebSocket connections count."""
        WEBSOCKET_CONNECTIONS.set(count)
    
    @staticmethod
    def set_db_pool_metrics(pool_size: int, used_connections: int):
        """Set database connection pool metrics."""
        DB_CONNECTION_POOL_SIZE.set(pool_size)
        DB_CONNECTION_POOL_USED.set(used_connections)
    
    @staticmethod
    def set_redis_metrics(connected_clients: int, used_memory: int):
        """Set Redis metrics."""
        REDIS_CONNECTED_CLIENTS.set(connected_clients)
        REDIS_USED_MEMORY.set(used_memory)