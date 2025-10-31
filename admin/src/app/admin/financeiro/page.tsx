'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Calendar,
  FileText,
  CreditCard,
  ArrowRight
} from 'lucide-react';
import { FinancialSparkline } from '@/components/ui/financial-sparkline';
import { TrendBadge } from '@/components/ui/trend-badge';
// Fase 6: Lazy loading dos gráficos para melhor performance
import {
  LazyCashFlowChart as CashFlowChart,
  LazyAgingChart as AgingChart,
  LazyDREWaterfallChart as DREWaterfallChart,
  LazyExpensesByCategoryChart as ExpensesByCategoryChart,
} from '@/components/financeiro/LazyCharts';
import { FilterBar, FinancialFilters } from '@/components/financeiro/FilterBar';
import { AlertsPanel } from '@/components/financeiro/AlertsPanel';
import { FinancialAlertData } from '@/components/financeiro/FinancialAlert';
import { generateAllFinancialAlerts } from '@/lib/financial-alerts';
import { InsightsPanel } from '@/components/financeiro/InsightsPanel';
import { generateFinancialInsights } from '@/lib/financial-insights-ai';
import { startOfMonth, endOfMonth, addDays, subDays } from 'date-fns';
import { useAccountsReceivable } from '@/hooks/useAccountsReceivable';
import { useCashFlow } from '@/hooks/useCashFlow';
import { Loader2 } from 'lucide-react';

const FinanceiroPage: React.FC = () => {
  // Evitar problemas de hidratação SSR
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // ========== INTEGRAÇÃO COM API REAL ==========
  const {
    receivables: apiReceivables,
    analytics: arAnalytics,
    loading: loadingAR,
    error: errorAR
  } = useAccountsReceivable();

  const {
    transactions,
    bankAccounts,
    summary: cashFlowSummary,
    loadingTransactions,
    loadingAccounts,
    loadingAnalytics,
    error: errorCF
  } = useCashFlow();

  // Estado dos filtros
  const [filters, setFilters] = useState<FinancialFilters>({
    dateRange: {
      from: startOfMonth(new Date()),
      to: endOfMonth(new Date()),
    },
    category: 'all',
    status: 'all',
  });

  // Estado dos alertas (alertas dismissados)
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set());

  const handleFiltersChange = (newFilters: FinancialFilters) => {
    setFilters(newFilters);
    // Aqui você pode adicionar lógica para recarregar dados com novos filtros
    console.log('Filtros atualizados:', newFilters);
  };

  const handleRefresh = () => {
    console.log('Atualizando dados...');
    // Lógica de refresh
  };

  const handleExport = () => {
    console.log('Exportando dados...');
    // Lógica de exportação para CSV ou Excel
    // Exemplo: Gerar CSV com os dados filtrados
    const csvData = [
      ['Data', 'Categoria', 'Descrição', 'Valor', 'Status'],
      // ... dados filtrados
    ];
    console.log('Dados para exportar:', csvData);
  };

  // Função auxiliar para aplicar filtros aos dados
  // Em produção, isso seria feito no backend via API
  const applyFilters = <T extends { date?: Date; category?: string; status?: string }>(
    data: T[]
  ): T[] => {
    return data.filter((item) => {
      // Filtro de data
      if (item.date) {
        if (item.date < filters.dateRange.from || item.date > filters.dateRange.to) {
          return false;
        }
      }

      // Filtro de categoria
      if (filters.category !== 'all' && item.category !== filters.category) {
        return false;
      }

      // Filtro de status
      if (filters.status !== 'all' && item.status !== filters.status) {
        return false;
      }

      return true;
    });
  };

  // Calcular dados reais da API
  const resumoFinanceiro = useMemo(() => {
    // Contas a Receber: total pendente + parcial
    const contasAReceber = arAnalytics?.total_to_receive || 0;

    // Saldo Atual: do Cash Flow
    const saldoAtual = cashFlowSummary?.closing_balance || 0;

    // Contas a Pagar: calcular despesas pendentes
    const contasAPagar = Math.abs(cashFlowSummary?.total_exits || 0);

    // Vencendo hoje: contas com vencimento hoje
    const hoje = new Date().toISOString().split('T')[0];
    const vencendoHoje = apiReceivables.filter(ar =>
      ar.due_date === hoje && ar.status === 'pendente'
    ).length;

    return {
      contasAPagar,
      contasAReceber,
      saldoAtual,
      vencendoHoje,
    };
  }, [arAnalytics, cashFlowSummary, apiReceivables]);

  // Dados históricos para sparklines (últimos 6 meses simulados)
  const sparklineData = {
    saldo: [38000, 39500, 42000, 41000, 43500, 45280.30],
    contasAPagar: [18000, 17500, 16200, 14800, 16100, 15420.50],
    contasAReceber: [22000, 24500, 26000, 25500, 27800, 28350.00],
  };

  // Comparações com mês anterior (percentuais)
  const comparacoes = {
    saldo: +3.9, // +3.9% vs mês anterior
    contasAPagar: -4.2, // -4.2% vs mês anterior
    contasAReceber: +1.9, // +1.9% vs mês anterior
    resultado: +8.5, // +8.5% vs mês anterior
  };

  // Dados para Fluxo de Caixa (12 semanas)
  const cashFlowData = [
    { week: 'Sem 1', entrada: 15000, saida: 12000, saldo: 48280, projecao: false },
    { week: 'Sem 2', entrada: 18000, saida: 14000, saldo: 52280, projecao: false },
    { week: 'Sem 3', entrada: 16000, saida: 15000, saldo: 53280, projecao: false },
    { week: 'Sem 4', entrada: 20000, saida: 13000, saldo: 60280, projecao: false },
    { week: 'Sem 5', entrada: 17000, saida: 16000, saldo: 61280, projecao: true },
    { week: 'Sem 6', entrada: 19000, saida: 14500, saldo: 65780, projecao: true },
    { week: 'Sem 7', entrada: 21000, saida: 15000, saldo: 71780, projecao: true },
    { week: 'Sem 8', entrada: 18000, saida: 16000, saldo: 73780, projecao: true },
    { week: 'Sem 9', entrada: 22000, saida: 14000, saldo: 81780, projecao: true },
    { week: 'Sem 10', entrada: 20000, saida: 15500, saldo: 86280, projecao: true },
    { week: 'Sem 11', entrada: 19000, saida: 17000, saldo: 88280, projecao: true },
    { week: 'Sem 12', entrada: 23000, saida: 16000, saldo: 95280, projecao: true },
  ];

  // Dados para Aging de Recebíveis
  const agingReceivableData = [
    { range: '0-30 dias (Atual)', value: 15200, count: 8 },
    { range: '31-60 dias', value: 8500, count: 4 },
    { range: '61-90 dias', value: 3200, count: 2 },
    { range: '90+ dias (Vencido)', value: 1450, count: 1 },
  ];

  // Dados para Aging de Pagáveis
  const agingPayableData = [
    { range: '0-30 dias (Atual)', value: 9200, count: 5 },
    { range: '31-60 dias', value: 4500, count: 3 },
    { range: '61-90 dias', value: 1200, count: 1 },
    { range: '90+ dias (Vencido)', value: 520, count: 1 },
  ];

  // Dados para DRE (Waterfall)
  const dreData = [
    { category: 'Receita Bruta', value: 125000, isTotal: false },
    { category: 'Deduções', value: -8000, isTotal: false },
    { category: 'Receita Líquida', value: 117000, isTotal: true },
    { category: 'CMV', value: -45000, isTotal: false },
    { category: 'Lucro Bruto', value: 72000, isTotal: true },
    { category: 'Despesas Op.', value: -32000, isTotal: false },
    { category: 'EBITDA', value: 40000, isTotal: true },
    { category: 'Deprec./Amort.', value: -3000, isTotal: false },
    { category: 'Juros', value: -2000, isTotal: false },
    { category: 'IR/CSLL', value: -7000, isTotal: false },
    { category: 'Lucro Líquido', value: 28000, isTotal: true },
  ];

  // Dados para Despesas por Categoria
  const expensesCategoryData = [
    { category: 'Fornecedores', value: 18500, percentage: 42.5 },
    { category: 'Pessoal', value: 12000, percentage: 27.6 },
    { category: 'Impostos', value: 7800, percentage: 17.9 },
    { category: 'Aluguel', value: 3200, percentage: 7.4 },
    { category: 'Marketing', value: 1500, percentage: 3.4 },
    { category: 'Outros', value: 500, percentage: 1.2 },
  ];

  // Dados simulados para geração de alertas
  const financialDataForAlerts = {
    cashFlow: {
      currentBalance: resumoFinanceiro.saldoAtual,
      projectedBalance: 52000, // Projeção positiva
      monthlyRevenue: 125000,
      monthlyExpenses: 93000,
    },
    payments: [
      {
        id: '1',
        description: 'Fornecedor ABC - Nota 12345',
        amount: 3200,
        dueDate: subDays(new Date(), 5), // 5 dias vencido
        status: 'overdue' as const,
        category: 'expense',
      },
      {
        id: '2',
        description: 'Aluguel - Dezembro',
        amount: 4500,
        dueDate: new Date(), // Vence hoje
        status: 'pending' as const,
        category: 'expense',
      },
      {
        id: '3',
        description: 'Fornecedor XYZ - Nota 67890',
        amount: 2100,
        dueDate: addDays(new Date(), 2), // Vence em 2 dias
        status: 'pending' as const,
        category: 'expense',
      },
    ],
    receipts: [
      {
        id: '4',
        description: 'Cliente ABC - Fatura 001',
        amount: 8500,
        dueDate: subDays(new Date(), 18), // 18 dias de atraso
        status: 'pending' as const,
        category: 'revenue',
      },
    ],
    budgets: [
      {
        category: 'Marketing',
        limit: 5000,
        spent: 4800,
        percentage: 96, // 96% utilizado - crítico
      },
      {
        category: 'Fornecedores',
        limit: 20000,
        spent: 18500,
        percentage: 92.5, // 92.5% utilizado - aviso
      },
    ],
  };

  // Gerar alertas usando useMemo para performance
  const alerts = useMemo(() => {
    const generated = generateAllFinancialAlerts(financialDataForAlerts);
    // Filtrar alertas dismissados
    return generated.filter((alert) => !dismissedAlerts.has(alert.id));
  }, [dismissedAlerts]);

  // Handlers de alertas
  const handleAlertAction = (alert: FinancialAlertData) => {
    console.log('Ação do alerta:', alert);
    if (alert.actionUrl) {
      // Em produção, usar Next.js router
      window.location.href = alert.actionUrl;
    }
  };

  const handleAlertDismiss = (alertId: string) => {
    setDismissedAlerts((prev) => new Set([...prev, alertId]));
  };

  const handleClearAllAlerts = () => {
    const dismissableIds = alerts
      .filter((a) => a.dismissable)
      .map((a) => a.id);
    setDismissedAlerts((prev) => new Set([...prev, ...dismissableIds]));
  };

  // Gerar insights de IA - Fase 7
  const insights = useMemo(() => {
    return generateFinancialInsights({
      currentBalance: resumoFinanceiro.saldoAtual,
      monthlyRevenue: 125000,
      monthlyExpenses: 93000,
      revenue30Days: 125000,
      revenue60Days: 118000,
      revenue90Days: 110000,
      expenses30Days: 93000,
      expenses60Days: 88000,
      expenses90Days: 85000,
      overduePayments: 3200,
      overdueReceipts: 8500,
      categoryExpenses: expensesCategoryData.map((cat) => ({
        category: cat.category,
        value: cat.value,
        percentage: cat.percentage,
        trend: Math.random() * 30 - 10, // Tendência simulada -10% a +20%
      })),
    });
  }, [resumoFinanceiro.saldoAtual]);

  const acoesRapidas = [
    {
      titulo: 'Contas a Pagar',
      descricao: 'Gerencie suas despesas e fornecedores',
      icon: TrendingDown,
      href: '/admin/financeiro/contas-a-pagar',
      color: 'text-red-500',
      bgColor: 'bg-red-50 dark:bg-red-950/20',
    },
    {
      titulo: 'Contas a Receber',
      descricao: 'Acompanhe recebimentos de clientes',
      icon: TrendingUp,
      href: '/admin/financeiro/contas-a-receber',
      color: 'text-green-500',
      bgColor: 'bg-green-50 dark:bg-green-950/20',
    },
    {
      titulo: 'Fluxo de Caixa',
      descricao: 'Visualize entrada e saída de recursos',
      icon: Calendar,
      href: '/admin/financeiro/fluxo-caixa',
      color: 'text-blue-500',
      bgColor: 'bg-blue-50 dark:bg-blue-950/20',
    },
    {
      titulo: 'Relatórios',
      descricao: 'Análises e demonstrativos financeiros',
      icon: FileText,
      href: '/admin/financeiro/relatorios',
      color: 'text-purple-500',
      bgColor: 'bg-purple-50 dark:bg-purple-950/20',
    },
  ];

  // Verificar loading geral
  const isLoading = loadingAR || loadingTransactions || loadingAccounts || loadingAnalytics;

  // Evitar hidratação de conteúdo dinâmico
  if (!mounted) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">Carregando...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2 text-muted-foreground">Carregando dados financeiros...</span>
        </div>
      )}

      {/* Error State */}
      {(errorAR || errorCF) && (
        <Card className="border-red-500 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-600">
              <span className="font-medium">
                Erro ao carregar dados: {errorAR || errorCF}
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Gestão Financeira</h1>
          <p className="text-muted-foreground mt-1">
            Controle completo do fluxo de caixa da sua empresa
          </p>
        </div>
      </div>

      {/* Barra de Filtros - Fase 3 */}
      <FilterBar
        filters={filters}
        onFiltersChange={handleFiltersChange}
        onRefresh={handleRefresh}
        onExport={handleExport}
      />

      {/* Central de Alertas - Fase 4 */}
      {alerts.length > 0 && (
        <AlertsPanel
          alerts={alerts}
          onAlertAction={handleAlertAction}
          onAlertDismiss={handleAlertDismiss}
          onClearAll={handleClearAllAlerts}
          compact
        />
      )}

      {/* Cards de Resumo - Layout Hierárquico */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Card Principal (2 colunas) - Saldo em Caixa */}
        <Card className="md:col-span-2 border-blue-500/20 bg-gradient-to-br from-blue-500/5 to-blue-500/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg font-semibold">Saldo em Caixa</CardTitle>
            <DollarSign className="h-5 w-5 text-blue-500" />
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-4xl font-bold text-blue-600">
              R$ {resumoFinanceiro.saldoAtual.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <FinancialSparkline
              data={sparklineData.saldo}
              color="#3B82F6"
              height={60}
              showArea={true}
              showGradient={true}
            />
            <div className="flex items-center justify-between">
              <TrendBadge value={comparacoes.saldo} size="md" />
              <span className="text-sm text-muted-foreground">
                Atualizado agora
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Cards Secundários (1 coluna cada) */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Contas a Pagar</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-2xl font-bold text-red-600">
              R$ {resumoFinanceiro.contasAPagar.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <FinancialSparkline
              data={sparklineData.contasAPagar}
              color="#EF4444"
              height={32}
            />
            <TrendBadge value={comparacoes.contasAPagar} size="sm" />
            <p className="text-xs text-muted-foreground mt-1">
              {resumoFinanceiro.vencendoHoje} vencendo hoje
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Contas a Receber</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-2xl font-bold text-green-600">
              R$ {resumoFinanceiro.contasAReceber.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <FinancialSparkline
              data={sparklineData.contasAReceber}
              color="#10B981"
              height={32}
            />
            <TrendBadge value={comparacoes.contasAReceber} size="sm" />
            <p className="text-xs text-muted-foreground mt-1">
              Previsão próximos 30 dias
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Card de Resultado do Mês */}
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Resultado</CardTitle>
          <CreditCard className="h-4 w-4 text-purple-500" />
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="text-2xl font-bold text-purple-600">
            R$ {(resumoFinanceiro.contasAReceber - resumoFinanceiro.contasAPagar).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
          <TrendBadge value={comparacoes.resultado} size="sm" />
          <p className="text-xs text-muted-foreground mt-1">
            Projeção do mês
          </p>
        </CardContent>
      </Card>

      {/* Gráficos Financeiros - Fase 2 */}
      <div className="space-y-6">
        <h2 className="text-xl font-semibold">Análises Financeiras</h2>

        {/* Fluxo de Caixa - Full Width */}
        <CashFlowChart data={cashFlowData} />

        {/* Aging Reports - Grid 2 Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <AgingChart type="receivable" data={agingReceivableData} />
          <AgingChart type="payable" data={agingPayableData} />
        </div>

        {/* DRE e Despesas - Grid 2 Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <DREWaterfallChart data={dreData} />
          <ExpensesByCategoryChart data={expensesCategoryData} />
        </div>
      </div>

      {/* Insights de IA - Fase 7 */}
      <InsightsPanel insights={insights} />

      {/* Ações Rápidas */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Módulos Financeiros</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {acoesRapidas.map((acao) => (
            <Link key={acao.href} href={acao.href}>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-lg ${acao.bgColor}`}>
                      <acao.icon className={`h-6 w-6 ${acao.color}`} />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-1">{acao.titulo}</h3>
                      <p className="text-sm text-muted-foreground">{acao.descricao}</p>
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

export default FinanceiroPage;
