'use client';

import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { RefreshCcw } from 'lucide-react';
import { BankReconciliation } from '@/components/financeiro/contas-a-pagar/BankReconciliation';
import { ReconciliationSuggestions } from '@/components/financeiro/contas-a-pagar/ReconciliationSuggestions';

export default function ConciliacaoPage() {
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
          <h1 className="text-3xl font-bold tracking-tight">Conciliação Bancária</h1>
          <p className="text-muted-foreground mt-1">
            Automatize a conciliação de pagamentos com extratos bancários
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
        <span className="text-foreground">Conciliação Bancária</span>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="sugestoes" className="space-y-6">
        <TabsList>
          <TabsTrigger value="sugestoes">Sugestões da IA</TabsTrigger>
          <TabsTrigger value="manual">Conciliação Manual</TabsTrigger>
        </TabsList>

        <TabsContent value="sugestoes" className="space-y-6">
          <ReconciliationSuggestions />
        </TabsContent>

        <TabsContent value="manual" className="space-y-6">
          <BankReconciliation />
        </TabsContent>
      </Tabs>
    </div>
  );
}
