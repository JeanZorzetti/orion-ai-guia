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
    console.log('🔍 [useARKPIs] Calculando KPIs com analytics:', analytics);

    // Se temos dados reais da API, usar eles
    if (analytics) {
      console.log('✅ [useARKPIs] Usando dados reais da API');
      // DSO = average_days_to_receive (já calculado pela API)
      const dso = Math.round(analytics.avg_days_to_receive) || 0;

      // Tendência DSO - usar mock até termos histórico
      const dsoTrend = dso > 0 ? ((dso - mockData.dsoAnterior) / mockData.dsoAnterior) * 100 : 0;

      // Taxa de Inadimplência (default_rate já é porcentagem)
      const taxaInadimplencia = analytics.default_rate;

      // Ticket Médio - calcular baseado no total
      const overdueCount = analytics.overdue_count || 1;
      const ticketMedioAR = analytics.total_to_receive / Math.max(overdueCount, 1);

      // Eficiência de Cobrança - inverso da taxa de inadimplência
      const eficienciaCobranca = 100 - taxaInadimplencia;

      // Concentração de Risco - usar mock até termos customer analytics
      const concentracaoRisco = analytics.total_to_receive > 0
        ? (mockData.top5Clientes / analytics.total_to_receive) * 100
        : 0;

      // A API retorna total_overdue, não overdue_amount
      const overdueAmount = (analytics as any).total_overdue || analytics.overdue_amount || 0;

      // A API retorna total_received, não received_this_month
      const receivedThisMonth = (analytics as any).total_received || analytics.received_this_month || 0;

      // Previsão 30 dias - usar total_received como base
      const previsaoRecebimento30d = receivedThisMonth * 1.1; // 10% a mais no próximo mês

      const result = {
        dso,
        dsoTrend,
        taxaInadimplencia,
        valorVencido: overdueAmount,
        ticketMedioAR,
        previsaoRecebimento30d,
        eficienciaCobranca,
        concentracaoRisco,
        totalAReceber: analytics.total_to_receive,
        totalRecebidoMes: receivedThisMonth,
        proximoVencimento30d: analytics.total_to_receive - overdueAmount, // Aproximação
      };

      console.log('📊 [useARKPIs] KPIs calculados (API):', result);
      return result;
    }

    // Fallback para mock data
    console.log('⚠️ [useARKPIs] Usando mock data (analytics não disponível)');
    const vendasDiariasMedias = mockData.vendasDiarias;
    const dso = Math.round(mockData.totalAReceber / vendasDiariasMedias);
    const dsoTrend = ((dso - mockData.dsoAnterior) / mockData.dsoAnterior) * 100;
    const taxaInadimplencia = (mockData.valorVencido / mockData.totalAReceber) * 100;
    const ticketMedioAR = mockData.totalAReceber / mockData.totalTitulos;
    const eficienciaCobranca = (mockData.recebidosEmDia / mockData.totalTitulos) * 100;
    const concentracaoRisco = (mockData.top5Clientes / mockData.totalAReceber) * 100;
    const previsaoRecebimento30d = mockData.proximoVencimento30d * 0.85;

    const mockResult = {
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

    console.log('📊 [useARKPIs] KPIs calculados (Mock):', mockResult);
    return mockResult;
  }, [analytics]);

  console.log('🎯 [useARKPIs] Retornando KPIs finais:', kpis);
  return kpis;
}
