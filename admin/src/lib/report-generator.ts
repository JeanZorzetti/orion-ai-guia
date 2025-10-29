import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { ReportConfig, ReportData } from '@/types/report';
import { generateAndDownloadPDF } from './pdf-generator';
import { generateAndDownloadExcel } from './excel-generator';

// Re-export types for backward compatibility
export type { ReportData, ReportConfig } from '@/types/report';

// Função principal para gerar relatório no formato selecionado
export const generateReport = async (
  config: ReportConfig,
  data: ReportData
): Promise<void> => {
  switch (config.exportacao.formato) {
    case 'pdf':
      await generateAndDownloadPDF(config, data);
      break;
    case 'excel':
      await generateAndDownloadExcel(config, data);
      break;
    case 'csv':
      exportToCSV(config, data);
      break;
    case 'json':
      exportToJSON(config, data);
      break;
    default:
      throw new Error(`Formato não suportado: ${config.exportacao.formato}`);
  }
};

// Exportar para CSV
export const exportToCSV = (config: ReportConfig, data: ReportData): void => {
  // Determinar cabeçalhos
  const headers = data.colunas;

  // Criar conteúdo CSV
  let csvContent = `${config.nome}\n`;
  csvContent += `Período: ${format(config.periodo.inicio, 'dd/MM/yyyy', { locale: ptBR })} a ${format(config.periodo.fim, 'dd/MM/yyyy', { locale: ptBR })}\n\n`;

  // Adicionar cabeçalhos
  csvContent += headers.join(',') + '\n';

  // Adicionar dados
  data.linhas.forEach(row => {
    const values = row.map(value => {
      // Tratar valores especiais
      if (value === null || value === undefined) return '';
      if (typeof value === 'number') return value.toString();
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
  link.setAttribute('download', `${sanitizeFilename(config.nome)}_${format(new Date(), 'yyyyMMdd_HHmmss')}.csv`);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

// Exportar para JSON
export const exportToJSON = (config: ReportConfig, data: ReportData): void => {
  const jsonData = {
    nome: config.nome,
    tipo: config.tipo,
    subtipo: config.subtipo,
    periodo: {
      inicio: format(config.periodo.inicio, 'yyyy-MM-dd'),
      fim: format(config.periodo.fim, 'yyyy-MM-dd')
    },
    geradoEm: new Date().toISOString(),
    resumo: data.resumo,
    graficos: data.graficos,
    tabela: {
      colunas: data.colunas,
      linhas: data.linhas
    },
    config: {
      visualizacao: config.visualizacao,
      exportacao: config.exportacao
    }
  };

  const jsonString = JSON.stringify(jsonData, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', `${sanitizeFilename(config.nome)}_${format(new Date(), 'yyyyMMdd_HHmmss')}.json`);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

// Imprimir relatório (versão básica - pode ser melhorada com html2canvas)
export const printReport = (config: ReportConfig, data: ReportData): void => {
  // Criar janela de impressão
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Por favor, permita pop-ups para imprimir o relatório');
    return;
  }

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${config.nome}</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          padding: 20px;
          color: #333;
        }
        .header {
          text-align: center;
          border-bottom: 3px solid #3b82f6;
          padding-bottom: 20px;
          margin-bottom: 30px;
        }
        h1 {
          color: #3b82f6;
          margin: 0;
          font-size: 28px;
        }
        .periodo {
          color: #666;
          margin-top: 10px;
          font-size: 14px;
        }
        .resumo {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 15px;
          margin: 30px 0;
        }
        .kpi-card {
          background-color: #f9fafb;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 15px;
        }
        .kpi-label {
          font-size: 12px;
          color: #6b7280;
          margin-bottom: 5px;
        }
        .kpi-value {
          font-size: 22px;
          font-weight: bold;
          color: #111827;
        }
        .kpi-variacao {
          font-size: 11px;
          margin-top: 5px;
        }
        .kpi-variacao.positiva {
          color: #10b981;
        }
        .kpi-variacao.negativa {
          color: #ef4444;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 30px;
          font-size: 12px;
        }
        th, td {
          border: 1px solid #e5e7eb;
          padding: 10px;
          text-align: left;
        }
        th {
          background-color: #3b82f6;
          color: white;
          font-weight: bold;
        }
        tr:nth-child(even) {
          background-color: #f9fafb;
        }
        .footer {
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px solid #e5e7eb;
          text-align: center;
          font-size: 11px;
          color: #9ca3af;
        }
        @media print {
          body { padding: 10mm; }
          .no-print { display: none; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>${config.nome}</h1>
        <div class="periodo">
          Período: ${format(config.periodo.inicio, 'dd/MM/yyyy', { locale: ptBR })} a ${format(config.periodo.fim, 'dd/MM/yyyy', { locale: ptBR })}
        </div>
      </div>

      ${data.resumo.length > 0 ? `
        <div class="resumo">
          ${data.resumo.map(item => `
            <div class="kpi-card">
              <div class="kpi-label">${item.label}</div>
              <div class="kpi-value">${item.valor}</div>
              ${item.variacao !== undefined ? `
                <div class="kpi-variacao ${item.variacao > 0 ? 'positiva' : 'negativa'}">
                  ${item.variacao > 0 ? '+' : ''}${item.variacao.toFixed(1)}% vs período anterior
                </div>
              ` : ''}
            </div>
          `).join('')}
        </div>
      ` : ''}

      ${data.colunas.length > 0 ? `
        <table>
          <thead>
            <tr>
              ${data.colunas.map(header => `<th>${header}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${data.linhas.slice(0, 100).map(row => `
              <tr>
                ${row.map(cell => `<td>${cell}</td>`).join('')}
              </tr>
            `).join('')}
          </tbody>
        </table>
        ${data.linhas.length > 100 ? `
          <p style="text-align: center; margin-top: 20px; color: #6b7280;">
            Mostrando 100 de ${data.linhas.length} registros
          </p>
        ` : ''}
      ` : ''}

      <div class="footer">
        <p>Gerado em: ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</p>
        <p>Orion ERP - Sistema de Gestão Empresarial</p>
      </div>

      <script>
        window.onload = function() {
          setTimeout(() => {
            window.print();
          }, 500);
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

// Backward compatibility function for old Cash Flow module
export const exportToExcel = (config: ReportConfig, data: ReportData): Promise<void> => {
  return generateAndDownloadExcel(config, data);
};
