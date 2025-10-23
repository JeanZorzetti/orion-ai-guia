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
import { saleUpdateSchema, type SaleUpdateFormData } from '@/lib/validations/sale';
import { saleService } from '@/services/sale';
import { Sale } from '@/types';

interface EditSaleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sale: Sale | null;
  onSuccess?: () => void;
}

export function EditSaleModal({ open, onOpenChange, sale, onSuccess }: EditSaleModalProps) {
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<SaleUpdateFormData>({
    resolver: zodResolver(saleUpdateSchema),
  });

  useEffect(() => {
    if (sale && open) {
      setValue('customer_name', sale.customer_name);
      setValue('quantity', sale.quantity);
      setValue('unit_price', sale.unit_price);
      setValue('total_value', sale.total_value);
      setValue('sale_date', sale.sale_date.split('T')[0]);
      setValue('status', sale.status);
      setValue('notes', sale.customer_document);
    }
  }, [sale, open, setValue]);

  const quantity = watch('quantity');
  const unitPrice = watch('unit_price');

  useEffect(() => {
    if (quantity && unitPrice) {
      setValue('total_value', quantity * unitPrice);
    }
  }, [quantity, unitPrice, setValue]);

  const onSubmit = async (data: SaleUpdateFormData) => {
    if (!sale) return;

    setIsLoading(true);
    try {
      const updateData = Object.fromEntries(
        Object.entries(data).filter(([_, v]) => v !== undefined)
      );

      await saleService.update(sale.id, updateData);

      toast.success('Venda atualizada com sucesso!');
      reset();
      onOpenChange(false);
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Erro ao atualizar venda:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao atualizar venda');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5" />
            Editar Venda
          </DialogTitle>
          <DialogDescription>
            Atualize as informações da venda
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="customer_name">Nome do Cliente</Label>
            <Input id="customer_name" {...register('customer_name')} />
            {errors.customer_name && (
              <p className="text-sm text-destructive">{errors.customer_name.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantidade</Label>
              <Input id="quantity" type="number" {...register('quantity', { valueAsNumber: true })} />
              {errors.quantity && (
                <p className="text-sm text-destructive">{errors.quantity.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="unit_price">Preço Unitário</Label>
              <Input id="unit_price" type="number" step="0.01" {...register('unit_price', { valueAsNumber: true })} />
              {errors.unit_price && (
                <p className="text-sm text-destructive">{errors.unit_price.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="total_value">Total</Label>
              <Input
                id="total_value"
                type="number"
                step="0.01"
                {...register('total_value', { valueAsNumber: true })}
                readOnly
                className="bg-muted font-semibold"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="sale_date">Data da Venda</Label>
            <Input id="sale_date" type="date" {...register('sale_date')} />
            {errors.sale_date && (
              <p className="text-sm text-destructive">{errors.sale_date.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select value={watch('status')} onValueChange={(value) => setValue('status', value as 'pending' | 'completed' | 'cancelled')}>
              <SelectTrigger id="status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pendente</SelectItem>
                <SelectItem value="completed">Concluída</SelectItem>
                <SelectItem value="cancelled">Cancelada</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Observações</Label>
            <Textarea id="notes" {...register('notes')} rows={3} />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={handleCancel} disabled={isLoading}>
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
