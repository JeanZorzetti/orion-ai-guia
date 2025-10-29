import { useMemo } from 'react';
import { DiscountOpportunity, DiscountSummary } from '@/types/discount';
import { differenceInDays } from 'date-fns';

// Mock data para demonstração
const mockDiscountOpportunities: DiscountOpportunity[] = [
  {
    id: '1',
    faturaId: 'fatura-001',
    invoiceNumber: 'INV-2025-001',
    fornecedor: 'Alpha Distribuidora Ltda',
    fornecedorId: 'fornecedor-alpha',
    valorOriginal: 15000,
    descontoPercentual: 5,
    valorDesconto: 750,
    valorFinal: 14250,
    condicao: 'Pagamento antecipado em até 5 dias',
    dataLimite: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 dias
    diasRestantes: 2,
    status: 'disponivel',
    categoria: 'pagamento_antecipado',
  },
  {
    id: '2',
    faturaId: 'fatura-002',
    invoiceNumber: 'INV-2025-002',
    fornecedor: 'Beta Suprimentos S.A.',
    fornecedorId: 'fornecedor-beta',
    valorOriginal: 8500,
    descontoPercentual: 3,
    valorDesconto: 255,
    valorFinal: 8245,
    condicao: 'Pagamento antecipado em até 7 dias',
    dataLimite: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 dias
    diasRestantes: 5,
    status: 'disponivel',
    categoria: 'pagamento_antecipado',
  },
  {
    id: '3',
    faturaId: 'fatura-003',
    invoiceNumber: 'INV-2025-003',
    fornecedor: 'Gamma Indústria Ltda',
    fornecedorId: 'fornecedor-gamma',
    valorOriginal: 22000,
    descontoPercentual: 8,
    valorDesconto: 1760,
    valorFinal: 20240,
    condicao: 'Desconto por volume - compra acima de R$ 20.000',
    dataLimite: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 dias
    diasRestantes: 10,
    status: 'disponivel',
    categoria: 'volume',
  },
  {
    id: '4',
    faturaId: 'fatura-004',
    invoiceNumber: 'INV-2025-004',
    fornecedor: 'Delta Comercial Ltda',
    fornecedorId: 'fornecedor-delta',
    valorOriginal: 5000,
    descontoPercentual: 10,
    valorDesconto: 500,
    valorFinal: 4500,
    condicao: 'Desconto de primeira compra',
    dataLimite: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 dias
    diasRestantes: 15,
    status: 'disponivel',
    categoria: 'primeira_compra',
  },
  {
    id: '5',
    faturaId: 'fatura-005',
    invoiceNumber: 'INV-2025-005',
    fornecedor: 'Epsilon Materiais S.A.',
    fornecedorId: 'fornecedor-epsilon',
    valorOriginal: 12500,
    descontoPercentual: 4,
    valorDesconto: 500,
    valorFinal: 12000,
    condicao: 'Desconto de fidelidade - cliente há mais de 2 anos',
    dataLimite: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 dias
    diasRestantes: 7,
    status: 'disponivel',
    categoria: 'fidelidade',
  },
  {
    id: '6',
    faturaId: 'fatura-006',
    invoiceNumber: 'INV-2024-099',
    fornecedor: 'Alpha Distribuidora Ltda',
    fornecedorId: 'fornecedor-alpha',
    valorOriginal: 10000,
    descontoPercentual: 5,
    valorDesconto: 500,
    valorFinal: 9500,
    condicao: 'Pagamento antecipado',
    dataLimite: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // expirado
    diasRestantes: -2,
    status: 'expirado',
    categoria: 'pagamento_antecipado',
  },
];

export const useDiscountOpportunities = (filter?: 'disponivel' | 'aproveitado' | 'expirado') => {
  return useMemo(() => {
    let opportunities = mockDiscountOpportunities;

    // Atualizar diasRestantes baseado na data atual
    opportunities = opportunities.map(opp => ({
      ...opp,
      diasRestantes: differenceInDays(opp.dataLimite, new Date()),
      status: differenceInDays(opp.dataLimite, new Date()) < 0
        ? 'expirado' as const
        : opp.status,
    }));

    if (filter) {
      opportunities = opportunities.filter(opp => opp.status === filter);
    }

    // Ordenar por dias restantes (mais urgentes primeiro)
    return opportunities.sort((a, b) => a.diasRestantes - b.diasRestantes);
  }, [filter]);
};

export const useDiscountSummary = (): DiscountSummary => {
  const opportunities = useDiscountOpportunities();

  return useMemo(() => {
    const disponiveis = opportunities.filter(o => o.status === 'disponivel');
    const aproveitados = opportunities.filter(o => o.status === 'aproveitado');
    const expirados = opportunities.filter(o => o.status === 'expirado');

    const totalDescontosDisponiveis = disponiveis.length;
    const valorTotalDescontos = disponiveis.reduce((sum, o) => sum + o.valorDesconto, 0);
    const descontosAproveitados = aproveitados.length;
    const economiaTotal = aproveitados.reduce((sum, o) => sum + o.valorDesconto, 0);
    const descontosExpirados = expirados.length;
    const valorDescontosExpirados = expirados.reduce((sum, o) => sum + o.valorDesconto, 0);

    const totalDescontos = totalDescontosDisponiveis + descontosAproveitados + descontosExpirados;
    const taxaAproveitamento = totalDescontos > 0
      ? (descontosAproveitados / totalDescontos) * 100
      : 0;

    return {
      totalDescontosDisponiveis,
      valorTotalDescontos,
      descontosAproveitados,
      economiaTotal,
      descontosExpirados,
      valorDescontosExpirados,
      taxaAproveitamento,
    };
  }, [opportunities]);
};

export const applyDiscount = (opportunityId: string): Promise<boolean> => {
  // TODO: Implementar chamada à API
  return new Promise((resolve) => {
    setTimeout(() => {
      console.log('Desconto aplicado:', opportunityId);
      resolve(true);
    }, 500);
  });
};
