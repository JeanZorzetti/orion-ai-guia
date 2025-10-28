import { Sale, Invoice, Product } from '@/types';
import { Insight, InsightType, InsightPriority } from '@/components/dashboard/InsightCard';
import { startOfMonth, endOfMonth, subMonths, startOfDay, subDays, differenceInDays } from 'date-fns';

interface InsightGeneratorParams {
  sales: Sale[];
  invoices: Invoice[];
  products: Product[];
  dateRange?: {
    from?: Date;
    to?: Date;
  };
}

export class InsightsGenerator {
  private sales: Sale[];
  private invoices: Invoice[];
  private products: Product[];
  private dateRange?: { from?: Date; to?: Date };

  constructor(params: InsightGeneratorParams) {
    this.sales = params.sales;
    this.invoices = params.invoices;
    this.products = params.products;
    this.dateRange = params.dateRange;
  }

  generateAllInsights(): Insight[] {
    const insights: Insight[] = [];

    // 1. Insights de Vendas
    insights.push(...this.generateSalesInsights());

    // 2. Insights de Estoque
    insights.push(...this.generateStockInsights());

    // 3. Insights Financeiros
    insights.push(...this.generateFinancialInsights());

    // 4. Insights de Tendências
    insights.push(...this.generateTrendInsights());

    // 5. Insights de Canais
    insights.push(...this.generateChannelInsights());

    return insights.filter(Boolean);
  }

  private generateSalesInsights(): Insight[] {
    const insights: Insight[] = [];
    const completedSales = this.sales.filter(s => s.status === 'completed');

    if (completedSales.length === 0) {
      return [];
    }

    // Insight 1: Vendas do dia
    const today = startOfDay(new Date());
    const todaySales = completedSales.filter(sale => {
      const saleDate = startOfDay(new Date(sale.sale_date));
      return saleDate.getTime() === today.getTime();
    });

    if (todaySales.length > 0) {
      const todayRevenue = todaySales.reduce((sum, s) => sum + s.total_value, 0);
      insights.push({
        id: 'sales-today',
        type: 'success',
        priority: 'medium',
        title: `${todaySales.length} venda${todaySales.length > 1 ? 's' : ''} hoje`,
        description: `Você já realizou vendas no valor de R$ ${todayRevenue.toFixed(2)} hoje. Continue assim!`,
        metric: `R$ ${todayRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
        action: {
          label: 'Ver vendas',
          href: '/admin/vendas'
        }
      });
    }

    // Insight 2: Crescimento MoM
    const currentMonth = new Date();
    const lastMonth = subMonths(currentMonth, 1);

    const currentMonthSales = completedSales.filter(sale => {
      const saleDate = new Date(sale.sale_date);
      return saleDate >= startOfMonth(currentMonth) && saleDate <= endOfMonth(currentMonth);
    });

    const lastMonthSales = completedSales.filter(sale => {
      const saleDate = new Date(sale.sale_date);
      return saleDate >= startOfMonth(lastMonth) && saleDate <= endOfMonth(lastMonth);
    });

    if (currentMonthSales.length > 0 && lastMonthSales.length > 0) {
      const currentRevenue = currentMonthSales.reduce((sum, s) => sum + s.total_value, 0);
      const lastRevenue = lastMonthSales.reduce((sum, s) => sum + s.total_value, 0);
      const growthPercent = ((currentRevenue - lastRevenue) / lastRevenue) * 100;

      if (Math.abs(growthPercent) > 10) {
        insights.push({
          id: 'sales-mom-growth',
          type: growthPercent > 0 ? 'trend' : 'warning',
          priority: Math.abs(growthPercent) > 30 ? 'high' : 'medium',
          title: growthPercent > 0 ? 'Crescimento forte este mês' : 'Queda nas vendas este mês',
          description: `Suas vendas ${growthPercent > 0 ? 'cresceram' : 'caíram'} ${Math.abs(growthPercent).toFixed(1)}% em relação ao mês anterior. ${
            growthPercent > 0
              ? 'Excelente performance!'
              : 'Considere revisar estratégias de marketing.'
          }`,
          change: growthPercent
        });
      }
    }

    // Insight 3: Ticket médio alto
    const avgTicket = completedSales.reduce((sum, s) => sum + s.total_value, 0) / completedSales.length;
    if (avgTicket > 1000) {
      insights.push({
        id: 'high-ticket',
        type: 'success',
        priority: 'low',
        title: 'Ticket médio elevado',
        description: `Seu ticket médio está em R$ ${avgTicket.toFixed(2)}. Isso indica um bom posicionamento de mercado.`,
        metric: `R$ ${avgTicket.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
      });
    }

    return insights;
  }

  private generateStockInsights(): Insight[] {
    const insights: Insight[] = [];
    const activeProducts = this.products.filter(p => p.active);

    if (activeProducts.length === 0) {
      return [];
    }

    // Insight 1: Produtos com estoque baixo
    const lowStockProducts = activeProducts.filter(
      p => p.stock_quantity <= p.min_stock_level
    );

    if (lowStockProducts.length > 0) {
      const criticalStock = lowStockProducts.filter(p => p.stock_quantity === 0);

      insights.push({
        id: 'low-stock',
        type: criticalStock.length > 0 ? 'danger' : 'warning',
        priority: criticalStock.length > 0 ? 'high' : 'medium',
        title: `${lowStockProducts.length} produto${lowStockProducts.length > 1 ? 's' : ''} com estoque baixo`,
        description: criticalStock.length > 0
          ? `Você tem ${criticalStock.length} produto(s) sem estoque e ${lowStockProducts.length - criticalStock.length} abaixo do mínimo. Reabasteça urgentemente!`
          : `${lowStockProducts.length} produto(s) estão abaixo do nível mínimo. Considere reabastecer em breve.`,
        action: {
          label: 'Ver produtos',
          href: '/admin/estoque/produtos'
        }
      });
    }

    // Insight 2: Valor alto em estoque
    const totalStockValue = activeProducts.reduce(
      (sum, p) => sum + (p.stock_quantity * p.sale_price),
      0
    );

    if (totalStockValue > 50000) {
      insights.push({
        id: 'high-stock-value',
        type: 'info',
        priority: 'low',
        title: 'Alto valor imobilizado em estoque',
        description: `Você tem R$ ${totalStockValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} em estoque. Considere estratégias para aumentar o giro.`,
        metric: `R$ ${totalStockValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
      });
    }

    return insights;
  }

  private generateFinancialInsights(): Insight[] {
    const insights: Insight[] = [];

    // Insight 1: Faturas vencidas
    const today = new Date();
    const overdueInvoices = this.invoices.filter(inv => {
      if (inv.status !== 'pending' || !inv.due_date) return false;
      return new Date(inv.due_date) < today;
    });

    if (overdueInvoices.length > 0) {
      const overdueValue = overdueInvoices.reduce((sum, inv) => sum + inv.total_value, 0);

      insights.push({
        id: 'overdue-invoices',
        type: 'danger',
        priority: 'high',
        title: `${overdueInvoices.length} fatura${overdueInvoices.length > 1 ? 's' : ''} vencida${overdueInvoices.length > 1 ? 's' : ''}`,
        description: `Você tem R$ ${overdueValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} em faturas vencidas. Regularize para evitar juros e multas.`,
        metric: `R$ ${overdueValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
        action: {
          label: 'Ver faturas',
          href: '/admin/financeiro/contas-a-pagar'
        }
      });
    }

    // Insight 2: Faturas próximas do vencimento
    const next7Days = new Date();
    next7Days.setDate(next7Days.getDate() + 7);

    const upcomingInvoices = this.invoices.filter(inv => {
      if (inv.status !== 'pending' || !inv.due_date) return false;
      const dueDate = new Date(inv.due_date);
      return dueDate > today && dueDate <= next7Days;
    });

    if (upcomingInvoices.length > 0) {
      const upcomingValue = upcomingInvoices.reduce((sum, inv) => sum + inv.total_value, 0);

      insights.push({
        id: 'upcoming-invoices',
        type: 'warning',
        priority: 'medium',
        title: `${upcomingInvoices.length} fatura${upcomingInvoices.length > 1 ? 's' : ''} vence${upcomingInvoices.length > 1 ? 'm' : ''} em 7 dias`,
        description: `Prepare-se para pagar R$ ${upcomingValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} nos próximos 7 dias.`,
        metric: `R$ ${upcomingValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
        action: {
          label: 'Ver faturas',
          href: '/admin/financeiro/contas-a-pagar'
        }
      });
    }

    return insights;
  }

  private generateTrendInsights(): Insight[] {
    const insights: Insight[] = [];
    const completedSales = this.sales.filter(s => s.status === 'completed');

    if (completedSales.length < 7) {
      return [];
    }

    // Análise dos últimos 7 dias vs 7 dias anteriores
    const today = new Date();
    const last7Days = completedSales.filter(sale => {
      const saleDate = new Date(sale.sale_date);
      const daysAgo = differenceInDays(today, saleDate);
      return daysAgo >= 0 && daysAgo < 7;
    });

    const previous7Days = completedSales.filter(sale => {
      const saleDate = new Date(sale.sale_date);
      const daysAgo = differenceInDays(today, saleDate);
      return daysAgo >= 7 && daysAgo < 14;
    });

    if (last7Days.length > 0 && previous7Days.length > 0) {
      const recentRevenue = last7Days.reduce((sum, s) => sum + s.total_value, 0);
      const previousRevenue = previous7Days.reduce((sum, s) => sum + s.total_value, 0);
      const weeklyChange = ((recentRevenue - previousRevenue) / previousRevenue) * 100;

      if (Math.abs(weeklyChange) > 15) {
        insights.push({
          id: 'weekly-trend',
          type: weeklyChange > 0 ? 'trend' : 'warning',
          priority: 'low',
          title: weeklyChange > 0 ? 'Tendência de alta semanal' : 'Tendência de baixa semanal',
          description: `Suas vendas ${weeklyChange > 0 ? 'subiram' : 'caíram'} ${Math.abs(weeklyChange).toFixed(1)}% na última semana comparado à semana anterior.`,
          change: weeklyChange
        });
      }
    }

    return insights;
  }

  private generateChannelInsights(): Insight[] {
    const insights: Insight[] = [];
    const completedSales = this.sales.filter(s => s.status === 'completed');

    if (completedSales.length === 0) {
      return [];
    }

    // Agrupar vendas por canal
    const channelStats: Record<string, { count: number; revenue: number }> = {};

    completedSales.forEach(sale => {
      const channel = sale.origin_channel || 'manual';
      if (!channelStats[channel]) {
        channelStats[channel] = { count: 0, revenue: 0 };
      }
      channelStats[channel].count++;
      channelStats[channel].revenue += sale.total_value;
    });

    // Encontrar canal mais lucrativo
    const channels = Object.entries(channelStats);
    if (channels.length > 1) {
      const topChannel = channels.reduce((max, curr) =>
        curr[1].revenue > max[1].revenue ? curr : max
      );

      const channelLabels: Record<string, string> = {
        shopify: 'Shopify',
        mercadolivre: 'Mercado Livre',
        woocommerce: 'WooCommerce',
        magalu: 'Magalu',
        tiktok: 'TikTok Shop',
        manual: 'Manual'
      };

      const channelName = channelLabels[topChannel[0]] || topChannel[0];
      const percentage = (topChannel[1].revenue / completedSales.reduce((sum, s) => sum + s.total_value, 0)) * 100;

      insights.push({
        id: 'top-channel',
        type: 'info',
        priority: 'low',
        title: `${channelName} é seu canal mais lucrativo`,
        description: `${percentage.toFixed(1)}% da sua receita vem do ${channelName} (R$ ${topChannel[1].revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}). Considere investir mais neste canal.`,
        metric: `${topChannel[1].count} vendas`
      });
    }

    return insights;
  }
}

export const generateInsights = (params: InsightGeneratorParams): Insight[] => {
  const generator = new InsightsGenerator(params);
  return generator.generateAllInsights();
};
