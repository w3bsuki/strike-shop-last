"""
Error handling and monitoring for AI services
"""

import functools
import time
import logging
from typing import Any, Callable, Dict, Optional
from openai import RateLimitError, APITimeoutError, APIError

logger = logging.getLogger(__name__)


class AIErrorHandler:
    """Handle and monitor AI service errors"""
    
    def __init__(self):
        self.error_counts = {}
        self.last_error_times = {}
    
    def log_error(self, operation: str, error: Exception, context: Dict[str, Any] = None):
        """Log AI operation errors with context"""
        error_type = type(error).__name__
        
        # Update error tracking
        key = f"{operation}:{error_type}"
        self.error_counts[key] = self.error_counts.get(key, 0) + 1
        self.last_error_times[key] = time.time()
        
        # Build log message
        log_data = {
            "operation": operation,
            "error_type": error_type,
            "error_message": str(error),
            "error_count": self.error_counts[key],
            "context": context or {}
        }
        
        # Log based on error type
        if isinstance(error, RateLimitError):
            logger.warning(f"Rate limit hit for {operation}: {error}")
        elif isinstance(error, APITimeoutError):
            logger.warning(f"Timeout for {operation}: {error}")
        elif isinstance(error, APIError):
            logger.error(f"API error for {operation}: {error}", extra=log_data)
        else:
            logger.error(f"Unexpected error for {operation}: {error}", extra=log_data)
    
    def get_error_stats(self) -> Dict[str, Any]:
        """Get error statistics"""
        return {
            "error_counts": self.error_counts.copy(),
            "last_error_times": self.last_error_times.copy(),
            "total_errors": sum(self.error_counts.values())
        }
    
    def should_retry(self, operation: str, error: Exception) -> bool:
        """Determine if operation should be retried"""
        error_type = type(error).__name__
        key = f"{operation}:{error_type}"
        
        # Don't retry too frequently
        if key in self.last_error_times:
            time_since_last = time.time() - self.last_error_times[key]
            if time_since_last < 60:  # Less than 1 minute
                return False
        
        # Retry certain error types
        retryable_errors = [
            "APITimeoutError",
            "RateLimitError",
            "APIConnectionError"
        ]
        
        return error_type in retryable_errors


# Global error handler
ai_error_handler = AIErrorHandler()


def ai_operation_monitor(operation_name: str, max_retries: int = 3):
    """Decorator to monitor and handle AI operations"""
    
    def decorator(func: Callable) -> Callable:
        @functools.wraps(func)
        async def wrapper(*args, **kwargs):
            retries = 0
            last_error = None
            
            while retries <= max_retries:
                try:
                    start_time = time.time()
                    result = await func(*args, **kwargs)
                    duration = time.time() - start_time
                    
                    # Log successful operation
                    logger.info(
                        f"AI operation {operation_name} completed successfully",
                        extra={
                            "operation": operation_name,
                            "duration_seconds": round(duration, 2),
                            "retry_count": retries
                        }
                    )
                    
                    return result
                    
                except Exception as e:
                    last_error = e
                    
                    # Log error
                    ai_error_handler.log_error(
                        operation_name,
                        e,
                        {
                            "retry_count": retries,
                            "max_retries": max_retries,
                            "args_count": len(args),
                            "kwargs_keys": list(kwargs.keys())
                        }
                    )
                    
                    # Check if should retry
                    if retries < max_retries and ai_error_handler.should_retry(operation_name, e):
                        retries += 1
                        
                        # Exponential backoff
                        wait_time = min(2 ** retries, 30)  # Max 30 seconds
                        logger.info(f"Retrying {operation_name} in {wait_time} seconds (attempt {retries + 1})")
                        
                        import asyncio
                        await asyncio.sleep(wait_time)
                        continue
                    else:
                        # Don't retry, re-raise the error
                        break
            
            # If we get here, all retries failed
            logger.error(
                f"AI operation {operation_name} failed after {retries} retries",
                extra={
                    "operation": operation_name,
                    "final_error": str(last_error),
                    "retry_count": retries
                }
            )
            
            # Re-raise the last error
            raise last_error
        
        return wrapper
    return decorator


def get_fallback_response(operation: str, context: Dict[str, Any] = None) -> Dict[str, Any]:
    """Get fallback response when AI services are unavailable"""
    
    fallback_responses = {
        "parse_task": {
            "title": context.get("input_text", "")[:50] if context else "New Task",
            "description": None,
            "priority": "medium",
            "due_date": None,
            "estimated_hours": 4.0,
            "tags": [],
            "source": "fallback_parser"
        },
        
        "task_tags": {
            "tags": ["general"],
            "source": "fallback_tagger"
        },
        
        "priority_score": {
            "score": 5.0,
            "source": "fallback_scorer"
        },
        
        "time_estimate": {
            "estimated_hours": 4.0,
            "confidence": "low",
            "source": "fallback_estimator"
        },
        
        "assignee_suggestion": {
            "suggested_assignee": None,
            "reason": "AI service unavailable",
            "source": "fallback_suggester"
        }
    }
    
    response = fallback_responses.get(operation, {"error": "No fallback available"})
    response["fallback_used"] = True
    response["timestamp"] = time.time()
    
    logger.warning(
        f"Using fallback response for {operation}",
        extra={"operation": operation, "context": context}
    )
    
    return response


class CircuitBreaker:
    """Circuit breaker pattern for AI services"""
    
    def __init__(self, failure_threshold: int = 5, recovery_timeout: int = 300):
        self.failure_threshold = failure_threshold
        self.recovery_timeout = recovery_timeout
        self.failure_count = 0
        self.last_failure_time = None
        self.state = "closed"  # closed, open, half-open
    
    def call(self, func: Callable) -> Callable:
        """Wrap function with circuit breaker"""
        
        @functools.wraps(func)
        async def wrapper(*args, **kwargs):
            if self.state == "open":
                if self._should_attempt_reset():
                    self.state = "half-open"
                else:
                    raise Exception("Circuit breaker is open")
            
            try:
                result = await func(*args, **kwargs)
                self._on_success()
                return result
                
            except Exception as e:
                self._on_failure()
                raise e
        
        return wrapper
    
    def _should_attempt_reset(self) -> bool:
        """Check if enough time has passed to attempt reset"""
        if self.last_failure_time is None:
            return True
        
        return time.time() - self.last_failure_time >= self.recovery_timeout
    
    def _on_success(self):
        """Handle successful operation"""
        self.failure_count = 0
        self.state = "closed"
    
    def _on_failure(self):
        """Handle failed operation"""
        self.failure_count += 1
        self.last_failure_time = time.time()
        
        if self.failure_count >= self.failure_threshold:
            self.state = "open"
            logger.warning(
                f"Circuit breaker opened after {self.failure_count} failures"
            )


# Global circuit breaker for AI services
ai_circuit_breaker = CircuitBreaker()