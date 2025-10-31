from pydantic import BaseModel, EmailStr, Field, validator
from typing import Optional, List, Dict, Any
from datetime import datetime, date
from enum import Enum


# ==================== ENUMS ====================

class InvoiceStatus(str, Enum):
    PENDING = "pending"
    VALIDATED = "validated"
    APPROVED = "approved"
    PAID = "paid"
    CANCELLED = "cancelled"
    OVERDUE = "overdue"


class PaymentMethod(str, Enum):
    BANK_TRANSFER = "bank_transfer"
    CHECK = "check"
    CASH = "cash"
    CREDIT_CARD = "credit_card"
    DEBIT_CARD = "debit_card"
    PIX = "pix"
    BOLETO = "boleto"
    OTHER = "other"


# ==================== SUPPLIER SCHEMAS ====================

class SupplierBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    legal_name: Optional[str] = Field(None, max_length=255)
    cnpj: Optional[str] = Field(None, max_length=18)
    cpf: Optional[str] = Field(None, max_length=14)

    email: Optional[EmailStr] = None
    phone: Optional[str] = Field(None, max_length=20)
    mobile: Optional[str] = Field(None, max_length=20)

    address_street: Optional[str] = Field(None, max_length=255)
    address_number: Optional[str] = Field(None, max_length=20)
    address_complement: Optional[str] = Field(None, max_length=100)
    address_neighborhood: Optional[str] = Field(None, max_length=100)
    address_city: Optional[str] = Field(None, max_length=100)
    address_state: Optional[str] = Field(None, max_length=2)
    address_zipcode: Optional[str] = Field(None, max_length=10)

    bank_name: Optional[str] = Field(None, max_length=100)
    bank_code: Optional[str] = Field(None, max_length=10)
    agency: Optional[str] = Field(None, max_length=20)
    account_number: Optional[str] = Field(None, max_length=30)
    account_type: Optional[str] = Field(None, max_length=20)
    pix_key: Optional[str] = Field(None, max_length=255)
    pix_key_type: Optional[str] = Field(None, max_length=20)

    payment_term_days: int = Field(default=30, ge=0)
    credit_limit: float = Field(default=0, ge=0)
    discount_percentage: float = Field(default=0, ge=0, le=100)

    is_active: bool = True
    notes: Optional[str] = None
    tags: Optional[Dict[str, Any]] = None


class SupplierCreate(SupplierBase):
    pass


class SupplierUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    legal_name: Optional[str] = Field(None, max_length=255)
    cnpj: Optional[str] = Field(None, max_length=18)
    cpf: Optional[str] = Field(None, max_length=14)

    email: Optional[EmailStr] = None
    phone: Optional[str] = Field(None, max_length=20)
    mobile: Optional[str] = Field(None, max_length=20)

    address_street: Optional[str] = Field(None, max_length=255)
    address_number: Optional[str] = Field(None, max_length=20)
    address_complement: Optional[str] = Field(None, max_length=100)
    address_neighborhood: Optional[str] = Field(None, max_length=100)
    address_city: Optional[str] = Field(None, max_length=100)
    address_state: Optional[str] = Field(None, max_length=2)
    address_zipcode: Optional[str] = Field(None, max_length=10)

    bank_name: Optional[str] = Field(None, max_length=100)
    bank_code: Optional[str] = Field(None, max_length=10)
    agency: Optional[str] = Field(None, max_length=20)
    account_number: Optional[str] = Field(None, max_length=30)
    account_type: Optional[str] = Field(None, max_length=20)
    pix_key: Optional[str] = Field(None, max_length=255)
    pix_key_type: Optional[str] = Field(None, max_length=20)

    payment_term_days: Optional[int] = Field(None, ge=0)
    credit_limit: Optional[float] = Field(None, ge=0)
    discount_percentage: Optional[float] = Field(None, ge=0, le=100)

    is_active: Optional[bool] = None
    notes: Optional[str] = None
    tags: Optional[Dict[str, Any]] = None


class Supplier(SupplierBase):
    id: int
    workspace_id: int
    created_by: Optional[int]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ==================== INVOICE SCHEMAS ====================

class InvoiceBase(BaseModel):
    supplier_id: int
    invoice_number: str = Field(..., min_length=1, max_length=100)
    invoice_key: Optional[str] = Field(None, max_length=44)

    invoice_date: date
    due_date: date
    payment_date: Optional[date] = None

    gross_value: float = Field(..., gt=0)
    discount_percentage: float = Field(default=0, ge=0, le=100)
    discount_value: float = Field(default=0, ge=0)
    discount_available_until: Optional[date] = None
    additional_charges: float = Field(default=0, ge=0)
    total_value: float = Field(..., gt=0)
    paid_value: float = Field(default=0, ge=0)

    payment_method: Optional[PaymentMethod] = None
    payment_reference: Optional[str] = Field(None, max_length=255)
    bank_account_id: Optional[int] = None

    status: InvoiceStatus = InvoiceStatus.PENDING

    category: Optional[str] = Field(None, max_length=100)
    subcategory: Optional[str] = Field(None, max_length=100)
    cost_center: Optional[str] = Field(None, max_length=100)
    project_code: Optional[str] = Field(None, max_length=100)

    is_recurring: bool = False
    recurrence_rule: Optional[Dict[str, Any]] = None
    parent_invoice_id: Optional[int] = None

    attachments: Optional[List[str]] = None
    notes: Optional[str] = None
    tags: Optional[Dict[str, Any]] = None

    reference_type: Optional[str] = Field(None, max_length=50)
    reference_id: Optional[int] = None

    @validator('total_value')
    def validate_total_value(cls, v, values):
        if 'gross_value' in values:
            gross = values['gross_value']
            discount = values.get('discount_value', 0)
            charges = values.get('additional_charges', 0)
            expected_total = gross - discount + charges
            if abs(v - expected_total) > 0.01:  # Tolerância de 1 centavo
                raise ValueError(f'Total value must equal gross_value - discount + charges')
        return v


class InvoiceCreate(InvoiceBase):
    pass


class InvoiceUpdate(BaseModel):
    supplier_id: Optional[int] = None
    invoice_number: Optional[str] = Field(None, min_length=1, max_length=100)
    invoice_key: Optional[str] = Field(None, max_length=44)

    invoice_date: Optional[date] = None
    due_date: Optional[date] = None
    payment_date: Optional[date] = None

    gross_value: Optional[float] = Field(None, gt=0)
    discount_percentage: Optional[float] = Field(None, ge=0, le=100)
    discount_value: Optional[float] = Field(None, ge=0)
    discount_available_until: Optional[date] = None
    additional_charges: Optional[float] = Field(None, ge=0)
    total_value: Optional[float] = Field(None, gt=0)
    paid_value: Optional[float] = Field(None, ge=0)

    payment_method: Optional[PaymentMethod] = None
    payment_reference: Optional[str] = Field(None, max_length=255)
    bank_account_id: Optional[int] = None

    status: Optional[InvoiceStatus] = None

    category: Optional[str] = Field(None, max_length=100)
    subcategory: Optional[str] = Field(None, max_length=100)
    cost_center: Optional[str] = Field(None, max_length=100)
    project_code: Optional[str] = Field(None, max_length=100)

    is_recurring: Optional[bool] = None
    recurrence_rule: Optional[Dict[str, Any]] = None

    attachments: Optional[List[str]] = None
    notes: Optional[str] = None
    tags: Optional[Dict[str, Any]] = None

    reference_type: Optional[str] = Field(None, max_length=50)
    reference_id: Optional[int] = None


class Invoice(InvoiceBase):
    id: int
    workspace_id: int
    approved_by: Optional[int]
    approved_at: Optional[datetime]
    approval_notes: Optional[str]
    created_by: Optional[int]
    created_at: datetime
    updated_at: datetime

    # Relacionamentos
    supplier: Optional[Supplier] = None

    class Config:
        from_attributes = True


# ==================== PAYMENT SCHEMAS ====================

class PaymentCreate(BaseModel):
    amount: float = Field(..., gt=0)
    payment_date: datetime = Field(default_factory=datetime.utcnow)
    payment_method: PaymentMethod
    payment_reference: Optional[str] = Field(None, max_length=255)
    bank_account_id: Optional[int] = None
    notes: Optional[str] = None


class Payment(BaseModel):
    id: int
    invoice_id: int
    payment_date: datetime
    amount: float
    payment_method: PaymentMethod
    payment_reference: Optional[str]
    bank_account_id: Optional[int]
    notes: Optional[str]
    created_by: Optional[int]
    created_at: datetime

    class Config:
        from_attributes = True


# ==================== ANALYTICS SCHEMAS ====================

class APAnalyticsSummary(BaseModel):
    """Resumo de Analytics de Contas a Pagar"""
    total_to_pay: float
    total_overdue: float
    total_due_this_month: float
    total_paid_this_month: float
    count_open: int
    count_overdue: int
    count_paid_this_month: int
    avg_payment_days: float
    dpo: float  # Days Payable Outstanding


class APAgingBucket(BaseModel):
    """Bucket de aging de contas a pagar"""
    range: str
    count: int
    total_value: float
    percentage: float


class APAgingReport(BaseModel):
    """Relatório de aging de contas a pagar"""
    report_date: str
    total_payables: float
    buckets: List[APAgingBucket]


class SupplierSummary(BaseModel):
    """Resumo de fornecedor"""
    supplier_id: int
    supplier_name: str
    total_open: float
    total_overdue: float
    count_invoices: int
    avg_payment_days: float


class APCategoryAnalysis(BaseModel):
    """Análise por categoria"""
    category: str
    total_value: float
    count: int
    percentage: float


class APCompleteAnalytics(BaseModel):
    """Analytics completo de Contas a Pagar"""
    summary: APAnalyticsSummary
    aging_report: APAgingReport
    top_suppliers: List[SupplierSummary]
    by_category: List[APCategoryAnalysis]
