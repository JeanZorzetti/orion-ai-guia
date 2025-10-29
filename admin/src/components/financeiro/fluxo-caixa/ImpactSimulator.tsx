'use client';

import React, { useState, useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
import type { ImpactSimulation } from '@/types/cash-flow';
import { format, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const ImpactSimulator: React.FC = () => {
  const [simulacao, setSimulacao] = useState<ImpactSimulation>({
    novaReceita: 0,
    novaDespesa: 0,
    dataInicio: new Date(),
    recorrente: false,
    frequencia: 'mensal',
  });

  const saldoAtual = 45280.30;
  const projecaoDias = 30;

  // Calcular impacto
  const { saldoAtualizado, impactoTotal, chartData } = useMemo(() => {
    const impactoUnico = simulacao.novaReceita - simulacao.novaDespesa;
    let impactoRecorrente = 0;

    if (simulacao.recorrente) {
      const ocorrencias = {
        'diaria': projecaoDias,
        'semanal': Math.floor(projecaoDias / 7),
        'mensal': Math.floor(projecaoDias / 30),
        'anual': Math.floor(projecaoDias / 365)
      }[simulacao.frequencia];

      impactoRecorrente = impactoUnico * ocorrencias;
    }

    const impactoTotal = simulacao.recorrente ? impactoRecorrente : impactoUnico;
    const saldoAtualizado = saldoAtual + impactoTotal;

    // Gerar dados para o gráfico
    const mediaEntradasDia = 3685.71 / 7;
    const mediaSaidasDia = 2292.86 / 7;

    const chartData = [];
    let saldoSemImpacto = saldoAtual;
    let saldoComImpacto = saldoAtual;

    for (let i = 0; i < projecaoDias; i++) {
      const data = addDays(new Date(), i);
      const diaSemana = data.getDay();

      let entradas = mediaEntradasDia * (diaSemana === 0 || diaSemana === 6 ? 0.3 : 1);
      let saidas = mediaSaidasDia * (diaSemana === 0 || diaSemana === 6 ? 0.2 : 1);

      // Adicionar variação
      entradas *= (0.8 + Math.random() * 0.4);
      saidas *= (0.8 + Math.random() * 0.4);

      saldoSemImpacto += entradas - saidas;

      // Aplicar impacto da simulação
      let impactoDia = 0;
      if (simulacao.recorrente) {
        const devAplicar = {
          'diaria': true,
          'semanal': i % 7 === 0,
          'mensal': i % 30 === 0,
          'anual': i % 365 === 0
        }[simulacao.frequencia];

        if (devAplicar) {
          impactoDia = simulacao.novaReceita - simulacao.novaDespesa;
        }
      } else {
        if (i === 0) {
          impactoDia = simulacao.novaReceita - simulacao.novaDespesa;
        }
      }

      saldoComImpacto += entradas - saidas + impactoDia;

      chartData.push({
        data: format(data, 'dd/MM', { locale: ptBR }),
        semImpacto: saldoSemImpacto,
        comImpacto: saldoComImpacto,
        diferenca: saldoComImpacto - saldoSemImpacto
      });
    }

    return { saldoAtualizado, impactoTotal, chartData };
  }, [simulacao]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Simulador de Impacto</CardTitle>
        <CardDescription>
          Simule o impacto de novas receitas ou despesas no fluxo de caixa
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Formulário de Simulação */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nova Receita (R$)</Label>
                <Input
                  type="number"
                  value={simulacao.novaReceita}
                  onChange={(e) => setSimulacao({...simulacao, novaReceita: Number(e.target.value)})}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label>Nova Despesa (R$)</Label>
                <Input
                  type="number"
                  value={simulacao.novaDespesa}
                  onChange={(e) => setSimulacao({...simulacao, novaDespesa: Number(e.target.value)})}
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Switch
                  checked={simulacao.recorrente}
                  onCheckedChange={(checked) =>
                    setSimulacao({...simulacao, recorrente: checked})
                  }
                  id="recorrente"
                />
                <Label htmlFor="recorrente">Receita/Despesa Recorrente</Label>
              </div>
            </div>

            {simulacao.recorrente && (
              <div className="space-y-2">
                <Label>Frequência</Label>
                <Select
                  value={simulacao.frequencia}
                  onValueChange={(v: 'diaria' | 'semanal' | 'mensal' | 'anual') => setSimulacao({...simulacao, frequencia: v})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="diaria">Diária</SelectItem>
                    <SelectItem value="semanal">Semanal</SelectItem>
                    <SelectItem value="mensal">Mensal</SelectItem>
                    <SelectItem value="anual">Anual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="pt-4 space-y-3">
              <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-950/20">
                    <DollarSign className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Impacto Total ({projecaoDias} dias)</p>
                    <p className={`text-xl font-bold ${impactoTotal >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {impactoTotal >= 0 ? '+' : ''} R$ {impactoTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>
                {impactoTotal >= 0 ? (
                  <TrendingUp className="h-8 w-8 text-green-500" />
                ) : (
                  <TrendingDown className="h-8 w-8 text-red-500" />
                )}
              </div>
            </div>
          </div>

          {/* Comparação Antes/Depois */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm text-muted-foreground">Cenário Atual</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">
                    R$ {saldoAtual.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </div>
                  <Badge variant="outline" className="mt-2">Sem alterações</Badge>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm text-muted-foreground">Cenário Simulado</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${saldoAtualizado >= saldoAtual ? 'text-green-600' : 'text-red-600'}`}>
                    R$ {saldoAtualizado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </div>
                  <Badge
                    variant={saldoAtualizado >= saldoAtual ? 'default' : 'destructive'}
                    className="mt-2"
                  >
                    {saldoAtualizado >= saldoAtual ? '+' : ''} {((saldoAtualizado - saldoAtual) / saldoAtual * 100).toFixed(1)}%
                  </Badge>
                </CardContent>
              </Card>
            </div>

            {/* Mini Gráfico de Diferença */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Evolução do Impacto</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="data" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-background border rounded-lg p-2 shadow-lg text-xs">
                              <p className="font-medium">{payload[0].payload.data as string}</p>
                              <p className="text-blue-600">
                                Sem: R$ {(payload[0].value as number)?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </p>
                              <p className="text-green-600">
                                Com: R$ {(payload[1].value as number)?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Line type="monotone" dataKey="semImpacto" stroke="hsl(var(--chart-1))" strokeWidth={2} dot={false} name="Sem Impacto" />
                    <Line type="monotone" dataKey="comImpacto" stroke="hsl(var(--chart-2))" strokeWidth={2} dot={false} name="Com Impacto" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
