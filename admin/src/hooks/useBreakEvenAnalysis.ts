import { useState, useEffect } from 'react';
import { addMonths, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { BreakEvenAnalysis } from '@/types/cash-flow';

interface UseBreakEvenAnalysisReturn {
  breakEven: BreakEvenAnalysis | null;
  loading: boolean;
}

export const useBreakEvenAnalysis = (): UseBreakEvenAnalysisReturn => {
  const [breakEven, setBreakEven] = useState<BreakEvenAnalysis | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const calculateBreakEven = () => {
      setLoading(true);
      try {
        // TODO: Integrar com API real quando disponível
        // Dados mockados baseados em médias do sistema
        const receitaMensalAtual = 78500;
        const custosFixos = 28500; // Despesas operacionais
        const custosVariaveis = 32000; // Custo de produtos (CMV)
        const despesasFinanceiras = 2500;
        const receitasFinanceiras = 1200;

        const custosTotais = custosFixos + custosVariaveis + despesasFinanceiras - receitasFinanceiras;
        const margemContribuicao = receitaMensalAtual - custosVariaveis;
        const percentualMargemContribuicao = margemContribuicao / receitaMensalAtual;

        // Receita necessária para break-even
        const receitaBreakEven = custosTotais / percentualMargemContribuicao;

        // Margem atual
        const lucroAtual = receitaMensalAtual - custosTotais;
        const margemAtual = (lucroAtual / receitaMensalAtual) * 100;

        // Calcular data prevista (assumindo crescimento de 3% ao mês)
        const crescimentoMensal = 0.03;
        let mesesAteBreakEven = 0;
        let receitaProjetada = receitaMensalAtual;

        if (receitaMensalAtual < receitaBreakEven) {
          while (receitaProjetada < receitaBreakEven && mesesAteBreakEven < 24) {
            mesesAteBreakEven++;
            receitaProjetada = receitaMensalAtual * Math.pow(1 + crescimentoMensal, mesesAteBreakEven);
          }
        }

        const dataPrevist = addMonths(new Date(), mesesAteBreakEven);

        // Gerar projeção para o gráfico (próximos 12 meses)
        const projecao = [];
        for (let i = 0; i < 12; i++) {
          const mes = format(addMonths(new Date(), i), 'MMM/yy', { locale: ptBR });
          const receitaMes = receitaMensalAtual * Math.pow(1 + crescimentoMensal, i);

          // Custos variáveis crescem proporcionalmente com a receita
          const custosVariaveisMes = (custosVariaveis / receitaMensalAtual) * receitaMes;

          // Custos fixos aumentam 1% ao mês (inflação)
          const custosFixosMes = custosFixos * Math.pow(1.01, i);
          const despesasFinanceirasMes = despesasFinanceiras * Math.pow(1.01, i);

          const despesasTotais = custosFixosMes + custosVariaveisMes + despesasFinanceirasMes - receitasFinanceiras;

          projecao.push({
            mes,
            receitas: receitaMes,
            despesas: despesasTotais,
            breakEven: receitaBreakEven
          });
        }

        const analysis: BreakEvenAnalysis = {
          receitaBreakEven,
          dataPrevist,
          margemAtual,
          projecao
        };

        setBreakEven(analysis);
      } catch (error) {
        console.error('Erro ao calcular break-even:', error);
      } finally {
        setLoading(false);
      }
    };

    calculateBreakEven();
  }, []);

  return {
    breakEven,
    loading
  };
};
