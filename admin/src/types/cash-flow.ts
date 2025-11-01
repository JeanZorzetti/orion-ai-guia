export interface CashFlowProjection {
  data: Date;
  saldoInicial: number;
  entradasPrevistas: number;
  entradasRealizadas?: number;
  saidasPrevistas: number;
  saidasRealizadas?: number;
  saldoFinalPrevisto: number;
  saldoFinalRealizado?: number;
  confianca: number; // 0-100% - confiança da previsão
  origem: 'realizado' | 'projetado' | 'misto';
  limiteInferior?: number; // Para área de confiança no gráfico
  limiteSuperior?: number; // Para área de confiança no gráfico
}

export interface CashFlowAlert {
  id: string;
  data: Date;
  valor: number;
  tipo: 'saldo-negativo' | 'saldo-baixo' | 'vencimentos';
  mensagem: string;
}

export interface Scenario {
  id: string;
  nome: string;
  tipo: 'otimista' | 'realista' | 'pessimista' | 'customizado';
  premissas: {
    taxaRecebimento: number; // % de recebimentos no prazo
    taxaAtraso: number; // dias médios de atraso
    receitasAdicionais: number; // R$ de receitas extras
    despesasAdicionais: number; // R$ de despesas extras
    crescimentoReceita: number; // % crescimento mensal
  };
  projecao: CashFlowProjection[];
}

export interface ImpactSimulation {
  novaReceita: number;
  novaDespesa: number;
  dataInicio: Date;
  recorrente: boolean;
  frequencia: 'diaria' | 'semanal' | 'mensal' | 'anual';
}

export interface FinancialKPIs {
  // Liquidez
  liquidezImediata?: number; // Caixa / Passivo Circulante
  liquidezCorrente?: number; // Ativo Circulante / Passivo Circulante

  // Ciclo Financeiro
  pmr?: number; // Prazo Médio de Recebimento (dias)
  pmp?: number; // Prazo Médio de Pagamento (dias)
  cicloFinanceiro?: number; // PMR - PMP

  // Rentabilidade
  margemLiquida?: number; // Lucro Líquido / Receita Total
  margemEbitda?: number; // EBITDA / Receita Total

  // Eficiência
  returnOnAssets?: number; // Lucro / Ativo Total (ROA)
  returnOnEquity?: number; // Lucro / Patrimônio Líquido (ROE)

  // Fluxo de Caixa
  burnRate?: number; // Taxa de queima de caixa mensal
  runway?: number; // Meses até acabar o caixa
  endividamentoTotal?: number; // Passivo / Ativo

  // Campos adicionais (para compatibilidade com dados mockados antigos)
  coberturaDivida?: number; // EBITDA / Dívida
  giroAtivo?: number; // Receita / Ativo Total
  breakEven?: Date; // Data prevista para equilíbrio
}

export interface IncomeStatement {
  periodo: { inicio: Date; fim: Date };

  // Receitas
  receitaBruta: number;
  deducoes: number; // Impostos sobre vendas
  receitaLiquida: number;

  // Custos e Despesas
  custoProdutos: number; // CMV
  lucroBruto: number;

  despesasOperacionais: {
    vendas: number;
    administrativas: number;
    pessoal: number;
    total: number;
  };

  ebitda: number; // Lucro antes de juros, impostos, depreciação e amortização
  depreciacaoAmortizacao: number;
  ebit: number; // Lucro operacional

  // Resultado Financeiro
  receitasFinanceiras: number;
  despesasFinanceiras: number;
  resultadoFinanceiro: number;

  // Resultado Final
  lucroAntesImpostos: number;
  impostoRenda: number;
  lucroLiquido: number;

  // Margens
  margemBruta: number; // %
  margemEbitda: number; // %
  margemLiquida: number; // %
}

export interface BreakEvenAnalysis {
  receitaBreakEven: number;
  dataPrevist: Date;
  margemAtual: number;
  projecao: {
    mes: string;
    receitas: number;
    despesas: number;
    breakEven: number;
  }[];
}

export interface BankAccount {
  id: string;
  nome: string;
  banco: string;
  agencia: string;
  conta: string;
  tipo: 'corrente' | 'poupanca' | 'investimento' | 'caixa';
  saldo: number;
  ativa: boolean;
  corPrimaria: string; // Para identificação visual
}

export interface Transferencia {
  id: string;
  data: Date;
  contaOrigem: BankAccount;
  contaDestino: BankAccount;
  valor: number;
  descricao: string;
  tipo: 'transferencia' | 'aplicacao' | 'resgate';
}

export interface Alert {
  id: string;
  tipo: 'critico' | 'atencao' | 'informativo';
  categoria: 'saldo' | 'vencimento' | 'meta' | 'anomalia' | 'oportunidade';
  titulo: string;
  descricao: string;
  data: Date;
  lido: boolean;
  acao?: {
    label: string;
    href: string;
  };
}

export interface Recommendation {
  id: string;
  tipo: 'economia' | 'investimento' | 'negociacao' | 'otimizacao';
  prioridade: 'alta' | 'media' | 'baixa';
  titulo: string;
  descricao: string;
  impactoFinanceiro: number;
  esforco: 'baixo' | 'medio' | 'alto';
  prazo: string;
  acao: string;
}

export interface Report {
  id: string;
  nome: string;
  tipo: 'fluxo-caixa' | 'dre' | 'balanco' | 'gerencial' | 'customizado';
  periodo: { inicio: Date; fim: Date };
  formato: 'pdf' | 'excel' | 'csv' | 'json';
  opcoes: {
    incluirGraficos: boolean;
    incluirComparativo: boolean;
    agruparPor: 'dia' | 'semana' | 'mes';
    categorias?: string[];
    contas?: string[];
  };
}
