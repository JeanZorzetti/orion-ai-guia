from pydantic import BaseModel, Field
from datetime import datetime, date
from typing import Optional, List, Dict, Any


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


# Schemas for AI Invoice Extraction

class ConfidenceScores(BaseModel):
    """Confidence scores for each extracted field"""
    invoice_number: float = Field(..., ge=0.0, le=1.0)
    supplier_name: float = Field(..., ge=0.0, le=1.0)
    total_value: float = Field(..., ge=0.0, le=1.0)
    due_date: float = Field(..., ge=0.0, le=1.0)
    invoice_date: float = Field(0.0, ge=0.0, le=1.0)


class SupplierMatch(BaseModel):
    """Supplier matching result"""
    id: int
    name: str
    cnpj: Optional[str] = None
    score: float = Field(..., ge=0.0, le=100.0)
    match_reason: str
    match_type: str


class ExtractedData(BaseModel):
    """Data extracted from invoice by AI"""
    invoice_number: str = ""
    supplier_name: str = ""
    supplier_cnpj: Optional[str] = None
    supplier_matches: List[SupplierMatch] = []
    total_value: float = 0.0
    tax_value: float = 0.0
    net_value: float = 0.0
    due_date: Optional[str] = None  # Format: YYYY-MM-DD
    invoice_date: Optional[str] = None  # Format: YYYY-MM-DD
    category: Optional[str] = None
    description: Optional[str] = None
    confidence: ConfidenceScores


class ExtractionSuggestions(BaseModel):
    """Suggestions from the AI extraction"""
    supplier_id: Optional[int] = None  # Top match supplier ID
    needs_review: bool = False  # True if any confidence < 0.8
    warnings: List[str] = []


class InvoiceExtractionResponse(BaseModel):
    """Response from invoice upload and extraction endpoint"""
    extracted_data: ExtractedData
    suggestions: ExtractionSuggestions
    processing_time_ms: int
    success: bool = True
    error: Optional[str] = None
