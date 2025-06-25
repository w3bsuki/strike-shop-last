"""
Sentry configuration for error tracking and performance monitoring.
"""

import sentry_sdk
from sentry_sdk.integrations.fastapi import FastApiIntegration
from sentry_sdk.integrations.sqlalchemy import SqlalchemyIntegration
from sentry_sdk.integrations.redis import RedisIntegration
from sentry_sdk.integrations.celery import CeleryIntegration
from sentry_sdk.integrations.logging import LoggingIntegration
import logging

from app.core.config import settings


def init_sentry():
    """Initialize Sentry error tracking and performance monitoring."""
    if not settings.SENTRY_DSN:
        logging.info("Sentry DSN not configured, skipping initialization")
        return
    
    # Configure logging integration
    logging_integration = LoggingIntegration(
        level=logging.INFO,        # Capture info and above as breadcrumbs
        event_level=logging.ERROR  # Send errors as events
    )
    
    sentry_sdk.init(
        dsn=settings.SENTRY_DSN,
        environment=settings.ENVIRONMENT,
        integrations=[
            FastApiIntegration(
                transaction_style="endpoint",
                failed_request_status_codes=[400, 401, 403, 404, 429, 500, 502, 503, 504]
            ),
            SqlalchemyIntegration(),
            RedisIntegration(),
            CeleryIntegration(
                monitor_beat_tasks=True,
                propagate_traces=True
            ),
            logging_integration
        ],
        
        # Performance monitoring
        traces_sample_rate=0.1 if settings.ENVIRONMENT == "production" else 1.0,
        
        # Session tracking
        release=settings.APP_VERSION,
        
        # Filtering
        before_send=before_send,
        
        # Additional options
        attach_stacktrace=True,
        send_default_pii=False,  # Don't send personally identifiable information
        
        # Performance options
        profiles_sample_rate=0.1 if settings.ENVIRONMENT == "production" else 1.0,
    )
    
    logging.info(f"Sentry initialized for {settings.ENVIRONMENT} environment")


def before_send(event, hint):
    """
    Filter or modify events before sending to Sentry.
    """
    # Filter out certain errors
    if 'exc_info' in hint:
        exc_type, exc_value, tb = hint['exc_info']
        
        # Don't send client disconnection errors
        if exc_type.__name__ in ['ConnectionResetError', 'BrokenPipeError']:
            return None
        
        # Don't send validation errors (they're user errors, not app errors)
        if exc_type.__name__ == 'ValidationError':
            return None
    
    # Scrub sensitive data from request
    if 'request' in event and 'data' in event['request']:
        event['request']['data'] = scrub_sensitive_data(event['request']['data'])
    
    # Add custom context
    event['contexts']['app'] = {
        'environment': settings.ENVIRONMENT,
        'debug_mode': settings.DEBUG,
    }
    
    return event


def scrub_sensitive_data(data):
    """
    Remove sensitive information from data before sending to Sentry.
    """
    if not isinstance(data, dict):
        return data
    
    sensitive_keys = {
        'password', 'token', 'secret', 'api_key', 'authorization',
        'credit_card', 'ssn', 'email', 'phone'
    }
    
    scrubbed_data = {}
    for key, value in data.items():
        if any(sensitive in key.lower() for sensitive in sensitive_keys):
            scrubbed_data[key] = '[REDACTED]'
        elif isinstance(value, dict):
            scrubbed_data[key] = scrub_sensitive_data(value)
        else:
            scrubbed_data[key] = value
    
    return scrubbed_data


def capture_message(message: str, level: str = "info", **kwargs):
    """
    Capture a message to Sentry.
    """
    if settings.SENTRY_DSN:
        sentry_sdk.capture_message(message, level=level, **kwargs)


def capture_exception(exception: Exception, **kwargs):
    """
    Capture an exception to Sentry.
    """
    if settings.SENTRY_DSN:
        sentry_sdk.capture_exception(exception, **kwargs)