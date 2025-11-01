import { useMemo } from 'react';
import { Negotiation, NegotiationSummary } from '@/types/discount';
import { useDiscountOpportunities } from './useDiscountOpportunities';

export const useNegotiations = () => {
  // Buscar todas as oportunidades (sem filtro)
  const { opportunities, loading } = useDiscountOpportunities();

  const negotiations = useMemo(() => {
    // Converter oportunidades aproveitadas em negociações
    const aproveitadas = opportunities.filter(opp => opp.status === 'aproveitado');

    return aproveitadas.map((opp): Negotiation => ({
      id: opp.id,
      faturaId: opp.faturaId,
      invoiceNumber: opp.invoiceNumber,
      fornecedor: opp.fornecedor,
      fornecedorId: opp.fornecedorId,
      tipo: 'desconto',
      valorOriginal: opp.valorOriginal,
      valorNegociado: opp.valorFinal,
      economia: opp.valorDesconto,
      economiaPercentual: opp.descontoPercentual,
      status: 'aceita',
      negociadoPor: 'Sistema', // TODO: Pegar do histórico quando disponível
      negociadoPorId: 'system',
      dataInicio: new Date(opp.dataLimite), // Aproximação
      dataFechamento: new Date(), // Aproximação
      observacoes: `Desconto de ${opp.descontoPercentual}% aplicado. ${opp.condicao}`,
      detalhes: {
        descontoPercentualOriginal: 0,
        descontoPercentualNegociado: opp.descontoPercentual,
      },
    }));
  }, [opportunities]);

  return { negotiations, loading };
};

export const useNegotiationSummary = (): NegotiationSummary & { loading: boolean } => {
  const { negotiations, loading } = useNegotiations();
  const { opportunities } = useDiscountOpportunities();

  return useMemo(() => {
    const emNegociacao = opportunities.filter(o => o.status === 'disponivel').length;
    const negociacoesAceitas = negotiations.filter(n => n.status === 'aceita').length;
    const negociacoesRecusadas = 0; // Não temos dados de recusadas ainda

    const totalNegociacoes = negotiations.length;
    const economiaTotal = negotiations
      .filter(n => n.status === 'aceita')
      .reduce((sum, n) => sum + n.economia, 0);

    const taxaSucesso = totalNegociacoes > 0
      ? (negociacoesAceitas / totalNegociacoes) * 100
      : 0;

    const economiaMedia = negociacoesAceitas > 0
      ? economiaTotal / negociacoesAceitas
      : 0;

    return {
      totalNegociacoes,
      emNegociacao,
      negociacoesAceitas,
      negociacoesRecusadas,
      taxaSucesso,
      economiaTotal,
      economiaMedia,
      loading,
    };
  }, [negotiations, opportunities, loading]);
};
