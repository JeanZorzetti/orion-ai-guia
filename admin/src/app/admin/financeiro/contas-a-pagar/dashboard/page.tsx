'use client';

import React from 'react';
import { APDashboardKPIs } from '@/components/financeiro/contas-a-pagar/APDashboardKPIs';
import { APAgingReportTable } from '@/components/financeiro/contas-a-pagar/APAgingReportTable';
import { APCharts } from '@/components/financeiro/contas-a-pagar/APCharts';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Download, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

export default function ContasAPagarDashboardPage() {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
    }, 1000);
  };

  const handleExportDashboard = () => {
    // TODO: Implementar exportação do dashboard
    console.log('Exportar dashboard');
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
            <h1 className="text-3xl font-bold">Dashboard de Contas a Pagar</h1>
            <p className="text-muted-foreground">
              Análise completa de pagamentos, vencimentos e indicadores
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportDashboard}>
            <Download className="h-4 w-4 mr-2" />
            Exportar Dashboard
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <APDashboardKPIs />

      {/* Aging Report */}
      <APAgingReportTable />

      {/* Charts */}
      <APCharts />
    </div>
  );
}
