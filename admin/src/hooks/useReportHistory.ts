import { useState, useCallback, useMemo, useEffect } from 'react';
import { api } from '@/lib/api';
import type { GeneratedReport, ReportHistoryFilter } from '@/types/report';

// API Response Types
interface GeneratedReportAPI {
  id: string;
  nome: string;
  tipo: string;
  subtipo: string;
  status: 'gerando' | 'concluido' | 'erro';
  formato: string;
  periodo_inicio: string;
  periodo_fim: string;
  arquivo_url?: string;
  arquivo_tamanho?: number;
  gerado_em: string;
  tags?: string[];
  erro_mensagem?: string;
}

interface ReportStatsAPI {
  total: number;
  concluidos: number;
  erros: number;
}

// Mock data para fallback
const generateMockHistory = (): GeneratedReport[] => {
  const now = new Date();
  const mockReports: GeneratedReport[] = [];

  const tipos: GeneratedReport['tipo'][] = ['financeiro', 'estoque', 'vendas'];
  const subtipos = ['dre', 'fluxo-caixa', 'posicao-estoque', 'vendas-periodo'];
  const formatos: GeneratedReport['arquivo']['formato'][] = ['pdf', 'excel', 'csv'];
  const usuarios = [
    { id: '1', nome: 'João Silva' },
    { id: '2', nome: 'Maria Santos' },
    { id: '3', nome: 'Pedro Oliveira' }
  ];

  for (let i = 0; i < 20; i++) {
    const tipo = tipos[i % tipos.length];
    const usuario = usuarios[i % usuarios.length];
    const formato = formatos[i % formatos.length];
    const daysAgo = Math.floor(i / 2);
    const geradoEm = new Date(now);
    geradoEm.setDate(geradoEm.getDate() - daysAgo);

    mockReports.push({
      id: `report-${i + 1}`,
      nome: `Relatório ${tipo} - ${geradoEm.toLocaleDateString('pt-BR')}`,
      tipo,
      subtipo: subtipos[i % subtipos.length],
      config: {} as unknown as import('@/types/report').ReportConfig, // Mock - seria a config completa
      geradoEm,
      geradoPor: usuario,
      arquivo: {
        url: `/reports/report-${i + 1}.${formato}`,
        formato,
        tamanho: Math.floor(Math.random() * 5000000) + 100000, // 100KB - 5MB
        hash: `hash-${i + 1}`
      },
      status: i === 0 ? 'gerando' : i === 1 ? 'erro' : 'concluido',
      erro: i === 1 ? 'Erro ao gerar relatório' : undefined,
      visualizacoes: Math.floor(Math.random() * 50),
      downloads: Math.floor(Math.random() * 30),
      compartilhamentos: Math.floor(Math.random() * 10),
      versao: 1,
      tags: i % 3 === 0 ? ['importante', 'mensal'] : i % 2 === 0 ? ['semanal'] : []
    });
  }

  return mockReports;
};

export const useReportHistory = () => {
  const [reports, setReports] = useState<GeneratedReport[]>([]);
  const [filters, setFilters] = useState<ReportHistoryFilter>({});
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<ReportStatsAPI>({ total: 0, concluidos: 0, erros: 0 });

  // Buscar relatórios da API
  const fetchReports = useCallback(async () => {
    console.log('🔄 [useReportHistory] Buscando histórico de relatórios da API');
    setLoading(true);

    try {
      const response = await api.get<{
        reports: GeneratedReportAPI[];
        stats: ReportStatsAPI;
        total: number;
      }>('/reports/generated?limit=50');

      console.log('✅ [useReportHistory] Relatórios recebidos:', response.reports.length);

      // Converter para o formato esperado pelo frontend
      const convertedReports: GeneratedReport[] = response.reports.map(r => ({
        id: r.id,
        nome: r.nome,
        tipo: r.tipo as any,
        subtipo: r.subtipo,
        config: {} as any,
        geradoEm: new Date(r.gerado_em),
        geradoPor: { id: 'current', nome: 'Usuário' },
        arquivo: {
          url: r.arquivo_url || '',
          formato: r.formato as any,
          tamanho: r.arquivo_tamanho || 0,
          hash: r.id
        },
        status: r.status,
        erro: r.erro_mensagem,
        visualizacoes: 0,
        downloads: 0,
        compartilhamentos: 0,
        versao: 1,
        tags: r.tags || []
      }));

      setReports(convertedReports);
      setStats(response.stats);
    } catch (err) {
      console.error('❌ [useReportHistory] Erro ao buscar relatórios:', err);
      // Sem fallback para mock - mostrar vazio se não houver dados
      setReports([]);
      setStats({ total: 0, concluidos: 0, erros: 0 });
    } finally {
      setLoading(false);
    }
  }, []);

  // Buscar dados ao montar
  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  // Filtrar relatórios
  const filteredReports = useMemo(() => {
    return reports.filter(report => {
      // Filtro por tipo
      if (filters.tipo && filters.tipo.length > 0) {
        if (!filters.tipo.includes(report.tipo)) return false;
      }

      // Filtro por formato
      if (filters.formato && filters.formato.length > 0) {
        if (!filters.formato.includes(report.arquivo.formato)) return false;
      }

      // Filtro por status
      if (filters.status && filters.status.length > 0) {
        if (!filters.status.includes(report.status)) return false;
      }

      // Filtro por data
      if (filters.dataInicio) {
        if (report.geradoEm < filters.dataInicio) return false;
      }
      if (filters.dataFim) {
        if (report.geradoEm > filters.dataFim) return false;
      }

      // Filtro por usuário
      if (filters.geradoPor && filters.geradoPor.length > 0) {
        if (!filters.geradoPor.includes(report.geradoPor.id)) return false;
      }

      // Filtro por tags
      if (filters.tags && filters.tags.length > 0) {
        const hasTag = filters.tags.some(tag => report.tags.includes(tag));
        if (!hasTag) return false;
      }

      // Busca por nome
      if (filters.busca) {
        const busca = filters.busca.toLowerCase();
        if (!report.nome.toLowerCase().includes(busca)) return false;
      }

      return true;
    });
  }, [reports, filters]);

  // Recarregar histórico
  const refresh = useCallback(async () => {
    await fetchReports();
  }, [fetchReports]);

  // Download de relatório
  const download = useCallback(async (reportId: string) => {
    const report = reports.find(r => r.id === reportId);
    if (!report) return;

    // TODO: Implementar download real via API
    // Por enquanto, apenas simula
    console.log(`Downloading report: ${report.arquivo.url}`);

    // Atualizar contador de downloads
    setReports(prev => prev.map(r =>
      r.id === reportId
        ? { ...r, downloads: r.downloads + 1 }
        : r
    ));

    // Simular download
    alert(`📥 Download iniciado: ${report.nome}\nFormato: ${report.arquivo.formato}`);
  }, [reports]);

  // Deletar relatório
  const deleteReport = useCallback(async (reportId: string) => {
    // TODO: Chamar API real
    setReports(prev => prev.filter(r => r.id !== reportId));
  }, []);

  // Visualizar relatório
  const view = useCallback(async (reportId: string) => {
    // Atualizar contador de visualizações
    setReports(prev => prev.map(r =>
      r.id === reportId
        ? { ...r, visualizacoes: r.visualizacoes + 1 }
        : r
    ));

    // TODO: Abrir visualizador de relatório
    const report = reports.find(r => r.id === reportId);
    if (report) {
      window.open(report.arquivo.url, '_blank');
    }
  }, [reports]);

  // Adicionar tags
  const addTags = useCallback(async (reportId: string, tags: string[]) => {
    setReports(prev => prev.map(r =>
      r.id === reportId
        ? { ...r, tags: [...new Set([...r.tags, ...tags])] }
        : r
    ));
  }, []);

  // Remover tag
  const removeTag = useCallback(async (reportId: string, tag: string) => {
    setReports(prev => prev.map(r =>
      r.id === reportId
        ? { ...r, tags: r.tags.filter(t => t !== tag) }
        : r
    ));
  }, []);

  // Estatísticas combinadas (API + local)
  const combinedStats = useMemo(() => {
    return {
      total: stats.total || reports.length,
      concluidos: stats.concluidos || reports.filter(r => r.status === 'concluido').length,
      gerando: reports.filter(r => r.status === 'gerando').length,
      erros: stats.erros || reports.filter(r => r.status === 'erro').length,
      tamanhoTotal: reports.reduce((sum, r) => sum + r.arquivo.tamanho, 0),
      porFormato: {
        pdf: reports.filter(r => r.arquivo.formato === 'pdf').length,
        excel: reports.filter(r => r.arquivo.formato === 'excel').length,
        csv: reports.filter(r => r.arquivo.formato === 'csv').length,
        json: reports.filter(r => r.arquivo.formato === 'json').length
      }
    };
  }, [reports, stats]);

  return {
    reports: filteredReports,
    allReports: reports,
    filters,
    setFilters,
    loading,
    refresh,
    download,
    deleteReport,
    view,
    addTags,
    removeTag,
    stats: combinedStats
  };
};
