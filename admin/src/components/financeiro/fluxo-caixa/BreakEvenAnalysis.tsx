'use client';

import React from 'react';
import { format, differenceInMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  AreaChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Target, Calendar } from 'lucide-react';
import { useBreakEvenAnalysis } from '@/hooks/useBreakEvenAnalysis';

export const BreakEvenAnalysis: React.FC = () => {
  const { breakEven, loading, error } = useBreakEvenAnalysis(30); // 30 dias de período

  if (loading || !breakEven) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Análise de Ponto de Equilíbrio</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[300px]">
            {error ? (
              <p className="text-red-600">Erro ao carregar análise: {error}</p>
            ) : (
              <p className="text-muted-foreground">Carregando análise...</p>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  const mesesAteBreakEven = differenceInMonths(breakEven.dataPrevist, new Date());

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5 text-orange-500" />
          Análise de Ponto de Equilíbrio
        </CardTitle>
        <CardDescription>
          Identifique quando seu negócio começará a ter lucro
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm text-muted-foreground">
                  Receita Break-Even
                </CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                R$ {(breakEven.receitaBreakEven / 1000).toFixed(1)}k
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Por mês
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm text-muted-foreground">
                  Data Prevista
                </CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {format(breakEven.dataPrevist, 'MMM/yyyy', { locale: ptBR })}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {mesesAteBreakEven > 0 ? `em ${mesesAteBreakEven} meses` : 'Alcançado'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm text-muted-foreground">
                  Margem Atual
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${breakEven.margemAtual >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {breakEven.margemAtual.toFixed(1)}%
              </div>
              <Badge variant={breakEven.margemAtual >= 0 ? 'default' : 'destructive'} className="mt-1">
                {breakEven.margemAtual >= 0 ? 'Acima' : 'Abaixo'} do break-even
              </Badge>
            </CardContent>
          </Card>
        </div>

        {/* Gráfico de Break-Even */}
        <ResponsiveContainer width="100%" height={350}>
          <AreaChart data={breakEven.projecao}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="mes"
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
                      {payload.map((entry, index: number) => (
                        <p key={index} className="text-sm" style={{ color: entry.color }}>
                          {entry.name}: R$ {(entry.value as number).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                      ))}
                      {payload[0] && payload[1] && (
                        <p className="text-sm font-semibold mt-2 pt-2 border-t">
                          Resultado: R$ {((payload[0].value as number) - (payload[1].value as number)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                      )}
                    </div>
                  );
                }
                return null;
              }}
            />
            <Legend />
            <Area
              type="monotone"
              dataKey="receitas"
              stackId="1"
              stroke="hsl(var(--chart-2))"
              fill="hsl(var(--chart-2))"
              fillOpacity={0.6}
              name="Receitas"
            />
            <Area
              type="monotone"
              dataKey="despesas"
              stackId="2"
              stroke="hsl(var(--chart-3))"
              fill="hsl(var(--chart-3))"
              fillOpacity={0.6}
              name="Despesas"
            />
            <Line
              type="monotone"
              dataKey="breakEven"
              stroke="hsl(var(--chart-4))"
              strokeWidth={3}
              strokeDasharray="5 5"
              name="Break-Even"
              dot={false}
            />
          </AreaChart>
        </ResponsiveContainer>

        {/* Insights */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="bg-muted/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Para Atingir Break-Even</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Aumento de receita necessário:</span>
                <span className="font-semibold">
                  {breakEven.current_revenue > 0
                    ? `+${((breakEven.receitaBreakEven / breakEven.current_revenue - 1) * 100).toFixed(1)}%`
                    : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Ou redução de custos:</span>
                <span className="font-semibold">
                  {breakEven.current_total_costs > 0
                    ? `-${((breakEven.revenue_gap / breakEven.current_total_costs) * 100).toFixed(1)}%`
                    : 'N/A'}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-muted/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Cenário Atual</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Receita mensal média:</span>
                <span className="font-semibold">
                  R$ {(breakEven.current_revenue / 1000).toFixed(1)}k
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Custos fixos + variáveis:</span>
                <span className="font-semibold">
                  R$ {(breakEven.current_total_costs / 1000).toFixed(1)}k
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </CardContent>
    </Card>
  );
};

// Import DollarSign icon
import { DollarSign } from 'lucide-react';
