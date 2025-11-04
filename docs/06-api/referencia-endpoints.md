# Referência de Endpoints da API

> **Importante**: Esta documentação reflete os endpoints REALMENTE implementados no backend do Orion ERP. Todos os exemplos são baseados no código em produção.

## Informações Gerais

- **Base URL**: `http://localhost:8000/api/v1` (desenvolvimento)
- **Formato**: JSON para requisições e respostas
- **Autenticação**: JWT Bearer Token (exceto endpoints públicos)
- **Multi-tenancy**: Isolamento automático por `workspace_id`

## Índice

1. [Autenticação e Usuários](#1-autenticação-e-usuários)
2. [Produtos e Estoque](#2-produtos-e-estoque)
3. [Vendas e Oportunidades](#3-vendas-e-oportunidades)
4. [Gestão Financeira](#4-gestão-financeira)
5. [Integrações e Marketplace](#5-integrações-e-marketplace)
6. [Logística e Operações](#6-logística-e-operações)
7. [Automação e Inteligência](#7-automação-e-inteligência)
8. [Relatórios](#8-relatórios)
9. [Fiscal](#9-fiscal)
10. [Administração](#10-administração)

---

## 1. Autenticação e Usuários

### 1.1 Autenticação (`/auth`)

#### POST `/auth/token` - Login
Autentica usuário e retorna tokens JWT.

**Requisição:**
```json
{
  "email": "user@example.com",
  "password": "senha123"
}
```

**Resposta:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIs...",
  "token_type": "bearer"
}
```

**Notas:**
- Não requer autenticação
- Token de acesso expira em 30 minutos
- Token de refresh expira em 7 dias
- Retorna 401 se credenciais inválidas

---

#### GET `/auth/me` - Obter Usuário Atual
Retorna informações do usuário autenticado.

**Headers:**
```
Authorization: Bearer {access_token}
```

**Resposta:**
```json
{
  "id": 1,
  "email": "user@example.com",
  "name": "João Silva",
  "role": "admin",
  "workspace_id": 5,
  "active": true,
  "created_at": "2025-01-15T10:30:00"
}
```

---

#### POST `/auth/logout` - Logout
Endpoint para logout (invalidação do token no cliente).

**Headers:**
```
Authorization: Bearer {access_token}
```

**Resposta:**
```json
{
  "message": "Logged out successfully"
}
```

**Nota:** Invalidação de token deve ser feita no lado do cliente removendo o token do armazenamento.

---

### 1.2 Usuários (`/users`)

#### POST `/users/` - Criar Usuário
Cria novo usuário e workspace automaticamente.

**Requisição:**
```json
{
  "email": "novo@empresa.com",
  "password": "senha123",
  "name": "Maria Santos",
  "company_name": "Empresa LTDA",
  "cnpj": "12345678000190"
}
```

**Resposta:**
```json
{
  "id": 10,
  "email": "novo@empresa.com",
  "name": "Maria Santos",
  "role": "admin",
  "workspace_id": 15,
  "workspace": {
    "id": 15,
    "company_name": "Empresa LTDA",
    "cnpj": "12345678000190"
  },
  "active": true
}
```

**Notas:**
- Não requer autenticação (registro público)
- Cria workspace automaticamente
- Usuário criado é admin do workspace

---

#### GET `/users/{user_id}` - Obter Usuário por ID
Retorna detalhes de um usuário específico.

**Headers:**
```
Authorization: Bearer {access_token}
```

**Resposta:**
```json
{
  "id": 10,
  "email": "usuario@empresa.com",
  "name": "Maria Santos",
  "role": "user",
  "workspace_id": 15,
  "active": true,
  "created_at": "2025-01-10T14:20:00"
}
```

**Notas:**
- Requer autenticação
- Isolamento por workspace (só vê usuários do mesmo workspace)
- Retorna 404 se usuário não existir ou for de outro workspace

---

## 2. Produtos e Estoque

### 2.1 Produtos (`/products`)

#### GET `/products/` - Listar Produtos
Lista produtos com filtros e paginação.

**Query Parameters:**
- `skip`: Offset (padrão: 0)
- `limit`: Limite (padrão: 100)
- `active_only`: Apenas ativos (boolean)
- `category`: Filtrar por categoria
- `search`: Busca por nome/SKU
- `low_stock`: Apenas produtos com estoque baixo (boolean)

**Exemplo:**
```
GET /products/?skip=0&limit=50&active_only=true&search=camisa
```

**Resposta:**
```json
[
  {
    "id": 123,
    "name": "Camisa Polo Azul",
    "sku": "CAM-001",
    "category": "Vestuário",
    "current_stock": 45,
    "min_stock_level": 10,
    "max_stock_level": 100,
    "unit_cost": 35.00,
    "sale_price": 89.90,
    "active": true,
    "ncm": "61051000",
    "cfop": "5102",
    "created_at": "2025-01-05T09:15:00"
  }
]
```

**Notas:**
- Filtragem automática por `workspace_id`
- SKU é único por workspace
- Campos fiscais incluídos (NCM, CFOP, CEST)

---

#### GET `/products/{product_id}` - Obter Produto
Retorna detalhes completos de um produto.

**Resposta:**
```json
{
  "id": 123,
  "name": "Camisa Polo Azul",
  "sku": "CAM-001",
  "description": "Camisa polo 100% algodão",
  "category": "Vestuário",
  "current_stock": 45,
  "min_stock_level": 10,
  "max_stock_level": 100,
  "reorder_point": 20,
  "safety_stock": 15,
  "unit_cost": 35.00,
  "sale_price": 89.90,
  "ncm": "61051000",
  "cfop": "5102",
  "cest": null,
  "origem_mercadoria": 0,
  "active": true,
  "weight_kg": 0.250,
  "dimensions": {
    "length_cm": 30,
    "width_cm": 20,
    "height_cm": 5
  },
  "created_at": "2025-01-05T09:15:00",
  "updated_at": "2025-01-15T14:30:00"
}
```

---

#### POST `/products/` - Criar Produto
Cria novo produto.

**Requisição:**
```json
{
  "name": "Camisa Polo Verde",
  "sku": "CAM-002",
  "description": "Camisa polo verde musgo",
  "category": "Vestuário",
  "current_stock": 0,
  "min_stock_level": 10,
  "max_stock_level": 100,
  "unit_cost": 35.00,
  "sale_price": 89.90,
  "ncm": "61051000",
  "cfop": "5102",
  "origem_mercadoria": 0,
  "active": true,
  "weight_kg": 0.250
}
```

**Resposta:** Produto criado (mesmo formato do GET)

**Validações:**
- SKU único no workspace
- NCM obrigatório para emissão de NF-e
- CFOP obrigatório

---

#### PATCH `/products/{product_id}` - Atualizar Produto
Atualiza campos de um produto (partial update).

**Requisição:**
```json
{
  "sale_price": 99.90,
  "min_stock_level": 15,
  "active": true
}
```

**Resposta:** Produto atualizado

**Nota:** Apenas campos enviados são atualizados.

---

#### DELETE `/products/{product_id}` - Deletar Produto
Remove produto do sistema.

**Resposta:** 204 No Content

**Atenção:**
- Soft delete (marca como inativo) se houver vendas/movimentações associadas
- Hard delete se produto novo sem histórico

---

#### POST `/products/{product_id}/adjust-stock` - Ajustar Estoque
Ajusta quantidade em estoque (entrada, saída ou correção).

**Requisição:**
```json
{
  "adjustment_type": "in",
  "quantity": 50,
  "reason": "Compra de fornecedor",
  "notes": "Nota fiscal 12345"
}
```

**Tipos:**
- `in`: Entrada de estoque
- `out`: Saída de estoque
- `correction`: Correção de inventário

**Resposta:**
```json
{
  "message": "Stock adjusted successfully",
  "new_stock": 95,
  "adjustment_id": 567
}
```

**Nota:** Cria registro em `StockAdjustment` para auditoria.

---

#### GET `/products/{product_id}/demand-forecast` - Previsão de Demanda
Retorna previsão de demanda baseada em ML.

**Query Parameters:**
- `period`: Período (default: 30 dias)
- `granularity`: daily/weekly/monthly

**Resposta:**
```json
{
  "product_id": 123,
  "forecast": [
    {
      "date": "2025-01-20",
      "predicted_demand": 12.5,
      "confidence_interval": {
        "lower": 8.0,
        "upper": 17.0
      }
    }
  ],
  "model": "moving_average_90d",
  "accuracy": 0.85
}
```

**Algoritmo:** Média móvel de 90 dias (versão atual)

---

#### GET `/products/stats/inventory-summary` - Resumo de Estoque
Retorna KPIs de estoque.

**Resposta:**
```json
{
  "total_products": 250,
  "active_products": 230,
  "total_stock_value": 125450.00,
  "products_below_minimum": 15,
  "products_out_of_stock": 5,
  "average_days_supply": 45,
  "stock_turnover_rate": 4.2
}
```

---

### 2.2 Lotes/Batches (`/inventory/batches`)

#### GET `/batches/` - Listar Lotes
Lista lotes de produtos com rastreamento de validade.

**Query Parameters:**
- `product_id`: Filtrar por produto
- `status`: active/expired/expiring_soon
- `expiring_in_days`: Lotes que vencem em X dias
- `search`: Busca por código do lote
- `skip`, `limit`: Paginação

**Resposta:**
```json
[
  {
    "id": 789,
    "batch_code": "LOT-2025-001",
    "product_id": 123,
    "product_name": "Camisa Polo Azul",
    "quantity": 100,
    "manufacturing_date": "2025-01-01",
    "expiry_date": "2026-01-01",
    "status": "active",
    "quality_certificate": "QC-2025-001",
    "days_until_expiry": 361,
    "created_at": "2025-01-05T10:00:00"
  }
]
```

---

#### GET `/batches/alerts` - Alertas de Validade
Lista lotes próximos do vencimento (padrão: 90 dias).

**Resposta:**
```json
[
  {
    "batch_id": 789,
    "batch_code": "LOT-2024-050",
    "product_name": "Produto Perecível",
    "expiry_date": "2025-03-15",
    "days_until_expiry": 70,
    "quantity": 50,
    "severity": "warning"
  }
]
```

**Severidade:**
- `critical`: < 30 dias
- `warning`: 30-90 dias
- `info`: > 90 dias

---

### 2.3 Armazéns (`/inventory/warehouses`)

#### GET `/warehouses/` - Listar Armazéns
Lista armazéns e áreas de armazenagem.

**Resposta:**
```json
[
  {
    "id": 1,
    "name": "Armazém Principal",
    "code": "ARM-01",
    "type": "main",
    "address": "Rua Industrial, 500",
    "is_active": true,
    "areas": [
      {
        "id": 10,
        "name": "Corredor A",
        "code": "A",
        "capacity": 1000,
        "current_occupation": 750
      }
    ],
    "total_capacity": 5000,
    "current_occupation": 3500,
    "occupation_percentage": 70
  }
]
```

---

#### GET `/warehouses/transfers` - Transferências Entre Armazéns
Lista transferências de estoque.

**Query Parameters:**
- `status`: pending/in_transit/completed/cancelled

**Resposta:**
```json
[
  {
    "id": 45,
    "from_warehouse_id": 1,
    "from_warehouse_name": "Armazém Principal",
    "to_warehouse_id": 2,
    "to_warehouse_name": "Filial SP",
    "product_id": 123,
    "product_name": "Camisa Polo Azul",
    "quantity": 50,
    "status": "in_transit",
    "requested_at": "2025-01-15T09:00:00",
    "shipped_at": "2025-01-15T14:00:00",
    "expected_arrival": "2025-01-16T10:00:00"
  }
]
```

---

### 2.4 Contagem de Estoque (`/inventory/cycle-counts`)

#### POST `/cycle-counts` - Criar Contagem
Inicia nova contagem cíclica de estoque.

**Requisição:**
```json
{
  "name": "Contagem Janeiro 2025",
  "warehouse_id": 1,
  "count_type": "partial",
  "product_ids": [123, 456, 789],
  "scheduled_date": "2025-01-20"
}
```

**Tipos:**
- `full`: Inventário completo
- `partial`: Apenas produtos selecionados
- `cycle`: Contagem rotativa ABC

**Resposta:**
```json
{
  "id": 67,
  "name": "Contagem Janeiro 2025",
  "status": "pending",
  "items_count": 3,
  "created_at": "2025-01-15T10:00:00"
}
```

---

#### POST `/cycle-counts/{count_id}/start` - Iniciar Contagem
Inicia processo de contagem.

**Resposta:**
```json
{
  "message": "Count started",
  "status": "in_progress",
  "started_at": "2025-01-20T08:00:00"
}
```

---

#### PUT `/count-items/{item_id}/count` - Registrar Contagem
Registra quantidade contada.

**Requisição:**
```json
{
  "counted_quantity": 95,
  "notes": "Contado por João"
}
```

**Resposta:**
```json
{
  "item_id": 234,
  "product_name": "Camisa Polo Azul",
  "system_quantity": 100,
  "counted_quantity": 95,
  "discrepancy": -5,
  "status": "counted",
  "requires_approval": true
}
```

**Notas:**
- Discrepâncias > 5% requerem aprovação
- Status: pending → counted → approved/rejected

---

#### POST `/count-items/{item_id}/resolve` - Resolver Discrepância
Resolve divergência entre sistema e contagem.

**Requisição:**
```json
{
  "resolution": "adjust",
  "notes": "Verificado fisicamente, ajustando sistema",
  "approved_by": 1
}
```

**Resoluções:**
- `adjust`: Ajusta sistema para quantidade contada
- `recount`: Solicita nova contagem
- `ignore`: Mantém quantidade do sistema

---

### 2.5 Movimentações de Estoque (`/stock/movements`)

#### GET `/movements` - Listar Movimentações
Lista histórico de movimentações.

**Query Parameters:**
- `product_id`: Filtrar por produto
- `movement_type`: entrada/saida/transferencia/ajuste
- `start_date`, `end_date`: Período
- `limit`: Limite (default: 100)

**Resposta:**
```json
[
  {
    "id": 1234,
    "product_id": 123,
    "product_name": "Camisa Polo Azul",
    "movement_type": "saida",
    "quantity": 10,
    "previous_stock": 100,
    "new_stock": 90,
    "reason": "Venda",
    "reference_type": "sale",
    "reference_id": 567,
    "user_id": 1,
    "user_name": "João Silva",
    "created_at": "2025-01-15T14:30:00"
  }
]
```

---

### 2.6 Relatórios de Estoque (`/stock-reports`)

#### GET `/stock-reports/statistics` - Estatísticas Gerais
KPIs de estoque consolidados.

**Resposta:**
```json
{
  "total_products": 250,
  "total_stock_value": 125450.00,
  "products_below_minimum": 15,
  "products_out_of_stock": 5,
  "average_stock_age_days": 45,
  "stock_turnover_rate": 4.2,
  "dead_stock_value": 8500.00,
  "slow_moving_items": 23
}
```

---

#### GET `/stock-reports/turnover` - Giro de Estoque
Análise de giro de estoque por produto.

**Query Parameters:**
- `days`: Período de análise (default: 90)
- `limit`: Top N produtos

**Resposta:**
```json
[
  {
    "product_id": 123,
    "product_name": "Camisa Polo Azul",
    "total_sold": 150,
    "average_stock": 50,
    "turnover_rate": 3.0,
    "days_of_supply": 30,
    "classification": "fast_moving"
  }
]
```

**Classificação:**
- `fast_moving`: Giro > 6/ano
- `medium_moving`: Giro 3-6/ano
- `slow_moving`: Giro 1-3/ano
- `dead_stock`: Giro < 1/ano

---

## 3. Vendas e Oportunidades

### 3.1 Vendas (`/sales`)

#### GET `/sales/` - Listar Vendas
Lista vendas com filtros.

**Query Parameters:**
- `skip`, `limit`: Paginação
- `status_filter`: pending/completed/cancelled
- `product_id`: Filtrar por produto
- `start_date`, `end_date`: Período

**Resposta:**
```json
[
  {
    "id": 567,
    "sale_number": "VND-2025-0567",
    "customer_name": "Cliente ABC",
    "customer_email": "cliente@abc.com",
    "total_value": 450.00,
    "status": "completed",
    "payment_method": "credit_card",
    "sale_channel": "online",
    "items": [
      {
        "product_id": 123,
        "product_name": "Camisa Polo Azul",
        "quantity": 5,
        "unit_price": 89.90,
        "subtotal": 449.50
      }
    ],
    "nfe_status": "issued",
    "nfe_number": "123456",
    "created_at": "2025-01-15T10:30:00"
  }
]
```

---

#### POST `/sales/` - Criar Venda
Cria nova venda e atualiza estoque automaticamente.

**Requisição:**
```json
{
  "customer_name": "Maria Santos",
  "customer_email": "maria@email.com",
  "customer_cpf": "12345678900",
  "items": [
    {
      "product_id": 123,
      "quantity": 2,
      "unit_price": 89.90
    }
  ],
  "payment_method": "credit_card",
  "sale_channel": "online",
  "notes": "Entrega expressa"
}
```

**Resposta:** Venda criada (formato similar ao GET)

**Efeitos:**
- Deduz estoque automaticamente
- Cria movimentação de estoque
- Pode gerar NF-e se configurado
- Cria conta a receber

**Validações:**
- Estoque suficiente para todos os itens
- Produtos ativos
- Preço > 0

---

#### DELETE `/sales/{sale_id}` - Cancelar Venda
Cancela venda e restaura estoque.

**Resposta:** 204 No Content

**Efeitos:**
- Restaura estoque dos produtos
- Cria movimentação de estorno
- Cancela NF-e se emitida (dentro de 24h)
- Cancela conta a receber

---

### 3.2 Pipeline de Vendas (`/sales-pipeline`)

#### GET `/sales-pipeline/pipelines` - Listar Pipelines
Lista pipelines de vendas configurados.

**Resposta:**
```json
[
  {
    "id": 1,
    "name": "Pipeline Vendas B2B",
    "description": "Processo de vendas corporativas",
    "is_active": true,
    "is_default": true,
    "stages": [
      {
        "id": 10,
        "name": "Prospecção",
        "order": 1,
        "color": "#3B82F6",
        "is_final": false
      },
      {
        "id": 11,
        "name": "Qualificação",
        "order": 2,
        "color": "#8B5CF6",
        "is_final": false
      },
      {
        "id": 12,
        "name": "Proposta",
        "order": 3,
        "color": "#F59E0B",
        "is_final": false
      },
      {
        "id": 13,
        "name": "Fechado Ganho",
        "order": 4,
        "color": "#10B981",
        "is_final": true
      },
      {
        "id": 14,
        "name": "Perdido",
        "order": 5,
        "color": "#EF4444",
        "is_final": true
      }
    ]
  }
]
```

---

#### GET `/sales-pipeline/opportunities` - Listar Oportunidades
Lista oportunidades no pipeline.

**Query Parameters:**
- `pipeline_id`: Filtrar por pipeline
- `stage_id`: Filtrar por estágio
- `status`: open/won/lost
- `assigned_to`: Filtrar por responsável
- `search`: Busca por nome da oportunidade
- `skip`, `limit`: Paginação

**Resposta:**
```json
[
  {
    "id": 234,
    "title": "Venda Empresa XYZ - 500 unidades",
    "description": "Grande contrato corporativo",
    "value": 45000.00,
    "probability": 75,
    "stage_id": 11,
    "stage_name": "Qualificação",
    "status": "open",
    "source": "inbound",
    "assigned_to": 1,
    "assigned_to_name": "João Silva",
    "expected_close_date": "2025-02-15",
    "created_at": "2025-01-10T09:00:00",
    "last_activity": "2025-01-15T14:30:00",
    "days_in_stage": 5
  }
]
```

---

#### GET `/sales-pipeline/opportunities/stats` - Estatísticas do Pipeline
KPIs do pipeline de vendas.

**Query Parameters:**
- `pipeline_id`: Filtrar por pipeline (opcional)

**Resposta:**
```json
{
  "total_opportunities": 45,
  "total_value": 890000.00,
  "weighted_value": 556250.00,
  "average_deal_size": 19777.78,
  "conversion_rate": 0.32,
  "average_sales_cycle_days": 28,
  "by_stage": [
    {
      "stage_id": 10,
      "stage_name": "Prospecção",
      "count": 15,
      "value": 280000.00
    },
    {
      "stage_id": 11,
      "stage_name": "Qualificação",
      "count": 12,
      "value": 310000.00
    }
  ],
  "by_source": [
    {
      "source": "inbound",
      "count": 20,
      "value": 450000.00
    },
    {
      "source": "outbound",
      "count": 15,
      "value": 320000.00
    }
  ]
}
```

---

#### GET `/sales-pipeline/analytics` - Analytics Avançado
Análises detalhadas de conversão e tempo por estágio.

**Resposta:**
```json
{
  "conversion_by_source": [
    {
      "source": "inbound",
      "total": 100,
      "won": 35,
      "conversion_rate": 0.35
    }
  ],
  "average_time_by_stage": [
    {
      "stage_name": "Prospecção",
      "avg_days": 5.2
    },
    {
      "stage_name": "Qualificação",
      "avg_days": 7.8
    },
    {
      "stage_name": "Proposta",
      "avg_days": 10.5
    }
  ],
  "win_loss_analysis": {
    "won_count": 35,
    "lost_count": 45,
    "win_rate": 0.44,
    "top_loss_reasons": [
      {
        "reason": "Preço alto",
        "count": 15
      }
    ]
  }
}
```

---

## 4. Gestão Financeira

### 4.1 Contas a Pagar (`/accounts-payable`)

#### POST `/accounts-payable/suppliers` - Criar Fornecedor
Cadastra novo fornecedor.

**Requisição:**
```json
{
  "name": "Fornecedor ABC LTDA",
  "cnpj": "12345678000190",
  "email": "contato@fornecedor.com",
  "phone": "(11) 98765-4321",
  "address": "Rua Exemplo, 123",
  "payment_terms": "30/60",
  "payment_method": "bank_transfer",
  "is_active": true,
  "notes": "Fornecedor principal de matéria-prima"
}
```

**Resposta:** Fornecedor criado

---

#### GET `/accounts-payable/suppliers` - Listar Fornecedores
Lista fornecedores com filtros.

**Query Parameters:**
- `skip`, `limit`: Paginação
- `is_active`: Apenas ativos (boolean)
- `search`: Busca por nome/CNPJ

---

#### POST `/accounts-payable/invoices` - Criar Conta a Pagar
Registra nova conta a pagar.

**Requisição:**
```json
{
  "supplier_id": 5,
  "invoice_number": "NF-12345",
  "issue_date": "2025-01-15",
  "due_date": "2025-02-15",
  "amount": 5500.00,
  "category": "raw_materials",
  "description": "Compra de matéria-prima",
  "payment_method": "bank_transfer",
  "status": "pending",
  "attachments": [
    {
      "filename": "nota-fiscal.pdf",
      "url": "https://storage.example.com/nf-12345.pdf"
    }
  ]
}
```

**Status:**
- `pending`: Aguardando pagamento
- `approved`: Aprovada para pagamento
- `paid`: Paga
- `overdue`: Vencida
- `cancelled`: Cancelada

---

#### GET `/accounts-payable/invoices` - Listar Contas a Pagar
Lista contas a pagar com filtros avançados.

**Query Parameters:**
- `skip`, `limit`: Paginação
- `status`: pending/approved/paid/overdue/cancelled
- `supplier_id`: Filtrar por fornecedor
- `start_date`, `end_date`: Período (por due_date)
- `overdue_only`: Apenas vencidas (boolean)

**Resposta:**
```json
[
  {
    "id": 123,
    "supplier_id": 5,
    "supplier_name": "Fornecedor ABC LTDA",
    "invoice_number": "NF-12345",
    "issue_date": "2025-01-15",
    "due_date": "2025-02-15",
    "amount": 5500.00,
    "amount_paid": 0.00,
    "amount_remaining": 5500.00,
    "category": "raw_materials",
    "status": "pending",
    "days_until_due": 31,
    "created_at": "2025-01-15T10:00:00"
  }
]
```

---

#### POST `/accounts-payable/invoices/{invoice_id}/payments` - Registrar Pagamento
Registra pagamento de conta a pagar.

**Requisição:**
```json
{
  "payment_date": "2025-02-10",
  "amount": 5500.00,
  "payment_method": "bank_transfer",
  "bank_account_id": 2,
  "notes": "Pagamento integral via TED"
}
```

**Resposta:**
```json
{
  "id": 345,
  "invoice_id": 123,
  "payment_date": "2025-02-10",
  "amount": 5500.00,
  "payment_method": "bank_transfer",
  "status": "completed",
  "created_at": "2025-02-10T15:30:00"
}
```

**Efeitos:**
- Atualiza status da fatura (paid se pagamento integral)
- Cria transação de saída no fluxo de caixa
- Atualiza saldo da conta bancária

---

#### POST `/accounts-payable/invoices/{invoice_id}/approve` - Aprovar Fatura
Aprova fatura para pagamento (workflow de aprovação).

**Requisição:**
```json
{
  "notes": "Aprovado por diretoria"
}
```

**Resposta:**
```json
{
  "message": "Invoice approved",
  "status": "approved",
  "approved_by": 1,
  "approved_at": "2025-01-16T09:00:00"
}
```

---

#### GET `/accounts-payable/analytics/summary` - Resumo Analítico
KPIs de contas a pagar.

**Query Parameters:**
- `start_date`, `end_date`: Período (opcional)

**Resposta:**
```json
{
  "total_payable": 125000.00,
  "total_overdue": 15000.00,
  "total_paid": 85000.00,
  "dpo": 42.5,
  "overdue_percentage": 12.0,
  "average_payment_delay": 3.2,
  "by_status": {
    "pending": 45000.00,
    "approved": 35000.00,
    "paid": 85000.00,
    "overdue": 15000.00
  },
  "by_category": [
    {
      "category": "raw_materials",
      "amount": 55000.00
    },
    {
      "category": "services",
      "amount": 30000.00
    }
  ]
}
```

**Métricas:**
- `dpo`: Days Payable Outstanding (prazo médio de pagamento)
- `average_payment_delay`: Atraso médio em dias

---

#### GET `/accounts-payable/analytics/aging` - Relatório de Aging
Análise de contas a pagar por idade de vencimento.

**Resposta:**
```json
{
  "report_date": "2025-01-15",
  "total_payable": 125000.00,
  "aging_buckets": [
    {
      "label": "A vencer (0-30 dias)",
      "min_days": 0,
      "max_days": 30,
      "amount": 45000.00,
      "count": 12,
      "percentage": 36.0
    },
    {
      "label": "31-60 dias",
      "min_days": 31,
      "max_days": 60,
      "amount": 35000.00,
      "count": 8,
      "percentage": 28.0
    },
    {
      "label": "Vencido (1-30 dias)",
      "min_days": -30,
      "max_days": -1,
      "amount": 15000.00,
      "count": 5,
      "percentage": 12.0
    }
  ]
}
```

---

### 4.2 Contas a Receber (`/accounts-receivable`)

#### POST `/accounts-receivable/` - Criar Conta a Receber
Registra nova conta a receber.

**Requisição:**
```json
{
  "customer_name": "Cliente XYZ LTDA",
  "customer_cnpj": "98765432000100",
  "invoice_number": "VND-2025-0567",
  "issue_date": "2025-01-15",
  "due_date": "2025-02-15",
  "amount": 8900.00,
  "category": "product_sale",
  "payment_method": "bank_slip",
  "status": "pending",
  "risk_category": "low",
  "notes": "Venda de 100 unidades"
}
```

**Status:**
- `pending`: Aguardando pagamento
- `partial`: Parcialmente pago
- `received`: Pago integralmente
- `overdue`: Vencido
- `cancelled`: Cancelado

**Categoria de Risco:**
- `low`: Cliente confiável, histórico bom
- `medium`: Cliente regular
- `high`: Cliente novo ou histórico ruim

---

#### GET `/accounts-receivable/` - Listar Contas a Receber
Lista contas a receber com filtros.

**Query Parameters:**
- `skip`, `limit`: Paginação
- `status`: pending/partial/received/overdue/cancelled
- `customer_id`: Filtrar por cliente
- `customer_name`: Busca por nome do cliente
- `risk_category`: low/medium/high
- `start_date`, `end_date`: Período
- `overdue_only`: Apenas vencidas (boolean)

**Resposta:**
```json
[
  {
    "id": 456,
    "customer_name": "Cliente XYZ LTDA",
    "customer_cnpj": "98765432000100",
    "invoice_number": "VND-2025-0567",
    "issue_date": "2025-01-15",
    "due_date": "2025-02-15",
    "amount": 8900.00,
    "amount_received": 0.00,
    "amount_remaining": 8900.00,
    "status": "pending",
    "risk_category": "low",
    "days_until_due": 31,
    "created_at": "2025-01-15T10:30:00"
  }
]
```

---

#### POST `/accounts-receivable/{receivable_id}/receive` - Receber Pagamento
Registra recebimento integral.

**Requisição:**
```json
{
  "payment_date": "2025-02-10",
  "amount": 8900.00,
  "payment_method": "bank_transfer",
  "bank_account_id": 1,
  "notes": "Recebido via PIX"
}
```

**Efeitos:**
- Atualiza status para `received`
- Cria transação de entrada no fluxo de caixa
- Atualiza saldo da conta bancária

---

#### POST `/accounts-receivable/{receivable_id}/partial-payment` - Recebimento Parcial
Registra recebimento parcial.

**Requisição:**
```json
{
  "payment_date": "2025-02-05",
  "amount": 4000.00,
  "payment_method": "bank_transfer",
  "bank_account_id": 1,
  "notes": "Primeira parcela"
}
```

**Efeitos:**
- Atualiza status para `partial`
- Deduz valor pago do `amount_remaining`
- Mantém conta aberta até pagamento integral

---

#### GET `/accounts-receivable/analytics/summary` - Resumo Analítico
KPIs de contas a receber.

**Query Parameters:**
- `start_date`, `end_date`: Período (opcional)

**Resposta:**
```json
{
  "total_receivable": 285000.00,
  "total_overdue": 35000.00,
  "total_received": 150000.00,
  "dso": 38.5,
  "default_rate": 0.08,
  "average_collection_delay": 5.2,
  "by_status": {
    "pending": 120000.00,
    "partial": 15000.00,
    "received": 150000.00,
    "overdue": 35000.00
  },
  "by_risk_category": [
    {
      "category": "low",
      "amount": 180000.00,
      "overdue_amount": 10000.00
    },
    {
      "category": "medium",
      "amount": 75000.00,
      "overdue_amount": 15000.00
    },
    {
      "category": "high",
      "amount": 30000.00,
      "overdue_amount": 10000.00
    }
  ]
}
```

**Métricas:**
- `dso`: Days Sales Outstanding (prazo médio de recebimento)
- `default_rate`: Taxa de inadimplência (overdue / total)
- `average_collection_delay`: Atraso médio de recebimento

---

#### GET `/accounts-receivable/analytics/aging` - Relatório de Aging
Análise de contas a receber por idade.

**Resposta:**
```json
{
  "report_date": "2025-01-15",
  "total_receivable": 285000.00,
  "aging_buckets": [
    {
      "label": "A receber (0-30 dias)",
      "min_days": 0,
      "max_days": 30,
      "amount": 120000.00,
      "count": 35,
      "percentage": 42.1
    },
    {
      "label": "31-60 dias",
      "min_days": 31,
      "max_days": 60,
      "amount": 80000.00,
      "count": 20,
      "percentage": 28.1
    },
    {
      "label": "Vencido (1-30 dias)",
      "min_days": -30,
      "max_days": -1,
      "amount": 25000.00,
      "count": 8,
      "percentage": 8.8
    },
    {
      "label": "Vencido (31-60 dias)",
      "min_days": -60,
      "max_days": -31,
      "amount": 10000.00,
      "count": 3,
      "percentage": 3.5
    }
  ]
}
```

---

### 4.3 Fluxo de Caixa (`/cash-flow`)

#### POST `/cash-flow/bank-accounts` - Criar Conta Bancária
Cadastra nova conta bancária.

**Requisição:**
```json
{
  "bank_name": "Banco do Brasil",
  "account_number": "12345-6",
  "agency": "1234",
  "account_type": "checking",
  "initial_balance": 10000.00,
  "is_active": true
}
```

**Tipos de Conta:**
- `checking`: Conta corrente
- `savings`: Poupança
- `investment`: Investimentos

---

#### GET `/cash-flow/bank-accounts` - Listar Contas Bancárias
Lista contas com saldos atualizados.

**Resposta:**
```json
[
  {
    "id": 1,
    "bank_name": "Banco do Brasil",
    "account_number": "12345-6",
    "agency": "1234",
    "account_type": "checking",
    "current_balance": 45680.50,
    "is_active": true,
    "created_at": "2025-01-01T00:00:00",
    "last_transaction": "2025-01-15T14:30:00"
  }
]
```

---

#### POST `/cash-flow/transactions` - Criar Transação
Registra transação de entrada ou saída.

**Requisição:**
```json
{
  "bank_account_id": 1,
  "type": "income",
  "amount": 8900.00,
  "category": "sales",
  "description": "Recebimento cliente XYZ",
  "transaction_date": "2025-01-15",
  "reference_type": "accounts_receivable",
  "reference_id": 456,
  "is_reconciled": false
}
```

**Tipos:**
- `income`: Entrada
- `expense`: Saída

**Categorias (Entrada):**
- `sales`: Vendas
- `services`: Serviços
- `investments`: Investimentos
- `loan`: Empréstimos
- `other`: Outros

**Categorias (Saída):**
- `purchases`: Compras
- `salaries`: Salários
- `rent`: Aluguel
- `utilities`: Utilidades
- `marketing`: Marketing
- `taxes`: Impostos
- `loan_payment`: Pagamento empréstimos
- `other`: Outros

**Efeitos:**
- Atualiza saldo da conta bancária automaticamente
- Cria entrada no histórico

---

#### GET `/cash-flow/transactions` - Listar Transações
Lista transações com filtros avançados.

**Query Parameters:**
- `skip`, `limit`: Paginação
- `start_date`, `end_date`: Período
- `type`: income/expense
- `category`: Categoria específica
- `account_id`: Filtrar por conta
- `is_reconciled`: Apenas reconciliadas (boolean)
- `search`: Busca na descrição

**Resposta:**
```json
[
  {
    "id": 789,
    "bank_account_id": 1,
    "bank_account_name": "Banco do Brasil - 12345-6",
    "type": "income",
    "amount": 8900.00,
    "category": "sales",
    "description": "Recebimento cliente XYZ",
    "transaction_date": "2025-01-15",
    "is_reconciled": true,
    "reference_type": "accounts_receivable",
    "reference_id": 456,
    "created_at": "2025-01-15T10:30:00"
  }
]
```

---

#### POST `/cash-flow/transfer` - Transferência Entre Contas
Transfere valor entre contas bancárias.

**Requisição:**
```json
{
  "from_account_id": 1,
  "to_account_id": 2,
  "amount": 5000.00,
  "description": "Transferência para conta investimentos",
  "transfer_date": "2025-01-15"
}
```

**Resposta:**
```json
{
  "transfer_id": "TRF-2025-001",
  "from_transaction_id": 890,
  "to_transaction_id": 891,
  "amount": 5000.00,
  "status": "completed",
  "created_at": "2025-01-15T15:00:00"
}
```

**Efeitos:**
- Cria transação de saída na conta origem
- Cria transação de entrada na conta destino
- Vincula ambas as transações via `transfer_id`
- Atualiza saldos automaticamente

---

### 4.4 Analytics de Fluxo de Caixa (`/cash-flow/analytics`)

**Nota:** Este é o módulo mais completo de analytics do sistema.

#### GET `/cash-flow/analytics/summary` - Resumo do Período
KPIs de fluxo de caixa para período.

**Query Parameters:**
- `start_date`, `end_date`: Período (obrigatório)
- `account_id`: Filtrar por conta (opcional)

**Resposta:**
```json
{
  "period": {
    "start_date": "2025-01-01",
    "end_date": "2025-01-31"
  },
  "total_income": 285000.00,
  "total_expense": 175000.00,
  "net_cash_flow": 110000.00,
  "opening_balance": 45000.00,
  "closing_balance": 155000.00,
  "average_daily_balance": 98500.00,
  "transaction_count": {
    "income": 85,
    "expense": 120
  }
}
```

---

#### GET `/cash-flow/analytics/by-category` - Por Categoria
Análise de transações agrupadas por categoria.

**Query Parameters:**
- `start_date`, `end_date`: Período
- `type`: income/expense (obrigatório)

**Resposta:**
```json
[
  {
    "category": "sales",
    "total": 250000.00,
    "count": 75,
    "percentage": 87.7,
    "average": 3333.33
  },
  {
    "category": "services",
    "total": 35000.00,
    "count": 10,
    "percentage": 12.3,
    "average": 3500.00
  }
]
```

---

#### GET `/cash-flow/analytics/balance-history` - Histórico de Saldo
Saldo diário da(s) conta(s) ao longo do período.

**Query Parameters:**
- `start_date`, `end_date`: Período
- `account_id`: Filtrar por conta (opcional)

**Resposta:**
```json
[
  {
    "date": "2025-01-01",
    "balance": 45000.00,
    "daily_income": 0.00,
    "daily_expense": 0.00
  },
  {
    "date": "2025-01-02",
    "balance": 52000.00,
    "daily_income": 12000.00,
    "daily_expense": 5000.00
  },
  {
    "date": "2025-01-03",
    "balance": 48500.00,
    "daily_income": 8000.00,
    "daily_expense": 11500.00
  }
]
```

---

#### GET `/cash-flow/analytics/projection` - Projeção de Caixa
Projeção futura de saldo baseada em histórico.

**Query Parameters:**
- `days_ahead`: Dias para projetar (default: 30)
- `method`: simple/linear/weighted (default: weighted)
- `account_id`: Filtrar por conta (opcional)

**Métodos:**
- `simple`: Média simples de entradas/saídas
- `linear`: Regressão linear
- `weighted`: Média ponderada (mais peso em dados recentes)

**Resposta:**
```json
{
  "current_balance": 155000.00,
  "projection_method": "weighted",
  "projection_start_date": "2025-01-16",
  "projection_end_date": "2025-02-15",
  "daily_projections": [
    {
      "date": "2025-01-16",
      "projected_balance": 158500.00,
      "projected_income": 9500.00,
      "projected_expense": 6000.00,
      "confidence_interval": {
        "lower": 150000.00,
        "upper": 167000.00
      }
    }
  ],
  "summary": {
    "average_daily_income": 9500.00,
    "average_daily_expense": 5800.00,
    "projected_end_balance": 213000.00
  }
}
```

---

#### GET `/cash-flow/analytics/kpis` - KPIs Financeiros
Indicadores financeiros avançados.

**Query Parameters:**
- `period_days`: Período para cálculo (default: 90)

**Resposta:**
```json
{
  "liquidity": {
    "current_ratio": 2.45,
    "quick_ratio": 1.87,
    "cash_ratio": 1.23
  },
  "cycle": {
    "dso": 38.5,
    "dpo": 42.5,
    "cash_conversion_cycle": 24.0
  },
  "profitability": {
    "gross_margin": 0.42,
    "net_margin": 0.28,
    "roa": 0.15,
    "roe": 0.22
  },
  "burn_rate": {
    "monthly_burn": 58000.00,
    "runway_months": 8.5,
    "projected_zero_cash_date": "2025-09-30"
  }
}
```

**Métricas:**
- **Liquidez:**
  - `current_ratio`: Ativo Circulante / Passivo Circulante
  - `quick_ratio`: (Ativo - Estoque) / Passivo
  - `cash_ratio`: Caixa / Passivo
- **Ciclo:**
  - `dso`: Days Sales Outstanding (prazo médio recebimento)
  - `dpo`: Days Payable Outstanding (prazo médio pagamento)
  - `cash_conversion_cycle`: DSO + DIO - DPO
- **Rentabilidade:**
  - `gross_margin`: (Receita - CMV) / Receita
  - `net_margin`: Lucro Líquido / Receita
  - `roa`: Return on Assets
  - `roe`: Return on Equity
- **Burn Rate:**
  - `monthly_burn`: Queima mensal de caixa
  - `runway_months`: Meses até zerar caixa (no ritmo atual)

---

#### GET `/cash-flow/analytics/break-even` - Análise de Ponto de Equilíbrio
Calcula ponto de equilíbrio operacional.

**Query Parameters:**
- `period_days`: Período para análise (default: 90)

**Resposta:**
```json
{
  "period_days": 90,
  "fixed_costs": 125000.00,
  "variable_costs": 180000.00,
  "total_revenue": 450000.00,
  "units_sold": 5000,
  "average_price_per_unit": 90.00,
  "variable_cost_per_unit": 36.00,
  "contribution_margin": 0.60,
  "break_even_units": 2315,
  "break_even_revenue": 208350.00,
  "current_margin_of_safety": 0.54,
  "chart_data": [
    {
      "units": 0,
      "revenue": 0,
      "total_cost": 125000.00,
      "profit": -125000.00
    },
    {
      "units": 1000,
      "revenue": 90000.00,
      "total_cost": 161000.00,
      "profit": -71000.00
    },
    {
      "units": 2315,
      "revenue": 208350.00,
      "total_cost": 208340.00,
      "profit": 10.00
    },
    {
      "units": 5000,
      "revenue": 450000.00,
      "total_cost": 305000.00,
      "profit": 145000.00
    }
  ]
}
```

**Métricas:**
- `contribution_margin`: Margem de contribuição unitária
- `break_even_units`: Unidades necessárias para empatar
- `break_even_revenue`: Receita necessária para empatar
- `margin_of_safety`: Margem de segurança (% acima do ponto de equilíbrio)

---

#### POST `/cash-flow/scenarios/calculate` - Análise de Cenários
Calcula cenários otimista, realista e pessimista.

**Requisição:**
```json
{
  "projection_days": 90,
  "base_scenario": {
    "revenue_growth": 0.05,
    "expense_growth": 0.03
  },
  "optimistic_adjustment": {
    "revenue_factor": 1.2,
    "expense_factor": 0.9
  },
  "pessimistic_adjustment": {
    "revenue_factor": 0.8,
    "expense_factor": 1.1
  }
}
```

**Resposta:**
```json
{
  "base_date": "2025-01-15",
  "projection_days": 90,
  "scenarios": [
    {
      "name": "Pessimista",
      "probability": 0.20,
      "final_balance": 95000.00,
      "total_revenue": 340000.00,
      "total_expenses": 220000.00,
      "net_cash_flow": 120000.00,
      "monthly_data": [
        {
          "month": "2025-02",
          "revenue": 112000.00,
          "expenses": 72000.00,
          "net_flow": 40000.00,
          "ending_balance": 115000.00
        }
      ]
    },
    {
      "name": "Realista",
      "probability": 0.60,
      "final_balance": 155000.00,
      "total_revenue": 450000.00,
      "total_expenses": 280000.00,
      "net_cash_flow": 170000.00
    },
    {
      "name": "Otimista",
      "probability": 0.20,
      "final_balance": 225000.00,
      "total_revenue": 580000.00,
      "total_expenses": 310000.00,
      "net_cash_flow": 270000.00
    }
  ],
  "weighted_average": {
    "final_balance": 158000.00,
    "expected_revenue": 458000.00,
    "expected_expenses": 287000.00
  }
}
```

---

#### POST `/cash-flow/scenarios/simulate` - Simulador What-If
Simula impactos de ajustes específicos no caixa.

**Requisição:**
```json
{
  "simulation_days": 60,
  "adjustments": [
    {
      "type": "revenue_increase",
      "category": "sales",
      "percentage": 0.15,
      "description": "Aumento de 15% em vendas por promoção"
    },
    {
      "type": "expense_reduction",
      "category": "marketing",
      "percentage": 0.20,
      "description": "Redução de 20% em marketing"
    },
    {
      "type": "one_time_expense",
      "amount": 50000.00,
      "date": "2025-02-01",
      "description": "Investimento em equipamento"
    }
  ]
}
```

**Resposta:**
```json
{
  "simulation_id": "SIM-2025-001",
  "base_scenario": {
    "final_balance": 155000.00,
    "total_revenue": 300000.00,
    "total_expenses": 190000.00
  },
  "simulated_scenario": {
    "final_balance": 175500.00,
    "total_revenue": 345000.00,
    "total_expenses": 214500.00
  },
  "comparison": {
    "balance_difference": 20500.00,
    "balance_difference_percentage": 13.2,
    "revenue_impact": 45000.00,
    "expense_impact": 24500.00
  },
  "impact_by_adjustment": [
    {
      "description": "Aumento de 15% em vendas",
      "revenue_impact": 45000.00,
      "balance_impact": 45000.00
    },
    {
      "description": "Redução de 20% em marketing",
      "expense_reduction": 8000.00,
      "balance_impact": 8000.00
    },
    {
      "description": "Investimento em equipamento",
      "expense_increase": 50000.00,
      "balance_impact": -50000.00
    }
  ],
  "monthly_comparison": [
    {
      "month": "2025-02",
      "base_balance": 125000.00,
      "simulated_balance": 140000.00,
      "difference": 15000.00
    }
  ]
}
```

---

#### GET `/cash-flow/alerts` - Alertas e Recomendações Inteligentes
Sistema de alertas baseado em IA com recomendações acionáveis.

**Resposta:**
```json
{
  "alerts": [
    {
      "id": "alert-001",
      "type": "low_balance",
      "severity": "high",
      "title": "Saldo abaixo do mínimo recomendado",
      "description": "Saldo atual de R$ 45.000 está 35% abaixo do saldo mínimo recomendado de R$ 70.000",
      "impact": "high",
      "created_at": "2025-01-15T08:00:00"
    },
    {
      "id": "alert-002",
      "type": "negative_cash_flow",
      "severity": "medium",
      "title": "Fluxo de caixa negativo nos últimos 7 dias",
      "description": "Saídas superaram entradas em R$ 15.000 na última semana",
      "impact": "medium",
      "created_at": "2025-01-15T08:00:00"
    }
  ],
  "recommendations": [
    {
      "id": "rec-001",
      "priority": "high",
      "category": "receivables",
      "title": "Acelerar recebimentos",
      "description": "Você tem R$ 35.000 em contas vencidas há mais de 30 dias",
      "action": "Priorize a cobrança de 5 clientes com maior valor em atraso",
      "expected_impact": {
        "cash_flow_improvement": 35000.00,
        "impact_days": 7
      },
      "related_data": {
        "overdue_count": 5,
        "total_overdue": 35000.00
      }
    },
    {
      "id": "rec-002",
      "priority": "medium",
      "category": "expenses",
      "title": "Otimizar despesas recorrentes",
      "description": "Despesas com 'services' aumentaram 25% nos últimos 30 dias",
      "action": "Revisar contratos de serviços e negociar melhores condições",
      "expected_impact": {
        "monthly_savings": 5000.00
      }
    },
    {
      "id": "rec-003",
      "priority": "medium",
      "category": "planning",
      "title": "Runway crítico",
      "description": "No ritmo atual de gastos, seu caixa zerará em 4.5 meses",
      "action": "Elabore plano de ação para aumentar receitas ou reduzir custos em 20%",
      "expected_impact": {
        "runway_extension_months": 3.0
      }
    }
  ],
  "summary": {
    "total_alerts": 2,
    "critical_alerts": 1,
    "total_recommendations": 3,
    "potential_cash_improvement": 40000.00
  }
}
```

**Tipos de Alertas:**
- `low_balance`: Saldo baixo
- `negative_cash_flow`: Fluxo negativo
- `high_burn_rate`: Taxa de queima alta
- `approaching_zero`: Caixa próximo de zerar
- `unusual_expense`: Despesa anormal

**Categorias de Recomendações:**
- `receivables`: Contas a receber
- `payables`: Contas a pagar
- `expenses`: Despesas
- `revenue`: Receitas
- `planning`: Planejamento

---

## 5. Integrações e Marketplace

### 5.1 Shopify (`/integrations/shopify`)

#### POST `/integrations/shopify/config` - Configurar Shopify
Configura integração com Shopify.

**Requisição:**
```json
{
  "store_url": "minha-loja.myshopify.com",
  "api_key": "shpat_xxxxxxxxxxxxx",
  "api_secret": "shpss_xxxxxxxxxxxxx"
}
```

**Resposta:**
```json
{
  "message": "Shopify configured successfully",
  "store_url": "minha-loja.myshopify.com",
  "is_active": true
}
```

**Notas:**
- API keys são criptografadas antes de armazenar
- Requer credenciais de aplicativo privado Shopify

---

#### POST `/integrations/shopify/test-connection` - Testar Conexão
Testa se credenciais estão válidas.

**Resposta:**
```json
{
  "status": "success",
  "message": "Connection successful",
  "store_name": "Minha Loja",
  "plan": "Basic"
}
```

---

#### POST `/integrations/shopify/sync-orders` - Sincronizar Pedidos
Sincroniza pedidos do Shopify.

**Requisição:**
```json
{
  "start_date": "2025-01-01",
  "end_date": "2025-01-15",
  "status_filter": "any"
}
```

**Resposta:**
```json
{
  "sync_job_id": "SYNC-SHOPIFY-001",
  "status": "processing",
  "orders_found": 45,
  "orders_imported": 42,
  "orders_failed": 3,
  "started_at": "2025-01-15T10:00:00",
  "completed_at": "2025-01-15T10:05:00"
}
```

---

### 5.2 Mercado Livre (`/integrations/mercadolivre`)

#### GET `/integrations/mercadolivre/auth-url` - Obter URL de Autorização
Inicia fluxo OAuth do Mercado Livre.

**Resposta:**
```json
{
  "auth_url": "https://auth.mercadolivre.com.br/authorization?response_type=code&client_id=xxxxx&redirect_uri=...",
  "state": "random_state_token"
}
```

**Fluxo:**
1. Frontend redireciona usuário para `auth_url`
2. Usuário autoriza no Mercado Livre
3. ML redireciona para callback com `code`
4. Chamar `/callback` com o código

---

#### POST `/integrations/mercadolivre/callback` - Processar Callback OAuth
Processa callback do Mercado Livre e obtém tokens.

**Requisição:**
```json
{
  "code": "TG-xxxxxxxxxxxxx",
  "state": "random_state_token"
}
```

**Resposta:**
```json
{
  "message": "Mercado Livre connected successfully",
  "user_id": 123456789,
  "nickname": "MEUVENDEDOR",
  "is_active": true
}
```

**Efeitos:**
- Troca código por access_token e refresh_token
- Armazena tokens criptografados no workspace
- Tokens são renovados automaticamente

---

#### POST `/integrations/mercadolivre/sync-orders` - Sincronizar Pedidos ML
Sincroniza pedidos do Mercado Livre.

**Requisição:**
```json
{
  "start_date": "2025-01-01",
  "end_date": "2025-01-15",
  "limit": 100
}
```

**Resposta:** Similar ao Shopify sync

---

### 5.3 TikTok Shop (`/integrations/tiktokshop`)

#### GET `/integrations/tiktokshop/auth-url` - Obter URL de Autorização
Inicia fluxo OAuth do TikTok Shop.

**Query Parameters:**
- `shop_id`: ID da loja no TikTok

**Resposta:**
```json
{
  "auth_url": "https://services.tiktokshop.com/open/authorize?service_id=xxxxx...",
  "state": "random_state_token"
}
```

---

#### POST `/integrations/tiktokshop/callback` - Processar Callback OAuth
Processa callback do TikTok Shop.

**Requisição:**
```json
{
  "code": "xxxxxxxxxxxxx",
  "shop_id": "7234567890"
}
```

**Resposta:**
```json
{
  "message": "TikTok Shop connected successfully",
  "shop_id": "7234567890",
  "shop_name": "Minha Loja TikTok",
  "is_active": true
}
```

---

### 5.4 WooCommerce (`/integrations/woocommerce`)

#### POST `/integrations/woocommerce/config` - Configurar WooCommerce
Configura integração com WooCommerce.

**Requisição:**
```json
{
  "store_url": "https://meusite.com.br",
  "consumer_key": "ck_xxxxxxxxxxxxx",
  "consumer_secret": "cs_xxxxxxxxxxxxx"
}
```

**Notas:**
- Suporta API REST do WooCommerce v3+
- Requer chaves geradas em WooCommerce > Configurações > Avançado > API REST

---

### 5.5 Magalu (`/integrations/magalu`)

#### POST `/integrations/magalu/config` - Configurar Magazine Luiza
Configura integração com Magalu Marketplace.

**Requisição:**
```json
{
  "seller_id": "123456",
  "api_key": "magalu_key_xxxxx"
}
```

---

### 5.6 Marketplace Unificado (`/marketplace`)

#### GET `/marketplace/integrations` - Listar Integrações
Lista todas as integrações de marketplace configuradas.

**Resposta:**
```json
[
  {
    "id": 1,
    "workspace_id": 5,
    "platform": "shopify",
    "platform_name": "Shopify",
    "store_identifier": "minha-loja.myshopify.com",
    "is_active": true,
    "last_sync": "2025-01-15T09:00:00",
    "sync_status": "success",
    "orders_synced": 1250,
    "created_at": "2025-01-01T00:00:00"
  },
  {
    "id": 2,
    "workspace_id": 5,
    "platform": "mercadolivre",
    "platform_name": "Mercado Livre",
    "store_identifier": "MEUVENDEDOR",
    "is_active": true,
    "last_sync": "2025-01-15T08:30:00",
    "sync_status": "success",
    "orders_synced": 890
  }
]
```

---

#### POST `/marketplace/integrations/{integration_id}/sync` - Forçar Sincronização
Dispara sincronização manual.

**Resposta:**
```json
{
  "sync_job_id": "SYNC-2025-001",
  "status": "queued",
  "message": "Sync job started"
}
```

---

#### GET `/marketplace/orders` - Listar Pedidos Unificados
Lista pedidos de todos os marketplaces.

**Query Parameters:**
- `marketplace_integration_id`: Filtrar por integração
- `status`: pending/processing/shipped/delivered/cancelled
- `limit`: Limite (default: 100)

**Resposta:**
```json
[
  {
    "id": 567,
    "marketplace_integration_id": 1,
    "platform": "shopify",
    "external_order_id": "SHOP-12345",
    "customer_name": "João Silva",
    "customer_email": "joao@email.com",
    "total_value": 450.00,
    "status": "processing",
    "payment_status": "paid",
    "items": [
      {
        "product_listing_id": 123,
        "internal_product_id": 456,
        "quantity": 5,
        "unit_price": 89.90
      }
    ],
    "shipping_address": {
      "street": "Rua Exemplo, 123",
      "city": "São Paulo",
      "state": "SP",
      "zip_code": "01234-567"
    },
    "created_at": "2025-01-15T10:00:00",
    "synced_at": "2025-01-15T10:05:00"
  }
]
```

---

#### GET `/marketplace/dashboard` - Dashboard Marketplace
Visão geral de todos os marketplaces.

**Resposta:**
```json
{
  "total_integrations": 3,
  "active_integrations": 3,
  "total_orders": 2500,
  "total_revenue": 1250000.00,
  "pending_orders": 45,
  "processing_orders": 120,
  "by_platform": [
    {
      "platform": "shopify",
      "orders": 1250,
      "revenue": 625000.00,
      "avg_ticket": 500.00
    },
    {
      "platform": "mercadolivre",
      "orders": 890,
      "revenue": 445000.00,
      "avg_ticket": 500.00
    }
  ],
  "recent_sync_jobs": [
    {
      "platform": "shopify",
      "status": "success",
      "orders_synced": 12,
      "completed_at": "2025-01-15T09:00:00"
    }
  ]
}
```

---

#### GET `/marketplace/conflicts` - Listar Conflitos
Lista conflitos de sincronização que requerem resolução manual.

**Query Parameters:**
- `resolved`: true/false (default: false)

**Resposta:**
```json
[
  {
    "id": 23,
    "marketplace_integration_id": 1,
    "conflict_type": "product_mismatch",
    "description": "Produto SKU-123 existe no marketplace mas não no ERP",
    "external_data": {
      "sku": "SKU-123",
      "name": "Produto Exemplo",
      "price": 89.90
    },
    "suggested_resolution": "create_product",
    "resolved": false,
    "created_at": "2025-01-15T10:00:00"
  }
]
```

**Tipos de Conflito:**
- `product_mismatch`: Produto existe em um lado mas não no outro
- `stock_discrepancy`: Estoque divergente entre marketplace e ERP
- `price_mismatch`: Preço diferente
- `order_duplicate`: Pedido duplicado

---

#### PUT `/marketplace/conflicts/{conflict_id}/resolve` - Resolver Conflito
Resolve conflito com estratégia escolhida.

**Requisição:**
```json
{
  "strategy": "use_marketplace",
  "notes": "Criar produto no ERP com dados do marketplace"
}
```

**Estratégias:**
- `use_marketplace`: Usar dados do marketplace
- `use_erp`: Usar dados do ERP
- `manual`: Resolução manual (especificar em notes)

---

## 6. Logística e Operações

### 6.1 Logística (`/logistics`)

#### GET `/logistics/picking-lists` - Listar Listas de Separação
Lista listas de picking para separação de pedidos.

**Query Parameters:**
- `status`: pending/in_progress/completed

**Resposta:**
```json
[
  {
    "id": 45,
    "list_number": "PICK-2025-0045",
    "warehouse_id": 1,
    "warehouse_name": "Armazém Principal",
    "status": "pending",
    "total_items": 25,
    "picked_items": 0,
    "orders": [567, 568, 569],
    "assigned_to": 10,
    "assigned_to_name": "Carlos Separador",
    "priority": "high",
    "created_at": "2025-01-15T08:00:00"
  }
]
```

---

#### POST `/logistics/picking-lists/{list_id}/start` - Iniciar Separação
Inicia processo de separação.

**Resposta:**
```json
{
  "message": "Picking started",
  "status": "in_progress",
  "started_at": "2025-01-15T09:00:00"
}
```

---

#### POST `/logistics/picking-lists/{list_id}/complete` - Concluir Separação
Finaliza separação de pedidos.

**Resposta:**
```json
{
  "message": "Picking completed",
  "status": "completed",
  "completed_at": "2025-01-15T11:30:00",
  "packing_jobs_created": 3
}
```

**Efeitos:**
- Cria jobs de embalagem automaticamente
- Reserva estoque para os pedidos

---

#### GET `/logistics/packing-jobs` - Listar Jobs de Embalagem
Lista jobs de embalagem.

**Query Parameters:**
- `status`: pending/in_progress/completed

**Resposta:**
```json
[
  {
    "id": 78,
    "job_number": "PACK-2025-0078",
    "order_id": 567,
    "order_number": "VND-2025-0567",
    "packing_station_id": 2,
    "station_name": "Estação 2",
    "status": "pending",
    "items_count": 5,
    "assigned_to": 11,
    "assigned_to_name": "Maria Embaladora",
    "created_at": "2025-01-15T11:30:00"
  }
]
```

---

#### POST `/logistics/packing-jobs/{job_id}/complete` - Concluir Embalagem
Finaliza embalagem de pedido.

**Requisição:**
```json
{
  "box_type_id": 3,
  "weight_kg": 2.5,
  "dimensions": {
    "length_cm": 40,
    "width_cm": 30,
    "height_cm": 20
  },
  "tracking_code": "BR123456789"
}
```

**Resposta:**
```json
{
  "message": "Packing completed",
  "status": "completed",
  "completed_at": "2025-01-15T12:00:00",
  "delivery_created": true,
  "delivery_id": 123
}
```

**Efeitos:**
- Cria rota de entrega automaticamente
- Gera etiqueta de envio
- Atualiza status do pedido para "shipped"

---

#### GET `/logistics/deliveries` - Listar Entregas
Lista rotas de entrega.

**Query Parameters:**
- `status`: pending/in_transit/delivered/failed

**Resposta:**
```json
[
  {
    "id": 123,
    "delivery_number": "DELIV-2025-0123",
    "route_id": 45,
    "route_name": "Rota SP Centro",
    "order_id": 567,
    "customer_name": "João Silva",
    "delivery_address": "Rua Exemplo, 123 - São Paulo/SP",
    "status": "in_transit",
    "tracking_code": "BR123456789",
    "estimated_delivery": "2025-01-16T15:00:00",
    "driver_id": 15,
    "driver_name": "Pedro Motorista",
    "created_at": "2025-01-15T12:00:00"
  }
]
```

---

#### POST `/logistics/deliveries/{delivery_id}/complete` - Concluir Entrega
Marca entrega como concluída.

**Requisição:**
```json
{
  "delivered_at": "2025-01-16T14:30:00",
  "received_by": "João Silva",
  "notes": "Entregue com sucesso",
  "proof_of_delivery_url": "https://storage.example.com/pod-123.jpg"
}
```

---

#### POST `/logistics/deliveries/{delivery_id}/fail` - Marcar Falha na Entrega
Registra falha na entrega.

**Requisição:**
```json
{
  "reason": "Endereço não localizado",
  "notes": "Cliente não atendeu telefone",
  "reschedule_date": "2025-01-17"
}
```

---

#### GET `/logistics/dashboard` - Dashboard Logístico
KPIs de operações logísticas.

**Resposta:**
```json
{
  "picking": {
    "pending": 15,
    "in_progress": 5,
    "completed_today": 120
  },
  "packing": {
    "pending": 25,
    "in_progress": 8,
    "completed_today": 115
  },
  "deliveries": {
    "in_transit": 45,
    "pending_pickup": 10,
    "delivered_today": 98,
    "failed_today": 2
  },
  "efficiency": {
    "avg_picking_time_minutes": 15.5,
    "avg_packing_time_minutes": 8.2,
    "on_time_delivery_rate": 0.96
  }
}
```

---

## 7. Automação e Inteligência

### 7.1 Automação de Estoque (`/inventory/automation`)

#### GET `/automation/optimizations` - Otimizações de Estoque
Lista recomendações de otimização baseadas em ML.

**Query Parameters:**
- `product_id`: Filtrar por produto
- `warehouse_id`: Filtrar por armazém
- `action`: restock/transfer/reduce
- `skip`, `limit`: Paginação

**Resposta:**
```json
[
  {
    "id": 234,
    "product_id": 123,
    "product_name": "Camisa Polo Azul",
    "warehouse_id": 1,
    "action": "restock",
    "current_stock": 15,
    "recommended_quantity": 50,
    "reason": "Estoque abaixo do ponto de ressuprimento",
    "priority": "high",
    "expected_stockout_date": "2025-01-25",
    "confidence": 0.87,
    "created_at": "2025-01-15T08:00:00"
  }
]
```

**Ações:**
- `restock`: Reabastecer estoque
- `transfer`: Transferir entre armazéns
- `reduce`: Reduzir estoque (dead stock)

---

#### GET `/automation/suggestions` - Sugestões de Compra
Sugestões automáticas de compra com cálculo de quantidade ideal.

**Query Parameters:**
- `priority`: high/medium/low
- `status`: pending/approved/rejected
- `product_id`: Filtrar por produto

**Resposta:**
```json
[
  {
    "id": 456,
    "product_id": 123,
    "product_name": "Camisa Polo Azul",
    "supplier_id": 5,
    "supplier_name": "Fornecedor ABC",
    "suggested_quantity": 100,
    "estimated_cost": 3500.00,
    "reorder_point": 20,
    "safety_stock": 15,
    "lead_time_days": 7,
    "priority": "high",
    "reason": "Estoque atual (15) abaixo do ponto de ressuprimento (20)",
    "expected_stockout_date": "2025-01-25",
    "demand_forecast_30d": 45,
    "status": "pending",
    "created_at": "2025-01-15T08:00:00"
  }
]
```

**Cálculo da Quantidade:**
```
suggested_quantity = (demand_forecast * lead_time_days) + safety_stock - current_stock
```

---

#### GET `/automation/alerts` - Alertas de Estoque
Alertas automáticos de estoque (baixo, excesso, vencimento próximo).

**Query Parameters:**
- `type`: low_stock/excess_stock/expiring_soon/dead_stock
- `severity`: low/medium/high/critical
- `status`: active/resolved

**Resposta:**
```json
[
  {
    "id": 789,
    "type": "low_stock",
    "severity": "high",
    "product_id": 123,
    "product_name": "Camisa Polo Azul",
    "current_stock": 8,
    "min_stock_level": 10,
    "message": "Estoque crítico: apenas 8 unidades restantes",
    "recommendation": "Criar pedido de compra imediatamente",
    "status": "active",
    "created_at": "2025-01-15T08:00:00"
  },
  {
    "id": 790,
    "type": "expiring_soon",
    "severity": "medium",
    "product_id": 456,
    "product_name": "Produto Perecível",
    "batch_id": 789,
    "batch_code": "LOT-2024-050",
    "expiry_date": "2025-03-15",
    "days_until_expiry": 60,
    "quantity": 50,
    "message": "Lote LOT-2024-050 vence em 60 dias",
    "recommendation": "Priorizar venda ou promoção",
    "status": "active"
  }
]
```

---

#### GET `/automation/rules` - Regras de Automação
Lista regras configuradas para alertas automáticos.

**Resposta:**
```json
[
  {
    "id": 12,
    "name": "Alerta Estoque Baixo",
    "type": "low_stock_alert",
    "is_active": true,
    "conditions": {
      "trigger": "stock_below_minimum",
      "threshold_percentage": 0.80
    },
    "actions": {
      "create_alert": true,
      "send_email": true,
      "email_recipients": ["compras@empresa.com"]
    },
    "created_at": "2025-01-01T00:00:00"
  }
]
```

---

### 7.2 Business Intelligence (`/analytics`)

#### GET `/analytics/executive-dashboard` - Dashboard Executivo
Dashboard completo para alta gestão.

**Query Parameters:**
- `period_start`, `period_end`: Período (opcional, default: último mês)

**Resposta:**
```json
{
  "period": {
    "start": "2025-01-01",
    "end": "2025-01-31"
  },
  "financial": {
    "revenue": 450000.00,
    "expenses": 280000.00,
    "profit": 170000.00,
    "profit_margin": 0.378,
    "revenue_growth": 0.15,
    "ebitda": 195000.00
  },
  "sales": {
    "total_orders": 1250,
    "average_ticket": 360.00,
    "conversion_rate": 0.042,
    "top_products": [
      {
        "product_name": "Camisa Polo Azul",
        "units_sold": 450,
        "revenue": 40455.00
      }
    ]
  },
  "inventory": {
    "total_value": 125000.00,
    "turnover_rate": 4.2,
    "products_below_minimum": 15,
    "dead_stock_value": 8500.00
  },
  "cash_flow": {
    "current_balance": 155000.00,
    "net_flow": 110000.00,
    "burn_rate": 58000.00,
    "runway_months": 8.5
  },
  "operations": {
    "orders_fulfilled": 1200,
    "fulfillment_rate": 0.96,
    "avg_fulfillment_time_hours": 18.5,
    "on_time_delivery_rate": 0.94
  }
}
```

---

#### GET `/analytics/kpis` - Todos os KPIs
Lista todos os indicadores chave.

**Query Parameters:**
- `period_start`, `period_end`: Período

**Resposta:**
```json
[
  {
    "category": "financial",
    "kpi": "revenue",
    "value": 450000.00,
    "unit": "BRL",
    "trend": "up",
    "change_percentage": 15.2,
    "previous_period_value": 390625.00
  },
  {
    "category": "inventory",
    "kpi": "stock_turnover",
    "value": 4.2,
    "unit": "turns_per_year",
    "trend": "up",
    "change_percentage": 5.0
  }
]
```

---

## 8. Relatórios

### 8.1 Relatórios Executivos (`/reports`)

#### GET `/reports/executive-dashboard/kpis` - KPIs Dashboard Executivo
KPIs do dashboard executivo (receita, lucro, margens).

**Query Parameters:**
- `period_start`, `period_end`: Período

**Resposta:**
```json
{
  "period": {
    "start": "2025-01-01",
    "end": "2025-01-31"
  },
  "revenue": {
    "total": 450000.00,
    "growth": 0.15,
    "previous_period": 390625.00
  },
  "expenses": {
    "total": 280000.00,
    "growth": 0.08,
    "previous_period": 259259.26
  },
  "profit": {
    "total": 170000.00,
    "margin": 0.378,
    "growth": 0.29
  },
  "gross_margin": 0.42,
  "ebitda": 195000.00,
  "ebitda_margin": 0.433
}
```

---

#### GET `/reports/executive-dashboard/charts` - Gráficos Dashboard
Dados para gráficos do dashboard executivo.

**Query Parameters:**
- `period_start`, `period_end`: Período

**Resposta:**
```json
{
  "revenue_vs_expense": {
    "labels": ["Jan", "Fev", "Mar"],
    "revenue": [150000, 175000, 125000],
    "expense": [95000, 100000, 85000],
    "profit": [55000, 75000, 40000]
  },
  "cash_flow": {
    "labels": ["Semana 1", "Semana 2", "Semana 3", "Semana 4"],
    "data": [35000, -15000, 45000, 20000]
  },
  "revenue_by_channel": [
    {
      "channel": "Online",
      "value": 280000,
      "percentage": 62.2
    },
    {
      "channel": "Marketplace",
      "value": 120000,
      "percentage": 26.7
    },
    {
      "channel": "Direto",
      "value": 50000,
      "percentage": 11.1
    }
  ]
}
```

---

#### GET `/reports/executive-dashboard/insights` - Insights Executivos
Análises comparativas e insights.

**Resposta:**
```json
{
  "comparative_analysis": {
    "vs_previous_month": {
      "revenue_change": 0.15,
      "profit_change": 0.29,
      "orders_change": 0.12
    },
    "vs_same_month_last_year": {
      "revenue_change": 0.42,
      "profit_change": 0.55
    }
  },
  "insights": [
    {
      "type": "positive",
      "title": "Forte crescimento de receita",
      "description": "Receita cresceu 15% vs mês anterior, impulsionada por canal online (+23%)"
    },
    {
      "type": "warning",
      "title": "Estoque crítico",
      "description": "15 produtos abaixo do nível mínimo, risco de ruptura em produtos de alta demanda"
    }
  ]
}
```

---

## 9. Fiscal

### 9.1 Nota Fiscal Eletrônica (`/fiscal`)

#### POST `/fiscal/sales/{sale_id}/issue-nfe` - Emitir NF-e
Emite Nota Fiscal Eletrônica para uma venda.

**Resposta:**
```json
{
  "message": "NF-e issued successfully",
  "nfe_number": "123456",
  "nfe_series": "1",
  "nfe_access_key": "35250112345678000190550010001234561234567890",
  "authorization_protocol": "135250000123456",
  "authorization_date": "2025-01-15T14:30:00",
  "xml_url": "https://storage.example.com/nfe/123456.xml",
  "pdf_url": "https://storage.example.com/nfe/123456.pdf"
}
```

**Notas:**
- Requer configuração fiscal completa no workspace
- Valida CFOP, NCM, alíquotas de impostos
- Integra com SEFAZ via provedor autorizado
- Armazena XML assinado

---

#### POST `/fiscal/sales/{sale_id}/cancel-nfe` - Cancelar NF-e
Cancela NF-e emitida (janela de 24 horas).

**Requisição:**
```json
{
  "reason": "Erro no valor da mercadoria"
}
```

**Resposta:**
```json
{
  "message": "NF-e cancelled successfully",
  "cancellation_protocol": "135250000987654",
  "cancellation_date": "2025-01-15T16:00:00"
}
```

**Validações:**
- Apenas dentro de 24 horas após emissão
- Motivo obrigatório (mínimo 15 caracteres)

---

#### GET `/fiscal/sales/{sale_id}/nfe-status` - Status da NF-e
Consulta status da NF-e no SEFAZ.

**Resposta:**
```json
{
  "nfe_number": "123456",
  "status": "authorized",
  "authorization_date": "2025-01-15T14:30:00",
  "can_cancel": true,
  "cancellation_deadline": "2025-01-16T14:30:00"
}
```

**Status possíveis:**
- `pending`: Aguardando emissão
- `processing`: Em processamento no SEFAZ
- `authorized`: Autorizada
- `rejected`: Rejeitada
- `cancelled`: Cancelada

---

#### POST `/fiscal/workspaces/config/fiscal` - Configurar Dados Fiscais
Atualiza configuração fiscal do workspace.

**Requisição:**
```json
{
  "cnpj": "12345678000190",
  "razao_social": "Empresa LTDA",
  "nome_fantasia": "Loja Exemplo",
  "inscricao_estadual": "123456789",
  "regime_tributario": 1,
  "endereco": {
    "logradouro": "Rua Exemplo",
    "numero": "123",
    "complemento": "Sala 4",
    "bairro": "Centro",
    "cidade": "São Paulo",
    "uf": "SP",
    "cep": "01234567"
  },
  "certificado_a1_base64": "MIIKs...",
  "certificado_senha": "senha123",
  "ambiente_nfe": "producao"
}
```

**Regime Tributário:**
- `1`: Simples Nacional
- `2`: Simples Nacional - Excesso
- `3`: Regime Normal

**Ambiente:**
- `homologacao`: Testes
- `producao`: Produção

---

## 10. Administração

### 10.1 Super Admin (`/super-admin`)

**Nota:** Todos os endpoints requerem role `super_admin`.

#### GET `/super-admin/stats` - Estatísticas do Sistema
Estatísticas globais do sistema (multi-tenant).

**Resposta:**
```json
{
  "total_workspaces": 150,
  "active_workspaces": 142,
  "total_users": 1250,
  "total_products": 45000,
  "total_sales": 125000,
  "total_revenue": 25000000.00,
  "system_health": "healthy",
  "database_size_mb": 2048,
  "storage_used_gb": 15.5
}
```

---

#### GET `/super-admin/workspaces` - Listar Todos os Workspaces
Lista todos os workspaces do sistema.

**Query Parameters:**
- `skip`, `limit`: Paginação

**Resposta:**
```json
[
  {
    "id": 5,
    "company_name": "Empresa ABC LTDA",
    "cnpj": "12345678000190",
    "created_at": "2025-01-01T00:00:00",
    "is_active": true,
    "users_count": 15,
    "products_count": 250,
    "sales_count": 1250,
    "last_activity": "2025-01-15T14:30:00"
  }
]
```

---

#### POST `/super-admin/workspaces` - Criar Workspace (Admin)
Cria workspace manualmente.

**Requisição:**
```json
{
  "company_name": "Nova Empresa LTDA",
  "cnpj": "98765432000100",
  "razao_social": "Nova Empresa LTDA",
  "plan": "professional",
  "is_active": true
}
```

---

#### DELETE `/super-admin/workspaces/{workspace_id}` - Deletar Workspace
Remove workspace e todos os dados associados.

**Resposta:** 204 No Content

**Atenção:**
- Operação DESTRUTIVA
- Remove todos os usuários, produtos, vendas, etc.
- Usa cascade delete para garantir integridade

---

### 10.2 Notificações (`/notifications`)

#### GET `/notifications/` - Listar Notificações
Lista notificações do usuário atual.

**Query Parameters:**
- `skip`, `limit`: Paginação
- `unread_only`: Apenas não lidas (boolean)
- `type`: system/alert/info/success/warning/error
- `priority`: low/medium/high/urgent

**Resposta:**
```json
[
  {
    "id": 123,
    "user_id": 1,
    "type": "alert",
    "priority": "high",
    "title": "Estoque crítico",
    "message": "Produto 'Camisa Polo Azul' está com estoque baixo (8 unidades)",
    "link": "/admin/produtos/123",
    "read": false,
    "created_at": "2025-01-15T08:00:00"
  },
  {
    "id": 124,
    "user_id": 1,
    "type": "success",
    "priority": "low",
    "title": "NF-e emitida",
    "message": "NF-e 123456 emitida com sucesso para venda VND-2025-0567",
    "link": "/admin/vendas/567",
    "read": true,
    "created_at": "2025-01-15T10:30:00"
  }
]
```

---

#### GET `/notifications/stats` - Estatísticas de Notificações
Contador de notificações por status.

**Resposta:**
```json
{
  "total": 45,
  "unread": 12,
  "by_type": {
    "alert": 5,
    "info": 20,
    "success": 15,
    "warning": 3,
    "error": 2
  },
  "by_priority": {
    "low": 25,
    "medium": 15,
    "high": 4,
    "urgent": 1
  }
}
```

---

#### PUT `/notifications/{notification_id}` - Marcar como Lida
Atualiza notificação para lida.

**Requisição:**
```json
{
  "read": true
}
```

**Resposta:** Notificação atualizada

---

#### POST `/notifications/mark-all-read` - Marcar Todas como Lidas
Marca todas as notificações como lidas.

**Resposta:**
```json
{
  "message": "All notifications marked as read",
  "count": 12
}
```

---

#### DELETE `/notifications/` - Deletar Todas Lidas
Remove todas as notificações já lidas.

**Resposta:**
```json
{
  "message": "Read notifications deleted",
  "count": 33
}
```

---

## Padrões Gerais

### Autenticação

**Header:**
```
Authorization: Bearer {access_token}
```

**Token Expiração:**
- Access Token: 30 minutos
- Refresh Token: 7 dias

**Renovação:**
```http
POST /auth/token
Content-Type: application/json

{
  "grant_type": "refresh_token",
  "refresh_token": "eyJhbGciOiJIUz..."
}
```

---

### Multi-tenancy

Todos os endpoints autenticados automaticamente:
1. Extraem `workspace_id` do JWT
2. Filtram dados por `workspace_id`
3. Previnem acesso a dados de outros workspaces

**Exceções:**
- Endpoints `/super-admin/*` (veem todos os workspaces)
- Endpoint `/auth/token` (público)
- Endpoint `/users/` POST (registro)

---

### Paginação

**Padrão:**
- `skip`: Offset (padrão: 0)
- `limit`: Limite (padrão: 100, máx: 1000)

**Exemplo:**
```
GET /products/?skip=0&limit=50
```

**Resposta:** Array de objetos (sem metadata de paginação)

---

### Filtros de Data

**Formato:** ISO 8601 (`YYYY-MM-DD`)

**Exemplo:**
```
GET /sales/?start_date=2025-01-01&end_date=2025-01-31
```

---

### Ordenação

Padrão por `created_at DESC` ou relevância dependendo do endpoint.

---

### Tratamento de Erros

**Formato:**
```json
{
  "detail": "Error message",
  "error_code": "VALIDATION_ERROR",
  "fields": {
    "email": ["Invalid email format"]
  }
}
```

**Códigos HTTP:**
- `200`: Sucesso
- `201`: Criado
- `204`: Sem conteúdo (delete bem-sucedido)
- `400`: Bad Request (validação)
- `401`: Unauthorized (não autenticado)
- `403`: Forbidden (sem permissão)
- `404`: Not Found
- `409`: Conflict (violação de constraint)
- `422`: Unprocessable Entity (validação Pydantic)
- `500`: Internal Server Error

---

### Validação

Todos os endpoints usam Pydantic para validação de schemas:
- Tipos obrigatórios vs opcionais
- Formatos (email, CPF/CNPJ, datas)
- Ranges numéricos
- Tamanhos de string

**Exemplo de erro de validação:**
```json
{
  "detail": [
    {
      "loc": ["body", "email"],
      "msg": "value is not a valid email address",
      "type": "value_error.email"
    },
    {
      "loc": ["body", "amount"],
      "msg": "ensure this value is greater than 0",
      "type": "value_error.number.not_gt"
    }
  ]
}
```

---

## Segurança

### HTTPS Only
- Middleware força redirecionamento HTTP → HTTPS
- Cookies com flag `Secure`
- HSTS headers

### Criptografia
- Senhas: bcrypt
- API keys sensíveis: cryptography (Fernet)
- JWT: HS256

### CORS
- Configurado em `config.py`
- Whitelist de origens permitidas

### Rate Limiting
(Não implementado ainda - considerar para produção)

---

## Documentação Interativa

**Swagger UI:**
```
http://localhost:8000/docs
```

**ReDoc:**
```
http://localhost:8000/redoc
```

---

## Considerações Finais

Esta documentação reflete os endpoints **realmente implementados** no Orion ERP. Para detalhes de implementação, consulte o código-fonte em `backend/app/api/api_v1/endpoints/`.

**Próximos passos sugeridos:**
- Implementar rate limiting
- Adicionar versionamento de API (v2, v3)
- Implementar webhooks para eventos
- Expandir analytics com mais modelos ML
- Adicionar suporte a GraphQL

---

**Versão da API:** 2.0.0
**Última atualização:** 2025-01-15
