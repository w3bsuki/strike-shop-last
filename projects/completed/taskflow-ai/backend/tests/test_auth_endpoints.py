"""
Test authentication endpoints
"""
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from unittest.mock import patch

from app.core.security import verify_password, create_access_token
from app.models.user import User
from tests.factories import UserFactory


class TestAuthEndpoints:
    """Test authentication endpoints."""

    @pytest.mark.asyncio
    async def test_register_success(self, client: AsyncClient, db_session: AsyncSession):
        """Test successful user registration."""
        user_data = {
            "email": "newuser@example.com",
            "password": "testpass123",
            "name": "New User"
        }
        
        response = await client.post("/api/v1/auth/register", json=user_data)
        
        assert response.status_code == 201
        data = response.json()
        assert data["email"] == user_data["email"]
        assert data["name"] == user_data["name"]
        assert "access_token" in data
        assert "user" in data

    @pytest.mark.asyncio
    async def test_register_duplicate_email(self, client: AsyncClient, db_session: AsyncSession):
        """Test registration with duplicate email."""
        # Create existing user
        existing_user = await UserFactory.create_async(db_session, email="existing@example.com")
        
        user_data = {
            "email": "existing@example.com",
            "password": "testpass123",
            "name": "Duplicate User"
        }
        
        response = await client.post("/api/v1/auth/register", json=user_data)
        
        assert response.status_code == 400
        assert "already registered" in response.json()["detail"]

    @pytest.mark.asyncio
    async def test_register_invalid_data(self, client: AsyncClient):
        """Test registration with invalid data."""
        invalid_data = [
            {"email": "invalid-email", "password": "short", "name": ""},  # Invalid email, short password, empty name
            {"password": "testpass123", "name": "User"},  # Missing email
            {"email": "user@example.com", "name": "User"},  # Missing password
            {"email": "user@example.com", "password": "testpass123"},  # Missing name
        ]
        
        for data in invalid_data:
            response = await client.post("/api/v1/auth/register", json=data)
            assert response.status_code == 422

    @pytest.mark.asyncio
    async def test_login_success(self, client: AsyncClient, db_session: AsyncSession):
        """Test successful login."""
        # Create user with known password
        user = await UserFactory.create_async(
            db_session, 
            email="testuser@example.com",
            hashed_password="$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW"  # secret
        )
        
        login_data = {
            "email": "testuser@example.com",
            "password": "secret"
        }
        
        response = await client.post("/api/v1/auth/login", json=login_data)
        
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"
        assert data["user"]["email"] == user.email

    @pytest.mark.asyncio
    async def test_login_invalid_credentials(self, client: AsyncClient, db_session: AsyncSession):
        """Test login with invalid credentials."""
        user = await UserFactory.create_async(db_session, email="testuser@example.com")
        
        # Wrong password
        response = await client.post("/api/v1/auth/login", json={
            "email": "testuser@example.com",
            "password": "wrongpassword"
        })
        assert response.status_code == 401
        
        # Non-existent user
        response = await client.post("/api/v1/auth/login", json={
            "email": "nonexistent@example.com",
            "password": "password"
        })
        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_login_inactive_user(self, client: AsyncClient, db_session: AsyncSession):
        """Test login with inactive user."""
        user = await UserFactory.create_async(
            db_session, 
            email="inactive@example.com",
            is_active=False
        )
        
        response = await client.post("/api/v1/auth/login", json={
            "email": "inactive@example.com",
            "password": "testpass123"
        })
        
        assert response.status_code == 401
        assert "inactive" in response.json()["detail"].lower()

    @pytest.mark.asyncio
    async def test_get_current_user(self, authenticated_client: AsyncClient):
        """Test getting current user profile."""
        response = await authenticated_client.get("/api/v1/auth/me")
        
        assert response.status_code == 200
        data = response.json()
        assert "email" in data
        assert "name" in data
        assert "id" in data

    @pytest.mark.asyncio
    async def test_get_current_user_unauthorized(self, client: AsyncClient):
        """Test getting current user without authentication."""
        response = await client.get("/api/v1/auth/me")
        
        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_get_current_user_invalid_token(self, client: AsyncClient):
        """Test getting current user with invalid token."""
        client.headers["Authorization"] = "Bearer invalid_token"
        
        response = await client.get("/api/v1/auth/me")
        
        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_logout(self, authenticated_client: AsyncClient):
        """Test user logout."""
        response = await authenticated_client.post("/api/v1/auth/logout")
        
        assert response.status_code == 200
        assert "message" in response.json()

    @pytest.mark.asyncio
    async def test_refresh_token(self, client: AsyncClient, db_session: AsyncSession):
        """Test token refresh."""
        user = await UserFactory.create_async(db_session)
        refresh_token = create_access_token(subject=str(user.id), expires_delta=None)
        
        response = await client.post("/api/v1/auth/refresh", json={
            "refresh_token": refresh_token
        })
        
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert "refresh_token" in data

    @pytest.mark.asyncio
    async def test_password_reset_request(self, client: AsyncClient, db_session: AsyncSession):
        """Test password reset request."""
        user = await UserFactory.create_async(db_session, email="reset@example.com")
        
        with patch('app.services.email.send_password_reset_email') as mock_send:
            response = await client.post("/api/v1/auth/password-reset", json={
                "email": "reset@example.com"
            })
            
            assert response.status_code == 200
            mock_send.assert_called_once()

    @pytest.mark.asyncio
    async def test_password_reset_request_nonexistent_user(self, client: AsyncClient):
        """Test password reset request for non-existent user."""
        response = await client.post("/api/v1/auth/password-reset", json={
            "email": "nonexistent@example.com"
        })
        
        # Should still return 200 for security reasons
        assert response.status_code == 200

    @pytest.mark.asyncio
    async def test_password_reset_confirm(self, client: AsyncClient, db_session: AsyncSession):
        """Test password reset confirmation."""
        user = await UserFactory.create_async(db_session)
        reset_token = create_access_token(
            subject=str(user.id), 
            token_type="password_reset"
        )
        
        response = await client.post("/api/v1/auth/password-reset/confirm", json={
            "token": reset_token,
            "new_password": "newpassword123"
        })
        
        assert response.status_code == 200
        
        # Verify password was changed
        await db_session.refresh(user)
        assert verify_password("newpassword123", user.hashed_password)

    @pytest.mark.asyncio
    async def test_change_password(self, authenticated_client: AsyncClient, db_session: AsyncSession):
        """Test password change for authenticated user."""
        response = await authenticated_client.post("/api/v1/auth/change-password", json={
            "current_password": "testpass123",
            "new_password": "newpassword123"
        })
        
        assert response.status_code == 200

    @pytest.mark.asyncio
    async def test_change_password_wrong_current(self, authenticated_client: AsyncClient):
        """Test password change with wrong current password."""
        response = await authenticated_client.post("/api/v1/auth/change-password", json={
            "current_password": "wrongpassword",
            "new_password": "newpassword123"
        })
        
        assert response.status_code == 400

    @pytest.mark.asyncio
    async def test_update_profile(self, authenticated_client: AsyncClient):
        """Test profile update."""
        response = await authenticated_client.put("/api/v1/auth/profile", json={
            "name": "Updated Name",
            "avatar": "https://example.com/new-avatar.jpg"
        })
        
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Updated Name"
        assert data["avatar"] == "https://example.com/new-avatar.jpg"

    @pytest.mark.asyncio
    async def test_delete_account(self, authenticated_client: AsyncClient):
        """Test account deletion."""
        response = await authenticated_client.delete("/api/v1/auth/account")
        
        assert response.status_code == 200
        
        # Verify user can't access protected endpoints
        response = await authenticated_client.get("/api/v1/auth/me")
        assert response.status_code == 401