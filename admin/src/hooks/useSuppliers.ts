import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

export interface Supplier {
  id: number;
  workspace_id: number;
  name: string;
  document?: string; // CNPJ/CPF
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

interface UseSuppliersReturn {
  suppliers: Supplier[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  createSupplier: (data: Partial<Supplier>) => Promise<Supplier>;
  updateSupplier: (id: number, data: Partial<Supplier>) => Promise<Supplier>;
  deleteSupplier: (id: number) => Promise<void>;
}

export function useSuppliers(): UseSuppliersReturn {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      setError(null);

      // Buscar todos os fornecedores ativos
      const response = await api.get<Supplier[]>('/suppliers?active=true&limit=1000');
      setSuppliers(response || []);
    } catch (err: any) {
      console.error('Erro ao buscar fornecedores:', err);
      setError(err.message || 'Erro ao buscar fornecedores');
      setSuppliers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const createSupplier = async (data: Partial<Supplier>): Promise<Supplier> => {
    try {
      const response = await api.post<Supplier>('/suppliers', data);
      await fetchSuppliers(); // Recarregar lista
      return response;
    } catch (err: any) {
      console.error('Erro ao criar fornecedor:', err);
      throw new Error(err.response?.data?.detail || 'Erro ao criar fornecedor');
    }
  };

  const updateSupplier = async (id: number, data: Partial<Supplier>): Promise<Supplier> => {
    try {
      const response = await api.put<Supplier>(`/suppliers/${id}`, data);
      await fetchSuppliers(); // Recarregar lista
      return response;
    } catch (err: any) {
      console.error('Erro ao atualizar fornecedor:', err);
      throw new Error(err.response?.data?.detail || 'Erro ao atualizar fornecedor');
    }
  };

  const deleteSupplier = async (id: number): Promise<void> => {
    try {
      await api.delete(`/suppliers/${id}`);
      await fetchSuppliers(); // Recarregar lista
    } catch (err: any) {
      console.error('Erro ao deletar fornecedor:', err);
      throw new Error(err.response?.data?.detail || 'Erro ao deletar fornecedor');
    }
  };

  return {
    suppliers,
    loading,
    error,
    refetch: fetchSuppliers,
    createSupplier,
    updateSupplier,
    deleteSupplier,
  };
}
