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
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { Loader2, Plus, AlertTriangle, Package } from 'lucide-react';
import { saleSchema, type SaleFormData } from '@/lib/validations/sale';
import { saleService } from '@/services/sale';
import { productService } from '@/services/product';
import { Product } from '@/types';

interface CreateSaleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function CreateSaleModal({ open, onOpenChange, onSuccess }: CreateSaleModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<SaleFormData>({
    resolver: zodResolver(saleSchema),
    defaultValues: {
      status: 'completed',
      sale_date: new Date().toISOString().split('T')[0],
    },
  });

  // Carregar produtos ao abrir o modal
  useEffect(() => {
    if (open) {
      loadProducts();
    }
  }, [open]);

  const loadProducts = async () => {
    setLoadingProducts(true);
    try {
      const data = await productService.getAll({ active_only: true, limit: 200 });
      setProducts(data);
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
      toast.error('Erro ao carregar lista de produtos');
    } finally {
      setLoadingProducts(false);
    }
  };

  const quantity = watch('quantity');
  const unitPrice = watch('unit_price');

  // Auto-calcular total
  useEffect(() => {
    if (quantity && unitPrice) {
      setValue('total_value', quantity * unitPrice);
    }
  }, [quantity, unitPrice, setValue]);

  const onSubmit = async (data: SaleFormData) => {
    setIsLoading(true);
    try {
      // Verificar estoque disponível
      if (selectedProduct && selectedProduct.stock_quantity < data.quantity) {
        toast.error(`Estoque insuficiente! Disponível: ${selectedProduct.stock_quantity}`);
        setIsLoading(false);
        return;
      }

      await saleService.create({
        product_id: data.product_id,
        customer_name: data.customer_name,
        quantity: data.quantity,
        unit_price: data.unit_price,
        total_value: data.total_value,
        sale_date: data.sale_date,
      });

      toast.success('Venda criada com sucesso!');
      reset();
      setSelectedProduct(null);
      onOpenChange(false);
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Erro ao criar venda:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao criar venda');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    reset();
    setSelectedProduct(null);
    onOpenChange(false);
  };

  const handleProductChange = (productId: string) => {
    const product = products.find(p => p.id === parseInt(productId));
    if (product) {
      setSelectedProduct(product);
      setValue('product_id', product.id);
      setValue('unit_price', product.sale_price);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Criar Nova Venda
          </DialogTitle>
          <DialogDescription>
            Registre uma nova venda de produto
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Produto */}
          <div className="space-y-2">
            <Label htmlFor="product_id">
              Produto <span className="text-destructive">*</span>
            </Label>
            <Select
              onValueChange={handleProductChange}
              disabled={loadingProducts}
            >
              <SelectTrigger id="product_id">
                <SelectValue placeholder={loadingProducts ? 'Carregando...' : 'Selecione um produto'} />
              </SelectTrigger>
              <SelectContent>
                {products.map((product) => (
                  <SelectItem key={product.id} value={product.id.toString()}>
                    {product.name} - Estoque: {product.stock_quantity} {product.unit || 'un'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.product_id && (
              <p className="text-sm text-destructive">{errors.product_id.message}</p>
            )}
            {selectedProduct && (
              <div className="flex items-center gap-2 text-sm">
                <Package className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">
                  Preço: R$ {selectedProduct.sale_price.toFixed(2)} |
                  Estoque: {selectedProduct.stock_quantity} {selectedProduct.unit || 'un'}
                </span>
              </div>
            )}
          </div>

          {/* Estoque baixo alerta */}
          {selectedProduct && selectedProduct.stock_quantity <= selectedProduct.min_stock_level && (
            <Alert className="border-orange-200 bg-orange-50">
              <AlertTriangle className="h-4 w-4 text-orange-600" />
              <AlertDescription className="text-orange-800">
                Atenção: Estoque baixo para este produto!
              </AlertDescription>
            </Alert>
          )}

          {/* Cliente */}
          <div className="space-y-2">
            <Label htmlFor="customer_name">
              Nome do Cliente <span className="text-destructive">*</span>
            </Label>
            <Input
              id="customer_name"
              {...register('customer_name')}
              placeholder="Ex: João Silva"
            />
            {errors.customer_name && (
              <p className="text-sm text-destructive">{errors.customer_name.message}</p>
            )}
          </div>

          {/* Quantidade e Preço */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quantity">
                Quantidade <span className="text-destructive">*</span>
              </Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                {...register('quantity', { valueAsNumber: true })}
              />
              {errors.quantity && (
                <p className="text-sm text-destructive">{errors.quantity.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="unit_price">
                Preço Unitário <span className="text-destructive">*</span>
              </Label>
              <Input
                id="unit_price"
                type="number"
                step="0.01"
                placeholder="0.00"
                {...register('unit_price', { valueAsNumber: true })}
              />
              {errors.unit_price && (
                <p className="text-sm text-destructive">{errors.unit_price.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="total_value">Valor Total</Label>
              <Input
                id="total_value"
                type="number"
                step="0.01"
                placeholder="0.00"
                {...register('total_value', { valueAsNumber: true })}
                readOnly
                className="bg-muted font-semibold text-green-600"
              />
              <p className="text-xs text-muted-foreground">Calculado automaticamente</p>
            </div>
          </div>

          {/* Data da Venda */}
          <div className="space-y-2">
            <Label htmlFor="sale_date">
              Data da Venda <span className="text-destructive">*</span>
            </Label>
            <Input
              id="sale_date"
              type="date"
              {...register('sale_date')}
            />
            {errors.sale_date && (
              <p className="text-sm text-destructive">{errors.sale_date.message}</p>
            )}
          </div>

          {/* Observações */}
          <div className="space-y-2">
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              {...register('notes')}
              placeholder="Informações adicionais sobre a venda..."
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
              Criar Venda
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
