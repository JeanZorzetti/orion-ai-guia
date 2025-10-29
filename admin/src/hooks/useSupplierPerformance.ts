import { useMemo } from 'react';
import { SupplierPerformanceScore } from '@/types/supplier-performance';
import { subMonths, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Mock data de fornecedores
const mockSupplierPerformances: SupplierPerformanceScore[] = [
  {
    fornecedorId: '1',
    fornecedorNome: 'Fornecedor Alpha Ltda',
    score: 87,
    categoria: 'excelente',
    fatores: {
      pontualidadeEntrega: 95,
      qualidadeProdutos: 8.5,
      precosCompetitivos: 7.8,
      atendimento: 9.2,
      flexibilidadeNegociacao: 8.0,
      conformidadeDocumental: 98,
    },
    metricas: {
      totalCompras: 45,
      valorTotalComprado: 285000,
      ticketMedio: 6333,
      frequenciaCompras: 7.5,
      prazoMedioPagamento: 28,
      descontosObtidos: 8500,
      devolucoesReclamacoes: 2,
    },
    historico: [
      { mes: format(subMonths(new Date(), 5), 'MMM/yy', { locale: ptBR }), score: 82, totalCompras: 7 },
      { mes: format(subMonths(new Date(), 4), 'MMM/yy', { locale: ptBR }), score: 84, totalCompras: 8 },
      { mes: format(subMonths(new Date(), 3), 'MMM/yy', { locale: ptBR }), score: 85, totalCompras: 7 },
      { mes: format(subMonths(new Date(), 2), 'MMM/yy', { locale: ptBR }), score: 86, totalCompras: 9 },
      { mes: format(subMonths(new Date(), 1), 'MMM/yy', { locale: ptBR }), score: 87, totalCompras: 8 },
      { mes: format(new Date(), 'MMM/yy', { locale: ptBR }), score: 87, totalCompras: 6 },
    ],
    recomendacoes: [
      'Fornecedor confiável com excelente histórico',
      'Considere aumentar volume de compras para obter melhores descontos',
      'Pontualidade exemplar - considere para itens críticos',
    ],
    tendencia: 'melhorando',
    ultimaAtualizacao: new Date(),
  },
  {
    fornecedorId: '2',
    fornecedorNome: 'Beta Fornecimentos S.A.',
    score: 72,
    categoria: 'bom',
    fatores: {
      pontualidadeEntrega: 85,
      qualidadeProdutos: 7.5,
      precosCompetitivos: 8.2,
      atendimento: 7.0,
      flexibilidadeNegociacao: 6.5,
      conformidadeDocumental: 88,
    },
    metricas: {
      totalCompras: 32,
      valorTotalComprado: 195000,
      ticketMedio: 6094,
      frequenciaCompras: 5.3,
      prazoMedioPagamento: 32,
      descontosObtidos: 5850,
      devolucoesReclamacoes: 5,
    },
    historico: [
      { mes: format(subMonths(new Date(), 5), 'MMM/yy', { locale: ptBR }), score: 75, totalCompras: 5 },
      { mes: format(subMonths(new Date(), 4), 'MMM/yy', { locale: ptBR }), score: 74, totalCompras: 6 },
      { mes: format(subMonths(new Date(), 3), 'MMM/yy', { locale: ptBR }), score: 73, totalCompras: 5 },
      { mes: format(subMonths(new Date(), 2), 'MMM/yy', { locale: ptBR }), score: 72, totalCompras: 6 },
      { mes: format(subMonths(new Date(), 1), 'MMM/yy', { locale: ptBR }), score: 72, totalCompras: 5 },
      { mes: format(new Date(), 'MMM/yy', { locale: ptBR }), score: 72, totalCompras: 5 },
    ],
    recomendacoes: [
      'Preços competitivos, mas atenção à pontualidade',
      'Aumentar frequência de comunicação sobre prazos',
      'Monitorar qualidade de produtos nas próximas entregas',
    ],
    tendencia: 'estavel',
    ultimaAtualizacao: new Date(),
  },
  {
    fornecedorId: '3',
    fornecedorNome: 'Gamma Comércio Ltda',
    score: 58,
    categoria: 'regular',
    fatores: {
      pontualidadeEntrega: 65,
      qualidadeProdutos: 6.2,
      precosCompetitivos: 7.0,
      atendimento: 5.5,
      flexibilidadeNegociacao: 5.0,
      conformidadeDocumental: 72,
    },
    metricas: {
      totalCompras: 18,
      valorTotalComprado: 98000,
      ticketMedio: 5444,
      frequenciaCompras: 3.0,
      prazoMedioPagamento: 35,
      descontosObtidos: 1960,
      devolucoesReclamacoes: 8,
    },
    historico: [
      { mes: format(subMonths(new Date(), 5), 'MMM/yy', { locale: ptBR }), score: 65, totalCompras: 4 },
      { mes: format(subMonths(new Date(), 4), 'MMM/yy', { locale: ptBR }), score: 63, totalCompras: 3 },
      { mes: format(subMonths(new Date(), 3), 'MMM/yy', { locale: ptBR }), score: 60, totalCompras: 3 },
      { mes: format(subMonths(new Date(), 2), 'MMM/yy', { locale: ptBR }), score: 59, totalCompras: 3 },
      { mes: format(subMonths(new Date(), 1), 'MMM/yy', { locale: ptBR }), score: 58, totalCompras: 3 },
      { mes: format(new Date(), 'MMM/yy', { locale: ptBR }), score: 58, totalCompras: 2 },
    ],
    recomendacoes: [
      'Considere buscar fornecedores alternativos',
      'Exigir melhorias em pontualidade e conformidade documental',
      'Avaliar relação custo-benefício antes de novas compras',
    ],
    tendencia: 'piorando',
    ultimaAtualizacao: new Date(),
  },
];

function calculateScore(fatores: SupplierPerformanceScore['fatores']): number {
  // Pesos para cada fator (total = 100%)
  const pesos = {
    pontualidadeEntrega: 0.25,
    qualidadeProdutos: 0.20,
    precosCompetitivos: 0.15,
    atendimento: 0.15,
    flexibilidadeNegociacao: 0.10,
    conformidadeDocumental: 0.15,
  };

  const score =
    fatores.pontualidadeEntrega * pesos.pontualidadeEntrega +
    (fatores.qualidadeProdutos * 10) * pesos.qualidadeProdutos +
    (fatores.precosCompetitivos * 10) * pesos.precosCompetitivos +
    (fatores.atendimento * 10) * pesos.atendimento +
    (fatores.flexibilidadeNegociacao * 10) * pesos.flexibilidadeNegociacao +
    fatores.conformidadeDocumental * pesos.conformidadeDocumental;

  return Math.round(score);
}

function getCategoria(score: number): 'excelente' | 'bom' | 'regular' | 'ruim' | 'critico' {
  if (score >= 85) return 'excelente';
  if (score >= 70) return 'bom';
  if (score >= 55) return 'regular';
  if (score >= 40) return 'ruim';
  return 'critico';
}

export function useSupplierPerformance(fornecedorId?: string) {
  const performance = useMemo(() => {
    if (!fornecedorId) return null;
    return mockSupplierPerformances.find((p) => p.fornecedorId === fornecedorId) || null;
  }, [fornecedorId]);

  return performance;
}

export function useAllSupplierPerformances() {
  return useMemo(() => {
    return mockSupplierPerformances.sort((a, b) => b.score - a.score);
  }, []);
}

export { calculateScore, getCategoria };
