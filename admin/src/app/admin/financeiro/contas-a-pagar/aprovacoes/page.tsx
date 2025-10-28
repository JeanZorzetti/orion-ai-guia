'use client';

import React from 'react';
import { ApprovalWorkflowManager } from '@/components/financeiro/contas-a-pagar/ApprovalWorkflowManager';
import { PendingApprovalsPanel } from '@/components/financeiro/contas-a-pagar/PendingApprovalsPanel';
import { PaymentAutomationRules } from '@/components/financeiro/contas-a-pagar/PaymentAutomationRules';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

export default function ContasAPagarApprovacoesPage() {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
    }, 1000);
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/financeiro/contas-a-pagar">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Aprovações e Automação</h1>
            <p className="text-muted-foreground">
              Gerencie workflows de aprovação e regras de automação
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={isRefreshing}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="pending" className="space-y-6">
        <TabsList>
          <TabsTrigger value="pending">Pendentes</TabsTrigger>
          <TabsTrigger value="workflows">Fluxos de Aprovação</TabsTrigger>
          <TabsTrigger value="automation">Automação</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-6">
          <PendingApprovalsPanel />
        </TabsContent>

        <TabsContent value="workflows" className="space-y-6">
          <ApprovalWorkflowManager />
        </TabsContent>

        <TabsContent value="automation" className="space-y-6">
          <PaymentAutomationRules />
        </TabsContent>
      </Tabs>
    </div>
  );
}
