'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  useReconciliationSuggestions,
  acceptSuggestion,
  rejectSuggestion,
} from '@/hooks/useBankReconciliation';
import { Brain, Check, X, Info, ArrowRight, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

const getConfidenceColor = (confidence: number) => {
  if (confidence >= 90) return 'text-green-600';
  if (confidence >= 70) return 'text-blue-600';
  if (confidence >= 50) return 'text-orange-600';
  return 'text-red-600';
};

const getConfidenceBadgeVariant = (confidence: number): 'default' | 'secondary' | 'destructive' => {
  if (confidence >= 90) return 'default';
  if (confidence >= 70) return 'secondary';
  return 'destructive';
};

export const ReconciliationSuggestions: React.FC = () => {
  const suggestions = useReconciliationSuggestions();
  const [processing, setProcessing] = useState<string | null>(null);
  const [loading, setLoading] = useState(false); // Não precisa de loading aqui, as sugestões são calculadas instantaneamente

  const handleAccept = async (suggestionId: string) => {
    setProcessing(suggestionId);
    try {
      await acceptSuggestion(suggestionId);
      // TODO: Atualizar lista e mostrar toast de sucesso
    } catch (error) {
      console.error('Erro ao aceitar sugestão:', error);
      // TODO: Mostrar toast de erro
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (suggestionId: string) => {
    setProcessing(suggestionId);
    try {
      await rejectSuggestion(suggestionId);
      // TODO: Atualizar lista e mostrar toast
    } catch (error) {
      console.error('Erro ao rejeitar sugestão:', error);
      // TODO: Mostrar toast de erro
    } finally {
      setProcessing(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sugestões da IA</CardTitle>
            <Brain className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{suggestions.length}</div>
            <p className="text-xs text-muted-foreground mt-1">conciliações sugeridas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alta Confiança</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {suggestions.filter((s) => s.confianca >= 90).length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">90%+ de confiança</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
            <AlertCircle className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              R${' '}
              {suggestions
                .reduce((sum, s) => sum + s.transacao.valor, 0)
                .toLocaleString('pt-BR')}
            </div>
            <p className="text-xs text-muted-foreground mt-1">a conciliar</p>
          </CardContent>
        </Card>
      </div>

      {/* Suggestions List */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-purple-600" />
            <div>
              <CardTitle>Sugestões de Conciliação Automática</CardTitle>
              <CardDescription>
                Nossa IA identificou possíveis correspondências entre transações e faturas
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {suggestions.length === 0 ? (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Nenhuma sugestão de conciliação disponível no momento. Todas as transações e
                faturas pendentes estão muito diferentes para uma correspondência automática.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-4">
              {suggestions.map((suggestion) => (
                <div
                  key={suggestion.id}
                  className={cn(
                    'border rounded-lg p-4 transition-all',
                    suggestion.confianca >= 90 && 'border-green-300 bg-green-50 dark:bg-green-950/20',
                    suggestion.confianca >= 70 &&
                      suggestion.confianca < 90 &&
                      'border-blue-300 bg-blue-50 dark:bg-blue-950/20',
                    suggestion.confianca < 70 &&
                      'border-orange-300 bg-orange-50 dark:bg-orange-950/20'
                  )}
                >
                  {/* Confidence Score */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Brain className="h-5 w-5 text-purple-600" />
                      <span className="font-semibold">Match Sugerido</span>
                    </div>
                    <Badge variant={getConfidenceBadgeVariant(suggestion.confianca)}>
                      {suggestion.confianca}% confiança
                    </Badge>
                  </div>

                  {/* Match Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    {/* Transaction */}
                    <div className="border rounded-lg p-3 bg-white dark:bg-gray-900">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className="text-xs">
                          Transação
                        </Badge>
                      </div>
                      <p className="font-medium text-sm mb-1">{suggestion.transacao.descricao}</p>
                      <div className="space-y-1 text-xs text-muted-foreground">
                        <p>
                          Data: {format(suggestion.transacao.data, 'dd/MM/yyyy', { locale: ptBR })}
                        </p>
                        <p>
                          Banco: {suggestion.transacao.banco} • {suggestion.transacao.contaBancaria}
                        </p>
                        <p className="font-semibold text-red-600 text-sm mt-2">
                          R${' '}
                          {suggestion.transacao.valor.toLocaleString('pt-BR', {
                            minimumFractionDigits: 2,
                          })}
                        </p>
                      </div>
                    </div>

                    {/* Invoice */}
                    <div className="border rounded-lg p-3 bg-white dark:bg-gray-900">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className="text-xs">
                          Fatura
                        </Badge>
                      </div>
                      <p className="font-medium text-sm mb-1">{suggestion.fatura.invoiceNumber}</p>
                      <div className="space-y-1 text-xs text-muted-foreground">
                        <p>Fornecedor: {suggestion.fatura.fornecedor}</p>
                        <p>
                          Vencimento:{' '}
                          {format(suggestion.fatura.dataVencimento, 'dd/MM/yyyy', {
                            locale: ptBR,
                          })}
                        </p>
                        {suggestion.fatura.dataPagamento && (
                          <p>
                            Pagamento:{' '}
                            {format(suggestion.fatura.dataPagamento, 'dd/MM/yyyy', {
                              locale: ptBR,
                            })}
                          </p>
                        )}
                        <p className="font-semibold text-blue-600 text-sm mt-2">
                          R${' '}
                          {suggestion.fatura.valor.toLocaleString('pt-BR', {
                            minimumFractionDigits: 2,
                          })}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Match Indicators */}
                  <div className="mb-4">
                    <p className="text-xs font-semibold mb-2 text-muted-foreground">
                      Fatores de correspondência:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {suggestion.detalhes.matchValor && (
                        <Badge variant="secondary" className="bg-green-100 text-green-700">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Valor coincide
                        </Badge>
                      )}
                      {!suggestion.detalhes.matchValor && suggestion.detalhes.diferencaValor && (
                        <Badge variant="outline">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          Diferença: R${' '}
                          {suggestion.detalhes.diferencaValor.toFixed(2)}
                        </Badge>
                      )}
                      {suggestion.detalhes.matchData && (
                        <Badge variant="secondary" className="bg-green-100 text-green-700">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Data coincide
                        </Badge>
                      )}
                      {!suggestion.detalhes.matchData && suggestion.detalhes.diferencaDias !== undefined && (
                        <Badge variant="outline">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          Diferença: {suggestion.detalhes.diferencaDias} dias
                        </Badge>
                      )}
                      {suggestion.detalhes.matchFornecedor && (
                        <Badge variant="secondary" className="bg-green-100 text-green-700">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Fornecedor identificado
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Confidence Bar */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-muted-foreground">Confiança da IA</span>
                      <span className={cn('font-semibold', getConfidenceColor(suggestion.confianca))}>
                        {suggestion.confianca}%
                      </span>
                    </div>
                    <Progress value={suggestion.confianca} className="h-2" />
                    <p className="text-xs text-muted-foreground mt-2 italic">{suggestion.razao}</p>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleAccept(suggestion.id)}
                      disabled={processing === suggestion.id}
                      className="bg-green-600 hover:bg-green-700 flex-1"
                    >
                      <Check className="h-4 w-4 mr-2" />
                      {processing === suggestion.id ? 'Processando...' : 'Aceitar e Conciliar'}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleReject(suggestion.id)}
                      disabled={processing === suggestion.id}
                      className="flex-1"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Rejeitar
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info Panel */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>Como funciona?</strong> Nossa IA analisa transações bancárias e faturas pendentes,
          comparando valores, datas e informações do fornecedor para sugerir correspondências
          automáticas. Quanto maior a confiança, maior a probabilidade de match correto.
        </AlertDescription>
      </Alert>
    </div>
  );
};
