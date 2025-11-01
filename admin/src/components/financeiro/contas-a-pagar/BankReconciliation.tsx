'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  useBankTransactions,
  usePendingInvoices,
  useReconciliationSummary,
  reconcileManually,
} from '@/hooks/useBankReconciliation';
import {
  Banknote,
  FileText,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  TrendingUp,
  Building2,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

export const BankReconciliation: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const transactions = useBankTransactions(false); // Apenas não conciliadas
  const invoices = usePendingInvoices(false); // Apenas não conciliadas
  const summary = useReconciliationSummary();

  const [selectedTransaction, setSelectedTransaction] = useState<string | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  // Simular loading enquanto dados estão sendo carregados
  React.useEffect(() => {
    // Aguardar um pouco para dar tempo dos hooks carregarem
    const timer = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  const handleReconcile = async () => {
    if (!selectedTransaction || !selectedInvoice) return;

    setProcessing(true);
    try {
      await reconcileManually(selectedTransaction, selectedInvoice);
      setSelectedTransaction(null);
      setSelectedInvoice(null);
      // TODO: Atualizar lista e mostrar toast de sucesso
    } catch (error) {
      console.error('Erro ao conciliar:', error);
      // TODO: Mostrar toast de erro
    } finally {
      setProcessing(false);
    }
  };

  const canReconcile = selectedTransaction && selectedInvoice;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Transações Pendentes</CardTitle>
            <Banknote className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {summary.transacoesPendentes}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              de {summary.totalTransacoes} totais
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Faturas Pendentes</CardTitle>
            <FileText className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {summary.faturasPendentes}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              de {summary.totalFaturas} totais
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Conciliação</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {summary.taxaConciliacao.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {summary.transacoesConciliadas} conciliadas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Economia de Tempo</CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {summary.economiaTempo.toFixed(1)}h
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              economizadas
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Reconciliation Interface */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Conciliação Manual
          </CardTitle>
          <CardDescription>
            Selecione uma transação bancária e uma fatura para conciliar manualmente
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Coluna de Transações Bancárias */}
            <div className="space-y-3">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold flex items-center gap-2">
                  <Banknote className="h-4 w-4" />
                  Transações Bancárias ({transactions.length})
                </h4>
              </div>

              <div className="space-y-2 max-h-[500px] overflow-y-auto">
                {transactions.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground border rounded-lg">
                    <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-green-600" />
                    <p>Todas as transações foram conciliadas!</p>
                  </div>
                ) : (
                  transactions.map((transaction) => (
                    <div
                      key={transaction.id}
                      onClick={() => setSelectedTransaction(transaction.id)}
                      className={cn(
                        'border rounded-lg p-3 cursor-pointer transition-all hover:shadow-md',
                        selectedTransaction === transaction.id &&
                          'border-primary bg-primary/5 ring-2 ring-primary'
                      )}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <p className="font-medium text-sm">{transaction.descricao}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {transaction.banco} • {transaction.contaBancaria}
                          </p>
                        </div>
                        <Badge variant={transaction.tipo === 'debito' ? 'destructive' : 'default'}>
                          {transaction.tipo === 'debito' ? 'Débito' : 'Crédito'}
                        </Badge>
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                          {format(transaction.data, 'dd/MM/yyyy', { locale: ptBR })}
                        </span>
                        <span className="font-bold text-red-600">
                          R$ {transaction.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                      </div>

                      {transaction.documento && (
                        <p className="text-xs text-muted-foreground mt-2">
                          Doc: {transaction.documento}
                        </p>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Coluna de Faturas Pendentes */}
            <div className="space-y-3">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Faturas Pendentes ({invoices.length})
                </h4>
              </div>

              <div className="space-y-2 max-h-[500px] overflow-y-auto">
                {invoices.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground border rounded-lg">
                    <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-green-600" />
                    <p>Todas as faturas foram conciliadas!</p>
                  </div>
                ) : (
                  invoices.map((invoice) => (
                    <div
                      key={invoice.id}
                      onClick={() => setSelectedInvoice(invoice.id)}
                      className={cn(
                        'border rounded-lg p-3 cursor-pointer transition-all hover:shadow-md',
                        selectedInvoice === invoice.id &&
                          'border-primary bg-primary/5 ring-2 ring-primary'
                      )}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <p className="font-medium text-sm">{invoice.invoiceNumber}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {invoice.fornecedor}
                          </p>
                        </div>
                        <Badge variant="secondary">{invoice.status}</Badge>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs mb-2">
                        <div>
                          <span className="text-muted-foreground">Vencimento:</span>
                          <p className="font-medium">
                            {format(invoice.dataVencimento, 'dd/MM/yyyy', { locale: ptBR })}
                          </p>
                        </div>
                        {invoice.dataPagamento && (
                          <div>
                            <span className="text-muted-foreground">Pagamento:</span>
                            <p className="font-medium">
                              {format(invoice.dataPagamento, 'dd/MM/yyyy', { locale: ptBR })}
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">Valor:</span>
                        <span className="font-bold text-blue-600">
                          R$ {invoice.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Reconciliation Action */}
          {canReconcile && (
            <div className="mt-6 p-4 bg-primary/5 border border-primary/20 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-white">
                      <Banknote className="h-3 w-3 mr-1" />
                      1 transação
                    </Badge>
                    <ArrowRight className="h-4 w-4 text-primary" />
                    <Badge variant="outline" className="bg-white">
                      <FileText className="h-3 w-3 mr-1" />
                      1 fatura
                    </Badge>
                  </div>
                  <span className="text-sm text-muted-foreground">selecionados</span>
                </div>
                <Button
                  onClick={handleReconcile}
                  disabled={processing}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  {processing ? 'Conciliando...' : 'Conciliar'}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* History Table */}
      <Card>
        <CardHeader>
          <CardTitle>Transações Conciliadas Recentemente</CardTitle>
          <CardDescription>Histórico das últimas conciliações realizadas</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Transação</TableHead>
                <TableHead>Fatura</TableHead>
                <TableHead>Fornecedor</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {useBankTransactions(true)
                .slice(0, 5)
                .map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell>
                      {format(transaction.data, 'dd/MM/yyyy', { locale: ptBR })}
                    </TableCell>
                    <TableCell className="font-medium">{transaction.descricao}</TableCell>
                    <TableCell>
                      {transaction.faturaId ? (
                        <Badge variant="outline">{transaction.faturaId}</Badge>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {/* Extrair nome do fornecedor da descrição */}
                      {transaction.descricao.split(' ').slice(1, 3).join(' ')}
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      R$ {transaction.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="bg-green-100 text-green-700">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Conciliado
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>

          {useBankTransactions(true).length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              Nenhuma conciliação realizada ainda
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
