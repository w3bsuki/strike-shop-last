"""
Test configuration and settings
"""
import os
from typing import Dict, Any


class TestConfig:
    """Test configuration settings."""
    
    # Database settings
    DATABASE_URL = "sqlite+aiosqlite:///:memory:"
    TEST_DATABASE_URL = "postgresql+asyncpg://testuser:testpass@localhost:5432/taskflow_test"
    
    # Redis settings
    REDIS_URL = "redis://localhost:6379/1"  # Use database 1 for tests
    
    # Auth settings
    SECRET_KEY = "test-secret-key-for-testing-only"
    ACCESS_TOKEN_EXPIRE_MINUTES = 30
    
    # AI service settings
    OPENAI_API_KEY = "test-openai-key"
    OPENAI_MODEL = "gpt-3.5-turbo"
    
    # Rate limiting
    RATE_LIMIT_ENABLED = False  # Disable for testing
    
    # Email settings
    EMAIL_ENABLED = False  # Disable email sending in tests
    
    # Celery settings
    CELERY_BROKER_URL = "redis://localhost:6379/2"
    CELERY_RESULT_BACKEND = "redis://localhost:6379/2"
    CELERY_TASK_ALWAYS_EAGER = True  # Execute tasks synchronously in tests
    
    # WebSocket settings
    WEBSOCKET_ENABLED = True
    
    @classmethod
    def get_settings(cls) -> Dict[str, Any]:
        """Get all test settings as a dictionary."""
        return {
            key: value
            for key, value in cls.__dict__.items()
            if not key.startswith('_') and not callable(value)
        }


def get_test_env_vars() -> Dict[str, str]:
    """Get environment variables for testing."""
    return {
        "ENVIRONMENT": "test",
        "DATABASE_URL": TestConfig.TEST_DATABASE_URL,
        "REDIS_URL": TestConfig.REDIS_URL,
        "SECRET_KEY": TestConfig.SECRET_KEY,
        "OPENAI_API_KEY": TestConfig.OPENAI_API_KEY,
        "CELERY_BROKER_URL": TestConfig.CELERY_BROKER_URL,
        "CELERY_RESULT_BACKEND": TestConfig.CELERY_RESULT_BACKEND,
        "EMAIL_ENABLED": "false",
        "RATE_LIMIT_ENABLED": "false",
    }


def setup_test_environment():
    """Setup test environment variables."""
    env_vars = get_test_env_vars()
    for key, value in env_vars.items():
        os.environ[key] = value