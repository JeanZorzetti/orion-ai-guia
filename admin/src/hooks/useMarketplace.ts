/**
 * Marketplace Hook - Unified Omnichannel Management
 */

import { useState, useCallback, useMemo } from 'react';
import { addDays, subDays, differenceInDays } from 'date-fns';
import {
  MarketplaceIntegration,
  ProductListing,
  UnifiedOrder,
  SyncJob,
  SyncConflict,
  MarketplacePerformance,
  MarketplaceDashboard,
  MarketplaceType,
  SyncStatus,
  ListingStatus,
  UnifiedOrderStatus,
} from '@/types/marketplace';

// ============================================================================
// MOCK DATA GENERATORS
// ============================================================================

const generateMockIntegrations = (): MarketplaceIntegration[] => {
  const hoje = new Date();
  const marketplaces: { type: MarketplaceType; name: string }[] = [
    { type: 'mercado_livre', name: 'Mercado Livre' },
    { type: 'shopify', name: 'Loja Shopify' },
    { type: 'magalu', name: 'Magazine Luiza' },
    { type: 'amazon', name: 'Amazon Brasil' },
    { type: 'tiktok_shop', name: 'TikTok Shop' },
  ];

  return marketplaces.map((mp, i) => ({
    id: `integration-${i + 1}`,
    workspace_id: 1,
    marketplace: mp.type,
    name: mp.name,
    credentials: {
      client_id: `client_${i + 1}`,
      client_secret: `secret_${i + 1}`,
      access_token: `token_${i + 1}`,
    },
    is_active: i < 3, // First 3 active
    auto_sync: i < 3,
    sync_frequency: 30,
    default_warehouse_id: 'wh-1',
    price_adjustment: {
      type: 'percentage',
      value: i === 0 ? 10 : i === 1 ? 5 : 0,
    },
    sync_products: true,
    sync_orders: true,
    sync_stock: true,
    last_sync_at: i < 3 ? subDays(hoje, Math.random() * 0.5) : undefined,
    last_sync_status: i < 3 ? 'success' : 'pending',
    last_sync_summary: i < 3 ? {
      products_synced: Math.floor(Math.random() * 100) + 50,
      orders_imported: Math.floor(Math.random() * 30) + 10,
      stock_updated: Math.floor(Math.random() * 150) + 100,
      errors: Math.floor(Math.random() * 5),
    } : undefined,
    total_listings: Math.floor(Math.random() * 200) + 100,
    active_listings: Math.floor(Math.random() * 150) + 80,
    total_orders: Math.floor(Math.random() * 500) + 200,
    total_revenue: (Math.random() * 100000) + 50000,
    created_at: subDays(hoje, 30 + i * 10),
    updated_at: hoje,
  }));
};

const generateMockListings = (integrations: MarketplaceIntegration[]): ProductListing[] => {
  const hoje = new Date();
  const statuses: ListingStatus[] = ['active', 'paused', 'out_of_stock', 'error'];

  const listings: ProductListing[] = [];

  integrations.filter(i => i.is_active).forEach((integration, intIdx) => {
    const count = 30 + Math.floor(Math.random() * 20);

    for (let i = 0; i < count; i++) {
      const status = statuses[Math.floor(Math.random() * 100) < 80 ? 0 : Math.floor(Math.random() * 4)];
      const price = 50 + Math.random() * 450;
      const stockQty = Math.floor(Math.random() * 100);

      listings.push({
        id: `listing-${intIdx}-${i + 1}`,
        product_id: `prod-${Math.floor(Math.random() * 100) + 1}`,
        product_name: `Produto ${Math.floor(Math.random() * 100) + 1}`,
        product_sku: `SKU-${Math.floor(Math.random() * 10000)}`,
        marketplace_integration_id: integration.id,
        marketplace: integration.marketplace,
        external_id: `EXT-${Math.floor(Math.random() * 1000000)}`,
        external_sku: `ML${Math.floor(Math.random() * 10000)}`,
        listing_url: `https://${integration.marketplace}.com/product/${i + 1}`,
        price,
        original_price: Math.random() > 0.7 ? price * 1.2 : undefined,
        stock_quantity: stockQty,
        status,
        is_synced: status === 'active',
        sync_enabled: true,
        title: Math.random() > 0.5 ? `Título Customizado ${i + 1}` : undefined,
        views: Math.floor(Math.random() * 1000) + 100,
        sales: Math.floor(Math.random() * 50),
        conversion_rate: 1 + Math.random() * 5,
        revenue: price * Math.floor(Math.random() * 50),
        free_shipping: Math.random() > 0.5,
        last_synced_at: status === 'active' ? subDays(hoje, Math.random()) : undefined,
        sync_errors: status === 'error' ? ['Erro ao sincronizar preço'] : undefined,
        pending_changes: Math.random() > 0.8,
        created_at: subDays(hoje, 30 + i),
        updated_at: hoje,
      });
    }
  });

  return listings;
};

const generateMockOrders = (integrations: MarketplaceIntegration[]): UnifiedOrder[] => {
  const hoje = new Date();
  const statuses: UnifiedOrderStatus[] = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];

  const orders: UnifiedOrder[] = [];

  integrations.filter(i => i.is_active).forEach((integration, intIdx) => {
    const count = 15 + Math.floor(Math.random() * 10);

    for (let i = 0; i < count; i++) {
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      const itemCount = 1 + Math.floor(Math.random() * 4);
      const subtotal = (50 + Math.random() * 450) * itemCount;
      const shippingCost = 10 + Math.random() * 30;

      orders.push({
        id: `order-${intIdx}-${i + 1}`,
        workspace_id: 1,
        marketplace_integration_id: integration.id,
        marketplace: integration.marketplace,
        marketplace_name: integration.name,
        external_order_id: `EXT-ORD-${Math.floor(Math.random() * 1000000)}`,
        external_order_number: `#${Math.floor(Math.random() * 100000)}`,
        customer: {
          name: `Cliente ${Math.floor(Math.random() * 1000)}`,
          email: `cliente${i}@email.com`,
          phone: `(11) 9${String(Math.floor(Math.random() * 100000000)).padStart(8, '0')}`,
          document: `${String(Math.floor(Math.random() * 100000000000)).padStart(11, '0')}`,
        },
        items: Array.from({ length: itemCount }, (_, j) => ({
          id: `item-${intIdx}-${i}-${j}`,
          product_id: `prod-${Math.floor(Math.random() * 100) + 1}`,
          external_product_id: `EXT-PROD-${Math.floor(Math.random() * 100000)}`,
          product_name: `Produto ${Math.floor(Math.random() * 100) + 1}`,
          sku: `SKU-${Math.floor(Math.random() * 10000)}`,
          quantity: 1 + Math.floor(Math.random() * 3),
          unit_price: 50 + Math.random() * 450,
          discount: Math.random() * 20,
          tax: Math.random() * 10,
          total: (50 + Math.random() * 450) * (1 + Math.floor(Math.random() * 3)),
        })),
        shipping: {
          method: ['PAC', 'SEDEX', 'Entrega Rápida'][Math.floor(Math.random() * 3)],
          cost: shippingCost,
          address: {
            street: `Rua ${Math.floor(Math.random() * 1000)}`,
            number: String(100 + Math.floor(Math.random() * 900)),
            neighborhood: 'Centro',
            city: 'São Paulo',
            state: 'SP',
            postal_code: `01${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}-000`,
            country: 'BR',
          },
          tracking_code: status !== 'pending' ? `BR${String(Math.floor(Math.random() * 1000000000)).padStart(9, '0')}BR` : undefined,
          estimated_delivery: addDays(hoje, 3 + Math.floor(Math.random() * 7)),
        },
        payment: {
          method: ['Cartão de Crédito', 'PIX', 'Boleto'][Math.floor(Math.random() * 3)],
          status: status === 'cancelled' ? 'rejected' : 'approved',
          paid_at: status !== 'pending' ? subDays(hoje, Math.random() * 5) : undefined,
          transaction_id: `TXN-${Math.floor(Math.random() * 1000000)}`,
        },
        subtotal,
        shipping_cost: shippingCost,
        discount: Math.random() * 50,
        tax: subtotal * 0.1,
        total: subtotal + shippingCost,
        status,
        processed: status !== 'pending',
        sale_id: status !== 'pending' ? `sale-${i + 1}` : undefined,
        imported_at: subDays(hoje, Math.random() * 10),
        order_date: subDays(hoje, Math.random() * 15),
        created_at: subDays(hoje, Math.random() * 15),
        updated_at: hoje,
      });
    }
  });

  return orders.sort((a, b) => b.order_date.getTime() - a.order_date.getTime());
};

const generateMockSyncJobs = (integrations: MarketplaceIntegration[]): SyncJob[] => {
  const hoje = new Date();
  const jobs: SyncJob[] = [];

  integrations.filter(i => i.is_active).forEach((integration, intIdx) => {
    for (let i = 0; i < 5; i++) {
      const status = i === 0 ? 'running' : i < 3 ? 'completed' : 'failed';
      const totalItems = 100 + Math.floor(Math.random() * 200);
      const processedItems = status === 'running' ? Math.floor(totalItems * 0.6) : totalItems;

      jobs.push({
        id: `job-${intIdx}-${i + 1}`,
        workspace_id: 1,
        marketplace_integration_id: integration.id,
        marketplace: integration.marketplace,
        type: ['full_sync', 'incremental', 'stock_only', 'orders_only'][Math.floor(Math.random() * 4)] as any,
        status: status as any,
        total_items: totalItems,
        processed_items: processedItems,
        successful_items: processedItems - Math.floor(Math.random() * 10),
        failed_items: Math.floor(Math.random() * 10),
        progress_percentage: (processedItems / totalItems) * 100,
        result: {
          products_created: Math.floor(Math.random() * 20),
          products_updated: Math.floor(Math.random() * 80),
          listings_created: Math.floor(Math.random() * 30),
          listings_updated: Math.floor(Math.random() * 70),
          orders_imported: Math.floor(Math.random() * 40),
          stock_synced: Math.floor(Math.random() * 100),
          errors: [],
        },
        started_at: subDays(hoje, Math.random() * 2),
        completed_at: status !== 'running' ? subDays(hoje, Math.random()) : undefined,
        duration_seconds: status !== 'running' ? Math.floor(Math.random() * 300) + 60 : undefined,
        retry_count: 0,
        max_retries: 3,
        created_at: subDays(hoje, Math.random() * 2),
        updated_at: hoje,
      });
    }
  });

  return jobs.sort((a, b) => (b.started_at?.getTime() || 0) - (a.started_at?.getTime() || 0));
};

const generateMockConflicts = (listings: ProductListing[]): SyncConflict[] => {
  const hoje = new Date();
  const conflicts: SyncConflict[] = [];

  const problematicListings = listings.filter(l => Math.random() > 0.9).slice(0, 10);

  problematicListings.forEach((listing, i) => {
    conflicts.push({
      id: `conflict-${i + 1}`,
      type: ['stock_discrepancy', 'price_mismatch', 'data_conflict'][Math.floor(Math.random() * 3)] as any,
      product_id: listing.product_id,
      product_name: listing.product_name,
      listing_id: listing.id,
      marketplace_integration_id: listing.marketplace_integration_id,
      marketplace: listing.marketplace,
      system_value: listing.price,
      marketplace_value: listing.price * 1.1,
      field_name: 'price',
      resolution_strategy: 'manual',
      resolved: Math.random() > 0.5,
      resolved_at: Math.random() > 0.5 ? subDays(hoje, Math.random()) : undefined,
      severity: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)] as any,
      auto_resolvable: Math.random() > 0.5,
      created_at: subDays(hoje, Math.random() * 5),
    });
  });

  return conflicts;
};

// ============================================================================
// HOOK
// ============================================================================

interface UseMarketplaceReturn {
  // Integrations
  integrations: MarketplaceIntegration[];
  activeIntegrations: MarketplaceIntegration[];
  inactiveIntegrations: MarketplaceIntegration[];
  getIntegration: (id: string) => MarketplaceIntegration | undefined;
  toggleIntegration: (id: string) => void;
  syncIntegration: (id: string) => void;

  // Listings
  listings: ProductListing[];
  activeListings: ProductListing[];
  pausedListings: ProductListing[];
  errorListings: ProductListing[];
  getListingsByMarketplace: (marketplace: MarketplaceType) => ProductListing[];
  updateListingPrice: (listingId: string, price: number) => void;
  updateListingStock: (listingId: string, stock: number) => void;
  pauseListing: (listingId: string) => void;
  activateListing: (listingId: string) => void;

  // Orders
  orders: UnifiedOrder[];
  pendingOrders: UnifiedOrder[];
  processingOrders: UnifiedOrder[];
  completedOrders: UnifiedOrder[];
  getOrdersByMarketplace: (marketplace: MarketplaceType) => UnifiedOrder[];
  processOrder: (orderId: string) => void;
  cancelOrder: (orderId: string) => void;

  // Sync
  syncJobs: SyncJob[];
  runningJobs: SyncJob[];
  completedJobs: SyncJob[];
  startSync: (integrationId: string, type: 'full_sync' | 'incremental' | 'stock_only' | 'orders_only') => void;

  // Conflicts
  conflicts: SyncConflict[];
  unresolvedConflicts: SyncConflict[];
  resolveConflict: (conflictId: string, strategy: 'system_wins' | 'marketplace_wins') => void;

  // Dashboard
  dashboard: MarketplaceDashboard;
  performance: MarketplacePerformance[];

  loading: boolean;
}

export const useMarketplace = (): UseMarketplaceReturn => {
  const [integrations, setIntegrations] = useState<MarketplaceIntegration[]>(() => generateMockIntegrations());
  const [listings, setListings] = useState<ProductListing[]>(() => generateMockListings(generateMockIntegrations()));
  const [orders, setOrders] = useState<UnifiedOrder[]>(() => generateMockOrders(generateMockIntegrations()));
  const [syncJobs, setSyncJobs] = useState<SyncJob[]>(() => generateMockSyncJobs(generateMockIntegrations()));
  const [conflicts, setConflicts] = useState<SyncConflict[]>(() => generateMockConflicts(listings));
  const [loading] = useState(false);

  // Integration filters
  const activeIntegrations = useMemo(() =>
    integrations.filter(i => i.is_active),
    [integrations]
  );

  const inactiveIntegrations = useMemo(() =>
    integrations.filter(i => !i.is_active),
    [integrations]
  );

  const getIntegration = useCallback((id: string) =>
    integrations.find(i => i.id === id),
    [integrations]
  );

  // Listing filters
  const activeListings = useMemo(() =>
    listings.filter(l => l.status === 'active'),
    [listings]
  );

  const pausedListings = useMemo(() =>
    listings.filter(l => l.status === 'paused'),
    [listings]
  );

  const errorListings = useMemo(() =>
    listings.filter(l => l.status === 'error'),
    [listings]
  );

  const getListingsByMarketplace = useCallback((marketplace: MarketplaceType) =>
    listings.filter(l => l.marketplace === marketplace),
    [listings]
  );

  // Order filters
  const pendingOrders = useMemo(() =>
    orders.filter(o => o.status === 'pending'),
    [orders]
  );

  const processingOrders = useMemo(() =>
    orders.filter(o => o.status === 'processing' || o.status === 'shipped'),
    [orders]
  );

  const completedOrders = useMemo(() =>
    orders.filter(o => o.status === 'delivered'),
    [orders]
  );

  const getOrdersByMarketplace = useCallback((marketplace: MarketplaceType) =>
    orders.filter(o => o.marketplace === marketplace),
    [orders]
  );

  // Sync job filters
  const runningJobs = useMemo(() =>
    syncJobs.filter(j => j.status === 'running'),
    [syncJobs]
  );

  const completedJobs = useMemo(() =>
    syncJobs.filter(j => j.status === 'completed'),
    [syncJobs]
  );

  // Conflict filters
  const unresolvedConflicts = useMemo(() =>
    conflicts.filter(c => !c.resolved),
    [conflicts]
  );

  // Actions
  const toggleIntegration = useCallback((id: string) => {
    setIntegrations(prev => prev.map(i =>
      i.id === id ? { ...i, is_active: !i.is_active } : i
    ));
  }, []);

  const syncIntegration = useCallback((id: string) => {
    const integration = integrations.find(i => i.id === id);
    if (!integration) return;

    // Create new sync job
    const newJob: SyncJob = {
      id: `job-${Date.now()}`,
      workspace_id: 1,
      marketplace_integration_id: id,
      marketplace: integration.marketplace,
      type: 'full_sync',
      status: 'running',
      total_items: 150,
      processed_items: 0,
      successful_items: 0,
      failed_items: 0,
      progress_percentage: 0,
      result: {
        products_created: 0,
        products_updated: 0,
        listings_created: 0,
        listings_updated: 0,
        orders_imported: 0,
        stock_synced: 0,
        errors: [],
      },
      started_at: new Date(),
      retry_count: 0,
      max_retries: 3,
      created_at: new Date(),
      updated_at: new Date(),
    };

    setSyncJobs(prev => [newJob, ...prev]);
  }, [integrations]);

  const updateListingPrice = useCallback((listingId: string, price: number) => {
    setListings(prev => prev.map(l =>
      l.id === listingId ? { ...l, price, pending_changes: true, updated_at: new Date() } : l
    ));
  }, []);

  const updateListingStock = useCallback((listingId: string, stock: number) => {
    setListings(prev => prev.map(l =>
      l.id === listingId ? { ...l, stock_quantity: stock, pending_changes: true, updated_at: new Date() } : l
    ));
  }, []);

  const pauseListing = useCallback((listingId: string) => {
    setListings(prev => prev.map(l =>
      l.id === listingId ? { ...l, status: 'paused', updated_at: new Date() } : l
    ));
  }, []);

  const activateListing = useCallback((listingId: string) => {
    setListings(prev => prev.map(l =>
      l.id === listingId ? { ...l, status: 'active', updated_at: new Date() } : l
    ));
  }, []);

  const processOrder = useCallback((orderId: string) => {
    setOrders(prev => prev.map(o =>
      o.id === orderId ? { ...o, status: 'processing', processed: true, updated_at: new Date() } : o
    ));
  }, []);

  const cancelOrder = useCallback((orderId: string) => {
    setOrders(prev => prev.map(o =>
      o.id === orderId ? { ...o, status: 'cancelled', updated_at: new Date() } : o
    ));
  }, []);

  const startSync = useCallback((integrationId: string, type: 'full_sync' | 'incremental' | 'stock_only' | 'orders_only') => {
    syncIntegration(integrationId);
  }, [syncIntegration]);

  const resolveConflict = useCallback((conflictId: string, strategy: 'system_wins' | 'marketplace_wins') => {
    setConflicts(prev => prev.map(c =>
      c.id === conflictId
        ? { ...c, resolved: true, resolved_at: new Date(), resolution_strategy: strategy }
        : c
    ));
  }, []);

  // Dashboard
  const dashboard = useMemo((): MarketplaceDashboard => {
    const hoje = new Date();
    const ordersToday = orders.filter(o => differenceInDays(hoje, o.order_date) === 0);
    const revenueToday = ordersToday.reduce((sum, o) => sum + o.total, 0);

    return {
      workspace_id: 1,
      period: {
        start: subDays(hoje, 30),
        end: hoje,
      },
      overview: {
        total_integrations: integrations.length,
        active_integrations: activeIntegrations.length,
        total_listings: listings.length,
        active_listings: activeListings.length,
        total_orders: orders.length,
        total_revenue: orders.reduce((sum, o) => sum + o.total, 0),
      },
      recent_orders: orders.slice(0, 5),
      recent_syncs: syncJobs.slice(0, 5),
      pending_conflicts: unresolvedConflicts.length,
      alerts: unresolvedConflicts.slice(0, 3).map(c => ({
        type: 'warning' as const,
        message: `Conflito de ${c.field_name} no produto ${c.product_name}`,
        marketplace: c.marketplace,
        action_required: true,
        created_at: c.created_at,
      })),
      stats: {
        orders_today: ordersToday.length,
        revenue_today: revenueToday,
        sync_errors_today: syncJobs.filter(j => j.status === 'failed').length,
        avg_sync_time: 120,
      },
    };
  }, [integrations, activeIntegrations, listings, activeListings, orders, syncJobs, unresolvedConflicts]);

  // Performance by marketplace
  const performance = useMemo((): MarketplacePerformance[] => {
    const hoje = new Date();
    const periodStart = subDays(hoje, 30);

    return activeIntegrations.map(integration => {
      const integrationOrders = orders.filter(o => o.marketplace_integration_id === integration.id);
      const integrationListings = listings.filter(l => l.marketplace_integration_id === integration.id);
      const totalRevenue = integrationOrders.reduce((sum, o) => sum + o.total, 0);

      return {
        marketplace_integration_id: integration.id,
        marketplace: integration.marketplace,
        period_start: periodStart,
        period_end: hoje,
        total_orders: integrationOrders.length,
        total_revenue: totalRevenue,
        avg_order_value: integrationOrders.length > 0 ? totalRevenue / integrationOrders.length : 0,
        items_sold: integrationOrders.reduce((sum, o) => sum + o.items.reduce((s, i) => s + i.quantity, 0), 0),
        revenue_growth: 15.5,
        orders_growth: 12.3,
        total_listings: integrationListings.length,
        active_listings: integrationListings.filter(l => l.status === 'active').length,
        out_of_stock_listings: integrationListings.filter(l => l.status === 'out_of_stock').length,
        conversion_rate: 2.5,
        avg_views_per_listing: integrationListings.reduce((sum, l) => sum + l.views, 0) / integrationListings.length,
        avg_sales_per_listing: integrationListings.reduce((sum, l) => sum + l.sales, 0) / integrationListings.length,
        sync_errors: Math.floor(Math.random() * 10),
        conflicts: conflicts.filter(c => c.marketplace_integration_id === integration.id).length,
        failed_orders: integrationOrders.filter(o => o.status === 'cancelled').length,
        top_products: [],
      };
    });
  }, [activeIntegrations, orders, listings, conflicts]);

  return {
    // Integrations
    integrations,
    activeIntegrations,
    inactiveIntegrations,
    getIntegration,
    toggleIntegration,
    syncIntegration,

    // Listings
    listings,
    activeListings,
    pausedListings,
    errorListings,
    getListingsByMarketplace,
    updateListingPrice,
    updateListingStock,
    pauseListing,
    activateListing,

    // Orders
    orders,
    pendingOrders,
    processingOrders,
    completedOrders,
    getOrdersByMarketplace,
    processOrder,
    cancelOrder,

    // Sync
    syncJobs,
    runningJobs,
    completedJobs,
    startSync,

    // Conflicts
    conflicts,
    unresolvedConflicts,
    resolveConflict,

    // Dashboard
    dashboard,
    performance,

    loading,
  };
};
