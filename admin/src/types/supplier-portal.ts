export interface SupplierPortalAccess {
  id: string;
  fornecedorId: string;
  fornecedorNome: string;
  token: string;
  ativo: boolean;
  dataExpiracao?: Date;
  dataCriacao: Date;
  criadoPor: string;
  criadoPorId: string;
  ultimoAcesso?: Date;
  acessosTotal: number;
}

export interface SupplierPortalData {
  fornecedor: {
    id: string;
    nome: string;
    cnpj?: string;
    cpf?: string;
    email?: string;
    telefone?: string;
  };
  resumo: {
    totalAReceber: number;
    pendenteAprovacao: number;
    pagoMes: number;
    proximoPagamento?: Date;
    totalFaturas: number;
    faturasPendentes: number;
    faturasValidadas: number;
    faturasPagas: number;
  };
  faturas: SupplierPortalInvoice[];
  historicoMensal: {
    mes: string;
    totalPago: number;
    quantidadeFaturas: number;
  }[];
}

export interface SupplierPortalInvoice {
  id: string;
  invoice_number: string;
  invoice_date: Date;
  due_date?: Date;
  payment_date?: Date;
  total_value: number;
  status: 'pendente' | 'validada' | 'paga' | 'cancelada';
  status_aprovacao?: 'aguardando' | 'aprovada' | 'rejeitada';
  observacoes?: string;
  descricao?: string;
  items?: {
    descricao: string;
    quantidade: number;
    valor_unitario: number;
    valor_total: number;
  }[];
}

export interface GenerateAccessDialogProps {
  fornecedorId: string;
  fornecedorNome: string;
  onSuccess?: (access: SupplierPortalAccess) => void;
}
