import { useState, useCallback, useMemo } from 'react';
import {
  Warehouse,
  WarehouseArea,
  ProductStock,
  StockTransfer,
  WarehouseFilters,
} from '@/types/inventory';
import { addDays } from 'date-fns';

// ============================================
// MOCK DATA GENERATORS
// ============================================

const generateMockWarehouses = (): Warehouse[] => {
  const hoje = new Date();

  return [
    {
      id: 'warehouse-1',
      name: 'Depósito Central',
      code: 'DC-001',
      workspace_id: 1,
      address: {
        street: 'Rua Principal',
        number: '1000',
        complement: 'Galpão A',
        neighborhood: 'Centro Industrial',
        city: 'São Paulo',
        state: 'SP',
        zip_code: '01234-000',
        country: 'Brasil',
      },
      is_main: true,
      is_active: true,
      type: 'principal',
      total_capacity: 5000, // m³
      current_occupation: 3200,
      areas: [
        {
          id: 'area-1',
          warehouse_id: 'warehouse-1',
          name: 'Área de Estocagem A',
          type: 'racking',
          capacity: 2000,
          current_occupation: 1500,
          is_active: true,
        },
        {
          id: 'area-2',
          warehouse_id: 'warehouse-1',
          name: 'Câmara Fria 1',
          type: 'cold_room',
          capacity: 500,
          current_occupation: 300,
          is_active: true,
          requires_refrigeration: true,
          temperature_range: { min: 2, max: 8 },
        },
        {
          id: 'area-3',
          warehouse_id: 'warehouse-1',
          name: 'Área de Expedição',
          type: 'expedition',
          capacity: 500,
          current_occupation: 200,
          is_active: true,
        },
      ],
      manager_id: 1,
      manager_name: 'João Silva',
      contact_phone: '(11) 98765-4321',
      contact_email: 'joao.silva@empresa.com',
      latitude: -23.5505,
      longitude: -46.6333,
      created_at: addDays(hoje, -365),
      updated_at: hoje,
    },
    {
      id: 'warehouse-2',
      name: 'Filial RJ',
      code: 'FRJ-001',
      workspace_id: 1,
      address: {
        street: 'Avenida Brasil',
        number: '2500',
        neighborhood: 'Centro',
        city: 'Rio de Janeiro',
        state: 'RJ',
        zip_code: '20000-000',
        country: 'Brasil',
      },
      is_main: false,
      is_active: true,
      type: 'filial',
      total_capacity: 2000,
      current_occupation: 1100,
      areas: [
        {
          id: 'area-4',
          warehouse_id: 'warehouse-2',
          name: 'Área Principal',
          type: 'racking',
          capacity: 1500,
          current_occupation: 900,
          is_active: true,
        },
        {
          id: 'area-5',
          warehouse_id: 'warehouse-2',
          name: 'Área de Piso',
          type: 'floor',
          capacity: 500,
          current_occupation: 200,
          is_active: true,
        },
      ],
      manager_id: 2,
      manager_name: 'Maria Santos',
      contact_phone: '(21) 98765-1234',
      contact_email: 'maria.santos@empresa.com',
      latitude: -22.9068,
      longitude: -43.1729,
      created_at: addDays(hoje, -180),
      updated_at: hoje,
    },
    {
      id: 'warehouse-3',
      name: 'CD Terceirizado',
      code: 'CDT-001',
      workspace_id: 1,
      address: {
        street: 'Rodovia dos Bandeirantes',
        number: 'Km 50',
        neighborhood: 'Distrito Industrial',
        city: 'Campinas',
        state: 'SP',
        zip_code: '13000-000',
        country: 'Brasil',
      },
      is_main: false,
      is_active: true,
      type: 'terceirizado',
      total_capacity: 3000,
      current_occupation: 800,
      areas: [
        {
          id: 'area-6',
          warehouse_id: 'warehouse-3',
          name: 'Área Geral',
          type: 'racking',
          capacity: 3000,
          current_occupation: 800,
          is_active: true,
        },
      ],
      manager_name: 'Logística XYZ',
      contact_phone: '(19) 3333-4444',
      contact_email: 'contato@logisticaxyz.com',
      latitude: -22.9099,
      longitude: -47.0626,
      created_at: addDays(hoje, -90),
      updated_at: hoje,
    },
  ];
};

const generateMockProductStock = (warehouseId?: string): ProductStock[] => {
  const stocks: ProductStock[] = [];
  const hoje = new Date();
  const warehouseIds = warehouseId ? [warehouseId] : ['warehouse-1', 'warehouse-2', 'warehouse-3'];

  for (let productId = 1; productId <= 20; productId++) {
    warehouseIds.forEach(wId => {
      const quantity = Math.floor(Math.random() * 500);
      const reserved = Math.floor(quantity * (Math.random() * 0.2));

      stocks.push({
        product_id: productId,
        warehouse_id: wId,
        warehouse_name: `Depósito ${wId.split('-')[1]}`,
        quantity,
        reserved_quantity: reserved,
        available_quantity: quantity - reserved,
        in_transit_quantity: Math.floor(Math.random() * 50),
        min_stock: 50,
        max_stock: 500,
        default_location: `Corredor ${String.fromCharCode(65 + Math.floor(Math.random() * 5))}, Prateleira ${Math.floor(Math.random() * 10) + 1}`,
        batches: [], // Would be populated from useBatchControl
        last_movement_at: addDays(hoje, -Math.random() * 7),
        updated_at: hoje,
      });
    });
  }

  return stocks;
};

const generateMockTransfers = (): StockTransfer[] => {
  const transfers: StockTransfer[] = [];
  const hoje = new Date();

  for (let i = 1; i <= 10; i++) {
    const status: StockTransfer['status'] = ['pending', 'approved', 'in_transit', 'completed', 'cancelled'][
      Math.floor(Math.random() * 5)
    ] as StockTransfer['status'];

    const requestedAt = addDays(hoje, -Math.random() * 30);

    transfers.push({
      id: `transfer-${i}`,
      transfer_number: `TRF${String(i).padStart(6, '0')}`,
      workspace_id: 1,
      from_warehouse_id: 'warehouse-1',
      from_warehouse_name: 'Depósito Central',
      to_warehouse_id: `warehouse-${Math.floor(Math.random() * 2) + 2}`,
      to_warehouse_name: Math.random() > 0.5 ? 'Filial RJ' : 'CD Terceirizado',
      items: [
        {
          id: `item-${i}-1`,
          product_id: Math.floor(Math.random() * 20) + 1,
          product_name: `Produto ${Math.floor(Math.random() * 20) + 1}`,
          quantity: Math.floor(Math.random() * 100) + 10,
          batch_id: `batch-${Math.floor(Math.random() * 15) + 1}`,
          batch_number: `LOTE${String(Math.floor(Math.random() * 1000)).padStart(6, '0')}`,
          transferred_quantity: status === 'completed' ? Math.floor(Math.random() * 100) + 10 : undefined,
        },
      ],
      status,
      requested_at: requestedAt,
      approved_at: status !== 'pending' && status !== 'cancelled' ? addDays(requestedAt, 1) : undefined,
      shipped_at: status === 'in_transit' || status === 'completed' ? addDays(requestedAt, 2) : undefined,
      received_at: status === 'completed' ? addDays(requestedAt, 3) : undefined,
      cancelled_at: status === 'cancelled' ? addDays(requestedAt, 1) : undefined,
      requested_by: 'user-1',
      requested_by_name: 'Admin User',
      approved_by: status !== 'pending' && status !== 'cancelled' ? 'user-2' : undefined,
      approved_by_name: status !== 'pending' && status !== 'cancelled' ? 'Manager User' : undefined,
      notes: Math.random() > 0.7 ? 'Transferência urgente' : undefined,
      cancellation_reason: status === 'cancelled' ? 'Solicitação cancelada pelo usuário' : undefined,
      created_at: requestedAt,
      updated_at: hoje,
    });
  }

  return transfers.sort((a, b) => b.created_at.getTime() - a.created_at.getTime());
};

// ============================================
// HOOK
// ============================================

interface UseWarehouseReturn {
  // Data
  warehouses: Warehouse[];
  filteredWarehouses: Warehouse[];
  selectedWarehouse: Warehouse | null;
  productStocks: ProductStock[];
  transfers: StockTransfer[];
  selectedTransfer: StockTransfer | null;

  // Filters
  filters: WarehouseFilters;
  setFilters: (filters: WarehouseFilters) => void;
  clearFilters: () => void;

  // Warehouse CRUD
  selectWarehouse: (warehouseId: string | null) => void;
  createWarehouse: (warehouse: Omit<Warehouse, 'id' | 'created_at' | 'updated_at'>) => void;
  updateWarehouse: (warehouseId: string, updates: Partial<Warehouse>) => void;
  deleteWarehouse: (warehouseId: string) => void;

  // Areas
  addArea: (warehouseId: string, area: Omit<WarehouseArea, 'id' | 'warehouse_id'>) => void;
  updateArea: (warehouseId: string, areaId: string, updates: Partial<WarehouseArea>) => void;
  deleteArea: (warehouseId: string, areaId: string) => void;

  // Stock Operations
  getProductStock: (productId: number, warehouseId?: string) => ProductStock[];
  getTotalStock: (productId: number) => number;
  getAvailableStock: (productId: number, warehouseId?: string) => number;
  updateStock: (productId: number, warehouseId: string, quantity: number) => void;

  // Transfers
  selectTransfer: (transferId: string | null) => void;
  createTransfer: (transfer: Omit<StockTransfer, 'id' | 'transfer_number' | 'created_at' | 'updated_at'>) => void;
  updateTransfer: (transferId: string, updates: Partial<StockTransfer>) => void;
  approveTransfer: (transferId: string, userId: string) => void;
  shipTransfer: (transferId: string, userId: string) => void;
  receiveTransfer: (transferId: string, userId: string) => void;
  cancelTransfer: (transferId: string, reason: string) => void;

  // Stats
  stats: {
    totalWarehouses: number;
    activeWarehouses: number;
    totalCapacity: number;
    currentOccupation: number;
    occupationPercentage: number;
    pendingTransfers: number;
    inTransitTransfers: number;
  };

  // Loading
  loading: boolean;
  refresh: () => void;
}

export const useWarehouse = (): UseWarehouseReturn => {
  const [warehouses, setWarehouses] = useState<Warehouse[]>(generateMockWarehouses);
  const [filters, setFilters] = useState<WarehouseFilters>({});
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string | null>(null);
  const [productStocks, setProductStocks] = useState<ProductStock[]>(generateMockProductStock);
  const [transfers, setTransfers] = useState<StockTransfer[]>(generateMockTransfers);
  const [selectedTransferId, setSelectedTransferId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // ============================================
  // COMPUTED DATA
  // ============================================

  const filteredWarehouses = useMemo(() => {
    let result = [...warehouses];

    // Filter by active
    if (filters.is_active !== undefined) {
      result = result.filter(w => w.is_active === filters.is_active);
    }

    // Filter by type
    if (filters.type && filters.type.length > 0) {
      result = result.filter(w => filters.type!.includes(w.type));
    }

    // Search
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      result = result.filter(w =>
        w.name.toLowerCase().includes(searchLower) ||
        w.code.toLowerCase().includes(searchLower) ||
        w.address.city.toLowerCase().includes(searchLower) ||
        w.address.state.toLowerCase().includes(searchLower)
      );
    }

    return result;
  }, [warehouses, filters]);

  const selectedWarehouse = useMemo(() =>
    selectedWarehouseId ? warehouses.find(w => w.id === selectedWarehouseId) || null : null,
    [warehouses, selectedWarehouseId]
  );

  const selectedTransfer = useMemo(() =>
    selectedTransferId ? transfers.find(t => t.id === selectedTransferId) || null : null,
    [transfers, selectedTransferId]
  );

  const stats = useMemo(() => {
    const totalCapacity = warehouses.reduce((sum, w) => sum + (w.total_capacity || 0), 0);
    const currentOccupation = warehouses.reduce((sum, w) => sum + (w.current_occupation || 0), 0);

    return {
      totalWarehouses: warehouses.length,
      activeWarehouses: warehouses.filter(w => w.is_active).length,
      totalCapacity,
      currentOccupation,
      occupationPercentage: totalCapacity > 0 ? (currentOccupation / totalCapacity) * 100 : 0,
      pendingTransfers: transfers.filter(t => t.status === 'pending').length,
      inTransitTransfers: transfers.filter(t => t.status === 'in_transit').length,
    };
  }, [warehouses, transfers]);

  // ============================================
  // WAREHOUSE CRUD
  // ============================================

  const selectWarehouse = useCallback((warehouseId: string | null) => {
    setSelectedWarehouseId(warehouseId);
  }, []);

  const createWarehouse = useCallback((warehouseData: Omit<Warehouse, 'id' | 'created_at' | 'updated_at'>) => {
    const hoje = new Date();

    const newWarehouse: Warehouse = {
      ...warehouseData,
      id: `warehouse-${Date.now()}`,
      created_at: hoje,
      updated_at: hoje,
    };

    setWarehouses(prev => [...prev, newWarehouse]);
  }, []);

  const updateWarehouse = useCallback((warehouseId: string, updates: Partial<Warehouse>) => {
    setWarehouses(prev => prev.map(w =>
      w.id === warehouseId ? { ...w, ...updates, updated_at: new Date() } : w
    ));
  }, []);

  const deleteWarehouse = useCallback((warehouseId: string) => {
    setWarehouses(prev => prev.filter(w => w.id !== warehouseId));
    if (selectedWarehouseId === warehouseId) {
      setSelectedWarehouseId(null);
    }
  }, [selectedWarehouseId]);

  // ============================================
  // AREAS
  // ============================================

  const addArea = useCallback((warehouseId: string, areaData: Omit<WarehouseArea, 'id' | 'warehouse_id'>) => {
    const newArea: WarehouseArea = {
      ...areaData,
      id: `area-${Date.now()}`,
      warehouse_id: warehouseId,
    };

    setWarehouses(prev => prev.map(w => {
      if (w.id === warehouseId) {
        return {
          ...w,
          areas: [...w.areas, newArea],
          updated_at: new Date(),
        };
      }
      return w;
    }));
  }, []);

  const updateArea = useCallback((warehouseId: string, areaId: string, updates: Partial<WarehouseArea>) => {
    setWarehouses(prev => prev.map(w => {
      if (w.id === warehouseId) {
        return {
          ...w,
          areas: w.areas.map(a => a.id === areaId ? { ...a, ...updates } : a),
          updated_at: new Date(),
        };
      }
      return w;
    }));
  }, []);

  const deleteArea = useCallback((warehouseId: string, areaId: string) => {
    setWarehouses(prev => prev.map(w => {
      if (w.id === warehouseId) {
        return {
          ...w,
          areas: w.areas.filter(a => a.id !== areaId),
          updated_at: new Date(),
        };
      }
      return w;
    }));
  }, []);

  // ============================================
  // STOCK OPERATIONS
  // ============================================

  const getProductStock = useCallback((productId: number, warehouseId?: string): ProductStock[] => {
    let stocks = productStocks.filter(s => s.product_id === productId);
    if (warehouseId) {
      stocks = stocks.filter(s => s.warehouse_id === warehouseId);
    }
    return stocks;
  }, [productStocks]);

  const getTotalStock = useCallback((productId: number): number => {
    return productStocks
      .filter(s => s.product_id === productId)
      .reduce((sum, s) => sum + s.quantity, 0);
  }, [productStocks]);

  const getAvailableStock = useCallback((productId: number, warehouseId?: string): number => {
    let stocks = productStocks.filter(s => s.product_id === productId);
    if (warehouseId) {
      stocks = stocks.filter(s => s.warehouse_id === warehouseId);
    }
    return stocks.reduce((sum, s) => sum + s.available_quantity, 0);
  }, [productStocks]);

  const updateStock = useCallback((productId: number, warehouseId: string, quantity: number) => {
    setProductStocks(prev => prev.map(s => {
      if (s.product_id === productId && s.warehouse_id === warehouseId) {
        const newQuantity = s.quantity + quantity;
        return {
          ...s,
          quantity: newQuantity,
          available_quantity: newQuantity - s.reserved_quantity,
          updated_at: new Date(),
        };
      }
      return s;
    }));
  }, []);

  // ============================================
  // TRANSFERS
  // ============================================

  const selectTransfer = useCallback((transferId: string | null) => {
    setSelectedTransferId(transferId);
  }, []);

  const createTransfer = useCallback((transferData: Omit<StockTransfer, 'id' | 'transfer_number' | 'created_at' | 'updated_at'>) => {
    const hoje = new Date();
    const transferNumber = `TRF${String(transfers.length + 1).padStart(6, '0')}`;

    const newTransfer: StockTransfer = {
      ...transferData,
      id: `transfer-${Date.now()}`,
      transfer_number: transferNumber,
      created_at: hoje,
      updated_at: hoje,
    };

    setTransfers(prev => [newTransfer, ...prev]);
  }, [transfers.length]);

  const updateTransfer = useCallback((transferId: string, updates: Partial<StockTransfer>) => {
    setTransfers(prev => prev.map(t =>
      t.id === transferId ? { ...t, ...updates, updated_at: new Date() } : t
    ));
  }, []);

  const approveTransfer = useCallback((transferId: string, userId: string) => {
    const transfer = transfers.find(t => t.id === transferId);
    if (!transfer) return;

    updateTransfer(transferId, {
      status: 'approved',
      approved_at: new Date(),
      approved_by: userId,
      approved_by_name: 'Manager User', // Would fetch from user data
    });
  }, [transfers, updateTransfer]);

  const shipTransfer = useCallback((transferId: string, userId: string) => {
    updateTransfer(transferId, {
      status: 'in_transit',
      shipped_at: new Date(),
      shipped_by: userId,
    });
  }, [updateTransfer]);

  const receiveTransfer = useCallback((transferId: string, userId: string) => {
    const transfer = transfers.find(t => t.id === transferId);
    if (!transfer) return;

    // Update stocks (simplified)
    transfer.items.forEach(item => {
      // Decrease from source warehouse
      updateStock(item.product_id, transfer.from_warehouse_id, -item.quantity);
      // Increase to destination warehouse
      updateStock(item.product_id, transfer.to_warehouse_id, item.quantity);
    });

    updateTransfer(transferId, {
      status: 'completed',
      received_at: new Date(),
      received_by: userId,
    });
  }, [transfers, updateStock, updateTransfer]);

  const cancelTransfer = useCallback((transferId: string, reason: string) => {
    updateTransfer(transferId, {
      status: 'cancelled',
      cancelled_at: new Date(),
      cancellation_reason: reason,
    });
  }, [updateTransfer]);

  // ============================================
  // REFRESH
  // ============================================

  const refresh = useCallback(() => {
    setLoading(true);
    setTimeout(() => {
      setWarehouses(generateMockWarehouses());
      setProductStocks(generateMockProductStock());
      setTransfers(generateMockTransfers());
      setLoading(false);
    }, 500);
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({});
  }, []);

  return {
    // Data
    warehouses,
    filteredWarehouses,
    selectedWarehouse,
    productStocks,
    transfers,
    selectedTransfer,

    // Filters
    filters,
    setFilters,
    clearFilters,

    // Warehouse CRUD
    selectWarehouse,
    createWarehouse,
    updateWarehouse,
    deleteWarehouse,

    // Areas
    addArea,
    updateArea,
    deleteArea,

    // Stock Operations
    getProductStock,
    getTotalStock,
    getAvailableStock,
    updateStock,

    // Transfers
    selectTransfer,
    createTransfer,
    updateTransfer,
    approveTransfer,
    shipTransfer,
    receiveTransfer,
    cancelTransfer,

    // Stats
    stats,

    // Loading
    loading,
    refresh,
  };
};
