import { useState, useEffect, useMemo } from 'react';
import { ApprovalRequest } from '@/types/approval';
import { api } from '@/lib/api';
import { addDays } from 'date-fns';

interface APInvoice {
  id: number;
  invoice_number: string;
  supplier_id: number;
  supplier?: {
    id: number;
    name: string;
  };
  total_value: number;
  due_date: string;
  invoice_date: string;
  status: string;
  created_at: string;
  created_by?: number;
}

export function usePendingApprovals(usuarioId?: string) {
  const [invoices, setInvoices] = useState<APInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Buscar faturas pendentes de aprovação
  useEffect(() => {
    const fetchPendingInvoices = async () => {
      try {
        setLoading(true);
        setError(null);

        // Buscar faturas com status 'pending' ou 'validated' (aguardando aprovação)
        const response = await api.get<APInvoice[]>('/accounts-payable/invoices', {
          params: {
            status: 'pending,validated',
            limit: 100,
          },
        });

        setInvoices(response.data || []);
      } catch (err: any) {
        console.error('Erro ao buscar faturas pendentes:', err);
        setError(err.message || 'Erro ao buscar faturas pendentes');
        setInvoices([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPendingInvoices();
  }, []);

  // Converter faturas da API para formato de ApprovalRequest
  const approvalRequests = useMemo(() => {
    return invoices.map((invoice): ApprovalRequest => {
      // Calcular data limite de aprovação (ex: 2 dias após criação)
      const dataSolicitacao = new Date(invoice.created_at);
      const dataLimite = addDays(dataSolicitacao, 2);

      // Determinar workflow baseado no valor
      const isHighValue = invoice.total_value > 10000;
      const workflowNome = isHighValue
        ? 'Aprovação Multinível acima de R$ 10.000'
        : 'Aprovação Padrão até R$ 10.000';

      // Por enquanto, workflow simples de 1 nível para todas as faturas
      // TODO: Implementar sistema de workflow completo no backend
      return {
        id: invoice.id.toString(),
        faturaId: invoice.id.toString(),
        fatura: {
          invoice_number: invoice.invoice_number,
          supplier: invoice.supplier ? { name: invoice.supplier.name } : { name: 'Fornecedor não informado' },
          total_value: invoice.total_value,
          due_date: new Date(invoice.due_date),
        },
        workflowId: isHighValue ? '2' : '1',
        workflowNome,
        status: 'pendente',
        nivelAtual: 1,
        nivelTotal: isHighValue ? 2 : 1,
        aprovacoes: [
          {
            nivel: 1,
            aprovadorId: usuarioId || '1',
            aprovadorNome: 'Aprovador',
            status: 'pendente',
          },
          ...(isHighValue
            ? [
                {
                  nivel: 2,
                  aprovadorId: '2',
                  aprovadorNome: 'Gestor Financeiro',
                  status: 'pendente' as const,
                },
              ]
            : []),
        ],
        dataSolicitacao,
        dataLimite,
        solicitante: {
          id: invoice.created_by?.toString() || '0',
          nome: 'Sistema',
        },
      };
    });
  }, [invoices, usuarioId]);

  const approve = async (requestId: string, observacoes?: string) => {
    try {
      await api.post(`/accounts-payable/invoices/${requestId}/approve`, {
        notes: observacoes,
      });

      // Recarregar lista após aprovação
      const response = await api.get<APInvoice[]>('/accounts-payable/invoices', {
        params: {
          status: 'pending,validated',
          limit: 100,
        },
      });
      setInvoices(response.data || []);
    } catch (err: any) {
      console.error('Erro ao aprovar fatura:', err);
      throw new Error(err.response?.data?.detail || 'Erro ao aprovar fatura');
    }
  };

  const reject = async (requestId: string, observacoes: string) => {
    try {
      await api.post(`/accounts-payable/invoices/${requestId}/cancel`, {
        notes: observacoes,
      });

      // Recarregar lista após rejeição
      const response = await api.get<APInvoice[]>('/accounts-payable/invoices', {
        params: {
          status: 'pending,validated',
          limit: 100,
        },
      });
      setInvoices(response.data || []);
    } catch (err: any) {
      console.error('Erro ao rejeitar fatura:', err);
      throw new Error(err.response?.data?.detail || 'Erro ao rejeitar fatura');
    }
  };

  return {
    approvalRequests,
    approve,
    reject,
    loading,
    error,
  };
}
