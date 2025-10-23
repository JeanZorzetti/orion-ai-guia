import React from 'react';
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
  FileText
} from 'lucide-react';

const InventarioPage: React.FC = () => {
  const inventarios = [
    {
      id: 1,
      codigo: 'INV-2024-001',
      data: '2024-01-15',
      responsavel: 'João Silva',
      status: 'concluido',
      itensContados: 45,
      diferencas: 2,
    },
    {
      id: 2,
      codigo: 'INV-2024-002',
      data: '2024-01-10',
      responsavel: 'Maria Santos',
      status: 'em_andamento',
      itensContados: 23,
      diferencas: 0,
    },
    {
      id: 3,
      codigo: 'INV-2023-012',
      data: '2023-12-20',
      responsavel: 'Pedro Costa',
      status: 'concluido',
      itensContados: 50,
      diferencas: 5,
    },
  ];

  const produtosContagem = [
    { produto: 'Produto A', codigo: 'PRD-001', esperado: 50, contado: 48, diferenca: -2, status: 'diferenca' },
    { produto: 'Produto B', codigo: 'PRD-002', esperado: 100, contado: 100, diferenca: 0, status: 'ok' },
    { produto: 'Produto C', codigo: 'PRD-003', esperado: 45, contado: 45, diferenca: 0, status: 'ok' },
    { produto: 'Produto D', codigo: 'PRD-004', esperado: 30, contado: 32, diferenca: 2, status: 'diferenca' },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'concluido':
        return <Badge className="bg-green-500">Concluído</Badge>;
      case 'em_andamento':
        return <Badge className="bg-blue-500">Em Andamento</Badge>;
      case 'pendente':
        return <Badge variant="outline">Pendente</Badge>;
      default:
        return <Badge variant="outline">-</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'concluido':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'em_andamento':
        return <Clock className="h-4 w-4 text-blue-500" />;
      case 'pendente':
        return <AlertCircle className="h-4 w-4 text-orange-500" />;
      default:
        return null;
    }
  };

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
        <Button size="lg">
          <Plus className="mr-2 h-4 w-4" />
          Novo Inventário
        </Button>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inventários</CardTitle>
            <FileText className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inventarios.length}</div>
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
              {inventarios.filter(i => i.status === 'em_andamento').length}
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
              {inventarios.filter(i => i.status === 'concluido').length}
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
              {inventarios.reduce((sum, i) => sum + i.diferencas, 0)}
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
                placeholder="Buscar por código, responsável..."
                className="pl-10"
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
          <CardTitle>Histórico de Inventários ({inventarios.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3 font-semibold text-sm">Código</th>
                  <th className="text-left p-3 font-semibold text-sm">Data</th>
                  <th className="text-left p-3 font-semibold text-sm">Responsável</th>
                  <th className="text-right p-3 font-semibold text-sm">Itens Contados</th>
                  <th className="text-right p-3 font-semibold text-sm">Diferenças</th>
                  <th className="text-center p-3 font-semibold text-sm">Status</th>
                  <th className="text-center p-3 font-semibold text-sm">Ações</th>
                </tr>
              </thead>
              <tbody>
                {inventarios.map((inv) => (
                  <tr key={inv.id} className="border-b hover:bg-muted/50 transition-colors">
                    <td className="p-3">
                      <span className="font-mono font-medium">{inv.codigo}</span>
                    </td>
                    <td className="p-3">
                      <span className="text-sm">{inv.data}</span>
                    </td>
                    <td className="p-3">
                      <span className="text-sm">{inv.responsavel}</span>
                    </td>
                    <td className="p-3 text-right">
                      <span className="font-semibold">{inv.itensContados}</span>
                    </td>
                    <td className="p-3 text-right">
                      <span className={`font-semibold ${inv.diferencas > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                        {inv.diferencas}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {getStatusIcon(inv.status)}
                        {getStatusBadge(inv.status)}
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center justify-center gap-2">
                        <Button variant="outline" size="sm">
                          Ver Detalhes
                        </Button>
                        {inv.status === 'em_andamento' && (
                          <Button size="sm">
                            Continuar
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Último Inventário - Produtos com Diferença */}
      <Card className="border-orange-200 dark:border-orange-900">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-orange-500" />
            <CardTitle>Produtos com Diferença - INV-2024-001</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3 font-semibold text-sm">Produto</th>
                  <th className="text-right p-3 font-semibold text-sm">Esperado</th>
                  <th className="text-right p-3 font-semibold text-sm">Contado</th>
                  <th className="text-right p-3 font-semibold text-sm">Diferença</th>
                  <th className="text-center p-3 font-semibold text-sm">Status</th>
                </tr>
              </thead>
              <tbody>
                {produtosContagem.map((prod, index) => (
                  <tr key={index} className={`border-b ${prod.status === 'diferenca' ? 'bg-orange-50 dark:bg-orange-950/20' : ''}`}>
                    <td className="p-3">
                      <div>
                        <p className="font-medium">{prod.produto}</p>
                        <p className="text-xs text-muted-foreground font-mono">{prod.codigo}</p>
                      </div>
                    </td>
                    <td className="p-3 text-right">
                      <span className="text-sm">{prod.esperado}</span>
                    </td>
                    <td className="p-3 text-right">
                      <span className="text-sm font-semibold">{prod.contado}</span>
                    </td>
                    <td className="p-3 text-right">
                      <span className={`font-semibold ${prod.diferenca !== 0 ? 'text-orange-600' : 'text-green-600'}`}>
                        {prod.diferenca > 0 ? '+' : ''}{prod.diferenca}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      {prod.status === 'ok' ? (
                        <Badge className="bg-green-500">OK</Badge>
                      ) : (
                        <Badge className="bg-orange-500">Diferença</Badge>
                      )}
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

export default InventarioPage;
