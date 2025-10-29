'use client';

import React, { useState, useEffect } from 'react';
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
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useSupplierPortal } from '@/hooks/useSupplierPortal';
import {
  Building2,
  Mail,
  Phone,
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  Download,
  Eye,
  BarChart3,
  DollarSign,
  Calendar,
  AlertCircle,
  Loader2,
  ShieldX,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const getStatusBadge = (status: string) => {
  const variants: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ReactNode; label: string; color: string }> = {
    pendente: {
      variant: 'outline',
      icon: <Clock className="h-3 w-3 mr-1" />,
      label: 'Pendente',
      color: 'text-orange-600',
    },
    validada: {
      variant: 'default',
      icon: <CheckCircle2 className="h-3 w-3 mr-1" />,
      label: 'Validada',
      color: 'text-blue-600',
    },
    paga: {
      variant: 'secondary',
      icon: <CheckCircle2 className="h-3 w-3 mr-1" />,
      label: 'Paga',
      color: 'text-green-600',
    },
    cancelada: {
      variant: 'destructive',
      icon: <XCircle className="h-3 w-3 mr-1" />,
      label: 'Cancelada',
      color: 'text-red-600',
    },
  };

  const config = variants[status] || variants.pendente;

  return (
    <Badge variant={config.variant} className="flex items-center w-fit">
      {config.icon}
      {config.label}
    </Badge>
  );
};

const getApprovalBadge = (status?: string) => {
  if (!status) return null;

  const variants: Record<string, { variant: 'default' | 'secondary' | 'destructive'; label: string }> = {
    aguardando: { variant: 'default', label: 'Aguardando Aprovação' },
    aprovada: { variant: 'secondary', label: 'Aprovada' },
    rejeitada: { variant: 'destructive', label: 'Rejeitada' },
  };

  const config = variants[status];
  if (!config) return null;

  return <Badge variant={config.variant}>{config.label}</Badge>;
};

export default function SupplierPortalPage({ params }: { params: Promise<{ token: string }> }) {
  const [token, setToken] = useState<string>('');

  useEffect(() => {
    params.then((p) => setToken(p.token));
  }, [params]);

  const { data, isLoading, isValidToken } = useSupplierPortal(token);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="pt-6 text-center">
            <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Carregando portal...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isValidToken || !data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <ShieldX className="h-16 w-16 text-red-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Acesso Negado</h2>
            <p className="text-muted-foreground mb-4">
              Token inválido ou expirado. Por favor, entre em contato com o departamento financeiro
              para obter um novo link de acesso.
            </p>
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Se você acredita que isso é um erro, verifique se o link está completo e tente
                novamente.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 py-8 px-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-3xl flex items-center gap-2 mb-2">
                  <Building2 className="h-8 w-8 text-primary" />
                  Portal do Fornecedor
                </CardTitle>
                <CardDescription className="text-lg">
                  Bem-vindo, <strong>{data.fornecedor.nome}</strong>
                </CardDescription>
              </div>
              <div className="text-right text-sm text-muted-foreground">
                <p className="flex items-center gap-1 justify-end">
                  <Mail className="h-3 w-3" />
                  {data.fornecedor.email}
                </p>
                <p className="flex items-center gap-1 justify-end">
                  <Phone className="h-3 w-3" />
                  {data.fornecedor.telefone}
                </p>
                <p className="mt-1">CNPJ: {data.fornecedor.cnpj}</p>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total a Receber</CardTitle>
              <DollarSign className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                R$ {data.resumo.totalAReceber.toLocaleString('pt-BR')}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {data.resumo.faturasValidadas} faturas validadas
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pendente Aprovação</CardTitle>
              <Clock className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {data.resumo.pendenteAprovacao}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {data.resumo.faturasPendentes} faturas aguardando
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pago este Mês</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                R$ {data.resumo.pagoMes.toLocaleString('pt-BR')}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {data.resumo.faturasPagas} faturas pagas
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Próximo Pagamento</CardTitle>
              <Calendar className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold text-purple-600">
                {data.resumo.proximoPagamento
                  ? format(data.resumo.proximoPagamento, 'dd/MM/yyyy', { locale: ptBR })
                  : '-'}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Previsão de pagamento</p>
            </CardContent>
          </Card>
        </div>

        {/* Invoices Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Suas Faturas
            </CardTitle>
            <CardDescription>Acompanhe o status de todas as suas faturas</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Número</TableHead>
                  <TableHead>Emissão</TableHead>
                  <TableHead>Vencimento</TableHead>
                  <TableHead>Pagamento</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Aprovação</TableHead>
                  <TableHead>Descrição</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.faturas.map((fatura) => (
                  <TableRow key={fatura.id}>
                    <TableCell className="font-medium">{fatura.invoice_number}</TableCell>
                    <TableCell>
                      {format(fatura.invoice_date, 'dd/MM/yyyy', { locale: ptBR })}
                    </TableCell>
                    <TableCell>
                      {fatura.due_date
                        ? format(fatura.due_date, 'dd/MM/yyyy', { locale: ptBR })
                        : '-'}
                    </TableCell>
                    <TableCell>
                      {fatura.payment_date ? (
                        <span className="text-green-600 font-medium">
                          {format(fatura.payment_date, 'dd/MM/yyyy', { locale: ptBR })}
                        </span>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      R$ {fatura.total_value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell>{getStatusBadge(fatura.status)}</TableCell>
                    <TableCell>{getApprovalBadge(fatura.status_aprovacao)}</TableCell>
                    <TableCell className="max-w-xs truncate text-sm text-muted-foreground">
                      {fatura.descricao || '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Historical Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Histórico de Pagamentos
            </CardTitle>
            <CardDescription>Evolução dos últimos 6 meses</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.historicoMensal}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mes" />
                <YAxis />
                <Tooltip
                  formatter={(value: number) =>
                    `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                  }
                />
                <Bar dataKey="totalPago" fill="#3b82f6" name="Total Pago" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Footer */}
        <Card>
          <CardContent className="pt-6">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Informação:</strong> Este portal é exclusivo para consulta. Para dúvidas sobre
                pagamentos ou faturas, entre em contato com nosso departamento financeiro através do
                email ou telefone informado acima.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
