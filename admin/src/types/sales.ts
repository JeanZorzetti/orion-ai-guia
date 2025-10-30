// ============================================
// FASE 3: GESTÃO AVANÇADA DE VENDAS
// ============================================

// 3.1 Funil de Vendas e Pipeline
export interface SalesPipeline {
  id: string;
  name: string;
  description?: string;
  workspace_id: number;
  stages: PipelineStage[];
  is_default: boolean;
  is_active: boolean;

  // Configurações
  auto_move_on_event: boolean; // Mover automaticamente entre estágios
  require_approval_stages?: string[]; // Estágios que precisam aprovação

  created_by: string;
  created_at: Date;
  updated_at: Date;
}

export interface PipelineStage {
  id: string;
  pipeline_id: string;
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
    notify_users?: string[];
  };

  // SLA
  max_days_in_stage?: number;
  alert_before_sla?: number; // Alertar X dias antes

  // Contadores
  opportunities_count?: number;
  total_value?: number;
}

export interface Opportunity {
  id: string;
  title: string;
  description?: string;
  customer_id: number;
  customer_name: string;

  // Pipeline
  pipeline_id: string;
  pipeline_name: string;
  stage_id: string;
  stage_name: string;
  stage_history: {
    stage_id: string;
    stage_name: string;
    entered_at: Date;
    exited_at?: Date;
    days_in_stage: number;
  }[];

  // Valor
  estimated_value: number;
  probability: number; // Herdado do estágio
  weighted_value: number; // estimated_value * probability
  discount_percentage?: number;
  discount_value?: number;
  final_value: number;

  // Produtos
  products: {
    id: string;
    product_id: number;
    product_name: string;
    quantity: number;
    unit_price: number;
    discount: number;
    total: number;
  }[];

  // Datas
  expected_close_date: Date;
  actual_close_date?: Date;

  // Responsável
  owner_id: string;
  owner_name: string;
  team_id?: string;
  team_name?: string;

  // Origem
  source: 'website' | 'phone' | 'email' | 'referral' | 'marketplace' | 'social_media' | 'cold_call' | 'event';

  // Status
  status: 'open' | 'won' | 'lost' | 'archived';
  lost_reason?: string;
  won_at?: Date;
  lost_at?: Date;

  // Engajamento
  last_contact_at?: Date;
  contact_count: number;
  email_count: number;
  call_count: number;
  meeting_count: number;

  // Notas e atividades
  notes: string;
  activities: Activity[];
  tasks: Task[];

  // Tags
  tags: string[];

  created_at: Date;
  updated_at: Date;
}

export interface Activity {
  id: string;
  opportunity_id: string;
  customer_id?: number;
  type: 'call' | 'email' | 'meeting' | 'task' | 'note' | 'whatsapp' | 'visit';

  // Detalhes
  subject: string;
  description: string;
  outcome?: 'positive' | 'neutral' | 'negative';

  // Agendamento
  scheduled_at?: Date;
  completed_at?: Date;
  is_completed: boolean;
  duration_minutes?: number;

  // Responsável
  assigned_to: string;
  assigned_to_name: string;

  // Participantes
  participants?: string[];

  created_by: string;
  created_by_name: string;
  created_at: Date;
  updated_at: Date;
}

export interface Task {
  id: string;
  opportunity_id?: string;
  customer_id?: number;
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  due_date: Date;
  completed_at?: Date;
  assigned_to: string;
  assigned_to_name: string;
  created_by: string;
  created_at: Date;
  updated_at: Date;
}

// 3.2 CRM Básico
export interface Customer {
  id: number;

  // Dados básicos
  name: string;
  email: string;
  phone: string;
  document: string; // CPF/CNPJ
  date_of_birth?: Date;

  // Tipo
  type: 'individual' | 'company';
  company_name?: string;
  company_position?: string;

  // Endereços
  addresses: CustomerAddress[];

  // Classificação
  segment: 'retail' | 'wholesale' | 'vip' | 'prospect';
  tags: string[];

  // Score
  customer_score: number; // 0-100
  lifetime_value: number;
  risk_score?: number; // 0-100 (menor = menor risco)

  // Relacionamento
  first_purchase_date?: Date;
  last_purchase_date?: Date;
  total_purchases: number;
  total_spent: number;
  avg_ticket: number;
  purchase_frequency: number; // Compras por mês

  // Preferências
  preferred_contact_method: 'email' | 'phone' | 'whatsapp' | 'any';
  preferred_contact_time: 'morning' | 'afternoon' | 'evening' | 'any';
  preferred_payment_method?: 'credit_card' | 'debit_card' | 'pix' | 'bank_slip' | 'cash';

  // Status
  status: 'active' | 'inactive' | 'blocked' | 'prospect';
  blocked_reason?: string;
  blocked_at?: Date;

  // Responsável
  account_manager_id?: string;
  account_manager_name?: string;

  // Social
  linkedin_url?: string;
  instagram_handle?: string;
  facebook_url?: string;

  // Observações
  notes?: string;

  // Métricas de engajamento
  last_interaction_at?: Date;
  interaction_count: number;
  email_open_rate?: number;
  email_click_rate?: number;

  created_at: Date;
  updated_at: Date;
}

export interface CustomerAddress {
  id: string;
  customer_id: number;
  type: 'billing' | 'shipping' | 'both';
  is_default: boolean;

  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  zip_code: string;
  country: string;

  latitude?: number;
  longitude?: number;

  created_at: Date;
  updated_at: Date;
}

export interface CustomerInteraction {
  id: string;
  customer_id: number;
  customer_name: string;

  type: 'email' | 'phone' | 'whatsapp' | 'visit' | 'meeting' | 'support_ticket' | 'purchase';
  channel: 'inbound' | 'outbound';

  subject: string;
  description: string;

  outcome: 'positive' | 'neutral' | 'negative';
  sentiment_score?: number; // -100 a 100

  next_action?: string;
  next_action_date?: Date;

  // Contexto
  opportunity_id?: string;
  sale_id?: number;
  support_ticket_id?: string;

  // Duração (para calls e meetings)
  duration_minutes?: number;

  // Arquivos anexos
  attachments?: {
    id: string;
    file_name: string;
    file_url: string;
  }[];

  user_id: string;
  user_name: string;
  created_at: Date;
  updated_at: Date;
}

export interface CustomerSegment {
  id: string;
  name: string;
  description?: string;
  workspace_id: number;

  // Critérios
  criteria: {
    field: 'total_spent' | 'purchase_frequency' | 'avg_ticket' | 'last_purchase_days' | 'customer_score';
    operator: '>' | '<' | '>=' | '<=' | '=' | 'between';
    value: number | number[];
  }[];

  // Estatísticas
  customer_count: number;
  total_revenue: number;
  avg_ltv: number;

  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

// 3.3 Cotações e Propostas
export interface Quote {
  id: string;
  quote_number: string;
  workspace_id: number;

  // Cliente
  customer_id: number;
  customer_name: string;
  customer_email: string;
  customer_phone: string;

  // Oportunidade relacionada
  opportunity_id?: string;

  // Detalhes da cotação
  title: string;
  description?: string;

  // Itens
  items: QuoteItem[];

  // Valores
  subtotal: number;
  discount_percentage: number;
  discount_value: number;
  tax_percentage: number;
  tax_value: number;
  shipping_cost: number;
  total: number;

  // Validade
  valid_until: Date;
  expires_in_days: number;

  // Status
  status: 'draft' | 'sent' | 'viewed' | 'accepted' | 'rejected' | 'expired';
  sent_at?: Date;
  viewed_at?: Date;
  accepted_at?: Date;
  rejected_at?: Date;
  rejection_reason?: string;

  // Termos
  payment_terms: string;
  delivery_terms: string;
  notes?: string;
  terms_and_conditions?: string;

  // Responsável
  created_by: string;
  created_by_name: string;

  // Versões (para cotações revisadas)
  version: number;
  previous_version_id?: string;

  created_at: Date;
  updated_at: Date;
}

export interface QuoteItem {
  id: string;
  quote_id: string;
  product_id: number;
  product_name: string;
  description?: string;

  quantity: number;
  unit_price: number;
  discount_percentage: number;
  discount_value: number;
  subtotal: number;
  tax_percentage: number;
  tax_value: number;
  total: number;

  // Disponibilidade
  is_available: boolean;
  availability_note?: string;
  estimated_delivery_days?: number;

  order: number; // Ordem de exibição
}

// Filters
export interface OpportunityFilters {
  pipeline_id?: string;
  stage_id?: string;
  status?: Opportunity['status'][];
  owner_id?: string;
  customer_id?: number;
  source?: Opportunity['source'][];
  min_value?: number;
  max_value?: number;
  expected_close_from?: Date;
  expected_close_to?: Date;
  tags?: string[];
  search?: string;
}

export interface CustomerFilters {
  segment?: Customer['segment'][];
  status?: Customer['status'][];
  type?: Customer['type'][];
  account_manager_id?: string;
  min_ltv?: number;
  max_ltv?: number;
  min_score?: number;
  max_score?: number;
  tags?: string[];
  last_purchase_from?: Date;
  last_purchase_to?: Date;
  search?: string;
}

export interface QuoteFilters {
  status?: Quote['status'][];
  customer_id?: number;
  created_by?: string;
  valid_from?: Date;
  valid_to?: Date;
  min_value?: number;
  max_value?: number;
  search?: string;
}

// Analytics
export interface PipelineAnalytics {
  pipeline_id: string;
  pipeline_name: string;
  period_start: Date;
  period_end: Date;

  // Métricas gerais
  total_opportunities: number;
  total_value: number;
  weighted_value: number;
  avg_deal_size: number;
  avg_days_to_close: number;

  // Por estágio
  stages: {
    stage_id: string;
    stage_name: string;
    opportunities_count: number;
    total_value: number;
    avg_days_in_stage: number;
    conversion_rate: number; // Para o próximo estágio
  }[];

  // Taxa de conversão geral
  overall_conversion_rate: number;
  win_rate: number;
  loss_rate: number;

  // Top perdedores
  top_loss_reasons: {
    reason: string;
    count: number;
    percentage: number;
  }[];

  // Velocidade
  velocity: {
    opportunities_per_month: number;
    avg_velocity: number; // Dias médios no pipeline
  };
}

export interface SalesPerformance {
  user_id: string;
  user_name: string;
  period_start: Date;
  period_end: Date;

  // Oportunidades
  opportunities_created: number;
  opportunities_won: number;
  opportunities_lost: number;
  win_rate: number;

  // Valores
  total_value_won: number;
  avg_deal_size: number;
  quota?: number;
  quota_attainment?: number; // %

  // Atividades
  calls_made: number;
  emails_sent: number;
  meetings_held: number;

  // Velocidade
  avg_days_to_close: number;
  conversion_rate: number;
}
