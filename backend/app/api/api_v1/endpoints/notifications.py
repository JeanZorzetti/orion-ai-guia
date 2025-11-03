"""
Notifications API endpoints.
Handles user notifications with CRUD operations and status management.
"""
from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc, and_, or_

from app.core.deps import get_current_user, get_db
from app.models.user import User
from app.models.notification import Notification, NotificationType, NotificationPriority
from pydantic import BaseModel, Field


router = APIRouter()


# ============================================================================
# Pydantic Schemas
# ============================================================================

class NotificationBase(BaseModel):
    """Base notification schema"""
    type: NotificationType
    priority: NotificationPriority = NotificationPriority.MEDIUM
    title: str = Field(..., min_length=1, max_length=200)
    message: str = Field(..., min_length=1)
    link: Optional[str] = Field(None, max_length=500)
    action_label: Optional[str] = Field(None, max_length=100)
    icon: Optional[str] = Field(None, max_length=50)
    related_entity_type: Optional[str] = Field(None, max_length=100)
    related_entity_id: Optional[int] = None


class NotificationCreate(NotificationBase):
    """Schema for creating a notification"""
    user_id: Optional[int] = None  # If None, notification is for current user
    expires_at: Optional[datetime] = None


class NotificationResponse(NotificationBase):
    """Schema for notification response"""
    id: int
    workspace_id: int
    user_id: int
    read: bool
    read_at: Optional[datetime]
    created_at: datetime
    expires_at: Optional[datetime]

    class Config:
        from_attributes = True


class NotificationUpdate(BaseModel):
    """Schema for updating a notification"""
    read: Optional[bool] = None


class NotificationStats(BaseModel):
    """Notification statistics"""
    total: int
    unread: int
    by_type: dict
    by_priority: dict


# ============================================================================
# Endpoints
# ============================================================================

@router.get("/", response_model=List[NotificationResponse])
def list_notifications(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    unread_only: bool = Query(False),
    type: Optional[NotificationType] = None,
    priority: Optional[NotificationPriority] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    List notifications for the current user.

    - **skip**: Number of records to skip (pagination)
    - **limit**: Maximum number of records to return
    - **unread_only**: Filter only unread notifications
    - **type**: Filter by notification type
    - **priority**: Filter by notification priority
    """
    query = db.query(Notification).filter(
        Notification.workspace_id == current_user.workspace_id,
        Notification.user_id == current_user.id
    )

    # Apply filters
    if unread_only:
        query = query.filter(Notification.read == False)

    if type:
        query = query.filter(Notification.type == type)

    if priority:
        query = query.filter(Notification.priority == priority)

    # Order by creation date (most recent first)
    query = query.order_by(desc(Notification.created_at))

    # Apply pagination
    notifications = query.offset(skip).limit(limit).all()

    return notifications


@router.get("/stats", response_model=NotificationStats)
def get_notification_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get notification statistics for the current user.
    """
    notifications = db.query(Notification).filter(
        Notification.workspace_id == current_user.workspace_id,
        Notification.user_id == current_user.id
    ).all()

    unread = sum(1 for n in notifications if not n.read)

    by_type = {}
    for type_value in NotificationType:
        count = sum(1 for n in notifications if n.type == type_value)
        if count > 0:
            by_type[type_value.value] = count

    by_priority = {}
    for priority_value in NotificationPriority:
        count = sum(1 for n in notifications if n.priority == priority_value)
        if count > 0:
            by_priority[priority_value.value] = count

    return NotificationStats(
        total=len(notifications),
        unread=unread,
        by_type=by_type,
        by_priority=by_priority
    )


@router.get("/{notification_id}", response_model=NotificationResponse)
def get_notification(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get a specific notification by ID.
    """
    notification = db.query(Notification).filter(
        Notification.id == notification_id,
        Notification.workspace_id == current_user.workspace_id,
        Notification.user_id == current_user.id
    ).first()

    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")

    return notification


@router.post("/", response_model=NotificationResponse)
def create_notification(
    notification_data: NotificationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Create a new notification.
    If user_id is not provided, notification is created for the current user.
    """
    # Determine target user
    target_user_id = notification_data.user_id if notification_data.user_id else current_user.id

    # Verify target user exists and belongs to same workspace
    if notification_data.user_id:
        target_user = db.query(User).filter(
            User.id == target_user_id,
            User.workspace_id == current_user.workspace_id
        ).first()

        if not target_user:
            raise HTTPException(status_code=404, detail="Target user not found in workspace")

    notification = Notification(
        workspace_id=current_user.workspace_id,
        user_id=target_user_id,
        type=notification_data.type,
        priority=notification_data.priority,
        title=notification_data.title,
        message=notification_data.message,
        link=notification_data.link,
        action_label=notification_data.action_label,
        icon=notification_data.icon,
        related_entity_type=notification_data.related_entity_type,
        related_entity_id=notification_data.related_entity_id,
        expires_at=notification_data.expires_at,
        read=False
    )

    db.add(notification)
    db.commit()
    db.refresh(notification)

    return notification


@router.put("/{notification_id}", response_model=NotificationResponse)
def update_notification(
    notification_id: int,
    notification_update: NotificationUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Update a notification (typically to mark as read/unread).
    """
    notification = db.query(Notification).filter(
        Notification.id == notification_id,
        Notification.workspace_id == current_user.workspace_id,
        Notification.user_id == current_user.id
    ).first()

    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")

    # Update read status
    if notification_update.read is not None:
        notification.read = notification_update.read
        notification.read_at = datetime.utcnow() if notification_update.read else None

    db.commit()
    db.refresh(notification)

    return notification


@router.post("/mark-all-read")
def mark_all_notifications_as_read(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Mark all unread notifications as read for the current user.
    """
    now = datetime.utcnow()

    updated_count = db.query(Notification).filter(
        Notification.workspace_id == current_user.workspace_id,
        Notification.user_id == current_user.id,
        Notification.read == False
    ).update({
        "read": True,
        "read_at": now
    }, synchronize_session=False)

    db.commit()

    return {
        "message": f"{updated_count} notifications marked as read",
        "count": updated_count
    }


@router.delete("/{notification_id}")
def delete_notification(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Delete a notification.
    """
    notification = db.query(Notification).filter(
        Notification.id == notification_id,
        Notification.workspace_id == current_user.workspace_id,
        Notification.user_id == current_user.id
    ).first()

    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")

    db.delete(notification)
    db.commit()

    return {"message": "Notification deleted successfully"}


@router.delete("/")
def delete_all_read_notifications(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Delete all read notifications for the current user.
    """
    deleted_count = db.query(Notification).filter(
        Notification.workspace_id == current_user.workspace_id,
        Notification.user_id == current_user.id,
        Notification.read == True
    ).delete(synchronize_session=False)

    db.commit()

    return {
        "message": f"{deleted_count} notifications deleted",
        "count": deleted_count
    }
