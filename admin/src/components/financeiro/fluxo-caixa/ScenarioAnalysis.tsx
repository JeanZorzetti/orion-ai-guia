'use client';

import React from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useScenarioAnalysis } from '@/hooks/useScenarioAnalysis';
import type { CashFlowProjection } from '@/types/cash-flow';

const getScenarioColor = (tipo: string) => {
  switch (tipo) {
    case 'otimista':
      return 'hsl(var(--chart-2))'; // green
    case 'realista':
      return 'hsl(var(--chart-1))'; // blue
    case 'pessimista':
      return 'hsl(var(--chart-3))'; // red
    default:
      return 'hsl(var(--chart-4))'; // purple
  }
};

const getUltimoSaldo = (projecao: CashFlowProjection[]) => {
  if (!projecao || projecao.length === 0) return 0;
  return projecao[projecao.length - 1].saldoFinalPrevisto;
};

const getMenorSaldo = (projecao: CashFlowProjection[]) => {
  if (!projecao || projecao.length === 0) return 0;
  return Math.min(...projecao.map(p => p.saldoFinalPrevisto));
};

const getDiasNegativos = (projecao: CashFlowProjection[]) => {
  if (!projecao || projecao.length === 0) return 0;
  return projecao.filter(p => p.saldoFinalPrevisto < 0).length;
};

export const ScenarioAnalysis: React.FC = () => {
  const { scenarios, loading } = useScenarioAnalysis();

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Análise de Cenários</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[400px]">
            <p className="text-muted-foreground">Carregando cenários...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Preparar dados para o gráfico combinado
  const chartData = scenarios[0]?.projecao.map((_, index) => {
    const dataPoint: Record<string, string | number> = {
      data: format(scenarios[0].projecao[index].data, 'dd/MM', { locale: ptBR }),
    };

    scenarios.forEach((scenario) => {
      if (scenario.projecao[index]) {
        dataPoint[scenario.id] = scenario.projecao[index].saldoFinalPrevisto;
      }
    });

    return dataPoint;
  }) || [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Análise de Cenários</CardTitle>
        <CardDescription>
          Compare diferentes cenários financeiros
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Gráfico comparativo */}
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="data"
              tick={{ fontSize: 12 }}
              className="text-muted-foreground"
            />
            <YAxis
              tick={{ fontSize: 12 }}
              className="text-muted-foreground"
              tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-background border rounded-lg p-3 shadow-lg">
                      <p className="font-medium mb-2">{label as string}</p>
                      {payload.map((entry, index: number) => {
                        const scenario = scenarios.find(s => s.id === entry.dataKey);
                        return (
                          <p key={index} className="text-sm" style={{ color: entry.color }}>
                            {scenario?.nome}: R$ {(entry.value as number).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </p>
                        );
                      })}
                    </div>
                  );
                }
                return null;
              }}
            />
            <Legend />
            {scenarios.map((scenario) => (
              <Line
                key={scenario.id}
                type="monotone"
                dataKey={scenario.id}
                stroke={getScenarioColor(scenario.tipo)}
                strokeWidth={2}
                name={scenario.nome}
                dot={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>

        {/* Tabela comparativa */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          {scenarios.map((scenario) => (
            <Card key={scenario.id} className="border-2">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">{scenario.nome}</CardTitle>
                <CardDescription className="text-xs mt-1">
                  <div className="space-y-1">
                    <div>Taxa recebimento: {scenario.premissas.taxaRecebimento}%</div>
                    <div>Atraso médio: {scenario.premissas.taxaAtraso} dias</div>
                    <div>Crescimento: {scenario.premissas.crescimentoReceita > 0 ? '+' : ''}{scenario.premissas.crescimentoReceita}%</div>
                  </div>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Saldo Final (30d)</span>
                  <span className={`font-semibold ${getUltimoSaldo(scenario.projecao) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    R$ {getUltimoSaldo(scenario.projecao).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Menor Saldo</span>
                  <span className={`font-semibold ${getMenorSaldo(scenario.projecao) >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                    R$ {getMenorSaldo(scenario.projecao).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Dias Negativos</span>
                  <span className={`font-semibold ${getDiasNegativos(scenario.projecao) === 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {getDiasNegativos(scenario.projecao)}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
