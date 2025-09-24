'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  Plus,
  Save,
  RefreshCw,
  Building,
  DollarSign,
  FileText,
  Trash2
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface InvoiceItem {
  id?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface InvoiceData {
  id?: string;
  supplier: string;
  supplierDocument?: string;
  supplierAddress?: string;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate?: string;
  totalValue: number;
  taxValue?: number;
  netValue?: number;
  items: InvoiceItem[];
  notes?: string;
  category?: string;
  paymentMethod?: string;
}

interface ValidationIssue {
  field: string;
  message: string;
  severity: 'error' | 'warning' | 'info';
}

interface InvoiceValidationFormProps {
  initialData: Partial<InvoiceData>;
  fileName: string;
  onSave: (data: InvoiceData) => void;
  onCancel: () => void;
  isLoading?: boolean;
  validationIssues?: ValidationIssue[];
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};


export function InvoiceValidationForm({
  initialData,
  fileName,
  onSave,
  onCancel,
  isLoading = false,
  validationIssues = []
}: InvoiceValidationFormProps) {
  const [formData, setFormData] = useState<InvoiceData>({
    supplier: initialData.supplier || '',
    supplierDocument: initialData.supplierDocument || '',
    supplierAddress: initialData.supplierAddress || '',
    invoiceNumber: initialData.invoiceNumber || '',
    invoiceDate: initialData.invoiceDate || new Date().toISOString().split('T')[0],
    dueDate: initialData.dueDate || '',
    totalValue: initialData.totalValue || 0,
    taxValue: initialData.taxValue || 0,
    netValue: initialData.netValue || 0,
    items: initialData.items || [],
    notes: initialData.notes || '',
    category: initialData.category || '',
    paymentMethod: initialData.paymentMethod || ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Recalcula totais quando items mudam
  useEffect(() => {
    const itemsTotal = formData.items.reduce((sum, item) => sum + item.total, 0);
    const netValue = itemsTotal - (formData.taxValue || 0);

    setFormData(prev => ({
      ...prev,
      totalValue: itemsTotal,
      netValue: netValue
    }));
  }, [formData.items, formData.taxValue]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.supplier.trim()) {
      newErrors.supplier = 'Nome do fornecedor é obrigatório';
    }

    if (!formData.invoiceNumber.trim()) {
      newErrors.invoiceNumber = 'Número da fatura é obrigatório';
    }

    if (!formData.invoiceDate) {
      newErrors.invoiceDate = 'Data da fatura é obrigatória';
    }

    if (formData.totalValue <= 0) {
      newErrors.totalValue = 'Valor total deve ser maior que zero';
    }

    if (formData.items.length === 0) {
      newErrors.items = 'Pelo menos um item deve ser adicionado';
    }

    formData.items.forEach((item, index) => {
      if (!item.description.trim()) {
        newErrors[`item_${index}_description`] = 'Descrição é obrigatória';
      }
      if (item.quantity <= 0) {
        newErrors[`item_${index}_quantity`] = 'Quantidade deve ser maior que zero';
      }
      if (item.unitPrice <= 0) {
        newErrors[`item_${index}_unitPrice`] = 'Preço unitário deve ser maior que zero';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (validateForm()) {
      onSave(formData);
    }
  };

  const handleInputChange = (field: keyof InvoiceData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    // Limpa erro do campo quando é editado
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const addItem = () => {
    const newItem: InvoiceItem = {
      id: Math.random().toString(36).substring(7),
      description: '',
      quantity: 1,
      unitPrice: 0,
      total: 0
    };

    setFormData(prev => ({
      ...prev,
      items: [...prev.items, newItem]
    }));
  };

  const removeItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const updateItem = (index: number, field: keyof InvoiceItem, value: string | number) => {
    setFormData(prev => {
      const newItems = [...prev.items];
      const item = { ...newItems[index] };

      if (field === 'quantity' || field === 'unitPrice') {
        (item as any)[field] = parseFloat(String(value)) || 0;
        item.total = item.quantity * item.unitPrice;
      } else if (field === 'description' || field === 'id') {
        (item as any)[field] = String(value);
      } else {
        (item as any)[field] = typeof value === 'number' ? value : parseFloat(String(value)) || 0;
      }

      newItems[index] = item;
      return { ...prev, items: newItems };
    });
  };

  const getIssueIcon = (severity: ValidationIssue['severity']) => {
    switch (severity) {
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'info':
        return <CheckCircle className="w-4 h-4 text-blue-500" />;
    }
  };

  const getFieldError = (field: string) => errors[field];
  const hasFieldError = (field: string) => Boolean(errors[field]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Validação de Fatura
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Arquivo: {fileName}
          </p>
        </div>

        <div className="flex space-x-2">
          <Button variant="outline" onClick={onCancel} disabled={isLoading}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={isLoading} size="lg">
            {isLoading ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Salvando na API...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Salvar Fatura
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Validation Issues */}
      {validationIssues.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4" />
              <span>Problemas Detectados</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {validationIssues.map((issue, index) => (
                <div key={index} className="flex items-center space-x-2 text-sm">
                  {getIssueIcon(issue.severity)}
                  <span className="font-medium">{issue.field}:</span>
                  <span>{issue.message}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Supplier Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Building className="w-5 h-5" />
            <span>Informações do Fornecedor</span>
          </CardTitle>
          <CardDescription>
            Dados do fornecedor extraídos do documento
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="supplier">Nome do Fornecedor *</Label>
              <Input
                id="supplier"
                value={formData.supplier}
                onChange={(e) => handleInputChange('supplier', e.target.value)}
                className={cn(hasFieldError('supplier') && 'border-red-500')}
                placeholder="Nome da empresa"
              />
              {hasFieldError('supplier') && (
                <p className="text-sm text-red-600">{getFieldError('supplier')}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="supplierDocument">CNPJ/CPF</Label>
              <Input
                id="supplierDocument"
                value={formData.supplierDocument}
                onChange={(e) => handleInputChange('supplierDocument', e.target.value)}
                placeholder="00.000.000/0000-00"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="supplierAddress">Endereço</Label>
            <Textarea
              id="supplierAddress"
              value={formData.supplierAddress}
              onChange={(e) => handleInputChange('supplierAddress', e.target.value)}
              placeholder="Endereço completo do fornecedor"
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      {/* Invoice Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="w-5 h-5" />
            <span>Detalhes da Fatura</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="invoiceNumber">Número da Fatura *</Label>
              <Input
                id="invoiceNumber"
                value={formData.invoiceNumber}
                onChange={(e) => handleInputChange('invoiceNumber', e.target.value)}
                className={cn(hasFieldError('invoiceNumber') && 'border-red-500')}
                placeholder="000001"
              />
              {hasFieldError('invoiceNumber') && (
                <p className="text-sm text-red-600">{getFieldError('invoiceNumber')}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="invoiceDate">Data da Fatura *</Label>
              <Input
                id="invoiceDate"
                type="date"
                value={formData.invoiceDate}
                onChange={(e) => handleInputChange('invoiceDate', e.target.value)}
                className={cn(hasFieldError('invoiceDate') && 'border-red-500')}
              />
              {hasFieldError('invoiceDate') && (
                <p className="text-sm text-red-600">{getFieldError('invoiceDate')}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="dueDate">Data de Vencimento</Label>
              <Input
                id="dueDate"
                type="date"
                value={formData.dueDate}
                onChange={(e) => handleInputChange('dueDate', e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Categoria</Label>
              <Input
                id="category"
                value={formData.category}
                onChange={(e) => handleInputChange('category', e.target.value)}
                placeholder="Ex: Material de escritório"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="paymentMethod">Forma de Pagamento</Label>
              <Input
                id="paymentMethod"
                value={formData.paymentMethod}
                onChange={(e) => handleInputChange('paymentMethod', e.target.value)}
                placeholder="Ex: Cartão de crédito"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Items */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <DollarSign className="w-5 h-5" />
              <span>Itens da Fatura</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={addItem}
              disabled={isLoading}
            >
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Item
            </Button>
          </CardTitle>
          {hasFieldError('items') && (
            <p className="text-sm text-red-600">{getFieldError('items')}</p>
          )}
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {formData.items.map((item, index) => (
              <Card key={item.id || index} className="border border-gray-200">
                <CardContent className="pt-4">
                  <div className="flex items-start space-x-4">
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-5 gap-4">
                      <div className="md:col-span-2 space-y-2">
                        <Label htmlFor={`item_${index}_description`}>Descrição *</Label>
                        <Input
                          id={`item_${index}_description`}
                          value={item.description}
                          onChange={(e) => updateItem(index, 'description', e.target.value)}
                          className={cn(hasFieldError(`item_${index}_description`) && 'border-red-500')}
                          placeholder="Descrição do item"
                        />
                        {hasFieldError(`item_${index}_description`) && (
                          <p className="text-sm text-red-600">{getFieldError(`item_${index}_description`)}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={`item_${index}_quantity`}>Quantidade *</Label>
                        <Input
                          id={`item_${index}_quantity`}
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.quantity}
                          onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                          className={cn(hasFieldError(`item_${index}_quantity`) && 'border-red-500')}
                        />
                        {hasFieldError(`item_${index}_quantity`) && (
                          <p className="text-sm text-red-600">{getFieldError(`item_${index}_quantity`)}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={`item_${index}_unitPrice`}>Preço Unit. *</Label>
                        <Input
                          id={`item_${index}_unitPrice`}
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.unitPrice}
                          onChange={(e) => updateItem(index, 'unitPrice', e.target.value)}
                          className={cn(hasFieldError(`item_${index}_unitPrice`) && 'border-red-500')}
                        />
                        {hasFieldError(`item_${index}_unitPrice`) && (
                          <p className="text-sm text-red-600">{getFieldError(`item_${index}_unitPrice`)}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label>Total</Label>
                        <div className="px-3 py-2 bg-gray-50 dark:bg-gray-800 rounded border text-sm font-medium">
                          {formatCurrency(item.total)}
                        </div>
                      </div>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeItem(index)}
                      disabled={isLoading || formData.items.length === 1}
                      className="mt-6"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Financial Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Resumo Financeiro</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="taxValue">Valor dos Impostos</Label>
                <Input
                  id="taxValue"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.taxValue}
                  onChange={(e) => handleInputChange('taxValue', parseFloat(e.target.value) || 0)}
                />
              </div>

              <div className="space-y-2">
                <Label>Valor Líquido</Label>
                <div className="px-3 py-2 bg-gray-50 dark:bg-gray-800 rounded border text-sm font-medium">
                  {formatCurrency(formData.netValue)}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Valor Total</Label>
                <div className="px-3 py-2 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 text-sm font-bold text-blue-800 dark:text-blue-200">
                  {formatCurrency(formData.totalValue)}
                </div>
                {hasFieldError('totalValue') && (
                  <p className="text-sm text-red-600">{getFieldError('totalValue')}</p>
                )}
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <Label htmlFor="notes">Observações</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                placeholder="Observações adicionais sobre a fatura..."
                rows={3}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}