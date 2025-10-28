'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAPKPIs } from '@/hooks/useAPKPIs';
import {
  DollarSign,
  AlertTriangle,
  Clock,
  TrendingUp,
  TrendingDown,
  Calendar,
  Percent,
  Target,
  BarChart3,
  Users,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface TrendBadgeProps {
  value: number;
  inverse?: boolean; // Se true, valores negativos são bons
}

const TrendBadge: React.FC<TrendBadgeProps> = ({ value, inverse = false }) => {
  const isPositive = inverse ? value < 0 : value > 0;
  const isNeutral = value === 0;

  if (isNeutral) {
    return (
      <Badge variant="outline" className="gap-1">
        <Minus className="h-3 w-3" />
        {value.toFixed(1)}%
      </Badge>
    );
  }

  return (
    <Badge
      variant="outline"
      className={cn(
        'gap-1',
        isPositive
          ? 'border-green-500 text-green-700 bg-green-50 dark:bg-green-950 dark:text-green-400'
          : 'border-red-500 text-red-700 bg-red-50 dark:bg-red-950 dark:text-red-400'
      )}
    >
      {isPositive ? (
        <ArrowUpRight className="h-3 w-3" />
      ) : (
        <ArrowDownRight className="h-3 w-3" />
      )}
      {Math.abs(value).toFixed(1)}%
    </Badge>
  );
};

export const APDashboardKPIs: React.FC = () => {
  const kpis = useAPKPIs();

  return (
    <div className="space-y-4">
      {/* Linha 1: Valores principais */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Total a Pagar */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total a Pagar</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {kpis.totalAPagar.toLocaleString('pt-BR')}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {kpis.quantidadeTitulos} {kpis.quantidadeTitulos === 1 ? 'título' : 'títulos'} em aberto
            </p>
            <div className="mt-2">
              <TrendBadge value={kpis.comparacaoMesAnterior.totalAPagar} inverse />
            </div>
          </CardContent>
        </Card>

        {/* Vencidos */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vencidos</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              R$ {kpis.valorVencido.toLocaleString('pt-BR')}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {kpis.quantidadeVencidos} {kpis.quantidadeVencidos === 1 ? 'título vencido' : 'títulos vencidos'}
            </p>
            <div className="mt-2">
              <Badge variant="destructive">
                {kpis.taxaAtrasos.toFixed(1)}% de atraso
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Próximos 7 Dias */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Próximos 7 Dias</CardTitle>
            <Clock className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              R$ {kpis.proximos7Dias.toLocaleString('pt-BR')}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {kpis.quantidadeProximos7Dias} {kpis.quantidadeProximos7Dias === 1 ? 'título vencendo' : 'títulos vencendo'}
            </p>
            <div className="mt-2">
              <Badge variant="outline" className="border-orange-500 text-orange-700">
                Atenção ao fluxo
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Próximos 30 Dias */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Próximos 30 Dias</CardTitle>
            <Calendar className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              R$ {kpis.proximos30Dias.toLocaleString('pt-BR')}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {kpis.quantidadeProximos30Dias} {kpis.quantidadeProximos30Dias === 1 ? 'título' : 'títulos'}
            </p>
            <div className="mt-2">
              <Badge variant="outline" className="border-blue-500 text-blue-700">
                Planejamento
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Linha 2: Indicadores de performance */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* DPO */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">DPO</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.dpo} dias</div>
            <p className="text-xs text-muted-foreground mt-1">
              Days Payable Outstanding
            </p>
            <div className="mt-2">
              <TrendBadge value={kpis.dpoTrend} />
            </div>
          </CardContent>
        </Card>

        {/* Média de Pagamento */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Média de Pagamento</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {kpis.mediaPagamento > 0 ? '+' : ''}{kpis.mediaPagamento} dias
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {kpis.mediaPagamento >= 0 ? 'Após' : 'Antes do'} vencimento
            </p>
            <div className="mt-2">
              <Badge
                variant={kpis.mediaPagamento <= 0 ? 'default' : 'outline'}
                className={cn(
                  kpis.mediaPagamento > 0 && 'border-orange-500 text-orange-700'
                )}
              >
                {kpis.mediaPagamento <= 0 ? 'Em dia' : 'Com atraso'}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Ciclo Financeiro */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ciclo Financeiro</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.cicloFinanceiro} dias</div>
            <p className="text-xs text-muted-foreground mt-1">
              DPO - DSO
            </p>
            <div className="mt-2">
              <Badge
                variant={kpis.cicloFinanceiro < 0 ? 'destructive' : 'default'}
              >
                {kpis.cicloFinanceiro < 0 ? 'Negativo' : 'Positivo'}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Taxa de Atrasos */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Atrasos</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={cn(
              'text-2xl font-bold',
              kpis.taxaAtrasos > 10 ? 'text-destructive' : kpis.taxaAtrasos > 5 ? 'text-orange-600' : 'text-green-600'
            )}>
              {kpis.taxaAtrasos.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Pagamentos em atraso
            </p>
            <div className="mt-2">
              <TrendBadge value={kpis.comparacaoMesAnterior.taxaAtrasos} inverse />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Linha 3: Descontos e concentração */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Descontos Disponíveis */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Descontos Disponíveis</CardTitle>
            <Percent className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              R$ {kpis.descontosDisponiveis.toLocaleString('pt-BR')}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {kpis.quantidadeComDesconto} {kpis.quantidadeComDesconto === 1 ? 'fatura' : 'faturas'} com desconto
            </p>
            <div className="mt-2">
              <Badge variant="outline" className="border-green-500 text-green-700">
                Economize agora
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Economia com Descontos */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Economia Obtida</CardTitle>
            <TrendingDown className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              R$ {kpis.economiaDescontos.toLocaleString('pt-BR')}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {kpis.economiaPercentual.toFixed(2)}% do total
            </p>
            <div className="mt-2">
              <Badge variant="default" className="bg-green-600">
                Este mês
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Concentração de Fornecedores */}
        <Card className="md:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Concentração de Fornecedores
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {kpis.concentracaoFornecedores.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground mt-1 mb-3">
              Top 5 fornecedores representam {kpis.concentracaoFornecedores.toFixed(0)}% do total
            </p>
            <div className="space-y-2">
              {kpis.top5Fornecedores.slice(0, 3).map((fornecedor, index) => (
                <div key={fornecedor.id} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="w-6 h-6 p-0 flex items-center justify-center">
                      {index + 1}
                    </Badge>
                    <span className="font-medium">{fornecedor.nome}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">
                      R$ {fornecedor.valor.toLocaleString('pt-BR')}
                    </span>
                    <Badge variant="secondary">
                      {fornecedor.percentual.toFixed(1)}%
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
