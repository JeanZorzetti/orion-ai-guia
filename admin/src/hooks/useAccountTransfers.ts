import { useMemo } from 'react';
import type { Transferencia, BankAccount } from '@/types/cash-flow';
import { useCashFlow } from './useCashFlow';
import { useBankAccounts } from './useBankAccounts';

interface UseAccountTransfersReturn {
  transfers: Transferencia[];
  loading: boolean;
  addTransfer: (transfer: Omit<Transferencia, 'id'>) => void;
  getTransfersByAccount: (accountId: string) => Transferencia[];
}

export const useAccountTransfers = (): UseAccountTransfersReturn => {
  const { transactions, loadingTransactions, createTransfer } = useCashFlow();
  const { accounts } = useBankAccounts();

  // Transformar transações de transferência da API para o formato do componente
  const transfers = useMemo<Transferencia[]>(() => {
    console.log('🔍 [useAccountTransfers] Processando transações:', transactions.length);

    // Filtrar transações que são transferências (baseado na categoria ou descrição)
    const transferTransactions = transactions.filter(t =>
      t.category?.toLowerCase().includes('transferencia') ||
      t.category?.toLowerCase().includes('transfer') ||
      t.description?.toLowerCase().includes('transferencia') ||
      t.description?.toLowerCase().includes('transfer')
    );

    console.log('🔍 [useAccountTransfers] Transferências encontradas:', transferTransactions.length);

    return transferTransactions.map(t => {
      // Encontrar contas origem e destino baseado nos IDs (se disponível nos metadados)
      const fromAccountId = t.account_id?.toString();
      const toAccountId = (t as any).to_account_id?.toString(); // Pode não existir na API atual

      const contaOrigem = accounts.find(acc => acc.id === fromAccountId) || {
        id: fromAccountId || '0',
        nome: 'Conta Origem',
        banco: 'N/A',
        agencia: 'N/A',
        conta: 'N/A',
        tipo: 'corrente' as const,
        saldo: 0,
        ativa: true,
        corPrimaria: '#6b7280'
      };

      const contaDestino = accounts.find(acc => acc.id === toAccountId) || {
        id: toAccountId || '0',
        nome: 'Conta Destino',
        banco: 'N/A',
        agencia: 'N/A',
        conta: 'N/A',
        tipo: 'corrente' as const,
        saldo: 0,
        ativa: true,
        corPrimaria: '#6b7280'
      };

      // Determinar tipo de transferência baseado na categoria
      let tipo: 'transferencia' | 'aplicacao' | 'resgate' = 'transferencia';
      if (t.category?.toLowerCase().includes('aplicacao') || t.category?.toLowerCase().includes('investimento')) {
        tipo = 'aplicacao';
      } else if (t.category?.toLowerCase().includes('resgate')) {
        tipo = 'resgate';
      }

      return {
        id: t.id.toString(),
        data: new Date(t.transaction_date),
        contaOrigem,
        contaDestino,
        valor: Math.abs(t.value),
        descricao: t.description,
        tipo
      };
    });
  }, [transactions, accounts]);

  const addTransfer = async (transfer: Omit<Transferencia, 'id'>) => {
    console.log('📝 [useAccountTransfers] Criando transferência:', transfer);

    // Usar o método createTransfer do useCashFlow
    await createTransfer({
      from_account_id: Number(transfer.contaOrigem.id),
      to_account_id: Number(transfer.contaDestino.id),
      value: transfer.valor,
      description: transfer.descricao,
      transaction_date: transfer.data.toISOString().split('T')[0]
    });
  };

  const getTransfersByAccount = (accountId: string) => {
    return transfers.filter(
      transfer =>
        transfer.contaOrigem.id === accountId ||
        transfer.contaDestino.id === accountId
    );
  };

  return {
    transfers,
    loading: loadingTransactions,
    addTransfer,
    getTransfersByAccount
  };
};
