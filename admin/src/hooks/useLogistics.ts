/**
 * Logistics Hook - Integrated with real backend API
 * NO MOCK DATA - All data from /logistics endpoints
 */

import { useState, useCallback, useMemo, useEffect } from 'react';
import { api } from '@/lib/api';
import {
  PickingList,
  PackingJob,
  PackingStation,
  DeliveryRoute,
  Delivery,
  Vehicle,
  BoxType,
  LogisticsDashboard,
} from '@/types/logistics';

interface UseLogisticsReturn {
  // Picking
  pendingPicking: PickingList[];
  inProgressPicking: PickingList[];
  completedPicking: PickingList[];
  startPicking: (id: string) => void;
  completePicking: (id: string) => void;

  // Packing
  packingStations: PackingStation[];
  pendingPacking: PackingJob[];
  inProgressPacking: PackingJob[];
  completedPacking: PackingJob[];
  startPacking: (id: string) => void;
  completePacking: (id: string) => void;
  reportPackingProblem: (id: string, description: string) => void;

  // Shipping
  routes: DeliveryRoute[];
  pendingDeliveries: Delivery[];
  inRouteDeliveries: Delivery[];
  completedDeliveries: Delivery[];
  vehicles: Vehicle[];
  completeDelivery: (id: string) => void;
  failDelivery: (id: string, reason: string) => void;

  // Boxes
  boxTypes: BoxType[];

  // Dashboard
  dashboard: LogisticsDashboard;

  loading: boolean;
  refresh: () => void;
}

export const useLogistics = (): UseLogisticsReturn => {
  const [pickingLists, setPickingLists] = useState<PickingList[]>([]);
  const [packingStations, setPackingStations] = useState<PackingStation[]>([]);
  const [packingJobs, setPackingJobs] = useState<PackingJob[]>([]);
  const [routes, setRoutes] = useState<DeliveryRoute[]>([]);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [boxTypes, setBoxTypes] = useState<BoxType[]>([]);
  const [dashboard, setDashboard] = useState<LogisticsDashboard>({
    date: new Date(),
    workspace_id: 0,
    picking: { pending_lists: 0, completed_lists: 0, total_lists: 0, avg_picking_time: 0, accuracy_rate: 0 },
    packing: { pending_jobs: 0, completed_jobs: 0, total_jobs: 0, avg_packing_time: 0, quality_issues: 0 },
    delivery: { total_deliveries: 0, completed_deliveries: 0, in_route_deliveries: 0, failed_deliveries: 0, success_rate: 0, on_time_rate: 0 },
    routes: { total_routes: 0, active_routes: 0, total_distance_km: 0, avg_stops_per_route: 0, optimization_savings: 0 },
    productivity: { orders_per_hour: 0, items_picked_per_hour: 0, packages_packed_per_hour: 0 },
  });
  const [loading, setLoading] = useState(true);

  // ============================================================================
  // API FETCH FUNCTIONS
  // ============================================================================

  const fetchPickingLists = useCallback(async () => {
    console.log('🔄 [useLogistics] Buscando listas de picking');
    try {
      const response = await api.get<any[]>('/logistics/picking-lists');
      const converted: PickingList[] = response.map(p => ({
        id: p.id.toString(),
        picking_number: p.picking_number,
        workspace_id: p.workspace_id,
        type: p.type as any,
        sale_ids: p.sale_ids,
        items: p.items,
        picking_route: p.picking_route || [],
        status: p.status as any,
        assigned_to: p.assigned_to?.toString() || '',
        assigned_to_name: '',
        started_at: p.started_at ? new Date(p.started_at) : undefined,
        completed_at: p.completed_at ? new Date(p.completed_at) : undefined,
        estimated_time: p.estimated_time,
        actual_time: p.actual_time,
        priority: p.priority as any,
        created_at: new Date(p.created_at),
        updated_at: new Date(p.updated_at),
      }));
      setPickingLists(converted);
    } catch (err) {
      console.error('❌ [useLogistics] Erro ao buscar picking lists:', err);
      setPickingLists([]);
    }
  }, []);

  const fetchPackingStations = useCallback(async () => {
    console.log('🔄 [useLogistics] Buscando estações de packing');
    try {
      const response = await api.get<any[]>('/logistics/packing-stations');
      const converted: PackingStation[] = response.map(s => ({
        id: s.id.toString(),
        name: s.name,
        warehouse_id: s.warehouse_id?.toString() || '',
        code: s.code,
        packer_id: s.packer_id?.toString(),
        packer_name: '',
        is_active: s.is_active,
        available_boxes: [],
        orders_packed_today: s.orders_packed_today,
        avg_packing_time: s.avg_packing_time,
        accuracy_rate: s.accuracy_rate,
        created_at: new Date(s.created_at),
        updated_at: new Date(s.updated_at),
      }));
      setPackingStations(converted);
    } catch (err) {
      console.error('❌ [useLogistics] Erro ao buscar stations:', err);
      setPackingStations([]);
    }
  }, []);

  const fetchPackingJobs = useCallback(async () => {
    console.log('🔄 [useLogistics] Buscando jobs de packing');
    try {
      const response = await api.get<any[]>('/logistics/packing-jobs');
      const converted: PackingJob[] = response.map(j => ({
        id: j.id.toString(),
        sale_id: j.sale_id.toString(),
        sale_number: '',
        picking_list_id: j.picking_list_id?.toString() || '',
        station_id: j.station_id?.toString() || '',
        customer_name: j.customer_name,
        shipping_address: j.shipping_address,
        selected_box: undefined,
        weight: j.weight,
        dimensions: j.dimensions,
        items: j.items,
        status: j.status as any,
        problem_description: j.problem_description,
        shipping_label_url: j.shipping_label_url,
        invoice_url: j.invoice_url,
        packing_slip_url: j.packing_slip_url,
        packed_by: j.packed_by?.toString(),
        packed_by_name: '',
        packed_at: j.packed_at ? new Date(j.packed_at) : undefined,
        quality_checked: j.quality_checked,
        quality_checked_by: j.quality_checked_by?.toString(),
        quality_checked_at: j.quality_checked_at ? new Date(j.quality_checked_at) : undefined,
        created_at: new Date(j.created_at),
        updated_at: new Date(j.updated_at),
      }));
      setPackingJobs(converted);
    } catch (err) {
      console.error('❌ [useLogistics] Erro ao buscar packing jobs:', err);
      setPackingJobs([]);
    }
  }, []);

  const fetchDeliveries = useCallback(async () => {
    console.log('🔄 [useLogistics] Buscando entregas');
    try {
      const response = await api.get<any[]>('/logistics/deliveries');
      const converted: Delivery[] = response.map(d => ({
        id: d.id.toString(),
        sale_id: d.sale_id.toString(),
        sale_number: '',
        route_id: d.route_id?.toString(),
        sequence_number: d.sequence_number,
        customer_id: d.customer_id?.toString() || '',
        customer_name: d.customer_name,
        customer_phone: d.customer_phone,
        address: d.address,
        latitude: d.latitude,
        longitude: d.longitude,
        delivery_window_start: d.delivery_window_start ? new Date(d.delivery_window_start) : undefined,
        delivery_window_end: d.delivery_window_end ? new Date(d.delivery_window_end) : undefined,
        priority: d.priority as any,
        packages: d.packages || [],
        status: d.status as any,
        delivered_at: d.delivered_at ? new Date(d.delivered_at) : undefined,
        delivered_by: d.delivered_by?.toString(),
        recipient_name: d.recipient_name,
        signature_url: d.signature_url,
        photo_url: d.photo_url,
        failed_reason: d.failed_reason,
        failed_attempts: d.failed_attempts || 0,
        next_attempt_date: d.next_attempt_date ? new Date(d.next_attempt_date) : undefined,
        delivery_notes: d.delivery_notes,
        driver_notes: d.driver_notes,
        customer_notes: d.customer_notes,
        estimated_duration: d.estimated_duration || 0,
        created_at: new Date(d.created_at),
        updated_at: new Date(d.updated_at),
      }));
      setDeliveries(converted);
    } catch (err) {
      console.error('❌ [useLogistics] Erro ao buscar deliveries:', err);
      setDeliveries([]);
    }
  }, []);

  const fetchRoutes = useCallback(async () => {
    console.log('🔄 [useLogistics] Buscando rotas');
    try {
      const response = await api.get<any[]>('/logistics/routes');
      const converted: DeliveryRoute[] = response.map(r => ({
        id: r.id.toString(),
        route_number: r.route_number,
        date: new Date(r.date),
        workspace_id: r.workspace_id,
        vehicle_id: r.vehicle_id?.toString() || '',
        vehicle_plate: r.vehicle_plate || '',
        driver_id: r.driver_id?.toString() || '',
        driver_name: r.driver_name || '',
        deliveries: r.deliveries || [],
        optimized_sequence: r.optimized_sequence || [],
        total_distance: r.total_distance_km || 0,
        estimated_time: r.estimated_duration || 0,
        actual_time: r.actual_duration,
        total_weight: r.total_weight || 0,
        total_volume: r.total_volume || 0,
        total_stops: r.total_stops || 0,
        status: r.status as any,
        started_at: r.started_at ? new Date(r.started_at) : undefined,
        completed_at: r.completed_at ? new Date(r.completed_at) : undefined,
        on_time_deliveries: r.on_time_deliveries || 0,
        failed_deliveries: r.failed_deliveries || 0,
        success_rate: r.success_rate || 0,
        created_at: new Date(r.created_at),
        updated_at: new Date(r.updated_at),
      }));
      setRoutes(converted);
    } catch (err) {
      console.error('❌ [useLogistics] Erro ao buscar routes:', err);
      setRoutes([]);
    }
  }, []);

  const fetchVehicles = useCallback(async () => {
    console.log('🔄 [useLogistics] Buscando veículos');
    try {
      const response = await api.get<any[]>('/logistics/vehicles');
      const converted: Vehicle[] = response.map(v => ({
        id: v.id.toString(),
        license_plate: v.license_plate,
        model: v.model,
        brand: v.brand,
        year: v.year,
        max_weight: v.max_weight,
        max_volume: v.max_volume,
        status: v.status as any,
        current_location: v.current_location,
        fuel_consumption: v.fuel_consumption,
        daily_cost: v.daily_cost,
        odometer_km: v.odometer_km,
        last_maintenance_at: v.last_maintenance_at ? new Date(v.last_maintenance_at) : undefined,
        next_maintenance_km: v.next_maintenance_km,
        created_at: new Date(v.created_at),
        updated_at: new Date(v.updated_at),
      }));
      setVehicles(converted);
    } catch (err) {
      console.error('❌ [useLogistics] Erro ao buscar vehicles:', err);
      setVehicles([]);
    }
  }, []);

  const fetchBoxTypes = useCallback(async () => {
    console.log('🔄 [useLogistics] Buscando tipos de caixa');
    try {
      const response = await api.get<any[]>('/logistics/box-types');
      const converted: BoxType[] = response.map(b => ({
        id: b.id.toString(),
        name: b.name,
        code: b.code,
        internal_dimensions: {
          length: b.internal_length,
          width: b.internal_width,
          height: b.internal_height,
        },
        max_weight: b.max_weight,
        cost: b.cost,
        stock_quantity: b.stock_quantity,
        min_stock: b.min_stock || 0,
        is_active: b.is_active,
        usage_count: b.usage_count,
        created_at: new Date(b.created_at),
      }));
      setBoxTypes(converted);
    } catch (err) {
      console.error('❌ [useLogistics] Erro ao buscar box types:', err);
      setBoxTypes([]);
    }
  }, []);

  const fetchDashboard = useCallback(async () => {
    console.log('🔄 [useLogistics] Buscando dashboard');
    try {
      const response = await api.get<any>('/logistics/dashboard');
      setDashboard({
        date: new Date(),
        workspace_id: 0,
        picking: {
          pending_lists: response.picking.pending_lists || 0,
          completed_lists: response.picking.completed_lists || 0,
          total_lists: (response.picking.pending_lists || 0) + (response.picking.completed_lists || 0),
          avg_picking_time: response.picking.avg_picking_time || 0,
          accuracy_rate: response.picking.accuracy_rate || 0,
        },
        packing: {
          pending_jobs: response.packing.pending_jobs || 0,
          completed_jobs: response.packing.completed_jobs || 0,
          total_jobs: (response.packing.pending_jobs || 0) + (response.packing.completed_jobs || 0),
          avg_packing_time: response.packing.avg_packing_time || 0,
          quality_issues: response.packing.quality_issues || 0,
        },
        delivery: {
          total_deliveries: response.delivery.total_deliveries || 0,
          completed_deliveries: response.delivery.completed_deliveries || 0,
          in_route_deliveries: response.delivery.in_route_deliveries || 0,
          failed_deliveries: response.delivery.failed_deliveries || 0,
          success_rate: response.delivery.success_rate || 0,
          on_time_rate: response.delivery.on_time_rate || 0,
        },
        routes: {
          total_routes: response.routes.total_routes || 0,
          active_routes: response.routes.active_routes || 0,
          total_distance_km: response.routes.total_distance_km || 0,
          avg_stops_per_route: response.routes.avg_stops_per_route || 0,
          optimization_savings: response.routes.optimization_savings || 0,
        },
        productivity: {
          orders_per_hour: response.productivity.orders_per_hour || 0,
          items_picked_per_hour: response.productivity.items_picked_per_hour || 0,
          packages_packed_per_hour: response.productivity.packages_packed_per_hour || 0,
        },
      });
    } catch (err) {
      console.error('❌ [useLogistics] Erro ao buscar dashboard:', err);
    }
  }, []);

  // ============================================================================
  // INITIAL LOAD
  // ============================================================================

  const refresh = useCallback(async () => {
    setLoading(true);
    await Promise.all([
      fetchPickingLists(),
      fetchPackingStations(),
      fetchPackingJobs(),
      fetchDeliveries(),
      fetchRoutes(),
      fetchVehicles(),
      fetchBoxTypes(),
      fetchDashboard(),
    ]);
    setLoading(false);
  }, [fetchPickingLists, fetchPackingStations, fetchPackingJobs, fetchDeliveries, fetchRoutes, fetchVehicles, fetchBoxTypes, fetchDashboard]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // ============================================================================
  // COMPUTED VALUES
  // ============================================================================

  const pendingPicking = useMemo(() => pickingLists.filter(p => p.status === 'pending'), [pickingLists]);
  const inProgressPicking = useMemo(() => pickingLists.filter(p => p.status === 'in_progress'), [pickingLists]);
  const completedPicking = useMemo(() => pickingLists.filter(p => p.status === 'completed'), [pickingLists]);

  const pendingPacking = useMemo(() => packingJobs.filter(p => p.status === 'pending'), [packingJobs]);
  const inProgressPacking = useMemo(() => packingJobs.filter(p => p.status === 'in_progress'), [packingJobs]);
  const completedPacking = useMemo(() => packingJobs.filter(p => p.status === 'completed'), [packingJobs]);

  const pendingDeliveries = useMemo(() => deliveries.filter(d => d.status === 'pending'), [deliveries]);
  const inRouteDeliveries = useMemo(() => deliveries.filter(d => d.status === 'in_route'), [deliveries]);
  const completedDeliveries = useMemo(() => deliveries.filter(d => d.status === 'delivered'), [deliveries]);

  // ============================================================================
  // ACTIONS
  // ============================================================================

  const startPicking = useCallback(async (id: string) => {
    console.log('🔄 [useLogistics] Iniciando picking:', id);
    try {
      await api.post(`/logistics/picking-lists/${id}/start`);
      await fetchPickingLists();
    } catch (err) {
      console.error('❌ [useLogistics] Erro ao iniciar picking:', err);
    }
  }, [fetchPickingLists]);

  const completePicking = useCallback(async (id: string) => {
    console.log('🔄 [useLogistics] Completando picking:', id);
    try {
      await api.post(`/logistics/picking-lists/${id}/complete`);
      await fetchPickingLists();
    } catch (err) {
      console.error('❌ [useLogistics] Erro ao completar picking:', err);
    }
  }, [fetchPickingLists]);

  const startPacking = useCallback(async (id: string) => {
    console.log('🔄 [useLogistics] Iniciando packing:', id);
    try {
      await api.post(`/logistics/packing-jobs/${id}/start`);
      await fetchPackingJobs();
    } catch (err) {
      console.error('❌ [useLogistics] Erro ao iniciar packing:', err);
    }
  }, [fetchPackingJobs]);

  const completePacking = useCallback(async (id: string) => {
    console.log('🔄 [useLogistics] Completando packing:', id);
    try {
      await api.post(`/logistics/packing-jobs/${id}/complete`);
      await fetchPackingJobs();
    } catch (err) {
      console.error('❌ [useLogistics] Erro ao completar packing:', err);
    }
  }, [fetchPackingJobs]);

  const reportPackingProblem = useCallback((id: string, description: string) => {
    console.warn('reportPackingProblem: Não implementado');
    // TODO: Implementar endpoint para reportar problema
  }, []);

  const completeDelivery = useCallback(async (id: string) => {
    console.log('🔄 [useLogistics] Completando entrega:', id);
    try {
      await api.post(`/logistics/deliveries/${id}/complete`);
      await fetchDeliveries();
    } catch (err) {
      console.error('❌ [useLogistics] Erro ao completar entrega:', err);
    }
  }, [fetchDeliveries]);

  const failDelivery = useCallback(async (id: string, reason: string) => {
    console.log('🔄 [useLogistics] Falhando entrega:', id, reason);
    try {
      await api.post(`/logistics/deliveries/${id}/fail?reason=${encodeURIComponent(reason)}`);
      await fetchDeliveries();
    } catch (err) {
      console.error('❌ [useLogistics] Erro ao falhar entrega:', err);
    }
  }, [fetchDeliveries]);

  return {
    // Picking
    pendingPicking,
    inProgressPicking,
    completedPicking,
    startPicking,
    completePicking,

    // Packing
    packingStations,
    pendingPacking,
    inProgressPacking,
    completedPacking,
    startPacking,
    completePacking,
    reportPackingProblem,

    // Shipping
    routes,
    pendingDeliveries,
    inRouteDeliveries,
    completedDeliveries,
    vehicles,
    completeDelivery,
    failDelivery,

    // Boxes
    boxTypes,

    // Dashboard
    dashboard,

    loading,
    refresh,
  };
};
