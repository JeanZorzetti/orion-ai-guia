'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Brain,
  TrendingDown,
  TrendingUp,
  Handshake,
  Zap,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { useAIRecommendations } from '@/hooks/useAIRecommendations';

export const AIRecommendations: React.FC = () => {
  const { recommendations, loading } = useAIRecommendations();

  const getTipoIcon = (tipo: string) => {
    switch (tipo) {
      case 'economia':
        return <TrendingDown className="h-5 w-5" />;
      case 'investimento':
        return <TrendingUp className="h-5 w-5" />;
      case 'negociacao':
        return <Handshake className="h-5 w-5" />;
      case 'otimizacao':
        return <Zap className="h-5 w-5" />;
      default:
        return <Brain className="h-5 w-5" />;
    }
  };

  const getTipoLabel = (tipo: string) => {
    switch (tipo) {
      case 'economia':
        return 'Economia';
      case 'investimento':
        return 'Investimento';
      case 'negociacao':
        return 'Negociação';
      case 'otimizacao':
        return 'Otimização';
      default:
        return tipo;
    }
  };

  const getPrioridadeVariant = (prioridade: string): 'default' | 'secondary' | 'destructive' => {
    switch (prioridade) {
      case 'alta':
        return 'destructive';
      case 'media':
        return 'default';
      case 'baixa':
        return 'secondary';
      default:
        return 'default';
    }
  };

  const getPrioridadeLabel = (prioridade: string) => {
    switch (prioridade) {
      case 'alta':
        return 'Alta Prioridade';
      case 'media':
        return 'Média Prioridade';
      case 'baixa':
        return 'Baixa Prioridade';
      default:
        return prioridade;
    }
  };

  const getEsforcoLabel = (esforco: string) => {
    switch (esforco) {
      case 'baixo':
        return 'Baixo esforço';
      case 'medio':
        return 'Médio esforço';
      case 'alto':
        return 'Alto esforço';
      default:
        return esforco;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recomendações Inteligentes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[200px]">
            <p className="text-muted-foreground">Gerando recomendações...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-purple-600" />
          Recomendações Inteligentes
          <Sparkles className="h-4 w-4 text-yellow-500" />
        </CardTitle>
        <CardDescription>
          Ações sugeridas pela IA para melhorar seu fluxo de caixa
        </CardDescription>
      </CardHeader>
      <CardContent>
        {recommendations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Brain className="h-12 w-12 text-purple-500 mb-4" />
            <p className="font-medium">Excelente trabalho!</p>
            <p className="text-sm text-muted-foreground mt-1">
              Não há recomendações críticas no momento. Continue mantendo sua saúde financeira.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {recommendations.map((rec) => (
              <Card key={rec.id} className="transition-all hover:shadow-md">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant={getPrioridadeVariant(rec.prioridade)}>
                          {getPrioridadeLabel(rec.prioridade)}
                        </Badge>
                        <Badge variant="outline" className="gap-1">
                          {getTipoIcon(rec.tipo)}
                          {getTipoLabel(rec.tipo)}
                        </Badge>
                      </div>
                      <CardTitle className="text-base">{rec.titulo}</CardTitle>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Impacto Financeiro</p>
                      <p className="text-lg font-bold text-green-600">
                        {rec.impactoFinanceiro > 0 ? '+' : ''}R$ {rec.impactoFinanceiro.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    {rec.descricao}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex gap-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <span className="font-medium">Esforço:</span>
                        <span>{getEsforcoLabel(rec.esforco)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="font-medium">Prazo:</span>
                        <span>{rec.prazo}</span>
                      </div>
                    </div>
                    <Button size="sm" variant="default">
                      {rec.acao}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Resumo de Impacto Total */}
        {recommendations.length > 0 && (
          <div className="mt-6 p-6 bg-gradient-to-r from-purple-500/10 to-blue-500/10 rounded-lg border border-purple-200 dark:border-purple-800">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">
                  Potencial de Melhoria Total
                </p>
                <p className="text-xs text-muted-foreground">
                  Implementando todas as {recommendations.length} recomendações
                </p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-green-600">
                  +R$ {recommendations.reduce((sum, r) => sum + r.impactoFinanceiro, 0).toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  por ano
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
