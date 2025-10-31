'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { cashFlowService } from '@/services/cash-flow';
import {
  CashFlowTransaction,
  CashFlowTransactionCreate,
  CashFlowTransactionUpdate,
  BankAccountData,
  BankAccountCreate,
  BankAccountUpdate,
  TransferRequest,
  CashFlowSummary,
  CategorySummary,
  BalanceHistory,
  CashFlowProjectionData,
  CashFlowAnalytics,
  AccountBalanceSummary,
  CashFlowFilters
} from '@/types/financeiro';

interface UseCashFlowReturn {
  // Transactions
  transactions: CashFlowTransaction[];
  loadingTransactions: boolean;

  // Bank Accounts
  bankAccounts: BankAccountData[];
  loadingAccounts: boolean;

  // Analytics
  summary: CashFlowSummary | null;
  categoryAnalysis: CategorySummary[];
  accountSummary: AccountBalanceSummary[];
  balanceHistory: BalanceHistory[];
  projection: CashFlowProjectionData[];
  completeAnalytics: CashFlowAnalytics | null;
  loadingAnalytics: boolean;

  // Error
  error: string | null;

  // Transaction Actions
  loadTransactions: (filters?: CashFlowFilters) => Promise<void>;
  createTransaction: (data: CashFlowTransactionCreate) => Promise<CashFlowTransaction | null>;
  updateTransaction: (id: number, data: CashFlowTransactionUpdate) => Promise<CashFlowTransaction | null>;
  deleteTransaction: (id: number) => Promise<boolean>;
  reconcileTransaction: (id: number) => Promise<CashFlowTransaction | null>;

  // Bank Account Actions
  loadBankAccounts: (activeOnly?: boolean) => Promise<void>;
  createBankAccount: (data: BankAccountCreate) => Promise<BankAccountData | null>;
  updateBankAccount: (id: number, data: BankAccountUpdate) => Promise<BankAccountData | null>;
  deleteBankAccount: (id: number) => Promise<boolean>;

  // Transfer Actions
  createTransfer: (data: TransferRequest) => Promise<boolean>;

  // Analytics Actions
  loadSummary: (startDate: string, endDate: string, accountId?: number) => Promise<void>;
  loadCategoryAnalysis: (startDate: string, endDate: string, accountId?: number) => Promise<void>;
  loadAccountSummary: () => Promise<void>;
  loadBalanceHistory: (startDate: string, endDate: string, accountId?: number) => Promise<void>;
  loadProjection: (daysAhead?: number, accountId?: number) => Promise<void>;
  loadCompleteAnalytics: (startDate: string, endDate: string, accountId?: number) => Promise<void>;

  // Utility
  refreshAll: (startDate?: string, endDate?: string) => Promise<void>;
}

export function useCashFlow(
  autoLoad: boolean = true,
  initialFilters?: CashFlowFilters
): UseCashFlowReturn {
  // Transaction state
  const [transactions, setTransactions] = useState<CashFlowTransaction[]>([]);
  const [loadingTransactions, setLoadingTransactions] = useState(false);

  // Bank Account state
  const [bankAccounts, setBankAccounts] = useState<BankAccountData[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(false);

  // Analytics state
  const [summary, setSummary] = useState<CashFlowSummary | null>(null);
  const [categoryAnalysis, setCategoryAnalysis] = useState<CategorySummary[]>([]);
  const [accountSummary, setAccountSummary] = useState<AccountBalanceSummary[]>([]);
  const [balanceHistory, setBalanceHistory] = useState<BalanceHistory[]>([]);
  const [projection, setProjection] = useState<CashFlowProjectionData[]>([]);
  const [completeAnalytics, setCompleteAnalytics] = useState<CashFlowAnalytics | null>(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);

  // Error state
  const [error, setError] = useState<string | null>(null);

  // Current filters
  const [currentFilters, setCurrentFilters] = useState<CashFlowFilters | undefined>(initialFilters);

  // ==================== TRANSACTION ACTIONS ====================

  const loadTransactions = useCallback(async (filters?: CashFlowFilters) => {
    setLoadingTransactions(true);
    setError(null);

    try {
      const data = await cashFlowService.getTransactions(filters || currentFilters);
      setTransactions(data);
      setCurrentFilters(filters || currentFilters);
    } catch (err: any) {
      const status = err?.response?.status;
      if (status !== 401 && status !== 404) {
        const errorMessage = err?.response?.data?.detail || 'Erro ao carregar transações';
        setError(errorMessage);
        toast.error(errorMessage);
      }
    } finally {
      setLoadingTransactions(false);
    }
  }, [currentFilters]);

  const createTransaction = useCallback(async (
    data: CashFlowTransactionCreate
  ): Promise<CashFlowTransaction | null> => {
    try {
      const newTransaction = await cashFlowService.createTransaction(data);
      toast.success('Transação criada com sucesso');

      // Atualizar lista
      setTransactions(prev => [newTransaction, ...prev]);

      return newTransaction;
    } catch (err: any) {
      const errorMessage = err?.response?.data?.detail || 'Erro ao criar transação';
      toast.error(errorMessage);
      return null;
    }
  }, []);

  const updateTransaction = useCallback(async (
    id: number,
    data: CashFlowTransactionUpdate
  ): Promise<CashFlowTransaction | null> => {
    try {
      const updated = await cashFlowService.updateTransaction(id, data);
      toast.success('Transação atualizada com sucesso');

      // Atualizar na lista
      setTransactions(prev =>
        prev.map(item => (item.id === id ? updated : item))
      );

      return updated;
    } catch (err: any) {
      const errorMessage = err?.response?.data?.detail || 'Erro ao atualizar transação';
      toast.error(errorMessage);
      return null;
    }
  }, []);

  const deleteTransaction = useCallback(async (id: number): Promise<boolean> => {
    try {
      await cashFlowService.deleteTransaction(id);
      toast.success('Transação removida com sucesso');

      // Remover da lista
      setTransactions(prev => prev.filter(item => item.id !== id));

      return true;
    } catch (err: any) {
      const errorMessage = err?.response?.data?.detail || 'Erro ao remover transação';
      toast.error(errorMessage);
      return false;
    }
  }, []);

  const reconcileTransaction = useCallback(async (id: number): Promise<CashFlowTransaction | null> => {
    try {
      const updated = await cashFlowService.reconcileTransaction(id);
      toast.success('Transação reconciliada');

      // Atualizar na lista
      setTransactions(prev =>
        prev.map(item => (item.id === id ? updated : item))
      );

      return updated;
    } catch (err: any) {
      const errorMessage = err?.response?.data?.detail || 'Erro ao reconciliar transação';
      toast.error(errorMessage);
      return null;
    }
  }, []);

  // ==================== BANK ACCOUNT ACTIONS ====================

  const loadBankAccounts = useCallback(async (activeOnly: boolean = true) => {
    setLoadingAccounts(true);

    try {
      const data = await cashFlowService.getBankAccounts(activeOnly);
      setBankAccounts(data);
    } catch (err: any) {
      const status = err?.response?.status;
      if (status !== 401 && status !== 404) {
        const errorMessage = err?.response?.data?.detail || 'Erro ao carregar contas bancárias';
        toast.error(errorMessage);
      }
    } finally {
      setLoadingAccounts(false);
    }
  }, []);

  const createBankAccount = useCallback(async (
    data: BankAccountCreate
  ): Promise<BankAccountData | null> => {
    try {
      const newAccount = await cashFlowService.createBankAccount(data);
      toast.success('Conta bancária criada com sucesso');

      // Atualizar lista
      setBankAccounts(prev => [newAccount, ...prev]);

      return newAccount;
    } catch (err: any) {
      const errorMessage = err?.response?.data?.detail || 'Erro ao criar conta bancária';
      toast.error(errorMessage);
      return null;
    }
  }, []);

  const updateBankAccount = useCallback(async (
    id: number,
    data: BankAccountUpdate
  ): Promise<BankAccountData | null> => {
    try {
      const updated = await cashFlowService.updateBankAccount(id, data);
      toast.success('Conta bancária atualizada com sucesso');

      // Atualizar na lista
      setBankAccounts(prev =>
        prev.map(item => (item.id === id ? updated : item))
      );

      return updated;
    } catch (err: any) {
      const errorMessage = err?.response?.data?.detail || 'Erro ao atualizar conta bancária';
      toast.error(errorMessage);
      return null;
    }
  }, []);

  const deleteBankAccount = useCallback(async (id: number): Promise<boolean> => {
    try {
      await cashFlowService.deleteBankAccount(id);
      toast.success('Conta bancária removida com sucesso');

      // Remover da lista
      setBankAccounts(prev => prev.filter(item => item.id !== id));

      return true;
    } catch (err: any) {
      const errorMessage = err?.response?.data?.detail || 'Erro ao remover conta bancária';
      toast.error(errorMessage);
      return false;
    }
  }, []);

  // ==================== TRANSFER ACTIONS ====================

  const createTransfer = useCallback(async (data: TransferRequest): Promise<boolean> => {
    try {
      await cashFlowService.createTransfer(data);
      toast.success('Transferência realizada com sucesso');

      // Recarregar transações e contas
      await Promise.all([
        loadTransactions(currentFilters),
        loadBankAccounts()
      ]);

      return true;
    } catch (err: any) {
      const errorMessage = err?.response?.data?.detail || 'Erro ao criar transferência';
      toast.error(errorMessage);
      return false;
    }
  }, [currentFilters, loadTransactions, loadBankAccounts]);

  // ==================== ANALYTICS ACTIONS ====================

  const loadSummary = useCallback(async (
    startDate: string,
    endDate: string,
    accountId?: number
  ) => {
    setLoadingAnalytics(true);

    try {
      const data = await cashFlowService.getSummary(startDate, endDate, accountId);
      setSummary(data);
    } catch (err: any) {
      const status = err?.response?.status;
      if (status !== 401 && status !== 404) {
        const errorMessage = err?.response?.data?.detail || 'Erro ao carregar resumo';
        toast.error(errorMessage);
      }
    } finally {
      setLoadingAnalytics(false);
    }
  }, []);

  const loadCategoryAnalysis = useCallback(async (
    startDate: string,
    endDate: string,
    accountId?: number
  ) => {
    try {
      const data = await cashFlowService.getByCategory(startDate, endDate, accountId);
      setCategoryAnalysis(data);
    } catch (err: any) {
      const status = err?.response?.status;
      if (status !== 401 && status !== 404) {
        const errorMessage = err?.response?.data?.detail || 'Erro ao carregar análise por categoria';
        toast.error(errorMessage);
      }
    }
  }, []);

  const loadAccountSummary = useCallback(async () => {
    try {
      const data = await cashFlowService.getByAccount();
      setAccountSummary(data);
    } catch (err: any) {
      const status = err?.response?.status;
      if (status !== 401 && status !== 404) {
        const errorMessage = err?.response?.data?.detail || 'Erro ao carregar resumo de contas';
        toast.error(errorMessage);
      }
    }
  }, []);

  const loadBalanceHistory = useCallback(async (
    startDate: string,
    endDate: string,
    accountId?: number
  ) => {
    try {
      const data = await cashFlowService.getBalanceHistory(startDate, endDate, accountId);
      setBalanceHistory(data);
    } catch (err: any) {
      const status = err?.response?.status;
      if (status !== 401 && status !== 404) {
        const errorMessage = err?.response?.data?.detail || 'Erro ao carregar histórico de saldo';
        toast.error(errorMessage);
      }
    }
  }, []);

  const loadProjection = useCallback(async (
    daysAhead: number = 30,
    accountId?: number
  ) => {
    try {
      const data = await cashFlowService.getProjection(daysAhead, accountId);
      setProjection(data);
    } catch (err: any) {
      const status = err?.response?.status;
      if (status !== 401 && status !== 404) {
        const errorMessage = err?.response?.data?.detail || 'Erro ao carregar projeção';
        toast.error(errorMessage);
      }
    }
  }, []);

  const loadCompleteAnalytics = useCallback(async (
    startDate: string,
    endDate: string,
    accountId?: number
  ) => {
    setLoadingAnalytics(true);

    try {
      const data = await cashFlowService.getCompleteAnalytics(startDate, endDate, accountId);
      setCompleteAnalytics(data);
      setSummary(data.summary);
      setCategoryAnalysis(data.by_category);
      setAccountSummary(data.by_account);
      setBalanceHistory(data.balance_history);
    } catch (err: any) {
      // Não exibir erro se for 401 (não autenticado) ou 404 durante carregamento inicial
      const status = err?.response?.status;
      if (status !== 401 && status !== 404) {
        const errorMessage = err?.response?.data?.detail || 'Erro ao carregar analytics completo';
        toast.error(errorMessage);
      }
      console.debug('Analytics loading skipped:', err.message);
    } finally {
      setLoadingAnalytics(false);
    }
  }, []);

  // ==================== UTILITY ====================

  const refreshAll = useCallback(async (
    startDate?: string,
    endDate?: string
  ) => {
    const today = new Date().toISOString().split('T')[0];
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    await Promise.all([
      loadTransactions(currentFilters),
      loadBankAccounts(),
      loadCompleteAnalytics(startDate || thirtyDaysAgo, endDate || today),
      loadProjection(30)
    ]);
  }, [currentFilters, loadTransactions, loadBankAccounts, loadCompleteAnalytics, loadProjection]);

  // Auto-load on mount
  useEffect(() => {
    if (autoLoad) {
      const today = new Date().toISOString().split('T')[0];
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      loadTransactions(initialFilters);
      loadBankAccounts();
      loadCompleteAnalytics(thirtyDaysAgo, today);
      loadProjection(30);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    // Transactions
    transactions,
    loadingTransactions,

    // Bank Accounts
    bankAccounts,
    loadingAccounts,

    // Analytics
    summary,
    categoryAnalysis,
    accountSummary,
    balanceHistory,
    projection,
    completeAnalytics,
    loadingAnalytics,

    // Error
    error,

    // Transaction Actions
    loadTransactions,
    createTransaction,
    updateTransaction,
    deleteTransaction,
    reconcileTransaction,

    // Bank Account Actions
    loadBankAccounts,
    createBankAccount,
    updateBankAccount,
    deleteBankAccount,

    // Transfer Actions
    createTransfer,

    // Analytics Actions
    loadSummary,
    loadCategoryAnalysis,
    loadAccountSummary,
    loadBalanceHistory,
    loadProjection,
    loadCompleteAnalytics,

    // Utility
    refreshAll
  };
}
