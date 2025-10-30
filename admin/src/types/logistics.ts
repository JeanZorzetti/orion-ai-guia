/**
 * Types for Logistics and Operations Module
 * Phase 4: Picking, Packing, Shipping, and Route Optimization
 */

// ============================================================================
// PICKING & PACKING
// ============================================================================

export type PickingType = 'single_order' | 'batch' | 'wave';
export type PickingStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';
export type PackingStatus = 'pending' | 'in_progress' | 'completed' | 'problem';

export interface PickingList {
  id: string;
  picking_number: string;
  workspace_id: number;

  // Type
  type: PickingType;

  // Orders
  sale_ids: string[];

  // Items
  items: PickingItem[];

  // Optimized route
  picking_route: string[]; // Order of locations

  // Status
  status: PickingStatus;

  // Team
  assigned_to: string;
  assigned_to_name?: string;
  started_at?: Date;
  completed_at?: Date;

  // Metrics
  estimated_time: number; // minutes
  actual_time?: number;

  // Priority
  priority: 'low' | 'normal' | 'high' | 'urgent';

  created_at: Date;
  updated_at: Date;
}

export interface PickingItem {
  id: string;
  product_id: string;
  product_name: string;
  product_sku: string;

  quantity_ordered: number;
  quantity_picked: number;

  location: string; // Warehouse location
  batch_id?: string;
  serial_numbers?: string[];

  picked: boolean;
  picker_id?: string;
  picked_at?: Date;

  // Issues
  has_issue: boolean;
  issue_type?: 'out_of_stock' | 'damaged' | 'wrong_product' | 'other';
  issue_notes?: string;
}

export interface PackingStation {
  id: string;
  name: string;
  warehouse_id: string;
  code: string;

  // Configuration
  packer_id?: string;
  packer_name?: string;
  is_active: boolean;

  // Available materials
  available_boxes: BoxType[];

  // Metrics
  orders_packed_today: number;
  avg_packing_time: number; // minutes
  accuracy_rate: number; // percentage

  created_at: Date;
  updated_at: Date;
}

export interface PackingJob {
  id: string;
  sale_id: string;
  sale_number: string;
  picking_list_id: string;
  station_id: string;

  // Customer info
  customer_name: string;
  shipping_address: Address;

  // Packaging
  selected_box?: BoxType;
  weight: number; // kg
  dimensions: {
    length: number;
    width: number;
    height: number;
  };

  // Items
  items: PackingItem[];

  // Status
  status: PackingStatus;
  problem_description?: string;

  // Labels
  shipping_label_url?: string;
  invoice_url?: string;
  packing_slip_url?: string;

  // Responsible
  packed_by?: string;
  packed_by_name?: string;
  packed_at?: Date;

  // Quality check
  quality_checked: boolean;
  quality_checked_by?: string;
  quality_checked_at?: Date;

  created_at: Date;
  updated_at: Date;
}

export interface PackingItem {
  product_id: string;
  product_name: string;
  quantity: number;
  packed: boolean;

  // Verification
  verified: boolean;
  verified_at?: Date;
}

export interface BoxType {
  id: string;
  name: string;
  code: string;

  // Dimensions (cm)
  internal_dimensions: {
    length: number;
    width: number;
    height: number;
  };

  // Limits
  max_weight: number; // kg

  // Cost
  cost: number;

  // Availability
  stock_quantity: number;
  min_stock: number;

  // Usage
  is_active: boolean;
  usage_count: number;

  created_at: Date;
}

// ============================================================================
// SHIPPING & DELIVERY
// ============================================================================

export type DeliveryStatus = 'pending' | 'in_route' | 'delivered' | 'failed' | 'returned';
export type RouteStatus = 'planned' | 'in_progress' | 'completed' | 'cancelled';
export type VehicleStatus = 'available' | 'in_use' | 'maintenance';
export type DeliveryPriority = 'normal' | 'urgent' | 'express';

export interface DeliveryRoute {
  id: string;
  route_number: string;
  date: Date;
  workspace_id: number;

  // Vehicle
  vehicle_id: string;
  vehicle_plate: string;
  driver_id: string;
  driver_name: string;

  // Deliveries
  deliveries: Delivery[];
  optimized_sequence: string[]; // IDs in optimized order

  // Metrics
  total_distance: number; // km
  estimated_time: number; // minutes
  actual_time?: number;
  total_weight: number; // kg
  total_volume: number; // m³
  total_stops: number;

  // Status
  status: RouteStatus;
  started_at?: Date;
  completed_at?: Date;

  // Performance
  on_time_deliveries: number;
  failed_deliveries: number;
  success_rate: number; // percentage

  created_at: Date;
  updated_at: Date;
}

export interface Delivery {
  id: string;
  sale_id: string;
  sale_number: string;
  route_id?: string;
  sequence_number?: number;

  // Recipient
  customer_id: string;
  customer_name: string;
  customer_phone: string;
  address: Address;

  // Coordinates
  latitude?: number;
  longitude?: number;

  // Delivery window
  delivery_window_start?: Date;
  delivery_window_end?: Date;

  // Priority
  priority: DeliveryPriority;

  // Items
  packages: Package[];

  // Status
  status: DeliveryStatus;

  // Delivery
  delivered_at?: Date;
  delivered_by?: string;
  recipient_name?: string;
  signature_url?: string;
  photo_url?: string;

  // Failure
  failed_reason?: string;
  failed_attempts: number;
  next_attempt_date?: Date;

  // Notes
  delivery_notes?: string;
  driver_notes?: string;
  customer_notes?: string;

  // Estimated time at location
  estimated_duration: number; // minutes

  created_at: Date;
  updated_at: Date;
}

export interface Package {
  id: string;
  tracking_code: string;
  weight: number; // kg
  dimensions: {
    length: number;
    width: number;
    height: number;
  };

  // Contents
  items: {
    product_id: string;
    product_name: string;
    quantity: number;
  }[];

  // Handling
  fragile: boolean;
  requires_refrigeration: boolean;
  special_handling?: string;
}

export interface Address {
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;

  // Location
  latitude?: number;
  longitude?: number;

  // References
  reference?: string;
  delivery_instructions?: string;
}

export interface Vehicle {
  id: string;
  license_plate: string;
  model: string;
  brand: string;
  year: number;

  // Capacity
  max_weight: number; // kg
  max_volume: number; // m³

  // Status
  status: VehicleStatus;
  maintenance_due_date?: Date;

  // GPS
  current_location?: {
    latitude: number;
    longitude: number;
    updated_at: Date;
  };

  // Costs
  fuel_consumption: number; // km/l
  daily_cost: number;

  // Odometer
  odometer_km: number;

  created_at: Date;
  updated_at: Date;
}

export interface RouteOptimization {
  deliveries: Delivery[];
  vehicles: Vehicle[];

  // Settings
  optimize_by: 'distance' | 'time' | 'cost';
  consider_traffic: boolean;
  consider_delivery_windows: boolean;
  max_stops_per_route: number;
  start_location?: {
    latitude: number;
    longitude: number;
  };
  end_location?: {
    latitude: number;
    longitude: number;
  };

  // Result
  optimized_routes: DeliveryRoute[];
  total_distance_saved: number;
  total_time_saved: number;
  unassigned_deliveries: string[]; // IDs not allocated
}

// ============================================================================
// SHIPPING CARRIERS
// ============================================================================

export type CarrierCode = 'correios' | 'jadlog' | 'melhor_envio' | 'own_fleet' | 'other';

export interface ShippingCarrier {
  id: string;
  name: string;
  code: CarrierCode;
  workspace_id: number;

  // Credentials
  api_key?: string;
  api_secret?: string;
  api_token?: string;
  api_url?: string;

  // Configuration
  is_active: boolean;
  is_default: boolean;

  // Available services
  services: ShippingService[];

  // Integration
  supports_tracking: boolean;
  supports_label_generation: boolean;
  supports_pickup_scheduling: boolean;
  supports_real_time_quotes: boolean;

  // Settings
  default_service_code?: string;
  auto_generate_labels: boolean;
  auto_send_tracking: boolean;

  created_at: Date;
  updated_at: Date;
}

export interface ShippingService {
  code: string;
  name: string;
  delivery_time: string; // Ex: "2-3 dias úteis"
  is_active: boolean;

  // Restrictions
  max_weight?: number;
  max_dimensions?: {
    length: number;
    width: number;
    height: number;
  };
}

export interface ShippingQuote {
  carrier_id: string;
  carrier_name: string;
  service_code: string;
  service_name: string;

  // Price
  price: number;
  discount: number;
  final_price: number;

  // Deadline
  delivery_time_days: number;
  delivery_date: Date;

  // Dimensions
  calculated_weight: number; // Peso cubado
  actual_weight: number;

  // Availability
  available: boolean;
  error_message?: string;

  // Additional info
  insurance_value?: number;
  pickup_required: boolean;
}

export interface ShipmentTracking {
  tracking_code: string;
  carrier_id: string;
  carrier_name: string;
  sale_id: string;

  // Current status
  current_status: string;
  current_location: string;
  last_update: Date;

  // History
  events: TrackingEvent[];

  // Forecast
  estimated_delivery: Date;
  actual_delivery?: Date;

  // Status classification
  is_delivered: boolean;
  is_delayed: boolean;
  has_issue: boolean;

  created_at: Date;
  updated_at: Date;
}

export interface TrackingEvent {
  date: Date;
  status: string;
  location: string;
  description: string;
  details?: string;
}

// ============================================================================
// LOGISTICS DASHBOARD & ANALYTICS
// ============================================================================

export interface LogisticsDashboard {
  date: Date;
  workspace_id: number;

  // Picking metrics
  picking: {
    total_lists: number;
    completed_lists: number;
    pending_lists: number;
    avg_picking_time: number;
    accuracy_rate: number;
  };

  // Packing metrics
  packing: {
    total_jobs: number;
    completed_jobs: number;
    pending_jobs: number;
    avg_packing_time: number;
    quality_issues: number;
  };

  // Delivery metrics
  delivery: {
    total_deliveries: number;
    completed_deliveries: number;
    in_route_deliveries: number;
    failed_deliveries: number;
    success_rate: number;
    on_time_rate: number;
  };

  // Route metrics
  routes: {
    total_routes: number;
    active_routes: number;
    total_distance_km: number;
    avg_stops_per_route: number;
    optimization_savings: number;
  };

  // Productivity
  productivity: {
    orders_per_hour: number;
    items_picked_per_hour: number;
    packages_packed_per_hour: number;
  };
}

export interface WarehousePerformance {
  warehouse_id: string;
  warehouse_name: string;
  period_start: Date;
  period_end: Date;

  // Throughput
  orders_processed: number;
  items_picked: number;
  packages_shipped: number;

  // Speed
  avg_order_processing_time: number; // minutes
  avg_picking_time: number;
  avg_packing_time: number;

  // Quality
  picking_accuracy: number; // percentage
  packing_accuracy: number;
  damage_rate: number;

  // Efficiency
  space_utilization: number; // percentage
  labor_productivity: number;
  cost_per_order: number;
}

export interface DeliveryPerformance {
  driver_id: string;
  driver_name: string;
  period_start: Date;
  period_end: Date;

  // Volume
  total_deliveries: number;
  successful_deliveries: number;
  failed_deliveries: number;

  // Performance
  on_time_rate: number; // percentage
  success_rate: number;
  avg_deliveries_per_day: number;

  // Efficiency
  total_distance_km: number;
  fuel_efficiency: number; // km/l
  cost_per_delivery: number;

  // Customer satisfaction
  avg_rating?: number;
  complaints: number;
}
