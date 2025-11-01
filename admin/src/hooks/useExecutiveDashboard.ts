import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
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
  format
} from 'date-fns';
import { ptBR } from 'date-fns/locale';

// ============================================
// API RESPONSE TYPES
// ============================================

interface ExecutiveDashboardKPIsAPIResponse {
  kpis: ExecutiveDashboardKPI[];
  periodo_inicio: string;
  periodo_fim: string;
  periodo_comparacao_inicio: string;
  periodo_comparacao_fim: string;
}

interface ExecutiveDashboardChartsAPIResponse {
  graficos: ExecutiveDashboardChart[];
}

interface ComparisonMetric {
  metrica: string;
  valorAtual: number;
  valorAnterior: number;
  diferenca: number;
  diferencaPercentual: number;
  tendencia: 'up' | 'down' | 'stable';
}

interface Insight {
  id: string;
  tipo: 'positivo' | 'negativo' | 'alerta' | 'neutro';
  titulo: string;
  descricao: string;
  icone?: string;
}

interface ExecutiveDashboardInsightsAPIResponse {
  comparacao: {
    periodo: string;
    periodoAnterior: string;
    metricas: ComparisonMetric[];
  };
  insights: Insight[];
}

// ============================================
// HOOK
// ============================================

interface UseExecutiveDashboardReturn {
  data: ExecutiveDashboardData;
  filter: ExecutiveDashboardFilter;
  setTipoComparacao: (tipo: ExecutiveDashboardFilter['tipoComparacao']) => void;
  setPeriodoAtual: (periodo: ExecutiveDashboardFilter['periodoAtual']) => void;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  bookmarks: ExecutiveDashboardBookmark[];
  saveBookmark: (nome: string) => void;
  toggleFavoriteBookmark: (id: string) => void;
}

export const useExecutiveDashboard = (): UseExecutiveDashboardReturn => {
  // Estado
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [kpis, setKpis] = useState<ExecutiveDashboardKPI[]>([]);
  const [graficos, setGraficos] = useState<ExecutiveDashboardChart[]>([]);
  const [comparacao, setComparacao] = useState<ExecutiveDashboardComparison>({
    periodo: '',
    periodoAnterior: '',
    metricas: []
  });
  const [insights, setInsights] = useState<Insight[]>([]);
  const [bookmarks, setBookmarks] = useState<ExecutiveDashboardBookmark[]>([]);

  // Filtros
  const [filter, setFilter] = useState<ExecutiveDashboardFilter>({
    tipoComparacao: 'periodo-anterior',
    periodoAtual: {
      inicio: startOfMonth(new Date()),
      fim: endOfMonth(new Date())
    }
  });

  // Função para buscar dados da API
  const fetchDashboardData = useCallback(async () => {
    console.log('🔄 [useExecutiveDashboard] Buscando dados do dashboard executivo');
    setLoading(true);
    setError(null);

    try {
      const periodStart = format(filter.periodoAtual.inicio, 'yyyy-MM-dd');
      const periodEnd = format(filter.periodoAtual.fim, 'yyyy-MM-dd');

      // Buscar KPIs, Charts e Insights em paralelo
      const [kpisResponse, chartsResponse, insightsResponse] = await Promise.all([
        api.get<ExecutiveDashboardKPIsAPIResponse>(
          `/reports/executive-dashboard/kpis?period_start=${periodStart}&period_end=${periodEnd}`
        ),
        api.get<ExecutiveDashboardChartsAPIResponse>(
          `/reports/executive-dashboard/charts?period_start=${periodStart}&period_end=${periodEnd}`
        ),
        api.get<ExecutiveDashboardInsightsAPIResponse>(
          `/reports/executive-dashboard/insights?period_start=${periodStart}&period_end=${periodEnd}`
        )
      ]);

      console.log('✅ [useExecutiveDashboard] KPIs recebidos:', kpisResponse.kpis.length);
      console.log('✅ [useExecutiveDashboard] Gráficos recebidos:', chartsResponse.graficos.length);
      console.log('✅ [useExecutiveDashboard] Insights recebidos:', insightsResponse.insights.length);

      // Atualizar estado
      setKpis(kpisResponse.kpis);
      setGraficos(chartsResponse.graficos);
      setComparacao(insightsResponse.comparacao);
      setInsights(insightsResponse.insights);

    } catch (err) {
      console.error('❌ [useExecutiveDashboard] Erro ao buscar dados:', err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar dashboard executivo');

      // Dados vazios em caso de erro
      setKpis([]);
      setGraficos([]);
      setComparacao({ periodo: '', periodoAnterior: '', metricas: [] });
      setInsights([{
        id: 'error-1',
        tipo: 'alerta',
        titulo: 'Erro ao Carregar Dados',
        descricao: 'Não foi possível carregar os dados do dashboard. Tente novamente.',
        icone: 'AlertTriangle'
      }]);
    } finally {
      setLoading(false);
    }
  }, [filter.periodoAtual]);

  // Buscar dados ao montar e quando filtro mudar
  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Função para alterar tipo de comparação
  const setTipoComparacao = useCallback((tipo: ExecutiveDashboardFilter['tipoComparacao']) => {
    setFilter(prev => ({ ...prev, tipoComparacao: tipo }));

    // Ajustar período de comparação baseado no tipo
    let novaComparacao: Date;
    switch (tipo) {
      case 'mesmo-periodo-ano-anterior':
        novaComparacao = subYears(filter.periodoAtual.inicio, 1);
        break;
      case 'periodo-anterior':
      default:
        novaComparacao = subMonths(filter.periodoAtual.inicio, 1);
        break;
    }

    // Atualizar período de comparação (se necessário no futuro)
    console.log('Tipo de comparação alterado para:', tipo);
  }, [filter.periodoAtual]);

  // Função para alterar período atual
  const setPeriodoAtual = useCallback((periodo: ExecutiveDashboardFilter['periodoAtual']) => {
    setFilter(prev => ({ ...prev, periodoAtual: periodo }));
  }, []);

  // Função para refresh manual
  const refresh = useCallback(async () => {
    await fetchDashboardData();
  }, [fetchDashboardData]);

  // Funções de bookmarks (mockadas por enquanto)
  const saveBookmark = useCallback((nome: string) => {
    const newBookmark: ExecutiveDashboardBookmark = {
      id: `bookmark-${Date.now()}`,
      nome,
      filtros: { ...filter },
      kpisVisiveis: kpis.map(k => k.id),
      graficosVisiveis: graficos.map(g => g.id),
      criadoEm: new Date(),
      criadoPor: {
        id: 'current-user',
        nome: 'Usuário Atual'
      },
      publico: false,
      favorito: false
    };
    setBookmarks(prev => [...prev, newBookmark]);
    console.log('Bookmark salvo:', nome);
  }, [filter, kpis, graficos]);

  const toggleFavoriteBookmark = useCallback((id: string) => {
    setBookmarks(prev =>
      prev.map(bookmark =>
        bookmark.id === id
          ? { ...bookmark, favorito: !bookmark.favorito }
          : bookmark
      )
    );
  }, []);

  // Montar objeto de dados consolidado
  const data: ExecutiveDashboardData = {
    kpis,
    graficos,
    comparacao,
    insights,
    atualizadoEm: new Date()
  };

  return {
    data,
    filter,
    setTipoComparacao,
    setPeriodoAtual,
    loading,
    error,
    refresh,
    bookmarks,
    saveBookmark,
    toggleFavoriteBookmark
  };
};
