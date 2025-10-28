import { useMemo } from 'react';
import { ApprovalRequest } from '@/types/approval';
import { addHours, addDays } from 'date-fns';

// Mock data
const mockApprovalRequests: ApprovalRequest[] = [
  {
    id: '1',
    faturaId: '101',
    fatura: {
      invoice_number: 'NF-2025-001',
      supplier: { name: 'Fornecedor Alpha Ltda' },
      total_value: 25000,
      due_date: addDays(new Date(), 15),
    },
    workflowId: '2',
    workflowNome: 'Aprovação Multinível acima de R$ 10.000',
    status: 'pendente',
    nivelAtual: 1,
    nivelTotal: 2,
    aprovacoes: [
      {
        nivel: 1,
        aprovadorId: '1',
        aprovadorNome: 'Carlos Silva',
        status: 'pendente',
      },
      {
        nivel: 2,
        aprovadorId: '3',
        aprovadorNome: 'Roberto Mendes',
        status: 'pendente',
      },
    ],
    dataSolicitacao: addDays(new Date(), -2),
    dataLimite: addHours(new Date(), 36),
    solicitante: {
      id: '10',
      nome: 'Sistema Automático',
    },
  },
  {
    id: '2',
    faturaId: '102',
    fatura: {
      invoice_number: 'NF-2025-002',
      supplier: { name: 'Beta Fornecimentos S.A.' },
      total_value: 8500,
      due_date: addDays(new Date(), 10),
    },
    workflowId: '1',
    workflowNome: 'Aprovação Padrão até R$ 10.000',
    status: 'pendente',
    nivelAtual: 1,
    nivelTotal: 1,
    aprovacoes: [
      {
        nivel: 1,
        aprovadorId: '1',
        aprovadorNome: 'Carlos Silva',
        status: 'pendente',
      },
    ],
    dataSolicitacao: addHours(new Date(), -6),
    dataLimite: addHours(new Date(), 18),
    solicitante: {
      id: '10',
      nome: 'Sistema Automático',
    },
  },
  {
    id: '3',
    faturaId: '103',
    fatura: {
      invoice_number: 'NF-2025-003',
      supplier: { name: 'Gamma Comércio Ltda' },
      total_value: 15000,
      due_date: addDays(new Date(), 20),
    },
    workflowId: '2',
    workflowNome: 'Aprovação Multinível acima de R$ 10.000',
    status: 'pendente',
    nivelAtual: 2,
    nivelTotal: 2,
    aprovacoes: [
      {
        nivel: 1,
        aprovadorId: '2',
        aprovadorNome: 'Ana Costa',
        status: 'aprovado',
        dataAprovacao: addHours(new Date(), -12),
        observacoes: 'Aprovado. Fatura dentro do orçamento.',
      },
      {
        nivel: 2,
        aprovadorId: '3',
        aprovadorNome: 'Roberto Mendes',
        status: 'pendente',
      },
    ],
    dataSolicitacao: addDays(new Date(), -1),
    dataLimite: addHours(new Date(), 60),
    solicitante: {
      id: '10',
      nome: 'Sistema Automático',
    },
  },
];

export function usePendingApprovals(usuarioId?: string) {
  const approvalRequests = useMemo(() => {
    if (!usuarioId) {
      return mockApprovalRequests.filter((req) => req.status === 'pendente');
    }

    // Filtrar apenas aprovações pendentes para o usuário específico
    return mockApprovalRequests.filter((req) => {
      if (req.status !== 'pendente') return false;

      // Verificar se o usuário é aprovador no nível atual
      const aprovacaoAtual = req.aprovacoes.find(
        (ap) => ap.nivel === req.nivelAtual && ap.aprovadorId === usuarioId
      );

      return aprovacaoAtual?.status === 'pendente';
    });
  }, [usuarioId]);

  const approve = async (requestId: string, observacoes?: string) => {
    // TODO: Implementar lógica de aprovação via API
    console.log('Aprovar:', requestId, observacoes);
    return Promise.resolve();
  };

  const reject = async (requestId: string, observacoes: string) => {
    // TODO: Implementar lógica de rejeição via API
    console.log('Rejeitar:', requestId, observacoes);
    return Promise.resolve();
  };

  return {
    approvalRequests,
    approve,
    reject,
  };
}
