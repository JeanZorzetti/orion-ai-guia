import { useState, useCallback, useMemo } from 'react';
import {
  ExecutiveDashboardData,
  ExecutiveDashboardFilter,
  ExecutiveDashboardKPI,
  ExecutiveDashboardChart,
  ExecutiveDashboardComparison,
  ExecutiveDashboardBookmark
} from '@/types/report';
import {
  subMonths,
  subYears,
  startOfMonth,
  endOfMonth,
  format,
  differenceInDays
} from 'date-fns';
import { ptBR } from 'date-fns/locale';

// ============================================
// MOCK DATA GENERATORS
// ============================================

const generateMockKPIs = (): ExecutiveDashboardKPI[] => {
  const kpis: ExecutiveDashboardKPI[] = [
    {
      id: 'receita-total',
      titulo: 'Receita Total',
      valor: 485750.00,
      valorFormatado: 'R$ 485.750,00',
      variacao: 12.5,
      variacaoAbsoluta: 54000,
      tendencia: 'up',
      categoria: 'receita',
      cor: '#10b981',
      meta: 500000,
      percentualMeta: 97.15,
    },
    {
      id: 'despesa-total',
      titulo: 'Despesas Totais',
      valor: 312450.00,
      valorFormatado: 'R$ 312.450,00',
      variacao: -8.3,
      variacaoAbsoluta: -28300,
      tendencia: 'down',
      categoria: 'despesa',
      cor: '#ef4444',
    },
    {
      id: 'lucro-liquido',
      titulo: 'Lucro Líquido',
      valor: 173300.00,
      valorFormatado: 'R$ 173.300,00',
      variacao: 45.2,
      variacaoAbsoluta: 53950,
      tendencia: 'up',
      categoria: 'lucro',
      cor: '#3b82f6',
      meta: 150000,
      percentualMeta: 115.53,
    },
    {
      id: 'margem-lucro',
      titulo: 'Margem de Lucro',
      valor: 35.67,
      valorFormatado: '35,67%',
      variacao: 18.9,
      variacaoAbsoluta: 5.67,
      tendencia: 'up',
      categoria: 'lucro',
      cor: '#8b5cf6',
    },
    {
      id: 'vendas-total',
      titulo: 'Total de Vendas',
      valor: 287,
      valorFormatado: '287 vendas',
      variacao: 15.7,
      variacaoAbsoluta: 39,
      tendencia: 'up',
      categoria: 'vendas',
      cor: '#f59e0b',
      meta: 300,
      percentualMeta: 95.67,
    },
    {
      id: 'ticket-medio',
      titulo: 'Ticket Médio',
      valor: 1692.51,
      valorFormatado: 'R$ 1.692,51',
      variacao: -2.8,
      variacaoAbsoluta: -48.65,
      tendencia: 'down',
      categoria: 'vendas',
      cor: '#06b6d4',
    },
    {
      id: 'estoque-valor',
      titulo: 'Valor em Estoque',
      valor: 842350.00,
      valorFormatado: 'R$ 842.350,00',
      variacao: 3.2,
      variacaoAbsoluta: 26100,
      tendencia: 'up',
      categoria: 'estoque',
      cor: '#6366f1',
    },
    {
      id: 'giro-estoque',
      titulo: 'Giro de Estoque',
      valor: 4.8,
      valorFormatado: '4,8x',
      variacao: 9.1,
      variacaoAbsoluta: 0.4,
      tendencia: 'up',
      categoria: 'estoque',
      cor: '#ec4899',
    },
  ];

  return kpis;
};

const generateMockCharts = (): ExecutiveDashboardChart[] => {
  const charts: ExecutiveDashboardChart[] = [
    {
      id: 'receita-despesa-mensal',
      titulo: 'Receita vs Despesa (Últimos 6 Meses)',
      tipo: 'barra',
      dados: {
        labels: ['Ago', 'Set', 'Out', 'Nov', 'Dez', 'Jan'],
        datasets: [
          {
            label: 'Receita',
            data: [385000, 412000, 438000, 465000, 471000, 485750],
            backgroundColor: '#10b981',
          },
          {
            label: 'Despesa',
            data: [298000, 315000, 325000, 332000, 340000, 312450],
            backgroundColor: '#ef4444',
          },
        ],
      },
      config: {
        showLegend: true,
        showGrid: true,
        showTooltip: true,
        enableDrillDown: true,
        drillDownPath: '/admin/financeiro',
      },
    },
    {
      id: 'lucro-mensal',
      titulo: 'Evolução do Lucro Líquido',
      tipo: 'linha',
      dados: {
        labels: ['Ago', 'Set', 'Out', 'Nov', 'Dez', 'Jan'],
        datasets: [
          {
            label: 'Lucro Líquido',
            data: [87000, 97000, 113000, 133000, 131000, 173300],
            borderColor: '#3b82f6',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            fill: true,
          },
        ],
      },
      config: {
        showLegend: false,
        showGrid: true,
        showTooltip: true,
        enableZoom: true,
      },
    },
    {
      id: 'vendas-categoria',
      titulo: 'Vendas por Categoria',
      tipo: 'pizza',
      dados: {
        labels: ['Eletrônicos', 'Móveis', 'Vestuário', 'Alimentos', 'Outros'],
        datasets: [
          {
            label: 'Vendas',
            data: [145000, 98000, 87000, 72000, 83750],
            backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'],
          },
        ],
      },
      config: {
        showLegend: true,
        showTooltip: true,
        enableDrillDown: true,
        drillDownPath: '/admin/vendas',
      },
    },
    {
      id: 'fluxo-caixa-diario',
      titulo: 'Fluxo de Caixa Diário (Últimos 30 dias)',
      tipo: 'area',
      dados: {
        labels: Array.from({ length: 30 }, (_, i) => `Dia ${i + 1}`),
        datasets: [
          {
            label: 'Saldo',
            data: Array.from({ length: 30 }, () => Math.random() * 50000 + 150000),
            borderColor: '#6366f1',
            backgroundColor: 'rgba(99, 102, 241, 0.2)',
            fill: true,
          },
        ],
      },
      config: {
        showLegend: false,
        showGrid: true,
        showTooltip: true,
        enableZoom: true,
      },
    },
    {
      id: 'margem-categoria',
      titulo: 'Margem de Lucro por Categoria',
      tipo: 'barra',
      dados: {
        labels: ['Eletrônicos', 'Móveis', 'Vestuário', 'Alimentos', 'Outros'],
        datasets: [
          {
            label: 'Margem (%)',
            data: [42.5, 38.2, 35.8, 28.4, 31.2],
            backgroundColor: '#8b5cf6',
          },
        ],
      },
      config: {
        showLegend: false,
        showGrid: true,
        showTooltip: true,
      },
    },
    {
      id: 'top-produtos',
      titulo: 'Top 10 Produtos Mais Vendidos',
      tipo: 'barraEmpilhada',
      dados: {
        labels: ['Prod A', 'Prod B', 'Prod C', 'Prod D', 'Prod E', 'Prod F', 'Prod G', 'Prod H', 'Prod I', 'Prod J'],
        datasets: [
          {
            label: 'Quantidade',
            data: [145, 132, 128, 115, 98, 87, 76, 65, 54, 42],
            backgroundColor: '#10b981',
          },
        ],
      },
      config: {
        showLegend: false,
        showGrid: true,
        showTooltip: true,
        enableDrillDown: true,
        drillDownPath: '/admin/estoque/produtos',
      },
    },
  ];

  return charts;
};

const generateMockComparison = (filter: ExecutiveDashboardFilter): ExecutiveDashboardComparison => {
  const periodoAtual = format(filter.periodoAtual.inicio, 'MMMM/yyyy', { locale: ptBR });
  const periodoAnterior = format(
    filter.tipoComparacao === 'mesmo-periodo-ano-anterior'
      ? subYears(filter.periodoAtual.inicio, 1)
      : subMonths(filter.periodoAtual.inicio, 1),
    'MMMM/yyyy',
    { locale: ptBR }
  );

  return {
    periodo: periodoAtual,
    periodoAnterior,
    metricas: [
      {
        metrica: 'Receita Total',
        valorAtual: 485750,
        valorAnterior: 431750,
        diferenca: 54000,
        diferencaPercentual: 12.5,
        tendencia: 'up',
      },
      {
        metrica: 'Despesas Totais',
        valorAtual: 312450,
        valorAnterior: 340750,
        diferenca: -28300,
        diferencaPercentual: -8.3,
        tendencia: 'down',
      },
      {
        metrica: 'Lucro Líquido',
        valorAtual: 173300,
        valorAnterior: 119350,
        diferenca: 53950,
        diferencaPercentual: 45.2,
        tendencia: 'up',
      },
      {
        metrica: 'Margem de Lucro',
        valorAtual: 35.67,
        valorAnterior: 27.64,
        diferenca: 8.03,
        diferencaPercentual: 29.1,
        tendencia: 'up',
      },
      {
        metrica: 'Número de Vendas',
        valorAtual: 287,
        valorAnterior: 248,
        diferenca: 39,
        diferencaPercentual: 15.7,
        tendencia: 'up',
      },
      {
        metrica: 'Ticket Médio',
        valorAtual: 1692.51,
        valorAnterior: 1741.16,
        diferenca: -48.65,
        diferencaPercentual: -2.8,
        tendencia: 'down',
      },
    ],
  };
};

const generateMockInsights = () => {
  return [
    {
      tipo: 'positivo' as const,
      titulo: 'Lucro cresceu 45%',
      descricao: 'O lucro líquido teve um aumento significativo de 45,2% em relação ao período anterior, principalmente devido à redução de 8,3% nas despesas operacionais.',
      icone: 'TrendingUp',
    },
    {
      tipo: 'positivo' as const,
      titulo: 'Meta de receita quase atingida',
      descricao: 'A receita atual está em 97,15% da meta mensal de R$ 500.000. Faltam apenas R$ 14.250 para atingir 100%.',
      icone: 'Target',
    },
    {
      tipo: 'alerta' as const,
      titulo: 'Ticket médio em queda',
      descricao: 'O ticket médio caiu 2,8% em relação ao período anterior. Considere estratégias de upsell e cross-sell para reverter essa tendência.',
      icone: 'AlertTriangle',
    },
    {
      tipo: 'neutro' as const,
      titulo: 'Giro de estoque saudável',
      descricao: 'O giro de estoque de 4,8x está dentro da faixa ideal para o setor, indicando boa gestão de inventário.',
      icone: 'Package',
    },
  ];
};

// ============================================
// HOOK PRINCIPAL
// ============================================

export const useExecutiveDashboard = () => {
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<ExecutiveDashboardFilter>(() => {
    const hoje = new Date();
    const inicioMesAtual = startOfMonth(hoje);
    const fimMesAtual = endOfMonth(hoje);

    return {
      periodoAtual: {
        inicio: inicioMesAtual,
        fim: fimMesAtual,
      },
      tipoComparacao: 'periodo-anterior',
    };
  });

  const [bookmarks, setBookmarks] = useState<ExecutiveDashboardBookmark[]>([
    {
      id: 'bookmark-1',
      nome: 'Visão Geral Mensal',
      descricao: 'Dashboard padrão com principais KPIs do mês',
      filtros: filter,
      kpisVisiveis: ['receita-total', 'despesa-total', 'lucro-liquido', 'margem-lucro'],
      graficosVisiveis: ['receita-despesa-mensal', 'lucro-mensal'],
      layout: 'grid',
      criadoEm: new Date(),
      criadoPor: { id: '1', nome: 'Admin' },
      publico: true,
      favorito: true,
    },
  ]);

  // Gerar dados do dashboard
  const dashboardData = useMemo<ExecutiveDashboardData>(() => {
    const kpis = generateMockKPIs();
    const graficos = generateMockCharts();
    const comparacao = generateMockComparison(filter);
    const insights = generateMockInsights();

    return {
      kpis,
      graficos,
      comparacao,
      insights,
      atualizadoEm: new Date(),
    };
  }, [filter]);

  // Atualizar filtro
  const updateFilter = useCallback((updates: Partial<ExecutiveDashboardFilter>) => {
    setFilter(prev => ({ ...prev, ...updates }));
  }, []);

  // Alterar tipo de comparação
  const setTipoComparacao = useCallback((tipo: ExecutiveDashboardFilter['tipoComparacao']) => {
    setFilter(prev => {
      const newFilter = { ...prev, tipoComparacao: tipo };

      // Calcular período de comparação automaticamente
      if (tipo === 'periodo-anterior') {
        const dias = differenceInDays(prev.periodoAtual.fim, prev.periodoAtual.inicio);
        const inicioAnterior = subMonths(prev.periodoAtual.inicio, 1);
        newFilter.periodoComparacao = {
          inicio: inicioAnterior,
          fim: new Date(inicioAnterior.getTime() + dias * 24 * 60 * 60 * 1000),
        };
      } else if (tipo === 'mesmo-periodo-ano-anterior') {
        newFilter.periodoComparacao = {
          inicio: subYears(prev.periodoAtual.inicio, 1),
          fim: subYears(prev.periodoAtual.fim, 1),
        };
      }

      return newFilter;
    });
  }, []);

  // Alterar período atual
  const setPeriodoAtual = useCallback((inicio: Date, fim: Date) => {
    setFilter(prev => ({
      ...prev,
      periodoAtual: { inicio, fim },
    }));
  }, []);

  // Refresh data
  const refresh = useCallback(async () => {
    setLoading(true);
    // Simular API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setLoading(false);
  }, []);

  // Bookmarks CRUD
  const saveBookmark = useCallback((bookmark: Omit<ExecutiveDashboardBookmark, 'id' | 'criadoEm'>) => {
    const newBookmark: ExecutiveDashboardBookmark = {
      ...bookmark,
      id: `bookmark-${Date.now()}`,
      criadoEm: new Date(),
    };
    setBookmarks(prev => [...prev, newBookmark]);
    return newBookmark;
  }, []);

  const deleteBookmark = useCallback((id: string) => {
    setBookmarks(prev => prev.filter(b => b.id !== id));
  }, []);

  const toggleFavoriteBookmark = useCallback((id: string) => {
    setBookmarks(prev =>
      prev.map(b => (b.id === id ? { ...b, favorito: !b.favorito } : b))
    );
  }, []);

  const loadBookmark = useCallback((bookmark: ExecutiveDashboardBookmark) => {
    setFilter(bookmark.filtros);
  }, []);

  // Filtrar KPIs e gráficos por bookmark
  const filteredData = useMemo(() => {
    const activeBookmark = bookmarks.find(b => b.favorito);

    if (!activeBookmark) {
      return dashboardData;
    }

    return {
      ...dashboardData,
      kpis: dashboardData.kpis.filter(kpi => activeBookmark.kpisVisiveis.includes(kpi.id)),
      graficos: dashboardData.graficos.filter(chart => activeBookmark.graficosVisiveis.includes(chart.id)),
    };
  }, [dashboardData, bookmarks]);

  return {
    data: filteredData,
    filter,
    updateFilter,
    setTipoComparacao,
    setPeriodoAtual,
    loading,
    refresh,
    bookmarks,
    saveBookmark,
    deleteBookmark,
    toggleFavoriteBookmark,
    loadBookmark,
  };
};
