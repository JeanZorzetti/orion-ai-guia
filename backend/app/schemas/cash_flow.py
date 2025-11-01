"""
Schemas Pydantic para Fluxo de Caixa (Cash Flow) e Contas Bancárias

Define modelos de validação e serialização para:
- Contas Bancárias (BankAccount)
- Movimentações Financeiras (CashFlowTransaction)
- Analytics e Projeções

Fase: 2.1 - Sprint Backend Cash Flow
Referência: roadmaps/ROADMAP_FINANCEIRO_INTEGRACAO.md
"""

from pydantic import BaseModel, Field, validator, constr
from typing import Optional, List, Dict, Any
from datetime import datetime, date
from enum import Enum


# ============================================
# ENUMS
# ============================================

class TransactionTypeEnum(str, Enum):
    """Tipos de transação"""
    ENTRADA = "entrada"
    SAIDA = "saida"


class PaymentMethodEnum(str, Enum):
    """Métodos de pagamento"""
    DINHEIRO = "dinheiro"
    PIX = "pix"
    BOLETO = "boleto"
    TRANSFERENCIA = "transferencia"
    CARTAO_CREDITO = "cartao_credito"
    CARTAO_DEBITO = "cartao_debito"
    CHEQUE = "cheque"
    OUTRO = "outro"


class ReferenceTypeEnum(str, Enum):
    """Tipos de referência"""
    INVOICE = "invoice"
    SALE = "sale"
    EXPENSE = "expense"
    TRANSFER = "transfer"
    RECEIVABLE = "receivable"
    PAYABLE = "payable"
    OTHER = "other"


class AccountTypeEnum(str, Enum):
    """Tipos de conta bancária"""
    CORRENTE = "corrente"
    POUPANCA = "poupanca"
    INVESTIMENTO = "investimento"
    CAIXA = "caixa"


# ============================================
# BANK ACCOUNT SCHEMAS
# ============================================

class BankAccountBase(BaseModel):
    """Schema base para conta bancária"""
    bank_name: str = Field(..., min_length=1, max_length=100, description="Nome do banco")
    account_type: AccountTypeEnum = Field(AccountTypeEnum.CORRENTE, description="Tipo de conta")
    account_number: Optional[str] = Field(None, max_length=50, description="Número da conta")
    agency: Optional[str] = Field(None, max_length=20, description="Agência")
    initial_balance: Optional[float] = Field(0.0, description="Saldo inicial")
    description: Optional[str] = Field(None, description="Descrição da conta")
    notes: Optional[str] = Field(None, description="Observações internas")
    is_active: bool = Field(True, description="Conta ativa?")


class BankAccountCreate(BankAccountBase):
    """Schema para criação de conta bancária"""
    pass


class BankAccountUpdate(BaseModel):
    """Schema para atualização de conta bancária"""
    bank_name: Optional[str] = Field(None, min_length=1, max_length=100)
    account_type: Optional[AccountTypeEnum] = None
    account_number: Optional[str] = Field(None, max_length=50)
    agency: Optional[str] = Field(None, max_length=20)
    description: Optional[str] = None
    notes: Optional[str] = None
    is_active: Optional[bool] = None


class BankAccountResponse(BankAccountBase):
    """Schema para resposta de conta bancária"""
    id: int
    workspace_id: int
    current_balance: float = Field(..., description="Saldo atual")
    created_at: datetime
    updated_at: datetime
    created_by: Optional[int] = None
    updated_by: Optional[int] = None

    class Config:
        from_attributes = True


# ============================================
# CASH FLOW TRANSACTION SCHEMAS
# ============================================

class CashFlowTransactionBase(BaseModel):
    """Schema base para movimentação financeira"""
    transaction_date: datetime = Field(..., description="Data da transação")
    type: TransactionTypeEnum = Field(..., description="Tipo: entrada ou saída")
    category: constr(min_length=1, max_length=100) = Field(..., description="Categoria principal")
    subcategory: Optional[str] = Field(None, max_length=100, description="Subcategoria")
    description: constr(min_length=1) = Field(..., description="Descrição da movimentação")
    value: float = Field(..., gt=0, description="Valor da transação")
    payment_method: Optional[PaymentMethodEnum] = Field(None, description="Método de pagamento")
    account_id: Optional[int] = Field(None, description="ID da conta bancária")
    reference_type: Optional[ReferenceTypeEnum] = Field(None, description="Tipo de referência")
    reference_id: Optional[int] = Field(None, description="ID do documento referenciado")
    tags: Optional[List[str]] = Field(None, description="Tags para categorização")
    notes: Optional[str] = Field(None, description="Observações")
    is_recurring: bool = Field(False, description="É transação recorrente?")
    recurrence_rule: Optional[Dict[str, Any]] = Field(None, description="Regra de recorrência")

    @validator('value')
    def validate_positive_value(cls, v):
        if v <= 0:
            raise ValueError('Value must be positive')
        return v


class CashFlowTransactionCreate(CashFlowTransactionBase):
    """Schema para criação de movimentação"""
    pass


class CashFlowTransactionUpdate(BaseModel):
    """Schema para atualização de movimentação"""
    transaction_date: Optional[datetime] = None
    type: Optional[TransactionTypeEnum] = None
    category: Optional[str] = Field(None, max_length=100)
    subcategory: Optional[str] = Field(None, max_length=100)
    description: Optional[str] = None
    value: Optional[float] = Field(None, gt=0)
    payment_method: Optional[PaymentMethodEnum] = None
    account_id: Optional[int] = None
    reference_type: Optional[ReferenceTypeEnum] = None
    reference_id: Optional[int] = None
    tags: Optional[List[str]] = None
    notes: Optional[str] = None
    is_recurring: Optional[bool] = None
    recurrence_rule: Optional[Dict[str, Any]] = None
    is_reconciled: Optional[bool] = None


class CashFlowTransactionResponse(CashFlowTransactionBase):
    """Schema para resposta de movimentação"""
    id: int
    workspace_id: int
    parent_transaction_id: Optional[int] = None
    is_reconciled: bool = False
    reconciled_at: Optional[datetime] = None
    reconciled_by: Optional[int] = None
    created_at: datetime
    updated_at: datetime
    created_by: Optional[int] = None
    updated_by: Optional[int] = None
    net_value: float = Field(..., description="Valor líquido (positivo=entrada, negativo=saída)")

    class Config:
        from_attributes = True


# ============================================
# TRANSFER SCHEMA
# ============================================

class TransferRequest(BaseModel):
    """Schema para transferência entre contas"""
    from_account_id: int = Field(..., description="ID da conta de origem")
    to_account_id: int = Field(..., description="ID da conta de destino")
    value: float = Field(..., gt=0, description="Valor da transferência")
    transaction_date: datetime = Field(..., description="Data da transferência")
    description: str = Field(..., min_length=1, description="Descrição da transferência")
    notes: Optional[str] = Field(None, description="Observações")

    @validator('to_account_id')
    def validate_different_accounts(cls, v, values):
        if 'from_account_id' in values and v == values['from_account_id']:
            raise ValueError('Cannot transfer to the same account')
        return v


class TransferResponse(BaseModel):
    """Schema para resposta de transferência"""
    from_transaction: CashFlowTransactionResponse
    to_transaction: CashFlowTransactionResponse
    message: str = "Transfer completed successfully"


# ============================================
# ANALYTICS SCHEMAS
# ============================================

class CashFlowSummary(BaseModel):
    """Resumo de fluxo de caixa para um período"""
    period_start: date
    period_end: date
    total_entries: float = Field(..., description="Total de entradas")
    total_exits: float = Field(..., description="Total de saídas")
    net_flow: float = Field(..., description="Fluxo líquido (entradas - saídas)")
    entries_count: int = Field(..., description="Quantidade de entradas")
    exits_count: int = Field(..., description="Quantidade de saídas")
    opening_balance: float = Field(..., description="Saldo inicial")
    closing_balance: float = Field(..., description="Saldo final")
    avg_daily_entry: float = Field(..., description="Média diária de entradas")
    avg_daily_exit: float = Field(..., description="Média diária de saídas")


class CategorySummary(BaseModel):
    """Resumo por categoria"""
    category: str
    subcategory: Optional[str] = None
    type: TransactionTypeEnum
    total_value: float
    transaction_count: int
    percentage: float = Field(..., description="Percentual do total")
    avg_value: float = Field(..., description="Valor médio por transação")


class BalanceHistory(BaseModel):
    """Histórico de saldo"""
    date: date
    balance: float
    entries: float = 0.0
    exits: float = 0.0
    net_flow: float = 0.0


class CashFlowProjection(BaseModel):
    """Projeção de fluxo de caixa"""
    projection_date: date
    projected_balance: float
    projected_entries: float
    projected_exits: float
    confidence_level: float = Field(..., ge=0, le=1, description="Nível de confiança (0-1)")
    method: str = Field(..., description="Método de projeção usado")


class CashFlowAnalytics(BaseModel):
    """Analytics completos de cash flow"""
    summary: CashFlowSummary
    by_category: List[CategorySummary]
    by_account: List[Dict[str, Any]]
    balance_history: List[BalanceHistory]
    burn_rate: Optional[float] = Field(None, description="Taxa de queima mensal")
    runway_months: Optional[float] = Field(None, description="Meses de pista (quanto tempo o caixa dura)")
    health_score: float = Field(..., ge=0, le=100, description="Score de saúde financeira (0-100)")


class AccountBalanceSummary(BaseModel):
    """Resumo de saldo por conta"""
    account_id: int
    bank_name: str
    account_type: AccountTypeEnum
    current_balance: float
    month_entries: float = Field(..., description="Entradas no mês")
    month_exits: float = Field(..., description="Saídas no mês")
    month_net_flow: float = Field(..., description="Fluxo líquido do mês")


# ============================================
# FILTERS SCHEMA
# ============================================

class CashFlowFilters(BaseModel):
    """Filtros para busca de transações"""
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    type: Optional[TransactionTypeEnum] = None
    category: Optional[str] = None
    subcategory: Optional[str] = None
    account_id: Optional[int] = None
    payment_method: Optional[PaymentMethodEnum] = None
    reference_type: Optional[ReferenceTypeEnum] = None
    reference_id: Optional[int] = None
    is_reconciled: Optional[bool] = None
    min_value: Optional[float] = Field(None, gt=0)
    max_value: Optional[float] = Field(None, gt=0)
    search: Optional[str] = Field(None, description="Busca textual em description/notes")


# ============================================
# FINANCIAL KPIs SCHEMA
# ============================================

class FinancialKPIs(BaseModel):
    """
    Indicadores Financeiros (KPIs)

    Cálculos baseados em demonstrativos contábeis e fluxo de caixa.
    """
    # Indicadores de Liquidez
    liquidez_imediata: Optional[float] = Field(None, description="Liquidez Imediata = Saldo Caixa / Passivo Circulante")
    liquidez_corrente: Optional[float] = Field(None, description="Liquidez Corrente = Ativo Circulante / Passivo Circulante")

    # Ciclo Financeiro
    pmr: Optional[float] = Field(None, description="Prazo Médio Recebimento (dias)")
    pmp: Optional[float] = Field(None, description="Prazo Médio Pagamento (dias)")
    ciclo_financeiro: Optional[float] = Field(None, description="Ciclo Financeiro = PMR - PMP (dias)")

    # Rentabilidade e Eficiência
    margem_liquida: Optional[float] = Field(None, description="Margem Líquida (%)")
    margem_ebitda: Optional[float] = Field(None, description="Margem EBITDA (%)")
    roa: Optional[float] = Field(None, description="ROA - Return on Assets (%)")
    roe: Optional[float] = Field(None, description="ROE - Return on Equity (%)")

    # Análise de Fluxo de Caixa
    burn_rate: Optional[float] = Field(None, description="Taxa de queima mensal (R$)")
    runway: Optional[float] = Field(None, description="Runway - Meses de caixa disponível")
    endividamento_total: Optional[float] = Field(None, description="Endividamento Total (%)")

    # Metadados
    calculation_date: date = Field(..., description="Data do cálculo")
    period_days: int = Field(..., description="Período analisado (dias)")

    class Config:
        json_schema_extra = {
            "example": {
                "liquidez_imediata": 0.53,
                "liquidez_corrente": 1.76,
                "pmr": 45.2,
                "pmp": 30.5,
                "ciclo_financeiro": 14.7,
                "margem_liquida": 12.5,
                "margem_ebitda": 18.3,
                "roa": 8.2,
                "roe": 15.4,
                "burn_rate": 85000.0,
                "runway": 6.5,
                "endividamento_total": 42.3,
                "calculation_date": "2025-01-30",
                "period_days": 30
            }
        }
