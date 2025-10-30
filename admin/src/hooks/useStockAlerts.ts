import { useState, useCallback, useMemo } from 'react';
import {
  StockAlert,
  AlertRule,
  AutomationLog,
  StockAlertFilters,
} from '@/types/inventory';
import { addDays, addHours, startOfDay } from 'date-fns';

// ============================================
// MOCK DATA GENERATORS
// ============================================

const generateMockAlerts = (): StockAlert[] => {
  const alerts: StockAlert[] = [];
  const hoje = new Date();

  const alertTypes: StockAlert['type'][] = [
    'low_stock', 'critical_stock', 'overstock', 'expiring_soon',
    'expired', 'slow_moving', 'fast_moving', 'stockout_risk'
  ];

  for (let i = 1; i <= 30; i++) {
    const type = alertTypes[Math.floor(Math.random() * alertTypes.length)];
    const severity: StockAlert['severity'] =
      type === 'critical_stock' || type === 'expired' || type === 'stockout_risk' ? 'critical' :
      type === 'low_stock' || type === 'expiring_soon' ? 'high' :
      type === 'fast_moving' ? 'medium' : 'low';

    const status: StockAlert['status'] = Math.random() > 0.7 ? 'resolved' :
                                        Math.random() > 0.5 ? 'acknowledged' : 'active';

    alerts.push({
      id: `alert-${i}`,
      type,
      severity,
      product_id: Math.floor(Math.random() * 20) + 1,
      product_name: `Produto ${Math.floor(Math.random() * 20) + 1}`,
      warehouse_id: Math.random() > 0.5 ? `warehouse-${Math.floor(Math.random() * 3) + 1}` : undefined,
      warehouse_name: Math.random() > 0.5 ? `Depósito ${Math.floor(Math.random() * 3) + 1}` : undefined,
      batch_id: type === 'expiring_soon' || type === 'expired' ? `batch-${i}` : undefined,
      message: generateAlertMessage(type),
      current_value: Math.floor(Math.random() * 100),
      threshold_value: Math.floor(Math.random() * 50) + 20,
      recommended_action: generateRecommendedAction(type),
      notify_users: ['user-1', 'user-2'],
      notification_channels: ['email', 'push'],
      sent_at: addHours(hoje, -Math.random() * 48),
      status,
      acknowledged_by: status !== 'active' ? 'user-1' : undefined,
      acknowledged_at: status !== 'active' ? addHours(hoje, -Math.random() * 24) : undefined,
      resolved_at: status === 'resolved' ? addHours(hoje, -Math.random() * 12) : undefined,
      resolution_notes: status === 'resolved' ? 'Pedido realizado' : undefined,
      created_at: addDays(hoje, -Math.random() * 7),
    });
  }

  return alerts.sort((a, b) => {
    const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    return severityOrder[a.severity] - severityOrder[b.severity];
  });
};

const generateAlertMessage = (type: StockAlert['type']): string => {
  switch (type) {
    case 'low_stock': return 'Estoque abaixo do mínimo recomendado';
    case 'critical_stock': return 'Estoque crítico - Risco de ruptura';
    case 'overstock': return 'Estoque em excesso - Avaliar promoção';
    case 'expiring_soon': return 'Produto próximo ao vencimento';
    case 'expired': return 'Produto vencido - Ação necessária';
    case 'slow_moving': return 'Produto com giro lento - Avaliar estratégia';
    case 'fast_moving': return 'Produto com giro acelerado - Aumentar estoque';
    case 'stockout_risk': return 'Risco de ruptura nos próximos dias';
    default: return 'Alerta de estoque';
  }
};

const generateRecommendedAction = (type: StockAlert['type']): string => {
  switch (type) {
    case 'low_stock': return 'Emitir pedido de compra';
    case 'critical_stock': return 'Pedido urgente necessário';
    case 'overstock': return 'Criar promoção ou transferir entre depósitos';
    case 'expiring_soon': return 'Promoção para liquidação rápida';
    case 'expired': return 'Separar para descarte ou doação';
    case 'slow_moving': return 'Revisar precificação e canais de venda';
    case 'fast_moving': return 'Aumentar estoque de segurança';
    case 'stockout_risk': return 'Pedido de reposição imediato';
    default: return 'Avaliar situação';
  }
};

const generateMockRules = (): AlertRule[] => {
  const hoje = new Date();

  return [
    {
      id: 'rule-1',
      name: 'Estoque Baixo - Todos os Produtos',
      description: 'Alerta quando o estoque cair abaixo de 20% do mínimo',
      type: 'low_stock',
      is_active: true,
      conditions: [
        { metric: 'percentage', operator: '<', threshold: 20 },
      ],
      applies_to: 'all',
      auto_actions: ['send_notification', 'create_purchase_suggestion'],
      notification_template: 'Estoque de {{product_name}} está abaixo de 20% do mínimo',
      notify_users: ['user-1', 'user-2'],
      notification_channels: ['email', 'push'],
      check_frequency: 'hourly',
      last_checked_at: addHours(hoje, -1),
      created_by: 'user-1',
      created_at: addDays(hoje, -30),
      updated_at: hoje,
    },
    {
      id: 'rule-2',
      name: 'Estoque Crítico - Categoria Eletrônicos',
      description: 'Alerta crítico para produtos eletrônicos com estoque < 10 unidades',
      type: 'critical_stock',
      is_active: true,
      conditions: [
        { metric: 'quantity', operator: '<', threshold: 10 },
      ],
      applies_to: 'category',
      category_ids: [1, 2, 3],
      auto_actions: ['send_notification', 'create_purchase_suggestion', 'create_task'],
      notification_template: 'URGENTE: {{product_name}} com apenas {{quantity}} unidades',
      notify_users: ['user-1'],
      notification_channels: ['email', 'sms', 'push'],
      check_frequency: 'realtime',
      created_by: 'user-1',
      created_at: addDays(hoje, -60),
      updated_at: hoje,
    },
    {
      id: 'rule-3',
      name: 'Produtos Vencendo',
      description: 'Alerta para produtos que vencem em menos de 30 dias',
      type: 'expiring_soon',
      is_active: true,
      conditions: [
        { metric: 'days', operator: '<', threshold: 30 },
      ],
      applies_to: 'all',
      auto_actions: ['send_notification'],
      notification_template: '{{product_name}} vence em {{days}} dias - Lote {{batch_number}}',
      notify_users: ['user-1', 'user-3'],
      notification_channels: ['email'],
      check_frequency: 'daily',
      last_checked_at: startOfDay(hoje),
      created_by: 'user-1',
      created_at: addDays(hoje, -45),
      updated_at: hoje,
    },
    {
      id: 'rule-4',
      name: 'Excesso de Estoque',
      description: 'Alerta quando estoque ultrapassar 150% do máximo',
      type: 'overstock',
      is_active: true,
      conditions: [
        { metric: 'percentage', operator: '>', threshold: 150 },
      ],
      applies_to: 'all',
      auto_actions: ['send_notification'],
      notification_template: '{{product_name}} com excesso de estoque - {{quantity}} unidades',
      notify_users: ['user-2'],
      notification_channels: ['email'],
      check_frequency: 'weekly',
      created_by: 'user-2',
      created_at: addDays(hoje, -90),
      updated_at: hoje,
    },
  ];
};

const generateMockLogs = (): AutomationLog[] => {
  const logs: AutomationLog[] = [];
  const hoje = new Date();

  for (let i = 1; i <= 15; i++) {
    logs.push({
      id: `log-${i}`,
      rule_id: `rule-${Math.floor(Math.random() * 4) + 1}`,
      rule_name: `Regra ${Math.floor(Math.random() * 4) + 1}`,
      automation_type: ['alert', 'purchase', 'notification'][Math.floor(Math.random() * 3)] as any,
      action_taken: 'Notificação enviada para gestores de estoque',
      triggered_by: Math.random() > 0.5 ? 'rule' : 'system',
      trigger_details: 'Estoque abaixo do limite configurado',
      status: Math.random() > 0.9 ? 'failed' : 'success',
      error_message: Math.random() > 0.9 ? 'Erro ao enviar notificação' : undefined,
      affected_items: [
        {
          product_id: Math.floor(Math.random() * 20) + 1,
          warehouse_id: `warehouse-${Math.floor(Math.random() * 3) + 1}`,
          quantity: Math.floor(Math.random() * 100),
        },
      ],
      executed_at: addHours(hoje, -Math.random() * 72),
      execution_time_ms: Math.floor(Math.random() * 1000) + 100,
    });
  }

  return logs.sort((a, b) => b.executed_at.getTime() - a.executed_at.getTime());
};

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
  const [alerts, setAlerts] = useState<StockAlert[]>(generateMockAlerts);
  const [rules, setRules] = useState<AlertRule[]>(generateMockRules);
  const [logs, setLogs] = useState<AutomationLog[]>(generateMockLogs);
  const [filters, setFilters] = useState<StockAlertFilters>({});
  const [loading, setLoading] = useState(false);

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
    const activeAlerts = alerts.filter(a => a.status === 'active').length;
    const criticalAlerts = alerts.filter(a => a.severity === 'critical' && a.status === 'active').length;
    const highAlerts = alerts.filter(a => a.severity === 'high' && a.status === 'active').length;
    const acknowledgedAlerts = alerts.filter(a => a.status === 'acknowledged').length;
    const activeRules = rules.filter(r => r.is_active).length;
    const successfulAutomations = logs.filter(l => l.status === 'success').length;
    const automationSuccessRate = logs.length > 0 ? (successfulAutomations / logs.length) * 100 : 100;

    return {
      activeAlerts,
      criticalAlerts,
      highAlerts,
      acknowledgedAlerts,
      activeRules,
      successfulAutomations,
      automationSuccessRate,
    };
  }, [alerts, rules, logs]);

  // ============================================
  // ACTIONS - ALERTS
  // ============================================

  const acknowledgeAlert = useCallback((alertId: string, userId: string) => {
    setAlerts(prev => prev.map(a =>
      a.id === alertId ? {
        ...a,
        status: 'acknowledged',
        acknowledged_by: userId,
        acknowledged_at: new Date(),
      } : a
    ));
  }, []);

  const resolveAlert = useCallback((alertId: string, notes: string) => {
    setAlerts(prev => prev.map(a =>
      a.id === alertId ? {
        ...a,
        status: 'resolved',
        resolved_at: new Date(),
        resolution_notes: notes,
      } : a
    ));
  }, []);

  const dismissAlert = useCallback((alertId: string) => {
    setAlerts(prev => prev.map(a =>
      a.id === alertId ? {
        ...a,
        status: 'dismissed',
      } : a
    ));
  }, []);

  // ============================================
  // ACTIONS - RULES
  // ============================================

  const createRule = useCallback((ruleData: Omit<AlertRule, 'id' | 'created_at' | 'updated_at'>) => {
    const hoje = new Date();
    const newRule: AlertRule = {
      ...ruleData,
      id: `rule-${Date.now()}`,
      created_at: hoje,
      updated_at: hoje,
    };
    setRules(prev => [...prev, newRule]);
  }, []);

  const updateRule = useCallback((ruleId: string, updates: Partial<AlertRule>) => {
    setRules(prev => prev.map(r =>
      r.id === ruleId ? { ...r, ...updates, updated_at: new Date() } : r
    ));
  }, []);

  const toggleRule = useCallback((ruleId: string) => {
    setRules(prev => prev.map(r =>
      r.id === ruleId ? { ...r, is_active: !r.is_active, updated_at: new Date() } : r
    ));
  }, []);

  const deleteRule = useCallback((ruleId: string) => {
    setRules(prev => prev.filter(r => r.id !== ruleId));
  }, []);

  // ============================================
  // REFRESH
  // ============================================

  const refresh = useCallback(() => {
    setLoading(true);
    setTimeout(() => {
      setAlerts(generateMockAlerts());
      setRules(generateMockRules());
      setLogs(generateMockLogs());
      setLoading(false);
    }, 500);
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({});
  }, []);

  return {
    // Data
    alerts,
    filteredAlerts,
    rules,
    logs,

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
