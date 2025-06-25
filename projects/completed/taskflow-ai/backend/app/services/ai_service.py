from typing import List, Dict, Optional, Tuple, Any
import openai
from openai import AsyncOpenAI
from datetime import datetime, timedelta
import json
import re
import hashlib
import redis.asyncio as redis
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np
import logging
import asyncio
from functools import wraps

from app.core.config import settings
from app.models.task import Task
from app.models.user import User
from app.services.ai_error_handling import (
    ai_operation_monitor, 
    ai_error_handler, 
    get_fallback_response,
    ai_circuit_breaker
)

logger = logging.getLogger(__name__)


class AIService:
    def __init__(self):
        self.client = None
        self.redis_client = None
        self.model = settings.OPENAI_MODEL
        self.cache_ttl = 3600  # 1 hour cache
        self._initialize_clients()
    
    def _initialize_clients(self):
        """Initialize OpenAI and Redis clients"""
        if settings.OPENAI_API_KEY:
            self.client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
        else:
            logger.warning("OpenAI API key not configured. AI features will be limited.")
        
        # Initialize Redis for caching
        try:
            self.redis_client = redis.from_url(settings.REDIS_URL)
        except Exception as e:
            logger.error(f"Failed to connect to Redis: {e}")
            self.redis_client = None
    
    def _get_cache_key(self, prefix: str, data: Any) -> str:
        """Generate a cache key based on prefix and data"""
        data_str = json.dumps(data, sort_keys=True)
        hash_digest = hashlib.md5(data_str.encode()).hexdigest()
        return f"ai_cache:{prefix}:{hash_digest}"
    
    async def _get_cached(self, key: str) -> Optional[Dict]:
        """Get cached result from Redis"""
        if not self.redis_client:
            return None
        
        try:
            cached = await self.redis_client.get(key)
            if cached:
                return json.loads(cached)
        except Exception as e:
            logger.error(f"Cache get error: {e}")
        
        return None
    
    async def _set_cached(self, key: str, value: Dict, ttl: Optional[int] = None):
        """Set cached result in Redis"""
        if not self.redis_client:
            return
        
        try:
            await self.redis_client.setex(
                key,
                ttl or self.cache_ttl,
                json.dumps(value)
            )
        except Exception as e:
            logger.error(f"Cache set error: {e}")
    
    @ai_operation_monitor("parse_natural_language_task")
    async def parse_natural_language_task(self, text: str) -> Dict:
        """Parse natural language input to extract task details"""
        
        # Check cache first
        cache_key = self._get_cache_key("parse_task", text)
        cached_result = await self._get_cached(cache_key)
        if cached_result:
            logger.info("Returning cached task parsing result")
            return cached_result
        
        if not self.client:
            logger.warning("OpenAI client not initialized, using fallback parser")
            return self._simple_parse(text)
        
        prompt = f"""
        Parse the following task description and extract structured information.
        Analyze the urgency, complexity, and requirements.
        
        Return a JSON object with these fields:
        - title: string (required, clear and concise task title, max 100 chars)
        - description: string (optional, detailed description if more info provided)
        - priority: string (low/medium/high/urgent) based on urgency indicators
        - due_date: string (ISO format, parse relative dates like "tomorrow", "next week")
        - estimated_hours: float (estimate based on complexity, be realistic)
        - tags: array of strings (technical areas, task types, etc.)
        - complexity: float (0.0-1.0, based on technical requirements)
        - urgency_reason: string (why this priority was chosen)
        
        Task description: "{text}"
        
        Response (valid JSON only):
        """
        
        try:
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {
                        "role": "system", 
                        "content": """You are an expert project management AI that parses tasks. 
                        Consider urgency indicators (ASAP, urgent, deadline), 
                        complexity (technical requirements, dependencies), 
                        and provide realistic time estimates. Return only valid JSON."""
                    },
                    {"role": "user", "content": prompt}
                ],
                temperature=0.3,
                max_tokens=500
            )
            
            result = json.loads(response.choices[0].message.content)
            
            # Post-process dates
            if result.get("due_date"):
                result["due_date"] = self._parse_relative_date(result["due_date"])
            
            # Ensure all required fields
            result.setdefault("priority", "medium")
            result.setdefault("tags", [])
            result.setdefault("estimated_hours", 4.0)
            
            # Cache the result
            await self._set_cached(cache_key, result)
            
            return result
            
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse AI response as JSON: {e}")
            return self._simple_parse(text)
        except Exception as e:
            logger.error(f"OpenAI API error: {e}")
            return self._simple_parse(text)
    
    def _simple_parse(self, text: str) -> Dict:
        """Simple fallback parser"""
        # Extract priority
        priority = "medium"
        if any(word in text.lower() for word in ["urgent", "asap", "critical"]):
            priority = "urgent"
        elif any(word in text.lower() for word in ["high", "important"]):
            priority = "high"
        elif any(word in text.lower() for word in ["low", "minor"]):
            priority = "low"
        
        # Extract due date patterns
        due_date = None
        date_patterns = [
            r"by (\d{1,2}/\d{1,2}/\d{4})",
            r"due (\d{1,2}/\d{1,2}/\d{4})",
            r"before (\d{1,2}/\d{1,2}/\d{4})"
        ]
        
        for pattern in date_patterns:
            match = re.search(pattern, text)
            if match:
                try:
                    due_date = datetime.strptime(match.group(1), "%m/%d/%Y").isoformat()
                except:
                    pass
                break
        
        # Extract estimated hours
        estimated_hours = None
        hour_match = re.search(r"(\d+)\s*hours?", text.lower())
        if hour_match:
            estimated_hours = float(hour_match.group(1))
        
        # Create title (first 50 chars or until period)
        title = text[:50].split('.')[0].strip()
        if len(title) < len(text):
            title += "..."
        
        return {
            "title": title,
            "description": text if len(text) > 50 else None,
            "priority": priority,
            "due_date": due_date,
            "estimated_hours": estimated_hours,
            "tags": []
        }
    
    def _parse_relative_date(self, date_str: str) -> Optional[str]:
        """Parse relative dates like 'tomorrow', 'next week'"""
        date_str = date_str.lower()
        now = datetime.now()
        
        if "today" in date_str:
            return now.date().isoformat()
        elif "tomorrow" in date_str:
            return (now + timedelta(days=1)).date().isoformat()
        elif "next week" in date_str:
            return (now + timedelta(weeks=1)).date().isoformat()
        elif "next month" in date_str:
            return (now + timedelta(days=30)).date().isoformat()
        
        return date_str
    
    async def calculate_task_priority_score(
        self, 
        task: Task,
        team_tasks: List[Task],
        user_workload: Dict
    ) -> float:
        """Calculate AI priority score based on multiple factors (0-10 scale)"""
        
        # Base score starts at 5.0 (medium priority)
        score = 5.0
        
        # Factor 1: Manual priority weight (contributes 0-3 points)
        priority_weights = {
            "urgent": 3.0,
            "high": 2.0,
            "medium": 1.0,
            "low": 0.0
        }
        score += priority_weights.get(task.priority, 1.0)
        
        # Factor 2: Due date urgency (contributes 0-3 points)
        if task.due_date:
            days_until_due = (task.due_date.replace(tzinfo=None) - datetime.now()).days
            if days_until_due < 0:
                score += 3.0  # Overdue - maximum urgency
            elif days_until_due == 0:
                score += 2.5  # Due today
            elif days_until_due == 1:
                score += 2.0  # Due tomorrow
            elif days_until_due <= 3:
                score += 1.5  # Due in 3 days
            elif days_until_due <= 7:
                score += 1.0  # Due this week
            elif days_until_due <= 14:
                score += 0.5  # Due in 2 weeks
        
        # Factor 3: Dependencies and impact (contributes 0-2 points)
        blocking_count = 0
        if hasattr(task, 'dependents') and task.dependents:
            # Count how many tasks are blocked by this one
            blocking_count = len([
                d for d in task.dependents 
                if any(t.id == d.task_id and t.status not in ['done', 'archived'] 
                       for t in team_tasks)
            ])
            
            if blocking_count >= 5:
                score += 2.0  # Critical blocker
            elif blocking_count >= 3:
                score += 1.5  # Major blocker
            elif blocking_count >= 1:
                score += 1.0  # Minor blocker
        
        # Factor 4: Task age penalty (contributes 0-1 point)
        if hasattr(task, 'created_at'):
            task_age = (datetime.now() - task.created_at.replace(tzinfo=None)).days
            if task_age > 30:
                score += 1.0  # Very old task
            elif task_age > 14:
                score += 0.5  # Old task
            elif task_age > 7:
                score += 0.25  # Aging task
        
        # Factor 5: Assignee workload adjustment (-1 to 0 points)
        if task.assignee_id and str(task.assignee_id) in user_workload:
            workload_hours = user_workload[str(task.assignee_id)]
            if workload_hours > 60:
                score -= 1.0  # Heavily overloaded assignee
            elif workload_hours > 45:
                score -= 0.5  # Overloaded assignee
        
        # Factor 6: AI complexity bonus (0-1 point)
        if hasattr(task, 'ai_complexity_score') and task.ai_complexity_score:
            if task.ai_complexity_score > 0.8:
                score += 1.0  # Very complex tasks need attention
            elif task.ai_complexity_score > 0.6:
                score += 0.5
        
        # Use OpenAI for more nuanced scoring if available
        if self.client and task.description:
            try:
                # Cache key includes task ID to avoid stale cache
                cache_key = self._get_cache_key(
                    "priority_score_ai", 
                    {"task_id": str(task.id), "title": task.title, "desc": task.description[:200]}
                )
                cached_adjustment = await self._get_cached(cache_key)
                
                if not cached_adjustment:
                    response = await self.client.chat.completions.create(
                        model=self.model,
                        messages=[
                            {
                                "role": "system",
                                "content": """Analyze this task and provide a priority adjustment (-2 to +2) based on:
                                - Business impact
                                - Technical debt implications  
                                - Risk factors
                                - Strategic importance
                                Return only a number."""
                            },
                            {
                                "role": "user",
                                "content": f"""Task: {task.title}
                                Description: {task.description[:500]}
                                Current priority: {task.priority}
                                Blocking {blocking_count} other tasks"""
                            }
                        ],
                        temperature=0.3,
                        max_tokens=10
                    )
                    
                    try:
                        adjustment = float(response.choices[0].message.content.strip())
                        adjustment = max(-2, min(2, adjustment))  # Clamp to range
                        await self._set_cached(cache_key, {"adjustment": adjustment}, ttl=7200)
                        score += adjustment
                    except:
                        pass
                
                elif cached_adjustment.get("adjustment"):
                    score += cached_adjustment["adjustment"]
                    
            except Exception as e:
                logger.error(f"AI priority scoring error: {e}")
        
        # Ensure score is in 0-10 range
        return round(min(max(score, 0.0), 10.0), 2)
    
    async def estimate_task_completion_time(
        self,
        task: Task,
        historical_tasks: List[Task],
        user_velocity: Optional[float] = None
    ) -> Tuple[float, datetime]:
        """Estimate task completion time using ML and historical data"""
        
        # Start with base estimate
        base_estimate = task.estimated_hours or 4.0
        
        # Factor 1: Similar task analysis
        similar_estimate = None
        if historical_tasks:
            similar_estimate = self._find_similar_task_duration(task, historical_tasks)
            if similar_estimate:
                # Weight historical data more heavily if we have good matches
                base_estimate = (base_estimate * 0.3 + similar_estimate * 0.7)
        
        # Factor 2: Complexity adjustment
        complexity_multiplier = 1.0
        if hasattr(task, 'ai_complexity_score') and task.ai_complexity_score:
            # Higher complexity = more time needed
            complexity_multiplier = 1.0 + (task.ai_complexity_score * 0.5)
        
        adjusted_estimate = base_estimate * complexity_multiplier
        
        # Factor 3: Use AI for refined estimation if available
        if self.client and (task.description or len(task.title) > 20):
            cache_key = self._get_cache_key(
                "time_estimate",
                {"title": task.title, "desc": task.description[:200] if task.description else ""}
            )
            cached_estimate = await self._get_cached(cache_key)
            
            if not cached_estimate:
                try:
                    prompt = f"""Estimate hours needed for this task based on:
                    Title: {task.title}
                    Description: {task.description[:500] if task.description else 'No description'}
                    Priority: {task.priority}
                    Similar tasks took: {similar_estimate:.1f} hours (if available)
                    
                    Consider:
                    - Development time
                    - Testing requirements  
                    - Code review
                    - Deployment if needed
                    
                    Return only a number (hours as float)."""
                    
                    response = await self.client.chat.completions.create(
                        model=self.model,
                        messages=[
                            {
                                "role": "system",
                                "content": "You are an expert at estimating software development tasks. Be realistic and consider all aspects of development."
                            },
                            {"role": "user", "content": prompt}
                        ],
                        temperature=0.3,
                        max_tokens=10
                    )
                    
                    ai_estimate = float(response.choices[0].message.content.strip())
                    # Sanity check - between 0.5 and 160 hours (4 weeks)
                    ai_estimate = max(0.5, min(160, ai_estimate))
                    
                    # Blend with our calculated estimate
                    adjusted_estimate = (adjusted_estimate * 0.4 + ai_estimate * 0.6)
                    
                    await self._set_cached(cache_key, {"estimate": adjusted_estimate})
                    
                except Exception as e:
                    logger.error(f"AI estimation error: {e}")
            
            elif cached_estimate.get("estimate"):
                adjusted_estimate = cached_estimate["estimate"]
        
        # Factor 4: User velocity adjustment
        if user_velocity and user_velocity > 0:
            # velocity > 1 means faster than average
            adjusted_estimate = adjusted_estimate / user_velocity
        
        # Calculate predicted completion date
        # Consider working hours per day and days per week
        hours_per_day = 6  # Realistic productive hours
        work_days_needed = adjusted_estimate / hours_per_day
        
        # Start from next business day
        completion_date = datetime.now()
        if completion_date.hour >= 17:  # After 5 PM
            completion_date += timedelta(days=1)
        
        # Add work days, skipping weekends
        days_added = 0
        while days_added < work_days_needed:
            completion_date += timedelta(days=1)
            if completion_date.weekday() < 5:  # Monday = 0, Friday = 4
                days_added += 1
        
        # Set to end of business day
        completion_date = completion_date.replace(hour=17, minute=0, second=0, microsecond=0)
        
        return round(adjusted_estimate, 1), completion_date
    
    def _find_similar_task_duration(
        self,
        task: Task,
        historical_tasks: List[Task]
    ) -> Optional[float]:
        """Find duration of similar completed tasks"""
        
        completed_tasks = [
            t for t in historical_tasks 
            if t.status == "done" and t.actual_hours > 0
        ]
        
        if not completed_tasks:
            return None
        
        # Create corpus of task descriptions
        corpus = [t.title + " " + (t.description or "") for t in completed_tasks]
        corpus.append(task.title + " " + (task.description or ""))
        
        # Calculate TF-IDF similarity
        vectorizer = TfidfVectorizer(stop_words='english')
        tfidf_matrix = vectorizer.fit_transform(corpus)
        
        # Get similarity scores
        similarities = cosine_similarity(tfidf_matrix[-1:], tfidf_matrix[:-1])
        
        # Find most similar task
        most_similar_idx = np.argmax(similarities)
        
        if similarities[0][most_similar_idx] > 0.3:  # Threshold for similarity
            return completed_tasks[most_similar_idx].actual_hours
        
        return None
    
    async def suggest_task_assignee(
        self,
        task: Task,
        team_members: List[User],
        member_workloads: Dict[str, float],
        member_skills: Dict[str, List[str]]
    ) -> Optional[str]:
        """Suggest best assignee for a task using AI and smart matching"""
        
        if not team_members:
            return None
        
        # Build detailed scoring for each member
        member_scores = []
        
        for member in team_members:
            member_id = str(member.id)
            score_breakdown = {
                "member_id": member_id,
                "member_name": member.full_name or member.username,
                "base_score": 50.0,
                "workload_score": 0.0,
                "skill_score": 0.0,
                "history_score": 0.0,
                "ai_score": 0.0,
                "total_score": 50.0
            }
            
            # Factor 1: Current workload (contributes -30 to +30 points)
            workload = member_workloads.get(member_id, 0)
            if workload < 10:
                score_breakdown["workload_score"] = 30  # Very light load
            elif workload < 20:
                score_breakdown["workload_score"] = 20  # Light load
            elif workload < 35:
                score_breakdown["workload_score"] = 10  # Normal load  
            elif workload < 45:
                score_breakdown["workload_score"] = 0   # Getting full
            elif workload < 60:
                score_breakdown["workload_score"] = -20  # Overloaded
            else:
                score_breakdown["workload_score"] = -30  # Severely overloaded
            
            # Factor 2: Skills match (contributes 0 to 30 points)
            if member_id in member_skills and task.ai_tags:
                member_skill_set = set(member_skills[member_id])
                task_skill_set = set(task.ai_tags)
                
                if task_skill_set and member_skill_set:
                    overlap = len(task_skill_set & member_skill_set)
                    total_required = len(task_skill_set)
                    
                    if total_required > 0:
                        match_ratio = overlap / total_required
                        score_breakdown["skill_score"] = match_ratio * 30
            
            # Calculate current total
            current_total = (
                score_breakdown["base_score"] +
                score_breakdown["workload_score"] +
                score_breakdown["skill_score"]
            )
            
            score_breakdown["total_score"] = current_total
            member_scores.append(score_breakdown)
        
        # Use AI for refined suggestions if available
        if self.client and len(member_scores) > 1:
            cache_key = self._get_cache_key(
                "assignee_suggestion",
                {
                    "task": task.title,
                    "members": [m["member_id"] for m in member_scores]
                }
            )
            cached_suggestion = await self._get_cached(cache_key)
            
            if not cached_suggestion:
                try:
                    # Prepare member summaries
                    member_summaries = []
                    for ms in member_scores:
                        summary = f"{ms['member_name']}: workload={member_workloads.get(ms['member_id'], 0)}h"
                        if ms['member_id'] in member_skills:
                            summary += f", skills={','.join(member_skills[ms['member_id']][:5])}"
                        member_summaries.append(summary)
                    
                    prompt = f"""Suggest the best team member for this task:
                    
                    Task: {task.title}
                    Description: {task.description[:300] if task.description else 'No description'}
                    Required skills: {', '.join(task.ai_tags) if task.ai_tags else 'General'}
                    Priority: {task.priority}
                    
                    Team members:
                    {chr(10).join(member_summaries)}
                    
                    Return ONLY the person's name who would be best suited."""
                    
                    response = await self.client.chat.completions.create(
                        model=self.model,
                        messages=[
                            {
                                "role": "system",
                                "content": "You are an expert at team task allocation. Consider workload balance, skill match, and task requirements."
                            },
                            {"role": "user", "content": prompt}
                        ],
                        temperature=0.3,
                        max_tokens=50
                    )
                    
                    suggested_name = response.choices[0].message.content.strip()
                    
                    # Find member by name and boost their score
                    for ms in member_scores:
                        if suggested_name.lower() in ms["member_name"].lower():
                            ms["ai_score"] = 20
                            ms["total_score"] += 20
                            break
                    
                    await self._set_cached(
                        cache_key,
                        {"suggested_name": suggested_name},
                        ttl=1800  # 30 min cache
                    )
                    
                except Exception as e:
                    logger.error(f"AI assignee suggestion error: {e}")
            
            elif cached_suggestion.get("suggested_name"):
                # Apply cached AI suggestion
                suggested_name = cached_suggestion["suggested_name"]
                for ms in member_scores:
                    if suggested_name.lower() in ms["member_name"].lower():
                        ms["ai_score"] = 20
                        ms["total_score"] += 20
                        break
        
        # Sort by total score and return best match
        if member_scores:
            member_scores.sort(key=lambda x: x["total_score"], reverse=True)
            best_member = member_scores[0]
            
            # Log the decision for transparency
            logger.info(
                f"Assignee suggestion for task '{task.title}': "
                f"{best_member['member_name']} (score: {best_member['total_score']:.1f})"
            )
            
            return best_member["member_id"]
        
        return None
    
    async def detect_bottlenecks(
        self,
        tasks: List[Task],
        dependencies: List[Dict]
    ) -> List[Dict]:
        """Detect potential bottlenecks using advanced analysis"""
        
        bottlenecks = []
        
        # Build comprehensive dependency graph
        task_map = {str(t.id): t for t in tasks}
        dependent_counts = {}
        dependency_chains = {}
        
        # Count direct dependencies
        for dep in dependencies:
            depends_on_id = str(dep['depends_on_id'])
            task_id = str(dep['task_id'])
            
            if depends_on_id not in dependent_counts:
                dependent_counts[depends_on_id] = set()
            dependent_counts[depends_on_id].add(task_id)
            
            # Track dependency chains
            if depends_on_id not in dependency_chains:
                dependency_chains[depends_on_id] = []
            dependency_chains[depends_on_id].append(task_id)
        
        # Analyze each potential bottleneck
        for task_id, blocked_task_ids in dependent_counts.items():
            task = task_map.get(task_id)
            if not task or task.status in ['done', 'archived']:
                continue
            
            blocked_count = len(blocked_task_ids)
            
            # Calculate comprehensive risk score
            risk_factors = {
                "blocked_count": blocked_count,
                "task_age": 0,
                "completion_delay": 0,
                "assignee_overload": 0,
                "critical_path": False,
                "cascade_impact": 0
            }
            
            # Age factor
            if hasattr(task, 'created_at'):
                task_age = (datetime.now() - task.created_at.replace(tzinfo=None)).days
                risk_factors["task_age"] = min(task_age / 30, 1.0)  # Normalize to 0-1
            
            # Completion delay factor
            if task.due_date:
                days_overdue = (datetime.now() - task.due_date.replace(tzinfo=None)).days
                if days_overdue > 0:
                    risk_factors["completion_delay"] = min(days_overdue / 7, 1.0)
            
            # Check for cascade effects (tasks that depend on blocked tasks)
            cascade_count = 0
            for blocked_id in blocked_task_ids:
                if blocked_id in dependent_counts:
                    cascade_count += len(dependent_counts[blocked_id])
            risk_factors["cascade_impact"] = min(cascade_count / 10, 1.0)
            
            # Calculate final risk score (0-10 scale)
            risk_score = (
                blocked_count * 2 +  # Direct impact (max 20 if blocking 10+ tasks)
                risk_factors["task_age"] * 2 +
                risk_factors["completion_delay"] * 3 +
                risk_factors["cascade_impact"] * 3
            )
            risk_score = min(risk_score / 3, 10.0)  # Normalize to 0-10
            
            # Get blocked task details
            blocked_tasks_info = []
            total_blocked_hours = 0
            
            for blocked_id in blocked_task_ids:
                blocked_task = task_map.get(blocked_id)
                if blocked_task:
                    blocked_info = {
                        "id": blocked_id,
                        "title": blocked_task.title,
                        "priority": blocked_task.priority,
                        "assignee_id": str(blocked_task.assignee_id) if blocked_task.assignee_id else None
                    }
                    
                    if blocked_task.estimated_hours:
                        total_blocked_hours += blocked_task.estimated_hours
                    
                    blocked_tasks_info.append(blocked_info)
            
            # Determine severity and recommendations
            severity = "low"
            recommendations = []
            
            if risk_score >= 7:
                severity = "critical"
                recommendations = [
                    "Immediate attention required",
                    "Consider breaking down this task",
                    "Assign to most available team member"
                ]
            elif risk_score >= 5:
                severity = "high"
                recommendations = [
                    "Prioritize completion",
                    "Check if task can be parallelized",
                    "Monitor progress closely"
                ]
            elif risk_score >= 3:
                severity = "medium"
                recommendations = [
                    "Keep on radar",
                    "Ensure assigned team member is aware of dependencies"
                ]
            
            bottleneck_info = {
                'task_id': task_id,
                'task_title': task.title,
                'task_status': task.status,
                'assignee_id': str(task.assignee_id) if task.assignee_id else None,
                'blocked_tasks_count': blocked_count,
                'blocked_tasks': blocked_tasks_info,
                'total_blocked_hours': total_blocked_hours,
                'risk_score': round(risk_score, 2),
                'risk_factors': risk_factors,
                'severity': severity,
                'recommendations': recommendations,
                'estimated_unblock_date': task.ai_predicted_completion.isoformat() if task.ai_predicted_completion else None
            }
            
            bottlenecks.append(bottleneck_info)
        
        # Use AI for additional insights if available
        if self.client and bottlenecks:
            try:
                top_bottlenecks = sorted(bottlenecks, key=lambda x: x['risk_score'], reverse=True)[:3]
                
                prompt = f"""Analyze these project bottlenecks and suggest mitigation strategies:
                
                {json.dumps([
                    {
                        'task': b['task_title'],
                        'blocking': b['blocked_tasks_count'],
                        'risk': b['risk_score'],
                        'status': b['task_status']
                    } for b in top_bottlenecks
                ], indent=2)}
                
                Provide 2-3 specific, actionable strategies in JSON array format."""
                
                response = await self.client.chat.completions.create(
                    model=self.model,
                    messages=[
                        {
                            "role": "system",
                            "content": "You are a project management expert. Provide specific, actionable strategies for resolving bottlenecks."
                        },
                        {"role": "user", "content": prompt}
                    ],
                    temperature=0.4,
                    max_tokens=200
                )
                
                try:
                    strategies = json.loads(response.choices[0].message.content)
                    if isinstance(strategies, list):
                        # Add AI strategies to the response
                        for bottleneck in bottlenecks:
                            bottleneck['ai_mitigation_strategies'] = strategies
                except:
                    pass
                    
            except Exception as e:
                logger.error(f"AI bottleneck analysis error: {e}")
        
        return sorted(bottlenecks, key=lambda x: x['risk_score'], reverse=True)
    
    async def generate_task_tags(self, task: Task) -> List[str]:
        """Generate relevant tags for a task using AI and pattern matching"""
        
        text = f"{task.title} {task.description or ''}"
        
        # Start with keyword-based tags
        tag_keywords = {
            'frontend': ['ui', 'ux', 'design', 'css', 'react', 'vue', 'angular', 'interface', 'component', 'layout', 'responsive'],
            'backend': ['api', 'database', 'server', 'endpoint', 'auth', 'middleware', 'orm', 'migration', 'schema'],
            'bug': ['fix', 'error', 'issue', 'problem', 'broken', 'crash', 'failure', 'defect'],
            'feature': ['new', 'add', 'implement', 'create', 'build', 'enhance', 'extend'],
            'documentation': ['docs', 'document', 'readme', 'guide', 'manual', 'wiki', 'comment'],
            'testing': ['test', 'qa', 'quality', 'coverage', 'unit', 'integration', 'e2e', 'spec'],
            'deployment': ['deploy', 'release', 'production', 'staging', 'ci/cd', 'pipeline'],
            'security': ['security', 'vulnerability', 'auth', 'encryption', 'ssl', 'permission', 'access'],
            'performance': ['optimize', 'performance', 'speed', 'fast', 'slow', 'latency', 'cache'],
            'refactor': ['refactor', 'cleanup', 'reorganize', 'improve', 'technical-debt'],
            'infrastructure': ['docker', 'kubernetes', 'aws', 'cloud', 'server', 'monitoring'],
            'data': ['analytics', 'metrics', 'data', 'etl', 'pipeline', 'warehouse']
        }
        
        keyword_tags = set()
        text_lower = text.lower()
        
        for tag, keywords in tag_keywords.items():
            if any(keyword in text_lower for keyword in keywords):
                keyword_tags.add(tag)
        
        # Use AI for more nuanced tagging if available
        ai_tags = set()
        if self.client and len(text) > 20:
            cache_key = self._get_cache_key("task_tags", text[:500])
            cached_tags = await self._get_cached(cache_key)
            
            if not cached_tags:
                try:
                    prompt = f"""Analyze this task and provide relevant tags:
                    
                    Task: {text[:500]}
                    
                    Choose from these categories:
                    - Technical: frontend, backend, database, api, infrastructure
                    - Type: feature, bug, refactor, documentation, testing
                    - Domain: security, performance, deployment, data, integration
                    - Priority indicators: urgent, blocked, dependency
                    
                    Return a JSON array of 3-7 most relevant tags."""
                    
                    response = await self.client.chat.completions.create(
                        model=self.model,
                        messages=[
                            {
                                "role": "system",
                                "content": "You are a technical task categorization expert. Return only a JSON array of relevant tags."
                            },
                            {"role": "user", "content": prompt}
                        ],
                        temperature=0.3,
                        max_tokens=100
                    )
                    
                    ai_tag_list = json.loads(response.choices[0].message.content)
                    if isinstance(ai_tag_list, list):
                        ai_tags = set(ai_tag_list)
                        await self._set_cached(cache_key, {"tags": list(ai_tags)}, ttl=3600)
                        
                except Exception as e:
                    logger.error(f"AI tag generation error: {e}")
            
            elif cached_tags.get("tags"):
                ai_tags = set(cached_tags["tags"])
        
        # Combine and prioritize tags
        all_tags = keyword_tags | ai_tags
        
        # Add special tags based on task properties
        if task.priority == "urgent":
            all_tags.add("urgent")
        
        if hasattr(task, 'dependencies') and task.dependencies:
            all_tags.add("has-dependencies")
        
        if task.due_date:
            days_until_due = (task.due_date.replace(tzinfo=None) - datetime.now()).days
            if days_until_due <= 1:
                all_tags.add("due-soon")
        
        # Convert to list and limit
        final_tags = list(all_tags)
        
        # Prioritize certain tags
        priority_tags = ['urgent', 'bug', 'security', 'blocked', 'due-soon']
        sorted_tags = []
        
        # Add priority tags first
        for tag in priority_tags:
            if tag in final_tags:
                sorted_tags.append(tag)
                final_tags.remove(tag)
        
        # Add remaining tags
        sorted_tags.extend(final_tags)
        
        return sorted_tags[:8]  # Return up to 8 most relevant tags
    
    @ai_operation_monitor("generate_task_embedding")
    async def generate_task_embedding(self, task: Task) -> Optional[List[float]]:
        """Generate embedding vector for semantic task search"""
        
        if not self.client:
            logger.warning("OpenAI client not initialized, embeddings unavailable")
            return None
        
        # Prepare text for embedding
        text = f"{task.title}. {task.description or ''}"
        if task.ai_tags:
            text += f" Tags: {', '.join(task.ai_tags)}"
        
        # Check cache
        cache_key = self._get_cache_key("task_embedding", text[:1000])
        cached_embedding = await self._get_cached(cache_key)
        
        if cached_embedding and "embedding" in cached_embedding:
            return cached_embedding["embedding"]
        
        try:
            response = await self.client.embeddings.create(
                model="text-embedding-3-small",
                input=text[:8000],  # Model limit
                encoding_format="float"
            )
            
            embedding = response.data[0].embedding
            
            # Cache the embedding
            await self._set_cached(
                cache_key,
                {"embedding": embedding},
                ttl=86400  # 24 hour cache for embeddings
            )
            
            return embedding
            
        except Exception as e:
            logger.error(f"Embedding generation error: {e}")
            return None
    
    async def semantic_task_search(
        self,
        query: str,
        task_embeddings: Dict[str, List[float]],
        top_k: int = 10
    ) -> List[Tuple[str, float]]:
        """Search tasks using semantic similarity"""
        
        if not self.client:
            return []
        
        try:
            # Generate query embedding
            response = await self.client.embeddings.create(
                model="text-embedding-3-small",
                input=query,
                encoding_format="float"
            )
            
            query_embedding = np.array(response.data[0].embedding)
            
            # Calculate similarities
            similarities = []
            for task_id, task_embedding in task_embeddings.items():
                task_vec = np.array(task_embedding)
                
                # Cosine similarity
                similarity = np.dot(query_embedding, task_vec) / (
                    np.linalg.norm(query_embedding) * np.linalg.norm(task_vec)
                )
                
                similarities.append((task_id, float(similarity)))
            
            # Sort by similarity and return top K
            similarities.sort(key=lambda x: x[1], reverse=True)
            return similarities[:top_k]
            
        except Exception as e:
            logger.error(f"Semantic search error: {e}")
            return []
    
    async def analyze_team_productivity(
        self,
        tasks: List[Task],
        time_period_days: int = 30
    ) -> Dict[str, Any]:
        """Analyze team productivity patterns and provide insights"""
        
        cutoff_date = datetime.now() - timedelta(days=time_period_days)
        
        # Basic metrics
        total_tasks = len(tasks)
        completed_tasks = [t for t in tasks if t.status == "done"]
        overdue_tasks = [
            t for t in tasks 
            if t.due_date and t.due_date.replace(tzinfo=None) < datetime.now() 
            and t.status != "done"
        ]
        
        # Calculate velocity
        recent_completed = [
            t for t in completed_tasks 
            if t.completed_at and t.completed_at.replace(tzinfo=None) > cutoff_date
        ]
        
        velocity = len(recent_completed) / (time_period_days / 7)  # Tasks per week
        
        # Estimate accuracy
        estimation_accuracy = []
        for task in recent_completed:
            if task.estimated_hours and task.actual_hours:
                accuracy = 1 - abs(task.estimated_hours - task.actual_hours) / task.estimated_hours
                estimation_accuracy.append(max(0, accuracy))
        
        avg_estimation_accuracy = (
            sum(estimation_accuracy) / len(estimation_accuracy) 
            if estimation_accuracy else 0.5
        )
        
        insights = {
            "period_days": time_period_days,
            "total_tasks": total_tasks,
            "completed_tasks": len(completed_tasks),
            "completion_rate": len(completed_tasks) / total_tasks if total_tasks > 0 else 0,
            "overdue_tasks": len(overdue_tasks),
            "team_velocity": round(velocity, 2),
            "estimation_accuracy": round(avg_estimation_accuracy * 100, 1),
            "productivity_score": round(
                (velocity / 10) * 0.4 +  # Normalize velocity
                avg_estimation_accuracy * 0.3 +
                (1 - len(overdue_tasks) / max(total_tasks, 1)) * 0.3,
                2
            ) * 100  # Convert to percentage
        }
        
        # AI-powered insights
        if self.client and total_tasks > 5:
            try:
                task_summary = {
                    "completed": len(completed_tasks),
                    "in_progress": len([t for t in tasks if t.status == "in_progress"]),
                    "todo": len([t for t in tasks if t.status == "todo"]),
                    "overdue": len(overdue_tasks),
                    "velocity": velocity,
                    "accuracy": avg_estimation_accuracy
                }
                
                prompt = f"""Analyze this team's productivity metrics and provide 3-5 actionable insights:
                
                {json.dumps(task_summary, indent=2)}
                
                Provide insights as a JSON array of strings. Focus on:
                - Productivity trends
                - Estimation accuracy
                - Workload balance
                - Process improvements
                """
                
                response = await self.client.chat.completions.create(
                    model=self.model,
                    messages=[
                        {
                            "role": "system",
                            "content": "You are a productivity analyst. Provide specific, actionable insights based on data."
                        },
                        {"role": "user", "content": prompt}
                    ],
                    temperature=0.4,
                    max_tokens=300
                )
                
                ai_insights = json.loads(response.choices[0].message.content)
                if isinstance(ai_insights, list):
                    insights["ai_recommendations"] = ai_insights
                    
            except Exception as e:
                logger.error(f"AI productivity analysis error: {e}")
                insights["ai_recommendations"] = [
                    "Monitor task completion rates weekly",
                    "Review and adjust time estimates based on historical data",
                    "Consider workload distribution among team members"
                ]
        
        return insights


# Global AI service instance
ai_service = AIService()