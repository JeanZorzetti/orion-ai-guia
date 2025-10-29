import { useState, useCallback } from 'react';
import { CustomReport, ReportSection, ReportBuilderTemplate } from '@/types/report';

// Template vazio padrão
const createEmptyReport = (): CustomReport => ({
  id: `report-${Date.now()}`,
  nome: 'Novo Relatório',
  descricao: '',
  layout: {
    pagina: {
      tamanho: 'a4',
      orientacao: 'portrait',
      margens: { top: 20, right: 20, bottom: 20, left: 20 },
    },
    secoes: [],
  },
  fontesDados: [],
  estilo: {
    tema: 'claro',
    cores: {
      primaria: '#3b82f6',
      secundaria: '#8b5cf6',
      texto: '#1f2937',
      fundo: '#ffffff',
    },
    fontes: {
      titulo: { familia: 'Inter', tamanho: 24, peso: 'bold' },
      subtitulo: { familia: 'Inter', tamanho: 18, peso: '600' },
      corpo: { familia: 'Inter', tamanho: 14, peso: 'normal' },
    },
  },
  permissoes: {
    visualizar: [],
    editar: [],
    compartilhar: [],
  },
  criadoEm: new Date(),
  criadoPor: { id: '1', nome: 'Admin' },
  atualizadoEm: new Date(),
  versao: 1,
});

// Templates predefinidos
const generateTemplates = (): ReportBuilderTemplate[] => {
  return [
    {
      id: 'template-dre',
      nome: 'DRE Completo',
      descricao: 'Template completo de Demonstração de Resultados',
      categoria: 'financeiro',
      popular: true,
      tags: ['financeiro', 'dre', 'lucro'],
      report: {
        nome: 'DRE Completo',
        descricao: 'Demonstração de Resultados do Exercício',
        layout: {
          pagina: {
            tamanho: 'a4',
            orientacao: 'portrait',
            margens: { top: 20, right: 20, bottom: 20, left: 20 },
          },
          secoes: [],
        },
        fontesDados: [],
        estilo: {
          tema: 'claro',
          cores: {
            primaria: '#3b82f6',
            secundaria: '#8b5cf6',
            texto: '#1f2937',
            fundo: '#ffffff',
          },
          fontes: {
            titulo: { familia: 'Inter', tamanho: 24, peso: 'bold' },
            subtitulo: { familia: 'Inter', tamanho: 18, peso: '600' },
            corpo: { familia: 'Inter', tamanho: 14, peso: 'normal' },
          },
        },
        permissoes: {
          visualizar: [],
          editar: [],
          compartilhar: [],
        },
        versao: 1,
      },
    },
    {
      id: 'template-vendas',
      nome: 'Relatório de Vendas',
      descricao: 'Análise completa de vendas do período',
      categoria: 'vendas',
      popular: true,
      tags: ['vendas', 'produtos', 'receita'],
      report: {
        nome: 'Relatório de Vendas',
        descricao: 'Análise de vendas e produtos',
        layout: {
          pagina: {
            tamanho: 'a4',
            orientacao: 'landscape',
            margens: { top: 15, right: 15, bottom: 15, left: 15 },
          },
          secoes: [],
        },
        fontesDados: [],
        estilo: {
          tema: 'claro',
          cores: {
            primaria: '#10b981',
            secundaria: '#f59e0b',
            texto: '#1f2937',
            fundo: '#ffffff',
          },
          fontes: {
            titulo: { familia: 'Inter', tamanho: 20, peso: 'bold' },
            subtitulo: { familia: 'Inter', tamanho: 16, peso: '600' },
            corpo: { familia: 'Inter', tamanho: 12, peso: 'normal' },
          },
        },
        permissoes: {
          visualizar: [],
          editar: [],
          compartilhar: [],
        },
        versao: 1,
      },
    },
    {
      id: 'template-estoque',
      nome: 'Inventário de Estoque',
      descricao: 'Relatório detalhado de inventário',
      categoria: 'estoque',
      popular: false,
      tags: ['estoque', 'produtos', 'inventário'],
      report: {
        nome: 'Inventário de Estoque',
        descricao: 'Relatório de inventário completo',
        layout: {
          pagina: {
            tamanho: 'a4',
            orientacao: 'portrait',
            margens: { top: 20, right: 20, bottom: 20, left: 20 },
          },
          secoes: [],
        },
        fontesDados: [],
        estilo: {
          tema: 'claro',
          cores: {
            primaria: '#6366f1',
            secundaria: '#ec4899',
            texto: '#1f2937',
            fundo: '#ffffff',
          },
          fontes: {
            titulo: { familia: 'Inter', tamanho: 22, peso: 'bold' },
            subtitulo: { familia: 'Inter', tamanho: 16, peso: '600' },
            corpo: { familia: 'Inter', tamanho: 13, peso: 'normal' },
          },
        },
        permissoes: {
          visualizar: [],
          editar: [],
          compartilhar: [],
        },
        versao: 1,
      },
    },
  ];
};

export const useReportBuilder = () => {
  const [report, setReport] = useState<CustomReport>(createEmptyReport());
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  const [templates] = useState<ReportBuilderTemplate[]>(generateTemplates());
  const [savedReports, setSavedReports] = useState<CustomReport[]>([]);

  // Adicionar seção
  const addSection = useCallback((tipo: ReportSection['tipo']) => {
    const newSection: ReportSection = {
      id: `section-${Date.now()}`,
      tipo,
      ordem: report.layout.secoes.length,
      config: getDefaultConfig(tipo),
      layout: {
        largura: 'completa',
        padding: { top: 10, right: 10, bottom: 10, left: 10 },
        alinhamento: 'left',
      },
    };

    setReport(prev => ({
      ...prev,
      layout: {
        ...prev.layout,
        secoes: [...prev.layout.secoes, newSection],
      },
      atualizadoEm: new Date(),
    }));

    setSelectedSectionId(newSection.id);
  }, [report.layout.secoes.length]);

  // Remover seção
  const removeSection = useCallback((sectionId: string) => {
    setReport(prev => ({
      ...prev,
      layout: {
        ...prev.layout,
        secoes: prev.layout.secoes.filter(s => s.id !== sectionId),
      },
      atualizadoEm: new Date(),
    }));

    if (selectedSectionId === sectionId) {
      setSelectedSectionId(null);
    }
  }, [selectedSectionId]);

  // Atualizar seção
  const updateSection = useCallback((sectionId: string, updates: Partial<ReportSection>) => {
    setReport(prev => ({
      ...prev,
      layout: {
        ...prev.layout,
        secoes: prev.layout.secoes.map(s =>
          s.id === sectionId ? { ...s, ...updates } : s
        ),
      },
      atualizadoEm: new Date(),
    }));
  }, []);

  // Reordenar seções
  const reorderSections = useCallback((fromIndex: number, toIndex: number) => {
    setReport(prev => {
      const newSections = [...prev.layout.secoes];
      const [removed] = newSections.splice(fromIndex, 1);
      newSections.splice(toIndex, 0, removed);

      // Atualizar ordem
      const reorderedSections = newSections.map((section, index) => ({
        ...section,
        ordem: index,
      }));

      return {
        ...prev,
        layout: {
          ...prev.layout,
          secoes: reorderedSections,
        },
        atualizadoEm: new Date(),
      };
    });
  }, []);

  // Salvar relatório
  const saveReport = useCallback(() => {
    setSavedReports(prev => {
      const existing = prev.findIndex(r => r.id === report.id);
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing] = { ...report, versao: report.versao + 1 };
        return updated;
      }
      return [...prev, report];
    });
  }, [report]);

  // Carregar template
  const loadTemplate = useCallback((templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (template) {
      setReport({
        ...template.report,
        id: `report-${Date.now()}`,
        criadoEm: new Date(),
        criadoPor: { id: '1', nome: 'Admin' },
        atualizadoEm: new Date(),
      });
      setSelectedSectionId(null);
    }
  }, [templates]);

  // Criar novo relatório
  const createNew = useCallback(() => {
    setReport(createEmptyReport());
    setSelectedSectionId(null);
  }, []);

  // Atualizar propriedades do relatório
  const updateReport = useCallback((updates: Partial<CustomReport>) => {
    setReport(prev => ({
      ...prev,
      ...updates,
      atualizadoEm: new Date(),
    }));
  }, []);

  const selectedSection = selectedSectionId
    ? report.layout.secoes.find(s => s.id === selectedSectionId)
    : null;

  return {
    report,
    selectedSection,
    selectedSectionId,
    setSelectedSectionId,
    addSection,
    removeSection,
    updateSection,
    reorderSections,
    saveReport,
    loadTemplate,
    createNew,
    updateReport,
    templates,
    savedReports,
  };
};

// Função auxiliar para criar config padrão por tipo
function getDefaultConfig(tipo: ReportSection['tipo']): any {
  switch (tipo) {
    case 'texto':
      return {
        conteudo: 'Digite seu texto aqui...',
        estilo: {
          fontSize: 14,
          fontWeight: 'normal',
          color: '#1f2937',
          align: 'left',
          lineHeight: 1.5,
        },
      };
    case 'kpi':
      return {
        metrica: 'Nova Métrica',
        valor: 0,
        valorFormatado: 'R$ 0,00',
        cor: '#3b82f6',
        tamanho: 'medio',
      };
    case 'espacamento':
      return {
        altura: 20,
      };
    default:
      return {};
  }
}
