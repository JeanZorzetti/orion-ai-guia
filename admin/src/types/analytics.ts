/**
 * Types for Analytics and BI Module
 * Phase 6: Advanced Analytics and Actionable Insights
 */

// ============================================================================
// COMMON TYPES
// ============================================================================

export interface DateRange {
  start: Date;
  end: Date;
}

export type PeriodType = 'today' | 'yesterday' | 'last_7_days' | 'last_30_days' | 'last_90_days' | 'this_month' | 'last_month' | 'this_year' | 'last_year' | 'custom';
export type ABCClass = 'A' | 'B' | 'C';
export type TrendDirection = 'up' | 'down' | 'stable';

// ============================================================================
// SALES ANALYTICS
// ============================================================================

export interface SalesDashboardMetrics {
  period: DateRange;
  workspace_id: number;

  // Sales
  total_sales: number;
  sales_count: number;
  avg_ticket: number;

  // Comparison
  vs_previous_period: {
    total_sales_change: number; // %
    sales_count_change: number; // %
    avg_ticket_change: number; // %
    trend: TrendDirection;
  };

  vs_same_period_last_year: {
    total_sales_change: number; // %
    sales_count_change: number; // %
    trend: TrendDirection;
  };

  // By channel
  by_channel: ChannelMetrics[];

  // By category
  by_category: CategoryMetrics[];

  // Top products
  top_products: ProductPerformance[];

  // Funnel
  funnel: SalesFunnel;

  // Goals
  goals: GoalsTracking;

  // Time series
  time_series: TimeSeriesData[];
}

export interface ChannelMetrics {
  channel: string;
  channel_name: string;
  sales: number;
  sales_count: number;
  percentage: number;
  avg_ticket: number;
  growth: number; // %
  trend: TrendDirection;
}

export interface CategoryMetrics {
  category_id: string;
  category: string;
  sales: number;
  quantity: number;
  percentage: number;
  margin: number;
  growth: number; // %
}

export interface ProductPerformance {
  product_id: string;
  product_name: string;
  sku: string;
  quantity_sold: number;
  revenue: number;
  profit: number;
  margin_percentage: number;
  growth: number; // %
  rank: number;
  abc_class: ABCClass;
}

export interface SalesFunnel {
  leads: number;
  opportunities: number;
  quotes: number;
  won: number;
  lost: number;
  conversion_rate: number; // %
  avg_deal_size: number;
  avg_sales_cycle_days: number;

  // Conversion rates by stage
  lead_to_opportunity: number; // %
  opportunity_to_quote: number; // %
  quote_to_won: number; // %
}

export interface GoalsTracking {
  period: DateRange;

  // Revenue goal
  revenue_goal: number;
  revenue_actual: number;
  revenue_achievement_percentage: number;
  revenue_remaining: number;
  revenue_projection: number;

  // Units goal
  units_goal?: number;
  units_actual?: number;
  units_achievement_percentage?: number;

  // Status
  on_track: boolean;
  days_remaining: number;
  daily_target_remaining: number;
}

export interface TimeSeriesData {
  date: Date;
  sales: number;
  sales_count: number;
  avg_ticket: number;
}

// ============================================================================
// INVENTORY ANALYTICS
// ============================================================================

export interface InventoryHealthMetrics {
  period: DateRange;
  workspace_id: number;

  // Value
  total_inventory_value: number;
  avg_inventory_value: number;
  inventory_cost: number;

  // Turnover
  inventory_turnover: number; // Times inventory turns over
  days_of_inventory: number; // Days of inventory available
  inventory_turnover_rate: number; // %

  // ABC Classification
  abc_distribution: ABCDistribution[];

  // Problems
  out_of_stock_items: number;
  low_stock_items: number;
  overstock_items: number;
  slow_moving_items: number;
  obsolete_items: number;
  dead_stock_items: number;

  // Expiration
  items_expiring_30_days: number;
  items_expiring_60_days: number;
  items_expiring_90_days: number;
  items_expired: number;
  expiration_loss_value: number;

  // Accuracy
  inventory_accuracy: number; // % (based on cycle counts)
  last_cycle_count_date?: Date;

  // Stock health score
  health_score: number; // 0-100
  health_status: 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
}

export interface ABCDistribution {
  class: ABCClass;
  products_count: number;
  revenue_contribution: number; // %
  stock_value: number;
  stock_percentage: number; // %
  avg_turnover: number;
}

export interface ProductInventoryAnalysis {
  product_id: string;
  product_name: string;
  sku: string;

  // Stock
  current_stock: number;
  min_stock: number;
  max_stock: number;
  reorder_point: number;

  // Value
  unit_cost: number;
  total_value: number;

  // Performance
  abc_class: ABCClass;
  turnover_rate: number;
  days_of_supply: number;

  // Velocity
  avg_daily_sales: number;
  sales_last_30_days: number;
  sales_last_90_days: number;

  // Issues
  stockout_risk: 'none' | 'low' | 'medium' | 'high' | 'critical';
  overstock_risk: 'none' | 'low' | 'medium' | 'high';
  slow_moving: boolean;
  obsolete: boolean;

  // Recommendations
  recommended_order_qty?: number;
  recommended_action?: 'order_now' | 'reduce_stock' | 'monitor' | 'discontinue';
}

// ============================================================================
// CUSTOMER ANALYTICS
// ============================================================================

export interface CustomerAnalytics {
  period: DateRange;

  // Overview
  total_customers: number;
  new_customers: number;
  active_customers: number;
  churned_customers: number;

  // Value
  total_customer_value: number;
  avg_customer_value: number;
  avg_customer_lifetime_value: number;

  // Retention
  retention_rate: number; // %
  churn_rate: number; // %
  repeat_purchase_rate: number; // %

  // Segmentation
  by_segment: CustomerSegmentMetrics[];

  // RFM
  rfm_distribution: RFMDistribution[];

  // Top customers
  top_customers: TopCustomer[];
}

export interface CustomerSegmentMetrics {
  segment: string;
  customer_count: number;
  percentage: number; // %
  total_revenue: number;
  avg_revenue: number;
  avg_orders: number;
  retention_rate: number; // %
}

export interface RFMDistribution {
  rfm_segment: string; // e.g., "Champions", "Loyal", "At Risk"
  customer_count: number;
  percentage: number; // %
  avg_recency_days: number;
  avg_frequency: number;
  avg_monetary: number;
}

export interface TopCustomer {
  customer_id: string;
  customer_name: string;
  total_spent: number;
  total_orders: number;
  avg_order_value: number;
  lifetime_value: number;
  last_purchase_date: Date;
  customer_score: number; // 0-100
  segment: string;
}

// ============================================================================
// CUSTOM REPORTS
// ============================================================================

export type ReportType = 'sales' | 'inventory' | 'customers' | 'products' | 'financial';
export type AggregationType = 'sum' | 'avg' | 'count' | 'min' | 'max' | 'median';
export type VisualizationType = 'table' | 'chart' | 'pivot' | 'kpi';
export type ChartType = 'line' | 'bar' | 'pie' | 'area' | 'scatter' | 'doughnut';
export type ReportScheduleFrequency = 'daily' | 'weekly' | 'monthly' | 'quarterly';

export interface CustomReport {
  id: string;
  workspace_id: number;
  name: string;
  description?: string;
  type: ReportType;

  // Dimensions
  dimensions: string[]; // e.g., ['date', 'product', 'channel']

  // Metrics
  metrics: ReportMetric[];

  // Filters
  filters: ReportFilter[];

  // Sorting
  sort_by?: string;
  sort_order?: 'asc' | 'desc';

  // Visualization
  visualization: VisualizationType;
  chart_type?: ChartType;

  // Layout
  layout?: {
    columns: string[];
    rows: string[];
    values: string[];
  };

  // Schedule
  schedule?: ReportSchedule;

  // Sharing
  is_public: boolean;
  shared_with?: string[]; // user IDs

  // Metadata
  created_by: string;
  created_at: Date;
  updated_at: Date;
  last_run_at?: Date;
  run_count: number;

  // Favorites
  is_favorite: boolean;
}

export interface ReportMetric {
  field: string;
  aggregation: AggregationType;
  label: string;
  format?: 'currency' | 'percentage' | 'number' | 'decimal';
  decimal_places?: number;
}

export interface ReportFilter {
  field: string;
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | 'in' | 'between';
  value: any;
  label?: string;
}

export interface ReportSchedule {
  enabled: boolean;
  frequency: ReportScheduleFrequency;
  time: string; // HH:mm format
  day_of_week?: number; // 0-6 for weekly
  day_of_month?: number; // 1-31 for monthly
  recipients: string[]; // email addresses
  format: 'pdf' | 'excel' | 'csv';
  next_run_at?: Date;
}

export interface ReportExecution {
  id: string;
  report_id: string;
  report_name: string;

  // Execution
  started_at: Date;
  completed_at?: Date;
  status: 'pending' | 'running' | 'completed' | 'failed';
  duration_seconds?: number;

  // Results
  row_count?: number;
  file_url?: string;
  file_size_bytes?: number;

  // Error
  error_message?: string;

  // Metadata
  executed_by: string;
  execution_type: 'manual' | 'scheduled';
}

// ============================================================================
// KPI MONITORING
// ============================================================================

export interface KPIDefinition {
  id: string;
  workspace_id: number;
  name: string;
  description?: string;
  category: 'sales' | 'inventory' | 'customers' | 'operations' | 'financial';

  // Calculation
  metric_field: string;
  aggregation: AggregationType;
  filters?: ReportFilter[];

  // Display
  format: 'currency' | 'percentage' | 'number' | 'decimal';
  prefix?: string;
  suffix?: string;

  // Targets
  target_value?: number;
  warning_threshold?: number;
  critical_threshold?: number;

  // Comparison
  compare_to_previous_period: boolean;

  // Visibility
  show_on_dashboard: boolean;
  display_order: number;

  created_at: Date;
  updated_at: Date;
}

export interface KPIValue {
  kpi_id: string;
  kpi_name: string;

  // Current value
  current_value: number;
  previous_value?: number;
  change_percentage?: number;
  trend: TrendDirection;

  // Target
  target_value?: number;
  target_achievement?: number; // %

  // Status
  status: 'excellent' | 'good' | 'warning' | 'critical';

  // Timestamp
  calculated_at: Date;
  period: DateRange;
}

// ============================================================================
// DASHBOARDS
// ============================================================================

export interface ExecutiveDashboard {
  workspace_id: number;
  period: DateRange;

  // KPIs
  kpis: KPIValue[];

  // Sales
  sales_metrics: SalesDashboardMetrics;

  // Inventory
  inventory_metrics: InventoryHealthMetrics;

  // Customers
  customer_metrics: CustomerAnalytics;

  // Alerts
  alerts: DashboardAlert[];

  // Quick actions
  recommended_actions: RecommendedAction[];

  generated_at: Date;
}

export interface DashboardAlert {
  id: string;
  type: 'info' | 'warning' | 'critical';
  category: 'sales' | 'inventory' | 'customers' | 'operations';
  title: string;
  message: string;
  value?: number;
  threshold?: number;
  action_required: boolean;
  action_label?: string;
  action_url?: string;
  created_at: Date;
}

export interface RecommendedAction {
  id: string;
  type: 'order_stock' | 'reduce_price' | 'promote_product' | 'contact_customer' | 'review_cost';
  priority: 'low' | 'medium' | 'high';
  title: string;
  description: string;
  potential_impact: string; // e.g., "Increase revenue by R$ 5,000"
  estimated_effort: 'low' | 'medium' | 'high';
  related_entity_id?: string;
  related_entity_type?: 'product' | 'customer' | 'order';
}

// ============================================================================
// FORECASTING
// ============================================================================

export interface SalesForecast {
  product_id?: string;
  category_id?: string;
  channel?: string;

  // Historical data
  historical_data: TimeSeriesData[];

  // Forecast
  forecast_data: ForecastPoint[];

  // Accuracy
  confidence_level: number; // 0-100
  mean_absolute_error: number;

  // Trend
  trend: TrendDirection;
  seasonality_detected: boolean;

  generated_at: Date;
}

export interface ForecastPoint {
  date: Date;
  forecasted_value: number;
  lower_bound: number;
  upper_bound: number;
  confidence_interval: number; // %
}

// ============================================================================
// EXPORT
// ============================================================================

export interface ExportJob {
  id: string;
  workspace_id: number;

  // Type
  export_type: 'report' | 'data' | 'dashboard';
  source_id?: string; // report_id or dashboard_id

  // Format
  format: 'pdf' | 'excel' | 'csv' | 'json';

  // Status
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress_percentage: number;

  // Result
  file_url?: string;
  file_name?: string;
  file_size_bytes?: number;

  // Timing
  started_at: Date;
  completed_at?: Date;
  expires_at?: Date;

  // Error
  error_message?: string;

  // Metadata
  created_by: string;
}
