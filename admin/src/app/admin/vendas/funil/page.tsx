import React from 'react';
import { SalesManagement } from '@/components/vendas/SalesManagement';

const FunilVendasPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Funil de Vendas</h1>
        <p className="text-muted-foreground mt-1">
          Pipeline de vendas com análise de conversão e gestão de oportunidades
        </p>
      </div>

      <SalesManagement />
    </div>
  );
};

export default FunilVendasPage;
