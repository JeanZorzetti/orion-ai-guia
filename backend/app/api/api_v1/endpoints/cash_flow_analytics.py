"""
Endpoints de Analytics e Projeções para Fluxo de Caixa

Fornece APIs para análises financeiras avançadas:
- Resumo e KPIs do período
- Análise por categoria e conta
- Histórico de saldo
- Projeções futuras
- Burn rate e runway
- Health score financeiro

Fase: 2.2 - Sprint Backend Cash Flow Analytics
Referência: roadmaps/ROADMAP_FINANCEIRO_INTEGRACAO.md
Autor: Sistema Orion ERP
Data: 2025-01-30
"""

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func, extract, case, desc
from typing import List, Optional, Dict, Any
from datetime import datetime, date, timedelta
from collections import defaultdict
import logging

from app.core.deps import get_current_user, get_db

logger = logging.getLogger(__name__)
from app.models.user import User
from app.models.cash_flow import BankAccount, CashFlowTransaction, TransactionType
from app.models.accounts_receivable import AccountsReceivable
from app.models.accounts_payable import AccountsPayableInvoice
from app.schemas.cash_flow import (
    CashFlowSummary,
    CategorySummary,
    BalanceHistory,
    CashFlowProjection,
    CashFlowAnalytics,
    AccountBalanceSummary,
    TransactionTypeEnum,
    FinancialKPIs,
    BreakEvenAnalysis,
    BreakEvenPoint,
    ScenarioTypeEnum,
    ScenarioPremises,
    ScenarioProjectionPoint,
    ScenarioAnalysisResult,
    ScenarioComparisonRequest,
    ScenarioComparisonResponse,
    SimulationAdjustments,
    CurrentScenarioSnapshot,
    SimulationResult,
    SimulationRequest,
    SimulationComparison,
    AlertTypeEnum,
    AlertSeverityEnum,
    Alert,
    RecommendationTypeEnum,
    RecommendationPriorityEnum,
    Recommendation,
    AlertsAndRecommendationsResponse,
)

router = APIRouter()


# ============================================
# ANALYTICS ENDPOINTS
# ============================================

@router.get("/analytics/summary", response_model=CashFlowSummary)
def get_cash_flow_summary(
    start_date: date = Query(..., description="Data inicial do período"),
    end_date: date = Query(..., description="Data final do período"),
    account_id: Optional[int] = Query(None, description="Filtrar por conta específica"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Resumo de fluxo de caixa do período

    Retorna KPIs principais: entradas, saídas, fluxo líquido, médias diárias.
    """
    # Query base
    query = db.query(CashFlowTransaction).filter(
        and_(
            CashFlowTransaction.workspace_id == current_user.workspace_id,
            CashFlowTransaction.transaction_date >= datetime.combine(start_date, datetime.min.time()),
            CashFlowTransaction.transaction_date <= datetime.combine(end_date, datetime.max.time())
        )
    )

    if account_id:
        query = query.filter(CashFlowTransaction.account_id == account_id)

    transactions = query.all()

    # Calcular métricas
    total_entries = sum(t.value for t in transactions if t.type == TransactionType.ENTRADA.value)
    total_exits = sum(t.value for t in transactions if t.type == TransactionType.SAIDA.value)
    entries_count = sum(1 for t in transactions if t.type == TransactionType.ENTRADA.value)
    exits_count = sum(1 for t in transactions if t.type == TransactionType.SAIDA.value)

    net_flow = total_entries - total_exits

    # Calcular dias no período
    days_in_period = (end_date - start_date).days + 1
    avg_daily_entry = total_entries / days_in_period if days_in_period > 0 else 0
    avg_daily_exit = total_exits / days_in_period if days_in_period > 0 else 0

    # Calcular saldo inicial e final
    opening_balance = _calculate_balance_at_date(
        db,
        current_user.workspace_id,
        start_date - timedelta(days=1),
        account_id
    )

    closing_balance = opening_balance + net_flow

    return CashFlowSummary(
        period_start=start_date,
        period_end=end_date,
        total_entries=total_entries,
        total_exits=total_exits,
        net_flow=net_flow,
        entries_count=entries_count,
        exits_count=exits_count,
        opening_balance=opening_balance,
        closing_balance=closing_balance,
        avg_daily_entry=avg_daily_entry,
        avg_daily_exit=avg_daily_exit
    )


@router.get("/analytics/by-category", response_model=List[CategorySummary])
def get_by_category(
    start_date: date = Query(..., description="Data inicial"),
    end_date: date = Query(..., description="Data final"),
    type: Optional[TransactionTypeEnum] = Query(None, description="Filtrar por tipo"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Análise por categoria

    Agrupa transações por categoria mostrando totais e percentuais.
    """
    query = db.query(CashFlowTransaction).filter(
        and_(
            CashFlowTransaction.workspace_id == current_user.workspace_id,
            CashFlowTransaction.transaction_date >= datetime.combine(start_date, datetime.min.time()),
            CashFlowTransaction.transaction_date <= datetime.combine(end_date, datetime.max.time())
        )
    )

    if type:
        query = query.filter(CashFlowTransaction.type == type.value)

    transactions = query.all()

    # Agrupar por categoria
    category_data: Dict[tuple, Dict[str, Any]] = defaultdict(lambda: {
        'total_value': 0.0,
        'transaction_count': 0,
        'type': None
    })

    total_by_type = {
        TransactionType.ENTRADA.value: 0.0,
        TransactionType.SAIDA.value: 0.0
    }

    for t in transactions:
        key = (t.category, t.subcategory, t.type)
        category_data[key]['total_value'] += t.value
        category_data[key]['transaction_count'] += 1
        category_data[key]['type'] = t.type
        total_by_type[t.type] += t.value

    # Converter para lista de CategorySummary
    result = []
    for (category, subcategory, trans_type), data in category_data.items():
        total_for_type = total_by_type[trans_type]
        percentage = (data['total_value'] / total_for_type * 100) if total_for_type > 0 else 0
        avg_value = data['total_value'] / data['transaction_count'] if data['transaction_count'] > 0 else 0

        result.append(CategorySummary(
            category=category,
            subcategory=subcategory,
            type=TransactionTypeEnum(trans_type),
            total_value=data['total_value'],
            transaction_count=data['transaction_count'],
            percentage=percentage,
            avg_value=avg_value
        ))

    # Ordenar por valor total decrescente
    result.sort(key=lambda x: x.total_value, reverse=True)

    return result


@router.get("/analytics/by-account", response_model=List[AccountBalanceSummary])
def get_by_account(
    start_date: Optional[date] = Query(None, description="Data inicial para cálculos mensais"),
    end_date: Optional[date] = Query(None, description="Data final para cálculos mensais"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Resumo por conta bancária

    Mostra saldo atual e movimentações de cada conta.
    """
    # Buscar todas as contas ativas
    accounts = db.query(BankAccount).filter(
        and_(
            BankAccount.workspace_id == current_user.workspace_id,
            BankAccount.is_active == True
        )
    ).all()

    # Se não houver datas, usar mês atual
    if not start_date:
        start_date = date.today().replace(day=1)
    if not end_date:
        end_date = date.today()

    result = []
    for account in accounts:
        # Calcular movimentações do período
        transactions = db.query(CashFlowTransaction).filter(
            and_(
                CashFlowTransaction.workspace_id == current_user.workspace_id,
                CashFlowTransaction.account_id == account.id,
                CashFlowTransaction.transaction_date >= datetime.combine(start_date, datetime.min.time()),
                CashFlowTransaction.transaction_date <= datetime.combine(end_date, datetime.max.time())
            )
        ).all()

        month_entries = sum(t.value for t in transactions if t.type == TransactionType.ENTRADA.value)
        month_exits = sum(t.value for t in transactions if t.type == TransactionType.SAIDA.value)
        month_net_flow = month_entries - month_exits

        result.append(AccountBalanceSummary(
            account_id=account.id,
            bank_name=account.bank_name,
            account_type=account.account_type,
            current_balance=account.current_balance,
            month_entries=month_entries,
            month_exits=month_exits,
            month_net_flow=month_net_flow
        ))

    return result


@router.get("/analytics/balance-history", response_model=List[BalanceHistory])
def get_balance_history(
    start_date: date = Query(..., description="Data inicial"),
    end_date: date = Query(..., description="Data final"),
    account_id: Optional[int] = Query(None, description="Filtrar por conta"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Histórico diário de saldo

    Retorna o saldo e movimentações para cada dia do período.
    """
    # Obter todas as transações do período
    query = db.query(CashFlowTransaction).filter(
        and_(
            CashFlowTransaction.workspace_id == current_user.workspace_id,
            CashFlowTransaction.transaction_date >= datetime.combine(start_date, datetime.min.time()),
            CashFlowTransaction.transaction_date <= datetime.combine(end_date, datetime.max.time())
        )
    )

    if account_id:
        query = query.filter(CashFlowTransaction.account_id == account_id)

    transactions = query.all()

    # Agrupar por data
    daily_data: Dict[date, Dict[str, float]] = defaultdict(lambda: {
        'entries': 0.0,
        'exits': 0.0
    })

    for t in transactions:
        trans_date = t.transaction_date.date()
        if t.type == TransactionType.ENTRADA.value:
            daily_data[trans_date]['entries'] += t.value
        else:
            daily_data[trans_date]['exits'] += t.value

    # Calcular saldo inicial
    initial_balance = _calculate_balance_at_date(
        db,
        current_user.workspace_id,
        start_date - timedelta(days=1),
        account_id
    )

    # Gerar histórico diário
    result = []
    current_balance = initial_balance
    current_date = start_date

    while current_date <= end_date:
        day_data = daily_data.get(current_date, {'entries': 0.0, 'exits': 0.0})
        net_flow = day_data['entries'] - day_data['exits']
        current_balance += net_flow

        result.append(BalanceHistory(
            date=current_date,
            balance=current_balance,
            entries=day_data['entries'],
            exits=day_data['exits'],
            net_flow=net_flow
        ))

        current_date += timedelta(days=1)

    return result


@router.get("/analytics/projection", response_model=List[CashFlowProjection])
def get_projection(
    days_ahead: int = Query(30, ge=1, le=365, description="Dias para projetar"),
    method: str = Query("moving_average", description="Método: moving_average, linear_regression"),
    account_id: Optional[int] = Query(None, description="Filtrar por conta"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Projeção de fluxo de caixa

    Projeta saldo futuro baseado em médias históricas.
    """
    # Buscar últimos 90 dias de histórico
    end_date = date.today()
    start_date = end_date - timedelta(days=90)

    query = db.query(CashFlowTransaction).filter(
        and_(
            CashFlowTransaction.workspace_id == current_user.workspace_id,
            CashFlowTransaction.transaction_date >= datetime.combine(start_date, datetime.min.time()),
            CashFlowTransaction.transaction_date <= datetime.combine(end_date, datetime.max.time())
        )
    )

    if account_id:
        query = query.filter(CashFlowTransaction.account_id == account_id)

    transactions = query.all()

    # Calcular médias
    total_entries = sum(t.value for t in transactions if t.type == TransactionType.ENTRADA.value)
    total_exits = sum(t.value for t in transactions if t.type == TransactionType.SAIDA.value)

    days_count = 90
    avg_daily_entry = total_entries / days_count
    avg_daily_exit = total_exits / days_count

    # Saldo atual
    current_balance = _calculate_balance_at_date(db, current_user.workspace_id, end_date, account_id)

    # Gerar projeções
    projections = []
    projected_balance = current_balance

    for day in range(1, days_ahead + 1):
        projection_date = end_date + timedelta(days=day)

        # Projeção simples baseada em médias
        projected_entries = avg_daily_entry
        projected_exits = avg_daily_exit
        projected_balance += (projected_entries - projected_exits)

        # Confiança diminui com distância temporal
        confidence = max(0.5, 1.0 - (day / days_ahead) * 0.5)

        projections.append(CashFlowProjection(
            projection_date=projection_date,
            projected_balance=projected_balance,
            projected_entries=projected_entries,
            projected_exits=projected_exits,
            confidence_level=confidence,
            method=method
        ))

    return projections


@router.get("/analytics/complete", response_model=CashFlowAnalytics)
def get_complete_analytics(
    start_date: date = Query(..., description="Data inicial"),
    end_date: date = Query(..., description="Data final"),
    account_id: Optional[int] = Query(None, description="Filtrar por conta"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Analytics completo de cash flow

    Retorna todos os dados analíticos em uma única chamada.
    """
    # Obter cada componente
    summary = get_cash_flow_summary(start_date, end_date, account_id, db, current_user)
    by_category = get_by_category(start_date, end_date, None, db, current_user)
    by_account = get_by_account(start_date, end_date, db, current_user)
    balance_history = get_balance_history(start_date, end_date, account_id, db, current_user)

    # Calcular métricas adicionais
    burn_rate = summary.avg_daily_exit * 30  # Taxa de queima mensal
    runway_months = None

    if burn_rate > 0:
        runway_months = summary.closing_balance / burn_rate

    # Calcular health score (0-100)
    health_score = _calculate_health_score(summary, runway_months)

    return CashFlowAnalytics(
        summary=summary,
        by_category=by_category,
        by_account=[acc.dict() for acc in by_account],
        balance_history=balance_history,
        burn_rate=burn_rate,
        runway_months=runway_months,
        health_score=health_score
    )


@router.get("/analytics/kpis", response_model=FinancialKPIs)
def get_financial_kpis(
    period_days: int = Query(30, ge=7, le=365, description="Período de análise em dias"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Indicadores Financeiros (KPIs)

    Retorna indicadores de liquidez, ciclo financeiro, rentabilidade e análise de fluxo de caixa.

    **Indicadores calculados:**
    - Liquidez Imediata e Corrente
    - PMR (Prazo Médio Recebimento) e PMP (Prazo Médio Pagamento)
    - Ciclo Financeiro
    - Margens (Líquida e EBITDA)
    - ROA e ROE
    - Burn Rate e Runway
    - Endividamento Total
    """
    calculation_date = date.today()
    start_date = calculation_date - timedelta(days=period_days)

    # ========================================
    # 1. DADOS BASE - Cash Flow
    # ========================================

    # Saldo total em caixa
    total_cash_balance = db.query(func.sum(BankAccount.current_balance)).filter(
        and_(
            BankAccount.workspace_id == current_user.workspace_id,
            BankAccount.is_active == True
        )
    ).scalar() or 0.0

    # Transações do período
    transactions = db.query(CashFlowTransaction).filter(
        and_(
            CashFlowTransaction.workspace_id == current_user.workspace_id,
            CashFlowTransaction.transaction_date >= datetime.combine(start_date, datetime.min.time()),
            CashFlowTransaction.transaction_date <= datetime.combine(calculation_date, datetime.max.time())
        )
    ).all()

    total_entries = sum(t.value for t in transactions if t.type == TransactionType.ENTRADA.value)
    total_exits = sum(t.value for t in transactions if t.type == TransactionType.SAIDA.value)
    net_revenue = total_entries  # Receita líquida do período

    # ========================================
    # 2. DADOS BASE - Contas a Receber
    # ========================================

    # Contas a receber pendentes (Ativo Circulante)
    receivables_pending = db.query(func.sum(AccountsReceivable.value - AccountsReceivable.paid_value)).filter(
        and_(
            AccountsReceivable.workspace_id == current_user.workspace_id,
            AccountsReceivable.status.in_(['pendente', 'parcial', 'vencido'])
        )
    ).scalar() or 0.0

    # Total de vendas do período (para PMR)
    total_sales_period = db.query(func.sum(AccountsReceivable.value)).filter(
        and_(
            AccountsReceivable.workspace_id == current_user.workspace_id,
            AccountsReceivable.issue_date >= start_date,
            AccountsReceivable.issue_date <= calculation_date
        )
    ).scalar() or 0.0

    # ========================================
    # 3. DADOS BASE - Contas a Pagar
    # ========================================

    # Contas a pagar pendentes (Passivo Circulante)
    payables_pending = db.query(func.sum(AccountsPayableInvoice.gross_value - AccountsPayableInvoice.paid_value)).filter(
        and_(
            AccountsPayableInvoice.workspace_id == current_user.workspace_id,
            AccountsPayableInvoice.due_date >= calculation_date,  # Não vencidas
            func.coalesce(AccountsPayableInvoice.paid_value, 0) < AccountsPayableInvoice.gross_value
        )
    ).scalar() or 0.0

    # Total de compras do período (para PMP)
    total_purchases_period = db.query(func.sum(AccountsPayableInvoice.gross_value)).filter(
        and_(
            AccountsPayableInvoice.workspace_id == current_user.workspace_id,
            AccountsPayableInvoice.invoice_date >= start_date,
            AccountsPayableInvoice.invoice_date <= calculation_date
        )
    ).scalar() or 0.0

    # ========================================
    # 4. CÁLCULO DOS KPIs
    # ========================================

    # --- LIQUIDEZ ---
    # Liquidez Imediata = Saldo Caixa / Passivo Circulante
    liquidez_imediata = (total_cash_balance / payables_pending) if payables_pending > 0 else None

    # Liquidez Corrente = (Caixa + Contas a Receber) / Passivo Circulante
    ativo_circulante = total_cash_balance + receivables_pending
    liquidez_corrente = (ativo_circulante / payables_pending) if payables_pending > 0 else None

    # --- CICLO FINANCEIRO ---
    # PMR = (Contas a Receber / Vendas do Período) * period_days
    pmr = (receivables_pending / total_sales_period * period_days) if total_sales_period > 0 else None

    # PMP = (Contas a Pagar / Compras do Período) * period_days
    pmp = (payables_pending / total_purchases_period * period_days) if total_purchases_period > 0 else None

    # Ciclo Financeiro = PMR - PMP
    ciclo_financeiro = (pmr - pmp) if (pmr is not None and pmp is not None) else None

    # --- RENTABILIDADE ---
    # Para cálculos de margem, precisamos de lucro líquido
    # Simplificação: Lucro Líquido ≈ Receitas - Despesas
    lucro_liquido = total_entries - total_exits

    # Margem Líquida = (Lucro Líquido / Receita Líquida) * 100
    margem_liquida = (lucro_liquido / net_revenue * 100) if net_revenue > 0 else None

    # Margem EBITDA - Simplificação: assumir EBITDA ≈ Lucro Líquido + 10%
    # (Em produção, calcular com dados reais de depreciação/amortização)
    ebitda = lucro_liquido * 1.1
    margem_ebitda = (ebitda / net_revenue * 100) if net_revenue > 0 else None

    # ROA = (Lucro Líquido / Ativo Total) * 100
    # Ativo Total ≈ Caixa + Contas a Receber
    ativo_total = ativo_circulante
    roa = (lucro_liquido / ativo_total * 100) if ativo_total > 0 else None

    # ROE = (Lucro Líquido / Patrimônio Líquido) * 100
    # Patrimônio Líquido ≈ Ativo Total - Passivo Total
    patrimonio_liquido = ativo_total - payables_pending
    roe = (lucro_liquido / patrimonio_liquido * 100) if patrimonio_liquido > 0 else None

    # --- FLUXO DE CAIXA ---
    # Burn Rate = Média mensal de despesas
    burn_rate = (total_exits / period_days * 30) if period_days > 0 else None

    # Runway = Saldo Caixa / Burn Rate Mensal (em meses)
    runway = (total_cash_balance / burn_rate) if burn_rate and burn_rate > 0 else None

    # Endividamento Total = (Passivo Circulante / Ativo Total) * 100
    endividamento_total = (payables_pending / ativo_total * 100) if ativo_total > 0 else None

    return FinancialKPIs(
        # Liquidez
        liquidez_imediata=round(liquidez_imediata, 2) if liquidez_imediata is not None else None,
        liquidez_corrente=round(liquidez_corrente, 2) if liquidez_corrente is not None else None,

        # Ciclo Financeiro
        pmr=round(pmr, 1) if pmr is not None else None,
        pmp=round(pmp, 1) if pmp is not None else None,
        ciclo_financeiro=round(ciclo_financeiro, 1) if ciclo_financeiro is not None else None,

        # Rentabilidade
        margem_liquida=round(margem_liquida, 2) if margem_liquida is not None else None,
        margem_ebitda=round(margem_ebitda, 2) if margem_ebitda is not None else None,
        roa=round(roa, 2) if roa is not None else None,
        roe=round(roe, 2) if roe is not None else None,

        # Fluxo de Caixa
        burn_rate=round(burn_rate, 2) if burn_rate is not None else None,
        runway=round(runway, 1) if runway is not None else None,
        endividamento_total=round(endividamento_total, 2) if endividamento_total is not None else None,

        # Metadados
        calculation_date=calculation_date,
        period_days=period_days
    )


@router.get("/analytics/break-even", response_model=BreakEvenAnalysis)
def get_break_even_analysis(
    period_days: int = Query(30, ge=7, le=365, description="Período de análise em dias"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Análise de Ponto de Equilíbrio (Break-Even)

    Calcula o ponto onde receitas = custos totais, mostrando:
    - Custos fixos e variáveis
    - Receita necessária para break-even
    - Margem de contribuição
    - Dados para gráfico comparativo

    **Conceitos:**
    - **Custos Fixos:** Despesas que não variam com o volume (aluguel, salários fixos, etc.)
    - **Custos Variáveis:** Despesas proporcionais ao volume (matéria-prima, comissões, etc.)
    - **Break-Even Point:** Receita onde Lucro = 0 (Receita = Custos Totais)
    - **Margem de Contribuição:** Receita - Custos Variáveis (quanto sobra para cobrir fixos)
    """
    end_date = date.today()
    start_date = end_date - timedelta(days=period_days)

    # ========================================
    # 1. BUSCAR TRANSAÇÕES DO PERÍODO
    # ========================================

    transactions = db.query(CashFlowTransaction).filter(
        and_(
            CashFlowTransaction.workspace_id == current_user.workspace_id,
            CashFlowTransaction.transaction_date >= datetime.combine(start_date, datetime.min.time()),
            CashFlowTransaction.transaction_date <= datetime.combine(end_date, datetime.max.time())
        )
    ).all()

    # Receita total
    total_revenue = sum(t.value for t in transactions if t.type == TransactionType.ENTRADA.value)

    # ========================================
    # 2. CLASSIFICAR CUSTOS (FIXOS vs VARIÁVEIS)
    # ========================================

    # Categorias consideradas custos FIXOS
    fixed_cost_categories = [
        'aluguel', 'salário', 'salario', 'folha', 'seguro', 'licença', 'licenca',
        'assinatura', 'contador', 'advogado', 'consultoria', 'internet', 'telefone',
        'energia', 'água', 'agua', 'condomínio', 'condominio', 'iptu', 'alvará', 'alvara'
    ]

    # Categorias consideradas custos VARIÁVEIS
    variable_cost_categories = [
        'mercadoria', 'produto', 'matéria', 'materia', 'fornecedor', 'compra',
        'comissão', 'comissao', 'frete', 'embalagem', 'marketing', 'publicidade',
        'taxa', 'imposto variável', 'imposto variavel', 'insumo'
    ]

    fixed_costs = 0.0
    variable_costs = 0.0

    for t in transactions:
        if t.type != TransactionType.SAIDA.value:
            continue

        category_lower = (t.category or '').lower()
        description_lower = (t.description or '').lower()

        # Classificar como fixo ou variável baseado em categoria/descrição
        is_fixed = any(keyword in category_lower or keyword in description_lower
                      for keyword in fixed_cost_categories)
        is_variable = any(keyword in category_lower or keyword in description_lower
                         for keyword in variable_cost_categories)

        if is_fixed:
            fixed_costs += t.value
        elif is_variable:
            variable_costs += t.value
        else:
            # Se não identificado, considerar como variável (mais conservador)
            variable_costs += t.value

    # ========================================
    # 3. CÁLCULOS DE BREAK-EVEN
    # ========================================

    total_costs = fixed_costs + variable_costs
    current_profit = total_revenue - total_costs

    # Margem de contribuição = Receita - Custos Variáveis
    contribution_margin = total_revenue - variable_costs
    contribution_margin_pct = (contribution_margin / total_revenue * 100) if total_revenue > 0 else 0

    # Break-Even Revenue = Custos Fixos / (Margem de Contribuição %)
    # Ou seja: a receita necessária para que a margem cubra exatamente os custos fixos
    if contribution_margin_pct > 0:
        break_even_revenue = (fixed_costs / contribution_margin_pct) * 100
    else:
        break_even_revenue = 0

    # Gap de receita
    revenue_gap = total_revenue - break_even_revenue
    revenue_gap_pct = (revenue_gap / break_even_revenue * 100) if break_even_revenue > 0 else 0

    # ========================================
    # 4. GERAR DADOS PARA O GRÁFICO
    # ========================================

    # Criar 10 pontos de 0% a 150% da receita atual
    chart_data: List[BreakEvenPoint] = []
    max_revenue = total_revenue * 1.5 if total_revenue > 0 else 100000
    step = max_revenue / 10

    for i in range(11):  # 0 a 10 = 11 pontos
        revenue_point = i * step

        # Custos fixos são constantes
        # Custos variáveis crescem proporcionalmente à receita
        variable_cost_ratio = (variable_costs / total_revenue) if total_revenue > 0 else 0.4
        variable_cost_point = revenue_point * variable_cost_ratio

        total_cost_point = fixed_costs + variable_cost_point
        profit_point = revenue_point - total_cost_point

        # Verificar se este é o ponto de break-even (lucro próximo de 0)
        is_break_even = abs(profit_point) < (max_revenue * 0.02)  # Margem de 2%

        chart_data.append(BreakEvenPoint(
            date=start_date + timedelta(days=int((i / 10) * period_days)),
            revenue=round(revenue_point, 2),
            fixed_costs=round(fixed_costs, 2),
            variable_costs=round(variable_cost_point, 2),
            total_costs=round(total_cost_point, 2),
            profit=round(profit_point, 2),
            is_break_even=is_break_even
        ))

    return BreakEvenAnalysis(
        # Valores atuais
        current_revenue=round(total_revenue, 2),
        current_fixed_costs=round(fixed_costs, 2),
        current_variable_costs=round(variable_costs, 2),
        current_total_costs=round(total_costs, 2),
        current_profit=round(current_profit, 2),

        # Break-even
        break_even_revenue=round(break_even_revenue, 2),
        break_even_units=None,  # Não calculamos unidades nesta versão
        revenue_gap=round(revenue_gap, 2),
        revenue_gap_percentage=round(revenue_gap_pct, 2),

        # Margens
        contribution_margin=round(contribution_margin, 2),
        contribution_margin_percentage=round(contribution_margin_pct, 2),

        # Gráfico
        chart_data=chart_data,

        # Metadados
        period_start=start_date,
        period_end=end_date,
        period_days=period_days
    )


# ============================================
# HELPER FUNCTIONS
# ============================================

def _calculate_balance_at_date(
    db: Session,
    workspace_id: int,
    target_date: date,
    account_id: Optional[int] = None
) -> float:
    """Calcula o saldo em uma data específica"""
    query = db.query(CashFlowTransaction).filter(
        and_(
            CashFlowTransaction.workspace_id == workspace_id,
            CashFlowTransaction.transaction_date <= datetime.combine(target_date, datetime.max.time())
        )
    )

    if account_id:
        query = query.filter(CashFlowTransaction.account_id == account_id)
        # Adicionar saldo inicial da conta
        account = db.query(BankAccount).filter(BankAccount.id == account_id).first()
        initial_balance = account.initial_balance if account else 0.0
    else:
        # Somar saldo inicial de todas as contas
        accounts = db.query(BankAccount).filter(
            BankAccount.workspace_id == workspace_id
        ).all()
        initial_balance = sum(acc.initial_balance for acc in accounts)

    transactions = query.all()

    total_entries = sum(t.value for t in transactions if t.type == TransactionType.ENTRADA.value)
    total_exits = sum(t.value for t in transactions if t.type == TransactionType.SAIDA.value)

    return initial_balance + total_entries - total_exits


def _calculate_health_score(summary: CashFlowSummary, runway_months: Optional[float]) -> float:
    """
    Calcula score de saúde financeira (0-100)

    Critérios:
    - Fluxo positivo: +30 pontos
    - Saldo final positivo: +30 pontos
    - Runway >= 6 meses: +40 pontos (proporcional)
    """
    score = 0.0

    # Fluxo positivo
    if summary.net_flow > 0:
        score += 30.0

    # Saldo positivo
    if summary.closing_balance > 0:
        score += 30.0

    # Runway
    if runway_months is not None and runway_months > 0:
        runway_score = min(runway_months / 6.0, 1.0) * 40.0
        score += runway_score

    return min(score, 100.0)


@router.post("/scenarios/calculate", response_model=ScenarioComparisonResponse)
def calculate_scenarios(
    request: ScenarioComparisonRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Análise de Cenários (Otimista, Realista, Pessimista)

    Calcula projeções de fluxo de caixa com diferentes premissas:
    - Otimista: 95% recebimento, 2 dias atraso, +5% receita, -2% despesas
    - Realista: 85% recebimento, 7 dias atraso, +2% receita, 0% despesas
    - Pessimista: 70% recebimento, 15 dias atraso, -3% receita, +5% despesas
    """

    logger.info(f"Calculando cenários para {request.days_ahead} dias à frente")

    workspace_id = current_user.workspace_id

    # Datas para análise
    end_date = datetime.now().date()
    start_date = end_date - timedelta(days=30)  # Usar últimos 30 dias como base
    projection_end_date = end_date + timedelta(days=request.days_ahead)

    # ===== BUSCAR DADOS HISTÓRICOS PARA BASE DE CÁLCULO =====

    # Saldo atual total de todas as contas
    current_balance = db.query(func.sum(BankAccount.current_balance)).filter(
        BankAccount.workspace_id == workspace_id,
        BankAccount.is_active == True
    ).scalar() or 0.0

    # Receitas médias dos últimos 30 dias
    avg_daily_entries = db.query(func.avg(
        func.coalesce(
            db.query(func.sum(CashFlowTransaction.value))
            .filter(
                CashFlowTransaction.workspace_id == workspace_id,
                CashFlowTransaction.transaction_type == TransactionType.ENTRADA,
                CashFlowTransaction.transaction_date.between(start_date, end_date)
            )
            .group_by(CashFlowTransaction.transaction_date)
            .scalar_subquery(),
            0
        )
    )).scalar() or 0.0

    # Despesas médias dos últimos 30 dias
    avg_daily_exits = db.query(func.avg(
        func.coalesce(
            db.query(func.sum(CashFlowTransaction.value))
            .filter(
                CashFlowTransaction.workspace_id == workspace_id,
                CashFlowTransaction.transaction_type == TransactionType.SAIDA,
                CashFlowTransaction.transaction_date.between(start_date, end_date)
            )
            .group_by(CashFlowTransaction.transaction_date)
            .scalar_subquery(),
            0
        )
    )).scalar() or 0.0

    # Contas a receber pendentes
    pending_receivables = db.query(func.sum(AccountsReceivable.valor_aberto)).filter(
        AccountsReceivable.workspace_id == workspace_id,
        AccountsReceivable.status.in_(['pendente', 'vencida', 'parcialmente_paga'])
    ).scalar() or 0.0

    # Contas a pagar pendentes
    pending_payables = db.query(func.sum(AccountsPayableInvoice.valor_aberto)).filter(
        AccountsPayableInvoice.workspace_id == workspace_id,
        AccountsPayableInvoice.status.in_(['pendente', 'vencida', 'parcialmente_paga'])
    ).scalar() or 0.0

    logger.info(f"Dados base - Saldo: R$ {current_balance:,.2f}, "
                f"Receitas médias: R$ {avg_daily_entries:,.2f}/dia, "
                f"Despesas médias: R$ {avg_daily_exits:,.2f}/dia")

    # ===== FUNÇÃO AUXILIAR PARA CALCULAR UM CENÁRIO =====

    def calculate_scenario(
        scenario_type: ScenarioTypeEnum,
        premises: ScenarioPremises
    ) -> ScenarioAnalysisResult:
        """Calcula projeção para um cenário específico"""

        projections: List[ScenarioProjectionPoint] = []
        running_balance = current_balance
        total_entries = 0.0
        total_exits = 0.0
        min_balance = current_balance
        max_balance = current_balance

        # Calcular projeções diárias
        for day in range(request.days_ahead):
            projection_date = end_date + timedelta(days=day + 1)

            # Receitas projetadas (com crescimento aplicado)
            growth_factor = 1 + (premises.revenue_growth / 100)
            daily_entries = avg_daily_entries * growth_factor * premises.collection_rate

            # Incluir recebíveis com atraso
            if day >= premises.average_delay_days:
                # Simular recebimento de recebíveis pendentes ao longo do período
                daily_receivable_collection = (pending_receivables / request.days_ahead) * premises.collection_rate
                daily_entries += daily_receivable_collection

            # Despesas projetadas (com variação aplicada)
            expense_factor = 1 + (premises.expense_variation / 100)
            daily_exits = avg_daily_exits * expense_factor

            # Incluir pagamento de contas pendentes
            daily_payable_payment = pending_payables / request.days_ahead
            daily_exits += daily_payable_payment

            # Calcular fluxo líquido e saldo
            net_flow = daily_entries - daily_exits
            running_balance += net_flow

            # Acumular totais
            total_entries += daily_entries
            total_exits += daily_exits

            # Atualizar min/max
            min_balance = min(min_balance, running_balance)
            max_balance = max(max_balance, running_balance)

            # Calcular nível de confiança (diminui com o tempo)
            confidence = max(0.5, 1.0 - (day / request.days_ahead) * 0.5)

            # Criar ponto de projeção
            projections.append(ScenarioProjectionPoint(
                date=projection_date,
                projected_balance=running_balance,
                projected_entries=daily_entries,
                projected_exits=daily_exits,
                net_flow=net_flow,
                confidence_level=confidence
            ))

        # Calcular médias
        avg_balance = sum(p.projected_balance for p in projections) / len(projections) if projections else 0

        # Criar resultado do cenário
        scenario_name_map = {
            ScenarioTypeEnum.OPTIMISTIC: "Cenário Otimista",
            ScenarioTypeEnum.REALISTIC: "Cenário Realista",
            ScenarioTypeEnum.PESSIMISTIC: "Cenário Pessimista"
        }

        return ScenarioAnalysisResult(
            scenario_type=scenario_type,
            scenario_name=scenario_name_map.get(scenario_type, "Cenário Personalizado"),
            premises=premises,
            projections=projections,
            average_balance=avg_balance,
            minimum_balance=min_balance,
            maximum_balance=max_balance,
            total_entries=total_entries,
            total_exits=total_exits,
            final_balance=running_balance,
            period_start=end_date,
            period_end=projection_end_date,
            days_projected=request.days_ahead
        )

    # ===== CALCULAR OS CENÁRIOS SOLICITADOS =====

    scenarios: List[ScenarioAnalysisResult] = []

    # Cenário Otimista
    if request.include_optimistic:
        optimistic_premises = ScenarioPremises(
            collection_rate=0.95,
            average_delay_days=2,
            revenue_growth=5.0,
            expense_variation=-2.0
        )
        scenarios.append(calculate_scenario(ScenarioTypeEnum.OPTIMISTIC, optimistic_premises))

    # Cenário Realista
    if request.include_realistic:
        realistic_premises = ScenarioPremises(
            collection_rate=0.85,
            average_delay_days=7,
            revenue_growth=2.0,
            expense_variation=0.0
        )
        scenarios.append(calculate_scenario(ScenarioTypeEnum.REALISTIC, realistic_premises))

    # Cenário Pessimista
    if request.include_pessimistic:
        pessimistic_premises = ScenarioPremises(
            collection_rate=0.70,
            average_delay_days=15,
            revenue_growth=-3.0,
            expense_variation=5.0
        )
        scenarios.append(calculate_scenario(ScenarioTypeEnum.PESSIMISTIC, pessimistic_premises))

    # ===== CRIAR RESUMO COMPARATIVO =====

    comparison_summary = {
        "current_balance": current_balance,
        "base_period_days": 30,
        "projection_days": request.days_ahead,
        "scenarios_calculated": len(scenarios),
        "best_case_balance": max(s.final_balance for s in scenarios) if scenarios else 0,
        "worst_case_balance": min(s.final_balance for s in scenarios) if scenarios else 0,
        "balance_range": max(s.final_balance for s in scenarios) - min(s.final_balance for s in scenarios) if scenarios else 0,
        "critical_scenarios": [
            s.scenario_name for s in scenarios if s.minimum_balance < 0
        ],
        "recommended_action": _get_scenario_recommendation(scenarios, current_balance)
    }

    logger.info(f"Cenários calculados: {len(scenarios)}, "
                f"Melhor caso: R$ {comparison_summary['best_case_balance']:,.2f}, "
                f"Pior caso: R$ {comparison_summary['worst_case_balance']:,.2f}")

    return ScenarioComparisonResponse(
        scenarios=scenarios,
        comparison_summary=comparison_summary
    )


def _get_scenario_recommendation(scenarios: List[ScenarioAnalysisResult], current_balance: float) -> str:
    """Gera recomendação baseada nos cenários calculados"""

    if not scenarios:
        return "Não foi possível gerar recomendações sem cenários."

    # Verificar se algum cenário tem saldo negativo
    critical_scenarios = [s for s in scenarios if s.minimum_balance < 0]

    if critical_scenarios:
        worst_scenario = min(critical_scenarios, key=lambda s: s.minimum_balance)
        days_until_negative = None

        for i, point in enumerate(worst_scenario.projections):
            if point.projected_balance < 0:
                days_until_negative = i + 1
                break

        if days_until_negative:
            return (
                f"⚠️ ATENÇÃO: O cenário {worst_scenario.scenario_name} projeta saldo negativo "
                f"em {days_until_negative} dias. Recomendamos ações imediatas para aumentar receitas "
                f"ou reduzir despesas."
            )

    # Verificar a diferença entre melhor e pior caso
    best_case = max(scenarios, key=lambda s: s.final_balance)
    worst_case = min(scenarios, key=lambda s: s.final_balance)
    balance_variance = best_case.final_balance - worst_case.final_balance

    if balance_variance > current_balance * 0.5:
        return (
            f"📊 Alta volatilidade detectada: diferença de R$ {balance_variance:,.2f} entre cenários. "
            f"Recomendamos estabelecer uma reserva de emergência e monitorar indicadores semanalmente."
        )

    # Cenário positivo
    if all(s.final_balance > current_balance for s in scenarios):
        return (
            f"✅ Projeções positivas: todos os cenários indicam crescimento do saldo. "
            f"Continue monitorando e considere investimentos estratégicos."
        )

    return (
        f"📈 Cenários mistos: resultados variam significativamente. "
        f"Recomendamos focar no cenário realista e preparar planos de contingência."
    )


@router.get("/scenarios/current", response_model=CurrentScenarioSnapshot)
def get_current_scenario(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Cenário Atual (Snapshot)

    Retorna um snapshot do estado atual do fluxo de caixa, sem projeções,
    servindo como baseline para simulações.
    """

    logger.info("Gerando snapshot do cenário atual")

    workspace_id = current_user.workspace_id
    today = datetime.now().date()
    start_date = today - timedelta(days=30)

    # Saldo atual total
    current_balance = db.query(func.sum(BankAccount.current_balance)).filter(
        BankAccount.workspace_id == workspace_id,
        BankAccount.is_active == True
    ).scalar() or 0.0

    # Transações dos últimos 30 dias
    transactions = db.query(CashFlowTransaction).filter(
        CashFlowTransaction.workspace_id == workspace_id,
        CashFlowTransaction.transaction_date >= datetime.combine(start_date, datetime.min.time()),
        CashFlowTransaction.transaction_date <= datetime.combine(today, datetime.max.time())
    ).all()

    # Calcular receitas e despesas mensais
    total_entries = sum(t.value for t in transactions if t.type == TransactionType.ENTRADA.value)
    total_exits = sum(t.value for t in transactions if t.type == TransactionType.SAIDA.value)

    monthly_revenue = total_entries
    monthly_expenses = total_exits
    net_monthly_flow = monthly_revenue - monthly_expenses

    # Contas a receber pendentes
    pending_receivables = db.query(func.sum(AccountsReceivable.valor_aberto)).filter(
        AccountsReceivable.workspace_id == workspace_id,
        AccountsReceivable.status.in_(['pendente', 'vencida', 'parcialmente_paga'])
    ).scalar() or 0.0

    # Contas a pagar pendentes
    pending_payables = db.query(func.sum(AccountsPayableInvoice.valor_aberto)).filter(
        AccountsPayableInvoice.workspace_id == workspace_id,
        AccountsPayableInvoice.status.in_(['pendente', 'vencida', 'parcialmente_paga'])
    ).scalar() or 0.0

    # Taxa média de cobrança (contas pagas / total emitido)
    total_receivables_issued = db.query(func.sum(AccountsReceivable.value)).filter(
        AccountsReceivable.workspace_id == workspace_id,
        AccountsReceivable.issue_date >= start_date
    ).scalar() or 0.0

    total_receivables_paid = db.query(func.sum(AccountsReceivable.paid_value)).filter(
        AccountsReceivable.workspace_id == workspace_id,
        AccountsReceivable.issue_date >= start_date
    ).scalar() or 0.0

    average_collection_rate = (total_receivables_paid / total_receivables_issued) if total_receivables_issued > 0 else 0.85

    # Atraso médio de pagamentos (simplificado - calcular média entre vencimento e data de pagamento)
    paid_receivables = db.query(AccountsReceivable).filter(
        AccountsReceivable.workspace_id == workspace_id,
        AccountsReceivable.status == 'paga',
        AccountsReceivable.payment_date.isnot(None),
        AccountsReceivable.issue_date >= start_date
    ).all()

    delays = [(r.payment_date - r.due_date).days for r in paid_receivables if r.payment_date > r.due_date]
    average_payment_delay = int(sum(delays) / len(delays)) if delays else 5

    logger.info(f"Snapshot gerado - Saldo: R$ {current_balance:,.2f}, "
                f"Receita mensal: R$ {monthly_revenue:,.2f}, "
                f"Taxa cobrança: {average_collection_rate:.1%}")

    return CurrentScenarioSnapshot(
        current_balance=current_balance,
        monthly_revenue=monthly_revenue,
        monthly_expenses=monthly_expenses,
        net_monthly_flow=net_monthly_flow,
        pending_receivables=pending_receivables,
        pending_payables=pending_payables,
        average_collection_rate=average_collection_rate,
        average_payment_delay=average_payment_delay,
        snapshot_date=today
    )


@router.post("/scenarios/simulate", response_model=SimulationComparison)
def simulate_scenario(
    request: SimulationRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Simulador de Impacto

    Permite ao usuário simular o impacto de mudanças no fluxo de caixa:
    - Receitas/despesas adicionais
    - Crescimento/redução percentual
    - Receitas/despesas únicas
    - Melhoria na cobrança
    - Atraso nos pagamentos

    Retorna comparação entre cenário atual e cenário simulado.
    """

    logger.info(f"Simulando cenário com ajustes: {request.adjustments}")

    workspace_id = current_user.workspace_id
    today = datetime.now().date()
    start_date = today - timedelta(days=30)
    projection_end_date = today + timedelta(days=request.days_ahead)

    # ===== OBTER CENÁRIO ATUAL =====
    current_snapshot = get_current_scenario(db, current_user)

    # ===== CALCULAR MÉDIAS DIÁRIAS =====
    avg_daily_entries = current_snapshot.monthly_revenue / 30
    avg_daily_exits = current_snapshot.monthly_expenses / 30

    # ===== APLICAR AJUSTES =====
    adj = request.adjustments

    # Ajustes de receita
    if adj.additional_revenue:
        avg_daily_entries += adj.additional_revenue / 30

    if adj.revenue_growth_percentage:
        avg_daily_entries *= (1 + adj.revenue_growth_percentage / 100)

    # Ajustes de despesa
    if adj.additional_expenses:
        avg_daily_exits += adj.additional_expenses / 30

    if adj.expense_reduction_percentage:
        avg_daily_exits *= (1 - adj.expense_reduction_percentage / 100)

    # Ajustar taxa de cobrança
    collection_rate = current_snapshot.average_collection_rate
    if adj.collection_improvement:
        collection_rate = min(1.0, collection_rate + adj.collection_improvement)

    # Ajustar atraso de pagamentos
    payment_delay = current_snapshot.average_payment_delay
    if adj.payment_delay_days:
        payment_delay += adj.payment_delay_days

    # ===== CALCULAR PROJEÇÕES =====
    projections: List[ScenarioProjectionPoint] = []
    running_balance = current_snapshot.current_balance
    total_entries = 0.0
    total_exits = 0.0
    min_balance = running_balance
    max_balance = running_balance

    # Aplicar receita única no primeiro dia
    if adj.one_time_income:
        running_balance += adj.one_time_income
        total_entries += adj.one_time_income

    # Aplicar despesa única no primeiro dia
    if adj.one_time_expense:
        running_balance -= adj.one_time_expense
        total_exits += adj.one_time_expense

    for day in range(request.days_ahead):
        projection_date = today + timedelta(days=day + 1)

        # Receitas diárias com taxa de cobrança
        daily_entries = avg_daily_entries * collection_rate

        # Incluir recebimento de recebíveis com atraso
        if day >= payment_delay:
            daily_receivable_collection = (current_snapshot.pending_receivables / request.days_ahead) * collection_rate
            daily_entries += daily_receivable_collection

        # Despesas diárias
        daily_exits = avg_daily_exits

        # Incluir pagamento de contas pendentes
        daily_payable_payment = current_snapshot.pending_payables / request.days_ahead
        daily_exits += daily_payable_payment

        # Calcular fluxo líquido e saldo
        net_flow = daily_entries - daily_exits
        running_balance += net_flow

        # Acumular totais
        total_entries += daily_entries
        total_exits += daily_exits

        # Atualizar min/max
        min_balance = min(min_balance, running_balance)
        max_balance = max(max_balance, running_balance)

        # Nível de confiança (diminui com o tempo)
        confidence = max(0.5, 1.0 - (day / request.days_ahead) * 0.5)

        projections.append(ScenarioProjectionPoint(
            date=projection_date,
            projected_balance=running_balance,
            projected_entries=daily_entries,
            projected_exits=daily_exits,
            net_flow=net_flow,
            confidence_level=confidence
        ))

    # ===== CALCULAR CENÁRIO BASELINE (SEM AJUSTES) =====
    baseline_balance = current_snapshot.current_balance
    for day in range(request.days_ahead):
        baseline_daily_entries = (current_snapshot.monthly_revenue / 30) * current_snapshot.average_collection_rate
        if day >= current_snapshot.average_payment_delay:
            baseline_daily_entries += (current_snapshot.pending_receivables / request.days_ahead) * current_snapshot.average_collection_rate

        baseline_daily_exits = (current_snapshot.monthly_expenses / 30) + (current_snapshot.pending_payables / request.days_ahead)
        baseline_balance += (baseline_daily_entries - baseline_daily_exits)

    # ===== CALCULAR MELHORIA =====
    improvement = running_balance - baseline_balance
    improvement_pct = (improvement / baseline_balance * 100) if baseline_balance != 0 else 0

    # ===== CRIAR RESULTADO DA SIMULAÇÃO =====
    simulation_result = SimulationResult(
        scenario_name="Cenário Simulado",
        adjustments_applied=adj,
        projections=projections,
        final_balance=running_balance,
        minimum_balance=min_balance,
        maximum_balance=max_balance,
        total_entries=total_entries,
        total_exits=total_exits,
        improvement_vs_current=improvement,
        improvement_percentage=improvement_pct,
        period_start=today,
        period_end=projection_end_date,
        days_projected=request.days_ahead
    )

    # ===== MÉTRICAS COMPARATIVAS =====
    comparison_metrics = {
        "baseline_final_balance": baseline_balance,
        "simulated_final_balance": running_balance,
        "balance_improvement": improvement,
        "improvement_percentage": improvement_pct,
        "risk_of_negative_balance": min_balance < 0,
        "minimum_balance_date": min(projections, key=lambda p: p.projected_balance).date.isoformat() if projections else None
    }

    # ===== RECOMENDAÇÕES =====
    recommendations = []

    if improvement > 0:
        recommendations.append(f"✅ A simulação projeta uma melhoria de R$ {improvement:,.2f} ({improvement_pct:.1f}%) no saldo final.")
    else:
        recommendations.append(f"⚠️ A simulação projeta uma piora de R$ {abs(improvement):,.2f} ({abs(improvement_pct):.1f}%) no saldo final.")

    if min_balance < 0:
        recommendations.append(f"🔴 ATENÇÃO: O saldo pode ficar negativo (mínimo: R$ {min_balance:,.2f}). Considere ajustes adicionais.")

    if adj.expense_reduction_percentage and adj.expense_reduction_percentage > 0:
        savings = (current_snapshot.monthly_expenses * adj.expense_reduction_percentage / 100)
        recommendations.append(f"💰 Redução de {adj.expense_reduction_percentage}% em despesas economiza R$ {savings:,.2f}/mês.")

    if adj.collection_improvement and adj.collection_improvement > 0:
        additional_revenue = current_snapshot.pending_receivables * adj.collection_improvement
        recommendations.append(f"📈 Melhoria de {adj.collection_improvement*100:.0f}% na cobrança pode liberar R$ {additional_revenue:,.2f}.")

    logger.info(f"Simulação concluída - Melhoria: R$ {improvement:,.2f} ({improvement_pct:.1f}%)")

    return SimulationComparison(
        current_scenario=current_snapshot,
        simulated_scenario=simulation_result,
        comparison_metrics=comparison_metrics,
        recommendations=recommendations
    )


# ============================================
# INTELIGÊNCIA E AUTOMAÇÃO
# ============================================

@router.get("/alerts")
def get_alerts_and_recommendations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    🚨 Alertas e Recomendações Inteligentes

    Gera alertas em tempo real e recomendações baseadas em:
    - Saldo atual e projeções
    - Burn rate e runway
    - Contas a receber vencidas
    - Análise de cenários
    - KPIs financeiros
    """
    import uuid
    from datetime import datetime, timedelta, date

    workspace_id = current_user.workspace_id
    alerts: List[Alert] = []
    recommendations: List[Recommendation] = []

    # ========================================
    # 1. CALCULAR MÉTRICAS ATUAIS
    # ========================================

    # Saldo total atual
    current_balance = db.query(func.sum(BankAccount.current_balance)).filter(
        BankAccount.workspace_id == workspace_id,
        BankAccount.is_active == True
    ).scalar() or 0.0

    # Transações dos últimos 30 dias
    thirty_days_ago = datetime.now() - timedelta(days=30)
    transactions = db.query(CashFlowTransaction).filter(
        CashFlowTransaction.workspace_id == workspace_id,
        CashFlowTransaction.transaction_date >= thirty_days_ago
    ).all()

    # Calcular entradas e saídas
    monthly_revenue = sum(t.value for t in transactions if t.type == TransactionType.ENTRADA)
    monthly_expenses = sum(abs(t.value) for t in transactions if t.type == TransactionType.SAIDA)
    net_monthly_flow = monthly_revenue - monthly_expenses

    # Burn rate (média diária de gastos)
    burn_rate = monthly_expenses / 30 if monthly_expenses > 0 else 0
    runway_months = (current_balance / monthly_expenses) if monthly_expenses > 0 else float('inf')

    # Contas a receber vencidas
    today = date.today()
    overdue_receivables = db.query(AccountsReceivable).filter(
        AccountsReceivable.workspace_id == workspace_id,
        AccountsReceivable.status != "paid",
        AccountsReceivable.due_date < today
    ).all()

    total_overdue = sum(r.remaining_value for r in overdue_receivables)

    # ========================================
    # 2. GERAR ALERTAS
    # ========================================

    # Alerta: Saldo Baixo
    min_balance_threshold = monthly_expenses * 0.5  # 50% das despesas mensais
    if current_balance < min_balance_threshold and current_balance > 0:
        alerts.append(Alert(
            id=str(uuid.uuid4()),
            type=AlertTypeEnum.LOW_BALANCE,
            severity=AlertSeverityEnum.WARNING,
            title="⚠️ Saldo Abaixo do Recomendado",
            message=f"Saldo atual de R$ {current_balance:,.2f} está abaixo do mínimo recomendado de R$ {min_balance_threshold:,.2f} (50% das despesas mensais).",
            date=datetime.now(),
            value=current_balance,
            threshold=min_balance_threshold,
            is_read=False
        ))

    # Alerta: Saldo Negativo ou Muito Crítico
    if current_balance <= 0:
        alerts.append(Alert(
            id=str(uuid.uuid4()),
            type=AlertTypeEnum.CASH_SHORTAGE_RISK,
            severity=AlertSeverityEnum.CRITICAL,
            title="🔴 CRÍTICO: Saldo Insuficiente",
            message=f"Saldo atual de R$ {current_balance:,.2f}. Ação imediata necessária para evitar problemas de fluxo de caixa.",
            date=datetime.now(),
            value=current_balance,
            threshold=0.0,
            is_read=False
        ))

    # Alerta: Burn Rate Alto
    if runway_months < 3 and runway_months != float('inf'):
        alerts.append(Alert(
            id=str(uuid.uuid4()),
            type=AlertTypeEnum.HIGH_BURN_RATE,
            severity=AlertSeverityEnum.WARNING if runway_months >= 1.5 else AlertSeverityEnum.CRITICAL,
            title=f"🔥 Runway Baixo: {runway_months:.1f} meses",
            message=f"Com o burn rate atual de R$ {burn_rate:,.2f}/dia, o caixa durará apenas {runway_months:.1f} meses. Considere reduzir despesas ou aumentar receitas.",
            date=datetime.now(),
            value=runway_months,
            threshold=3.0,
            is_read=False
        ))

    # Alerta: Contas a Receber Vencidas
    if total_overdue > 0:
        severity = AlertSeverityEnum.CRITICAL if total_overdue > monthly_revenue * 0.3 else AlertSeverityEnum.WARNING
        alerts.append(Alert(
            id=str(uuid.uuid4()),
            type=AlertTypeEnum.OVERDUE_RECEIVABLES,
            severity=severity,
            title=f"💸 R$ {total_overdue:,.2f} em Recebíveis Vencidos",
            message=f"Você tem {len(overdue_receivables)} faturas vencidas totalizando R$ {total_overdue:,.2f}. Priorize a cobrança para melhorar o fluxo de caixa.",
            date=datetime.now(),
            value=total_overdue,
            threshold=monthly_revenue * 0.3,
            is_read=False
        ))

    # Alerta: Projeção Negativa (Fluxo Mensal Negativo)
    if net_monthly_flow < 0:
        alerts.append(Alert(
            id=str(uuid.uuid4()),
            type=AlertTypeEnum.NEGATIVE_PROJECTION,
            severity=AlertSeverityEnum.WARNING,
            title="📉 Fluxo de Caixa Negativo",
            message=f"Fluxo mensal negativo de R$ {net_monthly_flow:,.2f}. Despesas excedem receitas em {abs(net_monthly_flow/monthly_revenue*100):.1f}%.",
            date=datetime.now(),
            value=net_monthly_flow,
            threshold=0.0,
            is_read=False
        ))

    # ========================================
    # 3. GERAR RECOMENDAÇÕES
    # ========================================

    # Recomendação: Cobrar Recebíveis Vencidos
    if total_overdue > 5000:
        potential_impact = total_overdue * 0.7  # Estimativa conservadora de 70% de recuperação
        recommendations.append(Recommendation(
            id=str(uuid.uuid4()),
            type=RecommendationTypeEnum.INCREASE_COLLECTION,
            priority=RecommendationPriorityEnum.HIGH,
            title="🎯 Acelere a Cobrança de Recebíveis",
            description=f"Você tem R$ {total_overdue:,.2f} em recebíveis vencidos ({len(overdue_receivables)} faturas). Cobrar essas faturas pode melhorar significativamente seu fluxo de caixa.",
            potential_impact=f"Potencial de recuperar até R$ {potential_impact:,.2f} nos próximos 30 dias (70% de taxa de sucesso estimada).",
            suggested_actions=[
                "Enviar lembretes automáticos por e-mail/WhatsApp para clientes inadimplentes",
                "Oferecer desconto de 5-10% para pagamento imediato",
                "Renegociar prazos com clientes de maior valor",
                "Revisar política de crédito para novos clientes"
            ],
            estimated_value=potential_impact,
            confidence_score=0.85,
            created_at=datetime.now(),
            is_implemented=False
        ))

    # Recomendação: Reduzir Custos (se burn rate alto)
    if runway_months < 6 and runway_months != float('inf'):
        recommendations.append(Recommendation(
            id=str(uuid.uuid4()),
            type=RecommendationTypeEnum.REDUCE_COSTS,
            priority=RecommendationPriorityEnum.HIGH if runway_months < 3 else RecommendationPriorityEnum.MEDIUM,
            title="✂️ Otimize Despesas para Estender Runway",
            description=f"Com runway de {runway_months:.1f} meses, é recomendável reduzir despesas não essenciais. Reduzir 15-20% das despesas pode aumentar significativamente sua margem de segurança.",
            potential_impact=f"Reduzir 20% das despesas mensais (R$ {monthly_expenses*0.2:,.2f}) pode estender o runway em {runway_months*0.25:.1f} meses.",
            suggested_actions=[
                "Revisar assinaturas e serviços recorrentes não essenciais",
                "Negociar melhores condições com fornecedores",
                "Avaliar terceirização de serviços não-core",
                "Implementar aprovações para despesas acima de R$ 1.000"
            ],
            estimated_value=monthly_expenses * 0.2,
            confidence_score=0.75,
            created_at=datetime.now(),
            is_implemented=False
        ))

    # Recomendação: Otimizar Caixa (se saldo muito alto e sem investimento)
    if current_balance > monthly_expenses * 6:
        estimated_yield = current_balance * 0.01 * 0.8  # 1% a.m. conservador * 80% do saldo
        recommendations.append(Recommendation(
            id=str(uuid.uuid4()),
            type=RecommendationTypeEnum.OPTIMIZE_CASH,
            priority=RecommendationPriorityEnum.LOW,
            title="💰 Otimize Excedente de Caixa",
            description=f"Saldo de R$ {current_balance:,.2f} representa {current_balance/monthly_expenses:.1f} meses de despesas. Parte desse valor poderia render mais em aplicações financeiras.",
            potential_impact=f"Investir 80% do excedente em aplicação conservadora (CDB/Tesouro) pode gerar R$ {estimated_yield:,.2f}/mês adicional.",
            suggested_actions=[
                f"Manter reserva de emergência de 3-6 meses (R$ {monthly_expenses*4:,.2f})",
                "Investir excedente em CDB com liquidez diária",
                "Considerar Tesouro Selic para maior segurança",
                "Avaliar oportunidades de pré-pagamento de dívidas caras"
            ],
            estimated_value=estimated_yield * 12,  # Valor anual
            confidence_score=0.65,
            created_at=datetime.now(),
            is_implemented=False
        ))

    # Recomendação: Negociar Prazos
    payables = db.query(AccountsPayableInvoice).filter(
        AccountsPayableInvoice.workspace_id == workspace_id,
        AccountsPayableInvoice.status.in_(["pending", "approved"])
    ).all()

    total_payables = sum(p.remaining_value for p in payables)

    if total_payables > monthly_revenue * 0.5 and net_monthly_flow < 0:
        recommendations.append(Recommendation(
            id=str(uuid.uuid4()),
            type=RecommendationTypeEnum.NEGOTIATE_TERMS,
            priority=RecommendationPriorityEnum.MEDIUM,
            title="🤝 Negocie Prazos com Fornecedores",
            description=f"Total de R$ {total_payables:,.2f} em contas a pagar. Negociar prazos maiores pode aliviar pressão no fluxo de caixa de curto prazo.",
            potential_impact=f"Estender prazo médio de pagamento em 15 dias pode melhorar liquidez em até R$ {total_payables*0.3:,.2f}.",
            suggested_actions=[
                "Identificar fornecedores estratégicos para negociação",
                "Propor alongamento de prazo em troca de volume garantido",
                "Avaliar possibilidade de parcelamento sem juros",
                "Manter comunicação proativa para evitar atritos"
            ],
            estimated_value=total_payables * 0.3,
            confidence_score=0.70,
            created_at=datetime.now(),
            is_implemented=False
        ))

    # Recomendação: Mitigação de Risco (se fluxo instável)
    if len(transactions) >= 10:  # Só se tiver dados suficientes
        daily_flows = {}
        for t in transactions:
            day = t.transaction_date.date()
            if day not in daily_flows:
                daily_flows[day] = 0
            daily_flows[day] += t.value if t.type == TransactionType.ENTRADA else -t.value

        # Calcular volatilidade (desvio padrão dos fluxos diários)
        flows_list = list(daily_flows.values())
        avg_flow = sum(flows_list) / len(flows_list)
        variance = sum((x - avg_flow) ** 2 for x in flows_list) / len(flows_list)
        std_dev = variance ** 0.5

        # Se volatilidade alta (std_dev > 50% da média de receita diária)
        if std_dev > (monthly_revenue / 30) * 0.5:
            recommendations.append(Recommendation(
                id=str(uuid.uuid4()),
                type=RecommendationTypeEnum.RISK_MITIGATION,
                priority=RecommendationPriorityEnum.MEDIUM,
                title="🛡️ Reduza Volatilidade do Fluxo de Caixa",
                description=f"Fluxo de caixa apresenta alta volatilidade (desvio de R$ {std_dev:,.2f}/dia). Fluxos mais previsíveis facilitam planejamento e reduzem riscos.",
                potential_impact="Maior previsibilidade permite melhor planejamento e redução de custos financeiros (juros, multas).",
                suggested_actions=[
                    "Implementar modelo de receita recorrente (assinaturas/contratos)",
                    "Diversificar base de clientes para reduzir concentração",
                    "Estabelecer fundo de reserva para emergências",
                    "Automatizar cobranças para regularizar entrada de receitas"
                ],
                estimated_value=None,  # Difícil quantificar
                confidence_score=0.60,
                created_at=datetime.now(),
                is_implemented=False
            ))

    # ========================================
    # 4. MONTAR SUMMARY
    # ========================================

    critical_alerts = [a for a in alerts if a.severity == AlertSeverityEnum.CRITICAL]
    high_priority_recs = [r for r in recommendations if r.priority == RecommendationPriorityEnum.HIGH]

    total_estimated_impact = sum(r.estimated_value for r in recommendations if r.estimated_value is not None)

    summary = {
        "total_alerts": len(alerts),
        "critical_alerts": len(critical_alerts),
        "warning_alerts": len([a for a in alerts if a.severity == AlertSeverityEnum.WARNING]),
        "info_alerts": len([a for a in alerts if a.severity == AlertSeverityEnum.INFO]),
        "total_recommendations": len(recommendations),
        "high_priority_recommendations": len(high_priority_recs),
        "medium_priority_recommendations": len([r for r in recommendations if r.priority == RecommendationPriorityEnum.MEDIUM]),
        "low_priority_recommendations": len([r for r in recommendations if r.priority == RecommendationPriorityEnum.LOW]),
        "estimated_total_impact": total_estimated_impact,
        "current_balance": current_balance,
        "monthly_burn_rate": monthly_expenses,
        "runway_months": runway_months if runway_months != float('inf') else None,
        "overdue_amount": total_overdue,
        "health_status": "critical" if len(critical_alerts) > 0 else ("warning" if len(alerts) > 2 else "good")
    }

    logger.info(f"Gerados {len(alerts)} alertas e {len(recommendations)} recomendações para workspace {workspace_id}")

    # Retornar dicionário simples para evitar RecursionError com Pydantic
    return {
        "alerts": [a.model_dump() for a in alerts],
        "recommendations": [r.model_dump() for r in recommendations],
        "summary": summary
    }
