'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { DateRangePicker, DateRange } from './DateRangePicker';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RefreshCw, Download } from 'lucide-react';

export interface FinancialFilters {
  dateRange: DateRange;
  category: string;
  status: string;
}

interface FilterBarProps {
  filters: FinancialFilters;
  onFiltersChange: (filters: FinancialFilters) => void;
  onRefresh?: () => void;
  onExport?: () => void;
  className?: string;
}

const CATEGORIES = [
  { value: 'all', label: 'Todas Categorias' },
  { value: 'revenue', label: 'Receitas' },
  { value: 'expense', label: 'Despesas' },
  { value: 'investment', label: 'Investimentos' },
  { value: 'transfer', label: 'Transferências' },
];

const STATUS_OPTIONS = [
  { value: 'all', label: 'Todos Status' },
  { value: 'pending', label: 'Pendente' },
  { value: 'paid', label: 'Pago' },
  { value: 'overdue', label: 'Vencido' },
  { value: 'cancelled', label: 'Cancelado' },
];

export const FilterBar: React.FC<FilterBarProps> = ({
  filters,
  onFiltersChange,
  onRefresh,
  onExport,
  className = '',
}) => {
  const handleDateRangeChange = (dateRange: DateRange) => {
    onFiltersChange({ ...filters, dateRange });
  };

  const handleCategoryChange = (category: string) => {
    onFiltersChange({ ...filters, category });
  };

  const handleStatusChange = (status: string) => {
    onFiltersChange({ ...filters, status });
  };

  return (
    <Card className={className}>
      <CardContent className="pt-6">
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
          {/* Date Range Picker */}
          <div className="flex-1 w-full lg:w-auto">
            <DateRangePicker
              value={filters.dateRange}
              onChange={handleDateRangeChange}
              className="w-full"
            />
          </div>

          {/* Category Filter */}
          <div className="w-full lg:w-48">
            <Select
              value={filters.category}
              onValueChange={handleCategoryChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Status Filter */}
          <div className="w-full lg:w-48">
            <Select value={filters.status} onValueChange={handleStatusChange}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((status) => (
                  <SelectItem key={status.value} value={status.value}>
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 w-full lg:w-auto">
            {onRefresh && (
              <Button
                variant="outline"
                size="icon"
                onClick={onRefresh}
                title="Atualizar dados"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            )}
            {onExport && (
              <Button
                variant="outline"
                size="icon"
                onClick={onExport}
                title="Exportar dados"
              >
                <Download className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Active Filters Summary */}
        <div className="mt-4 flex flex-wrap gap-2">
          {filters.category !== 'all' && (
            <div className="inline-flex items-center gap-1 px-2 py-1 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded text-xs">
              <span className="font-semibold">Categoria:</span>
              <span>
                {CATEGORIES.find((c) => c.value === filters.category)?.label}
              </span>
              <button
                onClick={() => handleCategoryChange('all')}
                className="ml-1 hover:text-blue-800 dark:hover:text-blue-200"
              >
                ×
              </button>
            </div>
          )}
          {filters.status !== 'all' && (
            <div className="inline-flex items-center gap-1 px-2 py-1 bg-green-500/10 text-green-600 dark:text-green-400 rounded text-xs">
              <span className="font-semibold">Status:</span>
              <span>
                {STATUS_OPTIONS.find((s) => s.value === filters.status)?.label}
              </span>
              <button
                onClick={() => handleStatusChange('all')}
                className="ml-1 hover:text-green-800 dark:hover:text-green-200"
              >
                ×
              </button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
