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

export interface ReportTemplate {
  id: string;
  nome: string;
  descricao: string;

  // Configuração base
  config: ReportConfig;

  // Metadados
  criadoEm: Date;
  criadoPor: {
    id: string;
    nome: string;
  };
  atualizadoEm: Date;

  // Uso
  vezesUsado: number;
  ultimoUso?: Date;

  // Organização
  categoria: 'financeiro' | 'estoque' | 'vendas' | 'gerencial' | 'custom';
  tags: string[];
  favorito: boolean;

  // Compartilhamento
  publico: boolean; // Visível para todos no workspace
  compartilhadoCom?: string[]; // IDs de usuários

  // Validação
  valido: boolean;
  errosValidacao?: string[];
}

export interface ReportHistoryFilter {
  tipo?: ReportTipo[];
  formato?: ReportFormato[];
  status?: ReportStatus[];
  dataInicio?: Date;
  dataFim?: Date;
  geradoPor?: string[];
  tags?: string[];
  busca?: string; // Busca por nome
}

export interface ReportTemplateFilter {
  categoria?: ReportTemplate['categoria'][];
  tags?: string[];
  favoritos?: boolean;
  publicos?: boolean;
  criadoPor?: string[];
  busca?: string;
}

export interface ReportScheduleFilter {
  ativo?: boolean;
  tipo?: ReportTipo[];
  frequencia?: ReportSchedule['frequencia']['tipo'][];
  criadoPor?: string[];
  busca?: string;
}

// Helper types
export type ReportTipo = ReportConfig['tipo'];
export type ReportFormato = ReportConfig['exportacao']['formato'];
export type ReportStatus = GeneratedReport['status'];
export type ReportFrequencia = ReportSchedule['frequencia']['tipo'];
export type ReportExecutionStatus = ReportSchedule['execucoes'][0]['status'];

// ============================================
// DASHBOARD EXECUTIVO - FASE 5
// ============================================

export interface ExecutiveDashboardKPI {
  id: string;
  titulo: string;
  valor: number;
  valorFormatado: string;
  variacao: number; // Percentual em relação ao período anterior
  variacaoAbsoluta: number; // Valor absoluto da diferença
  tendencia: 'up' | 'down' | 'stable';
  categoria: 'receita' | 'despesa' | 'lucro' | 'estoque' | 'vendas' | 'custom';
  icone?: string;
  cor?: string;
  meta?: number; // Valor da meta
  percentualMeta?: number; // % de atingimento da meta
}

export interface ExecutiveDashboardChart {
  id: string;
  titulo: string;
  tipo: 'linha' | 'barra' | 'pizza' | 'area' | 'barraEmpilhada' | 'linhaMultipla';
  dados: {
    labels: string[];
    datasets: {
      label: string;
      data: number[];
      backgroundColor?: string | string[];
      borderColor?: string;
      fill?: boolean;
    }[];
  };
  config?: {
    showLegend?: boolean;
    showGrid?: boolean;
    showTooltip?: boolean;
    enableZoom?: boolean;
    enableDrillDown?: boolean;
    drillDownPath?: string; // Caminho para drill-down
  };
}

export interface ExecutiveDashboardComparison {
  periodo: string;
  periodoAnterior: string;
  metricas: {
    metrica: string;
    valorAtual: number;
    valorAnterior: number;
    diferenca: number;
    diferencaPercentual: number;
    tendencia: 'up' | 'down' | 'stable';
  }[];
}

export interface ExecutiveDashboardFilter {
  periodoAtual: {
    inicio: Date;
    fim: Date;
  };
  periodoComparacao?: {
    inicio: Date;
    fim: Date;
  };
  tipoComparacao: 'periodo-anterior' | 'mesmo-periodo-ano-anterior' | 'personalizado';
  categorias?: string[];
  centrosCusto?: string[];
  produtos?: string[];
  clientes?: string[];
  fornecedores?: string[];
}

export interface ExecutiveDashboardBookmark {
  id: string;
  nome: string;
  descricao?: string;
  filtros: ExecutiveDashboardFilter;
  kpisVisiveis: string[]; // IDs dos KPIs a exibir
  graficosVisiveis: string[]; // IDs dos gráficos a exibir
  layout?: 'grid' | 'list' | 'compact';
  criadoEm: Date;
  criadoPor: {
    id: string;
    nome: string;
  };
  publico: boolean;
  favorito: boolean;
}

export interface ExecutiveDashboardData {
  kpis: ExecutiveDashboardKPI[];
  graficos: ExecutiveDashboardChart[];
  comparacao: ExecutiveDashboardComparison;
  insights: {
    tipo: 'positivo' | 'neutro' | 'negativo' | 'alerta';
    titulo: string;
    descricao: string;
    icone?: string;
  }[];
  atualizadoEm: Date;
}

// ============================================
// REPORT BUILDER - FASE 6
// ============================================

export interface CustomReport {
  id: string;
  nome: string;
  descricao: string;

  // Layout
  layout: {
    pagina: {
      tamanho: 'a4' | 'letter' | 'legal';
      orientacao: 'portrait' | 'landscape';
      margens: { top: number; right: number; bottom: number; left: number };
    };
    secoes: ReportSection[];
  };

  // Fontes de dados
  fontesDados: ReportDataSource[];

  // Estilo
  estilo: {
    tema: 'claro' | 'escuro' | 'customizado';
    cores: {
      primaria: string;
      secundaria: string;
      texto: string;
      fundo: string;
    };
    fontes: {
      titulo: { familia: string; tamanho: number; peso: string };
      subtitulo: { familia: string; tamanho: number; peso: string };
      corpo: { familia: string; tamanho: number; peso: string };
    };
  };

  // Permissões
  permissoes: {
    visualizar: string[];
    editar: string[];
    compartilhar: string[];
  };

  // Metadados
  criadoEm: Date;
  criadoPor: {
    id: string;
    nome: string;
  };
  atualizadoEm: Date;
  versao: number;
}

export interface ReportDataSource {
  id: string;
  nome: string;
  tipo: 'financeiro' | 'estoque' | 'vendas' | 'customizado' | 'sql';
  query?: string;
  parametros: Record<string, any>;
  camposCalculados?: CalculatedField[];
}

export interface CalculatedField {
  id: string;
  nome: string;
  formula: string; // Ex: "receita - despesa", "quantidade * preco"
  tipo: 'numero' | 'texto' | 'data' | 'booleano';
  formato?: string; // Ex: "R$ 0,0.00", "0.00%"
}

export interface ReportSection {
  id: string;
  tipo: 'texto' | 'tabela' | 'grafico' | 'kpi' | 'imagem' | 'espacamento' | 'divisor';
  ordem: number;

  // Configuração específica do tipo
  config:
    | TextSectionConfig
    | TableSectionConfig
    | ChartSectionConfig
    | KPISectionConfig
    | ImageSectionConfig
    | SpacerSectionConfig;

  // Layout da seção
  layout: {
    largura: 'completa' | 'metade' | 'terco' | 'dois-tercos' | 'quarto' | 'tres-quartos';
    altura?: number;
    padding: { top: number; right: number; bottom: number; left: number };
    alinhamento?: 'left' | 'center' | 'right';
  };

  // Estilo
  estilo?: {
    fundo?: string;
    borda?: { cor: string; largura: number; estilo: 'solid' | 'dashed' | 'dotted' };
    sombra?: boolean;
    borderRadius?: number;
  };

  // Fonte de dados (se aplicável)
  fonteDadosId?: string;

  // Visibilidade condicional
  condicao?: {
    campo: string;
    operador: '=' | '!=' | '>' | '<' | '>=' | '<=' | 'contains';
    valor: any;
  };
}

export interface TextSectionConfig {
  conteudo: string; // Suporta markdown
  estilo: {
    fontSize: number;
    fontWeight: 'normal' | 'bold' | 'bolder';
    color: string;
    align: 'left' | 'center' | 'right' | 'justify';
    lineHeight: number;
  };
  variaveis?: Record<string, string>; // Para substituição de variáveis
}

export interface TableSectionConfig {
  colunas: {
    id: string;
    label: string;
    campo: string;
    tipo: 'texto' | 'numero' | 'data' | 'moeda';
    formato?: string;
    largura?: number;
    alinhamento?: 'left' | 'center' | 'right';
    agregacao?: 'sum' | 'avg' | 'count' | 'min' | 'max';
  }[];
  ordenacao?: {
    campo: string;
    direcao: 'asc' | 'desc';
  };
  filtros?: {
    campo: string;
    operador: string;
    valor: any;
  }[];
  paginacao?: {
    tamanhoPagina: number;
    mostrarTotais: boolean;
  };
  estilo: {
    zebraStripe: boolean;
    headerBackground: string;
    headerTextColor: string;
    borderColor: string;
    fontSize: number;
  };
}

export interface ChartSectionConfig {
  tipoGrafico: 'linha' | 'barra' | 'pizza' | 'area' | 'scatter' | 'radar' | 'barraEmpilhada';
  eixoX: {
    campo: string;
    label: string;
  };
  eixoY: {
    campo: string;
    label: string;
    formato?: string;
  };
  series?: {
    campo: string;
    nome: string;
    cor?: string;
  }[];
  opcoes: {
    mostrarLegenda: boolean;
    mostrarGrid: boolean;
    mostrarTooltip: boolean;
    altura: number;
    animacao: boolean;
  };
}

export interface KPISectionConfig {
  metrica: string;
  valor: number | string;
  valorFormatado: string;
  comparacao?: {
    valor: number;
    periodo: string;
    formato: 'percentual' | 'absoluto';
  };
  meta?: {
    valor: number;
    mostrarProgresso: boolean;
  };
  icone?: string;
  cor: string;
  tamanho: 'pequeno' | 'medio' | 'grande';
}

export interface ImageSectionConfig {
  url: string;
  alt: string;
  largura?: number;
  altura?: number;
  ajuste: 'cover' | 'contain' | 'fill' | 'none';
  alinhamento: 'left' | 'center' | 'right';
}

export interface SpacerSectionConfig {
  altura: number;
}

export interface ReportBuilderTemplate {
  id: string;
  nome: string;
  descricao: string;
  categoria: 'financeiro' | 'vendas' | 'estoque' | 'geral';
  thumbnail?: string;
  report: Omit<CustomReport, 'id' | 'criadoEm' | 'criadoPor' | 'atualizadoEm'>;
  popular: boolean;
  tags: string[];
}
