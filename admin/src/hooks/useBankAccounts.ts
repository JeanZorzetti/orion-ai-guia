import { useMemo } from 'react';
import type { BankAccount } from '@/types/cash-flow';
import { useCashFlow } from './useCashFlow';

interface UseBankAccountsReturn {
  accounts: BankAccount[];
  loading: boolean;
  addAccount: (account: Omit<BankAccount, 'id'>) => void;
  updateAccount: (id: string, updates: Partial<BankAccount>) => void;
  deleteAccount: (id: string) => void;
  getTotalBalance: () => number;
}

const getAccountTypeColor = (tipo: string): string => {
  switch (tipo) {
    case 'corrente':
      return '#3b82f6'; // blue
    case 'poupanca':
      return '#10b981'; // green
    case 'investimento':
      return '#8b5cf6'; // purple
    case 'caixa':
      return '#f59e0b'; // orange
    default:
      return '#6b7280'; // gray
  }
};

export const useBankAccounts = (): UseBankAccountsReturn => {
  const { bankAccounts, loadingAccounts, createBankAccount, updateBankAccount, deleteBankAccount } = useCashFlow();

  // Transformar contas da API para o formato do componente
  const accounts = useMemo<BankAccount[]>(() => {
    console.log('🔍 [useBankAccounts] Transformando contas da API:', bankAccounts.length);

    return bankAccounts.map(acc => ({
      id: acc.id.toString(),
      nome: acc.account_type === 'caixa' && !acc.account_number
        ? 'Caixa Físico'
        : `${acc.bank_name} ${acc.account_type === 'corrente' ? 'C/C' : acc.account_type === 'poupanca' ? 'Poupança' : 'Investimento'}`,
      banco: acc.bank_name || 'N/A',
      agencia: acc.agency || 'N/A',
      conta: acc.account_number || 'N/A',
      tipo: acc.account_type,
      saldo: acc.current_balance,
      ativa: acc.is_active,
      corPrimaria: getAccountTypeColor(acc.account_type)
    }));
  }, [bankAccounts]);

  const addAccount = async (account: Omit<BankAccount, 'id'>) => {
    console.log('📝 [useBankAccounts] Criando nova conta:', account.nome);
    await createBankAccount({
      bank_name: account.banco,
      account_type: account.tipo,
      account_number: account.conta !== 'N/A' ? account.conta : undefined,
      agency: account.agencia !== 'N/A' ? account.agencia : undefined,
      initial_balance: account.saldo,
      is_main: false
    });
  };

  const updateAccount = async (id: string, updates: Partial<BankAccount>) => {
    console.log('✏️ [useBankAccounts] Atualizando conta:', id);
    await updateBankAccount(Number(id), {
      bank_name: updates.banco,
      account_type: updates.tipo,
      account_number: updates.conta,
      agency: updates.agencia,
      is_active: updates.ativa
    });
  };

  const deleteAccount = async (id: string) => {
    console.log('🗑️ [useBankAccounts] Deletando conta:', id);
    await deleteBankAccount(Number(id));
  };

  const getTotalBalance = () => {
    return accounts
      .filter(account => account.ativa)
      .reduce((total, account) => total + account.saldo, 0);
  };

  return {
    accounts,
    loading: loadingAccounts,
    addAccount,
    updateAccount,
    deleteAccount,
    getTotalBalance
  };
};
