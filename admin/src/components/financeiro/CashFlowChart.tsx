'use client';

import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface CashFlowChartProps {
  data: Array<{
    week: string;
    entrada: number;
    saida: number;
    saldo: number;
    projecao?: boolean;
  }>;
  className?: string;
}

// Função auxiliar para formatar moeda compacta
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
    name: string;
    value: number;
    color: string;
  }>;
  label?: string;
}

const CustomTooltip = ({ active, payload, label }: TooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
        <p className="text-sm font-semibold text-foreground mb-2">{label}</p>
        {payload.map((entry, index: number) => (
          <div key={index} className="flex items-center gap-2 text-sm">
            <div
              className="w-3 h-3 rounded-sm"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-muted-foreground">{entry.name}:</span>
            <span className="font-semibold" style={{ color: entry.color }}>
              {formatCurrency(entry.value)}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const CashFlowChartComponent: React.FC<CashFlowChartProps> = ({
  data,
  className = '',
}) => {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Fluxo de Caixa Projetado</CardTitle>
        <p className="text-sm text-muted-foreground">
          Próximas 12 semanas (histórico + projeção)
        </p>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorEntrada" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10B981" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#10B981" stopOpacity={0.05} />
              </linearGradient>
              <linearGradient id="colorSaida" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#EF4444" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#EF4444" stopOpacity={0.05} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />

            <XAxis
              dataKey="week"
              className="text-xs"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
              tickLine={{ stroke: 'hsl(var(--muted))' }}
            />

            <YAxis
              className="text-xs"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
              tickLine={{ stroke: 'hsl(var(--muted))' }}
              tickFormatter={formatCurrencyCompact}
            />

            <Tooltip content={<CustomTooltip />} />

            <Legend
              wrapperStyle={{
                paddingTop: '20px',
              }}
              iconType="rect"
            />

            {/* Linha do zero */}
            <ReferenceLine
              y={0}
              stroke="hsl(var(--muted-foreground))"
              strokeDasharray="3 3"
            />

            {/* Áreas */}
            <Area
              type="monotone"
              dataKey="entrada"
              stroke="#10B981"
              strokeWidth={2}
              fill="url(#colorEntrada)"
              name="Entradas"
            />

            <Area
              type="monotone"
              dataKey="saida"
              stroke="#EF4444"
              strokeWidth={2}
              fill="url(#colorSaida)"
              name="Saídas"
            />

            {/* Linha de saldo (linha, não área) */}
            <Area
              type="monotone"
              dataKey="saldo"
              stroke="#3B82F6"
              strokeWidth={3}
              fill="none"
              name="Saldo"
            />
          </AreaChart>
        </ResponsiveContainer>

        {/* Legenda adicional */}
        <div className="mt-4 flex items-center justify-center gap-6 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm bg-green-500"></div>
            <span>Entradas</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm bg-red-500"></div>
            <span>Saídas</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-0.5 bg-blue-500"></div>
            <span>Saldo Acumulado</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Otimização: Memoizar componente para evitar re-renders desnecessários
export const CashFlowChart = React.memo(CashFlowChartComponent);
