'use client';

import React, { useState } from 'react';
import { useWarehouse } from '@/hooks/useWarehouse';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Warehouse as WarehouseIcon,
  Building2,
  TrendingUp,
  MapPin,
  Package,
  ArrowRightLeft,
  Plus,
  Eye,
  Filter,
  CheckCircle,
  Clock,
  XCircle,
  ThermometerSnowflake,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Warehouse } from '@/types/inventory';

export const WarehouseManagement: React.FC = () => {
  const {
    filteredWarehouses,
    selectedWarehouse,
    transfers,
    stats,
    filters,
    setFilters,
    clearFilters,
    selectWarehouse,
    selectTransfer,
    approveTransfer,
    shipTransfer,
    receiveTransfer,
    cancelTransfer,
    loading,
    refresh,
  } = useWarehouse();

  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showTransferDialog, setShowTransferDialog] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const getTypeColor = (type: Warehouse['type']) => {
    switch (type) {
      case 'principal': return 'bg-blue-100 text-blue-800';
      case 'filial': return 'bg-green-100 text-green-800';
      case 'terceirizado': return 'bg-purple-100 text-purple-800';
      case 'consignado': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTransferStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in_transit': return 'bg-blue-100 text-blue-800';
      case 'approved': return 'bg-purple-100 text-purple-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getAreaTypeLabel = (type: string) => {
    switch (type) {
      case 'racking': return 'Estante';
      case 'floor': return 'Piso';
      case 'cold_room': return 'Câmara Fria';
      case 'quarantine': return 'Quarentena';
      case 'expedition': return 'Expedição';
      default: return type;
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Total de Depósitos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-blue-600" />
              <span className="text-2xl font-bold">{stats.totalWarehouses}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Depósitos Ativos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-2xl font-bold">{stats.activeWarehouses}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Ocupação</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>{stats.occupationPercentage.toFixed(1)}%</span>
                <span className="text-gray-500">
                  {stats.totalOccupation.toFixed(0)} / {stats.totalCapacity.toFixed(0)} m³
                </span>
              </div>
              <Progress value={stats.occupationPercentage} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Transferências Pendentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-yellow-600" />
              <span className="text-2xl font-bold">{stats.pendingTransfers}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Em Trânsito</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <ArrowRightLeft className="h-4 w-4 text-blue-600" />
              <span className="text-2xl font-bold">{stats.inTransitTransfers}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="warehouses" className="space-y-4">
        <TabsList>
          <TabsTrigger value="warehouses">Depósitos</TabsTrigger>
          <TabsTrigger value="transfers">
            Transferências
            {stats.pendingTransfers > 0 && (
              <Badge className="ml-2 bg-yellow-600">{stats.pendingTransfers}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Warehouses Tab */}
        <TabsContent value="warehouses" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Gerenciamento de Depósitos</CardTitle>
                  <CardDescription>
                    Controle de múltiplos depósitos e áreas de armazenamento
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowFilters(!showFilters)}
                  >
                    <Filter className="h-4 w-4 mr-2" />
                    Filtros
                  </Button>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Novo Depósito
                  </Button>
                </div>
              </div>

              {/* Filters */}
              {showFilters && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 pt-4 border-t">
                  <div>
                    <Label>Buscar</Label>
                    <Input
                      placeholder="Nome, código, cidade..."
                      value={filters.search || ''}
                      onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Tipo</Label>
                    <Select
                      value={filters.type?.[0] || 'all'}
                      onValueChange={(value) =>
                        setFilters({ ...filters, type: value === 'all' ? undefined : [value as any] })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        <SelectItem value="principal">Principal</SelectItem>
                        <SelectItem value="filial">Filial</SelectItem>
                        <SelectItem value="terceirizado">Terceirizado</SelectItem>
                        <SelectItem value="consignado">Consignado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-end">
                    <Button variant="outline" onClick={clearFilters} className="w-full">
                      Limpar Filtros
                    </Button>
                  </div>
                </div>
              )}
            </CardHeader>

            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredWarehouses.map((warehouse) => {
                  const occupationPercentage = warehouse.total_capacity
                    ? ((warehouse.current_occupation || 0) / warehouse.total_capacity) * 100
                    : 0;

                  return (
                    <Card key={warehouse.id} className="hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            <WarehouseIcon className="h-5 w-5 text-blue-600" />
                            <div>
                              <CardTitle className="text-base">{warehouse.name}</CardTitle>
                              <p className="text-xs text-gray-500">{warehouse.code}</p>
                            </div>
                          </div>
                          {warehouse.is_main && (
                            <Badge className="bg-blue-100 text-blue-800">Principal</Badge>
                          )}
                        </div>
                      </CardHeader>

                      <CardContent className="space-y-3">
                        <div>
                          <Badge className={getTypeColor(warehouse.type)}>
                            {warehouse.type === 'principal' ? 'Principal' :
                             warehouse.type === 'filial' ? 'Filial' :
                             warehouse.type === 'terceirizado' ? 'Terceirizado' : 'Consignado'}
                          </Badge>
                        </div>

                        <div className="flex items-start gap-2 text-sm">
                          <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                          <div>
                            <p>{warehouse.address.street}, {warehouse.address.number}</p>
                            <p className="text-gray-500">
                              {warehouse.address.city} - {warehouse.address.state}
                            </p>
                          </div>
                        </div>

                        {warehouse.manager_name && (
                          <div className="text-sm">
                            <p className="text-gray-500">Responsável</p>
                            <p className="font-medium">{warehouse.manager_name}</p>
                          </div>
                        )}

                        <div>
                          <div className="flex items-center justify-between text-sm mb-1">
                            <span className="text-gray-500">Ocupação</span>
                            <span className="font-medium">{occupationPercentage.toFixed(1)}%</span>
                          </div>
                          <Progress value={occupationPercentage} className="h-2" />
                          <p className="text-xs text-gray-500 mt-1">
                            {warehouse.current_occupation?.toFixed(0) || 0} / {warehouse.total_capacity?.toFixed(0) || 0} m³
                          </p>
                        </div>

                        <div>
                          <p className="text-xs text-gray-500 mb-1">
                            {warehouse.areas.length} área{warehouse.areas.length !== 1 ? 's' : ''}
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {warehouse.areas.slice(0, 3).map((area) => (
                              <Badge key={area.id} variant="outline" className="text-xs">
                                {getAreaTypeLabel(area.type)}
                                {area.requires_refrigeration && (
                                  <ThermometerSnowflake className="h-3 w-3 ml-1" />
                                )}
                              </Badge>
                            ))}
                            {warehouse.areas.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{warehouse.areas.length - 3}
                              </Badge>
                            )}
                          </div>
                        </div>

                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full"
                          onClick={() => {
                            selectWarehouse(warehouse.id);
                            setShowDetailsDialog(true);
                          }}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Ver Detalhes
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Transfers Tab */}
        <TabsContent value="transfers" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Transferências Entre Depósitos</CardTitle>
                  <CardDescription>
                    Gerencie transferências de estoque entre depósitos
                  </CardDescription>
                </div>
                <Button onClick={() => setShowTransferDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Transferência
                </Button>
              </div>
            </CardHeader>

            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Número</TableHead>
                    <TableHead>Origem</TableHead>
                    <TableHead>Destino</TableHead>
                    <TableHead>Itens</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Solicitado em</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transfers.map((transfer) => (
                    <TableRow key={transfer.id}>
                      <TableCell className="font-medium">{transfer.transfer_number}</TableCell>
                      <TableCell>{transfer.from_warehouse_name}</TableCell>
                      <TableCell>{transfer.to_warehouse_name}</TableCell>
                      <TableCell>{transfer.items.length} item(ns)</TableCell>
                      <TableCell>
                        <Badge className={getTransferStatusColor(transfer.status)}>
                          {transfer.status === 'pending' ? 'Pendente' :
                           transfer.status === 'approved' ? 'Aprovado' :
                           transfer.status === 'in_transit' ? 'Em Trânsito' :
                           transfer.status === 'completed' ? 'Concluído' : 'Cancelado'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {format(new Date(transfer.requested_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {transfer.status === 'pending' && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => approveTransfer(transfer.id)}
                              >
                                Aprovar
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => cancelTransfer(transfer.id, 'Cancelado pelo usuário')}
                              >
                                Cancelar
                              </Button>
                            </>
                          )}
                          {transfer.status === 'approved' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => shipTransfer(transfer.id)}
                            >
                              Expedir
                            </Button>
                          )}
                          {transfer.status === 'in_transit' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => receiveTransfer(transfer.id)}
                            >
                              Receber
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
      </Tabs>

      {/* Warehouse Details Dialog */}
      {selectedWarehouse && (
        <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>{selectedWarehouse.name}</DialogTitle>
              <DialogDescription>
                Informações detalhadas do depósito
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Código</Label>
                  <p className="font-medium">{selectedWarehouse.code}</p>
                </div>
                <div>
                  <Label>Tipo</Label>
                  <Badge className={getTypeColor(selectedWarehouse.type)}>
                    {selectedWarehouse.type}
                  </Badge>
                </div>
                <div className="col-span-2">
                  <Label>Endereço Completo</Label>
                  <p className="text-sm">
                    {selectedWarehouse.address.street}, {selectedWarehouse.address.number}
                    {selectedWarehouse.address.complement && ` - ${selectedWarehouse.address.complement}`}
                    <br />
                    {selectedWarehouse.address.neighborhood} - {selectedWarehouse.address.city}/{selectedWarehouse.address.state}
                    <br />
                    CEP: {selectedWarehouse.address.zip_code}
                  </p>
                </div>
                {selectedWarehouse.manager_name && (
                  <>
                    <div>
                      <Label>Responsável</Label>
                      <p>{selectedWarehouse.manager_name}</p>
                    </div>
                    <div>
                      <Label>Contato</Label>
                      <p className="text-sm">
                        {selectedWarehouse.contact_phone}
                        <br />
                        {selectedWarehouse.contact_email}
                      </p>
                    </div>
                  </>
                )}
              </div>

              <div>
                <h4 className="font-semibold mb-2">Áreas de Armazenamento</h4>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Capacidade</TableHead>
                      <TableHead>Ocupação</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedWarehouse.areas.map((area) => {
                      const occupationPercentage = area.capacity
                        ? (area.current_occupation / area.capacity) * 100
                        : 0;

                      return (
                        <TableRow key={area.id}>
                          <TableCell className="font-medium">
                            {area.name}
                            {area.requires_refrigeration && (
                              <ThermometerSnowflake className="h-3 w-3 inline ml-1 text-blue-600" />
                            )}
                          </TableCell>
                          <TableCell>{getAreaTypeLabel(area.type)}</TableCell>
                          <TableCell>{area.capacity} m³</TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <Progress value={occupationPercentage} className="h-2" />
                              <p className="text-xs text-gray-500">
                                {area.current_occupation} / {area.capacity} m³ ({occupationPercentage.toFixed(1)}%)
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={area.is_active ? 'default' : 'secondary'}>
                              {area.is_active ? 'Ativo' : 'Inativo'}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDetailsDialog(false)}>
                Fechar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};
