import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.main import app
from app.core.config import settings


@pytest.mark.asyncio
async def test_register_user(client: AsyncClient):
    """Test user registration"""
    response = await client.post(
        f"{settings.API_V1_STR}/auth/register",
        json={
            "email": "test@example.com",
            "username": "testuser",
            "password": "testpassword123",
            "full_name": "Test User"
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "test@example.com"
    assert data["username"] == "testuser"
    assert "id" in data


@pytest.mark.asyncio
async def test_login(client: AsyncClient):
    """Test user login"""
    # First register a user
    await client.post(
        f"{settings.API_V1_STR}/auth/register",
        json={
            "email": "login@example.com",
            "username": "loginuser",
            "password": "loginpassword123",
            "full_name": "Login User"
        }
    )
    
    # Then try to login
    response = await client.post(
        f"{settings.API_V1_STR}/auth/login",
        data={
            "username": "login@example.com",
            "password": "loginpassword123"
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["token_type"] == "bearer"


@pytest.mark.asyncio
async def test_login_wrong_password(client: AsyncClient):
    """Test login with wrong password"""
    response = await client.post(
        f"{settings.API_V1_STR}/auth/login",
        data={
            "username": "wrong@example.com",
            "password": "wrongpassword"
        }
    )
    assert response.status_code == 401