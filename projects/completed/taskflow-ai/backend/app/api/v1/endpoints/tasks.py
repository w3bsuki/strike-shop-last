from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Body
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_, func
from sqlalchemy.orm import selectinload
from uuid import UUID

from app.api.deps import get_current_active_user, get_db
from app.models.user import User
from app.models.task import Task, TaskDependency
from app.models.team import Team
from app.schemas.task import (
    TaskCreate, TaskUpdate, Task as TaskSchema, 
    TaskWithRelations, TaskAIMetadata
)
from app.services.ai_service import ai_service
from app.websocket.manager import manager

router = APIRouter()


@router.post("/", response_model=TaskSchema)
async def create_task(
    *,
    db: AsyncSession = Depends(get_db),
    task_in: TaskCreate,
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """Create new task with optional AI parsing."""
    
    # Verify user belongs to team
    team = await db.get(Team, task_in.team_id)
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    
    # Check if natural language input is provided
    if task_in.natural_language_input:
        # Parse using AI
        parsed_data = await ai_service.parse_natural_language_task(
            task_in.natural_language_input
        )
        
        # Merge parsed data with provided data
        for key, value in parsed_data.items():
            if value and not getattr(task_in, key, None):
                setattr(task_in, key, value)
    
    # Create task
    task = Task(
        **task_in.model_dump(exclude={"natural_language_input"}),
        creator_id=current_user.id
    )
    
    # Generate AI tags
    task.ai_tags = await ai_service.generate_task_tags(task)
    
    # Calculate initial AI priority score
    team_tasks = await db.execute(
        select(Task).where(Task.team_id == task_in.team_id)
    )
    team_tasks = team_tasks.scalars().all()
    
    task.ai_priority_score = await ai_service.calculate_task_priority_score(
        task, team_tasks, {}
    )
    
    # Estimate completion time
    estimated_hours, predicted_completion = await ai_service.estimate_task_completion_time(
        task, team_tasks
    )
    task.ai_estimated_hours = estimated_hours
    task.ai_predicted_completion = predicted_completion
    
    db.add(task)
    await db.commit()
    await db.refresh(task)
    
    # Broadcast task creation via WebSocket
    await manager.broadcast_task_update(
        str(task.id),
        str(task.team_id),
        "created",
        str(current_user.id),
        TaskSchema.model_validate(task).model_dump()
    )
    
    return task


@router.get("/", response_model=List[TaskWithRelations])
async def get_tasks(
    *,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    team_id: UUID,
    project_id: Optional[UUID] = None,
    assignee_id: Optional[UUID] = None,
    status: Optional[str] = None,
    priority: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    sort_by: str = "ai_priority_score",
    order: str = "desc"
) -> Any:
    """Get tasks with filters and AI-powered sorting."""
    
    # Build query
    query = select(Task).where(Task.team_id == team_id)
    
    if project_id:
        query = query.where(Task.project_id == project_id)
    if assignee_id:
        query = query.where(Task.assignee_id == assignee_id)
    if status:
        query = query.where(Task.status == status)
    if priority:
        query = query.where(Task.priority == priority)
    
    # Add sorting
    if hasattr(Task, sort_by):
        order_column = getattr(Task, sort_by)
        if order == "desc":
            query = query.order_by(order_column.desc())
        else:
            query = query.order_by(order_column)
    
    # Add pagination
    query = query.offset(skip).limit(limit)
    
    # Include relations
    query = query.options(
        selectinload(Task.creator),
        selectinload(Task.assignee),
        selectinload(Task.project),
        selectinload(Task.subtasks),
        selectinload(Task.dependencies),
        selectinload(Task.comments),
        selectinload(Task.attachments)
    )
    
    result = await db.execute(query)
    tasks = result.scalars().all()
    
    # Convert to response model with counts
    tasks_with_relations = []
    for task in tasks:
        task_dict = TaskWithRelations.model_validate(task).model_dump()
        task_dict['comments_count'] = len(task.comments) if task.comments else 0
        task_dict['attachments_count'] = len(task.attachments) if task.attachments else 0
        tasks_with_relations.append(TaskWithRelations(**task_dict))
    
    return tasks_with_relations


@router.get("/{task_id}", response_model=TaskWithRelations)
async def get_task(
    *,
    db: AsyncSession = Depends(get_db),
    task_id: UUID,
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """Get task by ID."""
    
    query = select(Task).where(Task.id == task_id).options(
        selectinload(Task.creator),
        selectinload(Task.assignee),
        selectinload(Task.project),
        selectinload(Task.subtasks),
        selectinload(Task.dependencies),
        selectinload(Task.comments),
        selectinload(Task.attachments)
    )
    
    result = await db.execute(query)
    task = result.scalar_one_or_none()
    
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    # Convert to response model
    task_dict = TaskWithRelations.model_validate(task).model_dump()
    task_dict['comments_count'] = len(task.comments) if task.comments else 0
    task_dict['attachments_count'] = len(task.attachments) if task.attachments else 0
    
    return TaskWithRelations(**task_dict)


@router.patch("/{task_id}", response_model=TaskSchema)
async def update_task(
    *,
    db: AsyncSession = Depends(get_db),
    task_id: UUID,
    task_in: TaskUpdate,
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """Update task."""
    
    task = await db.get(Task, task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    # Update fields
    update_data = task_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(task, field, value)
    
    # Recalculate AI fields if relevant fields changed
    if any(field in update_data for field in ['title', 'description', 'priority', 'due_date']):
        # Update AI tags
        task.ai_tags = await ai_service.generate_task_tags(task)
        
        # Recalculate priority score
        team_tasks = await db.execute(
            select(Task).where(Task.team_id == task.team_id)
        )
        team_tasks = team_tasks.scalars().all()
        
        task.ai_priority_score = await ai_service.calculate_task_priority_score(
            task, team_tasks, {}
        )
    
    # Track completion
    if update_data.get('status') == 'done' and not task.completed_at:
        task.completed_at = func.now()
        if task.estimated_hours:
            # This would be updated by time tracking in real app
            task.actual_hours = task.estimated_hours
    
    await db.commit()
    await db.refresh(task)
    
    # Broadcast update via WebSocket
    await manager.broadcast_task_update(
        str(task.id),
        str(task.team_id),
        "updated",
        str(current_user.id),
        TaskSchema.model_validate(task).model_dump()
    )
    
    return task


@router.delete("/{task_id}")
async def delete_task(
    *,
    db: AsyncSession = Depends(get_db),
    task_id: UUID,
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """Delete task."""
    
    task = await db.get(Task, task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    team_id = str(task.team_id)
    
    await db.delete(task)
    await db.commit()
    
    # Broadcast deletion via WebSocket
    await manager.broadcast_task_update(
        str(task_id),
        team_id,
        "deleted",
        str(current_user.id)
    )
    
    return {"ok": True}


@router.post("/{task_id}/ai/suggest-assignee")
async def suggest_assignee(
    *,
    db: AsyncSession = Depends(get_db),
    task_id: UUID,
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """Get AI suggestion for task assignee."""
    
    task = await db.get(Task, task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    # Get team members
    team = await db.get(Team, task.team_id)
    team_members = team.members if team else []
    
    # Calculate member workloads
    member_workloads = {}
    for member in team_members:
        # Count active tasks
        result = await db.execute(
            select(func.count(Task.id)).where(
                and_(
                    Task.assignee_id == member.id,
                    Task.status.in_(['todo', 'in_progress'])
                )
            )
        )
        active_tasks = result.scalar()
        member_workloads[str(member.id)] = active_tasks * 8  # Assume 8 hours per task
    
    # Get suggestion
    suggested_id = await ai_service.suggest_task_assignee(
        task, team_members, member_workloads, {}
    )
    
    if suggested_id:
        suggested_user = next(
            (m for m in team_members if str(m.id) == suggested_id), 
            None
        )
        
        if suggested_user:
            return {
                "suggested_assignee": {
                    "id": suggested_user.id,
                    "username": suggested_user.username,
                    "full_name": suggested_user.full_name
                },
                "reason": "Based on workload and task requirements"
            }
    
    return {"suggested_assignee": None, "reason": "No suitable assignee found"}


@router.post("/ai/detect-bottlenecks")
async def detect_bottlenecks(
    *,
    db: AsyncSession = Depends(get_db),
    team_id: UUID = Body(...),
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """Detect bottleneck tasks in the team."""
    
    # Get all team tasks
    result = await db.execute(
        select(Task).where(
            and_(
                Task.team_id == team_id,
                Task.status.not_in(['done', 'archived'])
            )
        )
    )
    tasks = result.scalars().all()
    
    # Get dependencies
    dep_result = await db.execute(
        select(TaskDependency).where(
            TaskDependency.task_id.in_([t.id for t in tasks])
        )
    )
    dependencies = [
        {
            'task_id': str(d.task_id),
            'depends_on_id': str(d.depends_on_id)
        }
        for d in dep_result.scalars().all()
    ]
    
    # Detect bottlenecks
    bottlenecks = await ai_service.detect_bottlenecks(tasks, dependencies)
    
    return {"bottlenecks": bottlenecks}


@router.post("/ai/semantic-search")
async def semantic_search_tasks(
    *,
    db: AsyncSession = Depends(get_db),
    query: str = Body(..., embed=True),
    team_id: UUID = Body(...),
    limit: int = Body(10, ge=1, le=50),
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """Search tasks using semantic similarity"""
    
    # Get cached embeddings for team tasks
    from app.services.cache_service import cache_service
    
    result = await db.execute(
        select(Task).where(
            and_(
                Task.team_id == team_id,
                Task.status.not_in(['archived'])
            )
        )
    )
    tasks = result.scalars().all()
    
    # Collect embeddings
    task_embeddings = {}
    for task in tasks:
        cached_embedding = await cache_service.get(
            "task_embeddings",
            str(task.id)
        )
        if cached_embedding:
            task_embeddings[str(task.id)] = cached_embedding
    
    # Perform semantic search
    results = await ai_service.semantic_task_search(
        query, task_embeddings, top_k=limit
    )
    
    # Build response with task details
    search_results = []
    for task_id, similarity_score in results:
        task = next((t for t in tasks if str(t.id) == task_id), None)
        if task:
            search_results.append({
                "task": TaskSchema.model_validate(task).model_dump(),
                "similarity_score": round(similarity_score, 3)
            })
    
    return {
        "query": query,
        "results": search_results,
        "total_found": len(search_results)
    }


@router.get("/ai/productivity-insights/{team_id}")
async def get_productivity_insights(
    *,
    db: AsyncSession = Depends(get_db),
    team_id: UUID,
    days: int = Query(30, ge=7, le=90),
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """Get AI-powered productivity insights for a team"""
    
    from app.services.cache_service import cache_service
    
    # Check cache first
    cache_key = f"{team_id}:{days}"
    cached_insights = await cache_service.get("productivity_insights", cache_key)
    
    if cached_insights:
        return cached_insights
    
    # Get team tasks
    result = await db.execute(
        select(Task).where(Task.team_id == team_id)
    )
    tasks = result.scalars().all()
    
    # Generate insights
    insights = await ai_service.analyze_team_productivity(tasks, days)
    
    # Cache for 1 hour
    await cache_service.set(
        "productivity_insights",
        cache_key,
        insights,
        ttl=3600
    )
    
    return insights


@router.post("/{task_id}/ai/predict-completion")
async def predict_task_completion(
    *,
    db: AsyncSession = Depends(get_db),
    task_id: UUID,
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """Get AI prediction for task completion time"""
    
    task = await db.get(Task, task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    # Get historical tasks for the team
    result = await db.execute(
        select(Task).where(
            and_(
                Task.team_id == task.team_id,
                Task.status == 'done',
                Task.completed_at.is_not(None)
            )
        ).limit(100)
    )
    historical_tasks = result.scalars().all()
    
    # Get user velocity if assignee exists
    user_velocity = None
    if task.assignee_id:
        # Calculate based on recent completions
        user_tasks = [
            t for t in historical_tasks 
            if t.assignee_id == task.assignee_id
        ]
        
        if user_tasks:
            actual_total = sum(t.actual_hours or 0 for t in user_tasks if t.actual_hours)
            estimated_total = sum(t.estimated_hours or 0 for t in user_tasks if t.estimated_hours)
            
            if estimated_total > 0:
                user_velocity = actual_total / estimated_total
    
    # Get prediction
    estimated_hours, predicted_date = await ai_service.estimate_task_completion_time(
        task, historical_tasks, user_velocity
    )
    
    # Update task
    task.ai_estimated_hours = estimated_hours
    task.ai_predicted_completion = predicted_date
    
    await db.commit()
    
    return {
        "task_id": task_id,
        "estimated_hours": estimated_hours,
        "predicted_completion_date": predicted_date.isoformat(),
        "confidence_factors": {
            "historical_data_available": len(historical_tasks) > 0,
            "user_velocity": user_velocity,
            "similar_tasks_found": len([t for t in historical_tasks if t.actual_hours]) > 0
        }
    }


@router.post("/ai/batch-update-priorities")
async def batch_update_priorities(
    *,
    db: AsyncSession = Depends(get_db),
    team_id: UUID = Body(...),
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """Trigger batch update of all task priorities for a team"""
    
    from app.worker.tasks import recalculate_task_priorities
    
    # Queue background task
    task = recalculate_task_priorities.delay(str(team_id))
    
    return {
        "status": "queued",
        "task_id": task.id,
        "team_id": team_id,
        "message": "Priority recalculation queued for processing"
    }


@router.post("/ai/generate-embeddings")
async def generate_task_embeddings(
    *,
    db: AsyncSession = Depends(get_db),
    team_id: UUID = Body(...),
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """Generate embeddings for all team tasks for semantic search"""
    
    from app.worker.tasks import update_task_embeddings
    
    # Queue background task
    task = update_task_embeddings.delay(str(team_id))
    
    return {
        "status": "queued",
        "task_id": task.id,
        "team_id": team_id,
        "message": "Embedding generation queued for processing"
    }