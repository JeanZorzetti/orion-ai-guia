import { useState, useCallback } from 'react';
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfQuarter, endOfQuarter, startOfYear, endOfYear, subDays, subMonths } from 'date-fns';
import type { ReportConfig } from '@/types/report';

export const useReportConfig = (tipo: ReportConfig['tipo'], subtipo: string) => {
  const [config, setConfig] = useState<ReportConfig>({
    id: '',
    tipo,
    subtipo,
    nome: `Relatório de ${subtipo}`,
    periodo: {
      tipo: 'mes',
      inicio: startOfMonth(new Date()),
      fim: endOfMonth(new Date())
    },
    filtros: {},
    agrupamento: {
      campo: 'dia',
      ordem: 'asc'
    },
    visualizacao: {
      incluirGraficos: true,
      incluirTabelas: true,
      incluirResumo: true,
      incluirComparativo: false
    },
    exportacao: {
      formato: 'pdf',
      orientacao: 'portrait',
      incluirCapa: true,
      incluirIndice: false,
      logoEmpresa: true
    }
  });

  const updatePeriodoTipo = useCallback((tipo: ReportConfig['periodo']['tipo']) => {
    const now = new Date();
    let inicio: Date;
    let fim: Date;

    switch (tipo) {
      case 'dia':
        inicio = startOfDay(now);
        fim = endOfDay(now);
        break;
      case 'semana':
        inicio = startOfWeek(now);
        fim = endOfWeek(now);
        break;
      case 'mes':
        inicio = startOfMonth(now);
        fim = endOfMonth(now);
        break;
      case 'trimestre':
        inicio = startOfQuarter(now);
        fim = endOfQuarter(now);
        break;
      case 'ano':
        inicio = startOfYear(now);
        fim = endOfYear(now);
        break;
      default:
        inicio = config.periodo.inicio;
        fim = config.periodo.fim;
    }

    setConfig(prev => ({
      ...prev,
      periodo: { tipo, inicio, fim }
    }));
  }, [config.periodo.inicio, config.periodo.fim]);

  const setHoje = useCallback(() => {
    setConfig(prev => ({
      ...prev,
      periodo: {
        tipo: 'customizado',
        inicio: startOfDay(new Date()),
        fim: endOfDay(new Date())
      }
    }));
  }, []);

  const setOntem = useCallback(() => {
    const ontem = subDays(new Date(), 1);
    setConfig(prev => ({
      ...prev,
      periodo: {
        tipo: 'customizado',
        inicio: startOfDay(ontem),
        fim: endOfDay(ontem)
      }
    }));
  }, []);

  const setUltimos7Dias = useCallback(() => {
    setConfig(prev => ({
      ...prev,
      periodo: {
        tipo: 'customizado',
        inicio: startOfDay(subDays(new Date(), 7)),
        fim: endOfDay(new Date())
      }
    }));
  }, []);

  const setUltimos30Dias = useCallback(() => {
    setConfig(prev => ({
      ...prev,
      periodo: {
        tipo: 'customizado',
        inicio: startOfDay(subDays(new Date(), 30)),
        fim: endOfDay(new Date())
      }
    }));
  }, []);

  const setMesAtual = useCallback(() => {
    updatePeriodoTipo('mes');
  }, [updatePeriodoTipo]);

  const setMesPassado = useCallback(() => {
    const mesPassado = subMonths(new Date(), 1);
    setConfig(prev => ({
      ...prev,
      periodo: {
        tipo: 'customizado',
        inicio: startOfMonth(mesPassado),
        fim: endOfMonth(mesPassado)
      }
    }));
  }, []);

  const updateInicio = useCallback((date: Date | undefined) => {
    if (!date) return;
    setConfig(prev => ({
      ...prev,
      periodo: {
        ...prev.periodo,
        tipo: 'customizado',
        inicio: date
      }
    }));
  }, []);

  const updateFim = useCallback((date: Date | undefined) => {
    if (!date) return;
    setConfig(prev => ({
      ...prev,
      periodo: {
        ...prev.periodo,
        tipo: 'customizado',
        fim: date
      }
    }));
  }, []);

  const updateFiltros = useCallback((campo: keyof ReportConfig['filtros'], valor: string[]) => {
    setConfig(prev => ({
      ...prev,
      filtros: {
        ...prev.filtros,
        [campo]: valor
      }
    }));
  }, []);

  const updateVisualizacao = useCallback((campo: keyof ReportConfig['visualizacao'], valor: boolean | string) => {
    setConfig(prev => ({
      ...prev,
      visualizacao: {
        ...prev.visualizacao,
        [campo]: valor
      }
    }));
  }, []);

  const updateExportacao = useCallback((campo: keyof ReportConfig['exportacao'], valor: string | boolean) => {
    setConfig(prev => ({
      ...prev,
      exportacao: {
        ...prev.exportacao,
        [campo]: valor
      }
    }));
  }, []);

  const updateNome = useCallback((nome: string) => {
    setConfig(prev => ({ ...prev, nome }));
  }, []);

  return {
    config,
    setConfig,
    updatePeriodoTipo,
    updateInicio,
    updateFim,
    updateFiltros,
    updateVisualizacao,
    updateExportacao,
    updateNome,
    // Atalhos
    setHoje,
    setOntem,
    setUltimos7Dias,
    setUltimos30Dias,
    setMesAtual,
    setMesPassado
  };
};
