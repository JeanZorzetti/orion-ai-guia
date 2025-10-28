import { FinancialAlertData, AlertSeverity, AlertCategory } from '@/components/financeiro/FinancialAlert';

// Interfaces para dados financeiros
export interface PaymentData {
  id: string;
  description: string;
  amount: number;
  dueDate: Date;
  status: 'pending' | 'paid' | 'overdue';
  category: string;
}

export interface CashFlowData {
  currentBalance: number;
  projectedBalance: number;
  monthlyRevenue: number;
  monthlyExpenses: number;
}

export interface BudgetData {
  category: string;
  limit: number;
  spent: number;
  percentage: number;
}

// Configurações de thresholds para alertas
const ALERT_THRESHOLDS = {
  // Fluxo de caixa
  CRITICAL_BALANCE: 5000, // Saldo abaixo deste valor é crítico
  WARNING_BALANCE: 10000, // Saldo abaixo deste valor é aviso
  NEGATIVE_PROJECTION_DAYS: 7, // Dias para projeção negativa ser crítica

  // Pagamentos
  OVERDUE_CRITICAL_DAYS: 7, // Dias de atraso para ser crítico
  DUE_TODAY: 0, // Vencendo hoje
  DUE_SOON_DAYS: 3, // Vencendo em X dias

  // Orçamento
  BUDGET_CRITICAL_PERCENT: 95, // % do orçamento para alerta crítico
  BUDGET_WARNING_PERCENT: 80, // % do orçamento para alerta de aviso
  BUDGET_EXCEEDED_PERCENT: 100, // Orçamento excedido

  // Recebimentos
  LATE_RECEIPT_DAYS: 15, // Dias de atraso em recebimento
};

/**
 * Gera alertas baseados no fluxo de caixa atual
 */
export const generateCashFlowAlerts = (
  cashFlow: CashFlowData
): FinancialAlertData[] => {
  const alerts: FinancialAlertData[] = [];

  // Alerta: Saldo crítico
  if (cashFlow.currentBalance < ALERT_THRESHOLDS.CRITICAL_BALANCE) {
    alerts.push({
      id: `cashflow-critical-${Date.now()}`,
      severity: 'critical',
      category: 'cashflow',
      title: 'Saldo em Caixa Crítico',
      message: `Seu saldo atual está muito baixo e pode comprometer operações essenciais.`,
      value: cashFlow.currentBalance,
      actionLabel: 'Ver Fluxo de Caixa',
      actionUrl: '/admin/financeiro/fluxo-caixa',
      dismissable: false,
    });
  } else if (cashFlow.currentBalance < ALERT_THRESHOLDS.WARNING_BALANCE) {
    // Alerta: Saldo baixo
    alerts.push({
      id: `cashflow-warning-${Date.now()}`,
      severity: 'warning',
      category: 'cashflow',
      title: 'Saldo em Caixa Baixo',
      message: 'Atenção: seu saldo está abaixo do recomendado. Considere reduzir despesas.',
      value: cashFlow.currentBalance,
      actionLabel: 'Ver Fluxo de Caixa',
      actionUrl: '/admin/financeiro/fluxo-caixa',
      dismissable: true,
    });
  }

  // Alerta: Projeção negativa
  if (cashFlow.projectedBalance < 0) {
    alerts.push({
      id: `cashflow-projection-${Date.now()}`,
      severity: 'critical',
      category: 'cashflow',
      title: 'Projeção de Saldo Negativo',
      message: `Baseado no fluxo atual, você terá saldo negativo nos próximos ${ALERT_THRESHOLDS.NEGATIVE_PROJECTION_DAYS} dias.`,
      value: cashFlow.projectedBalance,
      actionLabel: 'Ver Projeção',
      actionUrl: '/admin/financeiro/fluxo-caixa',
      dismissable: false,
    });
  }

  // Alerta: Despesas maiores que receitas
  if (cashFlow.monthlyExpenses > cashFlow.monthlyRevenue) {
    const deficit = cashFlow.monthlyExpenses - cashFlow.monthlyRevenue;
    alerts.push({
      id: `cashflow-deficit-${Date.now()}`,
      severity: 'warning',
      category: 'cashflow',
      title: 'Despesas Superiores às Receitas',
      message: 'Suas despesas mensais estão maiores que suas receitas. Revise seus gastos.',
      value: deficit,
      actionLabel: 'Ver Detalhes',
      actionUrl: '/admin/financeiro',
      dismissable: true,
    });
  }

  return alerts;
};

/**
 * Gera alertas baseados em pagamentos pendentes e vencidos
 */
export const generatePaymentAlerts = (
  payments: PaymentData[]
): FinancialAlertData[] => {
  const alerts: FinancialAlertData[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Agrupar pagamentos por status
  const overduePayments = payments.filter((p) => p.status === 'overdue');
  const dueTodayPayments = payments.filter((p) => {
    const dueDate = new Date(p.dueDate);
    dueDate.setHours(0, 0, 0, 0);
    return dueDate.getTime() === today.getTime() && p.status === 'pending';
  });
  const dueSoonPayments = payments.filter((p) => {
    const dueDate = new Date(p.dueDate);
    const diffDays = Math.ceil(
      (dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );
    return diffDays > 0 && diffDays <= ALERT_THRESHOLDS.DUE_SOON_DAYS && p.status === 'pending';
  });

  // Alerta: Pagamentos vencidos
  if (overduePayments.length > 0) {
    const totalOverdue = overduePayments.reduce((sum, p) => sum + p.amount, 0);
    const oldestOverdue = overduePayments.reduce((oldest, p) => {
      const daysOverdue = Math.ceil(
        (today.getTime() - new Date(p.dueDate).getTime()) / (1000 * 60 * 60 * 24)
      );
      return daysOverdue > oldest ? daysOverdue : oldest;
    }, 0);

    alerts.push({
      id: `payment-overdue-${Date.now()}`,
      severity: oldestOverdue >= ALERT_THRESHOLDS.OVERDUE_CRITICAL_DAYS ? 'critical' : 'warning',
      category: 'payment',
      title: `${overduePayments.length} Pagamento${overduePayments.length > 1 ? 's' : ''} Vencido${overduePayments.length > 1 ? 's' : ''}`,
      message: `Você tem contas vencidas há ${oldestOverdue} dias. Regularize para evitar juros e multas.`,
      value: totalOverdue,
      actionLabel: 'Ver Contas a Pagar',
      actionUrl: '/admin/financeiro/contas-a-pagar',
      dismissable: false,
    });
  }

  // Alerta: Pagamentos vencendo hoje
  if (dueTodayPayments.length > 0) {
    const totalDueToday = dueTodayPayments.reduce((sum, p) => sum + p.amount, 0);
    alerts.push({
      id: `payment-today-${Date.now()}`,
      severity: 'warning',
      category: 'payment',
      title: `${dueTodayPayments.length} Pagamento${dueTodayPayments.length > 1 ? 's' : ''} Vencendo Hoje`,
      message: 'Atenção! Você tem contas com vencimento hoje.',
      value: totalDueToday,
      date: today,
      actionLabel: 'Ver Contas',
      actionUrl: '/admin/financeiro/contas-a-pagar',
      dismissable: true,
    });
  }

  // Alerta: Pagamentos vencendo em breve
  if (dueSoonPayments.length > 0) {
    const totalDueSoon = dueSoonPayments.reduce((sum, p) => sum + p.amount, 0);
    alerts.push({
      id: `payment-soon-${Date.now()}`,
      severity: 'info',
      category: 'payment',
      title: `${dueSoonPayments.length} Pagamento${dueSoonPayments.length > 1 ? 's' : ''} Vencendo em ${ALERT_THRESHOLDS.DUE_SOON_DAYS} Dias`,
      message: 'Você tem contas próximas do vencimento. Prepare-se!',
      value: totalDueSoon,
      actionLabel: 'Ver Contas',
      actionUrl: '/admin/financeiro/contas-a-pagar',
      dismissable: true,
    });
  }

  return alerts;
};

/**
 * Gera alertas baseados no orçamento
 */
export const generateBudgetAlerts = (
  budgets: BudgetData[]
): FinancialAlertData[] => {
  const alerts: FinancialAlertData[] = [];

  budgets.forEach((budget) => {
    // Orçamento excedido
    if (budget.percentage >= ALERT_THRESHOLDS.BUDGET_EXCEEDED_PERCENT) {
      alerts.push({
        id: `budget-exceeded-${budget.category}-${Date.now()}`,
        severity: 'critical',
        category: 'budget',
        title: `Orçamento Excedido: ${budget.category}`,
        message: `Você ultrapassou o limite de orçamento em ${(budget.percentage - 100).toFixed(1)}%.`,
        value: budget.spent - budget.limit,
        actionLabel: 'Revisar Orçamento',
        actionUrl: '/admin/financeiro',
        dismissable: false,
      });
    }
    // Orçamento crítico
    else if (budget.percentage >= ALERT_THRESHOLDS.BUDGET_CRITICAL_PERCENT) {
      alerts.push({
        id: `budget-critical-${budget.category}-${Date.now()}`,
        severity: 'warning',
        category: 'budget',
        title: `Orçamento Crítico: ${budget.category}`,
        message: `Você já utilizou ${budget.percentage.toFixed(1)}% do orçamento desta categoria.`,
        value: budget.spent,
        actionLabel: 'Ver Detalhes',
        actionUrl: '/admin/financeiro',
        dismissable: true,
      });
    }
    // Orçamento em aviso
    else if (budget.percentage >= ALERT_THRESHOLDS.BUDGET_WARNING_PERCENT) {
      alerts.push({
        id: `budget-warning-${budget.category}-${Date.now()}`,
        severity: 'info',
        category: 'budget',
        title: `Atenção ao Orçamento: ${budget.category}`,
        message: `Você já utilizou ${budget.percentage.toFixed(1)}% do orçamento desta categoria.`,
        value: budget.spent,
        actionLabel: 'Ver Detalhes',
        actionUrl: '/admin/financeiro',
        dismissable: true,
      });
    }
  });

  return alerts;
};

/**
 * Gera alertas baseados em recebimentos
 */
export const generateReceiptAlerts = (
  receipts: PaymentData[]
): FinancialAlertData[] => {
  const alerts: FinancialAlertData[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Recebimentos atrasados
  const lateReceipts = receipts.filter((r) => {
    if (r.status !== 'pending') return false;
    const dueDate = new Date(r.dueDate);
    const diffDays = Math.ceil(
      (today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    return diffDays >= ALERT_THRESHOLDS.LATE_RECEIPT_DAYS;
  });

  if (lateReceipts.length > 0) {
    const totalLate = lateReceipts.reduce((sum, r) => sum + r.amount, 0);
    alerts.push({
      id: `receipt-late-${Date.now()}`,
      severity: 'warning',
      category: 'receipt',
      title: `${lateReceipts.length} Recebimento${lateReceipts.length > 1 ? 's' : ''} Atrasado${lateReceipts.length > 1 ? 's' : ''}`,
      message: `Você tem valores a receber com mais de ${ALERT_THRESHOLDS.LATE_RECEIPT_DAYS} dias de atraso.`,
      value: totalLate,
      actionLabel: 'Ver Contas a Receber',
      actionUrl: '/admin/financeiro/contas-a-receber',
      dismissable: true,
    });
  }

  return alerts;
};

/**
 * Função principal que agrega todos os alertas
 */
export const generateAllFinancialAlerts = (data: {
  cashFlow?: CashFlowData;
  payments?: PaymentData[];
  receipts?: PaymentData[];
  budgets?: BudgetData[];
}): FinancialAlertData[] => {
  const allAlerts: FinancialAlertData[] = [];

  if (data.cashFlow) {
    allAlerts.push(...generateCashFlowAlerts(data.cashFlow));
  }

  if (data.payments) {
    allAlerts.push(...generatePaymentAlerts(data.payments));
  }

  if (data.receipts) {
    allAlerts.push(...generateReceiptAlerts(data.receipts));
  }

  if (data.budgets) {
    allAlerts.push(...generateBudgetAlerts(data.budgets));
  }

  // Ordenar por severidade (crítico primeiro)
  const severityOrder: Record<AlertSeverity, number> = {
    critical: 0,
    warning: 1,
    info: 2,
    success: 3,
  };

  return allAlerts.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);
};
