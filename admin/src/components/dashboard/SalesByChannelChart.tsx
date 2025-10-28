'use client';

import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { NameType, ValueType } from 'recharts/types/component/DefaultTooltipContent';

interface SalesByChannelChartProps {
  data: Array<{
    period: string;
    [channel: string]: number | string;
  }>;
  className?: string;
}

const CHANNEL_COLORS: Record<string, string> = {
  shopify: '#7C3AED',
  mercadolivre: '#FBBF24',
  woocommerce: '#9333EA',
  magalu: '#3B82F6',
  tiktok: '#EC4899',
  manual: '#10B981',
  other: '#6B7280'
};

const CHANNEL_LABELS: Record<string, string> = {
  shopify: 'Shopify',
  mercadolivre: 'Mercado Livre',
  woocommerce: 'WooCommerce',
  magalu: 'Magalu',
  tiktok: 'TikTok Shop',
  manual: 'Manual',
  other: 'Outros'
};

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    value: ValueType;
    name: NameType;
    color: string;
  }>;
  label?: string;
}

const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    const total = payload.reduce((sum, entry) => sum + (entry.value as number || 0), 0);

    return (
      <div className="bg-background/95 backdrop-blur-sm border border-border rounded-lg p-3 shadow-lg">
        <p className="text-sm font-medium text-foreground mb-2">{label}</p>
        <div className="space-y-1">
          {payload
            .sort((a, b) => (b.value as number) - (a.value as number))
            .map((entry, index) => (
              <div key={index} className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded"
                    style={{ backgroundColor: entry.color }}
                  />
                  <span className="text-xs text-muted-foreground">{entry.name}:</span>
                </div>
                <span className="text-xs font-medium" style={{ color: entry.color }}>
                  {new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL'
                  }).format(entry.value as number)}
                </span>
              </div>
            ))}
        </div>
        <div className="mt-2 pt-2 border-t border-border">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-foreground">Total:</span>
            <span className="text-xs font-bold text-foreground">
              {new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL'
              }).format(total)}
            </span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

export const SalesByChannelChart: React.FC<SalesByChannelChartProps> = ({
  data,
  className = ''
}) => {
  // Extrair todos os canais únicos dos dados
  const channels = Array.from(
    new Set(
      data.flatMap(item =>
        Object.keys(item).filter(key => key !== 'period')
      )
    )
  );

  const formatCurrency = (value: number) => {
    // Formato compacto para eixo Y
    if (value >= 1000000) {
      return `R$ ${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `R$ ${(value / 1000).toFixed(1)}K`;
    }
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0
    }).format(value);
  };

  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="hsl(var(--border))"
            opacity={0.2}
            vertical={false}
          />

          <XAxis
            dataKey="period"
            stroke="hsl(var(--muted-foreground))"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            dy={10}
          />

          <YAxis
            stroke="hsl(var(--muted-foreground))"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={formatCurrency}
            width={70}
          />

          <Tooltip content={<CustomTooltip />} />

          <Legend
            wrapperStyle={{ paddingTop: '20px' }}
            iconType="circle"
            iconSize={8}
            formatter={(value) => (
              <span className="text-xs text-muted-foreground">
                {CHANNEL_LABELS[value] || value}
              </span>
            )}
          />

          {/* Renderizar uma barra para cada canal */}
          {channels.map((channel) => (
            <Bar
              key={channel}
              dataKey={channel}
              stackId="a"
              fill={CHANNEL_COLORS[channel] || CHANNEL_COLORS.other}
              name={CHANNEL_LABELS[channel] || channel}
              radius={[0, 0, 0, 0]}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default SalesByChannelChart;
