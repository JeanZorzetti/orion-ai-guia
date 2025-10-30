import React from 'react';
import { StockAutomation } from '@/components/estoque/StockAutomation';

const AutomacaoPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Automação e Inteligência de Estoque</h1>
        <p className="text-muted-foreground mt-1">
          Previsão de demanda com IA, otimização automática e alertas inteligentes
        </p>
      </div>

      <StockAutomation />
    </div>
  );
};

export default AutomacaoPage;
