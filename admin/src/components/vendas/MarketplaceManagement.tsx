'use client';

import React, { useState } from 'react';
import { useMarketplace } from '@/hooks/useMarketplace';
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
  Store,
  RefreshCw,
  TrendingUp,
  Package,
  ShoppingCart,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Pause,
  Play,
  DollarSign,
  Eye,
  BarChart3,
  Settings,
  Link as LinkIcon,
  Clock,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { MarketplaceType } from '@/types/marketplace';

export const MarketplaceManagement: React.FC = () => {
  const {
    // Integrations
    integrations,
    activeIntegrations,
    toggleIntegration,
    syncIntegration,

    // Listings
    listings,
    activeListings,
    pausedListings,
    errorListings,
    pauseListing,
    activateListing,

    // Orders
    orders,
    pendingOrders,
    processingOrders,
    completedOrders,
    processOrder,

    // Sync
    syncJobs,
    runningJobs,

    // Conflicts
    unresolvedConflicts,
    resolveConflict,

    // Dashboard
    dashboard,
    performance,

    loading,
  } = useMarketplace();

  const [selectedTab, setSelectedTab] = useState('dashboard');

  const getMarketplaceBadgeColor = (marketplace: MarketplaceType) => {
    switch (marketplace) {
      case 'mercado_livre': return 'bg-yellow-100 text-yellow-800';
      case 'shopify': return 'bg-green-100 text-green-800';
      case 'amazon': return 'bg-orange-100 text-orange-800';
      case 'magalu': return 'bg-blue-100 text-blue-800';
      case 'tiktok_shop': return 'bg-pink-100 text-pink-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getMarketplaceName = (marketplace: MarketplaceType) => {
    const names: Record<MarketplaceType, string> = {
      mercado_livre: 'Mercado Livre',
      amazon: 'Amazon',
      shopee: 'Shopee',
      magalu: 'Magalu',
      b2w: 'B2W',
      tiktok_shop: 'TikTok Shop',
      shopify: 'Shopify',
      woocommerce: 'WooCommerce',
      custom: 'Personalizado',
    };
    return names[marketplace] || marketplace;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
      case 'success':
      case 'completed':
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'paused':
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'error':
      case 'failed':
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'processing':
      case 'running':
      case 'shipped':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Dashboard Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Integrações Ativas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Store className="h-4 w-4 text-purple-600" />
              <span className="text-2xl font-bold">{dashboard.overview.active_integrations}</span>
              <span className="text-sm text-gray-500">de {dashboard.overview.total_integrations}</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {dashboard.overview.total_listings} anúncios totais
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Anúncios Ativos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-blue-600" />
              <span className="text-2xl font-bold">{dashboard.overview.active_listings}</span>
              <span className="text-sm text-gray-500">ativos</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {pausedListings.length} pausados • {errorListings.length} com erro
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Pedidos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-4 w-4 text-green-600" />
              <span className="text-2xl font-bold">{dashboard.overview.total_orders}</span>
              <span className="text-sm text-gray-500">total</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {dashboard.stats.orders_today} pedidos hoje
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Receita Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-orange-600" />
              <span className="text-2xl font-bold">
                R$ {(dashboard.overview.total_revenue / 1000).toFixed(1)}k
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              R$ {dashboard.stats.revenue_today.toFixed(2)} hoje
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Alerts */}
      {unresolvedConflicts.length > 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold text-yellow-900">
                  {unresolvedConflicts.length} conflito(s) de sincronização pendente(s)
                </p>
                <p className="text-sm text-yellow-700 mt-1">
                  Existem divergências entre o sistema e os marketplaces que precisam ser resolvidas.
                </p>
              </div>
              <Button size="sm" variant="outline" onClick={() => setSelectedTab('conflicts')}>
                Resolver
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList>
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="integrations">Integrações</TabsTrigger>
          <TabsTrigger value="listings">Anúncios</TabsTrigger>
          <TabsTrigger value="orders">Pedidos</TabsTrigger>
          <TabsTrigger value="sync">Sincronizações</TabsTrigger>
          {unresolvedConflicts.length > 0 && (
            <TabsTrigger value="conflicts">
              Conflitos
              <Badge className="ml-2 bg-red-600">{unresolvedConflicts.length}</Badge>
            </TabsTrigger>
          )}
        </TabsList>

        {/* Dashboard Tab */}
        <TabsContent value="dashboard" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Performance por Marketplace</CardTitle>
              <CardDescription>Comparação de vendas e métricas entre canais</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {performance.map(perf => (
                  <div key={perf.marketplace_integration_id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Store className="h-5 w-5 text-gray-600" />
                        <span className="font-semibold">{getMarketplaceName(perf.marketplace)}</span>
                      </div>
                      <Badge className={getMarketplaceBadgeColor(perf.marketplace)}>
                        {perf.marketplace}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500">Pedidos</p>
                        <p className="font-bold text-lg">{perf.total_orders}</p>
                        <p className="text-xs text-green-600">+{perf.orders_growth.toFixed(1)}%</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Receita</p>
                        <p className="font-bold text-lg">R$ {(perf.total_revenue / 1000).toFixed(1)}k</p>
                        <p className="text-xs text-green-600">+{perf.revenue_growth.toFixed(1)}%</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Ticket Médio</p>
                        <p className="font-bold text-lg">R$ {perf.avg_order_value.toFixed(0)}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Anúncios</p>
                        <p className="font-bold text-lg">{perf.active_listings}</p>
                        <p className="text-xs text-gray-500">{perf.total_listings} total</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Conversão</p>
                        <p className="font-bold text-lg">{perf.conversion_rate.toFixed(1)}%</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Sincronizações Recentes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {dashboard.recent_syncs.map(sync => (
                    <div key={sync.id} className="flex items-center justify-between p-2 border rounded">
                      <div className="flex items-center gap-2">
                        {sync.status === 'running' ? (
                          <RefreshCw className="h-4 w-4 animate-spin text-blue-600" />
                        ) : sync.status === 'completed' ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-600" />
                        )}
                        <div>
                          <p className="text-sm font-medium">{getMarketplaceName(sync.marketplace)}</p>
                          <p className="text-xs text-gray-500">{sync.type}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold">{sync.progress_percentage.toFixed(0)}%</p>
                        <p className="text-xs text-gray-500">
                          {sync.processed_items}/{sync.total_items}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Pedidos Recentes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {dashboard.recent_orders.map(order => (
                    <div key={order.id} className="flex items-center justify-between p-2 border rounded">
                      <div>
                        <p className="text-sm font-medium">{order.external_order_number}</p>
                        <p className="text-xs text-gray-500">{order.marketplace_name}</p>
                        <p className="text-xs text-gray-500">{order.customer.name}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold">R$ {order.total.toFixed(2)}</p>
                        <Badge className={getStatusColor(order.status)} variant="outline">
                          {order.status === 'pending' ? 'Pendente' :
                           order.status === 'processing' ? 'Processando' :
                           order.status === 'shipped' ? 'Enviado' :
                           order.status === 'delivered' ? 'Entregue' : 'Cancelado'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Integrations Tab */}
        <TabsContent value="integrations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Integrações de Marketplace</CardTitle>
              <CardDescription>Gerencie suas integrações com canais de venda</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {integrations.map(integration => (
                  <Card key={integration.id} className={!integration.is_active ? 'opacity-60' : ''}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-3 flex-1">
                          <div className="flex items-center gap-3">
                            <Store className="h-6 w-6 text-gray-600" />
                            <div>
                              <p className="font-semibold text-lg">{integration.name}</p>
                              <Badge className={getMarketplaceBadgeColor(integration.marketplace)}>
                                {getMarketplaceName(integration.marketplace)}
                              </Badge>
                            </div>
                            {integration.is_active && (
                              <Badge className="bg-green-100 text-green-800">Ativo</Badge>
                            )}
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <p className="text-gray-500">Anúncios</p>
                              <p className="font-semibold">{integration.active_listings}/{integration.total_listings}</p>
                            </div>
                            <div>
                              <p className="text-gray-500">Pedidos</p>
                              <p className="font-semibold">{integration.total_orders}</p>
                            </div>
                            <div>
                              <p className="text-gray-500">Receita</p>
                              <p className="font-semibold">R$ {(integration.total_revenue / 1000).toFixed(1)}k</p>
                            </div>
                            <div>
                              <p className="text-gray-500">Última Sync</p>
                              <p className="text-xs">
                                {integration.last_sync_at
                                  ? format(integration.last_sync_at, 'dd/MM HH:mm', { locale: ptBR })
                                  : 'Nunca'}
                              </p>
                            </div>
                          </div>

                          {integration.last_sync_summary && (
                            <div className="flex gap-4 text-xs text-gray-600">
                              <span>{integration.last_sync_summary.products_synced} produtos</span>
                              <span>{integration.last_sync_summary.orders_imported} pedidos</span>
                              <span>{integration.last_sync_summary.stock_updated} estoques</span>
                              {integration.last_sync_summary.errors > 0 && (
                                <span className="text-red-600">
                                  {integration.last_sync_summary.errors} erros
                                </span>
                              )}
                            </div>
                          )}
                        </div>

                        <div className="flex flex-col gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => syncIntegration(integration.id)}
                            disabled={!integration.is_active}
                          >
                            <RefreshCw className="h-4 w-4 mr-1" />
                            Sincronizar
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => toggleIntegration(integration.id)}
                          >
                            {integration.is_active ? (
                              <>
                                <Pause className="h-4 w-4 mr-1" />
                                Pausar
                              </>
                            ) : (
                              <>
                                <Play className="h-4 w-4 mr-1" />
                                Ativar
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Listings Tab */}
        <TabsContent value="listings" className="space-y-4">
          <div className="flex gap-4 mb-4">
            <Card className="flex-1">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Ativos</p>
                    <p className="text-2xl font-bold">{activeListings.length}</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
            <Card className="flex-1">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Pausados</p>
                    <p className="text-2xl font-bold">{pausedListings.length}</p>
                  </div>
                  <Pause className="h-8 w-8 text-yellow-600" />
                </div>
              </CardContent>
            </Card>
            <Card className="flex-1">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Com Erro</p>
                    <p className="text-2xl font-bold">{errorListings.length}</p>
                  </div>
                  <XCircle className="h-8 w-8 text-red-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Anúncios</CardTitle>
              <CardDescription>Gerencie seus produtos em todos os marketplaces</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produto</TableHead>
                    <TableHead>Marketplace</TableHead>
                    <TableHead>Preço</TableHead>
                    <TableHead>Estoque</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Vendas</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {listings.slice(0, 20).map(listing => (
                    <TableRow key={listing.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium text-sm">{listing.product_name}</p>
                          <p className="text-xs text-gray-500">{listing.product_sku}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getMarketplaceBadgeColor(listing.marketplace)}>
                          {getMarketplaceName(listing.marketplace)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <p className="font-medium">R$ {listing.price.toFixed(2)}</p>
                        {listing.original_price && (
                          <p className="text-xs text-gray-500 line-through">
                            R$ {listing.original_price.toFixed(2)}
                          </p>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className={listing.stock_quantity < 10 ? 'text-red-600 font-semibold' : ''}>
                          {listing.stock_quantity} un
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(listing.status)} variant="outline">
                          {listing.status === 'active' ? 'Ativo' :
                           listing.status === 'paused' ? 'Pausado' :
                           listing.status === 'out_of_stock' ? 'Sem Estoque' : 'Erro'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <p className="font-medium">{listing.sales} vendas</p>
                          <p className="text-xs text-gray-500">{listing.views} visualizações</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {listing.status === 'active' ? (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => pauseListing(listing.id)}
                            >
                              <Pause className="h-3 w-3" />
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => activateListing(listing.id)}
                            >
                              <Play className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Orders Tab */}
        <TabsContent value="orders" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Pendentes</p>
                    <p className="text-2xl font-bold">{pendingOrders.length}</p>
                  </div>
                  <Clock className="h-8 w-8 text-yellow-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Em Processamento</p>
                    <p className="text-2xl font-bold">{processingOrders.length}</p>
                  </div>
                  <RefreshCw className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Concluídos</p>
                    <p className="text-2xl font-bold">{completedOrders.length}</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Pedidos Unificados</CardTitle>
              <CardDescription>Todos os pedidos de todos os marketplaces</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Pedido</TableHead>
                    <TableHead>Marketplace</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.slice(0, 20).map(order => (
                    <TableRow key={order.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium text-sm">{order.external_order_number}</p>
                          <p className="text-xs text-gray-500">{order.items.length} item(ns)</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getMarketplaceBadgeColor(order.marketplace)}>
                          {getMarketplaceName(order.marketplace)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="text-sm font-medium">{order.customer.name}</p>
                          <p className="text-xs text-gray-500">{order.customer.email}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        {format(order.order_date, 'dd/MM/yyyy', { locale: ptBR })}
                      </TableCell>
                      <TableCell>
                        <p className="font-bold">R$ {order.total.toFixed(2)}</p>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(order.status)}>
                          {order.status === 'pending' ? 'Pendente' :
                           order.status === 'processing' ? 'Processando' :
                           order.status === 'shipped' ? 'Enviado' :
                           order.status === 'delivered' ? 'Entregue' : 'Cancelado'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {order.status === 'pending' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => processOrder(order.id)}
                          >
                            Processar
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sync Tab */}
        <TabsContent value="sync" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Sincronizações</CardTitle>
              <CardDescription>Logs de sincronização com marketplaces</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {syncJobs.map(job => (
                  <Card key={job.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3 flex-1">
                          {job.status === 'running' ? (
                            <RefreshCw className="h-5 w-5 animate-spin text-blue-600" />
                          ) : job.status === 'completed' ? (
                            <CheckCircle className="h-5 w-5 text-green-600" />
                          ) : (
                            <XCircle className="h-5 w-5 text-red-600" />
                          )}
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-semibold">{getMarketplaceName(job.marketplace)}</p>
                              <Badge variant="outline">{job.type}</Badge>
                              <Badge className={getStatusColor(job.status)}>
                                {job.status === 'running' ? 'Executando' :
                                 job.status === 'completed' ? 'Concluído' : 'Falhou'}
                              </Badge>
                            </div>
                            <div className="flex gap-4 text-sm text-gray-600">
                              <span>{job.result.products_created + job.result.products_updated} produtos</span>
                              <span>{job.result.orders_imported} pedidos</span>
                              <span>{job.result.stock_synced} estoques</span>
                              {job.duration_seconds && (
                                <span>{job.duration_seconds}s duração</span>
                              )}
                            </div>
                            {job.status === 'running' && (
                              <div className="mt-2">
                                <div className="flex items-center justify-between text-xs mb-1">
                                  <span>Progresso</span>
                                  <span>{job.progress_percentage.toFixed(0)}%</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                  <div
                                    className="bg-blue-600 h-2 rounded-full transition-all"
                                    style={{ width: `${job.progress_percentage}%` }}
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="text-right text-xs text-gray-500">
                          {job.started_at && format(job.started_at, 'dd/MM HH:mm', { locale: ptBR })}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Conflicts Tab */}
        <TabsContent value="conflicts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Conflitos de Sincronização</CardTitle>
              <CardDescription>Resolva divergências entre o sistema e os marketplaces</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {unresolvedConflicts.map(conflict => (
                  <Card key={conflict.id} className="border-yellow-200">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <AlertTriangle className="h-5 w-5 text-yellow-600" />
                            <p className="font-semibold">{conflict.product_name}</p>
                            <Badge className={getMarketplaceBadgeColor(conflict.marketplace)}>
                              {getMarketplaceName(conflict.marketplace)}
                            </Badge>
                            <Badge variant="outline" className={
                              conflict.severity === 'critical' ? 'border-red-600 text-red-600' :
                              conflict.severity === 'high' ? 'border-orange-600 text-orange-600' :
                              'border-yellow-600 text-yellow-600'
                            }>
                              {conflict.severity}
                            </Badge>
                          </div>
                          <div className="text-sm space-y-1">
                            <p className="text-gray-600">Campo: <span className="font-medium">{conflict.field_name}</span></p>
                            <p className="text-gray-600">
                              Valor no Sistema: <span className="font-medium">{conflict.system_value}</span>
                            </p>
                            <p className="text-gray-600">
                              Valor no Marketplace: <span className="font-medium">{conflict.marketplace_value}</span>
                            </p>
                            <p className="text-xs text-gray-500 mt-2">
                              Criado em {format(conflict.created_at, 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-col gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => resolveConflict(conflict.id, 'system_wins')}
                          >
                            Usar Sistema
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => resolveConflict(conflict.id, 'marketplace_wins')}
                          >
                            Usar Marketplace
                          </Button>
                        </div>
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
