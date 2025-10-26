// Tipos de Autenticação
export interface User {
  id: number;
  email: string;
  full_name: string;
  role: string;
  workspace_id: number;
  active: boolean;
  created_at: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  full_name: string;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

// Tipos de Workspace
export interface Workspace {
  id: number;
  name: string;
  slug: string;
  active: boolean;
  created_at: string;
}

// Tipos de Fornecedor
export interface Supplier {
  id: number;
  workspace_id: number;
  name: string;
  document?: string;  // CNPJ/CPF
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SupplierCreate {
  name: string;
  document?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
}

export interface SupplierUpdate {
  name?: string;
  document?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  active?: boolean;
}

// Tipos de Nota Fiscal
export interface Invoice {
  id: number;
  workspace_id: number;
  supplier_id?: number;
  invoice_number: string;
  invoice_date: string;
  due_date?: string;
  total_value: number;
  net_value?: number;
  tax_value?: number;
  category?: string;
  status: 'pending' | 'validated' | 'paid' | 'cancelled';
  description?: string;
  file_path?: string;
  created_at: string;
  updated_at: string;
  supplier?: Supplier;
}

export interface InvoiceCreate {
  invoice_number: string;
  invoice_date: string;
  due_date?: string;
  total_value: number;
  net_value?: number;
  tax_value?: number;
  category?: string;
  description?: string;
  supplier_id?: number;
}

export interface InvoiceUpdate {
  invoice_number?: string;
  invoice_date?: string;
  due_date?: string;
  total_value?: number;
  net_value?: number;
  tax_value?: number;
  category?: string;
  status?: 'pending' | 'validated' | 'paid' | 'cancelled';
  description?: string;
  supplier_id?: number;
}

// Tipos de Produto
export interface Product {
  id: number;
  workspace_id: number;
  name: string;
  sku?: string;
  description?: string;
  category?: string;
  cost_price?: number;
  sale_price: number;
  stock_quantity: number;
  min_stock_level: number;
  unit: string;
  active: boolean;
  created_at: string;
  updated_at: string;
  // Campos Fiscais
  ncm_code?: string;
  cest_code?: string;
  origin?: number;
  fiscal_description?: string;
}

export interface ProductCreate {
  name: string;
  sku?: string;
  description?: string;
  category?: string;
  cost_price?: number;
  sale_price: number;
  stock_quantity?: number;
  min_stock_level?: number;
  unit?: string;
  // Campos Fiscais
  ncm_code?: string;
  cest_code?: string;
  origin?: number;
  fiscal_description?: string;
}

export interface ProductUpdate {
  name?: string;
  sku?: string;
  description?: string;
  category?: string;
  cost_price?: number;
  sale_price?: number;
  stock_quantity?: number;
  min_stock_level?: number;
  unit?: string;
  active?: boolean;
  // Campos Fiscais
  ncm_code?: string;
  cest_code?: string;
  origin?: number;
  fiscal_description?: string;
}

// Tipos de Venda
export interface Sale {
  id: number;
  workspace_id: number;
  product_id: number;
  customer_name: string;
  customer_cpf_cnpj?: string;
  customer_email?: string;
  customer_phone?: string;

  // Endereço do Cliente
  customer_cep?: string;
  customer_logradouro?: string;
  customer_numero?: string;
  customer_complemento?: string;
  customer_bairro?: string;
  customer_cidade?: string;
  customer_uf?: string;
  customer_codigo_municipio?: string;

  quantity: number;
  unit_price: number;
  total_value: number;
  status: 'pending' | 'completed' | 'cancelled';
  sale_date: string;

  // Campos fiscais
  natureza_operacao?: string;
  cfop?: string;
  origin_channel?: string;
  origin_order_id?: string;
  notes?: string;

  created_at: string;
  updated_at: string;
  product?: Product;

  // Campos NF-e
  nfe_status: 'pending' | 'processing' | 'issued' | 'rejected' | 'cancelled';
  nfe_chave?: string;
  nfe_danfe_url?: string;
  nfe_xml_url?: string;
  nfe_rejection_reason?: string;
  nfe_issued_at?: string;
  nfe_cancelled_at?: string;
  nfe_cancellation_reason?: string;
}

export interface SaleCreate {
  product_id: number;
  customer_name: string;
  customer_cpf_cnpj?: string | null;
  customer_email?: string | null;
  customer_phone?: string | null;

  // Endereço do Cliente
  customer_cep?: string | null;
  customer_logradouro?: string | null;
  customer_numero?: string | null;
  customer_complemento?: string | null;
  customer_bairro?: string | null;
  customer_cidade?: string | null;
  customer_uf?: string | null;
  customer_codigo_municipio?: string | null;

  quantity: number;
  unit_price: number;
  total_value: number;
  sale_date: string;

  // Campos fiscais
  natureza_operacao?: string | null;
  cfop?: string | null;
  origin_channel?: string | null;
  origin_order_id?: string | null;
  notes?: string | null;
}

export interface SaleUpdate {
  product_id?: number;
  customer_name?: string;
  customer_cpf_cnpj?: string | null;
  customer_email?: string | null;
  customer_phone?: string | null;

  // Endereço do Cliente
  customer_cep?: string | null;
  customer_logradouro?: string | null;
  customer_numero?: string | null;
  customer_complemento?: string | null;
  customer_bairro?: string | null;
  customer_cidade?: string | null;
  customer_uf?: string | null;
  customer_codigo_municipio?: string | null;

  quantity?: number;
  unit_price?: number;
  total_value?: number;
  status?: 'pending' | 'completed' | 'cancelled';
  sale_date?: string;

  // Campos fiscais
  natureza_operacao?: string | null;
  cfop?: string | null;
  origin_channel?: string | null;
  origin_order_id?: string | null;
  notes?: string | null;
}

// Tipos de API Response
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface ApiError {
  detail: string;
  status?: number;
}

// Tipos de Paginação
export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

// Tipos de Super Admin
export interface WorkspaceAdmin {
  id: number;
  name: string;
  active: boolean;
  created_at: string;
  updated_at: string;
  user_count: number;
}

export interface UserAdmin {
  id: number;
  email: string;
  full_name: string;
  role: string;
  workspace_id: number;
  active: boolean;
  created_at: string;
  updated_at: string;
  workspace_name?: string;
}

export interface SystemStats {
  total_workspaces: number;
  active_workspaces: number;
  total_users: number;
  active_users: number;
  total_invoices: number;
  total_products: number;
}

// Tipos de Extração de Faturas com IA

export interface ConfidenceScores {
  invoice_number: number;
  supplier_name: number;
  total_value: number;
  due_date: number;
  invoice_date: number;
}

export interface SupplierMatch {
  id: number;
  name: string;
  cnpj?: string | null;
  score: number;
  match_reason: string;
  match_type: string;
}

export interface ExtractedData {
  invoice_number: string;
  supplier_name: string;
  supplier_cnpj?: string | null;
  supplier_matches: SupplierMatch[];
  total_value: number;
  tax_value: number;
  net_value: number;
  due_date?: string | null;  // Format: YYYY-MM-DD
  invoice_date?: string | null;  // Format: YYYY-MM-DD
  category?: string | null;
  description?: string | null;
  confidence: ConfidenceScores;
}

export interface ExtractionSuggestions {
  supplier_id?: number | null;  // Top match supplier ID
  needs_review: boolean;  // True if any confidence < 0.8
  warnings: string[];
}

export interface InvoiceExtractionResponse {
  extracted_data: ExtractedData;
  suggestions: ExtractionSuggestions;
  processing_time_ms: number;
  success: boolean;
  error?: string | null;
}

// Tipos de Previsão de Demanda

export interface ProductInfo {
  id: number;
  name: string;
  current_stock: number;
  min_stock_level: number;
}

export interface HistoricalDataPoint {
  period: string;  // Format: YYYY-Www
  units_sold: number;
  date_start: string;  // Format: YYYY-MM-DD
}

export interface ForecastDataPoint {
  period: string;  // Format: YYYY-Www
  predicted_units: number;
  lower_bound: number;
  upper_bound: number;
  confidence: number;  // 0.0-1.0
  date_start: string;  // Format: YYYY-MM-DD
}

export interface ForecastAlert {
  type: string;  // warning, info, error
  severity: string;  // high, medium, low
  message: string;
  action: string;
}

export interface DemandInsights {
  trend: string;  // increasing, stable, decreasing
  trend_percentage: number;
  seasonality_detected: boolean;
  avg_weekly_demand: number;
  recommended_stock_level: number;
  reorder_point: number;
  stock_coverage_weeks: number;
  total_forecast_4weeks: number;
  alerts: ForecastAlert[];
}

export interface ModelInfo {
  model_used: string;
  data_points: number;
  training_period: string;
  mape: number;  // Mean Absolute Percentage Error
  rmse: number;  // Root Mean Square Error
  last_updated: string;
}

export interface DemandForecastResponse {
  success: boolean;
  product?: ProductInfo;
  historical: HistoricalDataPoint[];
  forecast: ForecastDataPoint[];
  insights?: DemandInsights;
  model_info?: ModelInfo;
  error?: string;
  data_points?: number;
}
