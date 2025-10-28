'use client';

import { useMemo } from 'react';

export interface AgingBucket {
  clienteId: string;
  clienteNome: string;
  atual: number; // 0-30 dias
  dias30: number; // 31-60 dias
  dias60: number; // 61-90 dias
  dias90: number; // 91-120 dias
  dias120Plus: number; // 120+ dias
  total: number;
  risco: 'baixo' | 'medio' | 'alto' | 'critico';
}

// Mock data - será substituído por dados reais da API
const mockAgingData: AgingBucket[] = [
  {
    clienteId: '1',
    clienteNome: 'Empresa ABC Ltda',
    atual: 45000,
    dias30: 12000,
    dias60: 5000,
    dias90: 2000,
    dias120Plus: 0,
    total: 64000,
    risco: 'baixo',
  },
  {
    clienteId: '2',
    clienteNome: 'Comercial XYZ S.A.',
    atual: 28000,
    dias30: 15000,
    dias60: 8000,
    dias90: 4000,
    dias120Plus: 1500,
    total: 56500,
    risco: 'medio',
  },
  {
    clienteId: '3',
    clienteNome: 'Distribuidora 123',
    atual: 35000,
    dias30: 0,
    dias60: 0,
    dias90: 0,
    dias120Plus: 0,
    total: 35000,
    risco: 'baixo',
  },
  {
    clienteId: '4',
    clienteNome: 'Indústria DEF',
    atual: 15000,
    dias30: 22000,
    dias60: 18000,
    dias90: 12000,
    dias120Plus: 8000,
    total: 75000,
    risco: 'alto',
  },
  {
    clienteId: '5',
    clienteNome: 'Varejo GHI',
    atual: 8000,
    dias30: 5000,
    dias60: 12000,
    dias90: 15000,
    dias120Plus: 22000,
    total: 62000,
    risco: 'critico',
  },
  {
    clienteId: '6',
    clienteNome: 'Atacado JKL',
    atual: 52000,
    dias30: 8000,
    dias60: 0,
    dias90: 0,
    dias120Plus: 0,
    total: 60000,
    risco: 'baixo',
  },
];

export function useAgingReport(): AgingBucket[] {
  const agingData = useMemo(() => {
    // Ordenar por risco (crítico primeiro) e depois por total
    return [...mockAgingData].sort((a, b) => {
      const riscoOrder = { critico: 0, alto: 1, medio: 2, baixo: 3 };
      const riscoCompare = riscoOrder[a.risco] - riscoOrder[b.risco];
      if (riscoCompare !== 0) return riscoCompare;
      return b.total - a.total;
    });
  }, []);

  return agingData;
}

export function useAgingTotals() {
  const agingData = useAgingReport();

  return useMemo(() => {
    const totals = agingData.reduce(
      (acc, bucket) => ({
        atual: acc.atual + bucket.atual,
        dias30: acc.dias30 + bucket.dias30,
        dias60: acc.dias60 + bucket.dias60,
        dias90: acc.dias90 + bucket.dias90,
        dias120Plus: acc.dias120Plus + bucket.dias120Plus,
        total: acc.total + bucket.total,
      }),
      { atual: 0, dias30: 0, dias60: 0, dias90: 0, dias120Plus: 0, total: 0 }
    );

    return totals;
  }, [agingData]);
}
