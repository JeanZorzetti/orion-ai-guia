from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional


class SupplierBase(BaseModel):
    """Base schema for Supplier"""
    name: str = Field(..., min_length=1, max_length=255)
    document: Optional[str] = Field(None, max_length=20)
    email: Optional[str] = Field(None, max_length=255)
    phone: Optional[str] = Field(None, max_length=20)
    address: Optional[str] = None
    city: Optional[str] = Field(None, max_length=100)
    state: Optional[str] = Field(None, max_length=2)
    zip_code: Optional[str] = Field(None, max_length=10)


class SupplierCreate(SupplierBase):
    """Schema for creating a new Supplier"""
    pass


class SupplierUpdate(BaseModel):
    """Schema for updating a Supplier"""
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    document: Optional[str] = Field(None, max_length=20)
    email: Optional[str] = Field(None, max_length=255)
    phone: Optional[str] = Field(None, max_length=20)
    address: Optional[str] = None
    city: Optional[str] = Field(None, max_length=100)
    state: Optional[str] = Field(None, max_length=2)
    zip_code: Optional[str] = Field(None, max_length=10)
    active: Optional[bool] = None


class SupplierResponse(SupplierBase):
    """Schema for Supplier response"""
    id: int
    workspace_id: int
    active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
