import { useMemo } from 'react';
import { subMonths, format, addDays, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useCashFlow } from './useCashFlow';
import { useAccountsReceivable } from './useAccountsReceivable';

export interface AgingChartDataPoint {
  mes: string;
  aVencer: number;
  hoje: number;
  vencido1a7: number;
  vencido8a15: number;
  vencido16a30: number;
  vencido30Plus: number;
}

export interface CashFlowDataPoint {
  data: string;
  aPagar: number;
  receber: number;
  saldo: number;
}

export interface CategoryDataPoint {
  categoria: string;
  valor: number;
  percentual: number;
  [key: string]: string | number;
}

export interface TrendDataPoint {
  mes: string;
  dpo: number;
  taxaAtraso: number;
}

export interface APChartData {
  aging: AgingChartDataPoint[];
  cashFlow: CashFlowDataPoint[];
  categories: CategoryDataPoint[];
  trends: TrendDataPoint[];
}

/**
 * Hook que fornece dados para os gráficos de Contas a Pagar
 *
 * NOTA: Usa transações do Cash Flow como proxy para Contas a Pagar
 * até que o módulo completo seja implementado.
 *
 * Retorna 4 conjuntos de dados:
 * 1. Aging: Distribuição por vencimento (últimos 6 meses)
 * 2. CashFlow: Projeção de fluxo de caixa (próximos 30 dias)
 * 3. Categories: Gastos por categoria
 * 4. Trends: Evolução DPO e Taxa de Atraso (últimos 6 meses)
 */
export function useAPChartData(): APChartData {
  const { transactions, balanceHistory, projection } = useCashFlow();
  const { receivables } = useAccountsReceivable();

  return useMemo(() => {
    const hoje = new Date();

    // ========== 1. GRÁFICO DE AGING - últimos 6 meses ==========
    const agingData: AgingChartDataPoint[] = [];

    for (let i = 5; i >= 0; i--) {
      const mesData = subMonths(hoje, i);
      const inicioMes = new Date(mesData.getFullYear(), mesData.getMonth(), 1);
      const fimMes = new Date(mesData.getFullYear(), mesData.getMonth() + 1, 0);

      // Filtrar transações de saída não reconciliadas desse mês
      const transacoesMes = transactions.filter(t => {
        if (t.type !== 'saida' || t.is_reconciled) return false;
        const transDate = new Date(t.transaction_date);
        return transDate >= inicioMes && transDate <= fimMes;
      });

      // Calcular buckets de aging
      const buckets = {
        aVencer: 0,
        hoje: 0,
        vencido1a7: 0,
        vencido8a15: 0,
        vencido16a30: 0,
        vencido30Plus: 0,
      };

      transacoesMes.forEach(t => {
        const transDate = new Date(t.transaction_date);
        const diasDif = differenceInDays(fimMes, transDate);

        if (diasDif < 0) {
          buckets.aVencer += Math.abs(t.value);
        } else if (diasDif === 0) {
          buckets.hoje += Math.abs(t.value);
        } else if (diasDif <= 7) {
          buckets.vencido1a7 += Math.abs(t.value);
        } else if (diasDif <= 15) {
          buckets.vencido8a15 += Math.abs(t.value);
        } else if (diasDif <= 30) {
          buckets.vencido16a30 += Math.abs(t.value);
        } else {
          buckets.vencido30Plus += Math.abs(t.value);
        }
      });

      agingData.push({
        mes: format(mesData, 'MMM', { locale: ptBR }),
        ...buckets,
      });
    }

    // ========== 2. GRÁFICO DE FLUXO DE CAIXA - próximos 30 dias ==========
    const cashFlowData: CashFlowDataPoint[] = [];

    // Saldo atual do balanço
    const saldoInicial = balanceHistory.length > 0
      ? balanceHistory[balanceHistory.length - 1].balance
      : 0;

    let saldoAcumulado = saldoInicial;

    // Usar projeção se disponível, senão calcular manualmente
    if (projection && projection.length > 0) {
      // Agrupar projeção em intervalos de 5 dias
      for (let i = 0; i < Math.min(30, projection.length); i += 5) {
        const proj = projection[i];
        const aPagar = Math.abs(proj.projected_exits || 0);
        const receber = proj.projected_entries || 0;

        cashFlowData.push({
          data: format(new Date(proj.projection_date), 'dd/MM'),
          aPagar,
          receber,
          saldo: proj.projected_balance || saldoAcumulado,
        });
      }
    } else {
      // Fallback: calcular baseado em médias
      const transacoesSaida = transactions.filter(t => t.type === 'saida');
      const mediaAPagar = transacoesSaida.length > 0
        ? transacoesSaida.reduce((sum, t) => sum + Math.abs(t.value), 0) / transacoesSaida.length
        : 0;

      const mediaAReceber = receivables.length > 0
        ? receivables.reduce((sum, r) => sum + r.value, 0) / receivables.length
        : 0;

      for (let i = 0; i < 30; i += 5) {
        const dataProjecao = addDays(hoje, i);
        const aPagar = mediaAPagar * (0.8 + Math.random() * 0.4); // Variação de ±20%
        const receber = mediaAReceber * (0.8 + Math.random() * 0.4);
        saldoAcumulado = saldoAcumulado + receber - aPagar;

        cashFlowData.push({
          data: format(dataProjecao, 'dd/MM'),
          aPagar,
          receber,
          saldo: saldoAcumulado,
        });
      }
    }

    // ========== 3. GRÁFICO DE CATEGORIAS ==========
    // Filtrar transações de saída e agrupar por categoria
    const transacoesSaida = transactions.filter(t => t.type === 'saida');
    const categoriaTotais = transacoesSaida.reduce((acc, t) => {
      const cat = t.category || 'Outros';
      acc[cat] = (acc[cat] || 0) + Math.abs(t.value);
      return acc;
    }, {} as Record<string, number>);

    const totalGeral = Object.values(categoriaTotais).reduce((sum, val) => sum + val, 0);

    const categoriesData: CategoryDataPoint[] = Object.entries(categoriaTotais)
      .map(([categoria, valor]) => ({
        categoria,
        valor,
        percentual: totalGeral > 0 ? Math.round((valor / totalGeral) * 1000) / 10 : 0,
      }))
      .sort((a, b) => b.valor - a.valor)
      .slice(0, 5); // Top 5 categorias

    // ========== 4. GRÁFICO DE TENDÊNCIAS - últimos 6 meses ==========
    const trendsData: TrendDataPoint[] = [];

    for (let i = 5; i >= 0; i--) {
      const mesData = subMonths(hoje, i);
      const inicioMes = new Date(mesData.getFullYear(), mesData.getMonth(), 1);
      const fimMes = new Date(mesData.getFullYear(), mesData.getMonth() + 1, 0);

      // Calcular DPO do mês
      const transacoesMes = transactions.filter(t => {
        const transDate = new Date(t.transaction_date);
        return transDate >= inicioMes && transDate <= fimMes && t.type === 'saida';
      });

      const totalAPagar = transacoesMes
        .filter(t => !t.is_reconciled)
        .reduce((sum, t) => sum + Math.abs(t.value), 0);

      const comprasMes = transacoesMes
        .reduce((sum, t) => sum + Math.abs(t.value), 0);

      const dpo = comprasMes > 0 ? Math.round((totalAPagar / comprasMes) * 30) : 0;

      // Calcular taxa de atraso
      const transacoesAtrasadas = transacoesMes.filter(t => {
        if (t.is_reconciled && t.reconciliation_date) {
          return new Date(t.reconciliation_date) > new Date(t.transaction_date);
        }
        if (!t.is_reconciled) {
          return new Date(t.transaction_date) < fimMes;
        }
        return false;
      }).length;

      const taxaAtraso = transacoesMes.length > 0
        ? Math.round((transacoesAtrasadas / transacoesMes.length) * 1000) / 10
        : 0;

      trendsData.push({
        mes: format(mesData, 'MMM', { locale: ptBR }),
        dpo,
        taxaAtraso,
      });
    }

    return {
      aging: agingData,
      cashFlow: cashFlowData,
      categories: categoriesData,
      trends: trendsData,
    };
  }, [transactions, balanceHistory, projection, receivables]);
}
