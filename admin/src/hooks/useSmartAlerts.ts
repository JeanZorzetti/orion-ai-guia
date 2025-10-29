import { useState, useEffect } from 'react';
import { addDays, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { Alert } from '@/types/cash-flow';
import { useCashFlowProjection } from './useCashFlowProjection';
import { useBankAccounts } from './useBankAccounts';

interface UseSmartAlertsReturn {
  alerts: Alert[];
  loading: boolean;
  markAsRead: (alertId: string) => void;
  unreadCount: number;
}

export const useSmartAlerts = (): UseSmartAlertsReturn => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  const { dados: projection } = useCashFlowProjection(30);
  const { accounts, getTotalBalance } = useBankAccounts();

  useEffect(() => {
    generateAlerts();
  }, [projection, accounts]);

  const generateAlerts = () => {
    setLoading(true);
    try {
      const newAlerts: Alert[] = [];
      const today = new Date();

      // 1. Alerta de Saldo Baixo
      const saldoTotal = getTotalBalance();
      const limiteMinimo = 10000; // R$ 10.000

      if (saldoTotal < limiteMinimo) {
        newAlerts.push({
          id: 'alert-saldo-baixo',
          tipo: 'critico',
          categoria: 'saldo',
          titulo: 'Saldo Total Abaixo do Limite',
          descricao: `Seu saldo total está em R$ ${saldoTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}, abaixo do limite mínimo recomendado de R$ ${limiteMinimo.toLocaleString('pt-BR')}.`,
          data: today,
          lido: false,
          acao: {
            label: 'Ver Contas',
            href: '/admin/financeiro/fluxo-caixa#contas'
          }
        });
      }

      // 2. Alerta de Saldo Negativo Futuro
      const saldosNegativos = projection.filter(p => p.saldoFinalPrevisto < 0);
      if (saldosNegativos.length > 0) {
        const primeiraNegativa = saldosNegativos[0];
        newAlerts.push({
          id: 'alert-saldo-negativo-futuro',
          tipo: 'critico',
          categoria: 'saldo',
          titulo: 'Saldo Negativo Previsto',
          descricao: `Previsão de saldo negativo em ${format(primeiraNegativa.data, 'dd/MM/yyyy', { locale: ptBR })}. Déficit estimado: R$ ${Math.abs(primeiraNegativa.saldoFinalPrevisto).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}.`,
          data: today,
          lido: false,
          acao: {
            label: 'Ver Projeção',
            href: '/admin/financeiro/fluxo-caixa#projecao'
          }
        });
      }

      // 3. Alerta de Vencimentos Próximos (mockado)
      const vencimentos = 5; // número de faturas vencendo
      const valorVencimentos = 15000;
      const diasVencimento = 3;

      if (vencimentos > 0 && diasVencimento <= 5) {
        newAlerts.push({
          id: 'alert-vencimentos-proximos',
          tipo: 'atencao',
          categoria: 'vencimento',
          titulo: 'Vencimentos Próximos',
          descricao: `${vencimentos} fatura(s) no valor de R$ ${valorVencimentos.toLocaleString('pt-BR')} vencendo em ${diasVencimento} dias.`,
          data: today,
          lido: false,
          acao: {
            label: 'Ver Faturas',
            href: '/admin/financeiro/contas-a-pagar'
          }
        });
      }

      // 4. Alerta de Concentração de Conta
      const contaMaiorSaldo = accounts
        .filter(a => a.ativa)
        .sort((a, b) => b.saldo - a.saldo)[0];

      if (contaMaiorSaldo && saldoTotal > 0) {
        const percentual = (contaMaiorSaldo.saldo / saldoTotal) * 100;
        if (percentual > 80) {
          newAlerts.push({
            id: 'alert-concentracao-conta',
            tipo: 'atencao',
            categoria: 'saldo',
            titulo: 'Alta Concentração em Uma Conta',
            descricao: `${percentual.toFixed(0)}% do seu saldo está em ${contaMaiorSaldo.nome}. Considere diversificar para reduzir riscos.`,
            data: today,
            lido: false,
            acao: {
              label: 'Transferir Valores',
              href: '/admin/financeiro/fluxo-caixa#transferencias'
            }
          });
        }
      }

      // 5. Alerta de Oportunidade de Investimento
      const contaCorrente = accounts.find(a => a.tipo === 'corrente' && a.ativa);
      if (contaCorrente && contaCorrente.saldo > 30000) {
        newAlerts.push({
          id: 'alert-oportunidade-investimento',
          tipo: 'informativo',
          categoria: 'oportunidade',
          titulo: 'Oportunidade de Investimento',
          descricao: `Você tem R$ ${contaCorrente.saldo.toLocaleString('pt-BR')} em conta corrente. Considere investir parte desse valor para obter rendimento.`,
          data: today,
          lido: false,
          acao: {
            label: 'Simular Aplicação',
            href: '/admin/financeiro/fluxo-caixa#simulador'
          }
        });
      }

      // 6. Alerta de Anomalia de Gastos (mockado)
      const gastoMedioMensal = 63000;
      const gastoAtual = 78000;
      const variacaoPercentual = ((gastoAtual - gastoMedioMensal) / gastoMedioMensal) * 100;

      if (variacaoPercentual > 20) {
        newAlerts.push({
          id: 'alert-anomalia-gastos',
          tipo: 'atencao',
          categoria: 'anomalia',
          titulo: 'Gastos Acima da Média',
          descricao: `Seus gastos este mês estão ${variacaoPercentual.toFixed(0)}% acima da média. Valor atual: R$ ${gastoAtual.toLocaleString('pt-BR')}.`,
          data: today,
          lido: false,
          acao: {
            label: 'Analisar Despesas',
            href: '/admin/financeiro'
          }
        });
      }

      // Ordenar por prioridade (crítico > atenção > informativo)
      const prioridadeOrdem = { critico: 0, atencao: 1, informativo: 2 };
      newAlerts.sort((a, b) => prioridadeOrdem[a.tipo] - prioridadeOrdem[b.tipo]);

      setAlerts(newAlerts);
    } catch (error) {
      console.error('Erro ao gerar alertas:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = (alertId: string) => {
    setAlerts(alerts.map(alert =>
      alert.id === alertId ? { ...alert, lido: true } : alert
    ));
    // TODO: Salvar estado na API
  };

  const unreadCount = alerts.filter(a => !a.lido).length;

  return {
    alerts,
    loading,
    markAsRead,
    unreadCount
  };
};
