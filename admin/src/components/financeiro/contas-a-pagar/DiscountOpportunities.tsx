'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useDiscountOpportunities, useDiscountSummary, applyDiscount } from '@/hooks/useDiscountOpportunities';
import { Percent, Check, Eye, TrendingUp, AlertCircle, Clock, DollarSign } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const getCategoryLabel = (categoria: string) => {
  const labels: Record<string, string> = {
    pagamento_antecipado: 'Pagamento Antecipado',
    volume: 'Desconto por Volume',
    primeira_compra: 'Primeira Compra',
    fidelidade: 'Fidelidade',
    sazonal: 'Sazonal',
  };
  return labels[categoria] || categoria;
};

const getCategoryColor = (categoria: string) => {
  const colors: Record<string, string> = {
    pagamento_antecipado: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
    volume: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
    primeira_compra: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
    fidelidade: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
    sazonal: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
  };
  return colors[categoria] || 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
};

export const DiscountOpportunities: React.FC = () => {
  const opportunities = useDiscountOpportunities('disponivel');
  const summary = useDiscountSummary();
  const [processingId, setProcessingId] = useState<string | null>(null);

  const handleApplyDiscount = async (opportunityId: string) => {
    setProcessingId(opportunityId);
    try {
      await applyDiscount(opportunityId);
      // TODO: Mostrar toast de sucesso e atualizar lista
    } catch (error) {
      console.error('Erro ao aplicar desconto:', error);
      // TODO: Mostrar toast de erro
    } finally {
      setProcessingId(null);
    }
  };

  const handleViewInvoice = (faturaId: string) => {
    // TODO: Abrir modal de detalhes da fatura
    console.log('Ver fatura:', faturaId);
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Descontos Disponíveis</CardTitle>
            <Percent className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalDescontosDisponiveis}</div>
            <p className="text-xs text-muted-foreground mt-1">
              oportunidades ativas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Economia Potencial</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              R$ {summary.valorTotalDescontos.toLocaleString('pt-BR')}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              disponível para aproveitar
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Descontos Expirados</CardTitle>
            <AlertCircle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {summary.descontosExpirados}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              R$ {summary.valorDescontosExpirados.toLocaleString('pt-BR')} perdidos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Aproveitamento</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {summary.taxaAproveitamento.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {summary.descontosAproveitados} aproveitados
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Opportunities List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Percent className="h-5 w-5" />
                Oportunidades de Desconto
              </CardTitle>
              <CardDescription>
                Aproveite descontos antes que expirem e economize nas suas faturas
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {opportunities.length === 0 ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Nenhuma oportunidade de desconto disponível no momento.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-3">
              {opportunities.map((opp) => (
                <div
                  key={opp.id}
                  className={cn(
                    'border rounded-lg p-4 transition-colors',
                    opp.diasRestantes <= 2 && 'border-orange-500 bg-orange-50 dark:bg-orange-950/20',
                    opp.diasRestantes <= 0 && 'border-red-500 bg-red-50 dark:bg-red-950/20'
                  )}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold">{opp.fornecedor}</h4>
                        <Badge className={getCategoryColor(opp.categoria)}>
                          {getCategoryLabel(opp.categoria)}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{opp.condicao}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Fatura: {opp.invoiceNumber}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Badge
                        variant={
                          opp.diasRestantes <= 0
                            ? 'destructive'
                            : opp.diasRestantes <= 2
                            ? 'default'
                            : 'secondary'
                        }
                        className="ml-2"
                      >
                        <Clock className="h-3 w-3 mr-1" />
                        {opp.diasRestantes <= 0
                          ? 'EXPIRADO'
                          : `${opp.diasRestantes}d restantes`}
                      </Badge>
                      <p className="text-xs text-muted-foreground">
                        Expira: {format(opp.dataLimite, "dd/MM/yyyy", { locale: ptBR })}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 mb-4 p-3 bg-muted rounded-md">
                    <div>
                      <p className="text-xs text-muted-foreground">Valor Original</p>
                      <p className="text-sm font-semibold">
                        R$ {opp.valorOriginal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Desconto</p>
                      <p className="text-sm font-semibold text-green-600">
                        {opp.descontoPercentual}% (R$ {opp.valorDesconto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })})
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Valor Final</p>
                      <p className="text-sm font-semibold text-blue-600">
                        R$ {opp.valorFinal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleApplyDiscount(opp.id)}
                      disabled={processingId === opp.id || opp.diasRestantes <= 0}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Check className="h-4 w-4 mr-2" />
                      {processingId === opp.id ? 'Aplicando...' : 'Aproveitar Desconto'}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleViewInvoice(opp.faturaId)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Ver Fatura
                    </Button>
                  </div>

                  {opp.diasRestantes <= 2 && opp.diasRestantes > 0 && (
                    <Alert className="mt-3 border-orange-300 bg-orange-50 dark:bg-orange-950/20">
                      <AlertCircle className="h-4 w-4 text-orange-600" />
                      <AlertDescription className="text-orange-700 dark:text-orange-400">
                        <strong>Atenção:</strong> Esta oportunidade expira em breve! Aproveite antes de perder o desconto.
                      </AlertDescription>
                    </Alert>
                  )}

                  {opp.diasRestantes <= 0 && (
                    <Alert variant="destructive" className="mt-3">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        <strong>Expirado:</strong> Esta oportunidade de desconto não está mais disponível.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
