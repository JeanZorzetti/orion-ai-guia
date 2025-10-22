from pydantic import BaseModel, EmailStr, Field
from datetime import datetime
from typing import Optional


class UserBase(BaseModel):
    """Base schema for User"""
    email: EmailStr
    full_name: str = Field(..., min_length=1, max_length=255)


class UserCreate(UserBase):
    """Schema for creating a new User"""
    password: str = Field(..., min_length=6, max_length=100)
    role: str = Field(default="user")


class UserUpdate(BaseModel):
    """Schema for updating a User"""
    full_name: Optional[str] = Field(None, min_length=1, max_length=255)
    role: Optional[str] = None
    active: Optional[bool] = None


class UserResponse(UserBase):
    """Schema for User response (without password)"""
    id: int
    workspace_id: int
    role: str
    active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class UserLogin(BaseModel):
    """Schema for user login"""
    email: EmailStr
    password: str


class Token(BaseModel):
    """Schema for JWT token response"""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    """Schema for JWT token data"""
    user_id: Optional[int] = None
    workspace_id: Optional[int] = None
    email: Optional[str] = None
