'use client';

import { useMemo } from 'react';
import { useAccountsReceivable } from './useAccountsReceivable';
import { differenceInDays } from 'date-fns';

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
  const { receivables } = useAccountsReceivable();

  return useMemo(() => {
    console.log('🔍 [useCustomerRiskScore] Calculando risk score para cliente:', clienteId);

    // Filtrar receivables do cliente
    const customerReceivables = receivables.filter(
      r => r.customer_id.toString() === clienteId
    );

    if (customerReceivables.length === 0) {
      console.log('⚠️ [useCustomerRiskScore] Nenhum receivable encontrado para cliente', clienteId);
      return null;
    }

    const clienteNome = customerReceivables[0].customer_name || `Cliente #${clienteId}`;
    const hoje = new Date();

    // Calcular fatores de risco
    const receivablesPagos = customerReceivables.filter(r => r.status === 'recebido');
    const receivablesTotal = customerReceivables.length;

    // Histórico de pagamento (% pagos)
    const historicoPagamento = receivablesTotal > 0
      ? (receivablesPagos.length / receivablesTotal) * 100
      : 0;

    // Dias de atraso médio
    let totalDiasAtraso = 0;
    let countAtrasos = 0;

    customerReceivables.forEach(r => {
      if (r.status === 'vencido') {
        const dueDate = new Date(r.due_date);
        const diasAtraso = differenceInDays(hoje, dueDate);
        totalDiasAtraso += diasAtraso;
        countAtrasos++;
      }
    });

    const diasAtrasoMedio = countAtrasos > 0 ? Math.round(totalDiasAtraso / countAtrasos) : 0;

    // Valor médio de atraso
    const receivablesVencidos = customerReceivables.filter(r => r.status === 'vencido');
    const valorMedioAtraso = receivablesVencidos.length > 0
      ? receivablesVencidos.reduce((sum, r) => sum + (r.value - r.paid_value), 0) / receivablesVencidos.length
      : 0;

    // Ticket médio
    const ticketMedio = customerReceivables.reduce((sum, r) => sum + r.value, 0) / receivablesTotal;

    // Tempo de relacionamento (baseado no receivable mais antigo)
    const datesEmissao = customerReceivables.map(r => new Date(r.issue_date));
    const primeiraCompra = new Date(Math.min(...datesEmissao.map(d => d.getTime())));
    const tempoRelacionamento = Math.round(differenceInDays(hoje, primeiraCompra) / 30); // em meses

    // Frequência de compras (receivables/mês)
    const frequenciaCompras = tempoRelacionamento > 0
      ? receivablesTotal / tempoRelacionamento
      : receivablesTotal;

    const fatores = {
      historicoPagamento,
      diasAtrasoMedio,
      valorMedioAtraso,
      frequenciaCompras,
      ticketMedio,
      tempoRelacionamento,
      protestos: 0, // Não temos esses dados ainda
      chequesSemFundo: 0, // Não temos esses dados ainda
      ultimaAtualizacao: hoje,
    };

    // Calcular score usando algoritmo
    const { score, categoria } = calculateRiskScore(fatores);

    // Determinar tendência (simplificado - baseado em atrasos)
    let tendencia: 'melhorando' | 'estavel' | 'piorando';
    if (diasAtrasoMedio === 0) tendencia = 'melhorando';
    else if (diasAtrasoMedio <= 5) tendencia = 'estavel';
    else tendencia = 'piorando';

    // Calcular recomendações
    const recomendacoes = {
      limiteCreditoSugerido: Math.round(ticketMedio * (score / 100) * 3), // 3x ticket médio ajustado por score
      prazoMaximoSugerido: score >= 80 ? 60 : score >= 60 ? 45 : score >= 40 ? 30 : score >= 20 ? 15 : 0,
      requererAnaliseCredito: score < 60,
      requererGarantias: score < 40,
    };

    const riskScore: CustomerRiskScore = {
      clienteId,
      clienteNome,
      score,
      categoria,
      fatores,
      recomendacoes,
      tendencia,
    };

    console.log('📊 [useCustomerRiskScore] Risk score calculado:', riskScore);
    return riskScore;
  }, [clienteId, receivables]);
}

export function useAllCustomerRiskScores(): CustomerRiskScore[] {
  const { receivables } = useAccountsReceivable();

  return useMemo(() => {
    console.log('🔍 [useAllCustomerRiskScores] Calculando risk scores para todos os clientes');

    // Extrair lista única de clientes dos receivables
    const customersMap = new Map<number, { id: number; name: string }>();

    receivables.forEach(r => {
      if (!customersMap.has(r.customer_id)) {
        customersMap.set(r.customer_id, {
          id: r.customer_id,
          name: r.customer_name || `Cliente #${r.customer_id}`,
        });
      }
    });

    // Calcular risk score para cada cliente
    const riskScores: CustomerRiskScore[] = [];

    customersMap.forEach(customer => {
      const customerReceivables = receivables.filter(r => r.customer_id === customer.id);
      const hoje = new Date();

      // Calcular fatores
      const receivablesPagos = customerReceivables.filter(r => r.status === 'recebido');
      const receivablesTotal = customerReceivables.length;

      const historicoPagamento = receivablesTotal > 0
        ? (receivablesPagos.length / receivablesTotal) * 100
        : 0;

      let totalDiasAtraso = 0;
      let countAtrasos = 0;
      customerReceivables.forEach(r => {
        if (r.status === 'vencido') {
          const dueDate = new Date(r.due_date);
          const diasAtraso = differenceInDays(hoje, dueDate);
          totalDiasAtraso += diasAtraso;
          countAtrasos++;
        }
      });

      const diasAtrasoMedio = countAtrasos > 0 ? Math.round(totalDiasAtraso / countAtrasos) : 0;

      const receivablesVencidos = customerReceivables.filter(r => r.status === 'vencido');
      const valorMedioAtraso = receivablesVencidos.length > 0
        ? receivablesVencidos.reduce((sum, r) => sum + (r.value - r.paid_value), 0) / receivablesVencidos.length
        : 0;

      const ticketMedio = customerReceivables.reduce((sum, r) => sum + r.value, 0) / receivablesTotal;

      const datesEmissao = customerReceivables.map(r => new Date(r.issue_date));
      const primeiraCompra = new Date(Math.min(...datesEmissao.map(d => d.getTime())));
      const tempoRelacionamento = Math.round(differenceInDays(hoje, primeiraCompra) / 30);

      const frequenciaCompras = tempoRelacionamento > 0
        ? receivablesTotal / tempoRelacionamento
        : receivablesTotal;

      const fatores = {
        historicoPagamento,
        diasAtrasoMedio,
        valorMedioAtraso,
        frequenciaCompras,
        ticketMedio,
        tempoRelacionamento,
        protestos: 0,
        chequesSemFundo: 0,
        ultimaAtualizacao: hoje,
      };

      const { score, categoria } = calculateRiskScore(fatores);

      let tendencia: 'melhorando' | 'estavel' | 'piorando';
      if (diasAtrasoMedio === 0) tendencia = 'melhorando';
      else if (diasAtrasoMedio <= 5) tendencia = 'estavel';
      else tendencia = 'piorando';

      const recomendacoes = {
        limiteCreditoSugerido: Math.round(ticketMedio * (score / 100) * 3),
        prazoMaximoSugerido: score >= 80 ? 60 : score >= 60 ? 45 : score >= 40 ? 30 : score >= 20 ? 15 : 0,
        requererAnaliseCredito: score < 60,
        requererGarantias: score < 40,
      };

      riskScores.push({
        clienteId: customer.id.toString(),
        clienteNome: customer.name,
        score,
        categoria,
        fatores,
        recomendacoes,
        tendencia,
      });
    });

    // Ordenar por score (maior para menor)
    const sortedScores = riskScores.sort((a, b) => b.score - a.score);

    console.log('📊 [useAllCustomerRiskScores] Risk scores calculados:', sortedScores.length);
    return sortedScores;
  }, [receivables]);
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
