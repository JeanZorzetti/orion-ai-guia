/**
 * Tipos TypeScript para módulo Financeiro
 * Corresponde aos modelos backend do sistema ERP
 */

// ==================== CONTAS A RECEBER ====================

export type AccountsReceivableStatus =
  | 'pendente'
  | 'parcial'
  | 'recebido'
  | 'vencido'
  | 'cancelado';

export type RiskCategory =
  | 'excelente'
  | 'bom'
  | 'regular'
  | 'ruim'
  | 'critico';

export interface AccountsReceivable {
  id: number;
  workspace_id: number;
  document_number: string;
  customer_id: number;
  customer_name?: string;
  issue_date: string;
  due_date: string;
  value: number;
  paid_value: number;
  status: AccountsReceivableStatus;
  description?: string;
  payment_method?: string;
  reference_type?: string;
  reference_id?: number;
  tags?: Record<string, any>;
  risk_category?: RiskCategory;
  days_overdue: number;
  payment_date?: string;
  notes?: string;
  created_by?: number;
  created_at: string;
  updated_at: string;
}

export interface AccountsReceivableCreate {
  document_number: string;
  customer_id: number;
  issue_date: string;
  due_date: string;
  value: number;
  description?: string;
  payment_method?: string;
  reference_type?: string;
  reference_id?: number;
  tags?: Record<string, any>;
  notes?: string;
}

export interface AccountsReceivableUpdate {
  document_number?: string;
  customer_id?: number;
  issue_date?: string;
  due_date?: string;
  value?: number;
  description?: string;
  payment_method?: string;
  tags?: Record<string, any>;
  notes?: string;
}

export interface ReceivePaymentRequest {
  paid_value: number;
  payment_date: string;
  payment_method?: string;
  notes?: string;
}

// ==================== ANALYTICS - CONTAS A RECEBER ====================

export interface ARAnalytics {
  total_to_receive: number;
  overdue_amount: number;
  overdue_count: number;
  received_this_month: number;
  avg_days_to_receive: number;
  default_rate: number;
}

export interface AgingBucket {
  range: string;
  count: number;
  total_value: number;
  percentage: number;
}

export interface AgingReport {
  report_date: string;
  total_receivables: number;
  buckets: AgingBucket[];
}

export interface CustomerRiskSummary {
  customer_id: number;
  customer_name: string;
  total_overdue: number;
  overdue_count: number;
  avg_days_overdue: number;
  risk_category: RiskCategory;
}

export interface RiskDistribution {
  risk_category: RiskCategory;
  count: number;
  total_value: number;
  percentage: number;
}

// ==================== FLUXO DE CAIXA ====================

export type TransactionType = 'entrada' | 'saida';

export type PaymentMethod =
  | 'dinheiro'
  | 'pix'
  | 'ted'
  | 'cartao_credito'
  | 'cartao_debito'
  | 'boleto'
  | 'cheque'
  | 'outro';

export type ReferenceType =
  | 'invoice'
  | 'sale'
  | 'expense'
  | 'transfer'
  | 'receivable'
  | 'payable'
  | 'other';

export type AccountType =
  | 'corrente'
  | 'poupanca'
  | 'investimento'
  | 'caixa';

export interface CashFlowTransaction {
  id: number;
  workspace_id: number;
  transaction_date: string;
  type: TransactionType;
  category: string;
  subcategory?: string;
  description: string;
  value: number;
  payment_method?: PaymentMethod;
  account_id?: number;
  account_name?: string;
  reference_type?: ReferenceType;
  reference_id?: number;
  parent_transaction_id?: number;
  tags?: Record<string, any>;
  is_recurring: boolean;
  recurrence_rule?: Record<string, any>;
  is_reconciled: boolean;
  reconciliation_date?: string;
  created_by?: number;
  created_at: string;
  updated_at: string;
}

export interface CashFlowTransactionCreate {
  transaction_date: string;
  type: TransactionType;
  category: string;
  subcategory?: string;
  description: string;
  value: number;
  payment_method?: PaymentMethod;
  account_id?: number;
  reference_type?: ReferenceType;
  reference_id?: number;
  tags?: Record<string, any>;
  is_recurring?: boolean;
  recurrence_rule?: Record<string, any>;
}

export interface CashFlowTransactionUpdate {
  transaction_date?: string;
  type?: TransactionType;
  category?: string;
  subcategory?: string;
  description?: string;
  value?: number;
  payment_method?: PaymentMethod;
  account_id?: number;
  tags?: Record<string, any>;
  is_recurring?: boolean;
  recurrence_rule?: Record<string, any>;
}

export interface BankAccountData {
  id: number;
  workspace_id: number;
  bank_name: string;
  account_type: AccountType;
  account_number?: string;
  agency?: string;
  pix_key?: string;
  current_balance: number;
  initial_balance: number;
  is_active: boolean;
  is_main: boolean;
  notes?: string;
  created_by?: number;
  created_at: string;
  updated_at: string;
}

export interface BankAccountCreate {
  bank_name: string;
  account_type: AccountType;
  account_number?: string;
  agency?: string;
  pix_key?: string;
  initial_balance?: number;
  is_main?: boolean;
  notes?: string;
}

export interface BankAccountUpdate {
  bank_name?: string;
  account_type?: AccountType;
  account_number?: string;
  agency?: string;
  pix_key?: string;
  is_active?: boolean;
  is_main?: boolean;
  notes?: string;
}

export interface TransferRequest {
  from_account_id: number;
  to_account_id: number;
  value: number;
  transaction_date: string;
  description?: string;
}

export interface TransferResponse {
  from_transaction: CashFlowTransaction;
  to_transaction: CashFlowTransaction;
}

// ==================== ANALYTICS - FLUXO DE CAIXA ====================

export interface CashFlowSummary {
  period_start: string;
  period_end: string;
  total_entries: number;
  total_exits: number;
  net_flow: number;
  opening_balance: number;
  closing_balance: number;
  avg_daily_entry: number;
  avg_daily_exit: number;
  transaction_count: number;
}

export interface CategorySummary {
  category: string;
  type: TransactionType;
  total: number;
  count: number;
  percentage: number;
  avg_transaction: number;
}

export interface BalanceHistory {
  date: string;
  balance: number;
  entries: number;
  exits: number;
  net_flow: number;
}

export interface CashFlowProjectionData {
  projection_date: string;
  projected_balance: number;
  projected_entries: number;
  projected_exits: number;
  confidence_level: number;
}

export interface CashFlowAnalytics {
  summary: CashFlowSummary;
  by_category: CategorySummary[];
  by_account: Array<{
    account_id: number;
    account_name: string;
    balance: number;
    total_entries: number;
    total_exits: number;
    transaction_count: number;
  }>;
  balance_history: BalanceHistory[];
  burn_rate?: number;
  runway_months?: number;
  health_score: number;
}

export interface AccountBalanceSummary {
  account_id: number;
  account_name: string;
  account_type: AccountType;
  current_balance: number;
  total_entries: number;
  total_exits: number;
  transaction_count: number;
  last_transaction_date?: string;
}

// ==================== FILTROS ====================

export interface CashFlowFilters {
  start_date?: string;
  end_date?: string;
  type?: TransactionType;
  category?: string;
  account_id?: number;
  is_reconciled?: boolean;
  min_value?: number;
  max_value?: number;
  skip?: number;
  limit?: number;
}

export interface AccountsReceivableFilters {
  status?: AccountsReceivableStatus;
  customer_id?: number;
  start_date?: string;
  end_date?: string;
  risk_category?: RiskCategory;
  overdue_only?: boolean;
  skip?: number;
  limit?: number;
}
