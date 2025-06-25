"""
Pytest configuration and fixtures for the authentication API tests.
Provides comprehensive test setup with database, Redis, and authentication mocking.
"""

import asyncio
import pytest
import pytest_asyncio
from typing import AsyncGenerator, Dict, Any
from fastapi.testclient import TestClient
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.pool import StaticPool
import redis.asyncio as redis
from unittest.mock import AsyncMock, patch

from src.main import app
from src.database import get_async_session
from src.models import Base, User, RefreshToken
from src.services.auth_service import auth_service
from src.config import settings
from src.middleware.rate_limiter import rate_limiter


# Test database URL (SQLite for tests)
TEST_DATABASE_URL = "sqlite+aiosqlite:///./test.db"

# Test Redis configuration
TEST_REDIS_URL = "redis://localhost:6379/1"


@pytest.fixture(scope="session")
def event_loop():
    """Create an instance of the default event loop for the test session."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest_asyncio.fixture(scope="function")
async def test_db_engine():
    """Create test database engine."""
    engine = create_async_engine(
        TEST_DATABASE_URL,
        poolclass=StaticPool,
        connect_args={
            "check_same_thread": False,
        },
        echo=False
    )
    
    # Create all tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    yield engine
    
    # Drop all tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    
    await engine.dispose()


@pytest_asyncio.fixture(scope="function")
async def test_session(test_db_engine) -> AsyncGenerator[AsyncSession, None]:
    """Create test database session."""
    TestSessionLocal = async_sessionmaker(
        bind=test_db_engine,
        class_=AsyncSession,
        expire_on_commit=False
    )
    
    async with TestSessionLocal() as session:
        yield session


@pytest_asyncio.fixture(scope="function")
async def test_redis():
    """Create test Redis connection."""
    redis_client = redis.from_url(TEST_REDIS_URL)
    
    # Clear test database
    await redis_client.flushdb()
    
    yield redis_client
    
    # Clean up
    await redis_client.flushdb()
    await redis_client.close()


@pytest.fixture(scope="function")
def override_get_session(test_session):
    """Override the database session dependency."""
    async def _override_get_session():
        yield test_session
    
    app.dependency_overrides[get_async_session] = _override_get_session
    yield
    app.dependency_overrides.clear()


@pytest.fixture(scope="function")
def client(override_get_session):
    """Create test client."""
    return TestClient(app)


@pytest_asyncio.fixture(scope="function")
async def async_client(override_get_session):
    """Create async test client."""
    async with AsyncClient(app=app, base_url="http://test") as ac:
        yield ac


@pytest_asyncio.fixture(scope="function")
async def test_user(test_session: AsyncSession) -> User:
    """Create a test user."""
    user = User(
        email="test@example.com",
        first_name="Test",
        last_name="User",
        is_active=True,
        is_verified=True
    )
    user.set_password("TestPassword123!")
    
    test_session.add(user)
    await test_session.commit()
    await test_session.refresh(user)
    
    return user


@pytest_asyncio.fixture(scope="function")
async def inactive_user(test_session: AsyncSession) -> User:
    """Create an inactive test user."""
    user = User(
        email="inactive@example.com",
        first_name="Inactive",
        last_name="User",
        is_active=False,
        is_verified=True
    )
    user.set_password("TestPassword123!")
    
    test_session.add(user)
    await test_session.commit()
    await test_session.refresh(user)
    
    return user


@pytest_asyncio.fixture(scope="function")
async def unverified_user(test_session: AsyncSession) -> User:
    """Create an unverified test user."""
    user = User(
        email="unverified@example.com",
        first_name="Unverified",
        last_name="User",
        is_active=True,
        is_verified=False
    )
    user.set_password("TestPassword123!")
    
    test_session.add(user)
    await test_session.commit()
    await test_session.refresh(user)
    
    return user


@pytest_asyncio.fixture(scope="function")
async def locked_user(test_session: AsyncSession) -> User:
    """Create a locked test user."""
    user = User(
        email="locked@example.com",
        first_name="Locked",
        last_name="User",
        is_active=True,
        is_verified=True,
        is_locked=True,
        login_attempts=5
    )
    user.set_password("TestPassword123!")
    
    test_session.add(user)
    await test_session.commit()
    await test_session.refresh(user)
    
    return user


@pytest_asyncio.fixture(scope="function")
async def auth_tokens(test_user: User, test_session: AsyncSession) -> Dict[str, Any]:
    """Create authentication tokens for test user."""
    tokens = await auth_service._generate_token_pair(
        session=test_session,
        user=test_user,
        user_agent="test-agent",
        ip_address="127.0.0.1"
    )
    await test_session.commit()
    return tokens


@pytest.fixture(scope="function")
def auth_headers(auth_tokens: Dict[str, Any]) -> Dict[str, str]:
    """Create authentication headers."""
    return {
        "Authorization": f"Bearer {auth_tokens['access_token']}"
    }


@pytest.fixture(scope="function")
def valid_user_data() -> Dict[str, Any]:
    """Valid user registration data."""
    return {
        "email": "newuser@example.com",
        "password": "SecurePassword123!",
        "first_name": "New",
        "last_name": "User"
    }


@pytest.fixture(scope="function")
def valid_login_data() -> Dict[str, Any]:
    """Valid login data."""
    return {
        "email": "test@example.com",
        "password": "TestPassword123!"
    }


@pytest.fixture(scope="function")
def invalid_password_data() -> Dict[str, Any]:
    """Invalid password data for testing validation."""
    return [
        {"email": "test@example.com", "password": "weak"},  # Too short
        {"email": "test@example.com", "password": "nouppercase123!"},  # No uppercase
        {"email": "test@example.com", "password": "NOLOWERCASE123!"},  # No lowercase
        {"email": "test@example.com", "password": "NoNumbers!"},  # No numbers
        {"email": "test@example.com", "password": "NoSpecialChars123"},  # No special chars
        {"email": "test@example.com", "password": "password"},  # Too common
    ]


@pytest.fixture(scope="function")
def mock_redis():
    """Mock Redis for tests that don't need real Redis."""
    with patch('src.middleware.rate_limiter.redis') as mock:
        mock_client = AsyncMock()
        mock.from_url.return_value = mock_client
        mock_client.ping.return_value = True
        mock_client.get.return_value = None
        mock_client.incr.return_value = 1
        mock_client.expire.return_value = True
        mock_client.delete.return_value = 1
        yield mock_client


@pytest.fixture(scope="function")
def disable_rate_limiting():
    """Disable rate limiting for tests."""
    original_check = rate_limiter.check_rate_limit
    
    async def mock_check(request):
        return True, {}
    
    rate_limiter.check_rate_limit = mock_check
    
    yield
    
    rate_limiter.check_rate_limit = original_check


@pytest.fixture(scope="function")
def mock_email_service():
    """Mock email service for testing."""
    with patch('src.services.email_service') as mock:
        mock.send_verification_email = AsyncMock()
        mock.send_password_reset_email = AsyncMock()
        yield mock


# Performance testing fixtures
@pytest.fixture(scope="function")
def performance_test_users(test_session: AsyncSession):
    """Create multiple users for performance testing."""
    async def _create_users(count: int = 100):
        users = []
        for i in range(count):
            user = User(
                email=f"user{i}@example.com",
                first_name=f"User{i}",
                last_name="Test",
                is_active=True,
                is_verified=True
            )
            user.set_password("TestPassword123!")
            users.append(user)
        
        test_session.add_all(users)
        await test_session.commit()
        return users
    
    return _create_users


# Security testing fixtures
@pytest.fixture(scope="function")
def malicious_payloads():
    """Common malicious payloads for security testing."""
    return {
        "sql_injection": [
            "'; DROP TABLE users; --",
            "1' OR '1'='1",
            "admin'--",
            "admin' /*",
            "admin' #"
        ],
        "xss": [
            "<script>alert('xss')</script>",
            "javascript:alert('xss')",
            "<img src=x onerror=alert('xss')>",
            "';alert('xss');//"
        ],
        "path_traversal": [
            "../../../etc/passwd",
            "..\\..\\..\\windows\\system32\\config\\sam",
            "....//....//....//etc/passwd"
        ],
        "command_injection": [
            "; cat /etc/passwd",
            "| nc -l 4444",
            "`cat /etc/passwd`",
            "$(cat /etc/passwd)"
        ]
    }


@pytest.fixture(scope="function")
def stress_test_config():
    """Configuration for stress testing."""
    return {
        "concurrent_requests": 50,
        "total_requests": 1000,
        "request_timeout": 30,
        "ramp_up_time": 10
    }