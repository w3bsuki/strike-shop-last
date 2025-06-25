# Developer Documentation

Welcome to the TaskFlow AI developer documentation! This section provides comprehensive guides for setting up, contributing to, and deploying TaskFlow AI.

## 📚 Documentation Sections

### 🏗️ [Local Setup](./local-setup.md)
Get your development environment running quickly:
- Prerequisites and system requirements
- Installation and configuration
- Database setup and migrations
- Development server startup
- Environment variables configuration

### 🏛️ [Architecture Overview](./architecture.md)
Understand the system design and structure:
- High-level architecture diagram
- Technology stack explanation
- Service communication patterns
- Data flow and storage
- Security architecture

### 🧪 [Testing Guidelines](./testing.md)
Maintain code quality with comprehensive testing:
- Testing strategy and philosophy
- Unit testing best practices
- Integration testing setup
- End-to-end testing with Playwright
- Performance testing guidelines

### 🤝 [Contributing](./contributing.md)
Learn how to contribute to TaskFlow AI:
- Code contribution process
- Development workflow
- Code review guidelines
- Documentation standards
- Community guidelines

### 🚀 [Deployment](./deployment.md)
Deploy TaskFlow AI to production:
- Production deployment guide
- Infrastructure requirements
- Environment configuration
- Monitoring and logging
- Scaling considerations

## 🎯 Quick Start for Developers

### Prerequisites Checklist

Before you begin, ensure you have:

- [ ] **Node.js 18+** and npm installed
- [ ] **Python 3.11+** with pip
- [ ] **PostgreSQL 14+** database
- [ ] **Redis 6+** for caching and sessions
- [ ] **Docker** and Docker Compose (optional but recommended)
- [ ] **Git** for version control

### 5-Minute Setup (Docker)

```bash
# Clone the repository
git clone https://github.com/taskflow-ai/taskflow.git
cd taskflow

# Start all services with Docker Compose
docker-compose up -d

# Run database migrations
docker-compose exec backend alembic upgrade head

# Create a superuser
docker-compose exec backend python -m app.initial_data

# Open the application
open http://localhost:3000
```

### Manual Setup

```bash
# Clone and setup backend
git clone https://github.com/taskflow-ai/taskflow.git
cd taskflow/backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\\Scripts\\activate

# Install dependencies
pip install -r requirements.txt

# Setup environment variables
cp .env.example .env
# Edit .env with your database and API keys

# Run migrations
alembic upgrade head

# Start backend server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# In another terminal, setup frontend
cd ../frontend
npm install
npm run dev
```

## 🛠️ Development Tools

### Recommended IDE Setup

#### VS Code Extensions
```json
{
  "recommendations": [
    "ms-python.python",
    "ms-python.black-formatter",
    "ms-python.flake8",
    "bradlc.vscode-tailwindcss",
    "esbenp.prettier-vscode",
    "ms-vscode.vscode-typescript-next",
    "ms-playwright.playwright"
  ]
}
```

#### IntelliJ/PyCharm
- Python plugin
- JavaScript/TypeScript support
- Docker integration
- Database tools
- Git integration

### Code Quality Tools

#### Backend (Python)
- **Black** - Code formatting
- **isort** - Import sorting
- **flake8** - Linting
- **mypy** - Type checking
- **pytest** - Testing framework

#### Frontend (TypeScript/React)
- **Prettier** - Code formatting
- **ESLint** - Linting and best practices
- **TypeScript** - Type checking
- **Vitest** - Unit testing
- **Playwright** - E2E testing

### Development Scripts

#### Backend Scripts
```bash
# Format code
python -m black app/
python -m isort app/

# Run linting
python -m flake8 app/

# Type checking
python -m mypy app/

# Run tests
python -m pytest

# Database operations
alembic revision --autogenerate -m "description"
alembic upgrade head
alembic downgrade -1
```

#### Frontend Scripts
```bash
# Development server
npm run dev

# Production build
npm run build

# Code formatting
npm run format

# Linting
npm run lint

# Type checking
npm run type-check

# Run tests
npm run test
npm run test:e2e
```

## 🏗️ Project Structure

### Repository Layout

```
taskflow/
├── backend/                 # FastAPI Python backend
│   ├── app/
│   │   ├── api/            # API routes and endpoints
│   │   ├── core/           # Core configuration
│   │   ├── db/             # Database configuration
│   │   ├── models/         # SQLAlchemy models
│   │   ├── schemas/        # Pydantic schemas
│   │   ├── services/       # Business logic
│   │   └── main.py         # Application entry point
│   ├── alembic/            # Database migrations
│   ├── tests/              # Backend tests
│   └── requirements.txt    # Python dependencies
├── frontend/               # Next.js React frontend
│   ├── app/                # Next.js app directory
│   ├── components/         # React components
│   ├── lib/                # Utility functions
│   ├── services/           # API client services
│   ├── stores/             # State management
│   ├── types/              # TypeScript definitions
│   └── tests/              # Frontend tests
├── docs/                   # Documentation
├── infrastructure/         # Deployment configurations
│   ├── docker/             # Docker configurations
│   ├── kubernetes/         # K8s manifests
│   └── monitoring/         # Monitoring setup
└── docker-compose.yml      # Local development setup
```

### Backend Architecture

```
app/
├── api/                    # API layer
│   ├── deps.py            # Dependency injection
│   └── v1/                # API version 1
│       ├── endpoints/     # Route handlers
│       └── api.py         # Router configuration
├── core/                  # Core functionality
│   ├── config.py          # Configuration management
│   ├── security.py        # Authentication/authorization
│   └── middleware/        # Request/response middleware
├── db/                    # Database layer
│   ├── base_class.py      # Base model class
│   └── session.py         # Database session management
├── models/                # Data models
│   ├── user.py            # User model
│   ├── team.py            # Team model
│   ├── task.py            # Task model
│   └── __init__.py        # Model registry
├── schemas/               # API schemas
│   ├── user.py            # User request/response schemas
│   ├── team.py            # Team schemas
│   └── task.py            # Task schemas
├── services/              # Business logic
│   ├── ai_service.py      # AI/ML functionality
│   ├── auth_service.py    # Authentication logic
│   └── email_service.py   # Email notifications
└── utils/                 # Utility functions
    ├── email.py           # Email utilities
    └── security.py        # Security utilities
```

### Frontend Architecture

```
frontend/
├── app/                   # Next.js app router
│   ├── (auth)/           # Authentication routes
│   ├── dashboard/        # Dashboard pages
│   ├── teams/            # Team management
│   └── layout.tsx        # Root layout
├── components/           # React components
│   ├── ui/               # Base UI components
│   ├── forms/            # Form components
│   ├── task-board/       # Task management
│   └── charts/           # Analytics components
├── lib/                  # Utility libraries
│   ├── utils.ts          # General utilities
│   ├── api.ts            # API client
│   └── validations/      # Form validation schemas
├── services/             # External service integrations
│   ├── api.ts            # REST API service
│   ├── websocket.ts      # WebSocket service
│   └── auth.ts           # Authentication service
├── stores/               # State management
│   ├── auth-store.ts     # Authentication state
│   ├── task-store.ts     # Task management state
│   └── team-store.ts     # Team state
├── types/                # TypeScript definitions
│   ├── index.ts          # Global types
│   ├── api.ts            # API response types
│   └── components.ts     # Component prop types
└── tests/                # Test files
    ├── components/       # Component tests
    ├── services/         # Service tests
    └── e2e/              # End-to-end tests
```

## 🔄 Development Workflow

### Git Workflow

#### Branch Strategy
```
main                 # Production-ready code
├── develop         # Integration branch
├── feature/*       # Feature development
├── bugfix/*        # Bug fixes
├── hotfix/*        # Critical production fixes
└── release/*       # Release preparation
```

#### Commit Convention
We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

**Types**:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes
- `refactor`: Code refactoring
- `test`: Test additions/modifications
- `chore`: Build process or auxiliary tool changes

**Examples**:
```
feat(auth): add OAuth 2.0 integration
fix(tasks): resolve drag and drop ordering issue
docs(api): update authentication endpoints
style(frontend): apply consistent button styling
refactor(backend): extract email service logic
test(tasks): add unit tests for task creation
chore(deps): update dependencies to latest versions
```

### Pull Request Process

1. **Create Feature Branch**
   ```bash
   git checkout develop
   git pull origin develop
   git checkout -b feature/task-templates
   ```

2. **Develop and Test**
   ```bash
   # Make your changes
   git add .
   git commit -m "feat(tasks): add task template functionality"
   
   # Run tests
   npm run test
   python -m pytest
   
   # Push changes
   git push origin feature/task-templates
   ```

3. **Create Pull Request**
   - Use PR template
   - Add descriptive title and description
   - Link related issues
   - Add reviewers
   - Ensure CI passes

4. **Code Review**
   - Address reviewer feedback
   - Update code as needed
   - Maintain clean commit history

5. **Merge**
   - Squash and merge to develop
   - Delete feature branch
   - Update local branches

### Code Review Guidelines

#### What to Look For

**Functionality**:
- [ ] Code works as expected
- [ ] Edge cases are handled
- [ ] Error handling is appropriate
- [ ] Performance considerations

**Code Quality**:
- [ ] Code is readable and maintainable
- [ ] Follows established patterns
- [ ] Proper naming conventions
- [ ] Appropriate abstractions

**Testing**:
- [ ] Adequate test coverage
- [ ] Tests are meaningful
- [ ] Tests pass consistently
- [ ] Edge cases are tested

**Security**:
- [ ] No security vulnerabilities
- [ ] Input validation
- [ ] Authentication/authorization
- [ ] Data sanitization

**Documentation**:
- [ ] Code is self-documenting
- [ ] Complex logic is commented
- [ ] API changes are documented
- [ ] README updates if needed

#### Review Process

1. **Automated Checks**
   - CI/CD pipeline passes
   - Code coverage meets threshold
   - Security scans pass
   - Performance benchmarks

2. **Peer Review**
   - At least 2 approvals required
   - Domain expert review for complex changes
   - Security review for auth/permission changes
   - Architecture review for significant changes

3. **Final Checks**
   - Manual testing in review environment
   - Integration test execution
   - Documentation review
   - Deployment readiness

## 📦 Dependencies

### Backend Dependencies

#### Core Framework
- **FastAPI** - Modern, fast web framework
- **Uvicorn** - ASGI server implementation
- **Pydantic** - Data validation using Python type hints
- **SQLAlchemy** - Python SQL toolkit and ORM

#### Database & Storage
- **PostgreSQL** - Primary database
- **Redis** - Caching and session storage
- **Alembic** - Database migration tool
- **psycopg2** - PostgreSQL adapter

#### AI & Machine Learning
- **OpenAI** - GPT integration for AI features
- **scikit-learn** - Machine learning algorithms
- **pandas** - Data manipulation and analysis
- **numpy** - Numerical computing

#### Authentication & Security
- **python-jose** - JWT token handling
- **passlib** - Password hashing
- **bcrypt** - Secure password hashing
- **python-multipart** - File upload support

#### Communication
- **celery** - Distributed task queue
- **python-socketio** - WebSocket implementation
- **emails** - Email sending utilities
- **httpx** - HTTP client for external APIs

### Frontend Dependencies

#### Core Framework
- **Next.js 14** - React framework with App Router
- **React 18** - UI library with concurrent features
- **TypeScript** - Static type checking
- **Tailwind CSS** - Utility-first CSS framework

#### UI Components
- **shadcn/ui** - Accessible component library
- **Radix UI** - Unstyled, accessible components
- **Lucide React** - Beautiful & consistent icons
- **Framer Motion** - Animation library

#### State Management
- **Zustand** - Lightweight state management
- **TanStack Query** - Server state management
- **React Hook Form** - Forms with easy validation
- **Zod** - TypeScript-first schema validation

#### Development Tools
- **Vitest** - Fast unit test framework
- **Playwright** - End-to-end testing
- **ESLint** - JavaScript/TypeScript linting
- **Prettier** - Code formatting

#### Real-time & Communication
- **Socket.io Client** - WebSocket client
- **Axios** - HTTP client
- **React Hot Toast** - Notification system

## 🔧 Configuration

### Environment Variables

#### Backend (.env)
```bash
# Database
DATABASE_URL=postgresql://user:password@localhost/taskflow
REDIS_URL=redis://localhost:6379

# Security
SECRET_KEY=your-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# AI Services
OPENAI_API_KEY=your-openai-api-key
OPENAI_MODEL=gpt-4

# Email
SMTP_TLS=True
SMTP_PORT=587
SMTP_HOST=smtp.gmail.com
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password

# External Services
SENTRY_DSN=your-sentry-dsn
WEBHOOK_SECRET=your-webhook-secret

# Development
DEBUG=True
TESTING=False
```

#### Frontend (.env.local)
```bash
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_WS_URL=ws://localhost:8000

# Authentication
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret

# External Services
NEXT_PUBLIC_SENTRY_DSN=your-sentry-dsn
NEXT_PUBLIC_ANALYTICS_ID=your-analytics-id

# Development
NEXT_PUBLIC_DEBUG=true
```

### Docker Configuration

#### Development (docker-compose.yml)
```yaml
version: '3.8'

services:
  db:
    image: postgres:14
    environment:
      POSTGRES_DB: taskflow
      POSTGRES_USER: taskflow
      POSTGRES_PASSWORD: taskflow
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:6
    ports:
      - "6379:6379"

  backend:
    build: ./backend
    ports:
      - "8000:8000"
    volumes:
      - ./backend:/app
    environment:
      - DATABASE_URL=postgresql://taskflow:taskflow@db/taskflow
      - REDIS_URL=redis://redis:6379
    depends_on:
      - db
      - redis

  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    volumes:
      - ./frontend:/app
      - /app/node_modules
    environment:
      - NEXT_PUBLIC_API_URL=http://localhost:8000
    depends_on:
      - backend

volumes:
  postgres_data:
```

## 🧩 API Design Patterns

### RESTful API Design

#### Resource Naming
```
# Good
GET /api/v1/tasks
POST /api/v1/tasks
GET /api/v1/tasks/{id}
PUT /api/v1/tasks/{id}
DELETE /api/v1/tasks/{id}

# Nested resources
GET /api/v1/teams/{team_id}/tasks
POST /api/v1/tasks/{task_id}/comments
```

#### Response Format
```json
{
  "data": {
    "id": "uuid",
    "type": "task",
    "attributes": {
      "title": "Task title",
      "status": "in_progress"
    },
    "relationships": {
      "assignee": {
        "data": { "id": "uuid", "type": "user" }
      }
    }
  },
  "meta": {
    "timestamp": "2025-01-22T10:30:00Z",
    "version": "1.0"
  }
}
```

#### Error Handling
```json
{
  "error": {
    "code": "validation_error",
    "message": "The title field is required.",
    "details": {
      "field": "title",
      "constraint": "required"
    }
  },
  "meta": {
    "request_id": "req_123456",
    "timestamp": "2025-01-22T10:30:00Z"
  }
}
```

### Database Design Patterns

#### Model Relationships
```python
class Team(Base):
    __tablename__ = "teams"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    
    # Relationships
    members = relationship("TeamMember", back_populates="team")
    tasks = relationship("Task", back_populates="team")

class Task(Base):
    __tablename__ = "tasks"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String(255), nullable=False)
    
    # Foreign keys
    team_id = Column(UUID(as_uuid=True), ForeignKey("teams.id"), nullable=False)
    assignee_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    
    # Relationships
    team = relationship("Team", back_populates="tasks")
    assignee = relationship("User", back_populates="assigned_tasks")
```

#### Migration Patterns
```python
"""Add task templates

Revision ID: abc123
Revises: def456
Create Date: 2025-01-22 10:30:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers
revision = 'abc123'
down_revision = 'def456'
branch_labels = None
depends_on = None

def upgrade() -> None:
    # Create task_templates table
    op.create_table(
        'task_templates',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('team_id', sa.UUID(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['team_id'], ['teams.id'], ),
        sa.PrimaryKeyConstraint('id')
    )

def downgrade() -> None:
    op.drop_table('task_templates')
```

## 🚀 Performance Optimization

### Backend Optimization

#### Database Optimization
```python
# Use database indexes
class Task(Base):
    __tablename__ = "tasks"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    team_id = Column(UUID(as_uuid=True), ForeignKey("teams.id"), index=True)
    status = Column(String(50), index=True)
    created_at = Column(DateTime(timezone=True), index=True)

# Optimize queries with joins
def get_tasks_with_relations(db: Session, team_id: UUID):
    return db.query(Task)\
        .options(
            joinedload(Task.assignee),
            joinedload(Task.creator),
            joinedload(Task.project)
        )\
        .filter(Task.team_id == team_id)\
        .all()

# Use pagination
def get_tasks_paginated(db: Session, skip: int = 0, limit: int = 50):
    return db.query(Task).offset(skip).limit(limit).all()
```

#### Caching Strategies
```python
import redis
from functools import wraps

redis_client = redis.Redis(host='localhost', port=6379, db=0)

def cache_result(expiration: int = 300):
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Create cache key
            cache_key = f"{func.__name__}:{hash(str(args) + str(kwargs))}"
            
            # Try to get from cache
            cached = redis_client.get(cache_key)
            if cached:
                return json.loads(cached)
            
            # Execute function and cache result
            result = await func(*args, **kwargs)
            redis_client.setex(cache_key, expiration, json.dumps(result))
            return result
        return wrapper
    return decorator

@cache_result(expiration=600)
async def get_team_analytics(team_id: UUID):
    # Expensive analytics calculation
    pass
```

### Frontend Optimization

#### Component Optimization
```typescript
import { memo, useMemo, useCallback } from 'react';

// Memoize expensive components
const TaskCard = memo(({ task, onUpdate }: TaskCardProps) => {
  const formattedDueDate = useMemo(() => {
    return task.dueDate ? formatDate(task.dueDate) : null;
  }, [task.dueDate]);

  const handleStatusChange = useCallback((newStatus: string) => {
    onUpdate(task.id, { status: newStatus });
  }, [task.id, onUpdate]);

  return (
    <div className="task-card">
      {/* Task content */}
    </div>
  );
});

// Use React Query for data fetching
const useTasks = (teamId: string) => {
  return useQuery({
    queryKey: ['tasks', teamId],
    queryFn: () => fetchTasks(teamId),
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  });
};
```

#### Bundle Optimization
```typescript
// Dynamic imports for code splitting
const AnalyticsDashboard = dynamic(() => import('./AnalyticsDashboard'), {
  loading: () => <AnalyticsLoading />,
  ssr: false,
});

// Optimize images
import Image from 'next/image';

const UserAvatar = ({ user }: { user: User }) => (
  <Image
    src={user.avatarUrl}
    alt={user.name}
    width={32}
    height={32}
    className="rounded-full"
    priority={false}
    placeholder="blur"
    blurDataURL="data:image/jpeg;base64,..."
  />
);
```

## 🔐 Security Best Practices

### Authentication & Authorization

#### JWT Implementation
```python
from jose import JWTError, jwt
from datetime import datetime, timedelta

def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def verify_token(token: str):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(401, "Invalid token")
        return user_id
    except JWTError:
        raise HTTPException(401, "Invalid token")
```

#### Permission System
```python
from enum import Enum
from functools import wraps

class Permission(Enum):
    READ_TASKS = "read:tasks"
    WRITE_TASKS = "write:tasks"
    ADMIN_TEAM = "admin:team"

def require_permission(permission: Permission):
    def decorator(func):
        @wraps(func)
        async def wrapper(
            current_user: User = Depends(get_current_user),
            *args, **kwargs
        ):
            if not has_permission(current_user, permission):
                raise HTTPException(403, "Insufficient permissions")
            return await func(current_user=current_user, *args, **kwargs)
        return wrapper
    return decorator

@app.get("/tasks")
@require_permission(Permission.READ_TASKS)
async def get_tasks(current_user: User = Depends(get_current_user)):
    return get_user_tasks(current_user.id)
```

### Data Validation

#### Input Validation
```python
from pydantic import BaseModel, validator, Field
from typing import Optional
import re

class TaskCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = Field(None, max_length=5000)
    priority: str = Field(..., regex=r'^(low|medium|high|urgent)$')
    
    @validator('title')
    def validate_title(cls, v):
        if not v.strip():
            raise ValueError('Title cannot be empty')
        # Sanitize HTML
        return html.escape(v.strip())
    
    @validator('description')
    def validate_description(cls, v):
        if v:
            # Basic HTML sanitization
            return bleach.clean(v, tags=['p', 'br', 'strong', 'em'])
        return v

class TeamMemberInvite(BaseModel):
    email: str = Field(..., regex=r'^[^@]+@[^@]+\.[^@]+$')
    role: str = Field(..., regex=r'^(admin|member|viewer)$')
    
    @validator('email')
    def validate_email(cls, v):
        # Additional email validation
        if len(v) > 254:
            raise ValueError('Email too long')
        return v.lower()
```

#### SQL Injection Prevention
```python
# Use SQLAlchemy ORM (parameterized queries)
def get_tasks_by_status(db: Session, status: str, team_id: UUID):
    return db.query(Task).filter(
        Task.status == status,  # Automatically parameterized
        Task.team_id == team_id
    ).all()

# For raw SQL, use parameterized queries
def get_task_analytics(db: Session, team_id: UUID, start_date: datetime):
    result = db.execute(
        text("""
            SELECT COUNT(*) as completed_tasks 
            FROM tasks 
            WHERE team_id = :team_id 
            AND status = 'completed' 
            AND completed_at >= :start_date
        """),
        {"team_id": team_id, "start_date": start_date}
    )
    return result.fetchone()
```

### Security Headers

#### FastAPI Security Middleware
```python
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware

app = FastAPI()

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://app.taskflow.ai"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["*"],
)

# Trusted hosts
app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=["app.taskflow.ai", "*.taskflow.ai"]
)

# Security headers middleware
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    return response
```

## 📊 Monitoring & Observability

### Application Monitoring

#### Logging Configuration
```python
import logging
import sys
from loguru import logger

# Remove default handler and add custom formatting
logger.remove()
logger.add(
    sys.stdout,
    format="<green>{time:YYYY-MM-DD HH:mm:ss}</green> | <level>{level: <8}</level> | <cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> - <level>{message}</level>",
    level="INFO"
)

# Add file logging for production
logger.add(
    "logs/taskflow.log",
    rotation="500 MB",
    retention="10 days",
    level="INFO"
)

# Structured logging
logger.info("User action", extra={
    "user_id": user.id,
    "action": "task_created",
    "task_id": task.id,
    "team_id": team.id
})
```

#### Metrics Collection
```python
from prometheus_client import Counter, Histogram, Gauge
import time

# Define metrics
task_creation_counter = Counter('tasks_created_total', 'Total tasks created', ['team_id'])
request_duration = Histogram('request_duration_seconds', 'Request duration')
active_users = Gauge('active_users', 'Number of active users')

# Middleware for request metrics
@app.middleware("http")
async def metrics_middleware(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    duration = time.time() - start_time
    
    request_duration.observe(duration)
    
    return response

# Business metrics
@app.post("/tasks")
async def create_task(task_data: TaskCreate):
    task = create_task_service(task_data)
    task_creation_counter.labels(team_id=task.team_id).inc()
    return task
```

### Error Tracking

#### Sentry Integration
```python
import sentry_sdk
from sentry_sdk.integrations.fastapi import FastApiIntegration
from sentry_sdk.integrations.sqlalchemy import SqlalchemyIntegration

sentry_sdk.init(
    dsn="YOUR_SENTRY_DSN",
    integrations=[
        FastApiIntegration(auto_enabling_integrations=False),
        SqlalchemyIntegration(),
    ],
    traces_sample_rate=0.1,
    environment="production",
)

# Custom error handling
@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    sentry_sdk.capture_exception(exc)
    logger.error(f"Unhandled exception: {exc}", extra={
        "path": request.url.path,
        "method": request.method,
        "user_agent": request.headers.get("user-agent")
    })
    return JSONResponse(
        status_code=500,
        content={"error": "Internal server error"}
    )
```

### Health Checks

#### Service Health Monitoring
```python
from fastapi import status
import asyncio

@app.get("/health", status_code=status.HTTP_200_OK)
async def health_check():
    checks = {
        "database": await check_database_connection(),
        "redis": await check_redis_connection(),
        "external_apis": await check_external_services(),
    }
    
    all_healthy = all(checks.values())
    status_code = status.HTTP_200_OK if all_healthy else status.HTTP_503_SERVICE_UNAVAILABLE
    
    return JSONResponse(
        status_code=status_code,
        content={
            "status": "healthy" if all_healthy else "unhealthy",
            "checks": checks,
            "timestamp": datetime.utcnow().isoformat()
        }
    )

async def check_database_connection():
    try:
        # Simple query to test connection
        db.execute(text("SELECT 1"))
        return True
    except Exception:
        return False

async def check_redis_connection():
    try:
        redis_client.ping()
        return True
    except Exception:
        return False
```

## 🎓 Learning Resources

### Internal Resources

- **Code Reviews** - Learn from peer feedback
- **Architecture Decisions** - Understand design choices
- **Team Documentation** - Domain knowledge
- **Pair Programming** - Collaborative learning

### External Resources

#### Python/FastAPI
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [SQLAlchemy Tutorial](https://docs.sqlalchemy.org/en/14/tutorial/)
- [Pydantic Documentation](https://pydantic-docs.helpmanual.io/)
- [Python Type Hints](https://docs.python.org/3/library/typing.html)

#### React/Next.js
- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://reactjs.org/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

#### DevOps
- [Docker Documentation](https://docs.docker.com/)
- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Redis Documentation](https://redis.io/documentation)

---

Ready to build amazing features for TaskFlow AI! 🚀