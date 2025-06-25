"""
Structured logging configuration with security and observability features.
Implements comprehensive logging strategy for production monitoring.
"""

import logging
import logging.config
import json
import sys
from datetime import datetime
from typing import Dict, Any, Optional
from pathlib import Path
import structlog
from pythonjsonlogger import jsonlogger

from src.config import settings


class SecurityFilter(logging.Filter):
    """
    Filter to sanitize sensitive information from logs.
    Prevents accidental logging of passwords, tokens, and PII.
    """
    
    SENSITIVE_FIELDS = {
        'password', 'token', 'secret', 'key', 'authorization',
        'cookie', 'session', 'csrf', 'ssn', 'credit_card'
    }
    
    def filter(self, record):
        """Sanitize log record to remove sensitive information."""
        # Sanitize the message
        if hasattr(record, 'msg') and isinstance(record.msg, str):
            record.msg = self._sanitize_string(record.msg)
        
        # Sanitize extra fields
        if hasattr(record, '__dict__'):
            for key, value in list(record.__dict__.items()):
                if any(sensitive in key.lower() for sensitive in self.SENSITIVE_FIELDS):
                    record.__dict__[key] = '[REDACTED]'
                elif isinstance(value, str):
                    record.__dict__[key] = self._sanitize_string(value)
        
        return True
    
    def _sanitize_string(self, text: str) -> str:
        """Sanitize a string to remove sensitive patterns."""
        import re
        
        # Redact JWT tokens
        text = re.sub(r'Bearer\s+[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+', 
                     'Bearer [REDACTED]', text)
        
        # Redact API keys (common patterns)
        text = re.sub(r'[A-Za-z0-9]{32,}', '[REDACTED]', text)
        
        # Redact email addresses in certain contexts
        text = re.sub(r'password.*[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}', 
                     'password [REDACTED]', text, flags=re.IGNORECASE)
        
        return text


class CustomJSONFormatter(jsonlogger.JsonFormatter):
    """
    Custom JSON formatter with additional security and observability fields.
    """
    
    def add_fields(self, log_record, record, message_dict):
        """Add custom fields to log record."""
        super().add_fields(log_record, record, message_dict)
        
        # Add timestamp
        log_record['timestamp'] = datetime.utcnow().isoformat()
        
        # Add service information
        log_record['service'] = 'auth-api'
        log_record['version'] = settings.api_version
        log_record['environment'] = settings.environment
        
        # Add request context if available
        if hasattr(record, 'request_id'):
            log_record['request_id'] = record.request_id
        
        if hasattr(record, 'user_id'):
            log_record['user_id'] = record.user_id
        
        if hasattr(record, 'client_ip'):
            log_record['client_ip'] = record.client_ip
        
        # Add structured error information
        if record.levelno >= logging.ERROR and record.exc_info:
            log_record['error_type'] = record.exc_info[0].__name__
            log_record['error_traceback'] = self.formatException(record.exc_info)


def setup_logging():
    """
    Setup comprehensive logging configuration.
    
    Features:
    - Structured JSON logging for production
    - Console logging for development
    - Security-aware log sanitization
    - Performance metrics integration
    - Error tracking and alerting
    """
    
    # Create logs directory if it doesn't exist
    log_dir = Path("logs")
    log_dir.mkdir(exist_ok=True)
    
    # Determine log format based on environment
    if settings.monitoring.log_format == "json":
        formatter_class = CustomJSONFormatter
        formatter_format = "%(timestamp)s %(level)s %(name)s %(message)s"
    else:
        formatter_class = logging.Formatter
        formatter_format = (
            "%(asctime)s - %(name)s - %(levelname)s - "
            "[%(request_id)s] - %(message)s"
        )
    
    # Logging configuration
    config = {
        'version': 1,
        'disable_existing_loggers': False,
        'filters': {
            'security_filter': {
                '()': SecurityFilter,
            },
        },
        'formatters': {
            'json': {
                '()': CustomJSONFormatter,
                'format': formatter_format
            },
            'console': {
                '()': logging.Formatter,
                'format': '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
            }
        },
        'handlers': {
            'console': {
                'class': 'logging.StreamHandler',
                'level': settings.monitoring.log_level,
                'formatter': 'console' if not settings.is_production else 'json',
                'filters': ['security_filter'],
                'stream': sys.stdout
            },
            'file': {
                'class': 'logging.handlers.RotatingFileHandler',
                'level': 'INFO',
                'formatter': 'json',
                'filters': ['security_filter'],
                'filename': log_dir / 'auth-api.log',
                'maxBytes': 50 * 1024 * 1024,  # 50MB
                'backupCount': 10,
                'encoding': 'utf-8'
            },
            'error_file': {
                'class': 'logging.handlers.RotatingFileHandler',
                'level': 'ERROR',
                'formatter': 'json',
                'filters': ['security_filter'],
                'filename': log_dir / 'auth-api-errors.log',
                'maxBytes': 50 * 1024 * 1024,  # 50MB
                'backupCount': 10,
                'encoding': 'utf-8'
            },
            'security_file': {
                'class': 'logging.handlers.RotatingFileHandler',
                'level': 'WARNING',
                'formatter': 'json',
                'filename': log_dir / 'security.log',
                'maxBytes': 50 * 1024 * 1024,  # 50MB
                'backupCount': 20,
                'encoding': 'utf-8'
            }
        },
        'loggers': {
            '': {  # Root logger
                'handlers': ['console', 'file'],
                'level': settings.monitoring.log_level,
                'propagate': False
            },
            'src': {  # Application logger
                'handlers': ['console', 'file', 'error_file'],
                'level': settings.monitoring.log_level,
                'propagate': False
            },
            'security': {  # Security events logger
                'handlers': ['console', 'security_file'],
                'level': 'WARNING',
                'propagate': False
            },
            'uvicorn': {
                'handlers': ['console', 'file'],
                'level': 'INFO',
                'propagate': False
            },
            'sqlalchemy': {
                'handlers': ['file'],
                'level': 'WARNING' if settings.is_production else 'INFO',
                'propagate': False
            }
        }
    }
    
    # Apply logging configuration
    logging.config.dictConfig(config)
    
    # Setup structlog for structured logging
    structlog.configure(
        processors=[
            structlog.contextvars.merge_contextvars,
            structlog.processors.add_log_level,
            structlog.processors.StackInfoRenderer(),
            structlog.dev.set_exc_info,
            structlog.processors.JSONRenderer() if settings.is_production 
            else structlog.dev.ConsoleRenderer()
        ],
        wrapper_class=structlog.make_filtering_bound_logger(
            logging.getLogger().level
        ),
        context_class=dict,
        logger_factory=structlog.stdlib.LoggerFactory(),
        cache_logger_on_first_use=True,
    )


class SecurityLogger:
    """
    Specialized logger for security events.
    Provides structured logging for security-related incidents.
    """
    
    def __init__(self):
        self.logger = logging.getLogger('security')
    
    def authentication_failure(
        self,
        email: str,
        ip_address: str,
        reason: str,
        user_agent: Optional[str] = None
    ):
        """Log authentication failure event."""
        self.logger.warning(
            "Authentication failure",
            extra={
                'event_type': 'auth_failure',
                'email': email,
                'ip_address': ip_address,
                'reason': reason,
                'user_agent': user_agent,
                'severity': 'medium'
            }
        )
    
    def account_lockout(
        self,
        user_id: str,
        email: str,
        ip_address: str,
        attempt_count: int
    ):
        """Log account lockout event."""
        self.logger.warning(
            "Account locked due to failed login attempts",
            extra={
                'event_type': 'account_lockout',
                'user_id': user_id,
                'email': email,
                'ip_address': ip_address,
                'attempt_count': attempt_count,
                'severity': 'high'
            }
        )
    
    def suspicious_activity(
        self,
        activity_type: str,
        ip_address: str,
        details: Dict[str, Any],
        severity: str = 'medium'
    ):
        """Log suspicious activity."""
        self.logger.warning(
            f"Suspicious activity detected: {activity_type}",
            extra={
                'event_type': 'suspicious_activity',
                'activity_type': activity_type,
                'ip_address': ip_address,
                'details': details,
                'severity': severity
            }
        )
    
    def privilege_escalation_attempt(
        self,
        user_id: str,
        attempted_action: str,
        ip_address: str
    ):
        """Log privilege escalation attempt."""
        self.logger.error(
            "Privilege escalation attempt detected",
            extra={
                'event_type': 'privilege_escalation',
                'user_id': user_id,
                'attempted_action': attempted_action,
                'ip_address': ip_address,
                'severity': 'critical'
            }
        )
    
    def data_access_violation(
        self,
        user_id: str,
        resource: str,
        ip_address: str,
        details: Dict[str, Any]
    ):
        """Log unauthorized data access attempt."""
        self.logger.error(
            "Unauthorized data access attempt",
            extra={
                'event_type': 'data_access_violation',
                'user_id': user_id,
                'resource': resource,
                'ip_address': ip_address,
                'details': details,
                'severity': 'high'
            }
        )


class PerformanceLogger:
    """
    Logger for performance metrics and monitoring.
    """
    
    def __init__(self):
        self.logger = logging.getLogger('performance')
    
    def log_request_metrics(
        self,
        method: str,
        endpoint: str,
        status_code: int,
        response_time: float,
        request_size: Optional[int] = None,
        response_size: Optional[int] = None
    ):
        """Log request performance metrics."""
        self.logger.info(
            "Request completed",
            extra={
                'metric_type': 'request_performance',
                'method': method,
                'endpoint': endpoint,
                'status_code': status_code,
                'response_time_ms': response_time * 1000,
                'request_size_bytes': request_size,
                'response_size_bytes': response_size
            }
        )
    
    def log_database_metrics(
        self,
        operation: str,
        table: str,
        duration: float,
        rows_affected: Optional[int] = None
    ):
        """Log database operation metrics."""
        self.logger.info(
            "Database operation completed",
            extra={
                'metric_type': 'database_performance',
                'operation': operation,
                'table': table,
                'duration_ms': duration * 1000,
                'rows_affected': rows_affected
            }
        )
    
    def log_cache_metrics(
        self,
        operation: str,
        key: str,
        hit: bool,
        duration: Optional[float] = None
    ):
        """Log cache operation metrics."""
        self.logger.info(
            f"Cache {operation}",
            extra={
                'metric_type': 'cache_performance',
                'operation': operation,
                'cache_key': key,
                'cache_hit': hit,
                'duration_ms': duration * 1000 if duration else None
            }
        )


# Global logger instances
security_logger = SecurityLogger()
performance_logger = PerformanceLogger()


def get_logger(name: str) -> logging.Logger:
    """Get a logger instance with proper configuration."""
    return logging.getLogger(name)


def log_startup_info():
    """Log application startup information."""
    logger = get_logger(__name__)
    logger.info(
        "Authentication API starting up",
        extra={
            'event_type': 'startup',
            'version': settings.api_version,
            'environment': settings.environment,
            'debug': settings.debug,
            'database_url': settings.database.host,  # Don't log full URL
            'redis_url': settings.redis.host,
        }
    )


def log_shutdown_info():
    """Log application shutdown information."""
    logger = get_logger(__name__)
    logger.info(
        "Authentication API shutting down",
        extra={
            'event_type': 'shutdown',
            'version': settings.api_version,
            'environment': settings.environment
        }
    )