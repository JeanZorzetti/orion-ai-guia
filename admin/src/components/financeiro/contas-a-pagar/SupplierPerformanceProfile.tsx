'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useSupplierPerformance } from '@/hooks/useSupplierPerformance';
import { TrendingUp, TrendingDown, Minus, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface Props {
  fornecedorId: string;
}

const getScoreColor = (score: number) => {
  if (score >= 85) return 'text-green-600';
  if (score >= 70) return 'text-blue-600';
  if (score >= 55) return 'text-yellow-600';
  if (score >= 40) return 'text-orange-600';
  return 'text-destructive';
};

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

export const SupplierPerformanceProfile: React.FC<Props> = ({ fornecedorId }) => {
  const performance = useSupplierPerformance(fornecedorId);

  if (!fornecedorId) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-muted-foreground">Selecione um fornecedor</p>
        </CardContent>
      </Card>
    );
  }

  if (!performance) {
    return (
      <Card>
        <CardContent className="p-6 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Score Principal */}
      <Card>
        <CardHeader>
          <CardTitle>Performance do Fornecedor</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-sm text-muted-foreground">Score de Performance</p>
              <p className={cn('text-5xl font-bold', getScoreColor(performance.score))}>
                {performance.score}
              </p>
              <Badge variant={getCategoryVariant(performance.categoria)} className="mt-2">
                {performance.categoria.toUpperCase()}
              </Badge>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground mb-2">Tendência</p>
              {performance.tendencia === 'melhorando' && (
                <div className="flex items-center gap-2 text-green-600">
                  <TrendingUp className="h-6 w-6" />
                  <span className="font-semibold">Melhorando</span>
                </div>
              )}
              {performance.tendencia === 'piorando' && (
                <div className="flex items-center gap-2 text-red-600">
                  <TrendingDown className="h-6 w-6" />
                  <span className="font-semibold">Piorando</span>
                </div>
              )}
              {performance.tendencia === 'estavel' && (
                <div className="flex items-center gap-2 text-blue-600">
                  <Minus className="h-6 w-6" />
                  <span className="font-semibold">Estável</span>
                </div>
              )}
            </div>
          </div>

          {/* Fatores */}
          <div className="space-y-3">
            <h4 className="font-semibold text-sm">Fatores Avaliados</h4>

            <div>
              <div className="flex items-center justify-between text-sm mb-1">
                <span>Pontualidade nas Entregas</span>
                <span className="font-semibold">{performance.fatores.pontualidadeEntrega.toFixed(0)}%</span>
              </div>
              <Progress value={performance.fatores.pontualidadeEntrega} />
            </div>

            <div>
              <div className="flex items-center justify-between text-sm mb-1">
                <span>Qualidade dos Produtos</span>
                <span className="font-semibold">{performance.fatores.qualidadeProdutos.toFixed(1)}/10</span>
              </div>
              <Progress value={performance.fatores.qualidadeProdutos * 10} />
            </div>

            <div>
              <div className="flex items-center justify-between text-sm mb-1">
                <span>Preços Competitivos</span>
                <span className="font-semibold">{performance.fatores.precosCompetitivos.toFixed(1)}/10</span>
              </div>
              <Progress value={performance.fatores.precosCompetitivos * 10} />
            </div>

            <div>
              <div className="flex items-center justify-between text-sm mb-1">
                <span>Atendimento</span>
                <span className="font-semibold">{performance.fatores.atendimento.toFixed(1)}/10</span>
              </div>
              <Progress value={performance.fatores.atendimento * 10} />
            </div>

            <div>
              <div className="flex items-center justify-between text-sm mb-1">
                <span>Flexibilidade de Negociação</span>
                <span className="font-semibold">{performance.fatores.flexibilidadeNegociacao.toFixed(1)}/10</span>
              </div>
              <Progress value={performance.fatores.flexibilidadeNegociacao * 10} />
            </div>

            <div>
              <div className="flex items-center justify-between text-sm mb-1">
                <span>Conformidade Documental</span>
                <span className="font-semibold">{performance.fatores.conformidadeDocumental.toFixed(0)}%</span>
              </div>
              <Progress value={performance.fatores.conformidadeDocumental} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Métricas */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Métricas de Relacionamento</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Total Comprado</p>
              <p className="font-semibold text-lg">
                R$ {performance.metricas.valorTotalComprado.toLocaleString('pt-BR')}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Ticket Médio</p>
              <p className="font-semibold text-lg">
                R$ {performance.metricas.ticketMedio.toLocaleString('pt-BR')}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Total de Compras</p>
              <p className="font-semibold text-lg">{performance.metricas.totalCompras}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Frequência</p>
              <p className="font-semibold text-lg">
                {performance.metricas.frequenciaCompras.toFixed(1)} compras/mês
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Prazo Médio Pagamento</p>
              <p className="font-semibold text-lg">{performance.metricas.prazoMedioPagamento} dias</p>
            </div>
            <div>
              <p className="text-muted-foreground">Descontos Obtidos</p>
              <p className="font-semibold text-lg text-green-600">
                R$ {performance.metricas.descontosObtidos.toLocaleString('pt-BR')}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Histórico */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Evolução do Score</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={performance.historico}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="mes" className="text-xs" />
              <YAxis domain={[0, 100]} className="text-xs" />
              <Tooltip />
              <Line type="monotone" dataKey="score" stroke="#3b82f6" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Recomendações */}
      {performance.recomendacoes.length > 0 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Recomendações</AlertTitle>
          <AlertDescription>
            <ul className="list-disc list-inside space-y-1 text-sm mt-2">
              {performance.recomendacoes.map((rec, idx) => (
                <li key={idx}>{rec}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};
