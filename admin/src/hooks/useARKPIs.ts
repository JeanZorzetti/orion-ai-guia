'use client';

import { useMemo } from 'react';

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

// Mock data - será substituído por dados reais da API
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

export function useARKPIs(): AdvancedKPIs {
  const kpis = useMemo(() => {
    // DSO = (Total AR / Vendas Diárias Médias)
    const vendasDiariasMedias = mockData.vendasDiarias;
    const dso = Math.round(mockData.totalAReceber / vendasDiariasMedias);

    // Tendência DSO (comparação com período anterior)
    const dsoTrend = ((dso - mockData.dsoAnterior) / mockData.dsoAnterior) * 100;

    // Taxa de Inadimplência
    const taxaInadimplencia = (mockData.valorVencido / mockData.totalAReceber) * 100;

    // Ticket Médio
    const ticketMedioAR = mockData.totalAReceber / mockData.totalTitulos;

    // Eficiência de Cobrança
    const eficienciaCobranca = (mockData.recebidosEmDia / mockData.totalTitulos) * 100;

    // Concentração de Risco (top 5 clientes)
    const concentracaoRisco = (mockData.top5Clientes / mockData.totalAReceber) * 100;

    // Previsão 30 dias (baseado em média histórica - seria ML em produção)
    const previsaoRecebimento30d = mockData.proximoVencimento30d * 0.85; // 85% de taxa de recebimento prevista

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
  }, []);

  return kpis;
}
