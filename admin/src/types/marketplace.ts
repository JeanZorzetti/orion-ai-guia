/**
 * Types for Unified Marketplace Module
 * Phase 5: Omnichannel Integration and Management
 */

// ============================================================================
// MARKETPLACE INTEGRATIONS
// ============================================================================

export type MarketplaceType =
  | 'mercado_livre'
  | 'amazon'
  | 'shopee'
  | 'magalu'
  | 'b2w'
  | 'tiktok_shop'
  | 'shopify'
  | 'woocommerce'
  | 'custom';

export type SyncStatus = 'success' | 'error' | 'partial' | 'pending';
export type ListingStatus = 'active' | 'paused' | 'out_of_stock' | 'error';
export type UnifiedOrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
export type PaymentStatus = 'pending' | 'approved' | 'rejected';

export interface MarketplaceIntegration {
  id: string;
  workspace_id: number;
  marketplace: MarketplaceType;
  name: string;

  // Credentials
  credentials: {
    client_id?: string;
    client_secret?: string;
    access_token?: string;
    refresh_token?: string;
    store_url?: string;
    api_key?: string;
    seller_id?: string;
  };

  // Configuration
  is_active: boolean;
  auto_sync: boolean;
  sync_frequency: number; // minutes

  // Mapping
  default_warehouse_id: string;
  price_adjustment: {
    type: 'percentage' | 'fixed';
    value: number;
  };

  // Sync settings
  sync_products: boolean;
  sync_orders: boolean;
  sync_stock: boolean;

  // Last sync
  last_sync_at?: Date;
  last_sync_status: SyncStatus;
  last_sync_error?: string;
  last_sync_summary?: {
    products_synced: number;
    orders_imported: number;
    stock_updated: number;
    errors: number;
  };

  // Statistics
  total_listings: number;
  active_listings: number;
  total_orders: number;
  total_revenue: number;

  created_at: Date;
  updated_at: Date;
}

export interface ProductListing {
  id: string;
  product_id: string;
  product_name: string;
  product_sku: string;
  marketplace_integration_id: string;
  marketplace: MarketplaceType;

  // External IDs
  external_id: string;
  external_sku: string;
  listing_url: string;

  // Price and stock
  price: number;
  original_price?: number;
  stock_quantity: number;

  // Status
  status: ListingStatus;
  is_synced: boolean;
  sync_enabled: boolean;

  // Customization
  title?: string; // Custom title
  description?: string; // Custom description
  images?: string[]; // Image URLs
  category?: string;
  tags?: string[];

  // Metrics
  views: number;
  sales: number;
  conversion_rate: number;
  revenue: number;

  // Shipping
  free_shipping: boolean;
  shipping_cost?: number;

  // Sync
  last_synced_at?: Date;
  sync_errors?: string[];
  pending_changes: boolean;

  created_at: Date;
  updated_at: Date;
}

export interface UnifiedOrder {
  id: string;
  workspace_id: number;

  // Origin
  marketplace_integration_id: string;
  marketplace: MarketplaceType;
  marketplace_name: string;
  external_order_id: string;
  external_order_number: string;

  // Customer data (normalized)
  customer: {
    name: string;
    email: string;
    phone: string;
    document: string;
    external_customer_id?: string;
  };

  // Items
  items: UnifiedOrderItem[];

  // Shipping
  shipping: {
    method: string;
    cost: number;
    address: ShippingAddress;
    tracking_code?: string;
    estimated_delivery?: Date;
  };

  // Payment
  payment: {
    method: string;
    status: PaymentStatus;
    paid_at?: Date;
    transaction_id?: string;
  };

  // Totals
  subtotal: number;
  shipping_cost: number;
  discount: number;
  tax: number;
  total: number;

  // Unified status
  status: UnifiedOrderStatus;

  // Internal mapping
  sale_id?: string; // ID da venda interna criada
  processed: boolean;
  processing_errors?: string[];

  // Import
  imported_at: Date;
  imported_by?: string;

  // Dates
  order_date: Date;
  created_at: Date;
  updated_at: Date;
}

export interface UnifiedOrderItem {
  id: string;
  product_id?: string; // Internal product ID
  external_product_id: string;
  product_name: string;
  sku: string;
  quantity: number;
  unit_price: number;
  discount: number;
  tax: number;
  total: number;

  // Listing reference
  listing_id?: string;
}

export interface ShippingAddress {
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  reference?: string;
}

// ============================================================================
// SYNC STRATEGIES
// ============================================================================

export type ProductSelectionType = 'all' | 'category' | 'custom' | 'tag';
export type PriceStrategyType = 'same' | 'markup' | 'markdown' | 'custom';
export type ConflictResolutionType = 'manual' | 'system_wins' | 'marketplace_wins' | 'average';

export interface SyncStrategy {
  id: string;
  name: string;
  workspace_id: number;

  // Product selection
  product_selection: ProductSelectionType;
  category_ids?: string[];
  product_ids?: string[];
  tags?: string[];

  // Rules
  rules: {
    // Stock
    minimum_stock_to_publish: number;
    reserve_stock_percentage: number; // % to reserve
    auto_pause_on_low_stock: boolean;
    low_stock_threshold: number;

    // Price
    price_strategy: PriceStrategyType;
    markup_percentage?: number;
    markdown_percentage?: number;
    custom_prices?: Record<string, number>; // product_id -> price
    round_prices: boolean;
    round_to?: number; // e.g., 0.99

    // Content
    use_custom_title: boolean;
    title_template?: string; // e.g., "{product_name} - {brand}"
    use_custom_description: boolean;
    append_to_description?: string;

    // Images
    optimize_images: boolean;
    max_images: number;
  };

  // Target marketplaces
  target_marketplaces: string[];

  // Schedule
  auto_sync_enabled: boolean;
  sync_frequency: number; // minutes

  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface SyncConflict {
  id: string;
  type: 'stock_discrepancy' | 'price_mismatch' | 'product_not_found' | 'duplicate_listing' | 'data_conflict';

  // Details
  product_id: string;
  product_name: string;
  listing_id?: string;
  marketplace_integration_id: string;
  marketplace: MarketplaceType;

  // Values
  system_value: any;
  marketplace_value: any;
  field_name: string;

  // Resolution
  resolution_strategy: ConflictResolutionType;
  resolved: boolean;
  resolved_at?: Date;
  resolved_by?: string;
  resolution_notes?: string;

  // Severity
  severity: 'low' | 'medium' | 'high' | 'critical';
  auto_resolvable: boolean;

  created_at: Date;
}

export interface SyncJob {
  id: string;
  workspace_id: number;
  marketplace_integration_id: string;
  marketplace: MarketplaceType;

  // Job details
  type: 'full_sync' | 'incremental' | 'stock_only' | 'prices_only' | 'orders_only';
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';

  // Progress
  total_items: number;
  processed_items: number;
  successful_items: number;
  failed_items: number;
  progress_percentage: number;

  // Results
  result: {
    products_created: number;
    products_updated: number;
    listings_created: number;
    listings_updated: number;
    orders_imported: number;
    stock_synced: number;
    errors: SyncError[];
  };

  // Timing
  started_at?: Date;
  completed_at?: Date;
  duration_seconds?: number;

  // Error handling
  error_message?: string;
  retry_count: number;
  max_retries: number;

  created_at: Date;
  updated_at: Date;
}

export interface SyncError {
  item_id: string;
  item_type: 'product' | 'listing' | 'order' | 'stock';
  error_code: string;
  error_message: string;
  retry_possible: boolean;
}

// ============================================================================
// MARKETPLACE ANALYTICS
// ============================================================================

export interface MarketplacePerformance {
  marketplace_integration_id: string;
  marketplace: MarketplaceType;
  period_start: Date;
  period_end: Date;

  // Sales metrics
  total_orders: number;
  total_revenue: number;
  avg_order_value: number;
  items_sold: number;

  // Growth
  revenue_growth: number; // % vs previous period
  orders_growth: number;

  // Listings
  total_listings: number;
  active_listings: number;
  out_of_stock_listings: number;

  // Performance
  conversion_rate: number; // %
  avg_views_per_listing: number;
  avg_sales_per_listing: number;

  // Issues
  sync_errors: number;
  conflicts: number;
  failed_orders: number;

  // Top products
  top_products: {
    product_id: string;
    product_name: string;
    quantity_sold: number;
    revenue: number;
  }[];
}

export interface ChannelComparison {
  period_start: Date;
  period_end: Date;

  channels: {
    marketplace: MarketplaceType;
    name: string;

    // Sales
    orders: number;
    revenue: number;
    revenue_percentage: number;

    // Efficiency
    avg_order_value: number;
    conversion_rate: number;

    // Costs
    fees: number;
    net_revenue: number;
    profit_margin: number;
  }[];

  // Overall
  total_revenue: number;
  total_orders: number;
  best_performing_channel: MarketplaceType;
  worst_performing_channel: MarketplaceType;
}

// ============================================================================
// CATALOG MANAGEMENT
// ============================================================================

export interface BulkPublishJob {
  id: string;
  workspace_id: number;
  name: string;

  // Products
  product_ids: string[];
  total_products: number;

  // Target marketplaces
  target_marketplaces: string[];

  // Settings
  sync_strategy_id?: string;
  price_adjustment?: {
    type: 'percentage' | 'fixed';
    value: number;
  };

  // Status
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: {
    total: number;
    published: number;
    failed: number;
    percentage: number;
  };

  // Results
  results: {
    marketplace: MarketplaceType;
    successful: number;
    failed: number;
    errors: string[];
  }[];

  started_at?: Date;
  completed_at?: Date;
  created_at: Date;
}

export interface PriceRule {
  id: string;
  workspace_id: number;
  name: string;

  // Application
  applies_to: 'all' | 'category' | 'products' | 'marketplace';
  category_ids?: string[];
  product_ids?: string[];
  marketplace_ids?: string[];

  // Rule
  rule_type: 'markup' | 'markdown' | 'fixed' | 'dynamic';
  value: number;

  // Dynamic pricing
  dynamic_conditions?: {
    based_on: 'stock_level' | 'competition' | 'demand' | 'time';
    min_price?: number;
    max_price?: number;
    rules: {
      condition: string;
      adjustment: number;
    }[];
  };

  // Schedule
  start_date?: Date;
  end_date?: Date;
  active: boolean;

  // Priority
  priority: number; // Higher number = higher priority

  created_at: Date;
  updated_at: Date;
}

export interface StockReservation {
  id: string;
  product_id: string;
  marketplace_integration_id: string;
  marketplace: MarketplaceType;

  quantity_reserved: number;
  reason: 'pending_order' | 'manual' | 'safety_stock';

  expires_at?: Date;
  released: boolean;
  released_at?: Date;

  created_at: Date;
}

// ============================================================================
// DASHBOARD & WIDGETS
// ============================================================================

export interface MarketplaceDashboard {
  workspace_id: number;
  period: {
    start: Date;
    end: Date;
  };

  // Overview
  overview: {
    total_integrations: number;
    active_integrations: number;
    total_listings: number;
    active_listings: number;
    total_orders: number;
    total_revenue: number;
  };

  // Recent activity
  recent_orders: UnifiedOrder[];
  recent_syncs: SyncJob[];
  pending_conflicts: number;

  // Alerts
  alerts: {
    type: 'error' | 'warning' | 'info';
    message: string;
    marketplace?: MarketplaceType;
    action_required: boolean;
    created_at: Date;
  }[];

  // Quick stats
  stats: {
    orders_today: number;
    revenue_today: number;
    sync_errors_today: number;
    avg_sync_time: number; // seconds
  };
}
