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
  cnpj: string;
  email?: string;
  phone?: string;
  address?: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

// Tipos de Nota Fiscal
export interface Invoice {
  id: number;
  workspace_id: number;
  supplier_id: number;
  invoice_number: string;
  issue_date: string;
  due_date?: string;
  total_amount: number;
  status: 'pending' | 'paid' | 'overdue' | 'cancelled';
  file_url?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  supplier?: Supplier;
}

// Tipos de Produto
export interface Product {
  id: number;
  workspace_id: number;
  name: string;
  description?: string;
  sku?: string;
  price: number;
  cost?: number;
  stock_quantity: number;
  unit: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

// Tipos de Venda
export interface Sale {
  id: number;
  workspace_id: number;
  sale_date: string;
  customer_name: string;
  customer_email?: string;
  total_amount: number;
  status: 'pending' | 'completed' | 'cancelled';
  payment_method?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
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
