import { useState, useEffect, useCallback } from 'react';
import type { BreakEvenAnalysis } from '@/types/cash-flow';
import { api } from '@/lib/api';

interface UseBreakEvenAnalysisReturn {
  breakEven: BreakEvenAnalysis | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

interface BreakEvenPoint {
  date: string;
  revenue: number;
  fixed_costs: number;
  variable_costs: number;
  total_costs: number;
  profit: number;
  is_break_even: boolean;
}

interface BreakEvenAnalysisAPIResponse {
  current_revenue: number;
  current_fixed_costs: number;
  current_variable_costs: number;
  current_total_costs: number;
  current_profit: number;
  break_even_revenue: number;
  break_even_units: number | null;
  revenue_gap: number;
  revenue_gap_percentage: number;
  contribution_margin: number;
  contribution_margin_percentage: number;
  chart_data: BreakEvenPoint[];
  period_start: string;
  period_end: string;
  period_days: number;
}

export const useBreakEvenAnalysis = (periodDays: number = 30): UseBreakEvenAnalysisReturn => {
  const [breakEven, setBreakEven] = useState<BreakEvenAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBreakEvenAnalysis = useCallback(async () => {
    console.log('🔄 [useBreakEvenAnalysis] Carregando análise de break-even para', periodDays, 'dias');
    setLoading(true);
    setError(null);

    try {
      const response = await api.get<BreakEvenAnalysisAPIResponse>(
        `/cash-flow/analytics/break-even?period_days=${periodDays}`
      );

      console.log('✅ [useBreakEvenAnalysis] Dados recebidos:', response);

      // Transformar dados da API para o formato do componente
      const currentMonthRevenue = response.current_revenue;
      const breakEvenRevenue = response.break_even_revenue;

      // Calcular margem atual: (Receita - Custos Totais) / Receita * 100
      const margemAtual = currentMonthRevenue > 0
        ? ((currentMonthRevenue - response.current_total_costs) / currentMonthRevenue) * 100
        : 0;

      // Calcular data prevista para break-even
      // Se já estamos acima do break-even, usar data atual
      // Se não, estimar baseado no crescimento necessário
      const hoje = new Date();
      let dataPrevist = hoje;

      if (currentMonthRevenue < breakEvenRevenue) {
        // Estimar meses necessários baseado na diferença de receita
        const gapPercentual = Math.abs(response.revenue_gap_percentage);
        // Assumir crescimento de 5% ao mês (conservador)
        const crescimentoMensal = 5;
        const mesesEstimados = Math.ceil(gapPercentual / crescimentoMensal);
        dataPrevist = new Date(hoje.getFullYear(), hoje.getMonth() + mesesEstimados, 1);
      }

      // Transformar chart_data para formato de projeção
      const projecao = response.chart_data.map((point) => {
        const pointDate = new Date(point.date);
        return {
          mes: pointDate.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }),
          receitas: point.revenue,
          despesas: point.total_costs,
          breakEven: breakEvenRevenue // Linha horizontal do break-even
        };
      });

      const transformedBreakEven: BreakEvenAnalysis = {
        receitaBreakEven: breakEvenRevenue,
        dataPrevist,
        margemAtual,
        current_revenue: response.current_revenue,
        current_total_costs: response.current_total_costs,
        revenue_gap: response.revenue_gap,
        projecao
      };

      setBreakEven(transformedBreakEven);
    } catch (err) {
      console.error('❌ [useBreakEvenAnalysis] Erro ao buscar análise:', err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar análise de break-even');
    } finally {
      setLoading(false);
    }
  }, [periodDays]);

  useEffect(() => {
    fetchBreakEvenAnalysis();
  }, [fetchBreakEvenAnalysis]);

  return {
    breakEven,
    loading,
    error,
    refetch: fetchBreakEvenAnalysis
  };
};
