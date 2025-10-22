import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  TrendingUp,
  Search,
  Plus,
  Filter,
  Calendar,
  DollarSign,
  CheckCircle,
  Clock,
  AlertCircle
} from 'lucide-react';

const ContasAReceberPage: React.FC = () => {
  const contas = [
    {
      id: 1,
      cliente: 'Cliente ABC Ltda',
      documento: 'NF-1234',
      emissao: '2024-01-05',
      vencimento: '2024-01-20',
      valor: 5800.00,
      status: 'pendente',
      diasRestantes: 5,
    },
    {
      id: 2,
      cliente: 'Empresa XYZ S.A.',
      documento: 'NF-1235',
      emissao: '2024-01-10',
      vencimento: '2024-02-10',
      valor: 12500.00,
      status: 'pendente',
      diasRestantes: 26,
    },
    {
      id: 3,
      cliente: 'Comércio 123',
      documento: 'NF-1236',
      emissao: '2023-12-20',
      vencimento: '2024-01-10',
      valor: 3200.00,
      status: 'vencido',
      diasRestantes: -5,
    },
    {
      id: 4,
      cliente: 'Indústria Tech',
      documento: 'NF-1237',
      emissao: '2024-01-12',
      vencimento: '2024-01-15',
      valor: 8950.00,
      status: 'recebido',
      diasRestantes: 0,
    },
  ];

  const resumo = {
    totalAReceber: contas.filter(c => c.status === 'pendente').reduce((sum, c) => sum + c.valor, 0),
    vencidosTotal: contas.filter(c => c.status === 'vencido').reduce((sum, c) => sum + c.valor, 0),
    recebidoMes: contas.filter(c => c.status === 'recebido').reduce((sum, c) => sum + c.valor, 0),
    qtdPendentes: contas.filter(c => c.status === 'pendente').length,
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pendente':
        return <Badge className="bg-blue-500">Pendente</Badge>;
      case 'vencido':
        return <Badge variant="destructive">Vencido</Badge>;
      case 'recebido':
        return <Badge className="bg-green-500">Recebido</Badge>;
      default:
        return <Badge variant="outline">-</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pendente':
        return <Clock className="h-4 w-4 text-blue-500" />;
      case 'vencido':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'recebido':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <TrendingUp className="h-8 w-8 text-green-500" />
            Contas a Receber
          </h1>
          <p className="text-muted-foreground mt-1">
            Gerencie recebimentos de clientes
          </p>
        </div>
        <Button size="lg">
          <Plus className="mr-2 h-4 w-4" />
          Nova Conta a Receber
        </Button>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total a Receber</CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              R$ {resumo.totalAReceber.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {resumo.qtdPendentes} contas pendentes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vencidos</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              R$ {resumo.vencidosTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Requer atenção
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recebido este Mês</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              R$ {resumo.recebidoMes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Janeiro 2024
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Próximos 30 dias</CardTitle>
            <Calendar className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              R$ {resumo.totalAReceber.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Previsão de recebimentos
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
                placeholder="Buscar por cliente, documento..."
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

      {/* Tabela de Contas */}
      <Card>
        <CardHeader>
          <CardTitle>Contas a Receber ({contas.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3 font-semibold text-sm">Cliente</th>
                  <th className="text-left p-3 font-semibold text-sm">Documento</th>
                  <th className="text-left p-3 font-semibold text-sm">Emissão</th>
                  <th className="text-left p-3 font-semibold text-sm">Vencimento</th>
                  <th className="text-right p-3 font-semibold text-sm">Valor</th>
                  <th className="text-center p-3 font-semibold text-sm">Status</th>
                  <th className="text-center p-3 font-semibold text-sm">Ações</th>
                </tr>
              </thead>
              <tbody>
                {contas.map((conta) => (
                  <tr key={conta.id} className="border-b hover:bg-muted/50 transition-colors">
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(conta.status)}
                        <span className="font-medium">{conta.cliente}</span>
                      </div>
                    </td>
                    <td className="p-3">
                      <span className="font-mono text-sm">{conta.documento}</span>
                    </td>
                    <td className="p-3">
                      <span className="text-sm text-muted-foreground">{conta.emissao}</span>
                    </td>
                    <td className="p-3">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">{conta.vencimento}</span>
                        {conta.status === 'pendente' && (
                          <span className="text-xs text-muted-foreground">
                            {conta.diasRestantes > 0 ? `em ${conta.diasRestantes} dias` : 'hoje'}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-3 text-right">
                      <span className="font-semibold text-green-600">
                        R$ {conta.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      {getStatusBadge(conta.status)}
                    </td>
                    <td className="p-3">
                      <div className="flex items-center justify-center gap-2">
                        <Button variant="outline" size="sm">
                          Ver Detalhes
                        </Button>
                        {conta.status === 'pendente' && (
                          <Button size="sm" className="bg-green-600 hover:bg-green-700">
                            Registrar Recebimento
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
    </div>
  );
};

export default ContasAReceberPage;
