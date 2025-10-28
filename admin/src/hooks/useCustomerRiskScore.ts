'use client';

import { useMemo } from 'react';

export interface CustomerRiskScore {
  clienteId: string;
  clienteNome: string;
  score: number; // 0-100 (0 = alto risco, 100 = baixo risco)
  categoria: 'excelente' | 'bom' | 'regular' | 'ruim' | 'critico';
  fatores: {
    historicoPagamento: number; // % pagamentos em dia
    diasAtrasoMedio: number;
    valorMedioAtraso: number;
    frequenciaCompras: number; // compras/mês
    ticketMedio: number;
    tempoRelacionamento: number; // meses
    protestos: number;
    chequesSemFundo: number;
    ultimaAtualizacao: Date;
  };
  recomendacoes: {
    limiteCreditoSugerido: number;
    prazoMaximoSugerido: number; // dias
    requererAnaliseCredito: boolean;
    requererGarantias: boolean;
  };
  tendencia: 'melhorando' | 'estavel' | 'piorando';
}

// Mock data - será substituído por modelo ML real
const mockRiskScores: Record<string, CustomerRiskScore> = {
  '1': {
    clienteId: '1',
    clienteNome: 'Empresa ABC Ltda',
    score: 85,
    categoria: 'excelente',
    fatores: {
      historicoPagamento: 95,
      diasAtrasoMedio: 2,
      valorMedioAtraso: 500,
      frequenciaCompras: 8,
      ticketMedio: 8000,
      tempoRelacionamento: 36,
      protestos: 0,
      chequesSemFundo: 0,
      ultimaAtualizacao: new Date(),
    },
    recomendacoes: {
      limiteCreditoSugerido: 100000,
      prazoMaximoSugerido: 60,
      requererAnaliseCredito: false,
      requererGarantias: false,
    },
    tendencia: 'melhorando',
  },
  '2': {
    clienteId: '2',
    clienteNome: 'Comercial XYZ S.A.',
    score: 65,
    categoria: 'bom',
    fatores: {
      historicoPagamento: 80,
      diasAtrasoMedio: 8,
      valorMedioAtraso: 2000,
      frequenciaCompras: 5,
      ticketMedio: 15000,
      tempoRelacionamento: 24,
      protestos: 0,
      chequesSemFundo: 1,
      ultimaAtualizacao: new Date(),
    },
    recomendacoes: {
      limiteCreditoSugerido: 50000,
      prazoMaximoSugerido: 45,
      requererAnaliseCredito: false,
      requererGarantias: false,
    },
    tendencia: 'estavel',
  },
  '3': {
    clienteId: '3',
    clienteNome: 'Distribuidora 123',
    score: 45,
    categoria: 'regular',
    fatores: {
      historicoPagamento: 65,
      diasAtrasoMedio: 15,
      valorMedioAtraso: 5000,
      frequenciaCompras: 3,
      ticketMedio: 12000,
      tempoRelacionamento: 18,
      protestos: 1,
      chequesSemFundo: 2,
      ultimaAtualizacao: new Date(),
    },
    recomendacoes: {
      limiteCreditoSugerido: 25000,
      prazoMaximoSugerido: 30,
      requererAnaliseCredito: true,
      requererGarantias: false,
    },
    tendencia: 'piorando',
  },
  '4': {
    clienteId: '4',
    clienteNome: 'Indústria DEF',
    score: 25,
    categoria: 'ruim',
    fatores: {
      historicoPagamento: 45,
      diasAtrasoMedio: 30,
      valorMedioAtraso: 15000,
      frequenciaCompras: 2,
      ticketMedio: 20000,
      tempoRelacionamento: 12,
      protestos: 2,
      chequesSemFundo: 3,
      ultimaAtualizacao: new Date(),
    },
    recomendacoes: {
      limiteCreditoSugerido: 10000,
      prazoMaximoSugerido: 15,
      requererAnaliseCredito: true,
      requererGarantias: true,
    },
    tendencia: 'piorando',
  },
  '5': {
    clienteId: '5',
    clienteNome: 'Varejo GHI',
    score: 15,
    categoria: 'critico',
    fatores: {
      historicoPagamento: 30,
      diasAtrasoMedio: 60,
      valorMedioAtraso: 25000,
      frequenciaCompras: 1,
      ticketMedio: 18000,
      tempoRelacionamento: 6,
      protestos: 5,
      chequesSemFundo: 7,
      ultimaAtualizacao: new Date(),
    },
    recomendacoes: {
      limiteCreditoSugerido: 0,
      prazoMaximoSugerido: 0,
      requererAnaliseCredito: true,
      requererGarantias: true,
    },
    tendencia: 'piorando',
  },
};

export function useCustomerRiskScore(clienteId: string): CustomerRiskScore | null {
  return useMemo(() => {
    return mockRiskScores[clienteId] || null;
  }, [clienteId]);
}

export function useAllCustomerRiskScores(): CustomerRiskScore[] {
  return useMemo(() => {
    return Object.values(mockRiskScores).sort((a, b) => b.score - a.score);
  }, []);
}

export function calculateRiskScore(fatores: CustomerRiskScore['fatores']): {
  score: number;
  categoria: CustomerRiskScore['categoria'];
} {
  // Algoritmo simplificado de cálculo de score
  // Em produção, seria um modelo ML treinado

  let score = 0;

  // Histórico de pagamento (peso 40%)
  score += fatores.historicoPagamento * 0.4;

  // Tempo de relacionamento (peso 15%)
  const tempoScore = Math.min(fatores.tempoRelacionamento / 60, 1) * 100;
  score += tempoScore * 0.15;

  // Dias de atraso médio (peso 20%)
  const atrasoScore = Math.max(0, 100 - fatores.diasAtrasoMedio * 2);
  score += atrasoScore * 0.2;

  // Frequência de compras (peso 10%)
  const frequenciaScore = Math.min(fatores.frequenciaCompras / 10, 1) * 100;
  score += frequenciaScore * 0.1;

  // Protestos e cheques sem fundo (peso 15%)
  const negativosScore = Math.max(
    0,
    100 - (fatores.protestos * 10 + fatores.chequesSemFundo * 5)
  );
  score += negativosScore * 0.15;

  // Normalizar para 0-100
  score = Math.max(0, Math.min(100, Math.round(score)));

  // Determinar categoria
  let categoria: CustomerRiskScore['categoria'];
  if (score >= 80) categoria = 'excelente';
  else if (score >= 60) categoria = 'bom';
  else if (score >= 40) categoria = 'regular';
  else if (score >= 20) categoria = 'ruim';
  else categoria = 'critico';

  return { score, categoria };
}
