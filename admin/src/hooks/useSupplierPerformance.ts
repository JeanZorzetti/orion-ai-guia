import { useState, useEffect, useMemo } from 'react';
import { SupplierPerformanceScore } from '@/types/supplier-performance';
import { subMonths, format, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { api } from '@/lib/api';
import { useSuppliers } from './useSuppliers';

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
  payment_date?: string;
  status: string;
  created_at: string;
}

// Mock data de fornecedores (REMOVIDO - agora usa dados reais)
const mockSupplierPerformances_OLD: SupplierPerformanceScore[] = [
  {
    fornecedorId: '1',
    fornecedorNome: 'Fornecedor Alpha Ltda',
    score: 87,
    categoria: 'excelente',
    fatores: {
      pontualidadeEntrega: 95,
      qualidadeProdutos: 8.5,
      precosCompetitivos: 7.8,
      atendimento: 9.2,
      flexibilidadeNegociacao: 8.0,
      conformidadeDocumental: 98,
    },
    metricas: {
      totalCompras: 45,
      valorTotalComprado: 285000,
      ticketMedio: 6333,
      frequenciaCompras: 7.5,
      prazoMedioPagamento: 28,
      descontosObtidos: 8500,
      devolucoesReclamacoes: 2,
    },
    historico: [
      { mes: format(subMonths(new Date(), 5), 'MMM/yy', { locale: ptBR }), score: 82, totalCompras: 7 },
      { mes: format(subMonths(new Date(), 4), 'MMM/yy', { locale: ptBR }), score: 84, totalCompras: 8 },
      { mes: format(subMonths(new Date(), 3), 'MMM/yy', { locale: ptBR }), score: 85, totalCompras: 7 },
      { mes: format(subMonths(new Date(), 2), 'MMM/yy', { locale: ptBR }), score: 86, totalCompras: 9 },
      { mes: format(subMonths(new Date(), 1), 'MMM/yy', { locale: ptBR }), score: 87, totalCompras: 8 },
      { mes: format(new Date(), 'MMM/yy', { locale: ptBR }), score: 87, totalCompras: 6 },
    ],
    recomendacoes: [
      'Fornecedor confiável com excelente histórico',
      'Considere aumentar volume de compras para obter melhores descontos',
      'Pontualidade exemplar - considere para itens críticos',
    ],
    tendencia: 'melhorando',
    ultimaAtualizacao: new Date(),
  },
  {
    fornecedorId: '2',
    fornecedorNome: 'Beta Fornecimentos S.A.',
    score: 72,
    categoria: 'bom',
    fatores: {
      pontualidadeEntrega: 85,
      qualidadeProdutos: 7.5,
      precosCompetitivos: 8.2,
      atendimento: 7.0,
      flexibilidadeNegociacao: 6.5,
      conformidadeDocumental: 88,
    },
    metricas: {
      totalCompras: 32,
      valorTotalComprado: 195000,
      ticketMedio: 6094,
      frequenciaCompras: 5.3,
      prazoMedioPagamento: 32,
      descontosObtidos: 5850,
      devolucoesReclamacoes: 5,
    },
    historico: [
      { mes: format(subMonths(new Date(), 5), 'MMM/yy', { locale: ptBR }), score: 75, totalCompras: 5 },
      { mes: format(subMonths(new Date(), 4), 'MMM/yy', { locale: ptBR }), score: 74, totalCompras: 6 },
      { mes: format(subMonths(new Date(), 3), 'MMM/yy', { locale: ptBR }), score: 73, totalCompras: 5 },
      { mes: format(subMonths(new Date(), 2), 'MMM/yy', { locale: ptBR }), score: 72, totalCompras: 6 },
      { mes: format(subMonths(new Date(), 1), 'MMM/yy', { locale: ptBR }), score: 72, totalCompras: 5 },
      { mes: format(new Date(), 'MMM/yy', { locale: ptBR }), score: 72, totalCompras: 5 },
    ],
    recomendacoes: [
      'Preços competitivos, mas atenção à pontualidade',
      'Aumentar frequência de comunicação sobre prazos',
      'Monitorar qualidade de produtos nas próximas entregas',
    ],
    tendencia: 'estavel',
    ultimaAtualizacao: new Date(),
  },
  {
    fornecedorId: '3',
    fornecedorNome: 'Gamma Comércio Ltda',
    score: 58,
    categoria: 'regular',
    fatores: {
      pontualidadeEntrega: 65,
      qualidadeProdutos: 6.2,
      precosCompetitivos: 7.0,
      atendimento: 5.5,
      flexibilidadeNegociacao: 5.0,
      conformidadeDocumental: 72,
    },
    metricas: {
      totalCompras: 18,
      valorTotalComprado: 98000,
      ticketMedio: 5444,
      frequenciaCompras: 3.0,
      prazoMedioPagamento: 35,
      descontosObtidos: 1960,
      devolucoesReclamacoes: 8,
    },
    historico: [
      { mes: format(subMonths(new Date(), 5), 'MMM/yy', { locale: ptBR }), score: 65, totalCompras: 4 },
      { mes: format(subMonths(new Date(), 4), 'MMM/yy', { locale: ptBR }), score: 63, totalCompras: 3 },
      { mes: format(subMonths(new Date(), 3), 'MMM/yy', { locale: ptBR }), score: 60, totalCompras: 3 },
      { mes: format(subMonths(new Date(), 2), 'MMM/yy', { locale: ptBR }), score: 59, totalCompras: 3 },
      { mes: format(subMonths(new Date(), 1), 'MMM/yy', { locale: ptBR }), score: 58, totalCompras: 3 },
      { mes: format(new Date(), 'MMM/yy', { locale: ptBR }), score: 58, totalCompras: 2 },
    ],
    recomendacoes: [
      'Considere buscar fornecedores alternativos',
      'Exigir melhorias em pontualidade e conformidade documental',
      'Avaliar relação custo-benefício antes de novas compras',
    ],
    tendencia: 'piorando',
    ultimaAtualizacao: new Date(),
  },
];

function calculateScore(fatores: SupplierPerformanceScore['fatores']): number {
  // Pesos para cada fator (total = 100%)
  const pesos = {
    pontualidadeEntrega: 0.25,
    qualidadeProdutos: 0.20,
    precosCompetitivos: 0.15,
    atendimento: 0.15,
    flexibilidadeNegociacao: 0.10,
    conformidadeDocumental: 0.15,
  };

  const score =
    fatores.pontualidadeEntrega * pesos.pontualidadeEntrega +
    (fatores.qualidadeProdutos * 10) * pesos.qualidadeProdutos +
    (fatores.precosCompetitivos * 10) * pesos.precosCompetitivos +
    (fatores.atendimento * 10) * pesos.atendimento +
    (fatores.flexibilidadeNegociacao * 10) * pesos.flexibilidadeNegociacao +
    fatores.conformidadeDocumental * pesos.conformidadeDocumental;

  return Math.round(score);
}

function getCategoria(score: number): 'excelente' | 'bom' | 'regular' | 'ruim' | 'critico' {
  if (score >= 85) return 'excelente';
  if (score >= 70) return 'bom';
  if (score >= 55) return 'regular';
  if (score >= 40) return 'ruim';
  return 'critico';
}

// Hook para buscar todas as faturas
function useAllInvoices() {
  const [invoices, setInvoices] = useState<APInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log('🔍 [useSupplierPerformance] Buscando todas as faturas...');
        // Buscar todas as faturas (não só pendentes)
        // IMPORTANTE: SEM trailing slash para evitar redirect HTTP do FastAPI
        // IMPORTANTE: limit máximo aceito pelo backend é 1000
        const response = await api.get<APInvoice[]>('/accounts-payable/invoices?limit=1000');
        console.log('✅ [useSupplierPerformance] Resposta recebida:', response);
        setInvoices(response || []);
      } catch (err: any) {
        console.error('❌ [useSupplierPerformance] Erro ao buscar faturas:', err);
        console.error('❌ [useSupplierPerformance] Error details:', {
          message: err.message,
          status: err.status,
          statusText: err.statusText,
          full: err
        });
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

// Calcular métricas de performance baseado nas faturas
function calculateSupplierMetrics(supplierId: number, invoices: APInvoice[]): SupplierPerformanceScore['metricas'] {
  const supplierInvoices = invoices.filter(inv => inv.supplier_id === supplierId);

  if (supplierInvoices.length === 0) {
    return {
      totalCompras: 0,
      valorTotalComprado: 0,
      ticketMedio: 0,
      frequenciaCompras: 0,
      prazoMedioPagamento: 0,
      descontosObtidos: 0,
      devolucoesReclamacoes: 0,
    };
  }

  const totalValue = supplierInvoices.reduce((sum, inv) => sum + inv.total_value, 0);
  const paidInvoices = supplierInvoices.filter(inv => inv.payment_date);

  // Calcular prazo médio de pagamento
  let avgPaymentDays = 0;
  if (paidInvoices.length > 0) {
    const totalDays = paidInvoices.reduce((sum, inv) => {
      const invoiceDate = new Date(inv.invoice_date);
      const paymentDate = new Date(inv.payment_date!);
      return sum + differenceInDays(paymentDate, invoiceDate);
    }, 0);
    avgPaymentDays = Math.round(totalDays / paidInvoices.length);
  }

  return {
    totalCompras: supplierInvoices.length,
    valorTotalComprado: totalValue,
    ticketMedio: Math.round(totalValue / supplierInvoices.length),
    frequenciaCompras: supplierInvoices.length / 6, // Compras por mês (últimos 6 meses)
    prazoMedioPagamento: avgPaymentDays,
    descontosObtidos: 0, // TODO: Implementar quando tivermos dados de desconto
    devolucoesReclamacoes: 0, // TODO: Implementar quando tivermos dados de devolução
  };
}

// Calcular fatores de performance
function calculateSupplierFactors(supplierId: number, invoices: APInvoice[]): SupplierPerformanceScore['fatores'] {
  const supplierInvoices = invoices.filter(inv => inv.supplier_id === supplierId);

  if (supplierInvoices.length === 0) {
    return {
      pontualidadeEntrega: 0,
      qualidadeProdutos: 5.0,
      precosCompetitivos: 5.0,
      atendimento: 5.0,
      flexibilidadeNegociacao: 5.0,
      conformidadeDocumental: 0,
    };
  }

  const paidInvoices = supplierInvoices.filter(inv => inv.payment_date);
  const paidOnTime = paidInvoices.filter(inv => {
    const dueDate = new Date(inv.due_date);
    const paymentDate = new Date(inv.payment_date!);
    return paymentDate <= dueDate;
  });

  const pontualidade = paidInvoices.length > 0
    ? Math.round((paidOnTime.length / paidInvoices.length) * 100)
    : 80; // Default se não tiver pagamentos ainda

  // Conformidade documental: faturas com status aprovado / total
  const approvedInvoices = supplierInvoices.filter(inv =>
    inv.status === 'approved' || inv.status === 'paid'
  );
  const conformidade = supplierInvoices.length > 0
    ? Math.round((approvedInvoices.length / supplierInvoices.length) * 100)
    : 80; // Default

  return {
    pontualidadeEntrega: pontualidade,
    qualidadeProdutos: 7.5, // TODO: Implementar quando tivermos avaliações
    precosCompetitivos: 7.0, // TODO: Implementar comparação de preços
    atendimento: 7.5, // TODO: Implementar quando tivermos avaliações
    flexibilidadeNegociacao: 7.0, // TODO: Implementar quando tivermos dados
    conformidadeDocumental: conformidade,
  };
}

// Gerar histórico mensal
function generateMonthlyHistory(supplierId: number, invoices: APInvoice[]): SupplierPerformanceScore['historico'] {
  const history: SupplierPerformanceScore['historico'] = [];

  for (let i = 5; i >= 0; i--) {
    const monthDate = subMonths(new Date(), i);
    const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
    const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);

    const monthInvoices = invoices.filter(inv => {
      const invDate = new Date(inv.invoice_date);
      return inv.supplier_id === supplierId &&
             invDate >= monthStart &&
             invDate <= monthEnd;
    });

    const fatores = calculateSupplierFactors(supplierId, monthInvoices);
    const score = calculateScore(fatores);

    history.push({
      mes: format(monthDate, 'MMM/yy', { locale: ptBR }),
      score,
      totalCompras: monthInvoices.length,
    });
  }

  return history;
}

// Gerar recomendações baseadas em métricas
function generateRecommendations(performance: Omit<SupplierPerformanceScore, 'recomendacoes' | 'tendencia' | 'ultimaAtualizacao'>): string[] {
  const recomendacoes: string[] = [];

  if (performance.score >= 85) {
    recomendacoes.push('Fornecedor confiável com excelente histórico');
  }

  if (performance.fatores.pontualidadeEntrega >= 90) {
    recomendacoes.push('Pontualidade exemplar - considere para itens críticos');
  } else if (performance.fatores.pontualidadeEntrega < 70) {
    recomendacoes.push('Atenção à pontualidade de entrega');
  }

  if (performance.metricas.valorTotalComprado > 100000) {
    recomendacoes.push('Alto volume de compras - considere negociar descontos');
  }

  if (performance.fatores.conformidadeDocumental < 80) {
    recomendacoes.push('Exigir melhorias em conformidade documental');
  }

  if (performance.score < 60) {
    recomendacoes.push('Considere buscar fornecedores alternativos');
  }

  if (recomendacoes.length === 0) {
    recomendacoes.push('Fornecedor dentro dos padrões esperados');
  }

  return recomendacoes;
}

// Calcular tendência baseada no histórico
function calculateTrend(historico: SupplierPerformanceScore['historico']): 'melhorando' | 'estavel' | 'piorando' {
  if (historico.length < 2) return 'estavel';

  const recentScores = historico.slice(-3).map(h => h.score);
  const oldScores = historico.slice(0, 3).map(h => h.score);

  const recentAvg = recentScores.reduce((a, b) => a + b, 0) / recentScores.length;
  const oldAvg = oldScores.reduce((a, b) => a + b, 0) / oldScores.length;

  const diff = recentAvg - oldAvg;

  if (diff > 3) return 'melhorando';
  if (diff < -3) return 'piorando';
  return 'estavel';
}

export function useSupplierPerformance(fornecedorId?: string) {
  const { suppliers } = useSuppliers();
  const { invoices, loading } = useAllInvoices();

  const performance = useMemo(() => {
    if (!fornecedorId || loading || suppliers.length === 0) return null;

    const supplierId = parseInt(fornecedorId);
    const supplier = suppliers.find(s => s.id === supplierId);

    if (!supplier) return null;

    const metricas = calculateSupplierMetrics(supplierId, invoices);
    const fatores = calculateSupplierFactors(supplierId, invoices);
    const score = calculateScore(fatores);
    const categoria = getCategoria(score);
    const historico = generateMonthlyHistory(supplierId, invoices);

    const basePerformance = {
      fornecedorId: fornecedorId,
      fornecedorNome: supplier.name,
      score,
      categoria,
      fatores,
      metricas,
      historico,
    };

    const recomendacoes = generateRecommendations(basePerformance);
    const tendencia = calculateTrend(historico);

    return {
      ...basePerformance,
      recomendacoes,
      tendencia,
      ultimaAtualizacao: new Date(),
    } as SupplierPerformanceScore;
  }, [fornecedorId, suppliers, invoices, loading]);

  return performance;
}

export function useAllSupplierPerformances() {
  const { suppliers, loading: suppliersLoading } = useSuppliers();
  const { invoices, loading: invoicesLoading } = useAllInvoices();

  const performances = useMemo(() => {
    if (suppliersLoading || invoicesLoading || suppliers.length === 0) {
      return [];
    }

    const allPerformances: SupplierPerformanceScore[] = suppliers.map(supplier => {
      const metricas = calculateSupplierMetrics(supplier.id, invoices);
      const fatores = calculateSupplierFactors(supplier.id, invoices);
      const score = calculateScore(fatores);
      const categoria = getCategoria(score);
      const historico = generateMonthlyHistory(supplier.id, invoices);

      const basePerformance = {
        fornecedorId: supplier.id.toString(),
        fornecedorNome: supplier.name,
        score,
        categoria,
        fatores,
        metricas,
        historico,
      };

      const recomendacoes = generateRecommendations(basePerformance);
      const tendencia = calculateTrend(historico);

      return {
        ...basePerformance,
        recomendacoes,
        tendencia,
        ultimaAtualizacao: new Date(),
      };
    });

    return allPerformances.sort((a, b) => b.score - a.score);
  }, [suppliers, invoices, suppliersLoading, invoicesLoading]);

  return performances;
}

export { calculateScore, getCategoria };
