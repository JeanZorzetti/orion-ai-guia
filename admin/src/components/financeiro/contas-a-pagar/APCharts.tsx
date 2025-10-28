'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAPChartData } from '@/hooks/useAPChartData';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { BarChart3, TrendingUp, PieChart as PieChartIcon, Activity } from 'lucide-react';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

interface PayloadItem {
  name: string;
  value: number;
  color: string;
  payload?: {
    categoria?: string;
    percentual?: number;
    [key: string]: unknown;
  };
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: PayloadItem[];
  label?: string;
}

const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background border rounded-lg shadow-lg p-3">
        <p className="font-semibold text-sm mb-2">{label}</p>
        {payload.map((entry: PayloadItem, index: number) => (
          <p key={index} className="text-xs" style={{ color: entry.color }}>
            {entry.name}: R$ {entry.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const CustomPieTooltip: React.FC<CustomTooltipProps> = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    if (!data.payload) return null;

    return (
      <div className="bg-background border rounded-lg shadow-lg p-3">
        <p className="font-semibold text-sm">{data.payload.categoria || ''}</p>
        <p className="text-xs">
          Valor: R$ {data.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
        </p>
        <p className="text-xs">
          Percentual: {data.payload.percentual || 0}%
        </p>
      </div>
    );
  }
  return null;
};

export const APCharts: React.FC = () => {
  const chartData = useAPChartData();

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* Gráfico de Aging - Barras Empilhadas */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            <div>
              <CardTitle>Distribuição por Vencimento</CardTitle>
              <CardDescription>Evolução dos últimos 6 meses</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData.aging}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="mes"
                className="text-xs"
                tick={{ fill: 'currentColor' }}
              />
              <YAxis
                className="text-xs"
                tick={{ fill: 'currentColor' }}
                tickFormatter={(value) =>
                  `${(value / 1000).toFixed(0)}k`
                }
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <Bar dataKey="aVencer" stackId="a" fill="#22c55e" name="A Vencer" />
              <Bar dataKey="hoje" stackId="a" fill="#f97316" name="Hoje" />
              <Bar dataKey="vencido1a7" stackId="a" fill="#eab308" name="1-7d" />
              <Bar dataKey="vencido8a15" stackId="a" fill="#f97316" name="8-15d" />
              <Bar dataKey="vencido16a30" stackId="a" fill="#ef4444" name="16-30d" />
              <Bar dataKey="vencido30Plus" stackId="a" fill="#991b1b" name="30+d" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Gráfico de Fluxo de Caixa - Linha */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            <div>
              <CardTitle>Projeção de Fluxo de Caixa</CardTitle>
              <CardDescription>Próximos 30 dias</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData.cashFlow}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="data"
                className="text-xs"
                tick={{ fill: 'currentColor' }}
              />
              <YAxis
                className="text-xs"
                tick={{ fill: 'currentColor' }}
                tickFormatter={(value) =>
                  `${(value / 1000).toFixed(0)}k`
                }
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <Line
                type="monotone"
                dataKey="aPagar"
                stroke="#ef4444"
                name="A Pagar"
                strokeWidth={2}
                dot={{ r: 3 }}
              />
              <Line
                type="monotone"
                dataKey="receber"
                stroke="#22c55e"
                name="A Receber"
                strokeWidth={2}
                dot={{ r: 3 }}
              />
              <Line
                type="monotone"
                dataKey="saldo"
                stroke="#3b82f6"
                name="Saldo Projetado"
                strokeWidth={3}
                dot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Gráfico por Categoria - Pizza */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <PieChartIcon className="h-5 w-5" />
            <div>
              <CardTitle>Gastos por Categoria</CardTitle>
              <CardDescription>Distribuição percentual</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={chartData.categories}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(entry) => `${entry.categoria}: ${entry.percentual}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="valor"
              >
                {chartData.categories.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomPieTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-4 space-y-2">
            {chartData.categories.map((cat, index) => (
              <div key={cat.categoria} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <span>{cat.categoria}</span>
                </div>
                <span className="font-semibold">
                  R$ {cat.valor.toLocaleString('pt-BR')}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Gráfico de Tendência DPO e Taxa de Atraso */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            <div>
              <CardTitle>Evolução DPO e Taxa de Atraso</CardTitle>
              <CardDescription>Últimos 6 meses</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData.trends}>
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
                label={{ value: 'DPO (dias)', angle: -90, position: 'insideLeft', style: { fontSize: 12 } }}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                className="text-xs"
                tick={{ fill: 'currentColor' }}
                label={{ value: 'Atraso (%)', angle: 90, position: 'insideRight', style: { fontSize: 12 } }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="dpo"
                stroke="#3b82f6"
                name="DPO (dias)"
                strokeWidth={2}
                dot={{ r: 4 }}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="taxaAtraso"
                stroke="#ef4444"
                name="Taxa Atraso (%)"
                strokeWidth={2}
                dot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};
