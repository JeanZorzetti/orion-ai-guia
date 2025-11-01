'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useSupplierComparison } from '@/hooks/useSupplierComparison';
import { ArrowUpDown, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';

const getCategoryVariant = (categoria: string) => {
  const variants = {
    excelente: 'default' as const,
    bom: 'secondary' as const,
    regular: 'outline' as const,
    ruim: 'destructive' as const,
    critico: 'destructive' as const,
  };
  return variants[categoria as keyof typeof variants] || 'outline';
};

export const SupplierComparison: React.FC = () => {
  const { suppliers, loading } = useSupplierComparison();
  const [sortField, setSortField] = React.useState<'score' | 'totalComprado' | 'pontualidade'>('score');
  const [sortOrder, setSortOrder] = React.useState<'asc' | 'desc'>('desc');

  const sortedSuppliers = React.useMemo(() => {
    return [...suppliers].sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];
      return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
    });
  }, [suppliers, sortField, sortOrder]);

  const handleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Comparação de Fornecedores</CardTitle>
        <CardDescription>
          Compare preços, performance e métricas entre fornecedores
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : suppliers.length === 0 ? (
          <EmptyState
            icon={AlertCircle}
            title="Nenhum fornecedor para comparar"
            description="Cadastre fornecedores e realize compras para visualizar a comparação."
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fornecedor</TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSort('score')}
                  className="hover:bg-transparent p-0 h-auto font-semibold"
                >
                  Score
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead className="text-right">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSort('totalComprado')}
                  className="hover:bg-transparent p-0 h-auto font-semibold"
                >
                  Total Comprado
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead className="text-right">Ticket Médio</TableHead>
              <TableHead className="text-right">Prazo Médio</TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSort('pontualidade')}
                  className="hover:bg-transparent p-0 h-auto font-semibold"
                >
                  Pontualidade
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead className="text-right">Faturas</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedSuppliers.map((supplier) => (
              <TableRow key={supplier.fornecedorId}>
                <TableCell>
                  <div>
                    <p className="font-medium">{supplier.fornecedorNome}</p>
                    <Badge variant={getCategoryVariant(supplier.categoria)} className="mt-1">
                      {supplier.categoria}
                    </Badge>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="font-bold text-lg">{supplier.score}</span>
                </TableCell>
                <TableCell className="text-right font-semibold">
                  R$ {supplier.totalComprado.toLocaleString('pt-BR')}
                </TableCell>
                <TableCell className="text-right">
                  R$ {supplier.ticketMedio.toLocaleString('pt-BR')}
                </TableCell>
                <TableCell className="text-right">{supplier.prazoMedioPagamento} dias</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-muted rounded-full h-2">
                      <div
                        className="bg-primary rounded-full h-2"
                        style={{ width: `${supplier.pontualidade}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium w-12">{supplier.pontualidade}%</span>
                  </div>
                </TableCell>
                <TableCell className="text-right">{supplier.totalFaturas}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        )}
      </CardContent>
    </Card>
  );
};
