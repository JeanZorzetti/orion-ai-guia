import ExcelJS from 'exceljs';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { ReportConfig, ReportData } from '@/types/report';

export class ExcelGenerator {
  private workbook: ExcelJS.Workbook;
  private config: ReportConfig;
  private data: ReportData;

  constructor(config: ReportConfig, data: ReportData) {
    this.workbook = new ExcelJS.Workbook();
    this.config = config;
    this.data = data;

    // Metadados
    this.workbook.creator = 'Orion ERP';
    this.workbook.created = new Date();
    this.workbook.modified = new Date();
    this.workbook.lastPrinted = new Date();
    this.workbook.properties.date1904 = false;
    this.workbook.company = 'Orion ERP';
    this.workbook.manager = 'Sistema';
  }

  async generate(): Promise<Blob> {
    // Resumo
    if (this.config.visualizacao.incluirResumo && this.data.resumo.length > 0) {
      this.addResumoSheet();
    }

    // Dados Detalhados
    if (this.config.visualizacao.incluirTabelas && this.data.colunas.length > 0) {
      this.addDadosSheet();
    }

    // Gráficos (dados do gráfico em planilha separada)
    if (this.config.visualizacao.incluirGraficos && this.data.graficos.length > 0) {
      this.data.graficos.forEach((grafico, idx) => {
        this.addGraficoSheet(grafico, idx);
      });
    }

    const buffer = await this.workbook.xlsx.writeBuffer();
    return new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });
  }

  private addResumoSheet(): void {
    const sheet = this.workbook.addWorksheet('Resumo Executivo', {
      pageSetup: { paperSize: 9, orientation: 'portrait' },
      views: [{ showGridLines: false }]
    });

    // Cabeçalho
    sheet.mergeCells('A1:D1');
    const titleCell = sheet.getCell('A1');
    titleCell.value = this.config.nome;
    titleCell.font = { size: 18, bold: true, color: { argb: 'FF3B82F6' } };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    sheet.getRow(1).height = 30;

    // Período
    sheet.mergeCells('A2:D2');
    const periodoCell = sheet.getCell('A2');
    periodoCell.value = `Período: ${format(this.config.periodo.inicio, 'dd/MM/yyyy', { locale: ptBR })} a ${format(this.config.periodo.fim, 'dd/MM/yyyy', { locale: ptBR })}`;
    periodoCell.font = { size: 11, color: { argb: 'FF6B7280' } };
    periodoCell.alignment = { horizontal: 'center' };

    // Espaço
    sheet.getRow(3).height = 10;

    // Cabeçalhos da tabela
    sheet.getCell('A4').value = 'Indicador';
    sheet.getCell('B4').value = 'Valor';
    sheet.getCell('C4').value = 'Variação';
    sheet.getCell('D4').value = 'Status';

    const headerRow = sheet.getRow(4);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF3B82F6' }
    };
    headerRow.alignment = { horizontal: 'center', vertical: 'middle' };
    headerRow.height = 25;

    // Dados do resumo
    let row = 5;
    this.data.resumo.forEach((item) => {
      sheet.getCell(`A${row}`).value = item.label;
      sheet.getCell(`A${row}`).font = { bold: true };

      sheet.getCell(`B${row}`).value = item.valor;
      sheet.getCell(`B${row}`).alignment = { horizontal: 'right' };

      if (item.variacao !== undefined) {
        sheet.getCell(`C${row}`).value = `${item.variacao > 0 ? '+' : ''}${item.variacao.toFixed(1)}%`;
        sheet.getCell(`C${row}`).font = {
          color: { argb: item.variacao > 0 ? 'FF10B981' : 'FFEF4444' }
        };
        sheet.getCell(`C${row}`).alignment = { horizontal: 'center' };

        // Ícone de tendência
        sheet.getCell(`D${row}`).value = item.variacao > 0 ? '↑' : '↓';
        sheet.getCell(`D${row}`).font = {
          size: 14,
          color: { argb: item.variacao > 0 ? 'FF10B981' : 'FFEF4444' }
        };
        sheet.getCell(`D${row}`).alignment = { horizontal: 'center' };
      }

      // Zebra striping
      if (row % 2 === 0) {
        sheet.getRow(row).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF9FAFB' }
        };
      }

      row++;
    });

    // Bordas
    for (let r = 4; r < row; r++) {
      for (let c = 1; c <= 4; c++) {
        const cell = sheet.getRow(r).getCell(c);
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFE5E7EB' } },
          left: { style: 'thin', color: { argb: 'FFE5E7EB' } },
          bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
          right: { style: 'thin', color: { argb: 'FFE5E7EB' } }
        };
      }
    }

    // Ajustar largura das colunas
    sheet.getColumn('A').width = 35;
    sheet.getColumn('B').width = 20;
    sheet.getColumn('C').width = 15;
    sheet.getColumn('D').width = 10;

    // Rodapé
    sheet.getCell(`A${row + 2}`).value = `Gerado em: ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`;
    sheet.getCell(`A${row + 2}`).font = { size: 9, color: { argb: 'FF9CA3AF' } };
  }

  private addDadosSheet(): void {
    const sheet = this.workbook.addWorksheet('Dados Detalhados');

    // Cabeçalho
    const headerRow = sheet.addRow(this.data.colunas);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF3B82F6' }
    };
    headerRow.alignment = { horizontal: 'center', vertical: 'middle' };
    headerRow.height = 20;

    // Bordas do cabeçalho
    headerRow.eachCell((cell) => {
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
    });

    // Dados
    this.data.linhas.forEach((linha, index) => {
      const row = sheet.addRow(linha);

      // Zebra striping
      if (index % 2 === 1) {
        row.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF9FAFB' }
        };
      }

      // Bordas
      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFE5E7EB' } },
          left: { style: 'thin', color: { argb: 'FFE5E7EB' } },
          bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
          right: { style: 'thin', color: { argb: 'FFE5E7EB' } }
        };
      });

      // Colorir valores negativos
      row.eachCell((cell, colNumber) => {
        if (colNumber > 3) {
          const value = String(cell.value);
          if (value.includes('-R$') || (value.startsWith('-') && !isNaN(Number(value)))) {
            cell.font = { color: { argb: 'FFEF4444' } };
          }
        }
      });
    });

    // Formatação de colunas
    sheet.columns.forEach((column, index) => {
      let maxLength = this.data.colunas[index].length;
      this.data.linhas.forEach((linha) => {
        const cellLength = String(linha[index]).length;
        if (cellLength > maxLength) {
          maxLength = cellLength;
        }
      });
      column.width = Math.min(Math.max(maxLength + 2, 12), 40);
    });

    // Filtros
    sheet.autoFilter = {
      from: 'A1',
      to: `${String.fromCharCode(64 + this.data.colunas.length)}1`
    };

    // Congelar primeira linha
    sheet.views = [
      { state: 'frozen', ySplit: 1 }
    ];
  }

  private addGraficoSheet(grafico: ReportData['graficos'][0], index: number): void {
    const sheetName = `Graf${index + 1} - ${grafico.titulo.substring(0, 20)}`;
    const sheet = this.workbook.addWorksheet(sheetName);

    // Título
    sheet.mergeCells('A1:C1');
    const titleCell = sheet.getCell('A1');
    titleCell.value = grafico.titulo;
    titleCell.font = { size: 14, bold: true, color: { argb: 'FF3B82F6' } };
    titleCell.alignment = { horizontal: 'center' };
    sheet.getRow(1).height = 25;

    // Tipo do gráfico
    sheet.getCell('A2').value = `Tipo: ${grafico.tipo.charAt(0).toUpperCase() + grafico.tipo.slice(1)}`;
    sheet.getCell('A2').font = { size: 10, color: { argb: 'FF6B7280' } };

    // Espaço
    sheet.getRow(3).height = 10;

    // Cabeçalhos
    const headers = Object.keys(grafico.dados[0] || {});
    const headerRow = sheet.addRow(headers);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF8B5CF6' }
    };
    headerRow.alignment = { horizontal: 'center' };

    // Dados
    grafico.dados.forEach((item) => {
      const values = headers.map(header => item[header]);
      sheet.addRow(values);
    });

    // Formatação
    sheet.columns.forEach((column) => {
      column.width = 18;
    });

    // Congelar cabeçalho
    sheet.views = [
      { state: 'frozen', ySplit: 4 }
    ];
  }
}

// Função helper para gerar e baixar Excel
export const generateAndDownloadExcel = async (
  config: ReportConfig,
  data: ReportData
): Promise<void> => {
  const generator = new ExcelGenerator(config, data);
  const blob = await generator.generate();

  // Criar link de download
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${sanitizeFilename(config.nome)}.xlsx`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-z0-9]/gi, '_')
    .replace(/_+/g, '_')
    .toLowerCase();
}
