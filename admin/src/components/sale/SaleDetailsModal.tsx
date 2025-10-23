'use client';

import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Eye, Edit, Trash2, User, Package, Calendar, DollarSign } from 'lucide-react';
import { Sale } from '@/types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface SaleDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sale: Sale | null;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function SaleDetailsModal({
  open,
  onOpenChange,
  sale,
  onEdit,
  onDelete
}: SaleDetailsModalProps) {
  if (!sale) return null;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd/MM/yyyy HH:mm', { locale: ptBR });
    } catch {
      return 'Data inválida';
    }
  };

  const getStatusBadge = (status: Sale['status']) => {
    const variants = {
      pending: { label: 'Pendente', className: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
      completed: { label: 'Concluída', className: 'bg-green-100 text-green-800 border-green-200' },
      cancelled: { label: 'Cancelada', className: 'bg-red-100 text-red-800 border-red-200' },
    };

    const variant = variants[status] || variants.pending;
    return <Badge variant="outline" className={variant.className}>{variant.label}</Badge>;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Detalhes da Venda
          </DialogTitle>
          <DialogDescription>
            Visualize todas as informações da venda
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Cabeçalho */}
          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <div>
              <p className="text-sm text-muted-foreground">Cliente</p>
              <p className="text-2xl font-bold">{sale.customer_name}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground mb-1">Status</p>
              {getStatusBadge(sale.status)}
            </div>
          </div>

          {/* Produto */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Package className="h-5 w-5" />
                Produto
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-semibold">{sale.product?.name || `Produto #${sale.product_id}`}</p>
              {sale.product?.sku && (
                <p className="text-sm text-muted-foreground">SKU: {sale.product.sku}</p>
              )}
            </CardContent>
          </Card>

          {/* Valores */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <DollarSign className="h-5 w-5" />
                Valores
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Quantidade</p>
                  <p className="text-xl font-bold">{sale.quantity}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Preço Unitário</p>
                  <p className="text-xl font-semibold">{formatCurrency(sale.unit_price)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total</p>
                  <p className="text-xl font-bold text-green-600">{formatCurrency(sale.total_value)}</p>
                </div>
              </div>
              <Separator />
              <p className="text-sm text-muted-foreground">
                Cálculo: {sale.quantity} × {formatCurrency(sale.unit_price)} = {formatCurrency(sale.total_value)}
              </p>
            </CardContent>
          </Card>

          {/* Data */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Calendar className="h-5 w-5" />
                Data da Venda
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-semibold">{formatDate(sale.sale_date)}</p>
            </CardContent>
          </Card>

          {/* Metadados */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Informações do Sistema</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">ID da Venda</p>
                  <p className="font-medium">#{sale.id}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Workspace ID</p>
                  <p className="font-medium">#{sale.workspace_id}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Criado em</p>
                  <p className="font-medium">{formatDate(sale.created_at)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Última atualização</p>
                  <p className="font-medium">{formatDate(sale.updated_at)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Botões */}
          <div className="flex justify-between gap-3 pt-4">
            <Button variant="outline" onClick={onOpenChange.bind(null, false)}>
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
