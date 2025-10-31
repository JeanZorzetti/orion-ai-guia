import { useMemo } from 'react';
import { differenceInDays } from 'date-fns';
import { useCashFlow } from './useCashFlow';

export interface APAgingBucket {
  fornecedorId: string;
  fornecedorNome: string;
  aVencer: number; // Ainda a vencer (futuro)
  vencendoHoje: number; // Vencendo hoje
  vencido1a7: number; // 1-7 dias vencidos
  vencido8a15: number; // 8-15 dias vencidos
  vencido16a30: number; // 16-30 dias vencidos
  vencido30Plus: number; // 30+ dias vencidos
  total: number;
  urgencia: 'baixa' | 'media' | 'alta' | 'critica';
  quantidadeTitulos: number;
}

export interface APAgingTotals {
  aVencer: number;
  vencendoHoje: number;
  vencido1a7: number;
  vencido8a15: number;
  vencido16a30: number;
  vencido30Plus: number;
  total: number;
}

function calculateUrgency(bucket: Omit<APAgingBucket, 'urgencia'>): 'baixa' | 'media' | 'alta' | 'critica' {
  const totalVencido = bucket.vencido1a7 + bucket.vencido8a15 + bucket.vencido16a30 + bucket.vencido30Plus;
  const percentualVencido = bucket.total > 0 ? (totalVencido / bucket.total) * 100 : 0;

  // Crítico: mais de 50% vencido ou 30+ dias com valor alto
  if (percentualVencido > 50 || bucket.vencido30Plus > 10000) {
    return 'critica';
  }

  // Alto: entre 25% e 50% vencido ou valores altos vencidos
  if (percentualVencido > 25 || totalVencido > 15000) {
    return 'alta';
  }

  // Médio: entre 10% e 25% vencido
  if (percentualVencido > 10 || totalVencido > 5000) {
    return 'media';
  }

  // Baixo: menos de 10% vencido
  return 'baixa';
}

/**
 * Hook que calcula Aging Report de Contas a Pagar baseado nas transações do Cash Flow
 *
 * NOTA: Este hook usa transações de saída do Cash Flow como proxy para Contas a Pagar
 * até que o módulo completo de Accounts Payable seja implementado no backend.
 *
 * Agrupa por 'category' (proxy para fornecedor) e calcula períodos de vencimento
 * baseado em transaction_date.
 */
export function useAPAgingReport(): APAgingBucket[] {
  const { transactions } = useCashFlow();

  return useMemo(() => {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    // Filtrar apenas transações de saída não reconciliadas (pendentes)
    const transacoesPendentes = transactions.filter(
      t => t.type === 'saida' && !t.is_reconciled
    );

    // Agrupar por categoria (proxy para fornecedor)
    const agrupamento = transacoesPendentes.reduce((acc, transaction) => {
      const categoriaId = transaction.category || 'sem-categoria';
      const categoriaNome = transaction.category || 'Sem Categoria';

      if (!acc[categoriaId]) {
        acc[categoriaId] = {
          fornecedorId: categoriaId,
          fornecedorNome: categoriaNome,
          aVencer: 0,
          vencendoHoje: 0,
          vencido1a7: 0,
          vencido8a15: 0,
          vencido16a30: 0,
          vencido30Plus: 0,
          total: 0,
          quantidadeTitulos: 0,
        };
      }

      const bucket = acc[categoriaId];
      const valor = Math.abs(transaction.value);
      bucket.total += valor;
      bucket.quantidadeTitulos += 1;

      const transactionDate = new Date(transaction.transaction_date);
      transactionDate.setHours(0, 0, 0, 0);
      const diasDiferenca = differenceInDays(hoje, transactionDate);

      // Vencendo hoje
      if (diasDiferenca === 0) {
        bucket.vencendoHoje += valor;
      }
      // A vencer (futuro - transações futuras)
      else if (diasDiferenca < 0) {
        bucket.aVencer += valor;
      }
      // Vencido 1-7 dias
      else if (diasDiferenca >= 1 && diasDiferenca <= 7) {
        bucket.vencido1a7 += valor;
      }
      // Vencido 8-15 dias
      else if (diasDiferenca >= 8 && diasDiferenca <= 15) {
        bucket.vencido8a15 += valor;
      }
      // Vencido 16-30 dias
      else if (diasDiferenca >= 16 && diasDiferenca <= 30) {
        bucket.vencido16a30 += valor;
      }
      // Vencido 30+ dias
      else {
        bucket.vencido30Plus += valor;
      }

      return acc;
    }, {} as Record<string, Omit<APAgingBucket, 'urgencia'>>);

    // Converter para array e calcular urgência
    const result = Object.values(agrupamento).map((bucket) => ({
      ...bucket,
      urgencia: calculateUrgency(bucket),
    }));

    // Ordenar por urgência e valor total (descendente)
    const urgenciaOrder = { critica: 0, alta: 1, media: 2, baixa: 3 };
    result.sort((a, b) => {
      const urgenciaCompare = urgenciaOrder[a.urgencia] - urgenciaOrder[b.urgencia];
      if (urgenciaCompare !== 0) return urgenciaCompare;
      return b.total - a.total;
    });

    return result;
  }, [transactions]);
}

export function useAPAgingTotals(): APAgingTotals {
  const agingData = useAPAgingReport();

  return useMemo(() => {
    return agingData.reduce(
      (totals, bucket) => ({
        aVencer: totals.aVencer + bucket.aVencer,
        vencendoHoje: totals.vencendoHoje + bucket.vencendoHoje,
        vencido1a7: totals.vencido1a7 + bucket.vencido1a7,
        vencido8a15: totals.vencido8a15 + bucket.vencido8a15,
        vencido16a30: totals.vencido16a30 + bucket.vencido16a30,
        vencido30Plus: totals.vencido30Plus + bucket.vencido30Plus,
        total: totals.total + bucket.total,
      }),
      {
        aVencer: 0,
        vencendoHoje: 0,
        vencido1a7: 0,
        vencido8a15: 0,
        vencido16a30: 0,
        vencido30Plus: 0,
        total: 0,
      }
    );
  }, [agingData]);
}
