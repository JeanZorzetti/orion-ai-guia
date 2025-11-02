/**
 * Stock Movements Hook - Movimentações de Estoque
 * Integrado com API real do backend - SEM DADOS MOCK
 */

import { useState, useCallback, useEffect } from 'react';
import { api } from '@/lib/api';

// ============================================================================
// TYPES
// ============================================================================

export interface StockMovement {
  id: number;
  date: Date;
  type: 'in' | 'out' | 'correction';
  product_id: number;
  product_name: string;
  product_code: string;
  quantity: number;
  previous_quantity: number;
  new_quantity: number;
  user_name: string;
  reason: string;
  created_at: Date;
}

export interface StockMovementSummary {
  total_entries: number;
  total_exits: number;
  total_movements: number;
  period_start: Date;
  period_end: Date;
}

export interface CreateMovementRequest {
  product_id: number;
  adjustment_type: 'in' | 'out' | 'correction';
  quantity: number;
  reason: string;
}

// ============================================================================
// HOOK
// ============================================================================

export const useStockMovements = () => {
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [summary, setSummary] = useState<StockMovementSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ============================================================================
  // API FETCH FUNCTIONS
  // ============================================================================

  const fetchMovements = useCallback(async (
    productId?: number,
    movementType?: string,
    startDate?: Date,
    endDate?: Date
  ) => {
    console.log('🔄 [useStockMovements] Buscando movimentações da API');
    try {
      let url = '/stock/movements?limit=100';

      if (productId) url += `&product_id=${productId}`;
      if (movementType) url += `&movement_type=${movementType}`;
      if (startDate) url += `&start_date=${startDate.toISOString()}`;
      if (endDate) url += `&end_date=${endDate.toISOString()}`;

      const response = await api.get<any[]>(url);

      console.log('✅ [useStockMovements] Movimentações recebidas:', response.length);

      const converted: StockMovement[] = response.map(m => ({
        id: m.id,
        date: new Date(m.date),
        type: m.type,
        product_id: m.product_id,
        product_name: m.product_name,
        product_code: m.product_code,
        quantity: m.quantity,
        previous_quantity: m.previous_quantity,
        new_quantity: m.new_quantity,
        user_name: m.user_name,
        reason: m.reason,
        created_at: new Date(m.created_at),
      }));

      setMovements(converted);
    } catch (err: any) {
      console.error('❌ [useStockMovements] Erro ao buscar movimentações:', err);
      setError(err.message || 'Erro ao buscar movimentações');
      setMovements([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchSummary = useCallback(async (startDate?: Date, endDate?: Date) => {
    console.log('🔄 [useStockMovements] Buscando resumo');
    try {
      let url = '/stock/movements/summary';

      if (startDate || endDate) {
        const params = [];
        if (startDate) params.push(`start_date=${startDate.toISOString()}`);
        if (endDate) params.push(`end_date=${endDate.toISOString()}`);
        if (params.length > 0) url += `?${params.join('&')}`;
      }

      const response = await api.get<any>(url);

      console.log('✅ [useStockMovements] Resumo recebido:', response);

      const summaryData: StockMovementSummary = {
        total_entries: response.total_entries,
        total_exits: response.total_exits,
        total_movements: response.total_movements,
        period_start: new Date(response.period_start),
        period_end: new Date(response.period_end),
      };

      setSummary(summaryData);
    } catch (err: any) {
      console.error('❌ [useStockMovements] Erro ao buscar resumo:', err);
      setSummary(null);
    }
  }, []);

  // ============================================================================
  // ACTIONS
  // ============================================================================

  const createMovement = useCallback(async (request: CreateMovementRequest) => {
    console.log('🔄 [useStockMovements] Criando movimentação:', request);
    try {
      const response = await api.post('/stock/movements', request);

      console.log('✅ [useStockMovements] Movimentação criada:', response);

      // Recarregar dados
      await fetchMovements();
      await fetchSummary();

      return { success: true, data: response };
    } catch (err: any) {
      console.error('❌ [useStockMovements] Erro ao criar movimentação:', err);
      throw err;
    }
  }, [fetchMovements, fetchSummary]);

  const refresh = useCallback(async () => {
    setLoading(true);
    await Promise.all([
      fetchMovements(),
      fetchSummary()
    ]);
  }, [fetchMovements, fetchSummary]);

  // ============================================================================
  // INITIAL LOAD
  // ============================================================================

  useEffect(() => {
    console.log('🔄 [useStockMovements] Carregamento inicial');
    refresh();
  }, []);

  // ============================================================================
  // RETURN
  // ============================================================================

  return {
    // Data
    movements,
    summary,

    // State
    loading,
    error,

    // Actions
    fetchMovements,
    fetchSummary,
    createMovement,
    refresh,
  };
};
