import { api } from '@/lib/api';
import { Supplier, SupplierCreate, SupplierUpdate } from '@/types';

export const supplierService = {
  // Listar fornecedores
  async getAll(params?: {
    skip?: number;
    limit?: number;
    active_only?: boolean;
    search?: string;
  }): Promise<Supplier[]> {
    const queryParams = new URLSearchParams();
    if (params?.skip !== undefined) queryParams.append('skip', params.skip.toString());
    if (params?.limit !== undefined) queryParams.append('limit', params.limit.toString());
    if (params?.active_only !== undefined) queryParams.append('active_only', params.active_only.toString());
    if (params?.search) queryParams.append('search', params.search);

    const query = queryParams.toString();
    // WORKAROUND: Adicionar trailing slash para evitar redirect HTTP
    const response = await api.get<Supplier[]>(`/suppliers/${query ? `?${query}` : ''}`);
    return response;
  },

  // Obter fornecedor por ID
  async getById(id: number): Promise<Supplier> {
    const response = await api.get<Supplier>(`/suppliers/${id}`);
    return response;
  },

  // Criar fornecedor
  async create(data: SupplierCreate): Promise<Supplier> {
    const response = await api.post<Supplier>('/suppliers/', data);
    return response;
  },

  // Atualizar fornecedor
  async update(id: number, data: SupplierUpdate): Promise<Supplier> {
    const response = await api.patch<Supplier>(`/suppliers/${id}`, data);
    return response;
  },

  // Deletar fornecedor
  async delete(id: number): Promise<void> {
    await api.delete(`/suppliers/${id}`);
  },
};
