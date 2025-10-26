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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Loader2, Plus, TrendingUp, Shield } from 'lucide-react';
import { productSchema, type ProductFormData } from '@/lib/validations/product';
import { productService } from '@/services/product';

interface CreateProductModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function CreateProductModal({ open, onOpenChange, onSuccess }: CreateProductModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [profitMargin, setProfitMargin] = useState<number>(0);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      active: true,
      stock_quantity: 0,
      min_stock_level: 0,
      unit: 'un',
      origin: 0, // Nacional
    },
  });

  const costPrice = watch('cost_price');
  const salePrice = watch('sale_price');

  // Calcular margem de lucro
  useEffect(() => {
    if (costPrice && salePrice && costPrice > 0) {
      const margin = ((salePrice - costPrice) / costPrice) * 100;
      setProfitMargin(margin);
    } else {
      setProfitMargin(0);
    }
  }, [costPrice, salePrice]);

  const onSubmit = async (data: ProductFormData) => {
    setIsLoading(true);
    try {
      await productService.create({
        name: data.name,
        sku: data.sku,
        description: data.description,
        category: data.category,
        cost_price: data.cost_price,
        sale_price: data.sale_price,
        stock_quantity: data.stock_quantity,
        min_stock_level: data.min_stock_level,
        unit: data.unit,
        // Campos fiscais
        ncm_code: data.ncm_code,
        origin: data.origin,
        cest_code: data.cest_code,
        fiscal_description: data.fiscal_description,
      });

      toast.success('Produto criado com sucesso!');
      reset();
      onOpenChange(false);
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Erro ao criar produto:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao criar produto');
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
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Criar Novo Produto
          </DialogTitle>
          <DialogDescription>
            Adicione um novo produto ao seu estoque
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Informações Básicas */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm text-muted-foreground">Informações Básicas</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">
                  Nome do Produto <span className="text-destructive">*</span>
                </Label>
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
                />
                {errors.sku && (
                  <p className="text-sm text-destructive">{errors.sku.message}</p>
                )}
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
                <Label htmlFor="cost_price">
                  Preço de Custo <span className="text-destructive">*</span>
                </Label>
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
                <Label htmlFor="sale_price">
                  Preço de Venda <span className="text-destructive">*</span>
                </Label>
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
                <Label htmlFor="stock_quantity">
                  Quantidade Inicial <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="stock_quantity"
                  type="number"
                  {...register('stock_quantity', { valueAsNumber: true })}
                />
                {errors.stock_quantity && (
                  <p className="text-sm text-destructive">{errors.stock_quantity.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="min_stock_level">
                  Estoque Mínimo <span className="text-destructive">*</span>
                </Label>
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

          {/* Dados Fiscais */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-muted-foreground" />
              <h3 className="font-semibold text-sm text-muted-foreground">Dados Fiscais (NF-e)</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="ncm_code">
                  NCM (Código) <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="ncm_code"
                  {...register('ncm_code')}
                  placeholder="Ex: 84713012"
                  maxLength={8}
                />
                {errors.ncm_code && (
                  <p className="text-sm text-destructive">{errors.ncm_code.message}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  8 dígitos. Obrigatório para emissão de NF-e.
                  <a
                    href="https://www.gov.br/receitafederal/pt-br/assuntos/aduana-e-comercio-exterior/manuais/ncm"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-1 text-primary hover:underline"
                  >
                    Consultar NCM
                  </a>
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="origin">
                  Origem da Mercadoria <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={watch('origin')?.toString() || '0'}
                  onValueChange={(value) => setValue('origin', parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">0 - Nacional</SelectItem>
                    <SelectItem value="1">1 - Estrangeira (importação direta)</SelectItem>
                    <SelectItem value="2">2 - Estrangeira (adquirida no mercado interno)</SelectItem>
                    <SelectItem value="3">3 - Nacional com &gt;40% de conteúdo estrangeiro</SelectItem>
                    <SelectItem value="4">4 - Nacional conforme processos produtivos básicos</SelectItem>
                    <SelectItem value="5">5 - Nacional com &lt;40% de conteúdo estrangeiro</SelectItem>
                    <SelectItem value="6">6 - Estrangeira (importação direta) sem similar nacional</SelectItem>
                    <SelectItem value="7">7 - Estrangeira (mercado interno) sem similar nacional</SelectItem>
                    <SelectItem value="8">8 - Nacional com &gt;70% de conteúdo estrangeiro</SelectItem>
                  </SelectContent>
                </Select>
                {errors.origin && (
                  <p className="text-sm text-destructive">{errors.origin.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cest_code">CEST (opcional)</Label>
                <Input
                  id="cest_code"
                  {...register('cest_code')}
                  placeholder="Ex: 0100100"
                  maxLength={7}
                />
                {errors.cest_code && (
                  <p className="text-sm text-destructive">{errors.cest_code.message}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  7 dígitos. Obrigatório para produtos sujeitos à ST.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="fiscal_description">Descrição Fiscal (opcional)</Label>
                <Input
                  id="fiscal_description"
                  {...register('fiscal_description')}
                  placeholder="Descrição para NF-e (se diferente)"
                />
                {errors.fiscal_description && (
                  <p className="text-sm text-destructive">{errors.fiscal_description.message}</p>
                )}
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
              Criar Produto
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
