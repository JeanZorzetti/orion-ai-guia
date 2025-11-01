import { useState, useCallback } from 'react';
import { api } from '@/lib/api';

export interface SimulationAdjustments {
  additionalRevenue?: number;
  revenueGrowthPercentage?: number;
  additionalExpenses?: number;
  expenseReductionPercentage?: number;
  oneTimeIncome?: number;
  oneTimeExpense?: number;
  paymentDelayDays?: number;
  collectionImprovement?: number;
}

export const useImpactSimulator = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [simulation, setSimulation] = useState<any | null>(null);

  const simulate = useCallback(async (adjustments: SimulationAdjustments, daysAhead: number = 30) => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.post('/cash-flow/scenarios/simulate', {
        days_ahead: daysAhead,
        adjustments: {
          additional_revenue: adjustments.additionalRevenue,
          revenue_growth_percentage: adjustments.revenueGrowthPercentage,
          additional_expenses: adjustments.additionalExpenses,
          expense_reduction_percentage: adjustments.expenseReductionPercentage,
          one_time_income: adjustments.oneTimeIncome,
          one_time_expense: adjustments.oneTimeExpense,
          payment_delay_days: adjustments.paymentDelayDays,
          collection_improvement: adjustments.collectionImprovement,
        }
      });

      setSimulation(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao simular cenário');
    } finally {
      setLoading(false);
    }
  }, []);

  return { simulation, loading, error, simulate };
};
