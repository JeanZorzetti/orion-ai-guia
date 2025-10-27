# Roadmap - Previsão de Demanda (Módulo Robusto)

**Objetivo:** Expandir a funcionalidade de previsão de demanda da Fase 12.2, transformando-a de um simples modal em um submódulo completo e robusto dentro de "Produtos" na sidebar, com visualizações avançadas, análises comparativas e insights acionáveis.

**Status Atual:**
- ✅ Fase 12.2 Base (100%) - Modal básico dentro de ProductDetailsModal
- 🚧 Expansão para Submódulo Robusto (0%) - Este roadmap

---

## Visão Geral

A Fase 12.2 implementou a previsão de demanda como uma aba dentro do modal de detalhes do produto. Esta expansão transforma essa funcionalidade em um **módulo standalone completo** com:

1. **Página Dedicada**: `/admin/estoque/previsao-demanda`
2. **Visualizações Avançadas**: Múltiplos produtos, comparações, dashboards
3. **Análises Profundas**: Sazonalidade, tendências, correlações
4. **Insights Acionáveis**: Recomendações de compra, alertas proativos
5. **Exportação de Dados**: PDF, Excel, CSV
6. **Histórico de Previsões**: Tracking de acurácia ao longo do tempo

---

## Arquitetura da Solução Expandida

```
[Sidebar: Vendas & Estoque]
    ├── Vendas
    ├── Produtos
    └── Previsão de Demanda ⭐ NOVO
            ↓
[Página: /admin/estoque/previsao-demanda]
            ↓
┌─────────────────────────────────────────────────────┐
│  Dashboard Geral                                    │
│  - Cards de Métricas Globais                        │
│  - Alertas Críticos                                 │
│  - Top 10 Produtos com Alertas                      │
└─────────────────────────────────────────────────────┘
            ↓
┌─────────────────────────────────────────────────────┐
│  Análise por Produto                                │
│  - Tabela Interativa com Filtros                    │
│  - Previsão Individual (clique para expandir)       │
│  - Comparação Lado a Lado                           │
└─────────────────────────────────────────────────────┘
            ↓
┌─────────────────────────────────────────────────────┐
│  Análise Avançada                                   │
│  - Matriz de Correlação                             │
│  - Sazonalidade por Categoria                       │
│  - Análise ABC/XYZ                                  │
└─────────────────────────────────────────────────────┘
            ↓
┌─────────────────────────────────────────────────────┐
│  Plano de Reposição                                 │
│  - Sugestões de Compra Automáticas                  │
│  - Cronograma de Pedidos                            │
│  - Exportação para Excel/PDF                        │
└─────────────────────────────────────────────────────┘
```

---

## Fase 1: Fundação - Estrutura Base do Módulo

### 1.1 - Backend: Novos Endpoints

**Arquivos:**
- `backend/app/api/v1/endpoints/demand_forecast.py` (NOVO)
- `backend/app/api/v1/api.py` (MODIFICAR - adicionar router)
- `backend/app/services/demand_forecaster.py` (EXPANDIR)

**Tarefas:**

#### 1.1.1 - Criar Router Dedicado ⭐⭐
- [ ] Criar arquivo `endpoints/demand_forecast.py`
- [ ] Implementar endpoints:
  - `GET /api/v1/demand-forecast/dashboard` - Métricas globais
  - `GET /api/v1/demand-forecast/products` - Lista de produtos com previsão
  - `GET /api/v1/demand-forecast/products/{id}` - Previsão detalhada (já existe)
  - `POST /api/v1/demand-forecast/bulk` - Previsão de múltiplos produtos
  - `GET /api/v1/demand-forecast/alerts` - Alertas críticos
  - `GET /api/v1/demand-forecast/history/{product_id}` - Histórico de previsões
- [ ] Adicionar router em `api.py`

#### 1.1.2 - Dashboard Global Endpoint ⭐⭐⭐
- [ ] Implementar `GET /demand-forecast/dashboard`:
  ```python
  {
    "summary": {
      "total_products": 150,
      "products_with_forecasts": 120,
      "critical_alerts": 8,
      "low_stock_warnings": 15,
      "total_predicted_demand_4w": 5420,
      "total_stock_value": 125000.00,
      "coverage_days_avg": 21.5
    },
    "top_alerts": [
      {
        "product_id": 1,
        "product_name": "Produto A",
        "alert_type": "stockout_risk",
        "severity": "critical",
        "message": "Estoque esgotará em 5 dias",
        "recommended_action": "Comprar 200 unidades urgentemente"
      },
      ...
    ],
    "category_insights": [
      {
        "category": "Eletrônicos",
        "trend": "increasing",
        "avg_growth": 15.2,
        "products_count": 25
      },
      ...
    ]
  }
  ```

#### 1.1.3 - Bulk Forecast Endpoint ⭐⭐⭐
- [ ] Implementar `POST /demand-forecast/bulk`:
  - Aceitar lista de `product_ids` (máx 50 por request)
  - Processar em paralelo (ThreadPoolExecutor)
  - Retornar previsões agregadas
  - Incluir cache para otimização
- [ ] Implementar cache Redis (24h TTL)
- [ ] Rate limiting: 10 requests/min

#### 1.1.4 - Histórico de Previsões ⭐⭐
- [ ] Criar tabela `forecast_history`:
  ```sql
  CREATE TABLE forecast_history (
    id SERIAL PRIMARY KEY,
    product_id INTEGER REFERENCES products(id),
    workspace_id INTEGER REFERENCES workspaces(id),
    forecast_date DATE NOT NULL,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    predicted_units FLOAT NOT NULL,
    actual_units FLOAT,
    lower_bound FLOAT,
    upper_bound FLOAT,
    model_used VARCHAR(50),
    mape FLOAT,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(product_id, forecast_date, period_start)
  );
  ```
- [ ] Criar Pydantic model `ForecastHistory`
- [ ] Implementar CRUD operations
- [ ] Endpoint `GET /demand-forecast/history/{product_id}`

#### 1.1.5 - Análise de Acurácia ⭐⭐⭐
- [ ] Implementar `calculate_forecast_accuracy()`:
  - Comparar previsões passadas com vendas reais
  - Calcular MAPE, MAE, RMSE por produto
  - Identificar produtos com baixa acurácia
  - Sugerir ajustes no modelo
- [ ] Endpoint `GET /demand-forecast/accuracy/{product_id}`
- [ ] Dashboard de acurácia global

**Estimativa:** 5-7 dias

---

### 1.2 - Backend: Análises Avançadas

**Arquivos:**
- `backend/app/services/demand_analyzer.py` (NOVO)
- `backend/app/services/inventory_optimizer.py` (NOVO)

**Tarefas:**

#### 1.2.1 - Análise ABC/XYZ ⭐⭐⭐
- [ ] Criar `demand_analyzer.py`
- [ ] Implementar classificação ABC:
  - A: 80% do faturamento (top produtos)
  - B: 15% do faturamento
  - C: 5% do faturamento (cauda longa)
- [ ] Implementar classificação XYZ:
  - X: Demanda estável (CV < 0.5)
  - Y: Demanda variável (0.5 ≤ CV < 1.0)
  - Z: Demanda irregular (CV ≥ 1.0)
- [ ] Matriz ABC/XYZ: 9 categorias de produtos
- [ ] Endpoint `GET /demand-forecast/abc-xyz`

#### 1.2.2 - Detecção de Sazonalidade Avançada ⭐⭐
- [ ] Implementar análise FFT (Fast Fourier Transform)
- [ ] Detectar múltiplos ciclos:
  - Semanal (7 dias)
  - Mensal (30 dias)
  - Trimestral (90 dias)
  - Anual (365 dias)
- [ ] Calcular força da sazonalidade (0-1)
- [ ] Identificar picos e vales históricos
- [ ] Endpoint `GET /demand-forecast/seasonality/{product_id}`

#### 1.2.3 - Correlação Entre Produtos ⭐⭐⭐
- [ ] Implementar análise de correlação:
  - Pearson correlation entre vendas de produtos
  - Identificar produtos que vendem juntos
  - Detectar produtos substitutos (correlação negativa)
- [ ] Algoritmo de recomendação:
  - "Clientes que compraram X também compraram Y"
  - Usar para ajustar previsões
- [ ] Endpoint `GET /demand-forecast/correlations`
- [ ] Visualização: Matriz de correlação (heatmap)

#### 1.2.4 - Otimização de Estoque ⭐⭐⭐
- [ ] Criar `inventory_optimizer.py`
- [ ] Implementar cálculo de Estoque de Segurança:
  ```python
  safety_stock = Z_score × σ_demand × √lead_time
  ```
- [ ] Calcular Ponto de Reposição:
  ```python
  reorder_point = (avg_demand × lead_time) + safety_stock
  ```
- [ ] Calcular EOQ (Economic Order Quantity):
  ```python
  EOQ = √(2 × annual_demand × ordering_cost / holding_cost)
  ```
- [ ] Plano de reposição otimizado
- [ ] Endpoint `POST /demand-forecast/optimize-reorder`

**Estimativa:** 6-8 dias

---

## Fase 2: Frontend - Página Dedicada

### 2.1 - Estrutura da Página

**Arquivos:**
- `admin/src/app/estoque/previsao-demanda/page.tsx` (NOVO)
- `admin/src/components/demand-forecast/` (NOVA PASTA)

**Tarefas:**

#### 2.1.1 - Criar Página Base ⭐⭐
- [ ] Criar estrutura de pastas:
  ```
  admin/src/
    ├── app/
    │   └── estoque/
    │       └── previsao-demanda/
    │           └── page.tsx
    └── components/
        └── demand-forecast/
            ├── DashboardCards.tsx
            ├── AlertsPanel.tsx
            ├── ProductForecastTable.tsx
            ├── BulkForecastView.tsx
            ├── ABCXYZMatrix.tsx
            ├── SeasonalityChart.tsx
            ├── CorrelationHeatmap.tsx
            ├── ReorderPlan.tsx
            └── index.ts
  ```
- [ ] Implementar layout com Tabs:
  - Dashboard
  - Análise por Produto
  - Análise Avançada
  - Plano de Reposição

#### 2.1.2 - Dashboard Cards ⭐⭐
- [ ] Componente `DashboardCards.tsx`:
  ```tsx
  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
    <Card>
      <CardHeader>
        <CardTitle>Total de Produtos</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold">150</div>
        <p className="text-xs text-muted-foreground">
          120 com previsão ativa
        </p>
      </CardContent>
    </Card>

    <Card>
      <CardHeader>
        <CardTitle>Alertas Críticos</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold text-red-600">8</div>
        <p className="text-xs text-muted-foreground">
          Risco de ruptura
        </p>
      </CardContent>
    </Card>

    <Card>
      <CardHeader>
        <CardTitle>Demanda 4 Semanas</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold">5.420 un</div>
        <p className="text-xs text-muted-foreground">
          ↗️ +12% vs. período anterior
        </p>
      </CardContent>
    </Card>

    <Card>
      <CardHeader>
        <CardTitle>Cobertura Média</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold">21.5 dias</div>
        <p className="text-xs text-muted-foreground">
          15 produtos abaixo do ideal
        </p>
      </CardContent>
    </Card>
  </div>
  ```

#### 2.1.3 - Painel de Alertas ⭐⭐⭐
- [ ] Componente `AlertsPanel.tsx`:
  - Lista de alertas ordenados por severidade
  - Cores: Critical (vermelho), Warning (amarelo), Info (azul)
  - Ações rápidas: "Comprar Agora", "Ver Detalhes"
  - Filtros: Tipo, Severidade, Categoria
- [ ] Implementar notificações push (opcional)
- [ ] Badge de contagem de novos alertas

#### 2.1.4 - Tabela de Produtos com Previsão ⭐⭐⭐
- [ ] Componente `ProductForecastTable.tsx`:
  - Colunas:
    - Nome do Produto
    - Categoria
    - Estoque Atual
    - Demanda 4 Semanas (prevista)
    - Cobertura (dias)
    - Tendência (ícone)
    - Alertas (badge)
    - Ações (expandir detalhes)
  - Paginação (20 itens/página)
  - Ordenação por colunas
  - Filtros: Categoria, Tendência, Com/Sem Alertas
  - Busca por nome
- [ ] Expansão inline: Mostra gráfico resumido
- [ ] Seleção múltipla para comparação

**Estimativa:** 5-6 dias

---

### 2.2 - Visualizações Avançadas

**Tarefas:**

#### 2.2.1 - Matriz ABC/XYZ ⭐⭐⭐
- [ ] Componente `ABCXYZMatrix.tsx`:
  - Grid 3×3 com 9 células
  - Cada célula mostra:
    - Quantidade de produtos
    - % do total
    - Estratégia recomendada
  - Hover: Lista de produtos na categoria
  - Clique: Navegação para lista filtrada
- [ ] Implementar gradiente de cores:
  - AX (verde escuro) - Gestão rigorosa
  - CZ (vermelho) - Revisar necessidade
- [ ] Tooltip com explicação de cada categoria

#### 2.2.2 - Heatmap de Correlação ⭐⭐⭐
- [ ] Componente `CorrelationHeatmap.tsx`:
  - Usar Recharts ou D3.js
  - Matriz NxN de produtos correlacionados
  - Escala de cor: -1 (vermelho) a +1 (verde)
  - Hover: Mostrar valor exato + interpretação
  - Filtros: Top 20 produtos, Por categoria
- [ ] Destacar correlações fortes (> 0.7 ou < -0.7)
- [ ] Insights automáticos:
  - "Produtos X e Y têm forte correlação positiva (+0.85)"
  - "Considere promoções conjuntas"

#### 2.2.3 - Análise de Sazonalidade ⭐⭐
- [ ] Componente `SeasonalityChart.tsx`:
  - Gráfico de calor (heatmap) mensal
  - Eixo X: Meses do ano
  - Eixo Y: Dias da semana
  - Intensidade de cor: Volume de vendas
- [ ] Detectar padrões:
  - "Picos toda segunda-feira"
  - "Aumento em dezembro"
  - "Baixa em feriados"
- [ ] Comparação ano a ano

#### 2.2.4 - Comparação de Múltiplos Produtos ⭐⭐
- [ ] Componente `BulkForecastView.tsx`:
  - Seleção de até 5 produtos
  - Gráficos sobrepostos (linha)
  - Tabela comparativa de métricas:
    - Demanda prevista
    - Tendência (%)
    - Cobertura atual
    - Estoque recomendado
  - Exportar comparação (PDF/Excel)

**Estimativa:** 6-7 dias

---

## Fase 3: Plano de Reposição Inteligente

### 3.1 - Sugestões Automatizadas de Compra

**Tarefas:**

#### 3.1.1 - Algoritmo de Recomendação ⭐⭐⭐
- [ ] Implementar em `inventory_optimizer.py`:
  ```python
  def generate_reorder_plan(workspace_id: int, horizon_weeks: int = 4):
      """
      Gera plano de reposição otimizado

      Returns:
          [
              {
                  "product_id": 1,
                  "product_name": "Produto A",
                  "current_stock": 45,
                  "predicted_demand": 120,
                  "reorder_point": 60,
                  "suggested_order_qty": 150,
                  "urgency": "high",
                  "order_by_date": "2025-11-05",
                  "supplier_id": 3,
                  "estimated_cost": 1500.00,
                  "lead_time_days": 7
              },
              ...
          ]
      """
  ```
- [ ] Critérios de priorização:
  1. Produtos abaixo do ponto de reposição (urgente)
  2. Produtos com estoque para < 2 semanas
  3. Produtos com tendência crescente
  4. Produtos com sazonalidade próxima ao pico

#### 3.1.2 - Componente de Plano de Reposição ⭐⭐⭐
- [ ] `ReorderPlan.tsx`:
  - Tabela de produtos recomendados
  - Colunas:
    - Prioridade (1-5 estrelas)
    - Produto
    - Qtd Sugerida
    - Fornecedor Recomendado
    - Custo Estimado
    - Data Limite de Pedido
    - Ações (Aprovar/Rejeitar/Ajustar)
  - Totalizador: Custo total do plano
  - Filtros: Por urgência, Por fornecedor
- [ ] Ações em lote:
  - "Aprovar Todos Urgentes"
  - "Exportar Pedidos para Excel"
  - "Enviar para Fornecedores"

#### 3.1.3 - Integração com Fornecedores ⭐⭐
- [ ] Endpoint `POST /demand-forecast/approve-reorder`:
  - Criar rascunho de pedido de compra
  - Associar fornecedor
  - Status: "draft"
- [ ] Modal de aprovação:
  - Review de itens
  - Ajuste de quantidades
  - Seleção de fornecedor alternativo
  - Notas adicionais
- [ ] Criar pedido em módulo de Compras (integração)

#### 3.1.4 - Cronograma Visual ⭐⭐
- [ ] Componente `ReorderTimeline.tsx`:
  - Timeline horizontal (próximas 12 semanas)
  - Marcadores:
    - 📦 Pedidos recomendados
    - ⚠️ Risco de ruptura
    - 📈 Picos de demanda previstos
    - ✅ Entregas previstas
  - Drag & drop para ajustar datas (opcional)

**Estimativa:** 5-6 dias

---

## Fase 4: Exportação e Relatórios

### 4.1 - Exportação de Dados

**Tarefas:**

#### 4.1.1 - Exportação Excel ⭐⭐⭐
- [ ] Instalar dependências:
  ```bash
  pip install openpyxl xlsxwriter
  npm install xlsx file-saver
  ```
- [ ] Backend: Endpoint `GET /demand-forecast/export/excel`:
  - Gerar arquivo .xlsx
  - Múltiplas abas:
    - Dashboard (métricas globais)
    - Produtos com Previsão (tabela completa)
    - Alertas
    - Plano de Reposição
    - Análise ABC/XYZ
  - Formatação profissional:
    - Headers em negrito
    - Cores por severidade
    - Fórmulas para totais
  - Endpoint retorna arquivo para download

#### 4.1.2 - Exportação PDF ⭐⭐⭐
- [ ] Instalar dependências:
  ```bash
  pip install reportlab matplotlib
  npm install jspdf jspdf-autotable
  ```
- [ ] Backend: Endpoint `GET /demand-forecast/export/pdf`:
  - Gerar relatório PDF profissional
  - Seções:
    - Capa (logo, data, período)
    - Executive Summary (métricas)
    - Gráficos (histórico + previsão)
    - Tabelas de produtos
    - Alertas críticos
    - Recomendações
  - Gráficos gerados com matplotlib
  - Formatação: Times New Roman, cores corporativas

#### 4.1.3 - Exportação CSV ⭐
- [ ] Frontend: Botão "Exportar CSV"
  - Usar biblioteca `xlsx` (client-side)
  - Permitir seleção de colunas
  - Formato padrão CSV (separador: ponto-e-vírgula)
  - Nome do arquivo: `previsao_demanda_YYYY-MM-DD.csv`

#### 4.1.4 - Agendamento de Relatórios ⭐⭐
- [ ] Criar tabela `scheduled_reports`:
  ```sql
  CREATE TABLE scheduled_reports (
    id SERIAL PRIMARY KEY,
    workspace_id INTEGER REFERENCES workspaces(id),
    user_id INTEGER REFERENCES users(id),
    report_type VARCHAR(50), -- 'forecast_dashboard', 'reorder_plan'
    frequency VARCHAR(20), -- 'daily', 'weekly', 'monthly'
    format VARCHAR(10), -- 'pdf', 'excel'
    email_to TEXT[],
    active BOOLEAN DEFAULT true,
    last_sent TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
  );
  ```
- [ ] Implementar Celery task para envio automático
- [ ] Interface de configuração de agendamentos
- [ ] Envio por email com anexo

**Estimativa:** 4-5 dias

---

## Fase 5: Polimento e Otimização

### 5.1 - Performance

**Tarefas:**

#### 5.1.1 - Cache Agressivo ⭐⭐
- [ ] Implementar cache Redis:
  - Dashboard: TTL 1 hora
  - Previsões individuais: TTL 24 horas
  - Bulk forecasts: TTL 12 horas
- [ ] Invalidação inteligente:
  - Ao adicionar nova venda
  - Ao ajustar estoque manualmente
- [ ] Pré-carregamento:
  - Job noturno: calcula top 50 produtos
  - Armazena em cache

#### 5.1.2 - Lazy Loading e Paginação ⭐
- [ ] Tabelas: Carregar 20 itens por vez
- [ ] Infinite scroll ou paginação tradicional
- [ ] Skeleton loaders durante fetch
- [ ] Debounce em filtros (300ms)

#### 5.1.3 - Otimização de Queries ⭐⭐
- [ ] Adicionar índices:
  ```sql
  CREATE INDEX idx_sales_product_created ON sales(product_id, created_at);
  CREATE INDEX idx_forecast_history_product ON forecast_history(product_id, forecast_date);
  ```
- [ ] Usar `select_related` / `prefetch_related`
- [ ] Queries batching: evitar N+1

**Estimativa:** 3-4 dias

---

### 5.2 - UX e Acessibilidade

**Tarefas:**

#### 5.2.1 - Tour Guiado ⭐⭐
- [ ] Instalar biblioteca de onboarding:
  ```bash
  npm install react-joyride
  ```
- [ ] Criar tour para novos usuários:
  - "Bem-vindo à Previsão de Demanda"
  - Explicar cada seção do dashboard
  - Mostrar como interpretar alertas
  - Como exportar relatórios
- [ ] Botão "?" no header para reativar tour

#### 5.2.2 - Tooltips Explicativos ⭐
- [ ] Adicionar tooltips em termos técnicos:
  - "MAPE": "Mean Absolute Percentage Error - quanto menor, melhor"
  - "Tendência": "Direção prevista da demanda nos próximos períodos"
  - "Cobertura": "Quantos dias o estoque atual durará"
- [ ] Usar componente Tooltip do shadcn/ui

#### 5.2.3 - Modo Escuro ⭐
- [ ] Garantir compatibilidade com dark mode
- [ ] Cores acessíveis (contraste WCAG AA)
- [ ] Gráficos legíveis em ambos os modos

#### 5.2.4 - Responsividade Mobile ⭐⭐
- [ ] Layout adaptativo para tablet/mobile
- [ ] Gráficos responsivos (Recharts já suporta)
- [ ] Tabelas: horizontal scroll em mobile
- [ ] Menu lateral colapsável

**Estimativa:** 3-4 dias

---

## Fase 6: Testes e Validação

### 6.1 - Testes Automatizados

**Tarefas:**

#### 6.1.1 - Testes de Backend ⭐⭐⭐
- [ ] Testes unitários:
  - `test_demand_analyzer.py`
  - `test_inventory_optimizer.py`
  - `test_forecast_accuracy.py`
- [ ] Testes de integração:
  - Fluxo completo: fetch → forecast → optimize
  - Teste de bulk forecasts (50 produtos)
- [ ] Testes de performance:
  - Dashboard deve carregar em < 1.5s
  - Bulk forecast (10 produtos) < 3s
- [ ] Coverage target: > 85%

#### 6.1.2 - Testes de Frontend ⭐⭐
- [ ] Testes de componentes (Jest + React Testing Library):
  - `DashboardCards.test.tsx`
  - `ProductForecastTable.test.tsx`
  - `AlertsPanel.test.tsx`
- [ ] Testes E2E (Playwright):
  - Navegar até módulo
  - Visualizar dashboard
  - Filtrar produtos
  - Exportar Excel
- [ ] Testes de acessibilidade (axe-core)

#### 6.1.3 - Testes de Acurácia do Modelo ⭐⭐⭐
- [ ] Backtesting:
  - Usar dados históricos de 6 meses
  - Comparar previsões vs. vendas reais
  - Calcular MAPE, MAE, RMSE
- [ ] Validação cruzada (k-fold)
- [ ] Documentar casos de baixa acurácia:
  - Produtos novos (< 3 meses)
  - Produtos com vendas esporádicas
  - Eventos atípicos (promoções)

**Estimativa:** 5-6 dias

---

## Fase 7: Documentação e Treinamento

### 7.1 - Documentação Técnica

**Tarefas:**

- [ ] API Documentation (Swagger):
  - Todos os novos endpoints
  - Exemplos de request/response
  - Códigos de erro
- [ ] Arquitetura do módulo (diagrams):
  - Fluxo de dados
  - Dependências entre componentes
  - Modelo de ML explicado
- [ ] README detalhado:
  - Como rodar localmente
  - Como treinar modelos
  - Como configurar cache

**Estimativa:** 2 dias

---

### 7.2 - Documentação de Usuário

**Tarefas:**

- [ ] Guia do Usuário (markdown):
  - O que é Previsão de Demanda
  - Como interpretar métricas
  - Como usar o Plano de Reposição
  - FAQ
- [ ] Vídeo tutorial (5-7 minutos):
  - Gravação de tela
  - Narração explicativa
  - Casos de uso práticos
- [ ] Glossário de termos:
  - MAPE, EOQ, Safety Stock, etc.
  - Explicações em linguagem simples

**Estimativa:** 3 dias

---

## Cronograma Geral

### Sprint 1 (Semanas 1-2): Backend Foundation
- Dias 1-5: Novos endpoints (dashboard, bulk, history)
- Dias 6-10: Análises avançadas (ABC/XYZ, correlação, sazonalidade)

### Sprint 2 (Semanas 3-4): Frontend Core
- Dias 11-14: Página base + Dashboard Cards
- Dias 15-18: Tabela de produtos + Painel de alertas

### Sprint 3 (Semanas 5-6): Visualizações Avançadas
- Dias 19-22: Matriz ABC/XYZ + Heatmap de correlação
- Dias 23-25: Gráficos de sazonalidade + Comparação de produtos

### Sprint 4 (Semana 7): Plano de Reposição
- Dias 26-29: Algoritmo de recomendação + Componente de UI
- Dia 30: Cronograma visual + Integração

### Sprint 5 (Semana 8): Exportação e Relatórios
- Dias 31-33: Excel + PDF + CSV
- Dias 34-35: Agendamento de relatórios

### Sprint 6 (Semana 9): Otimização
- Dias 36-38: Cache, lazy loading, índices
- Dias 39-40: UX, tooltips, tour guiado

### Sprint 7 (Semana 10): Testes e Validação
- Dias 41-43: Testes automatizados (backend + frontend)
- Dias 44-45: Backtesting e validação de acurácia

### Sprint 8 (Semana 11): Documentação e Lançamento
- Dias 46-48: Documentação técnica e de usuário
- Dias 49-50: Ajustes finais + Deploy
- Dia 51: Monitoramento pós-lançamento

**Total estimado:** 11 semanas (~51 dias úteis)

---

## Requisitos Técnicos Adicionais

### Backend Dependencies (adicionar ao requirements.txt)

```txt
# Análises Avançadas
scipy==1.11.4          # FFT, correlações
openpyxl==3.1.2        # Excel export
xlsxwriter==3.1.9      # Excel export avançado
reportlab==4.0.7       # PDF generation
matplotlib==3.8.2      # Gráficos para PDF
celery==5.3.4          # Tasks agendadas
redis==5.0.1           # Cache
```

### Frontend Dependencies

```json
{
  "dependencies": {
    "xlsx": "^0.18.5",
    "file-saver": "^2.0.5",
    "react-joyride": "^2.7.2",
    "jspdf": "^2.5.1",
    "jspdf-autotable": "^3.8.0"
  }
}
```

---

## Métricas de Sucesso

### KPIs Técnicos:

- ✅ Tempo de carregamento do dashboard: < 1.5s
- ✅ Bulk forecast (10 produtos): < 3s
- ✅ Acurácia média (MAPE): < 20%
- ✅ Cache hit rate: > 70%
- ✅ Uptime: > 99.5%

### KPIs de Negócio:

- ✅ Adoção do módulo: > 80% dos usuários
- ✅ Redução de rupturas de estoque: > 30%
- ✅ Otimização de capital em estoque: 15-20%
- ✅ Satisfação do usuário: > 4.5/5
- ✅ Exportações de relatórios: > 50/mês

### KPIs de Usabilidade:

- ✅ Tempo médio para gerar plano de reposição: < 2 min
- ✅ Taxa de conclusão do tour guiado: > 60%
- ✅ Tickets de suporte: < 5/mês

---

## Riscos e Mitigações

### Riscos Técnicos:

1. **Complexidade de cálculos (ABC/XYZ, correlações)**
   - Mitigação: Processar em background com Celery
   - Mitigação: Cache agressivo (24h TTL)
   - Mitigação: Limitar a 500 produtos simultâneos

2. **Performance com grandes volumes de dados**
   - Mitigação: Índices otimizados no banco
   - Mitigação: Paginação em todas as tabelas
   - Mitigação: Agregações pré-calculadas

3. **Geração de PDFs pesados**
   - Mitigação: Limite de 100 produtos por PDF
   - Mitigação: Compressão de imagens
   - Mitigação: Geração assíncrona

### Riscos de Negócio:

1. **Usuários não confiam nas previsões**
   - Mitigação: Transparência total (mostrar MAPE, histórico)
   - Mitigação: Permitir ajustes manuais
   - Mitigação: Educação via tour guiado

2. **Complexidade percebida**
   - Mitigação: UI intuitiva com tooltips
   - Mitigação: Valores padrão inteligentes
   - Mitigação: Onboarding completo

---

## Próximos Passos (Pós-Implementação)

### Fase 8: Evolução Contínua

1. **Machine Learning Avançado**
   - Experimentar LSTM/GRU para séries temporais
   - AutoML para seleção de modelos
   - Ensemble methods

2. **Integração com BI**
   - Conector para Power BI
   - Dashboard embebido
   - APIs públicas

3. **Automação Total**
   - Aprovação automática de pedidos (com regras)
   - Alertas via WhatsApp/Telegram
   - Integração com e-commerce (dropshipping)

4. **Análise Prescritiva**
   - Não só "o que vai acontecer", mas "o que fazer"
   - Simulações de cenários
   - Otimização de preços dinâmica

---

**Última atualização:** 2025-10-25
**Versão:** 1.0 (Roadmap Completo)
**Status:** 📋 Pronto para Aprovação e Implementação
