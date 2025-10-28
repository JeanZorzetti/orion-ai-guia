import { useMemo } from 'react';
import { subMonths, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

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

export function useAPChartData(): APChartData {
  return useMemo(() => {
    const hoje = new Date();

    // Gráfico de Aging - últimos 6 meses
    const agingData: AgingChartDataPoint[] = [];
    for (let i = 5; i >= 0; i--) {
      const mesData = subMonths(hoje, i);
      agingData.push({
        mes: format(mesData, 'MMM', { locale: ptBR }),
        aVencer: 25000 + Math.random() * 15000,
        hoje: 3000 + Math.random() * 2000,
        vencido1a7: 5000 + Math.random() * 3000,
        vencido8a15: 4000 + Math.random() * 2500,
        vencido16a30: 6000 + Math.random() * 3000,
        vencido30Plus: 8000 + Math.random() * 4000,
      });
    }

    // Gráfico de Fluxo de Caixa - próximos 30 dias
    const cashFlowData: CashFlowDataPoint[] = [];
    let saldoAcumulado = 50000; // Saldo inicial

    for (let i = 0; i < 30; i += 5) {
      const dataProjecao = new Date(hoje);
      dataProjecao.setDate(dataProjecao.getDate() + i);

      const aPagar = 8000 + Math.random() * 4000;
      const receber = 12000 + Math.random() * 6000;
      saldoAcumulado = saldoAcumulado + receber - aPagar;

      cashFlowData.push({
        data: format(dataProjecao, 'dd/MM'),
        aPagar,
        receber,
        saldo: saldoAcumulado,
      });
    }

    // Gráfico de Categorias
    const categoriesData: CategoryDataPoint[] = [
      { categoria: 'Fornecedores', valor: 45000, percentual: 35 },
      { categoria: 'Serviços', valor: 30000, percentual: 23 },
      { categoria: 'Aluguel', valor: 25000, percentual: 19 },
      { categoria: 'Utilidades', valor: 18000, percentual: 14 },
      { categoria: 'Outros', valor: 12000, percentual: 9 },
    ];

    // Gráfico de Tendências - últimos 6 meses
    const trendsData: TrendDataPoint[] = [];
    for (let i = 5; i >= 0; i--) {
      const mesData = subMonths(hoje, i);
      // DPO com tendência de melhora
      const dpo = 45 - (5 - i) * 2 + Math.random() * 3;
      // Taxa de atraso com tendência de redução
      const taxaAtraso = 15 - (5 - i) * 1.5 + Math.random() * 2;

      trendsData.push({
        mes: format(mesData, 'MMM', { locale: ptBR }),
        dpo: Math.round(dpo),
        taxaAtraso: Math.max(0, Math.round(taxaAtraso * 10) / 10),
      });
    }

    return {
      aging: agingData,
      cashFlow: cashFlowData,
      categories: categoriesData,
      trends: trendsData,
    };
  }, []);
}
