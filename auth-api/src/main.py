"""
Main FastAPI application with comprehensive security and monitoring.
Production-ready authentication API implementation.
"""

import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import JSONResponse
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.openapi.docs import get_swagger_ui_html
from fastapi.openapi.utils import get_openapi
import uvicorn
import logging

from src.config import settings
from src.api import auth_router, health_router
from src.middleware import (
    RateLimitMiddleware,
    setup_security_middleware,
    rate_limiter
)
from src.monitoring import (
    setup_logging,
    log_startup_info,
    log_shutdown_info,
    metrics_middleware,
    get_metrics_response,
    security_logger,
    metrics
)
from src.database import close_database_connections, db_manager
from src.exceptions import BaseAPIException, handle_database_error, sanitize_error_message

# Setup logging first
setup_logging()
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan management.
    Handles startup and shutdown procedures.
    """
    # Startup
    logger.info("Starting Authentication API...")
    log_startup_info()
    
    try:
        # Warm up database connections
        await db_manager.warm_up_connections()
        
        # Update startup metrics
        metrics.record_security_event("application_startup", "info")
        
        logger.info("Authentication API started successfully")
        
        yield
        
    finally:
        # Shutdown
        logger.info("Shutting down Authentication API...")
        log_shutdown_info()
        
        try:
            # Close database connections
            await close_database_connections()
            
            # Close rate limiter Redis connection
            await rate_limiter.close()
            
            # Record shutdown metrics
            metrics.record_security_event("application_shutdown", "info")
            
            logger.info("Authentication API shutdown complete")
            
        except Exception as e:
            logger.error(f"Error during shutdown: {e}")


# Create FastAPI application
app = FastAPI(
    title=settings.api_title,
    description=settings.api_description,
    version=settings.api_version,
    docs_url=None,  # We'll customize docs
    redoc_url=None,
    openapi_url="/openapi.json" if not settings.is_production else None,
    lifespan=lifespan
)

# Setup middleware (order matters - last added is first executed)
app.add_middleware(GZipMiddleware, minimum_size=1000)
app.add_middleware(RateLimitMiddleware, rate_limiter=rate_limiter)
setup_security_middleware(app)
metrics_middleware(app)


# Exception handlers
@app.exception_handler(BaseAPIException)
async def api_exception_handler(request: Request, exc: BaseAPIException):
    """Handle custom API exceptions."""
    # Log security-relevant errors
    if exc.status_code in [401, 403, 429]:
        client_ip = request.headers.get("X-Forwarded-For", request.client.host)
        security_logger.suspicious_activity(
            activity_type=exc.error_code or "unknown",
            ip_address=client_ip,
            details={"endpoint": str(request.url), "error": exc.detail},
            severity="medium"
        )
    
    # Record metrics
    metrics.record_api_error(
        error_code=exc.error_code or "unknown",
        endpoint=request.url.path
    )
    
    return JSONResponse(
        status_code=exc.status_code,
        content=exc.to_dict()
    )


@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    """Handle FastAPI HTTP exceptions."""
    # Record metrics
    metrics.record_api_error(
        error_code=f"HTTP_{exc.status_code}",
        endpoint=request.url.path
    )
    
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": True,
            "message": exc.detail,
            "status_code": exc.status_code
        }
    )


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Handle unexpected exceptions."""
    logger.error(
        f"Unhandled exception in {request.method} {request.url.path}",
        exc_info=True,
        extra={
            "client_ip": request.headers.get("X-Forwarded-For", request.client.host),
            "user_agent": request.headers.get("User-Agent")
        }
    )
    
    # Record metrics
    metrics.record_api_error(
        error_code="INTERNAL_ERROR",
        endpoint=request.url.path
    )
    
    # Sanitize error message for production
    if settings.is_production:
        error_message = "An internal error occurred"
    else:
        error_message = str(exc)
    
    return JSONResponse(
        status_code=500,
        content={
            "error": True,
            "message": error_message,
            "error_code": "INTERNAL_ERROR",
            "status_code": 500
        }
    )


# Include routers
app.include_router(auth_router, prefix="/api/v1")
app.include_router(health_router, prefix="/api/v1")


# Metrics endpoint
@app.get("/metrics", include_in_schema=False)
async def metrics_endpoint():
    """Prometheus metrics endpoint."""
    return await get_metrics_response()


# Custom documentation endpoints
@app.get("/docs", include_in_schema=False)
async def custom_swagger_ui_html():
    """Custom Swagger UI with security considerations."""
    if settings.is_production:
        # In production, you might want to secure or disable docs
        return JSONResponse(
            status_code=404,
            content={"error": "Documentation not available in production"}
        )
    
    return get_swagger_ui_html(
        openapi_url="/openapi.json",
        title=f"{settings.api_title} - Documentation",
        swagger_js_url="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-bundle.js",
        swagger_css_url="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui.css",
    )


@app.get("/openapi.json", include_in_schema=False)
async def custom_openapi():
    """Custom OpenAPI schema with enhanced documentation."""
    if settings.is_production:
        return JSONResponse(
            status_code=404,
            content={"error": "API schema not available in production"}
        )
    
    openapi_schema = get_openapi(
        title=settings.api_title,
        version=settings.api_version,
        description=settings.api_description,
        routes=app.routes,
    )
    
    # Add security schemes
    openapi_schema["components"]["securitySchemes"] = {
        "BearerAuth": {
            "type": "http",
            "scheme": "bearer",
            "bearerFormat": "JWT",
            "description": "JWT Bearer token authentication"
        }
    }
    
    # Add global security requirement
    openapi_schema["security"] = [{"BearerAuth": []}]
    
    # Add server information
    openapi_schema["servers"] = [
        {
            "url": f"http://localhost:{settings.port}" if settings.is_development else "https://api.yourdomain.com",
            "description": f"{settings.environment.title()} server"
        }
    ]
    
    # Add additional metadata
    openapi_schema["info"]["contact"] = {
        "name": "API Support",
        "email": "api-support@yourdomain.com"
    }
    
    openapi_schema["info"]["license"] = {
        "name": "MIT",
        "url": "https://opensource.org/licenses/MIT"
    }
    
    app.openapi_schema = openapi_schema
    return openapi_schema


# Root endpoint
@app.get("/", include_in_schema=False)
async def root():
    """Root endpoint with API information."""
    return {
        "name": settings.api_title,
        "version": settings.api_version,
        "environment": settings.environment,
        "status": "operational",
        "documentation": "/docs" if not settings.is_production else None,
        "health": "/api/v1/health"
    }


def create_app() -> FastAPI:
    """
    Application factory function.
    
    Returns:
        Configured FastAPI application
    """
    return app


async def main():
    """
    Main application entry point for development.
    """
    config = uvicorn.Config(
        app="src.main:app",
        host=settings.host,
        port=settings.port,
        log_config=None,  # We handle logging ourselves
        access_log=False,  # We handle access logging in middleware
        reload=settings.is_development,
        workers=1 if settings.is_development else 4,
    )
    
    server = uvicorn.Server(config)
    await server.serve()


if __name__ == "__main__":
    asyncio.run(main())