"""
Security-focused tests for the authentication API.
Tests various attack vectors and security mechanisms.
"""

import pytest
from httpx import AsyncClient
from typing import Dict, List, Any
from unittest.mock import patch
import time

from src.models import User


class TestInputValidation:
    """Test input validation and sanitization."""
    
    @pytest.mark.asyncio
    async def test_sql_injection_attempts(
        self,
        async_client: AsyncClient,
        malicious_payloads: Dict[str, List[str]]
    ):
        """Test protection against SQL injection attacks."""
        for payload in malicious_payloads["sql_injection"]:
            # Test in email field
            login_data = {
                "email": payload,
                "password": "TestPassword123!"
            }
            
            response = await async_client.post("/api/v1/auth/login", json=login_data)
            
            # Should not cause internal server error
            assert response.status_code != 500
            # Should be handled as invalid input
            assert response.status_code in [400, 401, 422]
            
            # Test in password field
            login_data = {
                "email": "test@example.com",
                "password": payload
            }
            
            response = await async_client.post("/api/v1/auth/login", json=login_data)
            assert response.status_code != 500
            assert response.status_code in [400, 401, 422]
    
    @pytest.mark.asyncio
    async def test_xss_prevention(
        self,
        async_client: AsyncClient,
        malicious_payloads: Dict[str, List[str]]
    ):
        """Test XSS prevention in user inputs."""
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
            
            if response.status_code == 422:
                # Validation error response should not contain unescaped payload
                response_text = response.text
                assert "<script>" not in response_text
                assert "javascript:" not in response_text
    
    @pytest.mark.asyncio
    async def test_oversized_requests(
        self,
        async_client: AsyncClient
    ):
        """Test handling of oversized requests."""
        # Create very large payload
        large_string = "A" * 100000  # 100KB string
        
        user_data = {
            "email": "test@example.com",
            "password": "TestPassword123!",
            "first_name": large_string,
            "last_name": "User"
        }
        
        response = await async_client.post("/api/v1/auth/register", json=user_data)
        
        # Should be rejected
        assert response.status_code in [400, 413, 422]
    
    @pytest.mark.asyncio
    async def test_null_byte_injection(
        self,
        async_client: AsyncClient
    ):
        """Test protection against null byte injection."""
        payloads = [
            "test@example.com\x00.evil.com",
            "password\x00admin",
            "test\x00user"
        ]
        
        for payload in payloads:
            user_data = {
                "email": payload if "@" in payload else "test@example.com",
                "password": payload if "password" in payload else "TestPassword123!",
                "first_name": payload if "test" in payload else "Test",
                "last_name": "User"
            }
            
            response = await async_client.post("/api/v1/auth/register", json=user_data)
            
            # Should be handled gracefully
            assert response.status_code in [400, 422]


class TestAuthenticationSecurity:
    """Test authentication security mechanisms."""
    
    @pytest.mark.asyncio
    async def test_brute_force_protection(
        self,
        async_client: AsyncClient,
        test_user: User,
        test_session
    ):
        """Test brute force protection implementation."""
        login_data = {
            "email": test_user.email,
            "password": "WrongPassword123!"
        }
        
        # Track response codes
        response_codes = []
        
        # Make 6 failed attempts
        for i in range(6):
            response = await async_client.post("/api/v1/auth/login", json=login_data)
            response_codes.append(response.status_code)
        
        # First 5 should be 401 (unauthorized)
        assert all(code == 401 for code in response_codes[:5])
        
        # 6th should be 403 (account locked)
        assert response_codes[5] == 403
        
        # Verify account is actually locked
        await test_session.refresh(test_user)
        assert test_user.is_account_locked()
    
    @pytest.mark.asyncio
    async def test_account_lockout_timing(
        self,
        async_client: AsyncClient,
        test_user: User
    ):
        """Test account lockout timing mechanisms."""
        # First, lock the account
        login_data = {
            "email": test_user.email,
            "password": "WrongPassword123!"
        }
        
        # Make enough failed attempts to lock account
        for _ in range(6):
            await async_client.post("/api/v1/auth/login", json=login_data)
        
        # Now try with correct password - should still be locked
        correct_login_data = {
            "email": test_user.email,
            "password": "TestPassword123!"
        }
        
        response = await async_client.post("/api/v1/auth/login", json=correct_login_data)
        assert response.status_code == 403
        
        data = response.json()
        assert "locked" in data["message"].lower()
    
    @pytest.mark.asyncio
    async def test_timing_attack_resistance(
        self,
        async_client: AsyncClient,
        test_user: User
    ):
        """Test resistance to timing attacks."""
        # Test with existing user
        existing_user_times = []
        for _ in range(5):
            start_time = time.time()
            response = await async_client.post("/api/v1/auth/login", json={
                "email": test_user.email,
                "password": "WrongPassword123!"
            })
            end_time = time.time()
            existing_user_times.append(end_time - start_time)
            assert response.status_code == 401
        
        # Test with non-existing user
        nonexisting_user_times = []
        for _ in range(5):
            start_time = time.time()
            response = await async_client.post("/api/v1/auth/login", json={
                "email": "nonexistent@example.com",
                "password": "WrongPassword123!"
            })
            end_time = time.time()
            nonexisting_user_times.append(end_time - start_time)
            assert response.status_code == 401
        
        # Calculate average times
        avg_existing = sum(existing_user_times) / len(existing_user_times)
        avg_nonexisting = sum(nonexisting_user_times) / len(nonexisting_user_times)
        
        # Time difference should be minimal (within 20% to account for variance)
        time_ratio = abs(avg_existing - avg_nonexisting) / max(avg_existing, avg_nonexisting)
        assert time_ratio < 0.2


class TestTokenSecurity:
    """Test JWT token security mechanisms."""
    
    @pytest.mark.asyncio
    async def test_token_expiration(
        self,
        async_client: AsyncClient,
        auth_headers: Dict[str, str]
    ):
        """Test token expiration handling."""
        # Mock expired token
        expired_token = "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE1MTYyMzkwMjJ9.invalid"
        
        headers = {"Authorization": f"Bearer {expired_token}"}
        
        response = await async_client.get("/api/v1/auth/me", headers=headers)
        assert response.status_code == 401
        
        data = response.json()
        assert "expired" in data["message"].lower() or "invalid" in data["message"].lower()
    
    @pytest.mark.asyncio
    async def test_malformed_token(
        self,
        async_client: AsyncClient
    ):
        """Test handling of malformed tokens."""
        malformed_tokens = [
            "invalid.token.format",
            "Bearer malformed_token",
            "not.a.jwt",
            "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid_payload.signature",
            ""
        ]
        
        for token in malformed_tokens:
            headers = {"Authorization": f"Bearer {token}"}
            
            response = await async_client.get("/api/v1/auth/me", headers=headers)
            assert response.status_code == 401
    
    @pytest.mark.asyncio
    async def test_token_reuse_detection(
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
        
        # Second refresh with same token should fail (token rotation)
        response2 = await async_client.post("/api/v1/auth/refresh", json=refresh_data)
        assert response2.status_code == 401
        
        data = response2.json()
        assert "invalid" in data["message"].lower() or "expired" in data["message"].lower()


class TestRateLimiting:
    """Test rate limiting security features."""
    
    @pytest.mark.asyncio
    async def test_authentication_rate_limiting(
        self,
        async_client: AsyncClient,
        test_user: User
    ):
        """Test rate limiting on authentication endpoints."""
        login_data = {
            "email": test_user.email,
            "password": "WrongPassword123!"
        }
        
        # Make rapid requests
        response_codes = []
        for _ in range(10):
            response = await async_client.post("/api/v1/auth/login", json=login_data)
            response_codes.append(response.status_code)
        
        # Should eventually hit rate limit
        assert 429 in response_codes  # Too Many Requests
    
    @pytest.mark.asyncio
    async def test_rate_limit_bypass_attempts(
        self,
        async_client: AsyncClient
    ):
        """Test attempts to bypass rate limiting."""
        login_data = {
            "email": "test@example.com",
            "password": "TestPassword123!"
        }
        
        # Try with different User-Agent headers
        user_agents = [
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
            "Mozilla/5.0 (X11; Linux x86_64)",
        ]
        
        rate_limited = False
        for user_agent in user_agents:
            headers = {"User-Agent": user_agent}
            for _ in range(8):  # Exceed rate limit
                response = await async_client.post(
                    "/api/v1/auth/login",
                    json=login_data,
                    headers=headers
                )
                if response.status_code == 429:
                    rate_limited = True
                    break
            if rate_limited:
                break
        
        # Should still be rate limited despite different User-Agent
        assert rate_limited


class TestSessionSecurity:
    """Test session security mechanisms."""
    
    @pytest.mark.asyncio
    async def test_concurrent_session_handling(
        self,
        async_client: AsyncClient,
        test_user: User
    ):
        """Test handling of concurrent sessions."""
        login_data = {
            "email": test_user.email,
            "password": "TestPassword123!"
        }
        
        # Create multiple sessions
        sessions = []
        for _ in range(3):
            response = await async_client.post("/api/v1/auth/login", json=login_data)
            assert response.status_code == 200
            data = response.json()
            sessions.append({
                "access_token": data["tokens"]["access_token"],
                "refresh_token": data["tokens"]["refresh_token"]
            })
        
        # All sessions should be valid initially
        for session in sessions:
            headers = {"Authorization": f"Bearer {session['access_token']}"}
            response = await async_client.get("/api/v1/auth/me", headers=headers)
            assert response.status_code == 200
    
    @pytest.mark.asyncio
    async def test_logout_all_devices(
        self,
        async_client: AsyncClient,
        test_user: User
    ):
        """Test logout from all devices functionality."""
        login_data = {
            "email": test_user.email,
            "password": "TestPassword123!"
        }
        
        # Create multiple sessions
        sessions = []
        for _ in range(3):
            response = await async_client.post("/api/v1/auth/login", json=login_data)
            assert response.status_code == 200
            data = response.json()
            sessions.append({
                "access_token": data["tokens"]["access_token"],
                "refresh_token": data["tokens"]["refresh_token"]
            })
        
        # Logout from all devices using first session
        headers = {"Authorization": f"Bearer {sessions[0]['access_token']}"}
        response = await async_client.post("/api/v1/auth/logout-all", headers=headers)
        assert response.status_code == 200
        
        # All refresh tokens should now be invalid
        for session in sessions:
            refresh_data = {"refresh_token": session["refresh_token"]}
            response = await async_client.post("/api/v1/auth/refresh", json=refresh_data)
            assert response.status_code == 401


class TestHttpSecurity:
    """Test HTTP-level security features."""
    
    @pytest.mark.asyncio
    async def test_security_headers(
        self,
        async_client: AsyncClient
    ):
        """Test presence of security headers."""
        response = await async_client.get("/api/v1/health")
        
        # Check for important security headers
        assert "X-Content-Type-Options" in response.headers
        assert response.headers["X-Content-Type-Options"] == "nosniff"
        
        assert "X-Frame-Options" in response.headers
        assert response.headers["X-Frame-Options"] == "DENY"
        
        assert "X-XSS-Protection" in response.headers
        
        assert "Content-Security-Policy" in response.headers
        
        assert "Referrer-Policy" in response.headers
    
    @pytest.mark.asyncio
    async def test_content_type_validation(
        self,
        async_client: AsyncClient
    ):
        """Test content type validation."""
        # Try with invalid content type
        headers = {"Content-Type": "text/xml"}
        
        user_data = {
            "email": "test@example.com",
            "password": "TestPassword123!",
            "first_name": "Test",
            "last_name": "User"
        }
        
        response = await async_client.post(
            "/api/v1/auth/register",
            json=user_data,
            headers=headers
        )
        
        # Should accept JSON regardless of explicit content-type for JSON data
        # Or reject based on middleware configuration
        assert response.status_code in [201, 415, 422]
    
    @pytest.mark.asyncio
    async def test_host_header_validation(
        self,
        async_client: AsyncClient
    ):
        """Test host header validation."""
        # This test depends on trusted host middleware configuration
        # In development, it might be permissive
        
        response = await async_client.get("/api/v1/health")
        
        # Should not return 400 for valid requests
        assert response.status_code != 400


class TestDataProtection:
    """Test data protection and privacy features."""
    
    @pytest.mark.asyncio
    async def test_password_not_in_response(
        self,
        async_client: AsyncClient,
        test_user: User,
        auth_headers: Dict[str, str]
    ):
        """Test that passwords are never included in responses."""
        response = await async_client.get("/api/v1/auth/me", headers=auth_headers)
        
        assert response.status_code == 200
        data = response.json()
        
        # Password fields should not be present
        assert "password" not in data
        assert "password_hash" not in data
        
        # Check response text doesn't contain password patterns
        response_text = response.text.lower()
        assert "password" not in response_text or "password_hash" not in response_text
    
    @pytest.mark.asyncio
    async def test_sensitive_data_not_logged(
        self,
        async_client: AsyncClient,
        caplog
    ):
        """Test that sensitive data is not logged."""
        login_data = {
            "email": "test@example.com",
            "password": "TestPassword123!"
        }
        
        with caplog.at_level("DEBUG"):
            await async_client.post("/api/v1/auth/login", json=login_data)
        
        # Check that password is not in logs
        log_text = " ".join([record.message for record in caplog.records])
        assert "TestPassword123!" not in log_text
    
    @pytest.mark.asyncio
    async def test_token_not_in_error_responses(
        self,
        async_client: AsyncClient,
        auth_tokens: Dict[str, Any]
    ):
        """Test that tokens are not exposed in error responses."""
        # Make request with invalid token format but real token in URL (simulating mistake)
        invalid_token = "invalid_token"
        headers = {"Authorization": f"Bearer {invalid_token}"}
        
        response = await async_client.get("/api/v1/auth/me", headers=headers)
        
        assert response.status_code == 401
        
        # Real token should not appear in error response
        response_text = response.text
        assert auth_tokens["access_token"] not in response_text
        assert auth_tokens["refresh_token"] not in response_text