# Tasks API

The Tasks API is the core of TaskFlow AI, allowing you to create, manage, and interact with tasks programmatically. This includes AI-powered features like smart prioritization and natural language processing.

## 📋 Task Resource

### Task Object

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "title": "Implement user authentication",
  "description": "Add JWT-based authentication to the API endpoints",
  "status": "in_progress",
  "priority": "high",
  "due_date": "2025-01-25T18:00:00Z",
  "start_date": "2025-01-20T09:00:00Z",
  "estimated_hours": 8.0,
  "actual_hours": 5.5,
  "position": 1,
  "completed_at": null,
  "created_at": "2025-01-20T09:00:00Z",
  "updated_at": "2025-01-22T14:30:00Z",
  
  "team_id": "123e4567-e89b-12d3-a456-426614174000",
  "project_id": "789e4567-e89b-12d3-a456-426614174000",
  "creator_id": "456e7890-e89b-12d3-a456-426614174000",
  "assignee_id": "789e4567-e89b-12d3-a456-426614174000",
  "parent_task_id": null,
  
  "ai_priority_score": 85.5,
  "ai_estimated_hours": 7.2,
  "ai_complexity_score": 72.0,
  "ai_suggested_assignee_id": "789e4567-e89b-12d3-a456-426614174000",
  "ai_tags": ["backend", "security", "api"],
  "ai_predicted_completion": "2025-01-24T16:30:00Z",
  "ai_bottleneck_risk": 15.2,
  
  "custom_fields": {
    "client": "Acme Corp",
    "budget": 5000,
    "external_id": "PROJ-123"
  },
  
  "creator": {
    "id": "456e7890-e89b-12d3-a456-426614174000",
    "name": "John Doe",
    "email": "john@example.com",
    "avatar_url": "https://example.com/avatar.jpg"
  },
  "assignee": {
    "id": "789e4567-e89b-12d3-a456-426614174000",
    "name": "Jane Smith",
    "email": "jane@example.com",
    "avatar_url": "https://example.com/jane.jpg"
  },
  "project": {
    "id": "789e4567-e89b-12d3-a456-426614174000",
    "name": "Mobile App v2.0",
    "color": "#3B82F6"
  },
  
  "subtasks_count": 3,
  "comments_count": 8,
  "attachments_count": 2,
  "dependencies_count": 1
}
```

### Field Descriptions

#### Core Fields
- **id**: Unique task identifier (UUID)
- **title**: Task title (required, max 255 characters)
- **description**: Detailed task description (optional, markdown supported)
- **status**: Current status (`todo`, `in_progress`, `in_review`, `done`)
- **priority**: Task priority (`low`, `medium`, `high`, `urgent`)
- **due_date**: When task should be completed (ISO 8601)
- **start_date**: When work should begin (ISO 8601)
- **estimated_hours**: Expected time to complete (decimal)
- **actual_hours**: Time actually spent (decimal, auto-tracked)
- **position**: Order within status column (integer)

#### Relationships
- **team_id**: Team this task belongs to (UUID, required)
- **project_id**: Associated project (UUID, optional)
- **creator_id**: User who created the task (UUID)
- **assignee_id**: User assigned to the task (UUID, optional)
- **parent_task_id**: Parent task for subtasks (UUID, optional)

#### AI Fields
- **ai_priority_score**: AI-calculated priority (0-100)
- **ai_estimated_hours**: AI time prediction (decimal)
- **ai_complexity_score**: Task complexity rating (0-100)
- **ai_suggested_assignee_id**: AI-recommended assignee (UUID)
- **ai_tags**: AI-generated tags (array of strings)
- **ai_predicted_completion**: AI completion prediction (ISO 8601)
- **ai_bottleneck_risk**: Risk of delays (0-100)

#### Custom Fields
- **custom_fields**: Object with team-defined fields

## 🔍 List Tasks

### GET /tasks

Retrieve a list of tasks with filtering, sorting, and pagination.

```bash
curl -H "Authorization: Bearer YOUR_API_TOKEN" \
     "https://api.taskflow.ai/v1/tasks?status=in_progress&priority=high"
```

#### Query Parameters

**Filtering**:
- `team_id` - Filter by team (UUID)
- `project_id` - Filter by project (UUID)
- `assignee_id` - Filter by assignee (UUID)
- `creator_id` - Filter by creator (UUID)
- `status` - Filter by status (`todo`, `in_progress`, `in_review`, `done`)
- `priority` - Filter by priority (`low`, `medium`, `high`, `urgent`)
- `due_date_gte` - Due date greater than or equal (ISO 8601)
- `due_date_lte` - Due date less than or equal (ISO 8601)
- `created_at_gte` - Created after date (ISO 8601)
- `created_at_lte` - Created before date (ISO 8601)
- `tags` - Filter by tags (comma-separated)
- `search` - Full-text search query

**Sorting**:
- `sort` - Sort field (`created_at`, `updated_at`, `due_date`, `priority`, `position`, `ai_priority_score`)
- `sort_direction` - Sort direction (`asc`, `desc`)

**Pagination**:
- `page` - Page number (default: 1)
- `per_page` - Items per page (default: 50, max: 200)

**Includes**:
- `include` - Related resources (`creator`, `assignee`, `project`, `subtasks`, `comments`, `attachments`)

#### Example Request

```bash
curl -H "Authorization: Bearer YOUR_API_TOKEN" \
     "https://api.taskflow.ai/v1/tasks?team_id=123e4567-e89b-12d3-a456-426614174000&status=in_progress&include=assignee,project&sort=ai_priority_score&sort_direction=desc&per_page=20"
```

#### Response

```json
{
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "title": "Implement user authentication",
      "status": "in_progress",
      "priority": "high",
      "ai_priority_score": 85.5,
      "assignee": {
        "id": "789e4567-e89b-12d3-a456-426614174000",
        "name": "Jane Smith",
        "email": "jane@example.com"
      },
      "project": {
        "id": "789e4567-e89b-12d3-a456-426614174000",
        "name": "Mobile App v2.0"
      }
    }
  ],
  "meta": {
    "page": 1,
    "per_page": 20,
    "total": 47,
    "total_pages": 3
  },
  "links": {
    "first": "https://api.taskflow.ai/v1/tasks?page=1",
    "last": "https://api.taskflow.ai/v1/tasks?page=3",
    "next": "https://api.taskflow.ai/v1/tasks?page=2",
    "prev": null
  }
}
```

## 📄 Get Task

### GET /tasks/{id}

Retrieve a specific task by its ID.

```bash
curl -H "Authorization: Bearer YOUR_API_TOKEN" \
     "https://api.taskflow.ai/v1/tasks/550e8400-e29b-41d4-a716-446655440000?include=creator,assignee,project,subtasks"
```

#### Query Parameters

- `include` - Related resources to include (`creator`, `assignee`, `project`, `subtasks`, `comments`, `attachments`, `dependencies`)

#### Response

```json
{
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "title": "Implement user authentication",
    "description": "Add JWT-based authentication to the API endpoints with proper validation and error handling.",
    "status": "in_progress",
    "priority": "high",
    "due_date": "2025-01-25T18:00:00Z",
    "ai_priority_score": 85.5,
    "ai_estimated_hours": 7.2,
    "ai_tags": ["backend", "security", "api"],
    "creator": {
      "id": "456e7890-e89b-12d3-a456-426614174000",
      "name": "John Doe",
      "email": "john@example.com"
    },
    "assignee": {
      "id": "789e4567-e89b-12d3-a456-426614174000",
      "name": "Jane Smith",
      "email": "jane@example.com"
    },
    "subtasks": [
      {
        "id": "661e8400-e29b-41d4-a716-446655440000",
        "title": "Design JWT token structure",
        "status": "done",
        "priority": "medium"
      },
      {
        "id": "772e8400-e29b-41d4-a716-446655440000",
        "title": "Implement token validation middleware",
        "status": "in_progress",
        "priority": "high"
      }
    ]
  }
}
```

## ✨ Create Task

### POST /tasks

Create a new task with optional AI assistance.

```bash
curl -X POST \
     -H "Authorization: Bearer YOUR_API_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "title": "Design user onboarding flow",
       "description": "Create wireframes and prototypes for the new user onboarding experience",
       "team_id": "123e4567-e89b-12d3-a456-426614174000",
       "priority": "medium",
       "due_date": "2025-02-01T17:00:00Z",
       "assignee_id": "789e4567-e89b-12d3-a456-426614174000",
       "project_id": "789e4567-e89b-12d3-a456-426614174000"
     }' \
     https://api.taskflow.ai/v1/tasks
```

#### Request Body

**Required Fields**:
- `title` - Task title (string, max 255 chars)
- `team_id` - Team UUID

**Optional Fields**:
- `description` - Task description (string, markdown supported)
- `status` - Initial status (default: `todo`)
- `priority` - Task priority (default: `medium`)
- `due_date` - Due date (ISO 8601)
- `start_date` - Start date (ISO 8601)
- `estimated_hours` - Time estimate (decimal)
- `assignee_id` - Assignee UUID
- `project_id` - Project UUID
- `parent_task_id` - Parent task UUID (for subtasks)
- `custom_fields` - Object with custom field values
- `natural_language_input` - AI parsing input (see below)

#### Natural Language Processing

Use AI to parse task details from natural language:

```bash
curl -X POST \
     -H "Authorization: Bearer YOUR_API_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "natural_language_input": "Create a high priority task to review the marketing proposal, assign it to Sarah, due next Friday",
       "team_id": "123e4567-e89b-12d3-a456-426614174000"
     }' \
     https://api.taskflow.ai/v1/tasks
```

The AI will automatically extract:
- Title: "Review the marketing proposal"
- Priority: "high"
- Assignee: Sarah (if she's on the team)
- Due date: Next Friday's date

#### Response

```json
{
  "data": {
    "id": "883e8400-e29b-41d4-a716-446655440000",
    "title": "Design user onboarding flow",
    "description": "Create wireframes and prototypes for the new user onboarding experience",
    "status": "todo",
    "priority": "medium",
    "due_date": "2025-02-01T17:00:00Z",
    "team_id": "123e4567-e89b-12d3-a456-426614174000",
    "creator_id": "456e7890-e89b-12d3-a456-426614174000",
    "assignee_id": "789e4567-e89b-12d3-a456-426614174000",
    "ai_priority_score": 65.2,
    "ai_estimated_hours": 12.5,
    "ai_tags": ["design", "ui", "onboarding"],
    "created_at": "2025-01-22T10:30:00Z",
    "updated_at": "2025-01-22T10:30:00Z"
  }
}
```

## 📝 Update Task

### PUT /tasks/{id}

Update an existing task.

```bash
curl -X PUT \
     -H "Authorization: Bearer YOUR_API_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "status": "in_progress",
       "priority": "high",
       "estimated_hours": 10.0,
       "custom_fields": {
         "client": "Acme Corp",
         "urgency_reason": "Client deadline moved up"
       }
     }' \
     https://api.taskflow.ai/v1/tasks/550e8400-e29b-41d4-a716-446655440000
```

#### Request Body

All fields are optional. Only provided fields will be updated:

- `title` - Task title
- `description` - Task description
- `status` - Task status
- `priority` - Task priority
- `due_date` - Due date (or `null` to remove)
- `start_date` - Start date (or `null` to remove)
- `estimated_hours` - Time estimate
- `assignee_id` - Assignee (or `null` to unassign)
- `project_id` - Project (or `null` to remove from project)
- `parent_task_id` - Parent task (or `null` to remove hierarchy)
- `position` - Position in column
- `custom_fields` - Custom field values (merged with existing)

#### Response

```json
{
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "title": "Implement user authentication",
    "status": "in_progress",
    "priority": "high",
    "estimated_hours": 10.0,
    "custom_fields": {
      "client": "Acme Corp",
      "urgency_reason": "Client deadline moved up"
    },
    "updated_at": "2025-01-22T15:45:00Z"
  }
}
```

## 🗑️ Delete Task

### DELETE /tasks/{id}

Delete a task permanently.

```bash
curl -X DELETE \
     -H "Authorization: Bearer YOUR_API_TOKEN" \
     https://api.taskflow.ai/v1/tasks/550e8400-e29b-41d4-a716-446655440000
```

#### Response

```json
{
  "message": "Task deleted successfully"
}
```

**Note**: Deleting a parent task will also delete all subtasks. This action cannot be undone.

## 📊 Bulk Operations

### POST /tasks/bulk

Perform operations on multiple tasks at once.

```bash
curl -X POST \
     -H "Authorization: Bearer YOUR_API_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "operation": "update",
       "task_ids": [
         "550e8400-e29b-41d4-a716-446655440000",
         "661e8400-e29b-41d4-a716-446655440000",
         "772e8400-e29b-41d4-a716-446655440000"
       ],
       "data": {
         "status": "in_review",
         "assignee_id": "789e4567-e89b-12d3-a456-426614174000"
       }
     }' \
     https://api.taskflow.ai/v1/tasks/bulk
```

#### Supported Operations

**Update Multiple Tasks**:
```json
{
  "operation": "update",
  "task_ids": ["uuid1", "uuid2"],
  "data": {
    "status": "done",
    "priority": "high"
  }
}
```

**Delete Multiple Tasks**:
```json
{
  "operation": "delete",
  "task_ids": ["uuid1", "uuid2"]
}
```

**Move to Project**:
```json
{
  "operation": "move_to_project",
  "task_ids": ["uuid1", "uuid2"],
  "data": {
    "project_id": "project_uuid"
  }
}
```

#### Response

```json
{
  "data": {
    "updated": 3,
    "failed": 0,
    "errors": []
  }
}
```

## 🔗 Task Dependencies

### GET /tasks/{id}/dependencies

Get task dependencies.

```bash
curl -H "Authorization: Bearer YOUR_API_TOKEN" \
     https://api.taskflow.ai/v1/tasks/550e8400-e29b-41d4-a716-446655440000/dependencies
```

#### Response

```json
{
  "data": {
    "blocks": [
      {
        "id": "661e8400-e29b-41d4-a716-446655440000",
        "title": "Set up development environment",
        "status": "done"
      }
    ],
    "blocked_by": [
      {
        "id": "772e8400-e29b-41d4-a716-446655440000",
        "title": "Complete security audit",
        "status": "in_progress"
      }
    ]
  }
}
```

### POST /tasks/{id}/dependencies

Add a dependency relationship.

```bash
curl -X POST \
     -H "Authorization: Bearer YOUR_API_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "type": "blocks",
       "target_task_id": "883e8400-e29b-41d4-a716-446655440000"
     }' \
     https://api.taskflow.ai/v1/tasks/550e8400-e29b-41d4-a716-446655440000/dependencies
```

#### Request Body

- `type` - Dependency type (`blocks` or `blocked_by`)
- `target_task_id` - The other task in the relationship

### DELETE /tasks/{id}/dependencies/{target_id}

Remove a dependency relationship.

```bash
curl -X DELETE \
     -H "Authorization: Bearer YOUR_API_TOKEN" \
     https://api.taskflow.ai/v1/tasks/550e8400-e29b-41d4-a716-446655440000/dependencies/883e8400-e29b-41d4-a716-446655440000
```

## 👥 Task Subtasks

### GET /tasks/{id}/subtasks

Get all subtasks of a parent task.

```bash
curl -H "Authorization: Bearer YOUR_API_TOKEN" \
     https://api.taskflow.ai/v1/tasks/550e8400-e29b-41d4-a716-446655440000/subtasks
```

### POST /tasks/{id}/subtasks

Create a subtask.

```bash
curl -X POST \
     -H "Authorization: Bearer YOUR_API_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "title": "Write unit tests",
       "description": "Add comprehensive test coverage",
       "priority": "medium",
       "assignee_id": "789e4567-e89b-12d3-a456-426614174000"
     }' \
     https://api.taskflow.ai/v1/tasks/550e8400-e29b-41d4-a716-446655440000/subtasks
```

## 💬 Task Comments

### GET /tasks/{id}/comments

Get task comments.

```bash
curl -H "Authorization: Bearer YOUR_API_TOKEN" \
     https://api.taskflow.ai/v1/tasks/550e8400-e29b-41d4-a716-446655440000/comments
```

### POST /tasks/{id}/comments

Add a comment to a task.

```bash
curl -X POST \
     -H "Authorization: Bearer YOUR_API_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "content": "Great progress on this task! @jane can you review the authentication flow?",
       "mentions": ["789e4567-e89b-12d3-a456-426614174000"]
     }' \
     https://api.taskflow.ai/v1/tasks/550e8400-e29b-41d4-a716-446655440000/comments
```

## 📎 Task Attachments

### GET /tasks/{id}/attachments

Get task attachments.

```bash
curl -H "Authorization: Bearer YOUR_API_TOKEN" \
     https://api.taskflow.ai/v1/tasks/550e8400-e29b-41d4-a716-446655440000/attachments
```

### POST /tasks/{id}/attachments

Upload an attachment.

```bash
curl -X POST \
     -H "Authorization: Bearer YOUR_API_TOKEN" \
     -F "file=@design_mockup.png" \
     -F "description=Login page mockup" \
     https://api.taskflow.ai/v1/tasks/550e8400-e29b-41d4-a716-446655440000/attachments
```

## 🤖 AI Features

### POST /tasks/{id}/ai/prioritize

Get AI priority suggestion.

```bash
curl -X POST \
     -H "Authorization: Bearer YOUR_API_TOKEN" \
     https://api.taskflow.ai/v1/tasks/550e8400-e29b-41d4-a716-446655440000/ai/prioritize
```

#### Response

```json
{
  "data": {
    "suggested_priority": "high",
    "priority_score": 85.5,
    "reasoning": "This task blocks 3 other tasks and has a tight deadline. The security aspect makes it critical for the project.",
    "factors": [
      "blocks_other_tasks",
      "tight_deadline",
      "security_critical"
    ]
  }
}
```

### POST /tasks/{id}/ai/estimate

Get AI time estimation.

```bash
curl -X POST \
     -H "Authorization: Bearer YOUR_API_TOKEN" \
     https://api.taskflow.ai/v1/tasks/550e8400-e29b-41d4-a716-446655440000/ai/estimate
```

#### Response

```json
{
  "data": {
    "estimated_hours": 7.2,
    "confidence": 0.85,
    "reasoning": "Based on similar authentication tasks completed by the team, considering complexity and requirements.",
    "range": {
      "min": 5.5,
      "max": 9.0
    }
  }
}
```

### POST /tasks/{id}/ai/suggest-assignee

Get AI assignee suggestion.

```bash
curl -X POST \
     -H "Authorization: Bearer YOUR_API_TOKEN" \
     https://api.taskflow.ai/v1/tasks/550e8400-e29b-41d4-a716-446655440000/ai/suggest-assignee
```

#### Response

```json
{
  "data": {
    "suggested_assignee": {
      "id": "789e4567-e89b-12d3-a456-426614174000",
      "name": "Jane Smith",
      "email": "jane@example.com"
    },
    "confidence": 0.92,
    "reasoning": "Jane has completed 8 similar authentication tasks with high quality and is currently available.",
    "alternatives": [
      {
        "id": "994e7890-e89b-12d3-a456-426614174000",
        "name": "Mike Johnson",
        "confidence": 0.76
      }
    ]
  }
}
```

## ⚠️ Error Handling

### Common Error Responses

#### Task Not Found (404)
```json
{
  "error": {
    "code": "task_not_found",
    "message": "Task with ID '550e8400-e29b-41d4-a716-446655440000' not found"
  }
}
```

#### Validation Error (422)
```json
{
  "error": {
    "code": "validation_error",
    "message": "The title field is required.",
    "details": {
      "field": "title",
      "constraint": "required"
    }
  }
}
```

#### Permission Denied (403)
```json
{
  "error": {
    "code": "permission_denied",
    "message": "You don't have permission to modify tasks in this team"
  }
}
```

#### Dependency Cycle (422)
```json
{
  "error": {
    "code": "dependency_cycle",
    "message": "Adding this dependency would create a circular dependency"
  }
}
```

## 📚 Code Examples

### JavaScript/TypeScript

```javascript
// Create a task with AI assistance
async function createIntelligentTask(naturalInput, teamId) {
  const response = await fetch('https://api.taskflow.ai/v1/tasks', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${API_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      natural_language_input: naturalInput,
      team_id: teamId
    })
  });
  
  const task = await response.json();
  
  // Get AI priority suggestion
  const priorityResponse = await fetch(`https://api.taskflow.ai/v1/tasks/${task.data.id}/ai/prioritize`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${API_TOKEN}`
    }
  });
  
  const priority = await priorityResponse.json();
  
  // Update task with AI suggestions
  if (priority.data.suggested_priority !== task.data.priority) {
    await fetch(`https://api.taskflow.ai/v1/tasks/${task.data.id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${API_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        priority: priority.data.suggested_priority
      })
    });
  }
  
  return task.data;
}

// Usage
const task = await createIntelligentTask(
  "Fix the login bug, assign to Sarah, due tomorrow",
  "123e4567-e89b-12d3-a456-426614174000"
);
```

### Python

```python
import requests
from datetime import datetime, timedelta

class TaskFlowAPI:
    def __init__(self, api_token):
        self.api_token = api_token
        self.base_url = 'https://api.taskflow.ai/v1'
        self.headers = {
            'Authorization': f'Bearer {api_token}',
            'Content-Type': 'application/json'
        }
    
    def create_task(self, **kwargs):
        response = requests.post(
            f'{self.base_url}/tasks',
            headers=self.headers,
            json=kwargs
        )
        response.raise_for_status()
        return response.json()['data']
    
    def get_ai_insights(self, task_id):
        # Get AI priority
        priority_response = requests.post(
            f'{self.base_url}/tasks/{task_id}/ai/prioritize',
            headers=self.headers
        )
        
        # Get AI time estimate
        estimate_response = requests.post(
            f'{self.base_url}/tasks/{task_id}/ai/estimate',
            headers=self.headers
        )
        
        return {
            'priority': priority_response.json()['data'],
            'estimate': estimate_response.json()['data']
        }
    
    def bulk_update_tasks(self, task_ids, updates):
        response = requests.post(
            f'{self.base_url}/tasks/bulk',
            headers=self.headers,
            json={
                'operation': 'update',
                'task_ids': task_ids,
                'data': updates
            }
        )
        response.raise_for_status()
        return response.json()['data']

# Usage
api = TaskFlowAPI('your_api_token')

# Create task with natural language
task = api.create_task(
    natural_language_input="Create high priority task for code review, assign to John, due next week",
    team_id="123e4567-e89b-12d3-a456-426614174000"
)

# Get AI insights
insights = api.get_ai_insights(task['id'])
print(f"AI Priority Score: {insights['priority']['priority_score']}")
print(f"Estimated Hours: {insights['estimate']['estimated_hours']}")
```

## 🎯 Best Practices

### Task Creation
- Use descriptive, actionable titles
- Include context in descriptions
- Set realistic due dates
- Use natural language for AI parsing
- Leverage AI suggestions for priority and estimation

### Bulk Operations
- Batch related operations for efficiency
- Use filtering to target specific task sets
- Monitor response for partial failures
- Implement retry logic for failed operations

### AI Features
- Trust but verify AI suggestions
- Provide feedback to improve accuracy
- Use AI insights for team planning
- Monitor AI performance over time

### Performance
- Use pagination for large task lists
- Include only necessary related resources
- Cache frequently accessed data
- Use webhooks for real-time updates

---

Build powerful task management experiences with the Tasks API! 🎯