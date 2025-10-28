import { useMemo } from 'react';
import { differenceInDays } from 'date-fns';

export interface APAgingBucket {
  fornecedorId: string;
  fornecedorNome: string;
  aVencer: number; // Ainda a vencer (futuro)
  vencendoHoje: number; // Vencendo hoje
  vencido1a7: number; // 1-7 dias vencidos
  vencido8a15: number; // 8-15 dias vencidos
  vencido16a30: number; // 16-30 dias vencidos
  vencido30Plus: number; // 30+ dias vencidos
  total: number;
  urgencia: 'baixa' | 'media' | 'alta' | 'critica';
  quantidadeTitulos: number;
}

export interface APAgingTotals {
  aVencer: number;
  vencendoHoje: number;
  vencido1a7: number;
  vencido8a15: number;
  vencido16a30: number;
  vencido30Plus: number;
  total: number;
}

// Mock data
const mockInvoices = [
  {
    id: 1,
    invoice_number: 'NF-001',
    supplier_id: 1,
    supplier: { id: 1, name: 'Fornecedor Alpha Ltda' },
    invoice_date: new Date('2025-10-01'),
    due_date: new Date('2025-10-25'),
    total_value: 5000,
    status: 'pending',
  },
  {
    id: 2,
    invoice_number: 'NF-002',
    supplier_id: 2,
    supplier: { id: 2, name: 'Beta Fornecimentos S.A.' },
    invoice_date: new Date('2025-10-05'),
    due_date: new Date('2025-10-20'),
    total_value: 8000,
    status: 'pending',
  },
  {
    id: 3,
    invoice_number: 'NF-003',
    supplier_id: 1,
    supplier: { id: 1, name: 'Fornecedor Alpha Ltda' },
    invoice_date: new Date('2025-09-15'),
    due_date: new Date('2025-10-15'),
    total_value: 12000,
    status: 'pending',
  },
  {
    id: 4,
    invoice_number: 'NF-004',
    supplier_id: 3,
    supplier: { id: 3, name: 'Gamma Comércio Ltda' },
    invoice_date: new Date('2025-10-10'),
    due_date: new Date('2025-11-02'),
    total_value: 3500,
    status: 'validated',
  },
  {
    id: 5,
    invoice_number: 'NF-005',
    supplier_id: 2,
    supplier: { id: 2, name: 'Beta Fornecimentos S.A.' },
    invoice_date: new Date('2025-09-20'),
    due_date: new Date('2025-10-28'),
    total_value: 15000,
    status: 'validated',
  },
  {
    id: 6,
    invoice_number: 'NF-006',
    supplier_id: 4,
    supplier: { id: 4, name: 'Delta Distribuidora ME' },
    invoice_date: new Date('2025-10-15'),
    due_date: new Date('2025-11-05'),
    total_value: 6800,
    status: 'pending',
  },
  {
    id: 7,
    invoice_number: 'NF-007',
    supplier_id: 5,
    supplier: { id: 5, name: 'Epsilon Materiais Ltda' },
    invoice_date: new Date('2025-09-25'),
    due_date: new Date('2025-10-28'),
    total_value: 4200,
    status: 'pending',
  },
  {
    id: 8,
    invoice_number: 'NF-008',
    supplier_id: 1,
    supplier: { id: 1, name: 'Fornecedor Alpha Ltda' },
    invoice_date: new Date('2025-09-01'),
    due_date: new Date('2025-09-25'),
    total_value: 9500,
    status: 'pending',
  },
  {
    id: 9,
    invoice_number: 'NF-009',
    supplier_id: 3,
    supplier: { id: 3, name: 'Gamma Comércio Ltda' },
    invoice_date: new Date('2025-08-20'),
    due_date: new Date('2025-09-20'),
    total_value: 7800,
    status: 'pending',
  },
  {
    id: 10,
    invoice_number: 'NF-010',
    supplier_id: 4,
    supplier: { id: 4, name: 'Delta Distribuidora ME' },
    invoice_date: new Date('2025-10-20'),
    due_date: new Date('2025-11-10'),
    total_value: 5500,
    status: 'validated',
  },
];

function calculateUrgency(bucket: Omit<APAgingBucket, 'urgencia'>): 'baixa' | 'media' | 'alta' | 'critica' {
  const totalVencido = bucket.vencido1a7 + bucket.vencido8a15 + bucket.vencido16a30 + bucket.vencido30Plus;
  const percentualVencido = bucket.total > 0 ? (totalVencido / bucket.total) * 100 : 0;

  // Crítico: mais de 50% vencido ou 30+ dias com valor alto
  if (percentualVencido > 50 || bucket.vencido30Plus > 10000) {
    return 'critica';
  }

  // Alto: entre 25% e 50% vencido ou valores altos vencidos
  if (percentualVencido > 25 || totalVencido > 15000) {
    return 'alta';
  }

  // Médio: entre 10% e 25% vencido
  if (percentualVencido > 10 || totalVencido > 5000) {
    return 'media';
  }

  // Baixo: menos de 10% vencido
  return 'baixa';
}

export function useAPAgingReport(): APAgingBucket[] {
  return useMemo(() => {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    // Filtrar apenas faturas pendentes e validadas (não pagas)
    const faturasAbertas = mockInvoices.filter(
      (invoice) => invoice.status === 'pending' || invoice.status === 'validated'
    );

    // Agrupar por fornecedor
    const agrupamento = faturasAbertas.reduce((acc, invoice) => {
      const fornecedorId = invoice.supplier?.id || invoice.supplier_id;
      const fornecedorNome = invoice.supplier?.name || 'Desconhecido';

      if (!acc[fornecedorId]) {
        acc[fornecedorId] = {
          fornecedorId: fornecedorId.toString(),
          fornecedorNome,
          aVencer: 0,
          vencendoHoje: 0,
          vencido1a7: 0,
          vencido8a15: 0,
          vencido16a30: 0,
          vencido30Plus: 0,
          total: 0,
          quantidadeTitulos: 0,
        };
      }

      const bucket = acc[fornecedorId];
      bucket.total += invoice.total_value;
      bucket.quantidadeTitulos += 1;

      if (!invoice.due_date) {
        bucket.aVencer += invoice.total_value;
        return acc;
      }

      const dueDate = new Date(invoice.due_date);
      dueDate.setHours(0, 0, 0, 0);
      const diasDiferenca = differenceInDays(hoje, dueDate);

      // Vencendo hoje
      if (diasDiferenca === 0) {
        bucket.vencendoHoje += invoice.total_value;
      }
      // A vencer (futuro)
      else if (diasDiferenca < 0) {
        bucket.aVencer += invoice.total_value;
      }
      // Vencido 1-7 dias
      else if (diasDiferenca >= 1 && diasDiferenca <= 7) {
        bucket.vencido1a7 += invoice.total_value;
      }
      // Vencido 8-15 dias
      else if (diasDiferenca >= 8 && diasDiferenca <= 15) {
        bucket.vencido8a15 += invoice.total_value;
      }
      // Vencido 16-30 dias
      else if (diasDiferenca >= 16 && diasDiferenca <= 30) {
        bucket.vencido16a30 += invoice.total_value;
      }
      // Vencido 30+ dias
      else {
        bucket.vencido30Plus += invoice.total_value;
      }

      return acc;
    }, {} as Record<number, Omit<APAgingBucket, 'urgencia'>>);

    // Converter para array e calcular urgência
    const result = Object.values(agrupamento).map((bucket) => ({
      ...bucket,
      urgencia: calculateUrgency(bucket),
    }));

    // Ordenar por urgência e valor total (descendente)
    const urgenciaOrder = { critica: 0, alta: 1, media: 2, baixa: 3 };
    result.sort((a, b) => {
      const urgenciaCompare = urgenciaOrder[a.urgencia] - urgenciaOrder[b.urgencia];
      if (urgenciaCompare !== 0) return urgenciaCompare;
      return b.total - a.total;
    });

    return result;
  }, []);
}

export function useAPAgingTotals(): APAgingTotals {
  const agingData = useAPAgingReport();

  return useMemo(() => {
    return agingData.reduce(
      (totals, bucket) => ({
        aVencer: totals.aVencer + bucket.aVencer,
        vencendoHoje: totals.vencendoHoje + bucket.vencendoHoje,
        vencido1a7: totals.vencido1a7 + bucket.vencido1a7,
        vencido8a15: totals.vencido8a15 + bucket.vencido8a15,
        vencido16a30: totals.vencido16a30 + bucket.vencido16a30,
        vencido30Plus: totals.vencido30Plus + bucket.vencido30Plus,
        total: totals.total + bucket.total,
      }),
      {
        aVencer: 0,
        vencendoHoje: 0,
        vencido1a7: 0,
        vencido8a15: 0,
        vencido16a30: 0,
        vencido30Plus: 0,
        total: 0,
      }
    );
  }, [agingData]);
}
