import { useMemo } from 'react';
import { SupplierComparison } from '@/types/supplier-performance';
import { useAllSupplierPerformances } from './useSupplierPerformance';
import { useSuppliers } from './useSuppliers';

interface UseSupplierComparisonReturn {
  suppliers: SupplierComparison[];
  loading: boolean;
}

export function useSupplierComparison(): UseSupplierComparisonReturn {
  const allPerformances = useAllSupplierPerformances();
  const { loading: suppliersLoading } = useSuppliers();

  const suppliers = useMemo(() => {
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

  return {
    suppliers,
    loading: suppliersLoading,
  };
}
