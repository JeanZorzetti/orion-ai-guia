'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Loader2, Edit } from 'lucide-react';
import { invoiceUpdateSchema, type InvoiceUpdateFormData } from '@/lib/validations/invoice';
import { invoiceService } from '@/services/invoice';
import { supplierService } from '@/services/supplier';
import { Invoice, Supplier } from '@/types';

interface EditInvoiceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoice: Invoice | null;
  onSuccess?: () => void;
}

export function EditInvoiceModal({ open, onOpenChange, invoice, onSuccess }: EditInvoiceModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loadingSuppliers, setLoadingSuppliers] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<InvoiceUpdateFormData>({
    resolver: zodResolver(invoiceUpdateSchema),
  });

  // Carregar fornecedores ao abrir o modal
  useEffect(() => {
    if (open) {
      loadSuppliers();
    }
  }, [open]);

  // Pré-preencher formulário quando a fatura muda
  useEffect(() => {
    if (invoice && open) {
      setValue('supplier_id', invoice.supplier_id);
      setValue('invoice_number', invoice.invoice_number);
      setValue('invoice_date', invoice.invoice_date.split('T')[0]); // Remover timestamp
      setValue('due_date', invoice.due_date ? invoice.due_date.split('T')[0] : undefined);
      setValue('total_value', invoice.total_value);
      setValue('net_value', invoice.net_value);
      setValue('tax_value', invoice.tax_value);
      setValue('status', invoice.status);
      setValue('category', invoice.category);
      setValue('notes', invoice.description);
    }
  }, [invoice, open, setValue]);

  const loadSuppliers = async () => {
    setLoadingSuppliers(true);
    try {
      const data = await supplierService.getAll({ active_only: true });
      setSuppliers(data);
    } catch (error) {
      console.error('Erro ao carregar fornecedores:', error);
      toast.error('Erro ao carregar lista de fornecedores');
    } finally {
      setLoadingSuppliers(false);
    }
  };

  const onSubmit = async (data: InvoiceUpdateFormData) => {
    if (!invoice) return;

    setIsLoading(true);
    try {
      // Remover campos undefined para não enviar ao backend
      const updateData = Object.fromEntries(
        Object.entries({
          supplier_id: data.supplier_id,
          invoice_number: data.invoice_number,
          invoice_date: data.invoice_date,
          due_date: data.due_date,
          total_value: data.total_value,
          net_value: data.net_value,
          tax_value: data.tax_value,
          status: data.status,
          category: data.category,
          description: data.notes,
        }).filter(([_, v]) => v !== undefined)
      );

      await invoiceService.update(invoice.id, updateData);

      toast.success('Fatura atualizada com sucesso!');
      reset();
      onOpenChange(false);
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Erro ao atualizar fatura:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao atualizar fatura');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    reset();
    onOpenChange(false);
  };

  // Auto-calcular valores quando total_value ou tax_value mudam
  const totalValue = watch('total_value');
  const taxValue = watch('tax_value');

  useEffect(() => {
    if (totalValue && taxValue !== undefined) {
      const netValue = totalValue - taxValue;
      setValue('net_value', netValue);
    } else if (totalValue && taxValue === undefined) {
      setValue('net_value', totalValue);
    }
  }, [totalValue, taxValue, setValue]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5" />
            Editar Fatura
          </DialogTitle>
          <DialogDescription>
            Atualize os dados da fatura #{invoice?.invoice_number}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Fornecedor */}
          <div className="space-y-2">
            <Label htmlFor="supplier_id">Fornecedor</Label>
            <Select
              value={watch('supplier_id')?.toString()}
              onValueChange={(value) => setValue('supplier_id', parseInt(value))}
              disabled={loadingSuppliers}
            >
              <SelectTrigger id="supplier_id">
                <SelectValue placeholder={loadingSuppliers ? 'Carregando...' : 'Selecione um fornecedor'} />
              </SelectTrigger>
              <SelectContent>
                {suppliers.map((supplier) => (
                  <SelectItem key={supplier.id} value={supplier.id.toString()}>
                    {supplier.name} {supplier.document && `(${supplier.document})`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.supplier_id && (
              <p className="text-sm text-destructive">{errors.supplier_id.message}</p>
            )}
          </div>

          {/* Número e Categoria */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="invoice_number">Número da Fatura</Label>
              <Input
                id="invoice_number"
                {...register('invoice_number')}
                placeholder="Ex: NF-12345"
              />
              {errors.invoice_number && (
                <p className="text-sm text-destructive">{errors.invoice_number.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Categoria</Label>
              <Input
                id="category"
                {...register('category')}
                placeholder="Ex: Serviços, Material"
              />
              {errors.category && (
                <p className="text-sm text-destructive">{errors.category.message}</p>
              )}
            </div>
          </div>

          {/* Datas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="invoice_date">Data de Emissão</Label>
              <Input
                id="invoice_date"
                type="date"
                {...register('invoice_date')}
              />
              {errors.invoice_date && (
                <p className="text-sm text-destructive">{errors.invoice_date.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="due_date">Data de Vencimento</Label>
              <Input
                id="due_date"
                type="date"
                {...register('due_date')}
              />
              {errors.due_date && (
                <p className="text-sm text-destructive">{errors.due_date.message}</p>
              )}
            </div>
          </div>

          {/* Valores */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="total_value">Valor Total</Label>
              <Input
                id="total_value"
                type="number"
                step="0.01"
                placeholder="0.00"
                {...register('total_value', { valueAsNumber: true })}
              />
              {errors.total_value && (
                <p className="text-sm text-destructive">{errors.total_value.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="tax_value">Impostos</Label>
              <Input
                id="tax_value"
                type="number"
                step="0.01"
                placeholder="0.00"
                {...register('tax_value', { valueAsNumber: true })}
              />
              {errors.tax_value && (
                <p className="text-sm text-destructive">{errors.tax_value.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="net_value">Valor Líquido</Label>
              <Input
                id="net_value"
                type="number"
                step="0.01"
                placeholder="0.00"
                {...register('net_value', { valueAsNumber: true })}
                readOnly
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">Calculado automaticamente</p>
            </div>
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={watch('status')}
              onValueChange={(value) => setValue('status', value as 'pending' | 'validated' | 'paid' | 'cancelled')}
            >
              <SelectTrigger id="status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pendente</SelectItem>
                <SelectItem value="validated">Validado</SelectItem>
                <SelectItem value="paid">Pago</SelectItem>
                <SelectItem value="cancelled">Cancelado</SelectItem>
              </SelectContent>
            </Select>
            {errors.status && (
              <p className="text-sm text-destructive">{errors.status.message}</p>
            )}
          </div>

          {/* Observações */}
          <div className="space-y-2">
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              {...register('notes')}
              placeholder="Informações adicionais sobre a fatura..."
              rows={3}
            />
            {errors.notes && (
              <p className="text-sm text-destructive">{errors.notes.message}</p>
            )}
          </div>

          {/* Botões */}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar Alterações
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
