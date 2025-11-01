import { useState, useEffect } from 'react';
import type { Recommendation } from '@/types/cash-flow';
import { useCashFlowProjection } from './useCashFlowProjection';
import { useBankAccounts } from './useBankAccounts';
import { useFinancialKPIs } from './useFinancialKPIs';

interface UseAIRecommendationsReturn {
  recommendations: Recommendation[];
  loading: boolean;
}

export const useAIRecommendations = (): UseAIRecommendationsReturn => {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);

  const { dados: projection } = useCashFlowProjection(30);
  const { accounts, getTotalBalance } = useBankAccounts();
  const { kpis } = useFinancialKPIs();

  useEffect(() => {
    generateRecommendations();
  }, [projection, accounts, kpis]);

  const generateRecommendations = () => {
    setLoading(true);
    try {
      const newRecommendations: Recommendation[] = [];

      // 1. Recomendação de Redução de Custos
      if (kpis && kpis.margemLiquida !== undefined && kpis.margemLiquida < 15) {
        newRecommendations.push({
          id: 'rec-reducao-custos',
          tipo: 'economia',
          prioridade: 'alta',
          titulo: 'Reduza Custos Operacionais',
          descricao: 'Sua margem líquida está abaixo do ideal (15%). Analise suas despesas operacionais e identifique oportunidades de redução de custos.',
          impactoFinanceiro: 8500,
          esforco: 'medio',
          prazo: '1-2 meses',
          acao: 'Analisar Despesas'
        });
      }

      // 2. Recomendação de Investimento
      const contaCorrente = accounts.find(a => a.tipo === 'corrente' && a.ativa);
      if (contaCorrente && contaCorrente.saldo > 20000) {
        const valorSugerido = Math.min(contaCorrente.saldo * 0.4, 30000);
        const rendimentoEstimado = valorSugerido * 0.01 * 12; // 1% ao mês por 12 meses

        newRecommendations.push({
          id: 'rec-investimento',
          tipo: 'investimento',
          prioridade: 'media',
          titulo: 'Invista o Excedente de Caixa',
          descricao: `Você tem R$ ${contaCorrente.saldo.toLocaleString('pt-BR')} em conta corrente. Considere investir R$ ${valorSugerido.toLocaleString('pt-BR')} em CDB para gerar rendimento.`,
          impactoFinanceiro: rendimentoEstimado,
          esforco: 'baixo',
          prazo: 'Imediato',
          acao: 'Simular Investimento'
        });
      }

      // 3. Recomendação de Negociação com Fornecedores
      const pmp = kpis?.pmp || 0;
      const pmr = kpis?.pmr || 0;

      if (pmr > pmp + 10) {
        const melhoria = (pmr - pmp) * 500; // impacto estimado
        newRecommendations.push({
          id: 'rec-negociacao-fornecedores',
          tipo: 'negociacao',
          prioridade: 'alta',
          titulo: 'Negocie Prazos com Fornecedores',
          descricao: `Seu prazo médio de recebimento (${pmr.toFixed(0)} dias) é maior que o de pagamento (${pmp.toFixed(0)} dias). Negocie prazos maiores com fornecedores para melhorar seu ciclo financeiro.`,
          impactoFinanceiro: melhoria,
          esforco: 'medio',
          prazo: '2-3 meses',
          acao: 'Ver Fornecedores'
        });
      }

      // 4. Recomendação de Antecipação de Recebíveis
      const saldoNegativoFuturo = projection.some(p => p.saldoFinalPrevisto < 0);

      if (saldoNegativoFuturo) {
        newRecommendations.push({
          id: 'rec-antecipacao-recebiveis',
          tipo: 'otimizacao',
          prioridade: 'alta',
          titulo: 'Antecipe Recebíveis',
          descricao: 'Com previsão de saldo negativo, considere antecipar recebíveis para manter o fluxo de caixa positivo.',
          impactoFinanceiro: 15000,
          esforco: 'medio',
          prazo: 'Imediato',
          acao: 'Analisar Recebíveis'
        });
      }

      // 5. Recomendação de Diversificação de Contas
      const saldoTotal = getTotalBalance();
      const contaMaiorSaldo = accounts
        .filter(a => a.ativa)
        .sort((a, b) => b.saldo - a.saldo)[0];

      if (contaMaiorSaldo && saldoTotal > 0) {
        const percentual = (contaMaiorSaldo.saldo / saldoTotal) * 100;
        if (percentual > 70) {
          newRecommendations.push({
            id: 'rec-diversificacao',
            tipo: 'otimizacao',
            prioridade: 'media',
            titulo: 'Diversifique seus Recursos',
            descricao: `${percentual.toFixed(0)}% do seu saldo está em uma única conta. Distribua seus recursos em diferentes contas e investimentos para reduzir riscos.`,
            impactoFinanceiro: 0,
            esforco: 'baixo',
            prazo: 'Imediato',
            acao: 'Transferir Valores'
          });
        }
      }

      // 6. Recomendação de Melhoria de Margem
      if (kpis && kpis.margemEbitda !== undefined && kpis.margemEbitda < 20) {
        newRecommendations.push({
          id: 'rec-melhoria-margem',
          tipo: 'economia',
          prioridade: 'media',
          titulo: 'Aumente sua Margem EBITDA',
          descricao: 'Sua margem EBITDA está abaixo do ideal. Revise sua precificação e otimize processos para aumentar a margem.',
          impactoFinanceiro: 12000,
          esforco: 'alto',
          prazo: '3-6 meses',
          acao: 'Analisar Precificação'
        });
      }

      // 7. Recomendação de Controle de Burn Rate
      if (kpis && kpis.runway !== undefined && kpis.runway < 6) {
        newRecommendations.push({
          id: 'rec-burn-rate',
          tipo: 'economia',
          prioridade: 'alta',
          titulo: 'Reduza o Burn Rate',
          descricao: `Seu runway é de apenas ${kpis.runway.toFixed(1)} meses. É crítico reduzir a taxa de queima de caixa ou aumentar receitas.`,
          impactoFinanceiro: (kpis.burnRate ?? 0) * 0.3,
          esforco: 'alto',
          prazo: 'Imediato',
          acao: 'Revisar Despesas'
        });
      }

      // Ordenar por prioridade
      const prioridadeOrdem = { alta: 0, media: 1, baixa: 2 };
      newRecommendations.sort((a, b) => prioridadeOrdem[a.prioridade] - prioridadeOrdem[b.prioridade]);

      setRecommendations(newRecommendations);
    } catch (error) {
      console.error('Erro ao gerar recomendações:', error);
    } finally {
      setLoading(false);
    }
  };

  return {
    recommendations,
    loading
  };
};
