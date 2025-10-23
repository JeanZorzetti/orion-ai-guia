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
  FileSpreadsheet
} from 'lucide-react';

const RelatoriosEstoquePage: React.FC = () => {
  const relatorios = [
    {
      titulo: 'Posição de Estoque',
      descricao: 'Listagem completa de produtos e quantidades',
      icon: Package,
      color: 'text-blue-500',
      bgColor: 'bg-blue-50 dark:bg-blue-950/20',
      periodo: 'Atualizado em tempo real',
    },
    {
      titulo: 'Movimentações Consolidadas',
      descricao: 'Entradas e saídas detalhadas por período',
      icon: TrendingUp,
      color: 'text-green-500',
      bgColor: 'bg-green-50 dark:bg-green-950/20',
      periodo: 'Personalizado',
    },
    {
      titulo: 'Produtos Abaixo do Mínimo',
      descricao: 'Alertas de estoque baixo e crítico',
      icon: AlertTriangle,
      color: 'text-orange-500',
      bgColor: 'bg-orange-50 dark:bg-orange-950/20',
      periodo: 'Atualizado em tempo real',
    },
    {
      titulo: 'Análise de Giro de Estoque',
      descricao: 'Velocidade de movimentação dos produtos',
      icon: BarChart3,
      color: 'text-purple-500',
      bgColor: 'bg-purple-50 dark:bg-purple-950/20',
      periodo: 'Mensal',
    },
    {
      titulo: 'Valor de Estoque',
      descricao: 'Valor total em estoque por categoria',
      icon: PieChart,
      color: 'text-cyan-500',
      bgColor: 'bg-cyan-50 dark:bg-cyan-950/20',
      periodo: 'Atualizado em tempo real',
    },
    {
      titulo: 'Inventário Físico',
      descricao: 'Relatório de contagens e divergências',
      icon: FileText,
      color: 'text-indigo-500',
      bgColor: 'bg-indigo-50 dark:bg-indigo-950/20',
      periodo: 'Por inventário',
    },
  ];

  const relatoriosRecentes = [
    { nome: 'Posicao_Estoque_Janeiro_2024.pdf', data: '15/01/2024', tamanho: '342 KB' },
    { nome: 'Movimentacoes_Dezembro_2023.xlsx', data: '05/01/2024', tamanho: '198 KB' },
    { nome: 'Alerta_Estoque_Baixo_Janeiro_2024.pdf', data: '10/01/2024', tamanho: '124 KB' },
  ];

  const estatisticas = [
    { label: 'Produtos Cadastrados', valor: '342', icon: Package, color: 'text-blue-500' },
    { label: 'Valor Total', valor: 'R$ 125.480', icon: TrendingUp, color: 'text-green-500' },
    { label: 'Itens Baixo Estoque', valor: '12', icon: AlertTriangle, color: 'text-orange-500' },
  ];

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
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

      {/* Tipos de Relatórios */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Gerar Relatório</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {relatorios.map((relatorio, index) => (
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
                  <Button variant="outline" className="flex-1" size="sm">
                    <FileText className="mr-2 h-3 w-3" />
                    PDF
                  </Button>
                  <Button variant="outline" className="flex-1" size="sm">
                    <FileSpreadsheet className="mr-2 h-3 w-3" />
                    Excel
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Relatórios Recentes */}
      <Card>
        <CardHeader>
          <CardTitle>Relatórios Gerados Recentemente</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {relatoriosRecentes.map((rel, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-purple-50 dark:bg-purple-950/20">
                    <FileText className="h-5 w-5 text-purple-500" />
                  </div>
                  <div>
                    <p className="font-medium">{rel.nome}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-muted-foreground">{rel.data}</span>
                      <span className="text-xs text-muted-foreground">•</span>
                      <span className="text-xs text-muted-foreground">{rel.tamanho}</span>
                    </div>
                  </div>
                </div>
                <Button variant="outline" size="sm">
                  <Download className="mr-2 h-3 w-3" />
                  Download
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Dica */}
      <Card className="border-purple-200 dark:border-purple-900 bg-purple-50/50 dark:bg-purple-950/20">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Package className="h-5 w-5 text-purple-500" />
            <CardTitle>Dica</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Configure alertas automáticos para receber relatórios de estoque baixo por e-mail.
            Acesse <span className="font-semibold text-foreground">Configurações → Notificações</span> para ativar.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default RelatoriosEstoquePage;
