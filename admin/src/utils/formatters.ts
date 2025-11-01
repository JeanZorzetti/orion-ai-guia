/**
 * Utilitários de formatação seguros
 */

/**
 * Formata um número como moeda brasileira de forma segura
 * Retorna "R$ 0,00" se o valor for undefined, null ou NaN
 */
export function formatCurrency(
  value: number | null | undefined,
  options?: Intl.NumberFormatOptions
): string {
  const safeValue = value || 0;

  const defaultOptions: Intl.NumberFormatOptions = {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    ...options,
  };

  return `R$ ${safeValue.toLocaleString('pt-BR', defaultOptions)}`;
}

/**
 * Formata um número de forma segura
 * Retorna "0" se o valor for undefined, null ou NaN
 */
export function formatNumber(
  value: number | null | undefined,
  options?: Intl.NumberFormatOptions
): string {
  const safeValue = value || 0;
  return safeValue.toLocaleString('pt-BR', options);
}

/**
 * Formata uma porcentagem de forma segura
 * Retorna "0%" se o valor for undefined, null ou NaN
 */
export function formatPercent(
  value: number | null | undefined,
  decimals: number = 1
): string {
  const safeValue = value || 0;
  return `${safeValue.toFixed(decimals)}%`;
}
