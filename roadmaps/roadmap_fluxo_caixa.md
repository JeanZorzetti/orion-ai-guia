# Roadmap: Fluxo de Caixa - Melhorias e Funcionalidades Avançadas

## Visão Geral
Este roadmap define as melhorias para transformar o módulo de Fluxo de Caixa em uma solução completa e inteligente para gestão financeira, incorporando previsões, análise preditiva, cenários, alertas proativos e melhores práticas de 2025.

## Estado Atual
**Localização:** `admin/src/app/admin/financeiro/fluxo-caixa/page.tsx`

**Funcionalidades Existentes:**
- Cards de resumo básicos (Saldo Atual, Entradas, Saídas, Saldo do Período)
- Visualização de fluxo semanal com barras horizontais
- Lista de movimentações recentes
- Filtro de período (botão presente, funcionalidade não implementada)
- Dados hardcoded/mock

**Limitações Identificadas:**
- Sem integração real com Contas a Pagar e Contas a Receber
- Sem projeção futura de fluxo de caixa
- Sem análise de tendências e padrões
- Sem alertas de saldo baixo ou negativo
- Sem categorização de despesas por centro de custo
- Sem análise de sazonalidade
- Sem comparação com períodos anteriores
- Sem DRE (Demonstrativo de Resultados)
- Sem análise de liquidez e indicadores financeiros
- Sem cenários (otimista, realista, pessimista)
- Sem previsão de falta de caixa
- Sem múltiplas contas bancárias
- Sem conciliação entre contas
- Sem exportação avançada de relatórios
- Sem gráficos interativos avançados

---

## Fase 1: Projeção e Previsão de Fluxo de Caixa 📊

**Objetivo:** Implementar sistema preditivo para antecipar necessidades de caixa e planejar o futuro financeiro.

### 1.1 Projeção de Fluxo Realizada vs Projetada

**Componente:** `CashFlowProjection.tsx`
```typescript
interface CashFlowProjection {
  data: Date;
  saldoInicial: number;
  entradasPrevistas: number;
  entradasRealizadas?: number;
  saidasPrevistas: number;
  saidasRealizadas?: number;
  saldoFinalPrevisto: number;
  saldoFinalRealizado?: number;
  confianca: number; // 0-100% - confiança da previsão
  origem: 'realizado' | 'projetado' | 'misto';
}

export const CashFlowProjection: React.FC = () => {
  const [periodoProjecao, setPeriodoProjecao] = useState(30); // dias
  const projection = useCashFlowProjection(periodoProjecao);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Projeção de Fluxo de Caixa</CardTitle>
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
          <LineChart data={projection.dados}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="data" />
            <YAxis />
            <Tooltip />
            <Legend />
            {/* Linha de saldo realizado (passado) */}
            <Line
              type="monotone"
              dataKey="saldoFinalRealizado"
              stroke="#3b82f6"
              strokeWidth={3}
              name="Realizado"
            />
            {/* Linha de saldo projetado (futuro) */}
            <Line
              type="monotone"
              dataKey="saldoFinalPrevisto"
              stroke="#10b981"
              strokeWidth={2}
              strokeDasharray="5 5"
              name="Projetado"
            />
            {/* Área de confiança */}
            <Area
              type="monotone"
              dataKey="limiteInferior"
              stroke="none"
              fill="#10b981"
              fillOpacity={0.1}
            />
            <Area
              type="monotone"
              dataKey="limiteSuperior"
              stroke="none"
              fill="#10b981"
              fillOpacity={0.1}
            />
          </LineChart>
        </ResponsiveContainer>

        {/* Alertas de Falta de Caixa */}
        {projection.alertas.length > 0 && (
          <Alert variant="destructive" className="mt-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Atenção: Saldo Negativo Previsto</AlertTitle>
            <AlertDescription>
              <ul className="list-disc list-inside mt-2">
                {projection.alertas.map((alerta, idx) => (
                  <li key={idx}>
                    {format(alerta.data, 'dd/MM/yyyy')}: Déficit de R$ {Math.abs(alerta.valor).toLocaleString('pt-BR')}
                  </li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};
```

### 1.2 Integração com Contas a Pagar e Receber

**Hook:** `useCashFlowProjection.ts`
```typescript
export const useCashFlowProjection = (dias: number) => {
  const [projection, setProjection] = useState<CashFlowProjection[]>([]);

  useEffect(() => {
    // Buscar faturas a pagar (vencimentos futuros)
    const contasAPagar = fetchFaturasAPagar({
      dataInicio: new Date(),
      dataFim: addDays(new Date(), dias),
      status: ['pendente', 'validada']
    });

    // Buscar faturas a receber (previsão de recebimento)
    const contasAReceber = fetchFaturasAReceber({
      dataInicio: new Date(),
      dataFim: addDays(new Date(), dias),
      status: ['pendente', 'validada']
    });

    // Buscar histórico de movimentações (para ML)
    const historico = fetchHistoricoMovimentacoes({
      dataInicio: subMonths(new Date(), 6),
      dataFim: new Date()
    });

    // Algoritmo de projeção
    const dados = calculateProjection({
      saldoInicial: getSaldoAtual(),
      contasAPagar,
      contasAReceber,
      historico,
      dias
    });

    setProjection(dados);
  }, [dias]);

  return {
    dados: projection,
    alertas: projection.filter(p => p.saldoFinalPrevisto < 0),
    saldoMinimoProjetado: Math.min(...projection.map(p => p.saldoFinalPrevisto)),
    saldoMaximoProjetado: Math.max(...projection.map(p => p.saldoFinalPrevisto)),
  };
};
```

**Arquivos a criar:**
- `admin/src/components/financeiro/fluxo-caixa/CashFlowProjection.tsx`
- `admin/src/hooks/useCashFlowProjection.ts`
- `admin/src/types/cash-flow.ts`

**Integração no backend:**
- Endpoint: `GET /api/cash-flow/projection?dias=30`
- Algoritmo de ML para previsão baseado em histórico
- Integração com tabelas de contas a pagar e receber

---

## Fase 2: Análise de Cenários e Simulações 🎯

**Objetivo:** Permitir simulação de diferentes cenários financeiros e análise de sensibilidade.

### 2.1 Cenários Múltiplos

**Componente:** `ScenarioAnalysis.tsx`
```typescript
interface Scenario {
  id: string;
  nome: string;
  tipo: 'otimista' | 'realista' | 'pessimista' | 'customizado';
  premissas: {
    taxaRecebimento: number; // % de recebimentos no prazo
    taxaAtraso: number; // dias médios de atraso
    receitasAdicionais: number; // R$ de receitas extras
    despesasAdicionais: number; // R$ de despesas extras
    crescimentoReceita: number; // % crescimento mensal
  };
  projecao: CashFlowProjection[];
}

export const ScenarioAnalysis: React.FC = () => {
  const [scenarios] = useState<Scenario[]>([
    {
      id: 'otimista',
      nome: 'Cenário Otimista',
      tipo: 'otimista',
      premissas: {
        taxaRecebimento: 95,
        taxaAtraso: 2,
        receitasAdicionais: 10000,
        despesasAdicionais: 0,
        crescimentoReceita: 5,
      },
      projecao: []
    },
    {
      id: 'realista',
      nome: 'Cenário Realista',
      tipo: 'realista',
      premissas: {
        taxaRecebimento: 85,
        taxaAtraso: 7,
        receitasAdicionais: 0,
        despesasAdicionais: 0,
        crescimentoReceita: 2,
      },
      projecao: []
    },
    {
      id: 'pessimista',
      nome: 'Cenário Pessimista',
      tipo: 'pessimista',
      premissas: {
        taxaRecebimento: 70,
        taxaAtraso: 15,
        receitasAdicionais: 0,
        despesasAdicionais: 5000,
        crescimentoReceita: -3,
      },
      projecao: []
    }
  ]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Análise de Cenários</CardTitle>
        <CardDescription>
          Compare diferentes cenários financeiros
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Gráfico comparativo */}
        <ResponsiveContainer width="100%" height={400}>
          <LineChart>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="data" />
            <YAxis />
            <Tooltip />
            <Legend />
            {scenarios.map((scenario, idx) => (
              <Line
                key={scenario.id}
                type="monotone"
                data={scenario.projecao}
                dataKey="saldoFinalPrevisto"
                stroke={getScenarioColor(scenario.tipo)}
                strokeWidth={2}
                name={scenario.nome}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>

        {/* Tabela comparativa */}
        <div className="mt-6 grid grid-cols-3 gap-4">
          {scenarios.map((scenario) => (
            <Card key={scenario.id}>
              <CardHeader>
                <CardTitle className="text-base">{scenario.nome}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Saldo Final (30d)</span>
                  <span className="font-semibold">
                    R$ {getUltimoSaldo(scenario.projecao).toLocaleString('pt-BR')}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Menor Saldo</span>
                  <span className="font-semibold text-red-600">
                    R$ {getMenorSaldo(scenario.projecao).toLocaleString('pt-BR')}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Dias Negativos</span>
                  <span className="font-semibold">
                    {getDiasNegativos(scenario.projecao)}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
```

### 2.2 Simulador de Impacto

**Componente:** `ImpactSimulator.tsx`
```typescript
export const ImpactSimulator: React.FC = () => {
  const [simulacao, setSimulacao] = useState({
    novaReceita: 0,
    novaDespesa: 0,
    dataInicio: new Date(),
    recorrente: false,
    frequencia: 'mensal',
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Simulador de Impacto</CardTitle>
        <CardDescription>
          Simule o impacto de novas receitas ou despesas no fluxo de caixa
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="space-y-2">
            <Label>Nova Receita (R$)</Label>
            <Input
              type="number"
              value={simulacao.novaReceita}
              onChange={(e) => setSimulacao({...simulacao, novaReceita: Number(e.target.value)})}
            />
          </div>
          <div className="space-y-2">
            <Label>Nova Despesa (R$)</Label>
            <Input
              type="number"
              value={simulacao.novaDespesa}
              onChange={(e) => setSimulacao({...simulacao, novaDespesa: Number(e.target.value)})}
            />
          </div>
        </div>

        {/* Comparação antes/depois */}
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Cenário Atual</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                R$ {calcularSaldoAtual().toLocaleString('pt-BR')}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Cenário Simulado</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                R$ {calcularSaldoSimulado(simulacao).toLocaleString('pt-BR')}
              </div>
            </CardContent>
          </Card>
        </div>
      </CardContent>
    </Card>
  );
};
```

**Arquivos a criar:**
- `admin/src/components/financeiro/fluxo-caixa/ScenarioAnalysis.tsx`
- `admin/src/components/financeiro/fluxo-caixa/ImpactSimulator.tsx`
- `admin/src/hooks/useScenarioAnalysis.ts`

---

## Fase 3: Dashboard Avançado e KPIs Financeiros 📈

**Objetivo:** Implementar indicadores financeiros avançados e visualizações inteligentes.

### 3.1 Indicadores Financeiros (KPIs)

```typescript
interface FinancialKPIs {
  // Liquidez
  liquidezImediata: number; // Caixa / Passivo Circulante
  liquidezCorrente: number; // Ativo Circulante / Passivo Circulante

  // Ciclo Financeiro
  pmp: number; // Prazo Médio de Pagamento (dias)
  pmr: number; // Prazo Médio de Recebimento (dias)
  cicloFinanceiro: number; // PMR - PMP

  // Rentabilidade
  margemLiquida: number; // Lucro Líquido / Receita Total
  margemEbitda: number; // EBITDA / Receita Total

  // Endividamento
  endividamentoTotal: number; // Passivo / Ativo
  coberturaDivida: number; // EBITDA / Dívida

  // Eficiência
  giroAtivo: number; // Receita / Ativo Total
  returnOnAssets: number; // Lucro / Ativo Total (ROA)
  returnOnEquity: number; // Lucro / Patrimônio Líquido (ROE)

  // Fluxo de Caixa
  burnRate: number; // Taxa de queima de caixa mensal
  runway: number; // Meses até acabar o caixa
  breakEven: Date; // Data prevista para equilíbrio
}
```

### 3.2 DRE (Demonstrativo de Resultados do Exercício)

**Componente:** `IncomeStatement.tsx`
```typescript
interface IncomeStatement {
  periodo: { inicio: Date; fim: Date };

  // Receitas
  receitaBruta: number;
  deducoes: number; // Impostos sobre vendas
  receitaLiquida: number;

  // Custos e Despesas
  custoProdutos: number; // CMV
  lucroBruto: number;

  despesasOperacionais: {
    vendas: number;
    administrativas: number;
    pessoal: number;
    total: number;
  };

  ebitda: number; // Lucro antes de juros, impostos, depreciação e amortização
  depreciacaoAmortizacao: number;
  ebit: number; // Lucro operacional

  // Resultado Financeiro
  receitasFinanceiras: number;
  despesasFinanceiras: number;
  resultadoFinanceiro: number;

  // Resultado Final
  lucroAntesImpostos: number;
  impostoRenda: number;
  lucroLiquido: number;

  // Margens
  margemBruta: number; // %
  margemEbitda: number; // %
  margemLiquida: number; // %
}
```

### 3.3 Análise de Break-Even

**Componente:** `BreakEvenAnalysis.tsx`
```typescript
export const BreakEvenAnalysis: React.FC = () => {
  const breakEven = useBreakEvenAnalysis();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Análise de Ponto de Equilíbrio</CardTitle>
        <CardDescription>
          Identifique quando seu negócio começará a ter lucro
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-muted-foreground">
                Receita Break-Even
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                R$ {breakEven.receitaBreakEven.toLocaleString('pt-BR')}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Por mês
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-muted-foreground">
                Data Prevista
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {format(breakEven.dataPrevist, 'MMM/yyyy', { locale: ptBR })}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {differenceInMonths(breakEven.dataPrevist, new Date())} meses
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-muted-foreground">
                Margem Atual
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${breakEven.margemAtual >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {breakEven.margemAtual.toFixed(1)}%
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {breakEven.margemAtual >= 0 ? 'Acima' : 'Abaixo'} do break-even
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Gráfico */}
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={breakEven.projecao}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="mes" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Area
              type="monotone"
              dataKey="receitas"
              stackId="1"
              stroke="#10b981"
              fill="#10b981"
              name="Receitas"
            />
            <Area
              type="monotone"
              dataKey="despesas"
              stackId="2"
              stroke="#ef4444"
              fill="#ef4444"
              name="Despesas"
            />
            <Line
              type="monotone"
              dataKey="breakEven"
              stroke="#f59e0b"
              strokeWidth={2}
              strokeDasharray="5 5"
              name="Break-Even"
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
```

**Arquivos a criar:**
- `admin/src/components/financeiro/fluxo-caixa/FinancialKPIs.tsx`
- `admin/src/components/financeiro/fluxo-caixa/IncomeStatement.tsx`
- `admin/src/components/financeiro/fluxo-caixa/BreakEvenAnalysis.tsx`
- `admin/src/hooks/useFinancialKPIs.ts`

---

## Fase 4: Múltiplas Contas e Transferências 🏦

**Objetivo:** Gerenciar múltiplas contas bancárias e transferências entre contas.

### 4.1 Gestão de Contas Bancárias

```typescript
interface BankAccount {
  id: string;
  nome: string;
  banco: string;
  agencia: string;
  conta: string;
  tipo: 'corrente' | 'poupanca' | 'investimento' | 'caixa';
  saldo: number;
  ativa: boolean;
  corPrimaria: string; // Para identificação visual
}

interface Transferencia {
  id: string;
  data: Date;
  contaOrigem: BankAccount;
  contaDestino: BankAccount;
  valor: number;
  descricao: string;
  tipo: 'transferencia' | 'aplicacao' | 'resgate';
}
```

**Componente:** `MultiAccountManagement.tsx`
```typescript
export const MultiAccountManagement: React.FC = () => {
  const accounts = useBankAccounts();
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Contas Bancárias</CardTitle>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nova Conta
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {accounts.map((account) => (
            <Card
              key={account.id}
              className={cn(
                "cursor-pointer transition-all",
                selectedAccounts.includes(account.id) && "ring-2 ring-primary"
              )}
              onClick={() => toggleAccount(account.id)}
            >
              <CardHeader
                className="pb-3"
                style={{ borderLeft: `4px solid ${account.corPrimaria}` }}
              >
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{account.nome}</CardTitle>
                  <Badge variant={account.ativa ? 'default' : 'secondary'}>
                    {account.ativa ? 'Ativa' : 'Inativa'}
                  </Badge>
                </div>
                <CardDescription className="text-xs">
                  {account.banco} • Ag: {account.agencia} • CC: {account.conta}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  R$ {account.saldo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>
                <p className="text-xs text-muted-foreground mt-1 capitalize">
                  Conta {account.tipo}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Saldo Consolidado */}
        <div className="mt-6 p-4 bg-primary/5 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Saldo Total Consolidado</span>
            <span className="text-2xl font-bold text-primary">
              R$ {calcularSaldoTotal(accounts).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
```

### 4.2 Transferências Entre Contas

**Componente:** `AccountTransfers.tsx`
```typescript
export const AccountTransfers: React.FC = () => {
  const [showTransferDialog, setShowTransferDialog] = useState(false);
  const transfers = useAccountTransfers();

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Transferências Entre Contas</CardTitle>
            <Button onClick={() => setShowTransferDialog(true)}>
              <ArrowRightLeft className="mr-2 h-4 w-4" />
              Nova Transferência
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Origem</TableHead>
                <TableHead></TableHead>
                <TableHead>Destino</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transfers.map((transfer) => (
                <TableRow key={transfer.id}>
                  <TableCell>{format(transfer.data, 'dd/MM/yyyy')}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: transfer.contaOrigem.corPrimaria }}
                      />
                      {transfer.contaOrigem.nome}
                    </div>
                  </TableCell>
                  <TableCell>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: transfer.contaDestino.corPrimaria }}
                      />
                      {transfer.contaDestino.nome}
                    </div>
                  </TableCell>
                  <TableCell className="font-semibold">
                    R$ {transfer.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{transfer.tipo}</Badge>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <TransferDialog
        open={showTransferDialog}
        onOpenChange={setShowTransferDialog}
      />
    </>
  );
};
```

**Arquivos a criar:**
- `admin/src/components/financeiro/fluxo-caixa/MultiAccountManagement.tsx`
- `admin/src/components/financeiro/fluxo-caixa/AccountTransfers.tsx`
- `admin/src/components/financeiro/fluxo-caixa/TransferDialog.tsx`
- `admin/src/hooks/useBankAccounts.ts`
- `admin/src/types/bank-account.ts`

---

## Fase 5: Alertas Inteligentes e Recomendações 🔔

**Objetivo:** Sistema proativo de alertas e recomendações baseadas em IA.

### 5.1 Sistema de Alertas

```typescript
interface Alert {
  id: string;
  tipo: 'critico' | 'atencao' | 'informativo';
  categoria: 'saldo' | 'vencimento' | 'meta' | 'anomalia' | 'oportunidade';
  titulo: string;
  descricao: string;
  data: Date;
  lido: boolean;
  acao?: {
    label: string;
    href: string;
  };
}

const alertRules = [
  {
    id: 'saldo-baixo',
    nome: 'Saldo Baixo',
    condicao: (saldo: number, limiteMinimo: number) => saldo < limiteMinimo,
    tipo: 'critico',
    mensagem: (saldo: number) => `Saldo abaixo do limite: R$ ${saldo.toLocaleString('pt-BR')}`
  },
  {
    id: 'saldo-negativo-projetado',
    nome: 'Saldo Negativo Futuro',
    condicao: (projection: CashFlowProjection[]) =>
      projection.some(p => p.saldoFinalPrevisto < 0),
    tipo: 'atencao',
    mensagem: (data: Date) => `Saldo negativo previsto para ${format(data, 'dd/MM/yyyy')}`
  },
  {
    id: 'vencimentos-proximos',
    nome: 'Vencimentos Próximos',
    condicao: (vencimentos: number, dias: number) => vencimentos > 0 && dias <= 3,
    tipo: 'atencao',
    mensagem: (valor: number) => `R$ ${valor.toLocaleString('pt-BR')} vencendo em breve`
  },
  {
    id: 'meta-atingida',
    nome: 'Meta Atingida',
    condicao: (atual: number, meta: number) => atual >= meta,
    tipo: 'informativo',
    mensagem: (percentual: number) => `Parabéns! ${percentual}% da meta alcançada`
  }
];
```

**Componente:** `SmartAlerts.tsx`
```typescript
export const SmartAlerts: React.FC = () => {
  const alerts = useSmartAlerts();
  const [filter, setFilter] = useState<'todos' | 'critico' | 'atencao' | 'informativo'>('todos');

  const filteredAlerts = filter === 'todos'
    ? alerts
    : alerts.filter(a => a.tipo === filter);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Alertas e Notificações
              {alerts.filter(a => !a.lido).length > 0 && (
                <Badge variant="destructive">
                  {alerts.filter(a => !a.lido).length}
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              Alertas inteligentes sobre seu fluxo de caixa
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              variant={filter === 'todos' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('todos')}
            >
              Todos
            </Button>
            <Button
              variant={filter === 'critico' ? 'destructive' : 'outline'}
              size="sm"
              onClick={() => setFilter('critico')}
            >
              Críticos
            </Button>
            <Button
              variant={filter === 'atencao' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('atencao')}
            >
              Atenção
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {filteredAlerts.map((alert) => (
            <Alert
              key={alert.id}
              variant={alert.tipo === 'critico' ? 'destructive' : 'default'}
              className={cn(!alert.lido && 'border-l-4 border-l-primary')}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    {getAlertIcon(alert.categoria)}
                    <AlertTitle>{alert.titulo}</AlertTitle>
                  </div>
                  <AlertDescription className="mt-2">
                    {alert.descricao}
                  </AlertDescription>
                  {alert.acao && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-3"
                      onClick={() => window.location.href = alert.acao!.href}
                    >
                      {alert.acao.label}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  )}
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(alert.data, { addSuffix: true, locale: ptBR })}
                  </span>
                  {!alert.lido && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => marcarComoLido(alert.id)}
                    >
                      Marcar como lido
                    </Button>
                  )}
                </div>
              </div>
            </Alert>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
```

### 5.2 Recomendações de IA

**Componente:** `AIRecommendations.tsx`
```typescript
interface Recommendation {
  id: string;
  tipo: 'economia' | 'investimento' | 'negociacao' | 'otimizacao';
  prioridade: 'alta' | 'media' | 'baixa';
  titulo: string;
  descricao: string;
  impactoFinanceiro: number;
  esforco: 'baixo' | 'medio' | 'alto';
  prazo: string;
  acao: string;
}

export const AIRecommendations: React.FC = () => {
  const recommendations = useAIRecommendations();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-purple-600" />
          Recomendações Inteligentes
        </CardTitle>
        <CardDescription>
          Ações sugeridas pela IA para melhorar seu fluxo de caixa
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {recommendations.map((rec) => (
            <Card key={rec.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant={getPrioridadeVariant(rec.prioridade)}>
                        {rec.prioridade}
                      </Badge>
                      <Badge variant="outline">{rec.tipo}</Badge>
                    </div>
                    <CardTitle className="text-base">{rec.titulo}</CardTitle>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Impacto</p>
                    <p className="text-lg font-bold text-green-600">
                      +R$ {rec.impactoFinanceiro.toLocaleString('pt-BR')}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">
                  {rec.descricao}
                </p>
                <div className="flex items-center justify-between">
                  <div className="flex gap-4 text-xs text-muted-foreground">
                    <span>Esforço: {rec.esforco}</span>
                    <span>Prazo: {rec.prazo}</span>
                  </div>
                  <Button size="sm">
                    {rec.acao}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
```

**Arquivos a criar:**
- `admin/src/components/financeiro/fluxo-caixa/SmartAlerts.tsx`
- `admin/src/components/financeiro/fluxo-caixa/AIRecommendations.tsx`
- `admin/src/hooks/useSmartAlerts.ts`
- `admin/src/hooks/useAIRecommendations.ts`

---

## Fase 6: Relatórios Avançados e Exportações 📄

**Objetivo:** Gerar relatórios financeiros completos e exportar em múltiplos formatos.

### 6.1 Gerador de Relatórios

```typescript
interface Report {
  id: string;
  nome: string;
  tipo: 'fluxo-caixa' | 'dre' | 'balanco' | 'gerencial' | 'customizado';
  periodo: { inicio: Date; fim: Date };
  formato: 'pdf' | 'excel' | 'csv' | 'json';
  opcoes: {
    incluirGraficos: boolean;
    incluirComparativo: boolean;
    agruparPor: 'dia' | 'semana' | 'mes';
    categorias?: string[];
    contas?: string[];
  };
}
```

**Componente:** `ReportGenerator.tsx`
```typescript
export const ReportGenerator: React.FC = () => {
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gerador de Relatórios</CardTitle>
        <CardDescription>
          Crie relatórios personalizados do seu fluxo de caixa
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Tipo de Relatório */}
          <div className="space-y-2">
            <Label>Tipo de Relatório</Label>
            <Select
              value={reportConfig.tipo}
              onValueChange={(v) => setReportConfig({...reportConfig, tipo: v as any})}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="fluxo-caixa">Fluxo de Caixa</SelectItem>
                <SelectItem value="dre">DRE</SelectItem>
                <SelectItem value="balanco">Balanço Patrimonial</SelectItem>
                <SelectItem value="gerencial">Relatório Gerencial</SelectItem>
                <SelectItem value="customizado">Personalizado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Período */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Data Início</Label>
              <Input
                type="date"
                value={format(reportConfig.periodo.inicio, 'yyyy-MM-dd')}
              />
            </div>
            <div className="space-y-2">
              <Label>Data Fim</Label>
              <Input
                type="date"
                value={format(reportConfig.periodo.fim, 'yyyy-MM-dd')}
              />
            </div>
          </div>

          {/* Formato */}
          <div className="space-y-2">
            <Label>Formato de Exportação</Label>
            <div className="flex gap-2">
              {['pdf', 'excel', 'csv', 'json'].map((formato) => (
                <Button
                  key={formato}
                  variant={reportConfig.formato === formato ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setReportConfig({...reportConfig, formato: formato as any})}
                >
                  {formato.toUpperCase()}
                </Button>
              ))}
            </div>
          </div>

          {/* Opções */}
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
                <Label>Incluir gráficos</Label>
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
                <Label>Comparar com período anterior</Label>
              </div>
            </div>
          </div>

          <Button className="w-full" size="lg" onClick={() => generateReport(reportConfig)}>
            <Download className="mr-2 h-4 w-4" />
            Gerar Relatório
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
```

**Arquivos a criar:**
- `admin/src/components/financeiro/fluxo-caixa/ReportGenerator.tsx`
- `admin/src/components/financeiro/fluxo-caixa/ReportTemplates.tsx`
- `admin/src/hooks/useReportGenerator.ts`
- `admin/src/lib/report-generator.ts` (PDF/Excel generation)

---

## Priorização e Cronograma Sugerido

### ✅ Sprint 1 (2 semanas) - Fase 1 - CONCLUÍDA
- ✅ Projeção de fluxo de caixa com integração
- ✅ Alertas de saldo negativo
- **Valor:** Alto impacto na previsibilidade
- **Status:** Implementado em 29/10/2025

### ✅ Sprint 2 (2 semanas) - Fase 2 - CONCLUÍDA
- ✅ Análise de cenários
- ✅ Simulador de impacto
- **Valor:** Planejamento estratégico
- **Status:** Implementado em 29/10/2025

### ✅ Sprint 3 (3 semanas) - Fase 3 - CONCLUÍDA
- ✅ Dashboard de KPIs financeiros
- ✅ DRE automatizado
- ✅ Break-even analysis
- **Valor:** Visão financeira completa
- **Status:** Implementado em 29/10/2025

### ✅ Sprint 4 (2 semanas) - Fase 4 - CONCLUÍDA
- ✅ Múltiplas contas bancárias
- ✅ Transferências entre contas
- **Valor:** Gestão multi-conta
- **Status:** Implementado em 29/10/2025

### ✅ Sprint 5 (2 semanas) - Fase 5 - CONCLUÍDA

- ✅ Sistema de alertas inteligentes
- ✅ Recomendações de IA
- **Valor:** Inteligência proativa
- **Status:** Implementado em 29/10/2025

### ✅ Sprint 6 (2 semanas) - Fase 6 - CONCLUÍDA 🎉

- ✅ Gerador de relatórios avançados
- ✅ Exportações em múltiplos formatos (Excel, CSV, JSON, Print/PDF)
- ✅ Configuração de períodos personalizados
- ✅ Atalhos rápidos para relatórios comuns
- **Valor:** Documentação e compliance
- **Status:** Implementado em 29/10/2025

**Total estimado:** 13 semanas (3 meses)

**Progresso:** 6/6 fases concluídas (100%) ✅ ROADMAP COMPLETO!

---

## Métricas de Sucesso

1. **Previsibilidade:**
   - Acurácia de projeção > 85%
   - Alertas antecipados de problemas
   - Redução de surpresas financeiras

2. **Eficiência:**
   - Tempo de análise reduzido em 70%
   - Automação de 80% dos relatórios
   - Decisões mais rápidas

3. **Visibilidade:**
   - 100% de transparência financeira
   - KPIs em tempo real
   - Comparações históricas

4. **Controle:**
   - Gestão de múltiplas contas
   - Rastreabilidade completa
   - Auditoria facilitada

---

## Próximos Passos

1. ✅ Revisar e aprovar roadmap
2. ✅ Definir prioridades com stakeholders
3. ✅ Iniciar Sprint 1 (Fase 1) - Concluído
4. ✅ Iniciar Sprint 2 (Fase 2) - Concluído
5. ✅ Iniciar Sprint 3 (Fase 3) - Concluído
6. ✅ Iniciar Sprint 4 (Fase 4) - Concluído
7. ✅ Iniciar Sprint 5 (Fase 5) - Concluído
8. ✅ Iniciar Sprint 6 (Fase 6) - Concluído - ROADMAP 100% COMPLETO! 🎉
9. ⏭️ Configurar integrações com módulos existentes (próxima etapa)
10. ⏭️ Treinar modelo de ML para previsões (próxima etapa)
