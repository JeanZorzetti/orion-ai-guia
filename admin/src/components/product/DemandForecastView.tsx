'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Package,
  AlertTriangle,
  CheckCircle,
  BarChart3,
  Calendar,
  Minus,
  TestTube2,
  Loader2,
  RefreshCw,
  ChevronDown
} from 'lucide-react';
import { DemandForecastResponse } from '@/types';
import { productService } from '@/services/product';
import { toast } from 'sonner';

interface DemandForecastViewProps {
  productId: number;
  data: DemandForecastResponse | null;
  loading: boolean;
  error: string | null;
  onDataGenerated?: () => void;
  onRefresh?: () => void;
  period?: '2_weeks' | '4_weeks' | '8_weeks' | '12_weeks';
  onPeriodChange?: (period: '2_weeks' | '4_weeks' | '8_weeks' | '12_weeks') => void;
}

export function DemandForecastView({
  productId,
  data,
  loading,
  error,
  onDataGenerated,
  onRefresh,
  period = '4_weeks',
  onPeriodChange
}: DemandForecastViewProps) {
  const [generatingFakeData, setGeneratingFakeData] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const periodLabels = {
    '2_weeks': '2 Semanas',
    '4_weeks': '4 Semanas',
    '8_weeks': '8 Semanas',
    '12_weeks': '12 Semanas'
  };

  const handleGenerateFakeData = async () => {
    setGeneratingFakeData(true);
    try {
      const result = await productService.generateFakeSales(productId, 12);
      toast.success(result.message);

      // Recarrega a previsão
      if (onDataGenerated) {
        onDataGenerated();
      }
    } catch (err) {
      const error = err as Error;
      toast.error(error.message || 'Erro ao gerar dados de teste');
    } finally {
      setGeneratingFakeData(false);
    }
  };

  const handleRefresh = async () => {
    if (!onRefresh) return;

    setRefreshing(true);
    try {
      await onRefresh();
      toast.success('Previsão atualizada com sucesso!');
    } catch (err) {
      const error = err as Error;
      toast.error(error.message || 'Erro ao atualizar previsão');
    } finally {
      setRefreshing(false);
    }
  };

  if (loading) {
    return <ForecastSkeleton />;
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Erro ao carregar previsão</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!data || !data.success) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-600" />
            Dados insuficientes
          </CardTitle>
          <CardDescription>
            {data?.error || 'Não há dados históricos suficientes para gerar uma previsão de demanda.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center gap-4 py-8 text-center">
            <div className="p-4 bg-blue-50 rounded-full">
              <TestTube2 className="h-8 w-8 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-4">
                Mínimo necessário: <strong>4 períodos</strong> de vendas
              </p>
              <p className="text-xs text-muted-foreground mb-6">
                Para testar a funcionalidade, você pode gerar dados de teste automaticamente.
              </p>
            </div>
            <Button
              onClick={handleGenerateFakeData}
              disabled={generatingFakeData}
              variant="outline"
              className="gap-2"
            >
              {generatingFakeData ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Gerando...
                </>
              ) : (
                <>
                  <TestTube2 className="h-4 w-4" />
                  Gerar 12 Semanas de Dados de Teste
                </>
              )}
            </Button>
            <p className="text-xs text-muted-foreground mt-2">
              Isso criará vendas sintéticas para demonstração
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (data.historical.length === 0) {
    return (
      <Alert>
        <Package className="h-4 w-4" />
        <AlertTitle>Sem histórico de vendas</AlertTitle>
        <AlertDescription>
          Este produto ainda não possui histórico de vendas. A previsão estará disponível após as primeiras vendas.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header com seletor de período e botões */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Previsão de Demanda</h3>
          {data.model_info?.last_updated && (
            <p className="text-sm text-muted-foreground">
              Atualizado em {new Date(data.model_info.last_updated).toLocaleString('pt-BR')}
            </p>
          )}
        </div>
        <div className="flex gap-2 items-center">
          {/* Seletor de Período */}
          {onPeriodChange && (
            <Select value={period} onValueChange={onPeriodChange}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2_weeks">{periodLabels['2_weeks']}</SelectItem>
                <SelectItem value="4_weeks">{periodLabels['4_weeks']}</SelectItem>
                <SelectItem value="8_weeks">{periodLabels['8_weeks']}</SelectItem>
                <SelectItem value="12_weeks">{periodLabels['12_weeks']}</SelectItem>
              </SelectContent>
            </Select>
          )}
          {onRefresh && (
            <Button
              onClick={handleRefresh}
              disabled={refreshing}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Atualizando...' : 'Atualizar Previsão'}
            </Button>
          )}
          <Button
            onClick={handleGenerateFakeData}
            disabled={generatingFakeData}
            variant="outline"
            size="sm"
            className="gap-2"
          >
            {generatingFakeData ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Gerando...
              </>
            ) : (
              <>
                <TestTube2 className="h-4 w-4" />
                Gerar Mais Dados
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Cards de Insights */}
      <InsightsCards insights={data.insights} />

      {/* Gráfico de Previsão */}
      <ForecastChart historical={data.historical} forecast={data.forecast} />

      {/* Alertas */}
      {data.insights?.alerts && data.insights.alerts.length > 0 && (
        <AlertsList alerts={data.insights.alerts} />
      )}

      {/* Informações do Modelo */}
      {data.model_info && <ModelInfo modelInfo={data.model_info} />}
    </div>
  );
}

function ForecastSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-3 w-24 mt-2" />
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-80 w-full" />
        </CardContent>
      </Card>
    </div>
  );
}

interface InsightsCardsProps {
  insights?: {
    trend: string;
    trend_percentage: number;
    seasonality_detected: boolean;
    avg_weekly_demand: number;
    recommended_stock_level: number;
    reorder_point: number;
    stock_coverage_weeks: number;
    total_forecast_4weeks: number;
    alerts: Array<{ type: string; message: string }>;
  } | null;
}

function InsightsCards({ insights }: InsightsCardsProps) {
  if (!insights) return null;

  const getTrendIcon = () => {
    switch (insights.trend) {
      case 'increasing':
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'decreasing':
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      default:
        return <Minus className="h-4 w-4 text-gray-600" />;
    }
  };

  const getTrendLabel = () => {
    switch (insights.trend) {
      case 'increasing':
        return 'Crescente';
      case 'decreasing':
        return 'Decrescente';
      default:
        return 'Estável';
    }
  };

  const getTrendColor = () => {
    switch (insights.trend) {
      case 'increasing':
        return 'text-green-600';
      case 'decreasing':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getSeasonalityBadge = () => {
    if (insights.seasonality_detected) {
      return (
        <Badge className="bg-purple-100 text-purple-800 border-purple-200">
          <CheckCircle className="h-3 w-3 mr-1" />
          Sazonalidade Detectada
        </Badge>
      );
    }
    return (
      <Badge variant="outline">
        Sem Sazonalidade
      </Badge>
    );
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {/* Card 1: Demanda Prevista */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Demanda Prevista (4 sem)</CardTitle>
          <Package className="h-4 w-4 text-blue-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{Math.round(insights.total_forecast_4weeks ?? 0)}</div>
          <p className="text-xs text-muted-foreground mt-1">unidades estimadas</p>
        </CardContent>
      </Card>

      {/* Card 2: Tendência */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Tendência</CardTitle>
          {getTrendIcon()}
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${getTrendColor()}`}>{getTrendLabel()}</div>
          <p className="text-xs text-muted-foreground mt-1">baseado no histórico</p>
        </CardContent>
      </Card>

      {/* Card 3: Estoque Recomendado */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Estoque Recomendado</CardTitle>
          <BarChart3 className="h-4 w-4 text-purple-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{insights.recommended_stock_level ?? 0}</div>
          <p className="text-xs text-muted-foreground mt-1">unidades sugeridas</p>
        </CardContent>
      </Card>

      {/* Card 4: Sazonalidade */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Padrão de Demanda</CardTitle>
          <Calendar className="h-4 w-4 text-orange-600" />
        </CardHeader>
        <CardContent>
          <div className="mt-2">{getSeasonalityBadge()}</div>
          <p className="text-xs text-muted-foreground mt-2">
            {insights.alerts && insights.alerts.length > 0 ? `${insights.alerts.length} alerta(s)` : 'Nenhum alerta'}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

interface ForecastChartProps {
  historical: Array<{ period: string; units_sold: number; date_start: string }>;
  forecast: Array<{ period: string; predicted_units: number; lower_bound: number; upper_bound: number; confidence: number; date_start: string }>;
}

function ForecastChart({ historical, forecast }: ForecastChartProps) {
  // Combina dados históricos e previstos para o gráfico
  const chartData = [
    ...historical.map((h) => ({
      date: new Date(h.date_start).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }),
      Histórico: h.units_sold,
      Previsão: null,
      'Intervalo Inferior': null,
      'Intervalo Superior': null,
    })),
    ...forecast.map((f) => ({
      date: new Date(f.date_start).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }),
      Histórico: null,
      Previsão: f.predicted_units,
      'Intervalo Inferior': f.lower_bound,
      'Intervalo Superior': f.upper_bound,
    })),
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Histórico e Previsão de Demanda
        </CardTitle>
        <CardDescription>
          Vendas passadas (azul) e previsão para as próximas semanas (verde) com intervalo de confiança
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 12 }}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis
              label={{ value: 'Unidades', angle: -90, position: 'insideLeft' }}
              tick={{ fontSize: 12 }}
            />
            <Tooltip />
            <Legend />
            <ReferenceLine x={historical.length - 1} stroke="#888" strokeDasharray="3 3" />
            <Line
              type="monotone"
              dataKey="Histórico"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={{ r: 4 }}
              connectNulls={false}
            />
            <Line
              type="monotone"
              dataKey="Previsão"
              stroke="#10b981"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={{ r: 4 }}
              connectNulls={false}
            />
            <Line
              type="monotone"
              dataKey="Intervalo Inferior"
              stroke="#d1d5db"
              strokeWidth={1}
              dot={false}
              connectNulls={false}
            />
            <Line
              type="monotone"
              dataKey="Intervalo Superior"
              stroke="#d1d5db"
              strokeWidth={1}
              dot={false}
              connectNulls={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

interface AlertsListProps {
  alerts: Array<{ type: string; message: string }>;
}

function AlertsList({ alerts }: AlertsListProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-yellow-600" />
          Alertas e Recomendações
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {alerts.map((alert, idx) => (
            <Alert key={idx} className="border-yellow-200 bg-yellow-50">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-yellow-800">{alert.message}</AlertDescription>
            </Alert>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

interface ModelInfoProps {
  modelInfo: {
    model_used: string;
    data_points: number;
    training_period: string;
    mape: number;
    rmse: number;
    last_updated: string;
  };
}

function ModelInfo({ modelInfo }: ModelInfoProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Badge para MAPE
  const getMapeQuality = (mape: number) => {
    if (mape < 15) return { label: 'Ótimo', variant: 'default' as const };
    if (mape < 25) return { label: 'Bom', variant: 'secondary' as const };
    return { label: 'Regular', variant: 'outline' as const };
  };

  const mapeQuality = modelInfo.mape ? getMapeQuality(modelInfo.mape) : null;

  return (
    <Card>
      <CardHeader
        className="cursor-pointer hover:bg-muted/50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">Informações do Modelo de IA</CardTitle>
          <ChevronDown
            className={`h-4 w-4 transition-transform duration-200 ${
              isExpanded ? 'rotate-180' : ''
            }`}
          />
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <div className="text-muted-foreground">Modelo Usado</div>
              <div className="font-medium capitalize">
                {modelInfo.model_used?.replace(/_/g, ' ') ?? 'N/A'}
              </div>
            </div>
            <div>
              <div className="text-muted-foreground">Pontos de Dados</div>
              <div className="font-medium">{modelInfo.data_points ?? 0}</div>
            </div>
            <div>
              <div className="text-muted-foreground">MAPE (Erro %)</div>
              <div className="flex items-center gap-2">
                <span className="font-medium">
                  {modelInfo.mape ? modelInfo.mape.toFixed(1) : '0.0'}%
                </span>
                {mapeQuality && (
                  <Badge variant={mapeQuality.variant} className="text-xs">
                    {mapeQuality.label}
                  </Badge>
                )}
              </div>
            </div>
            <div>
              <div className="text-muted-foreground">Período de Treino</div>
              <div className="font-medium text-xs">{modelInfo.training_period ?? 'N/A'}</div>
            </div>
          </div>

          {modelInfo.last_updated && (
            <div className="mt-4 pt-4 border-t text-xs text-muted-foreground">
              Última atualização: {new Date(modelInfo.last_updated).toLocaleString('pt-BR')}
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
