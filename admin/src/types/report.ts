// Tipos e interfaces para o sistema de relatórios

export interface ReportConfig {
  id: string;
  tipo: 'financeiro' | 'estoque' | 'vendas' | 'customizado';
  subtipo: string; // 'dre', 'fluxo-caixa', 'posicao-estoque', etc.
  nome: string;

  // Período
  periodo: {
    tipo: 'dia' | 'semana' | 'mes' | 'trimestre' | 'ano' | 'customizado';
    inicio: Date;
    fim: Date;
  };

  // Filtros
  filtros: {
    categorias?: string[];
    contas?: string[];
    produtos?: string[];
    fornecedores?: string[];
    clientes?: string[];
    centrosCusto?: string[];
    tags?: string[];
    status?: string[];
  };

  // Agrupamento
  agrupamento: {
    campo: 'dia' | 'semana' | 'mes' | 'categoria' | 'conta' | 'produto';
    ordem: 'asc' | 'desc';
    limite?: number;
  };

  // Visualização
  visualizacao: {
    incluirGraficos: boolean;
    incluirTabelas: boolean;
    incluirResumo: boolean;
    incluirComparativo: boolean;
    periodoComparacao?: 'anterior' | 'ano-anterior';
  };

  // Exportação
  exportacao: {
    formato: 'pdf' | 'excel' | 'csv' | 'json';
    orientacao?: 'portrait' | 'landscape';
    incluirCapa: boolean;
    incluirIndice: boolean;
    logoEmpresa: boolean;
  };
}

export interface ReportData {
  // Resumo
  resumo: {
    label: string;
    valor: string;
    variacao?: number;
    tendencia?: 'up' | 'down' | 'stable';
  }[];

  // Gráficos
  graficos: {
    titulo: string;
    tipo: 'linha' | 'barra' | 'pizza' | 'area';
    dados: Record<string, string | number>[];
  }[];

  // Tabelas
  colunas: string[];
  linhas: (string | number)[][];
}

export interface GeneratedReport {
  id: string;
  nome: string;
  tipo: 'financeiro' | 'estoque' | 'vendas' | 'customizado';
  subtipo: string;

  // Configuração usada
  config: ReportConfig;

  // Metadados
  geradoEm: Date;
  geradoPor: {
    id: string;
    nome: string;
  };

  // Arquivo
  arquivo: {
    url: string;
    formato: 'pdf' | 'excel' | 'csv' | 'json';
    tamanho: number; // bytes
    hash: string; // para verificação de integridade
  };

  // Status
  status: 'gerando' | 'concluido' | 'erro';
  erro?: string;

  // Estatísticas
  visualizacoes: number;
  downloads: number;
  compartilhamentos: number;

  // Versionamento
  versao: number;
  versaoAnterior?: string; // ID do relatório anterior

  // Agendamento (se foi agendado)
  agendamento?: {
    id: string;
    proximaExecucao: Date;
  };

  // Tags
  tags: string[];
}

export interface ReportSchedule {
  id: string;
  nome: string;
  ativo: boolean;

  // Configuração do relatório
  reportConfig: ReportConfig;

  // Frequência
  frequencia: {
    tipo: 'diario' | 'semanal' | 'quinzenal' | 'mensal' | 'trimestral' | 'anual' | 'personalizado';

    // Para tipo 'diario'
    horario?: string; // HH:mm

    // Para tipo 'semanal'
    diaSemana?: number; // 0-6 (domingo-sábado)

    // Para tipo 'mensal'
    diaMes?: number; // 1-31

    // Para tipo 'personalizado'
    cronExpression?: string;
  };

  // Destinatários
  destinatarios: {
    emails: string[];
    incluirGeradores: boolean; // Incluir quem criou o agendamento
    incluirGerentes: boolean;
    incluirDiretores: boolean;
  };

  // Mensagem do e-mail
  emailConfig: {
    assunto: string;
    corpo: string; // Suporta variáveis: {periodo}, {data}, etc.
    anexarRelatorio: boolean;
    incluirLinkDownload: boolean;
  };

  // Histórico de execuções
  ultimaExecucao?: Date;
  proximaExecucao: Date;
  execucoes: {
    data: Date;
    status: 'sucesso' | 'erro';
    erro?: string;
    relatoriId?: string;
  }[];

  // Metadados
  criadoEm: Date;
  criadoPor: {
    id: string;
    nome: string;
  };
  atualizadoEm: Date;
}

// Helper types
export type ReportTipo = ReportConfig['tipo'];
export type ReportFormato = ReportConfig['exportacao']['formato'];
export type ReportStatus = GeneratedReport['status'];
