"""
Production-ready configuration management for FastAPI Authentication API.
Follows security best practices and environment-based configuration.
"""

from typing import Optional, List
from pydantic import BaseSettings, Field, validator
from pydantic_settings import BaseSettings as PydanticBaseSettings
import os


class DatabaseSettings(PydanticBaseSettings):
    """Database configuration with connection pooling and security."""
    
    host: str = Field(default="localhost", env="DB_HOST")
    port: int = Field(default=5432, env="DB_PORT")
    user: str = Field(env="DB_USER")
    password: str = Field(env="DB_PASSWORD")
    database: str = Field(env="DB_NAME")
    
    # Connection pooling configuration
    pool_size: int = Field(default=10, env="DB_POOL_SIZE")
    max_overflow: int = Field(default=20, env="DB_MAX_OVERFLOW")
    pool_timeout: int = Field(default=30, env="DB_POOL_TIMEOUT")
    pool_recycle: int = Field(default=3600, env="DB_POOL_RECYCLE")
    
    # SSL configuration for production
    ssl_mode: str = Field(default="prefer", env="DB_SSL_MODE")
    
    @property
    def url(self) -> str:
        """Construct database URL with connection parameters."""
        return (
            f"postgresql+asyncpg://{self.user}:{self.password}@"
            f"{self.host}:{self.port}/{self.database}"
            f"?sslmode={self.ssl_mode}"
        )
    
    @property
    def sync_url(self) -> str:
        """Synchronous database URL for migrations."""
        return (
            f"postgresql://{self.user}:{self.password}@"
            f"{self.host}:{self.port}/{self.database}"
            f"?sslmode={self.ssl_mode}"
        )


class RedisSettings(PydanticBaseSettings):
    """Redis configuration for caching and rate limiting."""
    
    host: str = Field(default="localhost", env="REDIS_HOST")
    port: int = Field(default=6379, env="REDIS_PORT")
    password: Optional[str] = Field(default=None, env="REDIS_PASSWORD")
    db: int = Field(default=0, env="REDIS_DB")
    
    # Connection pooling
    max_connections: int = Field(default=50, env="REDIS_MAX_CONNECTIONS")
    
    @property
    def url(self) -> str:
        """Construct Redis URL."""
        if self.password:
            return f"redis://:{self.password}@{self.host}:{self.port}/{self.db}"
        return f"redis://{self.host}:{self.port}/{self.db}"


class JWTSettings(PydanticBaseSettings):
    """JWT configuration with security best practices."""
    
    secret_key: str = Field(env="JWT_SECRET_KEY")
    algorithm: str = Field(default="HS256", env="JWT_ALGORITHM")
    
    # Token expiration times (in seconds)
    access_token_expire: int = Field(default=900, env="JWT_ACCESS_EXPIRE")  # 15 minutes
    refresh_token_expire: int = Field(default=604800, env="JWT_REFRESH_EXPIRE")  # 7 days
    
    # Issuer and audience for additional security
    issuer: str = Field(default="auth-api", env="JWT_ISSUER")
    audience: str = Field(default="auth-api-users", env="JWT_AUDIENCE")
    
    @validator("secret_key")
    def validate_secret_key(cls, v):
        """Ensure secret key is sufficiently complex."""
        if len(v) < 32:
            raise ValueError("JWT secret key must be at least 32 characters long")
        return v


class SecuritySettings(PydanticBaseSettings):
    """Security configuration following OWASP guidelines."""
    
    # Password policy
    min_password_length: int = Field(default=8, env="MIN_PASSWORD_LENGTH")
    require_uppercase: bool = Field(default=True, env="REQUIRE_UPPERCASE")
    require_lowercase: bool = Field(default=True, env="REQUIRE_LOWERCASE")
    require_numbers: bool = Field(default=True, env="REQUIRE_NUMBERS")
    require_special_chars: bool = Field(default=True, env="REQUIRE_SPECIAL_CHARS")
    
    # Rate limiting
    rate_limit_per_minute: int = Field(default=60, env="RATE_LIMIT_PER_MINUTE")
    auth_rate_limit_per_minute: int = Field(default=5, env="AUTH_RATE_LIMIT_PER_MINUTE")
    
    # Session security
    session_timeout: int = Field(default=3600, env="SESSION_TIMEOUT")  # 1 hour
    max_login_attempts: int = Field(default=5, env="MAX_LOGIN_ATTEMPTS")
    lockout_duration: int = Field(default=900, env="LOCKOUT_DURATION")  # 15 minutes
    
    # CORS configuration
    cors_origins: List[str] = Field(default=["http://localhost:3000"], env="CORS_ORIGINS")
    cors_methods: List[str] = Field(default=["GET", "POST", "PUT", "DELETE"], env="CORS_METHODS")
    cors_headers: List[str] = Field(default=["*"], env="CORS_HEADERS")
    
    @validator("cors_origins", pre=True)
    def parse_cors_origins(cls, v):
        """Parse CORS origins from environment variable."""
        if isinstance(v, str):
            return [origin.strip() for origin in v.split(",")]
        return v


class MonitoringSettings(PydanticBaseSettings):
    """Monitoring and observability configuration."""
    
    # Sentry configuration
    sentry_dsn: Optional[str] = Field(default=None, env="SENTRY_DSN")
    sentry_environment: str = Field(default="development", env="SENTRY_ENVIRONMENT")
    
    # Prometheus metrics
    enable_metrics: bool = Field(default=True, env="ENABLE_METRICS")
    metrics_path: str = Field(default="/metrics", env="METRICS_PATH")
    
    # Logging configuration
    log_level: str = Field(default="INFO", env="LOG_LEVEL")
    log_format: str = Field(default="json", env="LOG_FORMAT")  # json or console
    
    # Health check configuration
    health_check_path: str = Field(default="/health", env="HEALTH_CHECK_PATH")


class Settings(PydanticBaseSettings):
    """Main application settings."""
    
    # Environment configuration
    environment: str = Field(default="development", env="ENVIRONMENT")
    debug: bool = Field(default=False, env="DEBUG")
    
    # API configuration
    api_title: str = Field(default="Authentication API", env="API_TITLE")
    api_version: str = Field(default="1.0.0", env="API_VERSION")
    api_description: str = Field(
        default="Production-ready authentication API with JWT, rate limiting, and security best practices",
        env="API_DESCRIPTION"
    )
    
    # Server configuration
    host: str = Field(default="0.0.0.0", env="HOST")
    port: int = Field(default=8000, env="PORT")
    
    # Component settings
    database: DatabaseSettings = DatabaseSettings()
    redis: RedisSettings = RedisSettings()
    jwt: JWTSettings = JWTSettings()
    security: SecuritySettings = SecuritySettings()
    monitoring: MonitoringSettings = MonitoringSettings()
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False
    
    @property
    def is_production(self) -> bool:
        """Check if running in production environment."""
        return self.environment.lower() == "production"
    
    @property
    def is_development(self) -> bool:
        """Check if running in development environment."""
        return self.environment.lower() == "development"


# Global settings instance
settings = Settings()