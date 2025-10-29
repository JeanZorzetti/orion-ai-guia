'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar } from '@/components/ui/calendar';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Eye, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { ReportConfig } from '@/types/report';
import { useReportConfig } from '@/hooks/useReportConfig';

interface ReportConfiguratorProps {
  tipo: ReportConfig['tipo'];
  subtipo: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGenerate: (config: ReportConfig) => void;
  onPreview?: (config: ReportConfig) => void;
}

export const ReportConfigurator: React.FC<ReportConfiguratorProps> = ({
  tipo,
  subtipo,
  open,
  onOpenChange,
  onGenerate,
  onPreview
}) => {
  const {
    config,
    updatePeriodoTipo,
    updateInicio,
    updateFim,
    updateVisualizacao,
    updateExportacao,
    setHoje,
    setOntem,
    setUltimos7Dias,
    setUltimos30Dias,
    setMesAtual,
    setMesPassado
  } = useReportConfig(tipo, subtipo);

  const [activeTab, setActiveTab] = useState('periodo');

  const handleGenerate = () => {
    onGenerate(config);
    onOpenChange(false);
  };

  const handlePreview = () => {
    if (onPreview) {
      onPreview(config);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Configurar Relatório</DialogTitle>
          <DialogDescription>
            Personalize seu relatório antes de gerar
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="periodo">Período</TabsTrigger>
            <TabsTrigger value="filtros">Filtros</TabsTrigger>
            <TabsTrigger value="visualizacao">Visualização</TabsTrigger>
            <TabsTrigger value="exportacao">Exportação</TabsTrigger>
          </TabsList>

          {/* Aba: Período */}
          <TabsContent value="periodo" className="space-y-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Tipo de Período</Label>
                <Select
                  value={config.periodo.tipo}
                  onValueChange={(v) => updatePeriodoTipo(v as ReportConfig['periodo']['tipo'])}
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
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Data Início</Label>
                    <Calendar
                      mode="single"
                      selected={config.periodo.inicio}
                      onSelect={updateInicio}
                      locale={ptBR}
                      className="rounded-md border"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Data Fim</Label>
                    <Calendar
                      mode="single"
                      selected={config.periodo.fim}
                      onSelect={updateFim}
                      locale={ptBR}
                      className="rounded-md border"
                    />
                  </div>
                </div>
              )}

              {/* Atalhos Rápidos */}
              <div className="space-y-2">
                <Label>Atalhos Rápidos</Label>
                <div className="grid grid-cols-3 gap-2">
                  <Button variant="outline" size="sm" onClick={setHoje}>
                    Hoje
                  </Button>
                  <Button variant="outline" size="sm" onClick={setOntem}>
                    Ontem
                  </Button>
                  <Button variant="outline" size="sm" onClick={setUltimos7Dias}>
                    Últimos 7 dias
                  </Button>
                  <Button variant="outline" size="sm" onClick={setUltimos30Dias}>
                    Últimos 30 dias
                  </Button>
                  <Button variant="outline" size="sm" onClick={setMesAtual}>
                    Mês Atual
                  </Button>
                  <Button variant="outline" size="sm" onClick={setMesPassado}>
                    Mês Passado
                  </Button>
                </div>
              </div>

              {/* Preview do Período Selecionado */}
              <div className="p-4 rounded-lg bg-muted">
                <p className="text-sm font-medium mb-1">Período Selecionado:</p>
                <p className="text-sm text-muted-foreground">
                  {format(config.periodo.inicio, 'dd/MM/yyyy', { locale: ptBR })} até{' '}
                  {format(config.periodo.fim, 'dd/MM/yyyy', { locale: ptBR })}
                </p>
              </div>
            </div>
          </TabsContent>

          {/* Aba: Filtros */}
          <TabsContent value="filtros" className="space-y-4">
            <div className="p-8 text-center text-muted-foreground">
              <p>Filtros avançados serão implementados na próxima fase</p>
              <p className="text-sm mt-2">Por enquanto, o relatório incluirá todos os dados do período selecionado</p>
            </div>
          </TabsContent>

          {/* Aba: Visualização */}
          <TabsContent value="visualizacao" className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Incluir gráficos visuais</Label>
                  <p className="text-sm text-muted-foreground">
                    Adiciona gráficos de linha, barras e pizza ao relatório
                  </p>
                </div>
                <Switch
                  checked={config.visualizacao.incluirGraficos}
                  onCheckedChange={(checked) => updateVisualizacao('incluirGraficos', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Incluir tabelas detalhadas</Label>
                  <p className="text-sm text-muted-foreground">
                    Mostra os dados em formato de tabela
                  </p>
                </div>
                <Switch
                  checked={config.visualizacao.incluirTabelas}
                  onCheckedChange={(checked) => updateVisualizacao('incluirTabelas', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Incluir resumo executivo</Label>
                  <p className="text-sm text-muted-foreground">
                    Adiciona cards com KPIs principais no início
                  </p>
                </div>
                <Switch
                  checked={config.visualizacao.incluirResumo}
                  onCheckedChange={(checked) => updateVisualizacao('incluirResumo', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Comparar com período anterior</Label>
                  <p className="text-sm text-muted-foreground">
                    Mostra variações em relação ao período anterior
                  </p>
                </div>
                <Switch
                  checked={config.visualizacao.incluirComparativo}
                  onCheckedChange={(checked) => updateVisualizacao('incluirComparativo', checked)}
                />
              </div>

              {config.visualizacao.incluirComparativo && (
                <div className="space-y-2 ml-6">
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
            </div>
          </TabsContent>

          {/* Aba: Exportação */}
          <TabsContent value="exportacao" className="space-y-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Formato</Label>
                <div className="grid grid-cols-4 gap-2">
                  {(['pdf', 'excel', 'csv', 'json'] as const).map((formato) => (
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
                        <Label htmlFor="portrait">Retrato (vertical)</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="landscape" id="landscape" />
                        <Label htmlFor="landscape">Paisagem (horizontal)</Label>
                      </div>
                    </RadioGroup>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label>Incluir capa</Label>
                      <Switch
                        checked={config.exportacao.incluirCapa}
                        onCheckedChange={(checked) => updateExportacao('incluirCapa', checked)}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label>Incluir índice</Label>
                      <Switch
                        checked={config.exportacao.incluirIndice}
                        onCheckedChange={(checked) => updateExportacao('incluirIndice', checked)}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label>Incluir logo da empresa</Label>
                      <Switch
                        checked={config.exportacao.logoEmpresa}
                        onCheckedChange={(checked) => updateExportacao('logoEmpresa', checked)}
                      />
                    </div>
                  </div>
                </>
              )}

              {config.exportacao.formato === 'excel' && (
                <div className="p-4 rounded-lg bg-muted">
                  <p className="text-sm">
                    O arquivo Excel incluirá múltiplas abas com resumo, dados detalhados e gráficos.
                  </p>
                </div>
              )}

              {config.exportacao.formato === 'csv' && (
                <div className="p-4 rounded-lg bg-muted">
                  <p className="text-sm">
                    O arquivo CSV conterá os dados em formato tabular, ideal para importação em outras ferramentas.
                  </p>
                </div>
              )}

              {config.exportacao.formato === 'json' && (
                <div className="p-4 rounded-lg bg-muted">
                  <p className="text-sm">
                    O arquivo JSON conterá todos os dados estruturados, ideal para integrações com APIs.
                  </p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          {onPreview && (
            <Button variant="outline" onClick={handlePreview}>
              <Eye className="mr-2 h-4 w-4" />
              Preview
            </Button>
          )}
          <Button onClick={handleGenerate}>
            <FileText className="mr-2 h-4 w-4" />
            Gerar Relatório
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
