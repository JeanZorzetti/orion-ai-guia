import { useState, useCallback, useMemo } from 'react';
import {
  ProductBatch,
  ExpiryAlert,
  BatchMovement,
  BatchFilters,
  InventorySettings
} from '@/types/inventory';
import { addDays, differenceInDays, isBefore, isAfter, startOfDay } from 'date-fns';

// ============================================
// MOCK DATA GENERATORS
// ============================================

const generateMockBatches = (productId?: number): ProductBatch[] => {
  const batches: ProductBatch[] = [];
  const hoje = new Date();

  for (let i = 1; i <= 15; i++) {
    const manufacturingDate = addDays(hoje, -Math.random() * 180);
    const expiryDate = addDays(manufacturingDate, 180 + Math.random() * 180);
    const daysToExpire = differenceInDays(expiryDate, hoje);

    batches.push({
      id: `batch-${i}`,
      product_id: productId || Math.floor(Math.random() * 50) + 1,
      batch_number: `LOTE${String(i).padStart(6, '0')}`,
      manufacturing_date: manufacturingDate,
      expiry_date: expiryDate,
      quantity: Math.floor(Math.random() * 500) + 50,
      supplier_id: Math.floor(Math.random() * 10) + 1,
      cost_price: Math.random() * 100 + 10,

      warehouse_id: `warehouse-${Math.floor(Math.random() * 3) + 1}`,
      location: `Corredor ${String.fromCharCode(65 + Math.floor(Math.random() * 5))}, Prateleira ${Math.floor(Math.random() * 10) + 1}, Posição ${Math.floor(Math.random() * 20) + 1}`,

      origin: `NF-${Math.floor(Math.random() * 10000)}`,
      status: daysToExpire < 0 ? 'expired' : daysToExpire < 7 ? 'quarantine' : 'active',

      days_to_expire: daysToExpire,
      near_expiry: daysToExpire > 0 && daysToExpire < 30,

      created_at: addDays(hoje, -Math.random() * 90),
      updated_at: hoje,
    });
  }

  return batches;
};

const generateExpiryAlerts = (batches: ProductBatch[]): ExpiryAlert[] => {
  const alerts: ExpiryAlert[] = [];
  const hoje = new Date();

  batches.forEach((batch, index) => {
    const daysRemaining = differenceInDays(batch.expiry_date, hoje);

    if (daysRemaining >= 0 && daysRemaining < 90) {
      alerts.push({
        id: `alert-${index + 1}`,
        product_id: batch.product_id,
        product_name: `Produto ${batch.product_id}`,
        batch,
        days_remaining: daysRemaining,
        quantity: batch.quantity,
        severity: daysRemaining < 7 ? 'critical' : daysRemaining < 30 ? 'warning' : 'info',
        action_taken: daysRemaining < 7 ? (Math.random() > 0.5 ? 'promotion' : 'none') : 'none',
        resolved: false,
        created_at: hoje,
      });
    }
  });

  return alerts.sort((a, b) => a.days_remaining - b.days_remaining);
};

const generateBatchMovements = (batchId: string): BatchMovement[] => {
  const movements: BatchMovement[] = [];
  const hoje = new Date();

  for (let i = 1; i <= 10; i++) {
    const type = ['entry', 'exit', 'transfer', 'adjustment'][Math.floor(Math.random() * 4)] as BatchMovement['type'];

    movements.push({
      id: `movement-${i}`,
      batch_id: batchId,
      type,
      quantity: Math.floor(Math.random() * 50) + 1,
      from_warehouse_id: type === 'transfer' ? `warehouse-${Math.floor(Math.random() * 3) + 1}` : undefined,
      to_warehouse_id: type === 'transfer' ? `warehouse-${Math.floor(Math.random() * 3) + 1}` : undefined,
      reference: type === 'entry' ? `NF-${Math.floor(Math.random() * 10000)}` : `SALE-${Math.floor(Math.random() * 10000)}`,
      user_id: `user-${Math.floor(Math.random() * 5) + 1}`,
      notes: Math.random() > 0.7 ? 'Movimentação automática do sistema' : undefined,
      created_at: addDays(hoje, -Math.random() * 30),
    });
  }

  return movements.sort((a, b) => b.created_at.getTime() - a.created_at.getTime());
};

// ============================================
// DEFAULT SETTINGS
// ============================================

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

// ============================================
// HOOK
// ============================================

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
  const [batches, setBatches] = useState<ProductBatch[]>(() => generateMockBatches(productId));
  const [filters, setFilters] = useState<BatchFilters>({});
  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null);
  const [settings, setSettings] = useState<InventorySettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(false);

  // ============================================
  // COMPUTED DATA
  // ============================================

  const filteredBatches = useMemo(() => {
    let result = [...batches];

    // Filter by product
    if (filters.product_id) {
      result = result.filter(b => b.product_id === filters.product_id);
    }

    // Filter by warehouse
    if (filters.warehouse_id) {
      result = result.filter(b => b.warehouse_id === filters.warehouse_id);
    }

    // Filter by status
    if (filters.status && filters.status.length > 0) {
      result = result.filter(b => filters.status!.includes(b.status));
    }

    // Filter by expiring soon
    if (filters.expiring_in_days !== undefined) {
      const hoje = new Date();
      result = result.filter(b => {
        const daysToExpire = differenceInDays(b.expiry_date, hoje);
        return daysToExpire >= 0 && daysToExpire <= filters.expiring_in_days!;
      });
    }

    // Search
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      result = result.filter(b =>
        b.batch_number.toLowerCase().includes(searchLower) ||
        b.location.toLowerCase().includes(searchLower) ||
        b.origin.toLowerCase().includes(searchLower)
      );
    }

    return result;
  }, [batches, filters]);

  const expiryAlerts = useMemo(() =>
    generateExpiryAlerts(batches),
    [batches]
  );

  const selectedBatch = useMemo(() =>
    selectedBatchId ? batches.find(b => b.id === selectedBatchId) || null : null,
    [batches, selectedBatchId]
  );

  const batchMovements = useMemo(() =>
    selectedBatchId ? generateBatchMovements(selectedBatchId) : [],
    [selectedBatchId]
  );

  const stats = useMemo(() => {
    const hoje = new Date();
    return {
      totalBatches: batches.length,
      activeBatches: batches.filter(b => b.status === 'active').length,
      expiredBatches: batches.filter(b => b.status === 'expired').length,
      criticalAlerts: expiryAlerts.filter(a => a.severity === 'critical' && !a.resolved).length,
      warningAlerts: expiryAlerts.filter(a => a.severity === 'warning' && !a.resolved).length,
      totalValue: batches.reduce((sum, b) => sum + (b.quantity * b.cost_price), 0),
    };
  }, [batches, expiryAlerts]);

  // ============================================
  // CRUD OPERATIONS
  // ============================================

  const selectBatch = useCallback((batchId: string | null) => {
    setSelectedBatchId(batchId);
  }, []);

  const createBatch = useCallback((batchData: Omit<ProductBatch, 'id' | 'created_at' | 'updated_at' | 'days_to_expire' | 'near_expiry'>) => {
    const hoje = new Date();
    const daysToExpire = differenceInDays(batchData.expiry_date, hoje);

    const newBatch: ProductBatch = {
      ...batchData,
      id: `batch-${Date.now()}`,
      days_to_expire: daysToExpire,
      near_expiry: daysToExpire > 0 && daysToExpire < settings.expiry_warning_days,
      created_at: hoje,
      updated_at: hoje,
    };

    setBatches(prev => [...prev, newBatch]);
  }, [settings.expiry_warning_days]);

  const updateBatch = useCallback((batchId: string, updates: Partial<ProductBatch>) => {
    setBatches(prev => prev.map(batch => {
      if (batch.id === batchId) {
        const updated = { ...batch, ...updates, updated_at: new Date() };

        // Recalculate expiry fields if expiry_date changed
        if (updates.expiry_date) {
          const daysToExpire = differenceInDays(updates.expiry_date, new Date());
          updated.days_to_expire = daysToExpire;
          updated.near_expiry = daysToExpire > 0 && daysToExpire < settings.expiry_warning_days;
          updated.status = daysToExpire < 0 ? 'expired' : updated.status;
        }

        return updated;
      }
      return batch;
    }));
  }, [settings.expiry_warning_days]);

  const deleteBatch = useCallback((batchId: string) => {
    setBatches(prev => prev.filter(b => b.id !== batchId));
    if (selectedBatchId === batchId) {
      setSelectedBatchId(null);
    }
  }, [selectedBatchId]);

  // ============================================
  // STOCK ALLOCATION (FIFO/LIFO)
  // ============================================

  const allocateStock = useCallback((productId: number, quantity: number, warehouseId: string): ProductBatch[] => {
    const availableBatches = batches
      .filter(b =>
        b.product_id === productId &&
        b.warehouse_id === warehouseId &&
        b.status === 'active' &&
        b.quantity > 0
      )
      .sort((a, b) => {
        // FIFO: Oldest first (by manufacturing date)
        if (settings.stock_valuation_method === 'fifo') {
          return a.manufacturing_date.getTime() - b.manufacturing_date.getTime();
        }
        // LIFO: Newest first
        else if (settings.stock_valuation_method === 'lifo') {
          return b.manufacturing_date.getTime() - a.manufacturing_date.getTime();
        }
        // Prefer near expiry
        else if (settings.prefer_near_expiry) {
          return (a.days_to_expire || Infinity) - (b.days_to_expire || Infinity);
        }
        return 0;
      });

    const allocated: ProductBatch[] = [];
    let remaining = quantity;

    for (const batch of availableBatches) {
      if (remaining <= 0) break;

      const allocateQty = Math.min(batch.quantity, remaining);
      allocated.push({ ...batch, quantity: allocateQty });
      remaining -= allocateQty;
    }

    return allocated;
  }, [batches, settings.stock_valuation_method, settings.prefer_near_expiry]);

  const reserveStock = useCallback((productId: number, quantity: number, warehouseId: string, saleId: string): boolean => {
    const allocated = allocateStock(productId, quantity, warehouseId);
    const totalAllocated = allocated.reduce((sum, b) => sum + b.quantity, 0);

    if (totalAllocated < quantity && settings.prevent_negative_stock) {
      return false; // Insufficient stock
    }

    // Update batches (in real app, would create reservation records)
    allocated.forEach(allocatedBatch => {
      updateBatch(allocatedBatch.id, {
        quantity: batches.find(b => b.id === allocatedBatch.id)!.quantity - allocatedBatch.quantity
      });
    });

    return true;
  }, [allocateStock, batches, settings.prevent_negative_stock, updateBatch]);

  const releaseStock = useCallback((productId: number, quantity: number, warehouseId: string, saleId: string) => {
    // In real app, would find reservation and return stock
    // For now, just demonstration logic
    const batch = batches.find(b => b.product_id === productId && b.warehouse_id === warehouseId);
    if (batch) {
      updateBatch(batch.id, { quantity: batch.quantity + quantity });
    }
  }, [batches, updateBatch]);

  // ============================================
  // EXPIRY MANAGEMENT
  // ============================================

  const resolveAlert = useCallback((alertId: string, action: ExpiryAlert['action_taken']) => {
    // In real app, would update alert in database
    console.log(`Alert ${alertId} resolved with action: ${action}`);
  }, []);

  const checkExpiredBatches = useCallback(() => {
    const hoje = startOfDay(new Date());
    return batches.filter(b => isBefore(b.expiry_date, hoje) && b.status !== 'expired');
  }, [batches]);

  // ============================================
  // MOVEMENTS
  // ============================================

  const addMovement = useCallback((movement: Omit<BatchMovement, 'id' | 'created_at'>) => {
    // In real app, would save to database and update batch quantities
    console.log('Movement added:', movement);
  }, []);

  const getMovementHistory = useCallback((batchId: string) => {
    return generateBatchMovements(batchId);
  }, []);

  // ============================================
  // SETTINGS
  // ============================================

  const updateSettings = useCallback((updates: Partial<InventorySettings>) => {
    setSettings(prev => ({
      ...prev,
      ...updates,
      updated_at: new Date(),
    }));
  }, []);

  // ============================================
  // REFRESH
  // ============================================

  const refresh = useCallback(() => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setBatches(generateMockBatches(productId));
      setLoading(false);
    }, 500);
  }, [productId]);

  const clearFilters = useCallback(() => {
    setFilters({});
  }, []);

  return {
    // Data
    batches,
    filteredBatches,
    expiryAlerts,
    selectedBatch,
    batchMovements,
    settings,

    // Filters
    filters,
    setFilters,
    clearFilters,

    // CRUD
    selectBatch,
    createBatch,
    updateBatch,
    deleteBatch,

    // Stock Operations
    allocateStock,
    reserveStock,
    releaseStock,

    // Expiry
    resolveAlert,
    checkExpiredBatches,

    // Movements
    addMovement,
    getMovementHistory,

    // Settings
    updateSettings,

    // Stats
    stats,

    // Loading
    loading,
    refresh,
  };
};
