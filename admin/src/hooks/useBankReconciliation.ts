import { useMemo } from 'react';
import {
  BankTransaction,
  PendingInvoice,
  ReconciliationSuggestion,
  ReconciliationSummary,
} from '@/types/bank-reconciliation';
import { subDays, differenceInDays } from 'date-fns';

// Mock data - Transações bancárias
const mockBankTransactions: BankTransaction[] = [
  {
    id: 'trans-001',
    data: subDays(new Date(), 2),
    descricao: 'TED ALPHA DISTRIBUIDORA LTDA',
    valor: 15000,
    tipo: 'debito',
    categoria: 'Fornecedores',
    conciliado: false,
    banco: 'Banco do Brasil',
    contaBancaria: '0001-5',
    documento: '12345678',
  },
  {
    id: 'trans-002',
    data: subDays(new Date(), 5),
    descricao: 'PIX BETA SUPRIMENTOS S.A.',
    valor: 8500,
    tipo: 'debito',
    categoria: 'Fornecedores',
    conciliado: false,
    banco: 'Banco do Brasil',
    contaBancaria: '0001-5',
    documento: '87654321',
  },
  {
    id: 'trans-003',
    data: subDays(new Date(), 10),
    descricao: 'BOLETO GAMMA INDUSTRIA',
    valor: 22000,
    tipo: 'debito',
    categoria: 'Fornecedores',
    conciliado: true,
    faturaId: 'fatura-003',
    banco: 'Banco do Brasil',
    contaBancaria: '0001-5',
  },
  {
    id: 'trans-004',
    data: subDays(new Date(), 3),
    descricao: 'TED DELTA COMERCIAL',
    valor: 5020,
    tipo: 'debito',
    categoria: 'Fornecedores',
    conciliado: false,
    banco: 'Itaú',
    contaBancaria: '1234-6',
    documento: '45678901',
  },
  {
    id: 'trans-005',
    data: subDays(new Date(), 7),
    descricao: 'PIX EPSILON MATERIAIS',
    valor: 12500,
    tipo: 'debito',
    categoria: 'Fornecedores',
    conciliado: false,
    banco: 'Itaú',
    contaBancaria: '1234-6',
  },
  {
    id: 'trans-006',
    data: subDays(new Date(), 1),
    descricao: 'TED ZETA EQUIPAMENTOS',
    valor: 30000,
    tipo: 'debito',
    categoria: 'Fornecedores',
    conciliado: false,
    banco: 'Banco do Brasil',
    contaBancaria: '0001-5',
  },
  {
    id: 'trans-007',
    data: subDays(new Date(), 15),
    descricao: 'PIX ALPHA DISTRIBUIDORA',
    valor: 18000,
    tipo: 'debito',
    categoria: 'Fornecedores',
    conciliado: true,
    faturaId: 'fatura-007',
    banco: 'Banco do Brasil',
    contaBancaria: '0001-5',
  },
];

// Mock data - Faturas pendentes
const mockPendingInvoices: PendingInvoice[] = [
  {
    id: 'fatura-001',
    invoiceNumber: 'INV-2025-001',
    fornecedor: 'Alpha Distribuidora Ltda',
    fornecedorId: 'fornecedor-alpha',
    valor: 15000,
    dataVencimento: subDays(new Date(), 3),
    dataPagamento: subDays(new Date(), 2),
    status: 'paga',
    conciliado: false,
  },
  {
    id: 'fatura-002',
    invoiceNumber: 'INV-2025-002',
    fornecedor: 'Beta Suprimentos S.A.',
    fornecedorId: 'fornecedor-beta',
    valor: 8500,
    dataVencimento: subDays(new Date(), 7),
    dataPagamento: subDays(new Date(), 5),
    status: 'paga',
    conciliado: false,
  },
  {
    id: 'fatura-003',
    invoiceNumber: 'INV-2025-003',
    fornecedor: 'Gamma Indústria Ltda',
    fornecedorId: 'fornecedor-gamma',
    valor: 22000,
    dataVencimento: subDays(new Date(), 12),
    dataPagamento: subDays(new Date(), 10),
    status: 'paga',
    conciliado: true,
    transacaoId: 'trans-003',
  },
  {
    id: 'fatura-004',
    invoiceNumber: 'INV-2025-004',
    fornecedor: 'Delta Comercial Ltda',
    fornecedorId: 'fornecedor-delta',
    valor: 5000,
    dataVencimento: subDays(new Date(), 5),
    dataPagamento: subDays(new Date(), 3),
    status: 'paga',
    conciliado: false,
  },
  {
    id: 'fatura-005',
    invoiceNumber: 'INV-2025-005',
    fornecedor: 'Epsilon Materiais S.A.',
    fornecedorId: 'fornecedor-epsilon',
    valor: 12500,
    dataVencimento: subDays(new Date(), 9),
    dataPagamento: subDays(new Date(), 7),
    status: 'paga',
    conciliado: false,
  },
  {
    id: 'fatura-006',
    invoiceNumber: 'INV-2025-006',
    fornecedor: 'Zeta Equipamentos Ltda',
    fornecedorId: 'fornecedor-zeta',
    valor: 30000,
    dataVencimento: subDays(new Date(), 2),
    dataPagamento: subDays(new Date(), 1),
    status: 'paga',
    conciliado: false,
  },
];

// Algoritmo de sugestão de conciliação
const generateSuggestions = (
  transactions: BankTransaction[],
  invoices: PendingInvoice[]
): ReconciliationSuggestion[] => {
  const suggestions: ReconciliationSuggestion[] = [];

  // Transações não conciliadas
  const unconciledTransactions = transactions.filter((t) => !t.conciliado);
  const unconciledInvoices = invoices.filter((i) => !i.conciliado);

  unconciledTransactions.forEach((transaction) => {
    unconciledInvoices.forEach((invoice) => {
      // Calcular confiança baseado em múltiplos fatores
      let confianca = 0;
      const detalhes = {
        matchValor: false,
        matchData: false,
        matchFornecedor: false,
        diferencaValor: Math.abs(transaction.valor - invoice.valor),
        diferencaDias: invoice.dataPagamento
          ? Math.abs(differenceInDays(transaction.data, invoice.dataPagamento))
          : 999,
      };

      // Match de valor (40 pontos)
      const diferencaPercentual = (detalhes.diferencaValor / invoice.valor) * 100;
      if (diferencaPercentual === 0) {
        confianca += 40;
        detalhes.matchValor = true;
      } else if (diferencaPercentual <= 1) {
        confianca += 35; // Pequena diferença (taxas, descontos)
      } else if (diferencaPercentual <= 5) {
        confianca += 20;
      }

      // Match de data (30 pontos)
      if (detalhes.diferencaDias === 0) {
        confianca += 30;
        detalhes.matchData = true;
      } else if (detalhes.diferencaDias <= 2) {
        confianca += 25;
      } else if (detalhes.diferencaDias <= 5) {
        confianca += 15;
      }

      // Match de fornecedor no texto (30 pontos)
      const descricaoUpper = transaction.descricao.toUpperCase();
      const fornecedorUpper = invoice.fornecedor.toUpperCase();
      const palavrasFornecedor = fornecedorUpper.split(' ');

      const matchPalavras = palavrasFornecedor.filter((palavra) =>
        palavra.length > 3 && descricaoUpper.includes(palavra)
      );

      if (matchPalavras.length >= palavrasFornecedor.length - 1) {
        confianca += 30;
        detalhes.matchFornecedor = true;
      } else if (matchPalavras.length >= Math.floor(palavrasFornecedor.length / 2)) {
        confianca += 20;
      } else if (matchPalavras.length > 0) {
        confianca += 10;
      }

      // Apenas adicionar sugestões com confiança >= 50%
      if (confianca >= 50) {
        let razao = '';
        if (detalhes.matchValor && detalhes.matchData && detalhes.matchFornecedor) {
          razao = 'Match perfeito: valor, data e fornecedor coincidem';
        } else if (detalhes.matchValor && detalhes.matchFornecedor) {
          razao = `Valor e fornecedor coincidem (diferença de ${detalhes.diferencaDias} dias)`;
        } else if (detalhes.matchValor && detalhes.matchData) {
          razao = `Valor e data coincidem (fornecedor similar)`;
        } else if (detalhes.matchFornecedor) {
          razao = `Fornecedor identificado (diferença de R$ ${detalhes.diferencaValor.toFixed(2)})`;
        } else {
          razao = 'Possível correspondência baseada em múltiplos fatores';
        }

        suggestions.push({
          id: `suggestion-${transaction.id}-${invoice.id}`,
          transacaoId: transaction.id,
          faturaId: invoice.id,
          confianca: Math.round(confianca),
          razao,
          detalhes,
          transacao: transaction,
          fatura: invoice,
        });
      }
    });
  });

  // Ordenar por confiança (maior primeiro)
  return suggestions.sort((a, b) => b.confianca - a.confianca);
};

export const useBankTransactions = (conciliado?: boolean) => {
  return useMemo(() => {
    let transactions = mockBankTransactions;

    if (conciliado !== undefined) {
      transactions = transactions.filter((t) => t.conciliado === conciliado);
    }

    return transactions.sort((a, b) => b.data.getTime() - a.data.getTime());
  }, [conciliado]);
};

export const usePendingInvoices = (conciliado?: boolean) => {
  return useMemo(() => {
    let invoices = mockPendingInvoices;

    if (conciliado !== undefined) {
      invoices = invoices.filter((i) => i.conciliado === conciliado);
    }

    return invoices.sort((a, b) => {
      const dateA = a.dataPagamento || a.dataVencimento;
      const dateB = b.dataPagamento || b.dataVencimento;
      return dateB.getTime() - dateA.getTime();
    });
  }, [conciliado]);
};

export const useReconciliationSuggestions = () => {
  const transactions = useBankTransactions(false);
  const invoices = usePendingInvoices(false);

  return useMemo(() => {
    return generateSuggestions(transactions, invoices);
  }, [transactions, invoices]);
};

export const useReconciliationSummary = (): ReconciliationSummary => {
  const allTransactions = useBankTransactions();
  const allInvoices = usePendingInvoices();

  return useMemo(() => {
    const totalTransacoes = allTransactions.length;
    const transacoesConciliadas = allTransactions.filter((t) => t.conciliado).length;
    const transacoesPendentes = totalTransacoes - transacoesConciliadas;

    const totalFaturas = allInvoices.length;
    const faturasConciliadas = allInvoices.filter((i) => i.conciliado).length;
    const faturasPendentes = totalFaturas - faturasConciliadas;

    const diferencaTotal = transacoesPendentes * 0; // Simplificado
    const taxaConciliacao =
      totalTransacoes > 0 ? (transacoesConciliadas / totalTransacoes) * 100 : 0;

    // Estimativa: 15 minutos por conciliação manual vs 1 minuto automático
    const economiaTempo = transacoesConciliadas * (15 - 1) / 60; // em horas

    return {
      totalTransacoes,
      transacoesConciliadas,
      transacoesPendentes,
      totalFaturas,
      faturasConciliadas,
      faturasPendentes,
      diferencaTotal,
      taxaConciliacao,
      economiaTempo,
    };
  }, [allTransactions, allInvoices]);
};

export const reconcileManually = (
  transacaoId: string,
  faturaId: string,
  observacoes?: string
): Promise<boolean> => {
  // TODO: Implementar chamada à API
  return new Promise((resolve) => {
    setTimeout(() => {
      console.log('Conciliação manual realizada:', { transacaoId, faturaId, observacoes });
      resolve(true);
    }, 500);
  });
};

export const acceptSuggestion = (suggestionId: string): Promise<boolean> => {
  // TODO: Implementar chamada à API
  return new Promise((resolve) => {
    setTimeout(() => {
      console.log('Sugestão aceita:', suggestionId);
      resolve(true);
    }, 500);
  });
};

export const rejectSuggestion = (suggestionId: string): Promise<boolean> => {
  // TODO: Implementar chamada à API
  return new Promise((resolve) => {
    setTimeout(() => {
      console.log('Sugestão rejeitada:', suggestionId);
      resolve(true);
    }, 500);
  });
};
