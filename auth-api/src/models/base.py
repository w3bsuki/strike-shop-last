"""
Base model classes with common functionality and security considerations.
Implements audit trails, soft deletes, and performance optimizations.
"""

import uuid
from datetime import datetime
from typing import Any, Dict, Optional
from sqlalchemy import Column, String, DateTime, Boolean, Text, func
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.ext.declarative import declarative_base, declared_attr
from sqlalchemy.orm import Session


class TimestampMixin:
    """Mixin for automatic timestamp management."""
    
    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
        comment="Record creation timestamp"
    )
    
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
        comment="Record last update timestamp"
    )


class SoftDeleteMixin:
    """Mixin for soft delete functionality."""
    
    deleted_at = Column(
        DateTime(timezone=True),
        nullable=True,
        comment="Soft delete timestamp"
    )
    
    is_deleted = Column(
        Boolean,
        default=False,
        nullable=False,
        index=True,
        comment="Soft delete flag for query optimization"
    )
    
    def soft_delete(self):
        """Mark record as deleted."""
        self.deleted_at = datetime.utcnow()
        self.is_deleted = True
    
    def restore(self):
        """Restore soft-deleted record."""
        self.deleted_at = None
        self.is_deleted = False


class AuditMixin:
    """Mixin for audit trail functionality."""
    
    created_by = Column(
        UUID(as_uuid=True),
        nullable=True,
        comment="User who created the record"
    )
    
    updated_by = Column(
        UUID(as_uuid=True),
        nullable=True,
        comment="User who last updated the record"
    )
    
    version = Column(
        Integer,
        default=1,
        nullable=False,
        comment="Optimistic locking version"
    )


class MetadataMixin:
    """Mixin for flexible metadata storage."""
    
    metadata = Column(
        JSONB,
        default=dict,
        nullable=False,
        comment="Flexible metadata storage"
    )
    
    def set_metadata(self, key: str, value: Any):
        """Set metadata value."""
        if self.metadata is None:
            self.metadata = {}
        self.metadata[key] = value
    
    def get_metadata(self, key: str, default: Any = None):
        """Get metadata value."""
        if self.metadata is None:
            return default
        return self.metadata.get(key, default)


class BaseModel(TimestampMixin, SoftDeleteMixin):
    """Base model with common functionality."""
    
    @declared_attr
    def __tablename__(cls) -> str:
        """Generate table name from class name."""
        return cls.__name__.lower() + 's'
    
    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        nullable=False,
        comment="Primary key UUID"
    )
    
    def to_dict(self, exclude: Optional[set] = None) -> Dict[str, Any]:
        """Convert model to dictionary."""
        exclude = exclude or set()
        return {
            column.name: getattr(self, column.name)
            for column in self.__table__.columns
            if column.name not in exclude
        }
    
    def update_from_dict(self, data: Dict[str, Any], exclude: Optional[set] = None):
        """Update model from dictionary."""
        exclude = exclude or {'id', 'created_at', 'updated_at'}
        for key, value in data.items():
            if key not in exclude and hasattr(self, key):
                setattr(self, key, value)
    
    def __repr__(self) -> str:
        """String representation of the model."""
        return f"<{self.__class__.__name__}(id={self.id})>"


# Declarative base for all models
Base = declarative_base(cls=BaseModel)