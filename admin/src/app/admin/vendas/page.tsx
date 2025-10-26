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
  Trash2,
  Package,
  Download,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';
import { saleService } from '@/services/sale';
import { integrationService } from '@/services/integration';
import { Sale } from '@/types';
import { CreateSaleModal } from '@/components/sale/CreateSaleModal';
import { EditSaleModal } from '@/components/sale/EditSaleModal';
import { SaleDetailsModal } from '@/components/sale/SaleDetailsModal';
import { NFEActions } from '@/components/fiscal/NFEActions';
import { useConfirm } from '@/hooks/useConfirm';
import { toast } from 'sonner';
import { exportToCSV, formatCurrencyForExport, formatDateForExport } from '@/lib/export';
import { TableSkeleton } from '@/components/ui/table-skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { usePrint } from '@/hooks/usePrint';
import { PrintButton } from '@/components/ui/print-button';
import { PrintLayout, NoPrint, PrintOnly, PrintInfoGrid } from '@/components/ui/print-layout';

type StatusFilter = 'pending' | 'completed' | 'cancelled' | 'all';

const VendasPage: React.FC = () => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  // Estados dos modais
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);

  const { confirm, ConfirmDialog } = useConfirm();

  // Hook de impressão
  const { isPrinting, handlePrint } = usePrint({
    documentTitle: 'Relatório de Vendas - Orion ERP',
  });

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

  const handleExport = () => {
    exportToCSV(
      sales,
      'vendas',
      [
        { key: 'id', label: 'ID' },
        { key: 'customer_name', label: 'Cliente' },
        { key: 'product', label: 'Produto', format: (prod) => prod?.name || '-' },
        { key: 'quantity', label: 'Quantidade' },
        { key: 'unit_price', label: 'Preço Unitário', format: formatCurrencyForExport },
        { key: 'total_value', label: 'Total', format: formatCurrencyForExport },
        { key: 'status', label: 'Status', format: (s) => s === 'pending' ? 'Pendente' : s === 'completed' ? 'Concluída' : 'Cancelada' },
        { key: 'sale_date', label: 'Data', format: formatDateForExport },
      ]
    );
    toast.success(`${sales.length} venda(s) exportada(s) com sucesso!`);
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

  const handleSyncShopify = async () => {
    setSyncing(true);
    try {
      const result = await integrationService.syncShopifyOrders(250);

      if (result.success) {
        if (result.new_orders_imported > 0) {
          toast.success(`${result.new_orders_imported} pedido(s) Shopify importado(s)!`, {
            description: result.message,
          });
          loadSales(); // Recarregar vendas
        } else {
          toast.info(result.message);
        }

        if (result.errors.length > 0) {
          toast.warning('Alguns pedidos tiveram erros', {
            description: `${result.errors.length} erro(s) encontrado(s)`,
          });
        }
      } else {
        toast.error('Erro na sincronização', {
          description: result.errors[0] || 'Erro desconhecido',
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      toast.error('Erro ao sincronizar pedidos Shopify', {
        description: errorMessage,
      });
    } finally {
      setSyncing(false);
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
    <PrintLayout
      title="Relatório de Vendas"
      subtitle={`${sales.length} venda(s) encontrada(s)`}
      showHeader
      showFooter
    >
      <div className="space-y-6">
        <NoPrint>
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
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleSyncShopify}
                disabled={syncing}
              >
                {syncing ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Sincronizando...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Sincronizar Shopify
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={handleExport}
                disabled={sales.length === 0}
              >
                <Download className="mr-2 h-4 w-4" />
                Exportar CSV
              </Button>
              <PrintButton
                onClick={handlePrint}
                loading={isPrinting}
                label="Imprimir"
                variant="outline"
                disabled={sales.length === 0}
              />
              <Button size="lg" onClick={() => setCreateModalOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Nova Venda
              </Button>
            </div>
          </div>
        </NoPrint>

        {/* Resumo para impressão */}
        <PrintOnly>
          <PrintInfoGrid
            items={[
              { label: 'Total de Vendas', value: statistics[0]?.value || '0' },
              { label: 'Valor Total', value: statistics[1]?.value || 'R$ 0,00' },
              { label: 'Vendas Concluídas', value: sales.filter(s => s.status === 'completed').length },
              { label: 'Vendas Pendentes', value: sales.filter(s => s.status === 'pending').length },
            ]}
          />
        </PrintOnly>

      {/* Estatísticas */}
      <NoPrint>
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
      </NoPrint>

      {/* Filtros */}
      <NoPrint>
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
      </NoPrint>

      {/* Tabela de Vendas */}
      {loading ? (
        <TableSkeleton rows={8} columns={8} />
      ) : error ? (
        <EmptyState
          icon={AlertTriangle}
          title="Erro ao carregar vendas"
          description={error}
          action={{
            label: "Tentar Novamente",
            onClick: loadSales
          }}
        />
      ) : sales.length === 0 ? (
        <EmptyState
          icon={ShoppingCart}
          title="Nenhuma venda encontrada"
          description={
            searchTerm || statusFilter !== 'all'
              ? "Nenhuma venda corresponde aos filtros selecionados. Tente ajustar os filtros."
              : "Você ainda não registrou nenhuma venda. Comece criando sua primeira venda!"
          }
          action={
            !searchTerm && statusFilter === 'all'
              ? {
                  label: "Criar Primeira Venda",
                  onClick: () => setCreateModalOpen(true)
                }
              : undefined
          }
        />
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
                    <th className="text-left p-3 font-semibold text-sm">NF-e</th>
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
                        <NFEActions sale={sale} onUpdate={loadSales} />
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
    </PrintLayout>
  );
};

export default VendasPage;
