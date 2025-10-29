'use client';

import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { RefreshCcw } from 'lucide-react';
import { DiscountOpportunities } from '@/components/financeiro/contas-a-pagar/DiscountOpportunities';
import { NegotiationHistory } from '@/components/financeiro/contas-a-pagar/NegotiationHistory';

export default function DescontosPage() {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    // Simular refresh
    setTimeout(() => {
      setIsRefreshing(false);
    }, 1000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Descontos e Negociações</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie oportunidades de desconto e acompanhe negociações com fornecedores
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={isRefreshing}
        >
          <RefreshCcw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      {/* Breadcrumb */}
      <div className="text-sm text-muted-foreground">
        <span>Financeiro</span>
        <span className="mx-2">/</span>
        <span>Contas a Pagar</span>
        <span className="mx-2">/</span>
        <span className="text-foreground">Descontos e Negociações</span>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="oportunidades" className="space-y-6">
        <TabsList>
          <TabsTrigger value="oportunidades">Oportunidades de Desconto</TabsTrigger>
          <TabsTrigger value="negociacoes">Histórico de Negociações</TabsTrigger>
        </TabsList>

        <TabsContent value="oportunidades" className="space-y-6">
          <DiscountOpportunities />
        </TabsContent>

        <TabsContent value="negociacoes" className="space-y-6">
          <NegotiationHistory />
        </TabsContent>
      </Tabs>
    </div>
  );
}
