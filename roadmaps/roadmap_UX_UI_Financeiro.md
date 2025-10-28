# Roadmap UX/UI Dashboard Financeiro - Orion ERP

**Objetivo:** Transformar o dashboard financeiro do Orion ERP em uma ferramenta estratégica de controle financeiro, com visualizações interativas, análises preditivas e insights acionáveis, seguindo as melhores práticas de UX/UI para dashboards financeiros de 2025.

**URL Atual:** https://orionerp.roilabs.com.br/admin/financeiro

**Estratégia:** Evolução incremental do dashboard atual, mantendo simplicidade e adicionando camadas de inteligência financeira, visualizações temporais e alertas proativos.

---

## 🎯 Visão Geral

### Status Atual do Dashboard Financeiro

**Pontos Fortes:**
- ✅ KPI cards bem estruturados com cores semânticas
- ✅ Indicadores de urgência ("3 vencendo hoje")
- ✅ Navegação clara para submódulos
- ✅ Layout responsivo (1-4 colunas)
- ✅ Dark mode suportado
- ✅ Formatação de moeda pt-BR

**Oportunidades de Melhoria:**
- ⚠️ **Falta de contexto temporal** - Sem comparação com períodos anteriores
- ⚠️ **Ausência de visualizações** - Nenhum gráfico ou tendência
- ⚠️ **Dados estáticos** - KPIs sem drill-down ou interatividade
- ⚠️ **Sem aging reports** - Não mostra envelhecimento de recebíveis/pagáveis
- ⚠️ **Sem projeções** - Falta fluxo de caixa projetado
- ⚠️ **Alertas limitados** - Apenas contagem, sem detalhes ou ações
- ⚠️ **Sem filtros** - Impossível segmentar por período, categoria, fornecedor
- ⚠️ **Sem DRE visual** - Demonstrativo de resultados apenas numérico
- ⚠️ **Falta de insights** - Sem análises automáticas ou recomendações

---

## 📊 Princípios de Design Financeiro (2025)

### 1. ACES Framework
**Accurate, Clear, Empowering, Succinct** - Framework específico para dashboards financeiros

**Ação:**
- **Accurate**: Dados em tempo real, fontes confiáveis, cálculos auditáveis
- **Clear**: Hierarquia visual óbvia, labels descritivos, unidades sempre visíveis
- **Empowering**: Drill-down habilitado, ações contextuais, exportação fácil
- **Succinct**: Informação condensada, dashboards focados, sem ruído visual

### 2. Regra dos 3 Segundos (Financeiro)
**Objetivo:** Controller/CFO deve identificar problemas críticos em 3 segundos.

**Ação:**
- Alertas vermelhos no topo (faturas vencidas, saldo negativo)
- KPIs críticos em destaque (maior fonte, cores intensas)
- Badges de notificação com contadores

### 3. Visual Hierarchy (F-Pattern)
**Objetivo:** Organizar informação financeira por criticidade.

**Layout Proposto:**
```
┌────────────────────────────────────────────────┐
│ 🔴 Alertas Críticos (se houver)                │
├────────────────────────────────────────────────┤
│ KPI1 (GRANDE)  │ KPI2 │ KPI3 │ KPI4           │
│ Saldo/Caixa    │ A Pgr│ A Rec│ Resultado      │
├────────────────────────────────────────────────┤
│ Gráfico Fluxo de Caixa (12 semanas)           │
├────────────────────────────────────────────────┤
│ Aging A Receber │ Aging A Pagar               │
├────────────────────────────────────────────────┤
│ DRE Mensal │ Top Despesas │ Vencimentos Curto│
└────────────────────────────────────────────────┘
```

### 4. Contextual Data (Temporal Financeiro)
**Objetivo:** Nunca mostrar um valor financeiro isolado.

**Sempre incluir:**
- Comparação temporal (vs. mês anterior, vs. mesmo mês ano passado)
- Indicador de tendência (↑ +15% ou ↓ -8%)
- Mini sparkline (últimos 6 meses)
- Data de atualização

### 5. Actionable Design (Financeiro)
**Objetivo:** Conectar métricas financeiras com ações de gestão.

**Exemplos:**
- "5 faturas vencidas (R$ 12.400)" → Botão "Enviar Cobrança"
- "Fluxo negativo em 14 dias" → Botão "Ver Estratégias"
- "R$ 8.500 a vencer hoje" → Botão "Agendar Pagamento"
- "Saldo baixo (< R$ 5.000)" → Botão "Ver Empréstimos"

---

## 🎨 Design System Financeiro

### Cores Semânticas (Específicas para Finanças)

```typescript
// Paleta Financeira (Dark Mode)
colors: {
  // Status Financeiro
  financial: {
    positive: '#10B981',      // Verde - Receitas, saldo positivo
    negative: '#EF4444',      // Vermelho - Despesas, dívidas
    warning: '#F59E0B',       // Laranja - Vencendo, atenção
    neutral: '#6B7280',       // Cinza - Informação neutra
    overdue: '#DC2626',       // Vermelho escuro - Vencido
    paid: '#059669',          // Verde escuro - Pago
    pending: '#D97706',       // Laranja escuro - Pendente
  },

  // Categorias de Despesa
  expense: {
    fixed: '#8B5CF6',         // Roxo - Despesas fixas
    variable: '#3B82F6',      // Azul - Despesas variáveis
    investment: '#06B6D4',    // Ciano - Investimentos
    tax: '#F59E0B',           // Laranja - Impostos
  },

  // Aging (Envelhecimento)
  aging: {
    current: '#10B981',       // 0-30 dias
    warning: '#F59E0B',       // 31-60 dias
    critical: '#EF4444',      // 61-90 dias
    overdue: '#DC2626',       // 90+ dias
  }
}
```

### Iconografia Financeira

```typescript
// Ícones específicos para contexto financeiro
icons: {
  income: TrendingUp,
  expense: TrendingDown,
  balance: DollarSign,
  invoice: FileText,
  payment: CreditCard,
  bank: Building,
  wallet: Wallet,
  calendar: Calendar,
  alert: AlertTriangle,
  check: CheckCircle,
  clock: Clock,
}
```

---

## 🔧 Melhorias por Fase

---

## 📈 Fase 1: KPI Cards Financeiros Aprimorados (Prioridade: ALTA)

### Status: ⏳ Planejado

### Objetivo
Transformar KPI cards estáticos em componentes informativos com contexto temporal e ações rápidas.

### 1.1 Adicionar Comparações Temporais

**Atual:**
```tsx
<div className="text-2xl font-bold text-red-600">
  R$ {resumoFinanceiro.contasAPagar.toLocaleString('pt-BR')}
</div>
<p className="text-xs text-muted-foreground">3 vencendo hoje</p>
```

**Proposto:**
```tsx
<div className="space-y-2">
  <div className="text-3xl font-bold text-red-600">
    R$ {resumoFinanceiro.contasAPagar.toLocaleString('pt-BR')}
  </div>
  <div className="flex items-center gap-2">
    <Badge variant="destructive" className="text-xs">
      <TrendingUp className="h-3 w-3 mr-1" />
      +18.5%
    </Badge>
    <span className="text-xs text-muted-foreground">vs. mês anterior</span>
  </div>
  <Sparkline
    data={lastMonthsPayables}
    color="#EF4444"
    height={32}
  />
</div>
```

### 1.2 Adicionar Mini Sparklines Financeiros

**Componente:**
```tsx
// components/ui/financial-sparkline.tsx
interface FinancialSparklineProps {
  data: number[];
  color?: string;
  height?: number;
  showArea?: boolean;
  showGradient?: boolean;
}

const FinancialSparkline: React.FC<FinancialSparklineProps> = ({
  data,
  color = '#3B82F6',
  height = 40,
  showArea = true,
  showGradient = true
}) => {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;

  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * 100;
    const y = ((max - value) / range) * 100;
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg width="100%" height={height} viewBox="0 0 100 100" preserveAspectRatio="none">
      {showGradient && (
        <defs>
          <linearGradient id={`gradient-${color}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.3" />
            <stop offset="100%" stopColor={color} stopOpacity="0.05" />
          </linearGradient>
        </defs>
      )}
      {showArea && (
        <polygon
          points={`0,100 ${points} 100,100`}
          fill={`url(#gradient-${color})`}
        />
      )}
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};
```

### 1.3 Layout Hierárquico com Card Primário

**Grid Proposto:**
```tsx
<div className="grid grid-cols-1 md:grid-cols-4 gap-6">
  {/* Card Principal - 2 colunas - Saldo/Caixa */}
  <Card className="md:col-span-2 border-blue-500/20 bg-gradient-to-br from-blue-500/5 to-blue-500/10">
    <CardHeader>
      <CardTitle className="text-lg">Saldo em Caixa</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="text-5xl font-bold text-blue-600">
        {formatCurrency(saldoAtual)}
      </div>
      <FinancialSparkline
        data={last12MonthsBalance}
        color="#3B82F6"
        height={60}
      />
      <div className="flex items-center justify-between mt-4">
        <Badge variant={balanceChange > 0 ? "success" : "destructive"}>
          {balanceChange > 0 ? <TrendingUp /> : <TrendingDown />}
          {balanceChange > 0 ? '+' : ''}{balanceChange}%
        </Badge>
        <span className="text-sm text-muted-foreground">
          Meta: {formatCurrency(monthlyBalanceGoal)}
        </span>
      </div>
    </CardContent>
  </Card>

  {/* Cards Secundários - 1 coluna cada */}
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">Contas a Pagar</CardTitle>
      <TrendingDown className="h-4 w-4 text-red-500" />
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold text-red-600">
        {formatCurrency(contasAPagar)}
      </div>
      <FinancialSparkline
        data={last6MonthsPayables}
        color="#EF4444"
        height={32}
      />
      <div className="flex items-center gap-2 mt-2">
        <Badge variant="destructive" className="text-xs">
          {vencendoHoje} vencendo hoje
        </Badge>
      </div>
    </CardContent>
  </Card>

  {/* Contas a Receber */}
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">Contas a Receber</CardTitle>
      <TrendingUp className="h-4 w-4 text-green-500" />
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold text-green-600">
        {formatCurrency(contasAReceber)}
      </div>
      <FinancialSparkline
        data={last6MonthsReceivables}
        color="#10B981"
        height={32}
      />
      <div className="flex items-center gap-2 mt-2">
        <span className="text-xs text-muted-foreground">
          Próximos 30 dias
        </span>
      </div>
    </CardContent>
  </Card>
</div>
```

### 1.4 Adicionar Quick Actions nos Cards

```tsx
const FinancialKPICard = ({ title, value, trend, sparklineData, actions }) => (
  <Card className="group hover:shadow-lg transition-all">
    <CardHeader>
      <CardTitle>{title}</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="text-3xl font-bold">{formatCurrency(value)}</div>
      <FinancialSparkline data={sparklineData} />
      <div className="flex items-center gap-2 mt-3">
        <Badge variant={trend > 0 ? "success" : "destructive"}>
          {trend > 0 ? <TrendingUp /> : <TrendingDown />}
          {trend > 0 ? '+' : ''}{trend}%
        </Badge>
      </div>

      {/* Quick Actions - aparecem no hover */}
      <div className="mt-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
        {actions.map((action) => (
          <Button
            key={action.label}
            variant="outline"
            size="sm"
            onClick={action.onClick}
          >
            {action.icon}
            {action.label}
          </Button>
        ))}
      </div>
    </CardContent>
  </Card>
);

// Uso:
<FinancialKPICard
  title="Contas a Pagar"
  value={contasAPagar}
  trend={-12.5}
  sparklineData={last6Months}
  actions={[
    {
      label: "Agendar",
      icon: <Calendar />,
      onClick: () => router.push('/admin/financeiro/contas-a-pagar?action=schedule')
    },
    {
      label: "Ver Todas",
      icon: <ArrowRight />,
      onClick: () => router.push('/admin/financeiro/contas-a-pagar')
    }
  ]}
/>
```

**Estimativa:** 3-4 dias úteis
**Impacto:** ALTO - Contexto temporal é essencial para decisões financeiras

---

## 📊 Fase 2: Visualizações Financeiras Avançadas (Prioridade: ALTA)

### Status: ⏳ Planejado

### Objetivo
Adicionar gráficos específicos para análise financeira: fluxo de caixa, aging reports, DRE visual.

### 2.1 Gráfico de Fluxo de Caixa (12 Semanas)

**Componente:**
```tsx
// components/financeiro/CashFlowChart.tsx
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ReferenceLine, ResponsiveContainer } from 'recharts';

interface CashFlowChartProps {
  data: Array<{
    week: string;
    entrada: number;
    saida: number;
    saldo: number;
    projecao?: boolean;
  }>;
}

const CashFlowChart: React.FC<CashFlowChartProps> = ({ data }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Fluxo de Caixa Projetado</CardTitle>
        <p className="text-sm text-muted-foreground">
          Próximas 12 semanas (histórico + projeção)
        </p>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorEntrada" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10B981" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#10B981" stopOpacity={0.05} />
              </linearGradient>
              <linearGradient id="colorSaida" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#EF4444" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#EF4444" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#2D3748" />
            <XAxis
              dataKey="week"
              stroke="#6B7280"
              tick={{ fill: '#9CA3AF' }}
            />
            <YAxis
              stroke="#6B7280"
              tick={{ fill: '#9CA3AF' }}
              tickFormatter={(value) => formatCurrencyCompact(value)}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1E242C',
                border: '1px solid #374151',
                borderRadius: '8px'
              }}
              formatter={(value: number) => formatCurrency(value)}
            />
            <Legend />

            {/* Linha do zero */}
            <ReferenceLine y={0} stroke="#6B7280" strokeDasharray="3 3" />

            {/* Áreas */}
            <Area
              type="monotone"
              dataKey="entrada"
              stroke="#10B981"
              strokeWidth={2}
              fill="url(#colorEntrada)"
              name="Entradas"
            />
            <Area
              type="monotone"
              dataKey="saida"
              stroke="#EF4444"
              strokeWidth={2}
              fill="url(#colorSaida)"
              name="Saídas"
            />

            {/* Linha de saldo (linha, não área) */}
            <Area
              type="monotone"
              dataKey="saldo"
              stroke="#3B82F6"
              strokeWidth={3}
              fill="none"
              name="Saldo"
              strokeDasharray={data.some(d => d.projecao) ? "5 5" : undefined}
            />
          </AreaChart>
        </ResponsiveContainer>

        {/* Legenda adicional */}
        <div className="mt-4 flex items-center justify-center gap-6 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-3 h-0.5 bg-blue-500"></div>
            <span>Linha sólida = Histórico</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-0.5 bg-blue-500 opacity-50" style={{borderTop: '2px dashed'}}></div>
            <span>Linha tracejada = Projeção</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
```

### 2.2 Aging Report (Envelhecimento de Recebíveis)

**Componente:**
```tsx
// components/financeiro/AgingChart.tsx
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from 'recharts';

interface AgingChartProps {
  type: 'receivable' | 'payable';
  data: Array<{
    range: string;
    value: number;
    count: number;
  }>;
}

const AGING_COLORS = {
  'current': '#10B981',    // 0-30 dias - Verde
  'warning': '#F59E0B',    // 31-60 dias - Laranja
  'critical': '#EF4444',   // 61-90 dias - Vermelho
  'overdue': '#DC2626'     // 90+ dias - Vermelho escuro
};

const AgingChart: React.FC<AgingChartProps> = ({ type, data }) => {
  const title = type === 'receivable' ? 'Aging de Recebíveis' : 'Aging de Pagáveis';

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <p className="text-sm text-muted-foreground">
          Distribuição por período de vencimento
        </p>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="#2D3748" />
            <XAxis
              type="number"
              stroke="#6B7280"
              tick={{ fill: '#9CA3AF' }}
              tickFormatter={(value) => formatCurrencyCompact(value)}
            />
            <YAxis
              type="category"
              dataKey="range"
              stroke="#6B7280"
              tick={{ fill: '#9CA3AF' }}
              width={120}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1E242C',
                border: '1px solid #374151',
                borderRadius: '8px'
              }}
              formatter={(value: number, name, props) => [
                formatCurrency(value),
                `${props.payload.count} fatura(s)`
              ]}
            />
            <Bar dataKey="value" radius={[0, 8, 8, 0]}>
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={Object.values(AGING_COLORS)[index]}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>

        {/* Tabela de resumo */}
        <div className="mt-4 space-y-2">
          {data.map((item, index) => (
            <div key={item.range} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-sm"
                  style={{ backgroundColor: Object.values(AGING_COLORS)[index] }}
                />
                <span>{item.range}</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-muted-foreground">{item.count} fatura(s)</span>
                <span className="font-semibold">{formatCurrency(item.value)}</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

// Uso:
const agingReceivableData = [
  { range: '0-30 dias (Atual)', value: 15200, count: 8 },
  { range: '31-60 dias', value: 8500, count: 4 },
  { range: '61-90 dias', value: 3200, count: 2 },
  { range: '90+ dias (Vencido)', value: 1450, count: 1 }
];

<AgingChart type="receivable" data={agingReceivableData} />
```

### 2.3 DRE Visual (Waterfall Chart)

**Componente:**
```tsx
// components/financeiro/DREWaterfallChart.tsx
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from 'recharts';

interface DREWaterfallChartProps {
  data: Array<{
    category: string;
    value: number;
    isTotal?: boolean;
  }>;
}

const DREWaterfallChart: React.FC<DREWaterfallChartProps> = ({ data }) => {
  // Calcular running total para waterfall
  let runningTotal = 0;
  const chartData = data.map((item, index) => {
    const start = runningTotal;
    runningTotal += item.value;
    const end = runningTotal;

    return {
      name: item.category,
      start: start,
      value: Math.abs(item.value),
      end: end,
      isPositive: item.value >= 0,
      isTotal: item.isTotal
    };
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>DRE Mensal (Demonstração de Resultado)</CardTitle>
        <p className="text-sm text-muted-foreground">
          Composição do resultado do mês
        </p>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <ComposedChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2D3748" />
            <XAxis
              dataKey="name"
              stroke="#6B7280"
              tick={{ fill: '#9CA3AF', fontSize: 12 }}
              angle={-45}
              textAnchor="end"
              height={100}
            />
            <YAxis
              stroke="#6B7280"
              tick={{ fill: '#9CA3AF' }}
              tickFormatter={(value) => formatCurrencyCompact(value)}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1E242C',
                border: '1px solid #374151',
                borderRadius: '8px'
              }}
              formatter={(value: number) => formatCurrency(value)}
            />

            {/* Barras invisíveis para posicionar */}
            <Bar dataKey="start" stackId="a" fill="transparent" />

            {/* Barras visíveis com cores condicionais */}
            <Bar dataKey="value" stackId="a" radius={[4, 4, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={
                    entry.isTotal ? '#8B5CF6' :
                    entry.isPositive ? '#10B981' :
                    '#EF4444'
                  }
                />
              ))}
            </Bar>

            {/* Linha conectando os totais */}
            <Line
              type="stepAfter"
              dataKey="end"
              stroke="#3B82F6"
              strokeWidth={2}
              dot={{ fill: '#3B82F6', r: 4 }}
            />
          </ComposedChart>
        </ResponsiveContainer>

        {/* Resumo textual */}
        <div className="mt-4 grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-xs text-muted-foreground">Receita Total</p>
            <p className="text-lg font-bold text-green-600">
              {formatCurrency(data.find(d => d.category === 'Receita')?.value || 0)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Despesa Total</p>
            <p className="text-lg font-bold text-red-600">
              {formatCurrency(Math.abs(data.find(d => d.category === 'Despesas')?.value || 0))}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Resultado Líquido</p>
            <p className="text-lg font-bold text-purple-600">
              {formatCurrency(data.find(d => d.category === 'Resultado')?.value || 0)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Uso:
const dreData = [
  { category: 'Receita', value: 125000 },
  { category: 'CMV', value: -45000 },
  { category: 'Lucro Bruto', value: 80000, isTotal: true },
  { category: 'Despesas Operacionais', value: -32000 },
  { category: 'EBITDA', value: 48000, isTotal: true },
  { category: 'Depreciação', value: -5000 },
  { category: 'Juros', value: -3000 },
  { category: 'Impostos', value: -8000 },
  { category: 'Resultado', value: 32000, isTotal: true }
];
```

### 2.4 Gráfico de Pizza: Top Despesas por Categoria

```tsx
// components/financeiro/ExpensesByCategoryChart.tsx
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const EXPENSE_COLORS = {
  'Fornecedores': '#EF4444',
  'Pessoal': '#F59E0B',
  'Impostos': '#8B5CF6',
  'Aluguel': '#3B82F6',
  'Marketing': '#EC4899',
  'Outros': '#6B7280'
};

interface ExpensesByCategoryChartProps {
  data: Array<{
    category: string;
    value: number;
    percentage: number;
  }>;
}

const ExpensesByCategoryChart: React.FC<ExpensesByCategoryChartProps> = ({ data }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Despesas por Categoria</CardTitle>
        <p className="text-sm text-muted-foreground">
          Distribuição do mês atual
        </p>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percentage }) => `${name} ${percentage.toFixed(1)}%`}
              outerRadius={100}
              fill="#8884d8"
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={EXPENSE_COLORS[entry.category] || EXPENSE_COLORS['Outros']}
                />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: number) => formatCurrency(value)}
              contentStyle={{
                backgroundColor: '#1E242C',
                border: '1px solid #374151',
                borderRadius: '8px'
              }}
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>

        {/* Tabela detalhada */}
        <div className="mt-4 space-y-2">
          {data.map((item) => (
            <div key={item.category} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: EXPENSE_COLORS[item.category] }}
                />
                <span>{item.category}</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-muted-foreground">{item.percentage.toFixed(1)}%</span>
                <span className="font-semibold">{formatCurrency(item.value)}</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
```

**Estimativa:** 5-6 dias úteis
**Impacto:** ALTO - Visualizações são críticas para análise financeira

---

## 🎛️ Fase 3: Filtros e Período Financeiro (Prioridade: MÉDIA-ALTA)

### Status: ⏳ Planejado

### Objetivo
Permitir análise temporal e segmentação de dados financeiros.

### 3.1 Filtro de Período Financeiro

**Componente:**
```tsx
// components/financeiro/FinancialPeriodPicker.tsx
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

type PeriodPreset = 'today' | 'week' | 'month' | 'quarter' | 'year' | 'custom';

interface FinancialPeriodPickerProps {
  value: DateRange | undefined;
  onChange: (range: DateRange | undefined) => void;
  fiscalYearStart?: number; // Mês de início do ano fiscal (1-12)
}

const FinancialPeriodPicker: React.FC<FinancialPeriodPickerProps> = ({
  value,
  onChange,
  fiscalYearStart = 1 // Janeiro por padrão
}) => {
  const presets = [
    {
      label: 'Hoje',
      value: 'today',
      getValue: () => ({ from: new Date(), to: new Date() })
    },
    {
      label: 'Esta Semana',
      value: 'week',
      getValue: () => ({
        from: startOfWeek(new Date()),
        to: endOfWeek(new Date())
      })
    },
    {
      label: 'Este Mês',
      value: 'month',
      getValue: () => ({
        from: startOfMonth(new Date()),
        to: endOfMonth(new Date())
      })
    },
    {
      label: 'Este Trimestre',
      value: 'quarter',
      getValue: () => ({
        from: startOfQuarter(new Date()),
        to: endOfQuarter(new Date())
      })
    },
    {
      label: 'Este Ano Fiscal',
      value: 'year',
      getValue: () => {
        const now = new Date();
        const year = now.getFullYear();
        const startMonth = fiscalYearStart - 1;

        // Se ainda não passou o mês de início, usar ano anterior
        const fiscalYear = now.getMonth() >= startMonth ? year : year - 1;

        return {
          from: new Date(fiscalYear, startMonth, 1),
          to: new Date(fiscalYear + 1, startMonth, 0) // Último dia do mês anterior ao início
        };
      }
    },
    {
      label: 'Últimos 90 dias',
      value: 'last90',
      getValue: () => ({
        from: subDays(new Date(), 90),
        to: new Date()
      })
    }
  ];

  return (
    <div className="space-y-4">
      {/* Tabs de presets rápidos */}
      <Tabs defaultValue="month">
        <TabsList className="grid w-full grid-cols-6">
          {presets.map((preset) => (
            <TabsTrigger
              key={preset.value}
              value={preset.value}
              onClick={() => onChange(preset.getValue())}
            >
              {preset.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Calendário customizado */}
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className="w-full justify-start">
            <Calendar className="mr-2 h-4 w-4" />
            {value?.from ? (
              value.to ? (
                <>
                  {format(value.from, 'dd/MM/yyyy', { locale: ptBR })} -{' '}
                  {format(value.to, 'dd/MM/yyyy', { locale: ptBR })}
                </>
              ) : (
                format(value.from, 'dd/MM/yyyy', { locale: ptBR })
              )
            ) : (
              'Selecionar período customizado'
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={value?.from}
            selected={value}
            onSelect={onChange}
            numberOfMonths={2}
            locale={ptBR}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
};
```

### 3.2 Filtros de Categoria e Fornecedor

```tsx
// components/financeiro/FinancialFilters.tsx
import { MultiSelect } from '@/components/ui/multi-select';
import { Command, CommandInput, CommandList, CommandItem } from '@/components/ui/command';

interface FinancialFiltersProps {
  selectedCategories: string[];
  selectedVendors: string[];
  selectedStatus: string[];
  onCategoriesChange: (categories: string[]) => void;
  onVendorsChange: (vendors: string[]) => void;
  onStatusChange: (status: string[]) => void;
}

const EXPENSE_CATEGORIES = [
  { value: 'fornecedores', label: 'Fornecedores', icon: <Package /> },
  { value: 'pessoal', label: 'Pessoal', icon: <Users /> },
  { value: 'impostos', label: 'Impostos', icon: <FileText /> },
  { value: 'aluguel', label: 'Aluguel', icon: <Building /> },
  { value: 'marketing', label: 'Marketing', icon: <Megaphone /> },
  { value: 'outros', label: 'Outros', icon: <MoreHorizontal /> }
];

const PAYMENT_STATUS = [
  { value: 'paid', label: 'Pago', color: '#059669' },
  { value: 'pending', label: 'Pendente', color: '#D97706' },
  { value: 'overdue', label: 'Vencido', color: '#DC2626' },
  { value: 'scheduled', label: 'Agendado', color: '#3B82F6' }
];

const FinancialFilters: React.FC<FinancialFiltersProps> = ({
  selectedCategories,
  selectedVendors,
  selectedStatus,
  onCategoriesChange,
  onVendorsChange,
  onStatusChange
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Filtros</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filtro de Categorias */}
        <div>
          <label className="text-sm font-medium mb-2 block">Categorias</label>
          <MultiSelect
            options={EXPENSE_CATEGORIES}
            selected={selectedCategories}
            onChange={onCategoriesChange}
            placeholder="Todas as categorias"
          />
        </div>

        {/* Filtro de Status */}
        <div>
          <label className="text-sm font-medium mb-2 block">Status de Pagamento</label>
          <MultiSelect
            options={PAYMENT_STATUS}
            selected={selectedStatus}
            onChange={onStatusChange}
            placeholder="Todos os status"
          />
        </div>

        {/* Filtro de Fornecedores */}
        <div>
          <label className="text-sm font-medium mb-2 block">Fornecedores</label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-start">
                <Search className="mr-2 h-4 w-4" />
                {selectedVendors.length > 0
                  ? `${selectedVendors.length} selecionado(s)`
                  : 'Buscar fornecedores'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="p-0" align="start">
              <Command>
                <CommandInput placeholder="Buscar fornecedor..." />
                <CommandList>
                  {/* Lista de fornecedores */}
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>

        {/* Botão para limpar filtros */}
        {(selectedCategories.length > 0 || selectedVendors.length > 0 || selectedStatus.length > 0) && (
          <Button
            variant="ghost"
            size="sm"
            className="w-full"
            onClick={() => {
              onCategoriesChange([]);
              onVendorsChange([]);
              onStatusChange([]);
            }}
          >
            <X className="mr-2 h-4 w-4" />
            Limpar todos os filtros
          </Button>
        )}
      </CardContent>
    </Card>
  );
};
```

### 3.3 Comparação de Períodos

```tsx
// components/financeiro/PeriodComparisonToggle.tsx
interface PeriodComparisonToggleProps {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
  comparisonType: 'previous' | 'year-over-year';
  onTypeChange: (type: 'previous' | 'year-over-year') => void;
}

const PeriodComparisonToggle: React.FC<PeriodComparisonToggleProps> = ({
  enabled,
  onChange,
  comparisonType,
  onTypeChange
}) => {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Switch
              checked={enabled}
              onCheckedChange={onChange}
              id="comparison"
            />
            <Label htmlFor="comparison">
              Comparar com período anterior
            </Label>
          </div>

          {enabled && (
            <Select value={comparisonType} onValueChange={onTypeChange}>
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="previous">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Período anterior
                  </div>
                </SelectItem>
                <SelectItem value="year-over-year">
                  <div className="flex items-center gap-2">
                    <CalendarDays className="h-4 w-4" />
                    Mesmo período ano anterior
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
```

**Estimativa:** 4-5 dias úteis
**Impacto:** MÉDIO-ALTO - Essencial para análise comparativa

---

## 🚨 Fase 4: Alertas e Notificações Financeiras (Prioridade: ALTA)

### Status: ⏳ Planejado

### Objetivo
Sistema proativo de alertas financeiros com notificações e ações rápidas.

### 4.1 Card de Alertas Críticos

**Componente:**
```tsx
// components/financeiro/FinancialAlertsCard.tsx
import { AlertTriangle, Clock, TrendingDown, Ban } from 'lucide-react';

export type AlertSeverity = 'critical' | 'warning' | 'info';
export type AlertType = 'overdue' | 'due-soon' | 'low-balance' | 'high-expenses' | 'late-payment';

export interface FinancialAlert {
  id: string;
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  description: string;
  value?: number;
  count?: number;
  dueDate?: Date;
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
}

interface FinancialAlertsCardProps {
  alerts: FinancialAlert[];
  maxDisplay?: number;
}

const getAlertIcon = (type: AlertType) => {
  switch (type) {
    case 'overdue':
      return <Ban className="h-5 w-5" />;
    case 'due-soon':
      return <Clock className="h-5 w-5" />;
    case 'low-balance':
      return <TrendingDown className="h-5 w-5" />;
    case 'high-expenses':
      return <AlertTriangle className="h-5 w-5" />;
    default:
      return <AlertTriangle className="h-5 w-5" />;
  }
};

const getAlertColor = (severity: AlertSeverity) => {
  switch (severity) {
    case 'critical':
      return {
        bg: 'bg-red-50 dark:bg-red-950/20',
        border: 'border-red-500/20',
        text: 'text-red-600 dark:text-red-400',
        icon: 'text-red-500'
      };
    case 'warning':
      return {
        bg: 'bg-orange-50 dark:bg-orange-950/20',
        border: 'border-orange-500/20',
        text: 'text-orange-600 dark:text-orange-400',
        icon: 'text-orange-500'
      };
    case 'info':
      return {
        bg: 'bg-blue-50 dark:bg-blue-950/20',
        border: 'border-blue-500/20',
        text: 'text-blue-600 dark:text-blue-400',
        icon: 'text-blue-500'
      };
  }
};

const FinancialAlertsCard: React.FC<FinancialAlertsCardProps> = ({
  alerts,
  maxDisplay = 5
}) => {
  // Ordenar por severidade: critical > warning > info
  const sortedAlerts = [...alerts].sort((a, b) => {
    const severityOrder = { critical: 0, warning: 1, info: 2 };
    return severityOrder[a.severity] - severityOrder[b.severity];
  });

  const displayAlerts = sortedAlerts.slice(0, maxDisplay);
  const remainingCount = sortedAlerts.length - maxDisplay;

  if (alerts.length === 0) {
    return (
      <Card className="border-green-500/20">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3 text-green-600">
            <CheckCircle className="h-5 w-5" />
            <p className="text-sm font-medium">
              Tudo está em ordem! Sem alertas financeiros no momento.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-red-500/20 bg-gradient-to-r from-red-500/5 to-orange-500/5">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            <CardTitle>Alertas Financeiros</CardTitle>
          </div>
          <Badge variant="destructive">{alerts.length}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {displayAlerts.map((alert) => {
          const colors = getAlertColor(alert.severity);

          return (
            <div
              key={alert.id}
              className={`flex items-start gap-3 p-4 rounded-lg border ${colors.bg} ${colors.border} hover:scale-[1.02] transition-transform`}
            >
              <div className={colors.icon}>
                {getAlertIcon(alert.type)}
              </div>

              <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold ${colors.text}`}>
                  {alert.title}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {alert.description}
                </p>

                {alert.value && (
                  <p className={`text-lg font-bold mt-2 ${colors.text}`}>
                    {formatCurrency(alert.value)}
                    {alert.count && (
                      <span className="text-sm font-normal ml-2">
                        ({alert.count} {alert.count === 1 ? 'fatura' : 'faturas'})
                      </span>
                    )}
                  </p>
                )}

                {alert.dueDate && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Vencimento: {format(alert.dueDate, "dd 'de' MMMM", { locale: ptBR })}
                  </p>
                )}

                {alert.action && (
                  <Button
                    variant="link"
                    size="sm"
                    className={`mt-2 p-0 h-auto ${colors.text}`}
                    onClick={alert.action.onClick}
                    asChild={!!alert.action.href}
                  >
                    {alert.action.href ? (
                      <Link href={alert.action.href}>
                        {alert.action.label}
                        <ArrowRight className="ml-1 h-3 w-3" />
                      </Link>
                    ) : (
                      <>
                        {alert.action.label}
                        <ArrowRight className="ml-1 h-3 w-3" />
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          );
        })}

        {remainingCount > 0 && (
          <Button variant="ghost" className="w-full" size="sm">
            Ver mais {remainingCount} {remainingCount === 1 ? 'alerta' : 'alertas'}
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

// Uso:
const financialAlerts: FinancialAlert[] = [
  {
    id: '1',
    type: 'overdue',
    severity: 'critical',
    title: 'Faturas Vencidas',
    description: 'Você tem faturas em atraso que precisam de atenção imediata',
    value: 12450.50,
    count: 5,
    action: {
      label: 'Ver faturas vencidas',
      href: '/admin/financeiro/contas-a-pagar?filter=overdue'
    }
  },
  {
    id: '2',
    type: 'due-soon',
    severity: 'warning',
    title: 'Vencimentos Próximos',
    description: '3 faturas vencem nos próximos 3 dias',
    value: 8200.00,
    count: 3,
    dueDate: addDays(new Date(), 2),
    action: {
      label: 'Agendar pagamentos',
      onClick: () => console.log('Agendar')
    }
  },
  {
    id: '3',
    type: 'low-balance',
    severity: 'critical',
    title: 'Saldo Baixo',
    description: 'Saldo em caixa abaixo do limite mínimo recomendado',
    value: 3250.00,
    action: {
      label: 'Ver opções de crédito',
      href: '/admin/financeiro/credito'
    }
  },
  {
    id: '4',
    type: 'high-expenses',
    severity: 'warning',
    title: 'Despesas Elevadas',
    description: 'Despesas do mês 35% acima da média dos últimos 6 meses',
    value: 45200.00,
    action: {
      label: 'Analisar despesas',
      href: '/admin/financeiro/relatorios/despesas'
    }
  }
];

<FinancialAlertsCard alerts={financialAlerts} maxDisplay={5} />
```

### 4.2 Sistema de Notificações

```tsx
// lib/financial-alerts-engine.ts
import { Invoice } from '@/types';

interface AlertRule {
  id: string;
  name: string;
  condition: (data: FinancialData) => boolean;
  severity: AlertSeverity;
  createAlert: (data: FinancialData) => FinancialAlert;
}

export class FinancialAlertsEngine {
  private rules: AlertRule[] = [
    // Regra 1: Faturas Vencidas
    {
      id: 'overdue-invoices',
      name: 'Faturas Vencidas',
      condition: (data) => {
        const overdue = data.invoices.filter(
          inv => inv.status === 'pending' && isPast(new Date(inv.due_date))
        );
        return overdue.length > 0;
      },
      severity: 'critical',
      createAlert: (data) => {
        const overdueInvoices = data.invoices.filter(
          inv => inv.status === 'pending' && isPast(new Date(inv.due_date))
        );
        const totalValue = overdueInvoices.reduce((sum, inv) => sum + inv.amount, 0);

        return {
          id: 'alert-overdue',
          type: 'overdue',
          severity: 'critical',
          title: 'Faturas Vencidas',
          description: `Você tem ${overdueInvoices.length} fatura(s) em atraso`,
          value: totalValue,
          count: overdueInvoices.length,
          action: {
            label: 'Ver faturas vencidas',
            href: '/admin/financeiro/contas-a-pagar?filter=overdue'
          }
        };
      }
    },

    // Regra 2: Vencimentos Próximos (3 dias)
    {
      id: 'due-soon',
      name: 'Vencimentos Próximos',
      condition: (data) => {
        const soon = data.invoices.filter(inv => {
          if (inv.status !== 'pending') return false;
          const dueDate = new Date(inv.due_date);
          const daysUntilDue = differenceInDays(dueDate, new Date());
          return daysUntilDue >= 0 && daysUntilDue <= 3;
        });
        return soon.length > 0;
      },
      severity: 'warning',
      createAlert: (data) => {
        const soonInvoices = data.invoices.filter(inv => {
          if (inv.status !== 'pending') return false;
          const dueDate = new Date(inv.due_date);
          const daysUntilDue = differenceInDays(dueDate, new Date());
          return daysUntilDue >= 0 && daysUntilDue <= 3;
        });
        const totalValue = soonInvoices.reduce((sum, inv) => sum + inv.amount, 0);
        const nearestDue = soonInvoices.sort(
          (a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
        )[0];

        return {
          id: 'alert-due-soon',
          type: 'due-soon',
          severity: 'warning',
          title: 'Vencimentos Próximos',
          description: `${soonInvoices.length} fatura(s) vencem nos próximos 3 dias`,
          value: totalValue,
          count: soonInvoices.length,
          dueDate: new Date(nearestDue.due_date),
          action: {
            label: 'Agendar pagamentos',
            href: '/admin/financeiro/contas-a-pagar?filter=due-soon'
          }
        };
      }
    },

    // Regra 3: Saldo Baixo (< R$ 5.000)
    {
      id: 'low-balance',
      name: 'Saldo Baixo',
      condition: (data) => {
        return data.currentBalance < 5000;
      },
      severity: 'critical',
      createAlert: (data) => ({
        id: 'alert-low-balance',
        type: 'low-balance',
        severity: 'critical',
        title: 'Saldo Baixo',
        description: 'Saldo em caixa abaixo do limite mínimo recomendado (R$ 5.000)',
        value: data.currentBalance,
        action: {
          label: 'Ver fluxo de caixa',
          href: '/admin/financeiro/fluxo-caixa'
        }
      })
    },

    // Regra 4: Fluxo Negativo Projetado
    {
      id: 'negative-cash-flow',
      name: 'Fluxo de Caixa Negativo',
      condition: (data) => {
        // Verifica se o fluxo ficará negativo nos próximos 14 dias
        const next14Days = data.cashFlowProjection.filter(
          day => differenceInDays(new Date(day.date), new Date()) <= 14
        );
        return next14Days.some(day => day.balance < 0);
      },
      severity: 'warning',
      createAlert: (data) => {
        const negativeDays = data.cashFlowProjection.filter(day => day.balance < 0);
        const firstNegativeDay = negativeDays[0];

        return {
          id: 'alert-negative-flow',
          type: 'low-balance',
          severity: 'warning',
          title: 'Fluxo de Caixa Negativo Projetado',
          description: `Seu saldo ficará negativo em ${differenceInDays(new Date(firstNegativeDay.date), new Date())} dias`,
          value: firstNegativeDay.balance,
          dueDate: new Date(firstNegativeDay.date),
          action: {
            label: 'Ver projeção',
            href: '/admin/financeiro/fluxo-caixa'
          }
        };
      }
    },

    // Regra 5: Despesas Elevadas
    {
      id: 'high-expenses',
      name: 'Despesas Elevadas',
      condition: (data) => {
        const currentMonthExpenses = data.currentMonthExpenses;
        const avgLast6Months = data.last6MonthsAvgExpenses;

        // Alerta se despesas > 30% acima da média
        return currentMonthExpenses > avgLast6Months * 1.3;
      },
      severity: 'warning',
      createAlert: (data) => {
        const currentMonthExpenses = data.currentMonthExpenses;
        const avgLast6Months = data.last6MonthsAvgExpenses;
        const percentageIncrease = ((currentMonthExpenses - avgLast6Months) / avgLast6Months) * 100;

        return {
          id: 'alert-high-expenses',
          type: 'high-expenses',
          severity: 'warning',
          title: 'Despesas Elevadas',
          description: `Despesas do mês ${percentageIncrease.toFixed(0)}% acima da média dos últimos 6 meses`,
          value: currentMonthExpenses,
          action: {
            label: 'Analisar despesas',
            href: '/admin/financeiro/relatorios/despesas'
          }
        };
      }
    },

    // Regra 6: Recebimentos Atrasados
    {
      id: 'late-receivables',
      name: 'Recebimentos Atrasados',
      condition: (data) => {
        const lateReceivables = data.receivables.filter(
          rec => rec.status === 'pending' && isPast(new Date(rec.due_date))
        );
        return lateReceivables.length > 0;
      },
      severity: 'warning',
      createAlert: (data) => {
        const lateReceivables = data.receivables.filter(
          rec => rec.status === 'pending' && isPast(new Date(rec.due_date))
        );
        const totalValue = lateReceivables.reduce((sum, rec) => sum + rec.amount, 0);

        return {
          id: 'alert-late-receivables',
          type: 'late-payment',
          severity: 'warning',
          title: 'Recebimentos Atrasados',
          description: `${lateReceivables.length} cliente(s) com pagamentos em atraso`,
          value: totalValue,
          count: lateReceivables.length,
          action: {
            label: 'Enviar cobranças',
            href: '/admin/financeiro/contas-a-receber?filter=overdue'
          }
        };
      }
    }
  ];

  generateAlerts(data: FinancialData): FinancialAlert[] {
    const alerts: FinancialAlert[] = [];

    for (const rule of this.rules) {
      if (rule.condition(data)) {
        alerts.push(rule.createAlert(data));
      }
    }

    return alerts;
  }
}

// Uso no dashboard:
const alertsEngine = new FinancialAlertsEngine();
const alerts = alertsEngine.generateAlerts({
  invoices,
  receivables,
  currentBalance,
  cashFlowProjection,
  currentMonthExpenses,
  last6MonthsAvgExpenses
});
```

### 4.3 Notificações por E-mail e Push

```tsx
// lib/notification-service.ts
interface NotificationConfig {
  email: boolean;
  push: boolean;
  frequency: 'realtime' | 'daily' | 'weekly';
  alertTypes: AlertType[];
}

export class FinancialNotificationService {
  async sendAlertNotification(
    alert: FinancialAlert,
    config: NotificationConfig
  ): Promise<void> {
    // E-mail notification
    if (config.email && config.alertTypes.includes(alert.type)) {
      await this.sendEmailNotification(alert);
    }

    // Push notification
    if (config.push && alert.severity === 'critical') {
      await this.sendPushNotification(alert);
    }
  }

  private async sendEmailNotification(alert: FinancialAlert): Promise<void> {
    // Implementação de envio de e-mail
    const template = this.getEmailTemplate(alert);

    // Usar serviço de e-mail (ex: SendGrid, AWS SES)
    await emailService.send({
      to: user.email,
      subject: `[Orion ERP] ${alert.title}`,
      html: template
    });
  }

  private async sendPushNotification(alert: FinancialAlert): Promise<void> {
    // Implementação de push notification (ex: Firebase Cloud Messaging)
    await fcm.send({
      title: alert.title,
      body: alert.description,
      data: {
        type: 'financial-alert',
        alertId: alert.id,
        href: alert.action?.href
      }
    });
  }

  private getEmailTemplate(alert: FinancialAlert): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; }
            .alert-card {
              border: 2px solid ${alert.severity === 'critical' ? '#DC2626' : '#F59E0B'};
              padding: 20px;
              border-radius: 8px;
              background: ${alert.severity === 'critical' ? '#FEE2E2' : '#FEF3C7'};
            }
            .alert-title {
              font-size: 20px;
              font-weight: bold;
              color: ${alert.severity === 'critical' ? '#DC2626' : '#D97706'};
            }
            .alert-value {
              font-size: 24px;
              font-weight: bold;
              margin: 10px 0;
            }
            .cta-button {
              display: inline-block;
              padding: 12px 24px;
              background: ${alert.severity === 'critical' ? '#DC2626' : '#D97706'};
              color: white;
              text-decoration: none;
              border-radius: 6px;
              margin-top: 15px;
            }
          </style>
        </head>
        <body>
          <div class="alert-card">
            <div class="alert-title">${alert.title}</div>
            <p>${alert.description}</p>
            ${alert.value ? `<div class="alert-value">${formatCurrency(alert.value)}</div>` : ''}
            ${alert.action?.href ? `
              <a href="${process.env.NEXT_PUBLIC_APP_URL}${alert.action.href}" class="cta-button">
                ${alert.action.label}
              </a>
            ` : ''}
          </div>
        </body>
      </html>
    `;
  }
}
```

**Estimativa:** 5-6 dias úteis
**Impacto:** CRÍTICO - Alertas proativos previnem problemas financeiros

---

## 📱 Fase 5: Responsividade Financeira (Prioridade: MÉDIA)

### Status: ⏳ Planejado

### Objetivo
Dashboard financeiro otimizado para mobile e tablet.

### 5.1 Layout Adaptativo por Dispositivo

**Desktop (>1280px):**
```
┌────────────────────────────────────────────────┐
│ Alertas Críticos (se houver)                   │
├────────────────────────────────────────────────┤
│ Saldo (2col) │ A Pagar │ A Receber │ Resultado │
├────────────────────────────────────────────────┤
│ Fluxo de Caixa (12 semanas) - full width      │
├────────────────────────────────────────────────┤
│ Aging A Receber │ Aging A Pagar               │
├────────────────────────────────────────────────┤
│ DRE  │ Top Despesas │ Vencimentos             │
└────────────────────────────────────────────────┘
```

**Tablet (768px - 1279px):**
```
┌─────────────────────────┐
│ Alertas                 │
├─────────────────────────┤
│ Saldo (2col)│ A Pagar   │
│ A Receber   │ Resultado │
├─────────────────────────┤
│ Fluxo de Caixa          │
├─────────────────────────┤
│ Aging A Receber         │
│ Aging A Pagar           │
├─────────────────────────┤
│ DRE (full)              │
│ Top Despesas (full)     │
└─────────────────────────┘
```

**Mobile (<768px):**
```
┌──────────────┐
│ Alertas      │
├──────────────┤
│ Saldo (full) │
│ A Pagar      │
│ A Receber    │
│ Resultado    │
├──────────────┤
│ Fluxo Caixa  │
│ (scroll hor) │
├──────────────┤
│ Aging A Rec. │
│ Aging A Pag. │
├──────────────┤
│ DRE          │
│ Top Despesas │
└──────────────┘
```

### 5.2 Swipe Horizontal para Gráficos (Mobile)

```tsx
import { useSwipeable } from 'react-swipeable';

const MobileFinancialCharts = ({ charts }) => {
  const [currentChart, setCurrentChart] = useState(0);

  const handlers = useSwipeable({
    onSwipedLeft: () => setCurrentChart(prev => Math.min(prev + 1, charts.length - 1)),
    onSwipedRight: () => setCurrentChart(prev => Math.max(prev - 1, 0)),
    trackMouse: true
  });

  return (
    <div {...handlers} className="relative">
      <div className="flex overflow-hidden">
        {charts.map((Chart, index) => (
          <div
            key={index}
            className="w-full flex-shrink-0 transition-transform duration-300"
            style={{ transform: `translateX(-${currentChart * 100}%)` }}
          >
            <Chart />
          </div>
        ))}
      </div>

      {/* Indicadores de página */}
      <div className="flex justify-center gap-2 mt-4">
        {charts.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentChart(index)}
            className={`h-2 rounded-full transition-all ${
              index === currentChart ? 'w-8 bg-primary' : 'w-2 bg-muted'
            }`}
            aria-label={`Ir para gráfico ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
};
```

### 5.3 Bottom Sheet para Quick Actions (Mobile)

```tsx
// components/ui/bottom-sheet.tsx
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';

const MobileQuickActions = () => {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button className="fixed bottom-6 right-6 rounded-full w-14 h-14 shadow-lg">
          <Plus className="h-6 w-6" />
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="h-[80vh]">
        <SheetHeader>
          <SheetTitle>Ações Rápidas</SheetTitle>
        </SheetHeader>
        <div className="grid grid-cols-2 gap-4 mt-6">
          <Button variant="outline" className="h-24 flex-col gap-2">
            <TrendingDown className="h-6 w-6" />
            Nova Despesa
          </Button>
          <Button variant="outline" className="h-24 flex-col gap-2">
            <TrendingUp className="h-6 w-6" />
            Nova Receita
          </Button>
          <Button variant="outline" className="h-24 flex-col gap-2">
            <CreditCard className="h-6 w-6" />
            Agendar Pagamento
          </Button>
          <Button variant="outline" className="h-24 flex-col gap-2">
            <FileText className="h-6 w-6" />
            Ver Relatórios
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};
```

**Estimativa:** 4-5 dias úteis
**Impacto:** MÉDIO - Mobile é essencial para gestores em movimento

---

## ⚡ Fase 6: Performance e Otimizações (Prioridade: BAIXA)

### Status: ⏳ Planejado

### Objetivo
Dashboard financeiro ultra-rápido com caching inteligente.

### 6.1 Skeleton Loaders Financeiros

```tsx
// components/financeiro/FinancialDashboardSkeleton.tsx
const FinancialDashboardSkeleton = () => (
  <div className="space-y-6 p-6 animate-pulse">
    {/* Alertas Skeleton */}
    <Card className="border-red-500/20">
      <CardContent className="pt-6">
        <div className="space-y-3">
          {[1, 2].map(i => (
            <div key={i} className="flex gap-3 p-4 bg-muted/50 rounded-lg">
              <Skeleton className="h-5 w-5 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-full" />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>

    {/* KPI Cards Skeleton */}
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      <Card className="md:col-span-2">
        <CardContent className="pt-6 space-y-3">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-12 w-48" />
          <Skeleton className="h-16 w-full" />
        </CardContent>
      </Card>
      {[1, 2].map(i => (
        <Card key={i}>
          <CardContent className="pt-6 space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-8 w-full" />
          </CardContent>
        </Card>
      ))}
    </div>

    {/* Chart Skeleton */}
    <Card>
      <CardContent className="pt-6">
        <Skeleton className="h-[350px] w-full" />
      </CardContent>
    </Card>
  </div>
);
```

### 6.2 Cache de Dados Financeiros

```tsx
// lib/financial-cache.ts
import { unstable_cache } from 'next/cache';

export const getCachedFinancialSummary = unstable_cache(
  async (workspaceId: string, dateRange: DateRange) => {
    return await fetchFinancialSummary(workspaceId, dateRange);
  },
  ['financial-summary'],
  {
    revalidate: 300, // 5 minutos
    tags: ['financial']
  }
);

export const getCachedCashFlowProjection = unstable_cache(
  async (workspaceId: string) => {
    return await calculateCashFlowProjection(workspaceId);
  },
  ['cash-flow-projection'],
  {
    revalidate: 3600, // 1 hora
    tags: ['financial', 'cash-flow']
  }
);

// Invalidar cache quando dados financeiros mudam
export async function invalidateFinancialCache(workspaceId: string) {
  revalidateTag('financial');
}
```

### 6.3 Lazy Loading de Gráficos

```tsx
import dynamic from 'next/dynamic';

// Lazy load de gráficos pesados
const CashFlowChart = dynamic(
  () => import('@/components/financeiro/CashFlowChart'),
  {
    loading: () => <Skeleton className="h-[350px] w-full" />,
    ssr: false
  }
);

const AgingChart = dynamic(
  () => import('@/components/financeiro/AgingChart'),
  {
    loading: () => <Skeleton className="h-[300px] w-full" />,
    ssr: false
  }
);
```

### 6.4 Virtualized Lists (Tabelas Longas)

```tsx
import { useVirtualizer } from '@tanstack/react-virtual';

const VirtualizedInvoiceList = ({ invoices }) => {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: invoices.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 72, // Altura estimada de cada linha
    overscan: 5
  });

  return (
    <div ref={parentRef} className="h-96 overflow-auto">
      <div style={{ height: `${virtualizer.getTotalSize()}px`, position: 'relative' }}>
        {virtualizer.getVirtualItems().map(virtualRow => (
          <div
            key={virtualRow.key}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: `${virtualRow.size}px`,
              transform: `translateY(${virtualRow.start}px)`,
            }}
          >
            <InvoiceRow invoice={invoices[virtualRow.index]} />
          </div>
        ))}
      </div>
    </div>
  );
};
```

**Estimativa:** 3-4 dias úteis
**Impacto:** BAIXO-MÉDIO - Polish final, dados financeiros geralmente são pequenos

---

## 🤖 Fase 7: AI e Insights Financeiros (Prioridade: MÉDIA)

### Status: 📋 Backlog

### Objetivo
Inteligência artificial para análise preditiva e recomendações financeiras.

### 7.1 Previsão de Fluxo de Caixa com ML

```tsx
// lib/cash-flow-predictor.ts
interface CashFlowPrediction {
  date: Date;
  predictedBalance: number;
  confidence: number;
  lowerBound: number;
  upperBound: number;
}

export class CashFlowPredictor {
  async predictNext90Days(
    historicalData: FinancialData[]
  ): Promise<CashFlowPrediction[]> {
    // Usar modelo de séries temporais (ARIMA, Prophet, ou LSTM)
    // Por enquanto, implementação simplificada com média móvel

    const predictions: CashFlowPrediction[] = [];
    const last90Days = historicalData.slice(-90);

    // Calcular tendência
    const avgDailyChange = this.calculateAverageDailyChange(last90Days);
    const seasonality = this.detectSeasonality(last90Days);

    let currentBalance = last90Days[last90Days.length - 1].balance;

    for (let i = 1; i <= 90; i++) {
      const date = addDays(new Date(), i);
      const seasonalFactor = seasonality[date.getDay()];

      const predicted = currentBalance + (avgDailyChange * seasonalFactor);
      const stdDev = this.calculateStdDev(last90Days);

      predictions.push({
        date,
        predictedBalance: predicted,
        confidence: this.calculateConfidence(i, stdDev),
        lowerBound: predicted - (stdDev * 1.96),
        upperBound: predicted + (stdDev * 1.96)
      });

      currentBalance = predicted;
    }

    return predictions;
  }

  private calculateAverageDailyChange(data: FinancialData[]): number {
    const changes = data.slice(1).map((day, i) => day.balance - data[i].balance);
    return changes.reduce((sum, change) => sum + change, 0) / changes.length;
  }

  private detectSeasonality(data: FinancialData[]): Record<number, number> {
    // Detectar padrões semanais (0 = domingo, 6 = sábado)
    const byDayOfWeek: Record<number, number[]> = {};

    data.forEach(day => {
      const dayOfWeek = new Date(day.date).getDay();
      if (!byDayOfWeek[dayOfWeek]) byDayOfWeek[dayOfWeek] = [];
      byDayOfWeek[dayOfWeek].push(day.balance);
    });

    const seasonality: Record<number, number> = {};
    Object.keys(byDayOfWeek).forEach(day => {
      const avg = byDayOfWeek[day].reduce((a, b) => a + b, 0) / byDayOfWeek[day].length;
      seasonality[day] = avg / data.reduce((sum, d) => sum + d.balance, 0) * data.length;
    });

    return seasonality;
  }

  private calculateConfidence(daysAhead: number, stdDev: number): number {
    // Confiança decresce com a distância
    const baseConfidence = 0.95;
    const decayFactor = 0.01;
    return Math.max(0.5, baseConfidence - (daysAhead * decayFactor));
  }
}
```

### 7.2 Recomendações Financeiras Automáticas

```tsx
// components/financeiro/FinancialInsightsCard.tsx
interface FinancialInsight {
  id: string;
  type: 'optimization' | 'risk' | 'opportunity';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  estimatedSavings?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

const FinancialInsightsCard = ({ insights }: { insights: FinancialInsight[] }) => {
  return (
    <Card className="border-blue-500/20 bg-gradient-to-r from-blue-500/5 to-purple-500/5">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-blue-500" />
          <CardTitle>Insights Financeiros por IA</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {insights.map(insight => (
          <div
            key={insight.id}
            className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg hover:bg-muted/70 transition"
          >
            <div className="text-blue-500">
              {insight.type === 'optimization' && <TrendingUp className="h-5 w-5" />}
              {insight.type === 'risk' && <AlertTriangle className="h-5 w-5" />}
              {insight.type === 'opportunity' && <Lightbulb className="h-5 w-5" />}
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold">{insight.title}</p>
              <p className="text-xs text-muted-foreground mt-1">{insight.description}</p>

              {insight.estimatedSavings && (
                <p className="text-sm font-bold text-green-600 mt-2">
                  Economia estimada: {formatCurrency(insight.estimatedSavings)}
                </p>
              )}

              {insight.action && (
                <Button variant="link" size="sm" className="mt-2 p-0 h-auto text-blue-600">
                  {insight.action.label}
                  <ArrowRight className="ml-1 h-3 w-3" />
                </Button>
              )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

// Gerador de insights
export class FinancialInsightsGenerator {
  generateInsights(data: FinancialData): FinancialInsight[] {
    const insights: FinancialInsight[] = [];

    // Insight 1: Renegociação de fornecedores
    const topSuppliers = this.getTopSuppliers(data.expenses);
    if (topSuppliers.length > 0 && topSuppliers[0].totalSpent > 10000) {
      insights.push({
        id: 'negotiate-suppliers',
        type: 'optimization',
        title: 'Oportunidade de Renegociação',
        description: `Você gasta R$ ${formatCurrency(topSuppliers[0].totalSpent)} mensalmente com ${topSuppliers[0].name}. Renegociar pode gerar economias.`,
        impact: 'high',
        estimatedSavings: topSuppliers[0].totalSpent * 0.1, // 10% de economia estimada
        action: {
          label: 'Ver detalhes do fornecedor',
          onClick: () => console.log('Navigate to supplier')
        }
      });
    }

    // Insight 2: Pagamentos antecipados
    const upcomingPayments = this.getUpcomingPayments(data.payables, 30);
    if (upcomingPayments.length > 3) {
      const potentialSavings = upcomingPayments.reduce((sum, p) => sum + (p.amount * 0.02), 0);
      insights.push({
        id: 'early-payment',
        type: 'opportunity',
        title: 'Desconto por Pagamento Antecipado',
        description: `${upcomingPayments.length} faturas elegíveis para desconto de 2% se pagas com antecedência`,
        impact: 'medium',
        estimatedSavings: potentialSavings,
        action: {
          label: 'Ver faturas',
          onClick: () => console.log('Show eligible invoices')
        }
      });
    }

    // Insight 3: Cobrança agressiva
    const overdueReceivables = data.receivables.filter(r =>
      r.status === 'pending' && differenceInDays(new Date(), new Date(r.due_date)) > 60
    );
    if (overdueReceivables.length > 0) {
      const totalOverdue = overdueReceivables.reduce((sum, r) => sum + r.amount, 0);
      insights.push({
        id: 'collection-strategy',
        type: 'risk',
        title: 'Recebíveis Críticos',
        description: `${overdueReceivables.length} cliente(s) com atraso > 60 dias. Considere ação legal ou cobrança terceirizada.`,
        impact: 'high',
        estimatedSavings: totalOverdue * 0.7, // Recuperação estimada de 70%
        action: {
          label: 'Ver estratégias de cobrança',
          onClick: () => console.log('Collection strategies')
        }
      });
    }

    // Insight 4: Otimização de impostos
    if (data.monthlyRevenue > 50000) {
      insights.push({
        id: 'tax-optimization',
        type: 'optimization',
        title: 'Revisão Tributária Recomendada',
        description: 'Seu faturamento pode se beneficiar de um planejamento tributário. Consulte um contador.',
        impact: 'high',
        estimatedSavings: data.monthlyRevenue * 0.05,
        action: {
          label: 'Agendar consultoria',
          onClick: () => console.log('Schedule tax consultation')
        }
      });
    }

    // Insight 5: Cash pooling
    const idleCash = data.currentBalance - data.minimumBalance;
    if (idleCash > 20000) {
      const monthlyYield = idleCash * 0.01; // 1% ao mês estimado
      insights.push({
        id: 'invest-idle-cash',
        type: 'opportunity',
        title: 'Dinheiro Parado',
        description: `Você tem R$ ${formatCurrency(idleCash)} acima do saldo mínimo. Invista em liquidez diária.`,
        impact: 'medium',
        estimatedSavings: monthlyYield,
        action: {
          label: 'Ver opções de investimento',
          onClick: () => console.log('Investment options')
        }
      });
    }

    return insights;
  }
}
```

### 7.3 Anomaly Detection (Detecção de Anomalias)

```tsx
// lib/anomaly-detector.ts
export class FinancialAnomalyDetector {
  detectAnomalies(data: FinancialData[]): Anomaly[] {
    const anomalies: Anomaly[] = [];

    // 1. Detectar picos de despesas
    const expenseAnomaly = this.detectExpenseSpikes(data);
    if (expenseAnomaly) anomalies.push(expenseAnomaly);

    // 2. Detectar quedas de receita
    const revenueAnomaly = this.detectRevenueDrop(data);
    if (revenueAnomaly) anomalies.push(revenueAnomaly);

    // 3. Detectar transações duplicadas
    const duplicates = this.detectDuplicateTransactions(data);
    if (duplicates.length > 0) anomalies.push(...duplicates);

    // 4. Detectar desvio de padrão sazonal
    const seasonalAnomaly = this.detectSeasonalDeviation(data);
    if (seasonalAnomaly) anomalies.push(seasonalAnomaly);

    return anomalies;
  }

  private detectExpenseSpikes(data: FinancialData[]): Anomaly | null {
    const recentExpenses = data.slice(-30).map(d => d.expenses);
    const avg = recentExpenses.reduce((sum, e) => sum + e, 0) / recentExpenses.length;
    const stdDev = Math.sqrt(
      recentExpenses.reduce((sum, e) => sum + Math.pow(e - avg, 2), 0) / recentExpenses.length
    );

    const today = data[data.length - 1];
    const zScore = (today.expenses - avg) / stdDev;

    if (zScore > 2.5) { // 2.5 desvios padrão
      return {
        type: 'expense-spike',
        severity: 'warning',
        title: 'Pico de Despesas Detectado',
        description: `Despesas de hoje (${formatCurrency(today.expenses)}) estão ${((zScore - 1) * 100).toFixed(0)}% acima do padrão`,
        deviation: zScore
      };
    }

    return null;
  }

  private detectDuplicateTransactions(data: FinancialData[]): Anomaly[] {
    const anomalies: Anomaly[] = [];
    const transactions = data.flatMap(d => d.transactions);

    // Agrupar por valor, fornecedor e data próxima (±1 dia)
    const groups = new Map<string, Transaction[]>();

    transactions.forEach(t => {
      const key = `${t.amount}-${t.vendor}`;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(t);
    });

    groups.forEach((group, key) => {
      if (group.length > 1) {
        // Verificar se as datas são próximas
        const sortedByDate = group.sort((a, b) =>
          new Date(a.date).getTime() - new Date(b.date).getTime()
        );

        for (let i = 1; i < sortedByDate.length; i++) {
          const daysDiff = differenceInDays(
            new Date(sortedByDate[i].date),
            new Date(sortedByDate[i-1].date)
          );

          if (daysDiff <= 1) {
            anomalies.push({
              type: 'duplicate-transaction',
              severity: 'warning',
              title: 'Possível Transação Duplicada',
              description: `2 transações de ${formatCurrency(sortedByDate[i].amount)} para ${sortedByDate[i].vendor} em datas próximas`,
              transactions: [sortedByDate[i-1], sortedByDate[i]]
            });
          }
        }
      }
    });

    return anomalies;
  }
}
```

**Estimativa:** 2-3 semanas
**Impacto:** MÉDIO - Diferencial competitivo, mas não crítico inicialmente

---

## 📊 Matriz de Priorização

| Fase | Nome | Prioridade | Complexidade | Impacto | Estimativa | Status |
|------|------|-----------|--------------|---------|------------|--------|
| **1** | KPI Cards Aprimorados | ⭐⭐⭐⭐⭐ | Baixa | ALTO | 3-4 dias | ⏳ Planejado |
| **2** | Visualizações Avançadas | ⭐⭐⭐⭐⭐ | Média-Alta | ALTO | 5-6 dias | ⏳ Planejado |
| **3** | Filtros e Período | ⭐⭐⭐⭐ | Média | MÉDIO-ALTO | 4-5 dias | ⏳ Planejado |
| **4** | Alertas Financeiros | ⭐⭐⭐⭐⭐ | Média | CRÍTICO | 5-6 dias | ⏳ Planejado |
| **5** | Responsividade | ⭐⭐⭐ | Baixa-Média | MÉDIO | 4-5 dias | ⏳ Planejado |
| **6** | Performance | ⭐⭐ | Baixa | BAIXO-MÉDIO | 3-4 dias | 📋 Backlog |
| **7** | AI e Insights | ⭐⭐⭐ | Alta | MÉDIO | 2-3 semanas | 📋 Backlog |

---

## 🛠️ Stack Tecnológico

### Bibliotecas Necessárias

```json
{
  "dependencies": {
    // Gráficos
    "recharts": "^2.10.0",

    // Animações
    "framer-motion": "^11.0.0",

    // Date Handling
    "date-fns": "^3.0.0",

    // Swipe (mobile)
    "react-swipeable": "^7.0.0",

    // Virtual Scrolling
    "@tanstack/react-virtual": "^3.0.0",

    // Machine Learning (opcional - Fase 7)
    "regression": "^2.0.1",
    "simple-statistics": "^7.8.0"
  }
}
```

### Componentes Próprios a Criar

```
/components/financeiro/
├── FinancialKPICard.tsx          # Card de KPI com sparkline e ações
├── FinancialSparkline.tsx        # Mini gráfico financeiro
├── CashFlowChart.tsx             # Gráfico de fluxo de caixa 12 semanas
├── AgingChart.tsx                # Aging report visual (recebíveis/pagáveis)
├── DREWaterfallChart.tsx         # DRE em cascata (waterfall)
├── ExpensesByCategoryChart.tsx   # Pizza de despesas
├── FinancialPeriodPicker.tsx     # Seletor de período financeiro
├── FinancialFilters.tsx          # Filtros (categoria, status, fornecedor)
├── PeriodComparisonToggle.tsx    # Toggle de comparação temporal
├── FinancialAlertsCard.tsx       # Card de alertas críticos
├── FinancialInsightsCard.tsx     # Insights de IA
├── FinancialDashboardSkeleton.tsx# Skeleton loader
└── charts/
    ├── MobileFinancialCharts.tsx # Swipe horizontal mobile
    └── VirtualizedInvoiceList.tsx# Lista virtualizada

/lib/
├── financial-alerts-engine.ts    # Engine de alertas
├── financial-cache.ts            # Sistema de cache
├── cash-flow-predictor.ts        # Predição ML
├── financial-insights-generator.ts # Gerador de insights
├── anomaly-detector.ts           # Detecção de anomalias
└── notification-service.ts       # Serviço de notificações
```

---

## 📅 Cronograma Sugerido

### Sprint 1 (1 semana): Foundation
- ✅ Pesquisa de UX/UI financeiro
- ✅ Criação do roadmap
- ⏳ Análise do dashboard atual
- ⏳ Design System financeiro (cores, ícones)

### Sprint 2 (1 semana): KPIs e Contexto
- ⏳ FinancialSparkline component
- ⏳ Comparações temporais em KPIs
- ⏳ Layout hierárquico (card primário)
- ⏳ Quick actions nos cards

### Sprint 3 (1.5 semanas): Visualizações Core
- ⏳ CashFlowChart (12 semanas)
- ⏳ AgingChart (recebíveis + pagáveis)
- ⏳ DREWaterfallChart
- ⏳ ExpensesByCategoryChart

### Sprint 4 (1 semana): Filtros
- ⏳ FinancialPeriodPicker
- ⏳ FinancialFilters (categoria, status, fornecedor)
- ⏳ PeriodComparisonToggle
- ⏳ Integração com backend

### Sprint 5 (1.5 semanas): Alertas
- ⏳ FinancialAlertsCard
- ⏳ FinancialAlertsEngine (6 regras)
- ⏳ Sistema de notificações
- ⏳ E-mail templates

### Sprint 6 (1 semana): Responsividade
- ⏳ Layout adaptativo
- ⏳ Swipe horizontal (mobile)
- ⏳ Bottom sheet quick actions
- ⏳ Touch optimizations

### Backlog (Futuro):
- Performance optimizations
- AI insights
- Cash flow prediction
- Anomaly detection

---

## ✅ Checklist de Implementação

### Fase 1: KPI Cards
- [ ] Criar FinancialSparkline component
- [ ] Adicionar comparações temporais (vs. mês anterior, vs. ano anterior)
- [ ] Implementar layout hierárquico (1 card grande + 3 médios)
- [ ] Adicionar quick actions nos cards (hover)
- [ ] Fetch de dados históricos para sparklines
- [ ] Calcular percentuais de mudança
- [ ] Testes de usabilidade

### Fase 2: Visualizações
- [ ] Instalar Recharts (já instalado)
- [ ] Criar CashFlowChart component
- [ ] Criar AgingChart component (recebíveis e pagáveis)
- [ ] Criar DREWaterfallChart component
- [ ] Criar ExpensesByCategoryChart component
- [ ] Preparar dados para cada gráfico
- [ ] Tooltips customizados dark mode
- [ ] Responsividade dos gráficos
- [ ] Testes visuais

### Fase 3: Filtros
- [ ] FinancialPeriodPicker component
- [ ] FinancialFilters component (categoria, status, fornecedor)
- [ ] PeriodComparisonToggle component
- [ ] Integrar filtros com fetch de dados
- [ ] Salvar preferências no localStorage
- [ ] Loading states durante filtragem

### Fase 4: Alertas
- [ ] FinancialAlertsCard component
- [ ] FinancialAlertsEngine class (6 regras)
- [ ] NotificationService class
- [ ] E-mail templates
- [ ] Push notifications (opcional)
- [ ] Configuração de preferências de notificação
- [ ] Testes de regras de alerta

### Fase 5: Responsividade
- [ ] Layout breakpoints (mobile, tablet, desktop)
- [ ] MobileFinancialCharts com swipe
- [ ] Bottom sheet quick actions
- [ ] Touch optimizations
- [ ] Testes em dispositivos reais

### Fase 6: Performance (Backlog)
- [ ] FinancialDashboardSkeleton component
- [ ] Cache de dados financeiros
- [ ] Lazy loading de gráficos
- [ ] Virtual scrolling para listas

### Fase 7: AI (Backlog)
- [ ] CashFlowPredictor class
- [ ] FinancialInsightsGenerator class
- [ ] AnomalyDetector class
- [ ] FinancialInsightsCard component
- [ ] Treinar modelos de ML
- [ ] Testes de acurácia

---

## 🎨 Design Tokens Financeiro

```typescript
// tailwind.config.js - Extensão para Dashboard Financeiro
export const financialTokens = {
  colors: {
    financial: {
      positive: '#10B981',
      negative: '#EF4444',
      warning: '#F59E0B',
      neutral: '#6B7280',

      status: {
        paid: '#059669',
        pending: '#D97706',
        overdue: '#DC2626',
        scheduled: '#3B82F6'
      },

      aging: {
        current: '#10B981',
        warning: '#F59E0B',
        critical: '#EF4444',
        overdue: '#DC2626'
      },

      expense: {
        fixed: '#8B5CF6',
        variable: '#3B82F6',
        investment: '#06B6D4',
        tax: '#F59E0B'
      }
    }
  },

  fontSize: {
    'kpi-value': '3rem',           // 48px
    'kpi-value-large': '3.5rem',   // 56px (card primário)
    'kpi-label': '0.875rem',       // 14px
    'metric': '1.5rem',            // 24px
    'chart-label': '0.75rem',      // 12px
  },

  spacing: {
    'dashboard-padding': '1.5rem',
    'card-gap': '1.5rem',
  },

  borderRadius: {
    'financial-card': '0.75rem',
  },

  boxShadow: {
    'alert-critical': '0 0 20px rgba(239, 68, 68, 0.3)',
    'alert-warning': '0 0 20px rgba(245, 158, 11, 0.3)',
  }
};
```

---

## 📖 Referências e Inspirações

### Dashboards de Referência
1. **Stripe Dashboard** - Excelente gestão de alertas e fluxo de caixa
2. **QuickBooks Online** - Aging reports e DRE visual
3. **Xero** - KPIs financeiros e comparações temporais
4. **Bench** - Insights automáticos e simplicidade
5. **Wave** - UX limpa para pequenas empresas

### Artigos e Guidelines
- [Financial Dashboard Design Best Practices (UXPin)](https://www.uxpin.com/studio/blog/dashboard-design-principles/)
- [ACES Framework for Financial Dashboards](https://www.aufaitux.com/blog/dashboard-design-best-practices/)
- [Cash Flow Visualization Techniques](https://www.coupler.io/dashboard-examples/cash-flow-dashboard)
- [Aging Report Best Practices (NetSuite)](https://www.netsuite.com/portal/resource/articles/accounting/accounts-receivable-ar-dashboard.shtml)
- [Financial KPI Design (Datapad)](https://datapad.io/blog/dashboard-design)

### Ferramentas de Design
- **Figma** - Prototipagem de dashboards financeiros
- **Colorbox.io** - Paletas para dados financeiros
- **Recharts Gallery** - Exemplos de gráficos
- **Financial Dashboard Templates** - Inspiração visual

---

## 🚀 Próximos Passos

1. **Aprovação do Roadmap** - Validar prioridades e escopo
2. **Setup Inicial** - Verificar dependências (Recharts já instalado)
3. **Design System** - Configurar cores e tokens financeiros no Tailwind
4. **Sprint 1** - Começar com KPI Cards aprimorados
5. **Testes Contínuos** - Validar com usuários reais após cada sprint

---

## 🎯 Indicadores de Sucesso

### Métricas de UX
- **Time to Insight**: < 3 segundos para identificar problema crítico
- **Task Completion Rate**: > 95% para ações principais (agendar pagamento, enviar cobrança)
- **Mobile Usability Score**: > 90 pontos
- **Accessibility Score (WCAG)**: AAA

### Métricas de Performance
- **Initial Load**: < 1.5 segundos
- **Time to Interactive**: < 2 segundos
- **Chart Render Time**: < 300ms
- **Cache Hit Rate**: > 80%

### Métricas de Negócio
- **Adoção do Dashboard**: > 80% dos usuários financeiros
- **Ações por Alerta**: > 60% dos alertas resultam em ação
- **Redução de Faturas Vencidas**: -30% após 3 meses
- **Economia Identificada por IA**: > R$ 10.000/mês (Fase 7)

---

**Última atualização:** 2025-10-28
**Versão:** 1.0
**Próxima revisão:** Após conclusão da Fase 1 (KPI Cards)

---

## 🎯 Meta Final

Transformar o dashboard financeiro do Orion ERP em um **centro de controle estratégico**, onde gestores financeiros:

1. **Identificam problemas críticos em 3 segundos** (alertas vermelhos no topo)
2. **Tomam decisões baseadas em dados visuais** (gráficos de fluxo, aging, DRE)
3. **Agem diretamente do dashboard** (agendar, pagar, cobrar)
4. **Previnem crises de caixa** (projeções e alertas proativos)
5. **Otimizam custos com IA** (insights automáticos de economia)

**Dashboard financeiro não é apenas sobre mostrar números - é sobre gerar CONTROLE e PREVENÇÃO.**
