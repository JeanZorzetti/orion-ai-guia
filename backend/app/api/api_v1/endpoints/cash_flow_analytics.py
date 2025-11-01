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

from app.core.deps import get_current_user, get_db
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
