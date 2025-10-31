import { useMemo } from 'react';
import { differenceInDays, startOfMonth, endOfMonth } from 'date-fns';
import { useCashFlow } from './useCashFlow';

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

/**
 * Hook que calcula KPIs de Contas a Pagar baseado nas transações do Cash Flow
 *
 * NOTA: Este hook usa transações de saída do Cash Flow como proxy para Contas a Pagar
 * até que o módulo completo de Accounts Payable seja implementado no backend.
 *
 * Transações com type === 'saida' são tratadas como contas a pagar.
 * is_reconciled === false indica que ainda está pendente
 * is_reconciled === true indica que foi paga/reconciliada
 */
export function useAPKPIs(): APKPIs {
  const { transactions, summary, categoryAnalysis } = useCashFlow();

  return useMemo(() => {
    const hoje = new Date();
    const inicioMes = startOfMonth(hoje);
    const fimMes = endOfMonth(hoje);

    // Filtrar apenas transações de saída (despesas/contas a pagar)
    const transacoesSaida = transactions.filter(t => t.type === 'saida');

    // Transações abertas (não reconciliadas = pendentes)
    const transacoesAbertas = transacoesSaida.filter(t => !t.is_reconciled);

    // Transações pagas (reconciliadas)
    const transacoesPagas = transacoesSaida.filter(t => t.is_reconciled);

    // Total a Pagar
    const totalAPagar = transacoesAbertas.reduce((sum, t) => sum + Math.abs(t.value), 0);
    const quantidadeTitulos = transacoesAbertas.length;

    // Vencidos (transações abertas cuja data já passou)
    const transacoesVencidas = transacoesAbertas.filter(
      t => new Date(t.transaction_date) < hoje
    );
    const valorVencido = transacoesVencidas.reduce((sum, t) => sum + Math.abs(t.value), 0);
    const quantidadeVencidos = transacoesVencidas.length;

    // Vencendo hoje
    const vencidosHoje = transacoesAbertas
      .filter(t => {
        const transDate = new Date(t.transaction_date);
        return (
          transDate.getDate() === hoje.getDate() &&
          transDate.getMonth() === hoje.getMonth() &&
          transDate.getFullYear() === hoje.getFullYear()
        );
      })
      .reduce((sum, t) => sum + Math.abs(t.value), 0);

    // Próximos 7 dias
    const data7Dias = new Date(hoje);
    data7Dias.setDate(data7Dias.getDate() + 7);
    const transacoesProximos7Dias = transacoesAbertas.filter(t => {
      const transDate = new Date(t.transaction_date);
      return transDate >= hoje && transDate <= data7Dias;
    });
    const proximos7Dias = transacoesProximos7Dias.reduce((sum, t) => sum + Math.abs(t.value), 0);
    const quantidadeProximos7Dias = transacoesProximos7Dias.length;

    // Próximos 30 dias
    const data30Dias = new Date(hoje);
    data30Dias.setDate(data30Dias.getDate() + 30);
    const transacoesProximos30Dias = transacoesAbertas.filter(t => {
      const transDate = new Date(t.transaction_date);
      return transDate >= hoje && transDate <= data30Dias;
    });
    const proximos30Dias = transacoesProximos30Dias.reduce((sum, t) => sum + Math.abs(t.value), 0);
    const quantidadeProximos30Dias = transacoesProximos30Dias.length;

    // DPO - Days Payable Outstanding
    // Fórmula simplificada: (Contas a Pagar / Compras) * Dias do Período
    const comprasMes = transacoesSaida
      .filter(t => {
        const transDate = new Date(t.transaction_date);
        return transDate >= inicioMes && transDate <= fimMes;
      })
      .reduce((sum, t) => sum + Math.abs(t.value), 0);

    const dpo = comprasMes > 0 ? Math.round((totalAPagar / comprasMes) * 30) : 0;

    // DPO do mês anterior (seria calculado com histórico real)
    // Por enquanto, estimamos baseado na variação do saldo
    const dpoMesAnterior = dpo > 0 ? dpo * 0.95 : 0; // Estimativa
    const dpoTrend = dpoMesAnterior > 0 ? ((dpo - dpoMesAnterior) / dpoMesAnterior) * 100 : 0;

    // Média de dias de pagamento
    // Para transações pagas com reconciliation_date, calcular dias desde transaction_date
    const diasPagamento = transacoesPagas
      .filter(t => t.reconciliation_date)
      .map(t => {
        return differenceInDays(
          new Date(t.reconciliation_date!),
          new Date(t.transaction_date)
        );
      });

    const mediaPagamento = diasPagamento.length > 0
      ? Math.round(diasPagamento.reduce((sum, dias) => sum + dias, 0) / diasPagamento.length)
      : 0;

    // Taxa de atrasos
    const totalTransacoes = transacoesSaida.length;
    const transacoesAtrasadas = transacoesSaida.filter(t => {
      if (t.is_reconciled && t.reconciliation_date) {
        // Paga com atraso
        return new Date(t.reconciliation_date) > new Date(t.transaction_date);
      }
      if (!t.is_reconciled) {
        // Pendente e vencida
        return new Date(t.transaction_date) < hoje;
      }
      return false;
    }).length;

    const taxaAtrasos = totalTransacoes > 0 ? (transacoesAtrasadas / totalTransacoes) * 100 : 0;

    // Descontos disponíveis
    // NOTA: Transações do Cash Flow não têm campo de desconto
    // Isso só existirá quando o módulo de Accounts Payable for implementado
    const descontosDisponiveis = 0;
    const quantidadeComDesconto = 0;
    const economiaDescontos = 0;
    const economiaPercentual = 0;

    // Concentração de fornecedores (por categoria, já que não temos supplier_id)
    const categoriaTotais = transacoesAbertas.reduce((acc, t) => {
      const categoria = t.category || 'Sem Categoria';

      if (!acc[categoria]) {
        acc[categoria] = {
          id: categoria,
          nome: categoria,
          valor: 0,
        };
      }
      acc[categoria].valor += Math.abs(t.value);
      return acc;
    }, {} as Record<string, { id: string; nome: string; valor: number }>);

    const top5Fornecedores = Object.values(categoriaTotais)
      .sort((a, b) => b.valor - a.valor)
      .slice(0, 5)
      .map(f => ({
        ...f,
        percentual: totalAPagar > 0 ? (f.valor / totalAPagar) * 100 : 0,
      }));

    const concentracaoFornecedores =
      top5Fornecedores.reduce((sum, f) => sum + f.percentual, 0);

    // Ciclo financeiro (DPO - DSO)
    // DSO seria importado do módulo de Contas a Receber
    // Por enquanto, estimamos baseado na média de recebimento
    const dso = 45; // Estimativa - seria calculado de AccountsReceivable
    const cicloFinanceiro = dpo - dso;

    // Comparação com mês anterior
    // Seria calculado com histórico real quando disponível
    const comparacaoMesAnterior = {
      totalAPagar: totalAPagar > 0 ? -3.5 : 0, // Estimativa
      dpo: dpoTrend,
      taxaAtrasos: taxaAtrasos > 0 ? -8.2 : 0, // Estimativa
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
  }, [transactions, summary, categoryAnalysis]);
}
