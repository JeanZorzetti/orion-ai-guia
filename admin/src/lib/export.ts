import { format } from 'date-fns';

/**
 * Converte um array de objetos em CSV e inicia o download
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function exportToCSV<T extends Record<string, any>>(
  data: T[],
  filename: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  columns?: { key: keyof T; label: string; format?: (value: any) => string }[]
) {
  if (data.length === 0) {
    return;
  }

  // Se não houver colunas especificadas, usar todas as chaves do primeiro objeto
  const cols = columns || Object.keys(data[0]).map((key) => ({ key, label: key }));

  // Criar header do CSV
  const header = cols.map((col) => col.label).join(',');

  // Criar linhas do CSV
  const rows = data.map((row) => {
    return cols
      .map((col) => {
        const value = row[col.key];

        // Converter para string e escapar vírgulas e aspas
        if (value === null || value === undefined) {
          return '';
        }

        // Aplicar formatação customizada se fornecida
        let stringValue: string;
        if ('format' in col && col.format) {
          stringValue = col.format(value);
        } else {
          stringValue = String(value);
        }

        // Se contém vírgula, aspas ou quebra de linha, envolver em aspas
        if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }

        return stringValue;
      })
      .join(',');
  });

  // Combinar header e rows
  const csv = [header, ...rows].join('\n');

  // Criar blob e fazer download
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' }); // BOM para UTF-8
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  // Adicionar timestamp ao nome do arquivo
  const timestamp = format(new Date(), 'yyyy-MM-dd_HH-mm-ss');
  const filenameWithTimestamp = `${filename}_${timestamp}.csv`;

  link.setAttribute('href', url);
  link.setAttribute('download', filenameWithTimestamp);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Formata um valor de moeda para exportação
 */
export function formatCurrencyForExport(value: number | null | undefined): string {
  if (value === null || value === undefined) return '0.00';
  return value.toFixed(2).replace('.', ','); // Formato brasileiro
}

/**
 * Formata uma data para exportação
 */
export function formatDateForExport(date: string | null | undefined): string {
  if (!date) return '';
  try {
    return format(new Date(date), 'dd/MM/yyyy');
  } catch {
    return date;
  }
}

/**
 * Formata data e hora para exportação
 */
export function formatDateTimeForExport(date: string | null | undefined): string {
  if (!date) return '';
  try {
    return format(new Date(date), 'dd/MM/yyyy HH:mm');
  } catch {
    return date;
  }
}
