import { useState, useCallback, useMemo, useEffect } from 'react';
import { api } from '@/lib/api';
import {
  SalesPipeline,
  PipelineStage,
  Opportunity,
  OpportunityFilters,
  PipelineAnalytics,
} from '@/types/sales';

// ============================================
// API Response Types
// ============================================

interface PipelineStageAPI {
  id: number;
  pipeline_id: number;
  name: string;
  order: number;
  color?: string;
  win_probability: number;
  auto_actions?: any;
  max_days_in_stage?: number;
  alert_before_sla?: number;
  opportunities_count: number;
  total_value: number;
}

interface SalesPipelineAPI {
  id: number;
  name: string;
  description?: string;
  workspace_id: number;
  is_default: boolean;
  is_active: boolean;
  stages: PipelineStageAPI[];
  created_at: string;
  updated_at: string;
}

interface OpportunityAPI {
  id: number;
  pipeline_id: number;
  stage_id?: number;
  stage_name?: string;
  customer_id?: number;
  customer_name?: string;
  assigned_to?: number;
  title: string;
  description?: string;
  value: number;
  status: 'open' | 'won' | 'lost';
  source?: 'website' | 'phone' | 'email' | 'referral' | 'marketplace' | 'social_media' | 'event' | 'other';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  expected_close_date?: string;
  closed_date?: string;
  won_date?: string;
  lost_date?: string;
  lost_reason?: string;
  contact_name?: string;
  contact_email?: string;
  contact_phone?: string;
  company_name?: string;
  custom_fields?: any;
  stage_entered_at?: string;
  days_in_stage: number;
  sla_overdue: boolean;
  created_at: string;
  updated_at: string;
}

interface OpportunityStatsAPI {
  open_opportunities: number;
  total_value: number;
  weighted_value: number;
  conversion_rate: number;
  won_last_30_days: number;
  won_value_last_30_days: number;
}

interface AnalyticsAPI {
  conversion_by_source: Array<{
    source: string;
    total: number;
    won: number;
    conversion_rate: number;
  }>;
  avg_time_by_stage: Array<{
    stage: string;
    avg_days: number;
  }>;
}

// ============================================
// HOOK
// ============================================

interface UseSalesPipelineReturn {
  // Data
  pipeline: SalesPipeline;
  opportunities: Opportunity[];
  filteredOpportunities: Opportunity[];

  // Filters
  filters: OpportunityFilters;
  setFilters: (filters: OpportunityFilters) => void;
  clearFilters: () => void;

  // Actions - Opportunities
  createOpportunity: (opp: Omit<Opportunity, 'id' | 'created_at' | 'updated_at' | 'stage_history' | 'weighted_value' | 'probability' | 'contact_count' | 'email_count' | 'call_count' | 'meeting_count' | 'activities' | 'tasks'>) => void;
  updateOpportunity: (oppId: string, updates: Partial<Opportunity>) => void;
  moveOpportunity: (oppId: string, targetStageId: string) => void;
  winOpportunity: (oppId: string) => void;
  loseOpportunity: (oppId: string, reason: string) => void;
  deleteOpportunity: (oppId: string) => void;

  // Actions - Pipeline
  updateStage: (stageId: string, updates: Partial<PipelineStage>) => void;

  // Analytics
  analytics: PipelineAnalytics;

  // Stats
  stats: {
    totalOpportunities: number;
    openOpportunities: number;
    wonOpportunities: number;
    lostOpportunities: number;
    totalValue: number;
    weightedValue: number;
    avgDealSize: number;
    winRate: number;
  };

  // Loading
  loading: boolean;
  refresh: () => void;
}

export const useSalesPipeline = (): UseSalesPipelineReturn => {
  const [pipeline, setPipeline] = useState<SalesPipeline>({
    id: '',
    name: '',
    description: '',
    workspace_id: 0,
    stages: [],
    is_default: false,
    is_active: false,
    auto_move_on_event: false,
    created_by: '',
    created_at: new Date(),
    updated_at: new Date()
  });

  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [filters, setFilters] = useState<OpportunityFilters>({});
  const [loading, setLoading] = useState(true);

  const [opportunityStats, setOpportunityStats] = useState<OpportunityStatsAPI>({
    open_opportunities: 0,
    total_value: 0,
    weighted_value: 0,
    conversion_rate: 0,
    won_last_30_days: 0,
    won_value_last_30_days: 0
  });

  const [analyticsData, setAnalyticsData] = useState<AnalyticsAPI>({
    conversion_by_source: [],
    avg_time_by_stage: []
  });

  // ============================================
  // FETCH DATA FROM API
  // ============================================

  const fetchPipeline = useCallback(async () => {
    console.log('🔄 [useSalesPipeline] Buscando pipeline padrão da API');
    try {
      const response = await api.get<SalesPipelineAPI>('/sales-pipeline/pipelines/default');
      console.log('✅ [useSalesPipeline] Pipeline recebido:', response);

      if (!response) {
        console.warn('⚠️ [useSalesPipeline] Nenhum pipeline encontrado');
        setPipeline({
          id: '',
          name: 'Sem Pipeline',
          description: 'Nenhum pipeline configurado',
          workspace_id: 0,
          stages: [],
          is_default: false,
          is_active: false,
          auto_move_on_event: false,
          created_by: '',
          created_at: new Date(),
          updated_at: new Date()
        });
        return;
      }

      const converted: SalesPipeline = {
        id: response.id.toString(),
        name: response.name,
        description: response.description,
        workspace_id: response.workspace_id,
        stages: response.stages.map(s => ({
          id: s.id.toString(),
          pipeline_id: s.pipeline_id.toString(),
          name: s.name,
          order: s.order,
          color: s.color || '#6B7280',
          win_probability: s.win_probability,
          auto_actions: s.auto_actions || {},
          max_days_in_stage: s.max_days_in_stage,
          alert_before_sla: s.alert_before_sla,
          opportunities_count: s.opportunities_count,
          total_value: s.total_value
        })),
        is_default: response.is_default,
        is_active: response.is_active,
        auto_move_on_event: false,
        created_by: '',
        created_at: new Date(response.created_at),
        updated_at: new Date(response.updated_at)
      };

      setPipeline(converted);
    } catch (err) {
      console.error('❌ [useSalesPipeline] Erro ao buscar pipeline:', err);
      setPipeline({
        id: '',
        name: 'Erro ao carregar',
        description: '',
        workspace_id: 0,
        stages: [],
        is_default: false,
        is_active: false,
        auto_move_on_event: false,
        created_by: '',
        created_at: new Date(),
        updated_at: new Date()
      });
    }
  }, []);

  const fetchOpportunities = useCallback(async () => {
    console.log('🔄 [useSalesPipeline] Buscando oportunidades da API');
    try {
      const response = await api.get<OpportunityAPI[]>('/sales-pipeline/opportunities');
      console.log('✅ [useSalesPipeline] Oportunidades recebidas:', response.length);

      const converted: Opportunity[] = response.map(o => {
        // Calcular weighted_value (valor * probabilidade)
        const stage = pipeline.stages.find(s => s.id === o.stage_id?.toString());
        const probability = stage ? stage.win_probability / 100 : 0;
        const weighted_value = o.value * probability;

        return {
          id: o.id.toString(),
          pipeline_id: o.pipeline_id.toString(),
          pipeline_name: pipeline.name,
          stage_id: o.stage_id?.toString() || '',
          stage_name: o.stage_name || stage?.name || '',
          customer_id: o.customer_id || 0,
          customer_name: o.customer_name || '',
          owner_id: o.assigned_to?.toString() || '',
          owner_name: '', // TODO: buscar do usuário
          title: o.title,
          description: o.description,
          estimated_value: o.value,
          weighted_value: weighted_value,
          final_value: o.value, // Sem desconto por enquanto
          probability: stage ? stage.win_probability : 0,
          products: [], // TODO: buscar produtos da oportunidade
          status: o.status,
          source: o.source === 'other' ? 'cold_call' : (o.source || 'cold_call'),
          priority: o.priority,
          expected_close_date: o.expected_close_date ? new Date(o.expected_close_date) : new Date(),
          actual_close_date: o.closed_date ? new Date(o.closed_date) : undefined,
          won_at: o.won_date ? new Date(o.won_date) : undefined,
          lost_at: o.lost_date ? new Date(o.lost_date) : undefined,
          lost_reason: o.lost_reason,
          contact_name: o.contact_name,
          contact_email: o.contact_email,
          contact_phone: o.contact_phone,
          company_name: o.company_name,
          custom_fields: o.custom_fields || {},
          stage_entered_at: o.stage_entered_at ? new Date(o.stage_entered_at) : undefined,
          days_in_stage: o.days_in_stage,
          sla_overdue: o.sla_overdue,
          stage_history: [],
          contact_count: 0,
          email_count: 0,
          call_count: 0,
          meeting_count: 0,
          activities: [],
          tasks: [],
          notes: '',
          tags: [],
          created_at: new Date(o.created_at),
          updated_at: new Date(o.updated_at)
        };
      });

      setOpportunities(converted);
    } catch (err) {
      console.error('❌ [useSalesPipeline] Erro ao buscar oportunidades:', err);
      setOpportunities([]);
    }
  }, [pipeline.stages]);

  const fetchStats = useCallback(async () => {
    try {
      const response = await api.get<OpportunityStatsAPI>('/sales-pipeline/opportunities/stats');
      console.log('✅ [useSalesPipeline] Stats recebidas:', response);
      setOpportunityStats(response);
    } catch (err) {
      console.error('❌ [useSalesPipeline] Erro ao buscar stats:', err);
    }
  }, []);

  const fetchAnalytics = useCallback(async () => {
    try {
      const response = await api.get<AnalyticsAPI>('/sales-pipeline/analytics');
      console.log('✅ [useSalesPipeline] Analytics recebidas:', response);
      setAnalyticsData(response);
    } catch (err) {
      console.error('❌ [useSalesPipeline] Erro ao buscar analytics:', err);
    }
  }, []);

  // Buscar dados ao montar e quando pipeline mudar
  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      await fetchPipeline();
      setLoading(false);
    };

    fetchAll();
  }, [fetchPipeline]);

  useEffect(() => {
    if (pipeline.id) {
      Promise.all([
        fetchOpportunities(),
        fetchStats(),
        fetchAnalytics()
      ]);
    }
  }, [pipeline.id, fetchOpportunities, fetchStats, fetchAnalytics]);

  // ============================================
  // COMPUTED DATA
  // ============================================

  const filteredOpportunities = useMemo(() => {
    let result = [...opportunities];

    if (filters.stage_id) {
      result = result.filter(o => o.stage_id === filters.stage_id);
    }

    if (filters.status && filters.status.length > 0) {
      result = result.filter(o => filters.status!.includes(o.status));
    }

    if (filters.owner_id) {
      result = result.filter(o => o.owner_id === filters.owner_id);
    }

    if (filters.customer_id) {
      result = result.filter(o => o.customer_id === filters.customer_id);
    }

    if (filters.source && filters.source.length > 0) {
      result = result.filter(o => filters.source!.includes(o.source));
    }

    if (filters.min_value) {
      result = result.filter(o => o.estimated_value >= filters.min_value!);
    }

    if (filters.max_value) {
      result = result.filter(o => o.estimated_value <= filters.max_value!);
    }

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      result = result.filter(o =>
        o.title.toLowerCase().includes(searchLower) ||
        o.customer_name.toLowerCase().includes(searchLower) ||
        o.description?.toLowerCase().includes(searchLower)
      );
    }

    return result;
  }, [opportunities, filters]);

  const stats = useMemo(() => {
    const totalOpportunities = opportunities.length;
    const openOpportunities = opportunityStats.open_opportunities;
    const wonOpportunities = opportunityStats.won_last_30_days;
    const lostOpportunities = opportunities.filter(o => o.status === 'lost').length;
    const totalValue = opportunityStats.total_value;
    const weightedValue = opportunityStats.weighted_value;
    const avgDealSize = openOpportunities > 0 ? totalValue / openOpportunities : 0;
    const winRate = opportunityStats.conversion_rate;

    return {
      totalOpportunities,
      openOpportunities,
      wonOpportunities,
      lostOpportunities,
      totalValue,
      weightedValue,
      avgDealSize,
      winRate,
    };
  }, [opportunities, opportunityStats]);

  const analytics = useMemo((): PipelineAnalytics => {
    const totalOpps = opportunities.length;
    const wonOpps = opportunities.filter(o => o.status === 'won').length;
    const lostOpps = opportunities.filter(o => o.status === 'lost').length;

    return {
      pipeline_id: pipeline.id,
      pipeline_name: pipeline.name,
      period_start: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
      period_end: new Date(),

      total_opportunities: totalOpps,
      total_value: opportunityStats.total_value,
      weighted_value: opportunityStats.weighted_value,
      avg_deal_size: totalOpps > 0 ? opportunityStats.total_value / totalOpps : 0,
      avg_days_to_close: 0, // TODO: calcular

      stages: pipeline.stages.map(stage => ({
        stage_id: stage.id,
        stage_name: stage.name,
        opportunities_count: stage.opportunities_count || 0,
        total_value: stage.total_value || 0,
        avg_days_in_stage: analyticsData.avg_time_by_stage.find(s => s.stage === stage.name)?.avg_days || 0,
        conversion_rate: stage.win_probability
      })),

      overall_conversion_rate: opportunityStats.conversion_rate,
      win_rate: totalOpps > 0 ? (wonOpps / totalOpps) * 100 : 0,
      loss_rate: totalOpps > 0 ? (lostOpps / totalOpps) * 100 : 0,

      top_loss_reasons: [],

      velocity: {
        opportunities_per_month: totalOpps,
        avg_velocity: 0
      }
    };
  }, [analyticsData, pipeline, opportunities, opportunityStats]);

  // ============================================
  // ACTIONS - OPPORTUNITIES
  // ============================================

  const createOpportunity = useCallback((opp: Omit<Opportunity, 'id' | 'created_at' | 'updated_at' | 'stage_history' | 'weighted_value' | 'probability' | 'contact_count' | 'email_count' | 'call_count' | 'meeting_count' | 'activities' | 'tasks'>) => {
    console.warn('createOpportunity: Não implementado');
    // TODO: Chamar API para criar oportunidade
  }, []);

  const updateOpportunity = useCallback((oppId: string, updates: Partial<Opportunity>) => {
    console.warn('updateOpportunity: Não implementado');
    // TODO: Chamar API para atualizar oportunidade
  }, []);

  const moveOpportunity = useCallback((oppId: string, targetStageId: string) => {
    // Atualizar localmente
    setOpportunities(prev => prev.map(o =>
      o.id === oppId ? {
        ...o,
        stage_id: targetStageId,
        stage_entered_at: new Date(),
        days_in_stage: 0,
        updated_at: new Date()
      } : o
    ));

    // TODO: Chamar API para mover oportunidade
  }, []);

  const winOpportunity = useCallback((oppId: string) => {
    // Atualizar localmente
    setOpportunities(prev => prev.map(o =>
      o.id === oppId ? {
        ...o,
        status: 'won' as const,
        won_at: new Date(),
        closed_at: new Date(),
        updated_at: new Date()
      } : o
    ));

    // TODO: Chamar API para marcar como ganha
  }, []);

  const loseOpportunity = useCallback((oppId: string, reason: string) => {
    // Atualizar localmente
    setOpportunities(prev => prev.map(o =>
      o.id === oppId ? {
        ...o,
        status: 'lost' as const,
        lost_at: new Date(),
        closed_at: new Date(),
        lost_reason: reason,
        updated_at: new Date()
      } : o
    ));

    // TODO: Chamar API para marcar como perdida
  }, []);

  const deleteOpportunity = useCallback((oppId: string) => {
    console.warn('deleteOpportunity: Não implementado');
    // TODO: Chamar API para deletar oportunidade
  }, []);

  // ============================================
  // ACTIONS - PIPELINE
  // ============================================

  const updateStage = useCallback((stageId: string, updates: Partial<PipelineStage>) => {
    console.warn('updateStage: Não implementado');
    // TODO: Chamar API para atualizar estágio
  }, []);

  // ============================================
  // REFRESH
  // ============================================

  const refresh = useCallback(async () => {
    setLoading(true);
    await Promise.all([
      fetchPipeline(),
      fetchOpportunities(),
      fetchStats(),
      fetchAnalytics()
    ]);
    setLoading(false);
  }, [fetchPipeline, fetchOpportunities, fetchStats, fetchAnalytics]);

  const clearFilters = useCallback(() => {
    setFilters({});
  }, []);

  return {
    // Data
    pipeline,
    opportunities,
    filteredOpportunities,

    // Filters
    filters,
    setFilters,
    clearFilters,

    // Actions - Opportunities
    createOpportunity,
    updateOpportunity,
    moveOpportunity,
    winOpportunity,
    loseOpportunity,
    deleteOpportunity,

    // Actions - Pipeline
    updateStage,

    // Analytics
    analytics,

    // Stats
    stats,

    // Loading
    loading,
    refresh,
  };
};
