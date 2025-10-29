import { useState, useEffect } from 'react';
import { addDays, startOfDay } from 'date-fns';
import type { CashFlowProjection, CashFlowAlert } from '@/types/cash-flow';

interface UseCashFlowProjectionReturn {
  dados: CashFlowProjection[];
  alertas: CashFlowAlert[];
  saldoMinimoProjetado: number;
  saldoMaximoProjetado: number;
  loading: boolean;
}

export const useCashFlowProjection = (dias: number): UseCashFlowProjectionReturn => {
  const [projection, setProjection] = useState<CashFlowProjection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAndCalculateProjection = async () => {
      setLoading(true);
      try {
        // TODO: Integrar com API real quando disponível
        // const contasAPagar = await fetchFaturasAPagar({
        //   dataInicio: new Date(),
        //   dataFim: addDays(new Date(), dias),
        //   status: ['pendente', 'validada']
        // });

        // const contasAReceber = await fetchFaturasAReceber({
        //   dataInicio: new Date(),
        //   dataFim: addDays(new Date(), dias),
        //   status: ['pendente', 'validada']
        // });

        // const historico = await fetchHistoricoMovimentacoes({
        //   dataInicio: subMonths(new Date(), 6),
        //   dataFim: new Date()
        // });

        // Por enquanto, usar dados mockados para desenvolvimento
        const dados = calculateProjection(dias);
        setProjection(dados);
      } catch (error) {
        console.error('Erro ao calcular projeção:', error);
        // Em caso de erro, usar dados mockados
        const dados = calculateProjection(dias);
        setProjection(dados);
      } finally {
        setLoading(false);
      }
    };

    fetchAndCalculateProjection();
  }, [dias]);

  const alertas: CashFlowAlert[] = projection
    .filter(p => p.saldoFinalPrevisto < 0)
    .map(p => ({
      id: `alert-${p.data.toISOString()}`,
      data: p.data,
      valor: p.saldoFinalPrevisto,
      tipo: 'saldo-negativo' as const,
      mensagem: `Saldo negativo previsto: R$ ${Math.abs(p.saldoFinalPrevisto).toLocaleString('pt-BR')}`
    }));

  const saldoMinimoProjetado = projection.length > 0
    ? Math.min(...projection.map(p => p.saldoFinalPrevisto))
    : 0;

  const saldoMaximoProjetado = projection.length > 0
    ? Math.max(...projection.map(p => p.saldoFinalPrevisto))
    : 0;

  return {
    dados: projection,
    alertas,
    saldoMinimoProjetado,
    saldoMaximoProjetado,
    loading
  };
};

// Função auxiliar para calcular a projeção (dados mockados)
function calculateProjection(dias: number): CashFlowProjection[] {
  const resultado: CashFlowProjection[] = [];
  const hoje = startOfDay(new Date());
  let saldoAtual = 45280.30; // Saldo inicial (mesmo do page.tsx)

  // Dados históricos (últimos 7 dias)
  const historicoEntradas = [5800, 3200, 1250, 8950, 4500, 2100, 0];
  const historicoSaidas = [2300, 8500, 450, 1200, 3100, 500, 0];

  // Calcular médias históricas
  const mediaEntradas = historicoEntradas.reduce((a, b) => a + b, 0) / historicoEntradas.length;
  const mediaSaidas = historicoSaidas.reduce((a, b) => a + b, 0) / historicoSaidas.length;

  // Gerar projeção para os próximos dias
  for (let i = 0; i < dias; i++) {
    const data = addDays(hoje, i);
    const diaIndex = i % 7;

    // Para os primeiros 7 dias, usar dados históricos se disponíveis
    let entradas: number;
    let saidas: number;
    let origem: 'realizado' | 'projetado' | 'misto';

    if (i < 7) {
      // Dados históricos (realizados)
      entradas = historicoEntradas[diaIndex];
      saidas = historicoSaidas[diaIndex];
      origem = 'realizado';
    } else {
      // Projeção futura com variação aleatória
      const variacaoEntradas = (Math.random() - 0.5) * 0.4; // ±20%
      const variacaoSaidas = (Math.random() - 0.5) * 0.4;

      entradas = Math.max(0, mediaEntradas * (1 + variacaoEntradas));
      saidas = Math.max(0, mediaSaidas * (1 + variacaoSaidas));
      origem = 'projetado';
    }

    // Ajustar para fim de semana (menos movimentações)
    const diaSemana = data.getDay();
    if (diaSemana === 0 || diaSemana === 6) {
      entradas *= 0.3;
      saidas *= 0.2;
    }

    const saldoFinal = saldoAtual + entradas - saidas;

    // Calcular confiança (diminui com o tempo)
    const confianca = Math.max(40, 95 - (i * 1.5));

    // Calcular limites de confiança
    const margemErro = (entradas + saidas) * (1 - confianca / 100);

    resultado.push({
      data,
      saldoInicial: saldoAtual,
      entradasPrevistas: entradas,
      entradasRealizadas: origem === 'realizado' ? entradas : undefined,
      saidasPrevistas: saidas,
      saidasRealizadas: origem === 'realizado' ? saidas : undefined,
      saldoFinalPrevisto: saldoFinal,
      saldoFinalRealizado: origem === 'realizado' ? saldoFinal : undefined,
      confianca,
      origem,
      limiteInferior: saldoFinal - margemErro,
      limiteSuperior: saldoFinal + margemErro
    });

    saldoAtual = saldoFinal;
  }

  return resultado;
}
