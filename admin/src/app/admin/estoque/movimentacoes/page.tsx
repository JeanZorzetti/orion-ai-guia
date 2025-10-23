import React from 'react';
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
  User
} from 'lucide-react';

const MovimentacoesPage: React.FC = () => {
  const movimentacoes = [
    {
      id: 1,
      data: '2024-01-15',
      tipo: 'entrada',
      produto: 'Produto A - Eletrônico Premium',
      codigo: 'PRD-001',
      quantidade: 50,
      usuario: 'João Silva',
      observacao: 'Compra do fornecedor ABC',
    },
    {
      id: 2,
      data: '2024-01-15',
      tipo: 'saida',
      produto: 'Produto B - Ferramenta Profissional',
      codigo: 'PRD-002',
      quantidade: 15,
      usuario: 'Maria Santos',
      observacao: 'Venda NF-1234',
    },
    {
      id: 3,
      data: '2024-01-14',
      tipo: 'entrada',
      produto: 'Produto C - Material de Construção',
      codigo: 'PRD-003',
      quantidade: 100,
      usuario: 'João Silva',
      observacao: 'Reposição de estoque',
    },
    {
      id: 4,
      data: '2024-01-14',
      tipo: 'saida',
      produto: 'Produto D - Consumível Industrial',
      codigo: 'PRD-004',
      quantidade: 8,
      usuario: 'Pedro Costa',
      observacao: 'Uso interno - Produção',
    },
    {
      id: 5,
      data: '2024-01-13',
      tipo: 'entrada',
      produto: 'Produto E - Acessório Automotivo',
      codigo: 'PRD-005',
      quantidade: 30,
      usuario: 'Maria Santos',
      observacao: 'Transferência entre filiais',
    },
    {
      id: 6,
      data: '2024-01-13',
      tipo: 'saida',
      produto: 'Produto A - Eletrônico Premium',
      codigo: 'PRD-001',
      quantidade: 5,
      usuario: 'João Silva',
      observacao: 'Venda NF-1235',
    },
  ];

  const resumo = {
    totalEntradas: movimentacoes.filter(m => m.tipo === 'entrada').reduce((sum, m) => sum + m.quantidade, 0),
    totalSaidas: movimentacoes.filter(m => m.tipo === 'saida').reduce((sum, m) => sum + m.quantidade, 0),
    movimentacoesMes: movimentacoes.length,
  };

  const getStatusBadge = (tipo: string) => {
    if (tipo === 'entrada') {
      return <Badge className="bg-green-500">Entrada</Badge>;
    }
    return <Badge className="bg-red-500">Saída</Badge>;
  };

  const getStatusIcon = (tipo: string) => {
    if (tipo === 'entrada') {
      return <TrendingUp className="h-4 w-4 text-green-500" />;
    }
    return <TrendingDown className="h-4 w-4 text-red-500" />;
  };

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
        <Button size="lg">
          <Plus className="mr-2 h-4 w-4" />
          Nova Movimentação
        </Button>
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
              {resumo.totalEntradas}
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
              {resumo.totalSaidas}
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
              {resumo.movimentacoesMes}
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
          <CardTitle>Histórico de Movimentações ({movimentacoes.length})</CardTitle>
        </CardHeader>
        <CardContent>
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
                {movimentacoes.map((mov) => (
                  <tr key={mov.id} className="border-b hover:bg-muted/50 transition-colors">
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{mov.data}</span>
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(mov.tipo)}
                        {getStatusBadge(mov.tipo)}
                      </div>
                    </td>
                    <td className="p-3">
                      <div>
                        <p className="font-medium">{mov.produto}</p>
                        <p className="text-xs text-muted-foreground font-mono">{mov.codigo}</p>
                      </div>
                    </td>
                    <td className="p-3 text-right">
                      <span className={`font-semibold ${mov.tipo === 'entrada' ? 'text-green-600' : 'text-red-600'}`}>
                        {mov.tipo === 'entrada' ? '+' : '-'}{mov.quantidade}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{mov.usuario}</span>
                      </div>
                    </td>
                    <td className="p-3">
                      <span className="text-sm text-muted-foreground">{mov.observacao}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MovimentacoesPage;
