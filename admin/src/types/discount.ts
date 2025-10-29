export interface DiscountOpportunity {
  id: string;
  faturaId: string;
  invoiceNumber: string;
  fornecedor: string;
  fornecedorId: string;
  valorOriginal: number;
  descontoPercentual: number;
  valorDesconto: number;
  valorFinal: number;
  condicao: string;
  dataLimite: Date;
  diasRestantes: number;
  status: 'disponivel' | 'aproveitado' | 'expirado';
  categoria: 'pagamento_antecipado' | 'volume' | 'primeira_compra' | 'fidelidade' | 'sazonal';
}

export interface Negotiation {
  id: string;
  faturaId: string;
  invoiceNumber: string;
  fornecedor: string;
  fornecedorId: string;
  tipo: 'desconto' | 'prazo' | 'parcelamento' | 'condicoes';
  valorOriginal: number;
  valorNegociado: number;
  economia: number;
  economiaPercentual: number;
  status: 'em_negociacao' | 'aceita' | 'recusada';
  negociadoPor: string;
  negociadoPorId: string;
  dataInicio: Date;
  dataFechamento?: Date;
  observacoes: string;
  detalhes: NegotiationDetails;
}

export interface NegotiationDetails {
  prazoOriginal?: number; // dias
  prazoNegociado?: number; // dias
  parcelasOriginais?: number;
  parcelasNegociadas?: number;
  descontoPercentualOriginal?: number;
  descontoPercentualNegociado?: number;
  condicoesOriginais?: string;
  condicoesNegociadas?: string;
}

export interface DiscountSummary {
  totalDescontosDisponiveis: number;
  valorTotalDescontos: number;
  descontosAproveitados: number;
  economiaTotal: number;
  descontosExpirados: number;
  valorDescontosExpirados: number;
  taxaAproveitamento: number; // % de descontos aproveitados
}

export interface NegotiationSummary {
  totalNegociacoes: number;
  negociacoesAceitas: number;
  negociacoesRecusadas: number;
  emNegociacao: number;
  economiaTotal: number;
  economiaMedia: number;
  taxaSucesso: number; // % de negociações aceitas
}
