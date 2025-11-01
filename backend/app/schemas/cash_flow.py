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


# ============================================
# BREAK-EVEN ANALYSIS SCHEMA
# ============================================

class BreakEvenPoint(BaseModel):
    """
    Ponto de Break-Even para um período específico
    """
    date: date = Field(..., description="Data do ponto")
    revenue: float = Field(..., description="Receita projetada")
    fixed_costs: float = Field(..., description="Custos fixos")
    variable_costs: float = Field(..., description="Custos variáveis")
    total_costs: float = Field(..., description="Custos totais (fixos + variáveis)")
    profit: float = Field(..., description="Lucro/Prejuízo")
    is_break_even: bool = Field(..., description="Indica se este é o ponto de equilíbrio")


class BreakEvenAnalysis(BaseModel):
    """
    Análise de Ponto de Equilíbrio

    Calcula o ponto onde receitas = custos totais
    """
    # Valores atuais
    current_revenue: float = Field(..., description="Receita atual do período")
    current_fixed_costs: float = Field(..., description="Custos fixos atuais")
    current_variable_costs: float = Field(..., description="Custos variáveis atuais")
    current_total_costs: float = Field(..., description="Custos totais atuais")
    current_profit: float = Field(..., description="Lucro/Prejuízo atual")

    # Break-even point
    break_even_revenue: float = Field(..., description="Receita necessária para break-even")
    break_even_units: Optional[float] = Field(None, description="Unidades necessárias (se aplicável)")
    revenue_gap: float = Field(..., description="Diferença entre receita atual e break-even")
    revenue_gap_percentage: float = Field(..., description="Percentual de gap (%)")

    # Margens
    contribution_margin: float = Field(..., description="Margem de contribuição (Receita - Custos Variáveis)")
    contribution_margin_percentage: float = Field(..., description="% Margem de contribuição")

    # Dados do gráfico
    chart_data: List[BreakEvenPoint] = Field(..., description="Pontos para o gráfico")

    # Metadados
    period_start: date = Field(..., description="Data inicial da análise")
    period_end: date = Field(..., description="Data final da análise")
    period_days: int = Field(..., description="Dias analisados")

    class Config:
        json_schema_extra = {
            "example": {
                "current_revenue": 100000.0,
                "current_fixed_costs": 40000.0,
                "current_variable_costs": 35000.0,
                "current_total_costs": 75000.0,
                "current_profit": 25000.0,
                "break_even_revenue": 66667.0,
                "break_even_units": None,
                "revenue_gap": 33333.0,
                "revenue_gap_percentage": 50.0,
                "contribution_margin": 65000.0,
                "contribution_margin_percentage": 65.0,
                "chart_data": [],
                "period_start": "2025-01-01",
                "period_end": "2025-01-30",
                "period_days": 30
            }
        }


# ============================================
# SCENARIO ANALYSIS SCHEMA
# ============================================

class ScenarioTypeEnum(str, Enum):
    """Tipos de cenário"""
    OPTIMISTIC = "optimistic"
    REALISTIC = "realistic"
    PESSIMISTIC = "pessimistic"
    CUSTOM = "custom"


class ScenarioPremises(BaseModel):
    """
    Premissas de um cenário
    """
    collection_rate: float = Field(..., ge=0, le=1, description="Taxa de recebimento (0-1)")
    average_delay_days: int = Field(..., ge=0, description="Dias médios de atraso")
    revenue_growth: float = Field(..., description="Crescimento de receita (%)")
    expense_variation: float = Field(..., description="Variação de despesas (%)")


class ScenarioProjectionPoint(BaseModel):
    """
    Ponto de projeção em um cenário
    """
    date: date = Field(..., description="Data da projeção")
    projected_balance: float = Field(..., description="Saldo projetado")
    projected_entries: float = Field(..., description="Entradas projetadas")
    projected_exits: float = Field(..., description="Saídas projetadas")
    net_flow: float = Field(..., description="Fluxo líquido projetado")
    confidence_level: float = Field(..., ge=0, le=1, description="Nível de confiança (0-1)")


class ScenarioAnalysisResult(BaseModel):
    """
    Resultado da análise de um cenário
    """
    scenario_type: ScenarioTypeEnum = Field(..., description="Tipo de cenário")
    scenario_name: str = Field(..., description="Nome do cenário")
    premises: ScenarioPremises = Field(..., description="Premissas utilizadas")
    projections: List[ScenarioProjectionPoint] = Field(..., description="Pontos de projeção")

    # Métricas do cenário
    average_balance: float = Field(..., description="Saldo médio no período")
    minimum_balance: float = Field(..., description="Menor saldo projetado")
    maximum_balance: float = Field(..., description="Maior saldo projetado")
    total_entries: float = Field(..., description="Total de entradas projetadas")
    total_exits: float = Field(..., description="Total de saídas projetadas")
    final_balance: float = Field(..., description="Saldo final do período")

    # Metadados
    period_start: date = Field(..., description="Data inicial")
    period_end: date = Field(..., description="Data final")
    days_projected: int = Field(..., description="Dias projetados")


class ScenarioComparisonRequest(BaseModel):
    """
    Request para comparação de cenários
    """
    days_ahead: int = Field(30, ge=7, le=365, description="Dias para projetar")
    include_optimistic: bool = Field(True, description="Incluir cenário otimista")
    include_realistic: bool = Field(True, description="Incluir cenário realista")
    include_pessimistic: bool = Field(True, description="Incluir cenário pessimista")


class ScenarioComparisonResponse(BaseModel):
    """
    Response com comparação de múltiplos cenários
    """
    scenarios: List[ScenarioAnalysisResult] = Field(..., description="Lista de cenários analisados")
    comparison_summary: Dict[str, Any] = Field(..., description="Resumo comparativo")

    class Config:
        json_schema_extra = {
            "example": {
                "scenarios": [],
                "comparison_summary": {
                    "best_scenario": "optimistic",
                    "worst_scenario": "pessimistic",
                    "balance_variance": 50000.0,
                    "risk_level": "medium"
                }
            }
        }


# ============================================
# SIMULADOR DE IMPACTO
# ============================================

class SimulationAdjustments(BaseModel):
    """Ajustes para simulação de cenário"""
    additional_revenue: Optional[float] = Field(None, description="Receita adicional mensal (R$)")
    revenue_growth_percentage: Optional[float] = Field(None, description="Crescimento % de receita")
    additional_expenses: Optional[float] = Field(None, description="Despesas adicionais mensais (R$)")
    expense_reduction_percentage: Optional[float] = Field(None, description="Redução % de despesas")
    one_time_income: Optional[float] = Field(None, description="Receita única (R$)")
    one_time_expense: Optional[float] = Field(None, description="Despesa única (R$)")
    payment_delay_days: Optional[int] = Field(None, description="Dias de atraso nos pagamentos")
    collection_improvement: Optional[float] = Field(None, ge=0, le=1, description="Melhoria na cobrança (0-1)")

    class Config:
        json_schema_extra = {
            "example": {
                "additional_revenue": 5000.0,
                "expense_reduction_percentage": 10.0,
                "one_time_income": 15000.0,
                "collection_improvement": 0.15
            }
        }


class CurrentScenarioSnapshot(BaseModel):
    """Snapshot do cenário atual"""
    current_balance: float = Field(..., description="Saldo atual")
    monthly_revenue: float = Field(..., description="Receita mensal média")
    monthly_expenses: float = Field(..., description="Despesas mensais médias")
    net_monthly_flow: float = Field(..., description="Fluxo mensal líquido")
    pending_receivables: float = Field(..., description="Total de recebíveis pendentes")
    pending_payables: float = Field(..., description="Total de pagáveis pendentes")
    average_collection_rate: float = Field(..., description="Taxa média de cobrança (0-1)")
    average_payment_delay: int = Field(..., description="Atraso médio de pagamentos (dias)")
    snapshot_date: date = Field(..., description="Data do snapshot")


class SimulationResult(BaseModel):
    """Resultado de uma simulação"""
    scenario_name: str = Field(..., description="Nome descritivo do cenário simulado")
    adjustments_applied: SimulationAdjustments = Field(..., description="Ajustes aplicados")
    projections: List[ScenarioProjectionPoint] = Field(..., description="Projeções do cenário simulado")
    final_balance: float = Field(..., description="Saldo final projetado")
    minimum_balance: float = Field(..., description="Saldo mínimo durante período")
    maximum_balance: float = Field(..., description="Saldo máximo durante período")
    total_entries: float = Field(..., description="Total de entradas projetadas")
    total_exits: float = Field(..., description="Total de saídas projetadas")
    improvement_vs_current: float = Field(..., description="Melhoria vs cenário atual (R$)")
    improvement_percentage: float = Field(..., description="Melhoria vs cenário atual (%)")
    period_start: date
    period_end: date
    days_projected: int


class SimulationRequest(BaseModel):
    """Request para simulação de cenário"""
    days_ahead: int = Field(30, ge=7, le=365, description="Dias à frente para projetar")
    adjustments: SimulationAdjustments = Field(..., description="Ajustes a aplicar")

    class Config:
        json_schema_extra = {
            "example": {
                "days_ahead": 30,
                "adjustments": {
                    "additional_revenue": 5000.0,
                    "expense_reduction_percentage": 10.0
                }
            }
        }


class SimulationComparison(BaseModel):
    """Comparação entre cenário atual e simulado"""
    current_scenario: CurrentScenarioSnapshot = Field(..., description="Cenário atual")
    simulated_scenario: SimulationResult = Field(..., description="Cenário simulado")
    comparison_metrics: Dict[str, Any] = Field(..., description="Métricas comparativas")
    recommendations: List[str] = Field(..., description="Recomendações baseadas na simulação")


# ============================================
# ALERTAS E RECOMENDAÇÕES
# ============================================

class AlertTypeEnum(str, Enum):
    """Tipos de alerta"""
    LOW_BALANCE = "low_balance"
    NEGATIVE_PROJECTION = "negative_projection"
    HIGH_BURN_RATE = "high_burn_rate"
    OVERDUE_RECEIVABLES = "overdue_receivables"
    BREAK_EVEN_NOT_MET = "break_even_not_met"
    CASH_SHORTAGE_RISK = "cash_shortage_risk"


class AlertSeverityEnum(str, Enum):
    """Níveis de severidade"""
    INFO = "info"
    WARNING = "warning"
    CRITICAL = "critical"


class Alert(BaseModel):
    """Alerta de cash flow"""
    id: str = Field(..., description="ID único do alerta")
    type: AlertTypeEnum = Field(..., description="Tipo do alerta")
    severity: AlertSeverityEnum = Field(..., description="Severidade")
    title: str = Field(..., description="Título do alerta")
    message: str = Field(..., description="Mensagem detalhada")
    date: datetime = Field(..., description="Data/hora do alerta")
    value: Optional[float] = Field(None, description="Valor relacionado (se aplicável)")
    threshold: Optional[float] = Field(None, description="Threshold que disparou o alerta")
    is_read: bool = Field(False, description="Alerta foi lido?")

    class Config:
        json_schema_extra = {
            "example": {
                "id": "alert_001",
                "type": "low_balance",
                "severity": "warning",
                "title": "Saldo Baixo Detectado",
                "message": "Saldo atual de R$ 5.000 está abaixo do mínimo recomendado de R$ 10.000",
                "date": "2025-01-30T14:30:00",
                "value": 5000.0,
                "threshold": 10000.0,
                "is_read": False
            }
        }


class RecommendationTypeEnum(str, Enum):
    """Tipos de recomendação"""
    REDUCE_COSTS = "reduce_costs"
    INCREASE_COLLECTION = "increase_collection"
    OPTIMIZE_CASH = "optimize_cash"
    NEGOTIATE_TERMS = "negotiate_terms"
    INVESTMENT_OPPORTUNITY = "investment_opportunity"
    RISK_MITIGATION = "risk_mitigation"


class RecommendationPriorityEnum(str, Enum):
    """Prioridade da recomendação"""
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"


class Recommendation(BaseModel):
    """Recomendação inteligente"""
    id: str = Field(..., description="ID único da recomendação")
    type: RecommendationTypeEnum = Field(..., description="Tipo da recomendação")
    priority: RecommendationPriorityEnum = Field(..., description="Prioridade")
    title: str = Field(..., description="Título da recomendação")
    description: str = Field(..., description="Descrição detalhada")
    potential_impact: str = Field(..., description="Impacto potencial estimado")
    suggested_actions: List[str] = Field(..., description="Ações sugeridas")
    estimated_value: Optional[float] = Field(None, description="Valor estimado de impacto (R$)")
    confidence_score: float = Field(..., ge=0, le=1, description="Score de confiança (0-1)")
    created_at: datetime = Field(..., description="Data de criação")
    is_implemented: bool = Field(False, description="Já foi implementada?")

    class Config:
        json_schema_extra = {
            "example": {
                "id": "rec_001",
                "type": "increase_collection",
                "priority": "high",
                "title": "Acelere a Cobrança de Recebíveis",
                "description": "Você tem R$ 50.000 em recebíveis vencidos há mais de 15 dias",
                "potential_impact": "Melhorar fluxo de caixa em até R$ 35.000 nos próximos 30 dias",
                "suggested_actions": [
                    "Enviar lembretes automáticos para clientes",
                    "Oferecer desconto de 5% para pagamento antecipado",
                    "Revisar política de crédito"
                ],
                "estimated_value": 35000.0,
                "confidence_score": 0.85,
                "created_at": "2025-01-30T10:00:00",
                "is_implemented": False
            }
        }


class AlertsAndRecommendationsResponse(BaseModel):
    """Response com alertas e recomendações"""
    alerts: List[Alert] = Field(..., description="Lista de alertas ativos")
    recommendations: List[Recommendation] = Field(..., description="Lista de recomendações")
    summary: Dict[str, Any] = Field(..., description="Resumo executivo")

    class Config:
        json_schema_extra = {
            "example": {
                "alerts": [],
                "recommendations": [],
                "summary": {
                    "total_alerts": 3,
                    "critical_alerts": 1,
                    "total_recommendations": 5,
                    "high_priority_recommendations": 2,
                    "estimated_total_impact": 75000.0
                }
            }
        }
