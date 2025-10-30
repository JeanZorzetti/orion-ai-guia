import React from 'react';
import { AnalyticsDashboard } from '@/components/vendas/AnalyticsDashboard';

const AnalyticsPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Analytics e Business Intelligence</h1>
        <p className="text-muted-foreground mt-1">
          Análises avançadas e insights acionáveis para tomada de decisão
        </p>
      </div>

      <AnalyticsDashboard />
    </div>
  );
};

export default AnalyticsPage;
