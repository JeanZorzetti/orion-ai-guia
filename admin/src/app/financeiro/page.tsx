'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Upload, BarChart3, RefreshCw, Trash2, Edit, CheckCircle } from 'lucide-react';
import { useFileUpload, UploadFile } from '@/hooks/useFileUpload';
import { FileUpload } from '@/components/ui/file-upload';
import { FileList } from '@/components/ui/file-status';
import { InvoiceValidationForm, InvoiceData } from '@/components/forms/InvoiceValidationForm';
import { invoiceApi, SaveInvoiceRequest } from '@/services/invoiceApi';
import { ToastProvider, useToast } from '@/components/ui/toast';

function FinanceiroPageContent() {
  const [validatingFile, setValidatingFile] = useState<UploadFile | null>(null);
  const [savedInvoices, setSavedInvoices] = useState<InvoiceData[]>([]);
  const [isValidationLoading, setIsValidationLoading] = useState(false);
  const { showToast } = useToast();

  const {
    files,
    globalError,
    isProcessing,
    addFiles,
    removeFile,
    processFiles,
    resetFiles,
    getStats,
    canAddMore,
    hasFilesToProcess,
    isAnyProcessing
  } = useFileUpload({
    maxFiles: 10,
    maxSize: 10 * 1024 * 1024, // 10MB
    acceptedFormats: ['.pdf', '.jpg', '.jpeg', '.png'],
    onSuccess: (files) => {
      console.log('Processamento concluído:', files);
    },
    onError: (error) => {
      console.error('Erro no processamento:', error);
      showToast({
        type: 'error',
        title: 'Erro no processamento',
        message: error
      });
    }
  });

  const handleDrop = (acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      addFiles(acceptedFiles);
    }
  };

  const handleValidateInvoice = (file: UploadFile) => {
    setValidatingFile(file);
  };

  const handleSaveInvoice = async (invoiceData: InvoiceData) => {
    console.log('💾 Iniciando salvamento da fatura:', {
      supplier: invoiceData.supplier,
      invoiceNumber: invoiceData.invoiceNumber,
      totalValue: invoiceData.totalValue,
      itemsCount: invoiceData.items.length,
      endpoint: '/api/v1/financials/invoices'
    });

    setIsValidationLoading(true);

    try {
      // Prepara dados para a API
      const saveRequest: SaveInvoiceRequest = {
        supplier: invoiceData.supplier,
        supplierDocument: invoiceData.supplierDocument,
        supplierAddress: invoiceData.supplierAddress,
        invoiceNumber: invoiceData.invoiceNumber,
        invoiceDate: invoiceData.invoiceDate,
        dueDate: invoiceData.dueDate,
        totalValue: invoiceData.totalValue,
        taxValue: invoiceData.taxValue,
        netValue: invoiceData.netValue,
        items: invoiceData.items.map(item => ({
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          total: item.total
        })),
        notes: invoiceData.notes,
        category: invoiceData.category,
        paymentMethod: invoiceData.paymentMethod
      };

      // Faz chamada real para a API
      const saveResponse = await invoiceApi.saveInvoice(saveRequest);

      if (!saveResponse.success || !saveResponse.data) {
        throw new Error(saveResponse.error?.message || 'Erro ao salvar fatura');
      }

      // Adiciona ID retornado pela API
      const savedInvoice: InvoiceData = {
        ...invoiceData,
        id: saveResponse.data.id
      };

      setSavedInvoices(prev => [...prev, savedInvoice]);
      setValidatingFile(null);

      // Remove arquivo da lista após salvar
      if (validatingFile) {
        removeFile(validatingFile.id);
      }

      console.log('Fatura salva com sucesso:', savedInvoice);

      // Toast de sucesso
      showToast({
        type: 'success',
        title: 'Fatura salva com sucesso!',
        message: `Fatura #${savedInvoice.invoiceNumber} de ${savedInvoice.supplier} foi salva no sistema.`
      });

    } catch (error) {
      console.error('Erro ao salvar fatura:', error);

      // Toast de erro
      showToast({
        type: 'error',
        title: 'Erro ao salvar fatura',
        message: error instanceof Error ? error.message : 'Erro desconhecido ao processar a solicitação.'
      });

    } finally {
      setIsValidationLoading(false);
    }
  };

  const handleCancelValidation = () => {
    setValidatingFile(null);
  };

  // Mapeia dados da API para o formato do formulário
  const mapApiDataToFormData = (file: UploadFile): Partial<InvoiceData> => {
    if (!file.result) {
      return {
        supplier: '',
        invoiceNumber: '',
        invoiceDate: new Date().toISOString().split('T')[0],
        totalValue: 0,
        items: []
      };
    }

    const apiData = file.result;

    return {
      supplier: apiData.supplier?.name || '',
      supplierDocument: apiData.supplier?.document || '',
      supplierAddress: apiData.supplier?.address || '',
      invoiceNumber: apiData.invoice?.number || '',
      invoiceDate: apiData.invoice?.date ?
        new Date(apiData.invoice.date).toISOString().split('T')[0] :
        new Date().toISOString().split('T')[0],
      dueDate: apiData.invoice?.dueDate ?
        new Date(apiData.invoice.dueDate).toISOString().split('T')[0] :
        '',
      category: apiData.invoice?.category || '',
      totalValue: apiData.financial?.totalValue || 0,
      netValue: apiData.financial?.netValue || 0,
      taxValue: apiData.financial?.taxValue || 0,
      items: apiData.items?.map((item, index) => ({
        id: `item_${index}`,
        description: item.description || '',
        quantity: item.quantity || 1,
        unitPrice: item.unitPrice || 0,
        total: item.total || (item.quantity * item.unitPrice)
      })) || [],
      notes: apiData.metadata ?
        `Processado automaticamente. Confiança: ${Math.round((apiData.metadata.confidence || 0) * 100)}%` :
        ''
    };
  };

  const stats = getStats();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  // Se estamos validando um arquivo, mostra apenas o formulário
  if (validatingFile) {
    return (
      <div className="container mx-auto p-6">
        <InvoiceValidationForm
          initialData={mapApiDataToFormData(validatingFile)}
          fileName={validatingFile.name}
          onSave={handleSaveInvoice}
          onCancel={handleCancelValidation}
          isLoading={isValidationLoading}
          validationIssues={validatingFile.validationIssues}
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <FileText className="w-8 h-8 text-blue-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              Módulo Financeiro
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Processamento inteligente de faturas e notas fiscais
            </p>
          </div>
        </div>

        {/* Stats */}
        {(stats.total > 0 || savedInvoices.length > 0) && (
          <div className="flex items-center space-x-4 text-sm">
            <div className="flex items-center space-x-1">
              <BarChart3 className="w-4 h-4 text-gray-500" />
              <span className="text-gray-600 dark:text-gray-400">
                {stats.total} arquivo(s) • {savedInvoices.length} salva(s)
              </span>
            </div>
            {stats.completed > 0 && (
              <div className="text-green-600 font-medium">
                {stats.completed} processado(s)
              </div>
            )}
            {stats.error > 0 && (
              <div className="text-red-600 font-medium">
                {stats.error} erro(s)
              </div>
            )}
          </div>
        )}
      </div>

      {/* Upload Area */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Upload className="w-5 h-5" />
              <span>Upload de Documentos</span>
            </div>
            {files.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={resetFiles}
                disabled={isAnyProcessing}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Limpar
              </Button>
            )}
          </CardTitle>
          <CardDescription>
            Faça upload de faturas e notas fiscais para extração automática de dados
            {!canAddMore && (
              <span className="text-amber-600"> • Limite de arquivos atingido</span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <FileUpload
            onFilesSelected={(files) => addFiles(files)}
            maxFiles={10}
            maxSize={10 * 1024 * 1024}
            acceptedFormats={['.pdf', '.jpg', '.jpeg', '.png']}
            disabled={!canAddMore || isAnyProcessing}
            error={globalError}
          />

          {files.length > 0 && (
            <>
              <FileList files={files} onRemove={removeFile} />

              <div className="flex justify-between items-center pt-4 border-t">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {hasFilesToProcess && `${stats.pending} arquivo(s) aguardando processamento`}
                  {stats.processing > 0 && ` • ${stats.processing} processando`}
                  {stats.uploading > 0 && ` • ${stats.uploading} enviando`}
                </div>

                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={resetFiles}
                    disabled={isAnyProcessing}
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Resetar
                  </Button>
                  <Button
                    onClick={processFiles}
                    disabled={!hasFilesToProcess || isAnyProcessing}
                    className="min-w-[120px]"
                  >
                    {isProcessing ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Processando...
                      </>
                    ) : (
                      `Processar ${stats.pending} arquivo(s)`
                    )}
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Results */}
      {stats.completed > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Resultados do Processamento</CardTitle>
            <CardDescription>
              Dados extraídos dos documentos processados
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {files.filter(f => f.status === 'completed' && f.result).map((file) => (
                <div
                  key={file.id}
                  className="border rounded-lg p-4 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-lg">{file.name}</h3>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleValidateInvoice(file)}
                        disabled={isAnyProcessing}
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Validar
                      </Button>
                      {file.validationIssues && file.validationIssues.length > 0 && (
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100">
                          {file.validationIssues.length} problema(s)
                        </span>
                      )}
                      <span className="px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100">
                        Processado
                      </span>
                    </div>
                  </div>

                  {file.result && (
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                            Fornecedor
                          </label>
                          <p className="text-gray-900 dark:text-gray-100">
                            {file.result.supplier?.name || 'N/A'}
                          </p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                            Valor Total
                          </label>
                          <p className="text-gray-900 dark:text-gray-100 font-semibold">
                            {formatCurrency(file.result.financial?.totalValue || 0)}
                          </p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                            Data
                          </label>
                          <p className="text-gray-900 dark:text-gray-100">
                            {file.result.invoice?.date ? formatDate(file.result.invoice.date) : 'N/A'}
                          </p>
                        </div>
                      </div>

                      {/* Metadata da API */}
                      {file.result.metadata && (
                        <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 p-2 rounded">
                          <span>Confiança: {Math.round((file.result.metadata.confidence || 0) * 100)}%</span>
                          <span>•</span>
                          <span>Tempo: {file.result.metadata.processingTime}ms</span>
                          {file.result.metadata.detectedLanguage && (
                            <>
                              <span>•</span>
                              <span>Idioma: {file.result.metadata.detectedLanguage}</span>
                            </>
                          )}
                        </div>
                      )}

                      {file.result.items && file.result.items.length > 0 && (
                        <div>
                          <label className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2 block">
                            Itens da Fatura
                          </label>
                          <div className="overflow-x-auto">
                            <table className="min-w-full border rounded-lg">
                              <thead className="bg-gray-50 dark:bg-gray-800">
                                <tr>
                                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-600 dark:text-gray-400">
                                    Descrição
                                  </th>
                                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-600 dark:text-gray-400">
                                    Qtd
                                  </th>
                                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-600 dark:text-gray-400">
                                    Valor Unit.
                                  </th>
                                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-600 dark:text-gray-400">
                                    Total
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                {file.result.items.map((item, index) => (
                                  <tr key={index}>
                                    <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100">
                                      {item.description}
                                    </td>
                                    <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100">
                                      {item.quantity}
                                    </td>
                                    <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100">
                                      {formatCurrency(item.unitPrice)}
                                    </td>
                                    <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100 font-medium">
                                      {formatCurrency(item.total)}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Saved Invoices */}
      {savedInvoices.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span>Faturas Validadas</span>
            </CardTitle>
            <CardDescription>
              {savedInvoices.length} fatura(s) validada(s) e salva(s) no sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {savedInvoices.map((invoice) => (
                <div
                  key={invoice.id}
                  className="border rounded-lg p-4 space-y-3 bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100">
                        {invoice.supplier}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Fatura #{invoice.invoiceNumber} • {formatDate(invoice.invoiceDate)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg text-green-700 dark:text-green-300">
                        {formatCurrency(invoice.totalValue)}
                      </p>
                      <span className="px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100">
                        Salva
                      </span>
                    </div>
                  </div>

                  {invoice.category && (
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-gray-500">Categoria:</span>
                      <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded">
                        {invoice.category}
                      </span>
                    </div>
                  )}

                  {invoice.items.length > 0 && (
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {invoice.items.length} item(s): {invoice.items.slice(0, 3).map(item => item.description).join(', ')}
                      {invoice.items.length > 3 && ` e mais ${invoice.items.length - 3}...`}
                    </div>
                  )}

                  {invoice.notes && (
                    <div className="text-sm text-gray-600 dark:text-gray-400 italic">
                      "{invoice.notes}"
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default function FinanceiroPage() {
  return (
    <ToastProvider>
      <FinanceiroPageContent />
    </ToastProvider>
  );
}