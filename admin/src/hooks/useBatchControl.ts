import { useState, useCallback, useMemo, useEffect } from 'react';
import { api } from '@/lib/api';
import {
  ProductBatch,
  ExpiryAlert,
  BatchMovement,
  BatchFilters,
  InventorySettings
} from '@/types/inventory';

// API Response Types
interface ProductBatchAPI {
  id: number;
  product_id: number;
  batch_number: string;
  manufacturing_date: string;
  expiry_date: string;
  quantity: number;
  cost_price: number;
  supplier_id?: number;
  origin?: string;
  warehouse_id?: number;
  location?: string;
  status: 'active' | 'quarantine' | 'expired' | 'recalled';
  quality_certificate?: string;
  notes?: string;
  days_to_expire: number;
  near_expiry: boolean;
  created_at: string;
  updated_at: string;
}

interface BatchStatsAPI {
  total_batches: number;
  active_batches: number;
  expired_batches: number;
  critical_alerts: number;
  warning_alerts: number;
  total_value: number;
}

interface ExpiryAlertAPI {
  id: string;
  product_id: number;
  product_name: string;
  batch: ProductBatchAPI;
  days_remaining: number;
  quantity: number;
  severity: 'critical' | 'warning' | 'info';
  action_taken: 'none' | 'promotion' | 'donation' | 'disposal';
  resolved: boolean;
  created_at: string;
}

interface BatchMovementAPI {
  id: number;
  batch_id: number;
  type: 'entry' | 'exit' | 'transfer' | 'adjustment';
  quantity: number;
  from_warehouse_id?: number;
  to_warehouse_id?: number;
  reference?: string;
  notes?: string;
  user_id?: number;
  created_at: string;
}

// DEFAULT SETTINGS
const DEFAULT_SETTINGS: InventorySettings = {
  workspace_id: 1,
  stock_valuation_method: 'fifo',
  prefer_near_expiry: true,
  auto_reserve_on_sale: true,
  auto_deduct_on_shipment: true,
  auto_receive_on_delivery: true,
  auto_return_on_cancellation: true,
  prevent_negative_stock: true,
  warn_on_low_stock: true,
  require_batch_for_expiry_products: true,
  require_location: true,
  require_approval_for_transfers: true,
  require_approval_for_adjustments: true,
  approval_threshold: 1000,
  low_stock_threshold_percentage: 20,
  critical_stock_threshold_percentage: 10,
  expiry_warning_days: 30,
  default_inventory_method: 'guided',
  require_double_count_on_discrepancy: true,
  discrepancy_tolerance_percentage: 2,
  updated_at: new Date(),
  updated_by: 'system',
};

interface UseBatchControlReturn {
  // Data
  batches: ProductBatch[];
  filteredBatches: ProductBatch[];
  expiryAlerts: ExpiryAlert[];
  selectedBatch: ProductBatch | null;
  batchMovements: BatchMovement[];
  settings: InventorySettings;

  // Filters
  filters: BatchFilters;
  setFilters: (filters: BatchFilters) => void;
  clearFilters: () => void;

  // CRUD Operations
  selectBatch: (batchId: string | null) => void;
  createBatch: (batch: Omit<ProductBatch, 'id' | 'created_at' | 'updated_at' | 'days_to_expire' | 'near_expiry'>) => void;
  updateBatch: (batchId: string, updates: Partial<ProductBatch>) => void;
  deleteBatch: (batchId: string) => void;

  // Stock Operations (FIFO/LIFO)
  allocateStock: (productId: number, quantity: number, warehouseId: string) => ProductBatch[];
  reserveStock: (productId: number, quantity: number, warehouseId: string, saleId: string) => boolean;
  releaseStock: (productId: number, quantity: number, warehouseId: string, saleId: string) => void;

  // Expiry Management
  resolveAlert: (alertId: string, action: ExpiryAlert['action_taken']) => void;
  checkExpiredBatches: () => ProductBatch[];

  // Movements
  addMovement: (movement: Omit<BatchMovement, 'id' | 'created_at'>) => void;
  getMovementHistory: (batchId: string) => BatchMovement[];

  // Settings
  updateSettings: (updates: Partial<InventorySettings>) => void;

  // Stats
  stats: {
    totalBatches: number;
    activeBatches: number;
    expiredBatches: number;
    criticalAlerts: number;
    warningAlerts: number;
    totalValue: number;
  };

  // Loading
  loading: boolean;
  refresh: () => void;
}

export const useBatchControl = (productId?: number): UseBatchControlReturn => {
  const [batches, setBatches] = useState<ProductBatch[]>([]);
  const [filters, setFilters] = useState<BatchFilters>({});
  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null);
  const [settings, setSettings] = useState<InventorySettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<BatchStatsAPI>({
    total_batches: 0,
    active_batches: 0,
    expired_batches: 0,
    critical_alerts: 0,
    warning_alerts: 0,
    total_value: 0
  });
  const [expiryAlerts, setExpiryAlerts] = useState<ExpiryAlert[]>([]);
  const [selectedBatchMovements, setSelectedBatchMovements] = useState<BatchMovement[]>([]);

  // Buscar lotes da API
  const fetchBatches = useCallback(async () => {
    console.log('🔄 [useBatchControl] Buscando lotes da API');
    setLoading(true);

    try {
      const params = new URLSearchParams();
      if (productId) params.append('product_id', productId.toString());

      const response = await api.get<ProductBatchAPI[]>(`/batches?${params.toString()}`);
      console.log('✅ [useBatchControl] Lotes recebidos:', response.length);

      // Converter para formato do frontend
      const converted: ProductBatch[] = response.map(b => ({
        id: b.id.toString(),
        product_id: b.product_id,
        batch_number: b.batch_number,
        manufacturing_date: new Date(b.manufacturing_date),
        expiry_date: new Date(b.expiry_date),
        quantity: b.quantity,
        cost_price: b.cost_price,
        supplier_id: b.supplier_id,
        origin: b.origin,
        warehouse_id: b.warehouse_id?.toString(),
        location: b.location || '',
        status: b.status,
        quality_certificate: b.quality_certificate,
        notes: b.notes,
        days_to_expire: b.days_to_expire,
        near_expiry: b.near_expiry,
        created_at: new Date(b.created_at),
        updated_at: new Date(b.updated_at)
      }));

      setBatches(converted);
    } catch (err) {
      console.error('❌ [useBatchControl] Erro ao buscar lotes:', err);
      // Sem fallback para mock - mostrar vazio se não houver dados
      setBatches([]);
    } finally {
      setLoading(false);
    }
  }, [productId]);

  // Buscar estatísticas
  const fetchStats = useCallback(async () => {
    try {
      const response = await api.get<BatchStatsAPI>('/batches/stats');
      console.log('✅ [useBatchControl] Estatísticas recebidas:', response);
      setStats(response);
    } catch (err) {
      console.error('❌ [useBatchControl] Erro ao buscar estatísticas:', err);
      setStats({
        total_batches: 0,
        active_batches: 0,
        expired_batches: 0,
        critical_alerts: 0,
        warning_alerts: 0,
        total_value: 0
      });
    }
  }, []);

  // Buscar alertas de validade
  const fetchAlerts = useCallback(async () => {
    try {
      const response = await api.get<ExpiryAlertAPI[]>('/batches/alerts');
      console.log('✅ [useBatchControl] Alertas recebidos:', response.length);

      const converted: ExpiryAlert[] = response.map(a => ({
        id: a.id,
        product_id: a.product_id,
        product_name: a.product_name,
        batch: {
          id: a.batch.id.toString(),
          product_id: a.batch.product_id,
          batch_number: a.batch.batch_number,
          manufacturing_date: new Date(a.batch.manufacturing_date),
          expiry_date: new Date(a.batch.expiry_date),
          quantity: a.batch.quantity,
          cost_price: a.batch.cost_price,
          supplier_id: a.batch.supplier_id,
          origin: a.batch.origin,
          warehouse_id: a.batch.warehouse_id?.toString(),
          location: a.batch.location || '',
          status: a.batch.status,
          days_to_expire: a.batch.days_to_expire,
          near_expiry: a.batch.near_expiry,
          created_at: new Date(a.batch.created_at),
          updated_at: new Date(a.batch.updated_at)
        },
        days_remaining: a.days_remaining,
        quantity: a.quantity,
        severity: a.severity,
        action_taken: a.action_taken,
        resolved: a.resolved,
        created_at: new Date(a.created_at)
      }));

      setExpiryAlerts(converted);
    } catch (err) {
      console.error('❌ [useBatchControl] Erro ao buscar alertas:', err);
      setExpiryAlerts([]);
    }
  }, []);

  // Buscar movimentações de um lote
  const fetchBatchMovements = useCallback(async (batchId: string) => {
    try {
      const response = await api.get<BatchMovementAPI[]>(`/batches/${batchId}/movements`);
      console.log('✅ [useBatchControl] Movimentações recebidas:', response.length);

      const converted: BatchMovement[] = response.map(m => ({
        id: m.id.toString(),
        batch_id: batchId,
        type: m.type,
        quantity: m.quantity,
        from_warehouse_id: m.from_warehouse_id?.toString(),
        to_warehouse_id: m.to_warehouse_id?.toString(),
        reference: m.reference,
        notes: m.notes,
        user_id: m.user_id?.toString(),
        created_at: new Date(m.created_at)
      }));

      setSelectedBatchMovements(converted);
    } catch (err) {
      console.error('❌ [useBatchControl] Erro ao buscar movimentações:', err);
      setSelectedBatchMovements([]);
    }
  }, []);

  // Buscar dados ao montar
  useEffect(() => {
    const fetchAll = async () => {
      await Promise.all([
        fetchBatches(),
        fetchStats(),
        fetchAlerts()
      ]);
    };

    fetchAll();
  }, [fetchBatches, fetchStats, fetchAlerts]);

  // Quando selecionar um lote, buscar suas movimentações
  useEffect(() => {
    if (selectedBatchId) {
      fetchBatchMovements(selectedBatchId);
    }
  }, [selectedBatchId, fetchBatchMovements]);

  // Filtrar lotes
  const filteredBatches = useMemo(() => {
    let result = [...batches];

    // Filter by product
    if (filters.product_id) {
      result = result.filter(b => b.product_id === filters.product_id);
    }

    // Filter by status
    if (filters.status && filters.status.length > 0) {
      result = result.filter(b => filters.status!.includes(b.status));
    }

    // Filter by expiring soon
    if (filters.expiring_in_days !== undefined) {
      result = result.filter(b =>
        b.days_to_expire !== undefined &&
        b.days_to_expire >= 0 &&
        b.days_to_expire <= filters.expiring_in_days!
      );
    }

    // Search
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      result = result.filter(b =>
        b.batch_number.toLowerCase().includes(searchLower) ||
        b.location?.toLowerCase().includes(searchLower)
      );
    }

    return result;
  }, [batches, filters]);

  const selectedBatch = useMemo(() => {
    return selectedBatchId ? batches.find(b => b.id === selectedBatchId) || null : null;
  }, [batches, selectedBatchId]);

  const selectBatch = useCallback((batchId: string | null) => {
    setSelectedBatchId(batchId);
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({});
  }, []);

  const refresh = useCallback(async () => {
    await Promise.all([
      fetchBatches(),
      fetchStats(),
      fetchAlerts()
    ]);
  }, [fetchBatches, fetchStats, fetchAlerts]);

  // Operações placeholder (não implementadas no backend ainda)
  const createBatch = useCallback(() => {
    console.warn('createBatch: Não implementado');
  }, []);

  const updateBatch = useCallback(() => {
    console.warn('updateBatch: Não implementado');
  }, []);

  const deleteBatch = useCallback(() => {
    console.warn('deleteBatch: Não implementado');
  }, []);

  const allocateStock = useCallback(() => {
    console.warn('allocateStock: Não implementado');
    return [];
  }, []);

  const reserveStock = useCallback(() => {
    console.warn('reserveStock: Não implementado');
    return false;
  }, []);

  const releaseStock = useCallback(() => {
    console.warn('releaseStock: Não implementado');
  }, []);

  const resolveAlert = useCallback((alertId: string, action: ExpiryAlert['action_taken']) => {
    // Atualizar localmente
    setExpiryAlerts(prev => prev.map(a =>
      a.id === alertId ? { ...a, action_taken: action, resolved: true } : a
    ));
  }, []);

  const checkExpiredBatches = useCallback(() => {
    return batches.filter(b => b.days_to_expire !== undefined && b.days_to_expire < 0);
  }, [batches]);

  const addMovement = useCallback(() => {
    console.warn('addMovement: Não implementado');
  }, []);

  const getMovementHistory = useCallback((batchId: string) => {
    return selectedBatchId === batchId ? selectedBatchMovements : [];
  }, [selectedBatchId, selectedBatchMovements]);

  const updateSettings = useCallback((updates: Partial<InventorySettings>) => {
    setSettings(prev => ({ ...prev, ...updates, updated_at: new Date() }));
  }, []);

  return {
    batches,
    filteredBatches,
    expiryAlerts,
    selectedBatch,
    batchMovements: selectedBatchMovements,
    settings,
    filters,
    setFilters,
    clearFilters,
    selectBatch,
    createBatch,
    updateBatch,
    deleteBatch,
    allocateStock,
    reserveStock,
    releaseStock,
    resolveAlert,
    checkExpiredBatches,
    addMovement,
    getMovementHistory,
    updateSettings,
    stats: {
      totalBatches: stats.total_batches,
      activeBatches: stats.active_batches,
      expiredBatches: stats.expired_batches,
      criticalAlerts: stats.critical_alerts,
      warningAlerts: stats.warning_alerts,
      totalValue: stats.total_value
    },
    loading,
    refresh
  };
};
