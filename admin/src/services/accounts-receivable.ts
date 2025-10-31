import { api } from '@/lib/api';
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

export const accountsReceivableService = {
  // ==================== CRUD OPERATIONS ====================

  /**
   * Listar todas as contas a receber com filtros opcionais
   */
  async getAll(params?: AccountsReceivableFilters): Promise<AccountsReceivable[]> {
    const queryParams = new URLSearchParams();

    if (params?.skip !== undefined) queryParams.append('skip', params.skip.toString());
    if (params?.limit !== undefined) queryParams.append('limit', params.limit.toString());
    if (params?.status) queryParams.append('status', params.status);
    if (params?.customer_id !== undefined) queryParams.append('customer_id', params.customer_id.toString());
    if (params?.start_date) queryParams.append('start_date', params.start_date);
    if (params?.end_date) queryParams.append('end_date', params.end_date);
    if (params?.risk_category) queryParams.append('risk_category', params.risk_category);
    if (params?.overdue_only !== undefined) queryParams.append('overdue_only', params.overdue_only.toString());

    const query = queryParams.toString();
    const response = await api.get<AccountsReceivable[]>(
      `/accounts-receivable/${query ? `?${query}` : ''}`
    );
    return response;
  },

  /**
   * Obter conta a receber por ID
   */
  async getById(id: number): Promise<AccountsReceivable> {
    const response = await api.get<AccountsReceivable>(`/accounts-receivable/${id}`);
    return response;
  },

  /**
   * Criar nova conta a receber
   */
  async create(data: AccountsReceivableCreate): Promise<AccountsReceivable> {
    const response = await api.post<AccountsReceivable>('/accounts-receivable/', data);
    return response;
  },

  /**
   * Atualizar conta a receber
   */
  async update(id: number, data: AccountsReceivableUpdate): Promise<AccountsReceivable> {
    const response = await api.patch<AccountsReceivable>(`/accounts-receivable/${id}`, data);
    return response;
  },

  /**
   * Deletar conta a receber
   */
  async delete(id: number): Promise<void> {
    await api.delete(`/accounts-receivable/${id}`);
  },

  // ==================== PAYMENT OPERATIONS ====================

  /**
   * Registrar recebimento (total ou parcial)
   */
  async markAsReceived(id: number, data: ReceivePaymentRequest): Promise<AccountsReceivable> {
    const response = await api.post<AccountsReceivable>(
      `/accounts-receivable/${id}/receive`,
      data
    );
    return response;
  },

  /**
   * Cancelar conta a receber
   */
  async cancel(id: number, reason?: string): Promise<AccountsReceivable> {
    const response = await api.post<AccountsReceivable>(
      `/accounts-receivable/${id}/cancel`,
      { reason }
    );
    return response;
  },

  // ==================== ANALYTICS ====================

  /**
   * Obter resumo analítico de contas a receber
   */
  async getAnalytics(
    startDate?: string,
    endDate?: string
  ): Promise<ARAnalytics> {
    const queryParams = new URLSearchParams();
    if (startDate) queryParams.append('start_date', startDate);
    if (endDate) queryParams.append('end_date', endDate);

    const query = queryParams.toString();
    const response = await api.get<ARAnalytics>(
      `/accounts-receivable/analytics/summary${query ? `?${query}` : ''}`
    );
    return response;
  },

  /**
   * Obter relatório de aging (vencimentos por faixa)
   */
  async getAgingReport(): Promise<AgingReport> {
    const response = await api.get<AgingReport>('/accounts-receivable/analytics/aging');
    return response;
  },

  /**
   * Obter análise de risco por cliente
   */
  async getCustomerRisk(): Promise<CustomerRiskSummary[]> {
    const response = await api.get<CustomerRiskSummary[]>(
      '/accounts-receivable/analytics/customer-risk'
    );
    return response;
  },

  /**
   * Obter distribuição por categoria de risco
   */
  async getRiskDistribution(): Promise<RiskDistribution[]> {
    const response = await api.get<RiskDistribution[]>(
      '/accounts-receivable/analytics/risk-distribution'
    );
    return response;
  },

  /**
   * Obter analytics completo
   */
  async getCompleteAnalytics(
    startDate?: string,
    endDate?: string
  ): Promise<{
    summary: ARAnalytics;
    aging: AgingReport;
    customer_risk: CustomerRiskSummary[];
    risk_distribution: RiskDistribution[];
  }> {
    const queryParams = new URLSearchParams();
    if (startDate) queryParams.append('start_date', startDate);
    if (endDate) queryParams.append('end_date', endDate);

    const query = queryParams.toString();
    const response = await api.get<{
      summary: ARAnalytics;
      aging: AgingReport;
      customer_risk: CustomerRiskSummary[];
      risk_distribution: RiskDistribution[];
    }>(`/accounts-receivable/analytics/complete${query ? `?${query}` : ''}`);
    return response;
  },

  // ==================== BATCH OPERATIONS ====================

  /**
   * Marcar múltiplas contas como recebidas
   */
  async batchReceive(
    ids: number[],
    data: ReceivePaymentRequest
  ): Promise<{ success: number; failed: number; results: AccountsReceivable[] }> {
    const response = await api.post<{
      success: number;
      failed: number;
      results: AccountsReceivable[];
    }>('/accounts-receivable/batch/receive', {
      ids,
      ...data
    });
    return response;
  },

  /**
   * Exportar contas a receber
   */
  async export(
    format: 'csv' | 'xlsx' | 'pdf',
    filters?: AccountsReceivableFilters
  ): Promise<Blob> {
    const queryParams = new URLSearchParams();
    queryParams.append('format', format);

    if (filters?.status) queryParams.append('status', filters.status);
    if (filters?.customer_id !== undefined) queryParams.append('customer_id', filters.customer_id.toString());
    if (filters?.start_date) queryParams.append('start_date', filters.start_date);
    if (filters?.end_date) queryParams.append('end_date', filters.end_date);

    const query = queryParams.toString();
    const response = await api.get<Blob>(
      `/accounts-receivable/export${query ? `?${query}` : ''}`,
      { responseType: 'blob' }
    );
    return response;
  }
};
