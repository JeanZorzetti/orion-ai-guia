# 🔧 Roadmap: Auditoria e Correção Completa do Módulo Financeiro

**Objetivo**: Identificar e corrigir todas as discrepâncias, inconsistências, bugs críticos e faltas de integração no Módulo Financeiro do Orion ERP.

**URL Base**: https://orionerp.roilabs.com.br/admin/financeiro

---

## 📋 Status Atual

### ✅ Estrutura Existente
- [x] Dashboard Financeiro Principal implementado
- [x] Contas a Pagar com múltiplas sub-páginas
- [x] Contas a Receber com análise de risco
- [x] Fluxo de Caixa com projeções e cenários
- [x] Sistema de Relatórios
- [x] 50+ componentes criados
- [x] 30+ endpoints backend

### 🔴 PROBLEMAS CRÍTICOS IDENTIFICADOS

#### P0 - BLOQUEADORES (Bugs que quebram funcionalidade)
1. **Saldo incorreto em transferências** - `cash_flow.py:527-528`
   - Saldo não diminui na conta de origem
   - Sistema mostra saldo inflacionado
   - **IMPACTO**: Dados financeiros não confiáveis ❌

2. **Status AR não atualiza automaticamente**
   - Contas vencidas há 30 dias mostram `status: pendente`
   - Relatórios aging não conferem com realidade
   - **IMPACTO**: Gestão de crédito comprometida ❌

3. **DRE com dados hardcoded**
   - CMV = 38% da receita (fixo)
   - Despesas operacionais = 60% das saídas (fixo)
   - **IMPACTO**: DRE totalmente incorreta ❌

#### P1 - IMPORTANTES (Alta prioridade)
4. **Cálculo de aging inconsistente** - `page.tsx:217-233`
   - Data de vencimento == hoje é considerado "pendente", não "vencido"
   - Relatórios overdue com 1 dia de diferença
   - **IMPACTO**: Métricas financeiras imprecisas

5. **Contas a Pagar desconectada de Cash Flow**
   - AP não cria transações automáticas
   - Previsão não inclui AP pendentes
   - **IMPACTO**: Fluxo de caixa não reflete realidade

6. **Dois modelos de Invoice**
   - `invoice_model.py` vs `AccountsPayableInvoice`
   - Duplicação causa confusão
   - **IMPACTO**: Dados fragmentados

#### P2 - MELHORIAS (Média prioridade)
7. **Performance com >5000 registros**
   - Sem paginação real backend
   - Frontend carrega tudo em memória
   - **IMPACTO**: Lentidão em workspaces grandes

8. **Lazy loading incompleto**
   - InsightsPanel carrega sem lazy loading
   - Múltiplas chamadas de API simultâneas sem cache
   - **IMPACTO**: Renderização inicial lenta

9. **Sparklines com dados fictícios**
   - Fallback cria série aleatória (85%, 88%, 92%)
   - Não reflete tendência real
   - **IMPACTO**: Gráficos enganosos

#### P3 - FUNCIONALIDADES NÃO IMPLEMENTADAS
10. **Portal Fornecedor/Cliente** - Sem endpoints
11. **Conciliação Bancária** - Sem source de dados
12. **Risk Profile** - Sem cálculo de score
13. **Automação de Pagamentos** - Sem trigger/scheduler
14. **Integração Bancária** - Sem API de extrato

---

## 🎯 Fase 1: Auditoria Completa (Diagnóstico)

### 1.1. Frontend - Estrutura de Páginas

#### Dashboard Principal (`/admin/financeiro`)
**Arquivo**: `admin/src/app/admin/financeiro/page.tsx` (687 linhas)

**Componentes**:
- FilterBar (linhas 66-82): Filtros de período, refresh manual
- DashCards (linhas 549-638): 4 cards principais (Saldo, AP, AR, Resultado)
- LazyCharts (linhas 639-687): CashFlow, Aging, DRE, Expenses
- InsightsPanel (linha 590): **SEM lazy loading** ⚠️

**KPIs Calculados** (useMemo):
1. Saldo em Caixa (linha 151): Soma de todas as contas bancárias
2. Total AP (linha 161): Faturas pendentes + vencidas
3. Total AR (linha 172): Contas a receber pendentes
4. Resultado do Mês (linha 183): Receitas - Despesas do mês

**Problemas Identificados**:
- [ ] **Linha 79**: `window.location.reload()` força reload total (ruim para UX)
- [ ] **Linhas 101-102**: Lógica de vencimento incorreta
  ```typescript
  const isOverdue = diffDays <= 0; // ❌ ERRADO
  // Deveria ser: const isOverdue = diffDays < 0;
  ```
- [ ] **Linhas 217-233**: Aging buckets com lógica invertida
- [ ] **Linhas 294-309**: DRE hardcoded
  ```typescript
  const cmv = receitas * 0.38; // ❌ Percentual fixo
  const despesasOperacionais = despesas * 0.6; // ❌ Percentual fixo
  ```
- [ ] **Linhas 114-145**: Sparklines com fallback fictício
  ```typescript
  const fallbackData = Array.from({ length: 7 }, (_, i) => {
    return saldoAtual * (0.85 + i * 0.03); // ❌ Dados aleatórios
  });
  ```

**Checklist de Validação**:
- [ ] Saldo em Caixa confere com banco de dados
- [ ] Total AP confere com backend
- [ ] Total AR confere com backend
- [ ] Resultado do Mês está correto
- [ ] Gráficos mostram dados reais
- [ ] Sparklines não mostram dados fictícios

---

#### Contas a Pagar (`/admin/financeiro/contas-a-pagar`)

**Sub-páginas**:
1. `/contas-a-pagar` - Dashboard principal
2. `/contas-a-pagar/dashboard` - Dashboard específico
3. `/contas-a-pagar/aprovacoes` - Workflow de aprovações
4. `/contas-a-pagar/descontos` - Gestão de descontos
5. `/contas-a-pagar/conciliacao` - Conciliação bancária
6. `/contas-a-pagar/fornecedores` - Gestão de fornecedores
7. `/contas-a-pagar/portal-fornecedor` - Portal externo

**KPIs** (`APDashboardKPIs.tsx` - 12 cards):
1. Total a Pagar
2. Vencidos
3. Próximos 7 dias
4. Próximos 30 dias
5. DPO (Days Payable Outstanding)
6. Média de Pagamento
7. Ciclo Financeiro
8. Taxa de Atrasos
9. Descontos Obtidos
10. Economia Média
11. Concentração de Fornecedores
12. Índice de Pontualidade

**Problemas Identificados**:
- [ ] **Portal Fornecedor**: Sem endpoints backend
  - `GenerateSupplierAccessDialog.tsx` existe mas não funciona
  - Nenhum endpoint em `suppliers.py` para gerar tokens

- [ ] **Conciliação**: Página vazia
  - Componente existe mas sem dados
  - Nenhum endpoint para extrato bancário

- [ ] **Automação**: Regras não executam
  - `PaymentAutomationRules.tsx` cria regras
  - Nenhum scheduler para executá-las

**Checklist de Validação**:
- [ ] KPIs de AP conferem com banco de dados
- [ ] Aging report confere com backend
- [ ] Workflow de aprovação funciona
- [ ] Portal de fornecedor gera links válidos
- [ ] Conciliação tem dados reais
- [ ] Automações executam conforme regras

---

#### Contas a Receber (`/admin/financeiro/contas-a-receber`)

**Sub-páginas**:
1. `/contas-a-receber` - Dashboard principal
2. `/contas-a-receber/analise-risco` - Análise de crédito
3. `/contas-a-receber/automacao` - Cobranças automáticas
4. `/contas-a-receber/pagamentos` - Registro rápido

**KPIs** (`ARDashboardKPIs.tsx` - 8 cards):
1. DSO (Days Sales Outstanding)
2. Taxa de Inadimplência
3. Previsão 30 dias
4. Eficiência de Cobrança
5. Ticket Médio
6. Concentração de Clientes
7. Total a Receber
8. Vencidos

**Problemas Identificados**:
- [ ] **Linha 101**: Status não atualiza automaticamente
  ```typescript
  ar.status === 'pendente' // ❌ Mesmo depois de vencida
  ```

- [ ] **Risk Profile sem dados**:
  - `useAllCustomerRiskScores()` retorna vazio
  - Nenhum endpoint calcula risk score
  - Página de análise de risco não funciona

- [ ] **Automação sem trigger**:
  - Componentes `AutomatedReminders` criados
  - Nenhum job para disparar lembretes
  - Regras salvas mas não executadas

**Checklist de Validação**:
- [ ] KPIs de AR conferem com banco de dados
- [ ] DSO está correto (fórmula: AR / (Receita/Dias))
- [ ] Taxa de inadimplência correta
- [ ] Risk scores calculados para todos os clientes
- [ ] Automações disparam conforme regras
- [ ] Portal cliente gera links válidos

---

#### Fluxo de Caixa (`/admin/financeiro/fluxo-caixa`)

**Componentes Principais**:
- `FinancialKPIs.tsx` - Liquidez, Ciclo, Rentabilidade, Burn Rate, Runway
- `CashFlowProjection.tsx` - Projeção 12 meses
- `ScenarioAnalysis.tsx` - Cenários Otimista/Realista/Pessimista
- `BreakEvenAnalysis.tsx` - Ponto de equilíbrio
- `MultiAccountManagement.tsx` - Múltiplas contas
- `ImpactSimulator.tsx` - **Modificado no git** ⚠️

**Problemas Identificados**:
- [ ] **Bug CRÍTICO em Transferências** (`cash_flow.py:527-528`):
  ```python
  # Linha 527-528: ❌ AMBAS transações somam ao saldo
  from_account.current_balance = (
      current_balance + amount if not add else current_balance - amount
  )
  to_account.current_balance = (
      current_balance + amount if not add else current_balance - amount
  )
  # RESULTADO: Saldo de origem não diminui!
  ```

- [ ] **Projeção sem integração**:
  - Projeção calcula apenas baseado em histórico
  - Não inclui AP pendentes
  - Não inclui AR a vencer
  - **IMPACTO**: Projeção inútil para planejamento

- [ ] **ImpactSimulator modificado**:
  - Arquivo aparece no git status como alterado
  - Verificar se há bugs introduzidos

**Checklist de Validação**:
- [ ] Saldo de todas as contas está correto
- [ ] Transferências diminuem saldo de origem
- [ ] Transferências aumentam saldo de destino
- [ ] Projeção inclui AP pendentes
- [ ] Projeção inclui AR a vencer
- [ ] Cenários calculados corretamente
- [ ] Break-even correto
- [ ] ImpactSimulator funciona sem erros

---

#### Relatórios (`/admin/financeiro/relatorios`)

**Componentes**:
- `ExecutiveDashboard.tsx` - Dashboard executivo
- `ReportBuilder.tsx` - Construtor de relatórios
- `ReportTemplates.tsx` - Templates pré-definidos
- `ScheduledReportsList.tsx` - Agendamentos

**Problemas Identificados**:
- [ ] **ReportBuilder provavelmente mockado**:
  - Drag-and-drop não implementado
  - Customização visual não funciona

- [ ] **Scheduled Reports sem scheduler**:
  - UI existe para criar agendamentos
  - Nenhum cron job para executar

**Checklist de Validação**:
- [ ] Executive Dashboard mostra dados reais
- [ ] Report Builder gera PDFs válidos
- [ ] Templates funcionam corretamente
- [ ] Relatórios agendados executam no horário
- [ ] Envio de relatórios por email funciona

---

### 1.2. Backend - Análise de Endpoints

#### Cash Flow (`cash_flow.py`) - 571 linhas

**Endpoints Principais** (11 rotas):
1. `POST /bank-accounts` - Criar conta
2. `GET /bank-accounts` - Listar contas
3. `GET /bank-accounts/{account_id}` - Obter conta
4. `PATCH /bank-accounts/{account_id}` - Atualizar conta
5. `DELETE /bank-accounts/{account_id}` - Deletar conta
6. `POST /transactions` - Criar transação
7. `GET /transactions` - Listar transações
8. `GET /transactions/{transaction_id}` - Obter transação
9. `PATCH /transactions/{transaction_id}` - Atualizar transação
10. `DELETE /transactions/{transaction_id}` - Deletar transação
11. `POST /transfer` - **Transferência entre contas** 🔴

**PROBLEMA CRÍTICO** (Linhas 487-537):
```python
@router.post("/transfer", status_code=status.HTTP_201_CREATED)
def create_transfer(
    transfer_data: TransferCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # ... validações ...

    # Linha 511: Cria transação de SAÍDA
    from_transaction = CashFlowTransaction(
        workspace_id=workspace_id,
        bank_account_id=from_account.id,
        transaction_type="saida",
        amount=amount,
        # ...
    )

    # Linha 520: Cria transação de ENTRADA
    to_transaction = CashFlowTransaction(
        workspace_id=workspace_id,
        bank_account_id=to_account.id,
        transaction_type="entrada",
        amount=amount,
        # ...
    )

    # Linhas 527-528: ❌ BUG AQUI
    from_account.current_balance = (
        from_account.current_balance + amount  # ❌ DEVERIA SER -amount
        if not transfer_data.add
        else from_account.current_balance - amount
    )

    to_account.current_balance = (
        to_account.current_balance + amount  # ✅ Correto
        if transfer_data.add
        else to_account.current_balance - amount
    )
```

**Análise do Bug**:
- Lógica invertida na conta de origem
- `add=True` deveria SOMAR na conta destino e SUBTRAIR na origem
- Atualmente SOMA em ambas
- **IMPACTO**: Saldo em caixa inflacionado, dados financeiros não confiáveis

**Checklist de Validação**:
- [ ] Transferência funciona corretamente
- [ ] Saldo de origem diminui
- [ ] Saldo de destino aumenta
- [ ] Transações criadas têm link entre si
- [ ] Histórico de saldo recalculado após transação

---

#### Accounts Receivable (`accounts_receivable.py`) - 424 linhas

**Endpoints de Analytics** (3 rotas):
1. `GET /analytics/summary` - Resumo (DSO, inadimplência, total)
2. `GET /analytics/aging` - Aging buckets (0-30, 31-60, 61-90, 90+)
3. `GET /analytics/by-customer` - Resumo por cliente

**PROBLEMA** (Linhas 372-393):
```python
@router.get("/analytics/summary")
def get_analytics_summary(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Linha 387: Query base
    query = db.query(AccountsReceivable).filter(
        AccountsReceivable.workspace_id == workspace_id,
        AccountsReceivable.status == "pendente"  # ❌ NÃO atualiza status
    )

    # ... cálculos ...
```

**Análise do Problema**:
- Status nunca é atualizado automaticamente
- Conta vencida há 30 dias ainda tem `status="pendente"`
- Query filtra por `status="pendente"` mas deveria verificar `due_date`
- **IMPACTO**: Relatórios aging mostram valores incorretos

**Solução**:
```python
# OPÇÃO 1: Atualizar status em job noturno
@scheduler.scheduled_job('cron', hour=0, minute=0)
def update_overdue_receivables():
    db = SessionLocal()
    today = date.today()

    overdue = db.query(AccountsReceivable).filter(
        AccountsReceivable.status == "pendente",
        AccountsReceivable.due_date < today
    ).all()

    for ar in overdue:
        ar.status = "vencido"

    db.commit()

# OPÇÃO 2: Calcular dinamicamente (melhor)
@router.get("/analytics/summary")
def get_analytics_summary(...):
    today = date.today()

    # Contas realmente vencidas (independente do status)
    overdue_query = db.query(AccountsReceivable).filter(
        AccountsReceivable.workspace_id == workspace_id,
        AccountsReceivable.status.in_(["pendente", "parcial"]),
        AccountsReceivable.due_date < today  # ✅ Checa data de vencimento
    )
```

**Checklist de Validação**:
- [ ] Status atualiza automaticamente (job noturno)
- [ ] Ou cálculos ignoram status e usam due_date
- [ ] DSO calculado corretamente
- [ ] Taxa de inadimplência correta
- [ ] Aging report confere com dados reais

---

#### Accounts Payable (`accounts_payable.py`)

**Endpoints de Suppliers**:
1. `POST /suppliers` - Criar fornecedor
2. `GET /suppliers` - Listar fornecedores
3. `GET /suppliers/{supplier_id}` - Obter fornecedor
4. `PUT /suppliers/{supplier_id}` - Atualizar fornecedor
5. `DELETE /suppliers/{supplier_id}` - Deletar fornecedor

**Endpoints de Invoices**:
1. `POST /invoices` - Criar fatura
2. `GET /invoices` - Listar faturas
3. Outros endpoints (arquivo incompleto no relatório)

**PROBLEMA**: Sem integração com Cash Flow
```python
# accounts_payable.py: Criar fatura
@router.post("/invoices")
def create_invoice(invoice_data: APInvoiceCreate, ...):
    invoice = AccountsPayableInvoice(**invoice_data.dict())
    db.add(invoice)
    db.commit()

    # ❌ NÃO cria transação em CashFlowTransaction
    # ❌ Previsão de caixa não inclui esta fatura
```

**Solução**:
```python
@router.post("/invoices")
def create_invoice(invoice_data: APInvoiceCreate, ...):
    # 1. Criar fatura
    invoice = AccountsPayableInvoice(**invoice_data.dict())
    db.add(invoice)
    db.flush()  # Para obter invoice.id

    # 2. Criar transação projetada em Cash Flow
    if invoice.due_date:
        projected_transaction = CashFlowTransaction(
            workspace_id=workspace_id,
            transaction_type="saida",
            category="contas_a_pagar",
            amount=invoice.total_value,
            date=invoice.due_date,
            status="projetada",  # ✅ Novo status
            description=f"Fatura #{invoice.invoice_number} - {invoice.supplier.name}",
            related_invoice_id=invoice.id,  # ✅ Foreign key
        )
        db.add(projected_transaction)

    db.commit()
```

**Checklist de Validação**:
- [ ] Faturas AP criam transações projetadas
- [ ] Projeção de caixa inclui AP pendentes
- [ ] Portal de fornecedor funciona
- [ ] Workflow de aprovação integrado

---

#### Cash Flow Analytics (`cash_flow_analytics.py`)

**Endpoints Avançados** (10+ rotas):
1. `GET /analytics/summary` - Resumo do período
2. `GET /analytics/by-category` - Por categoria
3. `GET /analytics/balance-history` - Histórico de saldo
4. `GET /analytics/projection` - Projeção 12 meses
5. `GET /analytics/complete` - KPIs completos
6. `GET /kpis/break-even` - Break-even
7. `GET /scenarios` - Análise de cenários
8. `POST /scenarios/compare` - Comparação
9. `POST /simulate` - Simulação de impacto
10. Alertas e recomendações

**PROBLEMA**: Projeção não integrada
```python
@router.get("/analytics/projection")
def get_projection(...):
    # Calcula projeção baseado apenas em histórico
    historical_avg = calculate_avg_by_category(transactions)

    projection = []
    for month in range(12):
        # ❌ Usa apenas média histórica
        projected_income = historical_avg['entradas']
        projected_expense = historical_avg['saidas']

        projection.append({
            'month': month,
            'income': projected_income,
            'expense': projected_expense
        })

    # ❌ NÃO inclui:
    # - AP pendentes com due_date futuro
    # - AR a vencer com due_date futuro
    # - Contratos recorrentes
```

**Solução**:
```python
@router.get("/analytics/projection")
def get_projection(...):
    # 1. Média histórica
    historical_avg = calculate_avg_by_category(transactions)

    # 2. AP pendentes agrupados por mês
    ap_by_month = db.query(
        extract('year', AccountsPayableInvoice.due_date),
        extract('month', AccountsPayableInvoice.due_date),
        func.sum(AccountsPayableInvoice.total_value)
    ).filter(
        AccountsPayableInvoice.workspace_id == workspace_id,
        AccountsPayableInvoice.status.in_(['pendente', 'aprovado']),
        AccountsPayableInvoice.due_date.isnot(None)
    ).group_by('year', 'month').all()

    # 3. AR a vencer agrupados por mês
    ar_by_month = db.query(
        extract('year', AccountsReceivable.due_date),
        extract('month', AccountsReceivable.due_date),
        func.sum(AccountsReceivable.amount)
    ).filter(
        AccountsReceivable.workspace_id == workspace_id,
        AccountsReceivable.status.in_(['pendente', 'parcial']),
        AccountsReceivable.due_date.isnot(None)
    ).group_by('year', 'month').all()

    # 4. Combinar tudo na projeção
    projection = []
    for month in range(12):
        projected_income = historical_avg['entradas'] + ar_by_month.get(month, 0)
        projected_expense = historical_avg['saidas'] + ap_by_month.get(month, 0)

        projection.append({
            'month': month,
            'income': projected_income,
            'expense': projected_expense,
            'net': projected_income - projected_expense
        })
```

**Checklist de Validação**:
- [ ] Projeção inclui AP pendentes
- [ ] Projeção inclui AR a vencer
- [ ] Cenários calculados corretamente
- [ ] Break-even correto
- [ ] Alertas disparam quando deveria

---

### 1.3. Database - Análise de Estrutura

#### Modelos Financeiros

**CashFlowBankAccount** (Contas Bancárias):
```python
class CashFlowBankAccount(Base):
    id: int
    workspace_id: int
    name: str
    bank_name: Optional[str]
    account_number: Optional[str]
    account_type: str  # corrente, poupanca, investimento
    current_balance: float  # ⚠️ Atualizado manualmente
    initial_balance: float
    currency: str = "BRL"
    active: bool = True
    created_at: datetime
    updated_at: datetime
```

**Problemas**:
- [ ] `current_balance` pode ficar dessincronizado
- [ ] Não há trigger para recalcular saldo automaticamente
- [ ] Transferências podem deixar saldo inconsistente

**Solução**:
```sql
-- Trigger para recalcular saldo após insert/update/delete de transação
CREATE OR REPLACE FUNCTION recalculate_bank_account_balance()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE cash_flow_bank_accounts
    SET current_balance = (
        SELECT initial_balance + COALESCE(SUM(
            CASE
                WHEN transaction_type = 'entrada' THEN amount
                WHEN transaction_type = 'saida' THEN -amount
                ELSE 0
            END
        ), 0)
        FROM cash_flow_transactions
        WHERE bank_account_id = NEW.bank_account_id
          AND workspace_id = NEW.workspace_id
    )
    WHERE id = NEW.bank_account_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_recalculate_balance
AFTER INSERT OR UPDATE OR DELETE ON cash_flow_transactions
FOR EACH ROW
EXECUTE FUNCTION recalculate_bank_account_balance();
```

---

**CashFlowTransaction** (Transações):
```python
class CashFlowTransaction(Base):
    id: int
    workspace_id: int
    bank_account_id: int  # FK para CashFlowBankAccount
    transaction_type: str  # entrada, saida
    category: str
    amount: float
    date: date
    description: Optional[str]
    reference: Optional[str]
    is_reconciled: bool = False
    tags: Optional[List[str]]
    attachments: Optional[List[str]]
    created_by: int
    created_at: datetime
    updated_at: datetime
```

**Problemas**:
- [ ] Sem campo `status` para transações projetadas
- [ ] Sem `related_invoice_id` para vincular com AP/AR
- [ ] Sem `transfer_id` para vincular transferências

**Solução**:
```python
class CashFlowTransaction(Base):
    # ... campos existentes ...

    # ✅ Adicionar:
    status: str = "realizada"  # realizada, projetada, cancelada
    related_ap_invoice_id: Optional[int]  # FK para AccountsPayableInvoice
    related_ar_id: Optional[int]  # FK para AccountsReceivable
    transfer_id: Optional[str]  # UUID para vincular pares de transferência
```

---

**AccountsReceivable** (Contas a Receber):
```python
class AccountsReceivable(Base):
    id: int
    workspace_id: int
    customer_id: Optional[int]
    customer_name: str
    amount: float
    due_date: date
    status: str  # pendente, parcial, pago, vencido, cancelado
    payment_date: Optional[date]
    payment_amount: Optional[float]
    description: Optional[str]
    invoice_number: Optional[str]
    created_at: datetime
    updated_at: datetime
```

**Problemas**:
- [ ] Status não atualiza automaticamente quando `due_date < today`
- [ ] Sem campo `days_overdue` calculado
- [ ] Sem campo `risk_score`

**Solução**:
```sql
-- View materializada para AR com campos calculados
CREATE MATERIALIZED VIEW accounts_receivable_view AS
SELECT
    ar.*,
    CASE
        WHEN ar.status = 'pago' THEN 0
        WHEN ar.due_date >= CURRENT_DATE THEN 0
        ELSE CURRENT_DATE - ar.due_date
    END AS days_overdue,
    CASE
        WHEN ar.status = 'pago' THEN 'paid'
        WHEN ar.due_date >= CURRENT_DATE THEN 'pending'
        WHEN CURRENT_DATE - ar.due_date <= 30 THEN 'overdue_30'
        WHEN CURRENT_DATE - ar.due_date <= 60 THEN 'overdue_60'
        WHEN CURRENT_DATE - ar.due_date <= 90 THEN 'overdue_90'
        ELSE 'overdue_90_plus'
    END AS aging_bucket
FROM accounts_receivable ar;

-- Refresh automático a cada hora
CREATE INDEX idx_ar_view_workspace ON accounts_receivable_view(workspace_id);
REFRESH MATERIALIZED VIEW CONCURRENTLY accounts_receivable_view;
```

---

**AccountsPayableInvoice** vs **Invoice**:

**PROBLEMA**: Dois modelos diferentes para faturas

1. `backend/app/models/accounts_payable.py`:
```python
class AccountsPayableInvoice(Base):
    __tablename__ = "accounts_payable_invoices"
    # ... campos específicos de AP
```

2. `backend/app/models/invoice_model.py`:
```python
class Invoice(Base):
    __tablename__ = "invoices"
    # ... campos gerais
```

**Impacto**:
- Confusão sobre qual usar
- Dados fragmentados
- Endpoints duplicados

**Solução**:
```python
# Consolidar em um único modelo com type discriminator
class Invoice(Base):
    __tablename__ = "invoices"

    id: int
    workspace_id: int
    invoice_type: str  # payable, receivable, internal

    # Campos comuns
    invoice_number: str
    amount: float
    due_date: date
    status: str
    description: Optional[str]

    # Campos específicos (nullable)
    supplier_id: Optional[int]  # Para AP
    customer_id: Optional[int]  # Para AR

    # Relacionamentos
    supplier: Optional["Supplier"]
    customer: Optional["Customer"]

    # Discriminator
    __mapper_args__ = {
        "polymorphic_identity": "invoice",
        "polymorphic_on": invoice_type,
    }
```

---

## 🔨 Fase 2: Correções Prioritárias

### 2.1. Prioridade CRÍTICA (P0) - Dados Básicos

#### Issue #1: Saldo Incorreto em Transferências

**Problema**: Bug crítico em `cash_flow.py:527-528`

**Diagnóstico**:
```python
# Código atual (ERRADO):
from_account.current_balance = (
    from_account.current_balance + amount  # ❌ Soma quando deveria subtrair
    if not transfer_data.add
    else from_account.current_balance - amount
)
```

**Cenário de Teste**:
1. Conta A tem R$ 1.000
2. Conta B tem R$ 500
3. Transferir R$ 200 de A para B
4. **Esperado**: A = R$ 800, B = R$ 700
5. **Atual**: A = R$ 1.200, B = R$ 700 ❌

**Solução**:
```python
# Arquivo: backend/app/api/api_v1/endpoints/cash_flow.py
# Linhas: 527-537

# CORRETO:
from_account.current_balance -= amount  # ✅ Sempre subtrai da origem
to_account.current_balance += amount     # ✅ Sempre soma no destino

db.add(from_transaction)
db.add(to_transaction)
db.commit()
db.refresh(from_account)
db.refresh(to_account)

return {
    "message": "Transferência realizada com sucesso",
    "from_transaction": from_transaction,
    "to_transaction": to_transaction,
    "from_balance": from_account.current_balance,
    "to_balance": to_account.current_balance
}
```

**Testes**:
```python
def test_transfer_decreases_from_account():
    # Arrange
    from_account = create_account(balance=1000)
    to_account = create_account(balance=500)

    # Act
    transfer(from_id=from_account.id, to_id=to_account.id, amount=200)

    # Assert
    assert from_account.current_balance == 800
    assert to_account.current_balance == 700
```

**Arquivo**: `backend/app/api/api_v1/endpoints/cash_flow.py`
**Linhas**: 527-537
**Prioridade**: 🔴 **P0** - Bug crítico que corrompe dados financeiros

---

#### Issue #2: Status AR não Atualiza Automaticamente

**Problema**: Contas vencidas há 30 dias ainda mostram `status: pendente`

**Diagnóstico**:
- Backend nunca atualiza `status` baseado em `due_date`
- Analytics filtram por `status="pendente"` mas deveriam usar `due_date < today`

**Solução Imediata** (Backend):
```python
# Arquivo: backend/app/api/api_v1/endpoints/accounts_receivable.py
# Modificar: get_analytics_summary()

@router.get("/analytics/summary")
def get_analytics_summary(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    today = date.today()
    workspace_id = current_user.workspace_id

    # ✅ Query correta: ignora status, usa due_date
    base_query = db.query(AccountsReceivable).filter(
        AccountsReceivable.workspace_id == workspace_id,
        AccountsReceivable.status.in_(["pendente", "parcial"])  # Não inclui "pago"
    )

    # Total a receber (pendentes + vencidas)
    total_ar = base_query.with_entities(
        func.sum(AccountsReceivable.amount)
    ).scalar() or 0

    # Vencidas (baseado em due_date, não status)
    overdue_ar = base_query.filter(
        AccountsReceivable.due_date < today  # ✅ Checa data
    ).with_entities(
        func.sum(AccountsReceivable.amount)
    ).scalar() or 0

    # ... resto do código
```

**Solução Permanente** (Job Noturno):
```python
# Arquivo: backend/app/scheduler/jobs.py (CRIAR)

from apscheduler.schedulers.background import BackgroundScheduler
from datetime import date
from app.core.database import SessionLocal
from app.models.accounts_receivable import AccountsReceivable

scheduler = BackgroundScheduler()

@scheduler.scheduled_job('cron', hour=0, minute=0)  # Todo dia à meia-noite
def update_overdue_ar_status():
    """Atualiza status de AR vencidas"""
    db = SessionLocal()
    today = date.today()

    try:
        # Atualizar contas que venceram
        updated = db.query(AccountsReceivable).filter(
            AccountsReceivable.status == "pendente",
            AccountsReceivable.due_date < today
        ).update({"status": "vencido"}, synchronize_session=False)

        db.commit()
        print(f"✅ {updated} contas a receber marcadas como vencidas")

    except Exception as e:
        db.rollback()
        print(f"❌ Erro ao atualizar status AR: {e}")
    finally:
        db.close()

scheduler.start()
```

**Arquivo**: `backend/app/api/api_v1/endpoints/accounts_receivable.py`
**Linhas**: 372-393
**Prioridade**: 🔴 **P0** - Dados financeiros incorretos

---

#### Issue #3: DRE com Dados Hardcoded

**Problema**: CMV e Despesas Operacionais usam percentuais fixos

**Código Atual** (`page.tsx:294-309`):
```typescript
// ❌ HARDCODED
const cmv = receitas * 0.38;  // 38% fixo
const despesasOperacionais = despesas * 0.6;  // 60% fixo

const lucroOperacional = receitaLiquida - despesasOperacionais;
const ebitda = lucroOperacional;
const lucroLiquido = lucroOperacional - impostos;
```

**Solução 1** (Backend - Endpoint Novo):
```python
# Arquivo: backend/app/api/api_v1/endpoints/cash_flow_analytics.py
# Adicionar endpoint: GET /analytics/dre

@router.get("/analytics/dre")
def get_dre_analysis(
    start_date: date,
    end_date: date,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Calcula DRE baseado em dados reais, não estimativas.
    """
    workspace_id = current_user.workspace_id

    # 1. Receitas (vendas concluídas)
    receitas = db.query(
        func.sum(Sale.total_value)
    ).filter(
        Sale.workspace_id == workspace_id,
        Sale.status == "completed",
        Sale.sale_date >= start_date,
        Sale.sale_date <= end_date
    ).scalar() or 0

    # 2. CMV real (custo dos produtos vendidos)
    cmv = db.query(
        func.sum(Sale.quantity * Product.cost_price)
    ).join(Product).filter(
        Sale.workspace_id == workspace_id,
        Sale.status == "completed",
        Sale.sale_date >= start_date,
        Sale.sale_date <= end_date
    ).scalar() or 0

    # 3. Despesas operacionais reais (categorias específicas)
    despesas_operacionais = db.query(
        func.sum(CashFlowTransaction.amount)
    ).filter(
        CashFlowTransaction.workspace_id == workspace_id,
        CashFlowTransaction.transaction_type == "saida",
        CashFlowTransaction.category.in_([
            "salarios", "aluguel", "marketing", "administrativo"
        ]),
        CashFlowTransaction.date >= start_date,
        CashFlowTransaction.date <= end_date
    ).scalar() or 0

    # 4. Impostos (categoria específica)
    impostos = db.query(
        func.sum(CashFlowTransaction.amount)
    ).filter(
        CashFlowTransaction.workspace_id == workspace_id,
        CashFlowTransaction.category == "impostos",
        CashFlowTransaction.date >= start_date,
        CashFlowTransaction.date <= end_date
    ).scalar() or 0

    # 5. Cálculos DRE
    receita_liquida = receitas - cmv
    lucro_bruto = receita_liquida
    lucro_operacional = lucro_bruto - despesas_operacionais
    ebitda = lucro_operacional  # Simplificado
    lucro_liquido = lucro_operacional - impostos

    return {
        "receitas": receitas,
        "cmv": cmv,
        "receita_liquida": receita_liquida,
        "lucro_bruto": lucro_bruto,
        "despesas_operacionais": despesas_operacionais,
        "lucro_operacional": lucro_operacional,
        "ebitda": ebitda,
        "impostos": impostos,
        "lucro_liquido": lucro_liquido,
        "margens": {
            "margem_bruta": (lucro_bruto / receitas * 100) if receitas > 0 else 0,
            "margem_operacional": (lucro_operacional / receitas * 100) if receitas > 0 else 0,
            "margem_liquida": (lucro_liquido / receitas * 100) if receitas > 0 else 0
        }
    }
```

**Solução 2** (Frontend - Usar novo endpoint):
```typescript
// Arquivo: admin/src/app/admin/financeiro/page.tsx
// Substituir linhas 294-309

const dreData = useMemo(() => {
  // ✅ Buscar do backend (dados reais)
  if (!analytics || !analytics.dre) {
    return null;
  }

  return [
    { stage: 'Receitas', value: analytics.dre.receitas, color: '#10B981' },
    { stage: 'CMV', value: -analytics.dre.cmv, color: '#EF4444' },
    { stage: 'Lucro Bruto', value: analytics.dre.lucro_bruto, color: '#3B82F6' },
    { stage: 'Desp. Operacionais', value: -analytics.dre.despesas_operacionais, color: '#F59E0B' },
    { stage: 'Lucro Operacional', value: analytics.dre.lucro_operacional, color: '#8B5CF6' },
    { stage: 'Impostos', value: -analytics.dre.impostos, color: '#EC4899' },
    { stage: 'Lucro Líquido', value: analytics.dre.lucro_liquido, color: analytics.dre.lucro_liquido >= 0 ? '#10B981' : '#EF4444' }
  ];
}, [analytics]);
```

**Arquivo**: `admin/src/app/admin/financeiro/page.tsx`
**Linhas**: 294-309
**Prioridade**: 🔴 **P0** - DRE totalmente incorreta

---

### 2.2. Prioridade ALTA (P1) - Integrações

#### Issue #4: Cálculo de Aging Inconsistente

**Problema**: Lógica de vencimento incorreta

**Código Atual** (`page.tsx:217-233`):
```typescript
const agingData = useMemo(() => {
  const buckets = { atual: [], vencido30: [], vencido60: [], vencido90: [], vencido90Plus: [] };

  accountsReceivable.forEach((ar) => {
    if (ar.status === 'pago') return;

    const today = new Date();
    const dueDate = new Date(ar.due_date);
    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    // ❌ PROBLEMA: diffDays <= 0 inclui dia de hoje
    const isOverdue = diffDays <= 0;

    if (!isOverdue) {
      buckets.atual.push(ar);
    } else if (Math.abs(diffDays) <= 30) {
      // ...
    }
  });
}, [accountsReceivable]);
```

**Análise**:
- Se `due_date = hoje`, `diffDays = 0`
- Código considera `0 <= 0` = vencido ❌
- Deveria ser apenas `diffDays < 0`

**Solução**:
```typescript
const agingData = useMemo(() => {
  const buckets = {
    atual: [],      // A vencer (due_date >= hoje)
    vencido30: [],  // 1-30 dias vencido
    vencido60: [],  // 31-60 dias
    vencido90: [],  // 61-90 dias
    vencido90Plus: [] // 90+ dias
  };

  accountsReceivable.forEach((ar) => {
    if (ar.status === 'pago') return;

    const today = startOfDay(new Date());  // ✅ Zerar horas
    const dueDate = startOfDay(new Date(ar.due_date));
    const diffDays = differenceInDays(dueDate, today);  // ✅ date-fns

    // ✅ CORRETO: apenas negativo é vencido
    if (diffDays >= 0) {
      buckets.atual.push(ar);
    } else if (Math.abs(diffDays) <= 30) {
      buckets.vencido30.push(ar);
    } else if (Math.abs(diffDays) <= 60) {
      buckets.vencido60.push(ar);
    } else if (Math.abs(diffDays) <= 90) {
      buckets.vencido90.push(ar);
    } else {
      buckets.vencido90Plus.push(ar);
    }
  });

  return buckets;
}, [accountsReceivable]);
```

**Arquivo**: `admin/src/app/admin/financeiro/page.tsx`
**Linhas**: 217-233
**Prioridade**: 🟠 **P1** - Métricas financeiras imprecisas

---

#### Issue #5: Contas a Pagar Desconectada de Cash Flow

**Problema**: AP não cria transações em Cash Flow

**Solução** (Integração):
```python
# Arquivo: backend/app/api/api_v1/endpoints/accounts_payable.py

@router.post("/invoices", status_code=status.HTTP_201_CREATED)
def create_invoice(
    invoice_data: APInvoiceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    workspace_id = current_user.workspace_id

    # 1. Criar fatura AP
    invoice = AccountsPayableInvoice(
        **invoice_data.dict(),
        workspace_id=workspace_id
    )
    db.add(invoice)
    db.flush()

    # 2. ✅ Criar transação projetada em Cash Flow
    if invoice.due_date and invoice.status in ["pendente", "aprovado"]:
        projected_transaction = CashFlowTransaction(
            workspace_id=workspace_id,
            transaction_type="saida",
            category="contas_a_pagar",
            amount=invoice.total_value,
            date=invoice.due_date,
            status="projetada",  # ✅ Novo campo
            description=f"Fatura #{invoice.invoice_number} - {invoice.supplier.name}",
            related_ap_invoice_id=invoice.id,  # ✅ Foreign key
        )
        db.add(projected_transaction)

    db.commit()
    db.refresh(invoice)

    return invoice

@router.patch("/invoices/{invoice_id}/pay")
def pay_invoice(
    invoice_id: int,
    payment_data: PaymentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # 1. Atualizar fatura
    invoice = get_invoice(invoice_id, db, current_user)
    invoice.status = "pago"
    invoice.payment_date = payment_data.payment_date

    # 2. ✅ Atualizar transação projetada para realizada
    projected = db.query(CashFlowTransaction).filter(
        CashFlowTransaction.related_ap_invoice_id == invoice_id,
        CashFlowTransaction.status == "projetada"
    ).first()

    if projected:
        projected.status = "realizada"
        projected.date = payment_data.payment_date
        projected.bank_account_id = payment_data.bank_account_id

    db.commit()

    return invoice
```

**Migração de Banco** (adicionar campos):
```sql
-- migration_xxx_integrate_ap_cashflow.sql

ALTER TABLE cash_flow_transactions
ADD COLUMN status VARCHAR(20) DEFAULT 'realizada',
ADD COLUMN related_ap_invoice_id INTEGER REFERENCES accounts_payable_invoices(id),
ADD COLUMN related_ar_id INTEGER REFERENCES accounts_receivable(id),
ADD COLUMN transfer_id VARCHAR(36);

CREATE INDEX idx_cf_trans_status ON cash_flow_transactions(status);
CREATE INDEX idx_cf_trans_ap_invoice ON cash_flow_transactions(related_ap_invoice_id);
CREATE INDEX idx_cf_trans_ar ON cash_flow_transactions(related_ar_id);
```

**Prioridade**: 🟠 **P1** - Fluxo de caixa não reflete realidade

---

#### Issue #6: Dois Modelos de Invoice

**Problema**: `Invoice` vs `AccountsPayableInvoice` causam confusão

**Solução** (Consolidação):
```python
# Arquivo: backend/app/models/invoice.py (UNIFICADO)

from sqlalchemy import Column, Integer, String, Float, Date, ForeignKey, Enum
from sqlalchemy.orm import relationship
import enum

class InvoiceType(str, enum.Enum):
    PAYABLE = "payable"      # Contas a pagar
    RECEIVABLE = "receivable"  # Contas a receber
    INTERNAL = "internal"    # Nota fiscal interna

class Invoice(Base):
    __tablename__ = "invoices"

    # Campos comuns
    id = Column(Integer, primary_key=True)
    workspace_id = Column(Integer, ForeignKey("workspaces.id"), nullable=False)
    invoice_type = Column(Enum(InvoiceType), nullable=False)
    invoice_number = Column(String(100), nullable=False)
    amount = Column(Float, nullable=False)
    due_date = Column(Date, nullable=False)
    status = Column(String(50), default="pendente")
    payment_date = Column(Date, nullable=True)
    description = Column(String(500))

    # Campos específicos (nullable)
    supplier_id = Column(Integer, ForeignKey("suppliers.id"), nullable=True)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=True)

    # Relacionamentos
    workspace = relationship("Workspace")
    supplier = relationship("Supplier")
    customer = relationship("Customer")

    # Discriminator
    __mapper_args__ = {
        "polymorphic_identity": "invoice",
        "polymorphic_on": invoice_type,
    }

# Migrations
# 1. Criar nova tabela unificada
# 2. Migrar dados de accounts_payable_invoices
# 3. Migrar dados de invoices antigas
# 4. Dropar tabelas antigas
```

**Prioridade**: 🟠 **P1** - Arquitetura fragmentada

---

### 2.3. Prioridade MÉDIA (P2) - Performance

#### Issue #7: Performance com >5000 Registros

**Problema**: Sem paginação real backend

**Solução** (Backend):
```python
# Arquivo: backend/app/api/api_v1/endpoints/accounts_receivable.py

@router.get("/", response_model=PaginatedARResponse)
def get_accounts_receivable(
    skip: int = 0,
    limit: int = 50,  # ✅ Padrão menor
    status: Optional[str] = None,
    customer_id: Optional[int] = None,
    overdue_only: bool = False,
    sort_by: str = "due_date",  # due_date, amount, customer_name
    sort_order: str = "desc",   # asc, desc
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(AccountsReceivable).filter(
        AccountsReceivable.workspace_id == current_user.workspace_id
    )

    # Filtros
    if status:
        query = query.filter(AccountsReceivable.status == status)
    if customer_id:
        query = query.filter(AccountsReceivable.customer_id == customer_id)
    if overdue_only:
        query = query.filter(
            AccountsReceivable.due_date < date.today(),
            AccountsReceivable.status.in_(["pendente", "parcial"])
        )

    # Total count (antes de paginação)
    total = query.count()

    # Ordenação
    if sort_order == "desc":
        query = query.order_by(getattr(AccountsReceivable, sort_by).desc())
    else:
        query = query.order_by(getattr(AccountsReceivable, sort_by).asc())

    # Paginação
    items = query.offset(skip).limit(limit).all()

    return {
        "items": items,
        "total": total,
        "skip": skip,
        "limit": limit,
        "pages": (total + limit - 1) // limit
    }
```

**Frontend** (Adicionar paginação):
```typescript
const [page, setPage] = useState(1);
const [pageSize, setPageSize] = useState(50);

const { data, isLoading } = useQuery({
  queryKey: ['accounts-receivable', page, pageSize, filters],
  queryFn: () => api.get('/accounts-receivable', {
    skip: (page - 1) * pageSize,
    limit: pageSize,
    ...filters
  })
});

// Componente de paginação
<Pagination
  currentPage={page}
  totalPages={data.pages}
  onPageChange={setPage}
/>
```

**Prioridade**: 🟡 **P2** - Performance aceitável até 5k registros

---

#### Issue #8: Lazy Loading Incompleto

**Problema**: `InsightsPanel` carrega sem lazy loading

**Solução**:
```typescript
// Arquivo: admin/src/app/admin/financeiro/page.tsx

// Linha 590: Mudar de:
<InsightsPanel data={accountsReceivable} />

// Para:
const LazyInsightsPanel = lazy(() => import('@/components/financeiro/InsightsPanel'));

<Suspense fallback={<Skeleton className="h-64" />}>
  <LazyInsightsPanel data={accountsReceivable} />
</Suspense>
```

**Prioridade**: 🟡 **P2** - Impacto pequeno em conexões rápidas

---

#### Issue #9: Sparklines com Dados Fictícios

**Problema**: Fallback cria série aleatória

**Código Atual** (linhas 114-145):
```typescript
const fallbackData = Array.from({ length: 7 }, (_, i) => {
  return saldoAtual * (0.85 + i * 0.03);  // ❌ Fictício
});
```

**Solução**:
```typescript
// OPÇÃO 1: Não mostrar sparkline se não há dados
const sparklineData = balanceHistory.length > 0 ? balanceHistory : null;

{sparklineData && (
  <Sparkline data={sparklineData} color="#7C3AED" height={48} />
)}

// OPÇÃO 2: Mostrar "Sem dados suficientes"
{balanceHistory.length === 0 ? (
  <div className="h-12 flex items-center justify-center text-sm text-muted-foreground">
    Sem histórico de saldo
  </div>
) : (
  <Sparkline data={balanceHistory} color="#7C3AED" height={48} />
)}
```

**Prioridade**: 🟡 **P2** - Gráfico enganoso mas não crítico

---

## 🚀 Fase 3: Funcionalidades Não Implementadas

### 3.1. Portal Fornecedor/Cliente

**Status**: Componentes UI existem, backend ausente

**Implementação Necessária**:

```python
# Arquivo: backend/app/api/api_v1/endpoints/portal_access.py (CRIAR)

from datetime import datetime, timedelta
import secrets
from fastapi import APIRouter, Depends, HTTPException
from app.models.portal_token import PortalToken  # Criar modelo

router = APIRouter()

@router.post("/supplier-portal/generate")
def generate_supplier_access(
    supplier_id: int,
    expires_in_days: int = 30,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Gera token de acesso para portal de fornecedor"""

    # Validar fornecedor
    supplier = db.query(Supplier).filter(
        Supplier.id == supplier_id,
        Supplier.workspace_id == current_user.workspace_id
    ).first()

    if not supplier:
        raise HTTPException(404, "Fornecedor não encontrado")

    # Gerar token único
    token = secrets.token_urlsafe(32)
    expires_at = datetime.utcnow() + timedelta(days=expires_in_days)

    # Salvar token
    portal_token = PortalToken(
        token=token,
        entity_type="supplier",
        entity_id=supplier_id,
        workspace_id=current_user.workspace_id,
        expires_at=expires_at,
        created_by=current_user.id
    )
    db.add(portal_token)
    db.commit()

    # Retornar URL
    portal_url = f"https://orionerp.roilabs.com.br/portal/fornecedor/{token}"

    return {
        "token": token,
        "url": portal_url,
        "expires_at": expires_at
    }

@router.get("/supplier-portal/{token}")
def access_supplier_portal(
    token: str,
    db: Session = Depends(get_db)
):
    """Valida token e retorna dados do fornecedor"""

    portal_token = db.query(PortalToken).filter(
        PortalToken.token == token,
        PortalToken.entity_type == "supplier",
        PortalToken.expires_at > datetime.utcnow()
    ).first()

    if not portal_token:
        raise HTTPException(403, "Token inválido ou expirado")

    # Buscar faturas do fornecedor
    invoices = db.query(AccountsPayableInvoice).filter(
        AccountsPayableInvoice.supplier_id == portal_token.entity_id,
        AccountsPayableInvoice.workspace_id == portal_token.workspace_id
    ).all()

    return {
        "supplier": portal_token.supplier,
        "invoices": invoices,
        "portal_access": {
            "expires_at": portal_token.expires_at
        }
    }
```

**Modelo**:
```python
# Arquivo: backend/app/models/portal_token.py (CRIAR)

class PortalToken(Base):
    __tablename__ = "portal_tokens"

    id = Column(Integer, primary_key=True)
    token = Column(String(255), unique=True, nullable=False)
    entity_type = Column(String(50), nullable=False)  # supplier, customer
    entity_id = Column(Integer, nullable=False)
    workspace_id = Column(Integer, ForeignKey("workspaces.id"))
    expires_at = Column(DateTime, nullable=False)
    created_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
    last_accessed_at = Column(DateTime)

    # Relacionamentos
    workspace = relationship("Workspace")
    creator = relationship("User")
```

**Prioridade**: 🟣 **P3** - Funcionalidade adicional

---

### 3.2. Conciliação Bancária

**Status**: Componente vazio, sem fonte de dados

**Implementação Necessária**:

```python
# Arquivo: backend/app/api/api_v1/endpoints/bank_reconciliation.py (CRIAR)

@router.post("/reconciliation/suggest")
def suggest_reconciliation(
    bank_account_id: int,
    statement_file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Faz upload de extrato bancário e sugere conciliações.
    Usa IA para matching automático.
    """

    # 1. Ler extrato (CSV, OFX, PDF)
    statement_data = parse_bank_statement(statement_file)

    # 2. Buscar transações não conciliadas
    unreconciled = db.query(CashFlowTransaction).filter(
        CashFlowTransaction.bank_account_id == bank_account_id,
        CashFlowTransaction.is_reconciled == False
    ).all()

    # 3. Matching automático (IA)
    suggestions = []
    for statement_item in statement_data:
        best_match = find_best_match(
            statement_item,
            unreconciled,
            threshold=0.85  # 85% de confiança
        )

        if best_match:
            suggestions.append({
                "statement_item": statement_item,
                "transaction_match": best_match,
                "confidence": best_match.confidence,
                "suggested_action": "reconcile"
            })

    return {"suggestions": suggestions}
```

**Prioridade**: 🟣 **P3** - Requer integração bancária

---

### 3.3. Risk Profile

**Status**: Componente existe, sem cálculo de score

**Implementação Necessária**:

```python
# Arquivo: backend/app/api/api_v1/endpoints/accounts_receivable.py

@router.get("/analytics/risk-scores")
def calculate_customer_risk_scores(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Calcula risk score para todos os clientes"""

    workspace_id = current_user.workspace_id

    # Agrupar por cliente
    customer_stats = db.query(
        AccountsReceivable.customer_id,
        func.count(AccountsReceivable.id).label('total_invoices'),
        func.sum(AccountsReceivable.amount).label('total_amount'),
        func.avg(
            case(
                (AccountsReceivable.payment_date.isnot(None),
                 AccountsReceivable.payment_date - AccountsReceivable.due_date),
                else_=None
            )
        ).label('avg_delay_days'),
        func.count(
            case((AccountsReceivable.status == 'vencido', 1))
        ).label('overdue_count')
    ).filter(
        AccountsReceivable.workspace_id == workspace_id
    ).group_by(AccountsReceivable.customer_id).all()

    # Calcular score (0-100)
    risk_scores = []
    for stats in customer_stats:
        score = 100  # Começa com score perfeito

        # Reduz score baseado em atrasos
        if stats.avg_delay_days:
            score -= min(stats.avg_delay_days * 2, 40)  # Até -40 pontos

        # Reduz score baseado em contas vencidas
        overdue_rate = (stats.overdue_count / stats.total_invoices) * 100
        score -= overdue_rate  # Até -100 pontos

        score = max(0, score)  # Não pode ser negativo

        # Classificação
        if score >= 80:
            risk_level = "baixo"
        elif score >= 50:
            risk_level = "médio"
        else:
            risk_level = "alto"

        risk_scores.append({
            "customer_id": stats.customer_id,
            "risk_score": round(score, 2),
            "risk_level": risk_level,
            "total_invoices": stats.total_invoices,
            "overdue_count": stats.overdue_count,
            "avg_delay_days": stats.avg_delay_days
        })

    return risk_scores
```

**Prioridade**: 🟣 **P3** - Funcionalidade adicional

---

### 3.4. Automação de Pagamentos

**Status**: UI criada, sem scheduler

**Implementação Necessária**:

```python
# Arquivo: backend/app/scheduler/payment_automation.py (CRIAR)

from apscheduler.schedulers.background import BackgroundScheduler

scheduler = BackgroundScheduler()

@scheduler.scheduled_job('cron', hour=6, minute=0)  # Todo dia às 6h
def process_automated_payments():
    """Processa pagamentos automáticos baseado em regras"""

    db = SessionLocal()
    today = date.today()

    try:
        # Buscar regras ativas
        rules = db.query(PaymentAutomationRule).filter(
            PaymentAutomationRule.active == True
        ).all()

        for rule in rules:
            # Buscar faturas que atendem a regra
            invoices = db.query(AccountsPayableInvoice).filter(
                AccountsPayableInvoice.workspace_id == rule.workspace_id,
                AccountsPayableInvoice.status == "aprovado",
                AccountsPayableInvoice.supplier_id == rule.supplier_id,
                AccountsPayableInvoice.due_date == today + timedelta(days=rule.days_before_due)
            ).all()

            for invoice in invoices:
                # Processar pagamento
                process_payment(invoice, rule.bank_account_id, db)

                # Log
                print(f"✅ Pagamento automático: Fatura {invoice.id} - R$ {invoice.amount}")

        db.commit()

    except Exception as e:
        db.rollback()
        print(f"❌ Erro na automação de pagamentos: {e}")
    finally:
        db.close()

scheduler.start()
```

**Prioridade**: 🟣 **P3** - Requer integração bancária

---

## 🎯 Checklist de Implementação

### ✅ Sprint 1: Diagnóstico e Auditoria (3 dias)
- [ ] Revisar todos os 50+ componentes financeiros
- [ ] Testar todos os 30+ endpoints
- [ ] Validar cálculos de KPIs manualmente
- [ ] Documentar bugs encontrados com screenshots
- [ ] Priorizar correções (P0 → P3)

### ⏳ Sprint 2: Correções P0 (5 dias)
- [ ] **Issue #1**: Corrigir saldo em transferências
- [ ] **Issue #2**: Implementar job noturno de atualização de status AR
- [ ] **Issue #3**: Criar endpoint GET /analytics/dre com dados reais
- [ ] Testar correções em staging
- [ ] Deploy em produção

### ⏳ Sprint 3: Correções P1 (5 dias)
- [ ] **Issue #4**: Corrigir cálculo de aging
- [ ] **Issue #5**: Integrar AP com Cash Flow
- [ ] **Issue #6**: Consolidar modelos de Invoice
- [ ] Testes de integração
- [ ] Deploy em produção

### ⏳ Sprint 4: Performance P2 (3 dias)
- [ ] **Issue #7**: Implementar paginação real
- [ ] **Issue #8**: Lazy loading de InsightsPanel
- [ ] **Issue #9**: Remover sparklines fictícios
- [ ] Medir performance (Lighthouse)

### ⏳ Sprint 5: Funcionalidades P3 (10 dias)
- [ ] Portal Fornecedor/Cliente (3 dias)
- [ ] Conciliação Bancária (3 dias)
- [ ] Risk Profile (2 dias)
- [ ] Automação de Pagamentos (2 dias)

### ⏳ Sprint 6: Validação Final (3 dias)
- [ ] Testes E2E de todos os fluxos
- [ ] Validação com dados reais (24k+ transações)
- [ ] Documentação final
- [ ] Deploy e monitoramento

---

## 📊 Critérios de Sucesso

### Performance
- [ ] Dashboard carrega em <2s
- [ ] Paginação suporta 50k+ registros
- [ ] Gráficos renderizam em <500ms

### Precisão
- [ ] Saldo em caixa 100% correto
- [ ] DRE baseada em dados reais
- [ ] Aging reports conferem com backend
- [ ] Status AR atualiza automaticamente

### Integrações
- [ ] AP cria transações em Cash Flow
- [ ] Projeção inclui AP + AR pendentes
- [ ] Portal de fornecedor funciona
- [ ] Portal de cliente funciona

### Qualidade
- [ ] Todos os bugs P0 corrigidos
- [ ] 80%+ dos bugs P1 corrigidos
- [ ] Testes automatizados (70%+ cobertura)
- [ ] Documentação completa

---

**Criado em**: 2025-11-04
**Última atualização**: 2025-11-04
**Status**: 🔴 Pendente Implementação
**Responsável**: Equipe de Desenvolvimento

---

## 📝 PRÓXIMOS PASSOS IMEDIATOS

1. ✅ **Ler e aprovar este roadmap**
2. ⏳ **Corrigir Issue #1** (Saldo em transferências) - CRÍTICO
3. ⏳ **Corrigir Issue #2** (Status AR) - CRÍTICO
4. ⏳ **Corrigir Issue #3** (DRE hardcoded) - CRÍTICO
5. ⏳ **Testes em staging**
6. ⏳ **Deploy em produção**

**Tempo estimado**: 15-20 dias para correções completas (P0 + P1)
