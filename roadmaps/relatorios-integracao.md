# Roadmap: Integração de Relatórios Financeiros com Backend

**Objetivo:** Substituir todos os dados mockados da página de Relatórios por dados reais do backend/DB.

**Status Atual:** 0/7 funcionalidades implementadas (0%)

---

## 📊 Análise de Dados Mockados

### 1. Executive Dashboard (useExecutiveDashboard.ts)
**Dados Mockados:**
- KPIs financeiros (receita total, despesas, lucro líquido, margem, vendas, ticket médio, estoque)
- Gráficos (receita vs despesa, fluxo de caixa, distribuição por categoria, evolução lucro, top produtos)
- Insights e recomendações automáticas
- Análise comparativa de períodos

### 2. Report History (useReportHistory.ts)
**Dados Mockados:**
- Lista de relatórios gerados
- Status de geração (concluído, gerando, erro)
- Metadados (tamanho, formato, data, usuário)
- Estatísticas (total, concluídos, erros)

### 3. Report Scheduler (useReportScheduler.ts)
**Dados Mockados:**
- Agendamentos de relatórios
- Frequências (diário, semanal, mensal, etc.)
- Histórico de execuções
- Destinatários de e-mail

---

## 🎯 Funcionalidades a Implementar

### Fase 1: Executive Dashboard - KPIs e Métricas (3 funcionalidades)

#### 1. ✅ Endpoint de KPIs Executivos
**Descrição:** Consolidar todos os KPIs financeiros em um único endpoint
**Backend:**
- [ ] Criar endpoint `GET /api/v1/reports/executive-dashboard/kpis`
- [ ] Calcular métricas em tempo real:
  - Receita Total (CashFlowTransaction + AccountsReceivable)
  - Despesas Totais (AccountsPayableInvoice + CashFlowTransaction)
  - Lucro Líquido (Receitas - Despesas)
  - Margem de Lucro (%)
  - Total de Vendas (contar transações de entrada)
  - Ticket Médio (Receita Total / Total Vendas)
  - Valor em Estoque (se aplicável)
  - Giro de Estoque (se aplicável)
- [ ] Calcular variação vs período anterior
- [ ] Suportar filtro de período (mês atual, trimestre, ano, customizado)
- [ ] Schema: `ExecutiveDashboardKPIsResponse`

**Frontend:**
- [ ] Atualizar `useExecutiveDashboard` para consumir API
- [ ] Remover dados mockados
- [ ] Adicionar loading states
- [ ] Tratamento de erros

**Tempo Estimado:** ~3 horas

---

#### 2. ✅ Endpoint de Gráficos do Dashboard
**Descrição:** Gerar dados para todos os gráficos do executive dashboard
**Backend:**
- [ ] Criar endpoint `GET /api/v1/reports/executive-dashboard/charts`
- [ ] Gráficos suportados:
  1. **Receita vs Despesa Mensal** (últimos 6-12 meses)
  2. **Fluxo de Caixa Acumulado** (linha temporal)
  3. **Distribuição por Categoria** (pizza)
  4. **Evolução do Lucro** (área)
  5. **Top Produtos/Categorias** (barra horizontal)
- [ ] Cada gráfico retorna: tipo, título, labels, datasets, config
- [ ] Schema: `ExecutiveDashboardChartsResponse`

**Frontend:**
- [ ] Integrar renderização de gráficos com dados da API
- [ ] Manter compatibilidade com Recharts
- [ ] Loading states para cada gráfico

**Tempo Estimado:** ~4 horas

---

#### 3. ✅ Endpoint de Insights e Análise Comparativa
**Descrição:** Gerar insights automáticos e análise comparativa inteligente
**Backend:**
- [ ] Criar endpoint `GET /api/v1/reports/executive-dashboard/insights`
- [ ] Análise Comparativa:
  - Comparar período atual vs anterior
  - Comparar vs mesmo período ano anterior
  - Métricas: receita, despesas, lucro, ticket médio
  - Calcular diferença (% e absoluta)
- [ ] Insights Inteligentes (algoritmo):
  - **Positivos:** Crescimento de receita >10%, redução de custos, margem acima de meta
  - **Negativos:** Queda de receita, aumento de custos, margem abaixo
  - **Alertas:** Burn rate alto, runway curto, saldo baixo
  - **Neutros:** Oportunidades de investimento, metas alcançadas
- [ ] Schema: `ExecutiveDashboardInsightsResponse`

**Frontend:**
- [ ] Integrar seção de insights
- [ ] Integrar análise comparativa
- [ ] Ícones dinâmicos baseados em tipo de insight

**Tempo Estimado:** ~3 horas

---

### Fase 2: Histórico e Geração de Relatórios (2 funcionalidades)

#### 4. ✅ CRUD de Relatórios Gerados
**Descrição:** Sistema completo de geração e gerenciamento de relatórios
**Backend:**
- [ ] Criar model `GeneratedReport`:
  ```python
  - id: UUID
  - nome: str
  - tipo: enum (financeiro, estoque, vendas, customizado)
  - subtipo: str (dre, fluxo-caixa, contas-pagar, etc.)
  - status: enum (concluido, gerando, erro)
  - formato: enum (pdf, excel, csv, json)
  - periodo_inicio: date
  - periodo_fim: date
  - arquivo_url: str
  - arquivo_tamanho: int (bytes)
  - gerado_por_id: UUID (user)
  - gerado_em: datetime
  - tags: List[str]
  - config: JSON (configurações usadas)
  ```
- [ ] Endpoints:
  - `POST /api/v1/reports/generate` - Gerar novo relatório
  - `GET /api/v1/reports` - Listar histórico (paginado, filtros)
  - `GET /api/v1/reports/{id}` - Detalhes de um relatório
  - `GET /api/v1/reports/{id}/download` - Download do arquivo
  - `DELETE /api/v1/reports/{id}` - Excluir relatório
  - `GET /api/v1/reports/stats` - Estatísticas (total, concluídos, erros, tamanho total)
- [ ] Geração assíncrona com Celery/background tasks
- [ ] Upload para S3/storage local
- [ ] Schemas: `GenerateReportRequest`, `GeneratedReportResponse`, `ReportStatsResponse`

**Frontend:**
- [ ] Atualizar `useReportHistory` para consumir API
- [ ] Implementar polling para relatórios em geração
- [ ] Download funcional
- [ ] Exclusão de relatórios

**Tempo Estimado:** ~6 horas

---

#### 5. ✅ Geração de Relatórios por Tipo
**Descrição:** Implementar lógica específica para cada tipo de relatório
**Backend:**
- [ ] Service `ReportGenerator`:
  ```python
  async def generate_dre_report(period_start, period_end, config)
  async def generate_cash_flow_report(period_start, period_end, config)
  async def generate_accounts_payable_report(period_start, period_end, config)
  async def generate_accounts_receivable_report(period_start, period_end, config)
  async def generate_category_analysis_report(period_start, period_end, config)
  async def generate_annual_report(year, config)
  ```
- [ ] Cada gerador:
  - Busca dados do DB
  - Aplica filtros e agregações
  - Calcula totais e subtotais
  - Gera arquivo no formato especificado (PDF, Excel, CSV, JSON)
- [ ] Utilizar bibliotecas:
  - **PDF:** ReportLab ou WeasyPrint
  - **Excel:** openpyxl ou xlsxwriter
  - **CSV:** built-in csv module
  - **JSON:** built-in json module

**Frontend:**
- [ ] Manter componente `ReportConfigurator` funcional
- [ ] Validação de configurações antes de enviar
- [ ] Preview dos dados antes de gerar

**Tempo Estimado:** ~8 horas

---

### Fase 3: Agendamento de Relatórios (2 funcionalidades)

#### 6. ✅ CRUD de Agendamentos
**Descrição:** Sistema de agendamento automático de relatórios
**Backend:**
- [ ] Criar model `ReportSchedule`:
  ```python
  - id: UUID
  - nome: str
  - ativo: bool
  - report_config: JSON (mesma config de GeneratedReport)
  - frequencia_tipo: enum (diario, semanal, quinzenal, mensal, trimestral, anual, personalizado)
  - frequencia_config: JSON (dia da semana, dia do mês, cron expression)
  - proxima_execucao: datetime
  - ultima_execucao: datetime | None
  - destinatarios_emails: List[str]
  - destinatarios_incluir_anexo: bool
  - criado_por_id: UUID
  - criado_em: datetime
  ```
- [ ] Endpoints:
  - `POST /api/v1/reports/schedules` - Criar agendamento
  - `GET /api/v1/reports/schedules` - Listar agendamentos (filtros)
  - `GET /api/v1/reports/schedules/{id}` - Detalhes
  - `PUT /api/v1/reports/schedules/{id}` - Atualizar
  - `DELETE /api/v1/reports/schedules/{id}` - Excluir
  - `POST /api/v1/reports/schedules/{id}/toggle` - Ativar/desativar
  - `POST /api/v1/reports/schedules/{id}/execute-now` - Executar imediatamente
  - `GET /api/v1/reports/schedules/stats` - Estatísticas
- [ ] Schemas: `CreateScheduleRequest`, `UpdateScheduleRequest`, `ScheduleResponse`, `ScheduleStatsResponse`

**Frontend:**
- [ ] Atualizar `useReportScheduler` para consumir API
- [ ] Formulário de criação/edição de agendamentos
- [ ] Toggle ativo/inativo funcional
- [ ] Execução manual

**Tempo Estimado:** ~5 horas

---

#### 7. ✅ Worker de Agendamento (Celery/APScheduler)
**Descrição:** Background worker para executar relatórios agendados
**Backend:**
- [ ] Configurar Celery com broker (Redis/RabbitMQ)
- [ ] Criar model `ScheduleExecution`:
  ```python
  - id: UUID
  - schedule_id: UUID
  - status: enum (pendente, executando, sucesso, erro)
  - iniciado_em: datetime
  - finalizado_em: datetime | None
  - report_id: UUID | None  # relatório gerado
  - erro_mensagem: str | None
  ```
- [ ] Task periódica:
  ```python
  @celery.task
  def check_and_execute_scheduled_reports():
      # Buscar agendamentos ativos com proxima_execucao <= now
      # Executar cada um
      # Calcular próxima execução
      # Enviar email com anexo
  ```
- [ ] Task de geração de relatório:
  ```python
  @celery.task
  def generate_report_async(report_config):
      # Gerar relatório
      # Atualizar status no DB
      # Upload para storage
  ```
- [ ] Integração com serviço de e-mail (SMTP)

**Frontend:**
- [ ] Visualizar histórico de execuções no `ReportScheduler`
- [ ] Badge de status (sucesso/erro) na última execução

**Tempo Estimado:** ~6 horas

---

## 🏗️ Arquitetura Backend

### Models

```python
# backend/app/models/report.py

class GeneratedReport(Base):
    __tablename__ = "generated_reports"

    id = Column(UUID, primary_key=True)
    nome = Column(String, nullable=False)
    tipo = Column(Enum(ReportTipo), nullable=False)
    subtipo = Column(String, nullable=False)
    status = Column(Enum(ReportStatus), default=ReportStatus.GERANDO)
    formato = Column(Enum(ReportFormato), nullable=False)
    periodo_inicio = Column(Date, nullable=False)
    periodo_fim = Column(Date, nullable=False)
    arquivo_url = Column(String, nullable=True)
    arquivo_tamanho = Column(Integer, nullable=True)
    gerado_por_id = Column(UUID, ForeignKey("users.id"))
    gerado_em = Column(DateTime, default=datetime.utcnow)
    tags = Column(ARRAY(String), default=[])
    config = Column(JSON, nullable=False)

    gerado_por = relationship("User")

class ReportSchedule(Base):
    __tablename__ = "report_schedules"

    id = Column(UUID, primary_key=True)
    nome = Column(String, nullable=False)
    ativo = Column(Boolean, default=True)
    report_config = Column(JSON, nullable=False)
    frequencia_tipo = Column(Enum(FrequenciaTipo), nullable=False)
    frequencia_config = Column(JSON, nullable=True)
    proxima_execucao = Column(DateTime, nullable=False)
    ultima_execucao = Column(DateTime, nullable=True)
    destinatarios_emails = Column(ARRAY(String), default=[])
    destinatarios_incluir_anexo = Column(Boolean, default=True)
    criado_por_id = Column(UUID, ForeignKey("users.id"))
    criado_em = Column(DateTime, default=datetime.utcnow)

    criado_por = relationship("User")
    execucoes = relationship("ScheduleExecution", back_populates="schedule")

class ScheduleExecution(Base):
    __tablename__ = "schedule_executions"

    id = Column(UUID, primary_key=True)
    schedule_id = Column(UUID, ForeignKey("report_schedules.id"))
    status = Column(Enum(ExecutionStatus), default=ExecutionStatus.PENDENTE)
    iniciado_em = Column(DateTime, default=datetime.utcnow)
    finalizado_em = Column(DateTime, nullable=True)
    report_id = Column(UUID, ForeignKey("generated_reports.id"), nullable=True)
    erro_mensagem = Column(Text, nullable=True)

    schedule = relationship("ReportSchedule", back_populates="execucoes")
    report = relationship("GeneratedReport")
```

### Endpoints

```python
# backend/app/api/api_v1/endpoints/reports.py

@router.get("/executive-dashboard/kpis", response_model=ExecutiveDashboardKPIsResponse)
async def get_executive_dashboard_kpis(
    period_start: Optional[date] = None,
    period_end: Optional[date] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    ...

@router.get("/executive-dashboard/charts", response_model=ExecutiveDashboardChartsResponse)
async def get_executive_dashboard_charts(...):
    ...

@router.get("/executive-dashboard/insights", response_model=ExecutiveDashboardInsightsResponse)
async def get_executive_dashboard_insights(...):
    ...

@router.post("/generate", response_model=GeneratedReportResponse)
async def generate_report(
    request: GenerateReportRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    ...

@router.get("/", response_model=List[GeneratedReportResponse])
async def list_reports(
    skip: int = 0,
    limit: int = 50,
    tipo: Optional[ReportTipo] = None,
    status: Optional[ReportStatus] = None,
    formato: Optional[ReportFormato] = None,
    busca: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    ...

@router.get("/{report_id}", response_model=GeneratedReportResponse)
async def get_report(...):
    ...

@router.get("/{report_id}/download")
async def download_report(...):
    ...

@router.delete("/{report_id}")
async def delete_report(...):
    ...

@router.get("/stats", response_model=ReportStatsResponse)
async def get_report_stats(...):
    ...

# Schedules
@router.post("/schedules", response_model=ScheduleResponse)
async def create_schedule(...):
    ...

@router.get("/schedules", response_model=List[ScheduleResponse])
async def list_schedules(...):
    ...

@router.get("/schedules/{schedule_id}", response_model=ScheduleResponse)
async def get_schedule(...):
    ...

@router.put("/schedules/{schedule_id}", response_model=ScheduleResponse)
async def update_schedule(...):
    ...

@router.delete("/schedules/{schedule_id}")
async def delete_schedule(...):
    ...

@router.post("/schedules/{schedule_id}/toggle")
async def toggle_schedule(...):
    ...

@router.post("/schedules/{schedule_id}/execute-now")
async def execute_schedule_now(...):
    ...

@router.get("/schedules/stats", response_model=ScheduleStatsResponse)
async def get_schedule_stats(...):
    ...
```

---

## 📊 Resumo de Implementação

| Fase | Funcionalidades | Status | Tempo Estimado |
|------|----------------|--------|----------------|
| Fase 1: Executive Dashboard | 3 | ⏳ **PENDENTE** | ~10 horas |
| Fase 2: Histórico e Geração | 2 | ⏳ **PENDENTE** | ~14 horas |
| Fase 3: Agendamento | 2 | ⏳ **PENDENTE** | ~11 horas |
| **TOTAL** | **7 funcionalidades** | **0% COMPLETO** | **~35 horas** |

---

## 🎯 Ordem de Implementação Recomendada

1. **Fase 1 (Executive Dashboard)** - Base para métricas (10h)
2. **Fase 2, Item 4 (CRUD Relatórios)** - Infraestrutura de geração (6h)
3. **Fase 2, Item 5 (Geradores)** - Lógica específica (8h)
4. **Fase 3, Item 6 (CRUD Agendamentos)** - Sistema de schedules (5h)
5. **Fase 3, Item 7 (Worker)** - Automação (6h)

---

## 🎉 Progresso Atual

**Status Geral:** ⏳ **0/7 funcionalidades implementadas (0%)**

### Checklist Geral
- [ ] Models criados
- [ ] Schemas Pydantic criados
- [ ] Endpoints implementados
- [ ] Service layer criado
- [ ] Report generators implementados
- [ ] Celery/worker configurado
- [ ] Email service integrado
- [ ] Storage configurado (S3/local)
- [ ] Frontend hooks atualizados
- [ ] Dados mockados removidos
- [ ] Testes realizados

---

**Última atualização:** 2025-11-01
**Responsável:** Claude + Jean Zorzetti
**Status:** ⏳ INICIANDO IMPLEMENTAÇÃO
