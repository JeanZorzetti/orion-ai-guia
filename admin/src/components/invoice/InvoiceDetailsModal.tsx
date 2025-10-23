'use client';

import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Eye, Edit, Trash2, Building, Calendar, DollarSign, FileText, Tag } from 'lucide-react';
import { Invoice } from '@/types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface InvoiceDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoice: Invoice | null;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function InvoiceDetailsModal({
  open,
  onOpenChange,
  invoice,
  onEdit,
  onDelete
}: InvoiceDetailsModalProps) {
  if (!invoice) return null;

  const getStatusBadge = (status: Invoice['status']) => {
    const variants = {
      pending: { label: 'Pendente', className: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
      validated: { label: 'Validado', className: 'bg-blue-100 text-blue-800 border-blue-200' },
      paid: { label: 'Pago', className: 'bg-green-100 text-green-800 border-green-200' },
      cancelled: { label: 'Cancelado', className: 'bg-red-100 text-red-800 border-red-200' },
    };

    const variant = variants[status] || variants.pending;

    return (
      <Badge variant="outline" className={variant.className}>
        {variant.label}
      </Badge>
    );
  };

  const formatCurrency = (value: number | undefined | null) => {
    if (value === undefined || value === null) return 'R$ 0,00';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'Não informado';
    try {
      return format(new Date(dateString), 'dd/MM/yyyy', { locale: ptBR });
    } catch {
      return 'Data inválida';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Detalhes da Fatura
          </DialogTitle>
          <DialogDescription>
            Visualize todas as informações da fatura #{invoice.invoice_number}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Cabeçalho com status e número */}
          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <div>
              <p className="text-sm text-muted-foreground">Número da Fatura</p>
              <p className="text-2xl font-bold">{invoice.invoice_number}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground mb-1">Status</p>
              {getStatusBadge(invoice.status)}
            </div>
          </div>

          {/* Dados do Fornecedor */}
          {invoice.supplier && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Building className="h-5 w-5" />
                  Fornecedor
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <p className="text-sm text-muted-foreground">Nome/Razão Social</p>
                  <p className="font-medium">{invoice.supplier.name}</p>
                </div>
                {invoice.supplier.document && (
                  <div>
                    <p className="text-sm text-muted-foreground">CNPJ/CPF</p>
                    <p className="font-medium">{invoice.supplier.document}</p>
                  </div>
                )}
                {invoice.supplier.email && (
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium">{invoice.supplier.email}</p>
                  </div>
                )}
                {invoice.supplier.phone && (
                  <div>
                    <p className="text-sm text-muted-foreground">Telefone</p>
                    <p className="font-medium">{invoice.supplier.phone}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Datas */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Calendar className="h-5 w-5" />
                Datas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Data de Emissão</p>
                  <p className="font-medium">{formatDate(invoice.invoice_date)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Data de Vencimento</p>
                  <p className="font-medium">{formatDate(invoice.due_date)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Valores Financeiros */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <DollarSign className="h-5 w-5" />
                Valores Financeiros
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Valor Total</p>
                  <p className="text-lg font-bold text-primary">
                    {formatCurrency(invoice.total_value)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Impostos</p>
                  <p className="text-lg font-semibold text-orange-600">
                    {formatCurrency(invoice.tax_value)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Valor Líquido</p>
                  <p className="text-lg font-semibold text-green-600">
                    {formatCurrency(invoice.net_value)}
                  </p>
                </div>
              </div>

              <Separator />

              <div className="text-sm text-muted-foreground">
                <p>
                  Cálculo: {formatCurrency(invoice.total_value)} (total)
                  - {formatCurrency(invoice.tax_value)} (impostos)
                  = {formatCurrency(invoice.net_value)} (líquido)
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Categoria e Observações */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileText className="h-5 w-5" />
                Informações Adicionais
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {invoice.category && (
                <div>
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <Tag className="h-4 w-4" />
                    Categoria
                  </p>
                  <p className="font-medium">{invoice.category}</p>
                </div>
              )}

              {invoice.description && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm text-muted-foreground">Observações</p>
                    <p className="mt-1 text-sm">{invoice.description}</p>
                  </div>
                </>
              )}

              <Separator />

              <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground">
                <div>
                  <p>Criado em</p>
                  <p className="font-medium">{formatDate(invoice.created_at)}</p>
                </div>
                <div>
                  <p>Última atualização</p>
                  <p className="font-medium">{formatDate(invoice.updated_at)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Botões de Ação */}
          <div className="flex justify-between gap-3 pt-4">
            <Button
              variant="outline"
              onClick={onOpenChange.bind(null, false)}
            >
              Fechar
            </Button>

            <div className="flex gap-3">
              {onDelete && (
                <Button
                  variant="destructive"
                  onClick={() => {
                    onOpenChange(false);
                    onDelete();
                  }}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Deletar
                </Button>
              )}

              {onEdit && (
                <Button
                  onClick={() => {
                    onOpenChange(false);
                    onEdit();
                  }}
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Editar
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
