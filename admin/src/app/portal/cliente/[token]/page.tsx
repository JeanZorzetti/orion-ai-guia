'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  User,
  Mail,
  Phone,
  FileText,
  Download,
  QrCode,
  MoreHorizontal,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Clock,
  Eye,
  TrendingUp,
  Calendar,
} from 'lucide-react';
import { useCustomerPortal } from '@/hooks/useCustomerPortal';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface PageProps {
  params: Promise<{
    token: string;
  }>;
}

export default function CustomerPortalPage({ params }: PageProps) {
  const [token, setToken] = React.useState<string>('');

  React.useEffect(() => {
    params.then((p) => setToken(p.token));
  }, [params]);

  const { data, isLoading, error, isValidToken, refreshData } = useCustomerPortal(token);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshData();
    setIsRefreshing(false);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pendente':
        return (
          <Badge className="bg-blue-500">
            <Clock className="h-3 w-3 mr-1" />
            Pendente
          </Badge>
        );
      case 'vencido':
        return (
          <Badge variant="destructive">
            <AlertCircle className="h-3 w-3 mr-1" />
            Vencido
          </Badge>
        );
      case 'recebido':
        return (
          <Badge className="bg-green-500">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Pago
          </Badge>
        );
      case 'parcial':
        return (
          <Badge className="bg-yellow-500">
            <Clock className="h-3 w-3 mr-1" />
            Pago Parcial
          </Badge>
        );
      default:
        return <Badge variant="outline">-</Badge>;
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-4">
              <RefreshCw className="h-12 w-12 animate-spin text-primary" />
              <p className="text-lg font-medium">Carregando portal...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error or invalid token
  if (!isValidToken || error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-6 w-6" />
              Acesso Negado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {error || 'Token inválido ou expirado. Entre em contato com o financeiro para obter um novo link de acesso.'}
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Success - show portal
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
                <User className="h-8 w-8 text-primary" />
                Portal do Cliente
              </h1>
              <p className="text-muted-foreground mt-1">
                Olá, {data!.cliente.nome}! Consulte seus títulos e realize pagamentos
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw className={cn('h-4 w-4 mr-2', isRefreshing && 'animate-spin')} />
              Atualizar
            </Button>
          </div>

          {/* Informações do Cliente */}
          <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-lg">Suas Informações</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Email</p>
                    <p className="text-sm font-medium">{data!.cliente.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">CPF/CNPJ</p>
                    <p className="text-sm font-medium">{data!.cliente.cpfCnpj}</p>
                  </div>
                </div>
                {data!.cliente.telefone && (
                  <div className="flex items-center gap-3">
                    <Phone className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Telefone</p>
                      <p className="text-sm font-medium">{data!.cliente.telefone}</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Resumo Financeiro */}
        <div className="grid gap-4 md:grid-cols-4 mb-8">
          <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total em Aberto
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-blue-600" />
                <p className="text-2xl font-bold text-blue-600">
                  R$ {data!.resumo.totalEmAberto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Vencido
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-red-600" />
                <p className="text-2xl font-bold text-red-600">
                  R$ {data!.resumo.totalVencido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Títulos Vencidos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-orange-600" />
                <p className="text-2xl font-bold text-orange-600">
                  {data!.resumo.quantidadeVencidos}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Próximo Vencimento
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-green-600" />
                <p className="text-lg font-bold text-green-600">
                  {data!.resumo.proximoVencimento
                    ? format(data!.resumo.proximoVencimento, 'dd/MM/yyyy')
                    : '-'}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabela de Títulos */}
        <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur">
          <CardHeader>
            <CardTitle>Seus Títulos ({data!.titulos.length})</CardTitle>
            <CardDescription>
              Consulte e gerencie seus títulos em aberto
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 font-semibold text-sm">Documento</th>
                    <th className="text-left p-3 font-semibold text-sm">Descrição</th>
                    <th className="text-left p-3 font-semibold text-sm">Emissão</th>
                    <th className="text-left p-3 font-semibold text-sm">Vencimento</th>
                    <th className="text-right p-3 font-semibold text-sm">Valor</th>
                    <th className="text-right p-3 font-semibold text-sm">Saldo</th>
                    <th className="text-center p-3 font-semibold text-sm">Status</th>
                    <th className="text-center p-3 font-semibold text-sm">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {data!.titulos.map((titulo) => (
                    <tr
                      key={titulo.id}
                      className="border-b hover:bg-muted/50 transition-colors"
                    >
                      <td className="p-3">
                        <span className="font-mono text-sm font-semibold">
                          {titulo.numeroDocumento}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className="text-sm">{titulo.descricao}</span>
                      </td>
                      <td className="p-3">
                        <span className="text-sm text-muted-foreground">
                          {format(titulo.dataEmissao, 'dd/MM/yyyy')}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">
                            {format(titulo.dataVencimento, 'dd/MM/yyyy')}
                          </span>
                          {titulo.status === 'vencido' && (
                            <span className="text-xs text-red-600">
                              {titulo.diasVencido} dias vencido
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-3 text-right">
                        <span className="font-semibold">
                          R$ {titulo.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <span
                          className={cn(
                            'font-semibold',
                            titulo.saldo > 0 ? 'text-orange-600' : 'text-green-600'
                          )}
                        >
                          R$ {titulo.saldo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                      </td>
                      <td className="p-3 text-center">{getStatusBadge(titulo.status)}</td>
                      <td className="p-3">
                        <div className="flex items-center justify-center gap-2">
                          {(titulo.status === 'pendente' || titulo.status === 'vencido') && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem>
                                  <Eye className="h-4 w-4 mr-2" />
                                  Ver Detalhes
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <QrCode className="h-4 w-4 mr-2" />
                                  Gerar PIX
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <FileText className="h-4 w-4 mr-2" />
                                  Gerar Boleto
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Download className="h-4 w-4 mr-2" />
                                  Baixar NF
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                          {titulo.status === 'recebido' && (
                            <Button variant="ghost" size="sm">
                              <CheckCircle2 className="h-4 w-4 text-green-600" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Informações de Contato */}
        <Card className="mt-8 bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                <span className="font-semibold">💡 Dúvidas?</span> Entre em contato com nosso
                departamento financeiro através do email{' '}
                <a href="mailto:financeiro@empresa.com.br" className="text-primary underline">
                  financeiro@empresa.com.br
                </a>{' '}
                ou telefone{' '}
                <a href="tel:+551140041234" className="text-primary underline">
                  (11) 4004-1234
                </a>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
