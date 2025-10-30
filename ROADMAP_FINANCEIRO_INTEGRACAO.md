# 🗺️ ROADMAP: Integração Completa do Módulo Financeiro

**Objetivo:** Substituir dados mockados por integração real com backend e banco de dados

**Status Atual:** 40% integrado (Contas a Pagar ✅ | Contas a Receber ❌ | Fluxo de Caixa ❌)

**Prazo Estimado:** 6-8 semanas (3 fases principais)

---

## 📊 VISÃO GERAL

### ✅ Já Integrado (40%)
- Dashboard Principal (`/admin/dashboard`)
- Contas a Pagar (`/admin/financeiro/contas-a-pagar`)
- Faturas (Invoices) - CRUD completo
- Fornecedores (Suppliers)

### ❌ Pendente de Integração (60%)
- Página Principal Financeiro (`/admin/financeiro`)
- Contas a Receber (`/admin/financeiro/contas-a-receber`)
- Fluxo de Caixa (`/admin/financeiro/fluxo-caixa`)
- Relatórios Financeiros (`/admin/financeiro/relatorios`)

---

## 🎯 FASE 1: BACKEND - APIs de Contas a Receber (2 semanas)

### **Sprint 1.1: Modelagem e Endpoints Básicos** (1 semana)

#### 📋 Tarefas:

**Backend (FastAPI + Python):**

1. **Criar modelo de dados `AccountsReceivable`** (`backend/app/models/accounts_receivable.py`)
   ```python
   class AccountsReceivable(Base):
       __tablename__ = "accounts_receivable"

       id = Column(Integer, primary_key=True, index=True)
       workspace_id = Column(Integer, ForeignKey("workspaces.id"), nullable=False)
       document_number = Column(String(100), nullable=False, unique=True)
       customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False)
       customer_name = Column(String(255), nullable=False)
       issue_date = Column(Date, nullable=False)
       due_date = Column(Date, nullable=False)
       value = Column(Float, nullable=False)
       paid_value = Column(Float, default=0.0)
       status = Column(String(50), nullable=False)  # pendente, parcial, recebido, vencido, cancelado
       description = Column(Text)
       payment_method = Column(String(50))  # boleto, pix, transferencia, cartao, dinheiro
       risk_category = Column(String(50))  # excelente, bom, regular, ruim, critico
       days_overdue = Column(Integer, default=0)
       notes = Column(Text)
       created_at = Column(DateTime, default=datetime.utcnow)
       updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

       # Relacionamentos
       customer = relationship("Customer", back_populates="receivables")
       workspace = relationship("Workspace")
   ```

2. **Criar schemas Pydantic** (`backend/app/schemas/accounts_receivable.py`)
   - `AccountsReceivableBase`
   - `AccountsReceivableCreate`
   - `AccountsReceivableUpdate`
   - `AccountsReceivableResponse`
   - `AccountsReceivableList`

3. **Criar CRUD operations** (`backend/app/crud/accounts_receivable.py`)
   - `create_receivable()`
   - `get_receivable_by_id()`
   - `get_receivables(filters, pagination)`
   - `update_receivable()`
   - `delete_receivable()`
   - `mark_as_received()`
   - `update_payment()`

4. **Criar endpoints REST** (`backend/app/api/v1/accounts_receivable.py`)
   - `POST /api/v1/accounts-receivable/` - Criar conta a receber
   - `GET /api/v1/accounts-receivable/` - Listar com filtros
   - `GET /api/v1/accounts-receivable/{id}` - Buscar por ID
   - `PATCH /api/v1/accounts-receivable/{id}` - Atualizar
   - `DELETE /api/v1/accounts-receivable/{id}` - Deletar
   - `POST /api/v1/accounts-receivable/{id}/receive` - Registrar recebimento
   - `POST /api/v1/accounts-receivable/{id}/partial-payment` - Pagamento parcial

5. **Criar migration Alembic**
   ```bash
   alembic revision --autogenerate -m "create_accounts_receivable_table"
   alembic upgrade head
   ```

**Testes:**
- Testes unitários para CRUD
- Testes de integração dos endpoints
- Validação de permissões (multi-tenant)

---

### **Sprint 1.2: Analytics e Relatórios de AR** (1 semana)

#### 📋 Tarefas:

1. **Criar endpoints de analytics** (`backend/app/api/v1/accounts_receivable.py`)
   - `GET /api/v1/accounts-receivable/analytics/summary` - KPIs gerais
   - `GET /api/v1/accounts-receivable/analytics/aging` - Aging report
   - `GET /api/v1/accounts-receivable/analytics/by-customer` - Por cliente
   - `GET /api/v1/accounts-receivable/analytics/overdue` - Vencidos
   - `GET /api/v1/accounts-receivable/analytics/trends` - Tendências

2. **Implementar cálculo de métricas**
   - Total a receber
   - Taxa de inadimplência
   - Dias médios de recebimento (DSO - Days Sales Outstanding)
   - Aging buckets (0-30, 31-60, 61-90, 90+)
   - Análise de risco por cliente

3. **Criar sistema de categorização de risco automático**
   - Algoritmo de scoring baseado em histórico
   - Atualização automática de `risk_category`

**Entrega Sprint 1:**
- ✅ Modelo de dados criado e migrado
- ✅ CRUD completo funcionando
- ✅ 8+ endpoints REST
- ✅ Analytics e relatórios
- ✅ Testes com >80% cobertura

---

## 🎯 FASE 2: BACKEND - APIs de Fluxo de Caixa (2 semanas)

### **Sprint 2.1: Movimentações Financeiras** (1 semana)

#### 📋 Tarefas:

1. **Criar modelo `CashFlowTransaction`** (`backend/app/models/cash_flow.py`)
   ```python
   class CashFlowTransaction(Base):
       __tablename__ = "cash_flow_transactions"

       id = Column(Integer, primary_key=True, index=True)
       workspace_id = Column(Integer, ForeignKey("workspaces.id"), nullable=False)
       transaction_date = Column(DateTime, nullable=False)
       type = Column(String(20), nullable=False)  # entrada, saida
       category = Column(String(100), nullable=False)
       subcategory = Column(String(100))
       description = Column(Text, nullable=False)
       value = Column(Float, nullable=False)
       payment_method = Column(String(50))
       account_id = Column(Integer, ForeignKey("bank_accounts.id"))
       reference_type = Column(String(50))  # invoice, sale, expense, transfer, other
       reference_id = Column(Integer)  # ID do documento de referência
       tags = Column(JSON)
       is_recurring = Column(Boolean, default=False)
       recurrence_rule = Column(JSON)  # Regra de recorrência
       created_by = Column(Integer, ForeignKey("users.id"))
       created_at = Column(DateTime, default=datetime.utcnow)
       updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
   ```

2. **Criar modelo `BankAccount`** (se não existir)
   ```python
   class BankAccount(Base):
       __tablename__ = "bank_accounts"

       id = Column(Integer, primary_key=True, index=True)
       workspace_id = Column(Integer, ForeignKey("workspaces.id"), nullable=False)
       bank_name = Column(String(100), nullable=False)
       account_type = Column(String(50))  # corrente, poupanca, investimento
       account_number = Column(String(50))
       agency = Column(String(20))
       current_balance = Column(Float, default=0.0)
       is_active = Column(Boolean, default=True)
       created_at = Column(DateTime, default=datetime.utcnow)
   ```

3. **Criar schemas e CRUD**
   - Schemas para `CashFlowTransaction` e `BankAccount`
   - CRUD operations para ambos

4. **Criar endpoints REST**
   - `POST /api/v1/cash-flow/transactions/` - Criar movimentação
   - `GET /api/v1/cash-flow/transactions/` - Listar com filtros
   - `GET /api/v1/cash-flow/transactions/{id}` - Buscar por ID
   - `PATCH /api/v1/cash-flow/transactions/{id}` - Atualizar
   - `DELETE /api/v1/cash-flow/transactions/{id}` - Deletar
   - `POST /api/v1/cash-flow/transfer` - Transferência entre contas
   - `GET /api/v1/bank-accounts/` - Listar contas bancárias
   - `POST /api/v1/bank-accounts/` - Criar conta bancária

---

### **Sprint 2.2: Projeções e Analytics de Cash Flow** (1 semana)

#### 📋 Tarefas:

1. **Criar endpoints de projeção** (`backend/app/api/v1/cash_flow.py`)
   - `GET /api/v1/cash-flow/projection` - Projeção futura
   - `GET /api/v1/cash-flow/balance-history` - Histórico de saldo
   - `GET /api/v1/cash-flow/summary` - Resumo do período
   - `GET /api/v1/cash-flow/by-category` - Despesas por categoria
   - `GET /api/v1/cash-flow/by-account` - Por conta bancária

2. **Implementar algoritmo de projeção**
   - Baseado em médias móveis
   - Considera sazonalidade
   - Inclui contas a pagar/receber futuras

3. **Criar endpoints de análise**
   - Burn rate (taxa de queima)
   - Runway (pista de pouso - quanto tempo o caixa dura)
   - Break-even point
   - KPIs financeiros

4. **Integração automática**
   - Criar triggers para atualizar cash flow quando:
     - Invoice é paga (cria entrada)
     - Sale é completada (cria entrada)
     - Purchase é feita (cria saída)

**Entrega Sprint 2:**
- ✅ Modelo de cash flow criado
- ✅ Modelo de contas bancárias
- ✅ CRUD completo de transações
- ✅ Sistema de projeções
- ✅ Analytics avançados
- ✅ Integração com outros módulos

---

## 🎯 FASE 3: FRONTEND - Integração dos Componentes (2-3 semanas)

### **Sprint 3.1: Serviços e Tipos TypeScript** (3 dias)

#### 📋 Tarefas:

1. **Criar tipos TypeScript** (`admin/src/types/financeiro.ts`)
   ```typescript
   export interface AccountsReceivable {
     id: number;
     document_number: string;
     customer_id: number;
     customer_name: string;
     issue_date: string;
     due_date: string;
     value: number;
     paid_value: number;
     status: 'pendente' | 'parcial' | 'recebido' | 'vencido' | 'cancelado';
     description?: string;
     payment_method?: string;
     risk_category?: 'excelente' | 'bom' | 'regular' | 'ruim' | 'critico';
     days_overdue: number;
     created_at: string;
     updated_at: string;
   }

   export interface CashFlowTransaction {
     id: number;
     transaction_date: string;
     type: 'entrada' | 'saida';
     category: string;
     subcategory?: string;
     description: string;
     value: number;
     payment_method?: string;
     account_id?: number;
     reference_type?: string;
     reference_id?: number;
     created_at: string;
   }

   export interface BankAccount {
     id: number;
     bank_name: string;
     account_type: string;
     account_number: string;
     current_balance: number;
     is_active: boolean;
   }

   // Analytics types
   export interface ARAnalytics {
     total_to_receive: number;
     overdue_amount: number;
     overdue_count: number;
     average_days_to_receive: number;
     default_rate: number;
   }

   export interface CashFlowSummary {
     period_start: string;
     period_end: string;
     total_inflow: number;
     total_outflow: number;
     net_flow: number;
     opening_balance: number;
     closing_balance: number;
   }
   ```

2. **Criar serviços API** (`admin/src/services/`)

   **`accounts-receivable.ts`:**
   ```typescript
   import { api } from '@/lib/api';
   import { AccountsReceivable, ARAnalytics } from '@/types/financeiro';

   export const accountsReceivableService = {
     async getAll(params?: {
       skip?: number;
       limit?: number;
       status?: string;
       customer_id?: number;
       start_date?: string;
       end_date?: string;
     }): Promise<AccountsReceivable[]> {
       const queryParams = new URLSearchParams();
       // ... build query
       return api.get<AccountsReceivable[]>(`/accounts-receivable/?${queryParams}`);
     },

     async getById(id: number): Promise<AccountsReceivable> {
       return api.get<AccountsReceivable>(`/accounts-receivable/${id}`);
     },

     async create(data: Partial<AccountsReceivable>): Promise<AccountsReceivable> {
       return api.post<AccountsReceivable>('/accounts-receivable/', data);
     },

     async update(id: number, data: Partial<AccountsReceivable>): Promise<AccountsReceivable> {
       return api.patch<AccountsReceivable>(`/accounts-receivable/${id}`, data);
     },

     async delete(id: number): Promise<void> {
       return api.delete(`/accounts-receivable/${id}`);
     },

     async markAsReceived(id: number, data: { paid_value: number; payment_date: string }): Promise<AccountsReceivable> {
       return api.post<AccountsReceivable>(`/accounts-receivable/${id}/receive`, data);
     },

     async getAnalytics(): Promise<ARAnalytics> {
       return api.get<ARAnalytics>('/accounts-receivable/analytics/summary');
     },

     async getAgingReport() {
       return api.get('/accounts-receivable/analytics/aging');
     },
   };
   ```

   **`cash-flow.ts`:**
   ```typescript
   import { api } from '@/lib/api';
   import { CashFlowTransaction, CashFlowSummary, BankAccount } from '@/types/financeiro';

   export const cashFlowService = {
     async getTransactions(params?: {
       start_date?: string;
       end_date?: string;
       type?: string;
       category?: string;
       account_id?: number;
     }): Promise<CashFlowTransaction[]> {
       const queryParams = new URLSearchParams();
       // ... build query
       return api.get<CashFlowTransaction[]>(`/cash-flow/transactions/?${queryParams}`);
     },

     async createTransaction(data: Partial<CashFlowTransaction>): Promise<CashFlowTransaction> {
       return api.post<CashFlowTransaction>('/cash-flow/transactions/', data);
     },

     async getSummary(start_date: string, end_date: string): Promise<CashFlowSummary> {
       return api.get<CashFlowSummary>(`/cash-flow/summary?start_date=${start_date}&end_date=${end_date}`);
     },

     async getProjection(weeks: number = 12) {
       return api.get(`/cash-flow/projection?weeks=${weeks}`);
     },

     async getBankAccounts(): Promise<BankAccount[]> {
       return api.get<BankAccount[]>('/bank-accounts/');
     },
   };
   ```

---

### **Sprint 3.2: Integrar Contas a Receber** (4-5 dias)

#### 📋 Tarefas:

1. **Atualizar página principal** (`admin/src/app/admin/financeiro/contas-a-receber/page.tsx`)
   - Remover `mockContasReceber`
   - Adicionar `useEffect` para carregar dados reais
   - Implementar estados de loading e error
   - Conectar com `accountsReceivableService`

2. **Criar hook customizado** (`admin/src/hooks/useAccountsReceivable.ts`)
   ```typescript
   export const useAccountsReceivable = () => {
     const [receivables, setReceivables] = useState<AccountsReceivable[]>([]);
     const [loading, setLoading] = useState(true);
     const [analytics, setAnalytics] = useState<ARAnalytics | null>(null);

     const loadReceivables = async (filters?: any) => {
       setLoading(true);
       try {
         const data = await accountsReceivableService.getAll(filters);
         setReceivables(data);
       } catch (error) {
         toast.error('Erro ao carregar contas a receber');
       } finally {
         setLoading(false);
       }
     };

     const loadAnalytics = async () => {
       const data = await accountsReceivableService.getAnalytics();
       setAnalytics(data);
     };

     useEffect(() => {
       loadReceivables();
       loadAnalytics();
     }, []);

     return { receivables, loading, analytics, loadReceivables };
   };
   ```

3. **Atualizar componentes**
   - `ARDashboardKPIs` - usar dados reais de analytics
   - `AgingReportTable` - usar dados reais de aging
   - `ARCharts` - usar dados reais para gráficos

4. **Adicionar modais de CRUD**
   - Modal de criação de conta a receber
   - Modal de edição
   - Modal de registrar recebimento
   - Modal de pagamento parcial

---

### **Sprint 3.3: Integrar Fluxo de Caixa** (4-5 dias)

#### 📋 Tarefas:

1. **Atualizar página principal** (`admin/src/app/admin/financeiro/fluxo-caixa/page.tsx`)
   - Remover dados mockados (`movimentacoes`, `fluxoSemanal`)
   - Conectar com `cashFlowService`
   - Implementar loading states

2. **Criar hook customizado** (`admin/src/hooks/useCashFlow.ts`)
   ```typescript
   export const useCashFlow = (startDate: Date, endDate: Date) => {
     const [transactions, setTransactions] = useState<CashFlowTransaction[]>([]);
     const [summary, setSummary] = useState<CashFlowSummary | null>(null);
     const [projection, setProjection] = useState<any[]>([]);
     const [loading, setLoading] = useState(true);

     const loadData = async () => {
       setLoading(true);
       try {
         const [txs, sum, proj] = await Promise.all([
           cashFlowService.getTransactions({
             start_date: formatDate(startDate),
             end_date: formatDate(endDate),
           }),
           cashFlowService.getSummary(formatDate(startDate), formatDate(endDate)),
           cashFlowService.getProjection(12),
         ]);

         setTransactions(txs);
         setSummary(sum);
         setProjection(proj);
       } catch (error) {
         toast.error('Erro ao carregar fluxo de caixa');
       } finally {
         setLoading(false);
       }
     };

     useEffect(() => {
       loadData();
     }, [startDate, endDate]);

     return { transactions, summary, projection, loading, reload: loadData };
   };
   ```

3. **Atualizar componentes**
   - `CashFlowProjection` - usar dados reais de projeção
   - `ScenarioAnalysis` - calcular com dados reais
   - `ImpactSimulator` - simular com base real
   - `FinancialKPIs` - métricas reais do backend
   - `MultiAccountManagement` - contas bancárias reais

4. **Adicionar funcionalidades**
   - Modal de nova transação
   - Modal de transferência entre contas
   - Filtros avançados
   - Exportação de relatórios

---

### **Sprint 3.4: Integrar Dashboard Financeiro Principal** (3-4 dias)

#### 📋 Tarefas:

1. **Atualizar página principal** (`admin/src/app/admin/financeiro/page.tsx`)
   - Remover todos os dados mockados (linhas 96-233)
   - Criar hook agregador de dados

2. **Criar hook de dashboard** (`admin/src/hooks/useFinancialDashboard.ts`)
   ```typescript
   export const useFinancialDashboard = () => {
     const [loading, setLoading] = useState(true);
     const [summary, setSummary] = useState<any>(null);

     const loadDashboardData = async () => {
       setLoading(true);
       try {
         const [
           invoices,
           receivables,
           cashFlowData,
           analyticsAR,
         ] = await Promise.all([
           invoiceService.getAll({ limit: 1000 }),
           accountsReceivableService.getAll({ limit: 1000 }),
           cashFlowService.getSummary(
             formatDate(startOfMonth(new Date())),
             formatDate(endOfMonth(new Date()))
           ),
           accountsReceivableService.getAnalytics(),
         ]);

         // Calcular métricas agregadas
         const contasAPagar = invoices
           .filter(i => i.status === 'pending')
           .reduce((sum, i) => sum + i.total_value, 0);

         const contasAReceber = receivables
           .filter(r => r.status === 'pendente')
           .reduce((sum, r) => sum + r.value, 0);

         const saldoAtual = cashFlowData.closing_balance;

         setSummary({
           contasAPagar,
           contasAReceber,
           saldoAtual,
           cashFlowData,
           analyticsAR,
           // ... outros dados calculados
         });
       } catch (error) {
         toast.error('Erro ao carregar dashboard financeiro');
       } finally {
         setLoading(false);
       }
     };

     useEffect(() => {
       loadDashboardData();
     }, []);

     return { summary, loading, reload: loadDashboardData };
   };
   ```

3. **Atualizar componentes de gráficos**
   - `CashFlowChart` - usar dados reais
   - `AgingChart` - usar dados reais (receivable e payable)
   - `DREWaterfallChart` - calcular com dados reais
   - `ExpensesByCategoryChart` - agrupar de cash flow transactions

4. **Integrar alertas e insights**
   - Modificar `generateAllFinancialAlerts()` para usar dados reais
   - Modificar `generateFinancialInsights()` para usar dados reais

---

### **Sprint 3.5: Relatórios e Finalização** (2-3 dias)

#### 📋 Tarefas:

1. **Atualizar página de relatórios** (`admin/src/app/admin/financeiro/relatorios/page.tsx`)
   - Conectar todos os relatórios com backend
   - DRE (Demonstrativo de Resultados)
   - Balanço Patrimonial
   - Fluxo de Caixa Direto/Indireto
   - Análise Horizontal/Vertical

2. **Implementar exportações**
   - PDF de relatórios (usando jsPDF ou similar)
   - Excel/CSV com dados reais
   - Gráficos exportáveis

3. **Testes end-to-end**
   - Testar todos os fluxos integrados
   - Validar cálculos e métricas
   - Testar performance com dados volumosos

4. **Documentação**
   - Atualizar README com novas features
   - Documentar endpoints da API
   - Criar guia de uso para usuários

**Entrega Sprint 3:**
- ✅ Todos os componentes integrados com backend
- ✅ Zero dados mockados no Financeiro
- ✅ Hooks customizados para cada módulo
- ✅ Loading states e error handling
- ✅ Testes E2E passando

---

## 🎯 FASE 4: FUNCIONALIDADES AVANÇADAS (Opcional - 1-2 semanas)

### **Melhorias Adicionais:**

1. **Automação e Inteligência**
   - IA para categorização automática de transações
   - Previsão de inadimplência com ML
   - Sugestões inteligentes de ações

2. **Integrações Externas**
   - Integração bancária (Open Finance/Pluggy)
   - Importação automática de extratos
   - Conciliação bancária automática

3. **Notificações e Alertas**
   - Sistema de notificações em tempo real
   - E-mails automáticos de cobrança
   - WhatsApp API para lembretes

4. **Relatórios Avançados**
   - Budget vs. Real
   - Análise de variância
   - Forecasting financeiro
   - Dashboards personalizáveis

5. **Multi-moeda e Internacional**
   - Suporte a múltiplas moedas
   - Conversão automática
   - Contabilidade em IFRS

---

## 📈 CRONOGRAMA VISUAL

```
Semana 1-2:  [████████████] Fase 1: APIs Contas a Receber
Semana 3-4:  [████████████] Fase 2: APIs Fluxo de Caixa
Semana 5-6:  [████████████] Fase 3.1-3.3: Frontend AR + CF
Semana 7:    [██████------] Fase 3.4-3.5: Dashboard + Relatórios
Semana 8:    [████--------] Testes, Ajustes e Deploy (opcional)
```

---

## 🎯 CRITÉRIOS DE SUCESSO

### Métricas de Qualidade:

- ✅ **0 dados mockados** em produção
- ✅ **>90% cobertura de testes** no backend
- ✅ **<2s tempo de carregamento** das páginas
- ✅ **Zero regressões** em funcionalidades existentes
- ✅ **API Documentation completa** (Swagger/OpenAPI)

### Funcionalidades Obrigatórias:

- ✅ CRUD completo de Contas a Receber
- ✅ CRUD completo de Transações de Cash Flow
- ✅ Dashboard Financeiro totalmente integrado
- ✅ Relatórios de Aging funcionais
- ✅ Projeções de fluxo de caixa
- ✅ KPIs financeiros em tempo real
- ✅ Exportação de dados (CSV/Excel)
- ✅ Sistema de permissões (multi-tenant)

---

## 🚀 DEPLOY E ROLLOUT

### Estratégia de Deploy:

1. **Ambiente de Development**
   - Deploy contínuo de todas as branches
   - Testes automáticos

2. **Ambiente de Staging**
   - Deploy semanal após Sprint Review
   - Testes de aceitação com usuários beta

3. **Ambiente de Production**
   - Deploy após validação completa
   - Feature flags para rollout gradual
   - Monitoramento 24/7

### Rollback Plan:

- Manter dados mockados como fallback
- Feature toggle para desabilitar novas features
- Backup do banco antes de migrations
- Scripts de rollback de migrations prontos

---

## 📚 DEPENDÊNCIAS E PRÉ-REQUISITOS

### Backend:
- ✅ Python 3.9+
- ✅ FastAPI funcionando
- ✅ PostgreSQL/MySQL configurado
- ✅ Alembic para migrations
- ✅ Sistema de autenticação (JWT)
- ✅ Multi-tenancy implementado

### Frontend:
- ✅ Next.js 15
- ✅ TypeScript
- ✅ shadcn/ui components
- ✅ API client configurado
- ✅ Estado global (Context/Zustand)

### DevOps:
- ✅ CI/CD pipeline
- ✅ Ambientes de staging/production
- ✅ Monitoring (Sentry/LogRocket)
- ✅ Database backups automáticos

---

## 💰 ESTIMATIVA DE ESFORÇO

| Fase | Desenvolvedor Backend | Desenvolvedor Frontend | Total Horas |
|------|----------------------|------------------------|-------------|
| Fase 1 | 80h (2 semanas) | - | 80h |
| Fase 2 | 80h (2 semanas) | - | 80h |
| Fase 3 | - | 120h (3 semanas) | 120h |
| Testes/QA | 20h | 20h | 40h |
| **TOTAL** | **180h** | **140h** | **320h** |

**Equipe Sugerida:**
- 1 Desenvolvedor Backend Senior (Python/FastAPI)
- 1 Desenvolvedor Frontend Senior (React/Next.js)
- 1 QA Engineer (part-time)

**Prazo Total:** 6-8 semanas (1.5-2 meses)

---

## 📝 NOTAS FINAIS

### Riscos Identificados:

1. **Migração de dados existentes** - Se já houver dados mockados salvos por usuários
2. **Performance com grande volume** - Otimizar queries SQL com índices adequados
3. **Complexidade de cálculos** - Validar fórmulas financeiras com contador
4. **Breaking changes** - Garantir compatibilidade com versão atual

### Mitigações:

- Scripts de migração de dados
- Índices de banco otimizados
- Revisão por especialista financeiro
- Versionamento de API (v1, v2)
- Feature flags para rollout controlado

---

## ✅ CHECKLIST DE ENTREGA

### Backend:
- [ ] Modelo `AccountsReceivable` criado
- [ ] Modelo `CashFlowTransaction` criado
- [ ] Modelo `BankAccount` criado
- [ ] Migrations aplicadas
- [ ] CRUD completo de AR
- [ ] CRUD completo de CF
- [ ] Endpoints de analytics AR
- [ ] Endpoints de projeção CF
- [ ] Testes unitários >80%
- [ ] API documentation (Swagger)

### Frontend:
- [ ] Tipos TypeScript criados
- [ ] Serviços API implementados
- [ ] Hooks customizados criados
- [ ] Página AR integrada
- [ ] Página CF integrada
- [ ] Dashboard Financeiro integrado
- [ ] Relatórios integrados
- [ ] Loading states implementados
- [ ] Error handling implementado
- [ ] Modais de CRUD funcionais

### Deploy:
- [ ] Backend deployed em staging
- [ ] Frontend deployed em staging
- [ ] Testes E2E passando
- [ ] Performance validada
- [ ] Security audit completo
- [ ] Documentation atualizada
- [ ] Backup do banco realizado
- [ ] Deploy em production

---

**Última atualização:** 2025-01-30
**Versão:** 1.0
**Status:** 📋 Planejamento Aprovado - Aguardando Início
