"""
Test AI service functionality
"""
import pytest
from unittest.mock import patch, Mock, AsyncMock
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.services.ai import AIService
from tests.factories import TaskFactory, UserFactory, TestScenarioFactories


class TestAIService:
    """Test AI service functionality."""

    @pytest.fixture
    def ai_service(self):
        """Create AI service instance."""
        return AIService()

    @pytest.mark.asyncio
    async def test_suggest_tasks_from_context(self, ai_service):
        """Test task suggestions from context."""
        context = "I need to prepare for a client meeting next week"
        
        with patch('openai.ChatCompletion.acreate') as mock_openai:
            mock_openai.return_value = Mock(
                choices=[Mock(
                    message=Mock(
                        content='[{"title": "Prepare meeting agenda", "description": "Create detailed agenda", "priority": "high"}, {"title": "Review client history", "description": "Review past interactions", "priority": "medium"}]'
                    )
                )]
            )
            
            suggestions = await ai_service.suggest_tasks_from_context(context)
            
            assert len(suggestions) == 2
            assert suggestions[0]["title"] == "Prepare meeting agenda"
            assert suggestions[0]["priority"] == "high"
            assert suggestions[1]["title"] == "Review client history"

    @pytest.mark.asyncio
    async def test_analyze_task_complexity(self, ai_service, db_session: AsyncSession):
        """Test task complexity analysis."""
        task = await TaskFactory.create_async(
            db_session,
            title="Implement machine learning model for user behavior prediction",
            description="Build and train an ML model to predict user behavior patterns using historical data"
        )
        
        with patch('openai.ChatCompletion.acreate') as mock_openai:
            mock_openai.return_value = Mock(
                choices=[Mock(
                    message=Mock(
                        content='{"complexity_score": 85, "estimated_hours": 40, "required_skills": ["python", "machine learning", "data analysis"], "risk_factors": ["data quality", "model accuracy"], "recommendations": ["Break into smaller tasks", "Get data science expert review"]}'
                    )
                )]
            )
            
            analysis = await ai_service.analyze_task_complexity(task)
            
            assert analysis["complexity_score"] == 85
            assert analysis["estimated_hours"] == 40
            assert "python" in analysis["required_skills"]
            assert len(analysis["risk_factors"]) == 2

    @pytest.mark.asyncio
    async def test_predict_completion_time(self, ai_service, db_session: AsyncSession):
        """Test task completion time prediction."""
        user, tasks = await TestScenarioFactories.create_user_with_tasks(db_session, num_tasks=10)
        
        new_task = await TaskFactory.create_async(
            db_session,
            title="New task to predict",
            priority="high",
            created_by=user.id,
            assignee_id=user.id
        )
        
        with patch('app.services.ai.AIService._get_user_productivity_patterns') as mock_patterns:
            mock_patterns.return_value = {
                "avg_completion_time": 5.5,
                "velocity": 2.3,
                "working_hours": [9, 10, 11, 14, 15, 16]
            }
            
            predicted_time = await ai_service.predict_completion_time(new_task, user.id)
            
            assert isinstance(predicted_time, dict)
            assert "predicted_hours" in predicted_time
            assert "confidence" in predicted_time
            assert "completion_date" in predicted_time

    @pytest.mark.asyncio
    async def test_generate_task_breakdown(self, ai_service, db_session: AsyncSession):
        """Test generating task breakdown."""
        task = await TaskFactory.create_async(
            db_session,
            title="Build user authentication system",
            description="Implement complete authentication with login, registration, and password reset"
        )
        
        with patch('openai.ChatCompletion.acreate') as mock_openai:
            mock_openai.return_value = Mock(
                choices=[Mock(
                    message=Mock(
                        content='{"subtasks": [{"title": "Design database schema", "estimated_hours": 4}, {"title": "Implement user registration", "estimated_hours": 8}, {"title": "Implement login functionality", "estimated_hours": 6}, {"title": "Add password reset", "estimated_hours": 4}], "total_estimated_hours": 22}'
                    )
                )]
            )
            
            breakdown = await ai_service.generate_task_breakdown(task)
            
            assert len(breakdown["subtasks"]) == 4
            assert breakdown["total_estimated_hours"] == 22
            assert breakdown["subtasks"][0]["title"] == "Design database schema"

    @pytest.mark.asyncio
    async def test_analyze_productivity_patterns(self, ai_service, db_session: AsyncSession):
        """Test productivity pattern analysis."""
        user, tasks_by_status = await TestScenarioFactories.create_task_board_scenario(db_session)
        
        with patch('app.services.ai.AIService._calculate_productivity_metrics') as mock_metrics:
            mock_metrics.return_value = {
                "completion_rate": 0.75,
                "avg_time_per_task": 6.5,
                "productivity_score": 82,
                "peak_hours": [10, 11, 14, 15]
            }
            
            analysis = await ai_service.analyze_productivity_patterns(user.id)
            
            assert analysis["productivity_score"] == 82
            assert analysis["completion_rate"] == 0.75
            assert "insights" in analysis
            assert "recommendations" in analysis

    @pytest.mark.asyncio
    async def test_suggest_task_prioritization(self, ai_service, db_session: AsyncSession):
        """Test task prioritization suggestions."""
        user, tasks = await TestScenarioFactories.create_user_with_tasks(db_session, num_tasks=5)
        
        with patch('openai.ChatCompletion.acreate') as mock_openai:
            mock_openai.return_value = Mock(
                choices=[Mock(
                    message=Mock(
                        content='{"prioritized_tasks": [{"task_id": "1", "suggested_priority": "urgent", "reason": "Has approaching deadline"}, {"task_id": "2", "suggested_priority": "high", "reason": "Blocks other tasks"}], "insights": ["Focus on deadline-driven tasks first", "Consider task dependencies"]}'
                    )
                )]
            )
            
            prioritization = await ai_service.suggest_task_prioritization(user.id)
            
            assert len(prioritization["prioritized_tasks"]) == 2
            assert prioritization["prioritized_tasks"][0]["suggested_priority"] == "urgent"
            assert len(prioritization["insights"]) == 2

    @pytest.mark.asyncio
    async def test_detect_task_bottlenecks(self, ai_service, db_session: AsyncSession):
        """Test bottleneck detection."""
        user, tasks_by_status = await TestScenarioFactories.create_task_board_scenario(db_session)
        
        bottlenecks = await ai_service.detect_task_bottlenecks(user.id)
        
        assert isinstance(bottlenecks, list)
        # Should detect tasks that have been in progress too long
        if bottlenecks:
            assert "task_id" in bottlenecks[0]
            assert "bottleneck_type" in bottlenecks[0]
            assert "suggestions" in bottlenecks[0]

    @pytest.mark.asyncio
    async def test_openai_api_error_handling(self, ai_service):
        """Test handling of OpenAI API errors."""
        context = "Test context"
        
        with patch('openai.ChatCompletion.acreate') as mock_openai:
            mock_openai.side_effect = Exception("API Error")
            
            # Should handle error gracefully
            suggestions = await ai_service.suggest_tasks_from_context(context)
            
            # Should return empty list or default response
            assert isinstance(suggestions, list)

    @pytest.mark.asyncio
    async def test_invalid_json_response_handling(self, ai_service):
        """Test handling of invalid JSON responses from AI."""
        context = "Test context"
        
        with patch('openai.ChatCompletion.acreate') as mock_openai:
            mock_openai.return_value = Mock(
                choices=[Mock(
                    message=Mock(content='Invalid JSON response')
                )]
            )
            
            suggestions = await ai_service.suggest_tasks_from_context(context)
            
            # Should handle invalid JSON gracefully
            assert isinstance(suggestions, list)


class TestAIEndpoints:
    """Test AI-related API endpoints."""

    @pytest.mark.asyncio
    async def test_get_task_suggestions(self, authenticated_client: AsyncClient):
        """Test getting AI task suggestions."""
        request_data = {
            "context": "I need to prepare for a product launch next month"
        }
        
        with patch('app.services.ai.AIService.suggest_tasks_from_context') as mock_suggest:
            mock_suggest.return_value = [
                {
                    "title": "Create marketing materials",
                    "description": "Design promotional content",
                    "priority": "high"
                },
                {
                    "title": "Set up analytics tracking",
                    "description": "Implement tracking for launch metrics",
                    "priority": "medium"
                }
            ]
            
            response = await authenticated_client.post("/api/v1/ai/suggest-tasks", json=request_data)
            
            assert response.status_code == 200
            data = response.json()
            assert len(data["suggestions"]) == 2
            assert data["suggestions"][0]["title"] == "Create marketing materials"

    @pytest.mark.asyncio
    async def test_analyze_productivity(self, authenticated_client: AsyncClient):
        """Test productivity analysis endpoint."""
        with patch('app.services.ai.AIService.analyze_productivity_patterns') as mock_analyze:
            mock_analyze.return_value = {
                "productivity_score": 85,
                "completion_rate": 0.78,
                "insights": [
                    "You are most productive in the morning",
                    "Consider breaking down large tasks"
                ],
                "recommendations": [
                    "Schedule important tasks for 9-11 AM",
                    "Take regular breaks"
                ]
            }
            
            response = await authenticated_client.post("/api/v1/ai/analyze-productivity")
            
            assert response.status_code == 200
            data = response.json()
            assert data["productivity_score"] == 85
            assert len(data["insights"]) == 2
            assert len(data["recommendations"]) == 2

    @pytest.mark.asyncio
    async def test_get_task_complexity_analysis(self, authenticated_client: AsyncClient, test_task):
        """Test task complexity analysis endpoint."""
        with patch('app.services.ai.AIService.analyze_task_complexity') as mock_analyze:
            mock_analyze.return_value = {
                "complexity_score": 75,
                "estimated_hours": 20,
                "required_skills": ["python", "database design"],
                "risk_factors": ["tight deadline"],
                "recommendations": ["Get technical review"]
            }
            
            response = await authenticated_client.get(f"/api/v1/ai/tasks/{test_task.id}/complexity")
            
            assert response.status_code == 200
            data = response.json()
            assert data["complexity_score"] == 75
            assert data["estimated_hours"] == 20

    @pytest.mark.asyncio
    async def test_get_task_prioritization(self, authenticated_client: AsyncClient):
        """Test task prioritization suggestions endpoint."""
        with patch('app.services.ai.AIService.suggest_task_prioritization') as mock_prioritize:
            mock_prioritize.return_value = {
                "prioritized_tasks": [
                    {
                        "task_id": "1",
                        "suggested_priority": "urgent",
                        "reason": "Approaching deadline"
                    }
                ],
                "insights": ["Focus on deadline-driven tasks"]
            }
            
            response = await authenticated_client.get("/api/v1/ai/prioritization")
            
            assert response.status_code == 200
            data = response.json()
            assert len(data["prioritized_tasks"]) == 1
            assert data["prioritized_tasks"][0]["suggested_priority"] == "urgent"

    @pytest.mark.asyncio
    async def test_ai_service_error_handling(self, authenticated_client: AsyncClient):
        """Test AI service error handling in endpoints."""
        with patch('app.services.ai.AIService.suggest_tasks_from_context') as mock_suggest:
            mock_suggest.side_effect = Exception("AI Service Error")
            
            response = await authenticated_client.post("/api/v1/ai/suggest-tasks", json={
                "context": "Test context"
            })
            
            # Should return error response
            assert response.status_code in [500, 503]
            data = response.json()
            assert "error" in data or "detail" in data