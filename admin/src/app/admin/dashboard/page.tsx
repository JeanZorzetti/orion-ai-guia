'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import InvoiceUploadModal from '@/components/invoice/InvoiceUploadModal';
import {
  Upload,
  AlertTriangle,
  Calendar,
  TrendingUp,
  FileText,
  DollarSign,
  Package,
  ShoppingCart,
  TrendingDown,
  CheckCircle,
} from 'lucide-react';
import { invoiceService } from '@/services/invoice';
import { productService } from '@/services/product';
import { saleService } from '@/services/sale';
import { Invoice, Product, Sale } from '@/types';
import { format, isAfter, isBefore, addDays, startOfDay, subDays, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Sparkline } from '@/components/ui/sparkline';
import { TrendBadge } from '@/components/ui/trend-badge';

const Dashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [invoicesData, productsData, salesData] = await Promise.all([
        invoiceService.getAll(),
        productService.getAll(),
        saleService.getAll(),
      ]);
      setInvoices(invoicesData);
      setProducts(productsData);
      setSales(salesData);
    } catch (error) {
      console.error('Erro ao carregar dados do dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  // Estatísticas Financeiras
  const today = startOfDay(new Date());
  const next7Days = addDays(today, 7);

  const pendingInvoices = invoices.filter((inv) => inv.status === 'pending');
  const upcomingInvoices = pendingInvoices.filter((inv) => {
    if (!inv.due_date) return false;
    const dueDate = new Date(inv.due_date);
    return isAfter(dueDate, today) && isBefore(dueDate, next7Days);
  });
  const overdueInvoices = pendingInvoices.filter((inv) => {
    if (!inv.due_date) return false;
    const dueDate = new Date(inv.due_date);
    return isBefore(dueDate, today);
  });

  const totalPending = pendingInvoices.reduce((sum, inv) => sum + inv.total_value, 0);
  const totalPaid = invoices
    .filter((inv) => inv.status === 'paid')
    .reduce((sum, inv) => sum + inv.total_value, 0);

  // Estatísticas de Estoque
  const lowStockProducts = products.filter(
    (prod) => prod.stock_quantity <= prod.min_stock_level && prod.active
  );
  const totalStockValue = products
    .filter((prod) => prod.active)
    .reduce((sum, prod) => sum + prod.stock_quantity * prod.sale_price, 0);

  // Estatísticas de Vendas
  const completedSales = sales.filter((sale) => sale.status === 'completed');
  const totalRevenue = completedSales.reduce((sum, sale) => sum + sale.total_value, 0);
  const averageTicket = completedSales.length > 0 ? totalRevenue / completedSales.length : 0;

  // Vendas dos últimos 7 dias
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = addDays(today, -6 + i);
    return {
      date,
      day: format(date, 'EEE', { locale: ptBR }),
      sales: completedSales.filter((sale) => {
        const saleDate = startOfDay(new Date(sale.sale_date));
        return saleDate.getTime() === date.getTime();
      }),
    };
  });

  const salesByDay = last7Days.map((day) => ({
    dia: day.day,
    valor: day.sales.reduce((sum, sale) => sum + sale.total_value, 0),
  }));

  const maxDailySale = Math.max(...salesByDay.map((s) => s.valor), 1);

  // Comparações temporais (mês atual vs. mês anterior)
  const currentMonthStart = startOfMonth(today);
  const currentMonthEnd = endOfMonth(today);
  const lastMonthStart = startOfMonth(subMonths(today, 1));
  const lastMonthEnd = endOfMonth(subMonths(today, 1));

  // Vendas do mês atual
  const currentMonthSales = completedSales.filter((sale) => {
    const saleDate = new Date(sale.sale_date);
    return saleDate >= currentMonthStart && saleDate <= currentMonthEnd;
  });
  const currentMonthRevenue = currentMonthSales.reduce((sum, sale) => sum + sale.total_value, 0);

  // Vendas do mês anterior
  const lastMonthSales = completedSales.filter((sale) => {
    const saleDate = new Date(sale.sale_date);
    return saleDate >= lastMonthStart && saleDate <= lastMonthEnd;
  });
  const lastMonthRevenue = lastMonthSales.reduce((sum, sale) => sum + sale.total_value, 0);

  // Calcular tendência de receita (%)
  const revenueTrend = lastMonthRevenue > 0
    ? ((currentMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100
    : 0;

  // Dados para sparkline (últimos 30 dias)
  const last30Days = Array.from({ length: 30 }, (_, i) => {
    const date = subDays(today, 29 - i);
    const dailySales = completedSales.filter((sale) => {
      const saleDate = startOfDay(new Date(sale.sale_date));
      return saleDate.getTime() === date.getTime();
    });
    return dailySales.reduce((sum, sale) => sum + sale.total_value, 0);
  });


  // Tendência de vendas (número de vendas)
  const currentMonthSalesCount = currentMonthSales.length;
  const lastMonthSalesCount = lastMonthSales.length;
  const salesCountTrend = lastMonthSalesCount > 0
    ? ((currentMonthSalesCount - lastMonthSalesCount) / lastMonthSalesCount) * 100
    : 0;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd/MM/yyyy', { locale: ptBR });
    } catch {
      return dateString;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Carregando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">Visão geral do seu negócio</p>
      </div>

      {/* Cards de Estatísticas Principais - Layout Hierárquico */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Card Principal - Receita Total (2 colunas) */}
        <Card className="md:col-span-2 border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div>
              <CardTitle className="text-lg font-semibold">Receita Total (Mês)</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {currentMonthSales.length} venda(s) completada(s)
              </p>
            </div>
            <ShoppingCart className="h-6 w-6 text-primary" />
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-4xl font-bold">{formatCurrency(currentMonthRevenue)}</div>

            {/* Sparkline */}
            <Sparkline
              data={last30Days}
              color="#7C3AED"
              height={48}
              className="mt-2"
            />

            {/* Trend Badge */}
            <TrendBadge
              value={revenueTrend}
              label="vs. mês anterior"
              size="md"
            />
          </CardContent>
        </Card>

        {/* Card Secundário - Vendas Totais */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vendas Totais</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-2xl font-bold">{completedSales.length}</div>
            <Sparkline
              data={last30Days.map((v) => (v > 0 ? 1 : 0))}
              color="#22C55E"
              height={32}
            />
            <TrendBadge
              value={salesCountTrend}
              label="vendas/mês"
              size="sm"
            />
          </CardContent>
        </Card>

        {/* Card Secundário - Valor em Estoque */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor em Estoque</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-2xl font-bold">{formatCurrency(totalStockValue)}</div>
            <div className="h-8 flex items-end justify-between gap-1">
              {last30Days.slice(0, 20).map((_, index) => (
                <div
                  key={index}
                  className="flex-1 bg-blue-500/20 rounded-t-sm"
                  style={{
                    height: `${Math.random() * 60 + 40}%`,
                    minHeight: '20%',
                  }}
                />
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              {products.filter((p) => p.active).length} produto(s) ativo(s)
            </p>
          </CardContent>
        </Card>

        {/* Linha 2 - Cards adicionais */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total a Pagar</CardTitle>
            <DollarSign className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-2xl font-bold text-orange-600">{formatCurrency(totalPending)}</div>
            <p className="text-xs text-muted-foreground">
              {pendingInvoices.length} fatura(s) pendente(s)
            </p>
            {overdueInvoices.length > 0 && (
              <Badge variant="destructive" className="text-xs">
                {overdueInvoices.length} vencida(s)
              </Badge>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pago</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-2xl font-bold text-green-600">{formatCurrency(totalPaid)}</div>
            <p className="text-xs text-muted-foreground">
              {invoices.filter((inv) => inv.status === 'paid').length} fatura(s) paga(s)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ticket Médio</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-2xl font-bold">{formatCurrency(averageTicket)}</div>
            <p className="text-xs text-muted-foreground">Por venda</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Produtos em Alerta</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-2xl font-bold text-orange-600">{lowStockProducts.length}</div>
            <p className="text-xs text-muted-foreground">Estoque baixo</p>
            {lowStockProducts.length > 0 && (
              <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-700">
                Ação necessária
              </Badge>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: Ações Rápidas */}
        <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5 text-primary" />
              Comece por aqui
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Automatize seu fluxo financeiro em segundos
            </p>
            <InvoiceUploadModal>
              <Button size="lg" className="w-full" data-tour="import-button">
                <FileText className="mr-2 h-4 w-4" />
                Importar Fatura
              </Button>
            </InvoiceUploadModal>
          </CardContent>
        </Card>

        {/* Card 2: Contas a Vencer (Próximos 7 dias) */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              Próximas a Vencer
            </CardTitle>
            <Link
              href="/admin/financeiro/contas-a-pagar"
              className="text-sm text-primary hover:underline"
            >
              Ver todas
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {upcomingInvoices.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Nenhuma fatura a vencer nos próximos 7 dias
              </p>
            ) : (
              upcomingInvoices.slice(0, 3).map((invoice) => (
                <div
                  key={invoice.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                >
                  <div>
                    <p className="font-medium text-sm">
                      {invoice.supplier?.name || `Fatura #${invoice.invoice_number}`}
                    </p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {invoice.due_date ? formatDate(invoice.due_date) : 'Sem data'}
                    </p>
                  </div>
                  <p className="font-semibold text-sm">{formatCurrency(invoice.total_value)}</p>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Card 3: Faturas Vencidas */}
        {overdueInvoices.length > 0 && (
          <Card className="border-red-200 bg-red-50 dark:bg-red-950/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="flex items-center gap-2 text-red-700 dark:text-red-400">
                <TrendingDown className="h-5 w-5" />
                Faturas Vencidas
              </CardTitle>
              <Badge variant="destructive">{overdueInvoices.length}</Badge>
            </CardHeader>
            <CardContent className="space-y-3">
              {overdueInvoices.slice(0, 3).map((invoice) => (
                <div
                  key={invoice.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-white dark:bg-gray-900"
                >
                  <div>
                    <p className="font-medium text-sm">
                      {invoice.supplier?.name || `Fatura #${invoice.invoice_number}`}
                    </p>
                    <p className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Venceu em {invoice.due_date ? formatDate(invoice.due_date) : 'Sem data'}
                    </p>
                  </div>
                  <p className="font-semibold text-sm text-red-700 dark:text-red-400">
                    {formatCurrency(invoice.total_value)}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Card 4: Alerta de Estoque */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Atenção ao Estoque
            </CardTitle>
            <Link
              href="/admin/estoque/produtos"
              className="text-sm text-primary hover:underline"
            >
              Ver todos
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {lowStockProducts.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Todos os produtos estão com estoque adequado
              </p>
            ) : (
              lowStockProducts.slice(0, 3).map((product) => (
                <div
                  key={product.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-orange-50 dark:bg-orange-950/20"
                >
                  <div>
                    <p className="font-medium text-sm">{product.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Mínimo: {product.min_stock_level} unidades
                    </p>
                  </div>
                  <Badge
                    variant={product.stock_quantity === 0 ? 'destructive' : 'secondary'}
                    className="text-xs"
                  >
                    {product.stock_quantity} restantes
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Card 5: Visão Rápida de Vendas */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-500" />
              Vendas dos Últimos 7 Dias
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {salesByDay.map((venda, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground min-w-[40px]">
                    {venda.dia}
                  </span>
                  <div className="flex items-center gap-2 flex-1">
                    <div
                      className="h-2 bg-primary rounded-full transition-all"
                      style={{
                        width: `${venda.valor > 0 ? (venda.valor / maxDailySale) * 60 : 0}%`,
                        minWidth: venda.valor > 0 ? '2px' : '0',
                      }}
                    />
                    <span className="text-sm font-medium min-w-[100px] text-right">
                      {formatCurrency(venda.valor)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total:</span>
                <span className="font-semibold text-foreground">
                  {formatCurrency(salesByDay.reduce((sum, v) => sum + v.valor, 0))}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Ticket Médio:</span>
                <span className="font-semibold text-foreground">
                  {formatCurrency(averageTicket)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
