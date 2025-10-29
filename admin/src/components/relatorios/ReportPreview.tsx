'use client';

import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { ReportConfig } from '@/types/report';
import { useReportPreview } from '@/hooks/useReportPreview';

interface ReportPreviewProps {
  config: ReportConfig;
  open: boolean;
  onClose: () => void;
  onConfirm: (config: ReportConfig) => void;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export const ReportPreview: React.FC<ReportPreviewProps> = ({
  config,
  open,
  onClose,
  onConfirm
}) => {
  const previewData = useReportPreview(config);

  return (
    <Dialog open={open} onOpenChange={onClose}>
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
            <div className="mb-8 text-center pb-8 border-b">
              {config.exportacao.logoEmpresa && (
                <div className="h-16 mx-auto mb-4 flex items-center justify-center">
                  <div className="text-2xl font-bold text-primary">Orion ERP</div>
                </div>
              )}
              <h1 className="text-3xl font-bold mb-2">{config.nome}</h1>
              <p className="text-muted-foreground">
                Período: {format(config.periodo.inicio, 'dd/MM/yyyy', { locale: ptBR })} a {format(config.periodo.fim, 'dd/MM/yyyy', { locale: ptBR })}
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Gerado em: {format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
              </p>
            </div>
          )}

          {/* Resumo Executivo */}
          {config.visualizacao.incluirResumo && previewData.resumo.length > 0 && (
            <div className="mb-8">
              <h2 className="text-xl font-bold mb-4">Resumo Executivo</h2>
              <div className="grid grid-cols-3 gap-4">
                {previewData.resumo.map((item, idx) => (
                  <Card key={idx}>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm text-muted-foreground">{item.label}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{item.valor}</div>
                      {item.variacao !== undefined && (
                        <p className={`text-xs mt-1 ${item.variacao > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {item.variacao > 0 ? '+' : ''}{item.variacao.toFixed(1)}% vs período anterior
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Gráficos */}
          {config.visualizacao.incluirGraficos && previewData.graficos.length > 0 && (
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
                          {Object.keys(grafico.dados[0] || {}).filter(key => key !== 'label').map((key, i) => (
                            <Line
                              key={key}
                              type="monotone"
                              dataKey={key}
                              stroke={COLORS[i % COLORS.length]}
                              strokeWidth={2}
                            />
                          ))}
                        </LineChart>
                      )}
                      {grafico.tipo === 'barra' && (
                        <BarChart data={grafico.dados}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="label" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          {Object.keys(grafico.dados[0] || {}).filter(key => key !== 'label').map((key, i) => (
                            <Bar
                              key={key}
                              dataKey={key}
                              fill={COLORS[i % COLORS.length]}
                            />
                          ))}
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
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
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
          {config.visualizacao.incluirTabelas && previewData.colunas.length > 0 && (
            <div className="mb-8">
              <h2 className="text-xl font-bold mb-4">Dados Detalhados</h2>
              <div className="border rounded-lg overflow-hidden">
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
              </div>
              {previewData.linhas.length > 10 && (
                <p className="text-sm text-muted-foreground mt-2 text-center">
                  Mostrando 10 de {previewData.linhas.length} registros no preview. O relatório completo incluirá todos os dados.
                </p>
              )}
            </div>
          )}

          {/* Rodapé */}
          <div className="mt-8 pt-4 border-t text-center text-sm text-muted-foreground">
            <p>Este é um preview do relatório. O documento final será gerado no formato selecionado.</p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Voltar
          </Button>
          <Button onClick={() => onConfirm(config)}>
            Confirmar e Gerar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
