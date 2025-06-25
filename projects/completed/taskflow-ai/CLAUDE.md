# TaskFlow AI Project

## Project Type
AI-powered task management platform with real-time collaboration and analytics.

## Active Specialists
- **Frontend**: Next.js, React, Tailwind CSS, TypeScript, Playwright
- **Backend**: FastAPI, Python, PostgreSQL, Redis, WebSockets, AI services
- **DevOps**: Docker, Kubernetes, monitoring, staging/production environments
- **Testing**: Comprehensive test suite with unit, integration, E2E, and load testing

## Essential Commands
```bash
# Frontend
cd frontend
npm run dev|build|test|lint
npx playwright test

# Backend
cd backend
python -m uvicorn app.main:app --reload
pytest
python run_comprehensive_tests.py

# Full Stack
docker-compose up -d
docker-compose -f docker-compose.staging.yml up
```

## Code Style
- **Frontend**: TypeScript strict, 2-space indentation, functional components
- **Backend**: Python 3.11+, FastAPI, Pydantic models, async/await
- **Testing**: pytest, Playwright, comprehensive coverage
- **Docker**: Multi-stage builds, health checks

## Architecture
- **Frontend**: Next.js App Router, real-time WebSocket connections
- **Backend**: FastAPI microservices, PostgreSQL, Redis caching
- **AI**: Integrated AI assistant for task automation
- **Real-time**: WebSocket manager for live collaboration
- **Auth**: JWT-based authentication with team management

## Key Patterns
```python
# FastAPI endpoint with dependencies
@router.post("/tasks/", response_model=TaskResponse)
async def create_task(
    task: TaskCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return await task_service.create_task(db, task, current_user)
```

```tsx
// React component with real-time updates
export function TaskBoard() {
  const { tasks, updateTask } = useTaskStore()
  useWebSocket('/ws/tasks', {
    onMessage: (data) => updateTask(data.task)
  })
  return <BoardView tasks={tasks} />
}
```

## Critical Test Paths
1. User auth → team creation → task management
2. Real-time collaboration → WebSocket updates
3. AI assistant → task automation
4. Analytics dashboard → data visualization
5. Mobile responsiveness → touch interactions