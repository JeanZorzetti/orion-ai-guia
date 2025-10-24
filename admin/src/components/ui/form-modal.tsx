'use client';

import React, { useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './dialog';
import { Button } from './button';
import { ButtonWithLoading } from './button-with-loading';
import { X } from 'lucide-react';

export interface FormModalProps {
  // Controle do modal
  open: boolean;
  onOpenChange: (open: boolean) => void;

  // Conteúdo do header
  title: string;
  description?: string;

  // Conteúdo do body
  children: React.ReactNode;

  // Footer
  submitLabel?: string;
  cancelLabel?: string;
  onSubmit?: () => void | Promise<void>;
  onCancel?: () => void;

  // Estados
  loading?: boolean;
  disabled?: boolean;

  // Estilização
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  className?: string;

  // Comportamento
  closeOnSubmit?: boolean;
  closeOnCancel?: boolean;
  preventClose?: boolean;
}

const sizeClasses = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
  full: 'max-w-7xl',
};

export function FormModal({
  open,
  onOpenChange,
  title,
  description,
  children,
  submitLabel = 'Salvar',
  cancelLabel = 'Cancelar',
  onSubmit,
  onCancel,
  loading = false,
  disabled = false,
  size = 'md',
  className,
  closeOnSubmit = true,
  closeOnCancel = true,
  preventClose = false,
}: FormModalProps) {
  // Handler para submit
  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }

    if (loading || disabled || !onSubmit) return;

    try {
      await onSubmit();
      if (closeOnSubmit) {
        onOpenChange(false);
      }
    } catch (error) {
      // Erro é tratado pelo componente pai
      console.error('Error in FormModal submit:', error);
    }
  };

  // Handler para cancelar
  const handleCancel = () => {
    if (loading) return;

    if (onCancel) {
      onCancel();
    }

    if (closeOnCancel) {
      onOpenChange(false);
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // ESC para fechar (se não estiver preventClose)
      if (e.key === 'Escape' && !preventClose && !loading) {
        handleCancel();
      }

      // Enter para submeter (se Ctrl/Cmd estiver pressionado)
      if (
        e.key === 'Enter' &&
        (e.ctrlKey || e.metaKey) &&
        onSubmit &&
        !loading &&
        !disabled
      ) {
        e.preventDefault();
        handleSubmit();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, loading, disabled, preventClose]);

  return (
    <Dialog open={open} onOpenChange={preventClose ? undefined : onOpenChange}>
      <DialogContent
        className={`${sizeClasses[size]} ${className || ''}`}
        onInteractOutside={(e) => {
          if (preventClose || loading) {
            e.preventDefault();
          }
        }}
        onEscapeKeyDown={(e) => {
          if (preventClose || loading) {
            e.preventDefault();
          }
        }}
      >
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <DialogTitle>{title}</DialogTitle>
                {description && (
                  <DialogDescription className="mt-2">
                    {description}
                  </DialogDescription>
                )}
              </div>
              {!preventClose && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 opacity-70 hover:opacity-100"
                  onClick={handleCancel}
                  disabled={loading}
                >
                  <X className="h-4 w-4" />
                  <span className="sr-only">Fechar</span>
                </Button>
              )}
            </div>
          </DialogHeader>

          <div className="py-4">{children}</div>

          <DialogFooter>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={loading}
                className="flex-1 sm:flex-none"
              >
                {cancelLabel}
              </Button>
              {onSubmit && (
                <ButtonWithLoading
                  type="submit"
                  loading={loading}
                  disabled={disabled}
                  className="flex-1 sm:flex-none"
                >
                  {submitLabel}
                </ButtonWithLoading>
              )}
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Versão sem form (para casos onde o form está dentro do children)
export interface FormModalWithoutFormProps
  extends Omit<FormModalProps, 'onSubmit'> {
  footer?: React.ReactNode;
}

export function FormModalWithoutForm({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  loading = false,
  size = 'md',
  className,
  preventClose = false,
}: FormModalWithoutFormProps) {
  // Handler para cancelar
  const handleClose = () => {
    if (loading || preventClose) return;
    onOpenChange(false);
  };

  // Keyboard shortcuts
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // ESC para fechar (se não estiver preventClose)
      if (e.key === 'Escape' && !preventClose && !loading) {
        handleClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, loading, preventClose]);

  return (
    <Dialog open={open} onOpenChange={preventClose ? undefined : onOpenChange}>
      <DialogContent
        className={`${sizeClasses[size]} ${className || ''}`}
        onInteractOutside={(e) => {
          if (preventClose || loading) {
            e.preventDefault();
          }
        }}
        onEscapeKeyDown={(e) => {
          if (preventClose || loading) {
            e.preventDefault();
          }
        }}
      >
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <DialogTitle>{title}</DialogTitle>
              {description && (
                <DialogDescription className="mt-2">
                  {description}
                </DialogDescription>
              )}
            </div>
            {!preventClose && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 opacity-70 hover:opacity-100"
                onClick={handleClose}
                disabled={loading}
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Fechar</span>
              </Button>
            )}
          </div>
        </DialogHeader>

        <div className="py-4">{children}</div>

        {footer && <DialogFooter>{footer}</DialogFooter>}
      </DialogContent>
    </Dialog>
  );
}
