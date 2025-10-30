import { useState, useCallback, useMemo } from 'react';
import {
  DemandForecast,
  StockOptimization,
  PurchaseSuggestion,
  DemandForecastFilters,
  PurchaseSuggestionFilters,
} from '@/types/inventory';
import { addDays, addWeeks, addMonths, startOfDay } from 'date-fns';

// ============================================
// MOCK DATA GENERATORS
// ============================================

const generateMockForecasts = (): DemandForecast[] => {
  const forecasts: DemandForecast[] = [];
  const hoje = new Date();

  for (let productId = 1; productId <= 20; productId++) {
    // Gerar previsões para os próximos 3 meses
    for (let week = 1; week <= 12; week++) {
      const baselineDemand = 50 + Math.random() * 100;
      const seasonality = Math.sin((week / 52) * 2 * Math.PI) * 20; // Sazonalidade anual
      const trend = week * 2; // Tendência crescente
      const noise = (Math.random() - 0.5) * 10;

      const predictedDemand = Math.max(0, baselineDemand + seasonality + trend + noise);
      const confidence = 85 + Math.random() * 10;

      forecasts.push({
        id: `forecast-${productId}-${week}`,
        product_id: productId,
        product_name: `Produto ${productId}`,
        warehouse_id: Math.random() > 0.5 ? 'warehouse-1' : undefined,
        forecast_date: addWeeks(hoje, week),
        forecast_period: 'week',
        predicted_demand: Math.round(predictedDemand),
        confidence_interval: {
          lower: Math.round(predictedDemand * 0.85),
          upper: Math.round(predictedDemand * 1.15),
          confidence_level: 95,
        },
        factors: {
          historical_sales: baselineDemand,
          seasonality_impact: seasonality,
          trend_direction: trend > 0 ? 'increasing' : trend < 0 ? 'decreasing' : 'stable',
          external_events: week % 4 === 0 ? ['Campanha de Marketing'] : undefined,
          weather_impact: Math.random() * 5,
          economic_indicators: Math.random() * 3,
        },
        model_type: ['arima', 'exponential_smoothing', 'prophet', 'ml_ensemble'][Math.floor(Math.random() * 4)] as any,
        accuracy_score: confidence,
        generated_at: hoje,
      });
    }
  }

  return forecasts;
};

const generateMockOptimizations = (): StockOptimization[] => {
  const optimizations: StockOptimization[] = [];
  const hoje = new Date();

  for (let productId = 1; productId <= 20; productId++) {
    const avgDailyDemand = 5 + Math.random() * 20;
    const leadTime = 3 + Math.floor(Math.random() * 10);
    const currentStock = Math.floor(Math.random() * 200);

    const safetyStock = Math.ceil(avgDailyDemand * leadTime * 0.5); // 50% extra
    const reorderPoint = Math.ceil(avgDailyDemand * leadTime + safetyStock);
    const optimalOrderQty = Math.ceil(Math.sqrt((2 * avgDailyDemand * 365 * 100) / 5)); // EOQ simplificado
    const maxStockLevel = reorderPoint + optimalOrderQty;

    const daysUntilStockout = currentStock > 0 ? Math.floor(currentStock / avgDailyDemand) : 0;

    let recommendedAction: StockOptimization['recommended_action'];
    if (currentStock < reorderPoint * 0.5) {
      recommendedAction = 'order_now';
    } else if (currentStock < reorderPoint) {
      recommendedAction = 'order_soon';
    } else if (currentStock > maxStockLevel * 1.2) {
      recommendedAction = 'excess';
    } else {
      recommendedAction = 'sufficient';
    }

    optimizations.push({
      id: `opt-${productId}`,
      product_id: productId,
      product_name: `Produto ${productId}`,
      warehouse_id: Math.random() > 0.5 ? 'warehouse-1' : undefined,
      reorder_point: reorderPoint,
      safety_stock: safetyStock,
      optimal_order_quantity: optimalOrderQty,
      max_stock_level: maxStockLevel,
      avg_daily_demand: avgDailyDemand,
      lead_time_days: leadTime,
      service_level_target: 95,
      holding_cost_per_unit: 5,
      ordering_cost: 100,
      stockout_cost_estimate: 50,
      current_stock: currentStock,
      recommended_action: recommendedAction,
      days_until_stockout: daysUntilStockout > 0 ? daysUntilStockout : undefined,
      suggested_order_date: recommendedAction === 'order_now' ? hoje :
                           recommendedAction === 'order_soon' ? addDays(hoje, 3) : undefined,
      updated_at: hoje,
    });
  }

  return optimizations;
};

const generateMockPurchaseSuggestions = (optimizations: StockOptimization[]): PurchaseSuggestion[] => {
  const suggestions: PurchaseSuggestion[] = [];
  const hoje = new Date();

  optimizations
    .filter(opt => opt.recommended_action === 'order_now' || opt.recommended_action === 'order_soon')
    .forEach((opt, index) => {
      const priority: PurchaseSuggestion['priority'] =
        opt.recommended_action === 'order_now' && (opt.days_until_stockout || 0) < 3 ? 'urgent' :
        opt.recommended_action === 'order_now' ? 'high' :
        opt.recommended_action === 'order_soon' ? 'medium' : 'low';

      suggestions.push({
        id: `suggestion-${index + 1}`,
        product_id: opt.product_id,
        product_name: opt.product_name,
        suggested_quantity: opt.optimal_order_quantity,
        estimated_cost: opt.optimal_order_quantity * (20 + Math.random() * 30),
        priority,
        reason: opt.days_until_stockout && opt.days_until_stockout < 7
          ? `Estoque crítico - ${opt.days_until_stockout} dias até ruptura`
          : 'Estoque abaixo do ponto de pedido',
        forecast_demand: Math.round(opt.avg_daily_demand * 30),
        current_stock: opt.current_stock,
        lead_time_days: opt.lead_time_days,
        recommended_supplier_id: Math.floor(Math.random() * 5) + 1,
        recommended_supplier_name: `Fornecedor ${Math.floor(Math.random() * 5) + 1}`,
        alternative_suppliers: [
          {
            id: Math.floor(Math.random() * 10) + 10,
            name: `Fornecedor Alt ${Math.floor(Math.random() * 3) + 1}`,
            price: 20 + Math.random() * 30,
            lead_time: opt.lead_time_days + Math.floor(Math.random() * 5),
          },
        ],
        order_by_date: opt.suggested_order_date || addDays(hoje, 1),
        expected_delivery_date: addDays(opt.suggested_order_date || hoje, opt.lead_time_days),
        status: Math.random() > 0.7 ? 'approved' : 'pending',
        created_at: addDays(hoje, -Math.random() * 5),
        updated_at: hoje,
      });
    });

  return suggestions.sort((a, b) => {
    const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });
};

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
  const [forecasts, setForecasts] = useState<DemandForecast[]>(generateMockForecasts);
  const [optimizations, setOptimizations] = useState<StockOptimization[]>(generateMockOptimizations);
  const [purchaseSuggestions, setPurchaseSuggestions] = useState<PurchaseSuggestion[]>(() =>
    generateMockPurchaseSuggestions(generateMockOptimizations())
  );

  const [forecastFilters, setForecastFilters] = useState<DemandForecastFilters>({});
  const [suggestionFilters, setSuggestionFilters] = useState<PurchaseSuggestionFilters>({});
  const [loading, setLoading] = useState(false);

  // ============================================
  // COMPUTED DATA
  // ============================================

  const filteredForecasts = useMemo(() => {
    let result = [...forecasts];

    if (forecastFilters.product_id) {
      result = result.filter(f => f.product_id === forecastFilters.product_id);
    }

    if (forecastFilters.warehouse_id) {
      result = result.filter(f => f.warehouse_id === forecastFilters.warehouse_id);
    }

    if (forecastFilters.forecast_period) {
      result = result.filter(f => f.forecast_period === forecastFilters.forecast_period);
    }

    if (forecastFilters.model_type) {
      result = result.filter(f => f.model_type === forecastFilters.model_type);
    }

    if (forecastFilters.min_accuracy) {
      result = result.filter(f => f.accuracy_score >= (forecastFilters.min_accuracy || 0));
    }

    if (forecastFilters.date_from) {
      result = result.filter(f => new Date(f.forecast_date) >= forecastFilters.date_from!);
    }

    if (forecastFilters.date_to) {
      result = result.filter(f => new Date(f.forecast_date) <= forecastFilters.date_to!);
    }

    return result;
  }, [forecasts, forecastFilters]);

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
    const avgAccuracy = forecasts.length > 0
      ? forecasts.reduce((sum, f) => sum + f.accuracy_score, 0) / forecasts.length
      : 0;

    const criticalProducts = optimizations.filter(o => o.recommended_action === 'order_now').length;
    const pendingSuggestions = purchaseSuggestions.filter(s => s.status === 'pending').length;
    const suggestionsValue = purchaseSuggestions
      .filter(s => s.status === 'pending')
      .reduce((sum, s) => sum + s.estimated_cost, 0);
    const productNeedingOrder = optimizations.filter(o =>
      o.recommended_action === 'order_now' || o.recommended_action === 'order_soon'
    ).length;

    return {
      totalForecasts: forecasts.length,
      avgAccuracy,
      criticalProducts,
      pendingSuggestions,
      suggestionsValue,
      productNeedingOrder,
    };
  }, [forecasts, optimizations, purchaseSuggestions]);

  // ============================================
  // ACTIONS - FORECASTS
  // ============================================

  const regenerateForecast = useCallback((productId: number) => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      // In real app, would call ML service
      console.log(`Regenerating forecast for product ${productId}`);
      setLoading(false);
    }, 1000);
  }, []);

  const updateForecastModel = useCallback((productId: number, modelType: DemandForecast['model_type']) => {
    setForecasts(prev => prev.map(f =>
      f.product_id === productId ? { ...f, model_type: modelType, generated_at: new Date() } : f
    ));
  }, []);

  // ============================================
  // ACTIONS - PURCHASE SUGGESTIONS
  // ============================================

  const approveSuggestion = useCallback((suggestionId: string, userId: string) => {
    setPurchaseSuggestions(prev => prev.map(s =>
      s.id === suggestionId ? {
        ...s,
        status: 'approved',
        approved_by: userId,
        approved_at: new Date(),
        updated_at: new Date(),
      } : s
    ));
  }, []);

  const dismissSuggestion = useCallback((suggestionId: string, reason: string) => {
    setPurchaseSuggestions(prev => prev.map(s =>
      s.id === suggestionId ? {
        ...s,
        status: 'dismissed',
        dismissed_reason: reason,
        updated_at: new Date(),
      } : s
    ));
  }, []);

  const markAsOrdered = useCallback((suggestionId: string) => {
    setPurchaseSuggestions(prev => prev.map(s =>
      s.id === suggestionId ? {
        ...s,
        status: 'ordered',
        updated_at: new Date(),
      } : s
    ));
  }, []);

  // ============================================
  // REFRESH
  // ============================================

  const refresh = useCallback(() => {
    setLoading(true);
    setTimeout(() => {
      setForecasts(generateMockForecasts());
      const newOpt = generateMockOptimizations();
      setOptimizations(newOpt);
      setPurchaseSuggestions(generateMockPurchaseSuggestions(newOpt));
      setLoading(false);
    }, 500);
  }, []);

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
