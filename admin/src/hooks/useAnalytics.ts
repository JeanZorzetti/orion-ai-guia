/**
 * Analytics Hook - Executive Dashboard and Business Intelligence
 * Integrated with real backend API - NO MOCK DATA
 */

import { useState, useCallback, useEffect } from 'react';
import { addDays, subDays } from 'date-fns';
import {
  SalesDashboardMetrics,
  InventoryHealthMetrics,
  CustomerAnalytics,
  ExecutiveDashboard,
  KPIValue,
  DashboardAlert,
  RecommendedAction,
  DateRange,
} from '@/types/analytics';
import { api } from '@/lib/api';

// ============================================================================
// HOOK
// ============================================================================

export const useAnalytics = () => {
  const [period, setPeriod] = useState<DateRange>({
    start: subDays(new Date(), 30),
    end: new Date(),
  });

  const [executiveDashboard, setExecutiveDashboard] = useState<ExecutiveDashboard | null>(null);
  const [salesMetrics, setSalesMetrics] = useState<SalesDashboardMetrics | null>(null);
  const [inventoryMetrics, setInventoryMetrics] = useState<InventoryHealthMetrics | null>(null);
  const [customerMetrics, setCustomerMetrics] = useState<CustomerAnalytics | null>(null);
  const [kpis, setKpis] = useState<KPIValue[]>([]);
  const [alerts, setAlerts] = useState<DashboardAlert[]>([]);
  const [recommendations, setRecommendations] = useState<RecommendedAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ============================================================================
  // API FETCH FUNCTIONS
  // ============================================================================

  const fetchExecutiveDashboard = useCallback(async () => {
    console.log('🔄 [useAnalytics] Buscando executive dashboard da API');
    try {
      const url = `/analytics/executive-dashboard?period_start=${period.start.toISOString()}&period_end=${period.end.toISOString()}`;
      const response = await api.get<any>(url);

      console.log('✅ [useAnalytics] Executive dashboard recebido:', response);

      // Convert dates
      const dashboard: ExecutiveDashboard = {
        ...response,
        period: {
          start: new Date(response.period.start),
          end: new Date(response.period.end),
        },
        kpis: response.kpis.map((kpi: any) => ({
          ...kpi,
          calculated_at: new Date(kpi.calculated_at),
          period: {
            start: new Date(kpi.period.start),
            end: new Date(kpi.period.end),
          },
        })),
        sales_metrics: {
          ...response.sales_metrics,
          period: {
            start: new Date(response.sales_metrics.period.start),
            end: new Date(response.sales_metrics.period.end),
          },
          time_series: response.sales_metrics.time_series.map((ts: any) => ({
            ...ts,
            date: new Date(ts.date),
          })),
        },
        inventory_metrics: {
          ...response.inventory_metrics,
          period: {
            start: new Date(response.inventory_metrics.period.start),
            end: new Date(response.inventory_metrics.period.end),
          },
          last_cycle_count_date: response.inventory_metrics.last_cycle_count_date
            ? new Date(response.inventory_metrics.last_cycle_count_date)
            : undefined,
        },
        customer_metrics: {
          ...response.customer_metrics,
          period: {
            start: new Date(response.customer_metrics.period.start),
            end: new Date(response.customer_metrics.period.end),
          },
          top_customers: response.customer_metrics.top_customers.map((c: any) => ({
            ...c,
            last_purchase_date: new Date(c.last_purchase_date),
          })),
        },
        alerts: response.alerts.map((alert: any) => ({
          ...alert,
          created_at: new Date(alert.created_at),
        })),
        recommended_actions: response.recommended_actions,
        generated_at: new Date(response.generated_at),
      };

      setExecutiveDashboard(dashboard);
      setSalesMetrics(dashboard.sales_metrics);
      setInventoryMetrics(dashboard.inventory_metrics);
      setCustomerMetrics(dashboard.customer_metrics);
      setKpis(dashboard.kpis);
      setAlerts(dashboard.alerts);
      setRecommendations(dashboard.recommended_actions);
    } catch (err: any) {
      console.error('❌ [useAnalytics] Erro ao buscar executive dashboard:', err);
      setError(err.message || 'Erro ao buscar dashboard');
      // NO FALLBACK - set empty states
      setExecutiveDashboard(null);
      setSalesMetrics(null);
      setInventoryMetrics(null);
      setCustomerMetrics(null);
      setKpis([]);
      setAlerts([]);
      setRecommendations([]);
    } finally {
      setLoading(false);
    }
  }, [period]);

  const fetchSalesMetrics = useCallback(async () => {
    console.log('🔄 [useAnalytics] Buscando sales metrics');
    try {
      const url = `/analytics/sales-metrics?period_start=${period.start.toISOString()}&period_end=${period.end.toISOString()}`;
      const response = await api.get<any>(url);

      const metrics: SalesDashboardMetrics = {
        ...response,
        period: {
          start: new Date(response.period.start),
          end: new Date(response.period.end),
        },
        time_series: response.time_series.map((ts: any) => ({
          ...ts,
          date: new Date(ts.date),
        })),
      };

      setSalesMetrics(metrics);
    } catch (err) {
      console.error('❌ [useAnalytics] Erro ao buscar sales metrics:', err);
      setSalesMetrics(null);
    }
  }, [period]);

  const fetchInventoryMetrics = useCallback(async () => {
    console.log('🔄 [useAnalytics] Buscando inventory metrics');
    try {
      const url = `/analytics/inventory-metrics?period_start=${period.start.toISOString()}&period_end=${period.end.toISOString()}`;
      const response = await api.get<any>(url);

      const metrics: InventoryHealthMetrics = {
        ...response,
        period: {
          start: new Date(response.period.start),
          end: new Date(response.period.end),
        },
        last_cycle_count_date: response.last_cycle_count_date
          ? new Date(response.last_cycle_count_date)
          : undefined,
      };

      setInventoryMetrics(metrics);
    } catch (err) {
      console.error('❌ [useAnalytics] Erro ao buscar inventory metrics:', err);
      setInventoryMetrics(null);
    }
  }, [period]);

  const fetchCustomerMetrics = useCallback(async () => {
    console.log('🔄 [useAnalytics] Buscando customer metrics');
    try {
      const url = `/analytics/customer-metrics?period_start=${period.start.toISOString()}&period_end=${period.end.toISOString()}`;
      const response = await api.get<any>(url);

      const metrics: CustomerAnalytics = {
        ...response,
        period: {
          start: new Date(response.period.start),
          end: new Date(response.period.end),
        },
        top_customers: response.top_customers.map((c: any) => ({
          ...c,
          last_purchase_date: new Date(c.last_purchase_date),
        })),
      };

      setCustomerMetrics(metrics);
    } catch (err) {
      console.error('❌ [useAnalytics] Erro ao buscar customer metrics:', err);
      setCustomerMetrics(null);
    }
  }, [period]);

  const fetchKPIs = useCallback(async () => {
    console.log('🔄 [useAnalytics] Buscando KPIs');
    try {
      const url = `/analytics/kpis?period_start=${period.start.toISOString()}&period_end=${period.end.toISOString()}`;
      const response = await api.get<any[]>(url);

      const kpisData: KPIValue[] = response.map(kpi => ({
        ...kpi,
        calculated_at: new Date(kpi.calculated_at),
        period: {
          start: new Date(kpi.period.start),
          end: new Date(kpi.period.end),
        },
      }));

      setKpis(kpisData);
    } catch (err) {
      console.error('❌ [useAnalytics] Erro ao buscar KPIs:', err);
      setKpis([]);
    }
  }, [period]);

  const fetchAlerts = useCallback(async () => {
    console.log('🔄 [useAnalytics] Buscando alerts');
    try {
      const response = await api.get<any[]>('/analytics/alerts');

      const alertsData: DashboardAlert[] = response.map(alert => ({
        ...alert,
        created_at: new Date(alert.created_at),
      }));

      setAlerts(alertsData);
    } catch (err) {
      console.error('❌ [useAnalytics] Erro ao buscar alerts:', err);
      setAlerts([]);
    }
  }, []);

  const fetchRecommendations = useCallback(async () => {
    console.log('🔄 [useAnalytics] Buscando recommended actions');
    try {
      const response = await api.get<any[]>('/analytics/recommended-actions');

      setRecommendations(response);
    } catch (err) {
      console.error('❌ [useAnalytics] Erro ao buscar recommendations:', err);
      setRecommendations([]);
    }
  }, []);

  // ============================================================================
  // ACTIONS
  // ============================================================================

  const markAlertRead = useCallback(async (alertId: string) => {
    console.log('🔄 [useAnalytics] Marcando alert como lido:', alertId);
    try {
      await api.put(`/analytics/alerts/${alertId}/read`);

      setAlerts(prev =>
        prev.map(alert =>
          alert.id === alertId ? { ...alert, action_required: false } : alert
        )
      );
    } catch (err) {
      console.error('❌ [useAnalytics] Erro ao marcar alert como lido:', err);
    }
  }, []);

  const dismissAlert = useCallback(async (alertId: string) => {
    console.log('🔄 [useAnalytics] Dismissing alert:', alertId);
    try {
      await api.put(`/analytics/alerts/${alertId}/dismiss`);

      setAlerts(prev => prev.filter(alert => alert.id !== alertId));
    } catch (err) {
      console.error('❌ [useAnalytics] Erro ao dismiss alert:', err);
    }
  }, []);

  const completeAction = useCallback(async (actionId: string) => {
    console.log('🔄 [useAnalytics] Completando action:', actionId);
    try {
      await api.put(`/analytics/recommended-actions/${actionId}/complete`);

      setRecommendations(prev => prev.filter(action => action.id !== actionId));
    } catch (err) {
      console.error('❌ [useAnalytics] Erro ao completar action:', err);
    }
  }, []);

  const dismissAction = useCallback(async (actionId: string) => {
    console.log('🔄 [useAnalytics] Dismissing action:', actionId);
    try {
      await api.put(`/analytics/recommended-actions/${actionId}/dismiss`);

      setRecommendations(prev => prev.filter(action => action.id !== actionId));
    } catch (err) {
      console.error('❌ [useAnalytics] Erro ao dismiss action:', err);
    }
  }, []);

  const changePeriod = useCallback((newPeriod: DateRange) => {
    console.log('🔄 [useAnalytics] Alterando período:', newPeriod);
    setPeriod(newPeriod);
  }, []);

  // ============================================================================
  // INITIAL LOAD
  // ============================================================================

  useEffect(() => {
    console.log('🔄 [useAnalytics] Carregando dados do analytics');
    fetchExecutiveDashboard();
  }, [fetchExecutiveDashboard]);

  // ============================================================================
  // COMPUTED VALUES
  // ============================================================================

  const criticalAlerts = alerts.filter(alert => alert.type === 'critical');

  // ============================================================================
  // RETURN
  // ============================================================================

  return {
    // Data
    executiveDashboard,
    salesMetrics,
    inventoryMetrics,
    customerMetrics,
    kpis,
    alerts,
    criticalAlerts,
    recommendations,
    period,

    // State
    loading,
    error,

    // Actions
    fetchExecutiveDashboard,
    fetchSalesMetrics,
    fetchInventoryMetrics,
    fetchCustomerMetrics,
    fetchKPIs,
    fetchAlerts,
    fetchRecommendations,
    markAlertRead,
    dismissAlert,
    completeAction,
    dismissAction,
    changePeriod,
  };
};
