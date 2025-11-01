'use client';

import React, { useState } from 'react';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  FileText,
  FileSpreadsheet,
  FileJson,
  Printer,
  Calendar as CalendarIcon,
  TrendingUp
} from 'lucide-react';
import type { Report } from '@/types/cash-flow';
import { exportToCSV, exportToJSON, exportToExcel, printReport, ReportData } from '@/lib/report-generator';
import { useCashFlowProjection } from '@/hooks/useCashFlowProjection';
import { useFinancialKPIs } from '@/hooks/useFinancialKPIs';
import { useBankAccounts } from '@/hooks/useBankAccounts';

export const ReportGenerator: React.FC = () => {
  const { dados: projection } = useCashFlowProjection(30);
  const { kpis } = useFinancialKPIs();
  const { accounts } = useBankAccounts();

  const [reportConfig, setReportConfig] = useState<Report>({
    id: '',
    nome: 'Relatório de Fluxo de Caixa',
    tipo: 'fluxo-caixa',
    periodo: {
      inicio: startOfMonth(new Date()),
      fim: endOfMonth(new Date())
    },
    formato: 'pdf',
    opcoes: {
      incluirGraficos: true,
      incluirComparativo: true,
      agruparPor: 'dia'
    }
  });

  const handleGenerate = (formato: 'csv' | 'excel' | 'json' | 'print') => {
    let reportData: ReportData;

    // Gerar dados baseado no tipo de relatório
    switch (reportConfig.tipo) {
      case 'fluxo-caixa':
        reportData = {
          resumo: [
            { label: 'Saldo Mínimo', valor: `R$ ${Math.min(...projection.map(p => p.saldoFinalPrevisto)).toLocaleString('pt-BR')}` },
            { label: 'Saldo Máximo', valor: `R$ ${Math.max(...projection.map(p => p.saldoFinalPrevisto)).toLocaleString('pt-BR')}` },
            { label: 'Total de Dias', valor: projection.length.toString() }
          ],
          graficos: [],
          colunas: ['Data', 'Saldo Inicial', 'Entradas', 'Saídas', 'Saldo Final', 'Confiança (%)', 'Status'],
          linhas: projection.map(p => [
            format(p.data, 'dd/MM/yyyy', { locale: ptBR }),
            p.saldoInicial.toString(),
            p.entradasPrevistas.toString(),
            p.saidasPrevistas.toString(),
            p.saldoFinalPrevisto.toString(),
            p.confianca.toFixed(1),
            p.origem
          ])
        };
        break;

      case 'balanco':
        reportData = {
          resumo: [
            { label: 'Total de Contas', valor: accounts.length.toString() },
            { label: 'Contas Ativas', valor: accounts.filter(a => a.ativa).length.toString() },
            { label: 'Saldo Total', valor: `R$ ${accounts.reduce((sum, a) => sum + a.saldo, 0).toLocaleString('pt-BR')}` }
          ],
          graficos: [],
          colunas: ['Conta', 'Banco', 'Tipo', 'Saldo', 'Status'],
          linhas: accounts.map(a => [
            a.nome,
            a.banco,
            a.tipo,
            a.saldo.toString(),
            a.ativa ? 'Ativa' : 'Inativa'
          ])
        };
        break;

      case 'dre':
        reportData = {
          resumo: [],
          graficos: [],
          colunas: ['Indicador', 'Valor'],
          linhas: kpis ? [
            ['Liquidez Imediata', kpis.liquidezImediata?.toFixed(2) ?? 'N/A'],
            ['Liquidez Corrente', kpis.liquidezCorrente?.toFixed(2) ?? 'N/A'],
            ['PMR (dias)', kpis.pmr?.toFixed(0) ?? 'N/A'],
            ['PMP (dias)', kpis.pmp?.toFixed(0) ?? 'N/A'],
            ['Ciclo Financeiro (dias)', kpis.cicloFinanceiro?.toFixed(0) ?? 'N/A'],
            ['Margem Líquida (%)', kpis.margemLiquida?.toFixed(1) ?? 'N/A'],
            ['Margem EBITDA (%)', kpis.margemEbitda?.toFixed(1) ?? 'N/A'],
            ['ROA (%)', kpis.returnOnAssets?.toFixed(1) ?? 'N/A'],
            ['ROE (%)', kpis.returnOnEquity?.toFixed(1) ?? 'N/A'],
            ['Burn Rate (R$)', kpis.burnRate?.toFixed(2) ?? 'N/A'],
            ['Runway (meses)', kpis.runway?.toFixed(1) ?? 'N/A']
          ] : []
        };
        break;

      default:
        reportData = {
          resumo: [],
          graficos: [],
          colunas: [],
          linhas: []
        };
    }

    // Criar config básico para os novos geradores
    const config = {
      id: Math.random().toString(),
      tipo: 'financeiro' as const,
      subtipo: reportConfig.tipo,
      nome: reportConfig.nome,
      periodo: {
        tipo: 'customizado' as const,
        inicio: reportConfig.periodo.inicio,
        fim: reportConfig.periodo.fim
      },
      filtros: {},
      agrupamento: {
        campo: 'dia' as const,
        ordem: 'desc' as const
      },
      visualizacao: {
        incluirGraficos: reportConfig.opcoes.incluirGraficos,
        incluirTabelas: true,
        incluirResumo: true,
        incluirComparativo: reportConfig.opcoes.incluirComparativo
      },
      exportacao: {
        formato: formato as 'pdf' | 'excel' | 'csv' | 'json',
        orientacao: 'portrait' as const,
        incluirCapa: true,
        incluirIndice: false,
        logoEmpresa: true
      }
    };

    // Executar exportação
    switch (formato) {
      case 'csv':
        exportToCSV(config, reportData);
        break;
      case 'excel':
        exportToExcel(config, reportData);
        break;
      case 'json':
        exportToJSON(config, reportData);
        break;
      case 'print':
        printReport(config, reportData);
        break;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-green-500" />
          Gerador de Relatórios
        </CardTitle>
        <CardDescription>
          Crie relatórios personalizados do seu fluxo de caixa
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Configurações */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Tipo de Relatório</Label>
              <Select
                value={reportConfig.tipo}
                onValueChange={(v) => setReportConfig({...reportConfig, tipo: v as Report['tipo']})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fluxo-caixa">Fluxo de Caixa</SelectItem>
                  <SelectItem value="dre">KPIs Financeiros</SelectItem>
                  <SelectItem value="balanco">Contas Bancárias</SelectItem>
                  <SelectItem value="gerencial">Relatório Gerencial</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Data Início</Label>
                <Input
                  type="date"
                  value={format(reportConfig.periodo.inicio, 'yyyy-MM-dd')}
                  onChange={(e) => setReportConfig({
                    ...reportConfig,
                    periodo: { ...reportConfig.periodo, inicio: new Date(e.target.value) }
                  })}
                />
              </div>
              <div className="space-y-2">
                <Label>Data Fim</Label>
                <Input
                  type="date"
                  value={format(reportConfig.periodo.fim, 'yyyy-MM-dd')}
                  onChange={(e) => setReportConfig({
                    ...reportConfig,
                    periodo: { ...reportConfig.periodo, fim: new Date(e.target.value) }
                  })}
                />
              </div>
            </div>

            <div className="space-y-3">
              <Label>Opções</Label>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={reportConfig.opcoes.incluirGraficos}
                    onCheckedChange={(checked) =>
                      setReportConfig({
                        ...reportConfig,
                        opcoes: {...reportConfig.opcoes, incluirGraficos: checked}
                      })
                    }
                  />
                  <Label className="text-sm font-normal">Incluir gráficos</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={reportConfig.opcoes.incluirComparativo}
                    onCheckedChange={(checked) =>
                      setReportConfig({
                        ...reportConfig,
                        opcoes: {...reportConfig.opcoes, incluirComparativo: checked}
                      })
                    }
                  />
                  <Label className="text-sm font-normal">Comparar com período anterior</Label>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Agrupar por</Label>
              <Select
                value={reportConfig.opcoes.agruparPor}
                onValueChange={(v: 'dia' | 'semana' | 'mes') =>
                  setReportConfig({
                    ...reportConfig,
                    opcoes: {...reportConfig.opcoes, agruparPor: v}
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dia">Dia</SelectItem>
                  <SelectItem value="semana">Semana</SelectItem>
                  <SelectItem value="mes">Mês</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Formatos de Exportação */}
          <div className="space-y-4">
            <div>
              <Label className="mb-3 block">Formato de Exportação</Label>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  className="h-24 flex-col gap-2"
                  onClick={() => handleGenerate('excel')}
                >
                  <FileSpreadsheet className="h-8 w-8 text-green-600" />
                  <span className="text-sm">Excel</span>
                  <Badge variant="secondary" className="text-xs">XLS</Badge>
                </Button>

                <Button
                  variant="outline"
                  className="h-24 flex-col gap-2"
                  onClick={() => handleGenerate('csv')}
                >
                  <FileText className="h-8 w-8 text-blue-600" />
                  <span className="text-sm">CSV</span>
                  <Badge variant="secondary" className="text-xs">Texto</Badge>
                </Button>

                <Button
                  variant="outline"
                  className="h-24 flex-col gap-2"
                  onClick={() => handleGenerate('json')}
                >
                  <FileJson className="h-8 w-8 text-purple-600" />
                  <span className="text-sm">JSON</span>
                  <Badge variant="secondary" className="text-xs">Dados</Badge>
                </Button>

                <Button
                  variant="outline"
                  className="h-24 flex-col gap-2"
                  onClick={() => handleGenerate('print')}
                >
                  <Printer className="h-8 w-8 text-gray-600" />
                  <span className="text-sm">Imprimir</span>
                  <Badge variant="secondary" className="text-xs">PDF</Badge>
                </Button>
              </div>
            </div>

            {/* Atalhos Rápidos */}
            <div className="mt-6">
              <Label className="mb-3 block">Atalhos Rápidos</Label>
              <div className="space-y-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => setReportConfig({
                    ...reportConfig,
                    periodo: { inicio: startOfMonth(new Date()), fim: endOfMonth(new Date()) }
                  })}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  Mês Atual
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => setReportConfig({
                    ...reportConfig,
                    periodo: {
                      inicio: startOfMonth(subMonths(new Date(), 1)),
                      fim: endOfMonth(subMonths(new Date(), 1))
                    }
                  })}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  Mês Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => setReportConfig({
                    ...reportConfig,
                    periodo: {
                      inicio: subMonths(new Date(), 3),
                      fim: new Date()
                    }
                  })}
                >
                  <TrendingUp className="mr-2 h-4 w-4" />
                  Últimos 3 Meses
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
