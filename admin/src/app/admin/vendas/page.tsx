'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  ShoppingCart,
  Search,
  Plus,
  Filter,
  DollarSign,
  TrendingUp,
  Edit,
  Eye,
  Loader2,
  Trash2,
  Package
} from 'lucide-react';
import { saleService } from '@/services/sale';
import { Sale } from '@/types';
import { CreateSaleModal } from '@/components/sale/CreateSaleModal';
import { EditSaleModal } from '@/components/sale/EditSaleModal';
import { SaleDetailsModal } from '@/components/sale/SaleDetailsModal';
import { useConfirm } from '@/hooks/useConfirm';
import { toast } from 'sonner';

type StatusFilter = 'pending' | 'completed' | 'cancelled' | 'all';

const VendasPage: React.FC = () => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  // Estados dos modais
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);

  const { confirm, ConfirmDialog } = useConfirm();

  useEffect(() => {
    loadSales();
  }, [statusFilter]);

  const loadSales = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await saleService.getAll({
        status_filter: statusFilter === 'all' ? undefined : statusFilter,
        limit: 100
      });
      // Filtrar por cliente no frontend se houver busca
      const filteredData = searchTerm
        ? data.filter(s => s.customer_name.toLowerCase().includes(searchTerm.toLowerCase()))
        : data;
      setSales(filteredData);
    } catch (err) {
      const error = err as Error;
      setError(error.message || 'Erro ao carregar vendas');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    loadSales();
  };

  const handleDelete = async (sale: Sale) => {
    await confirm(
      {
        title: 'Confirmar Exclusão',
        description: `Tem certeza que deseja excluir a venda para "${sale.customer_name}"? Esta ação não pode ser desfeita.`,
        confirmText: 'Excluir',
        cancelText: 'Cancelar',
        type: 'danger',
      },
      async () => {
        try {
          await saleService.delete(sale.id);
          toast.success('Venda excluída com sucesso!');
          loadSales();
        } catch (err) {
          const error = err as Error;
          toast.error(error.message || 'Erro ao excluir venda');
          throw err;
        }
      }
    );
  };

  const handleView = (sale: Sale) => {
    setSelectedSale(sale);
    setDetailsModalOpen(true);
  };

  const handleEdit = (sale: Sale) => {
    setSelectedSale(sale);
    setEditModalOpen(true);
  };

  const handleEditFromDetails = () => {
    setDetailsModalOpen(false);
    setEditModalOpen(true);
  };

  const handleDeleteFromDetails = () => {
    if (selectedSale) {
      setDetailsModalOpen(false);
      handleDelete(selectedSale);
    }
  };

  // Estatísticas
  const totalSales = sales.length;
  const totalRevenue = sales
    .filter(s => s.status === 'completed')
    .reduce((sum, s) => sum + s.total_value, 0);
  const averageTicket = totalSales > 0 ? totalRevenue / totalSales : 0;
  const completedSales = sales.filter(s => s.status === 'completed').length;

  const statistics = [
    { label: 'Total de Vendas', value: totalSales, icon: ShoppingCart, color: 'text-blue-500' },
    { label: 'Vendas Concluídas', value: completedSales, icon: TrendingUp, color: 'text-green-500' },
    {
      label: 'Receita Total',
      value: `R$ ${totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      icon: DollarSign,
      color: 'text-purple-500'
    },
    {
      label: 'Ticket Médio',
      value: `R$ ${averageTicket.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      icon: Package,
      color: 'text-orange-500'
    },
  ];

  const getStatusBadge = (status: Sale['status']) => {
    const statusConfig = {
      pending: { label: 'Pendente', className: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
      completed: { label: 'Concluída', className: 'bg-green-100 text-green-800 border-green-200' },
      cancelled: { label: 'Cancelada', className: 'bg-red-100 text-red-800 border-red-200' },
    };

    const config = statusConfig[status] || statusConfig.pending;
    return <Badge variant="outline" className={config.className}>{config.label}</Badge>;
  };

  const filters = [
    { key: 'all', label: 'Todas' },
    { key: 'pending', label: 'Pendentes' },
    { key: 'completed', label: 'Concluídas' },
    { key: 'cancelled', label: 'Canceladas' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <ShoppingCart className="h-8 w-8" />
            Vendas
          </h1>
          <p className="text-muted-foreground mt-1">
            Gerencie as vendas de produtos
          </p>
        </div>
        <Button size="lg" onClick={() => setCreateModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Venda
        </Button>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {statistics.map((stat, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.label}</CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${stat.color}`}>
                {typeof stat.value === 'number' ? stat.value : stat.value}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Buscar por cliente..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <Button variant="outline" onClick={handleSearch}>
              <Search className="mr-2 h-4 w-4" />
              Buscar
            </Button>
            <div className="flex gap-2">
              {filters.map((filter) => (
                <Button
                  key={filter.key}
                  variant={statusFilter === filter.key ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setStatusFilter(filter.key as StatusFilter)}
                >
                  {filter.label}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de Vendas */}
      {loading ? (
        <Card>
          <CardContent className="py-12 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </CardContent>
        </Card>
      ) : error ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-destructive">{error}</p>
            <Button variant="outline" onClick={loadSales} className="mt-4">
              Tentar Novamente
            </Button>
          </CardContent>
        </Card>
      ) : sales.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              Nenhuma venda encontrada.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Lista de Vendas ({sales.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 font-semibold text-sm">Data</th>
                    <th className="text-left p-3 font-semibold text-sm">Cliente</th>
                    <th className="text-left p-3 font-semibold text-sm">Produto</th>
                    <th className="text-right p-3 font-semibold text-sm">Quantidade</th>
                    <th className="text-right p-3 font-semibold text-sm">Valor Unit.</th>
                    <th className="text-right p-3 font-semibold text-sm">Total</th>
                    <th className="text-center p-3 font-semibold text-sm">Status</th>
                    <th className="text-center p-3 font-semibold text-sm">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {sales.map((sale) => (
                    <tr key={sale.id} className="border-b hover:bg-muted/50 transition-colors">
                      <td className="p-3">
                        <span className="text-sm">
                          {new Date(sale.sale_date).toLocaleDateString('pt-BR')}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className="font-medium">{sale.customer_name}</span>
                      </td>
                      <td className="p-3">
                        <span className="text-sm">
                          {sale.product?.name || `Produto #${sale.product_id}`}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <span className="font-semibold">{sale.quantity}</span>
                      </td>
                      <td className="p-3 text-right">
                        <span>
                          R$ {sale.unit_price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <span className="font-semibold text-green-600">
                          R$ {sale.total_value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        {getStatusBadge(sale.status)}
                      </td>
                      <td className="p-3">
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleView(sale)}
                            title="Visualizar detalhes"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(sale)}
                            title="Editar venda"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:bg-destructive/10"
                            onClick={() => handleDelete(sale)}
                            title="Excluir venda"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Modais */}
      <CreateSaleModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        onSuccess={loadSales}
      />

      <EditSaleModal
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        sale={selectedSale}
        onSuccess={loadSales}
      />

      <SaleDetailsModal
        open={detailsModalOpen}
        onOpenChange={setDetailsModalOpen}
        sale={selectedSale}
        onEdit={handleEditFromDetails}
        onDelete={handleDeleteFromDetails}
      />

      {ConfirmDialog}
    </div>
  );
};

export default VendasPage;
