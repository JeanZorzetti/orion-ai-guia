import React from 'react';
import { BatchManagement } from '@/components/estoque/BatchManagement';

const LotesPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Lotes e Validades</h1>
        <p className="text-muted-foreground mt-1">
          Controle de lotes, validades e rastreabilidade de produtos
        </p>
      </div>

      <BatchManagement />
    </div>
  );
};

export default LotesPage;
