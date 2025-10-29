import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { ReportConfig, ReportData } from '@/types/report';

export class PDFGenerator {
  private doc: jsPDF;
  private config: ReportConfig;
  private data: ReportData;
  private pageNumber = 0;
  private totalPages = 0;

  constructor(config: ReportConfig, data: ReportData) {
    this.config = config;
    this.data = data;
    this.doc = new jsPDF({
      orientation: config.exportacao.orientacao || 'portrait',
      unit: 'mm',
      format: 'a4'
    });
  }

  async generate(): Promise<Blob> {
    // Calcular total de páginas primeiro
    this.calculateTotalPages();

    // Capa
    if (this.config.exportacao.incluirCapa) {
      this.addCapa();
      this.doc.addPage();
      this.pageNumber++;
    }

    // Índice
    if (this.config.exportacao.incluirIndice) {
      this.addIndice();
      this.doc.addPage();
      this.pageNumber++;
    }

    // Resumo Executivo
    if (this.config.visualizacao.incluirResumo && this.data.resumo.length > 0) {
      this.addResumo();
      this.doc.addPage();
      this.pageNumber++;
    }

    // Gráficos (placeholder - será implementado com html2canvas se necessário)
    if (this.config.visualizacao.incluirGraficos && this.data.graficos.length > 0) {
      this.addGraficosPlaceholder();
      this.doc.addPage();
      this.pageNumber++;
    }

    // Tabelas
    if (this.config.visualizacao.incluirTabelas && this.data.colunas.length > 0) {
      this.addTabelas();
    }

    return this.doc.output('blob');
  }

  private calculateTotalPages(): void {
    let pages = 0;
    if (this.config.exportacao.incluirCapa) pages++;
    if (this.config.exportacao.incluirIndice) pages++;
    if (this.config.visualizacao.incluirResumo) pages++;
    if (this.config.visualizacao.incluirGraficos) pages += Math.ceil(this.data.graficos.length / 2);
    if (this.config.visualizacao.incluirTabelas) {
      // Estimar páginas baseado no número de linhas (aproximadamente 40 linhas por página)
      pages += Math.ceil(this.data.linhas.length / 40);
    }
    this.totalPages = Math.max(pages, 1);
  }

  private addCapa(): void {
    const pageWidth = this.doc.internal.pageSize.getWidth();
    const pageHeight = this.doc.internal.pageSize.getHeight();

    // Fundo colorido no topo
    this.doc.setFillColor(59, 130, 246); // #3B82F6
    this.doc.rect(0, 0, pageWidth, 80, 'F');

    // Logo/Título da Empresa
    if (this.config.exportacao.logoEmpresa) {
      this.doc.setFontSize(32);
      this.doc.setFont('helvetica', 'bold');
      this.doc.setTextColor(255, 255, 255);
      this.doc.text('Orion ERP', pageWidth / 2, 40, { align: 'center' });
    }

    // Título do Relatório
    this.doc.setFontSize(28);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(0, 0, 0);
    this.doc.text(this.config.nome, pageWidth / 2, 110, { align: 'center' });

    // Subtítulo com tipo
    this.doc.setFontSize(14);
    this.doc.setFont('helvetica', 'normal');
    this.doc.setTextColor(100, 100, 100);
    const tipoLabel = this.config.tipo.charAt(0).toUpperCase() + this.config.tipo.slice(1);
    this.doc.text(`Relatório ${tipoLabel}`, pageWidth / 2, 120, { align: 'center' });

    // Período
    this.doc.setFontSize(12);
    const periodoText = `Período: ${format(this.config.periodo.inicio, 'dd/MM/yyyy', { locale: ptBR })} a ${format(this.config.periodo.fim, 'dd/MM/yyyy', { locale: ptBR })}`;
    this.doc.text(periodoText, pageWidth / 2, 140, { align: 'center' });

    // Linha decorativa
    this.doc.setDrawColor(59, 130, 246);
    this.doc.setLineWidth(0.5);
    this.doc.line(40, 155, pageWidth - 40, 155);

    // Data de geração
    this.doc.setFontSize(10);
    this.doc.setTextColor(150, 150, 150);
    const geradoEm = `Gerado em: ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`;
    this.doc.text(geradoEm, pageWidth / 2, pageHeight - 20, { align: 'center' });
  }

  private addIndice(): void {
    this.pageNumber++;
    const pageWidth = this.doc.internal.pageSize.getWidth();

    this.doc.setFontSize(20);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('Índice', pageWidth / 2, 30, { align: 'center' });

    let y = 50;
    const items: { label: string; page: number }[] = [];

    let currentPage = 1;
    if (this.config.exportacao.incluirCapa) currentPage++;
    if (this.config.exportacao.incluirIndice) currentPage++;

    if (this.config.visualizacao.incluirResumo) {
      items.push({ label: 'Resumo Executivo', page: currentPage });
      currentPage++;
    }

    if (this.config.visualizacao.incluirGraficos) {
      items.push({ label: 'Análise Visual', page: currentPage });
      currentPage += Math.ceil(this.data.graficos.length / 2);
    }

    if (this.config.visualizacao.incluirTabelas) {
      items.push({ label: 'Dados Detalhados', page: currentPage });
    }

    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'normal');

    items.forEach((item) => {
      // Item
      this.doc.text(item.label, 30, y);

      // Linha pontilhada
      const dots = '.'.repeat(80);
      this.doc.setTextColor(200, 200, 200);
      this.doc.text(dots, 35, y);
      this.doc.setTextColor(0, 0, 0);

      // Número da página
      this.doc.text(item.page.toString(), pageWidth - 30, y, { align: 'right' });

      y += 10;
    });

    this.addRodape();
  }

  private addResumo(): void {
    this.pageNumber++;

    this.doc.setFontSize(18);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('Resumo Executivo', 20, 25);

    const startY = 40;
    const boxWidth = 85;
    const boxHeight = 30;
    const gap = 10;
    const itemsPerRow = 2;

    this.data.resumo.forEach((item, index) => {
      const col = index % itemsPerRow;
      const row = Math.floor(index / itemsPerRow);
      const x = 20 + col * (boxWidth + gap);
      const currentY = startY + row * (boxHeight + gap);

      // Box de fundo
      this.doc.setFillColor(249, 250, 251);
      this.doc.roundedRect(x, currentY, boxWidth, boxHeight, 3, 3, 'F');

      // Borda
      this.doc.setDrawColor(229, 231, 235);
      this.doc.setLineWidth(0.5);
      this.doc.roundedRect(x, currentY, boxWidth, boxHeight, 3, 3, 'S');

      // Label
      this.doc.setFontSize(9);
      this.doc.setFont('helvetica', 'normal');
      this.doc.setTextColor(107, 114, 128);
      this.doc.text(item.label, x + 5, currentY + 8);

      // Valor
      this.doc.setFontSize(16);
      this.doc.setFont('helvetica', 'bold');
      this.doc.setTextColor(0, 0, 0);
      this.doc.text(item.valor, x + 5, currentY + 20);

      // Variação
      if (item.variacao !== undefined) {
        const variacaoText = `${item.variacao > 0 ? '+' : ''}${item.variacao.toFixed(1)}%`;
        this.doc.setFontSize(8);
        this.doc.setFont('helvetica', 'normal');
        this.doc.setTextColor(item.variacao > 0 ? 22 : 220, item.variacao > 0 ? 163 : 38, item.variacao > 0 ? 74 : 38);
        this.doc.text(variacaoText, x + 5, currentY + 26);
      }
    });

    this.addRodape();
  }

  private addGraficosPlaceholder(): void {
    this.pageNumber++;

    this.doc.setFontSize(18);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('Análise Visual', 20, 25);

    let y = 40;

    this.data.graficos.forEach((grafico) => {
      // Título do gráfico
      this.doc.setFontSize(12);
      this.doc.setFont('helvetica', 'bold');
      this.doc.text(grafico.titulo, 20, y);

      // Box placeholder para o gráfico
      y += 5;
      this.doc.setFillColor(249, 250, 251);
      this.doc.roundedRect(20, y, 170, 60, 3, 3, 'F');
      this.doc.setDrawColor(229, 231, 235);
      this.doc.roundedRect(20, y, 170, 60, 3, 3, 'S');

      // Texto placeholder
      this.doc.setFontSize(10);
      this.doc.setFont('helvetica', 'normal');
      this.doc.setTextColor(156, 163, 175);
      this.doc.text(`Gráfico de ${grafico.tipo}`, 105, y + 25, { align: 'center' });
      this.doc.text(`${grafico.dados.length} pontos de dados`, 105, y + 35, { align: 'center' });

      y += 70;

      // Adicionar nova página se necessário
      if (y > 240) {
        this.doc.addPage();
        this.pageNumber++;
        y = 25;
      }
    });

    this.addRodape();
  }

  private addTabelas(): void {
    this.pageNumber++;

    this.doc.setFontSize(18);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('Dados Detalhados', 20, 25);

    // Usar autoTable para tabelas profissionais
    autoTable(this.doc, {
      head: [this.data.colunas],
      body: this.data.linhas.map(row => row.map(cell => String(cell))),
      startY: 35,
      theme: 'grid',
      headStyles: {
        fillColor: [59, 130, 246],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 9,
        halign: 'center'
      },
      styles: {
        fontSize: 8,
        cellPadding: 3,
        overflow: 'linebreak',
        halign: 'left'
      },
      alternateRowStyles: {
        fillColor: [249, 250, 251]
      },
      didDrawPage: () => {
        this.addRodape();
      },
      didDrawCell: (data) => {
        // Colorir valores negativos em vermelho se for coluna de valores
        if (data.section === 'body' && data.column.index > 2) {
          const cellValue = String(data.cell.raw);
          if (cellValue.includes('-R$') || (cellValue.startsWith('-') && !isNaN(Number(cellValue)))) {
            this.doc.setTextColor(220, 38, 38);
          }
        }
      }
    });
  }

  private addRodape(): void {
    const pageWidth = this.doc.internal.pageSize.getWidth();
    const pageHeight = this.doc.internal.pageSize.getHeight();

    // Linha superior
    this.doc.setDrawColor(229, 231, 235);
    this.doc.setLineWidth(0.3);
    this.doc.line(20, pageHeight - 15, pageWidth - 20, pageHeight - 15);

    this.doc.setFontSize(8);
    this.doc.setFont('helvetica', 'normal');
    this.doc.setTextColor(156, 163, 175);

    // Nome da empresa à esquerda
    this.doc.text('Orion ERP - Sistema de Gestão Empresarial', 20, pageHeight - 10);

    // Número da página à direita
    const pageText = `Página ${this.pageNumber} de ${this.totalPages}`;
    this.doc.text(pageText, pageWidth - 20, pageHeight - 10, { align: 'right' });
  }
}

// Função helper para gerar e baixar PDF
export const generateAndDownloadPDF = async (
  config: ReportConfig,
  data: ReportData
): Promise<void> => {
  const generator = new PDFGenerator(config, data);
  const blob = await generator.generate();

  // Criar link de download
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${sanitizeFilename(config.nome)}.pdf`;
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
