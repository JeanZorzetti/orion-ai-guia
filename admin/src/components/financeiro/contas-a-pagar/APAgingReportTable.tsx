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
  TableFooter,
} from '@/components/ui/table';
import { useAPAgingReport, useAPAgingTotals } from '@/hooks/useAPAgingReport';
import { Clock, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

const getUrgencyVariant = (urgencia: string) => {
  const variants = {
    baixa: 'default' as const,
    media: 'secondary' as const,
    alta: 'outline' as const,
    critica: 'destructive' as const,
  };
  return variants[urgencia as keyof typeof variants] || 'default';
};

export const APAgingReportTable: React.FC = () => {
  const agingData = useAPAgingReport();
  const totals = useAPAgingTotals();

  const formatCurrency = (value: number) => {
    return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          <div className="flex-1">
            <CardTitle>Aging Report - Análise de Vencimentos</CardTitle>
            <CardDescription>
              Títulos agrupados por fornecedor e período de vencimento
            </CardDescription>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Total Geral</p>
            <p className="text-2xl font-bold">{formatCurrency(totals.total)}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Legenda de cores */}
        <div className="mb-4 p-4 bg-muted rounded-lg">
          <p className="text-sm font-semibold mb-2">Legenda de Períodos:</p>
          <div className="flex flex-wrap gap-4 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-green-500" />
              <span>A Vencer (futuro)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-orange-500" />
              <span>Vencendo Hoje</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-yellow-500" />
              <span>1-7 dias vencido</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-orange-600" />
              <span>8-15 dias vencido</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-red-500" />
              <span>16-30 dias vencido</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-red-900" />
              <span>30+ dias vencido</span>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[200px]">Fornecedor</TableHead>
                <TableHead className="text-right">A Vencer</TableHead>
                <TableHead className="text-right">Hoje</TableHead>
                <TableHead className="text-right">1-7d</TableHead>
                <TableHead className="text-right">8-15d</TableHead>
                <TableHead className="text-right">16-30d</TableHead>
                <TableHead className="text-right">30+d</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-center">Urgência</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {agingData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                    Nenhum dado disponível
                  </TableCell>
                </TableRow>
              ) : (
                agingData.map((bucket) => (
                  <TableRow key={bucket.fornecedorId}>
                    <TableCell className="font-medium">
                      <div>
                        <p className="font-semibold">{bucket.fornecedorNome}</p>
                        <p className="text-xs text-muted-foreground">
                          {bucket.quantidadeTitulos} {bucket.quantidadeTitulos === 1 ? 'título' : 'títulos'}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="text-right text-green-600 font-semibold">
                      {bucket.aVencer > 0 ? formatCurrency(bucket.aVencer) : '-'}
                    </TableCell>
                    <TableCell className={cn(
                      'text-right font-semibold',
                      bucket.vencendoHoje > 0 ? 'text-orange-600' : 'text-muted-foreground'
                    )}>
                      {bucket.vencendoHoje > 0 ? formatCurrency(bucket.vencendoHoje) : '-'}
                    </TableCell>
                    <TableCell className={cn(
                      'text-right',
                      bucket.vencido1a7 > 0 ? 'text-yellow-600 font-semibold' : 'text-muted-foreground'
                    )}>
                      {bucket.vencido1a7 > 0 ? formatCurrency(bucket.vencido1a7) : '-'}
                    </TableCell>
                    <TableCell className={cn(
                      'text-right',
                      bucket.vencido8a15 > 0 ? 'text-orange-600 font-semibold' : 'text-muted-foreground'
                    )}>
                      {bucket.vencido8a15 > 0 ? formatCurrency(bucket.vencido8a15) : '-'}
                    </TableCell>
                    <TableCell className={cn(
                      'text-right',
                      bucket.vencido16a30 > 0 ? 'text-red-600 font-bold' : 'text-muted-foreground'
                    )}>
                      {bucket.vencido16a30 > 0 ? formatCurrency(bucket.vencido16a30) : '-'}
                    </TableCell>
                    <TableCell className={cn(
                      'text-right font-bold',
                      bucket.vencido30Plus > 0 ? 'text-destructive' : 'text-muted-foreground'
                    )}>
                      {bucket.vencido30Plus > 0 ? (
                        <div className="flex items-center justify-end gap-1">
                          <AlertTriangle className="h-4 w-4" />
                          {formatCurrency(bucket.vencido30Plus)}
                        </div>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell className="text-right font-bold">
                      {formatCurrency(bucket.total)}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant={getUrgencyVariant(bucket.urgencia)}>
                        {bucket.urgencia.toUpperCase()}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
            {agingData.length > 0 && (
              <TableFooter>
                <TableRow className="bg-muted/50">
                  <TableHead className="font-bold">TOTAL GERAL</TableHead>
                  <TableHead className="text-right font-bold text-green-600">
                    {formatCurrency(totals.aVencer)}
                  </TableHead>
                  <TableHead className="text-right font-bold text-orange-600">
                    {formatCurrency(totals.vencendoHoje)}
                  </TableHead>
                  <TableHead className="text-right font-bold text-yellow-600">
                    {formatCurrency(totals.vencido1a7)}
                  </TableHead>
                  <TableHead className="text-right font-bold text-orange-600">
                    {formatCurrency(totals.vencido8a15)}
                  </TableHead>
                  <TableHead className="text-right font-bold text-red-600">
                    {formatCurrency(totals.vencido16a30)}
                  </TableHead>
                  <TableHead className="text-right font-bold text-destructive">
                    {formatCurrency(totals.vencido30Plus)}
                  </TableHead>
                  <TableHead className="text-right font-bold">
                    {formatCurrency(totals.total)}
                  </TableHead>
                  <TableHead />
                </TableRow>
              </TableFooter>
            )}
          </Table>
        </div>

        {/* Resumo de urgências */}
        {agingData.length > 0 && (
          <div className="mt-4 p-4 bg-muted rounded-lg">
            <p className="text-sm font-semibold mb-3">Resumo por Urgência:</p>
            <div className="grid grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Crítica</p>
                <p className="font-bold text-destructive">
                  {agingData.filter((b) => b.urgencia === 'critica').length} fornecedores
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Alta</p>
                <p className="font-bold text-orange-600">
                  {agingData.filter((b) => b.urgencia === 'alta').length} fornecedores
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Média</p>
                <p className="font-bold text-blue-600">
                  {agingData.filter((b) => b.urgencia === 'media').length} fornecedores
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Baixa</p>
                <p className="font-bold text-green-600">
                  {agingData.filter((b) => b.urgencia === 'baixa').length} fornecedores
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
