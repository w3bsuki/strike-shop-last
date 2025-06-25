"""
User model with comprehensive security features and performance optimizations.
Implements OWASP security guidelines and follows database design best practices.
"""

from datetime import datetime, timedelta
from typing import Optional, List
from sqlalchemy import (
    Column, String, Boolean, DateTime, Integer, 
    Text, Index, CheckConstraint, func, ForeignKey
)
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship, validates
from passlib.context import CryptContext
import re

from .base import Base, AuditMixin, MetadataMixin


# Password hashing context using bcrypt
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


class User(Base, AuditMixin, MetadataMixin):
    """
    User model with comprehensive security features.
    
    Design Decisions:
    1. UUID primary key for security (prevents enumeration attacks)
    2. Email as unique identifier with proper validation
    3. Separate password hash storage with bcrypt
    4. Account status tracking for security policies
    5. Login attempt tracking for brute force protection
    6. Flexible metadata for additional user attributes
    7. Audit trail for compliance requirements
    """
    
    __tablename__ = "users"
    
    # Basic user information
    email = Column(
        String(255),
        unique=True,
        nullable=False,
        index=True,
        comment="User email address (unique identifier)"
    )
    
    password_hash = Column(
        String(255),
        nullable=False,
        comment="Bcrypt password hash"
    )
    
    first_name = Column(
        String(100),
        nullable=True,
        comment="User first name"
    )
    
    last_name = Column(
        String(100),
        nullable=True,
        comment="User last name"
    )
    
    # Account status and security
    is_active = Column(
        Boolean,
        default=True,
        nullable=False,
        index=True,
        comment="Account active status"
    )
    
    is_verified = Column(
        Boolean,
        default=False,
        nullable=False,
        index=True,
        comment="Email verification status"
    )
    
    is_locked = Column(
        Boolean,
        default=False,
        nullable=False,
        index=True,
        comment="Account locked status (security)"
    )
    
    # Security tracking
    login_attempts = Column(
        Integer,
        default=0,
        nullable=False,
        comment="Failed login attempt counter"
    )
    
    last_login_at = Column(
        DateTime(timezone=True),
        nullable=True,
        comment="Last successful login timestamp"
    )
    
    last_login_ip = Column(
        String(45),  # IPv6 support
        nullable=True,
        comment="Last login IP address"
    )
    
    locked_until = Column(
        DateTime(timezone=True),
        nullable=True,
        comment="Account unlock timestamp"
    )
    
    # Password security
    password_changed_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
        comment="Password last change timestamp"
    )
    
    # Verification and recovery
    verification_token = Column(
        String(255),
        nullable=True,
        comment="Email verification token"
    )
    
    verification_token_expires = Column(
        DateTime(timezone=True),
        nullable=True,
        comment="Verification token expiration"
    )
    
    reset_token = Column(
        String(255),
        nullable=True,
        comment="Password reset token"
    )
    
    reset_token_expires = Column(
        DateTime(timezone=True),
        nullable=True,
        comment="Reset token expiration"
    )
    
    # Relationships
    refresh_tokens = relationship(
        "RefreshToken",
        back_populates="user",
        cascade="all, delete-orphan"
    )
    
    # Constraints
    __table_args__ = (
        CheckConstraint(
            "email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$'",
            name="valid_email_format"
        ),
        CheckConstraint(
            "login_attempts >= 0",
            name="non_negative_login_attempts"
        ),
        Index("idx_users_email_active", "email", "is_active"),
        Index("idx_users_verification", "verification_token"),
        Index("idx_users_reset_token", "reset_token"),
        Index("idx_users_locked_until", "locked_until"),
    )
    
    @validates("email")
    def validate_email(self, key, address):
        """Validate email format."""
        if not address:
            raise ValueError("Email is required")
        
        # Basic email validation
        pattern = r'^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
        if not re.match(pattern, address):
            raise ValueError("Invalid email format")
        
        return address.lower().strip()
    
    def set_password(self, password: str) -> None:
        """
        Hash and set user password with security validations.
        
        Args:
            password: Plain text password
            
        Raises:
            ValueError: If password doesn't meet security requirements
        """
        self._validate_password_strength(password)
        self.password_hash = pwd_context.hash(password)
        self.password_changed_at = datetime.utcnow()
    
    def verify_password(self, password: str) -> bool:
        """
        Verify password against stored hash.
        
        Args:
            password: Plain text password to verify
            
        Returns:
            True if password is correct, False otherwise
        """
        if not self.password_hash:
            return False
        return pwd_context.verify(password, self.password_hash)
    
    def _validate_password_strength(self, password: str) -> None:
        """
        Validate password strength according to security policy.
        
        Args:
            password: Plain text password to validate
            
        Raises:
            ValueError: If password doesn't meet requirements
        """
        if len(password) < 8:
            raise ValueError("Password must be at least 8 characters long")
        
        if not re.search(r'[A-Z]', password):
            raise ValueError("Password must contain at least one uppercase letter")
        
        if not re.search(r'[a-z]', password):
            raise ValueError("Password must contain at least one lowercase letter")
        
        if not re.search(r'\d', password):
            raise ValueError("Password must contain at least one number")
        
        if not re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
            raise ValueError("Password must contain at least one special character")
        
        # Check for common passwords (basic implementation)
        common_passwords = {
            "password", "123456", "password123", "admin", "qwerty",
            "letmein", "welcome", "monkey", "dragon"
        }
        if password.lower() in common_passwords:
            raise ValueError("Password is too common")
    
    def increment_login_attempts(self) -> None:
        """Increment failed login attempt counter."""
        self.login_attempts += 1
        
        # Lock account after 5 failed attempts
        if self.login_attempts >= 5:
            self.is_locked = True
            self.locked_until = datetime.utcnow() + timedelta(minutes=15)
    
    def reset_login_attempts(self) -> None:
        """Reset login attempts after successful login."""
        self.login_attempts = 0
        self.is_locked = False
        self.locked_until = None
        self.last_login_at = datetime.utcnow()
    
    def is_account_locked(self) -> bool:
        """
        Check if account is currently locked.
        
        Returns:
            True if account is locked, False otherwise
        """
        if not self.is_locked:
            return False
        
        if self.locked_until and datetime.utcnow() > self.locked_until:
            # Auto-unlock expired locks
            self.is_locked = False
            self.locked_until = None
            return False
        
        return True
    
    def can_login(self) -> tuple[bool, Optional[str]]:
        """
        Check if user can login.
        
        Returns:
            Tuple of (can_login, reason_if_not)
        """
        if not self.is_active:
            return False, "Account is inactive"
        
        if self.is_deleted:
            return False, "Account not found"
        
        if self.is_account_locked():
            return False, "Account is temporarily locked due to too many failed login attempts"
        
        return True, None
    
    def needs_password_change(self, max_age_days: int = 90) -> bool:
        """
        Check if password needs to be changed based on age.
        
        Args:
            max_age_days: Maximum password age in days
            
        Returns:
            True if password should be changed
        """
        if not self.password_changed_at:
            return True
        
        age = datetime.utcnow() - self.password_changed_at
        return age.days > max_age_days
    
    @property
    def full_name(self) -> str:
        """Get user's full name."""
        if self.first_name and self.last_name:
            return f"{self.first_name} {self.last_name}"
        return self.first_name or self.last_name or self.email
    
    def to_dict(self, exclude: Optional[set] = None) -> dict:
        """Convert to dictionary, excluding sensitive fields by default."""
        default_exclude = {
            'password_hash', 'verification_token', 'reset_token',
            'login_attempts', 'locked_until'
        }
        if exclude:
            default_exclude.update(exclude)
        
        return super().to_dict(exclude=default_exclude)
    
    def __repr__(self) -> str:
        return f"<User(id={self.id}, email={self.email})>"


class RefreshToken(Base):
    """
    Refresh token model for JWT token rotation.
    
    Design Decisions:
    1. Separate table for refresh tokens (allows revocation)
    2. Token family for refresh token rotation
    3. Automatic expiration handling
    4. User agent and IP tracking for security
    """
    
    __tablename__ = "refresh_tokens"
    
    # Token information
    token_hash = Column(
        String(255),
        unique=True,
        nullable=False,
        index=True,
        comment="Hashed refresh token"
    )
    
    user_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
        comment="Token owner user ID"
    )
    
    # Token metadata
    expires_at = Column(
        DateTime(timezone=True),
        nullable=False,
        index=True,
        comment="Token expiration timestamp"
    )
    
    is_revoked = Column(
        Boolean,
        default=False,
        nullable=False,
        index=True,
        comment="Token revocation status"
    )
    
    # Security tracking
    user_agent = Column(
        Text,
        nullable=True,
        comment="Client user agent"
    )
    
    ip_address = Column(
        String(45),
        nullable=True,
        comment="Client IP address"
    )
    
    # Token family for rotation
    token_family = Column(
        UUID(as_uuid=True),
        nullable=False,
        index=True,
        comment="Token family ID for rotation tracking"
    )
    
    # Relationships
    user = relationship("User", back_populates="refresh_tokens")
    
    # Constraints
    __table_args__ = (
        Index("idx_refresh_tokens_user_family", "user_id", "token_family"),
        Index("idx_refresh_tokens_expires", "expires_at"),
    )
    
    def is_expired(self) -> bool:
        """Check if token is expired."""
        return datetime.utcnow() > self.expires_at
    
    def is_valid(self) -> bool:
        """Check if token is valid (not expired or revoked)."""
        return not (self.is_expired() or self.is_revoked)
    
    def revoke(self) -> None:
        """Revoke the refresh token."""
        self.is_revoked = True
    
    def __repr__(self) -> str:
        return f"<RefreshToken(id={self.id}, user_id={self.user_id}, expired={self.is_expired()})>"