/**
 * Sistema de AI para análise financeira e geração de insights
 * Fase 7: AI e Insights Financeiros
 */

export type InsightType =
  | 'opportunity' // Oportunidade de melhoria
  | 'warning' // Aviso sobre problema
  | 'prediction' // Previsão futura
  | 'recommendation' // Recomendação de ação
  | 'pattern'; // Padrão identificado

export type InsightPriority = 'high' | 'medium' | 'low';

export interface FinancialInsight {
  id: string;
  type: InsightType;
  priority: InsightPriority;
  title: string;
  description: string;
  impact: {
    value?: number; // Impacto financeiro estimado
    percentage?: number; // Impacto em %
    description: string;
  };
  recommendations: string[];
  confidence: number; // 0-100 (confiança da IA)
  category: 'revenue' | 'expense' | 'cashflow' | 'efficiency' | 'risk';
  metadata?: Record<string, unknown>;
}

interface FinancialDataForAI {
  currentBalance: number;
  monthlyRevenue: number;
  monthlyExpenses: number;
  revenue30Days: number;
  revenue60Days: number;
  revenue90Days: number;
  expenses30Days: number;
  expenses60Days: number;
  expenses90Days: number;
  overduePayments: number;
  overdueReceipts: number;
  categoryExpenses: Array<{
    category: string;
    value: number;
    percentage: number;
    trend: number; // % vs mês anterior
  }>;
}

/**
 * Analisa tendências de receita
 */
function analyzeRevenueTrends(data: FinancialDataForAI): FinancialInsight[] {
  const insights: FinancialInsight[] = [];

  // Calcular growth rate
  const growth30to60 = ((data.revenue30Days - data.revenue60Days) / data.revenue60Days) * 100;
  const growth60to90 = ((data.revenue60Days - data.revenue90Days) / data.revenue90Days) * 100;
  const averageGrowth = (growth30to60 + growth60to90) / 2;

  // Insight: Crescimento acelerado
  if (averageGrowth > 15) {
    insights.push({
      id: `revenue-growth-${Date.now()}`,
      type: 'opportunity',
      priority: 'high',
      title: 'Crescimento de Receita Acelerado Detectado',
      description: `Suas receitas cresceram ${averageGrowth.toFixed(1)}% nos últimos meses. Este é um ótimo momento para investir em expansão.`,
      impact: {
        percentage: averageGrowth,
        description: `Potencial de ${(data.monthlyRevenue * (averageGrowth / 100) * 3).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} em 3 meses`
      },
      recommendations: [
        'Considere aumentar investimentos em marketing para acelerar ainda mais',
        'Avalie expandir equipe de vendas',
        'Otimize processos para suportar o crescimento',
        'Mantenha reserva de caixa para emergências'
      ],
      confidence: 85,
      category: 'revenue'
    });
  }

  // Insight: Desaceleração de receita
  if (averageGrowth < -5) {
    insights.push({
      id: `revenue-decline-${Date.now()}`,
      type: 'warning',
      priority: 'high',
      title: 'Desaceleração de Receita Detectada',
      description: `Suas receitas diminuíram ${Math.abs(averageGrowth).toFixed(1)}% nos últimos meses. É importante agir rapidamente.`,
      impact: {
        percentage: averageGrowth,
        description: `Perda potencial de ${(data.monthlyRevenue * (Math.abs(averageGrowth) / 100) * 3).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} em 3 meses se não for revertido`
      },
      recommendations: [
        'Revise sua estratégia de marketing e vendas',
        'Faça pesquisa com clientes para identificar problemas',
        'Avalie novos canais de aquisição',
        'Considere promoções para reativar vendas',
        'Analise concorrência e ajuste preços se necessário'
      ],
      confidence: 82,
      category: 'revenue'
    });
  }

  return insights;
}

/**
 * Analisa padrões de despesas
 */
function analyzeExpensePatterns(data: FinancialDataForAI): FinancialInsight[] {
  const insights: FinancialInsight[] = [];

  // Calcular expense growth
  const expenseGrowth30to60 = ((data.expenses30Days - data.expenses60Days) / data.expenses60Days) * 100;

  // Insight: Despesas crescendo mais rápido que receitas
  const revenueGrowth30to60 = ((data.revenue30Days - data.revenue60Days) / data.revenue60Days) * 100;
  if (expenseGrowth30to60 > revenueGrowth30to60 + 5) {
    insights.push({
      id: `expense-outpacing-${Date.now()}`,
      type: 'warning',
      priority: 'high',
      title: 'Despesas Crescendo Mais Rápido que Receitas',
      description: `Suas despesas cresceram ${expenseGrowth30to60.toFixed(1)}% enquanto receitas cresceram apenas ${revenueGrowth30to60.toFixed(1)}%. Isso pode comprometer a lucratividade.`,
      impact: {
        percentage: expenseGrowth30to60 - revenueGrowth30to60,
        description: `Margem reduzida em ${(expenseGrowth30to60 - revenueGrowth30to60).toFixed(1)} pontos percentuais`
      },
      recommendations: [
        'Revise todos os contratos e renegocie quando possível',
        'Identifique despesas não essenciais para cortar',
        'Avalie automação de processos para reduzir custos',
        'Estabeleça budget mais rigoroso por categoria'
      ],
      confidence: 88,
      category: 'expense'
    });
  }

  // Analisar categoria com maior crescimento
  const highestGrowthCategory = data.categoryExpenses
    .filter(c => c.trend > 20)
    .sort((a, b) => b.trend - a.trend)[0];

  if (highestGrowthCategory) {
    insights.push({
      id: `category-spike-${Date.now()}`,
      type: 'warning',
      priority: 'medium',
      title: `Pico em Despesas de ${highestGrowthCategory.category}`,
      description: `Gastos com ${highestGrowthCategory.category} aumentaram ${highestGrowthCategory.trend.toFixed(1)}% no último mês.`,
      impact: {
        value: highestGrowthCategory.value,
        description: `${highestGrowthCategory.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} gastos nesta categoria`
      },
      recommendations: [
        `Analise detalhadamente os gastos de ${highestGrowthCategory.category}`,
        'Verifique se há compras duplicadas ou desnecessárias',
        'Compare com fornecedores alternativos',
        'Estabeleça limite de orçamento para esta categoria'
      ],
      confidence: 78,
      category: 'expense'
    });
  }

  return insights;
}

/**
 * Analisa saúde do fluxo de caixa
 */
function analyzeCashFlowHealth(data: FinancialDataForAI): FinancialInsight[] {
  const insights: FinancialInsight[] = [];

  // Calcular burn rate
  const burnRate = data.monthlyExpenses - data.monthlyRevenue;
  const runwayMonths = burnRate > 0 ? data.currentBalance / burnRate : Infinity;

  // Insight: Runway curto
  if (runwayMonths < 6 && runwayMonths > 0) {
    insights.push({
      id: `runway-warning-${Date.now()}`,
      type: 'warning',
      priority: 'high',
      title: 'Runway Financeiro Curto',
      description: `Com o burn rate atual, você tem apenas ${Math.floor(runwayMonths)} meses de runway. É crítico aumentar receitas ou reduzir custos.`,
      impact: {
        value: burnRate,
        description: `Burn rate mensal de ${burnRate.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`
      },
      recommendations: [
        'Busque financiamento ou investimento imediatamente',
        'Corte despesas não essenciais com urgência',
        'Foque em aumentar receitas no curto prazo',
        'Renegocie prazos de pagamento com fornecedores',
        'Considere acelerar cobrança de recebíveis'
      ],
      confidence: 92,
      category: 'risk'
    });
  }

  // Insight: Fluxo de caixa saudável
  if (data.currentBalance > data.monthlyExpenses * 6 && burnRate < 0) {
    insights.push({
      id: `healthy-cashflow-${Date.now()}`,
      type: 'opportunity',
      priority: 'medium',
      title: 'Fluxo de Caixa Saudável',
      description: 'Você tem uma reserva de caixa confortável e fluxo positivo. Este é um bom momento para investir em crescimento.',
      impact: {
        value: data.currentBalance,
        description: `Saldo de ${data.currentBalance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} equivalente a ${Math.floor(data.currentBalance / data.monthlyExpenses)} meses de despesas`
      },
      recommendations: [
        'Considere investir em marketing para acelerar crescimento',
        'Avalie contratar talentos-chave',
        'Invista em tecnologia e infraestrutura',
        'Diversifique investimentos do excesso de caixa'
      ],
      confidence: 88,
      category: 'cashflow'
    });
  }

  return insights;
}

/**
 * Identifica oportunidades de otimização
 */
function identifyOptimizationOpportunities(data: FinancialDataForAI): FinancialInsight[] {
  const insights: FinancialInsight[] = [];

  // Insight: Alto volume de recebíveis vencidos
  const overdueReceiptsPercentage = (data.overdueReceipts / data.monthlyRevenue) * 100;
  if (overdueReceiptsPercentage > 15) {
    insights.push({
      id: `optimize-collections-${Date.now()}`,
      type: 'opportunity',
      priority: 'high',
      title: 'Otimize seu Processo de Cobrança',
      description: `Você tem ${overdueReceiptsPercentage.toFixed(1)}% da receita mensal em recebíveis vencidos. Melhorar a cobrança pode liberar muito caixa.`,
      impact: {
        value: data.overdueReceipts,
        description: `Potencial de recuperar ${data.overdueReceipts.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`
      },
      recommendations: [
        'Implemente processo de cobrança automática',
        'Entre em contato proativo com devedores',
        'Ofereça facilidades de pagamento',
        'Considere descontos para pagamento antecipado',
        'Avalie política de crédito para novos clientes'
      ],
      confidence: 85,
      category: 'efficiency'
    });
  }

  // Insight: Oportunidade de renegociação
  const topExpenseCategory = data.categoryExpenses
    .sort((a, b) => b.percentage - a.percentage)[0];

  if (topExpenseCategory && topExpenseCategory.percentage > 30) {
    insights.push({
      id: `renegotiate-top-expense-${Date.now()}`,
      type: 'recommendation',
      priority: 'medium',
      title: `Renegocie Contratos de ${topExpenseCategory.category}`,
      description: `${topExpenseCategory.category} representa ${topExpenseCategory.percentage.toFixed(1)}% das suas despesas. Uma redução de 10% teria grande impacto.`,
      impact: {
        value: topExpenseCategory.value * 0.1,
        description: `Economia potencial de ${(topExpenseCategory.value * 0.1).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} por mês`
      },
      recommendations: [
        'Compare com fornecedores concorrentes',
        'Negocie descontos por volume',
        'Considere contratos de longo prazo com desconto',
        'Avalie alternativas mais econômicas'
      ],
      confidence: 75,
      category: 'efficiency'
    });
  }

  return insights;
}

/**
 * Gera previsões baseadas em tendências
 */
function generatePredictions(data: FinancialDataForAI): FinancialInsight[] {
  const insights: FinancialInsight[] = [];

  // Previsão de receita próximo trimestre
  const revenueGrowth = ((data.revenue30Days - data.revenue90Days) / data.revenue90Days) / 3; // Growth mensal médio
  const predicted3MonthRevenue = data.monthlyRevenue * (1 + revenueGrowth) * 3;

  insights.push({
    id: `revenue-prediction-${Date.now()}`,
    type: 'prediction',
    priority: 'medium',
    title: 'Previsão de Receita - Próximo Trimestre',
    description: `Com base nas tendências atuais, prevemos uma receita de ${predicted3MonthRevenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} no próximo trimestre.`,
    impact: {
      value: predicted3MonthRevenue,
      percentage: revenueGrowth * 100,
      description: `Crescimento estimado de ${(revenueGrowth * 100).toFixed(1)}% ao mês`
    },
    recommendations: [
      'Use esta previsão para planejamento estratégico',
      'Ajuste orçamento de despesas proporcionalmente',
      'Prepare recursos para suportar crescimento previsto',
      'Monitore KPIs semanalmente para validar previsão'
    ],
    confidence: 72,
    category: 'revenue'
  });

  return insights;
}

/**
 * Função principal que agrega todos os insights de IA
 */
export function generateFinancialInsights(data: FinancialDataForAI): FinancialInsight[] {
  const allInsights: FinancialInsight[] = [
    ...analyzeRevenueTrends(data),
    ...analyzeExpensePatterns(data),
    ...analyzeCashFlowHealth(data),
    ...identifyOptimizationOpportunities(data),
    ...generatePredictions(data),
  ];

  // Ordenar por prioridade e confiança
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  return allInsights.sort((a, b) => {
    const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
    if (priorityDiff !== 0) return priorityDiff;
    return b.confidence - a.confidence; // Maior confiança primeiro
  });
}
