'use client';

import React, { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useCashFlowProjection } from '@/hooks/useCashFlowProjection';

export const CashFlowProjection: React.FC = () => {
  const [periodoProjecao, setPeriodoProjecao] = useState(30);
  const { dados, alertas, saldoMinimoProjetado, saldoMaximoProjetado, loading } = useCashFlowProjection(periodoProjecao);

  // Formatar dados para o gráfico
  const chartData = dados.map(d => ({
    data: format(d.data, 'dd/MM', { locale: ptBR }),
    dataCompleta: format(d.data, 'dd/MM/yyyy', { locale: ptBR }),
    saldoRealizado: d.saldoFinalRealizado,
    saldoProjetado: d.saldoFinalPrevisto,
    limiteInferior: d.limiteInferior,
    limiteSuperior: d.limiteSuperior,
    confianca: d.confianca,
    origem: d.origem
  }));

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Projeção de Fluxo de Caixa</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[400px]">
            <p className="text-muted-foreground">Carregando projeção...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Projeção de Fluxo de Caixa</CardTitle>
            <CardDescription className="mt-1">
              Previsão baseada em histórico e contas futuras
            </CardDescription>
          </div>
          <Select value={periodoProjecao.toString()} onValueChange={(v) => setPeriodoProjecao(Number(v))}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">7 dias</SelectItem>
              <SelectItem value="15">15 dias</SelectItem>
              <SelectItem value="30">30 dias</SelectItem>
              <SelectItem value="60">60 dias</SelectItem>
              <SelectItem value="90">90 dias</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="data"
              tick={{ fontSize: 12 }}
              className="text-muted-foreground"
            />
            <YAxis
              tick={{ fontSize: 12 }}
              className="text-muted-foreground"
              tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-background border rounded-lg p-3 shadow-lg">
                      <p className="font-medium mb-2">{data.dataCompleta}</p>
                      {data.saldoRealizado !== undefined && (
                        <p className="text-sm text-blue-600">
                          Realizado: R$ {data.saldoRealizado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                      )}
                      <p className="text-sm text-green-600">
                        Projetado: R$ {data.saldoProjetado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Confiança: {data.confianca.toFixed(0)}%
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Legend />

            {/* Linha de saldo realizado (passado) */}
            <Line
              type="monotone"
              dataKey="saldoRealizado"
              stroke="hsl(var(--chart-1))"
              strokeWidth={3}
              name="Realizado"
              dot={false}
              connectNulls={false}
            />

            {/* Linha de saldo projetado (futuro) */}
            <Line
              type="monotone"
              dataKey="saldoProjetado"
              stroke="hsl(var(--chart-2))"
              strokeWidth={2}
              strokeDasharray="5 5"
              name="Projetado"
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>

        {/* Cards de estatísticas */}
        <div className="grid grid-cols-3 gap-4 mt-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-muted-foreground">
                Saldo Mínimo Projetado
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${saldoMinimoProjetado < 0 ? 'text-red-600' : 'text-green-600'}`}>
                R$ {saldoMinimoProjetado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-muted-foreground">
                Saldo Máximo Projetado
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                R$ {saldoMaximoProjetado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-muted-foreground">
                Variação
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                R$ {(saldoMaximoProjetado - saldoMinimoProjetado).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Alertas de Falta de Caixa */}
        {alertas.length > 0 && (
          <Alert variant="destructive" className="mt-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Atenção: Saldo Negativo Previsto</AlertTitle>
            <AlertDescription>
              <ul className="list-disc list-inside mt-2 space-y-1">
                {alertas.slice(0, 5).map((alerta) => (
                  <li key={alerta.id}>
                    {format(alerta.data, 'dd/MM/yyyy', { locale: ptBR })}: Déficit de R$ {Math.abs(alerta.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </li>
                ))}
                {alertas.length > 5 && (
                  <li className="text-muted-foreground">
                    E mais {alertas.length - 5} alerta(s)...
                  </li>
                )}
              </ul>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};
