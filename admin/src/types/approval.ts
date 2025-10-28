export interface ApprovalWorkflow {
  id: string;
  nome: string;
  descricao?: string;
  ativo: boolean;
  condicoes: {
    valorMinimo?: number;
    valorMaximo?: number;
    categorias?: string[];
    fornecedores?: string[];
    centrosCusto?: string[];
  };
  niveis: ApprovalLevel[];
  dataCriacao: Date;
  dataAtualizacao?: Date;
  criadoPor: string;
}

export interface ApprovalLevel {
  nivel: number;
  nome: string;
  aprovadores: {
    usuarioId: string;
    nome: string;
    email: string;
  }[];
  tipoAprovacao: 'qualquer_um' | 'todos' | 'maioria';
  prazoHoras: number;
  obrigatorio: boolean;
  condicoesEspeciais?: {
    valorMinimo?: number;
    diasUteisAntesVencimento?: number;
  };
}

export interface ApprovalRequest {
  id: string;
  faturaId: string;
  fatura: {
    invoice_number: string;
    supplier?: {
      name: string;
    };
    total_value: number;
    due_date?: Date;
  };
  workflowId: string;
  workflowNome: string;
  status: 'pendente' | 'aprovada' | 'rejeitada' | 'cancelada' | 'expirada';
  nivelAtual: number;
  nivelTotal: number;
  aprovacoes: Approval[];
  dataSolicitacao: Date;
  dataLimite: Date;
  solicitante: {
    id: string;
    nome: string;
  };
  observacoes?: string;
}

export interface Approval {
  nivel: number;
  aprovadorId: string;
  aprovadorNome: string;
  status: 'pendente' | 'aprovado' | 'rejeitado';
  dataAprovacao?: Date;
  observacoes?: string;
  anexos?: string[];
}

export interface AutomationRule {
  id: string;
  nome: string;
  descricao?: string;
  ativo: boolean;
  tipo: 'alerta_vencimento' | 'pagamento_automatico' | 'solicitacao_aprovacao' | 'conciliacao' | 'lembrete_aprovacao';
  trigger: {
    tipo: 'dias_antes_vencimento' | 'valor_minimo' | 'fornecedor_especifico' | 'categoria' | 'status_aprovacao' | 'prazo_aprovacao';
    valor: number | string;
  };
  acoes: {
    tipo: 'enviar_email' | 'criar_notificacao' | 'agendar_pagamento' | 'solicitar_aprovacao' | 'escalar_aprovacao';
    parametros: Record<string, string | number | boolean>;
  }[];
  dataCriacao: Date;
  criadoPor: string;
}

export interface ApprovalStats {
  totalPendentes: number;
  totalAprovadas: number;
  totalRejeitadas: number;
  totalExpiradas: number;
  tempoMedioAprovacao: number; // em horas
  taxaAprovacao: number; // percentual
  valorTotalPendente: number;
  valorTotalAprovado: number;
  aprovadoresMaisAtivos: {
    nome: string;
    quantidade: number;
  }[];
}
