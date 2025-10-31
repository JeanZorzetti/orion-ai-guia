'use client';

import { useMemo } from 'react';
import { ARAnalytics } from '@/types/financeiro';

export interface AdvancedKPIs {
  dso: number; // Days Sales Outstanding
  dsoTrend: number; // Variação percentual do DSO
  taxaInadimplencia: number; // % de valores vencidos
  valorVencido: number;
  ticketMedioAR: number; // Valor médio por título
  previsaoRecebimento30d: number; // Predição próximos 30 dias
  eficienciaCobranca: number; // % de sucesso em cobranças
  concentracaoRisco: number; // % dos top 5 clientes no AR
  totalAReceber: number;
  totalRecebidoMes: number;
  proximoVencimento30d: number;
}

// Mock data - usado como fallback quando dados reais não estão disponíveis
const mockData = {
  vendasDiarias: 50000,
  totalAReceber: 250000,
  diasVendaMes: 22,
  dsoAnterior: 48,
  valorVencido: 35000,
  totalTitulos: 42,
  recebidosEmDia: 35,
  totalRecebidoMes: 180000,
  proximoVencimento30d: 120000,
  top5Clientes: 180000,
};

export function useARKPIs(analytics?: ARAnalytics | null): AdvancedKPIs {
  const kpis = useMemo(() => {
    // Se temos dados reais da API, usar eles
    if (analytics) {
      // DSO = average_days_to_receive (já calculado pela API)
      const dso = Math.round(analytics.avg_days_to_receive);

      // Tendência DSO - usar mock até termos histórico
      const dsoTrend = ((dso - mockData.dsoAnterior) / mockData.dsoAnterior) * 100;

      // Taxa de Inadimplência (default_rate já é porcentagem)
      const taxaInadimplencia = analytics.default_rate;

      // Ticket Médio - calcular baseado no total
      const overdueCount = analytics.overdue_count || 1;
      const ticketMedioAR = analytics.total_to_receive / Math.max(overdueCount, 1);

      // Eficiência de Cobrança - inverso da taxa de inadimplência
      const eficienciaCobranca = 100 - taxaInadimplencia;

      // Concentração de Risco - usar mock até termos customer analytics
      const concentracaoRisco = (mockData.top5Clientes / analytics.total_to_receive) * 100;

      // Previsão 30 dias - usar received_this_month como base
      const previsaoRecebimento30d = analytics.received_this_month * 1.1; // 10% a mais no próximo mês

      return {
        dso,
        dsoTrend,
        taxaInadimplencia,
        valorVencido: analytics.overdue_amount,
        ticketMedioAR,
        previsaoRecebimento30d,
        eficienciaCobranca,
        concentracaoRisco,
        totalAReceber: analytics.total_to_receive,
        totalRecebidoMes: analytics.received_this_month,
        proximoVencimento30d: analytics.total_to_receive - analytics.overdue_amount, // Aproximação
      };
    }

    // Fallback para mock data
    const vendasDiariasMedias = mockData.vendasDiarias;
    const dso = Math.round(mockData.totalAReceber / vendasDiariasMedias);
    const dsoTrend = ((dso - mockData.dsoAnterior) / mockData.dsoAnterior) * 100;
    const taxaInadimplencia = (mockData.valorVencido / mockData.totalAReceber) * 100;
    const ticketMedioAR = mockData.totalAReceber / mockData.totalTitulos;
    const eficienciaCobranca = (mockData.recebidosEmDia / mockData.totalTitulos) * 100;
    const concentracaoRisco = (mockData.top5Clientes / mockData.totalAReceber) * 100;
    const previsaoRecebimento30d = mockData.proximoVencimento30d * 0.85;

    return {
      dso,
      dsoTrend,
      taxaInadimplencia,
      valorVencido: mockData.valorVencido,
      ticketMedioAR,
      previsaoRecebimento30d,
      eficienciaCobranca,
      concentracaoRisco,
      totalAReceber: mockData.totalAReceber,
      totalRecebidoMes: mockData.totalRecebidoMes,
      proximoVencimento30d: mockData.proximoVencimento30d,
    };
  }, [analytics]);

  return kpis;
}
