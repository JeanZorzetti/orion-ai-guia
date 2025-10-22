import React from 'react';
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
  Eye
} from 'lucide-react';

const ProdutosPage: React.FC = () => {
  const produtos = [
    {
      id: 1,
      codigo: 'PRD-001',
      nome: 'Produto A - Eletrônico Premium',
      categoria: 'Eletrônicos',
      estoque: 5,
      minimo: 20,
      preco: 299.90,
      status: 'baixo',
    },
    {
      id: 2,
      codigo: 'PRD-002',
      nome: 'Produto B - Ferramenta Profissional',
      categoria: 'Ferramentas',
      estoque: 12,
      minimo: 50,
      preco: 149.50,
      status: 'baixo',
    },
    {
      id: 3,
      codigo: 'PRD-003',
      nome: 'Produto C - Material de Construção',
      categoria: 'Material',
      estoque: 45,
      minimo: 30,
      preco: 89.90,
      status: 'ok',
    },
    {
      id: 4,
      codigo: 'PRD-004',
      nome: 'Produto D - Consumível Industrial',
      categoria: 'Consumíveis',
      estoque: 3,
      minimo: 15,
      preco: 25.00,
      status: 'critico',
    },
    {
      id: 5,
      codigo: 'PRD-005',
      nome: 'Produto E - Acessório Automotivo',
      categoria: 'Automotivo',
      estoque: 120,
      minimo: 50,
      preco: 199.00,
      status: 'ok',
    },
  ];

  const estatisticas = [
    { label: 'Total de Produtos', valor: produtos.length, icon: Package, color: 'text-blue-500' },
    { label: 'Baixo Estoque', valor: produtos.filter(p => p.status === 'baixo').length, icon: AlertTriangle, color: 'text-orange-500' },
    { label: 'Estoque Crítico', valor: produtos.filter(p => p.status === 'critico').length, icon: AlertTriangle, color: 'text-red-500' },
    { label: 'Em Estoque OK', valor: produtos.filter(p => p.status === 'ok').length, icon: TrendingUp, color: 'text-green-500' },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'critico':
        return <Badge variant="destructive">Crítico</Badge>;
      case 'baixo':
        return <Badge className="bg-orange-500">Baixo</Badge>;
      case 'ok':
        return <Badge className="bg-green-500">OK</Badge>;
      default:
        return <Badge variant="outline">-</Badge>;
    }
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
                placeholder="Buscar por nome, código ou categoria..."
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

      {/* Tabela de Produtos */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Produtos ({produtos.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3 font-semibold text-sm">Código</th>
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
                {produtos.map((produto) => (
                  <tr key={produto.id} className="border-b hover:bg-muted/50 transition-colors">
                    <td className="p-3">
                      <span className="font-mono text-sm">{produto.codigo}</span>
                    </td>
                    <td className="p-3">
                      <span className="font-medium">{produto.nome}</span>
                    </td>
                    <td className="p-3">
                      <span className="text-sm text-muted-foreground">{produto.categoria}</span>
                    </td>
                    <td className="p-3 text-right">
                      <span className={`font-semibold ${produto.estoque < produto.minimo ? 'text-red-600' : 'text-green-600'}`}>
                        {produto.estoque}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <span className="text-sm text-muted-foreground">{produto.minimo}</span>
                    </td>
                    <td className="p-3 text-right">
                      <span className="font-semibold">
                        R$ {produto.preco.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      {getStatusBadge(produto.status)}
                    </td>
                    <td className="p-3">
                      <div className="flex items-center justify-center gap-2">
                        <Link href={`/admin/estoque/produtos/${produto.id}`}>
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
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
    </div>
  );
};

export default ProdutosPage;
