import { useState, useCallback, useMemo } from 'react';
import {
  SalesPipeline,
  PipelineStage,
  Opportunity,
  OpportunityFilters,
  PipelineAnalytics,
} from '@/types/sales';
import { addDays, addMonths, differenceInDays, startOfMonth, endOfMonth } from 'date-fns';

// ============================================
// MOCK DATA GENERATORS
// ============================================

const generateMockPipeline = (): SalesPipeline => {
  const hoje = new Date();

  return {
    id: 'pipeline-1',
    name: 'Pipeline de Vendas B2B',
    description: 'Pipeline principal para vendas empresariais',
    workspace_id: 1,
    stages: [
      {
        id: 'stage-1',
        pipeline_id: 'pipeline-1',
        name: 'Prospecção',
        order: 1,
        color: '#6B7280',
        win_probability: 10,
        auto_actions: {
          create_task: 'Primeira ligação',
          notify_users: ['user-1'],
        },
        max_days_in_stage: 7,
        alert_before_sla: 2,
        opportunities_count: 0,
        total_value: 0,
      },
      {
        id: 'stage-2',
        pipeline_id: 'pipeline-1',
        name: 'Qualificação',
        order: 2,
        color: '#3B82F6',
        win_probability: 25,
        auto_actions: {
          send_email: 'template-qualificacao',
        },
        max_days_in_stage: 10,
        alert_before_sla: 3,
        opportunities_count: 0,
        total_value: 0,
      },
      {
        id: 'stage-3',
        pipeline_id: 'pipeline-1',
        name: 'Proposta',
        order: 3,
        color: '#8B5CF6',
        win_probability: 50,
        auto_actions: {},
        max_days_in_stage: 15,
        alert_before_sla: 5,
        opportunities_count: 0,
        total_value: 0,
      },
      {
        id: 'stage-4',
        pipeline_id: 'pipeline-1',
        name: 'Negociação',
        order: 4,
        color: '#F59E0B',
        win_probability: 75,
        auto_actions: {
          notify_users: ['user-1', 'user-2'],
        },
        max_days_in_stage: 10,
        alert_before_sla: 3,
        opportunities_count: 0,
        total_value: 0,
      },
      {
        id: 'stage-5',
        pipeline_id: 'pipeline-1',
        name: 'Fechamento',
        order: 5,
        color: '#10B981',
        win_probability: 90,
        auto_actions: {
          create_task: 'Preparar contrato',
        },
        max_days_in_stage: 5,
        alert_before_sla: 2,
        opportunities_count: 0,
        total_value: 0,
      },
    ],
    is_default: true,
    is_active: true,
    auto_move_on_event: false,
    require_approval_stages: ['stage-5'],
    created_by: 'user-1',
    created_at: addMonths(hoje, -6),
    updated_at: hoje,
  };
};

const generateMockOpportunities = (pipeline: SalesPipeline): Opportunity[] => {
  const opportunities: Opportunity[] = [];
  const hoje = new Date();

  for (let i = 1; i <= 30; i++) {
    const stage = pipeline.stages[Math.floor(Math.random() * pipeline.stages.length)];
    const createdAt = addDays(hoje, -Math.random() * 90);
    const daysInCurrentStage = Math.floor(Math.random() * 20);

    const estimatedValue = Math.floor(Math.random() * 50000) + 5000;
    const probability = stage.win_probability;
    const weightedValue = (estimatedValue * probability) / 100;

    const status: Opportunity['status'] = Math.random() > 0.8 ? (Math.random() > 0.5 ? 'won' : 'lost') : 'open';

    opportunities.push({
      id: `opp-${i}`,
      title: `Oportunidade ${i} - ${['ERP Completo', 'Módulo Financeiro', 'Integração Marketplace', 'Sistema de Vendas'][Math.floor(Math.random() * 4)]}`,
      description: 'Descrição detalhada da oportunidade de negócio',
      customer_id: Math.floor(Math.random() * 20) + 1,
      customer_name: `Cliente ${Math.floor(Math.random() * 20) + 1}`,
      pipeline_id: pipeline.id,
      pipeline_name: pipeline.name,
      stage_id: stage.id,
      stage_name: stage.name,
      stage_history: [
        {
          stage_id: stage.id,
          stage_name: stage.name,
          entered_at: addDays(hoje, -daysInCurrentStage),
          days_in_stage: daysInCurrentStage,
        },
      ],
      estimated_value: estimatedValue,
      probability,
      weighted_value: weightedValue,
      discount_percentage: Math.random() * 15,
      discount_value: estimatedValue * (Math.random() * 0.15),
      final_value: estimatedValue * (1 - Math.random() * 0.15),
      products: [
        {
          id: `prod-${i}-1`,
          product_id: Math.floor(Math.random() * 20) + 1,
          product_name: `Produto ${Math.floor(Math.random() * 20) + 1}`,
          quantity: Math.floor(Math.random() * 10) + 1,
          unit_price: Math.floor(Math.random() * 5000) + 1000,
          discount: Math.random() * 10,
          total: 0,
        },
      ],
      expected_close_date: addDays(hoje, Math.floor(Math.random() * 60) + 10),
      actual_close_date: status !== 'open' ? addDays(hoje, -Math.random() * 30) : undefined,
      owner_id: `user-${Math.floor(Math.random() * 3) + 1}`,
      owner_name: `Vendedor ${Math.floor(Math.random() * 3) + 1}`,
      team_id: `team-${Math.floor(Math.random() * 2) + 1}`,
      team_name: `Equipe ${Math.floor(Math.random() * 2) + 1}`,
      source: ['website', 'phone', 'email', 'referral', 'marketplace'][Math.floor(Math.random() * 5)] as any,
      status,
      lost_reason: status === 'lost' ? ['Preço', 'Concorrência', 'Timing'][Math.floor(Math.random() * 3)] : undefined,
      won_at: status === 'won' ? addDays(hoje, -Math.random() * 30) : undefined,
      lost_at: status === 'lost' ? addDays(hoje, -Math.random() * 30) : undefined,
      last_contact_at: addDays(hoje, -Math.random() * 7),
      contact_count: Math.floor(Math.random() * 20) + 1,
      email_count: Math.floor(Math.random() * 10),
      call_count: Math.floor(Math.random() * 5),
      meeting_count: Math.floor(Math.random() * 3),
      notes: 'Notas sobre o cliente e oportunidade',
      activities: [],
      tasks: [],
      tags: ['B2B', 'Alto valor'],
      created_at: createdAt,
      updated_at: hoje,
    });
  }

  return opportunities;
};

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
  const [pipeline, setPipeline] = useState<SalesPipeline>(generateMockPipeline);
  const [opportunities, setOpportunities] = useState<Opportunity[]>(() =>
    generateMockOpportunities(generateMockPipeline())
  );
  const [filters, setFilters] = useState<OpportunityFilters>({});
  const [loading, setLoading] = useState(false);

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
    const openOpportunities = opportunities.filter(o => o.status === 'open').length;
    const wonOpportunities = opportunities.filter(o => o.status === 'won').length;
    const lostOpportunities = opportunities.filter(o => o.status === 'lost').length;
    const totalValue = opportunities.filter(o => o.status === 'open').reduce((sum, o) => sum + o.estimated_value, 0);
    const weightedValue = opportunities.filter(o => o.status === 'open').reduce((sum, o) => sum + o.weighted_value, 0);
    const avgDealSize = totalValue / (openOpportunities || 1);
    const winRate = totalOpportunities > 0 ? (wonOpportunities / (wonOpportunities + lostOpportunities)) * 100 : 0;

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
  }, [opportunities]);

  const analytics = useMemo((): PipelineAnalytics => {
    const hoje = new Date();
    const periodStart = startOfMonth(hoje);
    const periodEnd = endOfMonth(hoje);

    const periodOpps = opportunities.filter(o =>
      new Date(o.created_at) >= periodStart && new Date(o.created_at) <= periodEnd
    );

    const wonOpps = periodOpps.filter(o => o.status === 'won');
    const lostOpps = periodOpps.filter(o => o.status === 'lost');

    return {
      pipeline_id: pipeline.id,
      pipeline_name: pipeline.name,
      period_start: periodStart,
      period_end: periodEnd,
      total_opportunities: periodOpps.length,
      total_value: periodOpps.reduce((sum, o) => sum + o.estimated_value, 0),
      weighted_value: periodOpps.filter(o => o.status === 'open').reduce((sum, o) => sum + o.weighted_value, 0),
      avg_deal_size: periodOpps.length > 0 ? periodOpps.reduce((sum, o) => sum + o.estimated_value, 0) / periodOpps.length : 0,
      avg_days_to_close: wonOpps.length > 0
        ? wonOpps.reduce((sum, o) => sum + differenceInDays(o.won_at || hoje, o.created_at), 0) / wonOpps.length
        : 0,
      stages: pipeline.stages.map(stage => {
        const stageOpps = periodOpps.filter(o => o.stage_id === stage.id);
        return {
          stage_id: stage.id,
          stage_name: stage.name,
          opportunities_count: stageOpps.length,
          total_value: stageOpps.reduce((sum, o) => sum + o.estimated_value, 0),
          avg_days_in_stage: stageOpps.length > 0
            ? stageOpps.reduce((sum, o) => sum + (o.stage_history[0]?.days_in_stage || 0), 0) / stageOpps.length
            : 0,
          conversion_rate: stageOpps.length > 0 ? (stageOpps.filter(o => o.status === 'won').length / stageOpps.length) * 100 : 0,
        };
      }),
      overall_conversion_rate: periodOpps.length > 0 ? (wonOpps.length / periodOpps.length) * 100 : 0,
      win_rate: (wonOpps.length + lostOpps.length) > 0 ? (wonOpps.length / (wonOpps.length + lostOpps.length)) * 100 : 0,
      loss_rate: (wonOpps.length + lostOpps.length) > 0 ? (lostOpps.length / (wonOpps.length + lostOpps.length)) * 100 : 0,
      top_loss_reasons: [],
      velocity: {
        opportunities_per_month: periodOpps.length,
        avg_velocity: wonOpps.length > 0
          ? wonOpps.reduce((sum, o) => sum + differenceInDays(o.won_at || hoje, o.created_at), 0) / wonOpps.length
          : 0,
      },
    };
  }, [opportunities, pipeline]);

  // ============================================
  // ACTIONS - OPPORTUNITIES
  // ============================================

  const createOpportunity = useCallback((oppData: Omit<Opportunity, 'id' | 'created_at' | 'updated_at' | 'stage_history' | 'weighted_value' | 'probability' | 'contact_count' | 'email_count' | 'call_count' | 'meeting_count' | 'activities' | 'tasks'>) => {
    const hoje = new Date();
    const stage = pipeline.stages.find(s => s.id === oppData.stage_id);

    const newOpp: Opportunity = {
      ...oppData,
      id: `opp-${Date.now()}`,
      probability: stage?.win_probability || 0,
      weighted_value: (oppData.estimated_value * (stage?.win_probability || 0)) / 100,
      stage_history: [
        {
          stage_id: oppData.stage_id,
          stage_name: oppData.stage_name,
          entered_at: hoje,
          days_in_stage: 0,
        },
      ],
      contact_count: 0,
      email_count: 0,
      call_count: 0,
      meeting_count: 0,
      activities: [],
      tasks: [],
      created_at: hoje,
      updated_at: hoje,
    };

    setOpportunities(prev => [...prev, newOpp]);
  }, [pipeline.stages]);

  const updateOpportunity = useCallback((oppId: string, updates: Partial<Opportunity>) => {
    setOpportunities(prev => prev.map(o =>
      o.id === oppId ? { ...o, ...updates, updated_at: new Date() } : o
    ));
  }, []);

  const moveOpportunity = useCallback((oppId: string, targetStageId: string) => {
    const opp = opportunities.find(o => o.id === oppId);
    const targetStage = pipeline.stages.find(s => s.id === targetStageId);

    if (!opp || !targetStage) return;

    const hoje = new Date();
    const currentHistory = opp.stage_history[0];

    const updatedHistory = [
      {
        stage_id: targetStageId,
        stage_name: targetStage.name,
        entered_at: hoje,
        days_in_stage: 0,
      },
      {
        ...currentHistory,
        exited_at: hoje,
        days_in_stage: differenceInDays(hoje, currentHistory.entered_at),
      },
      ...opp.stage_history.slice(1),
    ];

    updateOpportunity(oppId, {
      stage_id: targetStageId,
      stage_name: targetStage.name,
      probability: targetStage.win_probability,
      weighted_value: (opp.estimated_value * targetStage.win_probability) / 100,
      stage_history: updatedHistory,
    });
  }, [opportunities, pipeline.stages, updateOpportunity]);

  const winOpportunity = useCallback((oppId: string) => {
    updateOpportunity(oppId, {
      status: 'won',
      won_at: new Date(),
      actual_close_date: new Date(),
    });
  }, [updateOpportunity]);

  const loseOpportunity = useCallback((oppId: string, reason: string) => {
    updateOpportunity(oppId, {
      status: 'lost',
      lost_reason: reason,
      lost_at: new Date(),
      actual_close_date: new Date(),
    });
  }, [updateOpportunity]);

  const deleteOpportunity = useCallback((oppId: string) => {
    setOpportunities(prev => prev.filter(o => o.id !== oppId));
  }, []);

  // ============================================
  // ACTIONS - PIPELINE
  // ============================================

  const updateStage = useCallback((stageId: string, updates: Partial<PipelineStage>) => {
    setPipeline(prev => ({
      ...prev,
      stages: prev.stages.map(s => s.id === stageId ? { ...s, ...updates } : s),
      updated_at: new Date(),
    }));
  }, []);

  // ============================================
  // REFRESH
  // ============================================

  const refresh = useCallback(() => {
    setLoading(true);
    setTimeout(() => {
      const newPipeline = generateMockPipeline();
      setPipeline(newPipeline);
      setOpportunities(generateMockOpportunities(newPipeline));
      setLoading(false);
    }, 500);
  }, []);

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
