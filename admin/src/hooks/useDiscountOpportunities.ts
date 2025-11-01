import { useState, useEffect, useMemo } from 'react';
import { DiscountOpportunity, DiscountSummary } from '@/types/discount';
import { differenceInDays } from 'date-fns';
import { api } from '@/lib/api';

interface APInvoice {
  id: number;
  invoice_number: string;
  supplier_id: number;
  supplier?: {
    id: number;
    name: string;
  };
  total_value: number;
  gross_value: number;
  discount_percentage: number;
  discount_value: number;
  discount_available_until?: string;
  due_date: string;
  status: string;
  payment_date?: string;
}

// Hook para buscar faturas com desconto disponível
function useInvoicesWithDiscount() {
  const [invoices, setInvoices] = useState<APInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        setLoading(true);
        setError(null);
        // Buscar faturas que têm desconto disponível (discount_percentage > 0)
        // IMPORTANTE: SEM trailing slash para evitar redirect HTTP do FastAPI
        const response = await api.get<APInvoice[]>('/accounts-payable/invoices?limit=10000');

        // Filtrar apenas faturas com desconto e que ainda não foram pagas
        const withDiscount = (response || []).filter(inv =>
          inv.discount_percentage > 0 &&
          (inv.status === 'pending' || inv.status === 'validated' || inv.status === 'approved')
        );

        setInvoices(withDiscount);
      } catch (err: any) {
        console.error('Erro ao buscar faturas com desconto:', err);
        setError(err.message || 'Erro ao buscar faturas');
        setInvoices([]);
      } finally {
        setLoading(false);
      }
    };

    fetchInvoices();
  }, []);

  return { invoices, loading, error };
}

// Determinar categoria do desconto baseado no percentual e prazo
function getDiscountCategory(discountPercentage: number, daysRemaining: number): DiscountOpportunity['categoria'] {
  if (discountPercentage >= 10) return 'volume';
  if (discountPercentage >= 5 && daysRemaining <= 7) return 'pagamento_antecipado';
  if (discountPercentage >= 3) return 'fidelidade';
  return 'sazonal';
}

// Gerar condição de desconto baseado na categoria
function getDiscountCondition(categoria: DiscountOpportunity['categoria'], discountPercentage: number): string {
  const conditions: Record<DiscountOpportunity['categoria'], string> = {
    pagamento_antecipado: `Pagamento antecipado - ${discountPercentage}% de desconto`,
    volume: `Desconto por volume - ${discountPercentage}% sobre o valor`,
    primeira_compra: `Desconto de primeira compra - ${discountPercentage}%`,
    fidelidade: `Desconto de fidelidade - ${discountPercentage}%`,
    sazonal: `Desconto promocional - ${discountPercentage}%`,
  };
  return conditions[categoria];
}

// Converter fatura em oportunidade de desconto
function invoiceToOpportunity(invoice: APInvoice): DiscountOpportunity {
  const dataLimite = invoice.discount_available_until
    ? new Date(invoice.discount_available_until)
    : new Date(invoice.due_date);

  const diasRestantes = differenceInDays(dataLimite, new Date());
  const categoria = getDiscountCategory(invoice.discount_percentage, diasRestantes);

  // Determinar status: disponível, expirado ou aproveitado
  let status: DiscountOpportunity['status'];
  if (invoice.payment_date) {
    status = 'aproveitado';
  } else if (diasRestantes < 0) {
    status = 'expirado';
  } else {
    status = 'disponivel';
  }

  return {
    id: invoice.id.toString(),
    faturaId: invoice.id.toString(),
    invoiceNumber: invoice.invoice_number,
    fornecedor: invoice.supplier?.name || `Fornecedor #${invoice.supplier_id}`,
    fornecedorId: invoice.supplier_id.toString(),
    valorOriginal: invoice.gross_value || invoice.total_value / (1 - invoice.discount_percentage / 100),
    descontoPercentual: invoice.discount_percentage,
    valorDesconto: invoice.discount_value || (invoice.gross_value * invoice.discount_percentage / 100),
    valorFinal: invoice.total_value,
    condicao: getDiscountCondition(categoria, invoice.discount_percentage),
    dataLimite,
    diasRestantes,
    status,
    categoria,
  };
}

export const useDiscountOpportunities = (filter?: 'disponivel' | 'aproveitado' | 'expirado') => {
  const { invoices, loading, error } = useInvoicesWithDiscount();

  const opportunities = useMemo(() => {
    let opps = invoices.map(invoiceToOpportunity);

    // Aplicar filtro se fornecido
    if (filter) {
      opps = opps.filter(opp => opp.status === filter);
    }

    // Ordenar por dias restantes (mais urgentes primeiro)
    return opps.sort((a, b) => a.diasRestantes - b.diasRestantes);
  }, [invoices, filter]);

  return { opportunities, loading, error };
};

export const useDiscountSummary = (): DiscountSummary & { loading: boolean } => {
  const { opportunities, loading } = useDiscountOpportunities();

  const summary = useMemo(() => {
    const disponiveis = opportunities.filter(o => o.status === 'disponivel');
    const aproveitados = opportunities.filter(o => o.status === 'aproveitado');
    const expirados = opportunities.filter(o => o.status === 'expirado');

    const totalDescontosDisponiveis = disponiveis.length;
    const valorTotalDescontos = disponiveis.reduce((sum, o) => sum + o.valorDesconto, 0);
    const descontosAproveitados = aproveitados.length;
    const economiaTotal = aproveitados.reduce((sum, o) => sum + o.valorDesconto, 0);
    const descontosExpirados = expirados.length;
    const valorDescontosExpirados = expirados.reduce((sum, o) => sum + o.valorDesconto, 0);

    const totalDescontos = totalDescontosDisponiveis + descontosAproveitados + descontosExpirados;
    const taxaAproveitamento = totalDescontos > 0
      ? (descontosAproveitados / totalDescontos) * 100
      : 0;

    return {
      totalDescontosDisponiveis,
      valorTotalDescontos,
      descontosAproveitados,
      economiaTotal,
      descontosExpirados,
      valorDescontosExpirados,
      taxaAproveitamento,
      loading,
    };
  }, [opportunities, loading]);

  return summary;
};

export const applyDiscount = async (opportunityId: string): Promise<boolean> => {
  try {
    // TODO: Implementar endpoint no backend para aplicar desconto
    // Por enquanto, vamos apenas logar
    console.log('Aplicar desconto para fatura:', opportunityId);

    // Quando implementado, será algo como:
    // await api.post(`/accounts-payable/invoices/${opportunityId}/apply-discount`);

    return true;
  } catch (error) {
    console.error('Erro ao aplicar desconto:', error);
    throw error;
  }
};
