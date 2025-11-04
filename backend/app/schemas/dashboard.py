from pydantic import BaseModel
from typing import List, Dict, Optional
from datetime import date


class WeeklyRevenueStats(BaseModel):
    """Estatísticas de receita semanal"""
    week_start: date
    week_end: date
    revenue: float
    sales_count: int


class ChannelMonthlyStats(BaseModel):
    """Estatísticas mensais por canal"""
    month: date
    channel: str
    revenue: float
    sales_count: int


class DailyRevenueStats(BaseModel):
    """Estatísticas de receita diária"""
    date: date
    revenue: float
    sales_count: int


class MonthComparisonStats(BaseModel):
    """Comparação entre mês atual e anterior"""
    current_month_revenue: float
    current_month_sales: int
    last_month_revenue: float
    last_month_sales: int
    revenue_trend: float
    sales_trend: float


class DashboardStatsResponse(BaseModel):
    """
    Resposta agregada para o dashboard.
    Retorna dados já calculados, evitando processamento no frontend.
    """
    # KPIs principais (últimos 30 dias ou filtrado)
    total_sales: int
    total_revenue: float
    average_ticket: float

    # Comparação mês a mês (sempre sem filtros)
    month_comparison: MonthComparisonStats

    # Gráfico: Receita das últimas 4 semanas (sempre sem filtros)
    weekly_revenue: List[WeeklyRevenueStats]

    # Gráfico: Vendas por canal (últimos 6 meses, sempre sem filtros)
    channel_monthly: List[ChannelMonthlyStats]

    # Sparkline: Receita dos últimos 30 dias (sempre sem filtros)
    daily_revenue_30d: List[DailyRevenueStats]

    # Metadados
    filters_applied: bool
    data_timestamp: str

    class Config:
        from_attributes = True
