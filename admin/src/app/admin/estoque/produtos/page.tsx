'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Package,
  Search,
  Plus,
  Filter,
  AlertTriangle,
  TrendingUp,
  Edit,
  Eye,
  Loader2,
  Trash2,
  PackagePlus,
  Download,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  X,
  CheckCircle2,
  XCircle,
  Grid3x3,
  List,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { productService } from '@/services/product';
import { Product } from '@/types';
import { CreateProductModal } from '@/components/product/CreateProductModal';
import { EditProductModal } from '@/components/product/EditProductModal';
import { ProductDetailsModal } from '@/components/product/ProductDetailsModal';
import { AdjustStockModal } from '@/components/product/AdjustStockModal';
import { useConfirm } from '@/hooks/useConfirm';
import { toast } from 'sonner';
import { exportToCSV, formatCurrencyForExport, formatDateForExport } from '@/lib/export';
import { TableSkeleton, GridSkeleton } from '@/components/ui/table-skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { usePersistedFilters, FilterPreset } from '@/hooks/usePersistedFilters';
import { FilterPresets } from '@/components/ui/filter-presets';
import { usePrint } from '@/hooks/usePrint';
import { PrintButton } from '@/components/ui/print-button';
import { PrintLayout, NoPrint, PrintOnly, PrintInfoGrid } from '@/components/ui/print-layout';

type SortField = 'name' | 'stock_quantity' | 'sale_price' | 'cost_price' | 'category';
type SortOrder = 'asc' | 'desc';
type StatusFilter = 'all' | 'active' | 'inactive';
type StockFilter = 'all' | 'low' | 'ok' | 'critical';
type ViewMode = 'table' | 'grid';

// Interface para filtros
interface ProductFilters extends Record<string, string> {
  searchTerm: string;
  categoryFilter: string;
  statusFilter: StatusFilter;
  stockFilter: StockFilter;
}

const ProdutosPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filtros persistentes com presets
  const filterPresets: FilterPreset<ProductFilters>[] = [
    {
      id: 'active',
      name: '✅ Ativos',
      filters: { searchTerm: '', categoryFilter: 'all', statusFilter: 'active', stockFilter: 'all' },
    },
    {
      id: 'lowStock',
      name: '⚠️ Estoque Baixo',
      filters: { searchTerm: '', categoryFilter: 'all', statusFilter: 'all', stockFilter: 'low' },
    },
    {
      id: 'criticalStock',
      name: '🚨 Estoque Crítico',
      filters: { searchTerm: '', categoryFilter: 'all', statusFilter: 'all', stockFilter: 'critical' },
    },
    {
      id: 'inactive',
      name: '❌ Inativos',
      filters: { searchTerm: '', categoryFilter: 'all', statusFilter: 'inactive', stockFilter: 'all' },
    },
  ];

  const {
    filters,
    updateFilter,
    clearFilters,
    applyPreset,
    presets,
    activePreset,
  } = usePersistedFilters<ProductFilters>({
    key: 'products',
    defaultFilters: {
      searchTerm: '',
      categoryFilter: 'all',
      statusFilter: 'all',
      stockFilter: 'all',
    },
    presets: filterPresets,
  });

  // Destructure filters para facilitar o uso
  const { searchTerm, categoryFilter, statusFilter, stockFilter } = filters;

  // Ordenação
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  // Paginação
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Visualização
  const [viewMode, setViewMode] = useState<ViewMode>('table');

  // Estados dos modais
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [adjustStockModalOpen, setAdjustStockModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const { confirm, ConfirmDialog } = useConfirm();

  // Hook de impressão
  const { isPrinting, handlePrint } = usePrint({
    documentTitle: 'Relatório de Produtos - Orion ERP',
    onBeforePrint: () => {
      console.log('Preparando impressão...');
    },
    onAfterPrint: () => {
      console.log('Impressão concluída');
    },
  });

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await productService.getAll({
        limit: 1000
      });
      setProducts(data);
    } catch (err) {
      const error = err as Error;
      setError(error.message || 'Erro ao carregar produtos');
    } finally {
      setLoading(false);
    }
  };

  // Obter categorias únicas
  const categories = useMemo(() => {
    const cats = products
      .map(p => p.category)
      .filter((cat): cat is string => !!cat && cat.trim() !== '');
    return Array.from(new Set(cats)).sort();
  }, [products]);

  // Filtrar e ordenar produtos
  const filteredAndSortedProducts = useMemo(() => {
    let filtered = [...products];

    // Filtro por busca (nome ou SKU)
    if (searchTerm) {
      filtered = filtered.filter((product) =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.sku?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtro por categoria
    if (categoryFilter !== 'all') {
      filtered = filtered.filter((product) => product.category === categoryFilter);
    }

    // Filtro por status (ativo/inativo)
    if (statusFilter === 'active') {
      filtered = filtered.filter((product) => product.active);
    } else if (statusFilter === 'inactive') {
      filtered = filtered.filter((product) => !product.active);
    }

    // Filtro por nível de estoque
    if (stockFilter === 'critical') {
      filtered = filtered.filter((product) => product.stock_quantity === 0);
    } else if (stockFilter === 'low') {
      filtered = filtered.filter(
        (product) => product.stock_quantity > 0 && product.stock_quantity <= product.min_stock_level
      );
    } else if (stockFilter === 'ok') {
      filtered = filtered.filter((product) => product.stock_quantity > product.min_stock_level);
    }

    // Ordenação
    filtered.sort((a, b) => {
      let aValue: string | number = '';
      let bValue: string | number = '';

      switch (sortField) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'stock_quantity':
          aValue = a.stock_quantity;
          bValue = b.stock_quantity;
          break;
        case 'sale_price':
          aValue = a.sale_price;
          bValue = b.sale_price;
          break;
        case 'cost_price':
          aValue = a.cost_price || 0;
          bValue = b.cost_price || 0;
          break;
        case 'category':
          aValue = (a.category || '').toLowerCase();
          bValue = (b.category || '').toLowerCase();
          break;
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [products, searchTerm, categoryFilter, statusFilter, stockFilter, sortField, sortOrder]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const handleClearFilters = () => {
    clearFilters();
    setCurrentPage(1);
  };

  const hasActiveFilters = Boolean(searchTerm || categoryFilter !== 'all' || statusFilter !== 'all' || stockFilter !== 'all');

  // Paginação
  const totalPages = Math.ceil(filteredAndSortedProducts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedProducts = filteredAndSortedProducts.slice(startIndex, endIndex);

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  const handleItemsPerPageChange = (value: string) => {
    setItemsPerPage(Number(value));
    setCurrentPage(1);
  };

  // Resetar página ao filtrar
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, categoryFilter, statusFilter, stockFilter]);

  const handleDelete = async (product: Product) => {
    await confirm(
      {
        title: 'Confirmar Exclusão',
        description: `Tem certeza que deseja excluir o produto "${product.name}"? Esta ação não pode ser desfeita.`,
        confirmText: 'Excluir',
        cancelText: 'Cancelar',
        type: 'danger',
      },
      async () => {
        try {
          await productService.delete(product.id);
          toast.success('Produto excluído com sucesso!');
          loadProducts();
        } catch (err) {
          const error = err as Error;
          toast.error(error.message || 'Erro ao excluir produto');
          throw err;
        }
      }
    );
  };

  const handleView = (product: Product) => {
    setSelectedProduct(product);
    setDetailsModalOpen(true);
  };

  const handleEdit = (product: Product) => {
    setSelectedProduct(product);
    setEditModalOpen(true);
  };

  const handleAdjustStock = (product: Product) => {
    setSelectedProduct(product);
    setAdjustStockModalOpen(true);
  };

  const handleEditFromDetails = () => {
    setDetailsModalOpen(false);
    setEditModalOpen(true);
  };

  const handleDeleteFromDetails = () => {
    if (selectedProduct) {
      setDetailsModalOpen(false);
      handleDelete(selectedProduct);
    }
  };

  const handleAdjustStockFromDetails = () => {
    setDetailsModalOpen(false);
    setAdjustStockModalOpen(true);
  };

  const handleAdjustStockSuccess = async () => {
    // Recarrega lista de produtos
    await loadProducts();

    // Se tem produto selecionado, recarrega seus dados atualizados
    if (selectedProduct) {
      try {
        const updatedProduct = await productService.getById(selectedProduct.id);
        setSelectedProduct(updatedProduct);
      } catch (err) {
        console.error('Erro ao atualizar produto:', err);
      }
    }
  };

  // Estatísticas - Usando produtos filtrados para refletir os filtros aplicados
  const totalProducts = filteredAndSortedProducts.length;
  const lowStockProducts = filteredAndSortedProducts.filter(p => p.stock_quantity <= p.min_stock_level).length;
  const criticalStockProducts = filteredAndSortedProducts.filter(p => p.stock_quantity === 0).length;
  const okStockProducts = filteredAndSortedProducts.filter(p => p.stock_quantity > p.min_stock_level).length;

  const estatisticas = [
    { label: 'Total de Produtos', valor: totalProducts, icon: Package, color: 'text-blue-500' },
    { label: 'Baixo Estoque', valor: lowStockProducts, icon: AlertTriangle, color: 'text-orange-500' },
    { label: 'Estoque Crítico', valor: criticalStockProducts, icon: AlertTriangle, color: 'text-red-500' },
    { label: 'Em Estoque OK', valor: okStockProducts, icon: TrendingUp, color: 'text-green-500' },
  ];

  const getStatusBadge = (product: Product) => {
    if (product.stock_quantity === 0) {
      return <Badge variant="destructive">Crítico</Badge>;
    }
    if (product.stock_quantity <= product.min_stock_level) {
      return <Badge className="bg-orange-500">Baixo</Badge>;
    }
    return <Badge className="bg-green-500">OK</Badge>;
  };

  const handleExport = () => {
    exportToCSV(
      filteredAndSortedProducts,
      'produtos',
      [
        { key: 'id', label: 'ID' },
        { key: 'name', label: 'Nome' },
        { key: 'sku', label: 'SKU' },
        { key: 'category', label: 'Categoria' },
        { key: 'cost_price', label: 'Preço Custo', format: formatCurrencyForExport },
        { key: 'sale_price', label: 'Preço Venda', format: formatCurrencyForExport },
        { key: 'stock_quantity', label: 'Estoque' },
        { key: 'min_stock_level', label: 'Estoque Mínimo' },
        { key: 'unit', label: 'Unidade' },
        { key: 'active', label: 'Ativo', format: (val) => (val ? 'Sim' : 'Não') },
        { key: 'created_at', label: 'Criado em', format: formatDateForExport },
      ]
    );
    toast.success(`${filteredAndSortedProducts.length} produto(s) exportado(s) com sucesso!`);
  };

  return (
    <PrintLayout
      title="Relatório de Produtos"
      subtitle={`${filteredAndSortedProducts.length} produto(s) encontrado(s)`}
      showHeader
      showFooter
    >
      <div className="space-y-6">
        <NoPrint>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
                <Package className="h-8 w-8" />
                Produtos
              </h1>
              <p className="text-muted-foreground mt-1">
                Gerencie o cadastro de produtos do estoque
              </p>
            </div>
            <div className="flex gap-2">
          {/* Toggle de visualização */}
          <div className="flex border rounded-md">
            <Button
              variant={viewMode === 'table' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('table')}
              className="rounded-r-none"
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className="rounded-l-none"
            >
              <Grid3x3 className="h-4 w-4" />
            </Button>
          </div>

          <Button
            variant="outline"
            onClick={handleExport}
            disabled={products.length === 0}
          >
            <Download className="mr-2 h-4 w-4" />
            Exportar CSV
          </Button>
          <PrintButton
            onClick={handlePrint}
            loading={isPrinting}
            label="Imprimir"
            variant="outline"
            disabled={products.length === 0}
          />
          <Button size="lg" onClick={() => setCreateModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Produto
          </Button>
        </div>
      </div>
        </NoPrint>

        {/* Resumo para impressão */}
        <PrintOnly>
          <PrintInfoGrid
            items={[
              { label: 'Total de Produtos', value: estatisticas[0]?.valor || '0' },
              { label: 'Produtos Ativos', value: estatisticas[1]?.valor || '0' },
              { label: 'Estoque Baixo', value: estatisticas[2]?.valor || '0' },
              { label: 'Estoque Crítico', value: estatisticas[3]?.valor || '0' },
            ]}
          />
        </PrintOnly>

      {/* Estatísticas */}
      <NoPrint>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {estatisticas.map((stat, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.label}</CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${stat.color}`}>{stat.valor}</div>
            </CardContent>
          </Card>
        ))}
      </div>
      </NoPrint>

      {/* Filtros e Busca */}
      <NoPrint>
        <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filtros e Busca
            </CardTitle>
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearFilters}
                className="gap-2"
              >
                <X className="h-4 w-4" />
                Limpar Filtros
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filtros Rápidos (Presets) */}
          <FilterPresets
            presets={presets}
            activePreset={activePreset}
            onApplyPreset={applyPreset}
            onClearFilters={handleClearFilters}
            hasActiveFilters={hasActiveFilters}
          />

          {/* Busca */}
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">
                Buscar Produto
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Digite o nome ou SKU..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => updateFilter('searchTerm', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Filtros */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Filtro por Categoria */}
            <div>
              <label className="text-sm font-medium mb-2 block">
                Categoria
              </label>
              <Select value={categoryFilter} onValueChange={(value) => updateFilter('categoryFilter', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas as categorias" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as categorias</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Filtro por Status */}
            <div>
              <label className="text-sm font-medium mb-2 block">
                Status
              </label>
              <Select value={statusFilter} onValueChange={(value) => updateFilter('statusFilter', value as StatusFilter)}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="active">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      Ativos
                    </div>
                  </SelectItem>
                  <SelectItem value="inactive">
                    <div className="flex items-center gap-2">
                      <XCircle className="h-4 w-4 text-red-500" />
                      Inativos
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Filtro por Nível de Estoque */}
            <div>
              <label className="text-sm font-medium mb-2 block">
                Nível de Estoque
              </label>
              <Select value={stockFilter} onValueChange={(value) => updateFilter('stockFilter', value as StockFilter)}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="critical">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-red-500" />
                      Crítico (0)
                    </div>
                  </SelectItem>
                  <SelectItem value="low">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-orange-500" />
                      Baixo ({'<='} mínimo)
                    </div>
                  </SelectItem>
                  <SelectItem value="ok">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-green-500" />
                      OK ({'>'} mínimo)
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Contador de resultados */}
          <div className="text-sm text-muted-foreground pt-2 border-t">
            Mostrando <span className="font-semibold">{filteredAndSortedProducts.length}</span> de{' '}
            <span className="font-semibold">{products.length}</span> produtos
          </div>
        </CardContent>
      </Card>
      </NoPrint>

      {/* Tabela de Produtos */}
      {loading ? (
        viewMode === 'table' ? <TableSkeleton rows={10} columns={8} /> : <GridSkeleton items={8} />
      ) : error ? (
        <EmptyState
          icon={AlertTriangle}
          title="Erro ao carregar produtos"
          description={error}
          action={{
            label: "Tentar Novamente",
            onClick: loadProducts
          }}
        />
      ) : filteredAndSortedProducts.length === 0 ? (
        <EmptyState
          icon={Package}
          title="Nenhum produto encontrado"
          description={hasActiveFilters ? "Nenhum produto corresponde aos filtros selecionados. Tente ajustar os filtros." : "Você ainda não cadastrou nenhum produto. Comece criando seu primeiro produto!"}
          action={!hasActiveFilters ? {
            label: "Criar Primeiro Produto",
            onClick: () => setCreateModalOpen(true)
          } : undefined}
        />
      ) : (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Lista de Produtos ({filteredAndSortedProducts.length})</CardTitle>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Itens por página:</span>
                <Select value={itemsPerPage.toString()} onValueChange={handleItemsPerPageChange}>
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Visualização em Tabela */}
            {viewMode === 'table' && (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3">
                        <span className="font-semibold text-sm">SKU</span>
                      </th>
                      <th className="text-left p-3">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="hover:bg-transparent p-0 h-auto font-semibold text-sm"
                          onClick={() => handleSort('name')}
                        >
                          Produto
                          {sortField === 'name' && (
                            sortOrder === 'asc' ? <ArrowUp className="ml-2 h-3 w-3" /> : <ArrowDown className="ml-2 h-3 w-3" />
                          )}
                          {sortField !== 'name' && <ArrowUpDown className="ml-2 h-3 w-3 opacity-50" />}
                        </Button>
                      </th>
                      <th className="text-left p-3">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="hover:bg-transparent p-0 h-auto font-semibold text-sm"
                          onClick={() => handleSort('category')}
                        >
                          Categoria
                          {sortField === 'category' && (
                            sortOrder === 'asc' ? <ArrowUp className="ml-2 h-3 w-3" /> : <ArrowDown className="ml-2 h-3 w-3" />
                          )}
                          {sortField !== 'category' && <ArrowUpDown className="ml-2 h-3 w-3 opacity-50" />}
                        </Button>
                      </th>
                      <th className="text-right p-3">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="hover:bg-transparent p-0 h-auto font-semibold text-sm"
                          onClick={() => handleSort('stock_quantity')}
                        >
                          Estoque
                          {sortField === 'stock_quantity' && (
                            sortOrder === 'asc' ? <ArrowUp className="ml-2 h-3 w-3" /> : <ArrowDown className="ml-2 h-3 w-3" />
                          )}
                          {sortField !== 'stock_quantity' && <ArrowUpDown className="ml-2 h-3 w-3 opacity-50" />}
                        </Button>
                      </th>
                      <th className="text-right p-3 font-semibold text-sm">Mínimo</th>
                      <th className="text-right p-3">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="hover:bg-transparent p-0 h-auto font-semibold text-sm"
                          onClick={() => handleSort('sale_price')}
                        >
                          Preço
                          {sortField === 'sale_price' && (
                            sortOrder === 'asc' ? <ArrowUp className="ml-2 h-3 w-3" /> : <ArrowDown className="ml-2 h-3 w-3" />
                          )}
                          {sortField !== 'sale_price' && <ArrowUpDown className="ml-2 h-3 w-3 opacity-50" />}
                        </Button>
                      </th>
                      <th className="text-center p-3 font-semibold text-sm">Estoque</th>
                      <th className="text-center p-3 font-semibold text-sm">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedProducts.map((product) => (
                    <tr key={product.id} className="border-b hover:bg-muted/50 transition-colors">
                      <td className="p-3">
                        <span className="font-mono text-sm">{product.sku || '-'}</span>
                      </td>
                      <td className="p-3">
                        <span className="font-medium">{product.name}</span>
                      </td>
                      <td className="p-3">
                        <span className="text-sm text-muted-foreground">{product.category || '-'}</span>
                      </td>
                      <td className="p-3 text-right">
                        <span className={`font-semibold ${product.stock_quantity <= product.min_stock_level ? 'text-red-600' : 'text-green-600'}`}>
                          {product.stock_quantity} {product.unit || 'un'}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <span className="text-sm text-muted-foreground">{product.min_stock_level} {product.unit || 'un'}</span>
                      </td>
                      <td className="p-3 text-right">
                        <span className="font-semibold">
                          R$ {product.sale_price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        {getStatusBadge(product)}
                      </td>
                      <td className="p-3">
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleView(product)}
                            title="Visualizar detalhes"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(product)}
                            title="Editar produto"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleAdjustStock(product)}
                            title="Ajustar estoque"
                            className="text-blue-600 hover:bg-blue-50"
                          >
                            <PackagePlus className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:bg-destructive/10"
                            onClick={() => handleDelete(product)}
                            title="Excluir produto"
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
            )}

            {/* Visualização em Grid */}
            {viewMode === 'grid' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {paginatedProducts.map((product) => (
                  <Card key={product.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-base line-clamp-2">{product.name}</CardTitle>
                          {product.sku && (
                            <p className="text-xs text-muted-foreground font-mono mt-1">{product.sku}</p>
                          )}
                        </div>
                        {getStatusBadge(product)}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {/* Categoria */}
                      {product.category && (
                        <div className="flex items-center gap-2">
                          <Package className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{product.category}</span>
                        </div>
                      )}

                      {/* Preço */}
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Preço</span>
                        <span className="text-lg font-bold">
                          R$ {product.sale_price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                      </div>

                      {/* Estoque */}
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Estoque</span>
                        <span className={`text-sm font-semibold ${product.stock_quantity <= product.min_stock_level ? 'text-red-600' : 'text-green-600'}`}>
                          {product.stock_quantity} {product.unit || 'un'}
                        </span>
                      </div>

                      {/* Mínimo */}
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">Mínimo</span>
                        <span className="text-xs text-muted-foreground">
                          {product.min_stock_level} {product.unit || 'un'}
                        </span>
                      </div>

                      {/* Ações */}
                      <div className="flex gap-1 pt-2 border-t">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="flex-1"
                          onClick={() => handleView(product)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="flex-1"
                          onClick={() => handleEdit(product)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="flex-1 text-blue-600"
                          onClick={() => handleAdjustStock(product)}
                        >
                          <PackagePlus className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="flex-1 text-destructive"
                          onClick={() => handleDelete(product)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Controles de Paginação */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6 pt-4 border-t">
                <div className="text-sm text-muted-foreground">
                  Mostrando {startIndex + 1} a {Math.min(endIndex, filteredAndSortedProducts.length)} de {filteredAndSortedProducts.length} produtos
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => goToPage(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Anterior
                  </Button>
                  <div className="flex gap-1">
                    {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      return (
                        <Button
                          key={pageNum}
                          variant={currentPage === pageNum ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => goToPage(pageNum)}
                          className="w-10"
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => goToPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    Próxima
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Modais */}
      <CreateProductModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        onSuccess={loadProducts}
      />

      <EditProductModal
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        product={selectedProduct}
        onSuccess={loadProducts}
      />

      <ProductDetailsModal
        open={detailsModalOpen}
        onOpenChange={setDetailsModalOpen}
        product={selectedProduct}
        onEdit={handleEditFromDetails}
        onDelete={handleDeleteFromDetails}
        onAdjustStock={handleAdjustStockFromDetails}
      />

      <AdjustStockModal
        open={adjustStockModalOpen}
        onOpenChange={setAdjustStockModalOpen}
        product={selectedProduct}
        onSuccess={handleAdjustStockSuccess}
      />

      {ConfirmDialog}
      </div>
    </PrintLayout>
  );
};

export default ProdutosPage;
