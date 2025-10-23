'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { Loader2, Edit, TrendingUp, AlertCircle } from 'lucide-react';
import { productUpdateSchema, type ProductUpdateFormData } from '@/lib/validations/product';
import { productService } from '@/services/product';
import { Product } from '@/types';

interface EditProductModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: Product | null;
  onSuccess?: () => void;
}

export function EditProductModal({ open, onOpenChange, product, onSuccess }: EditProductModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [profitMargin, setProfitMargin] = useState<number>(0);
  const [stockChanged, setStockChanged] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm<ProductUpdateFormData>({
    resolver: zodResolver(productUpdateSchema),
  });

  // Pré-preencher formulário quando o produto muda
  useEffect(() => {
    if (product && open) {
      setValue('name', product.name);
      setValue('sku', product.sku);
      setValue('description', product.description);
      setValue('category', product.category);
      setValue('cost_price', product.cost_price);
      setValue('sale_price', product.sale_price);
      setValue('stock_quantity', product.stock_quantity);
      setValue('min_stock_level', product.min_stock_level);
      setValue('unit', product.unit);
      setValue('active', product.active);
      setStockChanged(false);
    }
  }, [product, open, setValue]);

  const costPrice = watch('cost_price');
  const salePrice = watch('sale_price');
  const stockQuantity = watch('stock_quantity');

  // Calcular margem de lucro
  useEffect(() => {
    if (costPrice && salePrice && costPrice > 0) {
      const margin = ((salePrice - costPrice) / costPrice) * 100;
      setProfitMargin(margin);
    } else {
      setProfitMargin(0);
    }
  }, [costPrice, salePrice]);

  // Detectar mudança no estoque
  useEffect(() => {
    if (product && stockQuantity !== undefined && stockQuantity !== product.stock_quantity) {
      setStockChanged(true);
    } else {
      setStockChanged(false);
    }
  }, [stockQuantity, product]);

  const onSubmit = async (data: ProductUpdateFormData) => {
    if (!product) return;

    setIsLoading(true);
    try {
      // Remover campos undefined
      const updateData = Object.fromEntries(
        Object.entries({
          name: data.name,
          sku: data.sku,
          description: data.description,
          category: data.category,
          cost_price: data.cost_price,
          sale_price: data.sale_price,
          stock_quantity: data.stock_quantity,
          min_stock_level: data.min_stock_level,
          unit: data.unit,
          active: data.active,
        }).filter(([_, v]) => v !== undefined)
      );

      await productService.update(product.id, updateData);

      toast.success('Produto atualizado com sucesso!');
      reset();
      onOpenChange(false);
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Erro ao atualizar produto:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao atualizar produto');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    reset();
    setStockChanged(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5" />
            Editar Produto
          </DialogTitle>
          <DialogDescription>
            Atualize as informações do produto {product?.name}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Alerta de estoque alterado */}
          {stockChanged && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Você está alterando o estoque manualmente. Use o botão &ldquo;Ajustar Estoque&rdquo; para
                registrar entradas/saídas com motivo e histórico de auditoria.
              </AlertDescription>
            </Alert>
          )}

          {/* Informações Básicas */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm text-muted-foreground">Informações Básicas</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome do Produto</Label>
                <Input
                  id="name"
                  {...register('name')}
                  placeholder="Ex: Notebook Dell Inspiron"
                />
                {errors.name && (
                  <p className="text-sm text-destructive">{errors.name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="sku">SKU / Código</Label>
                <Input
                  id="sku"
                  {...register('sku')}
                  placeholder="Ex: NB-DELL-001"
                  readOnly
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">SKU não pode ser alterado</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Categoria</Label>
                <Input
                  id="category"
                  {...register('category')}
                  placeholder="Ex: Eletrônicos, Informática"
                />
                {errors.category && (
                  <p className="text-sm text-destructive">{errors.category.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="unit">Unidade de Medida</Label>
                <Input
                  id="unit"
                  {...register('unit')}
                  placeholder="Ex: un, kg, lt"
                />
                {errors.unit && (
                  <p className="text-sm text-destructive">{errors.unit.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                {...register('description')}
                placeholder="Descrição detalhada do produto..."
                rows={3}
              />
              {errors.description && (
                <p className="text-sm text-destructive">{errors.description.message}</p>
              )}
            </div>
          </div>

          {/* Preços */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm text-muted-foreground">Preços</h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cost_price">Preço de Custo</Label>
                <Input
                  id="cost_price"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  {...register('cost_price', { valueAsNumber: true })}
                />
                {errors.cost_price && (
                  <p className="text-sm text-destructive">{errors.cost_price.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="sale_price">Preço de Venda</Label>
                <Input
                  id="sale_price"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  {...register('sale_price', { valueAsNumber: true })}
                />
                {errors.sale_price && (
                  <p className="text-sm text-destructive">{errors.sale_price.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Margem de Lucro
                </Label>
                <Input
                  value={profitMargin.toFixed(2) + '%'}
                  readOnly
                  className={`bg-muted font-semibold ${
                    profitMargin > 0 ? 'text-green-600' : 'text-muted-foreground'
                  }`}
                />
                <p className="text-xs text-muted-foreground">Calculado automaticamente</p>
              </div>
            </div>
          </div>

          {/* Estoque */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm text-muted-foreground">Estoque</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="stock_quantity">Quantidade em Estoque</Label>
                <Input
                  id="stock_quantity"
                  type="number"
                  {...register('stock_quantity', { valueAsNumber: true })}
                  className={stockChanged ? 'border-orange-500' : ''}
                />
                {errors.stock_quantity && (
                  <p className="text-sm text-destructive">{errors.stock_quantity.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="min_stock_level">Estoque Mínimo</Label>
                <Input
                  id="min_stock_level"
                  type="number"
                  {...register('min_stock_level', { valueAsNumber: true })}
                />
                {errors.min_stock_level && (
                  <p className="text-sm text-destructive">{errors.min_stock_level.message}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  Você será alertado quando o estoque atingir este nível
                </p>
              </div>
            </div>
          </div>

          {/* Status */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="space-y-0.5">
              <Label htmlFor="active" className="text-base">Produto Ativo</Label>
              <p className="text-sm text-muted-foreground">
                Produtos ativos aparecem nas listagens e podem ser vendidos
              </p>
            </div>
            <Switch
              id="active"
              checked={watch('active')}
              onCheckedChange={(checked) => setValue('active', checked)}
            />
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
