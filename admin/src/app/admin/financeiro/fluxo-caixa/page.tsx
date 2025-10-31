'use client';

import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Calendar,
  TrendingUp,
  DollarSign,
  ArrowUpCircle,
  ArrowDownCircle,
  Filter,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { useCashFlow } from '@/hooks/useCashFlow';
import { CashFlowProjection } from '@/components/financeiro/fluxo-caixa/CashFlowProjection';
import { ScenarioAnalysis } from '@/components/financeiro/fluxo-caixa/ScenarioAnalysis';
import { ImpactSimulator } from '@/components/financeiro/fluxo-caixa/ImpactSimulator';
import { FinancialKPIs } from '@/components/financeiro/fluxo-caixa/FinancialKPIs';
import { BreakEvenAnalysis } from '@/components/financeiro/fluxo-caixa/BreakEvenAnalysis';
import { MultiAccountManagement } from '@/components/financeiro/fluxo-caixa/MultiAccountManagement';
import { AccountTransfers } from '@/components/financeiro/fluxo-caixa/AccountTransfers';
import { SmartAlerts } from '@/components/financeiro/fluxo-caixa/SmartAlerts';
import { AIRecommendations } from '@/components/financeiro/fluxo-caixa/AIRecommendations';
import { ReportGenerator } from '@/components/financeiro/fluxo-caixa/ReportGenerator';

const FluxoCaixaPage: React.FC = () => {
  // ========== INTEGRAÇÃO COM API REAL ==========
  const {
    transactions,
    bankAccounts,
    summary,
    completeAnalytics,
    loadingTransactions,
    loadingAccounts,
    loadingAnalytics,
    error
  } = useCashFlow();

  // Mock data como fallback
  const movimentacoes_MOCK = [
    { data: '2024-01-15', tipo: 'entrada', descricao: 'Recebimento Cliente ABC', valor: 5800.00, categoria: 'Vendas' },
    { data: '2024-01-15', tipo: 'saida', descricao: 'Pagamento Fornecedor XYZ', valor: 2300.00, categoria: 'Compras' },
    { data: '2024-01-14', tipo: 'entrada', descricao: 'Recebimento Cliente 123', valor: 3200.00, categoria: 'Vendas' },
    { data: '2024-01-14', tipo: 'saida', descricao: 'Folha de Pagamento', valor: 8500.00, categoria: 'Pessoal' },
    { data: '2024-01-13', tipo: 'entrada', descricao: 'Venda à Vista', valor: 1250.00, categoria: 'Vendas' },
    { data: '2024-01-13', tipo: 'saida', descricao: 'Energia Elétrica', valor: 450.00, categoria: 'Despesas Fixas' },
    { data: '2024-01-12', tipo: 'entrada', descricao: 'Recebimento Cliente Tech', valor: 8950.00, categoria: 'Vendas' },
  ];

  // Calcular totais dos dados reais ou mock
  const movimentacoes = useMemo(() => {
    if (transactions.length > 0) {
      return transactions.map(t => ({
        data: new Date(t.transaction_date).toLocaleDateString('pt-BR'),
        tipo: t.type,
        descricao: t.description,
        valor: t.value,
        categoria: t.category
      }));
    }
    return movimentacoes_MOCK;
  }, [transactions]);

  const totalEntradas = useMemo(() => {
    if (summary) return summary.total_entries;
    return movimentacoes.filter(m => m.tipo === 'entrada').reduce((sum, m) => sum + m.valor, 0);
  }, [summary, movimentacoes]);

  const totalSaidas = useMemo(() => {
    if (summary) return summary.total_exits;
    return movimentacoes.filter(m => m.tipo === 'saida').reduce((sum, m) => sum + m.valor, 0);
  }, [summary, movimentacoes]);

  const saldoPeriodo = useMemo(() => {
    if (summary) return summary.net_flow;
    return totalEntradas - totalSaidas;
  }, [summary, totalEntradas, totalSaidas]);

  const saldoAtual = useMemo(() => {
    if (summary) return summary.closing_balance;
    if (bankAccounts.length > 0) {
      return bankAccounts.reduce((sum, acc) => sum + acc.current_balance, 0);
    }
    return 45280.30; // Fallback mock
  }, [summary, bankAccounts]);

  // Dados mockados para gráfico semanal (até implementar endpoint de histórico)
  const fluxoSemanal = [
    { dia: 'Seg', entradas: 5800, saidas: 2300, saldo: 3500 },
    { dia: 'Ter', entradas: 3200, saidas: 8500, saldo: -5300 },
    { dia: 'Qua', entradas: 1250, saidas: 450, saldo: 800 },
    { dia: 'Qui', entradas: 8950, saidas: 1200, saldo: 7750 },
    { dia: 'Sex', entradas: 4500, saidas: 3100, saldo: 1400 },
    { dia: 'Sáb', entradas: 2100, saidas: 500, saldo: 1600 },
    { dia: 'Dom', entradas: 0, saidas: 0, saldo: 0 },
  ];

  const isLoading = loadingTransactions || loadingAccounts || loadingAnalytics;

  return (
    <div className="space-y-6">
      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2 text-muted-foreground">Carregando fluxo de caixa...</span>
        </div>
      )}

      {/* Error State */}
      {error && (
        <Card className="border-red-500 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              <span className="font-medium">Erro ao carregar dados: {error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <Calendar className="h-8 w-8 text-blue-500" />
            Fluxo de Caixa
          </h1>
          <p className="text-muted-foreground mt-1">
            Visualize entrada e saída de recursos
            {transactions.length > 0 && (
              <Badge variant="outline" className="ml-2">
                Dados Reais da API
              </Badge>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" disabled={isLoading}>
            <Filter className="mr-2 h-4 w-4" />
            Filtrar Período
          </Button>
        </div>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saldo Atual</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              R$ {saldoAtual.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Atualizado agora
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Entradas no Período</CardTitle>
            <ArrowUpCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              R$ {totalEntradas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Últimos 7 dias
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saídas no Período</CardTitle>
            <ArrowDownCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              R$ {totalSaidas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Últimos 7 dias
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saldo do Período</CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${saldoPeriodo >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              R$ {saldoPeriodo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Resultado líquido
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Projeção de Fluxo de Caixa */}
      <CashFlowProjection />

      {/* Análise de Cenários */}
      <ScenarioAnalysis />

      {/* Simulador de Impacto */}
      <ImpactSimulator />

      {/* Indicadores Financeiros (KPIs) */}
      <FinancialKPIs />

      {/* Análise de Break-Even */}
      <BreakEvenAnalysis />

      {/* Gestão de Múltiplas Contas */}
      <MultiAccountManagement />

      {/* Transferências Entre Contas */}
      <AccountTransfers />

      {/* Alertas Inteligentes */}
      <SmartAlerts />

      {/* Recomendações de IA */}
      <AIRecommendations />

      {/* Gerador de Relatórios */}
      <ReportGenerator />

      {/* Gráfico de Fluxo Semanal */}
      <Card>
        <CardHeader>
          <CardTitle>Fluxo Semanal</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {fluxoSemanal.map((dia, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium w-12">{dia.dia}</span>
                  <div className="flex-1 flex items-center gap-2">
                    <div className="flex-1 h-8 bg-muted rounded-lg overflow-hidden flex">
                      <div
                        className="bg-green-500 flex items-center justify-end pr-2"
                        style={{ width: `${(dia.entradas / 10000) * 100}%` }}
                      >
                        {dia.entradas > 0 && (
                          <span className="text-xs text-white font-medium">
                            +{(dia.entradas / 1000).toFixed(1)}k
                          </span>
                        )}
                      </div>
                      <div
                        className="bg-red-500 flex items-center justify-start pl-2"
                        style={{ width: `${(dia.saidas / 10000) * 100}%` }}
                      >
                        {dia.saidas > 0 && (
                          <span className="text-xs text-white font-medium">
                            -{(dia.saidas / 1000).toFixed(1)}k
                          </span>
                        )}
                      </div>
                    </div>
                    <span className={`font-semibold w-20 text-right ${dia.saldo >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {dia.saldo >= 0 ? '+' : ''}{(dia.saldo / 1000).toFixed(1)}k
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 pt-4 border-t flex items-center justify-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-500 rounded"></div>
              <span>Entradas</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-500 rounded"></div>
              <span>Saídas</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Movimentações Recentes */}
      <Card>
        <CardHeader>
          <CardTitle>Movimentações Recentes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {movimentacoes.map((mov, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 rounded-lg border"
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${mov.tipo === 'entrada' ? 'bg-green-50 dark:bg-green-950/20' : 'bg-red-50 dark:bg-red-950/20'}`}>
                    {mov.tipo === 'entrada' ? (
                      <ArrowUpCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <ArrowDownCircle className="h-5 w-5 text-red-500" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium">{mov.descricao}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-muted-foreground">{mov.data}</span>
                      <Badge variant="outline" className="text-xs">{mov.categoria}</Badge>
                    </div>
                  </div>
                </div>
                <span className={`font-semibold ${mov.tipo === 'entrada' ? 'text-green-600' : 'text-red-600'}`}>
                  {mov.tipo === 'entrada' ? '+' : '-'} R$ {mov.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FluxoCaixaPage;
