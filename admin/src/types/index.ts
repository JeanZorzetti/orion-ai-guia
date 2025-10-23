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
}

// Tipos de Venda
export interface Sale {
  id: number;
  workspace_id: number;
  product_id: number;
  customer_name: string;
  customer_document?: string;
  quantity: number;
  unit_price: number;
  total_value: number;
  status: 'pending' | 'completed' | 'cancelled';
  sale_date: string;
  created_at: string;
  updated_at: string;
  product?: Product;
}

export interface SaleCreate {
  product_id: number;
  customer_name: string;
  customer_document?: string;
  quantity: number;
  unit_price: number;
  total_value: number;
  sale_date: string;
}

export interface SaleUpdate {
  product_id?: number;
  customer_name?: string;
  customer_document?: string;
  quantity?: number;
  unit_price?: number;
  total_value?: number;
  status?: 'pending' | 'completed' | 'cancelled';
  sale_date?: string;
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
