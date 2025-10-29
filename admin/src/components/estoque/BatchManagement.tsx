'use client';

import React, { useState } from 'react';
import { useBatchControl } from '@/hooks/useBatchControl';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Package,
  Calendar,
  MapPin,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Filter,
  Plus,
  Eye,
  TrendingUp,
  TrendingDown,
  Activity,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ProductBatch } from '@/types/inventory';

interface BatchManagementProps {
  productId?: number;
}

export const BatchManagement: React.FC<BatchManagementProps> = ({ productId }) => {
  const {
    filteredBatches,
    expiryAlerts,
    selectedBatch,
    batchMovements,
    stats,
    filters,
    setFilters,
    clearFilters,
    selectBatch,
    createBatch,
    updateBatch,
    deleteBatch,
    resolveAlert,
    loading,
    refresh,
  } = useBatchControl(productId);

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // Status badge colors
  const getStatusColor = (status: ProductBatch['status']) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'quarantine': return 'bg-yellow-100 text-yellow-800';
      case 'expired': return 'bg-red-100 text-red-800';
      case 'recalled': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSeverityColor = (severity: 'critical' | 'warning' | 'info') => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'warning': return 'bg-yellow-100 text-yellow-800';
      case 'info': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Total de Lotes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-blue-600" />
              <span className="text-2xl font-bold">{stats.totalBatches}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Lotes Ativos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-2xl font-bold">{stats.activeBatches}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Lotes Vencidos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <XCircle className="h-4 w-4 text-red-600" />
              <span className="text-2xl font-bold">{stats.expiredBatches}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Alertas Críticos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <span className="text-2xl font-bold">{stats.criticalAlerts}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Alertas de Atenção</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-yellow-600" />
              <span className="text-2xl font-bold">{stats.warningAlerts}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Valor Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <span className="text-2xl font-bold">
                {new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                }).format(stats.totalValue)}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="batches" className="space-y-4">
        <TabsList>
          <TabsTrigger value="batches">Lotes</TabsTrigger>
          <TabsTrigger value="alerts">
            Alertas de Validade
            {(stats.criticalAlerts + stats.warningAlerts) > 0 && (
              <Badge className="ml-2 bg-red-600">
                {stats.criticalAlerts + stats.warningAlerts}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Batches Tab */}
        <TabsContent value="batches" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Gerenciamento de Lotes</CardTitle>
                  <CardDescription>
                    Controle completo de lotes com rastreabilidade e validades
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
                  <Button onClick={() => setShowCreateDialog(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Novo Lote
                  </Button>
                </div>
              </div>

              {/* Filters */}
              {showFilters && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4 pt-4 border-t">
                  <div>
                    <Label>Buscar</Label>
                    <Input
                      placeholder="Número do lote, localização..."
                      value={filters.search || ''}
                      onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Status</Label>
                    <Select
                      value={filters.status?.[0] || 'all'}
                      onValueChange={(value) =>
                        setFilters({ ...filters, status: value === 'all' ? undefined : [value as any] })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        <SelectItem value="active">Ativo</SelectItem>
                        <SelectItem value="quarantine">Quarentena</SelectItem>
                        <SelectItem value="expired">Vencido</SelectItem>
                        <SelectItem value="recalled">Recolhido</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Vencimento em (dias)</Label>
                    <Input
                      type="number"
                      placeholder="Ex: 30"
                      value={filters.expiring_in_days || ''}
                      onChange={(e) =>
                        setFilters({ ...filters, expiring_in_days: e.target.value ? parseInt(e.target.value) : undefined })
                      }
                    />
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
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Número do Lote</TableHead>
                    <TableHead>Fabricação</TableHead>
                    <TableHead>Validade</TableHead>
                    <TableHead>Quantidade</TableHead>
                    <TableHead>Localização</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Dias p/ Vencer</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBatches.map((batch) => (
                    <TableRow key={batch.id}>
                      <TableCell className="font-medium">{batch.batch_number}</TableCell>
                      <TableCell>
                        {format(new Date(batch.manufacturing_date), 'dd/MM/yyyy', { locale: ptBR })}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {format(new Date(batch.expiry_date), 'dd/MM/yyyy', { locale: ptBR })}
                          {batch.near_expiry && (
                            <AlertTriangle className="h-4 w-4 text-yellow-600" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{batch.quantity}</TableCell>
                      <TableCell className="text-sm text-gray-600">{batch.location}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(batch.status)}>
                          {batch.status === 'active' ? 'Ativo' :
                           batch.status === 'quarantine' ? 'Quarentena' :
                           batch.status === 'expired' ? 'Vencido' : 'Recolhido'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {batch.days_to_expire !== undefined && batch.days_to_expire >= 0 ? (
                          <span className={batch.days_to_expire < 30 ? 'text-red-600 font-semibold' : ''}>
                            {batch.days_to_expire} dias
                          </span>
                        ) : (
                          <span className="text-red-600 font-semibold">Vencido</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            selectBatch(batch.id);
                            setShowDetailsDialog(true);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Alerts Tab */}
        <TabsContent value="alerts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Alertas de Validade</CardTitle>
              <CardDescription>
                Lotes próximos ao vencimento que requerem atenção
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Severidade</TableHead>
                    <TableHead>Produto</TableHead>
                    <TableHead>Lote</TableHead>
                    <TableHead>Dias Restantes</TableHead>
                    <TableHead>Quantidade</TableHead>
                    <TableHead>Ação Tomada</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {expiryAlerts.filter(a => !a.resolved).map((alert) => (
                    <TableRow key={alert.id}>
                      <TableCell>
                        <Badge className={getSeverityColor(alert.severity)}>
                          {alert.severity === 'critical' ? 'Crítico' :
                           alert.severity === 'warning' ? 'Atenção' : 'Info'}
                        </Badge>
                      </TableCell>
                      <TableCell>{alert.product_name}</TableCell>
                      <TableCell className="font-medium">{alert.batch.batch_number}</TableCell>
                      <TableCell>
                        <span className={alert.days_remaining < 7 ? 'text-red-600 font-semibold' : ''}>
                          {alert.days_remaining} dias
                        </span>
                      </TableCell>
                      <TableCell>{alert.quantity}</TableCell>
                      <TableCell>
                        {alert.action_taken && alert.action_taken !== 'none' ? (
                          <Badge variant="outline">
                            {alert.action_taken === 'promotion' ? 'Promoção' :
                             alert.action_taken === 'donation' ? 'Doação' :
                             alert.action_taken === 'disposal' ? 'Descarte' : '-'}
                          </Badge>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Select
                          onValueChange={(value) => resolveAlert(alert.id, value as any)}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue placeholder="Resolver" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="promotion">Promoção</SelectItem>
                            <SelectItem value="donation">Doação</SelectItem>
                            <SelectItem value="disposal">Descarte</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Batch Details Dialog */}
      {selectedBatch && (
        <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Detalhes do Lote {selectedBatch.batch_number}</DialogTitle>
              <DialogDescription>
                Informações completas e histórico de movimentações
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Número do Lote</Label>
                  <p className="font-medium">{selectedBatch.batch_number}</p>
                </div>
                <div>
                  <Label>Status</Label>
                  <Badge className={getStatusColor(selectedBatch.status)}>
                    {selectedBatch.status}
                  </Badge>
                </div>
                <div>
                  <Label>Data de Fabricação</Label>
                  <p>{format(new Date(selectedBatch.manufacturing_date), 'dd/MM/yyyy', { locale: ptBR })}</p>
                </div>
                <div>
                  <Label>Data de Validade</Label>
                  <p>{format(new Date(selectedBatch.expiry_date), 'dd/MM/yyyy', { locale: ptBR })}</p>
                </div>
                <div>
                  <Label>Quantidade</Label>
                  <p className="font-medium">{selectedBatch.quantity}</p>
                </div>
                <div>
                  <Label>Custo Unitário</Label>
                  <p className="font-medium">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(selectedBatch.cost_price)}
                  </p>
                </div>
                <div>
                  <Label>Localização</Label>
                  <p className="text-sm">{selectedBatch.location}</p>
                </div>
                <div>
                  <Label>Origem</Label>
                  <p className="text-sm">{selectedBatch.origin}</p>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  Histórico de Movimentações
                </h4>
                <div className="border rounded-lg max-h-60 overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Quantidade</TableHead>
                        <TableHead>Referência</TableHead>
                        <TableHead>Data</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {batchMovements.map((movement) => (
                        <TableRow key={movement.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {movement.type === 'entry' && <TrendingUp className="h-4 w-4 text-green-600" />}
                              {movement.type === 'exit' && <TrendingDown className="h-4 w-4 text-red-600" />}
                              {movement.type}
                            </div>
                          </TableCell>
                          <TableCell>{movement.quantity}</TableCell>
                          <TableCell className="text-sm">{movement.reference}</TableCell>
                          <TableCell className="text-sm">
                            {format(new Date(movement.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
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
