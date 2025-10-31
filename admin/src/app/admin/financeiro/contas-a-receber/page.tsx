'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  TrendingUp,
  Plus,
  CheckCircle,
  Clock,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { ARDashboardKPIs } from '@/components/financeiro/contas-a-receber/ARDashboardKPIs';
import { AgingReportTable } from '@/components/financeiro/contas-a-receber/AgingReportTable';
import { ARCharts } from '@/components/financeiro/contas-a-receber/ARCharts';
import { AdvancedFilters } from '@/components/financeiro/contas-a-receber/AdvancedFilters';
import { SavedViews, type SavedView } from '@/components/financeiro/contas-a-receber/SavedViews';
import { ExportDialog, type ExportOptions } from '@/components/financeiro/contas-a-receber/ExportDialog';
import { GeneratePortalAccessDialog } from '@/components/financeiro/contas-a-receber/GeneratePortalAccessDialog';
import { useARFilters, type ContaReceber } from '@/hooks/useARFilters';
import { useAccountsReceivable } from '@/hooks/useAccountsReceivable';
import { addDays } from 'date-fns';

// Mock data expandido - em produção viria do banco
const mockContasReceber: ContaReceber[] = [
  {
    id: '1',
    numeroDocumento: 'NF-1234',
    clienteId: '1',
    clienteNome: 'Empresa ABC Ltda',
    dataEmissao: new Date('2024-12-05'),
    dataVencimento: addDays(new Date(), 5),
    valor: 5800.00,
    valorPago: 0,
    status: 'pendente',
    descricao: 'Venda de produtos - Pedido #1234',
    formaPagamento: 'boleto',
    categoriaRisco: 'excelente',
    diasVencido: 0,
  },
  {
    id: '2',
    numeroDocumento: 'NF-1235',
    clienteId: '2',
    clienteNome: 'Comercial XYZ S.A.',
    dataEmissao: new Date('2024-12-10'),
    dataVencimento: addDays(new Date(), 26),
    valor: 12500.00,
    valorPago: 0,
    status: 'pendente',
    descricao: 'Serviços de consultoria',
    formaPagamento: 'pix',
    categoriaRisco: 'bom',
    diasVencido: 0,
  },
  {
    id: '3',
    numeroDocumento: 'NF-1236',
    clienteId: '3',
    clienteNome: 'Distribuidora 123',
    dataEmissao: new Date('2024-11-20'),
    dataVencimento: addDays(new Date(), -5),
    valor: 3200.00,
    valorPago: 0,
    status: 'vencido',
    descricao: 'Venda de equipamentos',
    formaPagamento: 'boleto',
    categoriaRisco: 'regular',
    diasVencido: 5,
  },
  {
    id: '4',
    numeroDocumento: 'NF-1237',
    clienteId: '1',
    clienteNome: 'Empresa ABC Ltda',
    dataEmissao: new Date('2024-12-01'),
    dataVencimento: new Date('2024-12-15'),
    valor: 8950.00,
    valorPago: 8950.00,
    status: 'recebido',
    descricao: 'Manutenção - Contrato anual',
    formaPagamento: 'transferencia',
    categoriaRisco: 'excelente',
    diasVencido: 0,
  },
  {
    id: '5',
    numeroDocumento: 'NF-1238',
    clienteId: '4',
    clienteNome: 'Indústria DEF',
    dataEmissao: new Date('2024-10-15'),
    dataVencimento: addDays(new Date(), -45),
    valor: 15000.00,
    valorPago: 0,
    status: 'vencido',
    descricao: 'Venda de matéria-prima',
    formaPagamento: 'boleto',
    categoriaRisco: 'ruim',
    diasVencido: 45,
  },
  {
    id: '6',
    numeroDocumento: 'NF-1239',
    clienteId: '5',
    clienteNome: 'Varejo GHI',
    dataEmissao: new Date('2024-09-20'),
    dataVencimento: addDays(new Date(), -90),
    valor: 8200.00,
    valorPago: 0,
    status: 'vencido',
    descricao: 'Produtos acabados',
    formaPagamento: 'cheque',
    categoriaRisco: 'critico',
    diasVencido: 90,
  },
];

const ContasAReceberPage: React.FC = () => {
  // ========== INTEGRAÇÃO COM API REAL ==========
  const {
    receivables: apiReceivables,
    analytics,
    agingReport,
    loading,
    loadingAnalytics,
    error
  } = useAccountsReceivable();

  // Converter dados da API para formato do componente
  const contasReceber = useMemo<ContaReceber[]>(() => {
    return apiReceivables.map(ar => ({
      id: ar.id.toString(),
      numeroDocumento: ar.document_number,
      clienteId: ar.customer_id.toString(),
      clienteNome: ar.customer_name || `Cliente #${ar.customer_id}`,
      dataEmissao: new Date(ar.issue_date),
      dataVencimento: new Date(ar.due_date),
      valor: ar.value,
      valorPago: ar.paid_value,
      status: ar.status,
      descricao: ar.description || '',
      formaPagamento: ar.payment_method || '',
      categoriaRisco: ar.risk_category,
      diasVencido: ar.days_overdue,
    }));
  }, [apiReceivables]);

  // Fallback para mock data durante desenvolvimento
  const dataSource = contasReceber.length > 0 ? contasReceber : mockContasReceber;

  // State para visualizações salvas
  const [savedViews, setSavedViews] = useState<SavedView[]>([
    {
      id: '1',
      nome: 'Contas Vencidas - Alto Risco',
      descricao: 'Contas com mais de 30 dias vencidas e risco alto',
      filters: {
        status: ['vencido'],
        categoriasRisco: ['ruim', 'critico'],
        faixasVencimento: ['vencido_60', 'vencido_90', 'vencido_120plus'],
        clientes: [],
        formasPagamento: [],
        ordenacao: 'vencimento_desc',
      },
      isFavorito: true,
      dataCriacao: new Date('2024-12-01'),
      ultimaUtilizacao: new Date('2025-01-10'),
      totalVezesSalva: 15,
    },
    {
      id: '2',
      nome: 'Recebimentos Esta Semana',
      descricao: 'Contas a vencer nos próximos 7 dias',
      filters: {
        status: ['pendente'],
        dataVencimentoInicio: new Date(),
        dataVencimentoFim: addDays(new Date(), 7),
        clientes: [],
        categoriasRisco: [],
        faixasVencimento: [],
        formasPagamento: [],
        ordenacao: 'vencimento_asc',
      },
      isFavorito: false,
      dataCriacao: new Date('2024-11-15'),
      ultimaUtilizacao: new Date('2025-01-08'),
      totalVezesSalva: 8,
    },
  ]);

  // Hook de filtros (agora usando dados reais ou fallback)
  const {
    filters,
    setFilters,
    filteredData,
    totalResults,
    isFiltering,
  } = useARFilters(dataSource);

  // Seleção de registros
  const [selectedRecords, setSelectedRecords] = useState<string[]>([]);

  // Handlers para visualizações salvas
  const handleSaveView = (nome: string, descricao?: string) => {
    const newView: SavedView = {
      id: Date.now().toString(),
      nome,
      descricao,
      filters: { ...filters },
      isFavorito: false,
      dataCriacao: new Date(),
      totalVezesSalva: 1,
    };
    setSavedViews([...savedViews, newView]);
  };

  const handleUpdateView = (id: string, nome: string, descricao?: string) => {
    setSavedViews(
      savedViews.map((view) =>
        view.id === id ? { ...view, nome, descricao } : view
      )
    );
  };

  const handleDeleteView = (id: string) => {
    setSavedViews(savedViews.filter((view) => view.id !== id));
  };

  const handleToggleFavorite = (id: string) => {
    setSavedViews(
      savedViews.map((view) =>
        view.id === id ? { ...view, isFavorito: !view.isFavorito } : view
      )
    );
  };

  const handleLoadView = (viewFilters: typeof filters) => {
    setFilters(viewFilters);
  };

  // Handler para exportação
  const handleExport = async (options: ExportOptions) => {
    // Simulação de exportação - em produção chamaria API
    await new Promise((resolve) => setTimeout(resolve, 2000));

    console.log('Exportando com opções:', options);
    console.log('Total de registros:', getRecordCount(options.scope));

    // Aqui você implementaria a lógica real de exportação
    // Exemplo: gerar arquivo XLSX, CSV ou PDF
  };

  const getRecordCount = (scope: ExportOptions['scope']): number => {
    switch (scope) {
      case 'all':
        return dataSource.length;
      case 'filtered':
        return filteredData.length;
      case 'selected':
        return selectedRecords.length;
      default:
        return 0;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pendente':
        return <Badge className="bg-blue-500">Pendente</Badge>;
      case 'vencido':
        return <Badge variant="destructive">Vencido</Badge>;
      case 'recebido':
        return <Badge className="bg-green-500">Recebido</Badge>;
      case 'cancelado':
        return <Badge variant="outline">Cancelado</Badge>;
      default:
        return <Badge variant="outline">-</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pendente':
        return <Clock className="h-4 w-4 text-blue-500" />;
      case 'vencido':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'recebido':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2 text-muted-foreground">Carregando contas a receber...</span>
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
            <TrendingUp className="h-8 w-8 text-green-500" />
            Contas a Receber
          </h1>
          <p className="text-muted-foreground mt-1">
            Gerencie recebimentos de clientes com filtros avançados
            {contasReceber.length > 0 && (
              <Badge variant="outline" className="ml-2">
                Dados Reais da API
              </Badge>
            )}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <ExportDialog
            totalRecords={dataSource.length}
            filteredRecords={filteredData.length}
            selectedRecords={selectedRecords.length}
            onExport={handleExport}
          />
          <Button size="lg" disabled={loading}>
            <Plus className="mr-2 h-4 w-4" />
            Nova Conta a Receber
          </Button>
        </div>
      </div>

      {/* Dashboard de KPIs Avançados */}
      <ARDashboardKPIs analytics={analytics} />

      {/* Gráficos de Análise */}
      <ARCharts />

      {/* Relatório de Aging */}
      <AgingReportTable agingReport={agingReport} />

      {/* Visualizações Salvas */}
      <SavedViews
        savedViews={savedViews}
        currentFilters={filters}
        onLoadView={handleLoadView}
        onSaveView={handleSaveView}
        onUpdateView={handleUpdateView}
        onDeleteView={handleDeleteView}
        onToggleFavorite={handleToggleFavorite}
      />

      {/* Filtros Avançados */}
      <AdvancedFilters
        filters={filters}
        onFiltersChange={setFilters}
        onSaveView={() => {
          // Trigger dialog em SavedViews - poderia usar um state compartilhado
          console.log('Abrir dialog de salvar visualização');
        }}
        totalResults={totalResults}
      />

      {/* Tabela de Contas Filtradas */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>
              Contas a Receber ({filteredData.length}
              {isFiltering && ` de ${dataSource.length}`})
            </CardTitle>
            {isFiltering && (
              <Badge variant="secondary" className="text-xs">
                Filtros ativos
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {filteredData.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">
                Nenhuma conta encontrada com os filtros aplicados
              </p>
              <Button variant="outline" onClick={() => setFilters({
                status: [],
                clientes: [],
                categoriasRisco: [],
                faixasVencimento: [],
                formasPagamento: [],
                ordenacao: 'vencimento_desc',
              })}>
                Limpar Filtros
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 font-semibold text-sm">Cliente</th>
                    <th className="text-left p-3 font-semibold text-sm">Documento</th>
                    <th className="text-left p-3 font-semibold text-sm">Emissão</th>
                    <th className="text-left p-3 font-semibold text-sm">Vencimento</th>
                    <th className="text-right p-3 font-semibold text-sm">Valor</th>
                    <th className="text-center p-3 font-semibold text-sm">Status</th>
                    <th className="text-center p-3 font-semibold text-sm">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.map((conta) => (
                    <tr key={conta.id} className="border-b hover:bg-muted/50 transition-colors">
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(conta.status)}
                          <span className="font-medium">{conta.clienteNome}</span>
                        </div>
                      </td>
                      <td className="p-3">
                        <span className="font-mono text-sm">{conta.numeroDocumento}</span>
                      </td>
                      <td className="p-3">
                        <span className="text-sm text-muted-foreground">
                          {conta.dataEmissao.toLocaleDateString('pt-BR')}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">
                            {conta.dataVencimento.toLocaleDateString('pt-BR')}
                          </span>
                          {conta.status === 'pendente' && conta.diasVencido === 0 && (
                            <span className="text-xs text-muted-foreground">
                              a vencer
                            </span>
                          )}
                          {conta.status === 'vencido' && (
                            <span className="text-xs text-red-600">
                              {conta.diasVencido} dias vencido
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-3 text-right">
                        <span className="font-semibold text-green-600">
                          R$ {conta.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        {getStatusBadge(conta.status)}
                      </td>
                      <td className="p-3">
                        <div className="flex items-center justify-center gap-2">
                          <GeneratePortalAccessDialog
                            clienteId={conta.clienteId}
                            clienteNome={conta.clienteNome}
                            clienteEmail={`contato@${conta.clienteNome.toLowerCase().replace(/\s+/g, '')}.com.br`}
                          />
                          <Button variant="outline" size="sm">
                            Ver Detalhes
                          </Button>
                          {conta.status === 'pendente' && (
                            <Button size="sm" className="bg-green-600 hover:bg-green-700">
                              Registrar Recebimento
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ContasAReceberPage;
