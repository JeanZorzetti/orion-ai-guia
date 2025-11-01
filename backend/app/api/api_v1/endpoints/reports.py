"""
Endpoints de Relatórios Financeiros

Endpoints para Executive Dashboard, geração de relatórios e agendamentos.

Responsável: Jean Zorzetti + Claude
Data: 2025-11-01
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_, case, desc
from typing import Optional, List
from datetime import datetime, date, timedelta
import logging

from app.core.database import get_db
from app.models.user import User
from app.models.cash_flow import CashFlowTransaction, BankAccount, TransactionType
from app.models.accounts_receivable import AccountsReceivable
from app.models.accounts_payable import AccountsPayableInvoice
from app.schemas.report import (
    ExecutiveDashboardKPIsResponse,
    ExecutiveDashboardKPI,
    ExecutiveDashboardChartsResponse,
    ExecutiveDashboardChart,
    ChartData,
    ChartDataset,
    ChartConfig,
    ExecutiveDashboardInsightsResponse,
    ComparisonMetric,
    Insight
)
from app.core.deps import get_current_user

router = APIRouter()
logger = logging.getLogger(__name__)


# ============================================
# EXECUTIVE DASHBOARD - KPIs
# ============================================

@router.get("/executive-dashboard/kpis", response_model=ExecutiveDashboardKPIsResponse)
async def get_executive_dashboard_kpis(
    period_start: Optional[date] = Query(None, description="Data início do período"),
    period_end: Optional[date] = Query(None, description="Data fim do período"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Retorna KPIs consolidados do Executive Dashboard

    - Receita Total
    - Despesas Totais
    - Lucro Líquido
    - Margem de Lucro
    - Total de Vendas
    - Ticket Médio
    - Valor em Estoque (se aplicável)
    - Giro de Estoque (se aplicável)

    Calcula variação percentual vs período anterior.
    """

    # Definir período padrão (mês atual)
    if not period_end:
        period_end = date.today()
    if not period_start:
        period_start = date(period_end.year, period_end.month, 1)

    # Calcular período de comparação (período anterior)
    days_diff = (period_end - period_start).days
    comparison_end = period_start - timedelta(days=1)
    comparison_start = comparison_end - timedelta(days=days_diff)

    logger.info(f"Calculando KPIs para período {period_start} a {period_end}")
    logger.info(f"Período de comparação: {comparison_start} a {comparison_end}")

    # ============================================
    # PERÍODO ATUAL
    # ============================================

    # Receitas do período atual (CashFlowTransaction + AccountsReceivable recebidos)
    receitas_transacoes = db.query(
        func.coalesce(func.sum(CashFlowTransaction.value), 0)
    ).filter(
        and_(
            CashFlowTransaction.type == TransactionType.ENTRADA,
            CashFlowTransaction.transaction_date >= period_start,
            CashFlowTransaction.transaction_date <= period_end
        )
    ).scalar() or 0.0

    receitas_recebidas = db.query(
        func.coalesce(func.sum(AccountsReceivable.paid_value), 0)
    ).filter(
        and_(
            AccountsReceivable.payment_date >= period_start,
            AccountsReceivable.payment_date <= period_end,
            AccountsReceivable.paid_value > 0
        )
    ).scalar() or 0.0

    receita_total_atual = receitas_transacoes + receitas_recebidas

    # Despesas do período atual (CashFlowTransaction + AccountsPayable pagos)
    despesas_transacoes = db.query(
        func.coalesce(func.sum(CashFlowTransaction.value), 0)
    ).filter(
        and_(
            CashFlowTransaction.type == TransactionType.SAIDA,
            CashFlowTransaction.transaction_date >= period_start,
            CashFlowTransaction.transaction_date <= period_end
        )
    ).scalar() or 0.0

    despesas_pagas = db.query(
        func.coalesce(func.sum(AccountsPayableInvoice.paid_value), 0)
    ).filter(
        and_(
            AccountsPayableInvoice.payment_date >= period_start,
            AccountsPayableInvoice.payment_date <= period_end,
            AccountsPayableInvoice.paid_value > 0
        )
    ).scalar() or 0.0

    despesa_total_atual = despesas_transacoes + despesas_pagas

    # Lucro e Margem
    lucro_atual = receita_total_atual - despesa_total_atual
    margem_atual = (lucro_atual / receita_total_atual * 100) if receita_total_atual > 0 else 0

    # Total de vendas (contar transações de entrada)
    total_vendas_atual = db.query(
        func.count(CashFlowTransaction.id)
    ).filter(
        and_(
            CashFlowTransaction.type == TransactionType.ENTRADA,
            CashFlowTransaction.transaction_date >= period_start,
            CashFlowTransaction.transaction_date <= period_end
        )
    ).scalar() or 0

    # Ticket médio
    ticket_medio_atual = receita_total_atual / total_vendas_atual if total_vendas_atual > 0 else 0

    # ============================================
    # PERÍODO DE COMPARAÇÃO
    # ============================================

    # Receitas período anterior
    receitas_transacoes_ant = db.query(
        func.coalesce(func.sum(CashFlowTransaction.value), 0)
    ).filter(
        and_(
            CashFlowTransaction.type == TransactionType.ENTRADA,
            CashFlowTransaction.transaction_date >= comparison_start,
            CashFlowTransaction.transaction_date <= comparison_end
        )
    ).scalar() or 0.0

    receitas_recebidas_ant = db.query(
        func.coalesce(func.sum(AccountsReceivable.paid_value), 0)
    ).filter(
        and_(
            AccountsReceivable.payment_date >= comparison_start,
            AccountsReceivable.payment_date <= comparison_end,
            AccountsReceivable.paid_value > 0
        )
    ).scalar() or 0.0

    receita_total_anterior = receitas_transacoes_ant + receitas_recebidas_ant

    # Despesas período anterior
    despesas_transacoes_ant = db.query(
        func.coalesce(func.sum(CashFlowTransaction.value), 0)
    ).filter(
        and_(
            CashFlowTransaction.type == TransactionType.SAIDA,
            CashFlowTransaction.transaction_date >= comparison_start,
            CashFlowTransaction.transaction_date <= comparison_end
        )
    ).scalar() or 0.0

    despesas_pagas_ant = db.query(
        func.coalesce(func.sum(AccountsPayableInvoice.paid_value), 0)
    ).filter(
        and_(
            AccountsPayableInvoice.payment_date >= comparison_start,
            AccountsPayableInvoice.payment_date <= comparison_end,
            AccountsPayableInvoice.paid_value > 0
        )
    ).scalar() or 0.0

    despesa_total_anterior = despesas_transacoes_ant + despesas_pagas_ant

    # Lucro e Margem anterior
    lucro_anterior = receita_total_anterior - despesa_total_anterior
    margem_anterior = (lucro_anterior / receita_total_anterior * 100) if receita_total_anterior > 0 else 0

    # Total de vendas anterior
    total_vendas_anterior = db.query(
        func.count(CashFlowTransaction.id)
    ).filter(
        and_(
            CashFlowTransaction.type == TransactionType.ENTRADA,
            CashFlowTransaction.transaction_date >= comparison_start,
            CashFlowTransaction.transaction_date <= comparison_end
        )
    ).scalar() or 0

    # Ticket médio anterior
    ticket_medio_anterior = receita_total_anterior / total_vendas_anterior if total_vendas_anterior > 0 else 0

    # ============================================
    # CALCULAR VARIAÇÕES
    # ============================================

    def calcular_variacao(atual: float, anterior: float) -> tuple[float, float, str]:
        """Retorna (variacao_percentual, variacao_absoluta, tendencia)"""
        if anterior == 0:
            if atual > 0:
                return (100.0, atual, 'up')
            else:
                return (0.0, 0.0, 'stable')

        variacao_abs = atual - anterior
        variacao_pct = (variacao_abs / abs(anterior)) * 100

        if variacao_pct > 1:
            tendencia = 'up'
        elif variacao_pct < -1:
            tendencia = 'down'
        else:
            tendencia = 'stable'

        return (variacao_pct, variacao_abs, tendencia)

    # Calcular variações
    var_receita = calcular_variacao(receita_total_atual, receita_total_anterior)
    var_despesa = calcular_variacao(despesa_total_atual, despesa_total_anterior)
    var_lucro = calcular_variacao(lucro_atual, lucro_anterior)
    var_margem = calcular_variacao(margem_atual, margem_anterior)
    var_vendas = calcular_variacao(float(total_vendas_atual), float(total_vendas_anterior))
    var_ticket = calcular_variacao(ticket_medio_atual, ticket_medio_anterior)

    # ============================================
    # MONTAR KPIs
    # ============================================

    kpis = [
        ExecutiveDashboardKPI(
            id="receita-total",
            titulo="Receita Total",
            valor=receita_total_atual,
            valorFormatado=f"R$ {receita_total_atual:,.2f}".replace(",", "X").replace(".", ",").replace("X", "."),
            variacao=var_receita[0],
            variacaoAbsoluta=var_receita[1],
            tendencia=var_receita[2],
            categoria="receita",
            cor="#10b981"
        ),
        ExecutiveDashboardKPI(
            id="despesa-total",
            titulo="Despesas Totais",
            valor=despesa_total_atual,
            valorFormatado=f"R$ {despesa_total_atual:,.2f}".replace(",", "X").replace(".", ",").replace("X", "."),
            variacao=var_despesa[0],
            variacaoAbsoluta=var_despesa[1],
            tendencia=var_despesa[2],
            categoria="despesa",
            cor="#ef4444"
        ),
        ExecutiveDashboardKPI(
            id="lucro-liquido",
            titulo="Lucro Líquido",
            valor=lucro_atual,
            valorFormatado=f"R$ {lucro_atual:,.2f}".replace(",", "X").replace(".", ",").replace("X", "."),
            variacao=var_lucro[0],
            variacaoAbsoluta=var_lucro[1],
            tendencia=var_lucro[2],
            categoria="lucro",
            cor="#3b82f6"
        ),
        ExecutiveDashboardKPI(
            id="margem-lucro",
            titulo="Margem de Lucro",
            valor=margem_atual,
            valorFormatado=f"{margem_atual:.2f}%",
            variacao=var_margem[0],
            variacaoAbsoluta=var_margem[1],
            tendencia=var_margem[2],
            categoria="lucro",
            cor="#8b5cf6"
        ),
        ExecutiveDashboardKPI(
            id="vendas-total",
            titulo="Total de Vendas",
            valor=float(total_vendas_atual),
            valorFormatado=f"{total_vendas_atual} vendas",
            variacao=var_vendas[0],
            variacaoAbsoluta=var_vendas[1],
            tendencia=var_vendas[2],
            categoria="vendas",
            cor="#f59e0b"
        ),
        ExecutiveDashboardKPI(
            id="ticket-medio",
            titulo="Ticket Médio",
            valor=ticket_medio_atual,
            valorFormatado=f"R$ {ticket_medio_atual:,.2f}".replace(",", "X").replace(".", ",").replace("X", "."),
            variacao=var_ticket[0],
            variacaoAbsoluta=var_ticket[1],
            tendencia=var_ticket[2],
            categoria="vendas",
            cor="#06b6d4"
        )
    ]

    return ExecutiveDashboardKPIsResponse(
        kpis=kpis,
        periodo_inicio=period_start,
        periodo_fim=period_end,
        periodo_comparacao_inicio=comparison_start,
        periodo_comparacao_fim=comparison_end
    )


# ============================================
# EXECUTIVE DASHBOARD - CHARTS
# ============================================

@router.get("/executive-dashboard/charts", response_model=ExecutiveDashboardChartsResponse)
async def get_executive_dashboard_charts(
    period_start: Optional[date] = Query(None, description="Data início do período"),
    period_end: Optional[date] = Query(None, description="Data fim do período"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Retorna gráficos do Executive Dashboard

    - Receita vs Despesa Mensal (últimos 6 meses)
    - Fluxo de Caixa Acumulado
    - Distribuição por Categoria (se disponível)
    """

    # Definir período padrão (últimos 6 meses)
    if not period_end:
        period_end = date.today()
    if not period_start:
        period_start = period_end - timedelta(days=180)  # ~6 meses

    logger.info(f"Gerando gráficos para período {period_start} a {period_end}")

    graficos: List[ExecutiveDashboardChart] = []

    # ============================================
    # GRÁFICO 1: Receita vs Despesa Mensal
    # ============================================

    # Agrupar por mês
    from sqlalchemy import extract

    # Receitas por mês
    receitas_por_mes = db.query(
        extract('year', CashFlowTransaction.transaction_date).label('ano'),
        extract('month', CashFlowTransaction.transaction_date).label('mes'),
        func.sum(CashFlowTransaction.value).label('total')
    ).filter(
        and_(
            CashFlowTransaction.type == TransactionType.ENTRADA,
            CashFlowTransaction.transaction_date >= period_start,
            CashFlowTransaction.transaction_date <= period_end
        )
    ).group_by('ano', 'mes').order_by('ano', 'mes').all()

    # Despesas por mês
    despesas_por_mes = db.query(
        extract('year', CashFlowTransaction.transaction_date).label('ano'),
        extract('month', CashFlowTransaction.transaction_date).label('mes'),
        func.sum(CashFlowTransaction.value).label('total')
    ).filter(
        and_(
            CashFlowTransaction.type == TransactionType.SAIDA,
            CashFlowTransaction.transaction_date >= period_start,
            CashFlowTransaction.transaction_date <= period_end
        )
    ).group_by('ano', 'mes').order_by('ano', 'mes').all()

    # Criar dicionários para fácil acesso
    receitas_dict = {(int(r.ano), int(r.mes)): float(r.total) for r in receitas_por_mes}
    despesas_dict = {(int(d.ano), int(d.mes)): float(d.total) for d in despesas_por_mes}

    # Gerar todos os meses do período
    meses_labels = []
    receitas_data = []
    despesas_data = []

    current_date = period_start
    while current_date <= period_end:
        mes_key = (current_date.year, current_date.month)
        meses_labels.append(current_date.strftime('%b/%y'))
        receitas_data.append(receitas_dict.get(mes_key, 0.0))
        despesas_data.append(despesas_dict.get(mes_key, 0.0))

        # Próximo mês
        if current_date.month == 12:
            current_date = date(current_date.year + 1, 1, 1)
        else:
            current_date = date(current_date.year, current_date.month + 1, 1)

    graficos.append(ExecutiveDashboardChart(
        id="receita-despesa-mensal",
        titulo="Receita vs Despesa (Últimos Meses)",
        tipo="barra",
        dados=ChartData(
            labels=meses_labels,
            datasets=[
                ChartDataset(
                    label="Receita",
                    data=receitas_data,
                    backgroundColor="#10b981"
                ),
                ChartDataset(
                    label="Despesa",
                    data=despesas_data,
                    backgroundColor="#ef4444"
                )
            ]
        ),
        config=ChartConfig(
            showLegend=True,
            showGrid=True,
            showTooltip=True,
            enableDrillDown=True
        )
    ))

    # ============================================
    # GRÁFICO 2: Fluxo de Caixa Acumulado
    # ============================================

    # Saldo inicial (soma de todos os saldos das contas)
    saldo_inicial = db.query(
        func.coalesce(func.sum(BankAccount.current_balance), 0)
    ).scalar() or 0.0

    # Calcular fluxo acumulado dia a dia
    labels_fluxo = []
    dados_fluxo = []
    saldo_acumulado = saldo_inicial

    # Pegar últimos 30 dias
    dias = 30
    data_inicial_fluxo = period_end - timedelta(days=dias)

    for i in range(dias + 1):
        data_atual = data_inicial_fluxo + timedelta(days=i)

        # Receitas do dia
        receitas_dia = db.query(
            func.coalesce(func.sum(CashFlowTransaction.value), 0)
        ).filter(
            and_(
                CashFlowTransaction.type == TransactionType.ENTRADA,
                CashFlowTransaction.transaction_date == data_atual
            )
        ).scalar() or 0.0

        # Despesas do dia
        despesas_dia = db.query(
            func.coalesce(func.sum(CashFlowTransaction.value), 0)
        ).filter(
            and_(
                CashFlowTransaction.type == TransactionType.SAIDA,
                CashFlowTransaction.transaction_date == data_atual
            )
        ).scalar() or 0.0

        saldo_acumulado += (receitas_dia - despesas_dia)

        labels_fluxo.append(data_atual.strftime('%d/%m'))
        dados_fluxo.append(saldo_acumulado)

    graficos.append(ExecutiveDashboardChart(
        id="fluxo-caixa-acumulado",
        titulo="Fluxo de Caixa Acumulado (Últimos 30 Dias)",
        tipo="area",
        dados=ChartData(
            labels=labels_fluxo,
            datasets=[
                ChartDataset(
                    label="Saldo",
                    data=dados_fluxo,
                    backgroundColor="#3b82f6",
                    borderColor="#2563eb"
                )
            ]
        ),
        config=ChartConfig(
            showLegend=False,
            showGrid=True,
            showTooltip=True,
            enableDrillDown=False
        )
    ))

    return ExecutiveDashboardChartsResponse(graficos=graficos)


# ============================================
# EXECUTIVE DASHBOARD - INSIGHTS
# ============================================

@router.get("/executive-dashboard/insights", response_model=ExecutiveDashboardInsightsResponse)
async def get_executive_dashboard_insights(
    period_start: Optional[date] = Query(None, description="Data início do período"),
    period_end: Optional[date] = Query(None, description="Data fim do período"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Retorna insights inteligentes e análise comparativa

    - Análise comparativa vs período anterior
    - Insights automáticos baseados em regras de negócio
    """

    # Definir período padrão (mês atual)
    if not period_end:
        period_end = date.today()
    if not period_start:
        period_start = date(period_end.year, period_end.month, 1)

    # Calcular período de comparação
    days_diff = (period_end - period_start).days
    comparison_end = period_start - timedelta(days=1)
    comparison_start = comparison_end - timedelta(days=days_diff)

    logger.info(f"Gerando insights para período {period_start} a {period_end}")

    # Buscar métricas (reutilizar lógica do endpoint de KPIs)
    # Simplificado para o exemplo

    # TODO: Implementar análise comparativa completa
    # TODO: Implementar algoritmo de insights inteligentes

    comparacao = {
        "periodo": f"{period_start.strftime('%d/%m/%Y')} - {period_end.strftime('%d/%m/%Y')}",
        "periodoAnterior": f"{comparison_start.strftime('%d/%m/%Y')} - {comparison_end.strftime('%d/%m/%Y')}",
        "metricas": []
    }

    insights: List[Insight] = [
        Insight(
            id="insight-1",
            tipo="neutro",
            titulo="Análise em Desenvolvimento",
            descricao="Os insights inteligentes serão gerados após a implementação completa do algoritmo de análise.",
            icone="Info"
        )
    ]

    return ExecutiveDashboardInsightsResponse(
        comparacao=comparacao,
        insights=insights
    )
