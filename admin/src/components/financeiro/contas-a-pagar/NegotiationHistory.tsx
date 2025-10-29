'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useNegotiations, useNegotiationSummary } from '@/hooks/useNegotiations';
import {
  HandshakeIcon,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle2,
  XCircle,
  Eye,
  DollarSign,
  Percent,
  Target,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

const getTipoLabel = (tipo: string) => {
  const labels: Record<string, string> = {
    desconto: 'Desconto',
    prazo: 'Prazo',
    parcelamento: 'Parcelamento',
    condicoes: 'Condições',
  };
  return labels[tipo] || tipo;
};

const getTipoIcon = (tipo: string) => {
  const icons: Record<string, React.ReactNode> = {
    desconto: <Percent className="h-3 w-3" />,
    prazo: <Clock className="h-3 w-3" />,
    parcelamento: <DollarSign className="h-3 w-3" />,
    condicoes: <Target className="h-3 w-3" />,
  };
  return icons[tipo] || <HandshakeIcon className="h-3 w-3" />;
};

const getStatusBadge = (status: string) => {
  const variants: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ReactNode; label: string }> = {
    em_negociacao: {
      variant: 'default',
      icon: <Clock className="h-3 w-3 mr-1" />,
      label: 'Em Negociação',
    },
    aceita: {
      variant: 'secondary',
      icon: <CheckCircle2 className="h-3 w-3 mr-1" />,
      label: 'Aceita',
    },
    recusada: {
      variant: 'destructive',
      icon: <XCircle className="h-3 w-3 mr-1" />,
      label: 'Recusada',
    },
  };

  const config = variants[status] || variants.em_negociacao;

  return (
    <Badge variant={config.variant} className="flex items-center w-fit">
      {config.icon}
      {config.label}
    </Badge>
  );
};

export const NegotiationHistory: React.FC = () => {
  const negotiations = useNegotiations();
  const summary = useNegotiationSummary();

  const handleViewDetails = (negotiationId: string) => {
    // TODO: Abrir modal de detalhes
    console.log('Ver detalhes:', negotiationId);
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Negociações</CardTitle>
            <HandshakeIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalNegociacoes}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {summary.emNegociacao} em andamento
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Sucesso</CardTitle>
            <Target className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {summary.taxaSucesso.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {summary.negociacoesAceitas} aceitas / {summary.negociacoesRecusadas} recusadas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Economia Total</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className={cn(
              "text-2xl font-bold",
              summary.economiaTotal >= 0 ? "text-green-600" : "text-red-600"
            )}>
              {summary.economiaTotal >= 0 ? '+' : ''}R$ {Math.abs(summary.economiaTotal).toLocaleString('pt-BR')}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              com negociações aceitas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Economia Média</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className={cn(
              "text-2xl font-bold",
              summary.economiaMedia >= 0 ? "text-green-600" : "text-red-600"
            )}>
              {summary.economiaMedia >= 0 ? '+' : ''}R$ {Math.abs(summary.economiaMedia).toLocaleString('pt-BR')}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              por negociação aceita
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Negotiations Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HandshakeIcon className="h-5 w-5" />
            Histórico de Negociações
          </CardTitle>
          <CardDescription>
            Acompanhe todas as negociações realizadas com fornecedores
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fatura</TableHead>
                <TableHead>Fornecedor</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead className="text-right">Valor Original</TableHead>
                <TableHead className="text-right">Valor Negociado</TableHead>
                <TableHead className="text-right">Economia</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Negociado Por</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {negotiations.map((negotiation) => (
                <TableRow key={negotiation.id}>
                  <TableCell className="font-medium">
                    {negotiation.invoiceNumber}
                  </TableCell>
                  <TableCell>{negotiation.fornecedor}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="flex items-center w-fit">
                      {getTipoIcon(negotiation.tipo)}
                      <span className="ml-1">{getTipoLabel(negotiation.tipo)}</span>
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    R$ {negotiation.valorOriginal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell className="text-right">
                    R$ {negotiation.valorNegociado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      {negotiation.economia >= 0 ? (
                        <TrendingUp className="h-4 w-4 text-green-600" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-red-600" />
                      )}
                      <span className={cn(
                        "font-semibold",
                        negotiation.economia >= 0 ? "text-green-600" : "text-red-600"
                      )}>
                        {negotiation.economia >= 0 ? '+' : ''}R$ {Math.abs(negotiation.economia).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                      <span className={cn(
                        "text-xs ml-1",
                        negotiation.economia >= 0 ? "text-green-600" : "text-red-600"
                      )}>
                        ({negotiation.economiaPercentual >= 0 ? '+' : ''}{negotiation.economiaPercentual.toFixed(1)}%)
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(negotiation.status)}
                  </TableCell>
                  <TableCell className="text-sm">
                    {negotiation.negociadoPor}
                  </TableCell>
                  <TableCell className="text-sm">
                    <div>
                      <p>{format(negotiation.dataInicio, "dd/MM/yyyy", { locale: ptBR })}</p>
                      {negotiation.dataFechamento && (
                        <p className="text-xs text-muted-foreground">
                          Fechado: {format(negotiation.dataFechamento, "dd/MM/yyyy", { locale: ptBR })}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleViewDetails(negotiation.id)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {negotiations.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              Nenhuma negociação encontrada
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detailed Negotiations List */}
      <Card>
        <CardHeader>
          <CardTitle>Detalhes das Negociações</CardTitle>
          <CardDescription>
            Informações completas sobre cada negociação
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {negotiations.map((negotiation) => (
              <div key={negotiation.id} className="border rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold">{negotiation.fornecedor}</h4>
                      <Badge variant="outline">
                        {getTipoLabel(negotiation.tipo)}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Fatura: {negotiation.invoiceNumber}
                    </p>
                  </div>
                  {getStatusBadge(negotiation.status)}
                </div>

                <div className="bg-muted p-3 rounded-md mb-3">
                  <p className="text-sm font-medium mb-2">Observações:</p>
                  <p className="text-sm text-muted-foreground">{negotiation.observacoes}</p>
                </div>

                {/* Detalhes específicos por tipo */}
                {negotiation.tipo === 'desconto' && negotiation.detalhes.descontoPercentualOriginal !== undefined && (
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Desconto Original</p>
                      <p className="font-semibold">{negotiation.detalhes.descontoPercentualOriginal}%</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Desconto Negociado</p>
                      <p className="font-semibold text-green-600">
                        {negotiation.detalhes.descontoPercentualNegociado}%
                      </p>
                    </div>
                  </div>
                )}

                {negotiation.tipo === 'prazo' && negotiation.detalhes.prazoOriginal && (
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Prazo Original</p>
                      <p className="font-semibold">{negotiation.detalhes.prazoOriginal} dias</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Prazo Negociado</p>
                      <p className="font-semibold text-blue-600">
                        {negotiation.detalhes.prazoNegociado} dias
                      </p>
                    </div>
                  </div>
                )}

                {negotiation.tipo === 'parcelamento' && negotiation.detalhes.parcelasOriginais && (
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Parcelas Originais</p>
                      <p className="font-semibold">{negotiation.detalhes.parcelasOriginais}x</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Parcelas Negociadas</p>
                      <p className="font-semibold text-blue-600">
                        {negotiation.detalhes.parcelasNegociadas}x
                      </p>
                    </div>
                  </div>
                )}

                {negotiation.tipo === 'condicoes' && negotiation.detalhes.condicoesOriginais && (
                  <div className="space-y-2 text-sm">
                    <div>
                      <p className="text-muted-foreground">Condições Originais</p>
                      <p className="font-medium">{negotiation.detalhes.condicoesOriginais}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Condições Negociadas</p>
                      <p className="font-medium text-blue-600">
                        {negotiation.detalhes.condicoesNegociadas}
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between mt-3 pt-3 border-t text-xs text-muted-foreground">
                  <span>Negociado por: {negotiation.negociadoPor}</span>
                  <span>
                    Iniciado: {format(negotiation.dataInicio, "dd/MM/yyyy", { locale: ptBR })}
                    {negotiation.dataFechamento && (
                      <> • Fechado: {format(negotiation.dataFechamento, "dd/MM/yyyy", { locale: ptBR })}</>
                    )}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
