from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, List, Dict, Any


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


# Schemas for Demand Forecasting

class ProductInfo(BaseModel):
    """Product information for forecast"""
    id: int
    name: str
    current_stock: int
    min_stock_level: int


class HistoricalDataPoint(BaseModel):
    """Historical sales data point"""
    period: str  # Format: YYYY-Www
    units_sold: int
    date_start: str  # Format: YYYY-MM-DD


class ForecastDataPoint(BaseModel):
    """Forecast data point"""
    period: str  # Format: YYYY-Www
    predicted_units: float
    lower_bound: float
    upper_bound: float
    confidence: float = Field(..., ge=0.0, le=1.0)
    date_start: str  # Format: YYYY-MM-DD


class Alert(BaseModel):
    """Alert for demand insights"""
    type: str  # warning, info, error
    severity: str  # high, medium, low
    message: str
    action: str


class DemandInsights(BaseModel):
    """Insights from demand analysis"""
    trend: str  # increasing, stable, decreasing
    trend_percentage: float
    seasonality_detected: bool
    avg_weekly_demand: float
    recommended_stock_level: int
    reorder_point: int
    stock_coverage_weeks: float
    total_forecast_4weeks: float
    alerts: List[Alert]


class ModelInfo(BaseModel):
    """Information about the forecasting model"""
    model_used: str
    data_points: int
    training_period: str
    mape: float  # Mean Absolute Percentage Error
    rmse: float  # Root Mean Square Error
    last_updated: str


class DemandForecastResponse(BaseModel):
    """Response for demand forecast endpoint"""
    success: bool
    product: Optional[ProductInfo] = None
    historical: List[HistoricalDataPoint] = []
    forecast: List[ForecastDataPoint] = []
    insights: Optional[DemandInsights] = None
    model_info: Optional[ModelInfo] = None
    error: Optional[str] = None
    data_points: Optional[int] = None
