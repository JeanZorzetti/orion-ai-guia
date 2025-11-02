/**
 * Inventory Cycle Count Hook - Contagem Cíclica de Estoque
 * Integrado com API real do backend - SEM DADOS MOCK
 */

import { useState, useCallback, useEffect } from 'react';
import { api } from '@/lib/api';

// ============================================================================
// TYPES
// ============================================================================

export interface InventoryCycleCount {
  id: number;
  code: string;
  name: string;
  description: string | null;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  responsible_user_id: number;
  responsible_user_name: string;
  scheduled_date: Date | null;
  started_at: Date | null;
  completed_at: Date | null;
  total_items: number;
  items_counted: number;
  items_with_discrepancy: number;
  notes: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface InventoryCountSummary {
  total_counts: number;
  in_progress: number;
  completed: number;
  total_discrepancies: number;
}

export interface InventoryCountItem {
  id: number;
  product_id: number;
  product_name: string;
  product_code: string;
  expected_quantity: number;
  counted_quantity: number | null;
  final_quantity: number | null;
  discrepancy: number | null;
  status: 'pending' | 'counted' | 'verified' | 'discrepancy';
  counted_by_user_id: number | null;
  counted_by_user_name: string | null;
  counted_at: Date | null;
  notes: string | null;
  discrepancy_reason: string | null;
  adjustment_applied: boolean;
}

export interface CreateInventoryCountRequest {
  name: string;
  description?: string;
  scheduled_date?: Date;
  notes?: string;
  product_ids?: number[];
}

// ============================================================================
// HOOK
// ============================================================================

export const useInventoryCycleCount = () => {
  const [counts, setCounts] = useState<InventoryCycleCount[]>([]);
  const [summary, setSummary] = useState<InventoryCountSummary | null>(null);
  const [selectedCount, setSelectedCount] = useState<InventoryCycleCount | null>(null);
  const [countItems, setCountItems] = useState<InventoryCountItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ============================================================================
  // API FETCH FUNCTIONS
  // ============================================================================

  const fetchCounts = useCallback(async (status?: string) => {
    console.log('🔄 [useInventoryCycleCount] Buscando contagens da API');
    try {
      let url = '/inventory/cycle-counts?limit=100';
      if (status) url += `&status=${status}`;

      const response = await api.get<any[]>(url);

      console.log('✅ [useInventoryCycleCount] Contagens recebidas:', response.length);

      const converted: InventoryCycleCount[] = response.map(c => ({
        id: c.id,
        code: c.code,
        name: c.name,
        description: c.description,
        status: c.status,
        responsible_user_id: c.responsible_user_id,
        responsible_user_name: c.responsible_user_name,
        scheduled_date: c.scheduled_date ? new Date(c.scheduled_date) : null,
        started_at: c.started_at ? new Date(c.started_at) : null,
        completed_at: c.completed_at ? new Date(c.completed_at) : null,
        total_items: c.total_items,
        items_counted: c.items_counted,
        items_with_discrepancy: c.items_with_discrepancy,
        notes: c.notes,
        created_at: new Date(c.created_at),
        updated_at: new Date(c.updated_at),
      }));

      setCounts(converted);
    } catch (err: any) {
      console.error('❌ [useInventoryCycleCount] Erro ao buscar contagens:', err);
      setError(err.message || 'Erro ao buscar contagens');
      setCounts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchSummary = useCallback(async () => {
    console.log('🔄 [useInventoryCycleCount] Buscando resumo');
    try {
      const response = await api.get<any>('/inventory/cycle-counts/summary');

      console.log('✅ [useInventoryCycleCount] Resumo recebido:', response);

      setSummary({
        total_counts: response.total_counts,
        in_progress: response.in_progress,
        completed: response.completed,
        total_discrepancies: response.total_discrepancies,
      });
    } catch (err: any) {
      console.error('❌ [useInventoryCycleCount] Erro ao buscar resumo:', err);
      setSummary(null);
    }
  }, []);

  const fetchCountById = useCallback(async (countId: number) => {
    console.log('🔄 [useInventoryCycleCount] Buscando contagem:', countId);
    try {
      const response = await api.get<any>(`/inventory/cycle-counts/${countId}`);

      console.log('✅ [useInventoryCycleCount] Contagem recebida:', response);

      const count: InventoryCycleCount = {
        id: response.id,
        code: response.code,
        name: response.name,
        description: response.description,
        status: response.status,
        responsible_user_id: response.responsible_user_id,
        responsible_user_name: response.responsible_user_name,
        scheduled_date: response.scheduled_date ? new Date(response.scheduled_date) : null,
        started_at: response.started_at ? new Date(response.started_at) : null,
        completed_at: response.completed_at ? new Date(response.completed_at) : null,
        total_items: response.total_items,
        items_counted: response.items_counted,
        items_with_discrepancy: response.items_with_discrepancy,
        notes: response.notes,
        created_at: new Date(response.created_at),
        updated_at: new Date(response.updated_at),
      };

      setSelectedCount(count);
      return count;
    } catch (err: any) {
      console.error('❌ [useInventoryCycleCount] Erro ao buscar contagem:', err);
      throw err;
    }
  }, []);

  const fetchCountItems = useCallback(async (countId: number, status?: string) => {
    console.log('🔄 [useInventoryCycleCount] Buscando itens da contagem:', countId);
    try {
      let url = `/inventory/cycle-counts/${countId}/items`;
      if (status) url += `?status=${status}`;

      const response = await api.get<any[]>(url);

      console.log('✅ [useInventoryCycleCount] Itens recebidos:', response.length);

      const items: InventoryCountItem[] = response.map(i => ({
        id: i.id,
        product_id: i.product_id,
        product_name: i.product_name,
        product_code: i.product_code,
        expected_quantity: i.expected_quantity,
        counted_quantity: i.counted_quantity,
        final_quantity: i.final_quantity,
        discrepancy: i.discrepancy,
        status: i.status,
        counted_by_user_id: i.counted_by_user_id,
        counted_by_user_name: i.counted_by_user_name,
        counted_at: i.counted_at ? new Date(i.counted_at) : null,
        notes: i.notes,
        discrepancy_reason: i.discrepancy_reason,
        adjustment_applied: i.adjustment_applied,
      }));

      setCountItems(items);
      return items;
    } catch (err: any) {
      console.error('❌ [useInventoryCycleCount] Erro ao buscar itens:', err);
      setCountItems([]);
      throw err;
    }
  }, []);

  // ============================================================================
  // ACTIONS
  // ============================================================================

  const createCount = useCallback(async (request: CreateInventoryCountRequest) => {
    console.log('🔄 [useInventoryCycleCount] Criando contagem:', request);
    try {
      const response = await api.post('/inventory/cycle-counts', request);

      console.log('✅ [useInventoryCycleCount] Contagem criada:', response);

      // Recarregar dados
      await fetchCounts();
      await fetchSummary();

      return { success: true, data: response };
    } catch (err: any) {
      console.error('❌ [useInventoryCycleCount] Erro ao criar contagem:', err);
      throw err;
    }
  }, [fetchCounts, fetchSummary]);

  const startCount = useCallback(async (countId: number) => {
    console.log('🔄 [useInventoryCycleCount] Iniciando contagem:', countId);
    try {
      const response = await api.post(`/inventory/cycle-counts/${countId}/start`, {});

      console.log('✅ [useInventoryCycleCount] Contagem iniciada:', response);

      // Recarregar dados
      await fetchCounts();
      if (selectedCount?.id === countId) {
        await fetchCountById(countId);
      }

      return { success: true };
    } catch (err: any) {
      console.error('❌ [useInventoryCycleCount] Erro ao iniciar contagem:', err);
      throw err;
    }
  }, [fetchCounts, fetchCountById, selectedCount]);

  const completeCount = useCallback(async (countId: number) => {
    console.log('🔄 [useInventoryCycleCount] Finalizando contagem:', countId);
    try {
      const response = await api.post(`/inventory/cycle-counts/${countId}/complete`, {});

      console.log('✅ [useInventoryCycleCount] Contagem finalizada:', response);

      // Recarregar dados
      await fetchCounts();
      await fetchSummary();
      if (selectedCount?.id === countId) {
        await fetchCountById(countId);
      }

      return { success: true, data: response };
    } catch (err: any) {
      console.error('❌ [useInventoryCycleCount] Erro ao finalizar contagem:', err);
      throw err;
    }
  }, [fetchCounts, fetchSummary, fetchCountById, selectedCount]);

  const updateCountItem = useCallback(async (
    itemId: number,
    counted_quantity: number,
    notes?: string
  ) => {
    console.log('🔄 [useInventoryCycleCount] Atualizando item:', itemId);
    try {
      const response = await api.put(`/inventory/count-items/${itemId}/count`, {
        counted_quantity,
        notes,
      });

      console.log('✅ [useInventoryCycleCount] Item atualizado:', response);

      // Recarregar itens se houver contagem selecionada
      if (selectedCount) {
        await fetchCountItems(selectedCount.id);
        await fetchCountById(selectedCount.id);
      }

      return { success: true, data: response };
    } catch (err: any) {
      console.error('❌ [useInventoryCycleCount] Erro ao atualizar item:', err);
      throw err;
    }
  }, [selectedCount, fetchCountItems, fetchCountById]);

  const resolveDiscrepancy = useCallback(async (
    itemId: number,
    final_quantity: number,
    discrepancy_reason: string,
    apply_adjustment: boolean = true
  ) => {
    console.log('🔄 [useInventoryCycleCount] Resolvendo discrepância:', itemId);
    try {
      const response = await api.post(`/inventory/count-items/${itemId}/resolve`, {
        final_quantity,
        discrepancy_reason,
        apply_adjustment,
      });

      console.log('✅ [useInventoryCycleCount] Discrepância resolvida:', response);

      // Recarregar itens se houver contagem selecionada
      if (selectedCount) {
        await fetchCountItems(selectedCount.id);
        await fetchCountById(selectedCount.id);
      }

      return { success: true, data: response };
    } catch (err: any) {
      console.error('❌ [useInventoryCycleCount] Erro ao resolver discrepância:', err);
      throw err;
    }
  }, [selectedCount, fetchCountItems, fetchCountById]);

  const refresh = useCallback(async () => {
    setLoading(true);
    await Promise.all([
      fetchCounts(),
      fetchSummary()
    ]);
  }, [fetchCounts, fetchSummary]);

  // ============================================================================
  // INITIAL LOAD
  // ============================================================================

  useEffect(() => {
    console.log('🔄 [useInventoryCycleCount] Carregamento inicial');
    refresh();
  }, []);

  // ============================================================================
  // RETURN
  // ============================================================================

  return {
    // Data
    counts,
    summary,
    selectedCount,
    countItems,

    // State
    loading,
    error,

    // Actions
    fetchCounts,
    fetchSummary,
    fetchCountById,
    fetchCountItems,
    createCount,
    startCount,
    completeCount,
    updateCountItem,
    resolveDiscrepancy,
    refresh,
  };
};
