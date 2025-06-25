# TaskFlow AI Backend

AI-powered task management backend built with FastAPI, PostgreSQL, and real-time WebSocket support.

## Features

- **FastAPI** with async/await support
- **PostgreSQL** database with SQLAlchemy ORM
- **WebSocket** support for real-time collaboration
- **AI Integration** for task prioritization and natural language processing
- **JWT Authentication** with refresh tokens
- **Rate Limiting** for API protection
- **Celery** for background tasks
- **Docker Compose** for easy development setup

## Quick Start

### Prerequisites

- Docker and Docker Compose
- Python 3.11+ (for local development)
- OpenAI API key (optional, for AI features)

### Setup with Docker

1. Clone the repository and navigate to backend directory:
```bash
cd taskflow-ai/backend
```

2. Copy environment variables:
```bash
cp .env.example .env
```

3. Update `.env` with your configuration (especially OpenAI API key)

4. Start services:
```bash
docker-compose up -d
```

5. Run database migrations:
```bash
docker-compose exec backend alembic upgrade head
```

6. Access the API:
- API Documentation: http://localhost:8000/api/v1/docs
- Health Check: http://localhost:8000/health
- Flower (Celery monitoring): http://localhost:5555

### Local Development

1. Create virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Start PostgreSQL and Redis (via Docker):
```bash
docker-compose up -d postgres redis
```

4. Run migrations:
```bash
alembic upgrade head
```

5. Start the server:
```bash
uvicorn app.main:app --reload
```

## API Structure

### Authentication Endpoints
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login (OAuth2 compatible)
- `POST /api/v1/auth/refresh` - Refresh access token

### Task Endpoints
- `POST /api/v1/tasks` - Create task (supports natural language)
- `GET /api/v1/tasks` - List tasks with AI-powered sorting
- `GET /api/v1/tasks/{id}` - Get task details
- `PATCH /api/v1/tasks/{id}` - Update task
- `DELETE /api/v1/tasks/{id}` - Delete task
- `POST /api/v1/tasks/{id}/ai/suggest-assignee` - AI assignee suggestion
- `POST /api/v1/tasks/ai/detect-bottlenecks` - Detect workflow bottlenecks

### WebSocket
- `WS /api/v1/ws?token={jwt_token}` - Real-time updates

## Database Schema

Key models:
- **User**: Authentication and profile
- **Team**: Team workspace
- **Task**: Core task entity with AI metadata
- **Project**: Task grouping
- **Activity**: Audit log
- **Comment**: Task discussions

## AI Features

1. **Natural Language Task Creation**
   - Parse task details from plain text
   - Extract priority, due dates, and estimates

2. **Smart Prioritization**
   - AI-calculated priority scores
   - Considers dependencies, deadlines, and workload

3. **Predictive Scheduling**
   - Estimate completion times
   - Predict bottlenecks
   - Suggest optimal assignees

4. **Automatic Tagging**
   - Generate relevant tags from task content
   - Categorize tasks automatically

## WebSocket Events

### Client -> Server
- `join_team`: Join team room
- `leave_team`: Leave team room
- `task_update`: Notify task changes
- `typing`: Typing indicator
- `cursor_position`: Collaborative cursor

### Server -> Client
- `task_update`: Real-time task changes
- `presence`: User online/offline status
- `typing`: Typing indicators
- `cursor_update`: Cursor positions

## Security

- JWT tokens with refresh mechanism
- Rate limiting per endpoint
- CORS configuration
- Security headers
- Input validation with Pydantic
- SQL injection protection via ORM

## Testing

Run tests:
```bash
pytest
```

With coverage:
```bash
pytest --cov=app tests/
```

## Deployment

For production deployment:

1. Update `.env` with production values
2. Use proper secret keys
3. Enable HTTPS
4. Configure proper CORS origins
5. Set up monitoring (Prometheus/Grafana)
6. Use Kubernetes for orchestration

## Contributing

1. Follow PEP 8 style guide
2. Add tests for new features
3. Update documentation
4. Use type hints
5. Run linters before committing

## License

MIT License