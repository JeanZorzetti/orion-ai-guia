'use client';

import { useMemo } from 'react';
import { addDays } from 'date-fns';

export interface PaymentPrediction {
  contaReceberId: string;
  probabilidadePagamento: number; // 0-100%
  dataPrevisaoPagamento: Date;
  confiancaPrevisao: 'alta' | 'media' | 'baixa';
  fatoresInfluencia: {
    historico: number;
    valor: number;
    relacionamento: number;
    sazonalidade: number;
  };
  acoesSugeridas: string[];
}

const mockPredictions: Record<string, PaymentPrediction> = {
  '1': {
    contaReceberId: '1',
    probabilidadePagamento: 92,
    dataPrevisaoPagamento: addDays(new Date(), 2),
    confiancaPrevisao: 'alta',
    fatoresInfluencia: {
      historico: 45,
      valor: 15,
      relacionamento: 30,
      sazonalidade: 10,
    },
    acoesSugeridas: [
      'Cliente com excelente histórico - baixo risco',
      'Considerar desconto para pagamento antecipado',
    ],
  },
  '2': {
    contaReceberId: '2',
    probabilidadePagamento: 75,
    dataPrevisaoPagamento: addDays(new Date(), 5),
    confiancaPrevisao: 'media',
    fatoresInfluencia: {
      historico: 35,
      valor: 25,
      relacionamento: 25,
      sazonalidade: 15,
    },
    acoesSugeridas: [
      'Enviar lembrete 3 dias antes do vencimento',
      'Histórico indica pagamento com pequeno atraso',
    ],
  },
};

export function usePaymentPrediction(contaReceberId: string): PaymentPrediction | null {
  return useMemo(() => {
    return mockPredictions[contaReceberId] || null;
  }, [contaReceberId]);
}
