'use client';

import React, { useState } from 'react';
import { useExecutiveDashboard } from '@/hooks/useExecutiveDashboard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  RefreshCw,
  Target,
  AlertTriangle,
  Package,
  Download,
  Bookmark,
  ChevronRight,
  Info,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart as RechartsLineChart,
  BarChart as RechartsBarChart,
  PieChart as RechartsPieChart,
  AreaChart as RechartsAreaChart,
  Line,
  Bar,
  Pie,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
} from 'recharts';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ExecutiveDashboardKPI, ExecutiveDashboardChart } from '@/types/report';

export const ExecutiveDashboard: React.FC = () => {
  const {
    data,
    filter,
    setTipoComparacao,
    setPeriodoAtual,
    loading,
    error,
    refresh,
    bookmarks,
    saveBookmark,
    toggleFavoriteBookmark,
  } = useExecutiveDashboard();

  const [selectedKPI, setSelectedKPI] = useState<string | null>(null);

  console.log('🔍 [ExecutiveDashboard] Estado atual:', { loading, error, hasData: !!data });
  console.log('📦 [ExecutiveDashboard] Dados recebidos:', data);

  // Estado de loading
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Carregando dashboard executivo...</p>
        </div>
      </div>
    );
  }

  // Estado de erro
  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardHeader>
          <CardTitle className="text-red-700">Erro ao Carregar Dashboard</CardTitle>
          <CardDescription className="text-red-600">{error}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={refresh} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Tentar Novamente
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Verificar se dados existem
  if (!data || !data.kpis || !data.graficos) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Sem Dados Disponíveis</CardTitle>
          <CardDescription>Não há dados para exibir no momento.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={refresh} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Recarregar
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Renderizar ícone de tendência
  const renderTrendIcon = (tendencia: 'up' | 'down' | 'stable') => {
    if (tendencia === 'up') return <TrendingUp className="h-4 w-4 text-green-600" />;
    if (tendencia === 'down') return <TrendingDown className="h-4 w-4 text-red-600" />;
    return <Minus className="h-4 w-4 text-gray-400" />;
  };

  // Renderizar card de KPI
  const renderKPICard = (kpi: ExecutiveDashboardKPI) => {
    const isSelected = selectedKPI === kpi.id;
    const variacaoColor = kpi.variacao > 0 ? 'text-green-600' : kpi.variacao < 0 ? 'text-red-600' : 'text-gray-600';

    return (
      <Card
        key={kpi.id}
        className={`cursor-pointer transition-all hover:shadow-md ${isSelected ? 'ring-2 ring-primary' : ''}`}
        onClick={() => setSelectedKPI(isSelected ? null : kpi.id)}
      >
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium text-gray-600">{kpi.titulo}</CardTitle>
            {renderTrendIcon(kpi.tendencia)}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="text-2xl font-bold" style={{ color: kpi.cor }}>
              {kpi.valorFormatado}
            </div>

            <div className="flex items-center gap-2">
              <span className={`text-sm font-medium ${variacaoColor}`}>
                {kpi.variacao > 0 ? '+' : ''}
                {kpi.variacao.toFixed(1)}%
              </span>
              <span className="text-xs text-gray-500">vs período anterior</span>
            </div>

            {kpi.meta && kpi.percentualMeta && (
              <div className="mt-3 space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500">Meta</span>
                  <span className="font-medium">{kpi.percentualMeta.toFixed(1)}%</span>
                </div>
                <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${Math.min(kpi.percentualMeta, 100)}%`,
                      backgroundColor: kpi.cor,
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  // Renderizar gráfico
  const renderChart = (chart: ExecutiveDashboardChart) => {
    console.log('🎨 [renderChart] Renderizando gráfico:', chart.id, chart.tipo);

    // Validar dados antes de renderizar
    if (!chart || !chart.dados || !chart.dados.labels || !chart.dados.datasets) {
      console.error('❌ [renderChart] Dados do gráfico inválidos:', chart);
      return null;
    }

    const chartData = chart.dados.labels.map((label, index) => {
      const dataPoint: Record<string, string | number> = { name: label };
      chart.dados.datasets.forEach(dataset => {
        dataPoint[dataset.label] = dataset.data[index];
      });
      return dataPoint;
    });

    const colors = chart.dados.datasets[0].backgroundColor;
    const colorArray = Array.isArray(colors) ? colors : [colors || '#3b82f6'];

    return (
      <Card key={chart.id} className="col-span-full lg:col-span-1">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">{chart.titulo}</CardTitle>
              {chart.config?.enableDrillDown && (
                <CardDescription className="flex items-center gap-1 mt-1">
                  <Info className="h-3 w-3" />
                  Clique para ver detalhes
                </CardDescription>
              )}
            </div>
            {chart.config?.enableDrillDown && (
              <Button variant="ghost" size="icon">
                <ChevronRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            {chart.tipo === 'linha' || chart.tipo === 'linhaMultipla' ? (
              <RechartsLineChart data={chartData}>
                {chart.config?.showGrid && <CartesianGrid strokeDasharray="3 3" />}
                <XAxis dataKey="name" />
                <YAxis />
                {chart.config?.showTooltip && <Tooltip />}
                {chart.config?.showLegend && <Legend />}
                {chart.dados.datasets.map((dataset, idx) => (
                  <Line
                    key={idx}
                    type="monotone"
                    dataKey={dataset.label}
                    stroke={dataset.borderColor || colorArray[idx] || '#3b82f6'}
                    strokeWidth={2}
                    dot={{ r: 4 }}
                  />
                ))}
              </RechartsLineChart>
            ) : chart.tipo === 'barra' || chart.tipo === 'barraEmpilhada' ? (
              <RechartsBarChart data={chartData}>
                {chart.config?.showGrid && <CartesianGrid strokeDasharray="3 3" />}
                <XAxis dataKey="name" />
                <YAxis />
                {chart.config?.showTooltip && <Tooltip />}
                {chart.config?.showLegend && <Legend />}
                {chart.dados.datasets.map((dataset, idx) => (
                  <Bar
                    key={idx}
                    dataKey={dataset.label}
                    fill={Array.isArray(dataset.backgroundColor) ? undefined : dataset.backgroundColor || colorArray[idx]}
                  >
                    {Array.isArray(dataset.backgroundColor) &&
                      chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={dataset.backgroundColor?.[index] || colorArray[index % colorArray.length]} />
                      ))}
                  </Bar>
                ))}
              </RechartsBarChart>
            ) : chart.tipo === 'area' ? (
              <RechartsAreaChart data={chartData}>
                {chart.config?.showGrid && <CartesianGrid strokeDasharray="3 3" />}
                <XAxis dataKey="name" />
                <YAxis />
                {chart.config?.showTooltip && <Tooltip />}
                {chart.config?.showLegend && <Legend />}
                {chart.dados.datasets.map((dataset, idx) => (
                  <Area
                    key={idx}
                    type="monotone"
                    dataKey={dataset.label}
                    stroke={dataset.borderColor || colorArray[idx] || '#3b82f6'}
                    fill={dataset.backgroundColor as string || colorArray[idx] || '#3b82f6'}
                  />
                ))}
              </RechartsAreaChart>
            ) : chart.tipo === 'pizza' ? (
              <RechartsPieChart>
                {chart.config?.showTooltip && <Tooltip />}
                {chart.config?.showLegend && <Legend />}
                <Pie
                  data={chartData}
                  dataKey={chart.dados.datasets[0].label}
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={colorArray[index % colorArray.length]} />
                  ))}
                </Pie>
              </RechartsPieChart>
            ) : null}
          </ResponsiveContainer>
        </CardContent>
      </Card>
    );
  };

  // Renderizar análise comparativa
  const renderComparison = () => {
    return (
      <Card className="col-span-full">
        <CardHeader>
          <CardTitle>Análise Comparativa</CardTitle>
          <CardDescription>
            {data.comparacao.periodo} vs {data.comparacao.periodoAnterior}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.comparacao.metricas.map((metrica, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  {renderTrendIcon(metrica.tendencia)}
                  <div>
                    <div className="font-medium">{metrica.metrica}</div>
                    <div className="text-sm text-gray-500">
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      }).format(metrica.valorAtual)}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div
                    className={`font-semibold ${
                      metrica.diferencaPercentual > 0
                        ? 'text-green-600'
                        : metrica.diferencaPercentual < 0
                        ? 'text-red-600'
                        : 'text-gray-600'
                    }`}
                  >
                    {metrica.diferencaPercentual > 0 ? '+' : ''}
                    {metrica.diferencaPercentual.toFixed(1)}%
                  </div>
                  <div className="text-sm text-gray-500">
                    {new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                      signDisplay: 'always',
                    }).format(metrica.diferenca)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  };

  // Renderizar insights
  const renderInsights = () => {
    const iconMap: Record<string, React.ElementType> = {
      TrendingUp,
      Target,
      AlertTriangle,
      Package,
      Info,
    };

    return (
      <Card className="col-span-full">
        <CardHeader>
          <CardTitle>Insights e Recomendações</CardTitle>
          <CardDescription>Análises automáticas baseadas nos seus dados</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {data.insights.map((insight, index) => {
              // Garantir que sempre temos um ícone válido
              const Icon = (insight.icone && iconMap[insight.icone]) ? iconMap[insight.icone] : Info;
              const colorClass =
                insight.tipo === 'positivo'
                  ? 'bg-green-50 border-green-200 text-green-800'
                  : insight.tipo === 'negativo'
                  ? 'bg-red-50 border-red-200 text-red-800'
                  : insight.tipo === 'alerta'
                  ? 'bg-yellow-50 border-yellow-200 text-yellow-800'
                  : 'bg-blue-50 border-blue-200 text-blue-800';

              return (
                <div key={index} className={`flex gap-3 p-3 border rounded-lg ${colorClass}`}>
                  <Icon className="h-5 w-5 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold">{insight.titulo}</div>
                    <div className="text-sm mt-1 opacity-90">{insight.descricao}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Filtros e Controles */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Select
            value={filter.tipoComparacao}
            onValueChange={(value) => setTipoComparacao(value as any)}
          >
            <SelectTrigger className="w-[240px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="periodo-anterior">vs Período Anterior</SelectItem>
              <SelectItem value="mesmo-periodo-ano-anterior">vs Mesmo Período Ano Anterior</SelectItem>
              <SelectItem value="personalizado">Comparação Personalizada</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" size="icon" onClick={refresh} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Bookmark className="h-4 w-4 mr-2" />
            Salvar Visualização
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Exportar Dashboard
          </Button>
        </div>
      </div>

      {/* KPIs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {data.kpis.map(renderKPICard)}
      </div>

      {/* Insights */}
      {renderInsights()}

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {data.graficos.map(renderChart)}
      </div>

      {/* Análise Comparativa */}
      {renderComparison()}

      {/* Informações de atualização */}
      <div className="text-center text-sm text-gray-500">
        Última atualização: {format(data.atualizadoEm, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
      </div>
    </div>
  );
};
