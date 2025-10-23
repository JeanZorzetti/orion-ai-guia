import { useState, useCallback } from 'react';
import { ConfirmDialog, ConfirmDialogType } from '@/components/ui/confirm-dialog';

interface ConfirmOptions {
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  type?: ConfirmDialogType;
}

export function useConfirm() {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [options, setOptions] = useState<ConfirmOptions>({
    title: '',
    description: '',
  });
  const [onConfirmCallback, setOnConfirmCallback] = useState<(() => void | Promise<void>) | null>(null);

  const confirm = useCallback((opts: ConfirmOptions, onConfirm: () => void | Promise<void>) => {
    setOptions(opts);
    setOnConfirmCallback(() => onConfirm);
    setIsOpen(true);

    return new Promise<boolean>((resolve) => {
      const handleConfirm = async () => {
        setLoading(true);
        try {
          await onConfirm();
          resolve(true);
        } catch (error) {
          resolve(false);
        } finally {
          setLoading(false);
          setIsOpen(false);
        }
      };

      setOnConfirmCallback(() => handleConfirm);
    });
  }, []);

  const handleConfirm = async () => {
    if (onConfirmCallback) {
      setLoading(true);
      try {
        await onConfirmCallback();
      } finally {
        setLoading(false);
        setIsOpen(false);
      }
    }
  };

  const ConfirmDialogComponent = (
    <ConfirmDialog
      open={isOpen}
      onOpenChange={setIsOpen}
      title={options.title}
      description={options.description}
      confirmText={options.confirmText}
      cancelText={options.cancelText}
      type={options.type}
      loading={loading}
      onConfirm={handleConfirm}
    />
  );

  return {
    confirm,
    ConfirmDialog: ConfirmDialogComponent,
  };
}
