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
import { FilterBar, FinancialFilters } from '@/components/financeiro/FilterBar';
import { startOfMonth, endOfMonth } from 'date-fns';
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

  // Alertas desabilitados - aguardando endpoints reais
  // const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set());

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

  // TODO: Implementar histórico real quando endpoints estiverem disponíveis
  // Dados mockados removidos - aguardando implementação de endpoints backend

  // Alertas removidos - aguardando implementação de endpoints backend
  // TODO: Implementar sistema de alertas quando tivermos endpoints de monitoramento

  // Insights de IA removidos - aguardando dados reais de histórico e análise preditiva
  // TODO: Implementar quando tivermos endpoints de histórico e análise preditiva

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

      {/* Central de Alertas - Removida (aguardando endpoints) */}
      {/* TODO: Implementar quando endpoints de monitoramento estiverem disponíveis */}

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
            {/* TODO: Implementar histórico de saldo quando endpoint estiver disponível */}
            <div className="flex items-center justify-between pt-3">
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
            {/* TODO: Implementar histórico quando endpoint estiver disponível */}
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
            {/* TODO: Implementar histórico quando endpoint estiver disponível */}
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
          {/* TODO: Implementar histórico quando endpoint estiver disponível */}
          <p className="text-xs text-muted-foreground mt-1">
            Diferença entre receber e pagar
          </p>
        </CardContent>
      </Card>

      {/*
        Análises Financeiras Removidas - Aguardando implementação de endpoints backend:
        - Fluxo de Caixa Projetado (12 semanas)
        - Aging de Recebíveis e Pagáveis
        - DRE Mensal
        - Despesas por Categoria
        - Insights Financeiros com IA
      */}

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
