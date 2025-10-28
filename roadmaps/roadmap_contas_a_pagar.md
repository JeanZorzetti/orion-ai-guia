# Roadmap: Contas a Pagar - Melhorias e Funcionalidades Avançadas

## Visão Geral
Este roadmap define as melhorias para transformar o módulo de Contas a Pagar em uma solução completa e inteligente, incorporando automação, análise preditiva, gestão de fluxo de caixa e melhores práticas de 2025 para gestão financeira.

## Estado Atual
**Localização:** `admin/src/pages/ContasAPagar.tsx`

**Funcionalidades Existentes:**
- Tabela de faturas com filtros básicos
- CRUD completo de faturas (criar, editar, visualizar, excluir)
- Upload de faturas com IA (extração automática de dados)
- Filtros por status (Pendente, Validada, Paga, Cancelada)
- Busca por número de fatura
- Filtro por fornecedor
- Filtro por intervalo de datas
- Ordenação por múltiplos campos
- Exportação para CSV
- Impressão de relatórios
- Modal de detalhes completos
- Integração com fornecedores

**Limitações Identificadas:**
- Sem dashboard analítico com KPIs
- Sem relatório de aging (vencimentos por período)
- Sem análise de fluxo de caixa
- Sem previsão de pagamentos
- Sem automação de aprovações
- Sem workflow de aprovação multinível
- Sem indicadores avançados (DPO, ciclo de pagamento)
- Sem categorização e centro de custos
- Sem análise de fornecedores (score, desempenho)
- Sem gestão de conciliação bancária
- Sem alertas inteligentes de vencimento
- Sem análise de descontos e negociações
- Sem portal do fornecedor
- Sem OCR avançado para todas as faturas

---

## Fase 1: Dashboard Avançado e KPIs Essenciais 📊 ✅

**Status:** ✅ **CONCLUÍDA**
**Data:** 28/10/2025
**Commit:** `7891e7d1`

**Objetivo:** Transformar a visualização básica em um dashboard analítico completo com métricas essenciais para gestão de pagamentos.

**Implementado:**
- ✅ Hook `useAPKPIs` - 12 indicadores financeiros avançados
- ✅ Componente `APDashboardKPIs` - Cards de KPIs com badges de tendência
- ✅ Hook `useAPAgingReport` - Análise de vencimentos por período
- ✅ Componente `APAgingReportTable` - Tabela de aging com 6 períodos
- ✅ Hook `useAPChartData` - Dados para 4 gráficos analíticos
- ✅ Componente `APCharts` - 4 gráficos com Recharts
- ✅ Página dedicada `/dashboard` com navegação completa
- ✅ Submenu em Contas a Pagar (Dashboard + Faturas)
- ✅ Mock data completo para demonstração

**KPIs Implementados:**
1. Total a Pagar (com quantidade de títulos)
2. Vencidos (com taxa de atraso)
3. Próximos 7 Dias (atenção ao fluxo)
4. Próximos 30 Dias (planejamento)
5. DPO - Days Payable Outstanding (com tendência)
6. Média de Pagamento (dias antes/depois vencimento)
7. Ciclo Financeiro (DPO - DSO)
8. Taxa de Atrasos (com tendência)
9. Descontos Disponíveis
10. Economia Obtida (com descontos)
11. Concentração de Fornecedores (Top 5)
12. Comparação com Mês Anterior

**Aging Report:**
- A Vencer (futuro)
- Vencendo Hoje
- Vencido 1-7 dias
- Vencido 8-15 dias
- Vencido 16-30 dias
- Vencido 30+ dias
- Classificação de urgência automática
- Resumo por urgência

**Gráficos:**
1. Distribuição por Vencimento (barras empilhadas)
2. Projeção de Fluxo de Caixa (linha, 30 dias)
3. Gastos por Categoria (pizza com percentuais)
4. Evolução DPO e Taxa de Atraso (linha dupla)

**Arquivos criados:**
- `admin/src/hooks/useAPKPIs.ts`
- `admin/src/hooks/useAPAgingReport.ts`
- `admin/src/hooks/useAPChartData.ts`
- `admin/src/components/financeiro/contas-a-pagar/APDashboardKPIs.tsx`
- `admin/src/components/financeiro/contas-a-pagar/APAgingReportTable.tsx`
- `admin/src/components/financeiro/contas-a-pagar/APCharts.tsx`
- `admin/src/app/admin/financeiro/contas-a-pagar/dashboard/page.tsx`

**Arquivos modificados:**
- `admin/src/components/layout/AdminSidebar.tsx`

---

### 1.1 Indicadores Financeiros Avançados

**Novos KPI Cards:**
```typescript
interface AdvancedAPKPIs {
  dpo: number; // Days Payable Outstanding
  totalAPagar: number; // Total em aberto
  vencidosHoje: number; // Vencendo hoje
  vencidosTotais: number; // Total vencido
  proximos7Dias: number; // Vencendo em 7 dias
  proximos30Dias: number; // Vencendo em 30 dias
  mediaPagamento: number; // Dias médios de pagamento
  descontosDisponiveis: number; // Total em descontos disponíveis
  economiaDescontos: number; // Economia obtida com descontos
  concentracaoFornecedores: number; // % dos top 5 fornecedores
  taxaAtrasos: number; // % de pagamentos em atraso
  cicloFinanceiro: number; // Dias do ciclo financeiro
}
```

**Componente:** `APDashboardKPIs.tsx`
```typescript
export const APDashboardKPIs: React.FC = () => {
  const kpis = useAPKPIs();

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
            {kpis.quantidadeTitulos} títulos em aberto
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Vencidos</CardTitle>
          <AlertTriangle className="h-4 w-4 text-destructive" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-destructive">
            R$ {kpis.vencidosTotais.toLocaleString('pt-BR')}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Taxa de atraso: {kpis.taxaAtrasos.toFixed(1)}%
          </p>
        </CardContent>
      </Card>

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
            Atenção ao fluxo de caixa
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">DPO</CardTitle>
          <TrendingUp className="h-4 w-4 text-blue-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-600">
            {kpis.dpo} dias
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            <TrendBadge value={kpis.dpoTrend} />
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
```

### 1.2 Relatório de Aging (Vencimentos por Período)

**Componente:** `APAgingReportTable.tsx`
```typescript
interface APAgingBucket {
  fornecedorId: string;
  fornecedorNome: string;
  aVencer: number; // Ainda a vencer
  vencendoHoje: number; // Vencendo hoje
  vencido1a7: number; // 1-7 dias vencidos
  vencido8a15: number; // 8-15 dias vencidos
  vencido16a30: number; // 16-30 dias vencidos
  vencido30Plus: number; // 30+ dias vencidos
  total: number;
  urgencia: 'baixa' | 'media' | 'alta' | 'critica';
}

export const APAgingReportTable: React.FC = () => {
  const agingData = useAPAgingReport();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Aging Report - Análise de Vencimentos</CardTitle>
        <CardDescription>
          Títulos agrupados por período de vencimento
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fornecedor</TableHead>
              <TableHead className="text-right">A Vencer</TableHead>
              <TableHead className="text-right">Hoje</TableHead>
              <TableHead className="text-right">1-7d</TableHead>
              <TableHead className="text-right">8-15d</TableHead>
              <TableHead className="text-right">16-30d</TableHead>
              <TableHead className="text-right">30+d</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead>Urgência</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {agingData.map((bucket) => (
              <TableRow key={bucket.fornecedorId}>
                <TableCell className="font-medium">{bucket.fornecedorNome}</TableCell>
                <TableCell className="text-right">
                  R$ {bucket.aVencer.toLocaleString('pt-BR')}
                </TableCell>
                <TableCell className="text-right text-orange-600 font-semibold">
                  R$ {bucket.vencendoHoje.toLocaleString('pt-BR')}
                </TableCell>
                <TableCell className="text-right text-yellow-600">
                  R$ {bucket.vencido1a7.toLocaleString('pt-BR')}
                </TableCell>
                <TableCell className="text-right text-orange-600">
                  R$ {bucket.vencido8a15.toLocaleString('pt-BR')}
                </TableCell>
                <TableCell className="text-right text-red-600">
                  R$ {bucket.vencido16a30.toLocaleString('pt-BR')}
                </TableCell>
                <TableCell className="text-right text-destructive font-bold">
                  R$ {bucket.vencido30Plus.toLocaleString('pt-BR')}
                </TableCell>
                <TableCell className="text-right font-bold">
                  R$ {bucket.total.toLocaleString('pt-BR')}
                </TableCell>
                <TableCell>
                  <Badge variant={getUrgencyVariant(bucket.urgencia)}>
                    {bucket.urgencia.toUpperCase()}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};
```

### 1.3 Gráficos e Visualizações

**Componente:** `APCharts.tsx` (usando Recharts)
```typescript
export const APCharts: React.FC = () => {
  const chartData = useAPChartData();

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* Gráfico de Aging - Barras Empilhadas */}
      <Card>
        <CardHeader>
          <CardTitle>Distribuição por Vencimento</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData.aging}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="mes" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="aVencer" stackId="a" fill="#22c55e" name="A Vencer" />
              <Bar dataKey="hoje" stackId="a" fill="#f97316" name="Hoje" />
              <Bar dataKey="vencido1a7" stackId="a" fill="#eab308" name="1-7d" />
              <Bar dataKey="vencido8a15" stackId="a" fill="#f97316" name="8-15d" />
              <Bar dataKey="vencido16a30" stackId="a" fill="#ef4444" name="16-30d" />
              <Bar dataKey="vencido30Plus" stackId="a" fill="#991b1b" name="30+d" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Gráfico de Fluxo de Caixa - Linha */}
      <Card>
        <CardHeader>
          <CardTitle>Projeção de Fluxo de Caixa</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData.cashFlow}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="data" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="aPagar"
                stroke="#ef4444"
                name="A Pagar"
                strokeWidth={2}
              />
              <Line
                type="monotone"
                dataKey="receber"
                stroke="#22c55e"
                name="A Receber"
                strokeWidth={2}
              />
              <Line
                type="monotone"
                dataKey="saldo"
                stroke="#3b82f6"
                name="Saldo Projetado"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Gráfico por Categoria - Pizza */}
      <Card>
        <CardHeader>
          <CardTitle>Gastos por Categoria</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={chartData.categories}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={renderCustomLabel}
                outerRadius={80}
                fill="#8884d8"
                dataKey="valor"
              >
                {chartData.categories.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Gráfico de Tendência DPO */}
      <Card>
        <CardHeader>
          <CardTitle>Evolução DPO e Taxa de Atraso</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData.trends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="mes" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Legend />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="dpo"
                stroke="#3b82f6"
                name="DPO (dias)"
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="taxaAtraso"
                stroke="#ef4444"
                name="Taxa Atraso (%)"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};
```

**Arquivos a criar:**
- `admin/src/components/financeiro/contas-a-pagar/APDashboardKPIs.tsx`
- `admin/src/components/financeiro/contas-a-pagar/APAgingReportTable.tsx`
- `admin/src/components/financeiro/contas-a-pagar/APCharts.tsx`
- `admin/src/hooks/useAPKPIs.ts`
- `admin/src/hooks/useAPAgingReport.ts`
- `admin/src/hooks/useAPChartData.ts`

**Integração no backend:**
- Endpoint: `GET /api/contas-a-pagar/kpis`
- Endpoint: `GET /api/contas-a-pagar/aging-report`
- Endpoint: `GET /api/contas-a-pagar/chart-data`

---

## Fase 2: Workflow de Aprovação e Automação 🔄

**Objetivo:** Implementar fluxo de aprovação multinível e automação de processos.

### 2.1 Sistema de Aprovação Multinível

**Modelo de Dados:**
```typescript
interface ApprovalWorkflow {
  id: string;
  nome: string;
  descricao?: string;
  ativo: boolean;
  condicoes: {
    valorMinimo?: number;
    valorMaximo?: number;
    categorias?: string[];
    fornecedores?: string[];
    centrosCusto?: string[];
  };
  niveis: ApprovalLevel[];
  dataCriacao: Date;
  criadoPor: string;
}

interface ApprovalLevel {
  nivel: number;
  nome: string;
  aprovadores: {
    usuarioId: string;
    nome: string;
    email: string;
  }[];
  tipoAprovacao: 'qualquer_um' | 'todos' | 'maioria';
  prazoHoras: number;
  obrigatorio: boolean;
  condicoesEspeciais?: {
    valorMinimo?: number;
    diasUteisAntesVencimento?: number;
  };
}

interface ApprovalRequest {
  id: string;
  faturaId: string;
  workflowId: string;
  status: 'pendente' | 'aprovada' | 'rejeitada' | 'cancelada';
  nivelAtual: number;
  aprovacoes: Approval[];
  dataSolicitacao: Date;
  dataLimite: Date;
  solicitante: {
    id: string;
    nome: string;
  };
}

interface Approval {
  nivel: number;
  aprovadorId: string;
  aprovadorNome: string;
  status: 'pendente' | 'aprovado' | 'rejeitado';
  dataAprovacao?: Date;
  observacoes?: string;
  anexos?: string[];
}
```

**Componente:** `ApprovalWorkflowManager.tsx`
```typescript
export const ApprovalWorkflowManager: React.FC = () => {
  const [workflows, setWorkflows] = useState<ApprovalWorkflow[]>([]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Fluxos de Aprovação</CardTitle>
            <CardDescription>
              Configure regras automáticas de aprovação
            </CardDescription>
          </div>
          <Button onClick={handleCreateWorkflow}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Fluxo
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {workflows.map((workflow) => (
            <div key={workflow.id} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <Switch
                    checked={workflow.ativo}
                    onCheckedChange={(checked) => toggleWorkflow(workflow.id, checked)}
                  />
                  <div>
                    <h4 className="font-semibold">{workflow.nome}</h4>
                    <p className="text-sm text-muted-foreground">
                      {workflow.niveis.length} níveis de aprovação
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={() => handleEditWorkflow(workflow)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive"
                    onClick={() => handleDeleteWorkflow(workflow.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Condições */}
              <div className="bg-muted p-3 rounded-md mb-3">
                <p className="text-sm font-medium mb-2">Condições de Aplicação:</p>
                <div className="flex flex-wrap gap-2">
                  {workflow.condicoes.valorMinimo && (
                    <Badge variant="outline">
                      Valor Min: R$ {workflow.condicoes.valorMinimo.toLocaleString('pt-BR')}
                    </Badge>
                  )}
                  {workflow.condicoes.valorMaximo && (
                    <Badge variant="outline">
                      Valor Max: R$ {workflow.condicoes.valorMaximo.toLocaleString('pt-BR')}
                    </Badge>
                  )}
                  {workflow.condicoes.categorias && workflow.condicoes.categorias.length > 0 && (
                    <Badge variant="outline">
                      {workflow.condicoes.categorias.length} categorias
                    </Badge>
                  )}
                </div>
              </div>

              {/* Níveis */}
              <div className="space-y-2">
                {workflow.niveis.map((nivel) => (
                  <div key={nivel.nivel} className="flex items-center gap-3 text-sm">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-semibold">
                      {nivel.nivel}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{nivel.nome}</p>
                      <p className="text-muted-foreground">
                        {nivel.aprovadores.length} aprovadores • {nivel.tipoAprovacao.replace('_', ' ')}
                      </p>
                    </div>
                    <Badge variant="secondary">
                      {nivel.prazoHoras}h
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
```

### 2.2 Painel de Aprovações Pendentes

**Componente:** `PendingApprovalsPanel.tsx`
```typescript
export const PendingApprovalsPanel: React.FC = () => {
  const { user } = useAuth();
  const pendingApprovals = usePendingApprovals(user.id);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5" />
          Aprovações Pendentes
          {pendingApprovals.length > 0 && (
            <Badge variant="destructive" className="ml-2">
              {pendingApprovals.length}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {pendingApprovals.length === 0 ? (
          <EmptyState
            icon={CheckCircle2}
            title="Nenhuma aprovação pendente"
            description="Você está em dia com suas aprovações!"
          />
        ) : (
          <div className="space-y-4">
            {pendingApprovals.map((request) => (
              <div key={request.id} className="border rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold">Fatura #{request.fatura.invoice_number}</h4>
                      <Badge>Nível {request.nivelAtual}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Fornecedor: {request.fatura.supplier?.name}
                    </p>
                    <p className="text-sm font-semibold mt-1">
                      Valor: R$ {request.fatura.total_value.toLocaleString('pt-BR')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Prazo</p>
                    <p className="text-sm font-semibold">
                      {formatDistanceToNow(request.dataLimite, { addSuffix: true, locale: ptBR })}
                    </p>
                  </div>
                </div>

                {/* Timeline de aprovações */}
                <div className="mb-4 pl-4 border-l-2 border-muted space-y-3">
                  {request.aprovacoes.map((approval) => (
                    <div key={`${approval.nivel}-${approval.aprovadorId}`} className="relative">
                      <div className="absolute -left-[25px] top-1">
                        {approval.status === 'aprovado' && (
                          <CheckCircle2 className="h-5 w-5 text-green-600" />
                        )}
                        {approval.status === 'rejeitado' && (
                          <XCircle className="h-5 w-5 text-red-600" />
                        )}
                        {approval.status === 'pendente' && (
                          <Clock className="h-5 w-5 text-orange-500" />
                        )}
                      </div>
                      <div className="text-sm">
                        <p className="font-medium">{approval.aprovadorNome}</p>
                        <p className="text-muted-foreground">
                          {approval.status === 'aprovado' && `Aprovado ${formatDistanceToNow(approval.dataAprovacao!, { addSuffix: true, locale: ptBR })}`}
                          {approval.status === 'rejeitado' && `Rejeitado ${formatDistanceToNow(approval.dataAprovacao!, { addSuffix: true, locale: ptBR })}`}
                          {approval.status === 'pendente' && 'Aguardando aprovação'}
                        </p>
                        {approval.observacoes && (
                          <p className="text-xs text-muted-foreground mt-1 italic">
                            "{approval.observacoes}"
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Ações */}
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleViewInvoice(request.faturaId)}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Ver Fatura
                  </Button>
                  <Button
                    size="sm"
                    className="bg-green-600 hover:bg-green-700"
                    onClick={() => handleApprove(request.id)}
                  >
                    <Check className="h-4 w-4 mr-2" />
                    Aprovar
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleReject(request.id)}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Rejeitar
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
```

### 2.3 Automação de Processos

**Componente:** `PaymentAutomationRules.tsx`
```typescript
interface AutomationRule {
  id: string;
  nome: string;
  ativo: boolean;
  tipo: 'alerta_vencimento' | 'pagamento_automatico' | 'solicitacao_aprovacao' | 'conciliacao';
  trigger: {
    tipo: 'dias_antes_vencimento' | 'valor_minimo' | 'fornecedor_especifico' | 'categoria';
    valor: number | string;
  };
  acoes: {
    tipo: 'enviar_email' | 'criar_notificacao' | 'agendar_pagamento' | 'solicitar_aprovacao';
    parametros: Record<string, any>;
  }[];
}

export const PaymentAutomationRules: React.FC = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Regras de Automação</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Alerta de Vencimento */}
          <div className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <Switch defaultChecked />
                <div>
                  <h4 className="font-semibold">Alerta de Vencimento</h4>
                  <p className="text-sm text-muted-foreground">
                    Notificar 3 dias antes do vencimento
                  </p>
                </div>
              </div>
              <Badge>Ativo</Badge>
            </div>
          </div>

          {/* Pagamento Automático */}
          <div className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <Switch />
                <div>
                  <h4 className="font-semibold">Pagamento Automático</h4>
                  <p className="text-sm text-muted-foreground">
                    Pagar automaticamente faturas aprovadas
                  </p>
                </div>
              </div>
              <Badge variant="outline">Inativo</Badge>
            </div>
          </div>

          {/* Aprovação Expressa */}
          <div className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <Switch defaultChecked />
                <div>
                  <h4 className="font-semibold">Aprovação Expressa</h4>
                  <p className="text-sm text-muted-foreground">
                    Auto-aprovar faturas até R$ 1.000,00
                  </p>
                </div>
              </div>
              <Badge>Ativo</Badge>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
```

**Arquivos a criar:**
- `admin/src/components/financeiro/contas-a-pagar/ApprovalWorkflowManager.tsx`
- `admin/src/components/financeiro/contas-a-pagar/PendingApprovalsPanel.tsx`
- `admin/src/components/financeiro/contas-a-pagar/PaymentAutomationRules.tsx`
- `admin/src/hooks/usePendingApprovals.ts`
- `admin/src/hooks/useApprovalWorkflows.ts`

**Integração no backend:**
- Endpoint: `POST /api/approval-workflows`
- Endpoint: `GET /api/approval-workflows`
- Endpoint: `POST /api/approval-requests`
- Endpoint: `PUT /api/approval-requests/{id}/approve`
- Endpoint: `PUT /api/approval-requests/{id}/reject`
- Job agendado: Verificar prazos de aprovação e enviar lembretes

---

## Fase 3: Análise de Fornecedores e Performance 📈

**Objetivo:** Implementar sistema de análise e score de fornecedores.

### 3.1 Score de Performance do Fornecedor

**Modelo de Dados:**
```typescript
interface SupplierPerformanceScore {
  fornecedorId: string;
  score: number; // 0-100
  categoria: 'excelente' | 'bom' | 'regular' | 'ruim' | 'critico';
  fatores: {
    pontualidadeEntrega: number; // % entregas no prazo
    qualidadeProdutos: number; // avaliação 0-10
    precosCompetitivos: number; // comparação com mercado
    atendimento: number; // avaliação 0-10
    flexibilidadeNegociacao: number; // 0-10
    conformidadeDocumental: number; // % docs corretos
  };
  metricas: {
    totalCompras: number;
    valorTotalComprado: number;
    ticketMedio: number;
    frequenciaCompras: number; // compras/mês
    prazoMedioPagamento: number; // dias
    descontosObtidos: number;
    devolucoesReclamacoes: number;
  };
  historico: {
    mes: string;
    score: number;
    totalCompras: number;
  }[];
  recomendacoes: string[];
  tendencia: 'melhorando' | 'estavel' | 'piorando';
  ultimaAtualizacao: Date;
}
```

**Componente:** `SupplierPerformanceProfile.tsx`
```typescript
export const SupplierPerformanceProfile: React.FC<{ fornecedorId: string }> = ({ fornecedorId }) => {
  const performance = useSupplierPerformance(fornecedorId);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Performance do Fornecedor</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Score Principal */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Score de Performance</p>
              <p className={cn('text-4xl font-bold', getScoreColor(performance.score))}>
                {performance.score}
              </p>
              <Badge variant={getCategoryVariant(performance.categoria)} className="mt-2">
                {performance.categoria.toUpperCase()}
              </Badge>
            </div>
            <CircularProgress value={performance.score} size={120} />
          </div>

          {/* Fatores */}
          <div>
            <h4 className="font-semibold mb-3">Fatores Avaliados</h4>
            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span>Pontualidade nas Entregas</span>
                  <span className="font-semibold">
                    {performance.fatores.pontualidadeEntrega.toFixed(0)}%
                  </span>
                </div>
                <Progress value={performance.fatores.pontualidadeEntrega} />
              </div>

              <div>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span>Qualidade dos Produtos</span>
                  <span className="font-semibold">
                    {performance.fatores.qualidadeProdutos.toFixed(1)}/10
                  </span>
                </div>
                <Progress value={performance.fatores.qualidadeProdutos * 10} />
              </div>

              <div>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span>Preços Competitivos</span>
                  <span className="font-semibold">
                    {performance.fatores.precosCompetitivos.toFixed(1)}/10
                  </span>
                </div>
                <Progress value={performance.fatores.precosCompetitivos * 10} />
              </div>

              <div>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span>Conformidade Documental</span>
                  <span className="font-semibold">
                    {performance.fatores.conformidadeDocumental.toFixed(0)}%
                  </span>
                </div>
                <Progress value={performance.fatores.conformidadeDocumental} />
              </div>
            </div>
          </div>

          {/* Métricas */}
          <div className="bg-muted p-4 rounded-lg">
            <h4 className="font-semibold mb-3">Métricas de Relacionamento</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Total Comprado</p>
                <p className="font-semibold">
                  R$ {performance.metricas.valorTotalComprado.toLocaleString('pt-BR')}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Ticket Médio</p>
                <p className="font-semibold">
                  R$ {performance.metricas.ticketMedio.toLocaleString('pt-BR')}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Frequência</p>
                <p className="font-semibold">
                  {performance.metricas.frequenciaCompras} compras/mês
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Prazo Médio Pagamento</p>
                <p className="font-semibold">
                  {performance.metricas.prazoMedioPagamento} dias
                </p>
              </div>
            </div>
          </div>

          {/* Tendência */}
          <div className="flex items-center gap-2">
            {performance.tendencia === 'melhorando' && (
              <>
                <TrendingUp className="h-5 w-5 text-green-600" />
                <span className="text-sm text-green-600 font-semibold">
                  Performance melhorando
                </span>
              </>
            )}
          </div>

          {/* Recomendações */}
          {performance.recomendacoes.length > 0 && (
            <Alert>
              <AlertTitle>Recomendações</AlertTitle>
              <AlertDescription>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  {performance.recomendacoes.map((rec, idx) => (
                    <li key={idx}>{rec}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
```

### 3.2 Comparação de Fornecedores

**Componente:** `SupplierComparison.tsx`
```typescript
export const SupplierComparison: React.FC = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Comparação de Fornecedores</CardTitle>
        <CardDescription>
          Compare preços e performance entre fornecedores
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fornecedor</TableHead>
              <TableHead>Score</TableHead>
              <TableHead className="text-right">Total Comprado</TableHead>
              <TableHead className="text-right">Ticket Médio</TableHead>
              <TableHead className="text-right">Prazo Médio</TableHead>
              <TableHead>Pontualidade</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {/* Lista de fornecedores comparados */}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};
```

**Arquivos a criar:**
- `admin/src/components/financeiro/contas-a-pagar/SupplierPerformanceProfile.tsx`
- `admin/src/components/financeiro/contas-a-pagar/SupplierComparison.tsx`
- `admin/src/components/financeiro/contas-a-pagar/SupplierScorecard.tsx`
- `admin/src/hooks/useSupplierPerformance.ts`

**Integração no backend:**
- Endpoint: `GET /api/suppliers/{id}/performance`
- Endpoint: `GET /api/suppliers/comparison`
- Job agendado: Atualizar scores de performance semanalmente

---

## Fase 4: Gestão de Descontos e Negociações 💰

**Objetivo:** Otimizar economia através de gestão inteligente de descontos.

### 4.1 Painel de Descontos Disponíveis

**Componente:** `DiscountOpportunitiesPanel.tsx`
```typescript
interface DiscountOpportunity {
  id: string;
  faturaId: string;
  fornecedor: string;
  valorOriginal: number;
  descontoPercentual: number;
  valorDesconto: number;
  valorFinal: number;
  condicao: string;
  dataLimite: Date;
  diasRestantes: number;
  status: 'disponivel' | 'aproveitado' | 'expirado';
}

export const DiscountOpportunitiesPanel: React.FC = () => {
  const opportunities = useDiscountOpportunities();

  const economiaTotal = opportunities
    .filter(o => o.status === 'disponivel')
    .reduce((sum, o) => sum + o.valorDesconto, 0);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Percent className="h-5 w-5" />
              Oportunidades de Desconto
            </CardTitle>
            <CardDescription>
              Aproveite descontos para economizar
            </CardDescription>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Economia Potencial</p>
            <p className="text-2xl font-bold text-green-600">
              R$ {economiaTotal.toLocaleString('pt-BR')}
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {opportunities.map((opp) => (
            <div
              key={opp.id}
              className={cn(
                'border rounded-lg p-4',
                opp.diasRestantes <= 2 && 'border-orange-500 bg-orange-50 dark:bg-orange-950'
              )}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h4 className="font-semibold">{opp.fornecedor}</h4>
                  <p className="text-sm text-muted-foreground">{opp.condicao}</p>
                </div>
                <Badge
                  variant={opp.diasRestantes <= 2 ? 'destructive' : 'default'}
                  className="ml-2"
                >
                  {opp.diasRestantes}d restantes
                </Badge>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-3 text-sm">
                <div>
                  <p className="text-muted-foreground">Valor Original</p>
                  <p className="font-semibold">
                    R$ {opp.valorOriginal.toLocaleString('pt-BR')}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Desconto</p>
                  <p className="font-semibold text-green-600">
                    {opp.descontoPercentual}% (R$ {opp.valorDesconto.toLocaleString('pt-BR')})
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Valor Final</p>
                  <p className="font-semibold">
                    R$ {opp.valorFinal.toLocaleString('pt-BR')}
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                <Button size="sm" onClick={() => handleApplyDiscount(opp.id)}>
                  <Check className="h-4 w-4 mr-2" />
                  Aproveitar Desconto
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleViewInvoice(opp.faturaId)}
                >
                  Ver Fatura
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
```

### 4.2 Histórico de Negociações

**Componente:** `NegotiationHistory.tsx`
```typescript
interface Negotiation {
  id: string;
  faturaId: string;
  fornecedor: string;
  tipo: 'desconto' | 'prazo' | 'parcelamento' | 'condicoes';
  valorOriginal: number;
  valorNegociado: number;
  economia: number;
  status: 'em_negociacao' | 'aceita' | 'recusada';
  negociadoPor: string;
  dataInicio: Date;
  dataFechamento?: Date;
  observacoes: string;
}

export const NegotiationHistory: React.FC = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Histórico de Negociações</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Lista de negociações */}
        </div>
      </CardContent>
    </Card>
  );
};
```

**Arquivos a criar:**
- `admin/src/components/financeiro/contas-a-pagar/DiscountOpportunitiesPanel.tsx`
- `admin/src/components/financeiro/contas-a-pagar/NegotiationHistory.tsx`
- `admin/src/hooks/useDiscountOpportunities.ts`

---

## Fase 5: Conciliação Bancária Automática 🏦

**Objetivo:** Automatizar processo de conciliação de pagamentos com extratos bancários.

### 5.1 Sistema de Conciliação

**Componente:** `BankReconciliation.tsx`
```typescript
interface BankTransaction {
  id: string;
  data: Date;
  descricao: string;
  valor: number;
  tipo: 'debito' | 'credito';
  categoria?: string;
  conciliado: boolean;
  faturaId?: string;
}

interface ReconciliationSuggestion {
  transacaoId: string;
  faturaId: string;
  confianca: number; // 0-100%
  razao: string;
}

export const BankReconciliation: React.FC = () => {
  const [transactions, setTransactions] = useState<BankTransaction[]>([]);
  const [suggestions, setSuggestions] = useState<ReconciliationSuggestion[]>([]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Conciliação Bancária</CardTitle>
        <CardDescription>
          Reconcilie automaticamente seus pagamentos com o extrato bancário
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Interface de conciliação com drag-and-drop */}
        <div className="grid grid-cols-2 gap-4">
          {/* Coluna de transações bancárias */}
          <div>
            <h4 className="font-semibold mb-3">Transações Bancárias</h4>
            {/* Lista de transações */}
          </div>

          {/* Coluna de faturas pendentes */}
          <div>
            <h4 className="font-semibold mb-3">Faturas Pendentes</h4>
            {/* Lista de faturas */}
          </div>
        </div>

        {/* Sugestões de conciliação */}
        <div className="mt-6">
          <h4 className="font-semibold mb-3">Sugestões da IA</h4>
          {suggestions.map((suggestion) => (
            <div key={suggestion.transacaoId} className="border rounded-lg p-3 mb-2">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm">
                    Transação de R$ XXX pode ser relacionada à Fatura #YYY
                  </p>
                  <Progress value={suggestion.confianca} className="mt-2 h-2" />
                  <p className="text-xs text-muted-foreground mt-1">
                    Confiança: {suggestion.confianca}% - {suggestion.razao}
                  </p>
                </div>
                <div className="flex gap-2 ml-4">
                  <Button size="sm">
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="ghost">
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
```

**Arquivos a criar:**
- `admin/src/components/financeiro/contas-a-pagar/BankReconciliation.tsx`
- `admin/src/hooks/useBankReconciliation.ts`

---

## Fase 6: Portal do Fornecedor 🌐

**Objetivo:** Criar portal para fornecedores consultarem status de faturas e pagamentos.

### 6.1 Portal de Consulta

**Rota:** `/portal/fornecedor/[token]`

**Componente:** `SupplierPortal.tsx`
```typescript
export default function SupplierPortal({ params }: { params: Promise<{ token: string }> }) {
  const [token, setToken] = useState<string>('');

  useEffect(() => {
    params.then((p) => setToken(p.token));
  }, [params]);

  const { data, isLoading, isValidToken } = useSupplierPortal(token);

  if (!isValidToken) {
    return <AccessDenied />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 py-12">
      <div className="max-w-6xl mx-auto px-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Portal do Fornecedor</CardTitle>
            <CardDescription>
              Olá, {data.fornecedor.nome}! Consulte o status de suas faturas
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Resumo Financeiro */}
            <div className="grid gap-4 md:grid-cols-4 mb-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Total a Receber</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-blue-600">
                    R$ {data.resumo.totalAReceber.toLocaleString('pt-BR')}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Pendente Aprovação</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-orange-600">
                    {data.resumo.pendenteAprovacao}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Pago este Mês</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-green-600">
                    R$ {data.resumo.pagoMes.toLocaleString('pt-BR')}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Próximo Pagamento</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-lg font-bold">
                    {data.resumo.proximoPagamento
                      ? format(data.resumo.proximoPagamento, 'dd/MM/yyyy')
                      : '-'}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Tabela de Faturas */}
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Número</TableHead>
                  <TableHead>Data Emissão</TableHead>
                  <TableHead>Vencimento</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.faturas.map((fatura) => (
                  <TableRow key={fatura.id}>
                    <TableCell className="font-medium">{fatura.invoice_number}</TableCell>
                    <TableCell>{format(fatura.invoice_date, 'dd/MM/yyyy')}</TableCell>
                    <TableCell>
                      {fatura.due_date ? format(fatura.due_date, 'dd/MM/yyyy') : '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      R$ {fatura.total_value.toLocaleString('pt-BR')}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(fatura.status)}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem onClick={() => handleViewDetails(fatura)}>
                            <Eye className="h-4 w-4 mr-2" />
                            Ver Detalhes
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDownloadPDF(fatura)}>
                            <Download className="h-4 w-4 mr-2" />
                            Baixar PDF
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
```

**Arquivos a criar:**
- `admin/src/app/portal/fornecedor/[token]/page.tsx`
- `admin/src/hooks/useSupplierPortal.ts`
- `admin/src/components/financeiro/contas-a-pagar/GenerateSupplierAccessDialog.tsx`

---

## Priorização e Cronograma Sugerido

### Sprint 1 (2 semanas) - Fase 1
- Dashboard com KPIs avançados
- Relatório de Aging
- Gráficos e visualizações
- **Valor:** Alto impacto na visualização e tomada de decisões

### Sprint 2 (3 semanas) - Fase 2
- Workflow de aprovação multinível
- Painel de aprovações pendentes
- Automação de processos
- **Valor:** Governança e controle financeiro

### Sprint 3 (2 semanas) - Fase 3
- Score de performance de fornecedores
- Comparação de fornecedores
- **Valor:** Gestão estratégica de fornecedores

### Sprint 4 (2 semanas) - Fase 4
- Gestão de descontos
- Histórico de negociações
- **Valor:** Economia e otimização de custos

### Sprint 5 (2 semanas) - Fase 5
- Conciliação bancária automática
- **Valor:** Automação contábil

### Sprint 6 (2 semanas) - Fase 6
- Portal do fornecedor
- **Valor:** Transparência e relacionamento

**Total estimado:** 13 semanas (3 meses)

---

## Métricas de Sucesso

1. **Operacionais:**
   - Redução no DPO (Days Payable Outstanding)
   - Aumento na taxa de aproveitamento de descontos
   - Redução no tempo de aprovação
   - Aumento na precisão da conciliação bancária

2. **Financeiras:**
   - Economia total obtida com descontos
   - Redução em multas e juros por atraso
   - Melhoria no fluxo de caixa

3. **Produtividade:**
   - Tempo economizado em processos manuais
   - Redução em erros de pagamento
   - Automação de conciliação

4. **Relacionamento:**
   - Taxa de uso do portal do fornecedor
   - Satisfação dos fornecedores
   - Redução em disputas

---

## Próximos Passos

1. ⏭️ Revisar e aprovar roadmap
2. ⏭️ Definir prioridades com stakeholders
3. ⏭️ Iniciar Sprint 1 (Fase 1)
4. ⏭️ Configurar integrações bancárias
5. ⏭️ Definir workflows de aprovação padrão
