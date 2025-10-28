'use client';

import React, { useState } from 'react';
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
import { CashFlowChart } from '@/components/financeiro/CashFlowChart';
import { AgingChart } from '@/components/financeiro/AgingChart';
import { DREWaterfallChart } from '@/components/financeiro/DREWaterfallChart';
import { ExpensesByCategoryChart } from '@/components/financeiro/ExpensesByCategoryChart';
import { FilterBar, FinancialFilters } from '@/components/financeiro/FilterBar';
import { startOfMonth, endOfMonth } from 'date-fns';

const FinanceiroPage: React.FC = () => {
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

  // Dados atuais
  const resumoFinanceiro = {
    contasAPagar: 15420.50,
    contasAReceber: 28350.00,
    saldoAtual: 45280.30,
    vencendoHoje: 3,
  };

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

  return (
    <div className="space-y-6">
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

      {/* Segunda Linha de Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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

        {/* Placeholders para futuras métricas */}
        <Card className="bg-muted/30">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Fluxo de Caixa
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Visualização disponível em breve
            </p>
          </CardContent>
        </Card>

        <Card className="bg-muted/30">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              DRE
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Demonstrativo disponível em breve
            </p>
          </CardContent>
        </Card>

        <Card className="bg-muted/30">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Aging Report
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Análise disponível em breve
            </p>
          </CardContent>
        </Card>
      </div>

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
