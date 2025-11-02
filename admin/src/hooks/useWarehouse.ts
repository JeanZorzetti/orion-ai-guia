import { useState, useCallback, useMemo, useEffect } from 'react';
import { api } from '@/lib/api';
import {
  Warehouse,
  WarehouseArea,
  StockTransfer,
  WarehouseFilters,
} from '@/types/inventory';

// API Response Types
interface WarehouseAPI {
  id: number;
  name: string;
  code: string;
  workspace_id: number;
  address: any;
  is_main: boolean;
  is_active: boolean;
  type: 'principal' | 'filial' | 'terceirizado' | 'consignado';
  total_capacity?: number;
  current_occupation: number;
  areas: any[];
  manager_id?: number;
  manager_name?: string;
  contact_phone?: string;
  contact_email?: string;
  latitude?: number;
  longitude?: number;
  created_at: string;
  updated_at: string;
}

interface WarehouseStatsAPI {
  total_warehouses: number;
  active_warehouses: number;
  pending_transfers: number;
  in_transit_transfers: number;
  total_capacity: number;
  total_occupation: number;
  occupation_percentage: number;
}

interface StockTransferAPI {
  id: number;
  transfer_number: string;
  from_warehouse_id: number;
  from_warehouse_name?: string;
  to_warehouse_id: number;
  to_warehouse_name?: string;
  product_id: number;
  product_name?: string;
  batch_id?: number;
  quantity: number;
  status: 'pending' | 'approved' | 'in_transit' | 'completed' | 'cancelled';
  requested_date: string;
  approved_date?: string;
  shipped_date?: string;
  received_date?: string;
  cancelled_date?: string;
  requested_by?: number;
  notes?: string;
  cancellation_reason?: string;
}

interface UseWarehouseReturn {
  warehouses: Warehouse[];
  filteredWarehouses: Warehouse[];
  selectedWarehouse: Warehouse | null;
  transfers: StockTransfer[];
  stats: {
    totalWarehouses: number;
    activeWarehouses: number;
    pendingTransfers: number;
    inTransitTransfers: number;
    totalCapacity: number;
    totalOccupation: number;
    occupationPercentage: number;
  };
  filters: WarehouseFilters;
  setFilters: (filters: WarehouseFilters) => void;
  clearFilters: () => void;
  selectWarehouse: (warehouseId: string | null) => void;
  selectTransfer: (transferId: string) => void;
  approveTransfer: (transferId: string) => void;
  shipTransfer: (transferId: string) => void;
  receiveTransfer: (transferId: string) => void;
  cancelTransfer: (transferId: string, reason: string) => void;
  loading: boolean;
  refresh: () => void;
}

export const useWarehouse = (): UseWarehouseReturn => {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [transfers, setTransfers] = useState<StockTransfer[]>([]);
  const [filters, setFilters] = useState<WarehouseFilters>({});
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<WarehouseStatsAPI>({
    total_warehouses: 0,
    active_warehouses: 0,
    pending_transfers: 0,
    in_transit_transfers: 0,
    total_capacity: 0,
    total_occupation: 0,
    occupation_percentage: 0
  });

  // Buscar depósitos da API
  const fetchWarehouses = useCallback(async () => {
    console.log('🔄 [useWarehouse] Buscando depósitos da API');
    setLoading(true);

    try {
      const response = await api.get<WarehouseAPI[]>('/warehouses');
      console.log('✅ [useWarehouse] Depósitos recebidos:', response.length);

      // Converter para formato do frontend
      const converted: Warehouse[] = response.map(w => ({
        id: w.id.toString(),
        name: w.name,
        code: w.code,
        workspace_id: w.workspace_id,
        address: w.address,
        is_main: w.is_main,
        is_active: w.is_active,
        type: w.type,
        total_capacity: w.total_capacity,
        current_occupation: w.current_occupation,
        areas: w.areas.map((a: any) => ({
          id: a.id.toString(),
          warehouse_id: a.warehouse_id.toString(),
          name: a.name,
          type: a.type,
          capacity: a.capacity,
          current_occupation: a.current_occupation,
          is_active: a.is_active,
          requires_refrigeration: a.requires_refrigeration,
          temperature_range: a.temperature_range
        })),
        manager_id: w.manager_id,
        manager_name: w.manager_name,
        contact_phone: w.contact_phone,
        contact_email: w.contact_email,
        latitude: w.latitude,
        longitude: w.longitude,
        created_at: new Date(w.created_at),
        updated_at: new Date(w.updated_at)
      }));

      setWarehouses(converted);
    } catch (err) {
      console.error('❌ [useWarehouse] Erro ao buscar depósitos:', err);
      // Sem fallback para mock - mostrar vazio se não houver dados
      setWarehouses([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Buscar estatísticas
  const fetchStats = useCallback(async () => {
    try {
      const response = await api.get<WarehouseStatsAPI>('/warehouses/stats');
      console.log('✅ [useWarehouse] Estatísticas recebidas:', response);
      setStats(response);
    } catch (err) {
      console.error('❌ [useWarehouse] Erro ao buscar estatísticas:', err);
      setStats({
        total_warehouses: 0,
        active_warehouses: 0,
        pending_transfers: 0,
        in_transit_transfers: 0,
        total_capacity: 0,
        total_occupation: 0,
        occupation_percentage: 0
      });
    }
  }, []);

  // Buscar transferências
  const fetchTransfers = useCallback(async () => {
    try {
      const response = await api.get<StockTransferAPI[]>('/warehouses/transfers');
      console.log('✅ [useWarehouse] Transferências recebidas:', response.length);

      const converted: StockTransfer[] = response.map(t => ({
        id: t.id.toString(),
        transfer_number: t.transfer_number,
        workspace_id: 1, // TODO: Get from context
        from_warehouse_id: t.from_warehouse_id.toString(),
        from_warehouse_name: t.from_warehouse_name || '',
        to_warehouse_id: t.to_warehouse_id.toString(),
        to_warehouse_name: t.to_warehouse_name || '',
        items: [{
          id: t.id.toString(),
          product_id: t.product_id,
          product_name: t.product_name || '',
          quantity: t.quantity,
          batch_id: t.batch_id?.toString(),
          batch_number: undefined
        }],
        status: t.status,
        requested_at: new Date(t.requested_date),
        approved_at: t.approved_date ? new Date(t.approved_date) : undefined,
        shipped_at: t.shipped_date ? new Date(t.shipped_date) : undefined,
        received_at: t.received_date ? new Date(t.received_date) : undefined,
        cancelled_at: t.cancelled_date ? new Date(t.cancelled_date) : undefined,
        requested_by: t.requested_by?.toString() || '',
        requested_by_name: '', // TODO: Get from user data
        approved_by: undefined,
        approved_by_name: undefined,
        shipped_by: undefined,
        received_by: undefined,
        shipping_document: undefined,
        receiving_document: undefined,
        notes: t.notes,
        cancellation_reason: t.cancellation_reason,
        created_at: new Date(t.requested_date), // Use requested_date as created_at
        updated_at: new Date(t.requested_date)  // Default to requested_date
      }));

      setTransfers(converted);
    } catch (err) {
      console.error('❌ [useWarehouse] Erro ao buscar transferências:', err);
      setTransfers([]);
    }
  }, []);

  // Buscar dados ao montar
  useEffect(() => {
    const fetchAll = async () => {
      await Promise.all([
        fetchWarehouses(),
        fetchStats(),
        fetchTransfers()
      ]);
    };

    fetchAll();
  }, [fetchWarehouses, fetchStats, fetchTransfers]);

  // Filtrar depósitos
  const filteredWarehouses = useMemo(() => {
    let result = [...warehouses];

    if (filters.is_active !== undefined) {
      result = result.filter(w => w.is_active === filters.is_active);
    }

    if (filters.type && filters.type.length > 0) {
      result = result.filter(w => filters.type!.includes(w.type));
    }

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      result = result.filter(w =>
        w.name.toLowerCase().includes(searchLower) ||
        w.code.toLowerCase().includes(searchLower)
      );
    }

    return result;
  }, [warehouses, filters]);

  const selectedWarehouse = useMemo(() => {
    return selectedWarehouseId ? warehouses.find(w => w.id === selectedWarehouseId) || null : null;
  }, [warehouses, selectedWarehouseId]);

  const selectWarehouse = useCallback((warehouseId: string | null) => {
    setSelectedWarehouseId(warehouseId);
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({});
  }, []);

  const refresh = useCallback(async () => {
    await Promise.all([
      fetchWarehouses(),
      fetchStats(),
      fetchTransfers()
    ]);
  }, [fetchWarehouses, fetchStats, fetchTransfers]);

  // Operações placeholder (não implementadas no backend ainda)
  const selectTransfer = useCallback(() => {
    console.warn('selectTransfer: Não implementado');
  }, []);

  const approveTransfer = useCallback(() => {
    console.warn('approveTransfer: Não implementado');
  }, []);

  const shipTransfer = useCallback(() => {
    console.warn('shipTransfer: Não implementado');
  }, []);

  const receiveTransfer = useCallback(() => {
    console.warn('receiveTransfer: Não implementado');
  }, []);

  const cancelTransfer = useCallback(() => {
    console.warn('cancelTransfer: Não implementado');
  }, []);

  return {
    warehouses,
    filteredWarehouses,
    selectedWarehouse,
    transfers,
    stats: {
      totalWarehouses: stats.total_warehouses,
      activeWarehouses: stats.active_warehouses,
      pendingTransfers: stats.pending_transfers,
      inTransitTransfers: stats.in_transit_transfers,
      totalCapacity: stats.total_capacity,
      totalOccupation: stats.total_occupation,
      occupationPercentage: stats.occupation_percentage
    },
    filters,
    setFilters,
    clearFilters,
    selectWarehouse,
    selectTransfer,
    approveTransfer,
    shipTransfer,
    receiveTransfer,
    cancelTransfer,
    loading,
    refresh
  };
};
