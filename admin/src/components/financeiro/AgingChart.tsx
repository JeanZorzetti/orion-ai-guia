'use client';

import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface AgingChartProps {
  type: 'receivable' | 'payable';
  data: Array<{
    range: string;
    value: number;
    count: number;
  }>;
  className?: string;
}

const AGING_COLORS = {
  current: '#10B981', // 0-30 dias - Verde
  warning: '#F59E0B', // 31-60 dias - Laranja
  critical: '#EF4444', // 61-90 dias - Vermelho
  overdue: '#DC2626', // 90+ dias - Vermelho escuro
};

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
    payload: {
      range: string;
      value: number;
      count: number;
    };
  }>;
}

const CustomTooltip = ({ active, payload }: TooltipProps) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
        <p className="text-sm font-semibold text-foreground mb-2">
          {data.range}
        </p>
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">
            Valor: <span className="font-semibold text-foreground">{formatCurrency(data.value)}</span>
          </p>
          <p className="text-sm text-muted-foreground">
            Faturas: <span className="font-semibold text-foreground">{data.count}</span>
          </p>
        </div>
      </div>
    );
  }
  return null;
};

export const AgingChart: React.FC<AgingChartProps> = ({
  type,
  data,
  className = '',
}) => {
  const title =
    type === 'receivable' ? 'Aging de Recebíveis' : 'Aging de Pagáveis';
  const colors = Object.values(AGING_COLORS);

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <p className="text-sm text-muted-foreground">
          Distribuição por período de vencimento
        </p>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />

            <XAxis
              type="number"
              className="text-xs"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
              tickLine={{ stroke: 'hsl(var(--muted))' }}
              tickFormatter={formatCurrencyCompact}
            />

            <YAxis
              type="category"
              dataKey="range"
              className="text-xs"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
              tickLine={{ stroke: 'hsl(var(--muted))' }}
              width={120}
            />

            <Tooltip content={<CustomTooltip />} />

            <Bar dataKey="value" radius={[0, 8, 8, 0]}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={colors[index]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>

        {/* Tabela de resumo */}
        <div className="mt-4 space-y-2">
          {data.map((item, index) => (
            <div
              key={item.range}
              className="flex items-center justify-between text-sm p-2 rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-sm"
                  style={{ backgroundColor: colors[index] }}
                />
                <span className="font-medium">{item.range}</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-muted-foreground">
                  {item.count} fatura{item.count !== 1 ? 's' : ''}
                </span>
                <span className="font-semibold">{formatCurrency(item.value)}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Total */}
        <div className="mt-4 pt-4 border-t border-border">
          <div className="flex items-center justify-between text-sm font-semibold">
            <span>Total</span>
            <div className="flex items-center gap-4">
              <span className="text-muted-foreground">
                {data.reduce((sum, item) => sum + item.count, 0)} faturas
              </span>
              <span className="text-lg">
                {formatCurrency(data.reduce((sum, item) => sum + item.value, 0))}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
