import { useState, useCallback, useMemo, useEffect } from 'react';
import { api } from '@/lib/api';
import {
  StockAlert,
  AlertRule,
  AutomationLog,
  StockAlertFilters,
} from '@/types/inventory';

// ============================================
// API Response Types
// ============================================

interface StockAlertAPI {
  id: number;
  type: 'low_stock' | 'critical_stock' | 'overstock' | 'expiring_soon' | 'expired' | 'slow_moving' | 'fast_moving' | 'stockout_risk';
  severity: 'critical' | 'high' | 'medium' | 'low';
  product_id: number;
  product_name: string;
  warehouse_id?: number;
  warehouse_name?: string;
  batch_id?: number;
  message: string;
  current_value?: number;
  threshold_value?: number;
  recommended_action: string;
  notify_users?: any[];
  notification_channels?: string[];
  sent_at?: string;
  status: 'active' | 'acknowledged' | 'resolved' | 'dismissed';
  acknowledged_by?: number;
  acknowledged_at?: string;
  resolved_at?: string;
  resolution_notes?: string;
  created_at: string;
}

interface AlertRuleAPI {
  id: number;
  name: string;
  description?: string;
  type: 'low_stock' | 'critical_stock' | 'overstock' | 'expiring_soon' | 'expired' | 'slow_moving' | 'fast_moving' | 'stockout_risk';
  is_active: boolean;
  conditions: any[];
  applies_to: string;
  category_ids?: number[];
  product_ids?: number[];
  warehouse_ids?: number[];
  auto_actions: string[];
  notification_template?: string;
  notify_users?: any[];
  notification_channels?: string[];
  check_frequency: string;
  last_checked_at?: string;
  created_by?: number;
  created_at: string;
  updated_at: string;
}

interface AlertStatsAPI {
  total_alerts: number;
  active_alerts: number;
  critical_alerts: number;
  high_alerts: number;
  acknowledged_alerts: number;
}

interface RuleStatsAPI {
  total_rules: number;
  active_rules: number;
  inactive_rules: number;
}

// ============================================
// HOOK
// ============================================

interface UseStockAlertsReturn {
  // Data
  alerts: StockAlert[];
  filteredAlerts: StockAlert[];
  rules: AlertRule[];
  logs: AutomationLog[];

  // Filters
  filters: StockAlertFilters;
  setFilters: (filters: StockAlertFilters) => void;
  clearFilters: () => void;

  // Actions - Alerts
  acknowledgeAlert: (alertId: string, userId: string) => void;
  resolveAlert: (alertId: string, notes: string) => void;
  dismissAlert: (alertId: string) => void;

  // Actions - Rules
  createRule: (rule: Omit<AlertRule, 'id' | 'created_at' | 'updated_at'>) => void;
  updateRule: (ruleId: string, updates: Partial<AlertRule>) => void;
  toggleRule: (ruleId: string) => void;
  deleteRule: (ruleId: string) => void;

  // Stats
  stats: {
    activeAlerts: number;
    criticalAlerts: number;
    highAlerts: number;
    acknowledgedAlerts: number;
    activeRules: number;
    successfulAutomations: number;
    automationSuccessRate: number;
  };

  // Loading
  loading: boolean;
  refresh: () => void;
}

export const useStockAlerts = (): UseStockAlertsReturn => {
  const [alerts, setAlerts] = useState<StockAlert[]>([]);
  const [rules, setRules] = useState<AlertRule[]>([]);
  const [logs, setLogs] = useState<AutomationLog[]>([]);
  const [filters, setFilters] = useState<StockAlertFilters>({});
  const [loading, setLoading] = useState(true);

  const [alertStats, setAlertStats] = useState<AlertStatsAPI>({
    total_alerts: 0,
    active_alerts: 0,
    critical_alerts: 0,
    high_alerts: 0,
    acknowledged_alerts: 0
  });

  const [ruleStats, setRuleStats] = useState<RuleStatsAPI>({
    total_rules: 0,
    active_rules: 0,
    inactive_rules: 0
  });

  // ============================================
  // FETCH DATA FROM API
  // ============================================

  const fetchAlerts = useCallback(async () => {
    console.log('🔄 [useStockAlerts] Buscando alertas da API');
    try {
      const response = await api.get<StockAlertAPI[]>('/automation/alerts');
      console.log('✅ [useStockAlerts] Alertas recebidos:', response.length);

      const converted: StockAlert[] = response.map(a => ({
        id: a.id.toString(),
        type: a.type,
        severity: a.severity,
        product_id: a.product_id,
        product_name: a.product_name,
        warehouse_id: a.warehouse_id?.toString(),
        warehouse_name: a.warehouse_name,
        batch_id: a.batch_id?.toString(),
        message: a.message,
        current_value: a.current_value,
        threshold_value: a.threshold_value,
        recommended_action: a.recommended_action,
        notify_users: a.notify_users,
        notification_channels: a.notification_channels,
        sent_at: a.sent_at ? new Date(a.sent_at) : undefined,
        status: a.status,
        acknowledged_by: a.acknowledged_by?.toString(),
        acknowledged_at: a.acknowledged_at ? new Date(a.acknowledged_at) : undefined,
        resolved_at: a.resolved_at ? new Date(a.resolved_at) : undefined,
        resolution_notes: a.resolution_notes,
        created_at: new Date(a.created_at)
      }));

      setAlerts(converted);
    } catch (err) {
      console.error('❌ [useStockAlerts] Erro ao buscar alertas:', err);
      setAlerts([]);
    }
  }, []);

  const fetchAlertStats = useCallback(async () => {
    try {
      const response = await api.get<AlertStatsAPI>('/automation/alerts/stats');
      console.log('✅ [useStockAlerts] Stats de alertas recebidas:', response);
      setAlertStats(response);
    } catch (err) {
      console.error('❌ [useStockAlerts] Erro ao buscar stats de alertas:', err);
    }
  }, []);

  const fetchRules = useCallback(async () => {
    console.log('🔄 [useStockAlerts] Buscando regras da API');
    try {
      const response = await api.get<AlertRuleAPI[]>('/automation/rules');
      console.log('✅ [useStockAlerts] Regras recebidas:', response.length);

      const converted: AlertRule[] = response.map(r => ({
        id: r.id.toString(),
        name: r.name,
        description: r.description,
        type: r.type,
        is_active: r.is_active,
        conditions: r.conditions,
        applies_to: r.applies_to as any,
        category_ids: r.category_ids,
        product_ids: r.product_ids,
        warehouse_ids: r.warehouse_ids?.map(id => id.toString()),
        auto_actions: r.auto_actions as any,
        notification_template: r.notification_template,
        notify_users: r.notify_users,
        notification_channels: r.notification_channels as any,
        check_frequency: r.check_frequency as any,
        last_checked_at: r.last_checked_at ? new Date(r.last_checked_at) : undefined,
        created_by: r.created_by?.toString(),
        created_at: new Date(r.created_at),
        updated_at: new Date(r.updated_at)
      }));

      setRules(converted);
    } catch (err) {
      console.error('❌ [useStockAlerts] Erro ao buscar regras:', err);
      setRules([]);
    }
  }, []);

  const fetchRuleStats = useCallback(async () => {
    try {
      const response = await api.get<RuleStatsAPI>('/automation/rules/stats');
      console.log('✅ [useStockAlerts] Stats de regras recebidas:', response);
      setRuleStats(response);
    } catch (err) {
      console.error('❌ [useStockAlerts] Erro ao buscar stats de regras:', err);
    }
  }, []);

  // Buscar dados ao montar
  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      await Promise.all([
        fetchAlerts(),
        fetchAlertStats(),
        fetchRules(),
        fetchRuleStats()
      ]);
      setLoading(false);
    };

    fetchAll();
  }, [fetchAlerts, fetchAlertStats, fetchRules, fetchRuleStats]);

  // ============================================
  // COMPUTED DATA
  // ============================================

  const filteredAlerts = useMemo(() => {
    let result = [...alerts];

    if (filters.type && filters.type.length > 0) {
      result = result.filter(a => filters.type!.includes(a.type));
    }

    if (filters.severity && filters.severity.length > 0) {
      result = result.filter(a => filters.severity!.includes(a.severity));
    }

    if (filters.status && filters.status.length > 0) {
      result = result.filter(a => filters.status!.includes(a.status));
    }

    if (filters.product_id) {
      result = result.filter(a => a.product_id === filters.product_id);
    }

    if (filters.warehouse_id) {
      result = result.filter(a => a.warehouse_id === filters.warehouse_id);
    }

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      result = result.filter(a =>
        a.product_name.toLowerCase().includes(searchLower) ||
        a.message.toLowerCase().includes(searchLower) ||
        a.recommended_action.toLowerCase().includes(searchLower)
      );
    }

    if (filters.date_from) {
      result = result.filter(a => new Date(a.created_at) >= filters.date_from!);
    }

    if (filters.date_to) {
      result = result.filter(a => new Date(a.created_at) <= filters.date_to!);
    }

    return result;
  }, [alerts, filters]);

  const stats = useMemo(() => {
    // Automação de sucesso - ainda não implementado
    const successfulAutomations = 0;
    const totalAutomations = 0;
    const automationSuccessRate = totalAutomations > 0 ? (successfulAutomations / totalAutomations) * 100 : 100;

    return {
      activeAlerts: alertStats.active_alerts,
      criticalAlerts: alertStats.critical_alerts,
      highAlerts: alertStats.high_alerts,
      acknowledgedAlerts: alertStats.acknowledged_alerts,
      activeRules: ruleStats.active_rules,
      successfulAutomations,
      automationSuccessRate,
    };
  }, [alertStats, ruleStats]);

  // ============================================
  // ACTIONS - ALERTS
  // ============================================

  const acknowledgeAlert = useCallback((alertId: string, userId: string) => {
    // Atualizar localmente
    setAlerts(prev => prev.map(a =>
      a.id === alertId ? {
        ...a,
        status: 'acknowledged' as const,
        acknowledged_by: userId,
        acknowledged_at: new Date(),
      } : a
    ));

    // TODO: Chamar API para atualizar no backend
  }, []);

  const resolveAlert = useCallback((alertId: string, notes: string) => {
    // Atualizar localmente
    setAlerts(prev => prev.map(a =>
      a.id === alertId ? {
        ...a,
        status: 'resolved' as const,
        resolved_at: new Date(),
        resolution_notes: notes,
      } : a
    ));

    // TODO: Chamar API para atualizar no backend
  }, []);

  const dismissAlert = useCallback((alertId: string) => {
    // Atualizar localmente
    setAlerts(prev => prev.map(a =>
      a.id === alertId ? {
        ...a,
        status: 'dismissed' as const,
      } : a
    ));

    // TODO: Chamar API para atualizar no backend
  }, []);

  // ============================================
  // ACTIONS - RULES
  // ============================================

  const createRule = useCallback((ruleData: Omit<AlertRule, 'id' | 'created_at' | 'updated_at'>) => {
    console.warn('createRule: Não implementado');
    // TODO: Chamar API para criar regra
  }, []);

  const updateRule = useCallback((ruleId: string, updates: Partial<AlertRule>) => {
    console.warn('updateRule: Não implementado');
    // TODO: Chamar API para atualizar regra
  }, []);

  const toggleRule = useCallback((ruleId: string) => {
    // Atualizar localmente
    setRules(prev => prev.map(r =>
      r.id === ruleId ? { ...r, is_active: !r.is_active, updated_at: new Date() } : r
    ));

    // TODO: Chamar API para atualizar no backend
  }, []);

  const deleteRule = useCallback((ruleId: string) => {
    console.warn('deleteRule: Não implementado');
    // TODO: Chamar API para deletar regra
  }, []);

  // ============================================
  // REFRESH
  // ============================================

  const refresh = useCallback(async () => {
    setLoading(true);
    await Promise.all([
      fetchAlerts(),
      fetchAlertStats(),
      fetchRules(),
      fetchRuleStats()
    ]);
    setLoading(false);
  }, [fetchAlerts, fetchAlertStats, fetchRules, fetchRuleStats]);

  const clearFilters = useCallback(() => {
    setFilters({});
  }, []);

  return {
    // Data
    alerts,
    filteredAlerts,
    rules,
    logs, // Vazio por enquanto - não implementado

    // Filters
    filters,
    setFilters,
    clearFilters,

    // Actions - Alerts
    acknowledgeAlert,
    resolveAlert,
    dismissAlert,

    // Actions - Rules
    createRule,
    updateRule,
    toggleRule,
    deleteRule,

    // Stats
    stats,

    // Loading
    loading,
    refresh,
  };
};
