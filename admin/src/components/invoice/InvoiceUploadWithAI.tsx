'use client';

import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import {
  FileText,
  Loader2,
  X,
  Sparkles
} from 'lucide-react';
import { toast } from 'sonner';
import { invoiceService } from '@/services/invoice';
import { InvoiceExtractionResponse } from '@/types';

interface InvoiceUploadWithAIProps {
  onExtracted: (data: InvoiceExtractionResponse) => void;
  onCancel: () => void;
}

export function InvoiceUploadWithAI({ onExtracted, onCancel }: InvoiceUploadWithAIProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

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
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);

    try {
      const result = await invoiceService.uploadAndExtract(selectedFile);

      if (result.success) {
        toast.success(`Fatura processada em ${result.processing_time_ms}ms!`);
        onExtracted(result);
      } else {
        throw new Error(result.error || 'Erro ao processar fatura');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao fazer upload');
      console.error('Erro no upload:', error);
    } finally {
      setUploading(false);
    }
  };


  return (
    <div className="space-y-6">
      {/* Header com IA */}
      <Alert className="border-purple-200 bg-purple-50">
        <Sparkles className="h-4 w-4 text-purple-600" />
        <AlertTitle className="text-purple-900">Processamento com IA</AlertTitle>
        <AlertDescription className="text-purple-700">
          A fatura será processada automaticamente usando LayoutLM e Tesseract OCR.
          Os dados serão extraídos e você poderá revisar antes de salvar.
        </AlertDescription>
      </Alert>

      {/* Upload de arquivo */}
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
          <div className="grid w-full items-center gap-1.5">
            <Label htmlFor="file">Arquivo</Label>
            <Input
              id="file"
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={handleFileSelect}
              disabled={uploading}
            />
          </div>

          {selectedFile && (
            <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
              <FileText className="h-4 w-4" />
              <span className="text-sm flex-1">{selectedFile.name}</span>
              <Badge variant="outline" className="text-xs">
                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
              </Badge>
              {!uploading && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedFile(null)}
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
          )}

          <div className="flex gap-2">
            <Button
              onClick={handleUpload}
              disabled={!selectedFile || uploading}
              className="flex-1"
            >
              {uploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processando com IA...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Processar com IA
                </>
              )}
            </Button>
            <Button variant="outline" onClick={onCancel} disabled={uploading}>
              Cancelar
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
