# Testing Guide for TaskFlow AI

This document provides comprehensive information about the testing infrastructure and how to run tests for TaskFlow AI.

## Overview

TaskFlow AI uses a comprehensive testing strategy that includes:

- **Unit Tests**: Test individual components and functions
- **Integration Tests**: Test complete workflows and component interactions
- **End-to-End Tests**: Test complete user journeys
- **Load Tests**: Test system performance under load
- **Visual Regression Tests**: Test UI consistency
- **API Tests**: Test backend endpoints and services

## Frontend Testing

### Technology Stack

- **Vitest**: Fast unit test runner with native ESM support
- **React Testing Library**: Component testing utilities
- **Playwright**: End-to-end testing framework
- **MSW (Mock Service Worker)**: API mocking

### Running Frontend Tests

```bash
cd frontend

# Run all unit tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run tests with UI
npm run test:ui

# Run E2E tests
npm run test:e2e

# Run E2E tests with UI
npm run test:e2e:ui

# Run E2E tests in debug mode
npm run test:e2e:debug

# Run all tests (unit + E2E)
npm run test:all
```

### Frontend Test Structure

```
frontend/tests/
├── components/           # Component unit tests
├── hooks/               # Custom hook tests
├── services/            # API service tests
├── stores/              # State management tests
├── utils/               # Test utilities and helpers
├── mocks/               # Mock data and handlers
└── setup.ts             # Test setup configuration

frontend/e2e/            # End-to-end tests
├── auth.spec.ts         # Authentication flows
├── task-board.spec.ts   # Task management flows
└── ...
```

### Writing Frontend Tests

#### Component Tests

```typescript
import { describe, it, expect } from 'vitest'
import { render, screen } from '../utils/test-utils'
import { TaskCard } from '@/components/task-board/task-card'

describe('TaskCard', () => {
  it('renders task information correctly', () => {
    const mockTask = {
      id: '1',
      title: 'Test Task',
      status: 'todo',
      priority: 'medium'
    }

    render(<TaskCard task={mockTask} />)

    expect(screen.getByText('Test Task')).toBeInTheDocument()
    expect(screen.getByText('medium')).toBeInTheDocument()
  })
})
```

#### E2E Tests

```typescript
import { test, expect } from '@playwright/test'

test('should create a new task', async ({ page }) => {
  await page.goto('/dashboard')
  
  await page.click('button:has-text("Create Task")')
  await page.fill('input[name="title"]', 'New Task')
  await page.click('button:has-text("Save")')
  
  await expect(page.locator('text=New Task')).toBeVisible()
})
```

## Backend Testing

### Technology Stack

- **pytest**: Python testing framework
- **pytest-asyncio**: Async test support
- **factory-boy**: Test data factories
- **httpx**: HTTP client for API testing
- **locust**: Load testing framework

### Running Backend Tests

```bash
cd backend

# Run all tests
pytest

# Run tests with coverage
pytest --cov=app --cov-report=html

# Run specific test file
pytest tests/test_auth_endpoints.py

# Run tests with specific markers
pytest -m unit           # Unit tests only
pytest -m integration    # Integration tests only
pytest -m slow          # Slow tests only

# Run tests in parallel
pytest -n auto

# Run with verbose output
pytest -v

# Run load tests
locust -f tests/test_load.py
```

### Backend Test Structure

```
backend/tests/
├── conftest.py              # Test configuration and fixtures
├── factories.py             # Test data factories
├── test_config.py           # Test settings
├── test_auth_endpoints.py   # Authentication API tests
├── test_task_endpoints.py   # Task API tests
├── test_ai_service.py       # AI service tests
├── test_websocket.py        # WebSocket tests
├── test_integration.py      # Integration tests
└── test_load.py             # Load tests
```

### Writing Backend Tests

#### API Endpoint Tests

```python
import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_create_task(authenticated_client: AsyncClient):
    task_data = {
        "title": "New Task",
        "description": "Task description",
        "priority": "high"
    }
    
    response = await authenticated_client.post("/api/v1/tasks", json=task_data)
    
    assert response.status_code == 201
    data = response.json()
    assert data["title"] == task_data["title"]
```

#### Integration Tests

```python
@pytest.mark.integration
@pytest.mark.asyncio
async def test_complete_task_workflow(client: AsyncClient, db_session: AsyncSession):
    # Test complete workflow from task creation to completion
    # ... test implementation
```

## Test Coverage

### Coverage Requirements

- **Minimum Coverage**: 80% for both frontend and backend
- **Critical Paths**: 90%+ coverage for authentication, task management, and AI services
- **New Code**: Must maintain or improve overall coverage

### Viewing Coverage Reports

```bash
# Frontend coverage
cd frontend
npm run test:coverage
open coverage/index.html

# Backend coverage
cd backend
pytest --cov=app --cov-report=html
open htmlcov/index.html
```

## Load Testing

### Running Load Tests

```bash
cd backend

# Basic load test
locust -f tests/test_load.py --host http://localhost:8000

# Headless load test
locust -f tests/test_load.py --headless -u 50 -r 10 -t 300s --host http://localhost:8000

# Load test with specific user class
locust -f tests/test_load.py TaskFlowUser --host http://localhost:8000
```

### Load Test Scenarios

- **TaskFlowUser**: Normal user behavior (view tasks, create, update)
- **AuthenticationUser**: Authentication-focused testing
- **APIStressUser**: High-frequency API calls for stress testing

## Continuous Integration

Tests run automatically on:

- **Pull Requests**: Full test suite including unit, integration, and E2E tests
- **Main Branch Pushes**: All tests plus load testing
- **Nightly**: Extended test suite with additional scenarios

### CI/CD Pipeline

1. **Code Quality**: Linting and type checking
2. **Unit Tests**: Fast feedback on component functionality
3. **Integration Tests**: API and workflow testing
4. **E2E Tests**: Complete user journey validation
5. **Load Tests**: Performance validation (main branch only)
6. **Security Scans**: Vulnerability assessment
7. **Docker Build**: Container image validation

## Test Data Management

### Test Factories

Use factories for consistent test data:

```python
# Backend
user = await UserFactory.create_async(db_session)
task = await TaskFactory.create_async(db_session, created_by=user.id)

# Frontend
const mockUser = createMockUser({ name: "Test User" })
const mockTask = createMockTask({ assignee: mockUser })
```

### Database Testing

- **SQLite in-memory**: Fast unit tests
- **PostgreSQL**: Integration tests matching production
- **Isolated transactions**: Each test runs in isolation
- **Automatic cleanup**: Test data is cleaned up after each test

## Debugging Tests

### Frontend Debugging

```bash
# Debug specific test
npm run test -- --reporter=verbose TaskCard

# Debug E2E test
npm run test:e2e:debug

# Open Playwright test UI
npm run test:e2e:ui
```

### Backend Debugging

```bash
# Debug with pdb
pytest tests/test_auth.py::test_login -s

# Debug async tests
pytest tests/test_auth.py::test_login -s --pdb-trace

# Run single test with full output
pytest tests/test_auth.py::test_login -v -s
```

## Best Practices

### General

1. **Test Naming**: Use descriptive test names that explain what is being tested
2. **Test Independence**: Each test should be independent and not rely on others
3. **Arrange-Act-Assert**: Structure tests clearly with setup, execution, and verification
4. **Mock External Services**: Mock external APIs and services for reliable tests

### Frontend

1. **User-Centric Testing**: Test from the user's perspective, not implementation details
2. **Accessibility Testing**: Include accessibility checks in component tests
3. **Visual Testing**: Use visual regression tests for UI consistency
4. **Performance Testing**: Test component performance and bundle size

### Backend

1. **Database Testing**: Use transactions and proper cleanup
2. **Async Testing**: Properly handle async operations and timeouts
3. **Error Testing**: Test error conditions and edge cases
4. **Security Testing**: Include security scenarios in tests

## Troubleshooting

### Common Issues

1. **Test Timeouts**: Increase timeout values for slow operations
2. **Flaky Tests**: Improve test stability with proper waits and mocks
3. **Memory Leaks**: Ensure proper cleanup in tests
4. **Port Conflicts**: Use different ports for test services

### Getting Help

- Check test logs for detailed error messages
- Use debug mode for step-by-step execution
- Review test coverage reports to identify gaps
- Consult the team for complex testing scenarios

## Performance Benchmarks

### Expected Performance

- **Unit Tests**: < 10ms per test
- **Integration Tests**: < 500ms per test
- **E2E Tests**: < 30s per test
- **Load Tests**: Support 100+ concurrent users
- **Coverage Generation**: < 30s total

### Monitoring

- Test execution time is monitored in CI
- Coverage trends are tracked over time
- Load test results are archived for comparison
- Performance regressions trigger alerts