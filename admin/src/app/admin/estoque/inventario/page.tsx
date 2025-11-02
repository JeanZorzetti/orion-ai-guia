'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Boxes,
  Search,
  Plus,
  Filter,
  CheckCircle,
  AlertCircle,
  Clock,
  FileText,
  RefreshCw
} from 'lucide-react';
import { useInventoryCycleCount } from '@/hooks/useInventoryCycleCount';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const InventarioPage: React.FC = () => {
  const {
    counts,
    summary,
    loading,
    error,
    refresh
  } = useInventoryCycleCount();

  const [searchTerm, setSearchTerm] = useState('');

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-500">Concluído</Badge>;
      case 'in_progress':
        return <Badge className="bg-blue-500">Em Andamento</Badge>;
      case 'pending':
        return <Badge variant="outline">Pendente</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Cancelado</Badge>;
      default:
        return <Badge variant="outline">-</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'in_progress':
        return <Clock className="h-4 w-4 text-blue-500" />;
      case 'pending':
        return <AlertCircle className="h-4 w-4 text-orange-500" />;
      default:
        return null;
    }
  };

  // Filtrar contagens localmente
  const filteredCounts = counts.filter(count => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      count.code.toLowerCase().includes(search) ||
      count.name.toLowerCase().includes(search) ||
      count.responsible_user_name.toLowerCase().includes(search)
    );
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2 text-blue-500" />
          <p className="text-muted-foreground">Carregando inventários...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-500 mb-2">Erro ao carregar inventários</p>
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
            <Boxes className="h-8 w-8 text-purple-500" />
            Inventário
          </h1>
          <p className="text-muted-foreground mt-1">
            Controle e conferência de estoque
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={refresh}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Atualizar
          </Button>
          <Button size="lg">
            <Plus className="mr-2 h-4 w-4" />
            Novo Inventário
          </Button>
        </div>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inventários</CardTitle>
            <FileText className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.total_counts || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Total realizados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Em Andamento</CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {summary?.in_progress || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Aguardando conclusão
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Concluídos</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {summary?.completed || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Este mês
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Diferenças</CardTitle>
            <AlertCircle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {summary?.total_discrepancies || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Itens com divergência
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
                placeholder="Buscar por código, nome ou responsável..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button variant="outline">
              <Filter className="mr-2 h-4 w-4" />
              Filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de Inventários */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Inventários ({filteredCounts.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredCounts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Boxes className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Nenhum inventário encontrado</p>
              {searchTerm && (
                <p className="text-sm mt-1">Tente ajustar os filtros de busca</p>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 font-semibold text-sm">Código</th>
                    <th className="text-left p-3 font-semibold text-sm">Nome</th>
                    <th className="text-left p-3 font-semibold text-sm">Data</th>
                    <th className="text-left p-3 font-semibold text-sm">Responsável</th>
                    <th className="text-right p-3 font-semibold text-sm">Itens Contados</th>
                    <th className="text-right p-3 font-semibold text-sm">Diferenças</th>
                    <th className="text-center p-3 font-semibold text-sm">Status</th>
                    <th className="text-center p-3 font-semibold text-sm">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCounts.map((count) => (
                    <tr key={count.id} className="border-b hover:bg-muted/50 transition-colors">
                      <td className="p-3">
                        <span className="font-mono font-medium">{count.code}</span>
                      </td>
                      <td className="p-3">
                        <div>
                          <p className="font-medium">{count.name}</p>
                          {count.description && (
                            <p className="text-xs text-muted-foreground">{count.description}</p>
                          )}
                        </div>
                      </td>
                      <td className="p-3">
                        <span className="text-sm">
                          {count.completed_at
                            ? format(count.completed_at, 'dd/MM/yyyy', { locale: ptBR })
                            : count.started_at
                            ? format(count.started_at, 'dd/MM/yyyy', { locale: ptBR })
                            : count.scheduled_date
                            ? format(count.scheduled_date, 'dd/MM/yyyy', { locale: ptBR })
                            : format(count.created_at, 'dd/MM/yyyy', { locale: ptBR })}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className="text-sm">{count.responsible_user_name}</span>
                      </td>
                      <td className="p-3 text-right">
                        <span className="font-semibold">
                          {count.items_counted}/{count.total_items}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <span
                          className={`font-semibold ${
                            count.items_with_discrepancy > 0 ? 'text-orange-600' : 'text-green-600'
                          }`}
                        >
                          {count.items_with_discrepancy}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          {getStatusIcon(count.status)}
                          {getStatusBadge(count.status)}
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center justify-center gap-2">
                          <Button variant="outline" size="sm">
                            Ver Detalhes
                          </Button>
                          {count.status === 'in_progress' && (
                            <Button size="sm">Continuar</Button>
                          )}
                        </div>
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

export default InventarioPage;
