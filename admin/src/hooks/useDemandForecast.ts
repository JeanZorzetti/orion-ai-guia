import { useState, useCallback, useMemo, useEffect } from 'react';
import { api } from '@/lib/api';
import {
  DemandForecast,
  StockOptimization,
  PurchaseSuggestion,
  DemandForecastFilters,
  PurchaseSuggestionFilters,
} from '@/types/inventory';

// ============================================
// API Response Types
// ============================================

interface StockOptimizationAPI {
  id: number;
  product_id: number;
  product_name: string;
  warehouse_id?: number;
  reorder_point: number;
  safety_stock: number;
  optimal_order_quantity: number;
  max_stock_level: number;
  avg_daily_demand: number;
  lead_time_days: number;
  service_level_target: number;
  holding_cost_per_unit?: number;
  ordering_cost?: number;
  stockout_cost_estimate?: number;
  current_stock: number;
  recommended_action: 'order_now' | 'order_soon' | 'sufficient' | 'excess';
  days_until_stockout?: number;
  suggested_order_date?: string;
  updated_at: string;
}

interface PurchaseSuggestionAPI {
  id: number;
  product_id: number;
  product_name: string;
  suggested_quantity: number;
  estimated_cost: number;
  priority: 'urgent' | 'high' | 'medium' | 'low';
  reason: string;
  forecast_demand?: number;
  current_stock: number;
  lead_time_days: number;
  recommended_supplier_id?: number;
  recommended_supplier_name?: string;
  alternative_suppliers?: any[];
  order_by_date: string;
  expected_delivery_date?: string;
  status: 'pending' | 'approved' | 'ordered' | 'dismissed';
  approved_by?: number;
  approved_at?: string;
  dismissed_reason?: string;
  created_at: string;
  updated_at: string;
}

interface OptimizationStatsAPI {
  total_products: number;
  order_now: number;
  order_soon: number;
  excess_stock: number;
  sufficient: number;
}

interface SuggestionStatsAPI {
  total_suggestions: number;
  pending_suggestions: number;
  approved_suggestions: number;
  pending_value: number;
}

// ============================================
// HOOK
// ============================================

interface UseDemandForecastReturn {
  // Data
  forecasts: DemandForecast[];
  filteredForecasts: DemandForecast[];
  optimizations: StockOptimization[];
  filteredOptimizations: StockOptimization[];
  purchaseSuggestions: PurchaseSuggestion[];
  filteredSuggestions: PurchaseSuggestion[];

  // Filters
  forecastFilters: DemandForecastFilters;
  setForecastFilters: (filters: DemandForecastFilters) => void;
  suggestionFilters: PurchaseSuggestionFilters;
  setSuggestionFilters: (filters: PurchaseSuggestionFilters) => void;

  // Actions - Forecasts
  regenerateForecast: (productId: number) => void;
  updateForecastModel: (productId: number, modelType: DemandForecast['model_type']) => void;

  // Actions - Purchase Suggestions
  approveSuggestion: (suggestionId: string, userId: string) => void;
  dismissSuggestion: (suggestionId: string, reason: string) => void;
  markAsOrdered: (suggestionId: string) => void;

  // Stats
  stats: {
    totalForecasts: number;
    avgAccuracy: number;
    criticalProducts: number;
    pendingSuggestions: number;
    suggestionsValue: number;
    productNeedingOrder: number;
  };

  // Loading
  loading: boolean;
  refresh: () => void;
}

export const useDemandForecast = (): UseDemandForecastReturn => {
  const [forecasts, setForecasts] = useState<DemandForecast[]>([]);
  const [optimizations, setOptimizations] = useState<StockOptimization[]>([]);
  const [purchaseSuggestions, setPurchaseSuggestions] = useState<PurchaseSuggestion[]>([]);

  const [forecastFilters, setForecastFilters] = useState<DemandForecastFilters>({});
  const [suggestionFilters, setSuggestionFilters] = useState<PurchaseSuggestionFilters>({});
  const [loading, setLoading] = useState(true);

  const [optimizationStats, setOptimizationStats] = useState<OptimizationStatsAPI>({
    total_products: 0,
    order_now: 0,
    order_soon: 0,
    excess_stock: 0,
    sufficient: 0
  });

  const [suggestionStats, setSuggestionStats] = useState<SuggestionStatsAPI>({
    total_suggestions: 0,
    pending_suggestions: 0,
    approved_suggestions: 0,
    pending_value: 0
  });

  // ============================================
  // FETCH DATA FROM API
  // ============================================

  const fetchOptimizations = useCallback(async () => {
    console.log('🔄 [useDemandForecast] Buscando otimizações da API');
    try {
      const response = await api.get<StockOptimizationAPI[]>('/automation/optimizations');
      console.log('✅ [useDemandForecast] Otimizações recebidas:', response.length);

      const converted: StockOptimization[] = response.map(o => ({
        id: o.id.toString(),
        product_id: o.product_id,
        product_name: o.product_name,
        warehouse_id: o.warehouse_id?.toString(),
        reorder_point: o.reorder_point,
        safety_stock: o.safety_stock,
        optimal_order_quantity: o.optimal_order_quantity,
        max_stock_level: o.max_stock_level,
        avg_daily_demand: o.avg_daily_demand,
        lead_time_days: o.lead_time_days,
        service_level_target: o.service_level_target,
        holding_cost_per_unit: o.holding_cost_per_unit,
        ordering_cost: o.ordering_cost,
        stockout_cost_estimate: o.stockout_cost_estimate,
        current_stock: o.current_stock,
        recommended_action: o.recommended_action,
        days_until_stockout: o.days_until_stockout,
        suggested_order_date: o.suggested_order_date ? new Date(o.suggested_order_date) : undefined,
        updated_at: new Date(o.updated_at)
      }));

      setOptimizations(converted);
    } catch (err) {
      console.error('❌ [useDemandForecast] Erro ao buscar otimizações:', err);
      setOptimizations([]);
    }
  }, []);

  const fetchOptimizationStats = useCallback(async () => {
    try {
      const response = await api.get<OptimizationStatsAPI>('/automation/optimizations/stats');
      console.log('✅ [useDemandForecast] Stats de otimização recebidas:', response);
      setOptimizationStats(response);
    } catch (err) {
      console.error('❌ [useDemandForecast] Erro ao buscar stats de otimização:', err);
    }
  }, []);

  const fetchSuggestions = useCallback(async () => {
    console.log('🔄 [useDemandForecast] Buscando sugestões da API');
    try {
      const response = await api.get<PurchaseSuggestionAPI[]>('/automation/suggestions');
      console.log('✅ [useDemandForecast] Sugestões recebidas:', response.length);

      const converted: PurchaseSuggestion[] = response.map(s => ({
        id: s.id.toString(),
        product_id: s.product_id,
        product_name: s.product_name,
        suggested_quantity: s.suggested_quantity,
        estimated_cost: s.estimated_cost,
        priority: s.priority,
        reason: s.reason,
        forecast_demand: s.forecast_demand,
        current_stock: s.current_stock,
        lead_time_days: s.lead_time_days,
        recommended_supplier_id: s.recommended_supplier_id,
        recommended_supplier_name: s.recommended_supplier_name,
        alternative_suppliers: s.alternative_suppliers,
        order_by_date: new Date(s.order_by_date),
        expected_delivery_date: s.expected_delivery_date ? new Date(s.expected_delivery_date) : undefined,
        status: s.status,
        approved_by: s.approved_by?.toString(),
        approved_at: s.approved_at ? new Date(s.approved_at) : undefined,
        dismissed_reason: s.dismissed_reason,
        created_at: new Date(s.created_at),
        updated_at: new Date(s.updated_at)
      }));

      setPurchaseSuggestions(converted);
    } catch (err) {
      console.error('❌ [useDemandForecast] Erro ao buscar sugestões:', err);
      setPurchaseSuggestions([]);
    }
  }, []);

  const fetchSuggestionStats = useCallback(async () => {
    try {
      const response = await api.get<SuggestionStatsAPI>('/automation/suggestions/stats');
      console.log('✅ [useDemandForecast] Stats de sugestões recebidas:', response);
      setSuggestionStats(response);
    } catch (err) {
      console.error('❌ [useDemandForecast] Erro ao buscar stats de sugestões:', err);
    }
  }, []);

  // Buscar dados ao montar
  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      await Promise.all([
        fetchOptimizations(),
        fetchOptimizationStats(),
        fetchSuggestions(),
        fetchSuggestionStats()
      ]);
      setLoading(false);
    };

    fetchAll();
  }, [fetchOptimizations, fetchOptimizationStats, fetchSuggestions, fetchSuggestionStats]);

  // ============================================
  // COMPUTED DATA
  // ============================================

  const filteredForecasts = useMemo(() => {
    // Forecasts não implementados ainda - retornar vazio
    return [];
  }, []);

  const filteredOptimizations = useMemo(() => {
    let result = [...optimizations];

    if (forecastFilters.product_id) {
      result = result.filter(o => o.product_id === forecastFilters.product_id);
    }

    if (forecastFilters.warehouse_id) {
      result = result.filter(o => o.warehouse_id === forecastFilters.warehouse_id);
    }

    return result;
  }, [optimizations, forecastFilters]);

  const filteredSuggestions = useMemo(() => {
    let result = [...purchaseSuggestions];

    if (suggestionFilters.priority && suggestionFilters.priority.length > 0) {
      result = result.filter(s => suggestionFilters.priority!.includes(s.priority));
    }

    if (suggestionFilters.status && suggestionFilters.status.length > 0) {
      result = result.filter(s => suggestionFilters.status!.includes(s.status));
    }

    if (suggestionFilters.product_id) {
      result = result.filter(s => s.product_id === suggestionFilters.product_id);
    }

    if (suggestionFilters.supplier_id) {
      result = result.filter(s => s.recommended_supplier_id === suggestionFilters.supplier_id);
    }

    if (suggestionFilters.search) {
      const searchLower = suggestionFilters.search.toLowerCase();
      result = result.filter(s =>
        s.product_name.toLowerCase().includes(searchLower) ||
        s.reason.toLowerCase().includes(searchLower) ||
        s.recommended_supplier_name?.toLowerCase().includes(searchLower)
      );
    }

    return result;
  }, [purchaseSuggestions, suggestionFilters]);

  const stats = useMemo(() => {
    return {
      totalForecasts: 0, // Não implementado
      avgAccuracy: 92.5, // Mock - será implementado com ML
      criticalProducts: optimizationStats.order_now,
      pendingSuggestions: suggestionStats.pending_suggestions,
      suggestionsValue: suggestionStats.pending_value,
      productNeedingOrder: optimizationStats.order_now + optimizationStats.order_soon,
    };
  }, [optimizationStats, suggestionStats]);

  // ============================================
  // ACTIONS - FORECASTS (Placeholder - não implementados)
  // ============================================

  const regenerateForecast = useCallback((productId: number) => {
    console.warn('regenerateForecast: Não implementado');
  }, []);

  const updateForecastModel = useCallback((productId: number, modelType: DemandForecast['model_type']) => {
    console.warn('updateForecastModel: Não implementado');
  }, []);

  // ============================================
  // ACTIONS - PURCHASE SUGGESTIONS
  // ============================================

  const approveSuggestion = useCallback((suggestionId: string, userId: string) => {
    // Atualizar localmente
    setPurchaseSuggestions(prev => prev.map(s =>
      s.id === suggestionId ? {
        ...s,
        status: 'approved' as const,
        approved_by: userId,
        approved_at: new Date(),
        updated_at: new Date(),
      } : s
    ));

    // TODO: Chamar API para atualizar no backend
  }, []);

  const dismissSuggestion = useCallback((suggestionId: string, reason: string) => {
    // Atualizar localmente
    setPurchaseSuggestions(prev => prev.map(s =>
      s.id === suggestionId ? {
        ...s,
        status: 'dismissed' as const,
        dismissed_reason: reason,
        updated_at: new Date(),
      } : s
    ));

    // TODO: Chamar API para atualizar no backend
  }, []);

  const markAsOrdered = useCallback((suggestionId: string) => {
    // Atualizar localmente
    setPurchaseSuggestions(prev => prev.map(s =>
      s.id === suggestionId ? {
        ...s,
        status: 'ordered' as const,
        updated_at: new Date(),
      } : s
    ));

    // TODO: Chamar API para atualizar no backend
  }, []);

  // ============================================
  // REFRESH
  // ============================================

  const refresh = useCallback(async () => {
    setLoading(true);
    await Promise.all([
      fetchOptimizations(),
      fetchOptimizationStats(),
      fetchSuggestions(),
      fetchSuggestionStats()
    ]);
    setLoading(false);
  }, [fetchOptimizations, fetchOptimizationStats, fetchSuggestions, fetchSuggestionStats]);

  return {
    // Data
    forecasts,
    filteredForecasts,
    optimizations,
    filteredOptimizations,
    purchaseSuggestions,
    filteredSuggestions,

    // Filters
    forecastFilters,
    setForecastFilters,
    suggestionFilters,
    setSuggestionFilters,

    // Actions - Forecasts
    regenerateForecast,
    updateForecastModel,

    // Actions - Purchase Suggestions
    approveSuggestion,
    dismissSuggestion,
    markAsOrdered,

    // Stats
    stats,

    // Loading
    loading,
    refresh,
  };
};
