from pydantic import BaseModel, Field
from datetime import datetime, date
from typing import Optional


class InvoiceBase(BaseModel):
    """Base schema for Invoice"""
    invoice_number: str = Field(..., min_length=1, max_length=100)
    invoice_date: date
    due_date: Optional[date] = None
    total_value: float = Field(..., ge=0)
    net_value: Optional[float] = Field(None, ge=0)
    tax_value: Optional[float] = Field(None, ge=0)
    category: Optional[str] = Field(None, max_length=100)
    description: Optional[str] = None
    supplier_id: Optional[int] = None


class InvoiceCreate(InvoiceBase):
    """Schema for creating a new Invoice"""
    pass


class InvoiceUpdate(BaseModel):
    """Schema for updating an Invoice"""
    invoice_number: Optional[str] = Field(None, min_length=1, max_length=100)
    invoice_date: Optional[date] = None
    due_date: Optional[date] = None
    total_value: Optional[float] = Field(None, ge=0)
    net_value: Optional[float] = Field(None, ge=0)
    tax_value: Optional[float] = Field(None, ge=0)
    category: Optional[str] = Field(None, max_length=100)
    status: Optional[str] = Field(None, pattern="^(pending|validated|paid|cancelled)$")
    description: Optional[str] = None
    supplier_id: Optional[int] = None


class InvoiceResponse(InvoiceBase):
    """Schema for Invoice response"""
    id: int
    workspace_id: int
    status: str
    file_path: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
