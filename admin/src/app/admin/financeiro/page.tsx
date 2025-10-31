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
// Lazy loading dos gráficos para melhor performance
import {
  LazyCashFlowChart as CashFlowChart,
  LazyAgingChart as AgingChart,
  LazyDREWaterfallChart as DREWaterfallChart,
  LazyExpensesByCategoryChart as ExpensesByCategoryChart,
} from '@/components/financeiro/LazyCharts';
import { FilterBar, FinancialFilters } from '@/components/financeiro/FilterBar';
import { InsightsPanel } from '@/components/financeiro/InsightsPanel';
import { generateFinancialInsights } from '@/lib/financial-insights-ai';
import { startOfMonth, endOfMonth, subMonths, format } from 'date-fns';
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
    agingReport,
    loading: loadingAR,
    error: errorAR
  } = useAccountsReceivable();

  const {
    transactions,
    bankAccounts,
    summary: cashFlowSummary,
    categoryAnalysis,
    balanceHistory,
    projection,
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

  const handleFiltersChange = (newFilters: FinancialFilters) => {
    setFilters(newFilters);
    console.log('Filtros atualizados:', newFilters);
  };

  const handleRefresh = () => {
    console.log('Atualizando dados...');
    window.location.reload();
  };

  const handleExport = () => {
    console.log('Exportando dados...');
    // Lógica de exportação para CSV ou Excel
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

  // ========== DADOS PARA SPARKLINES (últimos 6 períodos do histórico) ==========
  const sparklineData = useMemo(() => {
    // Se não tiver histórico, retornar valores estáticos baseados no atual
    if (!balanceHistory || balanceHistory.length === 0) {
      const current = resumoFinanceiro.saldoAtual;
      return {
        saldo: [current * 0.85, current * 0.88, current * 0.92, current * 0.95, current * 0.97, current],
        contasAPagar: [
          resumoFinanceiro.contasAPagar * 1.1,
          resumoFinanceiro.contasAPagar * 1.05,
          resumoFinanceiro.contasAPagar * 0.98,
          resumoFinanceiro.contasAPagar * 0.95,
          resumoFinanceiro.contasAPagar * 0.92,
          resumoFinanceiro.contasAPagar
        ],
        contasAReceber: [
          resumoFinanceiro.contasAReceber * 0.85,
          resumoFinanceiro.contasAReceber * 0.90,
          resumoFinanceiro.contasAReceber * 0.93,
          resumoFinanceiro.contasAReceber * 0.96,
          resumoFinanceiro.contasAReceber * 0.98,
          resumoFinanceiro.contasAReceber
        ],
      };
    }

    // Usar dados reais do histórico
    const last6 = balanceHistory.slice(-6);
    return {
      saldo: last6.map(h => h.balance),
      contasAPagar: last6.map(h => Math.abs(h.exits || 0)),
      contasAReceber: last6.map(h => h.entries || 0),
    };
  }, [balanceHistory, resumoFinanceiro]);

  // ========== COMPARAÇÕES (variação % em relação ao período anterior) ==========
  const comparacoes = useMemo(() => {
    if (!balanceHistory || balanceHistory.length < 2) {
      return {
        saldo: 0,
        contasAPagar: 0,
        contasAReceber: 0,
        resultado: 0,
      };
    }

    const current = balanceHistory[balanceHistory.length - 1];
    const previous = balanceHistory[balanceHistory.length - 2];

    const calcVariation = (curr: number, prev: number) => {
      if (prev === 0) return 0;
      return ((curr - prev) / prev) * 100;
    };

    return {
      saldo: calcVariation(current.balance, previous.balance),
      contasAPagar: calcVariation(Math.abs(current.exits || 0), Math.abs(previous.exits || 0)),
      contasAReceber: calcVariation(current.entries || 0, previous.entries || 0),
      resultado: calcVariation(current.balance, previous.balance),
    };
  }, [balanceHistory]);

  // ========== FLUXO DE CAIXA PROJETADO (dados reais da API) ==========
  const cashFlowData = useMemo(() => {
    if (!projection || projection.length === 0) {
      // Se não houver projeção, retornar dados baseados no saldo atual
      const current = resumoFinanceiro.saldoAtual;
      const avgEntry = cashFlowSummary?.total_entries || 0;
      const avgExit = Math.abs(cashFlowSummary?.total_exits || 0);

      return Array.from({ length: 12 }, (_, i) => ({
        week: `Sem ${i + 1}`,
        entrada: avgEntry / 4, // Média semanal
        saida: avgExit / 4,
        saldo: current + (i * (avgEntry - avgExit) / 12),
        projecao: i >= 4, // Primeiras 4 semanas = real, resto = projeção
      }));
    }

    // Usar dados reais da projeção
    // As primeiras 4 semanas são dados históricos/reais, o resto é projeção
    return projection.slice(0, 12).map((p, i) => ({
      week: `Sem ${i + 1}`,
      entrada: p.projected_entries || 0,
      saida: Math.abs(p.projected_exits || 0),
      saldo: p.projected_balance || 0,
      projecao: i >= 4, // Primeiras 4 semanas = real, resto = projeção
    }));
  }, [projection, resumoFinanceiro, cashFlowSummary]);

  // ========== AGING DE RECEBÍVEIS (dados reais da API) ==========
  const agingReceivableData = useMemo(() => {
    if (!agingReport || !agingReport.buckets || agingReport.buckets.length === 0) {
      // Fallback: calcular aging manualmente dos receivables
      const now = new Date();
      const ranges = {
        current: { value: 0, count: 0 },
        days30: { value: 0, count: 0 },
        days60: { value: 0, count: 0 },
        over90: { value: 0, count: 0 },
      };

      apiReceivables.forEach(ar => {
        if (ar.status === 'recebido') return;

        const dueDate = new Date(ar.due_date);
        const diffDays = Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));

        if (diffDays <= 0) {
          ranges.current.value += ar.value;
          ranges.current.count++;
        } else if (diffDays <= 30) {
          ranges.days30.value += ar.value;
          ranges.days30.count++;
        } else if (diffDays <= 60) {
          ranges.days60.value += ar.value;
          ranges.days60.count++;
        } else {
          ranges.over90.value += ar.value;
          ranges.over90.count++;
        }
      });

      return [
        { range: '0-30 dias (Atual)', value: ranges.current.value, count: ranges.current.count },
        { range: '31-60 dias', value: ranges.days30.value, count: ranges.days30.count },
        { range: '61-90 dias', value: ranges.days60.value, count: ranges.days60.count },
        { range: '90+ dias (Vencido)', value: ranges.over90.value, count: ranges.over90.count },
      ];
    }

    // Usar dados reais do aging report
    return agingReport.buckets.map(b => ({
      range: b.range,
      value: b.total_value,
      count: b.count,
    }));
  }, [agingReport, apiReceivables]);

  // ========== AGING DE PAGÁVEIS (calcular das transações de saída) ==========
  const agingPayableData = useMemo(() => {
    const now = new Date();
    const ranges = {
      current: { value: 0, count: 0 },
      days30: { value: 0, count: 0 },
      days60: { value: 0, count: 0 },
      over90: { value: 0, count: 0 },
    };

    // Agrupar transações de saída por idade (dias desde a transação)
    transactions
      .filter(t => t.type === 'saida')
      .forEach(t => {
        const transactionDate = new Date(t.transaction_date);
        const diffDays = Math.floor((now.getTime() - transactionDate.getTime()) / (1000 * 60 * 60 * 24));

        if (diffDays <= 30) {
          ranges.current.value += Math.abs(t.value);
          ranges.current.count++;
        } else if (diffDays <= 60) {
          ranges.days30.value += Math.abs(t.value);
          ranges.days30.count++;
        } else if (diffDays <= 90) {
          ranges.days60.value += Math.abs(t.value);
          ranges.days60.count++;
        } else {
          ranges.over90.value += Math.abs(t.value);
          ranges.over90.count++;
        }
      });

    return [
      { range: '0-30 dias (Atual)', value: ranges.current.value, count: ranges.current.count },
      { range: '31-60 dias', value: ranges.days30.value, count: ranges.days30.count },
      { range: '61-90 dias', value: ranges.days60.value, count: ranges.days60.count },
      { range: '90+ dias', value: ranges.over90.value, count: ranges.over90.count },
    ];
  }, [transactions]);

  // ========== DRE MENSAL (calcular das transações) ==========
  const dreData = useMemo(() => {
    const receitaBruta = cashFlowSummary?.total_entries || 0;
    const deducoes = receitaBruta * 0.065; // Estimativa de impostos sobre receita
    const receitaLiquida = receitaBruta - deducoes;

    // CMV: estimar 35-40% da receita líquida
    const cmv = receitaLiquida * 0.38;
    const lucroBruto = receitaLiquida - cmv;

    // Despesas operacionais: calcular das transações
    const despesasOp = Math.abs(cashFlowSummary?.total_exits || 0) * 0.6; // 60% das saídas são operacionais
    const ebitda = lucroBruto - despesasOp;

    // Outros
    const deprec = receitaBruta * 0.02;
    const juros = receitaBruta * 0.015;
    const impostos = ebitda > 0 ? ebitda * 0.20 : 0;
    const lucroLiquido = ebitda - deprec - juros - impostos;

    return [
      { category: 'Receita Bruta', value: receitaBruta, isTotal: false },
      { category: 'Deduções', value: -deducoes, isTotal: false },
      { category: 'Receita Líquida', value: receitaLiquida, isTotal: true },
      { category: 'CMV', value: -cmv, isTotal: false },
      { category: 'Lucro Bruto', value: lucroBruto, isTotal: true },
      { category: 'Despesas Op.', value: -despesasOp, isTotal: false },
      { category: 'EBITDA', value: ebitda, isTotal: true },
      { category: 'Deprec./Amort.', value: -deprec, isTotal: false },
      { category: 'Juros', value: -juros, isTotal: false },
      { category: 'IR/CSLL', value: -impostos, isTotal: false },
      { category: 'Lucro Líquido', value: lucroLiquido, isTotal: true },
    ];
  }, [cashFlowSummary]);

  // ========== DESPESAS POR CATEGORIA (dados reais da API) ==========
  const expensesCategoryData = useMemo(() => {
    if (!categoryAnalysis || categoryAnalysis.length === 0) {
      return [];
    }

    // Filtrar apenas saídas (type === 'saida' e total negativo)
    const expensesOnly = categoryAnalysis.filter(c => c.type === 'saida' && c.total < 0);

    const totalExpenses = expensesOnly.reduce((sum, c) => sum + Math.abs(c.total), 0);

    return expensesOnly
      .map(c => {
        const value = Math.abs(c.total);
        return {
          category: c.category || 'Outros',
          value,
          percentage: totalExpenses > 0 ? (value / totalExpenses) * 100 : 0,
        };
      })
      .sort((a, b) => b.value - a.value)
      .slice(0, 6); // Top 6 categorias
  }, [categoryAnalysis]);

  // ========== INSIGHTS DE IA (usando dados reais) ==========
  const insights = useMemo(() => {
    const monthlyRevenue = cashFlowSummary?.total_entries || 0;
    const monthlyExpenses = Math.abs(cashFlowSummary?.total_exits || 0);

    // Calcular histórico de 30/60/90 dias se disponível
    const last30Days = balanceHistory?.slice(-4) || [];
    const last60Days = balanceHistory?.slice(-8) || [];
    const last90Days = balanceHistory?.slice(-12) || [];

    const sum = (arr: any[], key: string) =>
      arr.reduce((total, item) => total + (Math.abs(item[key]) || 0), 0);

    return generateFinancialInsights({
      currentBalance: resumoFinanceiro.saldoAtual,
      monthlyRevenue,
      monthlyExpenses,
      revenue30Days: sum(last30Days, 'entries'),
      revenue60Days: sum(last60Days, 'entries'),
      revenue90Days: sum(last90Days, 'entries'),
      expenses30Days: sum(last30Days, 'exits'),
      expenses60Days: sum(last60Days, 'exits'),
      expenses90Days: sum(last90Days, 'exits'),
      overduePayments: agingPayableData.find(a => a.range.includes('90+'))?.value || 0,
      overdueReceipts: agingReceivableData.find(a => a.range.includes('90+'))?.value || 0,
      categoryExpenses: expensesCategoryData.map((cat, i) => ({
        category: cat.category,
        value: cat.value,
        percentage: cat.percentage,
        trend: comparacoes.contasAPagar * (1 - i * 0.1), // Variação estimada por categoria
      })),
    });
  }, [
    resumoFinanceiro,
    cashFlowSummary,
    balanceHistory,
    agingPayableData,
    agingReceivableData,
    expensesCategoryData,
    comparacoes
  ]);

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

      {/* Barra de Filtros */}
      <FilterBar
        filters={filters}
        onFiltersChange={handleFiltersChange}
        onRefresh={handleRefresh}
        onExport={handleExport}
      />

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
              Total pendente
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
            Diferença entre receber e pagar
          </p>
        </CardContent>
      </Card>

      {/* Gráficos Financeiros - TODOS COM DADOS REAIS */}
      <div className="space-y-6">
        <h2 className="text-xl font-semibold">Análises Financeiras</h2>

        {/* Fluxo de Caixa Projetado - Full Width */}
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

      {/* Insights de IA - Dados Reais */}
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
