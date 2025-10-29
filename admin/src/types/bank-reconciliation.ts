export interface BankTransaction {
  id: string;
  data: Date;
  descricao: string;
  valor: number;
  tipo: 'debito' | 'credito';
  categoria?: string;
  conciliado: boolean;
  faturaId?: string;
  banco: string;
  contaBancaria: string;
  documento?: string;
  observacoes?: string;
}

export interface PendingInvoice {
  id: string;
  invoiceNumber: string;
  fornecedor: string;
  fornecedorId: string;
  valor: number;
  dataVencimento: Date;
  dataPagamento?: Date;
  status: 'pendente' | 'validada' | 'paga';
  conciliado: boolean;
  transacaoId?: string;
}

export interface ReconciliationSuggestion {
  id: string;
  transacaoId: string;
  faturaId: string;
  confianca: number; // 0-100%
  razao: string;
  detalhes: {
    matchValor: boolean;
    matchData: boolean;
    matchFornecedor: boolean;
    diferencaValor?: number;
    diferencaDias?: number;
  };
  transacao: BankTransaction;
  fatura: PendingInvoice;
}

export interface ReconciliationMatch {
  id: string;
  transacaoId: string;
  faturaId: string;
  dataReconciliacao: Date;
  reconciladoPor: string;
  reconciladoPorId: string;
  tipo: 'automatico' | 'manual' | 'sugestao_ia';
  confianca?: number;
  observacoes?: string;
}

export interface ReconciliationSummary {
  totalTransacoes: number;
  transacoesConciliadas: number;
  transacoesPendentes: number;
  totalFaturas: number;
  faturasConciliadas: number;
  faturasPendentes: number;
  diferencaTotal: number;
  taxaConciliacao: number; // %
  economiaTempo: number; // horas economizadas
}

export interface ReconciliationFilter {
  dataInicio?: Date;
  dataFim?: Date;
  banco?: string;
  conciliado?: boolean;
  valorMinimo?: number;
  valorMaximo?: number;
}
