from pydantic import BaseModel, Field
from datetime import datetime, date
from typing import Optional


class SaleBase(BaseModel):
    """Base schema for Sale"""
    product_id: int
    customer_name: str = Field(..., min_length=1, max_length=255)
    customer_document: Optional[str] = Field(None, max_length=20)
    quantity: int = Field(..., gt=0)
    unit_price: float = Field(..., ge=0)
    total_value: float = Field(..., ge=0)
    sale_date: date


class SaleCreate(SaleBase):
    """Schema for creating a new Sale"""
    pass


class SaleUpdate(BaseModel):
    """Schema for updating a Sale"""
    product_id: Optional[int] = None
    customer_name: Optional[str] = Field(None, min_length=1, max_length=255)
    customer_document: Optional[str] = Field(None, max_length=20)
    quantity: Optional[int] = Field(None, gt=0)
    unit_price: Optional[float] = Field(None, ge=0)
    total_value: Optional[float] = Field(None, ge=0)
    status: Optional[str] = Field(None, pattern="^(pending|completed|cancelled)$")
    sale_date: Optional[date] = None


class SaleResponse(SaleBase):
    """Schema for Sale response"""
    id: int
    workspace_id: int
    status: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
