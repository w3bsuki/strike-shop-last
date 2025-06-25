"""
Performance and load testing for the authentication API.
Tests system behavior under various load conditions.
"""

import asyncio
import time
import statistics
from typing import List, Dict, Any
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from src.models import User


class TestPerformance:
    """Performance tests for API endpoints."""
    
    @pytest.mark.asyncio
    async def test_login_performance(
        self,
        async_client: AsyncClient,
        test_user: User
    ):
        """Test login endpoint performance."""
        login_data = {
            "email": test_user.email,
            "password": "TestPassword123!"
        }
        
        # Measure response times
        response_times = []
        for _ in range(10):
            start_time = time.time()
            response = await async_client.post("/api/v1/auth/login", json=login_data)
            end_time = time.time()
            
            assert response.status_code == 200
            response_times.append(end_time - start_time)
        
        # Analyze performance
        avg_time = statistics.mean(response_times)
        max_time = max(response_times)
        
        # Performance assertions (adjust thresholds as needed)
        assert avg_time < 0.5  # Average response time should be under 500ms
        assert max_time < 1.0  # Max response time should be under 1s
    
    @pytest.mark.asyncio
    async def test_registration_performance(
        self,
        async_client: AsyncClient
    ):
        """Test registration endpoint performance."""
        response_times = []
        
        for i in range(10):
            user_data = {
                "email": f"perftest{i}@example.com",
                "password": "TestPassword123!",
                "first_name": "Test",
                "last_name": "User"
            }
            
            start_time = time.time()
            response = await async_client.post("/api/v1/auth/register", json=user_data)
            end_time = time.time()
            
            assert response.status_code == 201
            response_times.append(end_time - start_time)
        
        # Analyze performance
        avg_time = statistics.mean(response_times)
        max_time = max(response_times)
        
        # Registration can be slower due to password hashing
        assert avg_time < 1.0  # Average response time should be under 1s
        assert max_time < 2.0  # Max response time should be under 2s
    
    @pytest.mark.asyncio
    async def test_token_refresh_performance(
        self,
        async_client: AsyncClient,
        auth_tokens: Dict[str, Any]
    ):
        """Test token refresh performance."""
        refresh_data = {
            "refresh_token": auth_tokens["refresh_token"]
        }
        
        start_time = time.time()
        response = await async_client.post("/api/v1/auth/refresh", json=refresh_data)
        end_time = time.time()
        
        assert response.status_code == 200
        response_time = end_time - start_time
        
        # Token refresh should be very fast
        assert response_time < 0.2  # Should be under 200ms


class TestConcurrency:
    """Concurrency tests for the authentication API."""
    
    @pytest.mark.asyncio
    async def test_concurrent_logins(
        self,
        async_client: AsyncClient,
        performance_test_users
    ):
        """Test concurrent login requests."""
        # Create test users
        users = await performance_test_users(50)
        
        async def login_user(user_email: str):
            """Login a single user."""
            login_data = {
                "email": user_email,
                "password": "TestPassword123!"
            }
            
            start_time = time.time()
            response = await async_client.post("/api/v1/auth/login", json=login_data)
            end_time = time.time()
            
            return {
                "status_code": response.status_code,
                "response_time": end_time - start_time,
                "email": user_email
            }
        
        # Execute concurrent logins
        tasks = [login_user(user.email) for user in users[:20]]  # Test with 20 concurrent users
        results = await asyncio.gather(*tasks)
        
        # Analyze results
        successful_logins = [r for r in results if r["status_code"] == 200]
        failed_logins = [r for r in results if r["status_code"] != 200]
        
        # Most logins should succeed
        success_rate = len(successful_logins) / len(results)
        assert success_rate >= 0.9  # At least 90% success rate
        
        # Response times should be reasonable
        if successful_logins:
            avg_response_time = statistics.mean([r["response_time"] for r in successful_logins])
            assert avg_response_time < 2.0  # Average under 2 seconds
    
    @pytest.mark.asyncio
    async def test_concurrent_registrations(
        self,
        async_client: AsyncClient
    ):
        """Test concurrent registration requests."""
        
        async def register_user(user_id: int):
            """Register a single user."""
            user_data = {
                "email": f"concurrent{user_id}@example.com",
                "password": "TestPassword123!",
                "first_name": "Test",
                "last_name": f"User{user_id}"
            }
            
            start_time = time.time()
            response = await async_client.post("/api/v1/auth/register", json=user_data)
            end_time = time.time()
            
            return {
                "status_code": response.status_code,
                "response_time": end_time - start_time,
                "user_id": user_id
            }
        
        # Execute concurrent registrations
        tasks = [register_user(i) for i in range(15)]  # Test with 15 concurrent registrations
        results = await asyncio.gather(*tasks)
        
        # Analyze results
        successful_registrations = [r for r in results if r["status_code"] == 201]
        
        # All registrations should succeed (unique emails)
        success_rate = len(successful_registrations) / len(results)
        assert success_rate >= 0.9  # At least 90% success rate
        
        # Response times should be reasonable
        if successful_registrations:
            avg_response_time = statistics.mean([r["response_time"] for r in successful_registrations])
            assert avg_response_time < 3.0  # Average under 3 seconds (password hashing is slow)


class TestStressTest:
    """Stress tests for system limits."""
    
    @pytest.mark.asyncio
    async def test_rapid_requests(
        self,
        async_client: AsyncClient,
        test_user: User
    ):
        """Test system behavior under rapid requests."""
        login_data = {
            "email": test_user.email,
            "password": "TestPassword123!"
        }
        
        # Make rapid requests
        start_time = time.time()
        responses = []
        
        for _ in range(50):  # 50 rapid requests
            response = await async_client.post("/api/v1/auth/login", json=login_data)
            responses.append(response.status_code)
        
        end_time = time.time()
        total_time = end_time - start_time
        
        # Calculate requests per second
        rps = len(responses) / total_time
        
        # System should handle reasonable load
        assert rps >= 10  # At least 10 requests per second
        
        # Most requests should succeed (before rate limiting kicks in)
        success_count = sum(1 for status in responses if status == 200)
        success_rate = success_count / len(responses)
        
        # Should have some successful requests before rate limiting
        assert success_rate >= 0.2  # At least 20% success rate
    
    @pytest.mark.asyncio
    async def test_memory_usage_under_load(
        self,
        async_client: AsyncClient,
        performance_test_users
    ):
        """Test memory usage doesn't grow excessively under load."""
        import psutil
        import os
        
        # Get initial memory usage
        process = psutil.Process(os.getpid())
        initial_memory = process.memory_info().rss / 1024 / 1024  # MB
        
        # Create many users
        users = await performance_test_users(100)
        
        # Perform many operations
        for i in range(100):
            user = users[i % len(users)]
            login_data = {
                "email": user.email,
                "password": "TestPassword123!"
            }
            
            response = await async_client.post("/api/v1/auth/login", json=login_data)
            # Don't assert success here as we may hit rate limits
        
        # Check final memory usage
        final_memory = process.memory_info().rss / 1024 / 1024  # MB
        memory_increase = final_memory - initial_memory
        
        # Memory increase should be reasonable (under 100MB)
        assert memory_increase < 100
    
    @pytest.mark.asyncio
    async def test_database_connection_handling(
        self,
        async_client: AsyncClient,
        test_user: User
    ):
        """Test database connection handling under load."""
        login_data = {
            "email": test_user.email,
            "password": "TestPassword123!"
        }
        
        # Make many requests to test connection pooling
        tasks = []
        for _ in range(30):  # 30 concurrent requests
            tasks.append(async_client.post("/api/v1/auth/login", json=login_data))
        
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # Check for database connection errors
        database_errors = []
        for result in results:
            if isinstance(result, Exception):
                database_errors.append(result)
        
        # Should not have database connection issues
        assert len(database_errors) == 0


class TestScalability:
    """Scalability tests for future planning."""
    
    @pytest.mark.asyncio
    async def test_large_user_base_simulation(
        self,
        async_client: AsyncClient,
        performance_test_users
    ):
        """Simulate behavior with large user base."""
        # Create a larger user base
        users = await performance_test_users(200)
        
        # Test random user logins
        import random
        
        response_times = []
        success_count = 0
        
        for _ in range(50):  # Test 50 random logins
            user = random.choice(users)
            login_data = {
                "email": user.email,
                "password": "TestPassword123!"
            }
            
            start_time = time.time()
            response = await async_client.post("/api/v1/auth/login", json=login_data)
            end_time = time.time()
            
            response_times.append(end_time - start_time)
            if response.status_code == 200:
                success_count += 1
        
        # Performance should not degrade significantly with more users
        avg_response_time = statistics.mean(response_times)
        success_rate = success_count / 50
        
        assert avg_response_time < 1.0  # Still under 1 second average
        assert success_rate >= 0.8  # At least 80% success rate
    
    @pytest.mark.asyncio
    async def test_token_table_performance(
        self,
        async_client: AsyncClient,
        test_user: User,
        test_session: AsyncSession
    ):
        """Test performance with many refresh tokens."""
        # Create many refresh tokens for the user
        login_data = {
            "email": test_user.email,
            "password": "TestPassword123!"
        }
        
        # Generate multiple sessions (tokens)
        tokens = []
        for _ in range(20):  # 20 different sessions
            response = await async_client.post("/api/v1/auth/login", json=login_data)
            if response.status_code == 200:
                data = response.json()
                tokens.append(data["tokens"]["refresh_token"])
        
        # Test token refresh performance
        if tokens:
            refresh_data = {"refresh_token": tokens[0]}
            
            start_time = time.time()
            response = await async_client.post("/api/v1/auth/refresh", json=refresh_data)
            end_time = time.time()
            
            # Should still be fast even with many tokens
            assert response.status_code == 200
            assert (end_time - start_time) < 0.5  # Under 500ms