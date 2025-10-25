'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Eye, Edit, Trash2, Package, DollarSign, TrendingUp, AlertTriangle, CheckCircle, BarChart3 } from 'lucide-react';
import { Product } from '@/types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useDemandForecast } from '@/hooks/useDemandForecast';
import { DemandForecastView } from './DemandForecastView';

interface ProductDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: Product | null;
  onEdit?: () => void;
  onDelete?: () => void;
  onAdjustStock?: () => void;
}

export function ProductDetailsModal({
  open,
  onOpenChange,
  product,
  onEdit,
  onDelete,
  onAdjustStock
}: ProductDetailsModalProps) {
  const [activeTab, setActiveTab] = useState('details');

  // Hook para carregar previsão de demanda
  const { data: forecast, loading: forecastLoading, error: forecastError, refetch: refetchForecast } = useDemandForecast(
    product?.id || null,
    { enabled: open && activeTab === 'forecast' }
  );

  if (!product) return null;

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
      return format(new Date(dateString), 'dd/MM/yyyy HH:mm', { locale: ptBR });
    } catch {
      return 'Data inválida';
    }
  };

  const calculateProfitMargin = () => {
    if (!product.cost_price || product.cost_price === 0) return 0;
    return ((product.sale_price - product.cost_price) / product.cost_price) * 100;
  };

  const getStockStatus = () => {
    if (product.stock_quantity === 0) {
      return {
        label: 'Esgotado',
        icon: AlertTriangle,
        className: 'bg-red-100 text-red-800 border-red-200',
      };
    } else if (product.stock_quantity <= product.min_stock_level) {
      return {
        label: 'Estoque Baixo',
        icon: AlertTriangle,
        className: 'bg-orange-100 text-orange-800 border-orange-200',
      };
    } else {
      return {
        label: 'Em Estoque',
        icon: CheckCircle,
        className: 'bg-green-100 text-green-800 border-green-200',
      };
    }
  };

  const stockStatus = getStockStatus();
  const StockIcon = stockStatus.icon;
  const profitMargin = calculateProfitMargin();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Detalhes do Produto
          </DialogTitle>
          <DialogDescription>
            Visualize todas as informações do produto
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="details">
              <Eye className="mr-2 h-4 w-4" />
              Detalhes
            </TabsTrigger>
            <TabsTrigger value="forecast">
              <BarChart3 className="mr-2 h-4 w-4" />
              Previsão de Demanda
            </TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-6 mt-6">
            {/* Cabeçalho com nome e status */}
            <div className="flex items-start justify-between p-4 bg-muted rounded-lg">
            <div className="flex-1">
              <h2 className="text-2xl font-bold">{product.name}</h2>
              {product.sku && (
                <p className="text-sm text-muted-foreground mt-1">SKU: {product.sku}</p>
              )}
              {product.category && (
                <Badge variant="outline" className="mt-2">{product.category}</Badge>
              )}
            </div>
            <div className="flex flex-col items-end gap-2">
              <Badge
                variant="outline"
                className={product.active ? 'bg-green-100 text-green-800 border-green-200' : 'bg-gray-100 text-gray-800 border-gray-200'}
              >
                {product.active ? 'Ativo' : 'Inativo'}
              </Badge>
              <Badge variant="outline" className={stockStatus.className}>
                <StockIcon className="h-3 w-3 mr-1" />
                {stockStatus.label}
              </Badge>
            </div>
          </div>

          {/* Descrição */}
          {product.description && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Descrição</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{product.description}</p>
              </CardContent>
            </Card>
          )}

          {/* Estoque */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Package className="h-5 w-5" />
                Informações de Estoque
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Quantidade Atual</p>
                  <p className="text-2xl font-bold">
                    {product.stock_quantity} {product.unit}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Estoque Mínimo</p>
                  <p className="text-2xl font-semibold text-orange-600">
                    {product.min_stock_level} {product.unit}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Unidade</p>
                  <p className="text-2xl font-semibold uppercase">{product.unit}</p>
                </div>
              </div>

              {onAdjustStock && (
                <>
                  <Separator className="my-4" />
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      onOpenChange(false);
                      onAdjustStock();
                    }}
                  >
                    <Package className="mr-2 h-4 w-4" />
                    Ajustar Estoque
                  </Button>
                </>
              )}
            </CardContent>
          </Card>

          {/* Preços e Margem */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <DollarSign className="h-5 w-5" />
                Preços e Lucratividade
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Preço de Custo</p>
                  <p className="text-xl font-semibold text-blue-600">
                    {formatCurrency(product.cost_price)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Preço de Venda</p>
                  <p className="text-xl font-bold text-primary">
                    {formatCurrency(product.sale_price)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <TrendingUp className="h-4 w-4" />
                    Margem de Lucro
                  </p>
                  <p className={`text-xl font-bold ${profitMargin > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {profitMargin.toFixed(2)}%
                  </p>
                </div>
              </div>

              <Separator />

              <div className="text-sm text-muted-foreground space-y-1">
                <p>
                  Lucro por unidade: <span className="font-semibold text-foreground">
                    {formatCurrency((product.sale_price || 0) - (product.cost_price || 0))}
                  </span>
                </p>
                <p>
                  Valor total em estoque (custo): <span className="font-semibold text-foreground">
                    {formatCurrency((product.cost_price || 0) * product.stock_quantity)}
                  </span>
                </p>
                <p>
                  Valor total em estoque (venda): <span className="font-semibold text-foreground">
                    {formatCurrency(product.sale_price * product.stock_quantity)}
                  </span>
                </p>
              </div>
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
                  <p className="text-muted-foreground">ID do Produto</p>
                  <p className="font-medium">#{product.id}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Workspace ID</p>
                  <p className="font-medium">#{product.workspace_id}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Criado em</p>
                  <p className="font-medium">{formatDate(product.created_at)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Última atualização</p>
                  <p className="font-medium">{formatDate(product.updated_at)}</p>
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
          </TabsContent>

          <TabsContent value="forecast" className="mt-6">
            <DemandForecastView
              productId={product.id}
              data={forecast}
              loading={forecastLoading}
              error={forecastError}
              onDataGenerated={refetchForecast}
            />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
