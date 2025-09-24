'use client';

import { useState, useCallback } from 'react';
import { invoiceApi, APIInvoiceData } from '@/services/invoiceApi';

export type FileStatus = 'pending' | 'validating' | 'uploading' | 'processing' | 'completed' | 'error';

export interface UploadFile extends File {
  id: string;
  preview?: string;
  status: FileStatus;
  progress: number;
  error?: string;
  result?: APIInvoiceData;
  validationIssues?: Array<{
    field: string;
    message: string;
    severity: 'error' | 'warning' | 'info';
  }>;
}

interface UseFileUploadOptions {
  maxFiles?: number;
  maxSize?: number;
  acceptedFormats?: string[];
  onSuccess?: (files: UploadFile[]) => void;
  onError?: (error: string) => void;
}

export function useFileUpload({
  maxFiles = 10,
  maxSize = 10 * 1024 * 1024,
  acceptedFormats = ['.pdf', '.jpg', '.jpeg', '.png'],
  onSuccess,
  onError
}: UseFileUploadOptions = {}) {
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [globalError, setGlobalError] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);

  const formatFileSize = useCallback((bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }, []);

  const validateFile = useCallback((file: File): string | null => {
    // Verifica tamanho
    if (file.size > maxSize) {
      return `Arquivo muito grande. Tamanho máximo: ${formatFileSize(maxSize)}`;
    }

    // Verifica formato
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!acceptedFormats.includes(fileExtension)) {
      return `Formato não suportado. Formatos aceitos: ${acceptedFormats.join(', ')}`;
    }

    return null;
  }, [maxSize, acceptedFormats, formatFileSize]);

  const updateFileStatus = useCallback((fileId: string, updates: Partial<UploadFile>) => {
    setFiles(prev => prev.map(file =>
      file.id === fileId
        ? { ...file, ...updates }
        : file
    ));
  }, []);

  const addFiles = useCallback((newFiles: File[]) => {
    setGlobalError('');

    // Verifica limite de arquivos
    if (files.length + newFiles.length > maxFiles) {
      const error = `Máximo de ${maxFiles} arquivo(s) permitido(s)`;
      setGlobalError(error);
      onError?.(error);
      return;
    }

    const processedFiles: UploadFile[] = [];
    const errors: string[] = [];

    newFiles.forEach((file) => {
      // Validação inicial
      const validationError = validateFile(file);
      const fileId = Math.random().toString(36).substring(7);

      if (validationError) {
        errors.push(`${file.name}: ${validationError}`);
        processedFiles.push({
          ...file,
          id: fileId,
          status: 'error',
          progress: 0,
          error: validationError
        } as UploadFile);
      } else {
        const uploadFile: UploadFile = {
          ...file,
          id: fileId,
          status: 'validating',
          progress: 0
        } as UploadFile;

        // Cria preview para imagens
        if (file.type.startsWith('image/')) {
          uploadFile.preview = URL.createObjectURL(file);
        }

        processedFiles.push(uploadFile);

        // Simula validação assíncrona
        setTimeout(() => {
          updateFileStatus(fileId, {
            status: 'pending',
            progress: 0
          });
        }, 500);
      }
    });

    if (errors.length > 0) {
      const errorMessage = errors.join(', ');
      setGlobalError(errorMessage);
      onError?.(errorMessage);
    }

    setFiles(prev => [...prev, ...processedFiles]);
  }, [files.length, maxFiles, validateFile, onError, updateFileStatus]);

  const removeFile = useCallback((fileId: string) => {
    const fileToRemove = files.find(f => f.id === fileId);

    // Limpa preview se existir
    if (fileToRemove?.preview) {
      URL.revokeObjectURL(fileToRemove.preview);
    }

    setFiles(prev => prev.filter(f => f.id !== fileId));
    setGlobalError('');
  }, [files]);

  const processFiles = useCallback(async () => {
    const pendingFiles = files.filter(f => f.status === 'pending');
    if (pendingFiles.length === 0) return;

    setIsProcessing(true);
    setGlobalError('');

    try {
      for (const file of pendingFiles) {
        // Atualiza para status de upload
        updateFileStatus(file.id, {
          status: 'uploading',
          progress: 0
        });

        const formData = new FormData();
        formData.append('file', file);

        try {
          // Progresso de upload (0-30%)
          for (let progress = 0; progress <= 30; progress += 5) {
            updateFileStatus(file.id, { progress });
            await new Promise(resolve => setTimeout(resolve, 50));
          }

          // Faz o upload usando o serviço de API
          const uploadResponse = await invoiceApi.uploadInvoice(file);

          if (!uploadResponse.success || !uploadResponse.data) {
            throw new Error(uploadResponse.error?.message || 'Erro no upload');
          }

          // Progresso de processamento (30-100%)
          updateFileStatus(file.id, {
            status: 'processing',
            progress: 50
          });

          for (let progress = 50; progress <= 100; progress += 10) {
            updateFileStatus(file.id, { progress });
            await new Promise(resolve => setTimeout(resolve, 100));
          }

          updateFileStatus(file.id, {
            status: 'completed',
            progress: 100,
            result: uploadResponse.data.extractedData,
            validationIssues: uploadResponse.data.validationIssues,
            error: undefined
          });

        } catch (error) {
          updateFileStatus(file.id, {
            status: 'error',
            progress: 0,
            error: error instanceof Error ? error.message : 'Erro desconhecido'
          });
        }
      }

      const completedFiles = files.filter(f => f.status === 'completed');
      onSuccess?.(completedFiles);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro no processamento';
      setGlobalError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  }, [files, updateFileStatus, onSuccess, onError]);

  const resetFiles = useCallback(() => {
    // Limpa previews
    files.forEach(file => {
      if (file.preview) {
        URL.revokeObjectURL(file.preview);
      }
    });

    setFiles([]);
    setGlobalError('');
    setIsProcessing(false);
  }, [files]);

  const getStats = useCallback(() => {
    const stats = {
      total: files.length,
      pending: files.filter(f => f.status === 'pending').length,
      validating: files.filter(f => f.status === 'validating').length,
      uploading: files.filter(f => f.status === 'uploading').length,
      processing: files.filter(f => f.status === 'processing').length,
      completed: files.filter(f => f.status === 'completed').length,
      error: files.filter(f => f.status === 'error').length,
    };

    return stats;
  }, [files]);

  return {
    files,
    globalError,
    isProcessing,
    addFiles,
    removeFile,
    processFiles,
    resetFiles,
    updateFileStatus,
    getStats,
    canAddMore: files.length < maxFiles,
    hasFilesToProcess: files.some(f => f.status === 'pending'),
    isAnyProcessing: files.some(f => ['validating', 'uploading', 'processing'].includes(f.status))
  };
}