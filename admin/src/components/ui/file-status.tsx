'use client';

import React from 'react';
import {
  Upload,
  File,
  X,
  AlertCircle,
  CheckCircle,
  Loader2,
  Clock,
  Search,
  Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { UploadFile, FileStatus } from '@/hooks/useFileUpload';

interface FileStatusProps {
  file: UploadFile;
  onRemove?: (fileId: string) => void;
  className?: string;
}

const statusConfig: Record<FileStatus, {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  color: string;
  bgColor: string;
  textColor: string;
}> = {
  pending: {
    icon: Clock,
    label: 'Aguardando',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100 dark:bg-blue-900/20',
    textColor: 'text-blue-800 dark:text-blue-200'
  },
  validating: {
    icon: Search,
    label: 'Validando',
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-100 dark:bg-yellow-900/20',
    textColor: 'text-yellow-800 dark:text-yellow-200'
  },
  uploading: {
    icon: Upload,
    label: 'Enviando',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100 dark:bg-blue-900/20',
    textColor: 'text-blue-800 dark:text-blue-200'
  },
  processing: {
    icon: Zap,
    label: 'Processando',
    color: 'text-purple-600',
    bgColor: 'bg-purple-100 dark:bg-purple-900/20',
    textColor: 'text-purple-800 dark:text-purple-200'
  },
  completed: {
    icon: CheckCircle,
    label: 'Concluído',
    color: 'text-green-600',
    bgColor: 'bg-green-100 dark:bg-green-900/20',
    textColor: 'text-green-800 dark:text-green-200'
  },
  error: {
    icon: AlertCircle,
    label: 'Erro',
    color: 'text-red-600',
    bgColor: 'bg-red-100 dark:bg-red-900/20',
    textColor: 'text-red-800 dark:text-red-200'
  }
};

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const getFileIcon = (file: UploadFile) => {
  if (file.type.startsWith('image/')) {
    return file.preview ? (
      <img
        src={file.preview}
        alt={file.name}
        className="w-10 h-10 object-cover rounded border"
      />
    ) : <File className="w-10 h-10 text-blue-500" />;
  } else if (file.type === 'application/pdf') {
    return <File className="w-10 h-10 text-red-500" />;
  }
  return <File className="w-10 h-10 text-gray-500" />;
};

export function FileStatus({ file, onRemove, className }: FileStatusProps) {
  const config = statusConfig[file.status];
  const StatusIcon = config.icon;
  const isProcessing = ['validating', 'uploading', 'processing'].includes(file.status);

  return (
    <div
      className={cn(
        'flex items-center space-x-3 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm',
        className
      )}
    >
      {/* File Icon */}
      <div className="flex-shrink-0">
        {getFileIcon(file)}
      </div>

      {/* File Info */}
      <div className="flex-1 min-w-0 space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
            {file.name}
          </p>
          <div className="flex items-center space-x-2">
            {/* Status Badge */}
            <div className={cn(
              'flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium',
              config.bgColor,
              config.textColor
            )}>
              {isProcessing ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <StatusIcon className="w-3 h-3" />
              )}
              <span>{config.label}</span>
            </div>

            {/* Remove Button */}
            {!isProcessing && onRemove && (
              <button
                onClick={() => onRemove(file.id)}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                title="Remover arquivo"
              >
                <X className="w-4 h-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
              </button>
            )}
          </div>
        </div>

        {/* File Details */}
        <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
          <span>{formatFileSize(file.size)}</span>
          <span>•</span>
          <span>{file.type}</span>
        </div>

        {/* Progress Bar */}
        {isProcessing && file.progress > 0 && (
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
              <span>{config.label}...</span>
              <span>{Math.round(file.progress)}%</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className={cn(
                  'h-2 rounded-full transition-all duration-300',
                  file.status === 'uploading' ? 'bg-blue-500' :
                  file.status === 'processing' ? 'bg-purple-500' :
                  'bg-yellow-500'
                )}
                style={{ width: `${file.progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Error Message */}
        {file.status === 'error' && file.error && (
          <div className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-2 rounded border-l-2 border-red-500">
            {file.error}
          </div>
        )}

        {/* Success Message */}
        {file.status === 'completed' && (
          <div className="text-xs text-green-600 dark:text-green-400">
            ✓ Processamento concluído com sucesso
          </div>
        )}
      </div>
    </div>
  );
}

interface FileListProps {
  files: UploadFile[];
  onRemove?: (fileId: string) => void;
  className?: string;
}

export function FileList({ files, onRemove, className }: FileListProps) {
  if (files.length === 0) return null;

  return (
    <div className={cn('space-y-3', className)}>
      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
        {files.length === 1 ? 'Arquivo:' : `${files.length} Arquivos:`}
      </h4>
      <div className="space-y-2">
        {files.map((file) => (
          <FileStatus
            key={file.id}
            file={file}
            onRemove={onRemove}
          />
        ))}
      </div>
    </div>
  );
}