'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  BarChart3,
  Download,
  Package,
  TrendingUp,
  PieChart,
  AlertTriangle,
  FileText,
  FileSpreadsheet,
  RefreshCw
} from 'lucide-react';
import { useStockReports } from '@/hooks/useStockReports';

const RelatoriosEstoquePage: React.FC = () => {
  const {
    statistics,
    loading,
    error,
    refresh
  } = useStockReports();

  const relatoriosTipos = [
    {
      titulo: 'Posição de Estoque',
      descricao: 'Listagem completa de produtos e quantidades',
      icon: Package,
      color: 'text-blue-500',
      bgColor: 'bg-blue-50 dark:bg-blue-950/20',
      periodo: 'Atualizado em tempo real',
      endpoint: 'position'
    },
    {
      titulo: 'Movimentações Consolidadas',
      descricao: 'Entradas e saídas detalhadas por período',
      icon: TrendingUp,
      color: 'text-green-500',
      bgColor: 'bg-green-50 dark:bg-green-950/20',
      periodo: 'Personalizado',
      endpoint: 'movements'
    },
    {
      titulo: 'Produtos Abaixo do Mínimo',
      descricao: 'Alertas de estoque baixo e crítico',
      icon: AlertTriangle,
      color: 'text-orange-500',
      bgColor: 'bg-orange-50 dark:bg-orange-950/20',
      periodo: 'Atualizado em tempo real',
      endpoint: 'below-minimum'
    },
    {
      titulo: 'Análise de Giro de Estoque',
      descricao: 'Velocidade de movimentação dos produtos',
      icon: BarChart3,
      color: 'text-purple-500',
      bgColor: 'bg-purple-50 dark:bg-purple-950/20',
      periodo: 'Mensal',
      endpoint: 'turnover'
    },
    {
      titulo: 'Valor de Estoque',
      descricao: 'Valor total em estoque por categoria',
      icon: PieChart,
      color: 'text-cyan-500',
      bgColor: 'bg-cyan-50 dark:bg-cyan-950/20',
      periodo: 'Atualizado em tempo real',
      endpoint: 'value-by-category'
    },
    {
      titulo: 'Inventário Físico',
      descricao: 'Relatório de contagens e divergências',
      icon: FileText,
      color: 'text-indigo-500',
      bgColor: 'bg-indigo-50 dark:bg-indigo-950/20',
      periodo: 'Por inventário',
      endpoint: 'inventory-reports'
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2 text-purple-500" />
          <p className="text-muted-foreground">Carregando relatórios...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-500 mb-2">Erro ao carregar relatórios</p>
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
            <BarChart3 className="h-8 w-8 text-purple-500" />
            Relatórios de Estoque
          </h1>
          <p className="text-muted-foreground mt-1">
            Análises e demonstrativos de estoque
          </p>
        </div>
        <Button variant="outline" onClick={refresh}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Atualizar
        </Button>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Produtos Cadastrados</CardTitle>
            <Package className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-500">
              {statistics?.total_products || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">
              {new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL'
              }).format(statistics?.total_stock_value || 0)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Itens Baixo Estoque</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500">
              {statistics?.products_below_minimum || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tipos de Relatórios */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Gerar Relatório</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {relatoriosTipos.map((relatorio, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className={`p-3 rounded-lg ${relatorio.bgColor} w-fit mb-3`}>
                  <relatorio.icon className={`h-6 w-6 ${relatorio.color}`} />
                </div>
                <CardTitle className="text-base">{relatorio.titulo}</CardTitle>
                <CardDescription className="text-sm">
                  {relatorio.descricao}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Período:</span>
                  <span className="font-medium text-xs">{relatorio.periodo}</span>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    size="sm"
                    onClick={() => {
                      // TODO: Implementar geração de PDF
                      console.log('Gerar PDF:', relatorio.endpoint);
                    }}
                  >
                    <FileText className="mr-2 h-3 w-3" />
                    PDF
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1"
                    size="sm"
                    onClick={() => {
                      // TODO: Implementar geração de Excel
                      console.log('Gerar Excel:', relatorio.endpoint);
                    }}
                  >
                    <FileSpreadsheet className="mr-2 h-3 w-3" />
                    Excel
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Informação sobre relatórios */}
      <Card className="border-purple-200 dark:border-purple-900 bg-purple-50/50 dark:bg-purple-950/20">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Package className="h-5 w-5 text-purple-500" />
            <CardTitle>Sobre os Relatórios</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Todos os relatórios são gerados em tempo real com base nos dados mais recentes do sistema.
          </p>
          <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
            <li><strong>Posição de Estoque:</strong> Lista todos os produtos com quantidades atuais</li>
            <li><strong>Movimentações:</strong> Histórico de entradas e saídas no período selecionado</li>
            <li><strong>Abaixo do Mínimo:</strong> Produtos que precisam de reposição urgente</li>
            <li><strong>Giro de Estoque:</strong> Análise de velocidade de venda dos produtos</li>
            <li><strong>Valor por Categoria:</strong> Distribuição do investimento em estoque</li>
            <li><strong>Inventário Físico:</strong> Resumo das contagens físicas realizadas</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default RelatoriosEstoquePage;
