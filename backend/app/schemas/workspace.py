from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional


class WorkspaceBase(BaseModel):
    """Base schema for Workspace"""
    name: str = Field(..., min_length=1, max_length=255)
    slug: str = Field(..., min_length=1, max_length=255)


class WorkspaceCreate(WorkspaceBase):
    """Schema for creating a new Workspace"""
    pass


class WorkspaceUpdate(BaseModel):
    """Schema for updating a Workspace"""
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    active: Optional[bool] = None


class WorkspaceResponse(WorkspaceBase):
    """Schema for Workspace response"""
    id: int
    active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
