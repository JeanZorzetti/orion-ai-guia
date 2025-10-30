from pydantic import BaseModel, Field, validator
from datetime import datetime, date
from typing import Optional, List, Dict, Any


class AccountsReceivableBase(BaseModel):
    """Base schema for Accounts Receivable"""
    document_number: str = Field(..., min_length=1, max_length=100, description="Número do documento (NF, Boleto, etc.)")
    customer_name: str = Field(..., min_length=1, max_length=255, description="Nome do cliente")
    customer_document: Optional[str] = Field(None, max_length=20, description="CPF/CNPJ do cliente")
    customer_email: Optional[str] = Field(None, max_length=255)
    customer_phone: Optional[str] = Field(None, max_length=20)
    issue_date: date = Field(..., description="Data de emissão")
    due_date: date = Field(..., description="Data de vencimento")
    value: float = Field(..., gt=0, description="Valor total")
    description: Optional[str] = Field(None, description="Descrição da conta a receber")
    notes: Optional[str] = Field(None, description="Observações gerais")
    internal_notes: Optional[str] = Field(None, description="Notas internas (não visíveis ao cliente)")
    payment_method: Optional[str] = Field(None, max_length=50, description="Método de pagamento")
    payment_account: Optional[str] = Field(None, max_length=100, description="Conta bancária")
    category: Optional[str] = Field(None, max_length=100, description="Categoria")
    subcategory: Optional[str] = Field(None, max_length=100, description="Subcategoria")
    tags: Optional[List[str]] = Field(None, description="Tags para filtros")
    sale_id: Optional[int] = Field(None, description="ID da venda relacionada")
    invoice_id: Optional[int] = Field(None, description="ID da nota fiscal relacionada")
    is_installment: bool = Field(False, description="É parcelamento?")
    installment_number: Optional[int] = Field(None, ge=1, description="Número da parcela")
    total_installments: Optional[int] = Field(None, ge=1, description="Total de parcelas")
    parent_receivable_id: Optional[int] = Field(None, description="ID da conta a receber principal")

    @validator('due_date')
    def due_date_must_be_after_issue_date(cls, v, values):
        if 'issue_date' in values and v < values['issue_date']:
            raise ValueError('Data de vencimento deve ser posterior à data de emissão')
        return v

    @validator('installment_number')
    def validate_installment_number(cls, v, values):
        if v is not None and 'total_installments' in values:
            total = values.get('total_installments')
            if total and v > total:
                raise ValueError('Número da parcela não pode ser maior que o total de parcelas')
        return v


class AccountsReceivableCreate(AccountsReceivableBase):
    """Schema for creating a new Accounts Receivable"""
    pass


class AccountsReceivableUpdate(BaseModel):
    """Schema for updating an Accounts Receivable"""
    document_number: Optional[str] = Field(None, min_length=1, max_length=100)
    customer_name: Optional[str] = Field(None, min_length=1, max_length=255)
    customer_document: Optional[str] = Field(None, max_length=20)
    customer_email: Optional[str] = Field(None, max_length=255)
    customer_phone: Optional[str] = Field(None, max_length=20)
    issue_date: Optional[date] = None
    due_date: Optional[date] = None
    payment_date: Optional[date] = None
    value: Optional[float] = Field(None, gt=0)
    paid_value: Optional[float] = Field(None, ge=0)
    discount_value: Optional[float] = Field(None, ge=0)
    interest_value: Optional[float] = Field(None, ge=0)
    net_value: Optional[float] = Field(None, ge=0)
    status: Optional[str] = Field(
        None,
        pattern="^(pendente|parcial|recebido|vencido|cancelado|em_negociacao)$"
    )
    risk_category: Optional[str] = Field(
        None,
        pattern="^(excelente|bom|regular|ruim|critico)$"
    )
    days_overdue: Optional[int] = Field(None, ge=0)
    payment_method: Optional[str] = Field(None, max_length=50)
    payment_account: Optional[str] = Field(None, max_length=100)
    description: Optional[str] = None
    notes: Optional[str] = None
    internal_notes: Optional[str] = None
    category: Optional[str] = Field(None, max_length=100)
    subcategory: Optional[str] = Field(None, max_length=100)
    tags: Optional[List[str]] = None
    sale_id: Optional[int] = None
    invoice_id: Optional[int] = None


class AccountsReceivableResponse(AccountsReceivableBase):
    """Schema for Accounts Receivable response"""
    id: int
    workspace_id: int
    payment_date: Optional[date] = None
    paid_value: float
    discount_value: float
    interest_value: float
    net_value: Optional[float] = None
    status: str
    risk_category: Optional[str] = None
    days_overdue: int
    is_installment: bool
    installment_number: Optional[int] = None
    total_installments: Optional[int] = None
    parent_receivable_id: Optional[int] = None
    last_reminder_sent: Optional[datetime] = None
    reminder_count: int
    created_by: Optional[int] = None
    updated_by: Optional[int] = None
    created_at: datetime
    updated_at: datetime

    # Computed fields
    remaining_value: Optional[float] = None
    payment_percentage: Optional[float] = None
    is_overdue: Optional[bool] = None
    is_fully_paid: Optional[bool] = None

    class Config:
        from_attributes = True


class ReceivePaymentRequest(BaseModel):
    """Schema for registering a payment"""
    paid_value: float = Field(..., gt=0, description="Valor pago")
    payment_date: date = Field(..., description="Data do pagamento")
    payment_method: Optional[str] = Field(None, max_length=50, description="Método de pagamento")
    payment_account: Optional[str] = Field(None, max_length=100, description="Conta bancária")
    discount_value: Optional[float] = Field(0.0, ge=0, description="Desconto aplicado")
    interest_value: Optional[float] = Field(0.0, ge=0, description="Juros/multa")
    notes: Optional[str] = Field(None, description="Observações sobre o pagamento")


class PartialPaymentRequest(BaseModel):
    """Schema for partial payment"""
    partial_value: float = Field(..., gt=0, description="Valor parcial pago")
    payment_date: date = Field(..., description="Data do pagamento parcial")
    payment_method: Optional[str] = Field(None, max_length=50)
    payment_account: Optional[str] = Field(None, max_length=100)
    notes: Optional[str] = Field(None, description="Observações")


# Analytics Schemas

class ARAnalyticsSummary(BaseModel):
    """Summary analytics for Accounts Receivable"""
    total_to_receive: float = Field(..., description="Total a receber")
    total_received: float = Field(..., description="Total recebido")
    total_overdue: float = Field(..., description="Total vencido")
    overdue_count: int = Field(..., description="Quantidade vencidas")
    pending_count: int = Field(..., description="Quantidade pendentes")
    average_days_to_receive: float = Field(..., description="Média de dias para recebimento (DSO)")
    default_rate: float = Field(..., description="Taxa de inadimplência (%)")
    total_by_status: Dict[str, float] = Field(..., description="Total por status")
    total_by_risk: Dict[str, float] = Field(..., description="Total por risco")


class AgingBucket(BaseModel):
    """Aging bucket for receivables"""
    range: str = Field(..., description="Faixa de dias (ex: 0-30 dias)")
    min_days: int = Field(..., description="Mínimo de dias")
    max_days: Optional[int] = Field(None, description="Máximo de dias (None para 90+)")
    value: float = Field(..., description="Valor total na faixa")
    count: int = Field(..., description="Quantidade de contas na faixa")
    percentage: float = Field(..., description="Percentual do total")


class ARAgingReport(BaseModel):
    """Aging report for Accounts Receivable"""
    total_value: float
    buckets: List[AgingBucket]
    generated_at: datetime


class CustomerReceivablesSummary(BaseModel):
    """Summary of receivables by customer"""
    customer_name: str
    customer_document: Optional[str] = None
    total_receivables: int
    total_value: float
    total_paid: float
    total_pending: float
    total_overdue: float
    risk_category: Optional[str] = None
    average_days_overdue: float


class ARTrend(BaseModel):
    """Trend data for AR analytics"""
    period: str = Field(..., description="Período (ex: 2024-01)")
    total_issued: float = Field(..., description="Total emitido")
    total_received: float = Field(..., description="Total recebido")
    total_overdue: float = Field(..., description="Total vencido")
    count_issued: int
    count_received: int
    count_overdue: int


class ARInsight(BaseModel):
    """AI-generated insight"""
    type: str = Field(..., description="Tipo do insight (warning, opportunity, info)")
    title: str
    description: str
    impact: str = Field(..., description="Alto, Médio, Baixo")
    recommended_action: Optional[str] = None
    priority: int = Field(..., ge=1, le=5)


class ARAnalyticsComplete(BaseModel):
    """Complete analytics response"""
    summary: ARAnalyticsSummary
    aging_report: ARAgingReport
    top_customers: List[CustomerReceivablesSummary]
    trends: List[ARTrend]
    insights: List[ARInsight]
