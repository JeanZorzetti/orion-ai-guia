# Roadmap: Implementação Completa de Fluxo de Caixa

**Objetivo:** Implementar todas as 19 funcionalidades da página de Fluxo de Caixa com dados reais do backend.

**Status Atual:** 15/19 funcionalidades implementadas (79%)

---

## ✅ Funcionalidades Já Implementadas (15/19)

### 1. ✅ Saldo Mínimo Projetado
- **Frontend:** Componente `CashFlowProjection`
- **Backend:** Endpoint `GET /api/v1/cash-flow/projection`
- **Hook:** `useCashFlowProjection`
- **Status:** Totalmente funcional

### 2. ✅ Saldo Máximo Projetado
- **Frontend:** Componente `CashFlowProjection`
- **Backend:** Endpoint `GET /api/v1/cash-flow/projection`
- **Hook:** `useCashFlowProjection`
- **Status:** Totalmente funcional

### 3. ✅ Variação
- **Frontend:** Componente `CashFlowProjection` (cards de estatísticas)
- **Backend:** Calculado no frontend a partir de min/max
- **Hook:** `useCashFlowProjection`
- **Status:** Totalmente funcional

### 14. ✅ Contas Bancárias
- **Frontend:** Componente `MultiAccountManagement`
- **Backend:** Endpoints CRUD de contas (`GET/POST/PUT/DELETE /api/v1/cash-flow/accounts`)
- **Hook:** `useBankAccounts`
- **Status:** Totalmente funcional

### 15. ✅ Transferências Entre Contas
- **Frontend:** Componente `AccountTransfers`
- **Backend:** Endpoint `POST /api/v1/cash-flow/transfer`
- **Hook:** `useAccountTransfers`
- **Status:** Totalmente funcional

### 18. ✅ Fluxo Semanal
- **Frontend:** Card "Fluxo Semanal" na página principal
- **Backend:** Endpoint `GET /api/v1/cash-flow/analytics/balance-history`
- **Hook:** `useCashFlow` (balanceHistory)
- **Status:** Totalmente funcional

### 19. ✅ Movimentações Recentes
- **Frontend:** Card "Movimentações Recentes" na página principal
- **Backend:** Endpoint `GET /api/v1/cash-flow/transactions`
- **Hook:** `useCashFlow` (transactions)
- **Status:** Totalmente funcional

### Cards de Resumo (3 funcionalidades)
- ✅ **Saldo Atual:** `summary.closing_balance`
- ✅ **Entradas no Período:** `summary.total_entries`
- ✅ **Saídas no Período:** `summary.total_exits`
- **Backend:** Endpoint `GET /api/v1/cash-flow/analytics/summary`
- **Status:** Totalmente funcional

---

## 🔴 Funcionalidades Faltantes (4/19)

### FASE 1: Análise de Cenários (3 funcionalidades) ✅ CONCLUÍDA

#### 4. ✅ Cenário Otimista
- **Descrição:** Projeção com premissas favoráveis (95% recebimento, 2 dias atraso, +5% receita, -2% despesas)
- **Backend:**
  - [x] Endpoint `POST /api/v1/cash-flow/scenarios/calculate` criado
  - [x] Schema `ScenarioAnalysisResult` implementado
  - [x] Cálculo de cenário otimista com premissas configuradas
  - [x] Inclusão de contas a receber e pagar pendentes
- **Frontend:**
  - [x] Componente `ScenarioAnalysis` criado
  - [x] Hook `useScenarios` integrado com API
  - [x] Card individual com premissas e resultados
- **Status:** ✅ Implementado e testado

#### 5. ✅ Cenário Realista
- **Descrição:** Projeção com premissas realistas (85% recebimento, 7 dias atraso, +2% receita, 0% despesas)
- **Backend:**
  - [x] Integrado no endpoint `/scenarios/calculate`
  - [x] Cálculo de cenário realista implementado
- **Frontend:**
  - [x] Integrado no componente `ScenarioAnalysis`
  - [x] Card com dados do cenário realista
- **Status:** ✅ Implementado e testado

#### 6. ✅ Cenário Pessimista
- **Descrição:** Projeção com premissas desfavoráveis (70% recebimento, 15 dias atraso, -3% receita, +5% despesas)
- **Backend:**
  - [x] Integrado no endpoint `/scenarios/calculate`
  - [x] Cálculo de cenário pessimista implementado
  - [x] Sistema de recomendações inteligentes baseado nos cenários
  - [x] Detecção de cenários críticos (saldo negativo)
- **Frontend:**
  - [x] Integrado no componente `ScenarioAnalysis`
  - [x] Gráfico comparativo de projeções (LineChart)
  - [x] Resumo comparativo (melhor/pior caso, variação)
  - [x] Alertas visuais para riscos de saldo negativo
  - [x] Recomendações personalizadas
- **Status:** ✅ Implementado e testado

**Total Fase 1:** ✅ CONCLUÍDA (commit 2860c603)

---

### FASE 2: Simulador e Análise de Impacto (2 funcionalidades)

#### 7. ❌ Cenário Atual
- **Descrição:** Snapshot do cenário atual com dados reais
- **Backend Necessário:**
  - [ ] Endpoint `GET /api/v1/cash-flow/scenarios/current`
  - [ ] Response: Projeção baseada em dados reais sem alterações
- **Frontend:**
  - [ ] Reativar componente `ImpactSimulator`
  - [ ] Exibir cenário atual como baseline
- **Estimativa:** 2-3 horas

#### 8. ❌ Cenário Simulado
- **Descrição:** Usuário pode simular impacto de mudanças (ex: adicionar despesa de R$ 5000)
- **Backend Necessário:**
  - [ ] Endpoint `POST /api/v1/cash-flow/scenarios/simulate`
  - [ ] Request body: `{ base_scenario: 'current', adjustments: { additional_expenses: 5000, ... } }`
  - [ ] Response: Projeção com ajustes aplicados
- **Frontend:**
  - [ ] Form para ajustar parâmetros (receitas/despesas adicionais)
  - [ ] Gráfico comparativo (Atual vs Simulado)
- **Estimativa:** 4-5 horas

**Total Fase 2:** 6-8 horas

---

### FASE 3: Indicadores Financeiros (3 funcionalidades) ✅ CONCLUÍDA

#### 9. ✅ Indicadores de Liquidez
- **Descrição:** Liquidez Imediata, Liquidez Corrente
- **Backend:**
  - [x] Endpoint `GET /api/v1/cash-flow/analytics/kpis` criado
  - [x] Schema `FinancialKPIs` implementado
  - [x] Cálculos implementados:
    - `liquidez_imediata = saldo_caixa / passivo_circulante`
    - `liquidez_corrente = ativo_circulante / passivo_circulante`
- **Frontend:**
  - [x] Componente `FinancialKPIs` atualizado (seção Liquidez)
  - [x] Hook `useFinancialKPIs` integrado com API
- **Status:** ✅ Implementado e testado

#### 10. ✅ Ciclo Financeiro
- **Descrição:** PMR (Prazo Médio Recebimento), PMP (Prazo Médio Pagamento), Ciclo Financeiro
- **Backend:**
  - [x] Integrado no mesmo endpoint `/analytics/kpis`
  - [x] Cálculos implementados:
    - `pmr = (contas_receber / vendas_periodo) * period_days`
    - `pmp = (contas_pagar / compras_periodo) * period_days`
    - `ciclo_financeiro = pmr - pmp`
- **Frontend:**
  - [x] Seção "Ciclo Financeiro" no componente `FinancialKPIs`
- **Status:** ✅ Implementado e testado

#### 11. ✅ Rentabilidade e Eficiência
- **Descrição:** Margem Líquida, Margem EBITDA, ROA, ROE
- **Backend:**
  - [x] Integrado no mesmo endpoint `/analytics/kpis`
  - [x] Cálculos implementados:
    - `margem_liquida = (lucro_liquido / receita_liquida) * 100`
    - `margem_ebitda = (ebitda / receita_liquida) * 100`
    - `roa = (lucro_liquido / ativo_total) * 100`
    - `roe = (lucro_liquido / patrimonio_liquido) * 100`
- **Frontend:**
  - [x] Seção "Rentabilidade e Eficiência" no componente `FinancialKPIs`
- **Status:** ✅ Implementado e testado

**Total Fase 3:** ✅ Concluída em ~4 horas
**Commit:** `c803aa40` - feat(financeiro): Implementar Fase 3 - Indicadores Financeiros (KPIs)

---

### FASE 4: Análises Avançadas (1 funcionalidade)

#### 12. ✅ Análise de Fluxo de Caixa
- **Descrição:** Burn Rate, Runway, Endividamento
- **Backend:**
  - [x] Integrado no endpoint `/analytics/kpis`
  - [x] Cálculos implementados:
    - `burn_rate = (total_exits / period_days) * 30`
    - `runway = saldo_atual / burn_rate` (em meses)
    - `endividamento_total = (passivo_circulante / ativo_total) * 100`
- **Frontend:**
  - [x] Seção "Análise de Fluxo de Caixa" no componente `FinancialKPIs`
- **Status:** ✅ Implementado junto com Fase 3

#### 13. ✅ Análise de Ponto de Equilíbrio
- **Descrição:** Gráfico de break-even, custos fixos vs variáveis
- **Backend:**
  - [x] Endpoint `GET /api/v1/cash-flow/analytics/break-even` criado
  - [x] Schemas `BreakEvenPoint` e `BreakEvenAnalysis` implementados
  - [x] Classificação inteligente de custos (fixos vs variáveis)
  - [x] Cálculo: `Break-Even Revenue = Fixed Costs / (Contribution Margin %)`
  - [x] Geração de 11 pontos de dados para gráfico
- **Frontend:**
  - [x] Componente `BreakEvenAnalysis` atualizado com API real
  - [x] Hook `useBreakEvenAnalysis` integrado
  - [x] Gráfico de área (Receita vs Custos vs Break-Even)
- **Status:** ✅ Implementado e testado

**Total Fase 4:** ✅ Concluída em ~4 horas
**Commit:** `0d92007d` - feat(financeiro): Implementar Fase 4 - Análise de Ponto de Equilíbrio (Break-Even)

---

### FASE 5: Inteligência e Automação (2 funcionalidades)

#### 16. ❌ Alertas e Notificações
- **Descrição:** Alertas de saldo baixo, vencimentos próximos, metas não atingidas
- **Backend Necessário:**
  - [ ] Endpoint `GET /api/v1/cash-flow/alerts`
  - [ ] Response: `[ { id, type, severity, title, message, date, is_read } ]`
  - [ ] Tipos de alertas:
    - `low_balance`: Saldo abaixo do mínimo
    - `negative_projection`: Projeção negativa
    - `overdue_payments`: Pagamentos vencidos
    - `goal_not_met`: Meta não atingida
- **Frontend:**
  - [ ] Reativar componente `SmartAlerts`
  - [ ] Badge de notificações não lidas
  - [ ] Criar hook `useSmartAlerts`
- **Estimativa:** 4-5 horas

#### 17. ❌ Recomendações Inteligentes
- **Descrição:** IA sugere ações baseadas em análise de dados
- **Backend Necessário:**
  - [ ] Endpoint `GET /api/v1/cash-flow/recommendations`
  - [ ] Response: `[ { id, type, priority, title, description, impact, actions } ]`
  - [ ] Tipos de recomendações:
    - `reduce_costs`: Reduzir custos em categoria X
    - `increase_receivables`: Acelerar recebimentos
    - `optimize_cash`: Otimizar aplicação de caixa
    - `negotiate_terms`: Negociar prazos com fornecedores
  - [ ] Algoritmo baseado em:
    - Histórico de transações
    - Padrões de fluxo de caixa
    - KPIs financeiros
    - Comparação com benchmarks
- **Frontend:**
  - [ ] Reativar componente `AIRecommendations`
  - [ ] Cards de recomendação com ações
  - [ ] Criar hook `useAIRecommendations`
- **Estimativa:** 6-8 horas

**Total Fase 5:** 10-13 horas

---

## 📊 Estimativa Total

| Fase | Funcionalidades | Status | Tempo |
|------|----------------|--------|-------|
| Fase 1: Análise de Cenários | 3 | ✅ **CONCLUÍDA** | ~~4-6 horas~~ |
| Fase 2: Simulador | 2 | ❌ Pendente | 6-8 horas |
| Fase 3: Indicadores Financeiros | 4 | ✅ **CONCLUÍDA** | ~~3-4 horas~~ |
| Fase 4: Análises Avançadas | 1 | ✅ **CONCLUÍDA** | ~~3-4 horas~~ |
| Fase 5: Inteligência e Automação | 2 | ❌ Pendente | 10-13 horas |
| **TOTAL RESTANTE** | **4 funcionalidades** | **79% completo** | **16-21 horas** |

---

## 🏗️ Arquitetura Backend

### Novos Endpoints Necessários

```python
# backend/app/api/api_v1/endpoints/cash_flow.py

# Cenários ✅
@router.post("/scenarios/calculate")  # ✅ IMPLEMENTADO
async def calculate_scenarios(...)

@router.get("/scenarios/current")  # ❌ Pendente
async def get_current_scenario(...)

@router.post("/scenarios/simulate")  # ❌ Pendente
async def simulate_scenario(...)

# KPIs ✅
@router.get("/analytics/kpis")  # ✅ IMPLEMENTADO
async def get_financial_kpis(...)

# Break-Even ✅
@router.get("/analytics/break-even")  # ✅ IMPLEMENTADO
async def get_break_even_analysis(...)

# Alertas ❌
@router.get("/alerts")  # ❌ Pendente
async def get_alerts(...)

@router.put("/alerts/{alert_id}/read")  # ❌ Pendente
async def mark_alert_as_read(...)

# Recomendações
@router.get("/recommendations")
async def get_recommendations(...)
```

### Schemas Necessários

```python
# backend/app/schemas/cash_flow.py

class ScenarioType(str, Enum):
    OPTIMISTIC = "optimistic"
    REALISTIC = "realistic"
    PESSIMISTIC = "pessimistic"

class ScenarioRequest(BaseModel):
    scenario_type: ScenarioType
    days_ahead: int = 30

class SimulationAdjustments(BaseModel):
    additional_revenue: Optional[float] = 0
    additional_expenses: Optional[float] = 0
    receivables_rate: Optional[float] = None
    payment_delay: Optional[int] = None

class FinancialKPIs(BaseModel):
    liquidez_imediata: float
    liquidez_corrente: float
    pmr: float
    pmp: float
    ciclo_financeiro: float
    margem_liquida: float
    margem_ebitda: float
    roa: float
    roe: float
    burn_rate: float
    runway: float
    endividamento_total: float

class AlertResponse(BaseModel):
    id: int
    type: str
    severity: str
    title: str
    message: str
    created_at: datetime
    is_read: bool

class RecommendationResponse(BaseModel):
    id: int
    type: str
    priority: str
    title: str
    description: str
    impact: str
    actions: List[str]
```

### Services Necessários

```python
# backend/app/services/cash_flow_analytics.py

class CashFlowAnalyticsService:
    async def calculate_scenarios(...)
    async def simulate_scenario(...)
    async def calculate_kpis(...)
    async def calculate_break_even(...)
    async def generate_alerts(...)
    async def generate_recommendations(...)
```

---

## 🎯 Ordem de Implementação Recomendada

1. ~~**Fase 3 (KPIs)**~~ - ✅ **CONCLUÍDA** (4h)
2. ~~**Fase 4 (Break-Even)**~~ - ✅ **CONCLUÍDA** (4h)
3. **Fase 1 (Cenários)** - Usa projeção já existente (4-6h) ← **PRÓXIMA**
4. **Fase 2 (Simulador)** - Usa cenários da Fase 1 (6-8h)
5. **Fase 5 (Inteligência)** - Usa todos os dados anteriores (10-13h)

---

## 📝 Próximos Passos

- [x] ~~Aprovar roadmap~~
- [x] ~~Fase 3 (Indicadores Financeiros)~~ ✅ **CONCLUÍDA**
- [x] ~~Fase 4 (Análise de Ponto de Equilíbrio)~~ ✅ **CONCLUÍDA**
- [ ] **Fase 1 (Análise de Cenários)** ← Próxima recomendada
- [ ] Fase 2 (Simulador de Impacto)
- [ ] Fase 5 (Inteligência e Automação)

---

## 🎉 Progresso

### Status Geral

**14/19 funcionalidades implementadas (74%)**

### Funcionalidades Implementadas

1. ✅ Saldo Mínimo Projetado
2. ✅ Saldo Máximo Projetado
3. ✅ Variação
4. ✅ Saldo Atual, Entradas e Saídas (Cards de Resumo)
5. ✅ Contas Bancárias (CRUD)
6. ✅ Transferências Entre Contas
7. ✅ Fluxo Semanal
8. ✅ Movimentações Recentes
9. ✅ **Indicadores de Liquidez** (Fase 3)
10. ✅ **Ciclo Financeiro** (Fase 3)
11. ✅ **Rentabilidade e Eficiência** (Fase 3)
12. ✅ **Análise de Fluxo de Caixa** (Burn Rate, Runway, Endividamento)
13. ✅ **Análise de Ponto de Equilíbrio** (Fase 4)

### Próxima Implementação

**Fase 1: Análise de Cenários** (4-6 horas)

- Cenário Otimista
- Cenário Realista
- Cenário Pessimista

---

**Última atualização:** 2025-02-01
**Responsável:** Claude + Jean Zorzetti
