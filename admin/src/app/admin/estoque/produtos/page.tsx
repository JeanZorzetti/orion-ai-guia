'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
  Trash2
} from 'lucide-react';
import { productService } from '@/services/product';
import { Product } from '@/types';

const ProdutosPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [lowStockFilter, setLowStockFilter] = useState(false);

  useEffect(() => {
    loadProducts();
  }, [lowStockFilter]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await productService.getAll({
        search: searchTerm || undefined,
        low_stock: lowStockFilter,
        active_only: true,
        limit: 100
      });
      setProducts(data);
    } catch (err) {
      const error = err as Error;
      setError(error.message || 'Erro ao carregar produtos');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    loadProducts();
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir este produto?')) return;

    try {
      await productService.delete(id);
      loadProducts();
    } catch (err) {
      const error = err as Error;
      alert(error.message || 'Erro ao excluir produto');
    }
  };

  const totalProducts = products.length;
  const lowStockProducts = products.filter(p => p.stock_quantity <= p.min_stock_level).length;
  const criticalStockProducts = products.filter(p => p.stock_quantity === 0).length;
  const okStockProducts = products.filter(p => p.stock_quantity > p.min_stock_level).length;

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

  return (
    <div className="space-y-6">
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
        <Button size="lg">
          <Plus className="mr-2 h-4 w-4" />
          Novo Produto
        </Button>
      </div>

      {/* Estatísticas */}
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

      {/* Filtros e Busca */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Buscar por nome ou SKU..."
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
            <Button
              variant={lowStockFilter ? 'default' : 'outline'}
              onClick={() => setLowStockFilter(!lowStockFilter)}
            >
              <Filter className="mr-2 h-4 w-4" />
              {lowStockFilter ? 'Mostrando Baixo Estoque' : 'Filtrar Baixo Estoque'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de Produtos */}
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
            <Button variant="outline" onClick={loadProducts} className="mt-4">
              Tentar Novamente
            </Button>
          </CardContent>
        </Card>
      ) : products.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              Nenhum produto encontrado.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Lista de Produtos ({products.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 font-semibold text-sm">SKU</th>
                    <th className="text-left p-3 font-semibold text-sm">Produto</th>
                    <th className="text-left p-3 font-semibold text-sm">Categoria</th>
                    <th className="text-right p-3 font-semibold text-sm">Estoque</th>
                    <th className="text-right p-3 font-semibold text-sm">Mínimo</th>
                    <th className="text-right p-3 font-semibold text-sm">Preço</th>
                    <th className="text-center p-3 font-semibold text-sm">Status</th>
                    <th className="text-center p-3 font-semibold text-sm">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => (
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
                          {product.stock_quantity} {product.unit}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <span className="text-sm text-muted-foreground">{product.min_stock_level} {product.unit}</span>
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
                          <Link href={`/admin/estoque/produtos/${product.id}`}>
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:bg-destructive/10"
                            onClick={() => handleDelete(product.id)}
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
    </div>
  );
};

export default ProdutosPage;
