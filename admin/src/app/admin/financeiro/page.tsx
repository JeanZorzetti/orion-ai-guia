import React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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

const FinanceiroPage: React.FC = () => {
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
