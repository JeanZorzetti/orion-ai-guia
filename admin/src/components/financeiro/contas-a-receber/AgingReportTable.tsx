'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useAgingReport, useAgingTotals } from '@/hooks/useAgingReport';
import { cn } from '@/lib/utils';

const getRiskVariant = (risco: string): "default" | "secondary" | "destructive" | "outline" => {
  switch (risco) {
    case 'baixo':
      return 'secondary';
    case 'medio':
      return 'default';
    case 'alto':
      return 'outline';
    case 'critico':
      return 'destructive';
    default:
      return 'default';
  }
};

const getRiskColor = (risco: string): string => {
  switch (risco) {
    case 'baixo':
      return 'text-green-600';
    case 'medio':
      return 'text-yellow-600';
    case 'alto':
      return 'text-orange-600';
    case 'critico':
      return 'text-red-600';
    default:
      return '';
  }
};

export const AgingReportTable: React.FC = () => {
  const agingData = useAgingReport();
  const totals = useAgingTotals();

  const formatCurrency = (value: number) => {
    return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Aging Report - Análise de Vencimentos</CardTitle>
        <CardDescription>
          Títulos agrupados por período de vencimento e classificação de risco
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[200px]">Cliente</TableHead>
                <TableHead className="text-right">Atual (0-30d)</TableHead>
                <TableHead className="text-right">31-60 dias</TableHead>
                <TableHead className="text-right">61-90 dias</TableHead>
                <TableHead className="text-right">91-120 dias</TableHead>
                <TableHead className="text-right">120+ dias</TableHead>
                <TableHead className="text-right font-bold">Total</TableHead>
                <TableHead className="text-center">Risco</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {agingData.map((bucket) => (
                <TableRow key={bucket.clienteId}>
                  <TableCell className="font-medium">{bucket.clienteNome}</TableCell>
                  <TableCell className="text-right text-green-600">
                    {formatCurrency(bucket.atual)}
                  </TableCell>
                  <TableCell className={cn('text-right', bucket.dias30 > 0 && 'text-yellow-600 font-medium')}>
                    {formatCurrency(bucket.dias30)}
                  </TableCell>
                  <TableCell className={cn('text-right', bucket.dias60 > 0 && 'text-orange-600 font-medium')}>
                    {formatCurrency(bucket.dias60)}
                  </TableCell>
                  <TableCell className={cn('text-right', bucket.dias90 > 0 && 'text-red-600 font-semibold')}>
                    {formatCurrency(bucket.dias90)}
                  </TableCell>
                  <TableCell className={cn('text-right', bucket.dias120Plus > 0 && 'text-destructive font-bold')}>
                    {formatCurrency(bucket.dias120Plus)}
                  </TableCell>
                  <TableCell className="text-right font-bold">
                    {formatCurrency(bucket.total)}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant={getRiskVariant(bucket.risco)} className={getRiskColor(bucket.risco)}>
                      {bucket.risco.toUpperCase()}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFooter>
              <TableRow className="bg-muted/50">
                <TableCell className="font-bold">TOTAL GERAL</TableCell>
                <TableCell className="text-right font-bold text-green-600">
                  {formatCurrency(totals.atual)}
                </TableCell>
                <TableCell className="text-right font-bold text-yellow-600">
                  {formatCurrency(totals.dias30)}
                </TableCell>
                <TableCell className="text-right font-bold text-orange-600">
                  {formatCurrency(totals.dias60)}
                </TableCell>
                <TableCell className="text-right font-bold text-red-600">
                  {formatCurrency(totals.dias90)}
                </TableCell>
                <TableCell className="text-right font-bold text-destructive">
                  {formatCurrency(totals.dias120Plus)}
                </TableCell>
                <TableCell className="text-right font-bold text-lg">
                  {formatCurrency(totals.total)}
                </TableCell>
                <TableCell></TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </div>

        {/* Legenda */}
        <div className="mt-4 flex flex-wrap gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-green-600"></div>
            <span>Atual (0-30 dias)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-yellow-600"></div>
            <span>31-60 dias</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-orange-600"></div>
            <span>61-90 dias</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-red-600"></div>
            <span>91-120 dias</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-destructive"></div>
            <span>120+ dias (Crítico)</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
