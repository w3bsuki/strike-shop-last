from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
import logging

from app.core.config import settings
from app.services.cache_service import cache_service
from app.api.v1.api import api_router
# from app.middleware.rate_limit import (
#     limiter, custom_rate_limit_exceeded_handler, 
#     add_user_to_request
# )
# from slowapi.errors import RateLimitExceeded

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("Starting up TaskFlow AI Backend...")
    
    # Initialize AI services and cache
    logger.info("Initializing AI services...")
    from app.services.ai_service import ai_service
    logger.info(f"OpenAI client initialized: {ai_service.client is not None}")
    logger.info(f"Redis cache initialized: {cache_service.redis_client is not None}")
    
    # Initialize database tables (in production, use Alembic migrations)
    # from app.db.session import engine
    # from app.db.base_class import Base
    # async with engine.begin() as conn:
    #     await conn.run_sync(Base.metadata.create_all)
    
    yield
    
    # Shutdown
    logger.info("Shutting down TaskFlow AI Backend...")
    
    # Close connections
    if cache_service.redis_client:
        await cache_service.close()
        logger.info("Cache service closed")


# Create FastAPI app
app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    lifespan=lifespan
)

# Add rate limiter (temporarily disabled)
# app.state.limiter = limiter
# app.add_exception_handler(RateLimitExceeded, custom_rate_limit_exceeded_handler)

# Add middlewares
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add custom middleware
# @app.middleware("http")
# async def add_user_id_to_request(request: Request, call_next):
#     return await add_user_to_request(request, call_next)

# Add security headers
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    return response

# Include API router
app.include_router(api_router, prefix=settings.API_V1_STR)

# Health check endpoint
@app.get("/health")
async def health_check():
    from app.services.ai_service import ai_service
    
    # Check AI services status
    ai_status = {
        "openai_configured": ai_service.client is not None,
        "cache_available": cache_service.redis_client is not None,
    }
    
    # Check if Redis is actually reachable
    if cache_service.redis_client:
        try:
            await cache_service.redis_client.ping()
            ai_status["cache_reachable"] = True
        except:
            ai_status["cache_reachable"] = False
    else:
        ai_status["cache_reachable"] = False
    
    # Determine overall status
    overall_status = "healthy"
    if not ai_status["openai_configured"]:
        overall_status = "degraded"  # Can work with fallbacks
    if not ai_status["cache_reachable"]:
        overall_status = "degraded" if overall_status == "healthy" else "unhealthy"
    
    return {
        "status": overall_status,
        "service": "TaskFlow AI Backend",
        "version": "1.0.0",
        "ai_services": ai_status,
        "features": {
            "natural_language_parsing": ai_status["openai_configured"],
            "semantic_search": ai_status["openai_configured"],
            "smart_suggestions": ai_status["openai_configured"],
            "caching": ai_status["cache_reachable"],
            "background_tasks": True  # Assume Celery is available
        }
    }

# Root endpoint
@app.get("/")
async def root():
    return {
        "message": "Welcome to TaskFlow AI API",
        "docs": f"{settings.API_V1_STR}/docs",
        "health": "/health"
    }

# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Global exception: {str(exc)}", exc_info=True)
    
    return JSONResponse(
        status_code=500,
        content={
            "detail": "Internal server error",
            "type": "internal_error"
        }
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True if settings.DEBUG else False,
        log_level="info"
    )