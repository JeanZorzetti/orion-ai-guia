import React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Package,
  AlertTriangle,
  TrendingUp,
  BarChart3,
  ShoppingCart,
  ArrowRight,
  Boxes
} from 'lucide-react';

const EstoquePage: React.FC = () => {
  const resumoEstoque = {
    totalProdutos: 342,
    produtosBaixoEstoque: 12,
    valorTotal: 125480.00,
    movimentacoesMes: 87,
  };

  const produtosBaixoEstoque = [
    { id: 1, nome: 'Produto A', codigo: 'PRD-001', estoque: 5, minimo: 20, categoria: 'Eletrônicos' },
    { id: 2, nome: 'Produto B', codigo: 'PRD-002', estoque: 12, minimo: 50, categoria: 'Ferramentas' },
    { id: 3, nome: 'Produto C', codigo: 'PRD-003', estoque: 8, minimo: 30, categoria: 'Material' },
    { id: 4, nome: 'Produto D', codigo: 'PRD-004', estoque: 3, minimo: 15, categoria: 'Consumíveis' },
  ];

  const modulosEstoque = [
    {
      titulo: 'Produtos',
      descricao: 'Cadastro e gerenciamento de produtos',
      icon: Package,
      href: '/admin/estoque/produtos',
      color: 'text-blue-500',
      bgColor: 'bg-blue-50 dark:bg-blue-950/20',
    },
    {
      titulo: 'Movimentações',
      descricao: 'Entrada e saída de mercadorias',
      icon: TrendingUp,
      href: '/admin/estoque/movimentacoes',
      color: 'text-green-500',
      bgColor: 'bg-green-50 dark:bg-green-950/20',
    },
    {
      titulo: 'Inventário',
      descricao: 'Controle e conferência de estoque',
      icon: Boxes,
      href: '/admin/estoque/inventario',
      color: 'text-purple-500',
      bgColor: 'bg-purple-50 dark:bg-purple-950/20',
    },
    {
      titulo: 'Relatórios',
      descricao: 'Análises e demonstrativos de estoque',
      icon: BarChart3,
      href: '/admin/estoque/relatorios',
      color: 'text-orange-500',
      bgColor: 'bg-orange-50 dark:bg-orange-950/20',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Gestão de Estoque</h1>
          <p className="text-muted-foreground mt-1">
            Controle completo do inventário da sua empresa
          </p>
        </div>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Produtos</CardTitle>
            <Package className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{resumoEstoque.totalProdutos}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Itens cadastrados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alerta de Estoque</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {resumoEstoque.produtosBaixoEstoque}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Produtos abaixo do mínimo
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor em Estoque</CardTitle>
            <ShoppingCart className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              R$ {resumoEstoque.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Valor total do inventário
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Movimentações</CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{resumoEstoque.movimentacoesMes}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Este mês
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Produtos com Baixo Estoque */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            <CardTitle>Produtos com Baixo Estoque</CardTitle>
          </div>
          <Link
            href="/admin/estoque/produtos"
            className="text-sm text-primary hover:underline"
          >
            Ver todos os produtos
          </Link>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {produtosBaixoEstoque.map((produto) => (
              <div
                key={produto.id}
                className="flex items-center justify-between p-4 rounded-lg bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-900"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-semibold">{produto.nome}</p>
                    <Badge variant="outline" className="text-xs">
                      {produto.codigo}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Categoria: {produto.categoria} • Mínimo: {produto.minimo} unidades
                  </p>
                </div>
                <div className="text-right">
                  <Badge variant="destructive" className="text-sm">
                    {produto.estoque} em estoque
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Módulos de Estoque */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Módulos de Estoque</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {modulosEstoque.map((modulo) => (
            <Link key={modulo.href} href={modulo.href}>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-lg ${modulo.bgColor}`}>
                      <modulo.icon className={`h-6 w-6 ${modulo.color}`} />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-1">{modulo.titulo}</h3>
                      <p className="text-sm text-muted-foreground">{modulo.descricao}</p>
                    </div>
                    <ArrowRight className="h-5 w-5 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default EstoquePage;
