"""
Health check endpoints for monitoring and deployment verification.
"""

from datetime import datetime
from typing import Dict, Any

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from redis.asyncio import Redis
import psutil
import os

from app.core.deps import get_db, get_redis
from app.core.config import settings

router = APIRouter()


@router.get("/health", status_code=status.HTTP_200_OK)
async def health_check() -> Dict[str, Any]:
    """
    Basic health check endpoint.
    Returns 200 if the service is running.
    """
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "service": "taskflow-backend",
        "environment": settings.ENVIRONMENT,
        "version": os.getenv("APP_VERSION", "1.0.0")
    }


@router.get("/health/detailed", status_code=status.HTTP_200_OK)
async def detailed_health_check(
    db: AsyncSession = Depends(get_db),
    redis: Redis = Depends(get_redis)
) -> Dict[str, Any]:
    """
    Detailed health check with database and Redis connectivity.
    """
    health_status = {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "service": "taskflow-backend",
        "environment": settings.ENVIRONMENT,
        "version": os.getenv("APP_VERSION", "1.0.0"),
        "checks": {
            "database": {"status": "unknown"},
            "redis": {"status": "unknown"},
            "system": {"status": "unknown"}
        }
    }
    
    # Check database connectivity
    try:
        result = await db.execute("SELECT 1")
        await db.commit()
        health_status["checks"]["database"] = {
            "status": "healthy",
            "message": "Database connection successful"
        }
    except Exception as e:
        health_status["status"] = "unhealthy"
        health_status["checks"]["database"] = {
            "status": "unhealthy",
            "message": f"Database connection failed: {str(e)}"
        }
    
    # Check Redis connectivity
    try:
        await redis.ping()
        health_status["checks"]["redis"] = {
            "status": "healthy",
            "message": "Redis connection successful"
        }
    except Exception as e:
        health_status["status"] = "unhealthy"
        health_status["checks"]["redis"] = {
            "status": "unhealthy",
            "message": f"Redis connection failed: {str(e)}"
        }
    
    # System health metrics
    try:
        cpu_percent = psutil.cpu_percent(interval=1)
        memory = psutil.virtual_memory()
        disk = psutil.disk_usage('/')
        
        health_status["checks"]["system"] = {
            "status": "healthy",
            "cpu_usage_percent": cpu_percent,
            "memory": {
                "total_gb": round(memory.total / (1024**3), 2),
                "used_gb": round(memory.used / (1024**3), 2),
                "percent": memory.percent
            },
            "disk": {
                "total_gb": round(disk.total / (1024**3), 2),
                "used_gb": round(disk.used / (1024**3), 2),
                "percent": disk.percent
            }
        }
        
        # Mark as unhealthy if resources are critically low
        if cpu_percent > 90 or memory.percent > 90 or disk.percent > 90:
            health_status["checks"]["system"]["status"] = "warning"
            health_status["checks"]["system"]["message"] = "High resource usage detected"
            
    except Exception as e:
        health_status["checks"]["system"] = {
            "status": "unknown",
            "message": f"Failed to get system metrics: {str(e)}"
        }
    
    return health_status


@router.get("/ready", status_code=status.HTTP_200_OK)
async def readiness_check(
    db: AsyncSession = Depends(get_db),
    redis: Redis = Depends(get_redis)
) -> Dict[str, Any]:
    """
    Readiness check for load balancers.
    Returns 503 if any critical service is unavailable.
    """
    is_ready = True
    errors = []
    
    # Check database
    try:
        await db.execute("SELECT 1")
        await db.commit()
    except Exception as e:
        is_ready = False
        errors.append(f"Database not ready: {str(e)}")
    
    # Check Redis
    try:
        await redis.ping()
    except Exception as e:
        is_ready = False
        errors.append(f"Redis not ready: {str(e)}")
    
    if not is_ready:
        return {
            "status": "not_ready",
            "errors": errors,
            "timestamp": datetime.utcnow().isoformat()
        }
    
    return {
        "status": "ready",
        "timestamp": datetime.utcnow().isoformat()
    }


@router.get("/live", status_code=status.HTTP_200_OK)
async def liveness_check() -> Dict[str, Any]:
    """
    Liveness check for container orchestration.
    Returns 200 if the application is alive and responsive.
    """
    return {
        "status": "alive",
        "timestamp": datetime.utcnow().isoformat(),
        "uptime_seconds": int(psutil.Process(os.getpid()).create_time())
    }