'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  CreditCard,
  Calendar,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Minus,
  Shield,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { useCustomerRiskScore, type CustomerRiskScore } from '@/hooks/useCustomerRiskScore';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface CustomerRiskProfileProps {
  clienteId: string;
}

const getScoreColor = (score: number): string => {
  if (score >= 80) return 'text-green-600';
  if (score >= 60) return 'text-blue-600';
  if (score >= 40) return 'text-yellow-600';
  if (score >= 20) return 'text-orange-600';
  return 'text-red-600';
};

const getScoreBgColor = (score: number): string => {
  if (score >= 80) return 'bg-green-100';
  if (score >= 60) return 'bg-blue-100';
  if (score >= 40) return 'bg-yellow-100';
  if (score >= 20) return 'bg-orange-100';
  return 'bg-red-100';
};

const getCategoryVariant = (categoria: CustomerRiskScore['categoria']): "default" | "secondary" | "destructive" | "outline" => {
  switch (categoria) {
    case 'excelente':
      return 'default';
    case 'bom':
      return 'secondary';
    case 'regular':
      return 'outline';
    case 'ruim':
      return 'destructive';
    case 'critico':
      return 'destructive';
    default:
      return 'outline';
  }
};

const getCategoryColor = (categoria: CustomerRiskScore['categoria']): string => {
  switch (categoria) {
    case 'excelente':
      return 'text-green-700 bg-green-100';
    case 'bom':
      return 'text-blue-700 bg-blue-100';
    case 'regular':
      return 'text-yellow-700 bg-yellow-100';
    case 'ruim':
      return 'text-orange-700 bg-orange-100';
    case 'critico':
      return 'text-red-700 bg-red-100';
    default:
      return '';
  }
};

export const CustomerRiskProfile: React.FC<CustomerRiskProfileProps> = ({ clienteId }) => {
  const riskScore = useCustomerRiskScore(clienteId);

  if (!riskScore) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground text-center">
            Dados de risco não disponíveis para este cliente
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle>Análise de Risco do Cliente</CardTitle>
            <CardDescription>
              Atualizado {formatDistanceToNow(riskScore.fatores.ultimaAtualizacao, {
                addSuffix: true,
                locale: ptBR
              })}
            </CardDescription>
          </div>
          <Shield className="h-5 w-5 text-muted-foreground" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Score Principal */}
          <div className="flex items-center justify-between p-6 rounded-lg border bg-card">
            <div className="flex-1">
              <p className="text-sm text-muted-foreground mb-1">Score de Crédito</p>
              <p className={cn('text-5xl font-bold', getScoreColor(riskScore.score))}>
                {riskScore.score}
              </p>
              <Badge variant={getCategoryVariant(riskScore.categoria)} className={cn('mt-3', getCategoryColor(riskScore.categoria))}>
                {riskScore.categoria.toUpperCase()}
              </Badge>
            </div>
            <div className="flex flex-col items-center">
              <div className={cn(
                'w-32 h-32 rounded-full flex items-center justify-center border-8',
                getScoreBgColor(riskScore.score)
              )}>
                <div className="text-center">
                  <div className={cn('text-3xl font-bold', getScoreColor(riskScore.score))}>
                    {riskScore.score}
                  </div>
                  <div className="text-xs text-muted-foreground">/ 100</div>
                </div>
              </div>
            </div>
          </div>

          {/* Fatores de Risco */}
          <div>
            <h4 className="font-semibold mb-4 flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              Fatores Analisados
            </h4>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="font-medium">Histórico de Pagamento</span>
                  <span className="font-semibold text-green-600">
                    {riskScore.fatores.historicoPagamento.toFixed(1)}% em dia
                  </span>
                </div>
                <Progress value={riskScore.fatores.historicoPagamento} className="h-2" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 border rounded-lg">
                  <div className="text-xs text-muted-foreground mb-1">Atraso Médio</div>
                  <div className="text-lg font-semibold">
                    {riskScore.fatores.diasAtrasoMedio} dias
                  </div>
                </div>

                <div className="p-3 border rounded-lg">
                  <div className="text-xs text-muted-foreground mb-1">Tempo de Relacionamento</div>
                  <div className="text-lg font-semibold">
                    {riskScore.fatores.tempoRelacionamento} meses
                  </div>
                </div>

                <div className="p-3 border rounded-lg">
                  <div className="text-xs text-muted-foreground mb-1">Ticket Médio</div>
                  <div className="text-lg font-semibold">
                    R$ {riskScore.fatores.ticketMedio.toLocaleString('pt-BR')}
                  </div>
                </div>

                <div className="p-3 border rounded-lg">
                  <div className="text-xs text-muted-foreground mb-1">Frequência Compras</div>
                  <div className="text-lg font-semibold">
                    {riskScore.fatores.frequenciaCompras}/mês
                  </div>
                </div>
              </div>

              {/* Alertas de negativação */}
              {(riskScore.fatores.protestos > 0 || riskScore.fatores.chequesSemFundo > 0) && (
                <Alert variant="destructive">
                  <XCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Restrições Encontradas:</strong>
                    <ul className="list-disc list-inside mt-1 text-sm">
                      {riskScore.fatores.protestos > 0 && (
                        <li>{riskScore.fatores.protestos} protesto(s) registrado(s)</li>
                      )}
                      {riskScore.fatores.chequesSemFundo > 0 && (
                        <li>{riskScore.fatores.chequesSemFundo} cheque(s) sem fundo</li>
                      )}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </div>

          {/* Recomendações */}
          <div className="bg-muted/50 p-4 rounded-lg border">
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <Shield className="h-4 w-4 text-blue-600" />
              Recomendações Automáticas
            </h4>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                  <span>Limite de Crédito Sugerido:</span>
                </div>
                <span className="font-semibold text-blue-600">
                  R$ {riskScore.recomendacoes.limiteCreditoSugerido.toLocaleString('pt-BR')}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>Prazo Máximo Recomendado:</span>
                </div>
                <span className="font-semibold text-blue-600">
                  {riskScore.recomendacoes.prazoMaximoSugerido} dias
                </span>
              </div>

              {riskScore.recomendacoes.requererAnaliseCredito && (
                <Alert variant="default" className="mt-3">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Análise de Crédito Recomendada</strong>
                    <p className="text-xs mt-1">
                      Recomenda-se análise detalhada antes de aprovar novas vendas
                    </p>
                  </AlertDescription>
                </Alert>
              )}

              {riskScore.recomendacoes.requererGarantias && (
                <Alert variant="destructive" className="mt-3">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Garantias Necessárias</strong>
                    <p className="text-xs mt-1">
                      Exigir garantias ou avalistas para novas operações
                    </p>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </div>

          {/* Tendência */}
          <div className="flex items-center justify-center gap-3 p-3 border rounded-lg bg-card">
            {riskScore.tendencia === 'melhorando' && (
              <>
                <TrendingUp className="h-6 w-6 text-green-600" />
                <div className="text-center">
                  <div className="text-sm font-semibold text-green-600">Perfil Melhorando</div>
                  <div className="text-xs text-muted-foreground">Tendência positiva nos últimos 90 dias</div>
                </div>
              </>
            )}
            {riskScore.tendencia === 'piorando' && (
              <>
                <TrendingDown className="h-6 w-6 text-red-600" />
                <div className="text-center">
                  <div className="text-sm font-semibold text-red-600">Perfil Piorando</div>
                  <div className="text-xs text-muted-foreground">Tendência negativa nos últimos 90 dias</div>
                </div>
              </>
            )}
            {riskScore.tendencia === 'estavel' && (
              <>
                <Minus className="h-6 w-6 text-blue-600" />
                <div className="text-center">
                  <div className="text-sm font-semibold text-blue-600">Perfil Estável</div>
                  <div className="text-xs text-muted-foreground">Sem variações significativas</div>
                </div>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
