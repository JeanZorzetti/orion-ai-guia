// ============================================
// TIPOS PARA MÓDULO DE VENDAS & ESTOQUE
// Fase 1: Controle Avançado de Estoque
// ============================================

// ============================================
// LOTES E VALIDADES
// ============================================

export interface ProductBatch {
  id: string;
  product_id: number;
  batch_number: string; // Número do lote
  manufacturing_date: Date;
  expiry_date: Date;
  quantity: number;
  supplier_id?: number;
  cost_price: number;

  // Localização
  warehouse_id: string;
  location: string; // Ex: "Corredor A, Prateleira 3, Posição 5"

  // Rastreabilidade
  origin: string; // Nota fiscal, ordem de compra, etc.
  status: 'active' | 'quarantine' | 'expired' | 'recalled';

  // Alertas
  days_to_expire?: number;
  near_expiry: boolean; // < 30 dias

  created_at: Date;
  updated_at: Date;
}

export interface ExpiryAlert {
  id: string;
  product_id: number;
  product_name: string;
  batch: ProductBatch;
  days_remaining: number;
  quantity: number;
  severity: 'critical' | 'warning' | 'info'; // < 7, < 30, < 90 dias
  action_taken?: 'promotion' | 'donation' | 'disposal' | 'none';
  resolved: boolean;
  resolved_at?: Date;
  resolved_by?: string;
  created_at: Date;
}

export interface BatchMovement {
  id: string;
  batch_id: string;
  type: 'entry' | 'exit' | 'transfer' | 'adjustment';
  quantity: number;
  from_warehouse_id?: string;
  to_warehouse_id?: string;
  reference: string; // Sale ID, Purchase ID, etc.
  user_id: string;
  notes?: string;
  created_at: Date;
}

// ============================================
// MÚLTIPLOS DEPÓSITOS
// ============================================

export interface Warehouse {
  id: string;
  name: string;
  code: string;
  workspace_id: number;

  // Endereço
  address: {
    street: string;
    number: string;
    complement?: string;
    neighborhood: string;
    city: string;
    state: string;
    zip_code: string;
    country: string;
  };

  // Configurações
  is_main: boolean;
  is_active: boolean;
  type: 'principal' | 'filial' | 'terceirizado' | 'consignado';

  // Capacidade
  total_capacity?: number; // m³
  current_occupation?: number; // m³
  areas: WarehouseArea[];

  // Responsável
  manager_id?: number;
  manager_name?: string;
  contact_phone?: string;
  contact_email?: string;

  // Coordenadas para logística
  latitude?: number;
  longitude?: number;

  created_at: Date;
  updated_at: Date;
}

export interface WarehouseArea {
  id: string;
  warehouse_id: string;
  name: string;
  type: 'racking' | 'floor' | 'cold_room' | 'quarantine' | 'expedition';
  capacity: number; // m³
  current_occupation: number; // m³
  is_active: boolean;

  // Configurações
  requires_refrigeration?: boolean;
  temperature_range?: {
    min: number;
    max: number;
  };
}

export interface ProductStock {
  product_id: number;
  warehouse_id: string;
  warehouse_name: string;

  // Quantidades
  quantity: number;
  reserved_quantity: number; // Reservado para vendas
  available_quantity: number; // Disponível para venda
  in_transit_quantity: number; // Em transferência

  // Limites
  min_stock: number; // Mínimo para este depósito
  max_stock: number; // Máximo para este depósito

  // Localização
  default_location?: string;

  // Lotes
  batches: ProductBatch[];

  // Última atualização
  last_movement_at?: Date;
  updated_at: Date;
}

export interface StockTransfer {
  id: string;
  transfer_number: string;
  workspace_id: number;

  // Origem e Destino
  from_warehouse_id: string;
  from_warehouse_name: string;
  to_warehouse_id: string;
  to_warehouse_name: string;

  // Produtos
  items: {
    id: string;
    product_id: number;
    product_name: string;
    quantity: number;
    batch_id?: string;
    batch_number?: string;
    transferred_quantity?: number; // Quantidade efetivamente transferida
  }[];

  // Status
  status: 'pending' | 'approved' | 'in_transit' | 'completed' | 'cancelled';

  // Datas
  requested_at: Date;
  approved_at?: Date;
  shipped_at?: Date;
  received_at?: Date;
  cancelled_at?: Date;

  // Responsáveis
  requested_by: string;
  requested_by_name: string;
  approved_by?: string;
  approved_by_name?: string;
  shipped_by?: string;
  received_by?: string;

  // Documentos
  shipping_document?: string;
  receiving_document?: string;

  // Notas
  notes?: string;
  cancellation_reason?: string;

  created_at: Date;
  updated_at: Date;
}

// ============================================
// CÓDIGO DE BARRAS E QR CODE
// ============================================

export interface BarcodeConfig {
  id: string;
  product_id: number;

  // Códigos
  ean13?: string; // Código de barras padrão EAN-13
  upc?: string; // Universal Product Code
  custom_barcode?: string; // Código interno
  qr_code_data?: string; // Dados para QR Code (JSON)

  // Geração automática
  auto_generate_barcode: boolean;
  barcode_prefix?: string; // Prefixo para códigos internos

  // Impressão
  label_template: 'small' | 'medium' | 'large' | 'custom';
  print_price: boolean;
  print_expiry: boolean;
  print_batch: boolean;
  print_location: boolean;

  created_at: Date;
  updated_at: Date;
}

export interface BarcodeScan {
  id: string;
  barcode: string;
  product_id: number;
  batch_id?: string;

  // Operação
  operation: 'entry' | 'exit' | 'transfer' | 'inventory' | 'sale' | 'return';
  quantity: number;

  // Localização
  warehouse_id: string;
  location?: string;

  // Contexto
  reference_id?: string; // ID da venda, transferência, etc.
  reference_type?: string;

  // Usuário
  user_id: string;
  user_name: string;

  // Dispositivo
  device_type: 'scanner' | 'camera' | 'manual';
  device_id?: string;

  scanned_at: Date;
  created_at: Date;
}

export interface LabelPrintJob {
  id: string;
  type: 'product' | 'batch' | 'location' | 'shipment';

  // Dados
  items: {
    id: string;
    product_id?: number;
    batch_id?: string;
    quantity: number;
  }[];

  // Template
  template: string;
  label_size: 'small' | 'medium' | 'large';

  // Configurações
  copies: number;
  print_date: boolean;
  print_logo: boolean;

  // Status
  status: 'pending' | 'printing' | 'completed' | 'failed';
  error_message?: string;

  // Responsável
  requested_by: string;
  requested_at: Date;
  printed_at?: Date;

  created_at: Date;
}

// ============================================
// INVENTÁRIO INTELIGENTE
// ============================================

export interface InventoryCount {
  id: string;
  inventory_number: string;
  workspace_id: number;
  name: string;

  // Tipo
  type: 'full' | 'partial' | 'cycle' | 'abc';
  status: 'draft' | 'in_progress' | 'completed' | 'approved' | 'cancelled';

  // Escopo
  warehouse_ids: string[];
  category_ids?: string[];
  product_ids?: number[]; // Para inventário parcial

  // Planejamento
  scheduled_date: Date;
  start_date?: Date;
  completion_date?: Date;
  approval_date?: Date;

  // Equipe
  team_members: string[]; // User IDs
  supervisor_id: string;
  supervisor_name: string;

  // Método
  count_method: 'blind' | 'guided'; // Cego ou guiado pelo sistema
  require_double_count: boolean; // Exigir contagem dupla
  require_approval: boolean;

  // Resultados
  items_total: number;
  items_counted: number;
  items_verified: number;
  discrepancies_found: number;
  total_value_discrepancy: number;

  // Notas
  notes?: string;
  cancellation_reason?: string;

  // Responsáveis
  created_by: string;
  created_by_name: string;
  approved_by?: string;
  approved_by_name?: string;

  created_at: Date;
  updated_at: Date;
}

export interface InventoryItem {
  id: string;
  inventory_count_id: string;
  product_id: number;
  product_name: string;
  batch_id?: string;
  batch_number?: string;
  warehouse_id: string;
  location?: string;

  // Contagem
  system_quantity: number; // Quantidade no sistema
  counted_quantity: number; // Primeira contagem
  second_count_quantity?: number; // Segunda contagem
  final_quantity: number; // Quantidade final após aprovação

  // Valores
  unit_cost: number;
  system_value: number;
  counted_value: number;

  // Divergência
  discrepancy: number; // counted - system
  discrepancy_percentage: number;
  value_discrepancy: number;

  // Status
  status: 'pending' | 'counted' | 'verified' | 'adjusted' | 'skipped';
  requires_recount: boolean;

  // Auditoria
  counted_by: string;
  counted_by_name: string;
  counted_at?: Date;
  verified_by?: string;
  verified_by_name?: string;
  verified_at?: Date;
  adjusted_at?: Date;

  // Notas
  notes?: string;

  created_at: Date;
  updated_at: Date;
}

export interface ABCAnalysis {
  product_id: number;
  product_name: string;
  category: string;

  // Classificação
  classification: 'A' | 'B' | 'C';

  // Métricas
  revenue_contribution: number; // % da receita total
  cumulative_revenue: number; // % acumulado
  total_revenue: number;
  total_quantity: number;

  // Frequência
  frequency: 'high' | 'medium' | 'low';
  sales_frequency: number; // Vendas por mês

  // Estoque
  current_stock: number;
  stock_value: number;
  turnover_rate: number; // Giro

  // Recomendações
  recommended_count_frequency: 'weekly' | 'biweekly' | 'monthly' | 'quarterly';
  recommended_min_stock: number;
  recommended_max_stock: number;

  // Período de análise
  analysis_period_start: Date;
  analysis_period_end: Date;
  generated_at: Date;
}

// ============================================
// MOVIMENTAÇÕES
// ============================================

export interface StockMovement {
  id: string;
  workspace_id: number;

  // Produto
  product_id: number;
  product_name: string;
  batch_id?: string;
  batch_number?: string;

  // Tipo
  type: 'entry' | 'exit' | 'transfer' | 'adjustment' | 'sale' | 'purchase' | 'return' | 'loss';
  subtype?: string; // Ex: 'manual_adjustment', 'inventory_adjustment', 'damage', 'theft'

  // Quantidade
  quantity: number;
  unit_cost?: number;
  total_value?: number;

  // Localização
  warehouse_id: string;
  warehouse_name: string;
  from_warehouse_id?: string;
  to_warehouse_id?: string;
  location?: string;

  // Referência
  reference_type?: 'sale' | 'purchase' | 'transfer' | 'inventory' | 'return';
  reference_id?: string;
  reference_number?: string;

  // Responsável
  user_id: string;
  user_name: string;

  // Notas
  notes?: string;
  reason?: string; // Para ajustes e perdas

  // Documentos
  document_url?: string;

  movement_date: Date;
  created_at: Date;
}

// ============================================
// CONFIGURAÇÕES
// ============================================

export interface InventorySettings {
  workspace_id: number;

  // Métodos
  stock_valuation_method: 'fifo' | 'lifo' | 'average_cost' | 'weighted_average';
  prefer_near_expiry: boolean; // Priorizar lotes próximos ao vencimento

  // Automações
  auto_reserve_on_sale: boolean; // Reservar ao vender
  auto_deduct_on_shipment: boolean; // Deduzir ao expedir
  auto_receive_on_delivery: boolean; // Receber ao entregar
  auto_return_on_cancellation: boolean; // Devolver ao cancelar

  // Validações
  prevent_negative_stock: boolean;
  warn_on_low_stock: boolean;
  require_batch_for_expiry_products: boolean; // Exigir lote para produtos com validade
  require_location: boolean;

  // Aprovações
  require_approval_for_transfers: boolean;
  require_approval_for_adjustments: boolean;
  approval_threshold?: number; // Valor acima do qual precisa aprovação

  // Alertas
  low_stock_threshold_percentage: number; // % do estoque mínimo
  critical_stock_threshold_percentage: number;
  expiry_warning_days: number; // Dias antes do vencimento para alertar

  // Inventário
  default_inventory_method: 'blind' | 'guided';
  require_double_count_on_discrepancy: boolean;
  discrepancy_tolerance_percentage: number; // % de tolerância

  updated_at: Date;
  updated_by: string;
}

// ============================================
// FILTROS E QUERIES
// ============================================

export interface BatchFilters {
  product_id?: number;
  warehouse_id?: string;
  status?: ProductBatch['status'][];
  expiring_in_days?: number;
  search?: string;
}

export interface WarehouseFilters {
  is_active?: boolean;
  type?: Warehouse['type'][];
  search?: string;
}

export interface InventoryFilters {
  status?: InventoryCount['status'][];
  type?: InventoryCount['type'][];
  warehouse_id?: string;
  date_from?: Date;
  date_to?: Date;
  search?: string;
}

export interface StockMovementFilters {
  product_id?: number;
  warehouse_id?: string;
  type?: StockMovement['type'][];
  date_from?: Date;
  date_to?: Date;
  user_id?: string;
  search?: string;
}
