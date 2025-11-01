'use client';

import { useMemo } from 'react';
import { AccountsReceivable } from '@/types/financeiro';
import { format, subMonths, startOfMonth, endOfMonth, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface AgingChartDataPoint {
  mes: string;
  atual: number;
  dias30: number;
  dias60: number;
  dias90: number;
  dias120Plus: number;
}

interface TrendDataPoint {
  mes: string;
  dso: number;
  inadimplencia: number;
  eficiencia: number;
}

interface ARChartData {
  agingChartData: AgingChartDataPoint[];
  trendData: TrendDataPoint[];
}

/**
 * Hook que calcula dados dos gráficos de Contas a Receber
 * baseado nos receivables reais da API
 */
export function useARChartData(receivables: AccountsReceivable[]): ARChartData {
  const agingChartData = useMemo(() => {
    console.log('🔍 [useARChartData] Calculando agingChartData com receivables:', receivables.length);

    // Gerar dados dos últimos 6 meses
    const hoje = new Date();
    const meses: AgingChartDataPoint[] = [];

    for (let i = 5; i >= 0; i--) {
      const mesDate = subMonths(hoje, i);
      const mesStart = startOfMonth(mesDate);
      const mesEnd = endOfMonth(mesDate);
      const mesLabel = format(mesDate, 'MMM', { locale: ptBR });

      // Filtrar receivables que existiam nesse mês
      const receivablesDoMes = receivables.filter(r => {
        const dueDate = new Date(r.due_date);
        return dueDate <= mesEnd;
      });

      // Classificar por aging buckets baseado na data de vencimento
      let atual = 0;
      let dias30 = 0;
      let dias60 = 0;
      let dias90 = 0;
      let dias120Plus = 0;

      receivablesDoMes.forEach(r => {
        const dueDate = new Date(r.due_date);
        const diasAtraso = differenceInDays(mesEnd, dueDate);
        const valor = r.value - r.paid_value; // Valor pendente

        if (diasAtraso < 0) {
          // Ainda não venceu
          atual += valor;
        } else if (diasAtraso <= 30) {
          dias30 += valor;
        } else if (diasAtraso <= 60) {
          dias60 += valor;
        } else if (diasAtraso <= 90) {
          dias90 += valor;
        } else {
          dias120Plus += valor;
        }
      });

      meses.push({
        mes: mesLabel,
        atual,
        dias30,
        dias60,
        dias90,
        dias120Plus,
      });
    }

    console.log('📊 [useARChartData] AgingChartData calculado:', meses);
    return meses;
  }, [receivables]);

  const trendData = useMemo(() => {
    console.log('🔍 [useARChartData] Calculando trendData com receivables:', receivables.length);

    // Gerar evolução de indicadores dos últimos 6 meses
    const hoje = new Date();
    const meses: TrendDataPoint[] = [];

    for (let i = 5; i >= 0; i--) {
      const mesDate = subMonths(hoje, i);
      const mesStart = startOfMonth(mesDate);
      const mesEnd = endOfMonth(mesDate);
      const mesLabel = format(mesDate, 'MMM', { locale: ptBR });

      // Filtrar receivables relevantes para esse mês
      const receivablesDoMes = receivables.filter(r => {
        const issueDate = new Date(r.issue_date);
        return issueDate >= mesStart && issueDate <= mesEnd;
      });

      // Calcular DSO (Days Sales Outstanding)
      const receivablesPagos = receivablesDoMes.filter(
        r => r.status === 'recebido' && r.payment_date
      );

      let dso = 0;
      if (receivablesPagos.length > 0) {
        const totalDias = receivablesPagos.reduce((sum, r) => {
          const issueDate = new Date(r.issue_date);
          const paymentDate = new Date(r.payment_date!);
          return sum + differenceInDays(paymentDate, issueDate);
        }, 0);
        dso = Math.round(totalDias / receivablesPagos.length);
      }

      // Calcular taxa de inadimplência
      const totalValue = receivablesDoMes.reduce((sum, r) => sum + r.value, 0);
      const overdueValue = receivablesDoMes
        .filter(r => r.status === 'vencido')
        .reduce((sum, r) => sum + (r.value - r.paid_value), 0);
      const inadimplencia = totalValue > 0 ? (overdueValue / totalValue) * 100 : 0;

      // Calcular eficiência de cobrança (% recebido)
      const totalRecebido = receivablesDoMes.reduce((sum, r) => sum + r.paid_value, 0);
      const eficiencia = totalValue > 0 ? (totalRecebido / totalValue) * 100 : 0;

      meses.push({
        mes: mesLabel,
        dso,
        inadimplencia: Number(inadimplencia.toFixed(1)),
        eficiencia: Number(eficiencia.toFixed(1)),
      });
    }

    console.log('📊 [useARChartData] TrendData calculado:', meses);
    return meses;
  }, [receivables]);

  return {
    agingChartData,
    trendData,
  };
}
