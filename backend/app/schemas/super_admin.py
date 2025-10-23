from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime


# Workspace Schemas
class WorkspaceBase(BaseModel):
    name: str
    active: Optional[bool] = True


class WorkspaceCreate(WorkspaceBase):
    pass


class WorkspaceUpdate(BaseModel):
    name: Optional[str] = None
    active: Optional[bool] = None


class WorkspaceResponse(WorkspaceBase):
    id: int
    created_at: datetime
    updated_at: datetime
    user_count: Optional[int] = 0

    class Config:
        from_attributes = True


# User Management Schemas (for Super Admin)
class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    role: str = "user"


class UserCreateByAdmin(UserBase):
    password: str
    workspace_id: int
    active: Optional[bool] = True


class UserUpdateByAdmin(BaseModel):
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    role: Optional[str] = None
    active: Optional[bool] = None
    workspace_id: Optional[int] = None


class UserResponseAdmin(UserBase):
    id: int
    workspace_id: int
    active: bool
    created_at: datetime
    updated_at: datetime
    workspace_name: Optional[str] = None

    class Config:
        from_attributes = True


# Statistics
class SystemStats(BaseModel):
    total_workspaces: int
    active_workspaces: int
    total_users: int
    active_users: int
    total_invoices: int
    total_products: int
