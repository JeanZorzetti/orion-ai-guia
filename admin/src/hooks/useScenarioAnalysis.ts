import { useState, useEffect } from 'react';
import { addDays, startOfDay } from 'date-fns';
import type { Scenario, CashFlowProjection } from '@/types/cash-flow';

interface UseScenarioAnalysisReturn {
  scenarios: Scenario[];
  loading: boolean;
}

export const useScenarioAnalysis = (dias: number = 30): UseScenarioAnalysisReturn => {
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const calculateScenarios = () => {
      setLoading(true);
      try {
        const scenariosList: Scenario[] = [
          {
            id: 'otimista',
            nome: 'Cenário Otimista',
            tipo: 'otimista',
            premissas: {
              taxaRecebimento: 95,
              taxaAtraso: 2,
              receitasAdicionais: 10000,
              despesasAdicionais: 0,
              crescimentoReceita: 5,
            },
            projecao: []
          },
          {
            id: 'realista',
            nome: 'Cenário Realista',
            tipo: 'realista',
            premissas: {
              taxaRecebimento: 85,
              taxaAtraso: 7,
              receitasAdicionais: 0,
              despesasAdicionais: 0,
              crescimentoReceita: 2,
            },
            projecao: []
          },
          {
            id: 'pessimista',
            nome: 'Cenário Pessimista',
            tipo: 'pessimista',
            premissas: {
              taxaRecebimento: 70,
              taxaAtraso: 15,
              receitasAdicionais: 0,
              despesasAdicionais: 5000,
              crescimentoReceita: -3,
            },
            projecao: []
          }
        ];

        // Calcular projeção para cada cenário
        scenariosList.forEach(scenario => {
          scenario.projecao = calculateScenarioProjection(dias, scenario.premissas);
        });

        setScenarios(scenariosList);
      } catch (error) {
        console.error('Erro ao calcular cenários:', error);
      } finally {
        setLoading(false);
      }
    };

    calculateScenarios();
  }, [dias]);

  return {
    scenarios,
    loading
  };
};

function calculateScenarioProjection(
  dias: number,
  premissas: Scenario['premissas']
): CashFlowProjection[] {
  const resultado: CashFlowProjection[] = [];
  const hoje = startOfDay(new Date());
  let saldoAtual = 45280.30;

  // Médias base
  const mediaEntradasBase = 3685.71; // Calculado do histórico
  const mediaSaidasBase = 2292.86;

  for (let i = 0; i < dias; i++) {
    const data = addDays(hoje, i);
    // const diaIndex = i % 7;

    // Aplicar premissas do cenário
    let entradas = mediaEntradasBase * (1 + premissas.crescimentoReceita / 100);
    let saidas = mediaSaidasBase;

    // Aplicar taxa de recebimento
    entradas = entradas * (premissas.taxaRecebimento / 100);

    // Aplicar atraso (diminui entradas proporcionalmente)
    const fatorAtraso = Math.max(0, 1 - (premissas.taxaAtraso / 30));
    entradas = entradas * fatorAtraso;

    // Adicionar receitas/despesas extras
    if (i === 0) {
      entradas += premissas.receitasAdicionais;
      saidas += premissas.despesasAdicionais;
    }

    // Variação aleatória baseada no cenário
    let variacaoFactor = 0.2;
    if (premissas.crescimentoReceita > 0) {
      variacaoFactor = 0.15; // Menos variação no otimista
    } else if (premissas.crescimentoReceita < 0) {
      variacaoFactor = 0.3; // Mais variação no pessimista
    }

    const variacaoEntradas = (Math.random() - 0.5) * variacaoFactor * 2;
    const variacaoSaidas = (Math.random() - 0.5) * variacaoFactor * 2;

    entradas = Math.max(0, entradas * (1 + variacaoEntradas));
    saidas = Math.max(0, saidas * (1 + variacaoSaidas));

    // Ajustar para fim de semana
    const diaSemana = data.getDay();
    if (diaSemana === 0 || diaSemana === 6) {
      entradas *= 0.3;
      saidas *= 0.2;
    }

    const saldoFinal = saldoAtual + entradas - saidas;

    // Confiança diminui com o tempo e é afetada pelas premissas
    const confiancaBase = Math.max(40, 90 - (i * 1.2));
    const ajusteConfianca = premissas.taxaRecebimento / 100;
    const confianca = confiancaBase * ajusteConfianca;

    const margemErro = (entradas + saidas) * (1 - confianca / 100);

    resultado.push({
      data,
      saldoInicial: saldoAtual,
      entradasPrevistas: entradas,
      saidasPrevistas: saidas,
      saldoFinalPrevisto: saldoFinal,
      confianca,
      origem: 'projetado',
      limiteInferior: saldoFinal - margemErro,
      limiteSuperior: saldoFinal + margemErro
    });

    saldoAtual = saldoFinal;
  }

  return resultado;
}
