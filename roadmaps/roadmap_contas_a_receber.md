# Roadmap: Contas a Receber - Melhorias e Funcionalidades Avançadas

## Visão Geral
Este roadmap define as melhorias para transformar o módulo de Contas a Receber em uma solução completa e inteligente, incorporando automação, análise preditiva e melhores práticas de 2025 para gestão financeira.

## Estado Atual
**Localização:** `admin/src/app/admin/financeiro/contas-a-receber/page.tsx`

**Funcionalidades Existentes:**
- 4 cards de resumo (Total a Receber, Vencidos, Recebido este Mês, Próximos 30 dias)
- Tabela básica com colunas: Cliente, Documento, Emissão, Vencimento, Valor, Status, Ações
- Status: Pendente, Vencido, Recebido
- Ações: Ver Detalhes, Registrar Recebimento
- Dados mockados (4 registros de exemplo)

**Limitações Identificadas:**
- Sem relatório de aging (30/60/90/120+ dias)
- Sem análise de risco de clientes
- Sem predição de pagamentos
- Sem automação de cobranças
- Sem indicadores avançados (DSO, taxa inadimplência)
- Sem filtros e buscas avançadas
- Sem visualizações gráficas
- Sem histórico de comunicação com clientes
- Sem integração com formas de pagamento

---

## Fase 1: Dashboard Avançado e KPIs Essenciais 📊 ✅

**Status:** ✅ **CONCLUÍDA**
**Data:** 28/10/2025
**Commit:** `b2408cb2`

**Objetivo:** Transformar a visualização básica em um dashboard analítico completo com métricas essenciais.

**Implementado:**
- ✅ Hook `useARKPIs` com cálculo de 8 indicadores avançados
- ✅ Componente `ARDashboardKPIs` com 8 cards de KPIs
- ✅ Hook `useAgingReport` e `useAgingTotals` para análise de vencimentos
- ✅ Componente `AgingReportTable` com tabela colorida por faixas
- ✅ Componente `ARCharts` com 2 gráficos (Recharts)
- ✅ Componente `TrendBadge` para indicadores de tendência
- ✅ Integração completa na página de Contas a Receber

**Arquivos criados:**
- `admin/src/hooks/useARKPIs.ts`
- `admin/src/hooks/useAgingReport.ts`
- `admin/src/components/ui/TrendBadge.tsx`
- `admin/src/components/financeiro/contas-a-receber/ARDashboardKPIs.tsx`
- `admin/src/components/financeiro/contas-a-receber/AgingReportTable.tsx`
- `admin/src/components/financeiro/contas-a-receber/ARCharts.tsx`

**Arquivos modificados:**
- `admin/src/app/admin/financeiro/contas-a-receber/page.tsx`

---

### 1.1 Indicadores Financeiros Avançados

**Novos KPI Cards:**
```typescript
interface AdvancedKPIs {
  dso: number; // Days Sales Outstanding
  taxaInadimplencia: number; // % de valores vencidos
  ticketMedioAR: number; // Valor médio por título
  previsaoRecebimento30d: number; // Predição próximos 30 dias
  eficienciaCobranca: number; // % de sucesso em cobranças
  concentracaoRisco: number; // % dos top 5 clientes no AR
}
```

**Componente:** `ARDashboardKPIs.tsx`
```typescript
export const ARDashboardKPIs: React.FC = () => {
  const kpis = useARKPIs(); // Hook para calcular KPIs

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">DSO</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{kpis.dso} dias</div>
          <p className="text-xs text-muted-foreground">
            <TrendBadge value={kpis.dsoTrend} />
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Taxa de Inadimplência</CardTitle>
          <AlertTriangle className="h-4 w-4 text-destructive" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-destructive">
            {kpis.taxaInadimplencia.toFixed(1)}%
          </div>
          <p className="text-xs text-muted-foreground">
            R$ {kpis.valorVencido.toLocaleString('pt-BR')} vencidos
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Previsão 30 dias</CardTitle>
          <TrendingUp className="h-4 w-4 text-blue-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-600">
            R$ {kpis.previsaoRecebimento30d.toLocaleString('pt-BR')}
          </div>
          <p className="text-xs text-muted-foreground">
            Baseado em IA preditiva
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Eficiência de Cobrança</CardTitle>
          <Target className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">
            {kpis.eficienciaCobranca.toFixed(1)}%
          </div>
          <p className="text-xs text-muted-foreground">
            Últimos 90 dias
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
```

### 1.2 Relatório de Aging (Vencimentos por Período)

**Componente:** `AgingReportTable.tsx`
```typescript
interface AgingBucket {
  clienteId: string;
  clienteNome: string;
  atual: number; // 0-30 dias
  dias30: number; // 31-60 dias
  dias60: number; // 61-90 dias
  dias90: number; // 91-120 dias
  dias120Plus: number; // 120+ dias
  total: number;
  risco: 'baixo' | 'medio' | 'alto' | 'critico';
}

export const AgingReportTable: React.FC = () => {
  const agingData = useAgingReport();

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
              <TableHead>Cliente</TableHead>
              <TableHead className="text-right">Atual (0-30d)</TableHead>
              <TableHead className="text-right">31-60 dias</TableHead>
              <TableHead className="text-right">61-90 dias</TableHead>
              <TableHead className="text-right">91-120 dias</TableHead>
              <TableHead className="text-right">120+ dias</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead>Risco</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {agingData.map((bucket) => (
              <TableRow key={bucket.clienteId}>
                <TableCell className="font-medium">{bucket.clienteNome}</TableCell>
                <TableCell className="text-right">
                  R$ {bucket.atual.toLocaleString('pt-BR')}
                </TableCell>
                <TableCell className="text-right text-yellow-600">
                  R$ {bucket.dias30.toLocaleString('pt-BR')}
                </TableCell>
                <TableCell className="text-right text-orange-600">
                  R$ {bucket.dias60.toLocaleString('pt-BR')}
                </TableCell>
                <TableCell className="text-right text-red-600">
                  R$ {bucket.dias90.toLocaleString('pt-BR')}
                </TableCell>
                <TableCell className="text-right text-destructive font-bold">
                  R$ {bucket.dias120Plus.toLocaleString('pt-BR')}
                </TableCell>
                <TableCell className="text-right font-bold">
                  R$ {bucket.total.toLocaleString('pt-BR')}
                </TableCell>
                <TableCell>
                  <Badge variant={getRiskVariant(bucket.risco)}>
                    {bucket.risco.toUpperCase()}
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

**Componente:** `ARCharts.tsx` (usando Recharts)
```typescript
export const ARCharts: React.FC = () => {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* Gráfico de Aging - Barras Empilhadas */}
      <Card>
        <CardHeader>
          <CardTitle>Distribuição por Período</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={agingChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="mes" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="atual" stackId="a" fill="#22c55e" name="Atual" />
              <Bar dataKey="dias30" stackId="a" fill="#eab308" name="31-60d" />
              <Bar dataKey="dias60" stackId="a" fill="#f97316" name="61-90d" />
              <Bar dataKey="dias90" stackId="a" fill="#ef4444" name="91-120d" />
              <Bar dataKey="dias120Plus" stackId="a" fill="#991b1b" name="120+d" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Gráfico de Tendência - Linha */}
      <Card>
        <CardHeader>
          <CardTitle>Evolução DSO e Taxa de Inadimplência</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="mes" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Legend />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="dso"
                stroke="#3b82f6"
                name="DSO (dias)"
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="inadimplencia"
                stroke="#ef4444"
                name="Inadimplência (%)"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};
```

**Dependências:**
```bash
npm install recharts
```

**Arquivos a criar:**
- `admin/src/components/financeiro/contas-a-receber/ARDashboardKPIs.tsx`
- `admin/src/components/financeiro/contas-a-receber/AgingReportTable.tsx`
- `admin/src/components/financeiro/contas-a-receber/ARCharts.tsx`
- `admin/src/hooks/useARKPIs.ts`
- `admin/src/hooks/useAgingReport.ts`

**Integração no backend:**
- Endpoint: `GET /api/contas-a-receber/kpis`
- Endpoint: `GET /api/contas-a-receber/aging-report`
- Endpoint: `GET /api/contas-a-receber/trends`

---

## Fase 2: Automação e Workflows de Cobrança 🤖 ✅

**Status:** ✅ **CONCLUÍDA**
**Data:** 28/10/2025
**Commit:** `ef171a2b`

**Objetivo:** Automatizar processos de cobrança, comunicação com clientes e follow-ups.

**Implementado:**
- ✅ Componente `AutomatedReminders` - Sistema completo de regras automáticas
- ✅ Componente `CommunicationTemplates` - Templates para Email, WhatsApp e SMS
- ✅ Componente `CommunicationHistory` - Histórico completo de interações
- ✅ Componente `QuickPaymentDialog` - Dialog melhorado de registro de pagamento
- ✅ Hook `useCommunicationHistory` e `useCommunicationStats`
- ✅ Página dedicada de Automação (/contas-a-receber/automacao)
- ✅ Navegação atualizada com submenu (Dashboard / Automação)

**Arquivos criados:**
- `admin/src/components/financeiro/contas-a-receber/AutomatedReminders.tsx`
- `admin/src/components/financeiro/contas-a-receber/CommunicationTemplates.tsx`
- `admin/src/components/financeiro/contas-a-receber/CommunicationHistory.tsx`
- `admin/src/components/financeiro/contas-a-receber/QuickPaymentDialog.tsx`
- `admin/src/hooks/useCommunicationHistory.ts`
- `admin/src/app/admin/financeiro/contas-a-receber/automacao/page.tsx`

**Arquivos modificados:**
- `admin/src/components/layout/AdminSidebar.tsx`

---

### 2.1 Sistema de Lembretes Automáticos

**Componente:** `AutomatedReminders.tsx`
```typescript
interface ReminderRule {
  id: string;
  nome: string;
  trigger: 'dias_antes_vencimento' | 'dias_apos_vencimento' | 'valor_minimo';
  diasTrigger: number;
  valorMinimo?: number;
  canal: 'email' | 'whatsapp' | 'sms' | 'todos';
  template: string;
  ativo: boolean;
  ultimaExecucao?: Date;
  totalEnviados: number;
}

export const AutomatedReminders: React.FC = () => {
  const [rules, setRules] = useState<ReminderRule[]>([]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Automação de Cobranças</CardTitle>
        <CardDescription>
          Configure lembretes automáticos para clientes
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Lista de regras de automação */}
          {rules.map((rule) => (
            <div key={rule.id} className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex-1">
                <h4 className="font-semibold">{rule.nome}</h4>
                <p className="text-sm text-muted-foreground">
                  {rule.trigger === 'dias_antes_vencimento'
                    ? `${rule.diasTrigger} dias antes do vencimento`
                    : `${rule.diasTrigger} dias após vencimento`}
                  {' via '}{rule.canal}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {rule.totalEnviados} enviados
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={rule.ativo}
                  onCheckedChange={(checked) => toggleRule(rule.id, checked)}
                />
                <Button variant="ghost" size="icon">
                  <Settings className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}

          <Button onClick={openRuleDialog} className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            Nova Regra de Cobrança
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
```

### 2.2 Templates de Comunicação

**Componente:** `CommunicationTemplates.tsx`
```typescript
interface Template {
  id: string;
  nome: string;
  tipo: 'lembrete_prevencimento' | 'cobranca_vencido' | 'acordo_pagamento';
  canal: 'email' | 'whatsapp' | 'sms';
  assunto?: string;
  corpo: string;
  variaveis: string[]; // {cliente_nome}, {valor}, {vencimento}, etc.
}

export const CommunicationTemplates: React.FC = () => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Templates de Comunicação</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="email">
          <TabsList>
            <TabsTrigger value="email">Email</TabsTrigger>
            <TabsTrigger value="whatsapp">WhatsApp</TabsTrigger>
            <TabsTrigger value="sms">SMS</TabsTrigger>
          </TabsList>

          <TabsContent value="email">
            <div className="space-y-4">
              <Label>Assunto</Label>
              <Input placeholder="Ex: Lembrete de Vencimento - {documento}" />

              <Label>Corpo do Email</Label>
              <Textarea
                rows={10}
                placeholder="Olá {cliente_nome},&#10;&#10;Seu título {documento} no valor de {valor} vence em {vencimento}..."
              />

              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">{'{cliente_nome}'}</Badge>
                <Badge variant="outline">{'{documento}'}</Badge>
                <Badge variant="outline">{'{valor}'}</Badge>
                <Badge variant="outline">{'{vencimento}'}</Badge>
                <Badge variant="outline">{'{dias_vencimento}'}</Badge>
              </div>

              <Button>Salvar Template</Button>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
```

### 2.3 Histórico de Comunicação

**Componente:** `CommunicationHistory.tsx`
```typescript
interface Communication {
  id: string;
  clienteId: string;
  contaReceberId: string;
  tipo: 'lembrete' | 'cobranca' | 'acordo' | 'manual';
  canal: 'email' | 'whatsapp' | 'sms' | 'telefone';
  status: 'enviado' | 'entregue' | 'lido' | 'respondido' | 'falha';
  assunto?: string;
  mensagem: string;
  dataEnvio: Date;
  dataLeitura?: Date;
  resposta?: string;
  enviadoPor: 'sistema' | 'usuario';
  usuarioId?: string;
}

export const CommunicationHistory: React.FC<{ contaReceberId: string }> = ({ contaReceberId }) => {
  const communications = useCommunicationHistory(contaReceberId);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Histórico de Comunicação</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px]">
          <div className="space-y-4">
            {communications.map((comm) => (
              <div key={comm.id} className="flex gap-3 p-3 border rounded-lg">
                <div className="flex-shrink-0">
                  {getChannelIcon(comm.canal)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">{comm.assunto || comm.tipo}</span>
                    <Badge variant={getStatusVariant(comm.status)}>
                      {comm.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {comm.mensagem}
                  </p>
                  <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    {formatDistanceToNow(comm.dataEnvio, { addSuffix: true, locale: ptBR })}
                    {comm.dataLeitura && (
                      <>
                        <span>•</span>
                        <Eye className="h-3 w-3" />
                        Lido {formatDistanceToNow(comm.dataLeitura, { addSuffix: true, locale: ptBR })}
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
```

### 2.4 Registro Rápido de Recebimento

**Melhorias no componente existente:**
```typescript
export const QuickPaymentDialog: React.FC<{ contaReceber: ContaReceber }> = ({ contaReceber }) => {
  const [formData, setFormData] = useState({
    valorRecebido: contaReceber.valor,
    dataRecebimento: new Date(),
    formaPagamento: 'pix',
    desconto: 0,
    juros: 0,
    multa: 0,
    observacoes: '',
    enviarComprovante: true,
  });

  const valorFinal = formData.valorRecebido - formData.desconto + formData.juros + formData.multa;

  return (
    <Dialog>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Registrar Recebimento</DialogTitle>
          <DialogDescription>
            {contaReceber.clienteNome} - {contaReceber.documento}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Valor Original</Label>
              <Input value={`R$ ${contaReceber.valor.toLocaleString('pt-BR')}`} disabled />
            </div>
            <div>
              <Label>Data de Recebimento</Label>
              <DatePicker date={formData.dataRecebimento} onChange={setDate} />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>Desconto</Label>
              <Input
                type="number"
                value={formData.desconto}
                onChange={(e) => setFormData({ ...formData, desconto: Number(e.target.value) })}
              />
            </div>
            <div>
              <Label>Juros</Label>
              <Input
                type="number"
                value={formData.juros}
                onChange={(e) => setFormData({ ...formData, juros: Number(e.target.value) })}
              />
            </div>
            <div>
              <Label>Multa</Label>
              <Input
                type="number"
                value={formData.multa}
                onChange={(e) => setFormData({ ...formData, multa: Number(e.target.value) })}
              />
            </div>
          </div>

          <div>
            <Label>Forma de Pagamento</Label>
            <Select value={formData.formaPagamento} onValueChange={(v) => setFormData({ ...formData, formaPagamento: v })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pix">PIX</SelectItem>
                <SelectItem value="boleto">Boleto</SelectItem>
                <SelectItem value="cartao">Cartão de Crédito</SelectItem>
                <SelectItem value="dinheiro">Dinheiro</SelectItem>
                <SelectItem value="transferencia">Transferência</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Observações</Label>
            <Textarea
              rows={3}
              value={formData.observacoes}
              onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              checked={formData.enviarComprovante}
              onCheckedChange={(checked) => setFormData({ ...formData, enviarComprovante: checked })}
            />
            <Label>Enviar comprovante por email para o cliente</Label>
          </div>

          <div className="bg-muted p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="font-semibold">Valor Final</span>
              <span className="text-2xl font-bold text-green-600">
                R$ {valorFinal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline">Cancelar</Button>
          <Button onClick={handleSubmit}>Confirmar Recebimento</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
```

**Arquivos a criar:**
- `admin/src/components/financeiro/contas-a-receber/AutomatedReminders.tsx`
- `admin/src/components/financeiro/contas-a-receber/CommunicationTemplates.tsx`
- `admin/src/components/financeiro/contas-a-receber/CommunicationHistory.tsx`
- `admin/src/components/financeiro/contas-a-receber/QuickPaymentDialog.tsx`
- `admin/src/hooks/useCommunicationHistory.ts`

**Integração no backend:**
- Endpoint: `POST /api/contas-a-receber/reminders/rules`
- Endpoint: `GET /api/contas-a-receber/communications/{id}`
- Endpoint: `POST /api/contas-a-receber/{id}/payment`
- Job agendado: Executar regras de cobrança diariamente

---

## Fase 3: Análise de Risco e Predição com IA 🤖

**Objetivo:** Implementar machine learning para predição de pagamentos e análise de risco de clientes.

### 3.1 Score de Risco do Cliente

**Modelo de Dados:**
```typescript
interface CustomerRiskScore {
  clienteId: string;
  score: number; // 0-100 (0 = alto risco, 100 = baixo risco)
  categoria: 'excelente' | 'bom' | 'regular' | 'ruim' | 'critico';
  fatores: {
    historicoPagamento: number; // % pagamentos em dia
    diasAtrasoMedio: number;
    valorMedioAtraso: number;
    frequenciaCompras: number; // compras/mês
    ticketMedio: number;
    tempoRelacionamento: number; // meses
    protestos: number;
    chequesSemFundo: number;
    ultimaAtualizacao: Date;
  };
  recomendacoes: {
    limiteCreditoSugerido: number;
    prazoMaximoSugerido: number; // dias
    requererAnaliseCredito: boolean;
    requererGarantias: boolean;
  };
  tendencia: 'melhorando' | 'estavel' | 'piorando';
}
```

**Componente:** `CustomerRiskProfile.tsx`
```typescript
export const CustomerRiskProfile: React.FC<{ clienteId: string }> = ({ clienteId }) => {
  const riskScore = useCustomerRiskScore(clienteId);

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-blue-600';
    if (score >= 40) return 'text-yellow-600';
    if (score >= 20) return 'text-orange-600';
    return 'text-red-600';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Análise de Risco do Cliente</CardTitle>
        <CardDescription>
          Atualizado {formatDistanceToNow(riskScore.fatores.ultimaAtualizacao, { addSuffix: true, locale: ptBR })}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Score Principal */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Score de Crédito</p>
              <p className={cn('text-4xl font-bold', getScoreColor(riskScore.score))}>
                {riskScore.score}
              </p>
              <Badge variant={getCategoryVariant(riskScore.categoria)} className="mt-2">
                {riskScore.categoria.toUpperCase()}
              </Badge>
            </div>
            <div className="text-center">
              <CircularProgress value={riskScore.score} />
            </div>
          </div>

          {/* Fatores de Risco */}
          <div>
            <h4 className="font-semibold mb-3">Fatores Analisados</h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Histórico de Pagamento</span>
                <span className="font-semibold">
                  {riskScore.fatores.historicoPagamento.toFixed(1)}% em dia
                </span>
              </div>
              <Progress value={riskScore.fatores.historicoPagamento} />

              <div className="flex items-center justify-between text-sm">
                <span>Atraso Médio</span>
                <span className="font-semibold">
                  {riskScore.fatores.diasAtrasoMedio} dias
                </span>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span>Tempo de Relacionamento</span>
                <span className="font-semibold">
                  {riskScore.fatores.tempoRelacionamento} meses
                </span>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span>Ticket Médio</span>
                <span className="font-semibold">
                  R$ {riskScore.fatores.ticketMedio.toLocaleString('pt-BR')}
                </span>
              </div>
            </div>
          </div>

          {/* Recomendações */}
          <div className="bg-muted p-4 rounded-lg">
            <h4 className="font-semibold mb-2">Recomendações</h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                <span>Limite sugerido:</span>
                <span className="font-semibold">
                  R$ {riskScore.recomendacoes.limiteCreditoSugerido.toLocaleString('pt-BR')}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>Prazo máximo:</span>
                <span className="font-semibold">
                  {riskScore.recomendacoes.prazoMaximoSugerido} dias
                </span>
              </div>
              {riskScore.recomendacoes.requererAnaliseCredito && (
                <Alert variant="warning">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Recomenda-se análise de crédito detalhada antes de novas vendas
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </div>

          {/* Tendência */}
          <div className="flex items-center gap-2">
            {riskScore.tendencia === 'melhorando' && (
              <>
                <TrendingUp className="h-5 w-5 text-green-600" />
                <span className="text-sm text-green-600 font-semibold">Perfil melhorando</span>
              </>
            )}
            {riskScore.tendencia === 'piorando' && (
              <>
                <TrendingDown className="h-5 w-5 text-red-600" />
                <span className="text-sm text-red-600 font-semibold">Perfil piorando</span>
              </>
            )}
            {riskScore.tendencia === 'estavel' && (
              <>
                <Minus className="h-5 w-5 text-blue-600" />
                <span className="text-sm text-blue-600 font-semibold">Perfil estável</span>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
```

### 3.2 Predição de Recebimentos

**Componente:** `PaymentPrediction.tsx`
```typescript
interface PaymentPrediction {
  contaReceberId: string;
  probabilidadePagamento: number; // 0-100%
  dataPrevisaoPagamento: Date;
  confiancaPrevisao: 'alta' | 'media' | 'baixa';
  fatoresInfluencia: {
    historico: number; // peso do histórico
    valor: number; // peso do valor
    relacionamento: number; // peso do relacionamento
    sazonalidade: number; // peso da sazonalidade
  };
  acoesSugeridas: string[];
}

export const PaymentPrediction: React.FC<{ contaReceberId: string }> = ({ contaReceberId }) => {
  const prediction = usePaymentPrediction(contaReceberId);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Predição de Pagamento (IA)</CardTitle>
        <CardDescription>
          Análise preditiva baseada em machine learning
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Probabilidade de Pagamento</p>
              <p className={cn(
                'text-3xl font-bold',
                prediction.probabilidadePagamento >= 70 ? 'text-green-600' :
                prediction.probabilidadePagamento >= 40 ? 'text-yellow-600' :
                'text-red-600'
              )}>
                {prediction.probabilidadePagamento}%
              </p>
            </div>
            <Badge variant={prediction.confiancaPrevisao === 'alta' ? 'default' : 'secondary'}>
              Confiança {prediction.confiancaPrevisao}
            </Badge>
          </div>

          <div>
            <p className="text-sm text-muted-foreground">Data Prevista de Pagamento</p>
            <p className="text-lg font-semibold">
              {format(prediction.dataPrevisaoPagamento, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
            </p>
          </div>

          <div>
            <h4 className="text-sm font-semibold mb-2">Fatores de Influência</h4>
            <div className="space-y-2">
              {Object.entries(prediction.fatoresInfluencia).map(([fator, peso]) => (
                <div key={fator}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="capitalize">{fator}</span>
                    <span>{peso}%</span>
                  </div>
                  <Progress value={peso} />
                </div>
              ))}
            </div>
          </div>

          {prediction.acoesSugeridas.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold mb-2">Ações Sugeridas</h4>
              <ul className="space-y-1">
                {prediction.acoesSugeridas.map((acao, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
                    <span>{acao}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
```

### 3.3 Alertas Inteligentes

**Componente:** `IntelligentAlerts.tsx`
```typescript
interface SmartAlert {
  id: string;
  tipo: 'risco_inadimplencia' | 'concentracao_cliente' | 'dso_alto' | 'titulo_critico';
  severidade: 'info' | 'warning' | 'critical';
  titulo: string;
  descricao: string;
  entidadeId: string; // clienteId ou contaReceberId
  entidadeNome: string;
  valor?: number;
  dataGeracao: Date;
  acoesSugeridas: Array<{
    label: string;
    action: string;
    icon: React.ComponentType;
  }>;
  lido: boolean;
}

export const IntelligentAlerts: React.FC = () => {
  const alerts = useSmartAlerts();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Alertas Inteligentes</CardTitle>
        <CardDescription>
          {alerts.filter(a => !a.lido).length} alertas não lidos
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[500px]">
          <div className="space-y-3">
            {alerts.map((alert) => (
              <Alert
                key={alert.id}
                variant={alert.severidade === 'critical' ? 'destructive' : 'default'}
                className={cn(!alert.lido && 'border-l-4 border-l-primary')}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-0.5">
                    {alert.severidade === 'critical' && <AlertCircle className="h-5 w-5" />}
                    {alert.severidade === 'warning' && <AlertTriangle className="h-5 w-5" />}
                    {alert.severidade === 'info' && <Info className="h-5 w-5" />}
                  </div>
                  <div className="flex-1">
                    <AlertTitle>{alert.titulo}</AlertTitle>
                    <AlertDescription className="mt-2">
                      {alert.descricao}
                    </AlertDescription>
                    {alert.valor && (
                      <p className="mt-2 font-semibold">
                        Valor: R$ {alert.valor.toLocaleString('pt-BR')}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-2 mt-3">
                      {alert.acoesSugeridas.map((acao, index) => (
                        <Button
                          key={index}
                          variant="outline"
                          size="sm"
                          onClick={() => handleAction(alert.id, acao.action)}
                        >
                          <acao.icon className="h-4 w-4 mr-2" />
                          {acao.label}
                        </Button>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      {formatDistanceToNow(alert.dataGeracao, { addSuffix: true, locale: ptBR })}
                    </p>
                  </div>
                </div>
              </Alert>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
```

**Arquivos a criar:**
- `admin/src/components/financeiro/contas-a-receber/CustomerRiskProfile.tsx`
- `admin/src/components/financeiro/contas-a-receber/PaymentPrediction.tsx`
- `admin/src/components/financeiro/contas-a-receber/IntelligentAlerts.tsx`
- `admin/src/hooks/useCustomerRiskScore.ts`
- `admin/src/hooks/usePaymentPrediction.ts`
- `admin/src/hooks/useSmartAlerts.ts`

**Integração no backend (IA/ML):**
- Endpoint: `GET /api/clientes/{id}/risk-score`
- Endpoint: `GET /api/contas-a-receber/{id}/prediction`
- Endpoint: `GET /api/alertas/inteligentes`
- Modelo ML: Treinamento periódico com histórico de pagamentos
- Features para o modelo: histórico, valor, prazo, cliente, sazonalidade

---

## Fase 4: Filtros Avançados e Busca Inteligente 🔍 ✅

**Status:** ✅ **CONCLUÍDA**
**Data:** 28/10/2025
**Commit:** `dcb2d1e0`

**Objetivo:** Implementar sistema completo de filtros, busca e exportação de dados.

**Implementado:**
- ✅ Componente `MultiSelect` - Seleção múltipla com badges
- ✅ Componente `AdvancedFilters` - Sistema completo com 9 critérios de filtro
- ✅ Componente `SavedViews` - Gerenciamento de visualizações salvas com favoritos
- ✅ Componente `ExportDialog` - Exportação em XLSX, CSV e PDF
- ✅ Hook `useARFilters` - Lógica completa de filtragem e ordenação
- ✅ Integração completa na página principal

**Arquivos criados:**
- `admin/src/components/ui/multi-select.tsx`
- `admin/src/components/financeiro/contas-a-receber/AdvancedFilters.tsx`
- `admin/src/components/financeiro/contas-a-receber/SavedViews.tsx`
- `admin/src/components/financeiro/contas-a-receber/ExportDialog.tsx`
- `admin/src/hooks/useARFilters.ts`

**Arquivos modificados:**
- `admin/src/app/admin/financeiro/contas-a-receber/page.tsx`

**Recursos implementados:**
- 9 critérios de filtro (status, clientes, risco, vencimento, forma pagamento, datas, valores)
- Busca rápida por texto
- 6 opções de ordenação
- Visualizações salvas com favoritos
- Exportação configurável (formato, escopo, colunas)
- Interface collapsible
- Badges para filtros ativos
- Contador de resultados

---

### 4.1 Painel de Filtros Avançados

**Componente:** `AdvancedFilters.tsx`
```typescript
interface ARFilters {
  busca: string;
  status: ('pendente' | 'vencido' | 'recebido' | 'cancelado')[];
  clientes: string[];
  dataEmissaoInicio?: Date;
  dataEmissaoFim?: Date;
  dataVencimentoInicio?: Date;
  dataVencimentoFim?: Date;
  valorMin?: number;
  valorMax?: number;
  diasAtrasoMin?: number;
  diasAtrasoMax?: number;
  formasPagamento: string[];
  riscoCliente: ('excelente' | 'bom' | 'regular' | 'ruim' | 'critico')[];
  agingBucket: ('atual' | '30-60' | '60-90' | '90-120' | '120+')[];
  ordenacao: 'vencimento_asc' | 'vencimento_desc' | 'valor_asc' | 'valor_desc' | 'cliente_asc';
}

export const AdvancedFilters: React.FC = () => {
  const [filters, setFilters] = useState<ARFilters>({
    busca: '',
    status: [],
    clientes: [],
    formasPagamento: [],
    riscoCliente: [],
    agingBucket: [],
    ordenacao: 'vencimento_asc',
  });

  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="space-y-4">
      {/* Barra de busca rápida */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por cliente, documento, nota fiscal..."
            value={filters.busca}
            onChange={(e) => setFilters({ ...filters, busca: e.target.value })}
            className="pl-10"
          />
        </div>
        <Button variant="outline" onClick={() => setIsOpen(!isOpen)}>
          <Filter className="h-4 w-4 mr-2" />
          Filtros Avançados
          {getActiveFiltersCount(filters) > 0 && (
            <Badge variant="secondary" className="ml-2">
              {getActiveFiltersCount(filters)}
            </Badge>
          )}
        </Button>
        <Button variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Exportar
        </Button>
      </div>

      {/* Painel de filtros avançados */}
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleContent>
          <Card>
            <CardHeader>
              <CardTitle>Filtros Avançados</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {/* Status */}
                <div>
                  <Label>Status</Label>
                  <MultiSelect
                    options={[
                      { value: 'pendente', label: 'Pendente' },
                      { value: 'vencido', label: 'Vencido' },
                      { value: 'recebido', label: 'Recebido' },
                      { value: 'cancelado', label: 'Cancelado' },
                    ]}
                    value={filters.status}
                    onChange={(v) => setFilters({ ...filters, status: v })}
                  />
                </div>

                {/* Período de Vencimento */}
                <div>
                  <Label>Vencimento - Início</Label>
                  <DatePicker
                    date={filters.dataVencimentoInicio}
                    onChange={(date) => setFilters({ ...filters, dataVencimentoInicio: date })}
                  />
                </div>
                <div>
                  <Label>Vencimento - Fim</Label>
                  <DatePicker
                    date={filters.dataVencimentoFim}
                    onChange={(date) => setFilters({ ...filters, dataVencimentoFim: date })}
                  />
                </div>

                {/* Faixa de Valor */}
                <div>
                  <Label>Valor Mínimo</Label>
                  <Input
                    type="number"
                    placeholder="R$ 0,00"
                    value={filters.valorMin}
                    onChange={(e) => setFilters({ ...filters, valorMin: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <Label>Valor Máximo</Label>
                  <Input
                    type="number"
                    placeholder="R$ 0,00"
                    value={filters.valorMax}
                    onChange={(e) => setFilters({ ...filters, valorMax: Number(e.target.value) })}
                  />
                </div>

                {/* Risco do Cliente */}
                <div>
                  <Label>Risco do Cliente</Label>
                  <MultiSelect
                    options={[
                      { value: 'excelente', label: 'Excelente' },
                      { value: 'bom', label: 'Bom' },
                      { value: 'regular', label: 'Regular' },
                      { value: 'ruim', label: 'Ruim' },
                      { value: 'critico', label: 'Crítico' },
                    ]}
                    value={filters.riscoCliente}
                    onChange={(v) => setFilters({ ...filters, riscoCliente: v })}
                  />
                </div>

                {/* Aging Bucket */}
                <div>
                  <Label>Período de Vencimento</Label>
                  <MultiSelect
                    options={[
                      { value: 'atual', label: '0-30 dias (Atual)' },
                      { value: '30-60', label: '31-60 dias' },
                      { value: '60-90', label: '61-90 dias' },
                      { value: '90-120', label: '91-120 dias' },
                      { value: '120+', label: '120+ dias' },
                    ]}
                    value={filters.agingBucket}
                    onChange={(v) => setFilters({ ...filters, agingBucket: v })}
                  />
                </div>

                {/* Ordenação */}
                <div>
                  <Label>Ordenar por</Label>
                  <Select value={filters.ordenacao} onValueChange={(v) => setFilters({ ...filters, ordenacao: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="vencimento_asc">Vencimento (Mais próximo)</SelectItem>
                      <SelectItem value="vencimento_desc">Vencimento (Mais distante)</SelectItem>
                      <SelectItem value="valor_asc">Valor (Menor)</SelectItem>
                      <SelectItem value="valor_desc">Valor (Maior)</SelectItem>
                      <SelectItem value="cliente_asc">Cliente (A-Z)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex gap-2 mt-4">
                <Button onClick={handleApplyFilters}>
                  Aplicar Filtros
                </Button>
                <Button variant="outline" onClick={handleClearFilters}>
                  Limpar Filtros
                </Button>
              </div>
            </CardContent>
          </Card>
        </CollapsibleContent>
      </Collapsible>

      {/* Tags de filtros ativos */}
      {getActiveFiltersCount(filters) > 0 && (
        <div className="flex flex-wrap gap-2">
          {renderActiveFilterTags(filters, setFilters)}
        </div>
      )}
    </div>
  );
};
```

### 4.2 Visualizações Salvas

**Componente:** `SavedViews.tsx`
```typescript
interface SavedView {
  id: string;
  nome: string;
  descricao?: string;
  filtros: ARFilters;
  compartilhada: boolean;
  criadoPor: string;
  dataCriacao: Date;
  ultimaAtualizacao: Date;
}

export const SavedViews: React.FC = () => {
  const [views, setViews] = useState<SavedView[]>([]);
  const [selectedView, setSelectedView] = useState<string | null>(null);

  return (
    <div className="flex items-center gap-2">
      <Select value={selectedView} onValueChange={handleLoadView}>
        <SelectTrigger className="w-[250px]">
          <SelectValue placeholder="Visualizações Salvas" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>Minhas Visualizações</SelectLabel>
            {views.filter(v => !v.compartilhada).map(view => (
              <SelectItem key={view.id} value={view.id}>
                {view.nome}
              </SelectItem>
            ))}
          </SelectGroup>
          <SelectGroup>
            <SelectLabel>Compartilhadas</SelectLabel>
            {views.filter(v => v.compartilhada).map(view => (
              <SelectItem key={view.id} value={view.id}>
                {view.nome}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>

      <Button variant="outline" size="icon" onClick={handleSaveCurrentView}>
        <Save className="h-4 w-4" />
      </Button>
    </div>
  );
};
```

### 4.3 Exportação de Dados

**Componente:** `ExportDialog.tsx`
```typescript
export const ExportDialog: React.FC = () => {
  const [format, setFormat] = useState<'xlsx' | 'csv' | 'pdf'>('xlsx');
  const [includeCharts, setIncludeCharts] = useState(true);
  const [fields, setFields] = useState<string[]>([
    'cliente', 'documento', 'emissao', 'vencimento', 'valor', 'status'
  ]);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Exportar
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Exportar Contas a Receber</DialogTitle>
          <DialogDescription>
            Escolha o formato e os campos para exportação
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Formato</Label>
            <RadioGroup value={format} onValueChange={setFormat}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="xlsx" id="xlsx" />
                <Label htmlFor="xlsx">Excel (.xlsx)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="csv" id="csv" />
                <Label htmlFor="csv">CSV (.csv)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="pdf" id="pdf" />
                <Label htmlFor="pdf">PDF (.pdf)</Label>
              </div>
            </RadioGroup>
          </div>

          {format === 'pdf' && (
            <div className="flex items-center space-x-2">
              <Switch checked={includeCharts} onCheckedChange={setIncludeCharts} />
              <Label>Incluir gráficos e visualizações</Label>
            </div>
          )}

          <div>
            <Label>Campos a Exportar</Label>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {availableFields.map(field => (
                <div key={field.value} className="flex items-center space-x-2">
                  <Checkbox
                    checked={fields.includes(field.value)}
                    onCheckedChange={(checked) => handleFieldToggle(field.value, checked)}
                  />
                  <Label>{field.label}</Label>
                </div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline">Cancelar</Button>
          <Button onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
```

**Arquivos a criar:**
- `admin/src/components/financeiro/contas-a-receber/AdvancedFilters.tsx`
- `admin/src/components/financeiro/contas-a-receber/SavedViews.tsx`
- `admin/src/components/financeiro/contas-a-receber/ExportDialog.tsx`
- `admin/src/components/ui/multi-select.tsx`

**Integração no backend:**
- Endpoint: `GET /api/contas-a-receber?filters={json}`
- Endpoint: `POST /api/contas-a-receber/export`
- Endpoint: `POST /api/contas-a-receber/views`
- Endpoint: `GET /api/contas-a-receber/views`

---

## Fase 5: Integração com Meios de Pagamento 💳 ✅

**Status:** ✅ **CONCLUÍDA**
**Data:** 28/10/2025
**Commit:** `41d88106`

**Objetivo:** Integrar com plataformas de pagamento para automatizar recebimentos.

**Implementado:**
- ✅ Hook `usePixCharge` - Geração e gerenciamento de cobranças PIX
- ✅ Hook `useBoleto` - Geração e gerenciamento de boletos bancários
- ✅ Componente `PixIntegration` - Interface completa de PIX com QR Code
- ✅ Componente `BoletoIntegration` - Interface completa de boleto com configurações
- ✅ Página `/pagamentos` - Interface unificada com tabs para PIX e Boleto
- ✅ Auto-refresh de status (PIX: 10s, Boleto: 30s)
- ✅ Copy-to-clipboard para códigos de pagamento
- ✅ Envio simulado de emails com meios de pagamento
- ✅ Atualização do menu lateral com "Meios de Pagamento"

**Arquivos criados:**
- `admin/src/hooks/usePixCharge.ts`
- `admin/src/hooks/useBoleto.ts`
- `admin/src/components/financeiro/contas-a-receber/PixIntegration.tsx`
- `admin/src/components/financeiro/contas-a-receber/BoletoIntegration.tsx`
- `admin/src/app/admin/financeiro/contas-a-receber/pagamentos/page.tsx`

**Arquivos modificados:**
- `admin/src/components/layout/AdminSidebar.tsx`

---

### 5.1 Integração com PIX

**Componente:** `PixIntegration.tsx`
```typescript
interface PixCharge {
  id: string;
  contaReceberId: string;
  txid: string;
  qrCode: string;
  qrCodeBase64: string;
  valor: number;
  status: 'ativo' | 'concluido' | 'removido_pelo_usuario_recebedor';
  dataExpiracao: Date;
  pagador?: {
    nome: string;
    cpfCnpj: string;
  };
}

export const PixIntegration: React.FC<{ contaReceber: ContaReceber }> = ({ contaReceber }) => {
  const [pixCharge, setPixCharge] = useState<PixCharge | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGeneratePixCharge = async () => {
    setIsGenerating(true);
    try {
      const charge = await api.post('/api/pix/charges', {
        contaReceberId: contaReceber.id,
        valor: contaReceber.valor,
        expiracao: 3600, // 1 hora
      });
      setPixCharge(charge.data);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pagamento via PIX</CardTitle>
        <CardDescription>
          Gere um QR Code PIX para facilitar o pagamento
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!pixCharge ? (
          <Button onClick={handleGeneratePixCharge} disabled={isGenerating}>
            <QrCode className="h-4 w-4 mr-2" />
            {isGenerating ? 'Gerando...' : 'Gerar QR Code PIX'}
          </Button>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-center">
              <img src={pixCharge.qrCodeBase64} alt="QR Code PIX" className="w-64 h-64" />
            </div>

            <div>
              <Label>Código PIX Copia e Cola</Label>
              <div className="flex gap-2 mt-1">
                <Input value={pixCharge.qrCode} readOnly />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleCopyToClipboard(pixCharge.qrCode)}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <span>Status:</span>
              <Badge variant={pixCharge.status === 'concluido' ? 'success' : 'default'}>
                {pixCharge.status}
              </Badge>
            </div>

            <div className="flex items-center justify-between text-sm">
              <span>Expira em:</span>
              <span>{formatDistanceToNow(pixCharge.dataExpiracao, { addSuffix: true, locale: ptBR })}</span>
            </div>

            <Button variant="outline" onClick={() => handleSendPixByEmail(pixCharge)}>
              <Mail className="h-4 w-4 mr-2" />
              Enviar QR Code por Email
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
```

### 5.2 Integração com Boleto

**Componente:** `BoletoIntegration.tsx`
```typescript
interface Boleto {
  id: string;
  contaReceberId: string;
  nossoNumero: string;
  linhaDigitavel: string;
  codigoBarras: string;
  urlPdf: string;
  dataVencimento: Date;
  valor: number;
  multa: number;
  juros: number;
  status: 'registrado' | 'pago' | 'cancelado' | 'vencido';
}

export const BoletoIntegration: React.FC<{ contaReceber: ContaReceber }> = ({ contaReceber }) => {
  const [boleto, setBoleto] = useState<Boleto | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateBoleto = async () => {
    setIsGenerating(true);
    try {
      const boletoData = await api.post('/api/boletos', {
        contaReceberId: contaReceber.id,
        valor: contaReceber.valor,
        vencimento: contaReceber.dataVencimento,
        multa: 2, // 2%
        juros: 0.033, // 1% ao mês = 0.033% ao dia
      });
      setBoleto(boletoData.data);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Boleto Bancário</CardTitle>
        <CardDescription>
          Gere um boleto para pagamento
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!boleto ? (
          <Button onClick={handleGenerateBoleto} disabled={isGenerating}>
            <FileText className="h-4 w-4 mr-2" />
            {isGenerating ? 'Gerando...' : 'Gerar Boleto'}
          </Button>
        ) : (
          <div className="space-y-4">
            <div>
              <Label>Nosso Número</Label>
              <Input value={boleto.nossoNumero} readOnly />
            </div>

            <div>
              <Label>Linha Digitável</Label>
              <div className="flex gap-2">
                <Input value={boleto.linhaDigitavel} readOnly className="font-mono" />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleCopyToClipboard(boleto.linhaDigitavel)}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <span>Status:</span>
              <Badge variant={boleto.status === 'pago' ? 'success' : 'default'}>
                {boleto.status}
              </Badge>
            </div>

            <div className="flex gap-2">
              <Button onClick={() => window.open(boleto.urlPdf, '_blank')}>
                <FileText className="h-4 w-4 mr-2" />
                Visualizar PDF
              </Button>
              <Button variant="outline" onClick={() => handleSendBoletoByEmail(boleto)}>
                <Mail className="h-4 w-4 mr-2" />
                Enviar por Email
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
```

### 5.3 Webhook para Confirmação Automática

**Backend Integration:**
```typescript
// backend/src/controllers/webhook.controller.ts
export class WebhookController {
  // Webhook PIX (exemplo: Banco do Brasil, Inter, Mercado Pago)
  async handlePixWebhook(req: Request, res: Response) {
    const { txid, status, valor, pagador } = req.body;

    if (status === 'CONCLUIDA') {
      // Buscar conta a receber pelo txid
      const pixCharge = await PixCharge.findOne({ txid });
      if (pixCharge) {
        // Registrar recebimento automaticamente
        await this.contasAReceberService.registrarRecebimento({
          contaReceberId: pixCharge.contaReceberId,
          valor,
          dataRecebimento: new Date(),
          formaPagamento: 'pix',
          observacoes: `Pagamento automático via PIX - ${pagador.nome}`,
        });

        // Enviar notificação
        await this.notificationService.send({
          tipo: 'recebimento_confirmado',
          contaReceberId: pixCharge.contaReceberId,
        });
      }
    }

    res.status(200).send('OK');
  }

  // Webhook Boleto (exemplo: Banco do Brasil, Bradesco)
  async handleBoletoWebhook(req: Request, res: Response) {
    const { nossoNumero, status, valorPago, dataPagamento } = req.body;

    if (status === 'LIQUIDADO') {
      const boleto = await Boleto.findOne({ nossoNumero });
      if (boleto) {
        await this.contasAReceberService.registrarRecebimento({
          contaReceberId: boleto.contaReceberId,
          valor: valorPago,
          dataRecebimento: new Date(dataPagamento),
          formaPagamento: 'boleto',
          observacoes: `Pagamento automático via Boleto - ${nossoNumero}`,
        });
      }
    }

    res.status(200).send('OK');
  }
}
```

**Arquivos a criar:**
- `admin/src/components/financeiro/contas-a-receber/PixIntegration.tsx`
- `admin/src/components/financeiro/contas-a-receber/BoletoIntegration.tsx`
- `backend/src/controllers/pix.controller.ts`
- `backend/src/controllers/boleto.controller.ts`
- `backend/src/controllers/webhook.controller.ts`
- `backend/src/services/pix.service.ts`
- `backend/src/services/boleto.service.ts`

**Integrações necessárias:**
- PIX: Banco do Brasil API, Inter API, ou Mercado Pago
- Boleto: Banco do Brasil, Bradesco, Itaú (via API)

---

## Fase 6: Portal do Cliente (Self-Service) 🌐 ✅

**Status:** ✅ **CONCLUÍDA**
**Data:** 28/10/2025
**Commit:** [Em andamento]

**Objetivo:** Criar portal para clientes consultarem títulos e realizarem pagamentos.

**Implementado:**
- ✅ Hook `useCustomerPortal` - Carregamento e validação de dados do portal
- ✅ Hook `useGeneratePortalToken` - Geração de tokens de acesso seguros
- ✅ Página `/portal/cliente/[token]` - Portal público do cliente
- ✅ Componente `GeneratePortalAccessDialog` - Dialog para geração de acesso
- ✅ Resumo financeiro com 4 cards (Total em Aberto, Vencido, Vencidos, Próximo Vencimento)
- ✅ Tabela completa de títulos do cliente
- ✅ Dropdown de ações por título (Ver Detalhes, Gerar PIX, Gerar Boleto, Baixar NF)
- ✅ Sistema de tokens com validade de 7 dias
- ✅ Envio simulado de email com link de acesso
- ✅ Copy-to-clipboard para link do portal
- ✅ Integração no contas a receber (botão "Gerar Acesso Portal")
- ✅ Mock data com 2 tokens demo

**Arquivos criados:**
- `admin/src/hooks/useCustomerPortal.ts`
- `admin/src/app/portal/cliente/[token]/page.tsx`
- `admin/src/components/financeiro/contas-a-receber/GeneratePortalAccessDialog.tsx`

**Arquivos modificados:**
- `admin/src/app/admin/financeiro/contas-a-receber/page.tsx`

**Tokens de demonstração:**
- `demo-token-abc123` - Empresa ABC Ltda (3 títulos)
- `demo-token-xyz456` - Comercial XYZ S.A. (2 títulos)

---

### 6.1 Portal de Consulta

**Rota:** `/portal/cliente/[token]`

**Componente:** `CustomerPortal.tsx`
```typescript
export default function CustomerPortal({ params }: { params: { token: string } }) {
  const { cliente, titulos } = useCustomerPortalData(params.token);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12">
      <div className="max-w-6xl mx-auto px-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Portal do Cliente</CardTitle>
            <CardDescription>
              Olá, {cliente.nome}! Consulte seus títulos e realize pagamentos
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Resumo Financeiro */}
            <div className="grid gap-4 md:grid-cols-3 mb-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Total em Aberto</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-red-600">
                    R$ {calcularTotalAberto(titulos).toLocaleString('pt-BR')}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Títulos Vencidos</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-orange-600">
                    {titulos.filter(t => t.status === 'vencido').length}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Próximo Vencimento</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-lg font-bold">
                    {format(getProximoVencimento(titulos), 'dd/MM/yyyy')}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Tabela de Títulos */}
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Documento</TableHead>
                  <TableHead>Emissão</TableHead>
                  <TableHead>Vencimento</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {titulos.map((titulo) => (
                  <TableRow key={titulo.id}>
                    <TableCell className="font-medium">{titulo.documento}</TableCell>
                    <TableCell>{format(titulo.dataEmissao, 'dd/MM/yyyy')}</TableCell>
                    <TableCell>{format(titulo.dataVencimento, 'dd/MM/yyyy')}</TableCell>
                    <TableCell className="text-right">
                      R$ {titulo.valor.toLocaleString('pt-BR')}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusVariant(titulo.status)}>
                        {titulo.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem onClick={() => handleViewDetails(titulo)}>
                            <Eye className="h-4 w-4 mr-2" />
                            Ver Detalhes
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleGeneratePix(titulo)}>
                            <QrCode className="h-4 w-4 mr-2" />
                            Gerar PIX
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleGenerateBoleto(titulo)}>
                            <FileText className="h-4 w-4 mr-2" />
                            Gerar Boleto
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDownloadNF(titulo)}>
                            <Download className="h-4 w-4 mr-2" />
                            Baixar NF
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

### 6.2 Geração de Token de Acesso

**Backend:**
```typescript
// backend/src/services/customer-portal.service.ts
export class CustomerPortalService {
  async generateAccessToken(clienteId: string, email: string): Promise<string> {
    const token = crypto.randomBytes(32).toString('hex');

    await PortalToken.create({
      token,
      clienteId,
      email,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 dias
    });

    // Enviar email com link de acesso
    await this.emailService.send({
      to: email,
      subject: 'Acesso ao Portal do Cliente',
      template: 'portal-access',
      data: {
        link: `${process.env.FRONTEND_URL}/portal/cliente/${token}`,
      },
    });

    return token;
  }

  async validateToken(token: string): Promise<PortalToken | null> {
    const portalToken = await PortalToken.findOne({
      token,
      expiresAt: { $gt: new Date() },
    });

    return portalToken;
  }
}
```

**Arquivos a criar:**
- `admin/src/app/portal/cliente/[token]/page.tsx`
- `admin/src/components/portal/CustomerPortal.tsx`
- `admin/src/hooks/useCustomerPortalData.ts`
- `backend/src/services/customer-portal.service.ts`
- `backend/src/models/PortalToken.ts`

---

## Priorização e Cronograma Sugerido

### Sprint 1 (2 semanas) - Fase 1
- Dashboard com KPIs avançados
- Relatório de Aging
- Gráficos e visualizações
- **Valor:** Alto impacto na visualização e tomada de decisões

### Sprint 2 (2 semanas) - Fase 2
- Sistema de lembretes automáticos
- Templates de comunicação
- Histórico de comunicação
- Registro rápido de recebimento melhorado
- **Valor:** Automação de processos manuais

### Sprint 3 (3 semanas) - Fase 3
- Score de risco do cliente
- Predição de recebimentos (IA/ML)
- Alertas inteligentes
- **Valor:** Insights preditivos e gestão de risco

### Sprint 4 (2 semanas) - Fase 4
- Filtros avançados
- Visualizações salvas
- Exportação de dados
- **Valor:** Usabilidade e produtividade

### Sprint 5 (3 semanas) - Fase 5
- Integração PIX
- Integração Boleto
- Webhooks para confirmação automática
- **Valor:** Automação completa do recebimento

### Sprint 6 (2 semanas) - Fase 6
- Portal do cliente
- Geração de tokens de acesso
- Self-service de pagamentos
- **Valor:** Experiência do cliente e redução de atrito

**Total estimado:** 14 semanas (3,5 meses)

---

## Dependências Técnicas

### Frontend:
```json
{
  "dependencies": {
    "recharts": "^2.10.3",
    "date-fns": "^3.0.0",
    "@radix-ui/react-collapsible": "^1.0.3",
    "@radix-ui/react-radio-group": "^1.1.3"
  }
}
```

### Backend:
```json
{
  "dependencies": {
    "@tensorflow/tfjs-node": "^4.15.0",
    "node-cron": "^3.0.3",
    "qrcode": "^1.5.3",
    "pdf-lib": "^1.17.1",
    "nodemailer": "^6.9.7"
  }
}
```

---

## Métricas de Sucesso

Após implementação completa, medir:

1. **Operacionais:**
   - Redução no DSO (Days Sales Outstanding)
   - Aumento na taxa de recebimento em dia
   - Redução no tempo de cobrança manual
   - Aumento na eficiência de cobrança

2. **Financeiras:**
   - Redução na taxa de inadimplência
   - Aumento no fluxo de caixa previsível
   - Redução em provisões para devedores duvidosos

3. **Produtividade:**
   - Tempo economizado em tarefas manuais
   - Redução em ligações/emails de cobrança
   - Automação de processos repetitivos

4. **Experiência do Cliente:**
   - Taxa de uso do portal do cliente
   - Satisfação com opções de pagamento
   - Redução em disputas/reclamações

---

## Próximos Passos

1. ✅ Revisar e aprovar roadmap
2. ⏭️ Definir prioridades com stakeholders
3. ⏭️ Iniciar Sprint 1 (Fase 1)
4. ⏭️ Configurar integrações bancárias (pesquisa de APIs)
5. ⏭️ Definir estratégia de ML/IA (dados históricos necessários)
