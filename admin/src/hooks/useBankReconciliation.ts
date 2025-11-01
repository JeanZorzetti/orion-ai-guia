import { useState, useEffect, useMemo } from 'react';
import {
  BankTransaction,
  PendingInvoice,
  ReconciliationSuggestion,
  ReconciliationSummary,
} from '@/types/bank-reconciliation';
import { differenceInDays } from 'date-fns';
import { api } from '@/lib/api';

// ===== INTERFACES para dados da API =====

interface CashFlowTransactionAPI {
  id: number;
  transaction_date: string;
  type: 'entrada' | 'saida';
  category: string;
  subcategory?: string;
  description: string;
  value: number;
  payment_method?: string;
  account_id?: number;
  reference_type?: string;
  reference_id?: number;
  is_reconciled: boolean;
  reconciled_at?: string;
  created_at: string;
  account?: {
    id: number;
    bank_name: string;
    account_number?: string;
    agency?: string;
  };
}

interface APInvoiceAPI {
  id: number;
  invoice_number: string;
  supplier_id: number;
  supplier?: {
    id: number;
    name: string;
  };
  total_value: number;
  due_date: string;
  payment_date?: string;
  status: string;
  // Campo de reconciliação (pode não existir ainda - vamos tratar isso)
  reconciled_transaction_id?: number;
}

// ===== HOOK para buscar transações bancárias =====

export const useBankTransactions = (conciliado?: boolean) => {
  const [transactions, setTransactions] = useState<BankTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log('🔍 [useBankReconciliation] Buscando transações do cash flow...');

        // Buscar transações do cash flow (apenas saídas para conciliar com AP)
        const response = await api.get<CashFlowTransactionAPI[]>('/cash-flow/transactions?limit=1000');
        console.log('✅ [useBankReconciliation] Transações recebidas:', response);

        // Converter para formato BankTransaction
        const allTransactions: BankTransaction[] = (response || [])
          .filter(t => t.type === 'saida') // Apenas saídas (pagamentos)
          .map(t => ({
            id: t.id.toString(),
            data: new Date(t.transaction_date),
            descricao: t.description,
            valor: t.value,
            tipo: 'debito' as const,
            categoria: t.category || 'Outros',
            conciliado: t.is_reconciled,
            banco: t.account?.bank_name || 'Não especificado',
            contaBancaria: t.account?.account_number || '',
            documento: t.reference_id?.toString(),
            faturaId: t.reference_type === 'payable' && t.reference_id ? t.reference_id.toString() : undefined,
          }));

        // Aplicar filtro de conciliado
        const filtered = conciliado !== undefined
          ? allTransactions.filter(t => t.conciliado === conciliado)
          : allTransactions;

        const sorted = filtered.sort((a, b) => b.data.getTime() - a.data.getTime());
        console.log(`📊 [useBankReconciliation] Transações processadas: ${sorted.length} (conciliado: ${conciliado})`);

        setTransactions(sorted);
      } catch (err: any) {
        console.error('❌ [useBankReconciliation] Erro ao buscar transações:', err);
        setError(err.message || 'Erro ao buscar transações');
        setTransactions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, [conciliado]);

  return transactions;
};

// ===== HOOK para buscar faturas pendentes de conciliação =====

export const usePendingInvoices = (conciliado?: boolean) => {
  const [invoices, setInvoices] = useState<PendingInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log('🔍 [useBankReconciliation] Buscando faturas pagas...');

        // Buscar faturas que foram pagas (status = paid)
        const response = await api.get<APInvoiceAPI[]>('/accounts-payable/invoices?status=paid&limit=1000');
        console.log('✅ [useBankReconciliation] Faturas recebidas:', response);

        // Converter para formato PendingInvoice
        const allInvoices: PendingInvoice[] = (response || [])
          .filter(inv => inv.payment_date) // Apenas faturas com data de pagamento
          .map(inv => ({
            id: inv.id.toString(),
            invoiceNumber: inv.invoice_number,
            fornecedor: inv.supplier?.name || `Fornecedor #${inv.supplier_id}`,
            fornecedorId: inv.supplier_id.toString(),
            valor: inv.total_value,
            dataVencimento: new Date(inv.due_date),
            dataPagamento: inv.payment_date ? new Date(inv.payment_date) : undefined,
            status: 'paga',
            conciliado: !!inv.reconciled_transaction_id,
            transacaoId: inv.reconciled_transaction_id?.toString(),
          }));

        // Aplicar filtro de conciliado
        const filtered = conciliado !== undefined
          ? allInvoices.filter(i => i.conciliado === conciliado)
          : allInvoices;

        const sorted = filtered.sort((a, b) => {
          const dateA = a.dataPagamento || a.dataVencimento;
          const dateB = b.dataPagamento || b.dataVencimento;
          return dateB.getTime() - dateA.getTime();
        });

        console.log(`📊 [useBankReconciliation] Faturas processadas: ${sorted.length} (conciliado: ${conciliado})`);
        setInvoices(sorted);
      } catch (err: any) {
        console.error('❌ [useBankReconciliation] Erro ao buscar faturas:', err);
        setError(err.message || 'Erro ao buscar faturas');
        setInvoices([]);
      } finally {
        setLoading(false);
      }
    };

    fetchInvoices();
  }, [conciliado]);

  return invoices;
};

// ===== Algoritmo de sugestão de conciliação (mantido igual) =====

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

// ===== HOOK para sugestões de conciliação =====

export const useReconciliationSuggestions = () => {
  const transactions = useBankTransactions(false);
  const invoices = usePendingInvoices(false);

  return useMemo(() => {
    return generateSuggestions(transactions, invoices);
  }, [transactions, invoices]);
};

// ===== HOOK para sumário de conciliação =====

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

// ===== Funções de ação (conectadas ao backend) =====

export const reconcileManually = async (
  transacaoId: string,
  faturaId: string,
  observacoes?: string
): Promise<boolean> => {
  try {
    console.log('🔄 [useBankReconciliation] Conciliando manualmente:', { transacaoId, faturaId, observacoes });

    // Atualizar transação no cash flow
    await api.patch(`/cash-flow/transactions/${transacaoId}`, {
      is_reconciled: true,
      reference_type: 'payable',
      reference_id: parseInt(faturaId),
      notes: observacoes || `Conciliado com fatura ${faturaId}`,
    });

    // TODO: Quando o campo reconciled_transaction_id existir no AP, atualizar também:
    // await api.patch(`/accounts-payable/invoices/${faturaId}`, {
    //   reconciled_transaction_id: parseInt(transacaoId),
    // });

    console.log('✅ [useBankReconciliation] Conciliação realizada com sucesso');
    return true;
  } catch (error) {
    console.error('❌ [useBankReconciliation] Erro ao conciliar:', error);
    throw error;
  }
};

export const acceptSuggestion = async (suggestionId: string): Promise<boolean> => {
  try {
    // Parse do ID da sugestão: "suggestion-{transacaoId}-{faturaId}"
    const parts = suggestionId.split('-');
    const transacaoId = parts[1];
    const faturaId = parts[2];

    console.log('✅ [useBankReconciliation] Aceitando sugestão:', { suggestionId, transacaoId, faturaId });

    return await reconcileManually(transacaoId, faturaId, 'Conciliado automaticamente pela IA');
  } catch (error) {
    console.error('❌ [useBankReconciliation] Erro ao aceitar sugestão:', error);
    throw error;
  }
};

export const rejectSuggestion = async (suggestionId: string): Promise<boolean> => {
  // Por enquanto, apenas logar (no futuro podemos salvar rejeições para melhorar a IA)
  console.log('❌ [useBankReconciliation] Sugestão rejeitada:', suggestionId);
  return Promise.resolve(true);
};
