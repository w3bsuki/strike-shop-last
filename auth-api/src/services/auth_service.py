"""
Authentication service with JWT tokens, refresh token rotation, and security features.
Implements OWASP security guidelines and industry best practices.
"""

import uuid
import hashlib
import secrets
from datetime import datetime, timedelta
from typing import Optional, Tuple, Dict, Any
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_
from sqlalchemy.orm import selectinload
import logging

from src.config import settings
from src.models import User, RefreshToken
from src.exceptions import (
    AuthenticationError,
    AccountLockedError,
    TokenExpiredError,
    InvalidTokenError
)

logger = logging.getLogger(__name__)


class AuthenticationService:
    """
    Comprehensive authentication service with security features.
    
    Features:
    - JWT access/refresh token system
    - Refresh token rotation for enhanced security
    - Brute force protection
    - Account lockout mechanisms
    - Token family tracking
    - Comprehensive audit logging
    """
    
    def __init__(self):
        self.pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
        self.jwt_settings = settings.jwt
        self.security_settings = settings.security
    
    async def authenticate_user(
        self,
        session: AsyncSession,
        email: str,
        password: str,
        user_agent: Optional[str] = None,
        ip_address: Optional[str] = None
    ) -> Tuple[User, Dict[str, Any]]:
        """
        Authenticate user with comprehensive security checks.
        
        Args:
            session: Database session
            email: User email
            password: Plain text password
            user_agent: Client user agent
            ip_address: Client IP address
            
        Returns:
            Tuple of (User, token_data)
            
        Raises:
            AuthenticationError: Invalid credentials
            AccountLockedError: Account is locked
            ValidationError: Invalid input
        """
        # Input validation
        if not email or not password:
            raise AuthenticationError("Email and password are required")
        
        # Fetch user with security information
        result = await session.execute(
            select(User).where(
                and_(
                    User.email == email.lower().strip(),
                    User.is_deleted == False
                )
            )
        )
        user = result.scalar_one_or_none()
        
        if not user:
            # Prevent user enumeration by using consistent timing
            self.pwd_context.hash("dummy_password")
            logger.warning(f"Authentication attempt for non-existent user: {email}")
            raise AuthenticationError("Invalid credentials")
        
        # Check account status
        can_login, reason = user.can_login()
        if not can_login:
            if user.is_account_locked():
                logger.warning(f"Login attempt for locked account: {email}")
                raise AccountLockedError(reason)
            else:
                logger.warning(f"Login attempt for inactive account: {email}")
                raise AuthenticationError(reason)
        
        # Verify password
        if not user.verify_password(password):
            # Increment failed login attempts
            user.increment_login_attempts()
            await session.commit()
            
            logger.warning(
                f"Failed login attempt for user {email} "
                f"(attempt {user.login_attempts}/5) from IP {ip_address}"
            )
            raise AuthenticationError("Invalid credentials")
        
        # Successful authentication
        user.reset_login_attempts()
        user.last_login_ip = ip_address
        await session.commit()
        
        # Generate token pair
        tokens = await self._generate_token_pair(
            session, user, user_agent, ip_address
        )
        
        logger.info(f"Successful authentication for user {email} from IP {ip_address}")
        
        return user, tokens
    
    async def refresh_tokens(
        self,
        session: AsyncSession,
        refresh_token: str,
        user_agent: Optional[str] = None,
        ip_address: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Refresh access token using refresh token with rotation.
        
        Args:
            session: Database session
            refresh_token: Current refresh token
            user_agent: Client user agent
            ip_address: Client IP address
            
        Returns:
            New token pair
            
        Raises:
            InvalidTokenError: Invalid or expired refresh token
            TokenExpiredError: Token has expired
        """
        # Hash the provided token for database lookup
        token_hash = self._hash_token(refresh_token)
        
        # Find and validate refresh token
        result = await session.execute(
            select(RefreshToken)
            .options(selectinload(RefreshToken.user))
            .where(RefreshToken.token_hash == token_hash)
        )
        db_token = result.scalar_one_or_none()
        
        if not db_token:
            logger.warning(f"Refresh attempt with invalid token from IP {ip_address}")
            raise InvalidTokenError("Invalid refresh token")
        
        if not db_token.is_valid():
            # Revoke token family if expired token is used
            await self._revoke_token_family(session, db_token.token_family)
            logger.warning(
                f"Refresh attempt with expired/revoked token for user {db_token.user.email}"
            )
            raise TokenExpiredError("Refresh token has expired")
        
        # Check if user account is still valid
        user = db_token.user
        can_login, reason = user.can_login()
        if not can_login:
            await self._revoke_token_family(session, db_token.token_family)
            logger.warning(f"Refresh attempt for inactive user {user.email}")
            raise AuthenticationError(reason)
        
        # Revoke current token (rotation)
        db_token.revoke()
        
        # Generate new token pair with same family
        tokens = await self._generate_token_pair(
            session, user, user_agent, ip_address, db_token.token_family
        )
        
        await session.commit()
        
        logger.info(f"Token refresh successful for user {user.email}")
        
        return tokens
    
    async def revoke_refresh_token(
        self,
        session: AsyncSession,
        refresh_token: str,
        user_id: Optional[uuid.UUID] = None
    ) -> bool:
        """
        Revoke a specific refresh token.
        
        Args:
            session: Database session
            refresh_token: Token to revoke
            user_id: Optional user ID for additional security
            
        Returns:
            True if token was revoked, False if not found
        """
        token_hash = self._hash_token(refresh_token)
        
        query = select(RefreshToken).where(RefreshToken.token_hash == token_hash)
        if user_id:
            query = query.where(RefreshToken.user_id == user_id)
        
        result = await session.execute(query)
        db_token = result.scalar_one_or_none()
        
        if db_token and not db_token.is_revoked:
            db_token.revoke()
            await session.commit()
            logger.info(f"Refresh token revoked for user {db_token.user_id}")
            return True
        
        return False
    
    async def revoke_all_user_tokens(
        self,
        session: AsyncSession,
        user_id: uuid.UUID
    ) -> int:
        """
        Revoke all refresh tokens for a user.
        
        Args:
            session: Database session
            user_id: User ID
            
        Returns:
            Number of tokens revoked
        """
        result = await session.execute(
            select(RefreshToken).where(
                and_(
                    RefreshToken.user_id == user_id,
                    RefreshToken.is_revoked == False
                )
            )
        )
        tokens = result.scalars().all()
        
        count = 0
        for token in tokens:
            if not token.is_revoked:
                token.revoke()
                count += 1
        
        if count > 0:
            await session.commit()
            logger.info(f"Revoked {count} refresh tokens for user {user_id}")
        
        return count
    
    async def cleanup_expired_tokens(self, session: AsyncSession) -> int:
        """
        Clean up expired refresh tokens.
        
        Args:
            session: Database session
            
        Returns:
            Number of tokens cleaned up
        """
        # Delete expired tokens
        now = datetime.utcnow()
        result = await session.execute(
            select(RefreshToken).where(RefreshToken.expires_at < now)
        )
        expired_tokens = result.scalars().all()
        
        count = len(expired_tokens)
        for token in expired_tokens:
            await session.delete(token)
        
        if count > 0:
            await session.commit()
            logger.info(f"Cleaned up {count} expired refresh tokens")
        
        return count
    
    def verify_access_token(self, token: str) -> Dict[str, Any]:
        """
        Verify and decode access token.
        
        Args:
            token: JWT access token
            
        Returns:
            Decoded token payload
            
        Raises:
            InvalidTokenError: Invalid token
            TokenExpiredError: Token expired
        """
        try:
            payload = jwt.decode(
                token,
                self.jwt_settings.secret_key,
                algorithms=[self.jwt_settings.algorithm],
                issuer=self.jwt_settings.issuer,
                audience=self.jwt_settings.audience
            )
            
            # Verify token type
            if payload.get("type") != "access":
                raise InvalidTokenError("Invalid token type")
            
            return payload
            
        except jwt.ExpiredSignatureError:
            raise TokenExpiredError("Access token has expired")
        except JWTError as e:
            logger.warning(f"JWT validation error: {e}")
            raise InvalidTokenError("Invalid access token")
    
    async def _generate_token_pair(
        self,
        session: AsyncSession,
        user: User,
        user_agent: Optional[str] = None,
        ip_address: Optional[str] = None,
        token_family: Optional[uuid.UUID] = None
    ) -> Dict[str, Any]:
        """
        Generate access and refresh token pair.
        
        Args:
            session: Database session
            user: User object
            user_agent: Client user agent
            ip_address: Client IP address
            token_family: Existing token family for rotation
            
        Returns:
            Dictionary with token information
        """
        now = datetime.utcnow()
        token_family = token_family or uuid.uuid4()
        
        # Generate access token
        access_payload = {
            "sub": str(user.id),
            "email": user.email,
            "type": "access",
            "iat": now,
            "exp": now + timedelta(seconds=self.jwt_settings.access_token_expire),
            "iss": self.jwt_settings.issuer,
            "aud": self.jwt_settings.audience,
            "jti": str(uuid.uuid4()),  # JWT ID for tracking
        }
        
        access_token = jwt.encode(
            access_payload,
            self.jwt_settings.secret_key,
            algorithm=self.jwt_settings.algorithm
        )
        
        # Generate refresh token
        refresh_token_raw = secrets.token_urlsafe(32)
        refresh_token_hash = self._hash_token(refresh_token_raw)
        
        # Store refresh token in database
        db_refresh_token = RefreshToken(
            token_hash=refresh_token_hash,
            user_id=user.id,
            expires_at=now + timedelta(seconds=self.jwt_settings.refresh_token_expire),
            user_agent=user_agent,
            ip_address=ip_address,
            token_family=token_family
        )
        
        session.add(db_refresh_token)
        await session.flush()  # Get the ID without committing
        
        return {
            "access_token": access_token,
            "refresh_token": refresh_token_raw,
            "token_type": "bearer",
            "expires_in": self.jwt_settings.access_token_expire,
            "refresh_expires_in": self.jwt_settings.refresh_token_expire,
            "issued_at": now.isoformat(),
        }
    
    async def _revoke_token_family(
        self,
        session: AsyncSession,
        token_family: uuid.UUID
    ) -> int:
        """
        Revoke all tokens in a token family (security measure).
        
        Args:
            session: Database session
            token_family: Token family ID
            
        Returns:
            Number of tokens revoked
        """
        result = await session.execute(
            select(RefreshToken).where(
                and_(
                    RefreshToken.token_family == token_family,
                    RefreshToken.is_revoked == False
                )
            )
        )
        tokens = result.scalars().all()
        
        count = 0
        for token in tokens:
            if not token.is_revoked:
                token.revoke()
                count += 1
        
        if count > 0:
            logger.warning(f"Revoked {count} tokens in family {token_family}")
        
        return count
    
    def _hash_token(self, token: str) -> str:
        """
        Hash token for secure storage.
        
        Args:
            token: Raw token string
            
        Returns:
            Hashed token
        """
        return hashlib.sha256(token.encode()).hexdigest()
    
    def generate_secure_token(self, length: int = 32) -> str:
        """
        Generate cryptographically secure random token.
        
        Args:
            length: Token length in bytes
            
        Returns:
            URL-safe base64 encoded token
        """
        return secrets.token_urlsafe(length)


# Global authentication service instance
auth_service = AuthenticationService()