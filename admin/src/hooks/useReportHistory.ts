import { useState, useCallback, useMemo } from 'react';
import type { GeneratedReport, ReportHistoryFilter } from '@/types/report';

// Mock data para demonstração
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
  const [reports, setReports] = useState<GeneratedReport[]>(() => generateMockHistory());
  const [filters, setFilters] = useState<ReportHistoryFilter>({});
  const [loading, setLoading] = useState(false);

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
    setLoading(true);
    // TODO: Chamar API real
    await new Promise(resolve => setTimeout(resolve, 500));
    setReports(generateMockHistory());
    setLoading(false);
  }, []);

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

  // Estatísticas
  const stats = useMemo(() => {
    return {
      total: reports.length,
      concluidos: reports.filter(r => r.status === 'concluido').length,
      gerando: reports.filter(r => r.status === 'gerando').length,
      erros: reports.filter(r => r.status === 'erro').length,
      tamanhoTotal: reports.reduce((sum, r) => sum + r.arquivo.tamanho, 0),
      porFormato: {
        pdf: reports.filter(r => r.arquivo.formato === 'pdf').length,
        excel: reports.filter(r => r.arquivo.formato === 'excel').length,
        csv: reports.filter(r => r.arquivo.formato === 'csv').length,
        json: reports.filter(r => r.arquivo.formato === 'json').length
      }
    };
  }, [reports]);

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
    stats
  };
};
