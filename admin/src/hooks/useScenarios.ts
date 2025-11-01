import { useState, useCallback } from 'react';
import { api } from '@/lib/api';

// ============================================
// TYPES
// ============================================

export enum ScenarioType {
  OPTIMISTIC = 'optimistic',
  REALISTIC = 'realistic',
  PESSIMISTIC = 'pessimistic',
  CUSTOM = 'custom',
}

export interface ScenarioPremises {
  collectionRate: number; // 0-1
  averageDelayDays: number;
  revenueGrowth: number; // percentage
  expenseVariation: number; // percentage
}

export interface ScenarioProjectionPoint {
  date: string;
  projectedBalance: number;
  projectedEntries: number;
  projectedExits: number;
  netFlow: number;
  confidenceLevel: number; // 0-1
}

export interface ScenarioAnalysisResult {
  scenarioType: ScenarioType;
  scenarioName: string;
  premises: ScenarioPremises;
  projections: ScenarioProjectionPoint[];
  averageBalance: number;
  minimumBalance: number;
  maximumBalance: number;
  totalEntries: number;
  totalExits: number;
  finalBalance: number;
  periodStart: string;
  periodEnd: string;
  daysProjected: number;
}

export interface ScenarioComparisonSummary {
  currentBalance: number;
  basePeriodDays: number;
  projectionDays: number;
  scenariosCalculated: number;
  bestCaseBalance: number;
  worstCaseBalance: number;
  balanceRange: number;
  criticalScenarios: string[];
  recommendedAction: string;
}

export interface ScenarioComparison {
  scenarios: ScenarioAnalysisResult[];
  comparisonSummary: ScenarioComparisonSummary;
}

// ============================================
// API TYPES (snake_case from backend)
// ============================================

interface ScenarioPremisesAPI {
  collection_rate: number;
  average_delay_days: number;
  revenue_growth: number;
  expense_variation: number;
}

interface ScenarioProjectionPointAPI {
  date: string;
  projected_balance: number;
  projected_entries: number;
  projected_exits: number;
  net_flow: number;
  confidence_level: number;
}

interface ScenarioAnalysisResultAPI {
  scenario_type: string;
  scenario_name: string;
  premises: ScenarioPremisesAPI;
  projections: ScenarioProjectionPointAPI[];
  average_balance: number;
  minimum_balance: number;
  maximum_balance: number;
  total_entries: number;
  total_exits: number;
  final_balance: number;
  period_start: string;
  period_end: string;
  days_projected: number;
}

interface ScenarioComparisonAPI {
  scenarios: ScenarioAnalysisResultAPI[];
  comparison_summary: {
    current_balance: number;
    base_period_days: number;
    projection_days: number;
    scenarios_calculated: number;
    best_case_balance: number;
    worst_case_balance: number;
    balance_range: number;
    critical_scenarios: string[];
    recommended_action: string;
  };
}

// ============================================
// HOOK
// ============================================

interface UseScenariosReturn {
  scenarios: ScenarioComparison | null;
  loading: boolean;
  error: string | null;
  calculateScenarios: (params: {
    daysAhead?: number;
    includeOptimistic?: boolean;
    includeRealistic?: boolean;
    includePessimistic?: boolean;
  }) => Promise<void>;
}

export const useScenarios = (): UseScenariosReturn => {
  const [scenarios, setScenarios] = useState<ScenarioComparison | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const calculateScenarios = useCallback(async (params: {
    daysAhead?: number;
    includeOptimistic?: boolean;
    includeRealistic?: boolean;
    includePessimistic?: boolean;
  } = {}) => {
    console.log('🔄 [useScenarios] Calculando cenários com parâmetros:', params);
    setLoading(true);
    setError(null);

    try {
      // Build request payload
      const requestPayload = {
        days_ahead: params.daysAhead ?? 30,
        include_optimistic: params.includeOptimistic ?? true,
        include_realistic: params.includeRealistic ?? true,
        include_pessimistic: params.includePessimistic ?? true,
      };

      const response = await api.post<ScenarioComparisonAPI>(
        '/cash-flow/scenarios/calculate',
        requestPayload
      );

      console.log('✅ [useScenarios] Cenários recebidos:', response);

      // Transform API response (snake_case) to frontend format (camelCase)
      const transformedScenarios: ScenarioComparison = {
        scenarios: response.scenarios.map((scenario) => ({
          scenarioType: scenario.scenario_type as ScenarioType,
          scenarioName: scenario.scenario_name,
          premises: {
            collectionRate: scenario.premises.collection_rate,
            averageDelayDays: scenario.premises.average_delay_days,
            revenueGrowth: scenario.premises.revenue_growth,
            expenseVariation: scenario.premises.expense_variation,
          },
          projections: scenario.projections.map((point) => ({
            date: point.date,
            projectedBalance: point.projected_balance,
            projectedEntries: point.projected_entries,
            projectedExits: point.projected_exits,
            netFlow: point.net_flow,
            confidenceLevel: point.confidence_level,
          })),
          averageBalance: scenario.average_balance,
          minimumBalance: scenario.minimum_balance,
          maximumBalance: scenario.maximum_balance,
          totalEntries: scenario.total_entries,
          totalExits: scenario.total_exits,
          finalBalance: scenario.final_balance,
          periodStart: scenario.period_start,
          periodEnd: scenario.period_end,
          daysProjected: scenario.days_projected,
        })),
        comparisonSummary: {
          currentBalance: response.comparison_summary.current_balance,
          basePeriodDays: response.comparison_summary.base_period_days,
          projectionDays: response.comparison_summary.projection_days,
          scenariosCalculated: response.comparison_summary.scenarios_calculated,
          bestCaseBalance: response.comparison_summary.best_case_balance,
          worstCaseBalance: response.comparison_summary.worst_case_balance,
          balanceRange: response.comparison_summary.balance_range,
          criticalScenarios: response.comparison_summary.critical_scenarios,
          recommendedAction: response.comparison_summary.recommended_action,
        },
      };

      setScenarios(transformedScenarios);
    } catch (err) {
      console.error('❌ [useScenarios] Erro ao calcular cenários:', err);
      setError(err instanceof Error ? err.message : 'Erro ao calcular cenários');
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    scenarios,
    loading,
    error,
    calculateScenarios,
  };
};
