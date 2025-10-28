'use client';

import React from 'react';
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface DREWaterfallChartProps {
  data: Array<{
    category: string;
    value: number;
    isTotal?: boolean;
  }>;
  className?: string;
}

// Função para formatar moeda compacta
const formatCurrencyCompact = (value: number): string => {
  if (value >= 1000000) {
    return `R$ ${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `R$ ${(value / 1000).toFixed(0)}K`;
  }
  return `R$ ${value.toFixed(0)}`;
};

// Função para formatar moeda completa
const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

// Tooltip customizado
interface TooltipProps {
  active?: boolean;
  payload?: Array<{
    dataKey: string;
    fill: string;
    payload: {
      category: string;
      originalValue: number;
    };
  }>;
}

const CustomTooltip = ({ active, payload }: TooltipProps) => {
  if (active && payload && payload.length) {
    const entry = payload.find((p) => p.dataKey === 'value');
    if (entry) {
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
          <p className="text-sm font-semibold text-foreground mb-1">
            {entry.payload.category}
          </p>
          <p className="text-sm">
            <span className="text-muted-foreground">Valor: </span>
            <span className="font-semibold" style={{ color: entry.fill }}>
              {formatCurrency(Math.abs(entry.payload.originalValue))}
            </span>
          </p>
        </div>
      );
    }
  }
  return null;
};

export const DREWaterfallChart: React.FC<DREWaterfallChartProps> = ({
  data,
  className = '',
}) => {
  // Calcular running total para waterfall
  let runningTotal = 0;
  const chartData = data.map((item) => {
    const start = runningTotal;
    runningTotal += item.value;
    const end = runningTotal;

    return {
      name: item.category,
      start: start,
      value: Math.abs(item.value),
      end: end,
      isPositive: item.value >= 0,
      isTotal: item.isTotal,
      originalValue: item.value,
    };
  });

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>DRE Mensal (Demonstração de Resultado)</CardTitle>
        <p className="text-sm text-muted-foreground">
          Composição do resultado do mês
        </p>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <ComposedChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />

            <XAxis
              dataKey="name"
              className="text-xs"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
              tickLine={{ stroke: 'hsl(var(--muted))' }}
              angle={-45}
              textAnchor="end"
              height={100}
            />

            <YAxis
              className="text-xs"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
              tickLine={{ stroke: 'hsl(var(--muted))' }}
              tickFormatter={formatCurrencyCompact}
            />

            <Tooltip content={<CustomTooltip />} />

            {/* Barras invisíveis para posicionar */}
            <Bar dataKey="start" stackId="a" fill="transparent" />

            {/* Barras visíveis com cores condicionais */}
            <Bar dataKey="value" stackId="a" radius={[4, 4, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={
                    entry.isTotal
                      ? '#8B5CF6'
                      : entry.isPositive
                      ? '#10B981'
                      : '#EF4444'
                  }
                />
              ))}
            </Bar>

            {/* Linha conectando os totais */}
            <Line
              type="stepAfter"
              dataKey="end"
              stroke="#3B82F6"
              strokeWidth={2}
              dot={{ fill: '#3B82F6', r: 4 }}
            />
          </ComposedChart>
        </ResponsiveContainer>

        {/* Resumo textual */}
        <div className="mt-4 grid grid-cols-3 gap-4 text-center">
          <div className="p-3 rounded-lg bg-green-500/10">
            <p className="text-xs text-muted-foreground mb-1">Receita Total</p>
            <p className="text-lg font-bold text-green-600">
              {formatCurrency(
                Math.abs(data.find((d) => d.category === 'Receita')?.value || 0)
              )}
            </p>
          </div>
          <div className="p-3 rounded-lg bg-red-500/10">
            <p className="text-xs text-muted-foreground mb-1">Despesa Total</p>
            <p className="text-lg font-bold text-red-600">
              {formatCurrency(
                Math.abs(
                  data
                    .filter((d) => d.value < 0 && !d.isTotal)
                    .reduce((sum, d) => sum + d.value, 0)
                )
              )}
            </p>
          </div>
          <div className="p-3 rounded-lg bg-purple-500/10">
            <p className="text-xs text-muted-foreground mb-1">Resultado Líquido</p>
            <p className="text-lg font-bold text-purple-600">
              {formatCurrency(
                data.find((d) => d.category === 'Resultado' || d.category === 'Lucro Líquido')
                  ?.value || 0
              )}
            </p>
          </div>
        </div>

        {/* Legenda de cores */}
        <div className="mt-4 flex items-center justify-center gap-6 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm bg-green-500"></div>
            <span>Receitas</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm bg-red-500"></div>
            <span>Despesas</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm bg-purple-500"></div>
            <span>Totalizadores</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
