import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  FileText,
  Download,
  TrendingUp,
  PieChart,
  BarChart3,
  Calendar,
  DollarSign,
  FileSpreadsheet
} from 'lucide-react';

const RelatoriosFinanceirosPage: React.FC = () => {
  const relatorios = [
    {
      titulo: 'Demonstrativo de Resultados (DRE)',
      descricao: 'Receitas, despesas e lucro líquido do período',
      icon: TrendingUp,
      color: 'text-blue-500',
      bgColor: 'bg-blue-50 dark:bg-blue-950/20',
      periodo: 'Mensal',
    },
    {
      titulo: 'Fluxo de Caixa Consolidado',
      descricao: 'Entradas e saídas detalhadas por período',
      icon: BarChart3,
      color: 'text-green-500',
      bgColor: 'bg-green-50 dark:bg-green-950/20',
      periodo: 'Personalizado',
    },
    {
      titulo: 'Contas a Pagar - Resumo',
      descricao: 'Listagem completa de despesas pendentes e pagas',
      icon: FileSpreadsheet,
      color: 'text-red-500',
      bgColor: 'bg-red-50 dark:bg-red-950/20',
      periodo: 'Mensal',
    },
    {
      titulo: 'Contas a Receber - Resumo',
      descricao: 'Listagem completa de recebimentos pendentes e realizados',
      icon: FileSpreadsheet,
      color: 'text-green-500',
      bgColor: 'bg-green-50 dark:bg-green-950/20',
      periodo: 'Mensal',
    },
    {
      titulo: 'Análise por Categoria',
      descricao: 'Distribuição de receitas e despesas por categoria',
      icon: PieChart,
      color: 'text-purple-500',
      bgColor: 'bg-purple-50 dark:bg-purple-950/20',
      periodo: 'Trimestral',
    },
    {
      titulo: 'Relatório Anual',
      descricao: 'Consolidação de todas as movimentações do ano',
      icon: Calendar,
      color: 'text-orange-500',
      bgColor: 'bg-orange-50 dark:bg-orange-950/20',
      periodo: 'Anual',
    },
  ];

  const relatoriosRecentes = [
    { nome: 'DRE_Janeiro_2024.pdf', data: '15/01/2024', tamanho: '234 KB' },
    { nome: 'FluxoCaixa_Dezembro_2023.xlsx', data: '05/01/2024', tamanho: '156 KB' },
    { nome: 'ContasPagar_Janeiro_2024.pdf', data: '10/01/2024', tamanho: '189 KB' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <FileText className="h-8 w-8 text-purple-500" />
            Relatórios Financeiros
          </h1>
          <p className="text-muted-foreground mt-1">
            Análises e demonstrativos financeiros
          </p>
        </div>
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Relatórios Disponíveis</CardTitle>
            <FileText className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{relatorios.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Tipos de relatórios
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gerados este Mês</CardTitle>
            <Calendar className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{relatoriosRecentes.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Janeiro 2024
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Último Relatório</CardTitle>
            <Download className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">DRE Janeiro</div>
            <p className="text-xs text-muted-foreground mt-1">
              Há 2 dias
            </p>
          </CardContent>
        </Card>
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
                  <span className="font-medium">{relatorio.periodo}</span>
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
                  <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/20">
                    <FileText className="h-5 w-5 text-blue-500" />
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
      <Card className="border-blue-200 dark:border-blue-900 bg-blue-50/50 dark:bg-blue-950/20">
        <CardHeader>
          <div className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-blue-500" />
            <CardTitle>Dica</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Configure relatórios automáticos para receber análises financeiras por e-mail periodicamente.
            Acesse <span className="font-semibold text-foreground">Configurações → Notificações</span> para ativar.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default RelatoriosFinanceirosPage;
