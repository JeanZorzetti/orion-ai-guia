# Roadmap: Módulo de Relatórios - Sistema Completo de Business Intelligence

## Visão Geral
Este roadmap define as melhorias para transformar o módulo de Relatórios em um sistema completo de Business Intelligence (BI), incorporando geração dinâmica, agendamento, visualizações interativas, análise comparativa, exportações avançadas e automação baseada em IA.

## Estado Atual

**Localizações:**
- `admin/src/app/admin/financeiro/relatorios/page.tsx`
- `admin/src/app/admin/estoque/relatorios/page.tsx`

**Funcionalidades Existentes:**

### Relatórios Financeiros:
- ✅ 6 tipos de relatórios estáticos:
  - DRE (Demonstrativo de Resultados)
  - Fluxo de Caixa Consolidado
  - Contas a Pagar - Resumo
  - Contas a Receber - Resumo
  - Análise por Categoria
  - Relatório Anual
- ✅ Cards de resumo (disponíveis, gerados no mês, último relatório)
- ✅ Botões de exportação (PDF e Excel)
- ✅ Lista de relatórios recentes (3 itens mockados)
- ✅ Dica sobre relatórios automáticos

### Relatórios de Estoque:
- ✅ 6 tipos de relatórios estáticos:
  - Posição de Estoque
  - Movimentações Consolidadas
  - Produtos Abaixo do Mínimo
  - Análise de Giro de Estoque
  - Valor de Estoque
  - Inventário Físico
- ✅ Estatísticas (produtos, valor total, baixo estoque)
- ✅ Botões de exportação (PDF e Excel)
- ✅ Lista de relatórios recentes (3 itens mockados)

**Limitações Identificadas:**
- ❌ Sem configuração de período personalizado
- ❌ Sem filtros avançados (categorias, contas, produtos, etc.)
- ❌ Sem preview antes de gerar
- ❌ Sem geração real de PDF/Excel (apenas botões mockados)
- ❌ Sem histórico completo de relatórios gerados
- ❌ Sem agendamento automático
- ❌ Sem envio por e-mail
- ❌ Sem templates personalizáveis
- ❌ Sem comparação entre períodos
- ❌ Sem gráficos interativos nos relatórios
- ❌ Sem análise de tendências
- ❌ Sem KPIs visuais dentro dos relatórios
- ❌ Sem relatórios customizados pelo usuário
- ❌ Sem versionamento de relatórios
- ❌ Sem compartilhamento de relatórios
- ❌ Sem dashboards executivos
- ❌ Sem integração com BI tools externas
- ❌ Sem análise preditiva
- ❌ Dados completamente mockados

---

## Fase 1: Geração Dinâmica e Configuração Avançada 🎯

**Objetivo:** Implementar sistema robusto de geração de relatórios com configurações personalizáveis.

### 1.1 Configurador de Relatórios

**Componente:** `ReportConfigurator.tsx`
```typescript
interface ReportConfig {
  id: string;
  tipo: 'financeiro' | 'estoque' | 'vendas' | 'customizado';
  subtipo: string; // 'dre', 'fluxo-caixa', 'posicao-estoque', etc.
  nome: string;

  // Período
  periodo: {
    tipo: 'dia' | 'semana' | 'mes' | 'trimestre' | 'ano' | 'customizado';
    inicio: Date;
    fim: Date;
  };

  // Filtros
  filtros: {
    categorias?: string[];
    contas?: string[];
    produtos?: string[];
    fornecedores?: string[];
    clientes?: string[];
    centrosCusto?: string[];
    tags?: string[];
    status?: string[];
  };

  // Agrupamento
  agrupamento: {
    campo: 'dia' | 'semana' | 'mes' | 'categoria' | 'conta' | 'produto';
    ordem: 'asc' | 'desc';
    limite?: number;
  };

  // Visualização
  visualizacao: {
    incluirGraficos: boolean;
    incluirTabelas: boolean;
    incluirResumo: boolean;
    incluirComparativo: boolean;
    periodoComparacao?: 'anterior' | 'ano-anterior';
  };

  // Exportação
  exportacao: {
    formato: 'pdf' | 'excel' | 'csv' | 'json';
    orientacao?: 'portrait' | 'landscape';
    incluirCapa: boolean;
    incluirIndice: boolean;
    logoEmpresa: boolean;
  };
}

export const ReportConfigurator: React.FC<{
  tipo: ReportConfig['tipo'];
  subtipo: string;
  onGenerate: (config: ReportConfig) => void;
}> = ({ tipo, subtipo, onGenerate }) => {
  const [config, setConfig] = useState<ReportConfig>(defaultConfig);
  const [showPreview, setShowPreview] = useState(false);

  return (
    <Dialog open={true}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Configurar Relatório</DialogTitle>
          <DialogDescription>
            Personalize seu relatório antes de gerar
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="periodo">
          {/* Aba: Período */}
          <TabsList>
            <TabsTrigger value="periodo">Período</TabsTrigger>
            <TabsTrigger value="filtros">Filtros</TabsTrigger>
            <TabsTrigger value="visualizacao">Visualização</TabsTrigger>
            <TabsTrigger value="exportacao">Exportação</TabsTrigger>
          </TabsList>

          {/* Conteúdo das abas */}
          <TabsContent value="periodo" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipo de Período</Label>
                <Select
                  value={config.periodo.tipo}
                  onValueChange={(v) => updatePeriodoTipo(v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dia">Hoje</SelectItem>
                    <SelectItem value="semana">Esta Semana</SelectItem>
                    <SelectItem value="mes">Este Mês</SelectItem>
                    <SelectItem value="trimestre">Este Trimestre</SelectItem>
                    <SelectItem value="ano">Este Ano</SelectItem>
                    <SelectItem value="customizado">Personalizado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {config.periodo.tipo === 'customizado' && (
                <>
                  <div className="space-y-2">
                    <Label>Data Início</Label>
                    <Calendar
                      mode="single"
                      selected={config.periodo.inicio}
                      onSelect={(date) => updateInicio(date)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Data Fim</Label>
                    <Calendar
                      mode="single"
                      selected={config.periodo.fim}
                      onSelect={(date) => updateFim(date)}
                    />
                  </div>
                </>
              )}
            </div>

            {/* Atalhos Rápidos */}
            <div className="space-y-2">
              <Label>Atalhos Rápidos</Label>
              <div className="grid grid-cols-3 gap-2">
                <Button variant="outline" size="sm" onClick={() => setHoje()}>
                  Hoje
                </Button>
                <Button variant="outline" size="sm" onClick={() => setOntem()}>
                  Ontem
                </Button>
                <Button variant="outline" size="sm" onClick={() => setUltimos7Dias()}>
                  Últimos 7 dias
                </Button>
                <Button variant="outline" size="sm" onClick={() => setUltimos30Dias()}>
                  Últimos 30 dias
                </Button>
                <Button variant="outline" size="sm" onClick={() => setMesAtual()}>
                  Mês Atual
                </Button>
                <Button variant="outline" size="sm" onClick={() => setMesPassado()}>
                  Mês Passado
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="filtros" className="space-y-4">
            {/* Filtros dinâmicos baseados no tipo de relatório */}
            {tipo === 'financeiro' && (
              <>
                <div className="space-y-2">
                  <Label>Categorias</Label>
                  <MultiSelect
                    options={categorias}
                    selected={config.filtros.categorias}
                    onChange={(cats) => updateFiltros('categorias', cats)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Contas Bancárias</Label>
                  <MultiSelect
                    options={contas}
                    selected={config.filtros.contas}
                    onChange={(cts) => updateFiltros('contas', cts)}
                  />
                </div>
              </>
            )}

            {tipo === 'estoque' && (
              <>
                <div className="space-y-2">
                  <Label>Produtos</Label>
                  <MultiSelect
                    options={produtos}
                    selected={config.filtros.produtos}
                    onChange={(prods) => updateFiltros('produtos', prods)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Fornecedores</Label>
                  <MultiSelect
                    options={fornecedores}
                    selected={config.filtros.fornecedores}
                    onChange={(forn) => updateFiltros('fornecedores', forn)}
                  />
                </div>
              </>
            )}
          </TabsContent>

          <TabsContent value="visualizacao" className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Switch
                  checked={config.visualizacao.incluirGraficos}
                  onCheckedChange={(checked) => updateVisualizacao('incluirGraficos', checked)}
                />
                <Label>Incluir gráficos visuais</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={config.visualizacao.incluirTabelas}
                  onCheckedChange={(checked) => updateVisualizacao('incluirTabelas', checked)}
                />
                <Label>Incluir tabelas detalhadas</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={config.visualizacao.incluirResumo}
                  onCheckedChange={(checked) => updateVisualizacao('incluirResumo', checked)}
                />
                <Label>Incluir resumo executivo</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={config.visualizacao.incluirComparativo}
                  onCheckedChange={(checked) => updateVisualizacao('incluirComparativo', checked)}
                />
                <Label>Comparar com período anterior</Label>
              </div>
            </div>

            {config.visualizacao.incluirComparativo && (
              <div className="space-y-2">
                <Label>Período de Comparação</Label>
                <Select
                  value={config.visualizacao.periodoComparacao}
                  onValueChange={(v) => updateVisualizacao('periodoComparacao', v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="anterior">Período Anterior</SelectItem>
                    <SelectItem value="ano-anterior">Mesmo Período Ano Anterior</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </TabsContent>

          <TabsContent value="exportacao" className="space-y-4">
            <div className="space-y-2">
              <Label>Formato</Label>
              <div className="grid grid-cols-4 gap-2">
                {['pdf', 'excel', 'csv', 'json'].map((formato) => (
                  <Button
                    key={formato}
                    variant={config.exportacao.formato === formato ? 'default' : 'outline'}
                    onClick={() => updateExportacao('formato', formato)}
                  >
                    {formato.toUpperCase()}
                  </Button>
                ))}
              </div>
            </div>

            {config.exportacao.formato === 'pdf' && (
              <>
                <div className="space-y-2">
                  <Label>Orientação</Label>
                  <RadioGroup
                    value={config.exportacao.orientacao}
                    onValueChange={(v) => updateExportacao('orientacao', v)}
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="portrait" id="portrait" />
                      <Label htmlFor="portrait">Retrato</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="landscape" id="landscape" />
                      <Label htmlFor="landscape">Paisagem</Label>
                    </div>
                  </RadioGroup>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={config.exportacao.incluirCapa}
                      onCheckedChange={(checked) => updateExportacao('incluirCapa', checked)}
                    />
                    <Label>Incluir capa</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={config.exportacao.incluirIndice}
                      onCheckedChange={(checked) => updateExportacao('incluirIndice', checked)}
                    />
                    <Label>Incluir índice</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={config.exportacao.logoEmpresa}
                      onCheckedChange={(checked) => updateExportacao('logoEmpresa', checked)}
                    />
                    <Label>Incluir logo da empresa</Label>
                  </div>
                </div>
              </>
            )}
          </TabsContent>
        </Tabs>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => setShowPreview(true)}>
            <Eye className="mr-2 h-4 w-4" />
            Preview
          </Button>
          <Button onClick={() => onGenerate(config)}>
            <FileText className="mr-2 h-4 w-4" />
            Gerar Relatório
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
```

### 1.2 Preview de Relatórios

**Componente:** `ReportPreview.tsx`
```typescript
export const ReportPreview: React.FC<{
  config: ReportConfig;
}> = ({ config }) => {
  const previewData = useReportPreview(config);

  return (
    <Dialog open={true}>
      <DialogContent className="max-w-6xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Preview do Relatório</DialogTitle>
          <DialogDescription>
            Visualize como ficará seu relatório antes de gerar
          </DialogDescription>
        </DialogHeader>

        <div className="border rounded-lg p-6 bg-white dark:bg-slate-950 overflow-y-auto max-h-[60vh]">
          {/* Capa (se habilitada) */}
          {config.exportacao.incluirCapa && (
            <div className="mb-8 text-center">
              {config.exportacao.logoEmpresa && (
                <img src="/logo.png" alt="Logo" className="h-16 mx-auto mb-4" />
              )}
              <h1 className="text-3xl font-bold mb-2">{config.nome}</h1>
              <p className="text-muted-foreground">
                Período: {format(config.periodo.inicio, 'dd/MM/yyyy')} a {format(config.periodo.fim, 'dd/MM/yyyy')}
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Gerado em: {format(new Date(), "dd/MM/yyyy 'às' HH:mm")}
              </p>
            </div>
          )}

          {/* Resumo Executivo */}
          {config.visualizacao.incluirResumo && (
            <div className="mb-8">
              <h2 className="text-xl font-bold mb-4">Resumo Executivo</h2>
              <div className="grid grid-cols-3 gap-4">
                {previewData.resumo.map((item, idx) => (
                  <Card key={idx}>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">{item.label}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{item.valor}</div>
                      {item.variacao && (
                        <p className={`text-xs mt-1 ${item.variacao > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {item.variacao > 0 ? '+' : ''}{item.variacao}% vs período anterior
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Gráficos */}
          {config.visualizacao.incluirGraficos && (
            <div className="mb-8">
              <h2 className="text-xl font-bold mb-4">Análise Visual</h2>
              <div className="space-y-6">
                {previewData.graficos.map((grafico, idx) => (
                  <div key={idx}>
                    <h3 className="text-lg font-semibold mb-3">{grafico.titulo}</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      {grafico.tipo === 'linha' && (
                        <LineChart data={grafico.dados}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="label" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Line type="monotone" dataKey="valor" stroke="#3b82f6" />
                          {config.visualizacao.incluirComparativo && (
                            <Line type="monotone" dataKey="valorComparacao" stroke="#10b981" strokeDasharray="5 5" />
                          )}
                        </LineChart>
                      )}
                      {grafico.tipo === 'barra' && (
                        <BarChart data={grafico.dados}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="label" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="valor" fill="#3b82f6" />
                        </BarChart>
                      )}
                      {grafico.tipo === 'pizza' && (
                        <PieChart>
                          <Pie
                            data={grafico.dados}
                            dataKey="valor"
                            nameKey="label"
                            cx="50%"
                            cy="50%"
                            outerRadius={100}
                            label
                          >
                            {grafico.dados.map((_, index) => (
                              <Cell key={index} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend />
                        </PieChart>
                      )}
                    </ResponsiveContainer>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tabelas */}
          {config.visualizacao.incluirTabelas && (
            <div className="mb-8">
              <h2 className="text-xl font-bold mb-4">Dados Detalhados</h2>
              <Table>
                <TableHeader>
                  <TableRow>
                    {previewData.colunas.map((col, idx) => (
                      <TableHead key={idx}>{col}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {previewData.linhas.slice(0, 10).map((linha, idx) => (
                    <TableRow key={idx}>
                      {linha.map((celula, cellIdx) => (
                        <TableCell key={cellIdx}>{celula}</TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {previewData.linhas.length > 10 && (
                <p className="text-sm text-muted-foreground mt-2 text-center">
                  Mostrando 10 de {previewData.linhas.length} registros...
                </p>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Fechar
          </Button>
          <Button onClick={() => onConfirm(config)}>
            Confirmar e Gerar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
```

**Arquivos a criar:**
- `admin/src/components/relatorios/ReportConfigurator.tsx`
- `admin/src/components/relatorios/ReportPreview.tsx`
- `admin/src/components/relatorios/PeriodSelector.tsx`
- `admin/src/components/relatorios/FilterPanel.tsx`
- `admin/src/hooks/useReportConfig.ts`
- `admin/src/hooks/useReportPreview.ts`
- `admin/src/types/report.ts`

---

## Fase 2: Geração Real de PDF/Excel e Templates 📄

**Objetivo:** Implementar geração real de documentos com templates profissionais e customizáveis.

### 2.1 Gerador de PDF

```typescript
// Biblioteca: jsPDF + jspdf-autotable
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface PDFGenerator {
  config: ReportConfig;
  data: ReportData;

  generate(): Blob;
  addCapa(): void;
  addResumo(): void;
  addGraficos(): void;
  addTabelas(): void;
  addRodape(pageNumber: number, totalPages: number): void;
}

export class FinancialPDFGenerator implements PDFGenerator {
  private doc: jsPDF;
  private config: ReportConfig;
  private data: ReportData;
  private pageNumber = 0;

  constructor(config: ReportConfig, data: ReportData) {
    this.config = config;
    this.data = data;
    this.doc = new jsPDF({
      orientation: config.exportacao.orientacao || 'portrait',
      unit: 'mm',
      format: 'a4'
    });
  }

  generate(): Blob {
    // Capa
    if (this.config.exportacao.incluirCapa) {
      this.addCapa();
      this.doc.addPage();
    }

    // Índice
    if (this.config.exportacao.incluirIndice) {
      this.addIndice();
      this.doc.addPage();
    }

    // Resumo Executivo
    if (this.config.visualizacao.incluirResumo) {
      this.addResumo();
    }

    // Gráficos
    if (this.config.visualizacao.incluirGraficos) {
      this.addGraficos();
    }

    // Tabelas
    if (this.config.visualizacao.incluirTabelas) {
      this.addTabelas();
    }

    return this.doc.output('blob');
  }

  private addCapa(): void {
    const pageWidth = this.doc.internal.pageSize.getWidth();
    const pageHeight = this.doc.internal.pageSize.getHeight();

    // Logo
    if (this.config.exportacao.logoEmpresa) {
      // this.doc.addImage(logoBase64, 'PNG', x, y, width, height);
    }

    // Título
    this.doc.setFontSize(24);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(this.config.nome, pageWidth / 2, 80, { align: 'center' });

    // Período
    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'normal');
    const periodoText = `Período: ${format(this.config.periodo.inicio, 'dd/MM/yyyy')} a ${format(this.config.periodo.fim, 'dd/MM/yyyy')}`;
    this.doc.text(periodoText, pageWidth / 2, 100, { align: 'center' });

    // Data de geração
    this.doc.setFontSize(10);
    const geradoEm = `Gerado em: ${format(new Date(), "dd/MM/yyyy 'às' HH:mm")}`;
    this.doc.text(geradoEm, pageWidth / 2, pageHeight - 20, { align: 'center' });
  }

  private addResumo(): void {
    this.pageNumber++;

    this.doc.setFontSize(16);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('Resumo Executivo', 20, 20);

    let y = 35;
    this.data.resumo.forEach((item) => {
      this.doc.setFontSize(12);
      this.doc.setFont('helvetica', 'bold');
      this.doc.text(item.label, 20, y);

      this.doc.setFontSize(18);
      this.doc.setFont('helvetica', 'normal');
      this.doc.text(item.valor, 20, y + 8);

      if (item.variacao) {
        this.doc.setFontSize(10);
        const variacaoText = `${item.variacao > 0 ? '+' : ''}${item.variacao}% vs período anterior`;
        this.doc.setTextColor(item.variacao > 0 ? 0 : 255, item.variacao > 0 ? 128 : 0, 0);
        this.doc.text(variacaoText, 20, y + 14);
        this.doc.setTextColor(0, 0, 0);
      }

      y += 25;
    });

    this.addRodape(this.pageNumber, this.calculateTotalPages());
  }

  private addTabelas(): void {
    this.doc.addPage();
    this.pageNumber++;

    this.doc.setFontSize(16);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('Dados Detalhados', 20, 20);

    autoTable(this.doc, {
      head: [this.data.colunas],
      body: this.data.linhas,
      startY: 30,
      theme: 'grid',
      headStyles: {
        fillColor: [59, 130, 246],
        textColor: [255, 255, 255],
        fontStyle: 'bold'
      },
      styles: {
        fontSize: 9,
        cellPadding: 3
      },
      didDrawPage: (data) => {
        this.addRodape(this.pageNumber, this.calculateTotalPages());
      }
    });
  }

  private addRodape(pageNumber: number, totalPages: number): void {
    const pageWidth = this.doc.internal.pageSize.getWidth();
    const pageHeight = this.doc.internal.pageSize.getHeight();

    this.doc.setFontSize(8);
    this.doc.setFont('helvetica', 'normal');
    this.doc.setTextColor(128, 128, 128);

    // Número da página
    this.doc.text(
      `Página ${pageNumber} de ${totalPages}`,
      pageWidth - 20,
      pageHeight - 10,
      { align: 'right' }
    );

    // Nome da empresa
    this.doc.text('Orion ERP', 20, pageHeight - 10);
  }

  private calculateTotalPages(): number {
    // Lógica para calcular total de páginas
    let pages = 0;
    if (this.config.exportacao.incluirCapa) pages++;
    if (this.config.exportacao.incluirIndice) pages++;
    if (this.config.visualizacao.incluirResumo) pages++;
    if (this.config.visualizacao.incluirGraficos) pages += Math.ceil(this.data.graficos.length / 2);
    if (this.config.visualizacao.incluirTabelas) {
      // Estimar páginas baseado no número de linhas
      pages += Math.ceil(this.data.linhas.length / 40);
    }
    return pages;
  }
}
```

### 2.2 Gerador de Excel

```typescript
// Biblioteca: exceljs
import ExcelJS from 'exceljs';

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
  }

  async generate(): Promise<Blob> {
    // Resumo
    if (this.config.visualizacao.incluirResumo) {
      this.addResumoSheet();
    }

    // Dados Detalhados
    if (this.config.visualizacao.incluirTabelas) {
      this.addDadosSheet();
    }

    // Gráficos (como planilha separada com dados)
    if (this.config.visualizacao.incluirGraficos) {
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
    const sheet = this.workbook.addWorksheet('Resumo', {
      pageSetup: { paperSize: 9, orientation: 'portrait' }
    });

    // Cabeçalho
    sheet.mergeCells('A1:C1');
    const titleCell = sheet.getCell('A1');
    titleCell.value = this.config.nome;
    titleCell.font = { size: 16, bold: true };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };

    sheet.mergeCells('A2:C2');
    const periodoCell = sheet.getCell('A2');
    periodoCell.value = `Período: ${format(this.config.periodo.inicio, 'dd/MM/yyyy')} a ${format(this.config.periodo.fim, 'dd/MM/yyyy')}`;
    periodoCell.font = { size: 11 };
    periodoCell.alignment = { horizontal: 'center' };

    // Espaço
    sheet.getRow(3).height = 10;

    // Dados do resumo
    let row = 4;
    this.data.resumo.forEach((item) => {
      sheet.getCell(`A${row}`).value = item.label;
      sheet.getCell(`A${row}`).font = { bold: true };

      sheet.getCell(`B${row}`).value = item.valor;
      sheet.getCell(`B${row}`).alignment = { horizontal: 'right' };

      if (item.variacao) {
        sheet.getCell(`C${row}`).value = `${item.variacao > 0 ? '+' : ''}${item.variacao}%`;
        sheet.getCell(`C${row}`).font = {
          color: { argb: item.variacao > 0 ? 'FF008000' : 'FFFF0000' }
        };
        sheet.getCell(`C${row}`).alignment = { horizontal: 'right' };
      }

      row++;
    });

    // Ajustar largura das colunas
    sheet.getColumn('A').width = 30;
    sheet.getColumn('B').width = 20;
    sheet.getColumn('C').width = 15;
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

    // Dados
    this.data.linhas.forEach((linha) => {
      sheet.addRow(linha);
    });

    // Formatação
    sheet.columns.forEach((column) => {
      column.width = 15;
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

  private addGraficoSheet(grafico: any, index: number): void {
    const sheet = this.workbook.addWorksheet(`Gráfico ${index + 1} - ${grafico.titulo}`);

    // Adicionar dados do gráfico
    sheet.addRow(['Label', 'Valor']);
    grafico.dados.forEach((item: any) => {
      sheet.addRow([item.label, item.valor]);
    });

    // Formatação
    sheet.getRow(1).font = { bold: true };
    sheet.getColumn('A').width = 20;
    sheet.getColumn('B').width = 15;
  }
}
```

### 2.3 Sistema de Templates

```typescript
interface ReportTemplate {
  id: string;
  nome: string;
  tipo: 'financeiro' | 'estoque' | 'vendas';
  descricao: string;

  // Configuração padrão
  configuracaoPadrao: Partial<ReportConfig>;

  // Layout
  layout: {
    secoes: ReportSection[];
    cores: {
      primaria: string;
      secundaria: string;
      destaque: string;
    };
    fontes: {
      titulo: string;
      corpo: string;
    };
  };

  // Campos customizáveis
  camposCustomizaveis: {
    [key: string]: {
      tipo: 'texto' | 'numero' | 'data' | 'booleano';
      label: string;
      valorPadrao: any;
    };
  };
}

interface ReportSection {
  id: string;
  tipo: 'capa' | 'resumo' | 'grafico' | 'tabela' | 'texto';
  titulo?: string;
  ordem: number;
  configuracao: any;
}

// Templates pré-definidos
export const TEMPLATES: ReportTemplate[] = [
  {
    id: 'dre-completo',
    nome: 'DRE Completo',
    tipo: 'financeiro',
    descricao: 'Demonstrativo de Resultados com análise detalhada',
    configuracaoPadrao: {
      visualizacao: {
        incluirGraficos: true,
        incluirTabelas: true,
        incluirResumo: true,
        incluirComparativo: true
      }
    },
    layout: {
      secoes: [
        { id: 'capa', tipo: 'capa', ordem: 1, configuracao: {} },
        { id: 'resumo', tipo: 'resumo', ordem: 2, configuracao: {} },
        {
          id: 'grafico-receitas',
          tipo: 'grafico',
          titulo: 'Evolução de Receitas',
          ordem: 3,
          configuracao: { tipoGrafico: 'linha' }
        },
        {
          id: 'tabela-detalhes',
          tipo: 'tabela',
          titulo: 'Detalhamento',
          ordem: 4,
          configuracao: {}
        }
      ],
      cores: {
        primaria: '#3B82F6',
        secundaria: '#10B981',
        destaque: '#F59E0B'
      },
      fontes: {
        titulo: 'Helvetica',
        corpo: 'Arial'
      }
    },
    camposCustomizaveis: {}
  },
  // ... mais templates
];
```

**Arquivos a criar:**
- `admin/src/lib/pdf-generator.ts`
- `admin/src/lib/excel-generator.ts`
- `admin/src/lib/csv-generator.ts`
- `admin/src/lib/report-templates.ts`
- `admin/src/components/relatorios/TemplateSelector.tsx`
- `admin/src/components/relatorios/TemplateEditor.tsx`

---

## Fase 3: Histórico e Gerenciamento de Relatórios 📚

**Objetivo:** Implementar sistema completo de histórico, versionamento e gerenciamento de relatórios gerados.

### 3.1 Histórico de Relatórios

```typescript
interface GeneratedReport {
  id: string;
  nome: string;
  tipo: 'financeiro' | 'estoque' | 'vendas' | 'customizado';
  subtipo: string;

  // Configuração usada
  config: ReportConfig;

  // Metadados
  geradoEm: Date;
  geradoPor: {
    id: string;
    nome: string;
  };

  // Arquivo
  arquivo: {
    url: string;
    formato: 'pdf' | 'excel' | 'csv' | 'json';
    tamanho: number; // bytes
    hash: string; // para verificação de integridade
  };

  // Status
  status: 'gerando' | 'concluido' | 'erro';
  erro?: string;

  // Estatísticas
  visualizacoes: number;
  downloads: number;
  compartilhamentos: number;

  // Versionamento
  versao: number;
  versaoAnterior?: string; // ID do relatório anterior

  // Agendamento (se foi agendado)
  agendamento?: {
    id: string;
    proximaExecucao: Date;
  };

  // Tags
  tags: string[];
}

export const ReportHistory: React.FC = () => {
  const [reports, setReports] = useState<GeneratedReport[]>([]);
  const [filtros, setFiltros] = useState({
    tipo: 'todos',
    periodo: 'ultimo-mes',
    busca: '',
    tags: []
  });
  const [ordenacao, setOrdenacao] = useState<'data' | 'nome' | 'tamanho' | 'downloads'>('data');

  const filteredReports = useMemo(() => {
    return reports
      .filter(report => {
        if (filtros.tipo !== 'todos' && report.tipo !== filtros.tipo) return false;
        if (filtros.busca && !report.nome.toLowerCase().includes(filtros.busca.toLowerCase())) return false;
        if (filtros.tags.length > 0 && !filtros.tags.some(tag => report.tags.includes(tag))) return false;

        // Filtro de período
        const dataLimite = (() => {
          switch (filtros.periodo) {
            case 'hoje': return startOfDay(new Date());
            case 'ultima-semana': return subWeeks(new Date(), 1);
            case 'ultimo-mes': return subMonths(new Date(), 1);
            case 'ultimo-trimestre': return subMonths(new Date(), 3);
            case 'ultimo-ano': return subYears(new Date(), 1);
            default: return new Date(0);
          }
        })();

        return report.geradoEm >= dataLimite;
      })
      .sort((a, b) => {
        switch (ordenacao) {
          case 'data':
            return b.geradoEm.getTime() - a.geradoEm.getTime();
          case 'nome':
            return a.nome.localeCompare(b.nome);
          case 'tamanho':
            return b.arquivo.tamanho - a.arquivo.tamanho;
          case 'downloads':
            return b.downloads - a.downloads;
          default:
            return 0;
        }
      });
  }, [reports, filtros, ordenacao]);

  return (
    <div className="space-y-6">
      {/* Filtros e Busca */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Histórico de Relatórios</CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={exportarHistorico}>
                <Download className="mr-2 h-4 w-4" />
                Exportar Histórico
              </Button>
              <Button variant="outline" size="sm" onClick={limparHistorico}>
                <Trash2 className="mr-2 h-4 w-4" />
                Limpar Antigos
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Busca */}
            <div className="flex gap-2">
              <div className="flex-1">
                <Input
                  placeholder="Buscar relatórios..."
                  value={filtros.busca}
                  onChange={(e) => setFiltros({ ...filtros, busca: e.target.value })}
                  className="w-full"
                />
              </div>
              <Select
                value={filtros.tipo}
                onValueChange={(v) => setFiltros({ ...filtros, tipo: v })}
              >
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os Tipos</SelectItem>
                  <SelectItem value="financeiro">Financeiro</SelectItem>
                  <SelectItem value="estoque">Estoque</SelectItem>
                  <SelectItem value="vendas">Vendas</SelectItem>
                  <SelectItem value="customizado">Customizado</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={filtros.periodo}
                onValueChange={(v) => setFiltros({ ...filtros, periodo: v })}
              >
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hoje">Hoje</SelectItem>
                  <SelectItem value="ultima-semana">Última Semana</SelectItem>
                  <SelectItem value="ultimo-mes">Último Mês</SelectItem>
                  <SelectItem value="ultimo-trimestre">Último Trimestre</SelectItem>
                  <SelectItem value="ultimo-ano">Último Ano</SelectItem>
                  <SelectItem value="todos">Todos</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Ordenação */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Ordenar por:</span>
              <div className="flex gap-1">
                <Button
                  variant={ordenacao === 'data' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setOrdenacao('data')}
                >
                  Data
                </Button>
                <Button
                  variant={ordenacao === 'nome' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setOrdenacao('nome')}
                >
                  Nome
                </Button>
                <Button
                  variant={ordenacao === 'tamanho' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setOrdenacao('tamanho')}
                >
                  Tamanho
                </Button>
                <Button
                  variant={ordenacao === 'downloads' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setOrdenacao('downloads')}
                >
                  Downloads
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Relatórios */}
      <div className="space-y-3">
        {filteredReports.map((report) => (
          <Card key={report.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4 flex-1">
                  {/* Ícone do formato */}
                  <div className={cn(
                    "p-3 rounded-lg",
                    getFormatoColor(report.arquivo.formato).bg
                  )}>
                    {getFormatoIcon(report.arquivo.formato)}
                  </div>

                  {/* Informações */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold truncate">{report.nome}</h3>
                      <Badge variant="outline">
                        {report.arquivo.formato.toUpperCase()}
                      </Badge>
                      {report.versao > 1 && (
                        <Badge variant="secondary">v{report.versao}</Badge>
                      )}
                    </div>

                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {format(report.geradoEm, "dd/MM/yyyy 'às' HH:mm")}
                      </span>
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {report.geradoPor.nome}
                      </span>
                      <span className="flex items-center gap-1">
                        <FileText className="h-3 w-3" />
                        {formatBytes(report.arquivo.tamanho)}
                      </span>
                    </div>

                    {/* Estatísticas */}
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        {report.visualizacoes} visualizações
                      </span>
                      <span className="flex items-center gap-1">
                        <Download className="h-3 w-3" />
                        {report.downloads} downloads
                      </span>
                      {report.compartilhamentos > 0 && (
                        <span className="flex items-center gap-1">
                          <Share2 className="h-3 w-3" />
                          {report.compartilhamentos} compartilhamentos
                        </span>
                      )}
                    </div>

                    {/* Tags */}
                    {report.tags.length > 0 && (
                      <div className="flex items-center gap-2 mt-2">
                        {report.tags.map((tag, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Ações */}
                <div className="flex items-center gap-2 ml-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => downloadReport(report)}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download
                  </Button>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => visualizarReport(report)}>
                        <Eye className="mr-2 h-4 w-4" />
                        Visualizar
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => compartilharReport(report)}>
                        <Share2 className="mr-2 h-4 w-4" />
                        Compartilhar
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => regerarReport(report)}>
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Regerar
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => duplicarReport(report)}>
                        <Copy className="mr-2 h-4 w-4" />
                        Duplicar Configuração
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => deletarReport(report)}
                        className="text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Paginação */}
      {filteredReports.length > 20 && (
        <div className="flex justify-center">
          <Pagination />
        </div>
      )}
    </div>
  );
};
```

**Arquivos a criar:**
- `admin/src/components/relatorios/ReportHistory.tsx`
- `admin/src/components/relatorios/ReportCard.tsx`
- `admin/src/components/relatorios/ReportActions.tsx`
- `admin/src/hooks/useReportHistory.ts`
- `admin/src/lib/report-storage.ts`

---

## Fase 4: Agendamento e Automação 🤖

**Objetivo:** Implementar sistema de agendamento de relatórios e envio automático por e-mail.

### 4.1 Agendamento de Relatórios

```typescript
interface ReportSchedule {
  id: string;
  nome: string;
  ativo: boolean;

  // Configuração do relatório
  reportConfig: ReportConfig;

  // Frequência
  frequencia: {
    tipo: 'diario' | 'semanal' | 'quinzenal' | 'mensal' | 'trimestral' | 'anual' | 'personalizado';

    // Para tipo 'diario'
    horario?: string; // HH:mm

    // Para tipo 'semanal'
    diaSemana?: number; // 0-6 (domingo-sábado)

    // Para tipo 'mensal'
    diaMes?: number; // 1-31

    // Para tipo 'personalizado'
    cronExpression?: string;
  };

  // Destinatários
  destinatarios: {
    emails: string[];
    incluirGeradores: boolean; // Incluir quem criou o agendamento
    incluirGerentes: boolean;
    incluirDiretores: boolean;
  };

  // Mensagem do e-mail
  emailConfig: {
    assunto: string;
    corpo: string; // Suporta variáveis: {periodo}, {data}, etc.
    anexarRelatorio: boolean;
    incluirLinkDownload: boolean;
  };

  // Histórico de execuções
  ultimaExecucao?: Date;
  proximaExecucao: Date;
  execucoes: {
    data: Date;
    status: 'sucesso' | 'erro';
    erro?: string;
    relatoriId?: string;
  }[];

  // Metadados
  criadoEm: Date;
  criadoPor: {
    id: string;
    nome: string;
  };
  atualizadoEm: Date;
}

export const ReportScheduler: React.FC = () => {
  const [schedules, setSchedules] = useState<ReportSchedule[]>([]);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Relatórios Agendados
              </CardTitle>
              <CardDescription>
                Configure relatórios para serem gerados automaticamente
              </CardDescription>
            </div>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Novo Agendamento
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {schedules.map((schedule) => (
              <Card key={schedule.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold">{schedule.nome}</h3>
                        <Switch
                          checked={schedule.ativo}
                          onCheckedChange={(checked) => toggleSchedule(schedule.id, checked)}
                        />
                        <Badge variant={schedule.ativo ? 'default' : 'secondary'}>
                          {schedule.ativo ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Frequência</p>
                          <p className="font-medium">{getFrequenciaLabel(schedule.frequencia)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Próxima Execução</p>
                          <p className="font-medium">
                            {format(schedule.proximaExecucao, "dd/MM/yyyy 'às' HH:mm")}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Destinatários</p>
                          <p className="font-medium">{schedule.destinatarios.emails.length} pessoas</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Última Execução</p>
                          <p className="font-medium">
                            {schedule.ultimaExecucao
                              ? formatDistanceToNow(schedule.ultimaExecucao, { addSuffix: true, locale: ptBR })
                              : 'Nunca executado'}
                          </p>
                        </div>
                      </div>

                      {/* Histórico de execuções recentes */}
                      {schedule.execucoes.length > 0 && (
                        <div className="mt-3">
                          <p className="text-xs text-muted-foreground mb-1">Últimas Execuções:</p>
                          <div className="flex gap-1">
                            {schedule.execucoes.slice(0, 10).map((exec, idx) => (
                              <TooltipProvider key={idx}>
                                <Tooltip>
                                  <TooltipTrigger>
                                    <div
                                      className={cn(
                                        "w-2 h-2 rounded-full",
                                        exec.status === 'sucesso' ? 'bg-green-500' : 'bg-red-500'
                                      )}
                                    />
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>{format(exec.data, "dd/MM/yyyy HH:mm")}</p>
                                    <p>{exec.status === 'sucesso' ? 'Sucesso' : `Erro: ${exec.erro}`}</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => executarAgora(schedule)}
                      >
                        <Play className="mr-2 h-4 w-4" />
                        Executar Agora
                      </Button>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => editarSchedule(schedule)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => duplicarSchedule(schedule)}>
                            <Copy className="mr-2 h-4 w-4" />
                            Duplicar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => verHistorico(schedule)}>
                            <History className="mr-2 h-4 w-4" />
                            Ver Histórico Completo
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => deletarSchedule(schedule)}
                            className="text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Dialog de criação/edição */}
      <CreateScheduleDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onSave={handleSaveSchedule}
      />
    </div>
  );
};
```

### 4.2 Sistema de Envio de E-mail

```typescript
interface EmailService {
  enviarRelatorio(
    destinatarios: string[],
    relatorio: GeneratedReport,
    config: EmailConfig
  ): Promise<void>;
}

export class EmailReportService implements EmailService {
  async enviarRelatorio(
    destinatarios: string[],
    relatorio: GeneratedReport,
    config: EmailConfig
  ): Promise<void> {
    const html = this.gerarHTMLEmail(relatorio, config);

    // Preparar anexo
    const anexo = config.anexarRelatorio ? {
      filename: `${relatorio.nome}.${relatorio.arquivo.formato}`,
      path: relatorio.arquivo.url,
      contentType: this.getContentType(relatorio.arquivo.formato)
    } : undefined;

    // Enviar e-mail
    await this.mailerService.send({
      to: destinatarios,
      subject: this.substituirVariaveis(config.assunto, relatorio),
      html,
      attachments: anexo ? [anexo] : []
    });
  }

  private gerarHTMLEmail(relatorio: GeneratedReport, config: EmailConfig): string {
    const corpo = this.substituirVariaveis(config.corpo, relatorio);

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background: linear-gradient(135deg, #3B82F6 0%, #10B981 100%);
              color: white;
              padding: 30px;
              border-radius: 10px 10px 0 0;
              text-align: center;
            }
            .content {
              background: #f9fafb;
              padding: 30px;
              border-radius: 0 0 10px 10px;
            }
            .button {
              display: inline-block;
              background: #3B82F6;
              color: white;
              padding: 12px 24px;
              text-decoration: none;
              border-radius: 6px;
              margin-top: 20px;
            }
            .footer {
              text-align: center;
              margin-top: 30px;
              font-size: 12px;
              color: #6b7280;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>${relatorio.nome}</h1>
              <p>Relatório gerado automaticamente</p>
            </div>
            <div class="content">
              ${corpo}

              ${config.incluirLinkDownload ? `
                <a href="${relatorio.arquivo.url}" class="button">
                  📥 Download do Relatório
                </a>
              ` : ''}

              <div style="margin-top: 30px; padding: 20px; background: white; border-radius: 6px;">
                <h3 style="margin-top: 0;">Informações do Relatório</h3>
                <ul style="list-style: none; padding: 0;">
                  <li><strong>Tipo:</strong> ${relatorio.tipo}</li>
                  <li><strong>Período:</strong> ${format(relatorio.config.periodo.inicio, 'dd/MM/yyyy')} a ${format(relatorio.config.periodo.fim, 'dd/MM/yyyy')}</li>
                  <li><strong>Formato:</strong> ${relatorio.arquivo.formato.toUpperCase()}</li>
                  <li><strong>Tamanho:</strong> ${formatBytes(relatorio.arquivo.tamanho)}</li>
                  <li><strong>Gerado em:</strong> ${format(relatorio.geradoEm, "dd/MM/yyyy 'às' HH:mm")}</li>
                </ul>
              </div>
            </div>
            <div class="footer">
              <p>Este é um e-mail automático do Orion ERP</p>
              <p>© ${new Date().getFullYear()} Orion ERP. Todos os direitos reservados.</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  private substituirVariaveis(texto: string, relatorio: GeneratedReport): string {
    return texto
      .replace(/{nome}/g, relatorio.nome)
      .replace(/{periodo}/g, `${format(relatorio.config.periodo.inicio, 'dd/MM/yyyy')} a ${format(relatorio.config.periodo.fim, 'dd/MM/yyyy')}`)
      .replace(/{data}/g, format(new Date(), 'dd/MM/yyyy'))
      .replace(/{hora}/g, format(new Date(), 'HH:mm'))
      .replace(/{gerador}/g, relatorio.geradoPor.nome);
  }

  private getContentType(formato: string): string {
    const contentTypes = {
      pdf: 'application/pdf',
      excel: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      csv: 'text/csv',
      json: 'application/json'
    };
    return contentTypes[formato] || 'application/octet-stream';
  }
}
```

**Arquivos a criar:**
- `admin/src/components/relatorios/ReportScheduler.tsx`
- `admin/src/components/relatorios/CreateScheduleDialog.tsx`
- `admin/src/components/relatorios/ScheduleFrequencyConfig.tsx`
- `admin/src/components/relatorios/EmailRecipientsConfig.tsx`
- `admin/src/hooks/useReportSchedule.ts`
- `admin/src/lib/email-report-service.ts`
- `admin/src/lib/cron-service.ts`

---

## Fase 5: Dashboard Executivo e Análise Comparativa 📊

**Objetivo:** Criar dashboard executivo com KPIs visuais e análises comparativas entre períodos.

### 5.1 Dashboard Executivo

```typescript
interface ExecutiveDashboard {
  periodo: { inicio: Date; fim: Date };

  // KPIs principais
  kpis: {
    financeiro: {
      receitaTotal: {
        valor: number;
        variacao: number;
        tendencia: 'up' | 'down' | 'stable';
      };
      despesaTotal: {
        valor: number;
        variacao: number;
        tendencia: 'up' | 'down' | 'stable';
      };
      lucroLiquido: {
        valor: number;
        variacao: number;
        margem: number;
      };
      fluxoCaixaOperacional: {
        valor: number;
        variacao: number;
      };
    };

    estoque: {
      valorTotal: number;
      giroEstoque: number;
      itensAbaixoMinimo: number;
      acuracidadeInventario: number;
    };

    vendas: {
      ticketMedio: {
        valor: number;
        variacao: number;
      };
      conversao: {
        taxa: number;
        variacao: number;
      };
    };
  };

  // Gráficos
  graficos: {
    evolucaoFinanceira: ChartData[];
    distribuicaoDespesas: ChartData[];
    topCategorias: ChartData[];
    tendenciasVendas: ChartData[];
  };

  // Alertas e Insights
  alertas: Alert[];
  insights: Insight[];
}

export const ExecutiveDashboard: React.FC = () => {
  const [periodo, setPeriodo] = useState({
    inicio: startOfMonth(new Date()),
    fim: endOfMonth(new Date())
  });

  const dashboard = useExecutiveDashboard(periodo);

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <BarChart3 className="h-8 w-8 text-purple-500" />
            Dashboard Executivo
          </h1>
          <p className="text-muted-foreground mt-1">
            Visão consolidada dos principais indicadores
          </p>
        </div>

        <div className="flex items-center gap-2">
          <DateRangePicker
            value={periodo}
            onChange={setPeriodo}
          />
          <Button variant="outline" onClick={() => exportarDashboard()}>
            <Download className="mr-2 h-4 w-4" />
            Exportar
          </Button>
        </div>
      </div>

      {/* KPIs Financeiros */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Indicadores Financeiros</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <KPICard
            titulo="Receita Total"
            valor={dashboard.kpis.financeiro.receitaTotal.valor}
            variacao={dashboard.kpis.financeiro.receitaTotal.variacao}
            tendencia={dashboard.kpis.financeiro.receitaTotal.tendencia}
            icon={TrendingUp}
            color="green"
          />
          <KPICard
            titulo="Despesa Total"
            valor={dashboard.kpis.financeiro.despesaTotal.valor}
            variacao={dashboard.kpis.financeiro.despesaTotal.variacao}
            tendencia={dashboard.kpis.financeiro.despesaTotal.tendencia}
            icon={TrendingDown}
            color="red"
          />
          <KPICard
            titulo="Lucro Líquido"
            valor={dashboard.kpis.financeiro.lucroLiquido.valor}
            variacao={dashboard.kpis.financeiro.lucroLiquido.variacao}
            subtexto={`Margem: ${dashboard.kpis.financeiro.lucroLiquido.margem}%`}
            icon={DollarSign}
            color="blue"
          />
          <KPICard
            titulo="Fluxo de Caixa Op."
            valor={dashboard.kpis.financeiro.fluxoCaixaOperacional.valor}
            variacao={dashboard.kpis.financeiro.fluxoCaixaOperacional.variacao}
            icon={ArrowUpCircle}
            color="purple"
          />
        </div>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Evolução Financeira */}
        <Card>
          <CardHeader>
            <CardTitle>Evolução Financeira</CardTitle>
            <CardDescription>Receitas vs Despesas</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={dashboard.graficos.evolucaoFinanceira}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="receitas" stroke="#10b981" strokeWidth={2} />
                <Line type="monotone" dataKey="despesas" stroke="#ef4444" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Distribuição de Despesas */}
        <Card>
          <CardHeader>
            <CardTitle>Distribuição de Despesas</CardTitle>
            <CardDescription>Por categoria</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={dashboard.graficos.distribuicaoDespesas}
                  dataKey="valor"
                  nameKey="label"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label
                >
                  {dashboard.graficos.distribuicaoDespesas.map((_, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Categorias */}
        <Card>
          <CardHeader>
            <CardTitle>Top 5 Categorias</CardTitle>
            <CardDescription>Maiores receitas</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dashboard.graficos.topCategorias}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="valor" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Tendências */}
        <Card>
          <CardHeader>
            <CardTitle>Tendências de Vendas</CardTitle>
            <CardDescription>Últimos 12 meses</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={dashboard.graficos.tendenciasVendas}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mes" />
                <YAxis />
                <Tooltip />
                <Area type="monotone" dataKey="valor" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.3} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Alertas e Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Alertas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-500" />
              Alertas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {dashboard.alertas.map((alerta, idx) => (
                <Alert key={idx} variant={alerta.severidade === 'critico' ? 'destructive' : 'default'}>
                  <AlertTitle>{alerta.titulo}</AlertTitle>
                  <AlertDescription>{alerta.descricao}</AlertDescription>
                </Alert>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Insights */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-yellow-500" />
              Insights de IA
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {dashboard.insights.map((insight, idx) => (
                <div key={idx} className="p-3 rounded-lg bg-muted">
                  <p className="font-medium">{insight.titulo}</p>
                  <p className="text-sm text-muted-foreground mt-1">{insight.descricao}</p>
                  {insight.acao && (
                    <Button variant="link" size="sm" className="px-0 mt-2">
                      {insight.acao}
                      <ArrowRight className="ml-1 h-3 w-3" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
```

### 5.2 Análise Comparativa

```typescript
export const ComparativeAnalysis: React.FC = () => {
  const [periodos, setPeriodos] = useState<DateRange[]>([
    {
      inicio: startOfMonth(new Date()),
      fim: endOfMonth(new Date()),
      label: 'Mês Atual'
    },
    {
      inicio: startOfMonth(subMonths(new Date(), 1)),
      fim: endOfMonth(subMonths(new Date(), 1)),
      label: 'Mês Anterior'
    }
  ]);

  const comparacao = useComparativeData(periodos);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Análise Comparativa</CardTitle>
          <CardDescription>
            Compare múltiplos períodos lado a lado
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Seletor de períodos */}
          <div className="space-y-4 mb-6">
            {periodos.map((periodo, idx) => (
              <div key={idx} className="flex items-center gap-4">
                <Input
                  value={periodo.label}
                  onChange={(e) => updatePeriodoLabel(idx, e.target.value)}
                  className="w-40"
                />
                <DateRangePicker
                  value={periodo}
                  onChange={(range) => updatePeriodo(idx, range)}
                />
                {periodos.length > 2 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removePeriodo(idx)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}

            {periodos.length < 4 && (
              <Button variant="outline" onClick={adicionarPeriodo}>
                <Plus className="mr-2 h-4 w-4" />
                Adicionar Período
              </Button>
            )}
          </div>

          {/* Tabela comparativa */}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Métrica</TableHead>
                {periodos.map((periodo, idx) => (
                  <TableHead key={idx}>{periodo.label}</TableHead>
                ))}
                <TableHead>Variação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {comparacao.metricas.map((metrica) => (
                <TableRow key={metrica.nome}>
                  <TableCell className="font-medium">{metrica.nome}</TableCell>
                  {metrica.valores.map((valor, idx) => (
                    <TableCell key={idx}>{valor}</TableCell>
                  ))}
                  <TableCell>
                    <Badge variant={metrica.variacao > 0 ? 'default' : 'destructive'}>
                      {metrica.variacao > 0 ? '+' : ''}{metrica.variacao}%
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Gráfico comparativo */}
          <div className="mt-6">
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={comparacao.dadosGrafico}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="metrica" />
                <YAxis />
                <Tooltip />
                <Legend />
                {periodos.map((periodo, idx) => (
                  <Bar
                    key={idx}
                    dataKey={`periodo${idx}`}
                    fill={COLORS[idx]}
                    name={periodo.label}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
```

**Arquivos a criar:**
- `admin/src/components/relatorios/ExecutiveDashboard.tsx`
- `admin/src/components/relatorios/KPICard.tsx`
- `admin/src/components/relatorios/ComparativeAnalysis.tsx`
- `admin/src/components/relatorios/DateRangePicker.tsx`
- `admin/src/hooks/useExecutiveDashboard.ts`
- `admin/src/hooks/useComparativeData.ts`

---

## Fase 6: Relatórios Customizados e Builder Visual 🎨

**Objetivo:** Permitir que usuários criem relatórios totalmente personalizados com um builder visual drag-and-drop.

### 6.1 Report Builder

```typescript
interface CustomReport {
  id: string;
  nome: string;
  descricao: string;

  // Layout
  layout: {
    pagina: {
      tamanho: 'a4' | 'letter' | 'legal';
      orientacao: 'portrait' | 'landscape';
      margens: { top: number; right: number; bottom: number; left: number };
    };

    // Seções do relatório
    secoes: ReportSection[];
  };

  // Fontes de dados
  fontesDados: {
    id: string;
    tipo: 'financeiro' | 'estoque' | 'vendas' | 'customizado';
    query: string; // SQL ou filtro JSON
    parametros: Record<string, any>;
  }[];

  // Estilo
  estilo: {
    tema: 'claro' | 'escuro' | 'customizado';
    cores: {
      primaria: string;
      secundaria: string;
      texto: string;
      fundo: string;
    };
    fontes: {
      titulo: { familia: string; tamanho: number; peso: string };
      subtitulo: { familia: string; tamanho: number; peso: string };
      corpo: { familia: string; tamanho: number; peso: string };
    };
  };

  // Permissões
  permissoes: {
    visualizar: string[]; // IDs de usuários/grupos
    editar: string[];
    compartilhar: string[];
  };
}

interface ReportSection {
  id: string;
  tipo: 'texto' | 'tabela' | 'grafico' | 'kpi' | 'imagem' | 'espacamento';
  ordem: number;

  // Configuração específica do tipo
  config: any;

  // Layout da seção
  layout: {
    largura: 'completa' | 'metade' | 'terco' | 'dois-tercos';
    altura?: number;
    padding: { top: number; right: number; bottom: number; left: number };
  };

  // Estilo
  estilo?: {
    fundo?: string;
    borda?: { cor: string; largura: number; estilo: string };
    sombra?: boolean;
  };

  // Fonte de dados (se aplicável)
  fonteDadosId?: string;
}

export const ReportBuilder: React.FC = () => {
  const [report, setReport] = useState<CustomReport>(emptyReport);
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition
  } = useSortable({ id: 'section' });

  return (
    <div className="flex h-screen">
      {/* Sidebar: Componentes */}
      <div className="w-64 border-r p-4 overflow-y-auto">
        <h2 className="font-bold mb-4">Componentes</h2>
        <div className="space-y-2">
          <ComponentePalette tipo="texto" label="Texto" icon={Type} />
          <ComponentePalette tipo="tabela" label="Tabela" icon={Table} />
          <ComponentePalette tipo="grafico" label="Gráfico" icon={BarChart3} />
          <ComponentePalette tipo="kpi" label="KPI" icon={TrendingUp} />
          <ComponentePalette tipo="imagem" label="Imagem" icon={Image} />
          <ComponentePalette tipo="espacamento" label="Espaçamento" icon={Space} />
        </div>

        <Separator className="my-4" />

        <h2 className="font-bold mb-4">Fontes de Dados</h2>
        <Button variant="outline" size="sm" className="w-full" onClick={adicionarFonteDados}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Fonte
        </Button>
        <div className="mt-2 space-y-2">
          {report.fontesDados.map((fonte) => (
            <div key={fonte.id} className="p-2 rounded bg-muted text-sm">
              {fonte.tipo}
            </div>
          ))}
        </div>
      </div>

      {/* Canvas: Editor */}
      <div className="flex-1 p-6 overflow-y-auto bg-slate-50 dark:bg-slate-900">
        <div className="max-w-4xl mx-auto">
          {/* Toolbar */}
          <div className="flex items-center justify-between mb-6 bg-white dark:bg-slate-800 p-4 rounded-lg shadow">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={salvarRascunho}>
                <Save className="mr-2 h-4 w-4" />
                Salvar
              </Button>
              <Button variant="outline" size="sm" onClick={() => setShowPreview(true)}>
                <Eye className="mr-2 h-4 w-4" />
                Preview
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={desfazer}>
                <Undo className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={refazer}>
                <Redo className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Página do Relatório */}
          <div
            className={cn(
              "bg-white dark:bg-slate-950 shadow-lg",
              report.layout.pagina.orientacao === 'portrait' ? 'aspect-[1/1.414]' : 'aspect-[1.414/1]'
            )}
            style={{
              padding: `${report.layout.pagina.margens.top}mm ${report.layout.pagina.margens.right}mm ${report.layout.pagina.margens.bottom}mm ${report.layout.pagina.margens.left}mm`
            }}
          >
            <DndContext onDragEnd={handleDragEnd}>
              <SortableContext items={report.layout.secoes.map(s => s.id)}>
                {report.layout.secoes.map((secao) => (
                  <SortableSection
                    key={secao.id}
                    secao={secao}
                    selected={selectedSection === secao.id}
                    onSelect={() => setSelectedSection(secao.id)}
                    onUpdate={(updated) => updateSecao(secao.id, updated)}
                    onDelete={() => deleteSecao(secao.id)}
                  />
                ))}
              </SortableContext>
            </DndContext>

            {report.layout.secoes.length === 0 && (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                <div className="text-center">
                  <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Arraste componentes para começar</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sidebar: Propriedades */}
      <div className="w-80 border-l p-4 overflow-y-auto">
        {selectedSection ? (
          <SectionProperties
            secao={report.layout.secoes.find(s => s.id === selectedSection)!}
            onChange={(updated) => updateSecao(selectedSection, updated)}
          />
        ) : (
          <ReportProperties
            report={report}
            onChange={setReport}
          />
        )}
      </div>

      {/* Preview Dialog */}
      {showPreview && (
        <ReportPreview
          report={report}
          onClose={() => setShowPreview(false)}
        />
      )}
    </div>
  );
};
```

**Arquivos a criar:**
- `admin/src/components/relatorios/ReportBuilder.tsx`
- `admin/src/components/relatorios/ComponentePalette.tsx`
- `admin/src/components/relatorios/SortableSection.tsx`
- `admin/src/components/relatorios/SectionProperties.tsx`
- `admin/src/components/relatorios/ReportProperties.tsx`
- `admin/src/components/relatorios/sections/TextSection.tsx`
- `admin/src/components/relatorios/sections/TableSection.tsx`
- `admin/src/components/relatorios/sections/ChartSection.tsx`
- `admin/src/components/relatorios/sections/KPISection.tsx`
- `admin/src/hooks/useReportBuilder.ts`

---

## Priorização e Cronograma Sugerido

### Sprint 1 (3 semanas) - Fase 1
- Configurador de relatórios
- Preview de relatórios
- Filtros avançados
- **Valor:** Base para todo o sistema
- **Complexidade:** Alta

### Sprint 2 (3 semanas) - Fase 2
- Geração real de PDF
- Geração real de Excel
- Sistema de templates
- **Valor:** Essencial para produção
- **Complexidade:** Alta

### Sprint 3 (2 semanas) - Fase 3
- Histórico de relatórios
- Gerenciamento de arquivos
- Versionamento
- **Valor:** Organização e controle
- **Complexidade:** Média

### Sprint 4 (2 semanas) - Fase 4
- Agendamento de relatórios
- Sistema de envio por e-mail
- Cron jobs
- **Valor:** Automação
- **Complexidade:** Média

### Sprint 5 (2 semanas) - Fase 5
- Dashboard executivo
- Análise comparativa
- KPIs visuais
- **Valor:** Insights estratégicos
- **Complexidade:** Média

### Sprint 6 (4 semanas) - Fase 6
- Report Builder visual
- Drag-and-drop
- Relatórios customizados
- **Valor:** Diferencial competitivo
- **Complexidade:** Muito Alta

**Total estimado:** 16 semanas (4 meses)

---

## Métricas de Sucesso

1. **Adoção:**
   - 80% dos usuários gerando relatórios mensalmente
   - 50% usando agendamento automático
   - 30% criando relatórios customizados

2. **Eficiência:**
   - Tempo de geração < 10 segundos
   - 95% de relatórios gerados com sucesso
   - Redução de 70% no tempo de análise

3. **Qualidade:**
   - PDFs profissionais e padronizados
   - Excel com formatação e fórmulas
   - Zero erros de exportação

4. **Satisfação:**
   - NPS > 8 para o módulo
   - < 5% de tickets de suporte
   - Feedback positivo em 90% dos casos

---

## Dependências Técnicas

### Bibliotecas Necessárias:
```json
{
  "dependencies": {
    "jspdf": "^2.5.1",
    "jspdf-autotable": "^3.8.2",
    "exceljs": "^4.4.0",
    "recharts": "^2.12.0",
    "react-dnd": "^16.0.1",
    "@dnd-kit/core": "^6.1.0",
    "@dnd-kit/sortable": "^8.0.0",
    "node-cron": "^3.0.3",
    "nodemailer": "^6.9.13",
    "handlebars": "^4.7.8",
    "html2canvas": "^1.4.1",
    "chart.js": "^4.4.2",
    "react-chartjs-2": "^5.2.0"
  }
}
```

### Infraestrutura Backend:
- Storage para arquivos (AWS S3 ou similar)
- Queue system para processamento (Bull/Redis)
- Cron service para agendamentos
- SMTP server para e-mails
- Cache (Redis) para dados frequentes

---

## Próximos Passos

1. ⏭️ Revisar e aprovar roadmap
2. ⏭️ Definir prioridades com stakeholders
3. ⏭️ Setup de infraestrutura (storage, queue, cron)
4. ⏭️ Iniciar Sprint 1 (Fase 1 - Configurador)
5. ⏭️ Prototipar templates de PDF
6. ⏭️ Definir schema de banco para histórico
7. ⏭️ Documentar APIs de relatórios

---

## Observações Finais

Este roadmap transforma o módulo de Relatórios de uma interface simples com botões mockados em um **sistema completo de Business Intelligence**, oferecendo:

- ✅ Geração real de documentos profissionais
- ✅ Automação completa com agendamento
- ✅ Análises comparativas e insights
- ✅ Customização total com builder visual
- ✅ Dashboard executivo de alto nível
- ✅ Histórico e versionamento
- ✅ Templates reutilizáveis
- ✅ Compartilhamento e colaboração

O resultado final será um módulo de relatórios que pode **competir com ferramentas enterprise** de BI e reporting! 🚀
