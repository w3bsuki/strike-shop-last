"""
Test configuration and fixtures
"""
import asyncio
import pytest
import pytest_asyncio
from typing import AsyncGenerator, Generator
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.core.database import get_db, Base
from app.core.config import get_settings
from app.core.security import create_access_token
from app.models.user import User
from app.models.task import Task
from tests.factories import UserFactory, TaskFactory

# Test database URL
TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"

# Create test engine
test_engine = create_async_engine(
    TEST_DATABASE_URL,
    connect_args={
        "check_same_thread": False,
    },
    poolclass=StaticPool,
)

TestingSessionLocal = async_sessionmaker(
    test_engine, class_=AsyncSession, expire_on_commit=False
)


@pytest.fixture(scope="session")
def event_loop():
    """Create an instance of the default event loop for the test session."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest_asyncio.fixture
async def db_session() -> AsyncGenerator[AsyncSession, None]:
    """Create a test database session."""
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    async with TestingSessionLocal() as session:
        yield session
    
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest_asyncio.fixture
async def client(db_session: AsyncSession) -> AsyncGenerator[AsyncClient, None]:
    """Create a test client."""
    def get_test_db():
        return db_session

    app.dependency_overrides[get_db] = get_test_db
    
    async with AsyncClient(app=app, base_url="http://test") as ac:
        yield ac
    
    app.dependency_overrides.clear()


@pytest_asyncio.fixture
async def authenticated_client(
    client: AsyncClient, db_session: AsyncSession
) -> AsyncGenerator[AsyncClient, None]:
    """Create an authenticated test client."""
    # Create a test user
    user = await UserFactory.create_async(db_session)
    
    # Create access token
    token = create_access_token(subject=str(user.id))
    
    # Set authorization header
    client.headers["Authorization"] = f"Bearer {token}"
    
    yield client


@pytest_asyncio.fixture
async def test_user(db_session: AsyncSession) -> User:
    """Create a test user."""
    return await UserFactory.create_async(db_session)


@pytest_asyncio.fixture
async def test_task(db_session: AsyncSession, test_user: User) -> Task:
    """Create a test task."""
    return await TaskFactory.create_async(db_session, created_by=test_user.id)


@pytest.fixture
def settings():
    """Get test settings."""
    return get_settings()


@pytest.fixture
def mock_redis(mocker):
    """Mock Redis client."""
    mock_redis = mocker.Mock()
    mock_redis.get.return_value = None
    mock_redis.set.return_value = True
    mock_redis.delete.return_value = True
    mock_redis.exists.return_value = False
    return mock_redis


@pytest.fixture
def mock_celery(mocker):
    """Mock Celery app."""
    mock_celery = mocker.Mock()
    mock_task = mocker.Mock()
    mock_task.delay.return_value = mocker.Mock(id="mock-task-id")
    mock_celery.send_task.return_value = mock_task
    return mock_celery