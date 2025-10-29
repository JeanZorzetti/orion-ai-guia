import { useState, useCallback, useMemo } from 'react';
import type { ReportTemplate, ReportTemplateFilter, ReportConfig } from '@/types/report';
import { startOfMonth, endOfMonth } from 'date-fns';

// Mock data para demonstração
const generateMockTemplates = (): ReportTemplate[] => {
  const now = new Date();
  const usuario = { id: '1', nome: 'João Silva' };

  const templates: ReportTemplate[] = [
    {
      id: 'template-1',
      nome: 'DRE Mensal Padrão',
      descricao: 'Demonstração do Resultado do Exercício do mês atual com comparação',
      config: {
        id: 'config-1',
        tipo: 'financeiro',
        subtipo: 'dre',
        nome: 'DRE Mensal',
        periodo: {
          tipo: 'mes',
          inicio: startOfMonth(now),
          fim: endOfMonth(now)
        },
        filtros: {},
        agrupamento: { campo: 'categoria', ordem: 'desc' },
        visualizacao: {
          incluirGraficos: true,
          incluirTabelas: true,
          incluirResumo: true,
          incluirComparativo: true,
          periodoComparacao: 'anterior'
        },
        exportacao: {
          formato: 'pdf',
          orientacao: 'portrait',
          incluirCapa: true,
          incluirIndice: true,
          logoEmpresa: true
        }
      },
      criadoEm: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
      criadoPor: usuario,
      atualizadoEm: now,
      vezesUsado: 45,
      ultimoUso: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
      categoria: 'financeiro',
      tags: ['dre', 'mensal', 'executivo'],
      favorito: true,
      publico: true,
      valido: true
    },
    {
      id: 'template-2',
      nome: 'Fluxo de Caixa Semanal',
      descricao: 'Projeção de fluxo de caixa para os próximos 7 dias',
      config: {
        id: 'config-2',
        tipo: 'financeiro',
        subtipo: 'fluxo-caixa',
        nome: 'Fluxo de Caixa Semanal',
        periodo: {
          tipo: 'semana',
          inicio: now,
          fim: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
        },
        filtros: {},
        agrupamento: { campo: 'dia', ordem: 'asc' },
        visualizacao: {
          incluirGraficos: true,
          incluirTabelas: true,
          incluirResumo: true,
          incluirComparativo: false
        },
        exportacao: {
          formato: 'excel',
          incluirCapa: false,
          incluirIndice: false,
          logoEmpresa: false
        }
      },
      criadoEm: new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000),
      criadoPor: usuario,
      atualizadoEm: now,
      vezesUsado: 120,
      ultimoUso: now,
      categoria: 'financeiro',
      tags: ['fluxo-caixa', 'semanal', 'operacional'],
      favorito: true,
      publico: true,
      valido: true
    },
    {
      id: 'template-3',
      nome: 'Posição de Estoque',
      descricao: 'Relatório completo de posição de estoque com valorização',
      config: {
        id: 'config-3',
        tipo: 'estoque',
        subtipo: 'posicao',
        nome: 'Posição de Estoque',
        periodo: {
          tipo: 'dia',
          inicio: now,
          fim: now
        },
        filtros: {},
        agrupamento: { campo: 'categoria', ordem: 'desc' },
        visualizacao: {
          incluirGraficos: true,
          incluirTabelas: true,
          incluirResumo: true,
          incluirComparativo: false
        },
        exportacao: {
          formato: 'excel',
          incluirCapa: true,
          incluirIndice: false,
          logoEmpresa: true
        }
      },
      criadoEm: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000),
      criadoPor: usuario,
      atualizadoEm: now,
      vezesUsado: 30,
      ultimoUso: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
      categoria: 'estoque',
      tags: ['estoque', 'diario', 'valorização'],
      favorito: false,
      publico: true,
      valido: true
    },
    {
      id: 'template-4',
      nome: 'Vendas Mensais por Produto',
      descricao: 'Análise de vendas do mês agrupada por produto',
      config: {
        id: 'config-4',
        tipo: 'vendas',
        subtipo: 'por-produto',
        nome: 'Vendas por Produto',
        periodo: {
          tipo: 'mes',
          inicio: startOfMonth(now),
          fim: endOfMonth(now)
        },
        filtros: {},
        agrupamento: { campo: 'produto', ordem: 'desc', limite: 20 },
        visualizacao: {
          incluirGraficos: true,
          incluirTabelas: true,
          incluirResumo: true,
          incluirComparativo: true,
          periodoComparacao: 'ano-anterior'
        },
        exportacao: {
          formato: 'pdf',
          orientacao: 'landscape',
          incluirCapa: true,
          incluirIndice: true,
          logoEmpresa: true
        }
      },
      criadoEm: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000),
      criadoPor: usuario,
      atualizadoEm: now,
      vezesUsado: 25,
      ultimoUso: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
      categoria: 'vendas',
      tags: ['vendas', 'mensal', 'produtos'],
      favorito: false,
      publico: false,
      valido: true
    },
    {
      id: 'template-5',
      nome: 'Dashboard Executivo',
      descricao: 'Visão consolidada com todos os KPIs principais',
      config: {
        id: 'config-5',
        tipo: 'customizado',
        subtipo: 'dashboard',
        nome: 'Dashboard Executivo',
        periodo: {
          tipo: 'mes',
          inicio: startOfMonth(now),
          fim: endOfMonth(now)
        },
        filtros: {},
        agrupamento: { campo: 'categoria', ordem: 'desc' },
        visualizacao: {
          incluirGraficos: true,
          incluirTabelas: true,
          incluirResumo: true,
          incluirComparativo: true,
          periodoComparacao: 'anterior'
        },
        exportacao: {
          formato: 'pdf',
          orientacao: 'landscape',
          incluirCapa: true,
          incluirIndice: true,
          logoEmpresa: true
        }
      },
      criadoEm: new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000),
      criadoPor: usuario,
      atualizadoEm: now,
      vezesUsado: 90,
      ultimoUso: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
      categoria: 'gerencial',
      tags: ['dashboard', 'executivo', 'kpis', 'mensal'],
      favorito: true,
      publico: true,
      valido: true
    }
  ];

  return templates;
};

export const useReportTemplates = () => {
  const [templates, setTemplates] = useState<ReportTemplate[]>(() => generateMockTemplates());
  const [filters, setFilters] = useState<ReportTemplateFilter>({});
  const [loading, setLoading] = useState(false);

  // Filtrar templates
  const filteredTemplates = useMemo(() => {
    return templates.filter(template => {
      // Filtro por categoria
      if (filters.categoria && filters.categoria.length > 0) {
        if (!filters.categoria.includes(template.categoria)) return false;
      }

      // Filtro por tags
      if (filters.tags && filters.tags.length > 0) {
        const hasTag = filters.tags.some(tag => template.tags.includes(tag));
        if (!hasTag) return false;
      }

      // Filtro por favoritos
      if (filters.favoritos !== undefined) {
        if (template.favorito !== filters.favoritos) return false;
      }

      // Filtro por públicos
      if (filters.publicos !== undefined) {
        if (template.publico !== filters.publicos) return false;
      }

      // Filtro por criador
      if (filters.criadoPor && filters.criadoPor.length > 0) {
        if (!filters.criadoPor.includes(template.criadoPor.id)) return false;
      }

      // Busca por nome/descrição
      if (filters.busca) {
        const busca = filters.busca.toLowerCase();
        const nomeMatch = template.nome.toLowerCase().includes(busca);
        const descMatch = template.descricao.toLowerCase().includes(busca);
        if (!nomeMatch && !descMatch) return false;
      }

      return true;
    });
  }, [templates, filters]);

  // Recarregar templates
  const refresh = useCallback(async () => {
    setLoading(true);
    // TODO: Chamar API real
    await new Promise(resolve => setTimeout(resolve, 500));
    setTemplates(generateMockTemplates());
    setLoading(false);
  }, []);

  // Criar novo template
  const create = useCallback(async (config: ReportConfig, nome: string, descricao: string) => {
    const newTemplate: ReportTemplate = {
      id: `template-${Date.now()}`,
      nome,
      descricao,
      config,
      criadoEm: new Date(),
      criadoPor: { id: '1', nome: 'João Silva' },
      atualizadoEm: new Date(),
      vezesUsado: 0,
      categoria: config.tipo === 'customizado' ? 'custom' : config.tipo,
      tags: [],
      favorito: false,
      publico: false,
      valido: true
    };

    setTemplates(prev => [newTemplate, ...prev]);
    return newTemplate;
  }, []);

  // Atualizar template
  const update = useCallback(async (templateId: string, updates: Partial<ReportTemplate>) => {
    setTemplates(prev => prev.map(t =>
      t.id === templateId
        ? { ...t, ...updates, atualizadoEm: new Date() }
        : t
    ));
  }, []);

  // Deletar template
  const deleteTemplate = useCallback(async (templateId: string) => {
    setTemplates(prev => prev.filter(t => t.id !== templateId));
  }, []);

  // Duplicar template
  const duplicate = useCallback(async (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (!template) return;

    const newTemplate: ReportTemplate = {
      ...template,
      id: `template-${Date.now()}`,
      nome: `${template.nome} (Cópia)`,
      criadoEm: new Date(),
      atualizadoEm: new Date(),
      vezesUsado: 0,
      ultimoUso: undefined
    };

    setTemplates(prev => [newTemplate, ...prev]);
    return newTemplate;
  }, [templates]);

  // Usar template (incrementar contador)
  const applyTemplate = useCallback(async (templateId: string) => {
    setTemplates(prev => prev.map(t =>
      t.id === templateId
        ? {
            ...t,
            vezesUsado: t.vezesUsado + 1,
            ultimoUso: new Date()
          }
        : t
    ));
  }, []);

  // Toggle favorito
  const toggleFavorite = useCallback(async (templateId: string) => {
    setTemplates(prev => prev.map(t =>
      t.id === templateId
        ? { ...t, favorito: !t.favorito }
        : t
    ));
  }, []);

  // Toggle público
  const togglePublic = useCallback(async (templateId: string) => {
    setTemplates(prev => prev.map(t =>
      t.id === templateId
        ? { ...t, publico: !t.publico }
        : t
    ));
  }, []);

  // Adicionar tags
  const addTags = useCallback(async (templateId: string, tags: string[]) => {
    setTemplates(prev => prev.map(t =>
      t.id === templateId
        ? { ...t, tags: [...new Set([...t.tags, ...tags])] }
        : t
    ));
  }, []);

  // Remover tag
  const removeTag = useCallback(async (templateId: string, tag: string) => {
    setTemplates(prev => prev.map(t =>
      t.id === templateId
        ? { ...t, tags: t.tags.filter(tg => tg !== tag) }
        : t
    ));
  }, []);

  // Estatísticas
  const stats = useMemo(() => {
    return {
      total: templates.length,
      favoritos: templates.filter(t => t.favorito).length,
      publicos: templates.filter(t => t.publico).length,
      maisUsados: [...templates].sort((a, b) => b.vezesUsado - a.vezesUsado).slice(0, 5),
      porCategoria: {
        financeiro: templates.filter(t => t.categoria === 'financeiro').length,
        estoque: templates.filter(t => t.categoria === 'estoque').length,
        vendas: templates.filter(t => t.categoria === 'vendas').length,
        gerencial: templates.filter(t => t.categoria === 'gerencial').length,
        custom: templates.filter(t => t.categoria === 'custom').length
      }
    };
  }, [templates]);

  return {
    templates: filteredTemplates,
    allTemplates: templates,
    filters,
    setFilters,
    loading,
    refresh,
    create,
    update,
    deleteTemplate,
    duplicate,
    applyTemplate,
    toggleFavorite,
    togglePublic,
    addTags,
    removeTag,
    stats
  };
};
