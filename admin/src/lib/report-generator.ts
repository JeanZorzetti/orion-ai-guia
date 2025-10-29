import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export interface ReportData {
  titulo: string;
  periodo: { inicio: Date; fim: Date };
  dados: Record<string, string | number | Date>[];
  resumo?: Record<string, string | number>;
  cabecalhos?: string[];
}

// Exportar para CSV
export const exportToCSV = (data: ReportData): void => {
  const { titulo, periodo, dados, cabecalhos } = data;

  // Determinar cabeçalhos
  const headers = cabecalhos || (dados.length > 0 ? Object.keys(dados[0]) : []);

  // Criar conteúdo CSV
  let csvContent = `${titulo}\n`;
  csvContent += `Período: ${format(periodo.inicio, 'dd/MM/yyyy', { locale: ptBR })} a ${format(periodo.fim, 'dd/MM/yyyy', { locale: ptBR })}\n\n`;

  // Adicionar cabeçalhos
  csvContent += headers.join(',') + '\n';

  // Adicionar dados
  dados.forEach(row => {
    const values = headers.map(header => {
      const value = row[header];
      // Tratar valores especiais
      if (value === null || value === undefined) return '';
      if (typeof value === 'number') return value.toString();
      if (value instanceof Date) return format(value, 'dd/MM/yyyy', { locale: ptBR });
      // Escapar vírgulas e aspas
      const stringValue = String(value);
      if (stringValue.includes(',') || stringValue.includes('"')) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      return stringValue;
    });
    csvContent += values.join(',') + '\n';
  });

  // Criar e baixar arquivo
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', `${sanitizeFilename(titulo)}_${format(new Date(), 'yyyyMMdd_HHmmss')}.csv`);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Exportar para JSON
export const exportToJSON = (data: ReportData): void => {
  const { titulo, periodo, dados, resumo } = data;

  const jsonData = {
    titulo,
    periodo: {
      inicio: format(periodo.inicio, 'yyyy-MM-dd'),
      fim: format(periodo.fim, 'yyyy-MM-dd')
    },
    geradoEm: new Date().toISOString(),
    resumo,
    dados
  };

  const jsonString = JSON.stringify(jsonData, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', `${sanitizeFilename(titulo)}_${format(new Date(), 'yyyyMMdd_HHmmss')}.json`);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Exportar para Excel (formato básico via CSV com extensão .xlsx)
export const exportToExcel = (data: ReportData): void => {
  const { titulo, periodo, dados, cabecalhos } = data;

  // Usar mesma lógica do CSV mas com extensão .xlsx
  const headers = cabecalhos || (dados.length > 0 ? Object.keys(dados[0]) : []);

  let csvContent = `${titulo}\n`;
  csvContent += `Período: ${format(periodo.inicio, 'dd/MM/yyyy', { locale: ptBR })} a ${format(periodo.fim, 'dd/MM/yyyy', { locale: ptBR })}\n\n`;

  csvContent += headers.join('\t') + '\n'; // Usar TAB ao invés de vírgula

  dados.forEach(row => {
    const values = headers.map(header => {
      const value = row[header];
      if (value === null || value === undefined) return '';
      if (typeof value === 'number') return value.toString();
      if (value instanceof Date) return format(value, 'dd/MM/yyyy', { locale: ptBR });
      return String(value);
    });
    csvContent += values.join('\t') + '\n';
  });

  const blob = new Blob([csvContent], { type: 'application/vnd.ms-excel' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', `${sanitizeFilename(titulo)}_${format(new Date(), 'yyyyMMdd_HHmmss')}.xls`);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Imprimir relatório
export const printReport = (data: ReportData): void => {
  const { titulo, periodo, dados, resumo, cabecalhos } = data;

  // Criar janela de impressão
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Por favor, permita pop-ups para imprimir o relatório');
    return;
  }

  const headers = cabecalhos || (dados.length > 0 ? Object.keys(dados[0]) : []);

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${titulo}</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          padding: 20px;
        }
        h1 {
          color: #333;
          border-bottom: 2px solid #3b82f6;
          padding-bottom: 10px;
        }
        .periodo {
          color: #666;
          margin-bottom: 20px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 20px;
        }
        th, td {
          border: 1px solid #ddd;
          padding: 8px;
          text-align: left;
        }
        th {
          background-color: #3b82f6;
          color: white;
        }
        tr:nth-child(even) {
          background-color: #f9f9f9;
        }
        .resumo {
          background-color: #f0f9ff;
          padding: 15px;
          border-radius: 5px;
          margin: 20px 0;
        }
        @media print {
          body { padding: 0; }
        }
      </style>
    </head>
    <body>
      <h1>${titulo}</h1>
      <div class="periodo">
        Período: ${format(periodo.inicio, 'dd/MM/yyyy', { locale: ptBR })} a ${format(periodo.fim, 'dd/MM/yyyy', { locale: ptBR })}
      </div>

      ${resumo ? `
        <div class="resumo">
          <h3>Resumo</h3>
          ${Object.entries(resumo).map(([key, value]) => `
            <p><strong>${key}:</strong> ${value}</p>
          `).join('')}
        </div>
      ` : ''}

      <table>
        <thead>
          <tr>
            ${headers.map(header => `<th>${header}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          ${dados.map(row => `
            <tr>
              ${headers.map(header => {
                const value = row[header];
                if (value === null || value === undefined) return '<td></td>';
                if (typeof value === 'number') return `<td>${value.toLocaleString('pt-BR')}</td>`;
                if (value instanceof Date) return `<td>${format(value, 'dd/MM/yyyy', { locale: ptBR })}</td>`;
                return `<td>${value}</td>`;
              }).join('')}
            </tr>
          `).join('')}
        </tbody>
      </table>

      <script>
        window.onload = function() {
          window.print();
        }
      </script>
    </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
};

// Função auxiliar para sanitizar nome de arquivo
const sanitizeFilename = (filename: string): string => {
  return filename
    .replace(/[^a-z0-9]/gi, '_')
    .replace(/_+/g, '_')
    .toLowerCase();
};
