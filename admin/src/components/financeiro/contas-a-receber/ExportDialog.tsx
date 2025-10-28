'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import {
  Download,
  FileSpreadsheet,
  FileText,
  File,
  CheckCircle2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export type ExportFormat = 'xlsx' | 'csv' | 'pdf';
export type ExportScope = 'all' | 'filtered' | 'selected';

export interface ExportOptions {
  format: ExportFormat;
  scope: ExportScope;
  includeHeaders: boolean;
  includeResumoPorCliente: boolean;
  includeGraficos: boolean;
  includeAnaliseRisco: boolean;
  selectedColumns: string[];
}

interface ExportDialogProps {
  totalRecords: number;
  filteredRecords: number;
  selectedRecords: number;
  onExport: (options: ExportOptions) => Promise<void>;
  disabled?: boolean;
}

const availableColumns = [
  { id: 'numeroDocumento', label: 'Nº Documento', required: true },
  { id: 'clienteNome', label: 'Cliente', required: true },
  { id: 'dataEmissao', label: 'Data Emissão', required: false },
  { id: 'dataVencimento', label: 'Data Vencimento', required: false },
  { id: 'valor', label: 'Valor', required: true },
  { id: 'valorPago', label: 'Valor Pago', required: false },
  { id: 'saldo', label: 'Saldo', required: false },
  { id: 'status', label: 'Status', required: false },
  { id: 'diasVencido', label: 'Dias Vencido', required: false },
  { id: 'formaPagamento', label: 'Forma Pagamento', required: false },
  { id: 'categoriaRisco', label: 'Categoria Risco', required: false },
  { id: 'descricao', label: 'Descrição', required: false },
];

export const ExportDialog: React.FC<ExportDialogProps> = ({
  totalRecords,
  filteredRecords,
  selectedRecords,
  onExport,
  disabled = false,
}) => {
  const [open, setOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);

  const [format, setFormat] = useState<ExportFormat>('xlsx');
  const [scope, setScope] = useState<ExportScope>('filtered');
  const [includeHeaders, setIncludeHeaders] = useState(true);
  const [includeResumoPorCliente, setIncludeResumoPorCliente] = useState(true);
  const [includeGraficos, setIncludeGraficos] = useState(false);
  const [includeAnaliseRisco, setIncludeAnaliseRisco] = useState(false);
  const [selectedColumns, setSelectedColumns] = useState<string[]>(
    availableColumns.filter(col => col.required).map(col => col.id)
  );

  const handleColumnToggle = (columnId: string) => {
    if (selectedColumns.includes(columnId)) {
      setSelectedColumns(selectedColumns.filter(id => id !== columnId));
    } else {
      setSelectedColumns([...selectedColumns, columnId]);
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    setExportSuccess(false);

    try {
      await onExport({
        format,
        scope,
        includeHeaders,
        includeResumoPorCliente,
        includeGraficos,
        includeAnaliseRisco,
        selectedColumns,
      });

      setExportSuccess(true);
      setTimeout(() => {
        setOpen(false);
        setExportSuccess(false);
      }, 2000);
    } catch (error) {
      console.error('Erro ao exportar:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const getRecordCount = (): number => {
    switch (scope) {
      case 'all':
        return totalRecords;
      case 'filtered':
        return filteredRecords;
      case 'selected':
        return selectedRecords;
      default:
        return 0;
    }
  };

  const formatLabel = (fmt: ExportFormat): string => {
    switch (fmt) {
      case 'xlsx':
        return 'Excel (.xlsx)';
      case 'csv':
        return 'CSV (.csv)';
      case 'pdf':
        return 'PDF (.pdf)';
    }
  };

  const formatIcon = (fmt: ExportFormat) => {
    switch (fmt) {
      case 'xlsx':
        return <FileSpreadsheet className="h-5 w-5 text-green-600" />;
      case 'csv':
        return <FileText className="h-5 w-5 text-blue-600" />;
      case 'pdf':
        return <File className="h-5 w-5 text-red-600" />;
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" disabled={disabled} className="gap-2">
          <Download className="h-4 w-4" />
          Exportar
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Exportar Contas a Receber</DialogTitle>
          <DialogDescription>
            Configure as opções de exportação para gerar seu relatório
          </DialogDescription>
        </DialogHeader>

        {exportSuccess ? (
          <div className="py-8 text-center">
            <CheckCircle2 className="h-16 w-16 text-green-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Exportação Concluída!</h3>
            <p className="text-sm text-muted-foreground">
              O download do arquivo será iniciado em instantes
            </p>
          </div>
        ) : (
          <div className="space-y-6 py-4">
            {/* Formato */}
            <div className="space-y-3">
              <Label>Formato do Arquivo</Label>
              <RadioGroup value={format} onValueChange={(v) => setFormat(v as ExportFormat)}>
                <div className="grid grid-cols-3 gap-3">
                  {(['xlsx', 'csv', 'pdf'] as ExportFormat[]).map((fmt) => (
                    <div
                      key={fmt}
                      className={cn(
                        'relative flex items-center space-x-3 rounded-lg border p-4 cursor-pointer transition-all',
                        format === fmt
                          ? 'border-primary bg-primary/5 ring-2 ring-primary'
                          : 'hover:border-primary/50'
                      )}
                      onClick={() => setFormat(fmt)}
                    >
                      <RadioGroupItem value={fmt} id={fmt} className="sr-only" />
                      <div className="flex flex-col items-center flex-1 gap-2">
                        {formatIcon(fmt)}
                        <Label htmlFor={fmt} className="cursor-pointer text-center text-sm">
                          {formatLabel(fmt)}
                        </Label>
                      </div>
                    </div>
                  ))}
                </div>
              </RadioGroup>
            </div>

            {/* Escopo */}
            <div className="space-y-3">
              <Label>Registros a Exportar</Label>
              <RadioGroup value={scope} onValueChange={(v) => setScope(v as ExportScope)}>
                <div className="space-y-2">
                  <div
                    className={cn(
                      'flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all',
                      scope === 'filtered'
                        ? 'border-primary bg-primary/5'
                        : 'hover:border-primary/50'
                    )}
                    onClick={() => setScope('filtered')}
                  >
                    <div className="flex items-center space-x-3">
                      <RadioGroupItem value="filtered" id="filtered" />
                      <Label htmlFor="filtered" className="cursor-pointer">
                        Registros Filtrados
                      </Label>
                    </div>
                    <Badge variant="secondary">{filteredRecords} registros</Badge>
                  </div>

                  <div
                    className={cn(
                      'flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all',
                      scope === 'all'
                        ? 'border-primary bg-primary/5'
                        : 'hover:border-primary/50'
                    )}
                    onClick={() => setScope('all')}
                  >
                    <div className="flex items-center space-x-3">
                      <RadioGroupItem value="all" id="all" />
                      <Label htmlFor="all" className="cursor-pointer">
                        Todos os Registros
                      </Label>
                    </div>
                    <Badge variant="secondary">{totalRecords} registros</Badge>
                  </div>

                  {selectedRecords > 0 && (
                    <div
                      className={cn(
                        'flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all',
                        scope === 'selected'
                          ? 'border-primary bg-primary/5'
                          : 'hover:border-primary/50'
                      )}
                      onClick={() => setScope('selected')}
                    >
                      <div className="flex items-center space-x-3">
                        <RadioGroupItem value="selected" id="selected" />
                        <Label htmlFor="selected" className="cursor-pointer">
                          Registros Selecionados
                        </Label>
                      </div>
                      <Badge variant="secondary">{selectedRecords} registros</Badge>
                    </div>
                  )}
                </div>
              </RadioGroup>
            </div>

            {/* Colunas */}
            <div className="space-y-3">
              <Label>Colunas a Incluir</Label>
              <div className="grid grid-cols-2 gap-3 p-4 border rounded-lg bg-muted/30">
                {availableColumns.map((column) => (
                  <div key={column.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={column.id}
                      checked={selectedColumns.includes(column.id)}
                      onCheckedChange={() => handleColumnToggle(column.id)}
                      disabled={column.required}
                    />
                    <Label
                      htmlFor={column.id}
                      className={cn(
                        'cursor-pointer text-sm',
                        column.required && 'text-muted-foreground'
                      )}
                    >
                      {column.label}
                      {column.required && (
                        <span className="text-xs ml-1">(obrigatório)</span>
                      )}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Opções Adicionais */}
            <div className="space-y-3">
              <Label>Opções Adicionais</Label>
              <div className="space-y-3 p-4 border rounded-lg bg-muted/30">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="headers"
                    checked={includeHeaders}
                    onCheckedChange={(checked) => setIncludeHeaders(checked as boolean)}
                  />
                  <Label htmlFor="headers" className="cursor-pointer text-sm">
                    Incluir cabeçalhos
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="resumo"
                    checked={includeResumoPorCliente}
                    onCheckedChange={(checked) => setIncludeResumoPorCliente(checked as boolean)}
                  />
                  <Label htmlFor="resumo" className="cursor-pointer text-sm">
                    Incluir resumo por cliente
                  </Label>
                </div>

                {format === 'xlsx' && (
                  <>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="graficos"
                        checked={includeGraficos}
                        onCheckedChange={(checked) => setIncludeGraficos(checked as boolean)}
                      />
                      <Label htmlFor="graficos" className="cursor-pointer text-sm">
                        Incluir gráficos
                      </Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="risco"
                        checked={includeAnaliseRisco}
                        onCheckedChange={(checked) => setIncludeAnaliseRisco(checked as boolean)}
                      />
                      <Label htmlFor="risco" className="cursor-pointer text-sm">
                        Incluir análise de risco
                      </Label>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {!exportSuccess && (
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={isExporting}>
              Cancelar
            </Button>
            <Button onClick={handleExport} disabled={isExporting || selectedColumns.length === 0}>
              {isExporting ? (
                <>
                  <Download className="h-4 w-4 mr-2 animate-bounce" />
                  Exportando...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Exportar {getRecordCount()} Registro{getRecordCount() !== 1 ? 's' : ''}
                </>
              )}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
};
