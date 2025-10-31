'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

// Dados mockados para os gráficos
const agingChartData = [
  {
    mes: 'Jan',
    atual: 120000,
    dias30: 35000,
    dias60: 18000,
    dias90: 8000,
    dias120Plus: 5000,
  },
  {
    mes: 'Fev',
    atual: 135000,
    dias30: 42000,
    dias60: 22000,
    dias90: 12000,
    dias120Plus: 7000,
  },
  {
    mes: 'Mar',
    atual: 145000,
    dias30: 38000,
    dias60: 20000,
    dias90: 10000,
    dias120Plus: 6000,
  },
  {
    mes: 'Abr',
    atual: 155000,
    dias30: 45000,
    dias60: 25000,
    dias90: 15000,
    dias120Plus: 8500,
  },
  {
    mes: 'Mai',
    atual: 148000,
    dias30: 40000,
    dias60: 22000,
    dias90: 12000,
    dias120Plus: 7000,
  },
  {
    mes: 'Jun',
    atual: 163000,
    dias30: 43000,
    dias60: 23000,
    dias90: 13000,
    dias120Plus: 8000,
  },
];

const trendData = [
  {
    mes: 'Jan',
    dso: 42,
    inadimplencia: 12.5,
    eficiencia: 85,
  },
  {
    mes: 'Fev',
    dso: 45,
    inadimplencia: 13.8,
    eficiencia: 82,
  },
  {
    mes: 'Mar',
    dso: 43,
    inadimplencia: 12.9,
    eficiencia: 84,
  },
  {
    mes: 'Abr',
    dso: 48,
    inadimplencia: 15.2,
    eficiencia: 79,
  },
  {
    mes: 'Mai',
    dso: 46,
    inadimplencia: 14.1,
    eficiencia: 81,
  },
  {
    mes: 'Jun',
    dso: 44,
    inadimplencia: 13.2,
    eficiencia: 83,
  },
];

interface TooltipPayloadEntry {
  color: string;
  name: string;
  value: number | string;
  dataKey: string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadEntry[];
  label?: string;
}

const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background border rounded-lg shadow-lg p-3">
        <p className="font-semibold mb-2">{label}</p>
        {payload.map((entry: TooltipPayloadEntry, index: number) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {entry.name}: {typeof entry.value === 'number' ?
              (entry.name.includes('R$') || entry.dataKey.includes('dias') ?
                `R$ ${entry.value.toLocaleString('pt-BR')}` :
                entry.value.toFixed(1)
              ) : entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

interface ARChartsProps {
  // Props opcionais para dados reais (quando disponíveis do backend)
  agingChartData?: typeof agingChartData;
  trendData?: typeof trendData;
}

export const ARCharts: React.FC<ARChartsProps> = ({
  agingChartData: customAgingData,
  trendData: customTrendData
}) => {
  // Usar dados personalizados se fornecidos, senão usar mock
  const chartAgingData = customAgingData || agingChartData;
  const chartTrendData = customTrendData || trendData;

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* Gráfico de Aging - Barras Empilhadas */}
      <Card>
        <CardHeader>
          <CardTitle>Distribuição por Período</CardTitle>
          <CardDescription>
            Evolução dos títulos por faixa de vencimento
            {!customAgingData && (
              <span className="text-xs text-muted-foreground ml-2">(dados mockados)</span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartAgingData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="mes"
                className="text-xs"
                tick={{ fill: 'currentColor' }}
              />
              <YAxis
                className="text-xs"
                tick={{ fill: 'currentColor' }}
                tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ fontSize: '12px' }}
                iconType="circle"
              />
              <Bar dataKey="atual" stackId="a" fill="#22c55e" name="Atual (0-30d)" radius={[0, 0, 0, 0]} />
              <Bar dataKey="dias30" stackId="a" fill="#eab308" name="31-60d" radius={[0, 0, 0, 0]} />
              <Bar dataKey="dias60" stackId="a" fill="#f97316" name="61-90d" radius={[0, 0, 0, 0]} />
              <Bar dataKey="dias90" stackId="a" fill="#ef4444" name="91-120d" radius={[0, 0, 0, 0]} />
              <Bar dataKey="dias120Plus" stackId="a" fill="#991b1b" name="120+d" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Gráfico de Tendência - Linha */}
      <Card>
        <CardHeader>
          <CardTitle>Evolução de Indicadores</CardTitle>
          <CardDescription>
            DSO, Inadimplência e Eficiência ao longo do tempo
            {!customTrendData && (
              <span className="text-xs text-muted-foreground ml-2">(dados mockados)</span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartTrendData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="mes"
                className="text-xs"
                tick={{ fill: 'currentColor' }}
              />
              <YAxis
                yAxisId="left"
                className="text-xs"
                tick={{ fill: 'currentColor' }}
                label={{ value: 'DSO (dias)', angle: -90, position: 'insideLeft', style: { fontSize: '12px' } }}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                className="text-xs"
                tick={{ fill: 'currentColor' }}
                label={{ value: 'Percentual (%)', angle: 90, position: 'insideRight', style: { fontSize: '12px' } }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ fontSize: '12px' }}
                iconType="line"
              />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="dso"
                stroke="#3b82f6"
                strokeWidth={2}
                name="DSO (dias)"
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="inadimplencia"
                stroke="#ef4444"
                strokeWidth={2}
                name="Inadimplência (%)"
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="eficiencia"
                stroke="#22c55e"
                strokeWidth={2}
                name="Eficiência (%)"
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};
