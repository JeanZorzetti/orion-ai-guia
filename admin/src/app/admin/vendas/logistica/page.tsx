import React from 'react';
import { LogisticsManagement } from '@/components/vendas/LogisticsManagement';

const LogisticaPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Operações e Logística</h1>
        <p className="text-muted-foreground mt-1">
          Picking, packing, expedição e gestão de entregas
        </p>
      </div>

      <LogisticsManagement />
    </div>
  );
};

export default LogisticaPage;
