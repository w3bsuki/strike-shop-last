"""
Cache service for AI responses and general caching needs
"""

import json
import hashlib
from typing import Any, Optional, Union
import redis.asyncio as redis
from datetime import timedelta
import logging

from app.core.config import settings

logger = logging.getLogger(__name__)


class CacheService:
    def __init__(self):
        self.redis_client = None
        self._initialize_redis()
    
    def _initialize_redis(self):
        """Initialize Redis connection"""
        try:
            self.redis_client = redis.from_url(
                settings.REDIS_URL,
                encoding="utf-8",
                decode_responses=True
            )
            logger.info("Redis cache service initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize Redis cache service: {e}")
            self.redis_client = None
    
    def _generate_key(self, namespace: str, identifier: Union[str, dict]) -> str:
        """Generate a cache key with namespace"""
        if isinstance(identifier, dict):
            # Sort keys for consistent hashing
            identifier_str = json.dumps(identifier, sort_keys=True)
        else:
            identifier_str = str(identifier)
        
        # Create hash for long identifiers
        if len(identifier_str) > 200:
            hash_digest = hashlib.sha256(identifier_str.encode()).hexdigest()
            return f"{namespace}:{hash_digest}"
        
        return f"{namespace}:{identifier_str}"
    
    async def get(self, namespace: str, identifier: Union[str, dict]) -> Optional[Any]:
        """Get value from cache"""
        if not self.redis_client:
            return None
        
        try:
            key = self._generate_key(namespace, identifier)
            value = await self.redis_client.get(key)
            
            if value:
                try:
                    # Try to parse as JSON
                    return json.loads(value)
                except json.JSONDecodeError:
                    # Return as string if not JSON
                    return value
            
            return None
            
        except Exception as e:
            logger.error(f"Cache get error: {e}")
            return None
    
    async def set(
        self, 
        namespace: str, 
        identifier: Union[str, dict], 
        value: Any,
        ttl: Optional[int] = None
    ) -> bool:
        """Set value in cache with optional TTL (in seconds)"""
        if not self.redis_client:
            return False
        
        try:
            key = self._generate_key(namespace, identifier)
            
            # Convert value to JSON if it's not a string
            if not isinstance(value, str):
                value = json.dumps(value)
            
            if ttl:
                await self.redis_client.setex(key, ttl, value)
            else:
                await self.redis_client.set(key, value)
            
            return True
            
        except Exception as e:
            logger.error(f"Cache set error: {e}")
            return False
    
    async def delete(self, namespace: str, identifier: Union[str, dict]) -> bool:
        """Delete value from cache"""
        if not self.redis_client:
            return False
        
        try:
            key = self._generate_key(namespace, identifier)
            result = await self.redis_client.delete(key)
            return result > 0
            
        except Exception as e:
            logger.error(f"Cache delete error: {e}")
            return False
    
    async def exists(self, namespace: str, identifier: Union[str, dict]) -> bool:
        """Check if key exists in cache"""
        if not self.redis_client:
            return False
        
        try:
            key = self._generate_key(namespace, identifier)
            return await self.redis_client.exists(key) > 0
            
        except Exception as e:
            logger.error(f"Cache exists error: {e}")
            return False
    
    async def clear_namespace(self, namespace: str) -> int:
        """Clear all keys in a namespace"""
        if not self.redis_client:
            return 0
        
        try:
            pattern = f"{namespace}:*"
            keys = []
            
            # Use SCAN to avoid blocking on large datasets
            async for key in self.redis_client.scan_iter(match=pattern, count=100):
                keys.append(key)
            
            if keys:
                return await self.redis_client.delete(*keys)
            
            return 0
            
        except Exception as e:
            logger.error(f"Cache clear namespace error: {e}")
            return 0
    
    async def increment(
        self, 
        namespace: str, 
        identifier: Union[str, dict],
        amount: int = 1
    ) -> Optional[int]:
        """Increment a counter in cache"""
        if not self.redis_client:
            return None
        
        try:
            key = self._generate_key(namespace, identifier)
            return await self.redis_client.incrby(key, amount)
            
        except Exception as e:
            logger.error(f"Cache increment error: {e}")
            return None
    
    async def get_ttl(self, namespace: str, identifier: Union[str, dict]) -> Optional[int]:
        """Get remaining TTL for a key in seconds"""
        if not self.redis_client:
            return None
        
        try:
            key = self._generate_key(namespace, identifier)
            ttl = await self.redis_client.ttl(key)
            return ttl if ttl >= 0 else None
            
        except Exception as e:
            logger.error(f"Cache get TTL error: {e}")
            return None
    
    async def close(self):
        """Close Redis connection"""
        if self.redis_client:
            await self.redis_client.close()


# Global cache service instance
cache_service = CacheService()