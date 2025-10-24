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
import { Loader2, Plus } from 'lucide-react';
import { invoiceSchema, type InvoiceFormData } from '@/lib/validations/invoice';
import { invoiceService } from '@/services/invoice';
import { supplierService } from '@/services/supplier';
import { Supplier, InvoiceExtractionResponse } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CheckCircle, AlertTriangle } from 'lucide-react';

interface CreateInvoiceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  initialData?: InvoiceExtractionResponse | null;
}

export function CreateInvoiceModal({ open, onOpenChange, onSuccess, initialData }: CreateInvoiceModalProps) {
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
  } = useForm<InvoiceFormData>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      status: 'pending',
    },
  });

  // Carregar fornecedores ao abrir o modal
  useEffect(() => {
    if (open) {
      loadSuppliers();
    }
  }, [open]);

  // Preencher formulário com dados extraídos pela IA
  useEffect(() => {
    if (initialData?.success && initialData.extracted_data) {
      const data = initialData.extracted_data;
      const suggestions = initialData.suggestions;

      // Preencher campos
      setValue('invoice_number', data.invoice_number || '');
      setValue('invoice_date', data.invoice_date || '');
      setValue('due_date', data.due_date || '');
      setValue('total_value', data.total_value || 0);
      setValue('tax_value', data.tax_value || 0);
      setValue('net_value', data.net_value || 0);
      setValue('category', data.category || '');
      setValue('notes', data.description || '');

      // Selecionar fornecedor automaticamente se houver match com alta confiança
      if (suggestions.supplier_id) {
        setValue('supplier_id', suggestions.supplier_id);
      }
    }
  }, [initialData, setValue]);

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

  const onSubmit = async (data: InvoiceFormData) => {
    setIsLoading(true);
    try {
      await invoiceService.create({
        supplier_id: data.supplier_id,
        invoice_number: data.invoice_number,
        invoice_date: data.invoice_date,
        due_date: data.due_date,
        total_value: data.total_value,
        net_value: data.net_value,
        tax_value: data.tax_value,
        category: data.category,
        description: data.notes,
      });

      toast.success('Fatura criada com sucesso!');
      reset();
      onOpenChange(false);
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Erro ao criar fatura:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao criar fatura');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    reset();
    onOpenChange(false);
  };

  // Função para obter badge de confiança
  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 0.8) {
      return (
        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
          <CheckCircle className="h-3 w-3 mr-1" />
          Alta confiança ({Math.round(confidence * 100)}%)
        </Badge>
      );
    } else if (confidence >= 0.6) {
      return (
        <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
          <AlertTriangle className="h-3 w-3 mr-1" />
          Média confiança ({Math.round(confidence * 100)}%)
        </Badge>
      );
    } else {
      return (
        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
          <AlertCircle className="h-3 w-3 mr-1" />
          Baixa confiança ({Math.round(confidence * 100)}%)
        </Badge>
      );
    }
  };

  // Auto-calcular valores quando total_value ou tax_value mudam
  const totalValue = watch('total_value');
  const taxValue = watch('tax_value');

  useEffect(() => {
    if (totalValue && taxValue !== undefined) {
      const netValue = totalValue - taxValue;
      setValue('net_value', netValue);
    } else if (totalValue && !taxValue) {
      setValue('net_value', totalValue);
    }
  }, [totalValue, taxValue, setValue]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            {initialData ? 'Revisar Dados Extraídos pela IA' : 'Criar Nova Fatura'}
          </DialogTitle>
          <DialogDescription>
            {initialData
              ? 'Revise e ajuste os dados extraídos automaticamente pela IA antes de salvar'
              : 'Preencha os dados da fatura para adicionar ao sistema'}
          </DialogDescription>
        </DialogHeader>

        {/* Avisos da IA */}
        {initialData?.suggestions?.warnings && initialData.suggestions.warnings.length > 0 && (
          <Alert className="border-yellow-200 bg-yellow-50">
            <AlertTriangle className="h-4 w-4 text-yellow-700" />
            <AlertDescription className="text-yellow-700">
              <div className="font-semibold mb-1">Atenção aos seguintes pontos:</div>
              <ul className="list-disc list-inside space-y-1 text-sm">
                {initialData.suggestions.warnings.map((warning, idx) => (
                  <li key={idx}>{warning}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {/* Info sobre processamento */}
        {initialData?.processing_time_ms && (
          <div className="text-xs text-muted-foreground text-right">
            Processado em {initialData.processing_time_ms}ms
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Fornecedor */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="supplier_id">
                Fornecedor <span className="text-destructive">*</span>
              </Label>
              {initialData?.extracted_data?.confidence?.supplier_name !== undefined && (
                getConfidenceBadge(initialData.extracted_data.confidence.supplier_name)
              )}
            </div>

            {/* Mostrar matches de fornecedor se houver */}
            {initialData?.extracted_data?.supplier_matches && initialData.extracted_data.supplier_matches.length > 0 && (
              <Alert className="border-blue-200 bg-blue-50">
                <AlertCircle className="h-4 w-4 text-blue-700" />
                <AlertDescription className="text-blue-700">
                  <div className="font-semibold mb-2">Fornecedores similares encontrados:</div>
                  <div className="space-y-2">
                    {initialData.extracted_data.supplier_matches.slice(0, 3).map((match, idx) => (
                      <div key={idx} className="text-sm flex items-center justify-between bg-white p-2 rounded border border-blue-100">
                        <div>
                          <span className="font-medium">{match.name}</span>
                          {match.cnpj && <span className="text-muted-foreground ml-2">({match.cnpj})</span>}
                          <div className="text-xs text-muted-foreground">{match.match_reason}</div>
                        </div>
                        <Badge variant="outline" className="ml-2">
                          {Math.round(match.score)}% match
                        </Badge>
                      </div>
                    ))}
                  </div>
                  <div className="text-xs mt-2">Detectado: {initialData.extracted_data.supplier_name}</div>
                </AlertDescription>
              </Alert>
            )}

            <Select
              onValueChange={(value) => setValue('supplier_id', parseInt(value))}
              disabled={loadingSuppliers}
              value={watch('supplier_id')?.toString()}
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
              <div className="flex items-center justify-between">
                <Label htmlFor="invoice_number">
                  Número da Fatura <span className="text-destructive">*</span>
                </Label>
                {initialData?.extracted_data?.confidence?.invoice_number !== undefined && (
                  getConfidenceBadge(initialData.extracted_data.confidence.invoice_number)
                )}
              </div>
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
              <div className="flex items-center justify-between">
                <Label htmlFor="invoice_date">
                  Data de Emissão <span className="text-destructive">*</span>
                </Label>
                {initialData?.extracted_data?.confidence?.invoice_date !== undefined && (
                  getConfidenceBadge(initialData.extracted_data.confidence.invoice_date)
                )}
              </div>
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
              <div className="flex items-center justify-between">
                <Label htmlFor="due_date">Data de Vencimento</Label>
                {initialData?.extracted_data?.confidence?.due_date !== undefined && (
                  getConfidenceBadge(initialData.extracted_data.confidence.due_date)
                )}
              </div>
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
              <div className="flex items-center justify-between">
                <Label htmlFor="total_value">
                  Valor Total <span className="text-destructive">*</span>
                </Label>
                {initialData?.extracted_data?.confidence?.total_value !== undefined && (
                  getConfidenceBadge(initialData.extracted_data.confidence.total_value)
                )}
              </div>
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
              defaultValue="pending"
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
              Criar Fatura
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
