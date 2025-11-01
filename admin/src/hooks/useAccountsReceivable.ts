'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { accountsReceivableService } from '@/services/accounts-receivable';
import {
  AccountsReceivable,
  AccountsReceivableCreate,
  AccountsReceivableUpdate,
  ReceivePaymentRequest,
  ARAnalytics,
  AgingReport,
  CustomerRiskSummary,
  RiskDistribution,
  AccountsReceivableFilters
} from '@/types/financeiro';

interface UseAccountsReceivableReturn {
  // Data
  receivables: AccountsReceivable[];
  analytics: ARAnalytics | null;
  agingReport: AgingReport | null;
  customerRisk: CustomerRiskSummary[];
  riskDistribution: RiskDistribution[];

  // States
  loading: boolean;
  loadingAnalytics: boolean;
  error: string | null;

  // Actions
  loadReceivables: (filters?: AccountsReceivableFilters) => Promise<void>;
  loadAnalytics: (startDate?: string, endDate?: string) => Promise<void>;
  loadCompleteAnalytics: (startDate?: string, endDate?: string) => Promise<void>;
  createReceivable: (data: AccountsReceivableCreate) => Promise<AccountsReceivable | null>;
  updateReceivable: (id: number, data: AccountsReceivableUpdate) => Promise<AccountsReceivable | null>;
  deleteReceivable: (id: number) => Promise<boolean>;
  markAsReceived: (id: number, data: ReceivePaymentRequest) => Promise<AccountsReceivable | null>;
  cancelReceivable: (id: number, reason?: string) => Promise<AccountsReceivable | null>;
  refreshData: () => Promise<void>;
}

export function useAccountsReceivable(
  initialFilters?: AccountsReceivableFilters,
  autoLoad: boolean = true
): UseAccountsReceivableReturn {
  // Data states
  const [receivables, setReceivables] = useState<AccountsReceivable[]>([]);
  const [analytics, setAnalytics] = useState<ARAnalytics | null>(null);
  const [agingReport, setAgingReport] = useState<AgingReport | null>(null);
  const [customerRisk, setCustomerRisk] = useState<CustomerRiskSummary[]>([]);
  const [riskDistribution, setRiskDistribution] = useState<RiskDistribution[]>([]);

  // Loading states
  const [loading, setLoading] = useState(false);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters state
  const [currentFilters, setCurrentFilters] = useState<AccountsReceivableFilters | undefined>(
    initialFilters
  );

  /**
   * Carregar lista de contas a receber
   */
  const loadReceivables = useCallback(async (filters?: AccountsReceivableFilters) => {
    console.log('🔍 [useAccountsReceivable] Carregando receivables com filtros:', filters || currentFilters);
    setLoading(true);
    setError(null);

    try {
      const data = await accountsReceivableService.getAll(filters || currentFilters);
      console.log('✅ [useAccountsReceivable] Receivables carregados:', data);
      setReceivables(data);
      setCurrentFilters(filters || currentFilters);
    } catch (err: any) {
      const errorMessage = err?.response?.data?.detail || 'Erro ao carregar contas a receber';
      console.error('❌ [useAccountsReceivable] Erro ao carregar receivables:', err);
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [currentFilters]);

  /**
   * Carregar analytics básico
   */
  const loadAnalytics = useCallback(async (startDate?: string, endDate?: string) => {
    console.log('🔍 [useAccountsReceivable] Carregando analytics:', { startDate, endDate });
    setLoadingAnalytics(true);

    try {
      const data = await accountsReceivableService.getAnalytics(startDate, endDate);
      console.log('✅ [useAccountsReceivable] Analytics carregado:', data);
      setAnalytics(data);
    } catch (err: any) {
      const errorMessage = err?.response?.data?.detail || 'Erro ao carregar analytics';
      console.error('❌ [useAccountsReceivable] Erro ao carregar analytics:', err);
      toast.error(errorMessage);
    } finally {
      setLoadingAnalytics(false);
    }
  }, []);

  /**
   * Carregar analytics completo (summary + aging + risk)
   */
  const loadCompleteAnalytics = useCallback(async (startDate?: string, endDate?: string) => {
    setLoadingAnalytics(true);

    try {
      // Chamar endpoints separados que realmente existem
      const [analyticsData, agingData] = await Promise.all([
        accountsReceivableService.getAnalytics(startDate, endDate),
        accountsReceivableService.getAgingReport()
      ]);

      setAnalytics(analyticsData);
      setAgingReport(agingData);

      // customer_risk e risk_distribution virão depois se necessário
      setCustomerRisk([]);
      setRiskDistribution([]);
    } catch (err: any) {
      const status = err?.response?.status;
      // Não exibir erro se for 401 ou 404 durante carregamento inicial
      if (status !== 401 && status !== 404) {
        const errorMessage = err?.response?.data?.detail || 'Erro ao carregar analytics completo';
        toast.error(errorMessage);
      }
      console.debug('Analytics loading skipped:', err.message);
    } finally {
      setLoadingAnalytics(false);
    }
  }, []);

  /**
   * Criar nova conta a receber
   */
  const createReceivable = useCallback(async (
    data: AccountsReceivableCreate
  ): Promise<AccountsReceivable | null> => {
    try {
      const newReceivable = await accountsReceivableService.create(data);
      toast.success('Conta a receber criada com sucesso');

      // Atualizar lista
      setReceivables(prev => [newReceivable, ...prev]);

      return newReceivable;
    } catch (err: any) {
      const errorMessage = err?.response?.data?.detail || 'Erro ao criar conta a receber';
      toast.error(errorMessage);
      return null;
    }
  }, []);

  /**
   * Atualizar conta a receber
   */
  const updateReceivable = useCallback(async (
    id: number,
    data: AccountsReceivableUpdate
  ): Promise<AccountsReceivable | null> => {
    try {
      const updated = await accountsReceivableService.update(id, data);
      toast.success('Conta a receber atualizada com sucesso');

      // Atualizar na lista
      setReceivables(prev =>
        prev.map(item => (item.id === id ? updated : item))
      );

      return updated;
    } catch (err: any) {
      const errorMessage = err?.response?.data?.detail || 'Erro ao atualizar conta a receber';
      toast.error(errorMessage);
      return null;
    }
  }, []);

  /**
   * Deletar conta a receber
   */
  const deleteReceivable = useCallback(async (id: number): Promise<boolean> => {
    try {
      await accountsReceivableService.delete(id);
      toast.success('Conta a receber removida com sucesso');

      // Remover da lista
      setReceivables(prev => prev.filter(item => item.id !== id));

      return true;
    } catch (err: any) {
      const errorMessage = err?.response?.data?.detail || 'Erro ao remover conta a receber';
      toast.error(errorMessage);
      return false;
    }
  }, []);

  /**
   * Marcar como recebido (total ou parcial)
   */
  const markAsReceived = useCallback(async (
    id: number,
    data: ReceivePaymentRequest
  ): Promise<AccountsReceivable | null> => {
    try {
      const updated = await accountsReceivableService.markAsReceived(id, data);
      toast.success('Recebimento registrado com sucesso');

      // Atualizar na lista
      setReceivables(prev =>
        prev.map(item => (item.id === id ? updated : item))
      );

      return updated;
    } catch (err: any) {
      const errorMessage = err?.response?.data?.detail || 'Erro ao registrar recebimento';
      toast.error(errorMessage);
      return null;
    }
  }, []);

  /**
   * Cancelar conta a receber
   */
  const cancelReceivable = useCallback(async (
    id: number,
    reason?: string
  ): Promise<AccountsReceivable | null> => {
    try {
      const updated = await accountsReceivableService.cancel(id, reason);
      toast.success('Conta a receber cancelada');

      // Atualizar na lista
      setReceivables(prev =>
        prev.map(item => (item.id === id ? updated : item))
      );

      return updated;
    } catch (err: any) {
      const errorMessage = err?.response?.data?.detail || 'Erro ao cancelar conta a receber';
      toast.error(errorMessage);
      return null;
    }
  }, []);

  /**
   * Recarregar todos os dados
   */
  const refreshData = useCallback(async () => {
    await Promise.all([
      loadReceivables(currentFilters),
      loadCompleteAnalytics()
    ]);
  }, [currentFilters, loadReceivables, loadCompleteAnalytics]);

  // Auto-load on mount
  useEffect(() => {
    if (autoLoad) {
      loadReceivables(initialFilters);
      loadCompleteAnalytics();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    // Data
    receivables,
    analytics,
    agingReport,
    customerRisk,
    riskDistribution,

    // States
    loading,
    loadingAnalytics,
    error,

    // Actions
    loadReceivables,
    loadAnalytics,
    loadCompleteAnalytics,
    createReceivable,
    updateReceivable,
    deleteReceivable,
    markAsReceived,
    cancelReceivable,
    refreshData
  };
}
