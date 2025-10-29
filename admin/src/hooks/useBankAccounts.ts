import { useState, useEffect } from 'react';
import type { BankAccount } from '@/types/cash-flow';

interface UseBankAccountsReturn {
  accounts: BankAccount[];
  loading: boolean;
  addAccount: (account: Omit<BankAccount, 'id'>) => void;
  updateAccount: (id: string, updates: Partial<BankAccount>) => void;
  deleteAccount: (id: string) => void;
  getTotalBalance: () => number;
}

export const useBankAccounts = (): UseBankAccountsReturn => {
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAccounts();
  }, []);

  const loadAccounts = () => {
    setLoading(true);
    try {
      // TODO: Integrar com API real quando disponível
      // Dados mockados para desenvolvimento
      const mockAccounts: BankAccount[] = [
        {
          id: '1',
          nome: 'Conta Corrente Principal',
          banco: 'Banco do Brasil',
          agencia: '1234-5',
          conta: '12345-6',
          tipo: 'corrente',
          saldo: 45280.30,
          ativa: true,
          corPrimaria: '#3b82f6' // blue
        },
        {
          id: '2',
          nome: 'Conta Poupança',
          banco: 'Caixa Econômica Federal',
          agencia: '0987',
          conta: '98765-4',
          tipo: 'poupanca',
          saldo: 25000.00,
          ativa: true,
          corPrimaria: '#10b981' // green
        },
        {
          id: '3',
          nome: 'Investimentos CDB',
          banco: 'Itaú',
          agencia: '5678',
          conta: '56789-0',
          tipo: 'investimento',
          saldo: 150000.00,
          ativa: true,
          corPrimaria: '#8b5cf6' // purple
        },
        {
          id: '4',
          nome: 'Caixa Físico',
          banco: 'N/A',
          agencia: 'N/A',
          conta: 'N/A',
          tipo: 'caixa',
          saldo: 3500.00,
          ativa: true,
          corPrimaria: '#f59e0b' // orange
        }
      ];

      setAccounts(mockAccounts);
    } catch (error) {
      console.error('Erro ao carregar contas:', error);
    } finally {
      setLoading(false);
    }
  };

  const addAccount = (account: Omit<BankAccount, 'id'>) => {
    const newAccount: BankAccount = {
      ...account,
      id: Date.now().toString()
    };
    setAccounts([...accounts, newAccount]);
    // TODO: Salvar na API
  };

  const updateAccount = (id: string, updates: Partial<BankAccount>) => {
    setAccounts(accounts.map(account =>
      account.id === id ? { ...account, ...updates } : account
    ));
    // TODO: Atualizar na API
  };

  const deleteAccount = (id: string) => {
    setAccounts(accounts.filter(account => account.id !== id));
    // TODO: Deletar na API
  };

  const getTotalBalance = () => {
    return accounts
      .filter(account => account.ativa)
      .reduce((total, account) => total + account.saldo, 0);
  };

  return {
    accounts,
    loading,
    addAccount,
    updateAccount,
    deleteAccount,
    getTotalBalance
  };
};
