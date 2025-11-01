'use client';

import React from 'react';
import { Clock, AlertTriangle, TrendingUp, Target, DollarSign, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendBadge } from '@/components/ui/TrendBadge';
import { useARKPIs } from '@/hooks/useARKPIs';
import { ARAnalytics } from '@/types/financeiro';

interface ARDashboardKPIsProps {
  analytics?: ARAnalytics | null;
}

export const ARDashboardKPIs: React.FC<ARDashboardKPIsProps> = ({ analytics }) => {
  const kpis = useARKPIs(analytics);

  console.log('🔍 [ARDashboardKPIs] Renderizando com KPIs:', {
    kpis,
    analytics,
    valorVencido: kpis.valorVencido,
    valorVencidoType: typeof kpis.valorVencido,
    previsaoRecebimento30d: kpis.previsaoRecebimento30d,
    previsaoType: typeof kpis.previsaoRecebimento30d,
  });

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* DSO - Days Sales Outstanding */}
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">DSO</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{kpis.dso} dias</div>
          <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
            <TrendBadge value={kpis.dsoTrend} size="sm" />
            <span className="ml-1">vs mês anterior</span>
          </p>
        </CardContent>
      </Card>

      {/* Taxa de Inadimplência */}
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Taxa de Inadimplência</CardTitle>
          <AlertTriangle className="h-4 w-4 text-destructive" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-destructive">
            {kpis.taxaInadimplencia.toFixed(1)}%
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            R$ {(kpis.valorVencido || 0).toLocaleString('pt-BR')} vencidos
          </p>
        </CardContent>
      </Card>

      {/* Previsão 30 dias */}
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Previsão 30 dias</CardTitle>
          <TrendingUp className="h-4 w-4 text-blue-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-600">
            R$ {(kpis.previsaoRecebimento30d || 0).toLocaleString('pt-BR')}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Baseado em IA preditiva
          </p>
        </CardContent>
      </Card>

      {/* Eficiência de Cobrança */}
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Eficiência de Cobrança</CardTitle>
          <Target className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">
            {kpis.eficienciaCobranca.toFixed(1)}%
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Últimos 90 dias
          </p>
        </CardContent>
      </Card>

      {/* Ticket Médio AR */}
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Ticket Médio AR</CardTitle>
          <DollarSign className="h-4 w-4 text-purple-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-purple-600">
            R$ {kpis.ticketMedioAR.toLocaleString('pt-BR')}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Valor médio por título
          </p>
        </CardContent>
      </Card>

      {/* Concentração de Risco */}
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Concentração de Risco</CardTitle>
          <AlertTriangle className="h-4 w-4 text-orange-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-orange-600">
            {kpis.concentracaoRisco.toFixed(1)}%
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Top 5 clientes
          </p>
        </CardContent>
      </Card>

      {/* Total a Receber */}
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total a Receber</CardTitle>
          <DollarSign className="h-4 w-4 text-blue-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-600">
            R$ {kpis.totalAReceber.toLocaleString('pt-BR')}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Saldo atual
          </p>
        </CardContent>
      </Card>

      {/* Próximos 30 dias */}
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Próximos 30 dias</CardTitle>
          <Calendar className="h-4 w-4 text-indigo-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-indigo-600">
            R$ {kpis.proximoVencimento30d.toLocaleString('pt-BR')}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Vencimentos programados
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
