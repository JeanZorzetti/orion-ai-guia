import { useState, useCallback, useMemo } from 'react';
import type { ReportSchedule, ReportScheduleFilter, ReportConfig } from '@/types/report';
import { addDays, addWeeks, addMonths, setHours, setMinutes, setDay } from 'date-fns';

// Mock data para demonstração
const generateMockSchedules = (): ReportSchedule[] => {
  const now = new Date();
  const usuario = { id: '1', nome: 'João Silva' };

  const schedules: ReportSchedule[] = [
    {
      id: 'schedule-1',
      nome: 'DRE Mensal Automático',
      ativo: true,
      reportConfig: {
        id: 'config-1',
        tipo: 'financeiro',
        subtipo: 'dre',
        nome: 'DRE Mensal',
        periodo: {
          tipo: 'mes',
          inicio: new Date(),
          fim: new Date()
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
      frequencia: {
        tipo: 'mensal',
        diaMes: 1,
        horario: '08:00'
      },
      destinatarios: {
        emails: ['diretoria@empresa.com', 'financeiro@empresa.com'],
        incluirGeradores: true,
        incluirGerentes: true,
        incluirDiretores: true
      },
      emailConfig: {
        assunto: 'DRE Mensal - {periodo}',
        corpo: 'Segue em anexo o Demonstrativo de Resultado do Exercício referente ao período de {periodo}.\n\nAtenciosamente,\nEquipe Financeira',
        anexarRelatorio: true,
        incluirLinkDownload: true
      },
      ultimaExecucao: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
      proximaExecucao: addMonths(setHours(setMinutes(now, 0), 8), 1),
      execucoes: [
        {
          data: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
          status: 'sucesso',
          relatoriId: 'report-1'
        },
        {
          data: new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000),
          status: 'sucesso',
          relatoriId: 'report-2'
        }
      ],
      criadoEm: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000),
      criadoPor: usuario,
      atualizadoEm: now
    },
    {
      id: 'schedule-2',
      nome: 'Fluxo de Caixa Semanal',
      ativo: true,
      reportConfig: {
        id: 'config-2',
        tipo: 'financeiro',
        subtipo: 'fluxo-caixa',
        nome: 'Fluxo de Caixa Semanal',
        periodo: {
          tipo: 'semana',
          inicio: new Date(),
          fim: addDays(new Date(), 7)
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
      frequencia: {
        tipo: 'semanal',
        diaSemana: 1, // Segunda-feira
        horario: '09:00'
      },
      destinatarios: {
        emails: ['financeiro@empresa.com'],
        incluirGeradores: true,
        incluirGerentes: true,
        incluirDiretores: false
      },
      emailConfig: {
        assunto: 'Fluxo de Caixa Semanal - Semana {data}',
        corpo: 'Prezados,\n\nSegue projeção do fluxo de caixa para a próxima semana.\n\nAtt.',
        anexarRelatorio: true,
        incluirLinkDownload: false
      },
      ultimaExecucao: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
      proximaExecucao: addWeeks(setHours(setMinutes(setDay(now, 1), 0), 9), 1),
      execucoes: [
        {
          data: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
          status: 'sucesso',
          relatoriId: 'report-3'
        },
        {
          data: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000),
          status: 'sucesso',
          relatoriId: 'report-4'
        }
      ],
      criadoEm: new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000),
      criadoPor: usuario,
      atualizadoEm: now
    },
    {
      id: 'schedule-3',
      nome: 'Relatório de Estoque Diário',
      ativo: false,
      reportConfig: {
        id: 'config-3',
        tipo: 'estoque',
        subtipo: 'posicao',
        nome: 'Posição de Estoque',
        periodo: {
          tipo: 'dia',
          inicio: new Date(),
          fim: new Date()
        },
        filtros: {},
        agrupamento: { campo: 'categoria', ordem: 'desc' },
        visualizacao: {
          incluirGraficos: false,
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
      frequencia: {
        tipo: 'diario',
        horario: '18:00'
      },
      destinatarios: {
        emails: ['estoque@empresa.com'],
        incluirGeradores: false,
        incluirGerentes: false,
        incluirDiretores: false
      },
      emailConfig: {
        assunto: 'Posição de Estoque - {data}',
        corpo: 'Segue posição de estoque do dia.',
        anexarRelatorio: true,
        incluirLinkDownload: false
      },
      ultimaExecucao: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000),
      proximaExecucao: addDays(setHours(setMinutes(now, 0), 18), 1),
      execucoes: [
        {
          data: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000),
          status: 'erro',
          erro: 'Erro ao conectar com banco de dados'
        }
      ],
      criadoEm: new Date(now.getTime() - 45 * 24 * 60 * 60 * 1000),
      criadoPor: usuario,
      atualizadoEm: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000)
    }
  ];

  return schedules;
};

export const useReportScheduler = () => {
  const [schedules, setSchedules] = useState<ReportSchedule[]>(() => generateMockSchedules());
  const [filters, setFilters] = useState<ReportScheduleFilter>({});
  const [loading, setLoading] = useState(false);

  // Filtrar agendamentos
  const filteredSchedules = useMemo(() => {
    return schedules.filter(schedule => {
      // Filtro por ativo/inativo
      if (filters.ativo !== undefined) {
        if (schedule.ativo !== filters.ativo) return false;
      }

      // Filtro por tipo
      if (filters.tipo && filters.tipo.length > 0) {
        if (!filters.tipo.includes(schedule.reportConfig.tipo)) return false;
      }

      // Filtro por frequência
      if (filters.frequencia && filters.frequencia.length > 0) {
        if (!filters.frequencia.includes(schedule.frequencia.tipo)) return false;
      }

      // Filtro por criador
      if (filters.criadoPor && filters.criadoPor.length > 0) {
        if (!filters.criadoPor.includes(schedule.criadoPor.id)) return false;
      }

      // Busca por nome
      if (filters.busca) {
        const busca = filters.busca.toLowerCase();
        if (!schedule.nome.toLowerCase().includes(busca)) return false;
      }

      return true;
    });
  }, [schedules, filters]);

  // Recarregar agendamentos
  const refresh = useCallback(async () => {
    setLoading(true);
    // TODO: Chamar API real
    await new Promise(resolve => setTimeout(resolve, 500));
    setSchedules(generateMockSchedules());
    setLoading(false);
  }, []);

  // Criar novo agendamento
  const create = useCallback(async (schedule: Omit<ReportSchedule, 'id' | 'criadoEm' | 'criadoPor' | 'atualizadoEm' | 'execucoes' | 'ultimaExecucao'>) => {
    const newSchedule: ReportSchedule = {
      ...schedule,
      id: `schedule-${Date.now()}`,
      criadoEm: new Date(),
      criadoPor: { id: '1', nome: 'João Silva' },
      atualizadoEm: new Date(),
      execucoes: [],
      ultimaExecucao: undefined
    };

    setSchedules(prev => [newSchedule, ...prev]);
    return newSchedule;
  }, []);

  // Atualizar agendamento
  const update = useCallback(async (scheduleId: string, updates: Partial<ReportSchedule>) => {
    setSchedules(prev => prev.map(s =>
      s.id === scheduleId
        ? { ...s, ...updates, atualizadoEm: new Date() }
        : s
    ));
  }, []);

  // Deletar agendamento
  const deleteSchedule = useCallback(async (scheduleId: string) => {
    setSchedules(prev => prev.filter(s => s.id !== scheduleId));
  }, []);

  // Ativar/Desativar agendamento
  const toggle = useCallback(async (scheduleId: string) => {
    setSchedules(prev => prev.map(s =>
      s.id === scheduleId
        ? { ...s, ativo: !s.ativo, atualizadoEm: new Date() }
        : s
    ));
  }, []);

  // Executar agora (fora do agendamento)
  const executeNow = useCallback(async (scheduleId: string) => {
    const schedule = schedules.find(s => s.id === scheduleId);
    if (!schedule) return;

    // TODO: Implementar execução real
    console.log('Executando agendamento:', schedule.nome);

    // Simular execução
    const newExecution = {
      data: new Date(),
      status: 'sucesso' as const,
      relatoriId: `report-${Date.now()}`
    };

    setSchedules(prev => prev.map(s =>
      s.id === scheduleId
        ? {
            ...s,
            ultimaExecucao: newExecution.data,
            execucoes: [newExecution, ...s.execucoes]
          }
        : s
    ));

    alert(`✅ Relatório "${schedule.nome}" executado com sucesso!\nO relatório será enviado para os destinatários configurados.`);
  }, [schedules]);

  // Duplicar agendamento
  const duplicate = useCallback(async (scheduleId: string) => {
    const schedule = schedules.find(s => s.id === scheduleId);
    if (!schedule) return;

    const newSchedule: ReportSchedule = {
      ...schedule,
      id: `schedule-${Date.now()}`,
      nome: `${schedule.nome} (Cópia)`,
      ativo: false,
      criadoEm: new Date(),
      atualizadoEm: new Date(),
      execucoes: [],
      ultimaExecucao: undefined
    };

    setSchedules(prev => [newSchedule, ...prev]);
    return newSchedule;
  }, [schedules]);

  // Estatísticas
  const stats = useMemo(() => {
    return {
      total: schedules.length,
      ativos: schedules.filter(s => s.ativo).length,
      inativos: schedules.filter(s => !s.ativo).length,
      ultimasExecucoes: schedules
        .filter(s => s.ultimaExecucao)
        .sort((a, b) => (b.ultimaExecucao?.getTime() || 0) - (a.ultimaExecucao?.getTime() || 0))
        .slice(0, 5),
      totalExecucoes: schedules.reduce((sum, s) => sum + s.execucoes.length, 0),
      execucoesComSucesso: schedules.reduce(
        (sum, s) => sum + s.execucoes.filter(e => e.status === 'sucesso').length,
        0
      ),
      execucoesComErro: schedules.reduce(
        (sum, s) => sum + s.execucoes.filter(e => e.status === 'erro').length,
        0
      ),
      porFrequencia: {
        diario: schedules.filter(s => s.frequencia.tipo === 'diario').length,
        semanal: schedules.filter(s => s.frequencia.tipo === 'semanal').length,
        quinzenal: schedules.filter(s => s.frequencia.tipo === 'quinzenal').length,
        mensal: schedules.filter(s => s.frequencia.tipo === 'mensal').length,
        trimestral: schedules.filter(s => s.frequencia.tipo === 'trimestral').length,
        anual: schedules.filter(s => s.frequencia.tipo === 'anual').length,
        personalizado: schedules.filter(s => s.frequencia.tipo === 'personalizado').length
      }
    };
  }, [schedules]);

  return {
    schedules: filteredSchedules,
    allSchedules: schedules,
    filters,
    setFilters,
    loading,
    refresh,
    create,
    update,
    deleteSchedule,
    toggle,
    executeNow,
    duplicate,
    stats
  };
};
