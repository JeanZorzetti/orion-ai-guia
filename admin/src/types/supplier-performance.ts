export interface SupplierPerformanceScore {
  fornecedorId: string;
  fornecedorNome: string;
  score: number; // 0-100
  categoria: 'excelente' | 'bom' | 'regular' | 'ruim' | 'critico';
  fatores: {
    pontualidadeEntrega: number; // % entregas no prazo
    qualidadeProdutos: number; // avaliação 0-10
    precosCompetitivos: number; // comparação com mercado
    atendimento: number; // avaliação 0-10
    flexibilidadeNegociacao: number; // 0-10
    conformidadeDocumental: number; // % docs corretos
  };
  metricas: {
    totalCompras: number;
    valorTotalComprado: number;
    ticketMedio: number;
    frequenciaCompras: number; // compras/mês
    prazoMedioPagamento: number; // dias
    descontosObtidos: number;
    devolucoesReclamacoes: number;
  };
  historico: {
    mes: string;
    score: number;
    totalCompras: number;
  }[];
  recomendacoes: string[];
  tendencia: 'melhorando' | 'estavel' | 'piorando';
  ultimaAtualizacao: Date;
}

export interface SupplierComparison {
  fornecedorId: string;
  fornecedorNome: string;
  score: number;
  totalComprado: number;
  ticketMedio: number;
  prazoMedioPagamento: number;
  pontualidade: number;
  totalFaturas: number;
  categoria: 'excelente' | 'bom' | 'regular' | 'ruim' | 'critico';
}
