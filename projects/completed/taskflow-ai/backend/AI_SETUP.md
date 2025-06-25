# TaskFlow AI - Real AI Integration Setup

This document explains how to set up and use the real AI functionality in TaskFlow AI.

## 🚀 Quick Setup

### 1. Get OpenAI API Key

1. Visit [OpenAI Platform](https://platform.openai.com/)
2. Create an account or log in
3. Go to API Keys section
4. Create a new API key
5. Copy the key (starts with `sk-...`)

### 2. Configure Environment

```bash
# Copy example environment file
cp .env.example .env

# Edit .env file and add your OpenAI API key
OPENAI_API_KEY=sk-your-actual-openai-api-key-here
OPENAI_MODEL=gpt-4-turbo-preview
```

### 3. Install Dependencies

All AI dependencies are already included in `requirements.txt`:

```bash
pip install -r requirements.txt
```

### 4. Start Services

```bash
# Start Redis (required for caching)
redis-server

# Start Celery worker (for background AI tasks)
celery -A app.worker.celery_app worker --loglevel=info

# Start FastAPI server
uvicorn app.main:app --reload
```

## 🤖 AI Features

### 1. Natural Language Task Parsing

**Endpoint**: `POST /api/v1/tasks/`

Create tasks using natural language:

```json
{
  "natural_language_input": "Create a login page with React by tomorrow, high priority, estimated 6 hours",
  "team_id": "uuid-here"
}
```

The AI will extract:
- Title: "Create a login page with React"
- Priority: "high"  
- Due date: tomorrow's date
- Estimated hours: 6
- Tags: ["frontend", "react", "feature"]

### 2. Priority Scoring (0-10 Scale)

**Features**:
- Analyzes urgency, impact, dependencies
- Considers due dates, workload, complexity
- Uses AI for nuanced business context
- Updates automatically on task changes

**Endpoint**: `POST /api/v1/tasks/ai/batch-update-priorities`

### 3. Completion Time Prediction

**Endpoint**: `POST /api/v1/tasks/{task_id}/ai/predict-completion`

**Factors considered**:
- Historical similar tasks
- Task complexity
- User velocity
- Team patterns
- AI analysis of requirements

### 4. Smart Assignee Suggestions

**Endpoint**: `POST /api/v1/tasks/{task_id}/ai/suggest-assignee`

**Considers**:
- Current workload (hours)
- Skill matching with task tags
- Historical performance
- AI recommendation based on task context

### 5. Bottleneck Detection

**Endpoint**: `POST /api/v1/tasks/ai/detect-bottlenecks`

**Detects**:
- Tasks blocking multiple others
- Overdue critical path items
- Resource constraints
- Cascade risk analysis

### 6. Semantic Task Search

**Endpoint**: `POST /api/v1/tasks/ai/semantic-search`

Search tasks by meaning, not just keywords:

```json
{
  "query": "authentication problems",
  "team_id": "uuid-here",
  "limit": 10
}
```

Finds tasks related to login, security, user access, etc.

### 7. Productivity Insights

**Endpoint**: `GET /api/v1/tasks/ai/productivity-insights/{team_id}`

**Provides**:
- Team velocity trends
- Estimation accuracy
- Completion patterns
- AI-generated recommendations

## 🔧 Configuration Options

### OpenAI Models

```env
# Recommended for production
OPENAI_MODEL=gpt-4-turbo-preview

# Faster and cheaper for development
OPENAI_MODEL=gpt-3.5-turbo

# For embeddings (automatically used)
# text-embedding-3-small
```

### Rate Limiting

AI endpoints have specific rate limits:

```python
# In app/middleware/rate_limit.py
"/api/v1/tasks/ai/semantic-search": "10/minute"
"/api/v1/tasks/ai/batch-update-priorities": "5/minute"  
"/api/v1/tasks/ai/generate-embeddings": "3/minute"
```

### Caching

AI responses are cached in Redis:

```python
# Cache TTL settings
parse_task: 1 hour
task_embeddings: 24 hours  
priority_scores: 2 hours
productivity_insights: 1 hour
```

## 🎯 Background Tasks

### Automated AI Operations

```python
# Recalculate priorities nightly
recalculate_task_priorities.delay(team_id)

# Generate daily insights  
generate_daily_insights.delay(team_id)

# Update embeddings for search
update_task_embeddings.delay(team_id)

# Analyze team patterns
analyze_team_patterns.delay(team_id)
```

### Celery Configuration

```bash
# Start worker
celery -A app.worker.celery_app worker --loglevel=info

# Start scheduler (for periodic tasks)
celery -A app.worker.celery_app beat --loglevel=info

# Monitor with Flower
celery -A app.worker.celery_app flower
```

## 📊 Monitoring & Error Handling

### Circuit Breaker

AI services use circuit breaker pattern:
- Opens after 5 consecutive failures
- Attempts reset after 5 minutes
- Falls back to rule-based algorithms

### Error Tracking

```python
# Get AI error statistics
from app.services.ai_error_handling import ai_error_handler
stats = ai_error_handler.get_error_stats()
```

### Fallback Responses

When AI is unavailable, the system provides:
- Rule-based task parsing
- Simple priority calculation
- Basic time estimation
- Keyword-based search

## 🚧 Production Considerations

### 1. Cost Management

```python
# Monitor API usage
# Enable caching (Redis required)
# Use cheaper models for non-critical operations
# Implement usage quotas per team
```

### 2. Performance

```python
# Background processing for expensive operations
# Batch API calls where possible
# Cache embeddings for search
# Use streaming for real-time features
```

### 3. Security

```python
# Store API keys in environment variables
# Use rate limiting
# Validate all inputs
# Log but don't expose API responses
```

### 4. Reliability

```python
# Circuit breaker prevents cascade failures
# Fallback algorithms ensure functionality
# Retry logic with exponential backoff
# Health checks for AI services
```

## 🧪 Testing AI Features

### 1. Test with Sample Data

```bash
# Create test tasks
curl -X POST "http://localhost:8000/api/v1/tasks/" \
  -H "Content-Type: application/json" \
  -d '{
    "natural_language_input": "Fix the user login bug ASAP, critical priority",
    "team_id": "your-team-id"
  }'
```

### 2. Test Semantic Search

```bash
# Search for authentication tasks
curl -X POST "http://localhost:8000/api/v1/tasks/ai/semantic-search" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "user authentication issues",
    "team_id": "your-team-id"
  }'
```

### 3. Generate Insights

```bash
# Get productivity insights
curl "http://localhost:8000/api/v1/tasks/ai/productivity-insights/your-team-id?days=30"
```

## 📈 Usage Examples

### Creating AI-Enhanced Tasks

```python
# Frontend request
const response = await fetch('/api/v1/tasks/', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    natural_language_input: "Build a dashboard for user analytics, due next Friday, should take about 16 hours",
    team_id: teamId
  })
});

// AI extracts:
// - title: "Build a dashboard for user analytics"
// - due_date: "2024-01-26" (next Friday)
// - estimated_hours: 16
// - priority: "medium" 
// - tags: ["frontend", "analytics", "dashboard", "feature"]
```

### Smart Task Assignment

```python
# Get AI suggestion for assignee
const suggestion = await fetch(`/api/v1/tasks/${taskId}/ai/suggest-assignee`, {
  method: 'POST'
});

// Returns best team member based on:
// - Current workload
// - Skill match
// - Historical performance
// - AI analysis of task requirements
```

## 🔍 Troubleshooting

### Common Issues

1. **OpenAI API errors**
   - Check API key validity
   - Verify account has credits
   - Check rate limits

2. **Redis connection issues**
   - Ensure Redis is running
   - Check Redis URL in .env
   - Verify network connectivity

3. **Celery worker not processing**
   - Check worker is running
   - Verify Redis broker connection
   - Check task queue status

4. **Embeddings not generating**
   - Run background task manually
   - Check OpenAI API quotas
   - Verify embedding model access

### Debug Mode

```python
# Enable debug logging
DEBUG=True
LOGGING_LEVEL=DEBUG

# Check AI service status
from app.services.ai_service import ai_service
client_status = ai_service.client is not None
```

## 🎉 Success Metrics

When properly configured, you should see:

- ✅ Natural language tasks parsed correctly
- ✅ Priority scores between 0-10 with reasoning
- ✅ Time estimates with confidence factors
- ✅ Relevant assignee suggestions
- ✅ Bottlenecks detected with mitigation strategies
- ✅ Semantic search returning contextually relevant results
- ✅ Daily productivity insights with AI recommendations

## Support

For issues or questions:
1. Check the logs for error details
2. Verify environment configuration
3. Test with simple tasks first
4. Monitor Redis and Celery status