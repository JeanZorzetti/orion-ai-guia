'use client';

import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ExpensesByCategoryChartProps {
  data: Array<{
    category: string;
    value: number;
    percentage: number;
  }>;
  className?: string;
}

const EXPENSE_COLORS: Record<string, string> = {
  Fornecedores: '#EF4444',
  Pessoal: '#F59E0B',
  Impostos: '#8B5CF6',
  Aluguel: '#3B82F6',
  Marketing: '#EC4899',
  Outros: '#6B7280',
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
    payload: {
      percentage: number;
    };
  }>;
}

const CustomTooltip = ({ active, payload }: TooltipProps) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    return (
      <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
        <p className="text-sm font-semibold text-foreground mb-2">
          {data.name}
        </p>
        <div className="space-y-1">
          <p className="text-sm">
            <span className="text-muted-foreground">Valor: </span>
            <span className="font-semibold text-foreground">
              {formatCurrency(data.value)}
            </span>
          </p>
          <p className="text-sm">
            <span className="text-muted-foreground">Percentual: </span>
            <span className="font-semibold text-foreground">
              {data.payload.percentage.toFixed(1)}%
            </span>
          </p>
        </div>
      </div>
    );
  }
  return null;
};

const ExpensesByCategoryChartComponent: React.FC<
  ExpensesByCategoryChartProps
> = ({ data, className = '' }) => {
  const totalExpenses = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Despesas por Categoria</CardTitle>
        <p className="text-sm text-muted-foreground">
          Distribuição do mês atual
        </p>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label
              outerRadius={100}
              fill="#8884d8"
              dataKey="value"
              nameKey="category"
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={
                    EXPENSE_COLORS[entry.category] || EXPENSE_COLORS['Outros']
                  }
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>

        {/* Tabela detalhada */}
        <div className="mt-4 space-y-2">
          {data.map((item) => (
            <div
              key={item.category}
              className="flex items-center justify-between text-sm p-2 rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-2 flex-1">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{
                    backgroundColor:
                      EXPENSE_COLORS[item.category] || EXPENSE_COLORS['Outros'],
                  }}
                />
                <span className="font-medium">{item.category}</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-muted-foreground">
                  {item.percentage.toFixed(1)}%
                </span>
                <span className="font-semibold w-28 text-right">
                  {formatCurrency(item.value)}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Total */}
        <div className="mt-4 pt-4 border-t border-border">
          <div className="flex items-center justify-between text-sm font-semibold">
            <span>Total de Despesas</span>
            <span className="text-lg text-red-600">
              {formatCurrency(totalExpenses)}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Otimização: Memoizar componente para evitar re-renders desnecessários
export const ExpensesByCategoryChart = React.memo(ExpensesByCategoryChartComponent);
