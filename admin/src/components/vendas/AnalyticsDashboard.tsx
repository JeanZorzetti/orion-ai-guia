'use client';

import React, { useState } from 'react';
import { useAnalytics } from '@/hooks/useAnalytics';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  Users,
  Package,
  AlertTriangle,
  CheckCircle,
  Target,
  BarChart3,
  PieChart,
  Activity,
  Zap,
  Award,
  Clock,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const AnalyticsDashboard: React.FC = () => {
  const {
    executiveDashboard,
    salesMetrics,
    inventoryMetrics,
    customerMetrics,
    kpis,
    alerts,
    criticalAlerts,
    recommendations,
    loading,
  } = useAnalytics();

  const [selectedTab, setSelectedTab] = useState('overview');

  const getTrendIcon = (trend: string) => {
    return trend === 'up' ? (
      <TrendingUp className="h-4 w-4 text-green-600" />
    ) : trend === 'down' ? (
      <TrendingDown className="h-4 w-4 text-red-600" />
    ) : (
      <Activity className="h-4 w-4 text-gray-600" />
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'bg-green-100 text-green-800';
      case 'good': return 'bg-blue-100 text-blue-800';
      case 'warning': return 'bg-yellow-100 text-yellow-800';
      case 'critical': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'critical': return <AlertTriangle className="h-5 w-5 text-red-600" />;
      case 'warning': return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      default: return <CheckCircle className="h-5 w-5 text-blue-600" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* KPIs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {kpis.map(kpi => (
          <Card key={kpi.kpi_id}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600">{kpi.kpi_name}</span>
                <Badge className={getStatusColor(kpi.status)} variant="outline">
                  {kpi.status === 'excellent' ? 'Excelente' :
                   kpi.status === 'good' ? 'Bom' :
                   kpi.status === 'warning' ? 'Atenção' : 'Crítico'}
                </Badge>
              </div>
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-3xl font-bold">
                    {kpi.kpi_name.includes('Taxa') || kpi.kpi_name.includes('Margem')
                      ? `${kpi.current_value.toFixed(1)}%`
                      : kpi.kpi_name.includes('Receita')
                      ? `R$ ${(kpi.current_value / 1000).toFixed(0)}k`
                      : kpi.current_value.toFixed(1)}
                  </p>
                  {kpi.change_percentage !== undefined && (
                    <div className="flex items-center gap-1 mt-1">
                      {getTrendIcon(kpi.trend)}
                      <span className={`text-sm font-medium ${kpi.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                        {kpi.change_percentage > 0 ? '+' : ''}{kpi.change_percentage.toFixed(1)}%
                      </span>
                      <span className="text-xs text-gray-500">vs anterior</span>
                    </div>
                  )}
                </div>
                {kpi.target_achievement && (
                  <div className="text-right">
                    <div className="text-2xl font-semibold text-gray-700">
                      {kpi.target_achievement.toFixed(0)}%
                    </div>
                    <div className="text-xs text-gray-500">da meta</div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Critical Alerts */}
      {criticalAlerts.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-6 w-6 text-red-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="font-semibold text-red-900 mb-2">
                  {criticalAlerts.length} Alerta(s) Crítico(s) Requer(em) Atenção Imediata
                </p>
                <div className="space-y-2">
                  {criticalAlerts.map(alert => (
                    <div key={alert.id} className="flex items-center justify-between bg-white rounded p-2">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{alert.title}</p>
                        <p className="text-xs text-gray-600">{alert.message}</p>
                      </div>
                      {alert.action_label && (
                        <Button size="sm" variant="outline">
                          {alert.action_label}
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="sales">Vendas</TabsTrigger>
          <TabsTrigger value="inventory">Estoque</TabsTrigger>
          <TabsTrigger value="customers">Clientes</TabsTrigger>
          <TabsTrigger value="recommendations">Recomendações</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Sales Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Resumo de Vendas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600">Receita Total</p>
                  <p className="text-2xl font-bold">R$ {(salesMetrics.total_sales / 1000).toFixed(1)}k</p>
                  <div className="flex items-center gap-1 mt-1">
                    {getTrendIcon(salesMetrics.vs_previous_period.trend)}
                    <span className="text-sm text-green-600 font-medium">
                      +{salesMetrics.vs_previous_period.total_sales_change.toFixed(1)}%
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-600">Pedidos</p>
                    <p className="text-lg font-semibold">{salesMetrics.sales_count}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Ticket Médio</p>
                    <p className="text-lg font-semibold">R$ {salesMetrics.avg_ticket.toFixed(0)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Inventory Health */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Saúde do Estoque
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Score de Saúde</p>
                    <p className="text-2xl font-bold">{inventoryMetrics.health_score}/100</p>
                  </div>
                  <Badge className={getStatusColor(inventoryMetrics.health_status)}>
                    {inventoryMetrics.health_status === 'excellent' ? 'Excelente' :
                     inventoryMetrics.health_status === 'good' ? 'Bom' : 'Regular'}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Giro</p>
                    <p className="font-semibold">{inventoryMetrics.inventory_turnover.toFixed(1)}x</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Dias Estoque</p>
                    <p className="font-semibold">{inventoryMetrics.days_of_inventory} dias</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Sem Estoque</p>
                    <p className="font-semibold text-red-600">{inventoryMetrics.out_of_stock_items}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Excesso</p>
                    <p className="font-semibold text-orange-600">{inventoryMetrics.overstock_items}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sales by Channel */}
          <Card>
            <CardHeader>
              <CardTitle>Performance por Canal</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {salesMetrics.by_channel.map(channel => (
                  <div key={channel.channel} className="flex items-center justify-between p-3 border rounded">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium">{channel.channel_name}</span>
                        <span className="text-sm text-gray-600">{channel.percentage.toFixed(0)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${channel.percentage}%` }}
                        />
                      </div>
                    </div>
                    <div className="ml-4 text-right">
                      <p className="font-bold">R$ {(channel.sales / 1000).toFixed(1)}k</p>
                      <div className="flex items-center gap-1">
                        {getTrendIcon(channel.trend)}
                        <span className={`text-xs ${channel.growth > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {channel.growth > 0 ? '+' : ''}{channel.growth.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Alerts */}
          <Card>
            <CardHeader>
              <CardTitle>Alertas e Notificações</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {alerts.map(alert => (
                  <div
                    key={alert.id}
                    className={`flex items-start gap-3 p-3 rounded border ${
                      alert.type === 'critical' ? 'border-red-200 bg-red-50' :
                      alert.type === 'warning' ? 'border-yellow-200 bg-yellow-50' :
                      'border-blue-200 bg-blue-50'
                    }`}
                  >
                    {getAlertIcon(alert.type)}
                    <div className="flex-1">
                      <p className="font-medium text-sm">{alert.title}</p>
                      <p className="text-xs text-gray-600 mt-1">{alert.message}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {format(alert.created_at, 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                      </p>
                    </div>
                    {alert.action_label && (
                      <Button size="sm" variant="outline">
                        {alert.action_label}
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sales Tab */}
        <TabsContent value="sales" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Funil de Vendas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-2 border rounded">
                    <span className="text-sm">Leads</span>
                    <span className="font-bold">{salesMetrics.funnel.leads}</span>
                  </div>
                  <div className="flex items-center justify-between p-2 border rounded">
                    <span className="text-sm">Oportunidades</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">
                        {salesMetrics.funnel.lead_to_opportunity.toFixed(0)}%
                      </span>
                      <span className="font-bold">{salesMetrics.funnel.opportunities}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-2 border rounded">
                    <span className="text-sm">Propostas</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">
                        {salesMetrics.funnel.opportunity_to_quote.toFixed(0)}%
                      </span>
                      <span className="font-bold">{salesMetrics.funnel.quotes}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-2 border rounded bg-green-50">
                    <span className="text-sm font-medium">Ganhas</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-green-600">
                        {salesMetrics.funnel.quote_to_won.toFixed(0)}%
                      </span>
                      <span className="font-bold text-green-700">{salesMetrics.funnel.won}</span>
                    </div>
                  </div>
                  <div className="pt-2 border-t">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Taxa de Conversão</span>
                      <span className="font-bold">{salesMetrics.funnel.conversion_rate.toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between text-sm mt-1">
                      <span className="text-gray-600">Ciclo Médio</span>
                      <span className="font-bold">{salesMetrics.funnel.avg_sales_cycle_days} dias</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Meta do Período</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm text-gray-600">Progresso</span>
                      <span className="font-bold">{salesMetrics.goals.revenue_achievement_percentage.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className={`h-3 rounded-full ${
                          salesMetrics.goals.revenue_achievement_percentage >= 90 ? 'bg-green-600' :
                          salesMetrics.goals.revenue_achievement_percentage >= 70 ? 'bg-blue-600' :
                          'bg-yellow-600'
                        }`}
                        style={{ width: `${Math.min(salesMetrics.goals.revenue_achievement_percentage, 100)}%` }}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Meta</p>
                      <p className="font-bold">R$ {(salesMetrics.goals.revenue_goal / 1000).toFixed(0)}k</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Realizado</p>
                      <p className="font-bold">R$ {(salesMetrics.goals.revenue_actual / 1000).toFixed(0)}k</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Faltam</p>
                      <p className="font-bold">R$ {(salesMetrics.goals.revenue_remaining / 1000).toFixed(0)}k</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Dias Restantes</p>
                      <p className="font-bold">{salesMetrics.goals.days_remaining}</p>
                    </div>
                  </div>
                  <div className={`p-3 rounded ${salesMetrics.goals.on_track ? 'bg-green-50' : 'bg-yellow-50'}`}>
                    <p className="text-sm font-medium">
                      {salesMetrics.goals.on_track ? '✓ No Ritmo para Atingir Meta' : '⚠ Abaixo do Ritmo Necessário'}
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                      Meta diária: R$ {salesMetrics.goals.daily_target_remaining.toFixed(0)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Top Products */}
          <Card>
            <CardHeader>
              <CardTitle>Top 10 Produtos</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Rank</TableHead>
                    <TableHead>Produto</TableHead>
                    <TableHead>Classe</TableHead>
                    <TableHead>Qtd Vendida</TableHead>
                    <TableHead>Receita</TableHead>
                    <TableHead>Margem</TableHead>
                    <TableHead>Crescimento</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {salesMetrics.top_products.map(product => (
                    <TableRow key={product.product_id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {product.rank <= 3 && <Award className="h-4 w-4 text-yellow-500" />}
                          <span className="font-bold">#{product.rank}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium text-sm">{product.product_name}</p>
                          <p className="text-xs text-gray-500">{product.sku}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={
                          product.abc_class === 'A' ? 'bg-green-100 text-green-800' :
                          product.abc_class === 'B' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }>
                          {product.abc_class}
                        </Badge>
                      </TableCell>
                      <TableCell>{product.quantity_sold}</TableCell>
                      <TableCell>R$ {(product.revenue / 1000).toFixed(1)}k</TableCell>
                      <TableCell>{product.margin_percentage.toFixed(1)}%</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {product.growth > 0 ? (
                            <TrendingUp className="h-3 w-3 text-green-600" />
                          ) : (
                            <TrendingDown className="h-3 w-3 text-red-600" />
                          )}
                          <span className={product.growth > 0 ? 'text-green-600' : 'text-red-600'}>
                            {product.growth > 0 ? '+' : ''}{product.growth.toFixed(1)}%
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Inventory Tab */}
        <TabsContent value="inventory" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Classificação ABC</CardTitle>
              </CardHeader>
              <CardContent>
                {inventoryMetrics.abc_distribution.map(abc => (
                  <div key={abc.class} className="mb-3 last:mb-0">
                    <div className="flex justify-between items-center mb-1">
                      <Badge className={
                        abc.class === 'A' ? 'bg-green-100 text-green-800' :
                        abc.class === 'B' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }>
                        Classe {abc.class}
                      </Badge>
                      <span className="text-sm font-semibold">{abc.products_count} produtos</span>
                    </div>
                    <div className="text-xs text-gray-600">
                      <p>{abc.revenue_contribution.toFixed(0)}% da receita</p>
                      <p>Giro: {abc.avg_turnover.toFixed(1)}x</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Problemas de Estoque</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Sem Estoque</span>
                  <span className="font-bold text-red-600">{inventoryMetrics.out_of_stock_items}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Estoque Baixo</span>
                  <span className="font-bold text-orange-600">{inventoryMetrics.low_stock_items}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Excesso</span>
                  <span className="font-bold text-yellow-600">{inventoryMetrics.overstock_items}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Giro Lento</span>
                  <span className="font-bold">{inventoryMetrics.slow_moving_items}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Obsoletos</span>
                  <span className="font-bold text-gray-600">{inventoryMetrics.obsolete_items}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Validade</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Vence em 30 dias</span>
                  <span className="font-bold text-red-600">{inventoryMetrics.items_expiring_30_days}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Vence em 60 dias</span>
                  <span className="font-bold text-orange-600">{inventoryMetrics.items_expiring_60_days}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Vence em 90 dias</span>
                  <span className="font-bold text-yellow-600">{inventoryMetrics.items_expiring_90_days}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Vencidos</span>
                  <span className="font-bold text-red-600">{inventoryMetrics.items_expired}</span>
                </div>
                <div className="flex justify-between text-sm pt-2 border-t">
                  <span className="text-gray-600">Perda por Validade</span>
                  <span className="font-bold text-red-600">
                    R$ {(inventoryMetrics.expiration_loss_value / 1000).toFixed(1)}k
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Métricas de Estoque</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Valor Total</p>
                  <p className="text-2xl font-bold">R$ {(inventoryMetrics.total_inventory_value / 1000).toFixed(0)}k</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Giro de Estoque</p>
                  <p className="text-2xl font-bold">{inventoryMetrics.inventory_turnover.toFixed(1)}x</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Dias de Estoque</p>
                  <p className="text-2xl font-bold">{inventoryMetrics.days_of_inventory}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Acurácia</p>
                  <p className="text-2xl font-bold">{inventoryMetrics.inventory_accuracy.toFixed(1)}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Customers Tab */}
        <TabsContent value="customers" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Clientes</p>
                    <p className="text-2xl font-bold">{customerMetrics.total_customers}</p>
                  </div>
                  <Users className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Novos</p>
                    <p className="text-2xl font-bold">{customerMetrics.new_customers}</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Retenção</p>
                    <p className="text-2xl font-bold">{customerMetrics.retention_rate.toFixed(1)}%</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">LTV Médio</p>
                    <p className="text-2xl font-bold">R$ {(customerMetrics.avg_customer_lifetime_value / 1000).toFixed(1)}k</p>
                  </div>
                  <DollarSign className="h-8 w-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Top Customers */}
          <Card>
            <CardHeader>
              <CardTitle>Top 10 Clientes</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Segmento</TableHead>
                    <TableHead>Total Gasto</TableHead>
                    <TableHead>Pedidos</TableHead>
                    <TableHead>Ticket Médio</TableHead>
                    <TableHead>LTV</TableHead>
                    <TableHead>Score</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customerMetrics.top_customers.map(customer => (
                    <TableRow key={customer.customer_id}>
                      <TableCell>
                        <p className="font-medium">{customer.customer_name}</p>
                      </TableCell>
                      <TableCell>
                        <Badge className={customer.segment === 'VIP' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}>
                          {customer.segment}
                        </Badge>
                      </TableCell>
                      <TableCell>R$ {(customer.total_spent / 1000).toFixed(1)}k</TableCell>
                      <TableCell>{customer.total_orders}</TableCell>
                      <TableCell>R$ {customer.avg_order_value.toFixed(0)}</TableCell>
                      <TableCell>R$ {(customer.lifetime_value / 1000).toFixed(1)}k</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <span className="font-bold">{customer.customer_score}</span>
                          <div className="w-12 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-green-600 h-2 rounded-full"
                              style={{ width: `${customer.customer_score}%` }}
                            />
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Recommendations Tab */}
        <TabsContent value="recommendations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recomendações Estratégicas</CardTitle>
              <CardDescription>Ações sugeridas com base em análise de dados</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recommendations.map(rec => (
                  <Card key={rec.id} className={`border-2 ${
                    rec.priority === 'high' ? 'border-red-200' :
                    rec.priority === 'medium' ? 'border-yellow-200' :
                    'border-blue-200'
                  }`}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Zap className={`h-5 w-5 ${
                              rec.priority === 'high' ? 'text-red-600' :
                              rec.priority === 'medium' ? 'text-yellow-600' :
                              'text-blue-600'
                            }`} />
                            <h4 className="font-semibold">{rec.title}</h4>
                            <Badge className={
                              rec.priority === 'high' ? 'bg-red-100 text-red-800' :
                              rec.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-blue-100 text-blue-800'
                            }>
                              {rec.priority === 'high' ? 'Alta' :
                               rec.priority === 'medium' ? 'Média' : 'Baixa'}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{rec.description}</p>
                          <div className="flex items-center gap-4 text-sm">
                            <div className="flex items-center gap-1">
                              <Target className="h-4 w-4 text-green-600" />
                              <span className="text-green-600 font-medium">{rec.potential_impact}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4 text-gray-500" />
                              <span className="text-gray-600">
                                Esforço: {rec.estimated_effort === 'low' ? 'Baixo' :
                                          rec.estimated_effort === 'medium' ? 'Médio' : 'Alto'}
                              </span>
                            </div>
                          </div>
                        </div>
                        <Button size="sm">
                          Implementar
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
