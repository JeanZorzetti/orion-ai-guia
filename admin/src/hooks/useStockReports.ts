/**
 * Stock Reports Hook - Relatórios de Estoque
 * Integrado com API real do backend - SEM DADOS MOCK
 */

import { useState, useCallback, useEffect } from 'react';
import { api } from '@/lib/api';

// ============================================================================
// TYPES
// ============================================================================

export interface StockStatistics {
  total_products: number;
  total_stock_value: number;
  products_below_minimum: number;
  products_out_of_stock: number;
}

export interface ProductStockPosition {
  id: number;
  sku: string;
  name: string;
  category: string | null;
  quantity_in_stock: number;
  minimum_stock: number;
  unit_cost: number;
  total_value: number;
  status: 'normal' | 'low' | 'critical' | 'out';
}

export interface StockMovementConsolidated {
  period_start: Date;
  period_end: Date;
  total_entries: number;
  total_exits: number;
  total_corrections: number;
  net_movement: number;
}

export interface ProductBelowMinimum {
  id: number;
  sku: string;
  name: string;
  quantity_in_stock: number;
  minimum_stock: number;
  difference: number;
  unit_cost: number;
  status: 'low' | 'critical';
}

export interface StockTurnoverMetric {
  product_id: number;
  product_sku: string;
  product_name: string;
  stock_quantity: number;
  movements_count: number;
  turnover_rate: number;
  status: 'fast' | 'medium' | 'slow' | 'stopped';
}

export interface StockValueByCategory {
  category: string;
  total_products: number;
  total_quantity: number;
  total_value: number;
  percentage: number;
}

export interface InventoryReportSummary {
  count_id: number;
  code: string;
  name: string;
  date: Date;
  responsible_user_name: string;
  total_items: number;
  items_with_discrepancy: number;
  discrepancy_percentage: number;
}

// ============================================================================
// HOOK
// ============================================================================

export const useStockReports = () => {
  const [statistics, setStatistics] = useState<StockStatistics | null>(null);
  const [stockPosition, setStockPosition] = useState<ProductStockPosition[]>([]);
  const [belowMinimum, setBelowMinimum] = useState<ProductBelowMinimum[]>([]);
  const [turnover, setTurnover] = useState<StockTurnoverMetric[]>([]);
  const [valueByCategory, setValueByCategory] = useState<StockValueByCategory[]>([]);
  const [inventoryReports, setInventoryReports] = useState<InventoryReportSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ============================================================================
  // API FETCH FUNCTIONS
  // ============================================================================

  const fetchStatistics = useCallback(async () => {
    console.log('🔄 [useStockReports] Buscando estatísticas');
    try {
      const response = await api.get<any>('/stock-reports/statistics');

      console.log('✅ [useStockReports] Estatísticas recebidas:', response);

      setStatistics({
        total_products: response.total_products,
        total_stock_value: response.total_stock_value,
        products_below_minimum: response.products_below_minimum,
        products_out_of_stock: response.products_out_of_stock,
      });
    } catch (err: any) {
      console.error('❌ [useStockReports] Erro ao buscar estatísticas:', err);
      setStatistics(null);
    }
  }, []);

  const fetchStockPosition = useCallback(async (
    category?: string,
    status?: string
  ) => {
    console.log('🔄 [useStockReports] Buscando posição de estoque');
    try {
      let url = '/stock-reports/position?limit=500';
      if (category) url += `&category=${category}`;
      if (status) url += `&status=${status}`;

      const response = await api.get<any[]>(url);

      console.log('✅ [useStockReports] Posição recebida:', response.length);

      setStockPosition(response);
    } catch (err: any) {
      console.error('❌ [useStockReports] Erro ao buscar posição:', err);
      setStockPosition([]);
    }
  }, []);

  const fetchBelowMinimum = useCallback(async () => {
    console.log('🔄 [useStockReports] Buscando produtos abaixo do mínimo');
    try {
      const response = await api.get<any[]>('/stock-reports/below-minimum');

      console.log('✅ [useStockReports] Produtos abaixo do mínimo:', response.length);

      setBelowMinimum(response);
    } catch (err: any) {
      console.error('❌ [useStockReports] Erro ao buscar produtos abaixo:', err);
      setBelowMinimum([]);
    }
  }, []);

  const fetchTurnover = useCallback(async (days: number = 30) => {
    console.log('🔄 [useStockReports] Buscando análise de giro');
    try {
      const response = await api.get<any[]>(`/stock-reports/turnover?days=${days}&limit=100`);

      console.log('✅ [useStockReports] Análise de giro:', response.length);

      setTurnover(response);
    } catch (err: any) {
      console.error('❌ [useStockReports] Erro ao buscar giro:', err);
      setTurnover([]);
    }
  }, []);

  const fetchValueByCategory = useCallback(async () => {
    console.log('🔄 [useStockReports] Buscando valor por categoria');
    try {
      const response = await api.get<any[]>('/stock-reports/value-by-category');

      console.log('✅ [useStockReports] Valor por categoria:', response.length);

      setValueByCategory(response);
    } catch (err: any) {
      console.error('❌ [useStockReports] Erro ao buscar valor por categoria:', err);
      setValueByCategory([]);
    }
  }, []);

  const fetchInventoryReports = useCallback(async () => {
    console.log('🔄 [useStockReports] Buscando relatórios de inventário');
    try {
      const response = await api.get<any[]>('/stock-reports/inventory-reports?limit=20');

      console.log('✅ [useStockReports] Relatórios de inventário:', response.length);

      const converted: InventoryReportSummary[] = response.map(r => ({
        count_id: r.count_id,
        code: r.code,
        name: r.name,
        date: new Date(r.date),
        responsible_user_name: r.responsible_user_name,
        total_items: r.total_items,
        items_with_discrepancy: r.items_with_discrepancy,
        discrepancy_percentage: r.discrepancy_percentage,
      }));

      setInventoryReports(converted);
    } catch (err: any) {
      console.error('❌ [useStockReports] Erro ao buscar relatórios:', err);
      setInventoryReports([]);
    }
  }, []);

  const fetchConsolidatedMovements = useCallback(async (
    startDate?: Date,
    endDate?: Date
  ) => {
    console.log('🔄 [useStockReports] Buscando movimentações consolidadas');
    try {
      let url = '/stock-reports/movements/consolidated';
      const params = [];
      if (startDate) params.push(`start_date=${startDate.toISOString()}`);
      if (endDate) params.push(`end_date=${endDate.toISOString()}`);
      if (params.length > 0) url += `?${params.join('&')}`;

      const response = await api.get<any>(url);

      console.log('✅ [useStockReports] Movimentações consolidadas:', response);

      return {
        period_start: new Date(response.period_start),
        period_end: new Date(response.period_end),
        total_entries: response.total_entries,
        total_exits: response.total_exits,
        total_corrections: response.total_corrections,
        net_movement: response.net_movement,
      } as StockMovementConsolidated;
    } catch (err: any) {
      console.error('❌ [useStockReports] Erro ao buscar movimentações:', err);
      throw err;
    }
  }, []);

  // ============================================================================
  // ACTIONS
  // ============================================================================

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await Promise.all([
        fetchStatistics(),
        fetchBelowMinimum(),
        fetchValueByCategory(),
        fetchInventoryReports()
      ]);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar relatórios');
    } finally {
      setLoading(false);
    }
  }, [fetchStatistics, fetchBelowMinimum, fetchValueByCategory, fetchInventoryReports]);

  // ============================================================================
  // INITIAL LOAD
  // ============================================================================

  useEffect(() => {
    console.log('🔄 [useStockReports] Carregamento inicial');
    refresh();
  }, []);

  // ============================================================================
  // RETURN
  // ============================================================================

  return {
    // Data
    statistics,
    stockPosition,
    belowMinimum,
    turnover,
    valueByCategory,
    inventoryReports,

    // State
    loading,
    error,

    // Actions
    fetchStatistics,
    fetchStockPosition,
    fetchBelowMinimum,
    fetchTurnover,
    fetchValueByCategory,
    fetchInventoryReports,
    fetchConsolidatedMovements,
    refresh,
  };
};
