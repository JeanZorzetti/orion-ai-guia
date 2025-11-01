'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Target,
  Lightbulb,
  BarChart3,
  Calendar,
} from 'lucide-react';
import { useScenarios, ScenarioType, ScenarioAnalysisResult } from '@/hooks/useScenarios';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface ScenarioCardProps {
  scenario: ScenarioAnalysisResult;
  color: string;
  icon: React.ReactNode;
}

const ScenarioCard: React.FC<ScenarioCardProps> = ({ scenario, color, icon }) => {
  const getBalanceColor = (balance: number) => {
    if (balance < 0) return 'text-red-600';
    if (balance > scenario.averageBalance) return 'text-green-600';
    return 'text-yellow-600';
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            {icon}
            {scenario.scenarioName}
          </CardTitle>
          <Badge variant={scenario.minimumBalance < 0 ? 'destructive' : 'outline'}>
            {scenario.daysProjected} dias
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Premissas */}
        <div className="bg-muted/50 rounded-lg p-3 space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase">Premissas</p>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-muted-foreground">Recebimento:</span>
              <span className="ml-1 font-semibold">
                {(scenario.premises.collectionRate * 100).toFixed(0)}%
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Atraso:</span>
              <span className="ml-1 font-semibold">{scenario.premises.averageDelayDays}d</span>
            </div>
            <div>
              <span className="text-muted-foreground">↑ Receita:</span>
              <span className="ml-1 font-semibold">
                {scenario.premises.revenueGrowth > 0 ? '+' : ''}
                {scenario.premises.revenueGrowth.toFixed(1)}%
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">↑ Despesa:</span>
              <span className="ml-1 font-semibold">
                {scenario.premises.expenseVariation > 0 ? '+' : ''}
                {scenario.premises.expenseVariation.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>

        {/* Resultados */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Saldo Final</span>
            <span className={`text-xl font-bold ${getBalanceColor(scenario.finalBalance)}`}>
              {formatCurrency(scenario.finalBalance)}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Saldo Mínimo</span>
            <span className={`text-sm font-semibold ${getBalanceColor(scenario.minimumBalance)}`}>
              {formatCurrency(scenario.minimumBalance)}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Saldo Máximo</span>
            <span className="text-sm font-semibold text-green-600">
              {formatCurrency(scenario.maximumBalance)}
            </span>
          </div>

          <div className="pt-2 border-t">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Entradas</span>
              <span className="text-green-600 font-medium">
                {formatCurrency(scenario.totalEntries)}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs mt-1">
              <span className="text-muted-foreground">Saídas</span>
              <span className="text-red-600 font-medium">
                {formatCurrency(scenario.totalExits)}
              </span>
            </div>
          </div>
        </div>

        {/* Alert se saldo ficar negativo */}
        {scenario.minimumBalance < 0 && (
          <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg p-3 flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5" />
            <div className="text-xs text-red-700 dark:text-red-400">
              <p className="font-semibold">Atenção: Risco de saldo negativo</p>
              <p className="mt-1">
                O saldo pode atingir {formatCurrency(scenario.minimumBalance)} neste cenário.
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export const ScenarioAnalysis: React.FC = () => {
  const { scenarios, loading, error, calculateScenarios } = useScenarios();
  const [daysAhead, setDaysAhead] = useState(30);

  useEffect(() => {
    // Calcular cenários automaticamente ao montar o componente
    calculateScenarios({ daysAhead });
  }, [calculateScenarios, daysAhead]);

  const handleRecalculate = () => {
    calculateScenarios({ daysAhead });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Preparar dados para o gráfico comparativo
  const chartData = React.useMemo(() => {
    if (!scenarios || scenarios.scenarios.length === 0) return [];

    // Pegar o primeiro cenário como base para as datas
    const baseScenario = scenarios.scenarios[0];

    return baseScenario.projections.map((point, index) => {
      const dataPoint: any = {
        date: new Date(point.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }),
      };

      // Adicionar cada cenário ao ponto de dados
      scenarios.scenarios.forEach((scenario) => {
        const projection = scenario.projections[index];
        if (projection) {
          dataPoint[scenario.scenarioName] = projection.projectedBalance;
        }
      });

      return dataPoint;
    });
  }, [scenarios]);

  // Definir cores e ícones para cada tipo de cenário
  const getScenarioMetadata = (type: ScenarioType) => {
    switch (type) {
      case ScenarioType.OPTIMISTIC:
        return {
          color: '#10b981',
          icon: <TrendingUp className="h-5 w-5 text-green-500" />,
        };
      case ScenarioType.REALISTIC:
        return {
          color: '#f59e0b',
          icon: <Target className="h-5 w-5 text-yellow-500" />,
        };
      case ScenarioType.PESSIMISTIC:
        return {
          color: '#ef4444',
          icon: <TrendingDown className="h-5 w-5 text-red-500" />,
        };
      default:
        return {
          color: '#6b7280',
          icon: <BarChart3 className="h-5 w-5 text-gray-500" />,
        };
    }
  };

  if (loading && !scenarios) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center h-[400px]">
            <p className="text-muted-foreground">Calculando cenários...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center h-[400px]">
            <p className="text-red-600">Erro ao calcular cenários: {error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!scenarios) return null;

  return (
    <div className="space-y-6">
      {/* Header com controles */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-6 w-6 text-purple-500" />
                Análise de Cenários
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Projeções de fluxo de caixa com diferentes premissas
              </p>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={daysAhead}
                onChange={(e) => setDaysAhead(Number(e.target.value))}
                className="px-3 py-2 border rounded-md text-sm"
              >
                <option value={7}>7 dias</option>
                <option value={15}>15 dias</option>
                <option value={30}>30 dias</option>
                <option value={60}>60 dias</option>
                <option value={90}>90 dias</option>
              </select>
              <Button onClick={handleRecalculate} variant="outline" disabled={loading}>
                <Calendar className="h-4 w-4 mr-2" />
                Recalcular
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Resumo Comparativo */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Resumo Comparativo</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-4">
              <p className="text-xs text-muted-foreground mb-1">Saldo Atual</p>
              <p className="text-2xl font-bold text-blue-600">
                {formatCurrency(scenarios.comparisonSummary.currentBalance)}
              </p>
            </div>

            <div className="bg-green-50 dark:bg-green-950/20 rounded-lg p-4">
              <p className="text-xs text-muted-foreground mb-1">Melhor Caso</p>
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(scenarios.comparisonSummary.bestCaseBalance)}
              </p>
            </div>

            <div className="bg-red-50 dark:bg-red-950/20 rounded-lg p-4">
              <p className="text-xs text-muted-foreground mb-1">Pior Caso</p>
              <p className="text-2xl font-bold text-red-600">
                {formatCurrency(scenarios.comparisonSummary.worstCaseBalance)}
              </p>
            </div>

            <div className="bg-purple-50 dark:bg-purple-950/20 rounded-lg p-4">
              <p className="text-xs text-muted-foreground mb-1">Variação</p>
              <p className="text-2xl font-bold text-purple-600">
                {formatCurrency(scenarios.comparisonSummary.balanceRange)}
              </p>
            </div>
          </div>

          {/* Recomendação */}
          {scenarios.comparisonSummary.recommendedAction && (
            <div className="mt-4 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 flex items-start gap-3">
              <Lightbulb className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-yellow-900 dark:text-yellow-200">
                  Recomendação
                </p>
                <p className="text-sm text-yellow-800 dark:text-yellow-300 mt-1">
                  {scenarios.comparisonSummary.recommendedAction}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Gráfico Comparativo */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Projeção Comparativa de Saldos</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12 }}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => formatCurrency(value)}
              />
              <Tooltip
                formatter={(value: number) => formatCurrency(value)}
                contentStyle={{
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  border: '1px solid #ccc',
                  borderRadius: '8px',
                }}
              />
              <Legend />

              {scenarios.scenarios.map((scenario) => {
                const metadata = getScenarioMetadata(scenario.scenarioType);
                return (
                  <Line
                    key={scenario.scenarioType}
                    type="monotone"
                    dataKey={scenario.scenarioName}
                    stroke={metadata.color}
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                );
              })}
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Cards de Cenários */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {scenarios.scenarios.map((scenario) => {
          const metadata = getScenarioMetadata(scenario.scenarioType);
          return (
            <ScenarioCard
              key={scenario.scenarioType}
              scenario={scenario}
              color={metadata.color}
              icon={metadata.icon}
            />
          );
        })}
      </div>
    </div>
  );
};
