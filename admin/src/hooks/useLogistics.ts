/**
 * Logistics Hook - Picking, Packing, and Shipping Management
 */

import { useState, useCallback, useMemo } from 'react';
import { addDays, differenceInMinutes, subDays } from 'date-fns';
import {
  PickingList,
  PackingJob,
  PackingStation,
  DeliveryRoute,
  Delivery,
  Vehicle,
  BoxType,
  LogisticsDashboard,
  PickingStatus,
  PackingStatus,
  DeliveryStatus,
  RouteStatus,
} from '@/types/logistics';

// ============================================================================
// MOCK DATA GENERATORS
// ============================================================================

const generateMockBoxTypes = (): BoxType[] => [
  {
    id: 'box-1',
    name: 'Caixa Pequena',
    code: 'P',
    internal_dimensions: { length: 20, width: 15, height: 10 },
    max_weight: 5,
    cost: 2.5,
    stock_quantity: 150,
    min_stock: 50,
    is_active: true,
    usage_count: 1250,
    created_at: subDays(new Date(), 180),
  },
  {
    id: 'box-2',
    name: 'Caixa Média',
    code: 'M',
    internal_dimensions: { length: 30, width: 25, height: 20 },
    max_weight: 15,
    cost: 4.0,
    stock_quantity: 200,
    min_stock: 80,
    is_active: true,
    usage_count: 2340,
    created_at: subDays(new Date(), 180),
  },
  {
    id: 'box-3',
    name: 'Caixa Grande',
    code: 'G',
    internal_dimensions: { length: 40, width: 35, height: 30 },
    max_weight: 30,
    cost: 6.5,
    stock_quantity: 100,
    min_stock: 40,
    is_active: true,
    usage_count: 890,
    created_at: subDays(new Date(), 180),
  },
  {
    id: 'box-4',
    name: 'Caixa Extra Grande',
    code: 'XG',
    internal_dimensions: { length: 60, width: 50, height: 40 },
    max_weight: 50,
    cost: 10.0,
    stock_quantity: 50,
    min_stock: 20,
    is_active: true,
    usage_count: 320,
    created_at: subDays(new Date(), 180),
  },
];

const generateMockPickingLists = (): PickingList[] => {
  const hoje = new Date();
  const statuses: PickingStatus[] = ['pending', 'in_progress', 'completed'];
  const types = ['single_order', 'batch', 'wave'] as const;
  const priorities = ['low', 'normal', 'high', 'urgent'] as const;

  return Array.from({ length: 25 }, (_, i) => {
    const status = statuses[i % 3];
    const createdAt = subDays(hoje, Math.floor(i / 3));
    const startedAt = status !== 'pending' ? addDays(createdAt, 0.05) : undefined;
    const completedAt = status === 'completed' ? addDays(createdAt, 0.15) : undefined;

    const estimatedTime = 15 + Math.floor(Math.random() * 30);
    const actualTime = completedAt ? estimatedTime + Math.floor(Math.random() * 10 - 5) : undefined;

    return {
      id: `picking-${i + 1}`,
      picking_number: `PCK-2025-${String(i + 1).padStart(5, '0')}`,
      workspace_id: 1,
      type: types[i % 3],
      sale_ids: [`sale-${i + 1}`],
      items: Array.from({ length: 2 + Math.floor(Math.random() * 5) }, (_, j) => ({
        id: `item-${i}-${j}`,
        product_id: `prod-${Math.floor(Math.random() * 50) + 1}`,
        product_name: `Produto ${Math.floor(Math.random() * 50) + 1}`,
        product_sku: `SKU-${Math.floor(Math.random() * 1000)}`,
        quantity_ordered: 1 + Math.floor(Math.random() * 10),
        quantity_picked: status === 'completed' ? 1 + Math.floor(Math.random() * 10) : 0,
        location: `A${Math.floor(Math.random() * 10) + 1}-${Math.floor(Math.random() * 20) + 1}`,
        batch_id: Math.random() > 0.7 ? `BATCH-${Math.floor(Math.random() * 100)}` : undefined,
        picked: status === 'completed',
        picker_id: status !== 'pending' ? `user-${Math.floor(Math.random() * 5) + 1}` : undefined,
        picked_at: status === 'completed' ? completedAt : undefined,
        has_issue: Math.random() > 0.95,
        issue_type: Math.random() > 0.95 ? 'out_of_stock' : undefined,
      })),
      picking_route: [],
      status,
      assigned_to: `user-${Math.floor(Math.random() * 5) + 1}`,
      assigned_to_name: ['João Silva', 'Maria Santos', 'Pedro Costa', 'Ana Lima', 'Carlos Souza'][Math.floor(Math.random() * 5)],
      started_at: startedAt,
      completed_at: completedAt,
      estimated_time: estimatedTime,
      actual_time: actualTime,
      priority: priorities[i % 4],
      created_at: createdAt,
      updated_at: completedAt || startedAt || createdAt,
    };
  });
};

const generateMockPackingStations = (): PackingStation[] => {
  const boxes = generateMockBoxTypes();

  return Array.from({ length: 6 }, (_, i) => ({
    id: `station-${i + 1}`,
    name: `Estação ${i + 1}`,
    warehouse_id: 'wh-1',
    code: `EST-${i + 1}`,
    packer_id: i < 4 ? `user-${i + 1}` : undefined,
    packer_name: i < 4 ? ['João Silva', 'Maria Santos', 'Pedro Costa', 'Ana Lima'][i] : undefined,
    is_active: true,
    available_boxes: boxes,
    orders_packed_today: Math.floor(Math.random() * 30) + 10,
    avg_packing_time: 8 + Math.floor(Math.random() * 7),
    accuracy_rate: 95 + Math.random() * 5,
    created_at: subDays(new Date(), 180),
    updated_at: new Date(),
  }));
};

const generateMockPackingJobs = (): PackingJob[] => {
  const hoje = new Date();
  const statuses: PackingStatus[] = ['pending', 'in_progress', 'completed', 'problem'];
  const boxes = generateMockBoxTypes();

  return Array.from({ length: 30 }, (_, i) => {
    const status = statuses[Math.min(Math.floor(i / 8), 2)];
    const createdAt = subDays(hoje, Math.floor(i / 5));
    const packedAt = status === 'completed' ? addDays(createdAt, 0.08) : undefined;

    return {
      id: `packing-${i + 1}`,
      sale_id: `sale-${i + 1}`,
      sale_number: `VND-2025-${String(i + 1).padStart(5, '0')}`,
      picking_list_id: `picking-${i + 1}`,
      station_id: `station-${(i % 6) + 1}`,
      customer_name: `Cliente ${i + 1}`,
      shipping_address: {
        street: `Rua ${i + 1}`,
        number: String(100 + i),
        neighborhood: 'Centro',
        city: 'São Paulo',
        state: 'SP',
        postal_code: '01000-000',
        country: 'BR',
      },
      selected_box: status !== 'pending' ? boxes[Math.floor(Math.random() * boxes.length)] : undefined,
      weight: 0.5 + Math.random() * 10,
      dimensions: {
        length: 20 + Math.random() * 40,
        width: 15 + Math.random() * 35,
        height: 10 + Math.random() * 30,
      },
      items: Array.from({ length: 1 + Math.floor(Math.random() * 4) }, (_, j) => ({
        product_id: `prod-${j + 1}`,
        product_name: `Produto ${j + 1}`,
        quantity: 1 + Math.floor(Math.random() * 3),
        packed: status === 'completed',
        verified: status === 'completed',
        verified_at: packedAt,
      })),
      status,
      problem_description: status === 'problem' ? 'Produto danificado encontrado' : undefined,
      shipping_label_url: status === 'completed' ? `https://labels.example.com/${i + 1}` : undefined,
      invoice_url: status === 'completed' ? `https://invoices.example.com/${i + 1}` : undefined,
      packing_slip_url: status === 'completed' ? `https://slips.example.com/${i + 1}` : undefined,
      packed_by: status === 'completed' ? `user-${(i % 4) + 1}` : undefined,
      packed_by_name: status === 'completed' ? ['João Silva', 'Maria Santos', 'Pedro Costa', 'Ana Lima'][i % 4] : undefined,
      packed_at: packedAt,
      quality_checked: status === 'completed',
      quality_checked_by: status === 'completed' ? `user-${(i % 4) + 1}` : undefined,
      quality_checked_at: packedAt,
      created_at: createdAt,
      updated_at: packedAt || createdAt,
    };
  });
};

const generateMockVehicles = (): Vehicle[] => [
  {
    id: 'vehicle-1',
    license_plate: 'ABC-1234',
    model: 'Fiorino',
    brand: 'Fiat',
    year: 2022,
    max_weight: 650,
    max_volume: 3.5,
    status: 'in_use',
    current_location: { latitude: -23.5505, longitude: -46.6333, updated_at: new Date() },
    fuel_consumption: 12,
    daily_cost: 150,
    odometer_km: 45000,
    created_at: subDays(new Date(), 365),
    updated_at: new Date(),
  },
  {
    id: 'vehicle-2',
    license_plate: 'XYZ-5678',
    model: 'Sprinter',
    brand: 'Mercedes-Benz',
    year: 2021,
    max_weight: 1500,
    max_volume: 12,
    status: 'in_use',
    current_location: { latitude: -23.5629, longitude: -46.6544, updated_at: new Date() },
    fuel_consumption: 10,
    daily_cost: 280,
    odometer_km: 78000,
    created_at: subDays(new Date(), 450),
    updated_at: new Date(),
  },
  {
    id: 'vehicle-3',
    license_plate: 'DEF-9012',
    model: 'Kangoo',
    brand: 'Renault',
    year: 2023,
    max_weight: 800,
    max_volume: 4.5,
    status: 'available',
    fuel_consumption: 14,
    daily_cost: 180,
    odometer_km: 12000,
    created_at: subDays(new Date(), 120),
    updated_at: new Date(),
  },
];

const generateMockDeliveries = (): Delivery[] => {
  const hoje = new Date();
  const statuses: DeliveryStatus[] = ['pending', 'in_route', 'delivered', 'failed'];
  const priorities = ['normal', 'urgent', 'express'] as const;

  return Array.from({ length: 40 }, (_, i) => {
    const status = statuses[Math.min(Math.floor(i / 10), 2)];
    const createdAt = subDays(hoje, Math.floor(i / 8));
    const deliveredAt = status === 'delivered' ? addDays(createdAt, 0.5) : undefined;

    return {
      id: `delivery-${i + 1}`,
      sale_id: `sale-${i + 1}`,
      sale_number: `VND-2025-${String(i + 1).padStart(5, '0')}`,
      route_id: status !== 'pending' ? `route-${Math.floor(i / 10) + 1}` : undefined,
      sequence_number: status !== 'pending' ? (i % 10) + 1 : undefined,
      customer_id: `customer-${i + 1}`,
      customer_name: `Cliente ${i + 1}`,
      customer_phone: `(11) 9${String(Math.floor(Math.random() * 100000000)).padStart(8, '0')}`,
      address: {
        street: `Rua ${['das Flores', 'do Comércio', 'Principal', 'XV de Novembro', 'São João'][i % 5]}`,
        number: String(100 + i * 10),
        neighborhood: ['Centro', 'Jardins', 'Vila Mariana', 'Pinheiros', 'Itaim'][i % 5],
        city: 'São Paulo',
        state: 'SP',
        postal_code: `01${String(i).padStart(3, '0')}-000`,
        country: 'BR',
        reference: Math.random() > 0.5 ? 'Próximo ao mercado' : undefined,
      },
      latitude: -23.5505 + (Math.random() - 0.5) * 0.1,
      longitude: -46.6333 + (Math.random() - 0.5) * 0.1,
      delivery_window_start: addDays(createdAt, 1),
      delivery_window_end: addDays(createdAt, 1.5),
      priority: priorities[i % 3],
      packages: [{
        id: `package-${i + 1}`,
        tracking_code: `BR${String(Math.floor(Math.random() * 1000000000)).padStart(9, '0')}BR`,
        weight: 1 + Math.random() * 10,
        dimensions: {
          length: 20 + Math.random() * 40,
          width: 15 + Math.random() * 35,
          height: 10 + Math.random() * 30,
        },
        items: [{
          product_id: `prod-${i + 1}`,
          product_name: `Produto ${i + 1}`,
          quantity: 1 + Math.floor(Math.random() * 3),
        }],
        fragile: Math.random() > 0.7,
        requires_refrigeration: Math.random() > 0.9,
      }],
      status,
      delivered_at: deliveredAt,
      delivered_by: status === 'delivered' ? `user-${(i % 3) + 1}` : undefined,
      recipient_name: status === 'delivered' ? `Recebedor ${i + 1}` : undefined,
      signature_url: status === 'delivered' ? `https://signatures.example.com/${i + 1}` : undefined,
      photo_url: status === 'delivered' ? `https://photos.example.com/${i + 1}` : undefined,
      failed_reason: status === 'failed' ? ['Cliente ausente', 'Endereço incorreto', 'Recusou receber'][i % 3] : undefined,
      failed_attempts: status === 'failed' ? 1 + Math.floor(Math.random() * 2) : 0,
      next_attempt_date: status === 'failed' ? addDays(hoje, 1) : undefined,
      delivery_notes: Math.random() > 0.7 ? 'Ligar antes de entregar' : undefined,
      estimated_duration: 5 + Math.floor(Math.random() * 10),
      created_at: createdAt,
      updated_at: deliveredAt || createdAt,
    };
  });
};

const generateMockRoutes = (): DeliveryRoute[] => {
  const hoje = new Date();
  const deliveries = generateMockDeliveries();
  const vehicles = generateMockVehicles();
  const statuses: RouteStatus[] = ['planned', 'in_progress', 'completed'];

  return Array.from({ length: 8 }, (_, i) => {
    const status = statuses[Math.min(i, 2)];
    const routeDeliveries = deliveries.slice(i * 5, (i + 1) * 5);
    const totalDistance = 15 + Math.random() * 50;
    const estimatedTime = routeDeliveries.length * 15 + totalDistance * 2;

    return {
      id: `route-${i + 1}`,
      route_number: `RTE-2025-${String(i + 1).padStart(4, '0')}`,
      date: subDays(hoje, Math.floor(i / 3)),
      workspace_id: 1,
      vehicle_id: vehicles[i % vehicles.length].id,
      vehicle_plate: vehicles[i % vehicles.length].license_plate,
      driver_id: `user-${(i % 3) + 1}`,
      driver_name: ['João Silva', 'Carlos Souza', 'Pedro Costa'][i % 3],
      deliveries: routeDeliveries,
      optimized_sequence: routeDeliveries.map(d => d.id),
      total_distance: totalDistance,
      estimated_time: estimatedTime,
      actual_time: status === 'completed' ? estimatedTime + (Math.random() - 0.5) * 30 : undefined,
      total_weight: routeDeliveries.reduce((sum, d) => sum + d.packages[0].weight, 0),
      total_volume: routeDeliveries.reduce((sum, d) => {
        const pkg = d.packages[0];
        return sum + (pkg.dimensions.length * pkg.dimensions.width * pkg.dimensions.height) / 1000000;
      }, 0),
      total_stops: routeDeliveries.length,
      status,
      started_at: status !== 'planned' ? subDays(hoje, Math.floor(i / 3)) : undefined,
      completed_at: status === 'completed' ? addDays(subDays(hoje, Math.floor(i / 3)), 0.5) : undefined,
      on_time_deliveries: status === 'completed' ? routeDeliveries.length - Math.floor(Math.random() * 2) : 0,
      failed_deliveries: status === 'completed' ? Math.floor(Math.random() * 2) : 0,
      success_rate: status === 'completed' ? 85 + Math.random() * 15 : 0,
      created_at: subDays(hoje, Math.floor(i / 3) + 1),
      updated_at: new Date(),
    };
  });
};

// ============================================================================
// HOOK
// ============================================================================

interface UseLogisticsReturn {
  // Picking
  pickingLists: PickingList[];
  pendingPicking: PickingList[];
  inProgressPicking: PickingList[];
  completedPicking: PickingList[];
  startPicking: (pickingId: string, userId: string) => void;
  completePicking: (pickingId: string) => void;

  // Packing
  packingStations: PackingStation[];
  packingJobs: PackingJob[];
  pendingPacking: PackingJob[];
  inProgressPacking: PackingJob[];
  completedPacking: PackingJob[];
  startPacking: (jobId: string, stationId: string, userId: string) => void;
  completePacking: (jobId: string, boxId: string) => void;
  reportPackingProblem: (jobId: string, problem: string) => void;

  // Shipping
  deliveries: Delivery[];
  routes: DeliveryRoute[];
  vehicles: Vehicle[];
  pendingDeliveries: Delivery[];
  inRouteDeliveries: Delivery[];
  completedDeliveries: Delivery[];
  createRoute: (deliveryIds: string[], vehicleId: string, driverId: string) => void;
  completeDelivery: (deliveryId: string, signature: string, photo: string) => void;
  failDelivery: (deliveryId: string, reason: string) => void;

  // Boxes
  boxTypes: BoxType[];
  suggestBox: (weight: number, dimensions: { length: number; width: number; height: number }) => BoxType | undefined;

  // Dashboard
  dashboard: LogisticsDashboard;

  loading: boolean;
}

export const useLogistics = (): UseLogisticsReturn => {
  const [pickingLists, setPickingLists] = useState<PickingList[]>(() => generateMockPickingLists());
  const [packingStations] = useState<PackingStation[]>(() => generateMockPackingStations());
  const [packingJobs, setPackingJobs] = useState<PackingJob[]>(() => generateMockPackingJobs());
  const [deliveries, setDeliveries] = useState<Delivery[]>(() => generateMockDeliveries());
  const [routes, setRoutes] = useState<DeliveryRoute[]>(() => generateMockRoutes());
  const [vehicles] = useState<Vehicle[]>(() => generateMockVehicles());
  const [boxTypes] = useState<BoxType[]>(() => generateMockBoxTypes());
  const [loading] = useState(false);

  // Picking filters
  const pendingPicking = useMemo(() =>
    pickingLists.filter(p => p.status === 'pending').sort((a, b) => {
      const priorityOrder = { urgent: 0, high: 1, normal: 2, low: 3 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    }),
    [pickingLists]
  );

  const inProgressPicking = useMemo(() =>
    pickingLists.filter(p => p.status === 'in_progress'),
    [pickingLists]
  );

  const completedPicking = useMemo(() =>
    pickingLists.filter(p => p.status === 'completed'),
    [pickingLists]
  );

  // Packing filters
  const pendingPacking = useMemo(() =>
    packingJobs.filter(p => p.status === 'pending'),
    [packingJobs]
  );

  const inProgressPacking = useMemo(() =>
    packingJobs.filter(p => p.status === 'in_progress'),
    [packingJobs]
  );

  const completedPacking = useMemo(() =>
    packingJobs.filter(p => p.status === 'completed'),
    [packingJobs]
  );

  // Delivery filters
  const pendingDeliveries = useMemo(() =>
    deliveries.filter(d => d.status === 'pending'),
    [deliveries]
  );

  const inRouteDeliveries = useMemo(() =>
    deliveries.filter(d => d.status === 'in_route'),
    [deliveries]
  );

  const completedDeliveries = useMemo(() =>
    deliveries.filter(d => d.status === 'delivered'),
    [deliveries]
  );

  // Actions
  const startPicking = useCallback((pickingId: string, userId: string) => {
    setPickingLists(prev => prev.map(p =>
      p.id === pickingId
        ? { ...p, status: 'in_progress', started_at: new Date(), assigned_to: userId }
        : p
    ));
  }, []);

  const completePicking = useCallback((pickingId: string) => {
    setPickingLists(prev => prev.map(p => {
      if (p.id === pickingId) {
        const now = new Date();
        const actualTime = p.started_at ? differenceInMinutes(now, p.started_at) : p.estimated_time;
        return {
          ...p,
          status: 'completed',
          completed_at: now,
          actual_time: actualTime,
          items: p.items.map(item => ({ ...item, picked: true, quantity_picked: item.quantity_ordered })),
        };
      }
      return p;
    }));
  }, []);

  const startPacking = useCallback((jobId: string, stationId: string, userId: string) => {
    setPackingJobs(prev => prev.map(j =>
      j.id === jobId
        ? { ...j, status: 'in_progress', station_id: stationId, packed_by: userId }
        : j
    ));
  }, []);

  const completePacking = useCallback((jobId: string, boxId: string) => {
    setPackingJobs(prev => prev.map(j => {
      if (j.id === jobId) {
        const now = new Date();
        const box = boxTypes.find(b => b.id === boxId);
        return {
          ...j,
          status: 'completed',
          packed_at: now,
          selected_box: box,
          items: j.items.map(item => ({ ...item, packed: true, verified: true, verified_at: now })),
          quality_checked: true,
          quality_checked_at: now,
        };
      }
      return j;
    }));
  }, [boxTypes]);

  const reportPackingProblem = useCallback((jobId: string, problem: string) => {
    setPackingJobs(prev => prev.map(j =>
      j.id === jobId
        ? { ...j, status: 'problem', problem_description: problem }
        : j
    ));
  }, []);

  const createRoute = useCallback((deliveryIds: string[], vehicleId: string, driverId: string) => {
    const hoje = new Date();
    const routeDeliveries = deliveries.filter(d => deliveryIds.includes(d.id));
    const totalDistance = 20 + Math.random() * 40;

    const newRoute: DeliveryRoute = {
      id: `route-${routes.length + 1}`,
      route_number: `RTE-2025-${String(routes.length + 1).padStart(4, '0')}`,
      date: hoje,
      workspace_id: 1,
      vehicle_id: vehicleId,
      vehicle_plate: vehicles.find(v => v.id === vehicleId)?.license_plate || '',
      driver_id: driverId,
      driver_name: 'Motorista Novo',
      deliveries: routeDeliveries,
      optimized_sequence: deliveryIds,
      total_distance: totalDistance,
      estimated_time: routeDeliveries.length * 15 + totalDistance * 2,
      total_weight: routeDeliveries.reduce((sum, d) => sum + d.packages[0].weight, 0),
      total_volume: 0,
      total_stops: routeDeliveries.length,
      status: 'planned',
      on_time_deliveries: 0,
      failed_deliveries: 0,
      success_rate: 0,
      created_at: hoje,
      updated_at: hoje,
    };

    setRoutes(prev => [...prev, newRoute]);
    setDeliveries(prev => prev.map(d =>
      deliveryIds.includes(d.id)
        ? { ...d, route_id: newRoute.id, status: 'in_route' }
        : d
    ));
  }, [deliveries, routes.length, vehicles]);

  const completeDelivery = useCallback((deliveryId: string, signature: string, photo: string) => {
    setDeliveries(prev => prev.map(d =>
      d.id === deliveryId
        ? {
            ...d,
            status: 'delivered',
            delivered_at: new Date(),
            signature_url: signature,
            photo_url: photo,
          }
        : d
    ));
  }, []);

  const failDelivery = useCallback((deliveryId: string, reason: string) => {
    setDeliveries(prev => prev.map(d =>
      d.id === deliveryId
        ? {
            ...d,
            status: 'failed',
            failed_reason: reason,
            failed_attempts: d.failed_attempts + 1,
            next_attempt_date: addDays(new Date(), 1),
          }
        : d
    ));
  }, []);

  const suggestBox = useCallback((weight: number, dimensions: { length: number; width: number; height: number }): BoxType | undefined => {
    return boxTypes
      .filter(box =>
        box.max_weight >= weight &&
        box.internal_dimensions.length >= dimensions.length &&
        box.internal_dimensions.width >= dimensions.width &&
        box.internal_dimensions.height >= dimensions.height &&
        box.is_active
      )
      .sort((a, b) => a.cost - b.cost)[0];
  }, [boxTypes]);

  // Dashboard
  const dashboard = useMemo((): LogisticsDashboard => {
    const completedPickingList = pickingLists.filter(p => p.status === 'completed');
    const avgPickingTime = completedPickingList.length > 0
      ? completedPickingList.reduce((sum, p) => sum + (p.actual_time || 0), 0) / completedPickingList.length
      : 0;

    const completedPackingList = packingJobs.filter(p => p.status === 'completed');
    const avgPackingTime = 12; // Mock value

    const deliveredList = deliveries.filter(d => d.status === 'delivered');
    const failedList = deliveries.filter(d => d.status === 'failed');
    const successRate = deliveries.length > 0
      ? (deliveredList.length / (deliveredList.length + failedList.length)) * 100
      : 0;

    return {
      date: new Date(),
      workspace_id: 1,
      picking: {
        total_lists: pickingLists.length,
        completed_lists: completedPickingList.length,
        pending_lists: pendingPicking.length,
        avg_picking_time: avgPickingTime,
        accuracy_rate: 98.5,
      },
      packing: {
        total_jobs: packingJobs.length,
        completed_jobs: completedPackingList.length,
        pending_jobs: pendingPacking.length,
        avg_packing_time: avgPackingTime,
        quality_issues: packingJobs.filter(p => p.status === 'problem').length,
      },
      delivery: {
        total_deliveries: deliveries.length,
        completed_deliveries: deliveredList.length,
        in_route_deliveries: inRouteDeliveries.length,
        failed_deliveries: failedList.length,
        success_rate: successRate,
        on_time_rate: 92.5,
      },
      routes: {
        total_routes: routes.length,
        active_routes: routes.filter(r => r.status === 'in_progress').length,
        total_distance_km: routes.reduce((sum, r) => sum + r.total_distance, 0),
        avg_stops_per_route: routes.length > 0
          ? routes.reduce((sum, r) => sum + r.total_stops, 0) / routes.length
          : 0,
        optimization_savings: 15.5,
      },
      productivity: {
        orders_per_hour: 8.5,
        items_picked_per_hour: 45,
        packages_packed_per_hour: 12,
      },
    };
  }, [pickingLists, pendingPicking, packingJobs, pendingPacking, deliveries, inRouteDeliveries, routes]);

  return {
    // Picking
    pickingLists,
    pendingPicking,
    inProgressPicking,
    completedPicking,
    startPicking,
    completePicking,

    // Packing
    packingStations,
    packingJobs,
    pendingPacking,
    inProgressPacking,
    completedPacking,
    startPacking,
    completePacking,
    reportPackingProblem,

    // Shipping
    deliveries,
    routes,
    vehicles,
    pendingDeliveries,
    inRouteDeliveries,
    completedDeliveries,
    createRoute,
    completeDelivery,
    failDelivery,

    // Boxes
    boxTypes,
    suggestBox,

    // Dashboard
    dashboard,

    loading,
  };
};
