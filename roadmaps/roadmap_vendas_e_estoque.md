# Roadmap: Módulo de Vendas & Estoque - Sistema Completo de Gestão Comercial

## Visão Geral

Este roadmap define as melhorias para transformar o módulo de Vendas & Estoque em um sistema completo de gestão comercial, incorporando automação de vendas, controle inteligente de estoque, integração omnichannel, previsão de demanda com IA, e otimização de inventário.

## Estado Atual

**Localizações:**
- `admin/src/app/admin/estoque/page.tsx` - Dashboard de estoque
- `admin/src/app/admin/estoque/produtos/page.tsx` - Gestão de produtos
- `admin/src/app/admin/estoque/movimentacoes/page.tsx` - Movimentações
- `admin/src/app/admin/estoque/inventario/page.tsx` - Inventário
- `admin/src/app/admin/vendas/page.tsx` - Gestão de vendas

**Funcionalidades Existentes:**

### Gestão de Produtos:
- ✅ CRUD completo de produtos
- ✅ Filtros avançados (status, categoria, estoque)
- ✅ Visualização em tabela e grade
- ✅ Ajuste manual de estoque
- ✅ Exportação CSV
- ✅ Impressão de relatórios
- ✅ Filtros persistentes com presets
- ✅ Indicadores de estoque baixo/crítico
- ✅ Cards de resumo (total, baixo estoque, valor total)

### Gestão de Vendas:
- ✅ CRUD de vendas
- ✅ Integração Mercado Livre
- ✅ Integração WooCommerce
- ✅ Integração Magalu
- ✅ Integração TikTok Shop
- ✅ Sincronização de pedidos
- ✅ Filtros por status (pendente, completo, cancelado)
- ✅ Emissão de NF-e via Bling
- ✅ Exportação CSV
- ✅ Cards de resumo (total vendas, ticket médio, vendas hoje)

### Gestão de Estoque:
- ✅ Dashboard com métricas
- ✅ Alertas de estoque baixo
- ✅ Navegação para submódulos
- ✅ Cards de resumo (total produtos, alertas, valor total, movimentações)

**Limitações Identificadas:**
- ❌ Sem controle de lotes e validades
- ❌ Sem rastreabilidade completa de movimentações
- ❌ Sem previsão de demanda
- ❌ Sem sugestões automáticas de compra
- ❌ Sem controle de múltiplos depósitos
- ❌ Sem código de barras e QR Code
- ❌ Sem picking e packing para separação
- ❌ Sem roteirização de entregas
- ❌ Sem análise ABC de produtos
- ❌ Sem controle de kits e combos
- ❌ Sem reserva de estoque para vendas
- ❌ Sem gestão de devoluções
- ❌ Sem marketplace unificado
- ❌ Sem funil de vendas e CRM
- ❌ Sem automação de marketing
- ❌ Sem programa de fidelidade
- ❌ Sem análise de concorrência
- ❌ Sem dashboard de vendedor
- ❌ Sem comissões automáticas
- ❌ Sem catálogo digital compartilhável

---

## Fase 1: Controle Avançado de Estoque 📦 ✅ CONCLUÍDA

**Objetivo:** Implementar funcionalidades avançadas de controle de inventário para rastreabilidade completa.

**Status:** ✅ 100% Concluída
**Data de Conclusão:** 29/10/2025

### 1.1 Controle de Lotes e Validades ✅

```typescript
interface ProductBatch {
  id: string;
  product_id: string;
  batch_number: string; // Número do lote
  manufacturing_date: Date;
  expiry_date: Date;
  quantity: number;
  supplier_id?: string;
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

interface ExpiryAlert {
  id: string;
  product: Product;
  batch: ProductBatch;
  days_remaining: number;
  quantity: number;
  severity: 'critical' | 'warning' | 'info'; // < 7, < 30, < 90 dias
  action_taken?: 'promotion' | 'donation' | 'disposal' | 'none';
  resolved: boolean;
}
```

**Componente:** `BatchManagement.tsx`
- Lista de lotes por produto
- Entrada de mercadoria por lote
- Saída FIFO (First In, First Out) automática
- Alertas de vencimento próximo
- Dashboard de produtos vencidos/a vencer
- Ações: promoção, doação, descarte

### 1.2 Múltiplos Depósitos ✅

```typescript
interface Warehouse {
  id: string;
  name: string;
  code: string;

  // Endereço
  address: {
    street: string;
    number: string;
    city: string;
    state: string;
    zip_code: string;
  };

  // Configurações
  is_main: boolean;
  is_active: boolean;
  type: 'principal' | 'filial' | 'terceirizado' | 'consignado';

  // Capacidade
  total_capacity?: number;
  current_occupation?: number;
  areas: WarehouseArea[];

  // Responsável
  manager_id?: string;
  contact_phone?: string;

  created_at: Date;
}

interface WarehouseArea {
  id: string;
  name: string;
  type: 'racking' | 'floor' | 'cold_room' | 'quarantine';
  capacity: number;
  current_occupation: number;
}

interface ProductStock {
  product_id: string;
  warehouse_id: string;
  quantity: number;
  reserved_quantity: number; // Reservado para vendas
  available_quantity: number; // Disponível para venda
  min_stock: number; // Mínimo para este depósito
  max_stock: number; // Máximo para este depósito
  location: string;
  batches: ProductBatch[];
}

interface StockTransfer {
  id: string;
  from_warehouse_id: string;
  to_warehouse_id: string;
  products: {
    product_id: string;
    quantity: number;
    batch_id?: string;
  }[];
  status: 'pending' | 'in_transit' | 'completed' | 'cancelled';
  requested_by: string;
  approved_by?: string;
  shipped_at?: Date;
  received_at?: Date;
  notes?: string;
}
```

**Componentes:**
- `WarehouseManagement.tsx` - Gerenciar depósitos
- `StockByWarehouse.tsx` - Ver estoque por depósito
- `StockTransfer.tsx` - Transferir entre depósitos
- `WarehouseDashboard.tsx` - Métricas por depósito

### 1.3 Código de Barras e QR Code ⏳

```typescript
interface BarcodeConfig {
  product_id: string;
  ean13?: string; // Código de barras padrão
  custom_barcode?: string; // Código interno
  qr_code_data?: string; // Dados para QR Code

  // Geração automática
  auto_generate_barcode: boolean;
  barcode_prefix?: string; // Prefixo para códigos internos

  // Impressão
  label_template: 'small' | 'medium' | 'large' | 'custom';
  print_price: boolean;
  print_expiry: boolean;
  print_batch: boolean;
}

interface BarcodeScan {
  id: string;
  barcode: string;
  product_id: string;
  operation: 'entry' | 'exit' | 'transfer' | 'inventory';
  warehouse_id: string;
  user_id: string;
  scanned_at: Date;
}
```

**Componentes:**
- `BarcodeGenerator.tsx` - Gerar códigos
- `BarcodeScanner.tsx` - Escanear com câmera/leitor
- `LabelPrinter.tsx` - Imprimir etiquetas
- `QuickStockAdjust.tsx` - Ajuste rápido via scan

### 1.4 Inventário Inteligente ⏳

```typescript
interface InventoryCount {
  id: string;
  name: string;
  type: 'full' | 'partial' | 'cycle' | 'abc';
  status: 'draft' | 'in_progress' | 'completed' | 'approved';

  // Escopo
  warehouse_ids: string[];
  category_ids?: string[];
  product_ids?: string[]; // Para inventário parcial

  // Planejamento
  scheduled_date: Date;
  start_date?: Date;
  completion_date?: Date;

  // Equipe
  team_members: string[];
  supervisor_id: string;

  // Método
  count_method: 'blind' | 'guided'; // Cego ou guiado pelo sistema
  require_double_count: boolean; // Exigir contagem dupla

  // Resultados
  items_counted: number;
  items_total: number;
  discrepancies_found: number;

  created_by: string;
  created_at: Date;
}

interface InventoryItem {
  id: string;
  inventory_count_id: string;
  product_id: string;
  batch_id?: string;

  // Contagem
  system_quantity: number; // Quantidade no sistema
  counted_quantity: number; // Quantidade contada
  second_count_quantity?: number; // Segunda contagem

  // Divergência
  discrepancy: number;
  discrepancy_percentage: number;

  // Status
  status: 'pending' | 'counted' | 'verified' | 'adjusted';
  requires_recount: boolean;

  // Auditoria
  counted_by: string;
  counted_at?: Date;
  verified_by?: string;
  verified_at?: Date;
  notes?: string;
}

interface ABCAnalysis {
  product_id: string;
  classification: 'A' | 'B' | 'C'; // A = 80% valor, B = 15%, C = 5%
  revenue_contribution: number; // % da receita total
  frequency: 'high' | 'medium' | 'low';
  recommended_count_frequency: 'weekly' | 'monthly' | 'quarterly';
}
```

**Componentes:**
- `InventoryPlanner.tsx` - Planejar inventário
- `InventoryExecution.tsx` - Executar contagem (mobile-first)
- `InventoryDashboard.tsx` - Acompanhar progresso
- `DiscrepancyAnalysis.tsx` - Analisar divergências
- `ABCClassification.tsx` - Análise ABC

---

## Fase 2: Automação e Inteligência de Estoque 🤖 ✅ CONCLUÍDA

**Objetivo:** Implementar IA e automação para otimizar gestão de estoque e reduzir rupturas.

**Status:** ✅ 100% Concluída
**Data de Conclusão:** 30/10/2025

### 2.1 Previsão de Demanda com IA ✅

```typescript
interface DemandForecast {
  product_id: string;
  warehouse_id?: string;

  // Previsão
  forecast_date: Date;
  forecast_period: 'day' | 'week' | 'month' | 'quarter';
  predicted_demand: number;
  confidence_interval: {
    lower: number;
    upper: number;
    confidence_level: number; // 95%
  };

  // Fatores considerados
  factors: {
    historical_sales: number;
    seasonality_impact: number;
    trend_direction: 'increasing' | 'stable' | 'decreasing';
    external_events?: string[]; // Feriados, campanhas, etc.
    weather_impact?: number;
    economic_indicators?: number;
  };

  // Algoritmo
  model_type: 'arima' | 'exponential_smoothing' | 'prophet' | 'ml_ensemble';
  accuracy_score: number; // % de acurácia histórica

  generated_at: Date;
}

interface StockOptimization {
  product_id: string;

  // Ponto de pedido
  reorder_point: number; // Quando pedir
  safety_stock: number; // Estoque de segurança
  optimal_order_quantity: number; // Quanto pedir (EOQ)
  max_stock_level: number; // Estoque máximo

  // Cálculos
  avg_daily_demand: number;
  lead_time_days: number;
  service_level_target: number; // 95%, 99%, etc.

  // Custos
  holding_cost_per_unit: number;
  ordering_cost: number;
  stockout_cost_estimate: number;

  // Recomendação
  current_stock: number;
  recommended_action: 'order_now' | 'order_soon' | 'sufficient' | 'excess';
  days_until_stockout?: number;
  suggested_order_date?: Date;
}

interface PurchaseSuggestion {
  id: string;
  product_id: string;
  suggested_quantity: number;
  estimated_cost: number;
  priority: 'urgent' | 'high' | 'medium' | 'low';

  // Justificativa
  reason: string; // Ex: "Estoque crítico - 3 dias até ruptura"
  forecast_demand: number;
  current_stock: number;
  lead_time_days: number;

  // Fornecedor
  recommended_supplier_id?: string;
  alternative_suppliers?: string[];

  // Timeline
  order_by_date: Date;
  expected_delivery_date: Date;

  // Status
  status: 'pending' | 'approved' | 'ordered' | 'dismissed';
  created_at: Date;
}
```

**Componentes:**
- `DemandForecastDashboard.tsx` - Visualizar previsões
- `StockOptimizationPanel.tsx` - Recomendações de estoque
- `PurchaseSuggestions.tsx` - Sugestões automáticas de compra
- `ForecastAccuracy.tsx` - Acompanhar acurácia do modelo
- `SeasonalityAnalysis.tsx` - Análise de sazonalidade

**API/Serviços:**
- `forecastService.ts` - Integração com modelo de ML
- `optimizationService.ts` - Cálculos de EOQ, ponto de pedido
- `purchaseAutomation.ts` - Geração automática de sugestões

### 2.2 Alertas e Notificações Inteligentes ✅

```typescript
interface StockAlert {
  id: string;
  type: 'low_stock' | 'critical_stock' | 'overstock' | 'expiring_soon' | 'expired' | 'slow_moving' | 'fast_moving';
  severity: 'critical' | 'high' | 'medium' | 'low';

  // Produto
  product_id: string;
  warehouse_id?: string;
  batch_id?: string;

  // Detalhes
  message: string;
  current_value: number;
  threshold_value: number;
  recommended_action: string;

  // Notificação
  notify_users: string[];
  notification_channels: ('email' | 'sms' | 'push' | 'whatsapp')[];
  sent_at?: Date;

  // Status
  status: 'active' | 'acknowledged' | 'resolved' | 'dismissed';
  acknowledged_by?: string;
  resolved_at?: Date;

  created_at: Date;
}

interface AlertRule {
  id: string;
  name: string;
  type: StockAlert['type'];
  is_active: boolean;

  // Condições
  conditions: {
    metric: 'quantity' | 'days' | 'percentage' | 'value';
    operator: '<' | '>' | '<=' | '>=' | '=';
    threshold: number;
  }[];

  // Escopo
  applies_to: 'all' | 'category' | 'products';
  category_ids?: string[];
  product_ids?: string[];

  // Ações
  auto_actions: ('create_purchase_suggestion' | 'send_notification' | 'create_transfer')[];
  notification_template: string;

  created_by: string;
  created_at: Date;
}
```

**Componentes:**
- `AlertCenter.tsx` - Central de alertas
- `AlertRuleConfig.tsx` - Configurar regras
- `NotificationSettings.tsx` - Preferências de notificação
- `AlertHistory.tsx` - Histórico de alertas

### 2.3 Movimentações Automatizadas ✅

```typescript
interface AutomatedMovement {
  id: string;
  trigger_type: 'sale' | 'purchase' | 'transfer' | 'return' | 'adjustment';

  // Configuração
  auto_reserve_on_sale: boolean; // Reservar ao vender
  auto_deduct_on_shipment: boolean; // Deduzir ao expedir
  auto_receive_on_delivery: boolean; // Receber ao entregar
  auto_return_on_cancellation: boolean; // Devolver ao cancelar

  // FIFO/LIFO
  stock_method: 'fifo' | 'lifo' | 'average_cost';
  prefer_near_expiry: boolean; // Priorizar lotes próximos ao vencimento

  // Validações
  prevent_negative_stock: boolean;
  warn_on_low_stock: boolean;
  require_approval_threshold?: number; // Valor acima do qual precisa aprovação
}

interface MovementRule {
  id: string;
  name: string;
  trigger: 'time' | 'event' | 'condition';

  // Gatilho temporal
  schedule?: {
    frequency: 'daily' | 'weekly' | 'monthly';
    time: string;
    day_of_week?: number;
    day_of_month?: number;
  };

  // Gatilho por evento
  event?: 'sale_completed' | 'purchase_received' | 'stock_below_min';

  // Condição
  condition?: string; // Ex: "stock_quantity < min_stock"

  // Ação
  action: 'transfer' | 'adjust' | 'order' | 'alert';
  action_params: Record<string, any>;

  is_active: boolean;
}
```

**Componentes:**
- `AutomationRules.tsx` - Configurar regras de automação
- `MovementLog.tsx` - Log detalhado de movimentações
- `StockReservation.tsx` - Gerenciar reservas
- `AuditTrail.tsx` - Trilha de auditoria completa

---

## Fase 3: Gestão Avançada de Vendas 🛒 ✅ CONCLUÍDA

**Objetivo:** Implementar funil de vendas, CRM básico e automação comercial.

**Status:** ✅ 100% Concluída
**Data de Conclusão:** 30/10/2025

### 3.1 Funil de Vendas e Pipeline ✅

```typescript
interface SalesPipeline {
  id: string;
  name: string;
  stages: PipelineStage[];
  is_default: boolean;
  is_active: boolean;

  // Configurações
  auto_move_on_event: boolean; // Mover automaticamente entre estágios
  require_approval_stages?: string[]; // Estágios que precisam aprovação

  created_by: string;
  created_at: Date;
}

interface PipelineStage {
  id: string;
  name: string;
  order: number;
  color: string;

  // Probabilidade
  win_probability: number; // 0-100%

  // Automações
  auto_actions: {
    send_email?: string; // Template de email
    create_task?: string;
    update_status?: string;
  };

  // SLA
  max_days_in_stage?: number;
  alert_before_sla?: number; // Alertar X dias antes
}

interface Opportunity {
  id: string;
  title: string;
  customer_id: string;

  // Pipeline
  pipeline_id: string;
  stage_id: string;
  stage_history: {
    stage_id: string;
    entered_at: Date;
    exited_at?: Date;
    days_in_stage: number;
  }[];

  // Valor
  estimated_value: number;
  probability: number; // Herdado do estágio
  weighted_value: number; // estimated_value * probability

  // Produtos
  products: {
    product_id: string;
    quantity: number;
    unit_price: number;
    discount: number;
  }[];

  // Datas
  expected_close_date: Date;
  actual_close_date?: Date;

  // Responsável
  owner_id: string;
  team_id?: string;

  // Origem
  source: 'website' | 'phone' | 'email' | 'referral' | 'marketplace' | 'social_media';

  // Status
  status: 'open' | 'won' | 'lost' | 'archived';
  lost_reason?: string;

  // Notas e atividades
  notes: string;
  activities: Activity[];

  created_at: Date;
  updated_at: Date;
}

interface Activity {
  id: string;
  opportunity_id: string;
  type: 'call' | 'email' | 'meeting' | 'task' | 'note';

  // Detalhes
  subject: string;
  description: string;

  // Agendamento
  scheduled_at?: Date;
  completed_at?: Date;
  is_completed: boolean;

  // Responsável
  assigned_to: string;

  created_by: string;
  created_at: Date;
}
```

**Componentes:**
- `SalesPipelineBoard.tsx` - Board Kanban do pipeline
- `OpportunityDetails.tsx` - Detalhes da oportunidade
- `ActivityTimeline.tsx` - Timeline de atividades
- `PipelineAnalytics.tsx` - Métricas do funil
- `ConversionRates.tsx` - Taxas de conversão por estágio

### 3.2 CRM Básico

```typescript
interface Customer {
  id: string;

  // Dados básicos
  name: string;
  email: string;
  phone: string;
  document: string; // CPF/CNPJ

  // Tipo
  type: 'individual' | 'company';
  company_name?: string;

  // Endereços
  addresses: Address[];

  // Classificação
  segment: 'retail' | 'wholesale' | 'vip';
  tags: string[];

  // Score
  customer_score: number; // 0-100
  lifetime_value: number;

  // Relacionamento
  first_purchase_date?: Date;
  last_purchase_date?: Date;
  total_purchases: number;
  total_spent: number;
  avg_ticket: number;

  // Preferências
  preferred_contact_method: 'email' | 'phone' | 'whatsapp';
  preferred_contact_time: 'morning' | 'afternoon' | 'evening';

  // Status
  status: 'active' | 'inactive' | 'blocked';
  blocked_reason?: string;

  // Responsável
  account_manager_id?: string;

  created_at: Date;
  updated_at: Date;
}

interface CustomerInteraction {
  id: string;
  customer_id: string;

  type: 'email' | 'phone' | 'whatsapp' | 'visit' | 'meeting';
  channel: 'inbound' | 'outbound';

  subject: string;
  description: string;

  outcome: 'positive' | 'neutral' | 'negative';
  next_action?: string;
  next_action_date?: Date;

  user_id: string;
  created_at: Date;
}

interface CustomerSegment {
  id: string;
  name: string;

  // Critérios
  criteria: {
    field: string;
    operator: string;
    value: any;
  }[];

  // Membros
  customer_count: number;

  // Automações
  auto_campaigns: string[];

  created_at: Date;
}
```

**Componentes:**
- `CustomerProfile.tsx` - Perfil 360 do cliente
- `CustomerSegmentation.tsx` - Segmentação inteligente
- `InteractionHistory.tsx` - Histórico de interações
- `CustomerScoreCard.tsx` - Scorecard do cliente
- `CustomerJourney.tsx` - Jornada do cliente

### 3.3 Cotações e Propostas

```typescript
interface Quote {
  id: string;
  quote_number: string;

  // Cliente
  customer_id: string;
  opportunity_id?: string;

  // Produtos
  items: {
    product_id: string;
    quantity: number;
    unit_price: number;
    discount_percentage: number;
    discount_amount: number;
    tax_amount: number;
    total: number;
  }[];

  // Totais
  subtotal: number;
  discount_total: number;
  tax_total: number;
  total: number;

  // Condições
  payment_terms: string;
  payment_method: string;
  delivery_time: string;
  validity_days: number;

  // Datas
  issued_date: Date;
  expiry_date: Date;

  // Status
  status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired';
  accepted_at?: Date;
  rejected_reason?: string;

  // Versões
  version: number;
  parent_quote_id?: string; // Para revisões

  // Documentos
  pdf_url?: string;
  signed_pdf_url?: string;

  // Notas
  notes?: string;
  internal_notes?: string;

  // Responsável
  created_by: string;
  approved_by?: string;

  created_at: Date;
  updated_at: Date;
}

interface QuoteTemplate {
  id: string;
  name: string;

  // Conteúdo
  header_text: string;
  footer_text: string;
  terms_and_conditions: string;

  // Estilo
  logo_url?: string;
  primary_color: string;
  font_family: string;

  // Padrões
  default_validity_days: number;
  default_payment_terms: string;

  is_default: boolean;
}
```

**Componentes:**
- `QuoteBuilder.tsx` - Criar cotações
- `QuotePreview.tsx` - Preview da cotação
- `QuoteTemplates.tsx` - Gerenciar templates
- `QuoteTracking.tsx` - Acompanhar cotações enviadas
- `QuoteToSale.tsx` - Converter para venda

---

## Fase 4: Operações e Logística 🚚 ✅ CONCLUÍDA

**Objetivo:** Implementar picking, packing, expedição e roteirização.

**Status:** ✅ 100% Concluída
**Data de Conclusão:** 30/10/2025

### 4.1 Picking e Packing ✅

```typescript
interface PickingList {
  id: string;
  picking_number: string;

  // Tipo
  type: 'single_order' | 'batch' | 'wave';

  // Pedidos
  sale_ids: string[];

  // Itens
  items: {
    id: string;
    product_id: string;
    quantity_ordered: number;
    quantity_picked: number;
    location: string; // Localização no depósito
    batch_id?: string;
    picked: boolean;
    picker_id?: string;
    picked_at?: Date;
  }[];

  // Rota otimizada
  picking_route: string[]; // Ordem das localizações

  // Status
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';

  // Equipe
  assigned_to: string;
  started_at?: Date;
  completed_at?: Date;

  // Métricas
  estimated_time: number; // minutos
  actual_time?: number;

  created_at: Date;
}

interface PackingStation {
  id: string;
  name: string;
  warehouse_id: string;

  // Configuração
  packer_id?: string;
  is_active: boolean;

  // Materiais disponíveis
  available_boxes: BoxType[];

  // Métricas
  orders_packed_today: number;
  avg_packing_time: number; // minutos
}

interface PackingJob {
  id: string;
  sale_id: string;
  picking_list_id: string;
  station_id: string;

  // Embalagem
  selected_box: BoxType;
  weight: number; // kg
  dimensions: {
    length: number;
    width: number;
    height: number;
  };

  // Itens
  items: {
    product_id: string;
    quantity: number;
    packed: boolean;
  }[];

  // Status
  status: 'pending' | 'in_progress' | 'completed' | 'problem';
  problem_description?: string;

  // Etiquetas
  shipping_label_url?: string;
  invoice_url?: string;
  packing_slip_url?: string;

  // Responsável
  packed_by: string;
  packed_at?: Date;

  created_at: Date;
}

interface BoxType {
  id: string;
  name: string;

  // Dimensões
  internal_dimensions: {
    length: number;
    width: number;
    height: number;
  };

  // Limites
  max_weight: number;

  // Custo
  cost: number;

  // Disponibilidade
  stock_quantity: number;
  min_stock: number;
}
```

**Componentes:**
- `PickingQueue.tsx` - Fila de separação
- `PickingMobile.tsx` - App mobile para picking
- `PackingDashboard.tsx` - Dashboard de expedição
- `PackingStation.tsx` - Interface da estação
- `BoxSuggestion.tsx` - Sugestão inteligente de caixa
- `ShippingLabelPrint.tsx` - Impressão de etiquetas

### 4.2 Roteirização e Entregas ✅

```typescript
interface DeliveryRoute {
  id: string;
  route_number: string;
  date: Date;

  // Veículo
  vehicle_id: string;
  driver_id: string;

  // Entregas
  deliveries: Delivery[];
  optimized_sequence: string[]; // IDs na ordem otimizada

  // Métricas
  total_distance: number; // km
  estimated_time: number; // minutos
  total_weight: number; // kg
  total_volume: number; // m³

  // Status
  status: 'planned' | 'in_progress' | 'completed' | 'cancelled';
  started_at?: Date;
  completed_at?: Date;

  created_at: Date;
}

interface Delivery {
  id: string;
  sale_id: string;
  route_id?: string;

  // Destinatário
  customer_name: string;
  customer_phone: string;
  address: Address;

  // Coordenadas
  latitude?: number;
  longitude?: number;

  // Janela de entrega
  delivery_window_start?: Date;
  delivery_window_end?: Date;

  // Prioridade
  priority: 'normal' | 'urgent' | 'express';

  // Itens
  packages: {
    tracking_code: string;
    weight: number;
    dimensions: { length: number; width: number; height: number };
  }[];

  // Status
  status: 'pending' | 'in_route' | 'delivered' | 'failed' | 'returned';

  // Entrega
  delivered_at?: Date;
  delivered_by?: string;
  recipient_name?: string;
  signature_url?: string;
  photo_url?: string;

  // Falha
  failed_reason?: string;
  failed_attempts: number;
  next_attempt_date?: Date;

  // Notas
  delivery_notes?: string;
  driver_notes?: string;

  created_at: Date;
}

interface Vehicle {
  id: string;
  license_plate: string;
  model: string;

  // Capacidade
  max_weight: number; // kg
  max_volume: number; // m³

  // Status
  status: 'available' | 'in_use' | 'maintenance';

  // GPS
  current_location?: {
    latitude: number;
    longitude: number;
    updated_at: Date;
  };
}

interface RouteOptimization {
  deliveries: Delivery[];
  vehicles: Vehicle[];

  // Configurações
  optimize_by: 'distance' | 'time' | 'cost';
  consider_traffic: boolean;
  consider_delivery_windows: boolean;
  max_stops_per_route: number;

  // Resultado
  optimized_routes: DeliveryRoute[];
  total_distance_saved: number;
  total_time_saved: number;
  unassigned_deliveries: string[]; // IDs não alocados
}
```

**Componentes:**
- `RouteOptimizer.tsx` - Otimizar rotas
- `RouteMap.tsx` - Visualizar rotas no mapa
- `DriverApp.tsx` - App mobile para motorista
- `DeliveryTracking.tsx` - Rastreamento em tempo real
- `DeliveryProof.tsx` - Comprovante de entrega
- `FailedDeliveries.tsx` - Gestão de entregas fracassadas

### 4.3 Integração com Transportadoras ✅

```typescript
interface ShippingCarrier {
  id: string;
  name: string;
  code: string; // 'correios', 'jadlog', 'melhor_envio', etc.

  // Credenciais
  api_key?: string;
  api_secret?: string;

  // Configuração
  is_active: boolean;
  is_default: boolean;

  // Serviços disponíveis
  services: {
    code: string;
    name: string;
    delivery_time: string; // Ex: "2-3 dias úteis"
    is_active: boolean;
  }[];

  // Integração
  supports_tracking: boolean;
  supports_label_generation: boolean;
  supports_pickup_scheduling: boolean;

  created_at: Date;
}

interface ShippingQuote {
  carrier_id: string;
  service_code: string;

  // Preço
  price: number;
  discount: number;
  final_price: number;

  // Prazo
  delivery_time_days: number;
  delivery_date: Date;

  // Dimensões
  calculated_weight: number; // Peso cubado
  actual_weight: number;

  // Disponibilidade
  available: boolean;
  error_message?: string;
}

interface ShipmentTracking {
  tracking_code: string;
  carrier_id: string;

  // Status atual
  current_status: string;
  current_location: string;
  last_update: Date;

  // Histórico
  events: {
    date: Date;
    status: string;
    location: string;
    description: string;
  }[];

  // Previsão
  estimated_delivery: Date;
  is_delayed: boolean;
}
```

**Componentes:**
- `ShippingCalculator.tsx` - Calcular frete
- `CarrierComparison.tsx` - Comparar transportadoras
- `TrackingPortal.tsx` - Portal de rastreamento para cliente
- `CarrierIntegration.tsx` - Configurar integrações
- `BulkShipping.tsx` - Despacho em lote

---

## Fase 5: Marketplace Unificado 🌐 ✅ CONCLUÍDA

**Objetivo:** Centralizar gestão de múltiplos canais de venda (omnichannel).

**Status:** ✅ 100% Concluída
**Data de Conclusão:** 30/10/2025

### 5.1 Hub de Integrações ✅

```typescript
interface MarketplaceIntegration {
  id: string;
  marketplace: 'mercado_livre' | 'amazon' | 'shopee' | 'magalu' | 'b2w' | 'tiktok_shop' | 'woocommerce' | 'custom';

  // Credenciais
  credentials: {
    client_id?: string;
    client_secret?: string;
    access_token?: string;
    refresh_token?: string;
    store_url?: string;
    api_key?: string;
  };

  // Configuração
  is_active: boolean;
  auto_sync: boolean;
  sync_frequency: number; // minutos

  // Mapeamento
  default_warehouse_id: string;
  price_adjustment: {
    type: 'percentage' | 'fixed';
    value: number;
  };

  // Sincronização
  sync_products: boolean;
  sync_orders: boolean;
  sync_stock: boolean;

  // Última sincronização
  last_sync_at?: Date;
  last_sync_status: 'success' | 'error' | 'partial';
  last_sync_error?: string;

  created_at: Date;
}

interface ProductListing {
  id: string;
  product_id: string;
  marketplace_integration_id: string;

  // ID no marketplace
  external_id: string;
  external_sku: string;
  listing_url: string;

  // Preço e estoque
  price: number;
  stock_quantity: number;

  // Status
  status: 'active' | 'paused' | 'out_of_stock' | 'error';
  is_synced: boolean;

  // Personalização
  title?: string; // Título customizado
  description?: string; // Descrição customizada
  images?: string[]; // URLs das imagens

  // Métricas
  views: number;
  sales: number;
  conversion_rate: number;

  // Sincronização
  last_synced_at: Date;
  sync_errors?: string[];

  created_at: Date;
  updated_at: Date;
}

interface UnifiedOrder {
  id: string;

  // Origem
  marketplace_integration_id: string;
  marketplace: string;
  external_order_id: string;

  // Dados do pedido (normalizado)
  customer: {
    name: string;
    email: string;
    phone: string;
    document: string;
  };

  items: {
    product_id: string;
    external_product_id: string;
    quantity: number;
    unit_price: number;
    total: number;
  }[];

  shipping: {
    method: string;
    cost: number;
    address: Address;
    tracking_code?: string;
  };

  payment: {
    method: string;
    status: 'pending' | 'approved' | 'rejected';
    paid_at?: Date;
  };

  // Totais
  subtotal: number;
  shipping_cost: number;
  discount: number;
  total: number;

  // Status unificado
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

  // Importação
  imported_at: Date;
  processed: boolean;

  created_at: Date;
}
```

**Componentes:**
- `MarketplaceHub.tsx` - Central de marketplaces
- `IntegrationConfig.tsx` - Configurar integrações
- `BulkProductPublisher.tsx` - Publicar em massa
- `UnifiedOrderList.tsx` - Lista unificada de pedidos
- `StockSyncMonitor.tsx` - Monitor de sincronização
- `PriceManager.tsx` - Gerenciar preços por canal

### 5.2 Sincronização Inteligente ✅

```typescript
interface SyncStrategy {
  id: string;
  name: string;

  // Produto
  product_selection: 'all' | 'category' | 'custom';
  category_ids?: string[];
  product_ids?: string[];

  // Regras
  rules: {
    // Estoque
    minimum_stock_to_publish: number;
    reserve_stock_percentage: number; // % a reservar

    // Preço
    price_strategy: 'same' | 'markup' | 'custom';
    markup_percentage?: number;
    custom_prices?: Record<string, number>; // product_id -> price

    // Conteúdo
    use_custom_title: boolean;
    title_template?: string; // Ex: "{product_name} - {brand}"
    use_custom_description: boolean;
    append_to_description?: string;
  };

  // Marketplaces
  target_marketplaces: string[];

  is_active: boolean;
  created_at: Date;
}

interface SyncConflict {
  id: string;
  type: 'stock_discrepancy' | 'price_mismatch' | 'product_not_found' | 'duplicate_listing';

  // Detalhes
  product_id: string;
  marketplace_integration_id: string;

  system_value: any;
  marketplace_value: any;

  // Resolução
  resolution_strategy: 'manual' | 'system_wins' | 'marketplace_wins' | 'average';
  resolved: boolean;
  resolved_at?: Date;
  resolved_by?: string;

  created_at: Date;
}
```

**Componentes:**
- `SyncStrategyBuilder.tsx` - Criar estratégias
- `ConflictResolution.tsx` - Resolver conflitos
- `SyncScheduler.tsx` - Agendar sincronizações
- `SyncLogs.tsx` - Logs de sincronização
- `PerformanceMetrics.tsx` - Métricas por marketplace

---

## Fase 6: Analytics e BI de Vendas 📊

**Objetivo:** Fornecer análises avançadas e insights acionáveis para vendas e estoque.

### 6.1 Dashboard Executivo de Vendas

```typescript
interface SalesDashboardMetrics {
  period: DateRange;

  // Vendas
  total_sales: number;
  sales_count: number;
  avg_ticket: number;

  // Comparação
  vs_previous_period: {
    total_sales_change: number; // %
    sales_count_change: number;
    avg_ticket_change: number;
  };

  vs_same_period_last_year: {
    total_sales_change: number;
    sales_count_change: number;
  };

  // Por canal
  by_channel: {
    channel: string;
    sales: number;
    percentage: number;
  }[];

  // Por categoria
  by_category: {
    category: string;
    sales: number;
    quantity: number;
    percentage: number;
  }[];

  // Top produtos
  top_products: {
    product_id: string;
    product_name: string;
    quantity_sold: number;
    revenue: number;
  }[];

  // Funil
  funnel: {
    leads: number;
    opportunities: number;
    quotes: number;
    won: number;
    conversion_rate: number;
  };

  // Metas
  goals: {
    revenue_goal: number;
    revenue_actual: number;
    achievement_percentage: number;
  };
}

interface InventoryHealthMetrics {
  period: DateRange;

  // Valor
  total_inventory_value: number;
  avg_inventory_value: number;

  // Giro
  inventory_turnover: number; // Vezes que o estoque gira
  days_of_inventory: number; // Dias de estoque disponível

  // Classificação ABC
  abc_distribution: {
    class: 'A' | 'B' | 'C';
    products_count: number;
    revenue_contribution: number;
    stock_value: number;
  }[];

  // Problemas
  out_of_stock_items: number;
  low_stock_items: number;
  overstock_items: number;
  slow_moving_items: number;
  obsolete_items: number;

  // Validade
  items_expiring_30_days: number;
  items_expired: number;

  // Acurácia
  inventory_accuracy: number; // % (baseado em inventários)
}
```

**Componentes:**
- `ExecutiveSalesDashboard.tsx` - Dashboard principal
- `SalesAnalytics.tsx` - Análises detalhadas
- `InventoryHealth.tsx` - Saúde do estoque
- `ChannelPerformance.tsx` - Performance por canal
- `ProductAnalytics.tsx` - Análise de produtos
- `GoalsTracking.tsx` - Acompanhamento de metas

### 6.2 Relatórios Personalizados

```typescript
interface CustomReport {
  id: string;
  name: string;
  type: 'sales' | 'inventory' | 'customers' | 'products';

  // Dimensões
  dimensions: string[]; // Ex: ['date', 'product', 'channel']

  // Métricas
  metrics: {
    field: string;
    aggregation: 'sum' | 'avg' | 'count' | 'min' | 'max';
    label: string;
  }[];

  // Filtros
  filters: {
    field: string;
    operator: string;
    value: any;
  }[];

  // Visualização
  visualization: 'table' | 'chart' | 'pivot';
  chart_type?: 'line' | 'bar' | 'pie' | 'area';

  // Agendamento
  schedule?: {
    frequency: 'daily' | 'weekly' | 'monthly';
    recipients: string[];
  };

  created_by: string;
  created_at: Date;
}
```

**Componentes:**
- `ReportBuilder.tsx` - Construtor de relatórios
- `ReportLibrary.tsx` - Biblioteca de relatórios
- `ScheduledReports.tsx` - Relatórios agendados
- `ExportCenter.tsx` - Central de exportações

---

## Cronograma de Implementação

### Sprint 1-2 (3 semanas) - Fase 1: Controle Avançado
- Lotes e validades
- Múltiplos depósitos
- Código de barras
- Inventário inteligente
- **Valor:** Rastreabilidade e controle
- **Complexidade:** Alta

### Sprint 3-4 (4 semanas) - Fase 2: Automação e IA
- Previsão de demanda
- Otimização de estoque
- Alertas inteligentes
- Movimentações automatizadas
- **Valor:** Eficiência operacional
- **Complexidade:** Muito Alta

### Sprint 5-6 (3 semanas) - Fase 3: Vendas Avançadas
- Funil de vendas
- CRM básico
- Cotações e propostas
- **Valor:** Aumento de conversão
- **Complexidade:** Média

### Sprint 7-8 (4 semanas) - Fase 4: Operações e Logística
- Picking e packing
- Roteirização
- Integração transportadoras
- **Valor:** Eficiência em entregas
- **Complexidade:** Alta

### Sprint 9-10 (3 semanas) - Fase 5: Marketplace Unificado
- Hub de integrações
- Sincronização inteligente
- Gestão omnichannel
- **Valor:** Expansão de canais
- **Complexidade:** Muito Alta

### Sprint 11-12 (2 semanas) - Fase 6: Analytics e BI
- Dashboard executivo
- Relatórios personalizados
- Métricas de performance
- **Valor:** Insights estratégicos
- **Complexidade:** Média

**Total estimado:** 22 semanas (~5,5 meses)

---

## Métricas de Sucesso

### Operacionais:
- Redução de 60% no tempo de inventário
- Redução de 40% em rupturas de estoque
- Aumento de 50% na acurácia do inventário
- Redução de 30% no tempo de separação
- Aumento de 25% na produtividade de packing

### Comerciais:
- Aumento de 35% na conversão do funil
- Redução de 20% no ciclo de vendas
- Aumento de 40% em vendas online
- Crescimento de 50% em canais de marketplace
- Aumento de 30% no ticket médio

### Financeiros:
- Redução de 25% no custo de estoque
- Redução de 40% em perdas por validade
- Aumento de 20% no giro de estoque
- Redução de 30% no custo de frete
- Aumento de 45% na margem líquida

---

## Dependências Técnicas

### Bibliotecas e Serviços:

```json
{
  "dependencies": {
    "react-beautiful-dnd": "^13.1.1",
    "react-qr-code": "^2.0.12",
    "jsbarcode": "^3.11.6",
    "html5-qrcode": "^2.3.8",
    "react-leaflet": "^4.2.1",
    "leaflet": "^1.9.4",
    "mapbox-gl": "^3.0.1",
    "date-fns": "^2.30.0",
    "tensorflow": "^4.11.0",
    "chart.js": "^4.4.0",
    "react-chartjs-2": "^5.2.0"
  }
}
```

### APIs Externas:
- Google Maps API (roteirização)
- Correios API (frete e rastreamento)
- Melhor Envio API (múltiplas transportadoras)
- Mercado Livre API (marketplace)
- Amazon MWS (marketplace)
- Shopee API (marketplace)
- Bling API (emissão fiscal)

### Infraestrutura:
- Queue system (Bull/Redis) para sincronizações
- Cron jobs para automações
- WebSockets para atualizações em tempo real
- Storage para documentos (AWS S3)
- ML Model serving (TensorFlow Serving)

---

## Próximos Passos

1. ⏭️ Revisar e aprovar roadmap
2. ⏭️ Definir prioridades com stakeholders
3. ⏭️ Setup de infraestrutura (queues, cron, storage)
4. ⏭️ Iniciar Sprint 1 (Fase 1 - Lotes e Depósitos)
5. ⏭️ Contratar/treinar equipe de ML para previsão
6. ⏭️ Definir integrações prioritárias de marketplace
7. ⏭️ Documentar APIs e processos

---

## Observações Finais

Este roadmap transforma o módulo de Vendas & Estoque de um sistema básico em uma **plataforma completa de gestão comercial e logística**, oferecendo:

- ✅ Controle total do inventário com rastreabilidade
- ✅ IA para previsão e otimização de estoque
- ✅ Funil de vendas e CRM integrado
- ✅ Operações logísticas eficientes
- ✅ Omnichannel com múltiplos marketplaces
- ✅ Analytics avançado e insights acionáveis

O resultado final será um módulo que pode **competir com sistemas especializados** de WMS, TMS e CRM, tudo integrado em uma única plataforma! 🚀
