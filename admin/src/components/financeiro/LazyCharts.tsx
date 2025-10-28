'use client';

import dynamic from 'next/dynamic';
import { ChartSkeleton, AgingChartSkeleton, PieChartSkeleton } from './FinancialSkeletons';

/**
 * Lazy loaded charts com suspense e skeletons
 * Melhora performance inicial do dashboard
 */

export const LazyCashFlowChart = dynamic(
  () => import('./CashFlowChart').then((mod) => ({ default: mod.CashFlowChart })),
  {
    loading: () => <ChartSkeleton height={350} />,
    ssr: false, // Desabilita SSR para gráficos (melhor performance)
  }
);

export const LazyAgingChart = dynamic(
  () => import('./AgingChart').then((mod) => ({ default: mod.AgingChart })),
  {
    loading: () => <AgingChartSkeleton />,
    ssr: false,
  }
);

export const LazyDREWaterfallChart = dynamic(
  () => import('./DREWaterfallChart').then((mod) => ({ default: mod.DREWaterfallChart })),
  {
    loading: () => <ChartSkeleton height={400} />,
    ssr: false,
  }
);

export const LazyExpensesByCategoryChart = dynamic(
  () => import('./ExpensesByCategoryChart').then((mod) => ({ default: mod.ExpensesByCategoryChart })),
  {
    loading: () => <PieChartSkeleton />,
    ssr: false,
  }
);
