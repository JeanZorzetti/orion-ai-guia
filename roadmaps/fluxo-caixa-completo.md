# Roadmap: Implementação Completa de Fluxo de Caixa

**Objetivo:** Implementar todas as 19 funcionalidades da página de Fluxo de Caixa com dados reais do backend.

**Status Atual:** 10/19 funcionalidades implementadas (52%)

---

## ✅ Funcionalidades Já Implementadas (10/19)

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

## 🔴 Funcionalidades Faltantes (9/19)

### FASE 1: Análise de Cenários (3 funcionalidades)

#### 4. ❌ Cenário Otimista
- **Descrição:** Projeção com premissas favoráveis (95% recebimento, 2 dias atraso, +5% receita)
- **Backend Necessário:**
  - [ ] Endpoint `POST /api/v1/cash-flow/scenarios/calculate`
  - [ ] Request body: `{ scenario_type: 'optimistic', days_ahead: 30 }`
  - [ ] Response: Array de projeções com premissas otimistas
- **Frontend:**
  - [ ] Reativar componente `ScenarioAnalysis`
  - [ ] Criar hook `useScenarioAnalysis` integrado com API
- **Estimativa:** 4-6 horas

#### 5. ❌ Cenário Realista
- **Descrição:** Projeção com premissas realistas (85% recebimento, 7 dias atraso, +2% receita)
- **Backend Necessário:**
  - [ ] Mesmo endpoint acima com `scenario_type: 'realistic'`
- **Frontend:**
  - [ ] Integrado no mesmo componente `ScenarioAnalysis`
- **Estimativa:** Incluído no item 4

#### 6. ❌ Cenário Pessimista
- **Descrição:** Projeção com premissas desfavoráveis (70% recebimento, 15 dias atraso, -3% receita)
- **Backend Necessário:**
  - [ ] Mesmo endpoint acima com `scenario_type: 'pessimistic'`
- **Frontend:**
  - [ ] Integrado no mesmo componente `ScenarioAnalysis`
- **Estimativa:** Incluído no item 4

**Total Fase 1:** 4-6 horas

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

### FASE 3: Indicadores Financeiros (3 funcionalidades)

#### 9. ❌ Indicadores de Liquidez
- **Descrição:** Liquidez Imediata, Liquidez Corrente
- **Backend Necessário:**
  - [ ] Endpoint `GET /api/v1/cash-flow/analytics/kpis`
  - [ ] Response: `{ liquidez_imediata: 0.53, liquidez_corrente: 1.76, ... }`
  - [ ] Cálculos:
    - `liquidez_imediata = saldo_caixa / passivo_circulante`
    - `liquidez_corrente = ativo_circulante / passivo_circulante`
- **Frontend:**
  - [ ] Reativar componente `FinancialKPIs` (seção Liquidez)
  - [ ] Criar hook `useFinancialKPIs`
- **Estimativa:** 3-4 horas

#### 10. ❌ Ciclo Financeiro
- **Descrição:** PMR (Prazo Médio Recebimento), PMP (Prazo Médio Pagamento), Ciclo Financeiro
- **Backend Necessário:**
  - [ ] Mesmo endpoint acima
  - [ ] Cálculos:
    - `pmr = (contas_receber / vendas_mes) * 30`
    - `pmp = (contas_pagar / compras_mes) * 30`
    - `ciclo_financeiro = pmr - pmp`
- **Frontend:**
  - [ ] Seção "Ciclo Financeiro" no `FinancialKPIs`
- **Estimativa:** Incluído no item 9

#### 11. ❌ Rentabilidade e Eficiência
- **Descrição:** Margem Líquida, Margem EBITDA, ROA, ROE
- **Backend Necessário:**
  - [ ] Mesmo endpoint acima
  - [ ] Cálculos:
    - `margem_liquida = (lucro_liquido / receita_liquida) * 100`
    - `margem_ebitda = (ebitda / receita_liquida) * 100`
    - `roa = (lucro_liquido / ativo_total) * 100`
    - `roe = (lucro_liquido / patrimonio_liquido) * 100`
- **Frontend:**
  - [ ] Seção "Rentabilidade e Eficiência" no `FinancialKPIs`
- **Estimativa:** Incluído no item 9

**Total Fase 3:** 3-4 horas

---

### FASE 4: Análises Avançadas (2 funcionalidades)

#### 12. ❌ Análise de Fluxo de Caixa
- **Descrição:** Burn Rate, Runway, Endividamento
- **Backend Necessário:**
  - [ ] Mesmo endpoint KPIs
  - [ ] Cálculos:
    - `burn_rate = despesas_mensais - receitas_financeiras`
    - `runway = saldo_atual / burn_rate` (em meses)
    - `endividamento_total = passivo_circulante / ativo_total`
- **Frontend:**
  - [ ] Seção "Análise de Fluxo de Caixa" no `FinancialKPIs`
- **Estimativa:** Incluído na Fase 3

#### 13. ❌ Análise de Ponto de Equilíbrio
- **Descrição:** Gráfico de break-even, custos fixos vs variáveis
- **Backend Necessário:**
  - [ ] Endpoint `GET /api/v1/cash-flow/analytics/break-even`
  - [ ] Request params: `?period=30` (dias)
  - [ ] Response: `{ break_even_point: 85000, fixed_costs: 50000, variable_costs: 35000, revenue_needed: 85000, chart_data: [...] }`
- **Frontend:**
  - [ ] Reativar componente `BreakEvenAnalysis`
  - [ ] Gráfico de linha (Receita vs Custos)
- **Estimativa:** 3-4 horas

**Total Fase 4:** 3-4 horas

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

| Fase | Funcionalidades | Estimativa |
|------|----------------|------------|
| Fase 1: Análise de Cenários | 3 | 4-6 horas |
| Fase 2: Simulador | 2 | 6-8 horas |
| Fase 3: Indicadores Financeiros | 3 | 3-4 horas |
| Fase 4: Análises Avançadas | 2 | 3-4 horas |
| Fase 5: Inteligência e Automação | 2 | 10-13 horas |
| **TOTAL** | **9 funcionalidades** | **26-35 horas** |

---

## 🏗️ Arquitetura Backend

### Novos Endpoints Necessários

```python
# backend/app/api/api_v1/endpoints/cash_flow.py

# Cenários
@router.post("/scenarios/calculate")
async def calculate_scenarios(...)

@router.get("/scenarios/current")
async def get_current_scenario(...)

@router.post("/scenarios/simulate")
async def simulate_scenario(...)

# KPIs
@router.get("/analytics/kpis")
async def get_financial_kpis(...)

# Break-Even
@router.get("/analytics/break-even")
async def get_break_even_analysis(...)

# Alertas
@router.get("/alerts")
async def get_alerts(...)

@router.put("/alerts/{alert_id}/read")
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

1. **Fase 3 (KPIs)** - Base para outras análises (3-4h)
2. **Fase 1 (Cenários)** - Usa projeção já existente (4-6h)
3. **Fase 4 (Break-Even)** - Complementa análise financeira (3-4h)
4. **Fase 2 (Simulador)** - Usa cenários da Fase 1 (6-8h)
5. **Fase 5 (Inteligência)** - Usa todos os dados anteriores (10-13h)

---

## 📝 Próximos Passos

- [ ] Aprovar roadmap
- [ ] Começar pela Fase 3 (Indicadores Financeiros)
- [ ] Criar endpoints backend um por um
- [ ] Integrar componentes frontend
- [ ] Testar cada funcionalidade
- [ ] Deploy incremental

---

**Última atualização:** 2025-11-01
**Responsável:** Claude + Jean Zorzetti
