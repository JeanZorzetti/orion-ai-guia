'use client';

import React, { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ArrowRightLeft, ArrowRight, Eye, TrendingUp, TrendingDown } from 'lucide-react';
import { useAccountTransfers } from '@/hooks/useAccountTransfers';
import { TransferDialog } from './TransferDialog';

export const AccountTransfers: React.FC = () => {
  const { transfers, loading } = useAccountTransfers();
  const [showTransferDialog, setShowTransferDialog] = useState(false);

  const getTipoIcon = (tipo: string) => {
    switch (tipo) {
      case 'aplicacao':
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'resgate':
        return <TrendingDown className="h-4 w-4 text-blue-600" />;
      default:
        return <ArrowRightLeft className="h-4 w-4 text-purple-600" />;
    }
  };

  const getTipoLabel = (tipo: string) => {
    switch (tipo) {
      case 'aplicacao':
        return 'Aplicação';
      case 'resgate':
        return 'Resgate';
      case 'transferencia':
        return 'Transferência';
      default:
        return tipo;
    }
  };

  const getTipoBadgeVariant = (tipo: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
    switch (tipo) {
      case 'aplicacao':
        return 'default';
      case 'resgate':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Transferências Entre Contas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[200px]">
            <p className="text-muted-foreground">Carregando transferências...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <ArrowRightLeft className="h-5 w-5 text-purple-500" />
                Transferências Entre Contas
              </CardTitle>
              <CardDescription className="mt-1">
                Histórico de movimentações entre suas contas
              </CardDescription>
            </div>
            <Button onClick={() => setShowTransferDialog(true)}>
              <ArrowRightLeft className="mr-2 h-4 w-4" />
              Nova Transferência
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {transfers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <ArrowRightLeft className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Nenhuma transferência registrada</p>
              <p className="text-sm text-muted-foreground mt-1">
                Clique em &quot;Nova Transferência&quot; para começar
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Origem</TableHead>
                    <TableHead className="w-12"></TableHead>
                    <TableHead>Destino</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transfers.map((transfer) => (
                    <TableRow key={transfer.id}>
                      <TableCell className="font-medium">
                        {format(transfer.data, 'dd/MM/yyyy', { locale: ptBR })}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: transfer.contaOrigem.corPrimaria }}
                          />
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">
                              {transfer.contaOrigem.nome}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {transfer.contaOrigem.banco}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: transfer.contaDestino.corPrimaria }}
                          />
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">
                              {transfer.contaDestino.nome}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {transfer.contaDestino.banco}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-semibold">
                        R$ {transfer.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getTipoBadgeVariant(transfer.tipo)} className="gap-1">
                          {getTipoIcon(transfer.tipo)}
                          {getTipoLabel(transfer.tipo)}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-[200px]">
                        <p className="text-sm truncate">{transfer.descricao}</p>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Estatísticas */}
          {transfers.length > 0 && (
            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="bg-muted/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm text-muted-foreground">
                    Total Transferido
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">
                    R$ {transfers.reduce((sum, t) => sum + t.valor, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {transfers.length} transações
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-muted/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm text-muted-foreground">
                    Aplicações
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    R$ {transfers
                      .filter(t => t.tipo === 'aplicacao')
                      .reduce((sum, t) => sum + t.valor, 0)
                      .toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {transfers.filter(t => t.tipo === 'aplicacao').length} transações
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-muted/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm text-muted-foreground">
                    Resgates
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-purple-600">
                    R$ {transfers
                      .filter(t => t.tipo === 'resgate')
                      .reduce((sum, t) => sum + t.valor, 0)
                      .toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {transfers.filter(t => t.tipo === 'resgate').length} transações
                  </p>
                </CardContent>
              </Card>
            </div>
          )}
        </CardContent>
      </Card>

      <TransferDialog
        open={showTransferDialog}
        onOpenChange={setShowTransferDialog}
      />
    </>
  );
};
