'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './card';
import { Button } from './button';
import { Input } from './input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './select';
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Search,
  ChevronLeft,
  ChevronRight,
  LucideIcon,
} from 'lucide-react';
import { TableSkeleton } from './table-skeleton';
import { EmptyState } from './empty-state';

export type SortOrder = 'asc' | 'desc';

export interface DataTableColumn<T> {
  key: keyof T | string;
  label: string;
  sortable?: boolean;
  render?: (item: T) => React.ReactNode;
  align?: 'left' | 'center' | 'right';
  width?: string;
}

export interface DataTableAction<T> {
  label: string;
  icon?: LucideIcon;
  onClick: (item: T) => void;
  variant?: 'default' | 'ghost' | 'destructive' | 'outline';
  show?: (item: T) => boolean;
}

export interface DataTableProps<T> {
  // Dados
  data: T[];
  columns: DataTableColumn<T>[];
  keyExtractor: (item: T) => string | number;

  // Estados
  loading?: boolean;
  error?: string | null;

  // Título e ações no header
  title?: string;
  headerActions?: React.ReactNode;

  // Busca
  searchable?: boolean;
  searchPlaceholder?: string;
  searchKeys?: (keyof T)[];

  // Paginação
  paginated?: boolean;
  defaultPageSize?: number;
  pageSizeOptions?: number[];

  // Ações por linha
  actions?: DataTableAction<T>[];

  // Empty state
  emptyIcon?: LucideIcon;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: {
    label: string;
    onClick: () => void;
  };

  // Retry
  onRetry?: () => void;

  // Estilização
  className?: string;
}

export function DataTable<T extends Record<string, unknown>>({
  data,
  columns,
  keyExtractor,
  loading = false,
  error = null,
  title,
  headerActions,
  searchable = true,
  searchPlaceholder = 'Buscar...',
  searchKeys,
  paginated = true,
  defaultPageSize = 10,
  pageSizeOptions = [10, 25, 50, 100],
  actions,
  emptyIcon,
  emptyTitle = 'Nenhum dado encontrado',
  emptyDescription,
  emptyAction,
  onRetry,
  className,
}: DataTableProps<T>) {
  // Estados
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(defaultPageSize);

  // Função de busca
  const filteredData = useMemo(() => {
    if (!searchable || !searchTerm) return data;

    return data.filter((item) => {
      // Se searchKeys foi especificado, buscar apenas nesses campos
      if (searchKeys && searchKeys.length > 0) {
        return searchKeys.some((key) => {
          const value = item[key];
          return String(value).toLowerCase().includes(searchTerm.toLowerCase());
        });
      }

      // Caso contrário, buscar em todos os campos
      return Object.values(item).some((value) =>
        String(value).toLowerCase().includes(searchTerm.toLowerCase())
      );
    });
  }, [data, searchTerm, searchable, searchKeys]);

  // Função de ordenação
  const sortedData = useMemo(() => {
    if (!sortField) return filteredData;

    return [...filteredData].sort((a, b) => {
      const aValue = a[sortField] as string | number | boolean;
      const bValue = b[sortField] as string | number | boolean;

      if (aValue === bValue) return 0;

      // Handle null/undefined
      if (aValue == null) return 1;
      if (bValue == null) return -1;

      const comparison = aValue < bValue ? -1 : 1;
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [filteredData, sortField, sortOrder]);

  // Paginação
  const totalPages = paginated
    ? Math.ceil(sortedData.length / itemsPerPage)
    : 1;
  const startIndex = paginated ? (currentPage - 1) * itemsPerPage : 0;
  const endIndex = paginated ? startIndex + itemsPerPage : sortedData.length;
  const paginatedData = sortedData.slice(startIndex, endIndex);

  // Handlers
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  const handleItemsPerPageChange = (value: string) => {
    setItemsPerPage(Number(value));
    setCurrentPage(1);
  };

  // Reset página quando busca muda
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // Renderizar coluna
  const renderCell = (column: DataTableColumn<T>, item: T) => {
    if (column.render) {
      return column.render(item);
    }
    return String(item[column.key as keyof T] ?? '-');
  };

  // Renderizar header de coluna
  const renderHeader = (column: DataTableColumn<T>) => {
    const isSortable = column.sortable !== false;
    const fieldKey = String(column.key);

    if (!isSortable) {
      return (
        <span className="font-semibold text-sm text-foreground">
          {column.label}
        </span>
      );
    }

    return (
      <Button
        variant="ghost"
        size="sm"
        className="hover:bg-transparent p-0 h-auto font-semibold text-sm"
        onClick={() => handleSort(fieldKey)}
      >
        {column.label}
        {sortField === fieldKey && (
          sortOrder === 'asc' ? (
            <ArrowUp className="ml-2 h-3 w-3" />
          ) : (
            <ArrowDown className="ml-2 h-3 w-3" />
          )
        )}
        {sortField !== fieldKey && (
          <ArrowUpDown className="ml-2 h-3 w-3 opacity-50" />
        )}
      </Button>
    );
  };

  // Renderizar páginas
  const renderPagination = () => {
    if (!paginated || totalPages <= 1) return null;

    const pages: (number | string)[] = [];
    const maxPagesToShow = 5;

    if (totalPages <= maxPagesToShow) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      const leftSiblingIndex = Math.max(currentPage - 1, 1);
      const rightSiblingIndex = Math.min(currentPage + 1, totalPages);

      const shouldShowLeftDots = leftSiblingIndex > 2;
      const shouldShowRightDots = rightSiblingIndex < totalPages - 1;

      if (!shouldShowLeftDots && shouldShowRightDots) {
        for (let i = 1; i <= 3; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      } else if (shouldShowLeftDots && !shouldShowRightDots) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 2; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push('...');
        for (let i = leftSiblingIndex; i <= rightSiblingIndex; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      }
    }

    return (
      <div className="flex items-center justify-between gap-4 px-4 py-4 border-t">
        <div className="text-sm text-muted-foreground">
          Mostrando {startIndex + 1} a {Math.min(endIndex, sortedData.length)} de{' '}
          {sortedData.length} resultado(s)
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          {pages.map((page, index) =>
            typeof page === 'number' ? (
              <Button
                key={index}
                variant={currentPage === page ? 'default' : 'outline'}
                size="sm"
                onClick={() => handlePageChange(page)}
              >
                {page}
              </Button>
            ) : (
              <span key={index} className="px-2 text-muted-foreground">
                {page}
              </span>
            )
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>

          <Select
            value={String(itemsPerPage)}
            onValueChange={handleItemsPerPageChange}
          >
            <SelectTrigger className="w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {pageSizeOptions.map((size) => (
                <SelectItem key={size} value={String(size)}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    );
  };

  // Loading state
  if (loading) {
    return <TableSkeleton rows={itemsPerPage} columns={columns.length + (actions ? 1 : 0)} />;
  }

  // Error state
  if (error) {
    return (
      <EmptyState
        icon={emptyIcon}
        title="Erro ao carregar dados"
        description={error}
        action={
          onRetry
            ? {
                label: 'Tentar Novamente',
                onClick: onRetry,
              }
            : undefined
        }
      />
    );
  }

  // Empty state
  if (sortedData.length === 0) {
    return (
      <EmptyState
        icon={emptyIcon}
        title={emptyTitle}
        description={emptyDescription}
        action={emptyAction}
      />
    );
  }

  return (
    <Card className={className}>
      {(title || headerActions || searchable) && (
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            {title && <CardTitle>{title}</CardTitle>}
            <div className="flex items-center gap-2 flex-1 justify-end">
              {searchable && (
                <div className="relative max-w-sm flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder={searchPlaceholder}
                    className="pl-10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              )}
              {headerActions}
            </div>
          </div>
        </CardHeader>
      )}

      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                {columns.map((column, index) => (
                  <th
                    key={index}
                    className={`p-3 text-${column.align || 'left'}`}
                    style={{ width: column.width }}
                  >
                    {renderHeader(column)}
                  </th>
                ))}
                {actions && actions.length > 0 && (
                  <th className="text-right p-3">
                    <span className="font-semibold text-sm">Ações</span>
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {paginatedData.map((item) => (
                <tr
                  key={keyExtractor(item)}
                  className="border-b hover:bg-muted/50 transition-colors"
                >
                  {columns.map((column, colIndex) => (
                    <td
                      key={colIndex}
                      className={`p-3 text-${column.align || 'left'}`}
                    >
                      {renderCell(column, item)}
                    </td>
                  ))}
                  {actions && actions.length > 0 && (
                    <td className="p-3">
                      <div className="flex items-center justify-end gap-2">
                        {actions.map((action, actionIndex) => {
                          const shouldShow = action.show ? action.show(item) : true;
                          if (!shouldShow) return null;

                          const Icon = action.icon;
                          return (
                            <Button
                              key={actionIndex}
                              variant={action.variant || 'ghost'}
                              size="sm"
                              onClick={() => action.onClick(item)}
                              title={action.label}
                            >
                              {Icon && <Icon className="h-4 w-4" />}
                              {!Icon && action.label}
                            </Button>
                          );
                        })}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {renderPagination()}
      </CardContent>
    </Card>
  );
}
