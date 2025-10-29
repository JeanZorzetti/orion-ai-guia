import { useMemo } from 'react';
import { SupplierComparison } from '@/types/supplier-performance';
import { useAllSupplierPerformances } from './useSupplierPerformance';

export function useSupplierComparison(): SupplierComparison[] {
  const allPerformances = useAllSupplierPerformances();

  return useMemo(() => {
    return allPerformances.map((perf) => ({
      fornecedorId: perf.fornecedorId,
      fornecedorNome: perf.fornecedorNome,
      score: perf.score,
      totalComprado: perf.metricas.valorTotalComprado,
      ticketMedio: perf.metricas.ticketMedio,
      prazoMedioPagamento: perf.metricas.prazoMedioPagamento,
      pontualidade: perf.fatores.pontualidadeEntrega,
      totalFaturas: perf.metricas.totalCompras,
      categoria: perf.categoria,
    }));
  }, [allPerformances]);
}
