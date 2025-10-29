import React from 'react';
import { WarehouseManagement } from '@/components/estoque/WarehouseManagement';

const DepositosPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Gestão de Depósitos</h1>
        <p className="text-muted-foreground mt-1">
          Controle de múltiplos depósitos e transferências de estoque
        </p>
      </div>

      <WarehouseManagement />
    </div>
  );
};

export default DepositosPage;
