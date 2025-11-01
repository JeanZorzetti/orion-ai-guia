import { useState, useEffect, useCallback } from 'react';
import type { FinancialKPIs } from '@/types/cash-flow';
import { api } from '@/lib/api';

interface UseFinancialKPIsReturn {
  kpis: FinancialKPIs | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

interface FinancialKPIsAPIResponse {
  liquidez_imediata?: number | null;
  liquidez_corrente?: number | null;
  pmr?: number | null;
  pmp?: number | null;
  ciclo_financeiro?: number | null;
  margem_liquida?: number | null;
  margem_ebitda?: number | null;
  roa?: number | null;
  roe?: number | null;
  burn_rate?: number | null;
  runway?: number | null;
  endividamento_total?: number | null;
  calculation_date: string;
  period_days: number;
}

export const useFinancialKPIs = (periodDays: number = 30): UseFinancialKPIsReturn => {
  const [kpis, setKpis] = useState<FinancialKPIs | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchKPIs = useCallback(async () => {
    console.log('🔄 [useFinancialKPIs] Carregando KPIs financeiros para', periodDays, 'dias');
    setLoading(true);
    setError(null);

    try {
      const response = await api.get<FinancialKPIsAPIResponse>(
        `/cash-flow/analytics/kpis?period_days=${periodDays}`
      );

      console.log('✅ [useFinancialKPIs] KPIs recebidos:', response);

      // Transformar snake_case para camelCase e filtrar nulls
      const transformedKPIs: FinancialKPIs = {
        liquidezImediata: response.liquidez_imediata ?? undefined,
        liquidezCorrente: response.liquidez_corrente ?? undefined,
        pmr: response.pmr ?? undefined,
        pmp: response.pmp ?? undefined,
        cicloFinanceiro: response.ciclo_financeiro ?? undefined,
        margemLiquida: response.margem_liquida ?? undefined,
        margemEbitda: response.margem_ebitda ?? undefined,
        returnOnAssets: response.roa ?? undefined,
        returnOnEquity: response.roe ?? undefined,
        burnRate: response.burn_rate ?? undefined,
        runway: response.runway ?? undefined,
        endividamentoTotal: response.endividamento_total ?? undefined,
      };

      setKpis(transformedKPIs);
    } catch (err) {
      console.error('❌ [useFinancialKPIs] Erro ao buscar KPIs:', err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar KPIs financeiros');
    } finally {
      setLoading(false);
    }
  }, [periodDays]);

  useEffect(() => {
    fetchKPIs();
  }, [fetchKPIs]);

  return {
    kpis,
    loading,
    error,
    refetch: fetchKPIs
  };
};
