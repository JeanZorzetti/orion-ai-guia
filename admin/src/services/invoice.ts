import { api } from '@/lib/api';
import { Invoice, InvoiceCreate, InvoiceUpdate, InvoiceExtractionResponse } from '@/types';

export const invoiceService = {
  // Listar invoices
  async getAll(params?: {
    skip?: number;
    limit?: number;
    status_filter?: string;
    supplier_id?: number;
  }): Promise<Invoice[]> {
    const queryParams = new URLSearchParams();
    if (params?.skip !== undefined) queryParams.append('skip', params.skip.toString());
    if (params?.limit !== undefined) queryParams.append('limit', params.limit.toString());
    if (params?.status_filter) queryParams.append('status_filter', params.status_filter);
    if (params?.supplier_id) queryParams.append('supplier_id', params.supplier_id.toString());

    const query = queryParams.toString();
    // WORKAROUND: Adicionar trailing slash para evitar redirect HTTP
    const response = await api.get<Invoice[]>(`/invoices/${query ? `?${query}` : ''}`);
    return response;
  },

  // Obter invoice por ID
  async getById(id: number): Promise<Invoice> {
    const response = await api.get<Invoice>(`/invoices/${id}`);
    return response;
  },

  // Criar invoice
  async create(data: InvoiceCreate): Promise<Invoice> {
    const response = await api.post<Invoice>('/invoices/', data);
    return response;
  },

  // Atualizar invoice
  async update(id: number, data: InvoiceUpdate): Promise<Invoice> {
    const response = await api.patch<Invoice>(`/invoices/${id}`, data);
    return response;
  },

  // Deletar invoice
  async delete(id: number): Promise<void> {
    await api.delete(`/invoices/${id}`);
  },

  // Upload e extração de fatura com IA
  async uploadAndExtract(file: File): Promise<InvoiceExtractionResponse> {
    const formData = new FormData();
    formData.append('file', file);

    // Usa fetch diretamente para upload de arquivo
    const token = localStorage.getItem('access_token');
    const baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

    const response = await fetch(`${baseURL}/invoices/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Erro ao processar fatura');
    }

    return response.json();
  },
};
