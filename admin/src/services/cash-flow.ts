import { api } from '@/lib/api';
import {
  CashFlowTransaction,
  CashFlowTransactionCreate,
  CashFlowTransactionUpdate,
  BankAccountData,
  BankAccountCreate,
  BankAccountUpdate,
  TransferRequest,
  TransferResponse,
  CashFlowSummary,
  CategorySummary,
  BalanceHistory,
  CashFlowProjectionData,
  CashFlowAnalytics,
  AccountBalanceSummary,
  CashFlowFilters
} from '@/types/financeiro';

export const cashFlowService = {
  // ==================== TRANSACTIONS ====================

  /**
   * Listar transações de fluxo de caixa com filtros
   */
  async getTransactions(params?: CashFlowFilters): Promise<CashFlowTransaction[]> {
    const queryParams = new URLSearchParams();

    if (params?.skip !== undefined) queryParams.append('skip', params.skip.toString());
    if (params?.limit !== undefined) queryParams.append('limit', params.limit.toString());
    if (params?.start_date) queryParams.append('start_date', params.start_date);
    if (params?.end_date) queryParams.append('end_date', params.end_date);
    if (params?.type) queryParams.append('type', params.type);
    if (params?.category) queryParams.append('category', params.category);
    if (params?.account_id !== undefined) queryParams.append('account_id', params.account_id.toString());
    if (params?.is_reconciled !== undefined) queryParams.append('is_reconciled', params.is_reconciled.toString());
    if (params?.min_value !== undefined) queryParams.append('min_value', params.min_value.toString());
    if (params?.max_value !== undefined) queryParams.append('max_value', params.max_value.toString());

    const query = queryParams.toString();
    const response = await api.get<CashFlowTransaction[]>(
      `/cash-flow/transactions/${query ? `?${query}` : ''}`
    );
    return response;
  },

  /**
   * Obter transação por ID
   */
  async getTransactionById(id: number): Promise<CashFlowTransaction> {
    const response = await api.get<CashFlowTransaction>(`/cash-flow/transactions/${id}`);
    return response;
  },

  /**
   * Criar nova transação
   */
  async createTransaction(data: CashFlowTransactionCreate): Promise<CashFlowTransaction> {
    const response = await api.post<CashFlowTransaction>('/cash-flow/transactions/', data);
    return response;
  },

  /**
   * Atualizar transação
   */
  async updateTransaction(
    id: number,
    data: CashFlowTransactionUpdate
  ): Promise<CashFlowTransaction> {
    const response = await api.patch<CashFlowTransaction>(
      `/cash-flow/transactions/${id}`,
      data
    );
    return response;
  },

  /**
   * Deletar transação
   */
  async deleteTransaction(id: number): Promise<void> {
    await api.delete(`/cash-flow/transactions/${id}`);
  },

  /**
   * Marcar transação como reconciliada
   */
  async reconcileTransaction(id: number): Promise<CashFlowTransaction> {
    const response = await api.post<CashFlowTransaction>(
      `/cash-flow/transactions/${id}/reconcile`,
      {}
    );
    return response;
  },

  // ==================== BANK ACCOUNTS ====================

  /**
   * Listar contas bancárias
   */
  async getBankAccounts(activeOnly: boolean = true): Promise<BankAccountData[]> {
    const queryParams = new URLSearchParams();
    if (activeOnly !== undefined) queryParams.append('active_only', activeOnly.toString());

    const query = queryParams.toString();
    const response = await api.get<BankAccountData[]>(
      `/cash-flow/bank-accounts/${query ? `?${query}` : ''}`
    );
    return response;
  },

  /**
   * Obter conta bancária por ID
   */
  async getBankAccountById(id: number): Promise<BankAccountData> {
    const response = await api.get<BankAccountData>(`/cash-flow/bank-accounts/${id}`);
    return response;
  },

  /**
   * Criar nova conta bancária
   */
  async createBankAccount(data: BankAccountCreate): Promise<BankAccountData> {
    const response = await api.post<BankAccountData>('/cash-flow/bank-accounts/', data);
    return response;
  },

  /**
   * Atualizar conta bancária
   */
  async updateBankAccount(id: number, data: BankAccountUpdate): Promise<BankAccountData> {
    const response = await api.patch<BankAccountData>(`/cash-flow/bank-accounts/${id}`, data);
    return response;
  },

  /**
   * Deletar conta bancária
   */
  async deleteBankAccount(id: number): Promise<void> {
    await api.delete(`/cash-flow/bank-accounts/${id}`);
  },

  // ==================== TRANSFERS ====================

  /**
   * Criar transferência entre contas
   */
  async createTransfer(data: TransferRequest): Promise<TransferResponse> {
    const response = await api.post<TransferResponse>('/cash-flow/transfer', data);
    return response;
  },

  // ==================== ANALYTICS ====================

  /**
   * Obter resumo de fluxo de caixa do período
   */
  async getSummary(
    startDate: string,
    endDate: string,
    accountId?: number
  ): Promise<CashFlowSummary> {
    const queryParams = new URLSearchParams();
    queryParams.append('start_date', startDate);
    queryParams.append('end_date', endDate);
    if (accountId !== undefined) queryParams.append('account_id', accountId.toString());

    const response = await api.get<CashFlowSummary>(
      `/cash-flow/analytics/summary?${queryParams.toString()}`
    );
    return response;
  },

  /**
   * Obter análise por categoria
   */
  async getByCategory(
    startDate: string,
    endDate: string,
    accountId?: number
  ): Promise<CategorySummary[]> {
    const queryParams = new URLSearchParams();
    queryParams.append('start_date', startDate);
    queryParams.append('end_date', endDate);
    if (accountId !== undefined) queryParams.append('account_id', accountId.toString());

    const response = await api.get<CategorySummary[]>(
      `/cash-flow/analytics/by-category?${queryParams.toString()}`
    );
    return response;
  },

  /**
   * Obter resumo por conta bancária
   */
  async getByAccount(): Promise<AccountBalanceSummary[]> {
    const response = await api.get<AccountBalanceSummary[]>(
      '/cash-flow/analytics/by-account'
    );
    return response;
  },

  /**
   * Obter histórico de saldo diário
   */
  async getBalanceHistory(
    startDate: string,
    endDate: string,
    accountId?: number
  ): Promise<BalanceHistory[]> {
    const queryParams = new URLSearchParams();
    queryParams.append('start_date', startDate);
    queryParams.append('end_date', endDate);
    if (accountId !== undefined) queryParams.append('account_id', accountId.toString());

    const response = await api.get<BalanceHistory[]>(
      `/cash-flow/analytics/balance-history?${queryParams.toString()}`
    );
    return response;
  },

  /**
   * Obter projeção de fluxo de caixa
   */
  async getProjection(
    daysAhead: number = 30,
    accountId?: number
  ): Promise<CashFlowProjectionData[]> {
    const queryParams = new URLSearchParams();
    queryParams.append('days_ahead', daysAhead.toString());
    if (accountId !== undefined) queryParams.append('account_id', accountId.toString());

    const response = await api.get<CashFlowProjectionData[]>(
      `/cash-flow/analytics/projection?${queryParams.toString()}`
    );
    return response;
  },

  /**
   * Obter analytics completo
   */
  async getCompleteAnalytics(
    startDate: string,
    endDate: string,
    accountId?: number
  ): Promise<CashFlowAnalytics> {
    const queryParams = new URLSearchParams();
    queryParams.append('start_date', startDate);
    queryParams.append('end_date', endDate);
    if (accountId !== undefined) queryParams.append('account_id', accountId.toString());

    const response = await api.get<CashFlowAnalytics>(
      `/cash-flow/analytics/complete?${queryParams.toString()}`
    );
    return response;
  },

  // ==================== BATCH OPERATIONS ====================

  /**
   * Marcar múltiplas transações como reconciliadas
   */
  async batchReconcile(
    ids: number[]
  ): Promise<{ success: number; failed: number; results: CashFlowTransaction[] }> {
    const response = await api.post<{
      success: number;
      failed: number;
      results: CashFlowTransaction[];
    }>('/cash-flow/transactions/batch/reconcile', { ids });
    return response;
  },

  /**
   * Deletar múltiplas transações
   */
  async batchDelete(ids: number[]): Promise<{ success: number; failed: number }> {
    const response = await api.post<{ success: number; failed: number }>(
      '/cash-flow/transactions/batch/delete',
      { ids }
    );
    return response;
  },

  /**
   * Exportar transações
   */
  async export(
    format: 'csv' | 'xlsx' | 'pdf',
    filters?: CashFlowFilters
  ): Promise<Blob> {
    const queryParams = new URLSearchParams();
    queryParams.append('format', format);

    if (filters?.start_date) queryParams.append('start_date', filters.start_date);
    if (filters?.end_date) queryParams.append('end_date', filters.end_date);
    if (filters?.type) queryParams.append('type', filters.type);
    if (filters?.category) queryParams.append('category', filters.category);
    if (filters?.account_id !== undefined) queryParams.append('account_id', filters.account_id.toString());

    const query = queryParams.toString();
    const response = await api.get<Blob>(
      `/cash-flow/export${query ? `?${query}` : ''}`,
      { responseType: 'blob' }
    );
    return response;
  }
};
