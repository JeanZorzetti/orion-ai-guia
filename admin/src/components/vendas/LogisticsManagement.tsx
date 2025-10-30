'use client';

import React, { useState } from 'react';
import { useLogistics } from '@/hooks/useLogistics';
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
  Package,
  PackageCheck,
  Truck,
  MapPin,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  TrendingUp,
  Users,
  Box,
  Route,
  Activity,
  Timer,
  Target,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const LogisticsManagement: React.FC = () => {
  const {
    // Picking
    pendingPicking,
    inProgressPicking,
    completedPicking,
    startPicking,
    completePicking,

    // Packing
    packingStations,
    pendingPacking,
    inProgressPacking,
    completedPacking,
    startPacking,
    completePacking,
    reportPackingProblem,

    // Shipping
    routes,
    pendingDeliveries,
    inRouteDeliveries,
    completedDeliveries,
    vehicles,
    completeDelivery,
    failDelivery,

    // Boxes
    boxTypes,

    // Dashboard
    dashboard,

    loading,
  } = useLogistics();

  const [selectedTab, setSelectedTab] = useState('dashboard');

  const getPickingStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'normal': return 'bg-blue-100 text-blue-800';
      case 'low': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getDeliveryStatusColor = (status: string) => {
    switch (status) {
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'in_route': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Dashboard Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Picking</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-blue-600" />
              <span className="text-2xl font-bold">{dashboard.picking.pending_lists}</span>
              <span className="text-sm text-gray-500">pendentes</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {dashboard.picking.completed_lists} concluídas • {dashboard.picking.accuracy_rate.toFixed(1)}% precisão
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Packing</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <PackageCheck className="h-4 w-4 text-green-600" />
              <span className="text-2xl font-bold">{dashboard.packing.pending_jobs}</span>
              <span className="text-sm text-gray-500">pendentes</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {dashboard.packing.completed_jobs} concluídos • ~{dashboard.packing.avg_packing_time.toFixed(0)} min/pacote
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Entregas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Truck className="h-4 w-4 text-purple-600" />
              <span className="text-2xl font-bold">{dashboard.delivery.in_route_deliveries}</span>
              <span className="text-sm text-gray-500">em rota</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {dashboard.delivery.success_rate.toFixed(1)}% taxa de sucesso • {dashboard.delivery.on_time_rate.toFixed(1)}% no prazo
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Rotas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Route className="h-4 w-4 text-orange-600" />
              <span className="text-2xl font-bold">{dashboard.routes.active_routes}</span>
              <span className="text-sm text-gray-500">ativas</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {dashboard.routes.total_distance_km.toFixed(0)} km • {dashboard.routes.optimization_savings.toFixed(1)}% economia
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList>
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="picking">Picking</TabsTrigger>
          <TabsTrigger value="packing">Packing</TabsTrigger>
          <TabsTrigger value="delivery">Entregas</TabsTrigger>
          <TabsTrigger value="routes">Rotas</TabsTrigger>
        </TabsList>

        {/* Dashboard Tab */}
        <TabsContent value="dashboard" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Performance Operacional</CardTitle>
                <CardDescription>Métricas de produtividade do armazém</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Pedidos por Hora</p>
                    <p className="text-2xl font-bold">{dashboard.productivity.orders_per_hour.toFixed(1)}</p>
                  </div>
                  <Activity className="h-8 w-8 text-blue-500" />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Itens Separados/Hora</p>
                    <p className="text-2xl font-bold">{dashboard.productivity.items_picked_per_hour}</p>
                  </div>
                  <Target className="h-8 w-8 text-green-500" />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Pacotes Embalados/Hora</p>
                    <p className="text-2xl font-bold">{dashboard.productivity.packages_packed_per_hour}</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Estações de Embalagem</CardTitle>
                <CardDescription>Status das estações ativas</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {packingStations.slice(0, 5).map(station => (
                    <div key={station.id} className="flex items-center justify-between p-2 border rounded">
                      <div className="flex items-center gap-2">
                        <Box className="h-4 w-4 text-gray-500" />
                        <div>
                          <p className="font-medium text-sm">{station.name}</p>
                          <p className="text-xs text-gray-500">
                            {station.packer_name || 'Disponível'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold">{station.orders_packed_today}</p>
                        <p className="text-xs text-gray-500">hoje</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Frota Disponível</CardTitle>
              <CardDescription>Veículos e status atual</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {vehicles.map(vehicle => (
                  <div key={vehicle.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Truck className="h-5 w-5 text-gray-600" />
                        <p className="font-semibold">{vehicle.license_plate}</p>
                      </div>
                      <Badge className={
                        vehicle.status === 'available' ? 'bg-green-100 text-green-800' :
                        vehicle.status === 'in_use' ? 'bg-blue-100 text-blue-800' :
                        'bg-red-100 text-red-800'
                      }>
                        {vehicle.status === 'available' ? 'Disponível' :
                         vehicle.status === 'in_use' ? 'Em Uso' : 'Manutenção'}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600">{vehicle.brand} {vehicle.model}</p>
                    <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
                      <div>
                        <p className="text-gray-500">Capacidade</p>
                        <p className="font-medium">{vehicle.max_weight} kg</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Volume</p>
                        <p className="font-medium">{vehicle.max_volume} m³</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Picking Tab */}
        <TabsContent value="picking" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Pending Column */}
            <Card>
              <CardHeader className="bg-yellow-50">
                <CardTitle className="text-base flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Pendentes
                  <Badge variant="outline">{pendingPicking.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 max-h-96 overflow-y-auto mt-4">
                {pendingPicking.map(picking => (
                  <Card key={picking.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm">{picking.picking_number}</span>
                        <Badge className={getPriorityColor(picking.priority)} variant="outline">
                          {picking.priority}
                        </Badge>
                      </div>
                      <div className="text-xs text-gray-600">
                        <p>{picking.items.length} itens</p>
                        <p>Tipo: {picking.type}</p>
                        <p>Tempo estimado: {picking.estimated_time} min</p>
                      </div>
                      <Button
                        size="sm"
                        className="w-full text-xs"
                        onClick={() => startPicking(picking.id, 'user-1')}
                      >
                        Iniciar Separação
                      </Button>
                    </CardContent>
                  </Card>
                ))}
                {pendingPicking.length === 0 && (
                  <p className="text-center text-sm text-gray-400 py-4">Nenhuma separação pendente</p>
                )}
              </CardContent>
            </Card>

            {/* In Progress Column */}
            <Card>
              <CardHeader className="bg-blue-50">
                <CardTitle className="text-base flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  Em Andamento
                  <Badge variant="outline">{inProgressPicking.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 max-h-96 overflow-y-auto mt-4">
                {inProgressPicking.map(picking => (
                  <Card key={picking.id} className="hover:shadow-md transition-shadow border-blue-200">
                    <CardContent className="p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm">{picking.picking_number}</span>
                        <Badge className={getPriorityColor(picking.priority)} variant="outline">
                          {picking.priority}
                        </Badge>
                      </div>
                      <div className="text-xs text-gray-600">
                        <p>Responsável: {picking.assigned_to_name}</p>
                        <p>{picking.items.filter(i => i.picked).length} / {picking.items.length} itens</p>
                        <p>Iniciado: {picking.started_at && format(picking.started_at, 'HH:mm', { locale: ptBR })}</p>
                      </div>
                      <Button
                        size="sm"
                        className="w-full text-xs bg-green-600"
                        onClick={() => completePicking(picking.id)}
                      >
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Concluir
                      </Button>
                    </CardContent>
                  </Card>
                ))}
                {inProgressPicking.length === 0 && (
                  <p className="text-center text-sm text-gray-400 py-4">Nenhuma separação em andamento</p>
                )}
              </CardContent>
            </Card>

            {/* Completed Column */}
            <Card>
              <CardHeader className="bg-green-50">
                <CardTitle className="text-base flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  Concluídas
                  <Badge variant="outline">{completedPicking.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 max-h-96 overflow-y-auto mt-4">
                {completedPicking.slice(0, 10).map(picking => (
                  <Card key={picking.id} className="border-green-200">
                    <CardContent className="p-3 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm">{picking.picking_number}</span>
                        <Timer className="h-3 w-3 text-gray-500" />
                      </div>
                      <div className="text-xs text-gray-600">
                        <p>{picking.items.length} itens</p>
                        <p>Tempo: {picking.actual_time} min</p>
                        <p>Concluído: {picking.completed_at && format(picking.completed_at, 'dd/MM HH:mm', { locale: ptBR })}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Packing Tab */}
        <TabsContent value="packing" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Pending Packing */}
            <Card>
              <CardHeader className="bg-yellow-50">
                <CardTitle className="text-base flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Aguardando
                  <Badge variant="outline">{pendingPacking.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 max-h-96 overflow-y-auto mt-4">
                {pendingPacking.map(job => (
                  <Card key={job.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-3 space-y-2">
                      <div>
                        <span className="font-medium text-sm">{job.sale_number}</span>
                        <p className="text-xs text-gray-600">{job.customer_name}</p>
                      </div>
                      <div className="text-xs text-gray-600">
                        <p>{job.items.length} produtos</p>
                        <p>Peso: {job.weight.toFixed(2)} kg</p>
                      </div>
                      <Button
                        size="sm"
                        className="w-full text-xs"
                        onClick={() => startPacking(job.id, 'station-1', 'user-1')}
                      >
                        Iniciar Embalagem
                      </Button>
                    </CardContent>
                  </Card>
                ))}
                {pendingPacking.length === 0 && (
                  <p className="text-center text-sm text-gray-400 py-4">Nenhuma embalagem pendente</p>
                )}
              </CardContent>
            </Card>

            {/* In Progress Packing */}
            <Card>
              <CardHeader className="bg-blue-50">
                <CardTitle className="text-base flex items-center gap-2">
                  <PackageCheck className="h-4 w-4" />
                  Em Andamento
                  <Badge variant="outline">{inProgressPacking.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 max-h-96 overflow-y-auto mt-4">
                {inProgressPacking.map(job => (
                  <Card key={job.id} className="hover:shadow-md transition-shadow border-blue-200">
                    <CardContent className="p-3 space-y-2">
                      <div>
                        <span className="font-medium text-sm">{job.sale_number}</span>
                        <p className="text-xs text-gray-600">{job.customer_name}</p>
                      </div>
                      <div className="text-xs text-gray-600">
                        <p>Estação: {job.station_id}</p>
                        <p>{job.items.filter(i => i.packed).length} / {job.items.length} itens</p>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          className="flex-1 text-xs bg-green-600"
                          onClick={() => completePacking(job.id, 'box-2')}
                        >
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Concluir
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 text-xs"
                          onClick={() => reportPackingProblem(job.id, 'Produto danificado')}
                        >
                          <AlertCircle className="h-3 w-3 mr-1" />
                          Problema
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {inProgressPacking.length === 0 && (
                  <p className="text-center text-sm text-gray-400 py-4">Nenhuma embalagem em andamento</p>
                )}
              </CardContent>
            </Card>

            {/* Completed Packing */}
            <Card>
              <CardHeader className="bg-green-50">
                <CardTitle className="text-base flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  Concluídas
                  <Badge variant="outline">{completedPacking.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 max-h-96 overflow-y-auto mt-4">
                {completedPacking.slice(0, 10).map(job => (
                  <Card key={job.id} className="border-green-200">
                    <CardContent className="p-3 space-y-1">
                      <span className="font-medium text-sm">{job.sale_number}</span>
                      <div className="text-xs text-gray-600">
                        <p>Caixa: {job.selected_box?.name}</p>
                        <p>Peso: {job.weight.toFixed(2)} kg</p>
                        <p>Concluído: {job.packed_at && format(job.packed_at, 'dd/MM HH:mm', { locale: ptBR })}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Tipos de Caixa Disponíveis</CardTitle>
              <CardDescription>Material de embalagem em estoque</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {boxTypes.map(box => (
                  <div key={box.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-semibold">{box.name}</p>
                      <Badge variant="outline">{box.code}</Badge>
                    </div>
                    <div className="space-y-1 text-xs text-gray-600">
                      <p>Dimensões: {box.internal_dimensions.length}x{box.internal_dimensions.width}x{box.internal_dimensions.height} cm</p>
                      <p>Peso máx: {box.max_weight} kg</p>
                      <p>Custo: R$ {box.cost.toFixed(2)}</p>
                      <p className={box.stock_quantity < box.min_stock ? 'text-red-600 font-semibold' : ''}>
                        Estoque: {box.stock_quantity} un
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Delivery Tab */}
        <TabsContent value="delivery" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Entregas</CardTitle>
              <CardDescription>Gestão de entregas e rastreamento</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Pedido</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Endereço</TableHead>
                    <TableHead>Prioridade</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Rastreio</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[...inRouteDeliveries, ...pendingDeliveries].slice(0, 15).map(delivery => (
                    <TableRow key={delivery.id}>
                      <TableCell className="font-medium">{delivery.sale_number}</TableCell>
                      <TableCell>
                        <div>
                          <p className="text-sm font-medium">{delivery.customer_name}</p>
                          <p className="text-xs text-gray-500">{delivery.customer_phone}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        {delivery.address.city}, {delivery.address.state}
                      </TableCell>
                      <TableCell>
                        <Badge className={getPriorityColor(delivery.priority)} variant="outline">
                          {delivery.priority}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getDeliveryStatusColor(delivery.status)}>
                          {delivery.status === 'pending' ? 'Pendente' :
                           delivery.status === 'in_route' ? 'Em Rota' :
                           delivery.status === 'delivered' ? 'Entregue' : 'Falhou'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs font-mono">
                        {delivery.packages[0]?.tracking_code}
                      </TableCell>
                      <TableCell>
                        {delivery.status === 'in_route' && (
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-xs"
                              onClick={() => completeDelivery(delivery.id, 'signature-url', 'photo-url')}
                            >
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Entregar
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-xs"
                              onClick={() => failDelivery(delivery.id, 'Cliente ausente')}
                            >
                              <XCircle className="h-3 w-3 mr-1" />
                              Falhou
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Routes Tab */}
        <TabsContent value="routes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Rotas de Entrega</CardTitle>
              <CardDescription>Roteirização e otimização de entregas</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {routes.slice(0, 10).map(route => (
                  <Card key={route.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center gap-2">
                            <Route className="h-5 w-5 text-blue-600" />
                            <span className="font-semibold">{route.route_number}</span>
                            <Badge className={
                              route.status === 'completed' ? 'bg-green-100 text-green-800' :
                              route.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                              'bg-yellow-100 text-yellow-800'
                            }>
                              {route.status === 'planned' ? 'Planejada' :
                               route.status === 'in_progress' ? 'Em Andamento' : 'Concluída'}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <p className="text-gray-500">Motorista</p>
                              <p className="font-medium">{route.driver_name}</p>
                            </div>
                            <div>
                              <p className="text-gray-500">Veículo</p>
                              <p className="font-medium">{route.vehicle_plate}</p>
                            </div>
                            <div>
                              <p className="text-gray-500">Paradas</p>
                              <p className="font-medium">{route.total_stops}</p>
                            </div>
                            <div>
                              <p className="text-gray-500">Distância</p>
                              <p className="font-medium">{route.total_distance.toFixed(1)} km</p>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <p className="text-gray-500">Tempo Est.</p>
                              <p className="font-medium">{route.estimated_time} min</p>
                            </div>
                            <div>
                              <p className="text-gray-500">Peso Total</p>
                              <p className="font-medium">{route.total_weight.toFixed(1)} kg</p>
                            </div>
                            {route.status === 'completed' && (
                              <>
                                <div>
                                  <p className="text-gray-500">Taxa de Sucesso</p>
                                  <p className="font-medium text-green-600">{route.success_rate.toFixed(1)}%</p>
                                </div>
                                <div>
                                  <p className="text-gray-500">No Prazo</p>
                                  <p className="font-medium">{route.on_time_deliveries}/{route.total_stops}</p>
                                </div>
                              </>
                            )}
                          </div>
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
