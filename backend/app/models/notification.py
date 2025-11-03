"""
Notification models for the ERP system.
Handles user notifications with support for different types and priority levels.
"""
from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text, Enum as SQLEnum
from sqlalchemy.orm import relationship
from app.core.database import Base
import enum


class NotificationType(str, enum.Enum):
    """Notification type enumeration"""
    ALERT = "alert"  # Critical alerts (e.g., overdue payments)
    WARNING = "warning"  # Warnings (e.g., low stock)
    INFO = "info"  # General information
    SUCCESS = "success"  # Success messages (e.g., goals achieved)


class NotificationPriority(str, enum.Enum):
    """Notification priority enumeration"""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"


class Notification(Base):
    """
    Notification model - User notifications
    Represents system notifications sent to users
    """
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    workspace_id = Column(Integer, ForeignKey("workspaces.id"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)

    # Notification details
    type = Column(SQLEnum(NotificationType), nullable=False, default=NotificationType.INFO)
    priority = Column(SQLEnum(NotificationPriority), nullable=False, default=NotificationPriority.MEDIUM)
    title = Column(String(200), nullable=False)
    message = Column(Text, nullable=False)

    # Status
    read = Column(Boolean, default=False, nullable=False, index=True)
    read_at = Column(DateTime, nullable=True)

    # Optional link/action
    link = Column(String(500), nullable=True)  # URL to navigate when clicking notification
    action_label = Column(String(100), nullable=True)  # Label for action button

    # Metadata
    icon = Column(String(50), nullable=True)  # Icon identifier (e.g., 'DollarSign', 'Package')
    metadata = Column(Text, nullable=True)  # JSON string for additional data

    # Related entity (optional)
    related_entity_type = Column(String(100), nullable=True)  # e.g., 'accounts_payable', 'product'
    related_entity_id = Column(Integer, nullable=True)

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    expires_at = Column(DateTime, nullable=True)  # Optional expiration date

    # Relationships
    workspace = relationship("Workspace", back_populates="notifications")
    user = relationship("User", back_populates="notifications")

    def __repr__(self):
        return f"<Notification(id={self.id}, type={self.type}, title={self.title}, user_id={self.user_id}, read={self.read})>"
