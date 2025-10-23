import { api } from '@/lib/api';
import { Product, ProductCreate, ProductUpdate } from '@/types';

export const productService = {
  // Listar produtos
  async getAll(params?: {
    skip?: number;
    limit?: number;
    active_only?: boolean;
    category?: string;
    search?: string;
    low_stock?: boolean;
  }): Promise<Product[]> {
    const queryParams = new URLSearchParams();
    if (params?.skip !== undefined) queryParams.append('skip', params.skip.toString());
    if (params?.limit !== undefined) queryParams.append('limit', params.limit.toString());
    if (params?.active_only !== undefined) queryParams.append('active_only', params.active_only.toString());
    if (params?.category) queryParams.append('category', params.category);
    if (params?.search) queryParams.append('search', params.search);
    if (params?.low_stock !== undefined) queryParams.append('low_stock', params.low_stock.toString());

    const query = queryParams.toString();
    // WORKAROUND: Adicionar trailing slash para evitar redirect HTTP
    const response = await api.get<Product[]>(`/products/${query ? `?${query}` : ''}`);
    return response;
  },

  // Obter produto por ID
  async getById(id: number): Promise<Product> {
    const response = await api.get<Product>(`/products/${id}`);
    return response;
  },

  // Criar produto
  async create(data: ProductCreate): Promise<Product> {
    const response = await api.post<Product>('/products/', data);
    return response;
  },

  // Atualizar produto
  async update(id: number, data: ProductUpdate): Promise<Product> {
    const response = await api.patch<Product>(`/products/${id}`, data);
    return response;
  },

  // Deletar produto
  async delete(id: number): Promise<void> {
    await api.delete(`/products/${id}`);
  },
};
