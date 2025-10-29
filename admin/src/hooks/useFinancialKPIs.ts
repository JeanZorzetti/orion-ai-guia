import { useState, useEffect } from 'react';
import { addMonths } from 'date-fns';
import type { FinancialKPIs } from '@/types/cash-flow';

interface UseFinancialKPIsReturn {
  kpis: FinancialKPIs | null;
  loading: boolean;
}

export const useFinancialKPIs = (): UseFinancialKPIsReturn => {
  const [kpis, setKpis] = useState<FinancialKPIs | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const calculateKPIs = () => {
      setLoading(true);
      try {
        // TODO: Integrar com API real quando disponível
        // Por enquanto, calcular com dados mockados

        const saldoAtual = 45280.30;
        const ativoCirculante = 150000;
        const passivoCirculante = 85000;
        const ativoTotal = 300000;
        const receitaMensal = 78500;
        const custosProdutos = 32000;
        const despesasOperacionais = 28500;
        const despesasFinanceiras = 2500;
        const receitasFinanceiras = 1200;

        // Calcular valores
        const receitaLiquida = receitaMensal * 0.91; // Descontando impostos (9%)
        const lucroBruto = receitaLiquida - custosProdutos;
        const ebitda = lucroBruto - despesasOperacionais;
        const lucroLiquido = ebitda - despesasFinanceiras + receitasFinanceiras;

        const contasAReceber = 95000;
        const contasAPagar = 62000;
        const valorVendasMes = receitaMensal;
        const valorComprasMes = custosProdutos + despesasOperacionais;

        // Liquidez
        const liquidezImediata = saldoAtual / passivoCirculante;
        const liquidezCorrente = ativoCirculante / passivoCirculante;

        // Ciclo Financeiro
        const pmr = (contasAReceber / valorVendasMes) * 30; // dias
        const pmp = (contasAPagar / valorComprasMes) * 30; // dias
        const cicloFinanceiro = pmr - pmp;

        // Rentabilidade
        const margemLiquida = (lucroLiquido / receitaLiquida) * 100;
        const margemEbitda = (ebitda / receitaLiquida) * 100;

        // Endividamento
        const divida = 85000;
        const endividamentoTotal = passivoCirculante / ativoTotal;
        const coberturaDivida = ebitda / divida;

        // Eficiência
        const giroAtivo = receitaMensal / ativoTotal;
        const returnOnAssets = (lucroLiquido / ativoTotal) * 100;
        const patrimonioLiquido = ativoTotal - passivoCirculante;
        const returnOnEquity = (lucroLiquido / patrimonioLiquido) * 100;

        // Fluxo de Caixa
        const despesasMensais = despesasOperacionais + despesasFinanceiras;
        const burnRate = despesasMensais - receitasFinanceiras;
        const runway = saldoAtual / burnRate;
        const breakEven = addMonths(new Date(), Math.ceil(runway));

        const calculatedKPIs: FinancialKPIs = {
          liquidezImediata,
          liquidezCorrente,
          pmp,
          pmr,
          cicloFinanceiro,
          margemLiquida,
          margemEbitda,
          endividamentoTotal,
          coberturaDivida,
          giroAtivo,
          returnOnAssets,
          returnOnEquity,
          burnRate,
          runway,
          breakEven
        };

        setKpis(calculatedKPIs);
      } catch (error) {
        console.error('Erro ao calcular KPIs:', error);
      } finally {
        setLoading(false);
      }
    };

    calculateKPIs();
  }, []);

  return {
    kpis,
    loading
  };
};
