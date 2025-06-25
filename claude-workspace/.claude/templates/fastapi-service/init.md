# Production-Ready FastAPI Service Template

## 🚀 Multi-Agent Architecture Strategy

This template demonstrates specialized agent coordination for robust API development:
- **@backend**: Core API architecture, database design, and security implementation
- **@devops**: Container orchestration, monitoring, and deployment automation
- **@testing**: Comprehensive API testing, load testing, and quality assurance
- **@docs**: OpenAPI documentation, integration guides, and API specifications
- **@frontend**: Admin dashboard and API client examples (if needed)

## 📋 Service Initialization Checklist

### Phase 1: Core FastAPI Setup (@backend)
```bash
# 1. Create project structure
mkdir {{PROJECT_NAME}}
cd {{PROJECT_NAME}}

# 2. Python environment setup
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# 3. Install production dependencies
pip install \
  fastapi[all] \
  uvicorn[standard] \
  pydantic[email] \
  sqlalchemy \
  alembic \
  asyncpg \
  redis \
  python-jose[cryptography] \
  passlib[bcrypt] \
  python-multipart \
  python-dotenv \
  structlog \
  prometheus-client \
  opentelemetry-api \
  opentelemetry-sdk

# 4. Install development dependencies  
pip install \
  pytest \
  pytest-asyncio \
  pytest-cov \
  httpx \
  black \
  isort \
  mypy \
  ruff \
  pre-commit

# 5. Generate requirements.txt
pip freeze > requirements.txt
```

### Phase 2: Database & Security Setup (@backend)
```bash
# Database setup with Alembic
alembic init alembic

# Additional security and monitoring packages
pip install \
  slowapi \
  python-jose \
  cryptography \
  pydantic-settings \
  aioredis \
  celery[redis] \
  sentry-sdk[fastapi]
```

### Phase 3: Testing Infrastructure (@testing)
```bash
# Testing and quality assurance tools
pip install \
  pytest-xdist \
  pytest-mock \
  factory-boy \
  faker \
  locust \
  safety \
  bandit

# API testing tools
pip install \
  requests \
  httpx \
  testcontainers[postgres]
```

### Phase 4: DevOps & Monitoring (@devops)
```bash
# Monitoring and observability
pip install \
  prometheus-client \
  grafana-api \
  opentelemetry-instrumentation-fastapi \
  opentelemetry-exporter-jaeger

# Container health and metrics
pip install \
  psutil \
  py-healthcheck
```

## 📁 Project Structure Template

```
{{PROJECT_NAME}}/
├── .env.example                # Environment variables template
├── .env.test                   # Test environment variables
├── .gitignore                  # Git ignore patterns
├── .github/
│   └── workflows/
│       ├── ci.yml              # Continuous integration
│       ├── security.yml        # Security scanning
│       └── deploy.yml          # Deployment pipeline
├── alembic/                    # Database migrations
│   ├── versions/               # Migration files
│   ├── env.py                  # Migration environment
│   └── script.py.mako          # Migration template
├── app/
│   ├── __init__.py
│   ├── main.py                 # FastAPI application entry
│   ├── core/
│   │   ├── __init__.py
│   │   ├── config.py           # Configuration management
│   │   ├── security.py         # Authentication & authorization
│   │   ├── database.py         # Database connection
│   │   ├── logging.py          # Structured logging
│   │   └── middleware.py       # Custom middleware
│   ├── api/
│   │   ├── __init__.py
│   │   ├── v1/
│   │   │   ├── __init__.py
│   │   │   ├── router.py       # API router configuration
│   │   │   ├── auth.py         # Authentication endpoints
│   │   │   ├── users.py        # User management endpoints
│   │   │   └── health.py       # Health check endpoints
│   │   └── dependencies.py     # Route dependencies
│   ├── models/
│   │   ├── __init__.py
│   │   ├── base.py             # Base model class
│   │   ├── user.py             # User model
│   │   └── auth.py             # Authentication models
│   ├── schemas/
│   │   ├── __init__.py
│   │   ├── user.py             # User Pydantic schemas
│   │   ├── auth.py             # Authentication schemas
│   │   └── response.py         # Response schemas
│   ├── services/
│   │   ├── __init__.py
│   │   ├── user_service.py     # Business logic
│   │   ├── auth_service.py     # Authentication logic
│   │   └── cache_service.py    # Caching layer
│   ├── repositories/
│   │   ├── __init__.py
│   │   ├── base.py             # Base repository
│   │   └── user_repository.py  # Data access layer
│   └── utils/
│       ├── __init__.py
│       ├── validators.py       # Custom validators
│       ├── helpers.py          # Utility functions
│       └── exceptions.py       # Custom exceptions
├── tests/
│   ├── __init__.py
│   ├── conftest.py             # Pytest configuration
│   ├── test_main.py            # Main application tests
│   ├── api/
│   │   ├── test_auth.py        # Authentication tests
│   │   └── test_users.py       # User endpoint tests
│   ├── services/
│   │   └── test_user_service.py # Service layer tests
│   ├── repositories/
│   │   └── test_user_repository.py # Repository tests
│   └── utils/
│       ├── factories.py        # Test data factories
│       └── helpers.py          # Test utilities
├── monitoring/
│   ├── prometheus.yml          # Prometheus configuration
│   ├── grafana/               # Grafana dashboards
│   └── alerts.yml             # Alert rules
├── docs/
│   ├── README.md              # Project documentation
│   ├── API.md                 # API documentation
│   ├── DEPLOYMENT.md          # Deployment guide
│   └── ARCHITECTURE.md        # Architecture documentation
├── scripts/
│   ├── start.sh               # Application startup
│   ├── test.sh                # Testing script
│   └── migrate.sh             # Database migration
├── docker-compose.yml         # Local development
├── docker-compose.prod.yml    # Production deployment
├── Dockerfile                 # Production container
├── requirements.txt           # Python dependencies
├── requirements-dev.txt       # Development dependencies
├── pyproject.toml            # Project configuration
├── alembic.ini               # Alembic configuration
└── pytest.ini               # Pytest configuration
```

## ⚙️ Core Application Configuration

### 1. FastAPI Application Setup
```python
# app/main.py
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from prometheus_client import make_asgi_app
import structlog
from contextlib import asynccontextmanager

from app.core.config import settings
from app.core.database import create_tables
from app.core.middleware import LoggingMiddleware, MetricsMiddleware
from app.api.v1.router import api_router

# Configure structured logging
structlog.configure(
    processors=[
        structlog.stdlib.filter_by_level,
        structlog.stdlib.add_logger_name,
        structlog.stdlib.add_log_level,
        structlog.stdlib.PositionalArgumentsFormatter(),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
        structlog.processors.UnicodeDecoder(),
        structlog.processors.JSONRenderer()
    ],
    context_class=dict,
    logger_factory=structlog.stdlib.LoggerFactory(),
    wrapper_class=structlog.stdlib.BoundLogger,
    cache_logger_on_first_use=True,
)

logger = structlog.get_logger()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("Starting up application")
    await create_tables()
    yield
    # Shutdown
    logger.info("Shutting down application")

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc"
)

# Security middleware
app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=settings.ALLOWED_HOSTS
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Custom middleware
app.add_middleware(LoggingMiddleware)
app.add_middleware(MetricsMiddleware)

# Include API router
app.include_router(api_router, prefix=settings.API_V1_STR)

# Prometheus metrics endpoint
metrics_app = make_asgi_app()
app.mount("/metrics", metrics_app)

@app.get("/health")
async def health_check():
    return {"status": "healthy", "version": settings.VERSION}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.DEBUG,
        log_config=None  # Use our structured logging
    )
```

### 2. Production-Grade Configuration
```python
# app/core/config.py
from pydantic_settings import BaseSettings
from pydantic import PostgresDsn, RedisDsn, validator
from typing import List, Optional
import secrets

class Settings(BaseSettings):
    # API Configuration
    PROJECT_NAME: str = "{{PROJECT_NAME}}"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    DEBUG: bool = False
    
    # Security
    SECRET_KEY: str = secrets.token_urlsafe(32)
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 8  # 8 days
    REFRESH_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 30  # 30 days
    
    # CORS
    ALLOWED_HOSTS: List[str] = ["localhost", "127.0.0.1"]
    ALLOWED_ORIGINS: List[str] = ["http://localhost:3000"]
    
    # Database
    POSTGRES_USER: str
    POSTGRES_PASSWORD: str
    POSTGRES_DB: str
    POSTGRES_HOST: str = "localhost"
    POSTGRES_PORT: int = 5432
    DATABASE_URL: Optional[PostgresDsn] = None
    
    @validator("DATABASE_URL", pre=True)
    def assemble_db_connection(cls, v: Optional[str], values: dict) -> str:
        if isinstance(v, str):
            return v
        return f"postgresql://{values['POSTGRES_USER']}:{values['POSTGRES_PASSWORD']}@{values['POSTGRES_HOST']}:{values['POSTGRES_PORT']}/{values['POSTGRES_DB']}"
    
    # Redis
    REDIS_URL: RedisDsn = "redis://localhost:6379/0"
    
    # Rate Limiting
    RATE_LIMIT_PER_MINUTE: int = 60
    
    # Monitoring
    SENTRY_DSN: Optional[str] = None
    PROMETHEUS_ENABLED: bool = True
    
    # Email (if needed)
    SMTP_TLS: bool = True
    SMTP_PORT: Optional[int] = None
    SMTP_HOST: Optional[str] = None
    SMTP_USER: Optional[str] = None
    SMTP_PASSWORD: Optional[str] = None
    EMAILS_FROM_EMAIL: Optional[str] = None
    EMAILS_FROM_NAME: Optional[str] = None
    
    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()
```

### 3. Database Models with SQLAlchemy
```python
# app/models/user.py
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Enum
from sqlalchemy.sql import func
from sqlalchemy.dialects.postgresql import UUID
import uuid
import enum

from app.models.base import Base

class UserRole(enum.Enum):
    USER = "user"
    ADMIN = "admin"
    MODERATOR = "moderator"

class User(Base):
    __tablename__ = "users"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    username = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    role = Column(Enum(UserRole), default=UserRole.USER)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    last_login = Column(DateTime(timezone=True), nullable=True)
    
    def __repr__(self):
        return f"<User(id={self.id}, email={self.email})>"
```

### 4. Pydantic Schemas with Validation
```python
# app/schemas/user.py
from pydantic import BaseModel, EmailStr, validator
from typing import Optional
from datetime import datetime
import uuid

from app.models.user import UserRole

class UserBase(BaseModel):
    email: EmailStr
    username: str
    full_name: Optional[str] = None
    is_active: bool = True
    role: UserRole = UserRole.USER
    
    @validator('username')
    def username_alphanumeric(cls, v):
        assert v.replace('_', '').replace('-', '').isalnum(), 'Username must be alphanumeric'
        assert len(v) >= 3, 'Username must be at least 3 characters'
        assert len(v) <= 20, 'Username must be less than 20 characters'
        return v

class UserCreate(UserBase):
    password: str
    
    @validator('password')
    def validate_password(cls, v):
        assert len(v) >= 8, 'Password must be at least 8 characters'
        assert any(c.isupper() for c in v), 'Password must contain an uppercase letter'
        assert any(c.islower() for c in v), 'Password must contain a lowercase letter'
        assert any(c.isdigit() for c in v), 'Password must contain a digit'
        return v

class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    username: Optional[str] = None
    full_name: Optional[str] = None
    is_active: Optional[bool] = None

class UserInDB(UserBase):
    id: uuid.UUID
    created_at: datetime
    updated_at: Optional[datetime] = None
    last_login: Optional[datetime] = None
    
    class Config:
        from_attributes = True

class UserResponse(UserInDB):
    pass  # Excludes sensitive fields like hashed_password

class UserListResponse(BaseModel):
    users: list[UserResponse]
    total: int
    page: int
    per_page: int
```

### 5. API Endpoints with Comprehensive Validation
```python
# app/api/v1/users.py
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from app.core.database import get_db
from app.core.security import get_current_user, get_current_admin_user
from app.schemas.user import UserCreate, UserUpdate, UserResponse, UserListResponse
from app.services.user_service import UserService
from app.utils.exceptions import UserAlreadyExistsError, UserNotFoundError

router = APIRouter(prefix="/users", tags=["users"])

@router.post("/", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_user(
    user_data: UserCreate,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_admin_user)  # Only admins can create users
):
    """
    Create a new user.
    
    - **email**: Valid email address
    - **username**: Unique username (3-20 characters, alphanumeric)
    - **password**: Strong password (min 8 chars, uppercase, lowercase, digit)
    - **full_name**: Optional full name
    - **role**: User role (default: user)
    """
    user_service = UserService(db)
    
    try:
        user = await user_service.create_user(user_data)
        return user
    except UserAlreadyExistsError as e:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(e)
        )

@router.get("/", response_model=UserListResponse)
async def list_users(
    page: int = Query(1, ge=1, description="Page number"),
    per_page: int = Query(20, ge=1, le=100, description="Items per page"),
    search: str = Query(None, description="Search by email or username"),
    role: str = Query(None, description="Filter by role"),
    is_active: bool = Query(None, description="Filter by active status"),
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Retrieve a paginated list of users with optional filtering.
    
    - **page**: Page number (default: 1)
    - **per_page**: Items per page (default: 20, max: 100)
    - **search**: Search in email or username
    - **role**: Filter by user role
    - **is_active**: Filter by active status
    """
    user_service = UserService(db)
    
    filters = {}
    if role:
        filters['role'] = role
    if is_active is not None:
        filters['is_active'] = is_active
    
    users, total = await user_service.list_users(
        page=page,
        per_page=per_page,
        search=search,
        filters=filters
    )
    
    return UserListResponse(
        users=users,
        total=total,
        page=page,
        per_page=per_page
    )

@router.get("/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: str,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Get user by ID."""
    user_service = UserService(db)
    
    try:
        user = await user_service.get_user_by_id(user_id)
        return user
    except UserNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
```

## 🧪 Testing Strategy (@testing Agent)

### 1. Comprehensive Test Suite
```python
# tests/api/test_users.py
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.main import app
from app.models.user import User, UserRole
from tests.utils.factories import UserFactory

@pytest.mark.asyncio
class TestUserAPI:
    
    async def test_create_user_success(
        self,
        client: AsyncClient,
        admin_token: str,
        db_session: AsyncSession
    ):
        """Test successful user creation."""
        user_data = {
            "email": "test@example.com",
            "username": "testuser",
            "password": "SecurePass123!",
            "full_name": "Test User",
            "role": "user"
        }
        
        response = await client.post(
            "/api/v1/users/",
            json=user_data,
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        
        assert response.status_code == 201
        data = response.json()
        assert data["email"] == user_data["email"]
        assert data["username"] == user_data["username"]
        assert "id" in data
        assert "hashed_password" not in data  # Sensitive field excluded
        
        # Verify user was created in database
        user = await db_session.get(User, data["id"])
        assert user is not None
        assert user.email == user_data["email"]
    
    async def test_create_user_duplicate_email(
        self,
        client: AsyncClient,
        admin_token: str,
        db_session: AsyncSession
    ):
        """Test user creation with duplicate email fails."""
        # Create existing user
        existing_user = await UserFactory.create(db_session, email="test@example.com")
        
        user_data = {
            "email": "test@example.com",  # Duplicate email
            "username": "newuser",
            "password": "SecurePass123!"
        }
        
        response = await client.post(
            "/api/v1/users/",
            json=user_data,
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        
        assert response.status_code == 409
        assert "already exists" in response.json()["detail"]
    
    async def test_list_users_pagination(
        self,
        client: AsyncClient,
        user_token: str,
        db_session: AsyncSession
    ):
        """Test user listing with pagination."""
        # Create multiple users
        users = await UserFactory.create_batch(db_session, 25)
        
        # Test first page
        response = await client.get(
            "/api/v1/users/?page=1&per_page=10",
            headers={"Authorization": f"Bearer {user_token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert len(data["users"]) == 10
        assert data["total"] >= 25
        assert data["page"] == 1
        assert data["per_page"] == 10
    
    @pytest.mark.parametrize("invalid_password", [
        "short",           # Too short
        "nouppercase123",  # No uppercase
        "NOLOWERCASE123",  # No lowercase
        "NoDigitsHere",    # No digits
    ])
    async def test_create_user_invalid_password(
        self,
        client: AsyncClient,
        admin_token: str,
        invalid_password: str
    ):
        """Test user creation with invalid passwords."""
        user_data = {
            "email": "test@example.com",
            "username": "testuser",
            "password": invalid_password
        }
        
        response = await client.post(
            "/api/v1/users/",
            json=user_data,
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        
        assert response.status_code == 422
        assert "password" in response.json()["detail"][0]["loc"]
```

### 2. Load Testing with Locust
```python
# tests/load/locustfile.py
from locust import HttpUser, task, between
import random
import string

class APIUser(HttpUser):
    wait_time = between(1, 3)
    
    def on_start(self):
        """Authenticate user on start."""
        response = self.client.post("/api/v1/auth/login", json={
            "email": "load-test@example.com",
            "password": "LoadTest123!"
        })
        if response.status_code == 200:
            self.token = response.json()["access_token"]
            self.headers = {"Authorization": f"Bearer {self.token}"}
        else:
            self.headers = {}
    
    @task(3)
    def list_users(self):
        """List users (most common operation)."""
        self.client.get("/api/v1/users/", headers=self.headers)
    
    @task(2)
    def get_user_profile(self):
        """Get current user profile."""
        self.client.get("/api/v1/auth/me", headers=self.headers)
    
    @task(1)
    def health_check(self):
        """Health check endpoint."""
        self.client.get("/health")
```

## 🐳 Container & Deployment (@devops Agent)

### 1. Production-Ready Dockerfile
```dockerfile
# Dockerfile
FROM python:3.11-slim as builder

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy requirements and install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Production stage
FROM python:3.11-slim as production

# Create non-root user
RUN groupadd --gid 1000 appuser && \
    useradd --uid 1000 --gid appuser --shell /bin/bash --create-home appuser

# Install runtime dependencies
RUN apt-get update && apt-get install -y \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy installed packages from builder
COPY --from=builder /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
COPY --from=builder /usr/local/bin /usr/local/bin

# Copy application code
COPY . .

# Change ownership to appuser
RUN chown -R appuser:appuser /app

# Switch to non-root user
USER appuser

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Run application
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "4"]
```

## 🎯 Quality Standards & Automation

### Performance Targets
- API response time: <200ms for simple queries, <1s for complex operations
- Database query time: <50ms for indexed queries
- Memory usage: <512MB under typical loads
- Error rate: <0.1% in production

### Security Requirements
- All endpoints have proper authentication/authorization
- Input validation and sanitization implemented
- SQL injection protection verified
- Rate limiting configured
- Security headers properly set

### Testing Requirements
- Unit test coverage >90%
- Integration test coverage for all API endpoints
- Load testing for expected production traffic
- Security testing covering OWASP Top 10

---

**Usage**: This template provides a production-ready FastAPI service that demonstrates the backend agent's expertise in modern Python API development, security best practices, and scalable architecture patterns.