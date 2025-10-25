'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { toast } from 'sonner';
import { Loader2, Package, TrendingUp, TrendingDown, RefreshCw, Info } from 'lucide-react';
import { stockAdjustmentSchema, type StockAdjustmentFormData } from '@/lib/validations/product';
import { productService } from '@/services/product';
import { Product } from '@/types';

interface AdjustStockModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: Product | null;
  onSuccess?: () => void;
}

export function AdjustStockModal({ open, onOpenChange, product, onSuccess }: AdjustStockModalProps) {
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm<StockAdjustmentFormData>({
    resolver: zodResolver(stockAdjustmentSchema),
    defaultValues: {
      adjustment_type: 'in',
      quantity: 0,
    },
  });

  const adjustmentType = watch('adjustment_type');
  const quantity = watch('quantity');

  const onSubmit = async (data: StockAdjustmentFormData) => {
    if (!product) return;

    setIsLoading(true);
    try {
      // Chamar novo endpoint de ajuste de estoque
      const result = await productService.adjustStock(product.id, {
        adjustment_type: data.adjustment_type,
        quantity: data.quantity,
        reason: data.reason,
      });

      toast.success(result.message);
      reset();
      onOpenChange(false);
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Erro ao ajustar estoque:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao ajustar estoque');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    reset();
    onOpenChange(false);
  };

  const getNewStockQuantity = () => {
    if (!product || !quantity) return product?.stock_quantity || 0;

    switch (adjustmentType) {
      case 'in':
        return product.stock_quantity + quantity;
      case 'out':
        return Math.max(0, product.stock_quantity - quantity);
      case 'correction':
        return quantity;
      default:
        return product.stock_quantity;
    }
  };

  const adjustmentTypeConfig = {
    in: {
      label: 'Entrada',
      description: 'Adicionar produtos ao estoque',
      icon: TrendingUp,
      color: 'text-green-600',
      examples: 'Ex: compra de fornecedor, produção interna, devolução de cliente',
    },
    out: {
      label: 'Saída',
      description: 'Remover produtos do estoque',
      icon: TrendingDown,
      color: 'text-red-600',
      examples: 'Ex: venda, perda, dano, transferência',
    },
    correction: {
      label: 'Correção',
      description: 'Definir quantidade exata no estoque',
      icon: RefreshCw,
      color: 'text-blue-600',
      examples: 'Ex: inventário físico, ajuste por erro de lançamento',
    },
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Ajustar Estoque
          </DialogTitle>
          <DialogDescription>
            Registre entradas, saídas ou correções no estoque de {product?.name}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Estoque Atual */}
          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>Estoque Atual</AlertTitle>
            <AlertDescription className="flex items-baseline gap-2">
              <span className="text-2xl font-bold">{product?.stock_quantity}</span>
              <span className="text-sm">{product?.unit}</span>
              {product && product.stock_quantity <= product.min_stock_level && (
                <span className="text-xs text-orange-600 ml-2">
                  (Estoque baixo - mínimo: {product.min_stock_level})
                </span>
              )}
            </AlertDescription>
          </Alert>

          {/* Tipo de Ajuste */}
          <div className="space-y-3">
            <Label>Tipo de Ajuste</Label>
            <RadioGroup
              value={adjustmentType}
              onValueChange={(value) => setValue('adjustment_type', value as 'in' | 'out' | 'correction')}
              className="space-y-3"
            >
              {Object.entries(adjustmentTypeConfig).map(([key, config]) => {
                const Icon = config.icon;
                return (
                  <div
                    key={key}
                    className={`flex items-start space-x-3 p-4 border rounded-lg cursor-pointer transition-colors ${
                      adjustmentType === key ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
                    }`}
                    onClick={() => setValue('adjustment_type', key as 'in' | 'out' | 'correction')}
                  >
                    <RadioGroupItem value={key} id={key} className="mt-1" />
                    <div className="flex-1">
                      <Label htmlFor={key} className="flex items-center gap-2 cursor-pointer">
                        <Icon className={`h-4 w-4 ${config.color}`} />
                        <span className="font-semibold">{config.label}</span>
                      </Label>
                      <p className="text-sm text-muted-foreground mt-1">{config.description}</p>
                      <p className="text-xs text-muted-foreground mt-1 italic">{config.examples}</p>
                    </div>
                  </div>
                );
              })}
            </RadioGroup>
          </div>

          {/* Quantidade */}
          <div className="space-y-2">
            <Label htmlFor="quantity">
              Quantidade <span className="text-destructive">*</span>
            </Label>
            <div className="flex gap-2 items-end">
              <div className="flex-1">
                <Input
                  id="quantity"
                  type="number"
                  min="0"
                  step="1"
                  {...register('quantity', { valueAsNumber: true })}
                />
                {errors.quantity && (
                  <p className="text-sm text-destructive mt-1">{errors.quantity.message}</p>
                )}
              </div>
              <div className="text-sm text-muted-foreground min-w-[100px] text-right pb-2">
                = {getNewStockQuantity()} {product?.unit}
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              {adjustmentType === 'correction'
                ? 'Defina a quantidade correta que deve constar no estoque'
                : 'Quantidade a ser ajustada'}
            </p>
          </div>

          {/* Motivo */}
          <div className="space-y-2">
            <Label htmlFor="reason">
              Motivo do Ajuste <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="reason"
              {...register('reason')}
              placeholder="Descreva o motivo do ajuste de estoque..."
              rows={3}
            />
            {errors.reason && (
              <p className="text-sm text-destructive">{errors.reason.message}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Este registro ficará salvo para auditoria e rastreabilidade
            </p>
          </div>

          {/* Preview do resultado */}
          {quantity > 0 && (
            <Alert className={
              adjustmentType === 'in' ? 'border-green-200 bg-green-50' :
              adjustmentType === 'out' ? 'border-red-200 bg-red-50' :
              'border-blue-200 bg-blue-50'
            }>
              <Package className="h-4 w-4" />
              <AlertTitle>Resumo do Ajuste</AlertTitle>
              <AlertDescription className="space-y-1">
                <p>
                  {adjustmentType === 'in' && `Adicionar ${quantity} ${product?.unit} ao estoque`}
                  {adjustmentType === 'out' && `Remover ${quantity} ${product?.unit} do estoque`}
                  {adjustmentType === 'correction' && `Ajustar estoque para ${quantity} ${product?.unit}`}
                </p>
                <p className="font-semibold">
                  Estoque atual: {product?.stock_quantity} → Novo estoque: {getNewStockQuantity()}
                </p>
              </AlertDescription>
            </Alert>
          )}

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
              Confirmar Ajuste
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
