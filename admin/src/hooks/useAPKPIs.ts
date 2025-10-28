import { useMemo } from 'react';
import { differenceInDays, startOfMonth, endOfMonth } from 'date-fns';

export interface APKPIs {
  // Valores principais
  totalAPagar: number;
  quantidadeTitulos: number;
  vencidosHoje: number;
  vencidosTotais: number;
  valorVencido: number;
  quantidadeVencidos: number;

  // Próximos vencimentos
  proximos7Dias: number;
  quantidadeProximos7Dias: number;
  proximos30Dias: number;
  quantidadeProximos30Dias: number;

  // Indicadores de performance
  dpo: number; // Days Payable Outstanding
  dpoTrend: number; // Variação vs mês anterior
  mediaPagamento: number; // Dias médios de pagamento
  taxaAtrasos: number; // % de pagamentos em atraso

  // Descontos e economia
  descontosDisponiveis: number;
  quantidadeComDesconto: number;
  economiaDescontos: number;
  economiaPercentual: number;

  // Concentração
  concentracaoFornecedores: number; // % dos top 5 fornecedores
  top5Fornecedores: Array<{
    id: string;
    nome: string;
    valor: number;
    percentual: number;
  }>;

  // Ciclo financeiro
  cicloFinanceiro: number; // DPO - DSO

  // Tendências
  comparacaoMesAnterior: {
    totalAPagar: number;
    dpo: number;
    taxaAtrasos: number;
  };
}

// Mock data para desenvolvimento
const mockInvoices = [
  {
    id: 1,
    invoice_number: 'NF-001',
    supplier_id: 1,
    supplier: { id: 1, name: 'Fornecedor A' },
    invoice_date: new Date('2025-10-01'),
    due_date: new Date('2025-10-25'),
    payment_date: null,
    total_value: 5000,
    status: 'pending',
    discount_percentage: 2,
    discount_available_until: new Date('2025-10-23'),
  },
  {
    id: 2,
    invoice_number: 'NF-002',
    supplier_id: 2,
    supplier: { id: 2, name: 'Fornecedor B' },
    invoice_date: new Date('2025-10-05'),
    due_date: new Date('2025-10-20'),
    payment_date: null,
    total_value: 8000,
    status: 'pending',
    discount_percentage: 3,
    discount_available_until: new Date('2025-10-18'),
  },
  {
    id: 3,
    invoice_number: 'NF-003',
    supplier_id: 1,
    supplier: { id: 1, name: 'Fornecedor A' },
    invoice_date: new Date('2025-09-15'),
    due_date: new Date('2025-10-15'),
    payment_date: null,
    total_value: 12000,
    status: 'pending',
    discount_percentage: 0,
  },
  {
    id: 4,
    invoice_number: 'NF-004',
    supplier_id: 3,
    supplier: { id: 3, name: 'Fornecedor C' },
    invoice_date: new Date('2025-10-10'),
    due_date: new Date('2025-11-02'),
    payment_date: null,
    total_value: 3500,
    status: 'validated',
    discount_percentage: 1.5,
    discount_available_until: new Date('2025-10-30'),
  },
  {
    id: 5,
    invoice_number: 'NF-005',
    supplier_id: 2,
    supplier: { id: 2, name: 'Fornecedor B' },
    invoice_date: new Date('2025-09-20'),
    due_date: new Date('2025-10-28'),
    payment_date: null,
    total_value: 15000,
    status: 'validated',
    discount_percentage: 2.5,
    discount_available_until: new Date('2025-10-26'),
  },
  {
    id: 6,
    invoice_number: 'NF-006',
    supplier_id: 4,
    supplier: { id: 4, name: 'Fornecedor D' },
    invoice_date: new Date('2025-10-15'),
    due_date: new Date('2025-11-05'),
    payment_date: null,
    total_value: 6800,
    status: 'pending',
    discount_percentage: 0,
  },
  {
    id: 7,
    invoice_number: 'NF-007',
    supplier_id: 5,
    supplier: { id: 5, name: 'Fornecedor E' },
    invoice_date: new Date('2025-09-01'),
    due_date: new Date('2025-09-30'),
    payment_date: new Date('2025-10-02'),
    total_value: 9200,
    status: 'paid',
  },
  {
    id: 8,
    invoice_number: 'NF-008',
    supplier_id: 1,
    supplier: { id: 1, name: 'Fornecedor A' },
    invoice_date: new Date('2025-09-25'),
    due_date: new Date('2025-10-25'),
    payment_date: new Date('2025-10-26'),
    total_value: 4500,
    status: 'paid',
  },
];

export function useAPKPIs(): APKPIs {
  return useMemo(() => {
    const hoje = new Date();
    const inicioMes = startOfMonth(hoje);
    const fimMes = endOfMonth(hoje);

    // Filtrar faturas pendentes e validadas (não pagas)
    const faturasAbertas = mockInvoices.filter(
      (invoice) => invoice.status === 'pending' || invoice.status === 'validated'
    );

    const faturasPagas = mockInvoices.filter(
      (invoice) => invoice.status === 'paid'
    );

    // Total a Pagar
    const totalAPagar = faturasAbertas.reduce((sum, inv) => sum + inv.total_value, 0);
    const quantidadeTitulos = faturasAbertas.length;

    // Vencidos
    const faturasVencidas = faturasAbertas.filter(
      (invoice) => invoice.due_date && new Date(invoice.due_date) < hoje
    );
    const valorVencido = faturasVencidas.reduce((sum, inv) => sum + inv.total_value, 0);
    const quantidadeVencidos = faturasVencidas.length;

    // Vencendo hoje
    const vencidosHoje = faturasAbertas
      .filter((invoice) => {
        if (!invoice.due_date) return false;
        const dueDate = new Date(invoice.due_date);
        return (
          dueDate.getDate() === hoje.getDate() &&
          dueDate.getMonth() === hoje.getMonth() &&
          dueDate.getFullYear() === hoje.getFullYear()
        );
      })
      .reduce((sum, inv) => sum + inv.total_value, 0);

    // Próximos 7 dias
    const data7Dias = new Date(hoje);
    data7Dias.setDate(data7Dias.getDate() + 7);
    const faturasProximos7Dias = faturasAbertas.filter((invoice) => {
      if (!invoice.due_date) return false;
      const dueDate = new Date(invoice.due_date);
      return dueDate >= hoje && dueDate <= data7Dias;
    });
    const proximos7Dias = faturasProximos7Dias.reduce((sum, inv) => sum + inv.total_value, 0);
    const quantidadeProximos7Dias = faturasProximos7Dias.length;

    // Próximos 30 dias
    const data30Dias = new Date(hoje);
    data30Dias.setDate(data30Dias.getDate() + 30);
    const faturasProximos30Dias = faturasAbertas.filter((invoice) => {
      if (!invoice.due_date) return false;
      const dueDate = new Date(invoice.due_date);
      return dueDate >= hoje && dueDate <= data30Dias;
    });
    const proximos30Dias = faturasProximos30Dias.reduce((sum, inv) => sum + inv.total_value, 0);
    const quantidadeProximos30Dias = faturasProximos30Dias.length;

    // DPO - Days Payable Outstanding
    // Fórmula simplificada: (Contas a Pagar / Compras) * Dias do Período
    const comprasMes = mockInvoices
      .filter((inv) => {
        const invDate = new Date(inv.invoice_date);
        return invDate >= inicioMes && invDate <= fimMes;
      })
      .reduce((sum, inv) => sum + inv.total_value, 0);

    const dpo = comprasMes > 0 ? Math.round((totalAPagar / comprasMes) * 30) : 0;

    // DPO do mês anterior (simplificado)
    const dpoMesAnterior = dpo > 0 ? dpo - 2 : 0; // Mock de variação
    const dpoTrend = dpoMesAnterior > 0 ? ((dpo - dpoMesAnterior) / dpoMesAnterior) * 100 : 0;

    // Média de dias de pagamento
    const diasPagamento = faturasPagas.map((invoice) => {
      if (!invoice.payment_date || !invoice.due_date) return 0;
      return differenceInDays(new Date(invoice.payment_date), new Date(invoice.due_date));
    });
    const mediaPagamento = diasPagamento.length > 0
      ? Math.round(diasPagamento.reduce((sum, dias) => sum + dias, 0) / diasPagamento.length)
      : 0;

    // Taxa de atrasos
    const totalFaturas = mockInvoices.filter(
      (inv) => inv.status === 'paid' || inv.status === 'pending' || inv.status === 'validated'
    ).length;
    const faturasAtrasadas = mockInvoices.filter((invoice) => {
      if (invoice.status === 'paid' && invoice.payment_date && invoice.due_date) {
        return new Date(invoice.payment_date) > new Date(invoice.due_date);
      }
      if ((invoice.status === 'pending' || invoice.status === 'validated') && invoice.due_date) {
        return new Date(invoice.due_date) < hoje;
      }
      return false;
    }).length;
    const taxaAtrasos = totalFaturas > 0 ? (faturasAtrasadas / totalFaturas) * 100 : 0;

    // Descontos disponíveis
    const faturasComDesconto = faturasAbertas.filter(
      (invoice) =>
        invoice.discount_percentage &&
        invoice.discount_percentage > 0 &&
        invoice.discount_available_until &&
        new Date(invoice.discount_available_until) >= hoje
    );
    const descontosDisponiveis = faturasComDesconto.reduce(
      (sum, inv) => sum + inv.total_value * (inv.discount_percentage! / 100),
      0
    );
    const quantidadeComDesconto = faturasComDesconto.length;

    // Economia com descontos (do mês)
    const economiaDescontos = 2450; // Mock - seria calculado com base em descontos aproveitados
    const economiaPercentual = totalAPagar > 0 ? (economiaDescontos / totalAPagar) * 100 : 0;

    // Concentração de fornecedores
    const fornecedoresTotais = faturasAbertas.reduce((acc, invoice) => {
      const fornecedorId = invoice.supplier?.id || invoice.supplier_id;
      const fornecedorNome = invoice.supplier?.name || 'Desconhecido';

      if (!acc[fornecedorId]) {
        acc[fornecedorId] = {
          id: fornecedorId.toString(),
          nome: fornecedorNome,
          valor: 0,
        };
      }
      acc[fornecedorId].valor += invoice.total_value;
      return acc;
    }, {} as Record<number, { id: string; nome: string; valor: number }>);

    const top5Fornecedores = Object.values(fornecedoresTotais)
      .sort((a, b) => b.valor - a.valor)
      .slice(0, 5)
      .map((f) => ({
        ...f,
        percentual: totalAPagar > 0 ? (f.valor / totalAPagar) * 100 : 0,
      }));

    const concentracaoFornecedores =
      top5Fornecedores.reduce((sum, f) => sum + f.percentual, 0);

    // Ciclo financeiro (DPO - DSO)
    // DSO seria importado do módulo de Contas a Receber
    const dso = 45; // Mock
    const cicloFinanceiro = dpo - dso;

    // Comparação com mês anterior
    const comparacaoMesAnterior = {
      totalAPagar: -5.2, // Mock de variação percentual
      dpo: dpoTrend,
      taxaAtrasos: -12.5, // Mock de variação percentual
    };

    return {
      totalAPagar,
      quantidadeTitulos,
      vencidosHoje,
      vencidosTotais: valorVencido,
      valorVencido,
      quantidadeVencidos,
      proximos7Dias,
      quantidadeProximos7Dias,
      proximos30Dias,
      quantidadeProximos30Dias,
      dpo,
      dpoTrend,
      mediaPagamento,
      taxaAtrasos,
      descontosDisponiveis,
      quantidadeComDesconto,
      economiaDescontos,
      economiaPercentual,
      concentracaoFornecedores,
      top5Fornecedores,
      cicloFinanceiro,
      comparacaoMesAnterior,
    };
  }, []);
}
