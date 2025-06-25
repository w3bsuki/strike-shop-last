"""
Database connection management with production-ready configuration.
Implements connection pooling, health checks, and transaction management.
"""

from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import sessionmaker
from sqlalchemy import create_engine, event
from sqlalchemy.pool import QueuePool
import logging

from src.config import settings

logger = logging.getLogger(__name__)

# Async engine for FastAPI
async_engine = create_async_engine(
    settings.database.url,
    # Connection pooling configuration
    poolclass=QueuePool,
    pool_size=settings.database.pool_size,
    max_overflow=settings.database.max_overflow,
    pool_timeout=settings.database.pool_timeout,
    pool_recycle=settings.database.pool_recycle,
    pool_pre_ping=True,  # Verify connections before use
    
    # Connection arguments for PostgreSQL
    connect_args={
        "server_settings": {
            "application_name": "auth-api",
            "jit": "off",  # Disable JIT for smaller queries
        }
    },
    
    # Logging configuration
    echo=settings.debug,
    echo_pool=settings.debug,
    
    # Performance tuning
    pool_reset_on_return="commit",
)

# Sync engine for migrations and maintenance
sync_engine = create_engine(
    settings.database.sync_url,
    poolclass=QueuePool,
    pool_size=settings.database.pool_size,
    max_overflow=settings.database.max_overflow,
    pool_timeout=settings.database.pool_timeout,
    pool_recycle=settings.database.pool_recycle,
    pool_pre_ping=True,
    echo=settings.debug,
)

# Session factories
AsyncSessionLocal = async_sessionmaker(
    bind=async_engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=True,
    autocommit=False
)

SessionLocal = sessionmaker(
    bind=sync_engine,
    autoflush=True,
    autocommit=False
)


@event.listens_for(async_engine.sync_engine, "connect")
def set_sqlite_pragma(dbapi_connection, connection_record):
    """Set PostgreSQL connection parameters for optimal performance."""
    if "postgresql" in str(dbapi_connection):
        with dbapi_connection.cursor() as cursor:
            # Set optimal PostgreSQL settings
            cursor.execute("SET synchronous_commit = off")
            cursor.execute("SET wal_buffers = '16MB'")
            cursor.execute("SET shared_buffers = '256MB'")


async def get_async_session() -> AsyncGenerator[AsyncSession, None]:
    """
    Dependency for getting async database session.
    
    Yields:
        AsyncSession: Database session with automatic cleanup
    """
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception as e:
            await session.rollback()
            logger.error(f"Database session error: {e}")
            raise
        finally:
            await session.close()


def get_sync_session():
    """
    Get synchronous database session for migrations and maintenance.
    
    Returns:
        Session: Synchronous database session
    """
    session = SessionLocal()
    try:
        yield session
        session.commit()
    except Exception as e:
        session.rollback()
        logger.error(f"Database session error: {e}")
        raise
    finally:
        session.close()


async def check_database_health() -> bool:
    """
    Check database connectivity and health.
    
    Returns:
        bool: True if database is healthy, False otherwise
    """
    try:
        async with AsyncSessionLocal() as session:
            # Simple query to test connectivity
            result = await session.execute("SELECT 1")
            return result.scalar() == 1
    except Exception as e:
        logger.error(f"Database health check failed: {e}")
        return False


async def close_database_connections():
    """Close all database connections gracefully."""
    try:
        await async_engine.dispose()
        sync_engine.dispose()
        logger.info("Database connections closed successfully")
    except Exception as e:
        logger.error(f"Error closing database connections: {e}")


class DatabaseManager:
    """Database management utilities for advanced operations."""
    
    @staticmethod
    async def create_database_if_not_exists():
        """Create database if it doesn't exist (for development)."""
        if not settings.is_production:
            try:
                # This would be implemented based on your deployment strategy
                # For production, database creation should be handled by migrations
                logger.info("Database creation skipped in production mode")
            except Exception as e:
                logger.error(f"Database creation failed: {e}")
                raise
    
    @staticmethod
    async def get_connection_pool_status():
        """Get connection pool status for monitoring."""
        pool = async_engine.pool
        return {
            "size": pool.size(),
            "checked_in": pool.checkedin(),
            "checked_out": pool.checkedout(),
            "overflow": pool.overflow(),
            "invalid": pool.invalid(),
        }
    
    @staticmethod
    async def warm_up_connections():
        """Pre-warm connection pool for optimal performance."""
        try:
            # Create and immediately close several connections
            tasks = []
            for _ in range(min(5, settings.database.pool_size)):
                async with AsyncSessionLocal() as session:
                    await session.execute("SELECT 1")
            logger.info("Connection pool warmed up successfully")
        except Exception as e:
            logger.error(f"Connection pool warm-up failed: {e}")


# Initialize database manager
db_manager = DatabaseManager()