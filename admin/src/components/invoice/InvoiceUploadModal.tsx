'use client';

import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { ScrollArea } from '../ui/scroll-area';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import {
  Upload,
  FileText,
  CheckCircle,
  AlertCircle,
  Loader2,
  X,
  Eye,
  Save,
  Building,
  Calendar,
  DollarSign,
  Hash
} from 'lucide-react';
import { toast } from 'sonner';
import { ENVIRONMENT_INFO } from '@/lib/config';

interface ExtractedData {
  supplier: {
    name: string;
    document: string;
    address: string;
  };
  invoice: {
    number: string;
    date: string;
    dueDate: string;
    category: string;
  };
  financial: {
    totalValue: number;
    netValue: number;
    taxValue: number;
  };
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
}

interface UploadResponse {
  success: boolean;
  message: string;
  id: string;
  filename: string;
  extractedData: ExtractedData;
  validationIssues: string[];
  processing_info: {
    method: string;
    confidence_score: number;
    pages_processed: number;
    file_type: string;
  };
}

type UploadState = 'idle' | 'uploading' | 'processing' | 'validating' | 'completed' | 'error';

interface InvoiceUploadModalProps {
  children: React.ReactNode;
  onSuccess?: (data: any) => void;
}

const InvoiceUploadModal: React.FC<InvoiceUploadModalProps> = ({ children, onSuccess }) => {
  const [open, setOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadState, setUploadState] = useState<UploadState>('idle');
  const [extractedData, setExtractedData] = useState<ExtractedData | null>(null);
  const [uploadResponse, setUploadResponse] = useState<UploadResponse | null>(null);
  const [validationIssues, setValidationIssues] = useState<string[]>([]);
  const [formData, setFormData] = useState<any>({});

  const resetState = () => {
    setSelectedFile(null);
    setUploadState('idle');
    setExtractedData(null);
    setUploadResponse(null);
    setValidationIssues([]);
    setFormData({});
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validação do tipo de arquivo
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Tipo de arquivo não suportado. Use PDF, JPG ou PNG.');
      return;
    }

    // Validação do tamanho (10MB max)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      toast.error('Arquivo muito grande. Tamanho máximo: 10MB.');
      return;
    }

    setSelectedFile(file);
    setUploadState('idle');
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploadState('uploading');

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const response = await fetch(`${ENVIRONMENT_INFO.baseUrl}/api/v1/financials/invoices/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Erro HTTP: ${response.status}`);
      }

      const result: UploadResponse = await response.json();

      if (result.success) {
        setUploadState('processing');

        // Simula processamento
        setTimeout(() => {
          setUploadState('validating');
          setUploadResponse(result);
          setExtractedData(result.extractedData);
          setValidationIssues(result.validationIssues);

          // Pré-preenche o formulário com os dados extraídos
          setFormData({
            supplierName: result.extractedData.supplier.name,
            supplierDocument: result.extractedData.supplier.document,
            supplierAddress: result.extractedData.supplier.address,
            invoiceNumber: result.extractedData.invoice.number,
            invoiceDate: result.extractedData.invoice.date,
            dueDate: result.extractedData.invoice.dueDate,
            category: result.extractedData.invoice.category,
            totalValue: result.extractedData.financial.totalValue,
            netValue: result.extractedData.financial.netValue,
            taxValue: result.extractedData.financial.taxValue,
          });

          toast.success('Documento processado com sucesso!');
        }, 2000);
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      setUploadState('error');
      toast.error(error instanceof Error ? error.message : 'Erro ao fazer upload');
      console.error('Erro no upload:', error);
    }
  };

  const handleSaveInvoice = async () => {
    if (!extractedData || !uploadResponse) return;

    setUploadState('uploading');

    try {
      const response = await fetch(`${ENVIRONMENT_INFO.baseUrl}/api/v1/financials/invoices`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          originalFileId: uploadResponse.id,
          filename: uploadResponse.filename,
        }),
      });

      if (!response.ok) {
        throw new Error(`Erro HTTP: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        setUploadState('completed');
        toast.success('Fatura salva com sucesso!');

        if (onSuccess) {
          onSuccess(result.data);
        }

        // Fecha o modal após 2 segundos
        setTimeout(() => {
          setOpen(false);
          resetState();
        }, 2000);
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      setUploadState('error');
      toast.error(error instanceof Error ? error.message : 'Erro ao salvar fatura');
      console.error('Erro ao salvar:', error);
    }
  };

  const handleFormChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const getStateMessage = () => {
    switch (uploadState) {
      case 'uploading':
        return { title: 'Enviando...', description: 'Fazendo upload do documento' };
      case 'processing':
        return { title: 'Processando...', description: 'Extraindo dados com IA' };
      case 'validating':
        return { title: 'Validando...', description: 'Validando informações extraídas' };
      case 'completed':
        return { title: 'Concluído!', description: 'Fatura salva com sucesso' };
      case 'error':
        return { title: 'Erro', description: 'Falha no processamento' };
      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild onClick={() => setOpen(true)}>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Importar Fatura
          </DialogTitle>
          <DialogDescription>
            Faça upload de uma fatura para processamento automático com IA
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Estado de processamento */}
          {uploadState !== 'idle' && uploadState !== 'validating' && (
            <Alert className={uploadState === 'completed' ? 'border-green-200 bg-green-50' : uploadState === 'error' ? 'border-red-200 bg-red-50' : 'border-blue-200 bg-blue-50'}>
              <div className="flex items-center gap-2">
                {uploadState === 'completed' ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : uploadState === 'error' ? (
                  <AlertCircle className="h-4 w-4 text-red-600" />
                ) : (
                  <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                )}
                <div>
                  <AlertTitle>{getStateMessage()?.title}</AlertTitle>
                  <AlertDescription>{getStateMessage()?.description}</AlertDescription>
                </div>
              </div>
            </Alert>
          )}

          {/* Upload de arquivo */}
          {uploadState === 'idle' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Selecionar Documento
                </CardTitle>
                <CardDescription>
                  Formatos aceitos: PDF, JPG, PNG (máx. 10MB)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid w-full max-w-sm items-center gap-1.5">
                  <Label htmlFor="file">Arquivo</Label>
                  <Input
                    id="file"
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleFileSelect}
                  />
                </div>

                {selectedFile && (
                  <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                    <FileText className="h-4 w-4" />
                    <span className="text-sm">{selectedFile.name}</span>
                    <Badge variant="outline" className="text-xs">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedFile(null)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                )}

                <Button
                  onClick={handleUpload}
                  disabled={!selectedFile}
                  className="w-full"
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Processar Documento
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Formulário de validação */}
          {uploadState === 'validating' && extractedData && (
            <Tabs defaultValue="form" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="form">Formulário de Validação</TabsTrigger>
                <TabsTrigger value="preview">Dados Extraídos</TabsTrigger>
              </TabsList>

              <TabsContent value="form" className="space-y-6">
                <ScrollArea className="h-[400px] pr-4">
                  <div className="space-y-6">
                    {/* Dados do Fornecedor */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                          <Building className="h-5 w-5" />
                          Dados do Fornecedor
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="supplierName">Nome/Razão Social</Label>
                            <Input
                              id="supplierName"
                              value={formData.supplierName || ''}
                              onChange={(e) => handleFormChange('supplierName', e.target.value)}
                            />
                          </div>
                          <div>
                            <Label htmlFor="supplierDocument">CNPJ</Label>
                            <Input
                              id="supplierDocument"
                              value={formData.supplierDocument || ''}
                              onChange={(e) => handleFormChange('supplierDocument', e.target.value)}
                            />
                          </div>
                        </div>
                        <div>
                          <Label htmlFor="supplierAddress">Endereço</Label>
                          <Input
                            id="supplierAddress"
                            value={formData.supplierAddress || ''}
                            onChange={(e) => handleFormChange('supplierAddress', e.target.value)}
                          />
                        </div>
                      </CardContent>
                    </Card>

                    {/* Dados da Fatura */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                          <Hash className="h-5 w-5" />
                          Dados da Fatura
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="invoiceNumber">Número da NF</Label>
                            <Input
                              id="invoiceNumber"
                              value={formData.invoiceNumber || ''}
                              onChange={(e) => handleFormChange('invoiceNumber', e.target.value)}
                            />
                          </div>
                          <div>
                            <Label htmlFor="category">Categoria</Label>
                            <Input
                              id="category"
                              value={formData.category || ''}
                              onChange={(e) => handleFormChange('category', e.target.value)}
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="invoiceDate">Data de Emissão</Label>
                            <Input
                              id="invoiceDate"
                              type="date"
                              value={formData.invoiceDate || ''}
                              onChange={(e) => handleFormChange('invoiceDate', e.target.value)}
                            />
                          </div>
                          <div>
                            <Label htmlFor="dueDate">Data de Vencimento</Label>
                            <Input
                              id="dueDate"
                              type="date"
                              value={formData.dueDate || ''}
                              onChange={(e) => handleFormChange('dueDate', e.target.value)}
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Valores Financeiros */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                          <DollarSign className="h-5 w-5" />
                          Valores Financeiros
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <Label htmlFor="totalValue">Valor Total</Label>
                            <Input
                              id="totalValue"
                              type="number"
                              step="0.01"
                              value={formData.totalValue || ''}
                              onChange={(e) => handleFormChange('totalValue', parseFloat(e.target.value))}
                            />
                          </div>
                          <div>
                            <Label htmlFor="netValue">Valor Líquido</Label>
                            <Input
                              id="netValue"
                              type="number"
                              step="0.01"
                              value={formData.netValue || ''}
                              onChange={(e) => handleFormChange('netValue', parseFloat(e.target.value))}
                            />
                          </div>
                          <div>
                            <Label htmlFor="taxValue">Impostos</Label>
                            <Input
                              id="taxValue"
                              type="number"
                              step="0.01"
                              value={formData.taxValue || ''}
                              onChange={(e) => handleFormChange('taxValue', parseFloat(e.target.value))}
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </ScrollArea>

                <div className="flex justify-between pt-4">
                  <Button variant="outline" onClick={() => setOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleSaveInvoice} className="bg-green-600 hover:bg-green-700">
                    <Save className="mr-2 h-4 w-4" />
                    Salvar Fatura
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="preview">
                <ScrollArea className="h-[400px] pr-4">
                  <div className="space-y-4">
                    {/* Info de processamento */}
                    {uploadResponse && (
                      <Alert>
                        <Eye className="h-4 w-4" />
                        <AlertTitle>Informações do Processamento</AlertTitle>
                        <AlertDescription>
                          Confidence Score: {(uploadResponse.processing_info.confidence_score * 100).toFixed(1)}% |
                          Páginas: {uploadResponse.processing_info.pages_processed} |
                          Tipo: {uploadResponse.processing_info.file_type.toUpperCase()}
                        </AlertDescription>
                      </Alert>
                    )}

                    {/* Dados extraídos */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Dados Extraídos pela IA</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <h4 className="font-semibold">Fornecedor:</h4>
                          <p>{extractedData.supplier.name}</p>
                          <p className="text-sm text-muted-foreground">{extractedData.supplier.document}</p>
                        </div>
                        <Separator />
                        <div>
                          <h4 className="font-semibold">Fatura:</h4>
                          <p>Número: {extractedData.invoice.number}</p>
                          <p>Data: {extractedData.invoice.date}</p>
                          <p>Vencimento: {extractedData.invoice.dueDate}</p>
                        </div>
                        <Separator />
                        <div>
                          <h4 className="font-semibold">Valores:</h4>
                          <p>Total: R$ {extractedData.financial.totalValue.toFixed(2)}</p>
                          <p>Líquido: R$ {extractedData.financial.netValue.toFixed(2)}</p>
                          <p>Impostos: R$ {extractedData.financial.taxValue.toFixed(2)}</p>
                        </div>
                        <Separator />
                        <div>
                          <h4 className="font-semibold">Itens ({extractedData.items.length}):</h4>
                          {extractedData.items.map((item, index) => (
                            <div key={index} className="text-sm border rounded p-2">
                              <p><strong>{item.description}</strong></p>
                              <p>Qtd: {item.quantity} | Preço: R$ {item.unitPrice.toFixed(2)} | Total: R$ {item.total.toFixed(2)}</p>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </ScrollArea>
              </TabsContent>
            </Tabs>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default InvoiceUploadModal;