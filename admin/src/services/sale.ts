import { api } from '@/lib/api';
import { Sale, SaleCreate, SaleUpdate } from '@/types';

export const saleService = {
  // Listar vendas
  async getAll(params?: {
    skip?: number;
    limit?: number;
    status_filter?: string;
    product_id?: number;
    start_date?: string;
    end_date?: string;
  }): Promise<Sale[]> {
    const queryParams = new URLSearchParams();
    if (params?.skip !== undefined) queryParams.append('skip', params.skip.toString());
    if (params?.limit !== undefined) queryParams.append('limit', params.limit.toString());
    if (params?.status_filter) queryParams.append('status_filter', params.status_filter);
    if (params?.product_id) queryParams.append('product_id', params.product_id.toString());
    if (params?.start_date) queryParams.append('start_date', params.start_date);
    if (params?.end_date) queryParams.append('end_date', params.end_date);

    const query = queryParams.toString();
    const response = await api.get<Sale[]>(`/sales${query ? `?${query}` : ''}`);
    return response;
  },

  // Obter venda por ID
  async getById(id: number): Promise<Sale> {
    const response = await api.get<Sale>(`/sales/${id}`);
    return response;
  },

  // Criar venda
  async create(data: SaleCreate): Promise<Sale> {
    const response = await api.post<Sale>('/sales/', data);
    return response;
  },

  // Atualizar venda
  async update(id: number, data: SaleUpdate): Promise<Sale> {
    const response = await api.patch<Sale>(`/sales/${id}`, data);
    return response;
  },

  // Deletar venda
  async delete(id: number): Promise<void> {
    await api.delete(`/sales/${id}`);
  },
};
