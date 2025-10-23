from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional


class ProductBase(BaseModel):
    """Base schema for Product"""
    name: str = Field(..., min_length=1, max_length=255)
    sku: Optional[str] = Field(None, max_length=100)
    description: Optional[str] = None
    category: Optional[str] = Field(None, max_length=100)
    cost_price: Optional[float] = Field(None, ge=0)
    sale_price: float = Field(..., ge=0)
    stock_quantity: int = Field(default=0, ge=0)
    min_stock_level: int = Field(default=0, ge=0)
    unit: str = Field(default="un", max_length=10)


class ProductCreate(ProductBase):
    """Schema for creating a new Product"""
    pass


class ProductUpdate(BaseModel):
    """Schema for updating a Product"""
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    sku: Optional[str] = Field(None, max_length=100)
    description: Optional[str] = None
    category: Optional[str] = Field(None, max_length=100)
    cost_price: Optional[float] = Field(None, ge=0)
    sale_price: Optional[float] = Field(None, ge=0)
    stock_quantity: Optional[int] = Field(None, ge=0)
    min_stock_level: Optional[int] = Field(None, ge=0)
    unit: Optional[str] = Field(None, max_length=10)
    active: Optional[bool] = None


class ProductResponse(ProductBase):
    """Schema for Product response"""
    id: int
    workspace_id: int
    active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
