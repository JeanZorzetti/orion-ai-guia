'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  TrendingUp,
  TrendingDown,
  Activity,
  Percent,
  Calendar,
  Target,
  DollarSign,
  Timer
} from 'lucide-react';
import { useFinancialKPIs } from '@/hooks/useFinancialKPIs';
import { Progress } from '@/components/ui/progress';

export const FinancialKPIs: React.FC = () => {
  const { kpis, loading } = useFinancialKPIs();

  if (loading || !kpis) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Indicadores Financeiros (KPIs)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[200px]">
            <p className="text-muted-foreground">Carregando indicadores...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getHealthColor = (value: number, ideal: number, inverse: boolean = false) => {
    const diff = inverse ? ideal - value : value - ideal;
    if (diff >= 0) return 'text-green-600';
    if (diff > -10) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      {/* Liquidez */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-blue-500" />
            Indicadores de Liquidez
          </CardTitle>
          <CardDescription>
            Capacidade de honrar compromissos de curto prazo
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Liquidez Imediata</span>
                <Badge variant={kpis.liquidezImediata >= 0.5 ? 'default' : 'destructive'}>
                  {kpis.liquidezImediata >= 0.5 ? 'Saudável' : 'Atenção'}
                </Badge>
              </div>
              <div className={`text-3xl font-bold ${getHealthColor(kpis.liquidezImediata, 0.5, false)}`}>
                {kpis.liquidezImediata.toFixed(2)}
              </div>
              <Progress value={Math.min(100, kpis.liquidezImediata * 100)} className="h-2" />
              <p className="text-xs text-muted-foreground">
                Caixa / Passivo Circulante (Ideal: ≥ 0.5)
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Liquidez Corrente</span>
                <Badge variant={kpis.liquidezCorrente >= 1.5 ? 'default' : 'destructive'}>
                  {kpis.liquidezCorrente >= 1.5 ? 'Saudável' : 'Atenção'}
                </Badge>
              </div>
              <div className={`text-3xl font-bold ${getHealthColor(kpis.liquidezCorrente, 1.5, false)}`}>
                {kpis.liquidezCorrente.toFixed(2)}
              </div>
              <Progress value={Math.min(100, (kpis.liquidezCorrente / 2) * 100)} className="h-2" />
              <p className="text-xs text-muted-foreground">
                Ativo Circulante / Passivo Circulante (Ideal: ≥ 1.5)
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Ciclo Financeiro */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-purple-500" />
            Ciclo Financeiro
          </CardTitle>
          <CardDescription>
            Tempo entre pagamentos e recebimentos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">PMR</span>
                <Timer className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="text-3xl font-bold text-blue-600">
                {kpis.pmr.toFixed(0)} dias
              </div>
              <p className="text-xs text-muted-foreground">
                Prazo Médio de Recebimento
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">PMP</span>
                <Timer className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="text-3xl font-bold text-green-600">
                {kpis.pmp.toFixed(0)} dias
              </div>
              <p className="text-xs text-muted-foreground">
                Prazo Médio de Pagamento
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Ciclo Financeiro</span>
                <Badge variant={kpis.cicloFinanceiro < 0 ? 'default' : 'destructive'}>
                  {kpis.cicloFinanceiro < 0 ? 'Excelente' : 'Atenção'}
                </Badge>
              </div>
              <div className={`text-3xl font-bold ${kpis.cicloFinanceiro < 0 ? 'text-green-600' : 'text-red-600'}`}>
                {kpis.cicloFinanceiro.toFixed(0)} dias
              </div>
              <p className="text-xs text-muted-foreground">
                PMR - PMP {kpis.cicloFinanceiro < 0 ? '(Favorável)' : '(Desfavorável)'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Rentabilidade e Eficiência */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-green-500" />
            Rentabilidade e Eficiência
          </CardTitle>
          <CardDescription>
            Indicadores de performance financeira
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Percent className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Margem Líquida</span>
              </div>
              <div className={`text-2xl font-bold ${getHealthColor(kpis.margemLiquida, 10, false)}`}>
                {kpis.margemLiquida.toFixed(1)}%
              </div>
              <p className="text-xs text-muted-foreground">Lucro / Receita</p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Percent className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Margem EBITDA</span>
              </div>
              <div className={`text-2xl font-bold ${getHealthColor(kpis.margemEbitda, 15, false)}`}>
                {kpis.margemEbitda.toFixed(1)}%
              </div>
              <p className="text-xs text-muted-foreground">EBITDA / Receita</p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">ROA</span>
              </div>
              <div className={`text-2xl font-bold ${getHealthColor(kpis.returnOnAssets, 5, false)}`}>
                {kpis.returnOnAssets.toFixed(1)}%
              </div>
              <p className="text-xs text-muted-foreground">Retorno sobre Ativos</p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">ROE</span>
              </div>
              <div className={`text-2xl font-bold ${getHealthColor(kpis.returnOnEquity, 10, false)}`}>
                {kpis.returnOnEquity.toFixed(1)}%
              </div>
              <p className="text-xs text-muted-foreground">Retorno sobre Patrimônio</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Fluxo de Caixa e Runway */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-orange-500" />
            Análise de Fluxo de Caixa
          </CardTitle>
          <CardDescription>
            Sustentabilidade e projeções
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Burn Rate</span>
                <TrendingDown className="h-4 w-4 text-red-500" />
              </div>
              <div className="text-3xl font-bold text-red-600">
                R$ {(kpis.burnRate / 1000).toFixed(1)}k
              </div>
              <p className="text-xs text-muted-foreground">
                Taxa de queima mensal
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Runway</span>
                <Badge variant={kpis.runway >= 6 ? 'default' : 'destructive'}>
                  {kpis.runway >= 6 ? 'Saudável' : 'Crítico'}
                </Badge>
              </div>
              <div className={`text-3xl font-bold ${kpis.runway >= 6 ? 'text-green-600' : 'text-red-600'}`}>
                {kpis.runway.toFixed(1)} meses
              </div>
              <Progress value={Math.min(100, (kpis.runway / 12) * 100)} className="h-2" />
              <p className="text-xs text-muted-foreground">
                Tempo até acabar o caixa
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Endividamento</span>
                <Badge variant={kpis.endividamentoTotal <= 0.5 ? 'default' : 'destructive'}>
                  {kpis.endividamentoTotal <= 0.5 ? 'Controlado' : 'Alto'}
                </Badge>
              </div>
              <div className={`text-3xl font-bold ${kpis.endividamentoTotal <= 0.5 ? 'text-green-600' : 'text-red-600'}`}>
                {(kpis.endividamentoTotal * 100).toFixed(1)}%
              </div>
              <Progress value={Math.min(100, kpis.endividamentoTotal * 100)} className="h-2" />
              <p className="text-xs text-muted-foreground">
                Passivo / Ativo (Ideal: ≤ 50%)
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
