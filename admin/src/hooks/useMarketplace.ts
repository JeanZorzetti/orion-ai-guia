/**
 * Marketplace Hook - Unified Omnichannel Management
 * Integrated with real backend API - NO MOCK DATA
 */

import { useState, useCallback, useMemo, useEffect } from 'react';
import { api } from '@/lib/api';
import {
  MarketplaceIntegration,
  ProductListing,
  UnifiedOrder,
  SyncJob,
  SyncConflict,
  MarketplacePerformance,
  MarketplaceDashboard,
  MarketplaceType,
} from '@/types/marketplace';

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

interface MarketplaceIntegrationAPI {
  id: number;
  workspace_id: number;
  marketplace: string;
  name: string;
  is_active: boolean;
  auto_sync: boolean;
  sync_frequency: number;
  last_sync_at: string | null;
  last_sync_status: string;
  last_sync_summary: {
    products_synced: number;
    orders_imported: number;
    stock_updated: number;
    errors: number;
  } | null;
  total_listings: number;
  active_listings: number;
  total_orders: number;
  total_revenue: number;
  created_at: string;
  updated_at: string;
}

interface ProductListingAPI {
  id: number;
  product_id: number;
  product_name: string;
  product_sku: string;
  marketplace_integration_id: number;
  marketplace: string;
  external_id: string;
  external_sku: string | null;
  listing_url: string | null;
  price: number;
  original_price: number | null;
  stock_quantity: number;
  status: string;
  views: number;
  sales: number;
  conversion_rate: number;
  revenue: number;
  free_shipping: boolean;
  last_synced_at: string | null;
  pending_changes: boolean;
  created_at: string;
  updated_at: string;
}

interface UnifiedOrderAPI {
  id: number;
  workspace_id: number;
  marketplace_integration_id: number;
  marketplace: string;
  marketplace_name: string;
  external_order_id: string;
  external_order_number: string;
  customer: any;
  items: any[];
  shipping: any;
  payment: any;
  subtotal: number;
  shipping_cost: number;
  discount: number;
  tax: number;
  total: number;
  status: string;
  processed: boolean;
  sale_id: number | null;
  order_date: string;
  created_at: string;
  updated_at: string;
}

interface SyncJobAPI {
  id: number;
  workspace_id: number;
  marketplace_integration_id: number;
  marketplace: string;
  type: string;
  status: string;
  total_items: number;
  processed_items: number;
  successful_items: number;
  failed_items: number;
  progress_percentage: number;
  result: any;
  started_at: string;
  completed_at: string | null;
  duration_seconds: number | null;
  created_at: string;
  updated_at: string;
}

interface SyncConflictAPI {
  id: number;
  type: string;
  product_id: number;
  product_name: string;
  listing_id: number | null;
  marketplace_integration_id: number;
  marketplace: string;
  field_name: string;
  system_value: string;
  marketplace_value: string;
  resolution_strategy: string;
  resolved: boolean;
  resolved_at: string | null;
  severity: string;
  auto_resolvable: boolean;
  created_at: string;
}

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
  refresh: () => void;
}

export const useMarketplace = (): UseMarketplaceReturn => {
  const [integrations, setIntegrations] = useState<MarketplaceIntegration[]>([]);
  const [listings, setListings] = useState<ProductListing[]>([]);
  const [orders, setOrders] = useState<UnifiedOrder[]>([]);
  const [syncJobs, setSyncJobs] = useState<SyncJob[]>([]);
  const [conflicts, setConflicts] = useState<SyncConflict[]>([]);
  const [dashboard, setDashboard] = useState<MarketplaceDashboard>({
    workspace_id: 0,
    period: { start: new Date(), end: new Date() },
    overview: {
      total_integrations: 0,
      active_integrations: 0,
      total_listings: 0,
      active_listings: 0,
      total_orders: 0,
      total_revenue: 0,
    },
    recent_orders: [],
    recent_syncs: [],
    pending_conflicts: 0,
    alerts: [],
    stats: {
      orders_today: 0,
      revenue_today: 0,
      sync_errors_today: 0,
      avg_sync_time: 0,
    },
  });
  const [performance, setPerformance] = useState<MarketplacePerformance[]>([]);
  const [loading, setLoading] = useState(true);

  // ============================================================================
  // API FETCH FUNCTIONS
  // ============================================================================

  const fetchIntegrations = useCallback(async () => {
    console.log('🔄 [useMarketplace] Buscando integrações da API');
    try {
      const response = await api.get<MarketplaceIntegrationAPI[]>('/marketplace/integrations');
      console.log('✅ [useMarketplace] Integrações recebidas:', response.length);

      const converted: MarketplaceIntegration[] = response.map(i => ({
        id: i.id.toString(),
        workspace_id: i.workspace_id,
        marketplace: i.marketplace as MarketplaceType,
        name: i.name,
        credentials: {},
        is_active: i.is_active,
        auto_sync: i.auto_sync,
        sync_frequency: i.sync_frequency,
        default_warehouse_id: '',
        price_adjustment: { type: 'percentage', value: 0 },
        sync_products: true,
        sync_orders: true,
        sync_stock: true,
        last_sync_at: i.last_sync_at ? new Date(i.last_sync_at) : undefined,
        last_sync_status: i.last_sync_status as any,
        last_sync_summary: i.last_sync_summary || undefined,
        total_listings: i.total_listings,
        active_listings: i.active_listings,
        total_orders: i.total_orders,
        total_revenue: i.total_revenue,
        created_at: new Date(i.created_at),
        updated_at: new Date(i.updated_at),
      }));

      setIntegrations(converted);
    } catch (err) {
      console.error('❌ [useMarketplace] Erro ao buscar integrações:', err);
      setIntegrations([]); // NO FALLBACK - empty array
    }
  }, []);

  const fetchListings = useCallback(async () => {
    console.log('🔄 [useMarketplace] Buscando anúncios da API');
    try {
      const response = await api.get<ProductListingAPI[]>('/marketplace/listings');
      console.log('✅ [useMarketplace] Anúncios recebidos:', response.length);

      const converted: ProductListing[] = response.map(l => ({
        id: l.id.toString(),
        product_id: l.product_id.toString(),
        product_name: l.product_name,
        product_sku: l.product_sku,
        marketplace_integration_id: l.marketplace_integration_id.toString(),
        marketplace: l.marketplace as MarketplaceType,
        external_id: l.external_id,
        external_sku: l.external_sku || '',
        listing_url: l.listing_url || '',
        price: l.price,
        original_price: l.original_price || undefined,
        stock_quantity: l.stock_quantity,
        status: l.status as any,
        is_synced: !l.pending_changes,
        sync_enabled: true,
        views: l.views,
        sales: l.sales,
        conversion_rate: l.conversion_rate,
        revenue: l.revenue,
        free_shipping: l.free_shipping,
        last_synced_at: l.last_synced_at ? new Date(l.last_synced_at) : undefined,
        pending_changes: l.pending_changes,
        created_at: new Date(l.created_at),
        updated_at: new Date(l.updated_at),
      }));

      setListings(converted);
    } catch (err) {
      console.error('❌ [useMarketplace] Erro ao buscar anúncios:', err);
      setListings([]); // NO FALLBACK
    }
  }, []);

  const fetchOrders = useCallback(async () => {
    console.log('🔄 [useMarketplace] Buscando pedidos da API');
    try {
      const response = await api.get<UnifiedOrderAPI[]>('/marketplace/orders?limit=100');
      console.log('✅ [useMarketplace] Pedidos recebidos:', response.length);

      const converted: UnifiedOrder[] = response.map(o => ({
        id: o.id.toString(),
        workspace_id: o.workspace_id,
        marketplace_integration_id: o.marketplace_integration_id.toString(),
        marketplace: o.marketplace as MarketplaceType,
        marketplace_name: o.marketplace_name,
        external_order_id: o.external_order_id,
        external_order_number: o.external_order_number,
        customer: o.customer,
        items: o.items,
        shipping: o.shipping,
        payment: o.payment,
        subtotal: o.subtotal,
        shipping_cost: o.shipping_cost,
        discount: o.discount,
        tax: o.tax,
        total: o.total,
        status: o.status as any,
        processed: o.processed,
        sale_id: o.sale_id?.toString(),
        imported_at: new Date(o.created_at),
        order_date: new Date(o.order_date),
        created_at: new Date(o.created_at),
        updated_at: new Date(o.updated_at),
      }));

      setOrders(converted);
    } catch (err) {
      console.error('❌ [useMarketplace] Erro ao buscar pedidos:', err);
      setOrders([]); // NO FALLBACK
    }
  }, []);

  const fetchSyncJobs = useCallback(async () => {
    console.log('🔄 [useMarketplace] Buscando jobs de sincronização da API');
    try {
      const response = await api.get<SyncJobAPI[]>('/marketplace/sync-jobs?limit=50');
      console.log('✅ [useMarketplace] Jobs recebidos:', response.length);

      const converted: SyncJob[] = response.map(j => ({
        id: j.id.toString(),
        workspace_id: j.workspace_id,
        marketplace_integration_id: j.marketplace_integration_id.toString(),
        marketplace: j.marketplace as MarketplaceType,
        type: j.type as any,
        status: j.status as any,
        total_items: j.total_items,
        processed_items: j.processed_items,
        successful_items: j.successful_items,
        failed_items: j.failed_items,
        progress_percentage: j.progress_percentage,
        result: j.result,
        started_at: new Date(j.started_at),
        completed_at: j.completed_at ? new Date(j.completed_at) : undefined,
        duration_seconds: j.duration_seconds || undefined,
        retry_count: 0,
        max_retries: 3,
        created_at: new Date(j.created_at),
        updated_at: new Date(j.updated_at),
      }));

      setSyncJobs(converted);
    } catch (err) {
      console.error('❌ [useMarketplace] Erro ao buscar jobs:', err);
      setSyncJobs([]); // NO FALLBACK
    }
  }, []);

  const fetchConflicts = useCallback(async () => {
    console.log('🔄 [useMarketplace] Buscando conflitos da API');
    try {
      const response = await api.get<SyncConflictAPI[]>('/marketplace/conflicts');
      console.log('✅ [useMarketplace] Conflitos recebidos:', response.length);

      const converted: SyncConflict[] = response.map(c => ({
        id: c.id.toString(),
        type: c.type as any,
        product_id: c.product_id.toString(),
        product_name: c.product_name,
        listing_id: c.listing_id?.toString(),
        marketplace_integration_id: c.marketplace_integration_id.toString(),
        marketplace: c.marketplace as MarketplaceType,
        system_value: c.system_value,
        marketplace_value: c.marketplace_value,
        field_name: c.field_name,
        resolution_strategy: c.resolution_strategy as any,
        resolved: c.resolved,
        resolved_at: c.resolved_at ? new Date(c.resolved_at) : undefined,
        severity: c.severity as any,
        auto_resolvable: c.auto_resolvable,
        created_at: new Date(c.created_at),
      }));

      setConflicts(converted);
    } catch (err) {
      console.error('❌ [useMarketplace] Erro ao buscar conflitos:', err);
      setConflicts([]); // NO FALLBACK
    }
  }, []);

  const fetchDashboard = useCallback(async () => {
    console.log('🔄 [useMarketplace] Buscando dashboard da API');
    try {
      const response = await api.get<any>('/marketplace/dashboard');
      console.log('✅ [useMarketplace] Dashboard recebido');

      setDashboard({
        workspace_id: 0,
        period: {
          start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          end: new Date(),
        },
        overview: response.overview,
        recent_orders: response.recent_orders,
        recent_syncs: response.recent_syncs,
        pending_conflicts: response.pending_conflicts,
        alerts: response.alerts,
        stats: response.stats,
      });
    } catch (err) {
      console.error('❌ [useMarketplace] Erro ao buscar dashboard:', err);
      // Keep default empty dashboard
    }
  }, []);

  const fetchPerformance = useCallback(async () => {
    console.log('🔄 [useMarketplace] Buscando performance da API');
    try {
      const response = await api.get<any[]>('/marketplace/performance');
      console.log('✅ [useMarketplace] Performance recebida');

      const converted: MarketplacePerformance[] = response.map(p => ({
        marketplace_integration_id: p.marketplace_integration_id.toString(),
        marketplace: p.marketplace as MarketplaceType,
        period_start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        period_end: new Date(),
        total_orders: p.total_orders,
        total_revenue: p.total_revenue,
        avg_order_value: p.avg_order_value,
        items_sold: 0,
        revenue_growth: p.revenue_growth,
        orders_growth: p.orders_growth,
        total_listings: p.total_listings,
        active_listings: p.active_listings,
        out_of_stock_listings: 0,
        conversion_rate: p.conversion_rate,
        avg_views_per_listing: 0,
        avg_sales_per_listing: 0,
        sync_errors: 0,
        conflicts: 0,
        failed_orders: 0,
        top_products: [],
      }));

      setPerformance(converted);
    } catch (err) {
      console.error('❌ [useMarketplace] Erro ao buscar performance:', err);
      setPerformance([]); // NO FALLBACK
    }
  }, []);

  // ============================================================================
  // INITIAL LOAD
  // ============================================================================

  const refresh = useCallback(async () => {
    setLoading(true);
    await Promise.all([
      fetchIntegrations(),
      fetchListings(),
      fetchOrders(),
      fetchSyncJobs(),
      fetchConflicts(),
      fetchDashboard(),
      fetchPerformance(),
    ]);
    setLoading(false);
  }, [fetchIntegrations, fetchListings, fetchOrders, fetchSyncJobs, fetchConflicts, fetchDashboard, fetchPerformance]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // ============================================================================
  // COMPUTED VALUES
  // ============================================================================

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

  const runningJobs = useMemo(() =>
    syncJobs.filter(j => j.status === 'running'),
    [syncJobs]
  );

  const completedJobs = useMemo(() =>
    syncJobs.filter(j => j.status === 'completed'),
    [syncJobs]
  );

  const unresolvedConflicts = useMemo(() =>
    conflicts.filter(c => !c.resolved),
    [conflicts]
  );

  // ============================================================================
  // ACTIONS
  // ============================================================================

  const toggleIntegration = useCallback(async (id: string) => {
    console.log('🔄 [useMarketplace] Alternando integração:', id);
    try {
      await api.put(`/marketplace/integrations/${id}/toggle`);
      // Update local state optimistically
      setIntegrations(prev => prev.map(i =>
        i.id === id ? { ...i, is_active: !i.is_active } : i
      ));
    } catch (err) {
      console.error('❌ [useMarketplace] Erro ao alternar integração:', err);
    }
  }, []);

  const syncIntegration = useCallback(async (id: string) => {
    console.log('🔄 [useMarketplace] Sincronizando integração:', id);
    try {
      await api.post(`/marketplace/integrations/${id}/sync`);
      // Refresh sync jobs
      await fetchSyncJobs();
    } catch (err) {
      console.error('❌ [useMarketplace] Erro ao sincronizar integração:', err);
    }
  }, [fetchSyncJobs]);

  const updateListingPrice = useCallback((listingId: string, price: number) => {
    console.warn('updateListingPrice: Não implementado');
    // TODO: Chamar API para atualizar preço
    setListings(prev => prev.map(l =>
      l.id === listingId ? { ...l, price, pending_changes: true, updated_at: new Date() } : l
    ));
  }, []);

  const updateListingStock = useCallback((listingId: string, stock: number) => {
    console.warn('updateListingStock: Não implementado');
    // TODO: Chamar API para atualizar estoque
    setListings(prev => prev.map(l =>
      l.id === listingId ? { ...l, stock_quantity: stock, pending_changes: true, updated_at: new Date() } : l
    ));
  }, []);

  const pauseListing = useCallback(async (listingId: string) => {
    console.log('🔄 [useMarketplace] Pausando anúncio:', listingId);
    try {
      await api.put(`/marketplace/listings/${listingId}/pause`);
      setListings(prev => prev.map(l =>
        l.id === listingId ? { ...l, status: 'paused', updated_at: new Date() } : l
      ));
    } catch (err) {
      console.error('❌ [useMarketplace] Erro ao pausar anúncio:', err);
    }
  }, []);

  const activateListing = useCallback(async (listingId: string) => {
    console.log('🔄 [useMarketplace] Ativando anúncio:', listingId);
    try {
      await api.put(`/marketplace/listings/${listingId}/activate`);
      setListings(prev => prev.map(l =>
        l.id === listingId ? { ...l, status: 'active', updated_at: new Date() } : l
      ));
    } catch (err) {
      console.error('❌ [useMarketplace] Erro ao ativar anúncio:', err);
    }
  }, []);

  const processOrder = useCallback(async (orderId: string) => {
    console.log('🔄 [useMarketplace] Processando pedido:', orderId);
    try {
      await api.put(`/marketplace/orders/${orderId}/process`);
      setOrders(prev => prev.map(o =>
        o.id === orderId ? { ...o, status: 'processing', processed: true, updated_at: new Date() } : o
      ));
    } catch (err) {
      console.error('❌ [useMarketplace] Erro ao processar pedido:', err);
    }
  }, []);

  const cancelOrder = useCallback((orderId: string) => {
    console.warn('cancelOrder: Não implementado');
    // TODO: Chamar API para cancelar pedido
    setOrders(prev => prev.map(o =>
      o.id === orderId ? { ...o, status: 'cancelled', updated_at: new Date() } : o
    ));
  }, []);

  const startSync = useCallback((integrationId: string, type: 'full_sync' | 'incremental' | 'stock_only' | 'orders_only') => {
    syncIntegration(integrationId);
  }, [syncIntegration]);

  const resolveConflict = useCallback(async (conflictId: string, strategy: 'system_wins' | 'marketplace_wins') => {
    console.log('🔄 [useMarketplace] Resolvendo conflito:', conflictId, strategy);
    try {
      await api.put(`/marketplace/conflicts/${conflictId}/resolve?strategy=${strategy}`);
      setConflicts(prev => prev.map(c =>
        c.id === conflictId
          ? { ...c, resolved: true, resolved_at: new Date(), resolution_strategy: strategy }
          : c
      ));
    } catch (err) {
      console.error('❌ [useMarketplace] Erro ao resolver conflito:', err);
    }
  }, []);

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
    refresh,
  };
};
