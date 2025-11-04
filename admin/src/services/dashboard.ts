import { api } from '@/lib/api';

/**
 * Estatísticas de receita semanal
 */
export interface WeeklyRevenueStats {
  week_start: string;  // ISO date
  week_end: string;    // ISO date
  revenue: number;
  sales_count: number;
}

/**
 * Estatísticas mensais por canal
 */
export interface ChannelMonthlyStats {
  month: string;       // ISO date (primeiro dia do mês)
  channel: string;
  revenue: number;
  sales_count: number;
}

/**
 * Estatísticas de receita diária
 */
export interface DailyRevenueStats {
  date: string;        // ISO date
  revenue: number;
  sales_count: number;
}

/**
 * Comparação entre mês atual e anterior
 */
export interface MonthComparisonStats {
  current_month_revenue: number;
  current_month_sales: number;
  last_month_revenue: number;
  last_month_sales: number;
  revenue_trend: number;  // Percentual de crescimento/queda
  sales_trend: number;    // Percentual de crescimento/queda
}

/**
 * Resposta agregada do dashboard
 */
export interface DashboardStatsResponse {
  // KPIs principais (podem ser filtrados)
  total_sales: number;
  total_revenue: number;
  average_ticket: number;

  // Dados fixos (sempre sem filtros)
  month_comparison: MonthComparisonStats;
  weekly_revenue: WeeklyRevenueStats[];
  channel_monthly: ChannelMonthlyStats[];
  daily_revenue_30d: DailyRevenueStats[];

  // Metadados
  filters_applied: boolean;
  data_timestamp: string;
}

/**
 * Parâmetros opcionais para filtrar KPIs principais
 */
export interface DashboardStatsParams {
  start_date?: string;  // ISO date format: YYYY-MM-DD
  end_date?: string;    // ISO date format: YYYY-MM-DD
  channels?: string[];  // Lista de canais: ['shopify', 'manual', ...]
}

/**
 * Service para interagir com o endpoint de dashboard agregado.
 *
 * PERFORMANCE:
 * - Endpoint retorna dados já agregados (50-100ms com 50k vendas)
 * - Frontend não precisa fazer filtros/agregações em arrays grandes
 * - Gráficos sempre mostram dados corretos (sem limite de vendas)
 *
 * DADOS FIXOS vs. FILTRADOS:
 * - Os gráficos principais (weekly_revenue, channel_monthly) são SEMPRE fixos
 * - Os KPIs (total_sales, total_revenue, average_ticket) respeitam filtros opcionais
 * - Isso garante que os gráficos não mudem quando o usuário filtra
 */
export const dashboardService = {
  /**
   * Obtém estatísticas agregadas do dashboard.
   *
   * @param params - Filtros opcionais para KPIs principais
   * @returns Dados agregados do dashboard
   *
   * @example
   * // Sem filtros (todos os dados)
   * const stats = await dashboardService.getStats();
   *
   * @example
   * // Com filtro de data (últimos 30 dias)
   * const stats = await dashboardService.getStats({
   *   start_date: '2025-10-05',
   *   end_date: '2025-11-04'
   * });
   *
   * @example
   * // Com filtro de canais
   * const stats = await dashboardService.getStats({
   *   channels: ['shopify', 'manual']
   * });
   */
  async getStats(params?: DashboardStatsParams): Promise<DashboardStatsResponse> {
    const queryParams = new URLSearchParams();

    if (params?.start_date) {
      queryParams.append('start_date', params.start_date);
    }

    if (params?.end_date) {
      queryParams.append('end_date', params.end_date);
    }

    if (params?.channels && params.channels.length > 0) {
      // Backend espera comma-separated string: "shopify,manual"
      queryParams.append('channels', params.channels.join(','));
    }

    const endpoint = `/dashboard/stats${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return api.get<DashboardStatsResponse>(endpoint);
  },

  /**
   * Formata valor monetário para BRL
   */
  formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  },

  /**
   * Formata data para formato brasileiro
   */
  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('pt-BR').format(date);
  },

  /**
   * Formata semana para exibição (ex: "Sem 1", "Sem 2")
   */
  formatWeekLabel(weekStats: WeeklyRevenueStats, index: number): string {
    return `Sem ${index + 1}`;
  },

  /**
   * Formata mês para exibição (ex: "jan", "fev", "mar")
   */
  formatMonthLabel(monthDate: string): string {
    const date = new Date(monthDate);
    return new Intl.DateTimeFormat('pt-BR', { month: 'short' }).format(date);
  },

  /**
   * Agrupa vendas por canal para gráfico de barras empilhadas.
   *
   * @param channelMonthly - Array de estatísticas mensais por canal
   * @returns Dados formatados para o componente SalesByChannelChart
   *
   * @example
   * Input:
   * [
   *   { month: '2025-06-01', channel: 'shopify', revenue: 10000, sales_count: 50 },
   *   { month: '2025-06-01', channel: 'manual', revenue: 5000, sales_count: 25 },
   *   { month: '2025-07-01', channel: 'shopify', revenue: 12000, sales_count: 60 }
   * ]
   *
   * Output:
   * [
   *   { period: 'jun', shopify: 10000, manual: 5000 },
   *   { period: 'jul', shopify: 12000 }
   * ]
   */
  formatChannelChartData(channelMonthly: ChannelMonthlyStats[]): Array<{ period: string; [channel: string]: number | string }> {
    // Agrupar por mês
    const grouped = channelMonthly.reduce((acc, stat) => {
      const monthLabel = dashboardService.formatMonthLabel(stat.month);

      if (!acc[monthLabel]) {
        acc[monthLabel] = { period: monthLabel };
      }

      acc[monthLabel][stat.channel] = stat.revenue;

      return acc;
    }, {} as Record<string, any>);

    // Converter para array
    return Object.values(grouped);
  },

  /**
   * Formata dados de receita semanal para o gráfico.
   *
   * @param weeklyRevenue - Array de estatísticas semanais
   * @returns Dados formatados para o componente RevenueChart
   *
   * @example
   * Input:
   * [
   *   { week_start: '2025-10-07', week_end: '2025-10-13', revenue: 15000, sales_count: 75 },
   *   { week_start: '2025-10-14', week_end: '2025-10-20', revenue: 18000, sales_count: 90 }
   * ]
   *
   * Output:
   * [
   *   { date: 'Sem 1', receita: 15000 },
   *   { date: 'Sem 2', receita: 18000 }
   * ]
   */
  formatWeeklyChartData(weeklyRevenue: WeeklyRevenueStats[]): Array<{ date: string; receita: number }> {
    return weeklyRevenue.map((week, index) => ({
      date: dashboardService.formatWeekLabel(week, index),
      receita: week.revenue
    }));
  },

  /**
   * Extrai dados para sparkline (mini-gráfico nos cards).
   *
   * @param dailyRevenue - Array de receita diária (30 dias)
   * @returns Array de valores para o componente Sparkline
   */
  formatSparklineData(dailyRevenue: DailyRevenueStats[]): number[] {
    return dailyRevenue.map(day => day.revenue);
  }
};
