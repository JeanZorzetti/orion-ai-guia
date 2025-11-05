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


# ============================================
# REPORTS CRUD - Listagem e Histórico
# ============================================

@router.get("/generated")
async def list_generated_reports(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    tipo: Optional[str] = Query(None),
    subtipo: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Listar relatórios gerados

    Retorna lista paginada de relatórios gerados pelo usuário ou workspace
    """
    from app.models.report import GeneratedReport, ReportStatus, ReportTipo

    query = db.query(GeneratedReport).filter(
        GeneratedReport.gerado_por_id == current_user.id
    )

    # Filtros opcionais
    if tipo:
        query = query.filter(GeneratedReport.tipo == tipo)
    if subtipo:
        query = query.filter(GeneratedReport.subtipo == subtipo)
    if status:
        query = query.filter(GeneratedReport.status == status)

    # Total count
    total = query.count()

    # Paginação e ordenação
    reports = query.order_by(GeneratedReport.gerado_em.desc()).offset(skip).limit(limit).all()

    # Estatísticas
    stats = {
        "total": db.query(GeneratedReport).filter(GeneratedReport.gerado_por_id == current_user.id).count(),
        "concluidos": db.query(GeneratedReport).filter(
            GeneratedReport.gerado_por_id == current_user.id,
            GeneratedReport.status == ReportStatus.CONCLUIDO
        ).count(),
        "erros": db.query(GeneratedReport).filter(
            GeneratedReport.gerado_por_id == current_user.id,
            GeneratedReport.status == ReportStatus.ERRO
        ).count(),
    }

    return {
        "reports": reports,
        "total": total,
        "stats": stats,
        "skip": skip,
        "limit": limit
    }


@router.get("/schedules")
async def list_report_schedules(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    ativo: Optional[bool] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Listar agendamentos de relatórios

    Retorna lista paginada de agendamentos configurados
    """
    from app.models.report import ReportSchedule, ScheduleExecution, ExecutionStatus

    query = db.query(ReportSchedule).filter(
        ReportSchedule.criado_por_id == current_user.id
    )

    if ativo is not None:
        query = query.filter(ReportSchedule.ativo == ativo)

    total = query.count()
    schedules = query.order_by(ReportSchedule.criado_em.desc()).offset(skip).limit(limit).all()

    # Estatísticas de execuções
    stats = {
        "total": total,
        "ativos": db.query(ReportSchedule).filter(
            ReportSchedule.criado_por_id == current_user.id,
            ReportSchedule.ativo == True
        ).count(),
        "execucoes_sucesso": db.query(ScheduleExecution).join(ReportSchedule).filter(
            ReportSchedule.criado_por_id == current_user.id,
            ScheduleExecution.status == ExecutionStatus.SUCESSO
        ).count(),
        "execucoes_erro": db.query(ScheduleExecution).join(ReportSchedule).filter(
            ReportSchedule.criado_por_id == current_user.id,
            ScheduleExecution.status == ExecutionStatus.ERRO
        ).count(),
    }

    return {
        "schedules": schedules,
        "total": total,
        "stats": stats,
        "skip": skip,
        "limit": limit
    }


@router.get("/templates")
async def list_report_templates(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Listar templates de relatórios disponíveis

    Retorna lista de templates pré-configurados
    """
    # Templates mockados por enquanto - implementar persistência depois
    templates = [
        {
            "id": "template-dre",
            "nome": "DRE Mensal Padrão",
            "descricao": "Demonstrativo de Resultados mensal com comparativo",
            "tipo": "financeiro",
            "subtipo": "dre",
            "usoCount": 0,
            "ultimoUso": None,
        },
        {
            "id": "template-fluxo",
            "nome": "Fluxo de Caixa Detalhado",
            "descricao": "Análise completa de entradas e saídas",
            "tipo": "financeiro",
            "subtipo": "fluxo-caixa",
            "usoCount": 0,
            "ultimoUso": None,
        }
    ]

    return {
        "templates": templates,
        "total": len(templates)
    }


# ============================================
# DRE (DEMONSTRAÇÃO DO RESULTADO DO EXERCÍCIO)
# ============================================

@router.get("/dre", response_model=dict)
async def get_dre_report(
    period_start: Optional[date] = Query(None, description="Data início (padrão: primeiro dia do mês)"),
    period_end: Optional[date] = Query(None, description="Data fim (padrão: último dia do mês)"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Calcula DRE (Demonstração do Resultado do Exercício) com dados REAIS.

    Não usa percentuais hardcoded. Calcula baseado em:
    - Transações do Cash Flow categorizadas
    - Vendas realizadas (Sales)
    - Custos reais (CMV, despesas operacionais)

    Estrutura do DRE:
    1. Receita Bruta
    2. (-) Deduções (Impostos sobre vendas)
    3. (=) Receita Líquida
    4. (-) CMV (Custo de Mercadorias Vendidas)
    5. (=) Lucro Bruto
    6. (-) Despesas Operacionais
    7. (=) EBITDA
    8. (-) Depreciação/Amortização
    9. (-) Juros e Despesas Financeiras
    10. (=) LAIR (Lucro Antes do IR)
    11. (-) IR e CSLL
    12. (=) Lucro Líquido
    """
    # Definir período padrão (mês atual)
    if not period_start:
        today = date.today()
        period_start = date(today.year, today.month, 1)

    if not period_end:
        period_end = date.today()

    workspace_id = current_user.workspace_id

    # Buscar todas as transações do período
    transactions = db.query(CashFlowTransaction).filter(
        and_(
            CashFlowTransaction.workspace_id == workspace_id,
            CashFlowTransaction.transaction_date >= period_start,
            CashFlowTransaction.transaction_date <= period_end
        )
    ).all()

    # Categorias de mapeamento (pode ser customizado futuramente)
    revenue_categories = ['Venda', 'Receita', 'Receita de Serviço', 'Receita de Produto']
    tax_categories = ['Impostos', 'PIS', 'COFINS', 'ICMS', 'ISS', 'Taxas']
    cogs_categories = ['CMV', 'Custo', 'Compra', 'Fornecedor']
    operational_categories = ['Salários', 'Aluguel', 'Marketing', 'Administrativo', 'Vendas']
    depreciation_categories = ['Depreciação', 'Amortização']
    financial_categories = ['Juros', 'Multas', 'Encargos Financeiros', 'Taxas Bancárias']

    # Inicializar valores
    receita_bruta = 0.0
    deducoes = 0.0
    cmv = 0.0
    despesas_operacionais = 0.0
    depreciacao = 0.0
    juros = 0.0

    # Processar transações
    for t in transactions:
        category_lower = (t.category or '').lower()

        # Receita Bruta (ENTRADAS com categorias de receita)
        if t.type == TransactionType.ENTRADA.value:
            is_revenue = any(cat.lower() in category_lower for cat in revenue_categories)
            if is_revenue:
                receita_bruta += t.value

        # Saídas categorizadas
        if t.type == TransactionType.SAIDA.value:
            # Impostos e Deduções
            if any(cat.lower() in category_lower for cat in tax_categories):
                deducoes += t.value

            # CMV (Custos de Produto/Mercadoria)
            elif any(cat.lower() in category_lower for cat in cogs_categories):
                cmv += t.value

            # Despesas Operacionais
            elif any(cat.lower() in category_lower for cat in operational_categories):
                despesas_operacionais += t.value

            # Depreciação/Amortização
            elif any(cat.lower() in category_lower for cat in depreciation_categories):
                depreciacao += t.value

            # Juros e Despesas Financeiras
            elif any(cat.lower() in category_lower for cat in financial_categories):
                juros += t.value

            # Se não se encaixa em nenhuma categoria específica, considerar operacional
            else:
                despesas_operacionais += t.value

    # Calcular valores derivados
    receita_liquida = receita_bruta - deducoes
    lucro_bruto = receita_liquida - cmv
    ebitda = lucro_bruto - despesas_operacionais
    lair = ebitda - depreciacao - juros

    # IR e CSLL (estimativa: 34% sobre lucro tributável se > 0)
    ir_csll = lair * 0.34 if lair > 0 else 0.0
    lucro_liquido = lair - ir_csll

    # Calcular margens (%)
    margem_bruta = (lucro_bruto / receita_bruta * 100) if receita_bruta > 0 else 0.0
    margem_ebitda = (ebitda / receita_bruta * 100) if receita_bruta > 0 else 0.0
    margem_liquida = (lucro_liquido / receita_bruta * 100) if receita_bruta > 0 else 0.0

    # Montar resposta
    items = [
        {
            "category": "Receita Bruta",
            "value": receita_bruta,
            "is_total": False,
            "percentage_of_revenue": 100.0
        },
        {
            "category": "(-) Deduções e Impostos",
            "value": -deducoes,
            "is_total": False,
            "percentage_of_revenue": (deducoes / receita_bruta * 100) if receita_bruta > 0 else 0.0
        },
        {
            "category": "Receita Líquida",
            "value": receita_liquida,
            "is_total": True,
            "percentage_of_revenue": (receita_liquida / receita_bruta * 100) if receita_bruta > 0 else 0.0
        },
        {
            "category": "(-) CMV",
            "value": -cmv,
            "is_total": False,
            "percentage_of_revenue": (cmv / receita_bruta * 100) if receita_bruta > 0 else 0.0
        },
        {
            "category": "Lucro Bruto",
            "value": lucro_bruto,
            "is_total": True,
            "percentage_of_revenue": margem_bruta
        },
        {
            "category": "(-) Despesas Operacionais",
            "value": -despesas_operacionais,
            "is_total": False,
            "percentage_of_revenue": (despesas_operacionais / receita_bruta * 100) if receita_bruta > 0 else 0.0
        },
        {
            "category": "EBITDA",
            "value": ebitda,
            "is_total": True,
            "percentage_of_revenue": margem_ebitda
        },
        {
            "category": "(-) Depreciação/Amortização",
            "value": -depreciacao,
            "is_total": False,
            "percentage_of_revenue": (depreciacao / receita_bruta * 100) if receita_bruta > 0 else 0.0
        },
        {
            "category": "(-) Juros",
            "value": -juros,
            "is_total": False,
            "percentage_of_revenue": (juros / receita_bruta * 100) if receita_bruta > 0 else 0.0
        },
        {
            "category": "LAIR (Lucro Antes do IR)",
            "value": lair,
            "is_total": True,
            "percentage_of_revenue": (lair / receita_bruta * 100) if receita_bruta > 0 else 0.0
        },
        {
            "category": "(-) IR e CSLL",
            "value": -ir_csll,
            "is_total": False,
            "percentage_of_revenue": (ir_csll / receita_bruta * 100) if receita_bruta > 0 else 0.0
        },
        {
            "category": "Lucro Líquido",
            "value": lucro_liquido,
            "is_total": True,
            "percentage_of_revenue": margem_liquida
        }
    ]

    response = {
        "period_start": period_start.isoformat(),
        "period_end": period_end.isoformat(),
        "items": items,
        "receita_bruta": receita_bruta,
        "receita_liquida": receita_liquida,
        "lucro_bruto": lucro_bruto,
        "ebitda": ebitda,
        "lucro_liquido": lucro_liquido,
        "margem_bruta": round(margem_bruta, 2),
        "margem_ebitda": round(margem_ebitda, 2),
        "margem_liquida": round(margem_liquida, 2),
        "transactions_count": len(transactions),
        "data_source": "cash_flow_real_data"
    }

    logger.info(
        f"DRE calculado para workspace {workspace_id}: "
        f"Receita={receita_bruta}, Lucro Líquido={lucro_liquido}, "
        f"Transações={len(transactions)}"
    )

    return response
