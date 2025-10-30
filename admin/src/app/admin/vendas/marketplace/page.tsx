import React from 'react';
import { MarketplaceManagement } from '@/components/vendas/MarketplaceManagement';

const MarketplacePage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Marketplace Unificado</h1>
        <p className="text-muted-foreground mt-1">
          Gerencie vendas em múltiplos canais a partir de um só lugar
        </p>
      </div>

      <MarketplaceManagement />
    </div>
  );
};

export default MarketplacePage;
