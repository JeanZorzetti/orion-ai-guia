'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  TrendingUp,
  TrendingDown,
  Search,
  Plus,
  Filter,
  Calendar,
  Package,
  User,
  RefreshCw
} from 'lucide-react';
import { useStockMovements } from '@/hooks/useStockMovements';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const MovimentacoesPage: React.FC = () => {
  const {
    movements,
    summary,
    loading,
    error,
    refresh
  } = useStockMovements();

  const [searchTerm, setSearchTerm] = useState('');

  const getStatusBadge = (tipo: string) => {
    if (tipo === 'in') {
      return <Badge className="bg-green-500">Entrada</Badge>;
    }
    if (tipo === 'out') {
      return <Badge className="bg-red-500">Saída</Badge>;
    }
    return <Badge className="bg-blue-500">Correção</Badge>;
  };

  const getStatusIcon = (tipo: string) => {
    if (tipo === 'in') {
      return <TrendingUp className="h-4 w-4 text-green-500" />;
    }
    if (tipo === 'out') {
      return <TrendingDown className="h-4 w-4 text-red-500" />;
    }
    return <Package className="h-4 w-4 text-blue-500" />;
  };

  // Filtrar movimentações localmente
  const filteredMovements = movements.filter(mov => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      mov.product_name.toLowerCase().includes(search) ||
      mov.product_code.toLowerCase().includes(search) ||
      mov.user_name.toLowerCase().includes(search) ||
      mov.reason.toLowerCase().includes(search)
    );
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2 text-blue-500" />
          <p className="text-muted-foreground">Carregando movimentações...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-500 mb-2">Erro ao carregar movimentações</p>
          <p className="text-sm text-muted-foreground mb-4">{error}</p>
          <Button onClick={refresh}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Tentar Novamente
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <TrendingUp className="h-8 w-8 text-blue-500" />
            Movimentações de Estoque
          </h1>
          <p className="text-muted-foreground mt-1">
            Entrada e saída de mercadorias
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={refresh}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Atualizar
          </Button>
          <Button size="lg">
            <Plus className="mr-2 h-4 w-4" />
            Nova Movimentação
          </Button>
        </div>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Entradas</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {summary?.total_entries || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Unidades este mês
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Saídas</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {summary?.total_exits || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Unidades este mês
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Movimentações</CardTitle>
            <Package className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {summary?.total_movements || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Registros este mês
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros e Busca */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Buscar por produto, código ou usuário..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button variant="outline">
              <Filter className="mr-2 h-4 w-4" />
              Filtros
            </Button>
            <Button variant="outline">
              <Calendar className="mr-2 h-4 w-4" />
              Período
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de Movimentações */}
      <Card>
        <CardHeader>
          <CardTitle>
            Histórico de Movimentações ({filteredMovements.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredMovements.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Nenhuma movimentação encontrada</p>
              {searchTerm && (
                <p className="text-sm mt-1">Tente ajustar os filtros de busca</p>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 font-semibold text-sm">Data</th>
                    <th className="text-left p-3 font-semibold text-sm">Tipo</th>
                    <th className="text-left p-3 font-semibold text-sm">Produto</th>
                    <th className="text-right p-3 font-semibold text-sm">Quantidade</th>
                    <th className="text-left p-3 font-semibold text-sm">Usuário</th>
                    <th className="text-left p-3 font-semibold text-sm">Observação</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMovements.map((mov) => (
                    <tr key={mov.id} className="border-b hover:bg-muted/50 transition-colors">
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">
                            {format(mov.date, 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                          </span>
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(mov.type)}
                          {getStatusBadge(mov.type)}
                        </div>
                      </td>
                      <td className="p-3">
                        <div>
                          <p className="font-medium">{mov.product_name}</p>
                          <p className="text-xs text-muted-foreground font-mono">
                            {mov.product_code}
                          </p>
                        </div>
                      </td>
                      <td className="p-3 text-right">
                        <span className={`font-semibold ${
                          mov.type === 'in' ? 'text-green-600' :
                          mov.type === 'out' ? 'text-red-600' :
                          'text-blue-600'
                        }`}>
                          {mov.type === 'in' ? '+' : mov.type === 'out' ? '-' : ''}
                          {mov.quantity}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{mov.user_name}</span>
                        </div>
                      </td>
                      <td className="p-3">
                        <span className="text-sm text-muted-foreground">{mov.reason}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MovimentacoesPage;
