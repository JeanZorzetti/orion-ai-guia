'use client';

import React from 'react';
import { Button } from './button';
import { Printer, Loader2 } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './tooltip';

interface PrintButtonProps {
  /**
   * Função executada ao clicar no botão
   */
  onClick: () => void;
  /**
   * Estado de carregamento/impressão
   */
  loading?: boolean;
  /**
   * Desabilitar botão
   */
  disabled?: boolean;
  /**
   * Variante do botão
   */
  variant?: 'default' | 'outline' | 'ghost' | 'secondary';
  /**
   * Tamanho do botão
   */
  size?: 'default' | 'sm' | 'lg' | 'icon';
  /**
   * Texto do botão (opcional, padrão mostra apenas ícone)
   */
  label?: string;
  /**
   * Tooltip personalizado
   */
  tooltip?: string;
  /**
   * Mostrar atalho no tooltip
   */
  showShortcut?: boolean;
  /**
   * Classes CSS adicionais
   */
  className?: string;
}

/**
 * Botão para acionar impressão com ícone de impressora
 *
 * @example
 * // Uso básico
 * <PrintButton onClick={handlePrint} />
 *
 * @example
 * // Com label e loading
 * <PrintButton
 *   onClick={handlePrint}
 *   loading={isPrinting}
 *   label="Imprimir Relatório"
 *   variant="outline"
 * />
 *
 * @example
 * // Com tooltip personalizado
 * <PrintButton
 *   onClick={handlePrint}
 *   tooltip="Imprimir lista de produtos"
 *   showShortcut
 * />
 */
export function PrintButton({
  onClick,
  loading = false,
  disabled = false,
  variant = 'outline',
  size = 'default',
  label,
  tooltip,
  showShortcut = false,
  className = '',
}: PrintButtonProps) {
  const defaultTooltip = label
    ? `Imprimir ${label.toLowerCase()}`
    : 'Imprimir página';

  const tooltipText = tooltip || defaultTooltip;
  const shortcutText = showShortcut ? ' (Ctrl+P)' : '';

  const button = (
    <Button
      variant={variant}
      size={size}
      onClick={onClick}
      disabled={disabled || loading}
      className={`print-hide ${className}`}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Printer className="h-4 w-4" />
      )}
      {label && <span className="ml-2">{label}</span>}
    </Button>
  );

  // Se não tem label, envolver com tooltip
  if (!label) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>{button}</TooltipTrigger>
          <TooltipContent>
            <p>
              {tooltipText}
              {shortcutText}
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return button;
}

/**
 * Versão compacta do PrintButton (apenas ícone)
 */
export function PrintButtonIcon({
  onClick,
  loading,
  disabled,
  tooltip,
  className,
}: Pick<
  PrintButtonProps,
  'onClick' | 'loading' | 'disabled' | 'tooltip' | 'className'
>) {
  return (
    <PrintButton
      onClick={onClick}
      loading={loading}
      disabled={disabled}
      tooltip={tooltip}
      variant="ghost"
      size="icon"
      showShortcut
      className={className}
    />
  );
}

/**
 * PrintButton com label padrão
 */
export function PrintButtonWithLabel({
  onClick,
  loading,
  disabled,
  label = 'Imprimir',
  variant = 'outline',
  className,
}: Pick<
  PrintButtonProps,
  'onClick' | 'loading' | 'disabled' | 'label' | 'variant' | 'className'
>) {
  return (
    <PrintButton
      onClick={onClick}
      loading={loading}
      disabled={disabled}
      label={label}
      variant={variant}
      className={className}
    />
  );
}
