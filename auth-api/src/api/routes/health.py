"""
Health check and system status endpoints.
Provides monitoring and observability for the authentication API.
"""

from datetime import datetime
from typing import Dict, Any
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
import redis.asyncio as redis
import logging

from src.config import settings
from src.database import get_async_session, check_database_health
from src.schemas import HealthCheckSchema, MessageResponseSchema

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Health"])


@router.get(
    "/health",
    response_model=HealthCheckSchema,
    summary="Health check",
    description="Get system health status including database and Redis connectivity",
    responses={
        200: {"description": "System is healthy"},
        503: {"description": "System is unhealthy"}
    }
)
async def health_check(
    session: AsyncSession = Depends(get_async_session)
) -> Dict[str, Any]:
    """
    Comprehensive health check endpoint.
    
    Checks connectivity to:
    - Database (PostgreSQL)
    - Redis cache
    - Overall system status
    
    Returns detailed status information for monitoring systems.
    """
    health_status = {
        "status": "healthy",
        "timestamp": datetime.utcnow(),
        "version": settings.api_version,
        "database": "unknown",
        "redis": "unknown"
    }
    
    # Check database connectivity
    try:
        db_healthy = await check_database_health()
        health_status["database"] = "connected" if db_healthy else "disconnected"
        if not db_healthy:
            health_status["status"] = "unhealthy"
    except Exception as e:
        logger.error(f"Database health check failed: {e}")
        health_status["database"] = "error"
        health_status["status"] = "unhealthy"
    
    # Check Redis connectivity
    try:
        redis_client = redis.from_url(settings.redis.url)
        await redis_client.ping()
        health_status["redis"] = "connected"
        await redis_client.close()
    except Exception as e:
        logger.error(f"Redis health check failed: {e}")
        health_status["redis"] = "disconnected"
        health_status["status"] = "unhealthy"
    
    # Set appropriate status code
    status_code = status.HTTP_200_OK if health_status["status"] == "healthy" else status.HTTP_503_SERVICE_UNAVAILABLE
    
    return HealthCheckSchema(**health_status)


@router.get(
    "/health/database",
    response_model=MessageResponseSchema,
    summary="Database health check",
    description="Check database connectivity and status"
)
async def database_health_check(
    session: AsyncSession = Depends(get_async_session)
) -> Dict[str, Any]:
    """Check database connectivity and performance."""
    try:
        start_time = datetime.utcnow()
        db_healthy = await check_database_health()
        end_time = datetime.utcnow()
        
        response_time = (end_time - start_time).total_seconds() * 1000  # milliseconds
        
        if db_healthy:
            return {
                "message": f"Database is healthy (response time: {response_time:.2f}ms)",
                "success": True
            }
        else:
            return {
                "message": "Database is not responding",
                "success": False
            }
            
    except Exception as e:
        logger.error(f"Database health check error: {e}")
        return {
            "message": f"Database health check failed: {str(e)}",
            "success": False
        }


@router.get(
    "/health/redis",
    response_model=MessageResponseSchema,
    summary="Redis health check", 
    description="Check Redis connectivity and status"
)
async def redis_health_check() -> Dict[str, Any]:
    """Check Redis connectivity and performance."""
    try:
        start_time = datetime.utcnow()
        redis_client = redis.from_url(settings.redis.url)
        
        # Test basic operations
        await redis_client.ping()
        await redis_client.set("health_check", "test", ex=10)
        result = await redis_client.get("health_check")
        await redis_client.delete("health_check")
        
        end_time = datetime.utcnow()
        response_time = (end_time - start_time).total_seconds() * 1000  # milliseconds
        
        await redis_client.close()
        
        if result == b"test":
            return {
                "message": f"Redis is healthy (response time: {response_time:.2f}ms)",
                "success": True
            }
        else:
            return {
                "message": "Redis operations failed",
                "success": False
            }
            
    except Exception as e:
        logger.error(f"Redis health check error: {e}")
        return {
            "message": f"Redis health check failed: {str(e)}",
            "success": False
        }


@router.get(
    "/readiness",
    response_model=MessageResponseSchema,
    summary="Readiness probe",
    description="Check if the service is ready to accept requests"
)
async def readiness_probe(
    session: AsyncSession = Depends(get_async_session)
) -> Dict[str, Any]:
    """
    Kubernetes readiness probe endpoint.
    
    This endpoint is designed for Kubernetes readiness probes
    and checks if the service is ready to accept traffic.
    """
    try:
        # Quick health checks
        db_healthy = await check_database_health()
        
        if db_healthy:
            return {
                "message": "Service is ready",
                "success": True
            }
        else:
            return {
                "message": "Service is not ready - database unavailable",
                "success": False
            }
            
    except Exception as e:
        logger.error(f"Readiness probe failed: {e}")
        return {
            "message": f"Service is not ready: {str(e)}",
            "success": False
        }


@router.get(
    "/liveness",
    response_model=MessageResponseSchema,
    summary="Liveness probe",
    description="Check if the service is alive and should not be restarted"
)
async def liveness_probe() -> Dict[str, Any]:
    """
    Kubernetes liveness probe endpoint.
    
    This endpoint is designed for Kubernetes liveness probes
    and performs minimal checks to determine if the service is alive.
    """
    try:
        # Minimal check - just return success if we can process the request
        return {
            "message": "Service is alive",
            "success": True
        }
        
    except Exception as e:
        logger.error(f"Liveness probe failed: {e}")
        return {
            "message": f"Service liveness check failed: {str(e)}",
            "success": False
        }