/**
 * Analytics Hook - Executive Dashboard and Business Intelligence
 */

import { useState, useMemo } from 'react';
import { addDays, subDays, differenceInDays, startOfMonth, endOfMonth, format } from 'date-fns';
import {
  SalesDashboardMetrics,
  InventoryHealthMetrics,
  CustomerAnalytics,
  ExecutiveDashboard,
  KPIValue,
  DashboardAlert,
  RecommendedAction,
  DateRange,
  TimeSeriesData,
  ProductPerformance,
  ABCClass,
  TrendDirection,
} from '@/types/analytics';

// ============================================================================
// MOCK DATA GENERATORS
// ============================================================================

const generateTimeSeriesData = (days: number): TimeSeriesData[] => {
  const hoje = new Date();
  const data: TimeSeriesData[] = [];

  for (let i = days; i >= 0; i--) {
    const date = subDays(hoje, i);
    const baseValue = 10000 + Math.random() * 5000;
    const salesCount = 20 + Math.floor(Math.random() * 30);

    data.push({
      date,
      sales: baseValue + Math.sin(i / 7) * 2000, // Weekly seasonality
      sales_count: salesCount,
      avg_ticket: baseValue / salesCount,
    });
  }

  return data;
};

const generateMockSalesMetrics = (period: DateRange): SalesDashboardMetrics => {
  const timeSeries = generateTimeSeriesData(30);
  const totalSales = timeSeries.reduce((sum, d) => sum + d.sales, 0);
  const salesCount = timeSeries.reduce((sum, d) => sum + d.sales_count, 0);

  return {
    period,
    workspace_id: 1,
    total_sales: totalSales,
    sales_count: salesCount,
    avg_ticket: totalSales / salesCount,
    vs_previous_period: {
      total_sales_change: 12.5,
      sales_count_change: 8.3,
      avg_ticket_change: 3.9,
      trend: 'up',
    },
    vs_same_period_last_year: {
      total_sales_change: 25.7,
      sales_count_change: 18.2,
      trend: 'up',
    },
    by_channel: [
      {
        channel: 'online',
        channel_name: 'E-commerce',
        sales: totalSales * 0.45,
        sales_count: Math.floor(salesCount * 0.40),
        percentage: 45,
        avg_ticket: (totalSales * 0.45) / Math.floor(salesCount * 0.40),
        growth: 15.2,
        trend: 'up',
      },
      {
        channel: 'marketplace',
        channel_name: 'Marketplaces',
        sales: totalSales * 0.35,
        sales_count: Math.floor(salesCount * 0.45),
        percentage: 35,
        avg_ticket: (totalSales * 0.35) / Math.floor(salesCount * 0.45),
        growth: 22.8,
        trend: 'up',
      },
      {
        channel: 'retail',
        channel_name: 'Loja Física',
        sales: totalSales * 0.20,
        sales_count: Math.floor(salesCount * 0.15),
        percentage: 20,
        avg_ticket: (totalSales * 0.20) / Math.floor(salesCount * 0.15),
        growth: -3.5,
        trend: 'down',
      },
    ],
    by_category: [
      {
        category_id: 'cat-1',
        category: 'Eletrônicos',
        sales: totalSales * 0.40,
        quantity: Math.floor(salesCount * 0.30),
        percentage: 40,
        margin: 25.5,
        growth: 18.3,
      },
      {
        category_id: 'cat-2',
        category: 'Roupas',
        sales: totalSales * 0.25,
        quantity: Math.floor(salesCount * 0.35),
        percentage: 25,
        margin: 45.2,
        growth: 12.1,
      },
      {
        category_id: 'cat-3',
        category: 'Casa e Decoração',
        sales: totalSales * 0.20,
        quantity: Math.floor(salesCount * 0.20),
        percentage: 20,
        margin: 35.8,
        growth: 8.5,
      },
      {
        category_id: 'cat-4',
        category: 'Livros',
        sales: totalSales * 0.15,
        quantity: Math.floor(salesCount * 0.15),
        percentage: 15,
        margin: 30.0,
        growth: 5.2,
      },
    ],
    top_products: Array.from({ length: 10 }, (_, i) => ({
      product_id: `prod-${i + 1}`,
      product_name: `Produto Top ${i + 1}`,
      sku: `SKU-TOP-${i + 1}`,
      quantity_sold: 500 - i * 40,
      revenue: (50000 - i * 4000),
      profit: (50000 - i * 4000) * 0.3,
      margin_percentage: 30 - i * 0.5,
      growth: 25 - i * 2,
      rank: i + 1,
      abc_class: (i < 2 ? 'A' : i < 6 ? 'B' : 'C') as ABCClass,
    })),
    funnel: {
      leads: 1500,
      opportunities: 450,
      quotes: 180,
      won: 90,
      lost: 45,
      conversion_rate: 6.0,
      avg_deal_size: totalSales / 90,
      avg_sales_cycle_days: 21,
      lead_to_opportunity: 30.0,
      opportunity_to_quote: 40.0,
      quote_to_won: 50.0,
    },
    goals: {
      period,
      revenue_goal: 500000,
      revenue_actual: totalSales,
      revenue_achievement_percentage: (totalSales / 500000) * 100,
      revenue_remaining: 500000 - totalSales,
      revenue_projection: totalSales * 1.15,
      on_track: totalSales > 400000,
      days_remaining: differenceInDays(period.end, new Date()),
      daily_target_remaining: (500000 - totalSales) / differenceInDays(period.end, new Date()),
    },
    time_series: timeSeries,
  };
};

const generateMockInventoryMetrics = (period: DateRange): InventoryHealthMetrics => {
  return {
    period,
    workspace_id: 1,
    total_inventory_value: 2500000,
    avg_inventory_value: 2450000,
    inventory_cost: 1750000,
    inventory_turnover: 6.5,
    days_of_inventory: 56,
    inventory_turnover_rate: 18.2,
    abc_distribution: [
      {
        class: 'A',
        products_count: 45,
        revenue_contribution: 80,
        stock_value: 2000000,
        stock_percentage: 80,
        avg_turnover: 12.0,
      },
      {
        class: 'B',
        products_count: 120,
        revenue_contribution: 15,
        stock_value: 375000,
        stock_percentage: 15,
        avg_turnover: 6.0,
      },
      {
        class: 'C',
        products_count: 285,
        revenue_contribution: 5,
        stock_value: 125000,
        stock_percentage: 5,
        avg_turnover: 2.5,
      },
    ],
    out_of_stock_items: 12,
    low_stock_items: 28,
    overstock_items: 15,
    slow_moving_items: 42,
    obsolete_items: 8,
    dead_stock_items: 5,
    items_expiring_30_days: 18,
    items_expiring_60_days: 35,
    items_expiring_90_days: 52,
    items_expired: 3,
    expiration_loss_value: 12500,
    inventory_accuracy: 97.5,
    last_cycle_count_date: subDays(new Date(), 7),
    health_score: 82,
    health_status: 'good',
  };
};

const generateMockCustomerAnalytics = (period: DateRange): CustomerAnalytics => {
  return {
    period,
    total_customers: 2450,
    new_customers: 180,
    active_customers: 890,
    churned_customers: 45,
    total_customer_value: 3250000,
    avg_customer_value: 1326.53,
    avg_customer_lifetime_value: 4850.00,
    retention_rate: 85.5,
    churn_rate: 4.8,
    repeat_purchase_rate: 42.3,
    by_segment: [
      {
        segment: 'VIP',
        customer_count: 125,
        percentage: 5.1,
        total_revenue: 1625000,
        avg_revenue: 13000,
        avg_orders: 12.5,
        retention_rate: 95.2,
      },
      {
        segment: 'Regular',
        customer_count: 850,
        percentage: 34.7,
        total_revenue: 1300000,
        avg_revenue: 1529,
        avg_orders: 4.2,
        retention_rate: 82.5,
      },
      {
        segment: 'Ocasional',
        customer_count: 1475,
        percentage: 60.2,
        total_revenue: 325000,
        avg_revenue: 220,
        avg_orders: 1.3,
        retention_rate: 45.8,
      },
    ],
    rfm_distribution: [
      { rfm_segment: 'Champions', customer_count: 145, percentage: 5.9, avg_recency_days: 5, avg_frequency: 15, avg_monetary: 15000 },
      { rfm_segment: 'Loyal', customer_count: 320, percentage: 13.1, avg_recency_days: 12, avg_frequency: 8, avg_monetary: 8500 },
      { rfm_segment: 'At Risk', customer_count: 180, percentage: 7.3, avg_recency_days: 65, avg_frequency: 6, avg_monetary: 5200 },
      { rfm_segment: 'Needs Attention', customer_count: 280, percentage: 11.4, avg_recency_days: 45, avg_frequency: 4, avg_monetary: 3800 },
      { rfm_segment: 'New', customer_count: 180, percentage: 7.3, avg_recency_days: 8, avg_frequency: 1, avg_monetary: 450 },
    ],
    top_customers: Array.from({ length: 10 }, (_, i) => ({
      customer_id: `cust-${i + 1}`,
      customer_name: `Cliente Top ${i + 1}`,
      total_spent: 150000 - i * 12000,
      total_orders: 45 - i * 3,
      avg_order_value: (150000 - i * 12000) / (45 - i * 3),
      lifetime_value: (150000 - i * 12000) * 1.5,
      last_purchase_date: subDays(new Date(), Math.floor(Math.random() * 30)),
      customer_score: 95 - i * 3,
      segment: i < 3 ? 'VIP' : 'Regular',
    })),
  };
};

const generateMockKPIs = (): KPIValue[] => {
  const hoje = new Date();
  const period: DateRange = {
    start: startOfMonth(hoje),
    end: endOfMonth(hoje),
  };

  return [
    {
      kpi_id: 'kpi-1',
      kpi_name: 'Receita Total',
      current_value: 385000,
      previous_value: 340000,
      change_percentage: 13.2,
      trend: 'up',
      target_value: 500000,
      target_achievement: 77.0,
      status: 'good',
      calculated_at: hoje,
      period,
    },
    {
      kpi_id: 'kpi-2',
      kpi_name: 'Ticket Médio',
      current_value: 650,
      previous_value: 625,
      change_percentage: 4.0,
      trend: 'up',
      target_value: 700,
      target_achievement: 92.9,
      status: 'excellent',
      calculated_at: hoje,
      period,
    },
    {
      kpi_id: 'kpi-3',
      kpi_name: 'Taxa de Conversão',
      current_value: 6.2,
      previous_value: 5.8,
      change_percentage: 6.9,
      trend: 'up',
      target_value: 8.0,
      target_achievement: 77.5,
      status: 'good',
      calculated_at: hoje,
      period,
    },
    {
      kpi_id: 'kpi-4',
      kpi_name: 'Giro de Estoque',
      current_value: 6.5,
      previous_value: 6.8,
      change_percentage: -4.4,
      trend: 'down',
      target_value: 8.0,
      target_achievement: 81.3,
      status: 'warning',
      calculated_at: hoje,
      period,
    },
    {
      kpi_id: 'kpi-5',
      kpi_name: 'Taxa de Retenção',
      current_value: 85.5,
      previous_value: 83.2,
      change_percentage: 2.8,
      trend: 'up',
      target_value: 90.0,
      target_achievement: 95.0,
      status: 'excellent',
      calculated_at: hoje,
      period,
    },
    {
      kpi_id: 'kpi-6',
      kpi_name: 'Margem de Lucro',
      current_value: 28.5,
      previous_value: 27.8,
      change_percentage: 2.5,
      trend: 'up',
      target_value: 30.0,
      target_achievement: 95.0,
      status: 'excellent',
      calculated_at: hoje,
      period,
    },
  ];
};

const generateMockAlerts = (): DashboardAlert[] => {
  const hoje = new Date();

  return [
    {
      id: 'alert-1',
      type: 'critical',
      category: 'inventory',
      title: '12 Produtos em Falta',
      message: 'Existem 12 produtos sem estoque que tiveram vendas nos últimos 7 dias.',
      value: 12,
      action_required: true,
      action_label: 'Ver Produtos',
      action_url: '/admin/estoque/produtos',
      created_at: hoje,
    },
    {
      id: 'alert-2',
      type: 'warning',
      category: 'inventory',
      title: '18 Produtos Vencendo em 30 Dias',
      message: 'Produtos com data de validade próxima precisam de ação comercial.',
      value: 18,
      threshold: 30,
      action_required: true,
      action_label: 'Ver Relatório',
      action_url: '/admin/estoque/relatorios',
      created_at: subDays(hoje, 1),
    },
    {
      id: 'alert-3',
      type: 'warning',
      category: 'sales',
      title: 'Meta Mensal em 77%',
      message: 'Restam 10 dias para atingir a meta de R$ 500.000. Ritmo atual: R$ 385.000.',
      value: 77,
      threshold: 90,
      action_required: false,
      created_at: hoje,
    },
    {
      id: 'alert-4',
      type: 'info',
      category: 'customers',
      title: '180 Clientes em Risco',
      message: 'Clientes valiosos não compram há mais de 60 dias.',
      value: 180,
      action_required: true,
      action_label: 'Campanha de Reativação',
      created_at: subDays(hoje, 2),
    },
  ];
};

const generateMockRecommendations = (): RecommendedAction[] => {
  return [
    {
      id: 'rec-1',
      type: 'order_stock',
      priority: 'high',
      title: 'Repor Estoque de Produtos em Alta Demanda',
      description: 'Produto "Notebook Gamer X" está vendendo 45% acima da média e tem apenas 8 unidades.',
      potential_impact: 'Evitar perda de R$ 25.000 em vendas',
      estimated_effort: 'low',
      related_entity_id: 'prod-123',
      related_entity_type: 'product',
    },
    {
      id: 'rec-2',
      type: 'promote_product',
      priority: 'medium',
      title: 'Criar Promoção para Estoque Parado',
      description: '15 produtos com baixo giro e alto estoque. Considere desconto de 20-30%.',
      potential_impact: 'Liberar R$ 45.000 em capital de giro',
      estimated_effort: 'medium',
    },
    {
      id: 'rec-3',
      type: 'contact_customer',
      priority: 'high',
      title: 'Reativar Clientes VIP Inativos',
      description: '23 clientes VIP não compram há mais de 90 dias. LTV médio: R$ 15.000.',
      potential_impact: 'Recuperar até R$ 345.000 em receita',
      estimated_effort: 'medium',
      related_entity_type: 'customer',
    },
    {
      id: 'rec-4',
      type: 'reduce_price',
      priority: 'medium',
      title: 'Ajustar Preços de Produtos com Baixa Conversão',
      description: '8 produtos com alta visualização mas baixa conversão. Taxa atual: 0.8%.',
      potential_impact: 'Aumentar vendas em 15-20%',
      estimated_effort: 'low',
    },
  ];
};

// ============================================================================
// HOOK
// ============================================================================

interface UseAnalyticsReturn {
  // Dashboard
  executiveDashboard: ExecutiveDashboard;

  // Metrics
  salesMetrics: SalesDashboardMetrics;
  inventoryMetrics: InventoryHealthMetrics;
  customerMetrics: CustomerAnalytics;

  // KPIs
  kpis: KPIValue[];

  // Alerts & Recommendations
  alerts: DashboardAlert[];
  criticalAlerts: DashboardAlert[];
  recommendations: RecommendedAction[];

  // Period control
  period: DateRange;
  setPeriod: (period: DateRange) => void;

  loading: boolean;
}

export const useAnalytics = (): UseAnalyticsReturn => {
  const hoje = new Date();
  const [period, setPeriod] = useState<DateRange>({
    start: startOfMonth(hoje),
    end: endOfMonth(hoje),
  });

  const [loading] = useState(false);

  // Generate metrics
  const salesMetrics = useMemo(() => generateMockSalesMetrics(period), [period]);
  const inventoryMetrics = useMemo(() => generateMockInventoryMetrics(period), [period]);
  const customerMetrics = useMemo(() => generateMockCustomerAnalytics(period), [period]);
  const kpis = useMemo(() => generateMockKPIs(), []);
  const alerts = useMemo(() => generateMockAlerts(), []);
  const recommendations = useMemo(() => generateMockRecommendations(), []);

  // Filter critical alerts
  const criticalAlerts = useMemo(() =>
    alerts.filter(a => a.type === 'critical'),
    [alerts]
  );

  // Executive dashboard
  const executiveDashboard = useMemo((): ExecutiveDashboard => ({
    workspace_id: 1,
    period,
    kpis,
    sales_metrics: salesMetrics,
    inventory_metrics: inventoryMetrics,
    customer_metrics: customerMetrics,
    alerts,
    recommended_actions: recommendations,
    generated_at: new Date(),
  }), [period, kpis, salesMetrics, inventoryMetrics, customerMetrics, alerts, recommendations]);

  return {
    executiveDashboard,
    salesMetrics,
    inventoryMetrics,
    customerMetrics,
    kpis,
    alerts,
    criticalAlerts,
    recommendations,
    period,
    setPeriod,
    loading,
  };
};
