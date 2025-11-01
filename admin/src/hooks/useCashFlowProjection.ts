import { useMemo, useEffect } from 'react';
import type { CashFlowProjection, CashFlowAlert } from '@/types/cash-flow';
import { useCashFlow } from './useCashFlow';

interface UseCashFlowProjectionReturn {
  dados: CashFlowProjection[];
  alertas: CashFlowAlert[];
  saldoMinimoProjetado: number;
  saldoMaximoProjetado: number;
  loading: boolean;
}

export const useCashFlowProjection = (dias: number): UseCashFlowProjectionReturn => {
  const {
    projection: apiProjection,
    bankAccounts,
    loadingAnalytics,
    loadProjection
  } = useCashFlow();

  // Carregar projeção quando dias mudar
  useEffect(() => {
    console.log('🔄 [useCashFlowProjection] Carregando projeção para', dias, 'dias');
    loadProjection(dias);
  }, [dias, loadProjection]);

  // Transformar dados da API para o formato do componente
  const projection = useMemo<CashFlowProjection[]>(() => {
    console.log('🔍 [useCashFlowProjection] Transformando projeção da API:', apiProjection.length);

    if (apiProjection.length === 0) {
      console.log('⚠️ [useCashFlowProjection] Sem dados de projeção da API');
      return [];
    }

    // Saldo atual é a soma de todas as contas
    const saldoAtual = bankAccounts.reduce((sum, acc) => sum + acc.current_balance, 0);

    return apiProjection.map((proj, index) => ({
      data: new Date(proj.projection_date),
      saldoInicial: index === 0 ? saldoAtual : apiProjection[index - 1].projected_balance,
      entradasPrevistas: proj.projected_entries,
      saidasPrevistas: proj.projected_exits,
      saldoFinalPrevisto: proj.projected_balance,
      confianca: proj.confidence_level,
      origem: 'projetado' as const,
      limiteInferior: proj.projected_balance * 0.9, // 10% margem inferior
      limiteSuperior: proj.projected_balance * 1.1  // 10% margem superior
    }));
  }, [apiProjection, bankAccounts]);

  const alertas: CashFlowAlert[] = useMemo(() => {
    return projection
      .filter(p => p.saldoFinalPrevisto < 0)
      .map(p => ({
        id: `alert-${p.data.toISOString()}`,
        data: p.data,
        valor: p.saldoFinalPrevisto,
        tipo: 'saldo-negativo' as const,
        mensagem: `Saldo negativo previsto: R$ ${Math.abs(p.saldoFinalPrevisto).toLocaleString('pt-BR')}`
      }));
  }, [projection]);

  const saldoMinimoProjetado = useMemo(() => {
    return projection.length > 0
      ? Math.min(...projection.map(p => p.saldoFinalPrevisto))
      : 0;
  }, [projection]);

  const saldoMaximoProjetado = useMemo(() => {
    return projection.length > 0
      ? Math.max(...projection.map(p => p.saldoFinalPrevisto))
      : 0;
  }, [projection]);

  return {
    dados: projection,
    alertas,
    saldoMinimoProjetado,
    saldoMaximoProjetado,
    loading: loadingAnalytics
  };
};
