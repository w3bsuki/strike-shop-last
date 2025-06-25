"""
Comprehensive integration tests for authentication API endpoints.
Tests complete authentication flows with security validations.
"""

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Dict, Any

from src.models import User
from src.services.auth_service import auth_service


class TestUserRegistration:
    """Test user registration endpoint."""
    
    @pytest.mark.asyncio
    async def test_register_user_success(
        self,
        async_client: AsyncClient,
        valid_user_data: Dict[str, Any]
    ):
        """Test successful user registration."""
        response = await async_client.post("/api/v1/auth/register", json=valid_user_data)
        
        assert response.status_code == 201
        data = response.json()
        
        assert "user" in data
        assert "tokens" in data
        assert "message" in data
        
        user_data = data["user"]
        assert user_data["email"] == valid_user_data["email"]
        assert user_data["first_name"] == valid_user_data["first_name"]
        assert user_data["last_name"] == valid_user_data["last_name"]
        assert user_data["is_active"] is True
        
        tokens = data["tokens"]
        assert "access_token" in tokens
        assert "refresh_token" in tokens
        assert tokens["token_type"] == "bearer"
    
    @pytest.mark.asyncio
    async def test_register_duplicate_email(
        self,
        async_client: AsyncClient,
        test_user: User,
        valid_user_data: Dict[str, Any]
    ):
        """Test registration with existing email."""
        valid_user_data["email"] = test_user.email
        
        response = await async_client.post("/api/v1/auth/register", json=valid_user_data)
        
        assert response.status_code == 409
        data = response.json()
        assert data["error"] is True
        assert "already exists" in data["message"].lower()
    
    @pytest.mark.asyncio
    async def test_register_invalid_email(
        self,
        async_client: AsyncClient,
        valid_user_data: Dict[str, Any]
    ):
        """Test registration with invalid email."""
        valid_user_data["email"] = "invalid-email"
        
        response = await async_client.post("/api/v1/auth/register", json=valid_user_data)
        
        assert response.status_code == 422
    
    @pytest.mark.asyncio
    async def test_register_weak_passwords(
        self,
        async_client: AsyncClient,
        invalid_password_data: list
    ):
        """Test registration with weak passwords."""
        for user_data in invalid_password_data:
            response = await async_client.post("/api/v1/auth/register", json=user_data)
            assert response.status_code == 422


class TestUserLogin:
    """Test user login endpoint."""
    
    @pytest.mark.asyncio
    async def test_login_success(
        self,
        async_client: AsyncClient,
        test_user: User,
        valid_login_data: Dict[str, Any]
    ):
        """Test successful login."""
        response = await async_client.post("/api/v1/auth/login", json=valid_login_data)
        
        assert response.status_code == 200
        data = response.json()
        
        assert "user" in data
        assert "tokens" in data
        assert "message" in data
        
        user_data = data["user"]
        assert user_data["email"] == test_user.email
        
        tokens = data["tokens"]
        assert "access_token" in tokens
        assert "refresh_token" in tokens
    
    @pytest.mark.asyncio
    async def test_login_invalid_credentials(
        self,
        async_client: AsyncClient,
        test_user: User
    ):
        """Test login with invalid credentials."""
        login_data = {
            "email": test_user.email,
            "password": "WrongPassword123!"
        }
        
        response = await async_client.post("/api/v1/auth/login", json=login_data)
        
        assert response.status_code == 401
        data = response.json()
        assert data["error"] is True
        assert "invalid" in data["message"].lower()
    
    @pytest.mark.asyncio
    async def test_login_nonexistent_user(
        self,
        async_client: AsyncClient
    ):
        """Test login with non-existent user."""
        login_data = {
            "email": "nonexistent@example.com",
            "password": "TestPassword123!"
        }
        
        response = await async_client.post("/api/v1/auth/login", json=login_data)
        
        assert response.status_code == 401
        data = response.json()
        assert data["error"] is True
    
    @pytest.mark.asyncio
    async def test_login_inactive_user(
        self,
        async_client: AsyncClient,
        inactive_user: User
    ):
        """Test login with inactive user."""
        login_data = {
            "email": inactive_user.email,
            "password": "TestPassword123!"
        }
        
        response = await async_client.post("/api/v1/auth/login", json=login_data)
        
        assert response.status_code == 401
        data = response.json()
        assert data["error"] is True
        assert "inactive" in data["message"].lower()
    
    @pytest.mark.asyncio
    async def test_login_locked_user(
        self,
        async_client: AsyncClient,
        locked_user: User
    ):
        """Test login with locked user."""
        login_data = {
            "email": locked_user.email,
            "password": "TestPassword123!"
        }
        
        response = await async_client.post("/api/v1/auth/login", json=login_data)
        
        assert response.status_code == 403
        data = response.json()
        assert data["error"] is True
        assert "locked" in data["message"].lower()


class TestTokenRefresh:
    """Test token refresh endpoint."""
    
    @pytest.mark.asyncio
    async def test_refresh_token_success(
        self,
        async_client: AsyncClient,
        auth_tokens: Dict[str, Any]
    ):
        """Test successful token refresh."""
        refresh_data = {
            "refresh_token": auth_tokens["refresh_token"]
        }
        
        response = await async_client.post("/api/v1/auth/refresh", json=refresh_data)
        
        assert response.status_code == 200
        data = response.json()
        
        assert "access_token" in data
        assert "refresh_token" in data
        assert data["token_type"] == "bearer"
        
        # New tokens should be different
        assert data["access_token"] != auth_tokens["access_token"]
        assert data["refresh_token"] != auth_tokens["refresh_token"]
    
    @pytest.mark.asyncio
    async def test_refresh_token_invalid(
        self,
        async_client: AsyncClient
    ):
        """Test token refresh with invalid token."""
        refresh_data = {
            "refresh_token": "invalid_token"
        }
        
        response = await async_client.post("/api/v1/auth/refresh", json=refresh_data)
        
        assert response.status_code == 401
        data = response.json()
        assert data["error"] is True
    
    @pytest.mark.asyncio
    async def test_refresh_token_reuse_detection(
        self,
        async_client: AsyncClient,
        auth_tokens: Dict[str, Any]
    ):
        """Test refresh token reuse detection."""
        refresh_data = {
            "refresh_token": auth_tokens["refresh_token"]
        }
        
        # First refresh should succeed
        response1 = await async_client.post("/api/v1/auth/refresh", json=refresh_data)
        assert response1.status_code == 200
        
        # Second refresh with same token should fail
        response2 = await async_client.post("/api/v1/auth/refresh", json=refresh_data)
        assert response2.status_code == 401


class TestUserLogout:
    """Test user logout endpoints."""
    
    @pytest.mark.asyncio
    async def test_logout_success(
        self,
        async_client: AsyncClient,
        auth_headers: Dict[str, str],
        auth_tokens: Dict[str, Any]
    ):
        """Test successful logout."""
        logout_data = {
            "refresh_token": auth_tokens["refresh_token"]
        }
        
        response = await async_client.post(
            "/api/v1/auth/logout",
            json=logout_data,
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
    
    @pytest.mark.asyncio
    async def test_logout_all_devices(
        self,
        async_client: AsyncClient,
        auth_headers: Dict[str, str]
    ):
        """Test logout from all devices."""
        response = await async_client.post(
            "/api/v1/auth/logout-all",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
    
    @pytest.mark.asyncio
    async def test_logout_without_auth(
        self,
        async_client: AsyncClient
    ):
        """Test logout without authentication."""
        logout_data = {
            "refresh_token": "some_token"
        }
        
        response = await async_client.post("/api/v1/auth/logout", json=logout_data)
        
        assert response.status_code == 401


class TestPasswordChange:
    """Test password change endpoint."""
    
    @pytest.mark.asyncio
    async def test_change_password_success(
        self,
        async_client: AsyncClient,
        auth_headers: Dict[str, str],
        test_user: User,
        test_session: AsyncSession
    ):
        """Test successful password change."""
        password_data = {
            "current_password": "TestPassword123!",
            "new_password": "NewSecurePassword123!"
        }
        
        response = await async_client.post(
            "/api/v1/auth/change-password",
            json=password_data,
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        
        # Verify password was actually changed
        await test_session.refresh(test_user)
        assert test_user.verify_password("NewSecurePassword123!")
        assert not test_user.verify_password("TestPassword123!")
    
    @pytest.mark.asyncio
    async def test_change_password_wrong_current(
        self,
        async_client: AsyncClient,
        auth_headers: Dict[str, str]
    ):
        """Test password change with wrong current password."""
        password_data = {
            "current_password": "WrongPassword123!",
            "new_password": "NewSecurePassword123!"
        }
        
        response = await async_client.post(
            "/api/v1/auth/change-password",
            json=password_data,
            headers=auth_headers
        )
        
        assert response.status_code == 401
        data = response.json()
        assert data["error"] is True
    
    @pytest.mark.asyncio
    async def test_change_password_weak_new(
        self,
        async_client: AsyncClient,
        auth_headers: Dict[str, str]
    ):
        """Test password change with weak new password."""
        password_data = {
            "current_password": "TestPassword123!",
            "new_password": "weak"
        }
        
        response = await async_client.post(
            "/api/v1/auth/change-password",
            json=password_data,
            headers=auth_headers
        )
        
        assert response.status_code == 422


class TestUserProfile:
    """Test user profile endpoints."""
    
    @pytest.mark.asyncio
    async def test_get_current_user(
        self,
        async_client: AsyncClient,
        auth_headers: Dict[str, str],
        test_user: User
    ):
        """Test getting current user information."""
        response = await async_client.get("/api/v1/auth/me", headers=auth_headers)
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["email"] == test_user.email
        assert data["first_name"] == test_user.first_name
        assert data["last_name"] == test_user.last_name
        assert data["is_active"] is True
    
    @pytest.mark.asyncio
    async def test_get_current_user_without_auth(
        self,
        async_client: AsyncClient
    ):
        """Test getting current user without authentication."""
        response = await async_client.get("/api/v1/auth/me")
        
        assert response.status_code == 401
    
    @pytest.mark.asyncio
    async def test_verify_token_valid(
        self,
        async_client: AsyncClient,
        auth_headers: Dict[str, str],
        test_user: User
    ):
        """Test token verification with valid token."""
        response = await async_client.get("/api/v1/auth/verify-token", headers=auth_headers)
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["valid"] is True
        assert data["user_id"] == str(test_user.id)
        assert data["email"] == test_user.email
    
    @pytest.mark.asyncio
    async def test_verify_token_invalid(
        self,
        async_client: AsyncClient
    ):
        """Test token verification with invalid token."""
        headers = {"Authorization": "Bearer invalid_token"}
        response = await async_client.get("/api/v1/auth/verify-token", headers=headers)
        
        assert response.status_code == 401


class TestSecurityFeatures:
    """Test security features and edge cases."""
    
    @pytest.mark.asyncio
    async def test_brute_force_protection(
        self,
        async_client: AsyncClient,
        test_user: User,
        test_session: AsyncSession
    ):
        """Test brute force protection mechanisms."""
        login_data = {
            "email": test_user.email,
            "password": "WrongPassword123!"
        }
        
        # Make multiple failed login attempts
        for i in range(6):  # One more than the limit
            response = await async_client.post("/api/v1/auth/login", json=login_data)
            
            if i < 5:  # First 5 should be 401
                assert response.status_code == 401
            else:  # 6th should be 403 (locked)
                assert response.status_code == 403
                data = response.json()
                assert "locked" in data["message"].lower()
    
    @pytest.mark.asyncio
    async def test_sql_injection_protection(
        self,
        async_client: AsyncClient,
        malicious_payloads: Dict[str, list]
    ):
        """Test protection against SQL injection."""
        for payload in malicious_payloads["sql_injection"]:
            login_data = {
                "email": payload,
                "password": "TestPassword123!"
            }
            
            response = await async_client.post("/api/v1/auth/login", json=login_data)
            
            # Should be handled gracefully (not 500 error)
            assert response.status_code in [400, 401, 422]
    
    @pytest.mark.asyncio
    async def test_xss_protection(
        self,
        async_client: AsyncClient,
        malicious_payloads: Dict[str, list]
    ):
        """Test protection against XSS attacks."""
        for payload in malicious_payloads["xss"]:
            user_data = {
                "email": "test@example.com",
                "password": "TestPassword123!",
                "first_name": payload,
                "last_name": "User"
            }
            
            response = await async_client.post("/api/v1/auth/register", json=user_data)
            
            # Should be handled gracefully
            assert response.status_code in [400, 422]


class TestRateLimiting:
    """Test rate limiting functionality."""
    
    @pytest.mark.asyncio
    async def test_rate_limiting_auth_endpoints(
        self,
        async_client: AsyncClient,
        test_user: User
    ):
        """Test rate limiting on authentication endpoints."""
        login_data = {
            "email": "nonexistent@example.com",
            "password": "TestPassword123!"
        }
        
        # Make many requests quickly
        responses = []
        for _ in range(10):  # Exceed rate limit
            response = await async_client.post("/api/v1/auth/login", json=login_data)
            responses.append(response.status_code)
        
        # Should eventually get rate limited (429)
        assert 429 in responses
    
    @pytest.mark.asyncio
    async def test_rate_limit_headers(
        self,
        async_client: AsyncClient,
        disable_rate_limiting
    ):
        """Test rate limit headers in responses."""
        response = await async_client.get("/api/v1/health")
        
        # Should include rate limit headers
        assert "X-RateLimit-Limit" in response.headers
        assert "X-RateLimit-Remaining" in response.headers