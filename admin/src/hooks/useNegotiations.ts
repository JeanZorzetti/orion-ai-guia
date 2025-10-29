import { useMemo } from 'react';
import { Negotiation, NegotiationSummary } from '@/types/discount';
import { subDays } from 'date-fns';

// Mock data para demonstração
const mockNegotiations: Negotiation[] = [
  {
    id: '1',
    faturaId: 'fatura-007',
    invoiceNumber: 'INV-2025-007',
    fornecedor: 'Alpha Distribuidora Ltda',
    fornecedorId: 'fornecedor-alpha',
    tipo: 'desconto',
    valorOriginal: 18000,
    valorNegociado: 16200,
    economia: 1800,
    economiaPercentual: 10,
    status: 'aceita',
    negociadoPor: 'João Silva',
    negociadoPorId: 'user-001',
    dataInicio: subDays(new Date(), 15),
    dataFechamento: subDays(new Date(), 10),
    observacoes: 'Negociação bem-sucedida. Fornecedor aceitou 10% de desconto devido ao volume de compras.',
    detalhes: {
      descontoPercentualOriginal: 5,
      descontoPercentualNegociado: 10,
    },
  },
  {
    id: '2',
    faturaId: 'fatura-008',
    invoiceNumber: 'INV-2025-008',
    fornecedor: 'Beta Suprimentos S.A.',
    fornecedorId: 'fornecedor-beta',
    tipo: 'prazo',
    valorOriginal: 25000,
    valorNegociado: 25000,
    economia: 0,
    economiaPercentual: 0,
    status: 'aceita',
    negociadoPor: 'Maria Santos',
    negociadoPorId: 'user-002',
    dataInicio: subDays(new Date(), 12),
    dataFechamento: subDays(new Date(), 8),
    observacoes: 'Extensão de prazo de 30 para 60 dias sem juros. Impacto positivo no fluxo de caixa.',
    detalhes: {
      prazoOriginal: 30,
      prazoNegociado: 60,
    },
  },
  {
    id: '3',
    faturaId: 'fatura-009',
    invoiceNumber: 'INV-2025-009',
    fornecedor: 'Gamma Indústria Ltda',
    fornecedorId: 'fornecedor-gamma',
    tipo: 'parcelamento',
    valorOriginal: 45000,
    valorNegociado: 46350,
    economia: -1350,
    economiaPercentual: -3,
    status: 'aceita',
    negociadoPor: 'João Silva',
    negociadoPorId: 'user-001',
    dataInicio: subDays(new Date(), 20),
    dataFechamento: subDays(new Date(), 15),
    observacoes: 'Parcelamento em 3x com juros de 3%. Estratégia para melhorar fluxo de caixa.',
    detalhes: {
      parcelasOriginais: 1,
      parcelasNegociadas: 3,
    },
  },
  {
    id: '4',
    faturaId: 'fatura-010',
    invoiceNumber: 'INV-2025-010',
    fornecedor: 'Delta Comercial Ltda',
    fornecedorId: 'fornecedor-delta',
    tipo: 'desconto',
    valorOriginal: 12000,
    valorNegociado: 10800,
    economia: 1200,
    economiaPercentual: 10,
    status: 'em_negociacao',
    negociadoPor: 'Carlos Oliveira',
    negociadoPorId: 'user-003',
    dataInicio: subDays(new Date(), 3),
    observacoes: 'Aguardando resposta do fornecedor sobre proposta de 10% de desconto.',
    detalhes: {
      descontoPercentualOriginal: 0,
      descontoPercentualNegociado: 10,
    },
  },
  {
    id: '5',
    faturaId: 'fatura-011',
    invoiceNumber: 'INV-2025-011',
    fornecedor: 'Epsilon Materiais S.A.',
    fornecedorId: 'fornecedor-epsilon',
    tipo: 'desconto',
    valorOriginal: 8000,
    valorNegociado: 8000,
    economia: 0,
    economiaPercentual: 0,
    status: 'recusada',
    negociadoPor: 'Maria Santos',
    negociadoPorId: 'user-002',
    dataInicio: subDays(new Date(), 7),
    dataFechamento: subDays(new Date(), 5),
    observacoes: 'Fornecedor recusou desconto adicional. Margens já estão no limite.',
    detalhes: {
      descontoPercentualOriginal: 2,
      descontoPercentualNegociado: 7,
    },
  },
  {
    id: '6',
    faturaId: 'fatura-012',
    invoiceNumber: 'INV-2025-012',
    fornecedor: 'Zeta Equipamentos Ltda',
    fornecedorId: 'fornecedor-zeta',
    tipo: 'condicoes',
    valorOriginal: 30000,
    valorNegociado: 28500,
    economia: 1500,
    economiaPercentual: 5,
    status: 'aceita',
    negociadoPor: 'João Silva',
    negociadoPorId: 'user-001',
    dataInicio: subDays(new Date(), 25),
    dataFechamento: subDays(new Date(), 20),
    observacoes: 'Negociação de condições especiais: 5% desconto + garantia estendida de 24 meses.',
    detalhes: {
      condicoesOriginais: 'Garantia padrão de 12 meses',
      condicoesNegociadas: 'Garantia estendida de 24 meses + 5% desconto',
    },
  },
  {
    id: '7',
    faturaId: 'fatura-013',
    invoiceNumber: 'INV-2025-013',
    fornecedor: 'Alpha Distribuidora Ltda',
    fornecedorId: 'fornecedor-alpha',
    tipo: 'prazo',
    valorOriginal: 15000,
    valorNegociado: 15000,
    economia: 0,
    economiaPercentual: 0,
    status: 'em_negociacao',
    negociadoPor: 'Carlos Oliveira',
    negociadoPorId: 'user-003',
    dataInicio: subDays(new Date(), 2),
    observacoes: 'Solicitando extensão de prazo de 30 para 45 dias.',
    detalhes: {
      prazoOriginal: 30,
      prazoNegociado: 45,
    },
  },
];

export const useNegotiations = (filter?: 'em_negociacao' | 'aceita' | 'recusada') => {
  return useMemo(() => {
    let negotiations = mockNegotiations;

    if (filter) {
      negotiations = negotiations.filter(neg => neg.status === filter);
    }

    // Ordenar por data de início (mais recentes primeiro)
    return negotiations.sort((a, b) => b.dataInicio.getTime() - a.dataInicio.getTime());
  }, [filter]);
};

export const useNegotiationSummary = (): NegotiationSummary => {
  const negotiations = useNegotiations();

  return useMemo(() => {
    const totalNegociacoes = negotiations.length;
    const negociacoesAceitas = negotiations.filter(n => n.status === 'aceita').length;
    const negociacoesRecusadas = negotiations.filter(n => n.status === 'recusada').length;
    const emNegociacao = negotiations.filter(n => n.status === 'em_negociacao').length;

    const economiaTotal = negotiations
      .filter(n => n.status === 'aceita')
      .reduce((sum, n) => sum + n.economia, 0);

    const economiaMedia = negociacoesAceitas > 0
      ? economiaTotal / negociacoesAceitas
      : 0;

    const negociacoesFinalizadas = negociacoesAceitas + negociacoesRecusadas;
    const taxaSucesso = negociacoesFinalizadas > 0
      ? (negociacoesAceitas / negociacoesFinalizadas) * 100
      : 0;

    return {
      totalNegociacoes,
      negociacoesAceitas,
      negociacoesRecusadas,
      emNegociacao,
      economiaTotal,
      economiaMedia,
      taxaSucesso,
    };
  }, [negotiations]);
};

export const createNegotiation = (negotiationData: Partial<Negotiation>): Promise<Negotiation> => {
  // TODO: Implementar chamada à API
  return new Promise((resolve) => {
    setTimeout(() => {
      const newNegotiation: Negotiation = {
        id: `negotiation-${Date.now()}`,
        faturaId: negotiationData.faturaId || '',
        invoiceNumber: negotiationData.invoiceNumber || '',
        fornecedor: negotiationData.fornecedor || '',
        fornecedorId: negotiationData.fornecedorId || '',
        tipo: negotiationData.tipo || 'desconto',
        valorOriginal: negotiationData.valorOriginal || 0,
        valorNegociado: negotiationData.valorNegociado || 0,
        economia: (negotiationData.valorOriginal || 0) - (negotiationData.valorNegociado || 0),
        economiaPercentual: negotiationData.valorOriginal
          ? (((negotiationData.valorOriginal - (negotiationData.valorNegociado || 0)) / negotiationData.valorOriginal) * 100)
          : 0,
        status: 'em_negociacao',
        negociadoPor: negotiationData.negociadoPor || '',
        negociadoPorId: negotiationData.negociadoPorId || '',
        dataInicio: new Date(),
        observacoes: negotiationData.observacoes || '',
        detalhes: negotiationData.detalhes || {},
      };
      resolve(newNegotiation);
    }, 500);
  });
};

export const updateNegotiationStatus = (
  negotiationId: string,
  status: 'aceita' | 'recusada',
  observacoes?: string
): Promise<boolean> => {
  // TODO: Implementar chamada à API
  return new Promise((resolve) => {
    setTimeout(() => {
      console.log('Negociação atualizada:', negotiationId, status, observacoes);
      resolve(true);
    }, 500);
  });
};
