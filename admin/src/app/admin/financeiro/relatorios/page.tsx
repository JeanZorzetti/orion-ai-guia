'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  FileText,
  Download,
  TrendingUp,
  PieChart,
  BarChart3,
  Calendar,
  DollarSign,
  FileSpreadsheet,
  Settings,
  History,
  Layout
} from 'lucide-react';
import { ReportConfigurator } from '@/components/relatorios/ReportConfigurator';
import { ReportPreview } from '@/components/relatorios/ReportPreview';
import { ReportHistory } from '@/components/relatorios/ReportHistory';
import { ReportTemplates } from '@/components/relatorios/ReportTemplates';
import { ScheduledReportsList } from '@/components/relatorios/ScheduledReportsList';
import type { ReportConfig } from '@/types/report';
import { generateReport } from '@/lib/report-generator';
import { format, eachDayOfInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const RelatoriosFinanceirosPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('gerar');
  const [selectedReport, setSelectedReport] = useState<{ tipo: string; subtipo: string } | null>(null);
  const [showConfigurator, setShowConfigurator] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [currentConfig, setCurrentConfig] = useState<ReportConfig | null>(null);
  const handleOpenConfigurator = (subtipo: string) => {
    setSelectedReport({ tipo: 'financeiro', subtipo });
    setShowConfigurator(true);
  };

  const handleUseTemplate = (config: ReportConfig) => {
    setCurrentConfig(config);
    setSelectedReport({ tipo: config.tipo, subtipo: config.subtipo });
    setShowConfigurator(true);
  };

  const handleGenerate = async (config: ReportConfig) => {
    try {
      // Gerar dados mockados (inline, sem hook)
      const data = generateMockData(config);

      // Gerar relatório no formato selecionado
      await generateReport(config, data);

      // Feedback de sucesso
      alert(`✅ Relatório "${config.nome}" gerado com sucesso!\n\nFormato: ${config.exportacao.formato.toUpperCase()}\nO download deve iniciar automaticamente.`);
    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
      alert(`❌ Erro ao gerar relatório: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  };

  const generateMockData = (config: ReportConfig) => {
    // Dados mockados simples para demonstração
    const resumo = config.tipo === 'financeiro' ? [
      { label: 'Receita Total', valor: 'R$ 125.480,00', variacao: 15.3, tendencia: 'up' as const },
      { label: 'Despesa Total', valor: 'R$ 78.250,00', variacao: -5.2, tendencia: 'down' as const },
      { label: 'Lucro Líquido', valor: 'R$ 47.230,00', variacao: 28.5, tendencia: 'up' as const }
    ] : [];

    const graficos = config.visualizacao.incluirGraficos ? [{
      titulo: 'Evolução Financeira',
      tipo: 'linha' as const,
      dados: eachDayOfInterval({ start: config.periodo.inicio, end: config.periodo.fim }).slice(0, 30).map(date => ({
        label: format(date, 'dd/MM', { locale: ptBR }),
        receitas: 15000 + Math.random() * 5000,
        despesas: 10000 + Math.random() * 3000
      }))
    }] : [];

    const colunas = ['Data', 'Descrição', 'Categoria', 'Receitas', 'Despesas', 'Saldo'];
    const linhas = [
      [format(new Date(), 'dd/MM/yyyy'), 'Venda de produtos', 'Vendas', 'R$ 5.250,00', '-', 'R$ 5.250,00'],
      [format(new Date(), 'dd/MM/yyyy'), 'Pagamento fornecedor', 'Operacional', '-', 'R$ 2.800,00', 'R$ 2.450,00'],
      [format(new Date(), 'dd/MM/yyyy'), 'Serviços prestados', 'Serviços', 'R$ 8.500,00', '-', 'R$ 10.950,00'],
      [format(new Date(), 'dd/MM/yyyy'), 'Salários', 'Pessoal', '-', 'R$ 15.000,00', 'R$ -4.050,00'],
      [format(new Date(), 'dd/MM/yyyy'), 'Comissões', 'Vendas', 'R$ 3.200,00', '-', 'R$ -850,00']
    ];

    return { resumo, graficos, colunas, linhas };
  };

  const handlePreview = (config: ReportConfig) => {
    setCurrentConfig(config);
    setShowConfigurator(false);
    setShowPreview(true);
  };

  const handleConfirmPreview = (config: ReportConfig) => {
    setShowPreview(false);
    handleGenerate(config);
  };

  const relatorios = [
    {
      titulo: 'Demonstrativo de Resultados (DRE)',
      descricao: 'Receitas, despesas e lucro líquido do período',
      icon: TrendingUp,
      color: 'text-blue-500',
      bgColor: 'bg-blue-50 dark:bg-blue-950/20',
      periodo: 'Mensal',
      subtipo: 'dre'
    },
    {
      titulo: 'Fluxo de Caixa Consolidado',
      descricao: 'Entradas e saídas detalhadas por período',
      icon: BarChart3,
      color: 'text-green-500',
      bgColor: 'bg-green-50 dark:bg-green-950/20',
      periodo: 'Personalizado',
      subtipo: 'fluxo-caixa'
    },
    {
      titulo: 'Contas a Pagar - Resumo',
      descricao: 'Listagem completa de despesas pendentes e pagas',
      icon: FileSpreadsheet,
      color: 'text-red-500',
      bgColor: 'bg-red-50 dark:bg-red-950/20',
      periodo: 'Mensal',
      subtipo: 'contas-pagar'
    },
    {
      titulo: 'Contas a Receber - Resumo',
      descricao: 'Listagem completa de recebimentos pendentes e realizados',
      icon: FileSpreadsheet,
      color: 'text-green-500',
      bgColor: 'bg-green-50 dark:bg-green-950/20',
      periodo: 'Mensal',
      subtipo: 'contas-receber'
    },
    {
      titulo: 'Análise por Categoria',
      descricao: 'Distribuição de receitas e despesas por categoria',
      icon: PieChart,
      color: 'text-purple-500',
      bgColor: 'bg-purple-50 dark:bg-purple-950/20',
      periodo: 'Trimestral',
      subtipo: 'analise-categoria'
    },
    {
      titulo: 'Relatório Anual',
      descricao: 'Consolidação de todas as movimentações do ano',
      icon: Calendar,
      color: 'text-orange-500',
      bgColor: 'bg-orange-50 dark:bg-orange-950/20',
      periodo: 'Anual',
      subtipo: 'relatorio-anual'
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

      {/* Tabs de navegação */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full md:w-auto md:inline-grid grid-cols-4 mb-4">
          <TabsTrigger value="gerar" className="gap-2">
            <FileText className="h-4 w-4" />
            Gerar Relatório
          </TabsTrigger>
          <TabsTrigger value="templates" className="gap-2">
            <Layout className="h-4 w-4" />
            Templates
          </TabsTrigger>
          <TabsTrigger value="agendamentos" className="gap-2">
            <Calendar className="h-4 w-4" />
            Agendamentos
          </TabsTrigger>
          <TabsTrigger value="historico" className="gap-2">
            <History className="h-4 w-4" />
            Histórico
          </TabsTrigger>
        </TabsList>

        <TabsContent value="gerar" className="space-y-6">
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
                <Button
                  className="w-full"
                  size="sm"
                  onClick={() => handleOpenConfigurator(relatorio.subtipo)}
                >
                  <Settings className="mr-2 h-3 w-3" />
                  Configurar e Gerar
                </Button>
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
        </TabsContent>

        <TabsContent value="templates" className="space-y-6">
          <ReportTemplates onUseTemplate={handleUseTemplate} />
        </TabsContent>

        <TabsContent value="agendamentos" className="space-y-6">
          <ScheduledReportsList />
        </TabsContent>

        <TabsContent value="historico" className="space-y-6">
          <ReportHistory />
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      {selectedReport && (
        <ReportConfigurator
          tipo="financeiro"
          subtipo={selectedReport.subtipo}
          open={showConfigurator}
          onOpenChange={setShowConfigurator}
          onGenerate={handleGenerate}
          onPreview={handlePreview}
          initialConfig={currentConfig || undefined}
        />
      )}

      {currentConfig && (
        <ReportPreview
          config={currentConfig}
          open={showPreview}
          onClose={() => setShowPreview(false)}
          onConfirm={handleConfirmPreview}
        />
      )}
    </div>
  );
};

export default RelatoriosFinanceirosPage;
