# Modelos de Banco de Dados - Orion ERP

> Documentação completa de todos os modelos SQLAlchemy do sistema

**Última atualização:** 04/11/2025
**Versão:** 2.0.0

---

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Core (Sistema Base)](#core-sistema-base)
3. [Financeiro](#financeiro)
4. [Estoque e Inventário](#estoque-e-inventário)
5. [Vendas e CRM](#vendas-e-crm)
6. [Logística e Expedição](#logística-e-expedição)
7. [Marketplace e Integrações](#marketplace-e-integrações)
8. [Relatórios e Analytics](#relatórios-e-analytics)
9. [Notificações](#notificações)
10. [Diagrama de Relacionamentos](#diagrama-de-relacionamentos)

---

## 🎯 Visão Geral

O Orion ERP possui **52 modelos SQLAlchemy** organizados em 8 categorias principais. Todos os modelos implementam **multi-tenancy** através do campo `workspace_id`, garantindo isolamento completo de dados entre empresas.

### Estatísticas

| Categoria | Modelos | Descrição |
|-----------|---------|-----------|
| **Core** | 2 | Workspace e User (base do sistema) |
| **Financeiro** | 10 | Contas a pagar/receber, fluxo de caixa, fornecedores |
| **Estoque** | 13 | Produtos, lotes, depósitos, inventário, automação |
| **Vendas/CRM** | 5 | Vendas, clientes, pipeline, oportunidades |
| **Logística** | 7 | Picking, packing, entregas, veículos |
| **Marketplace** | 5 | Integrações, anúncios, pedidos, sincronização |
| **Analytics** | 9 | KPIs, relatórios, dashboards, recomendações |
| **Notificações** | 1 | Sistema de notificações em tempo real |
| **TOTAL** | **52** | |

### Convenções

**Nomenclatura:**
- Tabelas: `snake_case` (ex: `accounts_payable_invoices`)
- Colunas: `snake_case` (ex: `workspace_id`, `created_at`)
- Enums: `CamelCase` (ex: `PaymentMethod`, `InvoiceStatus`)

**Padrões Comuns:**
- `id`: Integer, Primary Key (em todos os modelos)
- `workspace_id`: Integer, Foreign Key para `workspaces.id` (multi-tenancy)
- `created_at`: DateTime (timestamp de criação)
- `updated_at`: DateTime (timestamp de última atualização)
- `created_by` / `updated_by`: Integer, Foreign Key para `users.id`

---

## 🏢 Core (Sistema Base)

### 1. Workspace

**Arquivo:** `backend/app/models/workspace.py`
**Tabela:** `workspaces`

**Descrição:** Modelo central para multi-tenancy. Cada workspace representa uma empresa/organização isolada com seus próprios dados fiscais e integrações.

**Campos Principais:**

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | Integer (PK) | Identificador único |
| `name` | String | Nome da empresa |
| `slug` | String (UNIQUE) | Slug único para URLs |
| `active` | Boolean | Se workspace está ativo |
| `cnpj` | String(14) | CNPJ da empresa |
| `razao_social` | String(255) | Razão social |
| `nome_fantasia` | String(255) | Nome fantasia |
| `regime_tributario` | Integer | 1=Simples, 2=SN-Excesso, 3=Normal |

**Dados Fiscais:**
- Endereço fiscal completo (CEP, logradouro, número, etc.)
- Configurações de NF-e (série, numeração, ambiente)
- Certificado digital (status, validade)
- Credenciais de parceiros fiscais (PlugNotas, FocusNFe) - **CRIPTOGRAFADAS**

**Integrações E-commerce:**
- **Shopify**: `integration_shopify_store_url`, `integration_shopify_api_key`
- **Mercado Livre**: tokens OAuth, user_id, última sincronização
- **WooCommerce**: URL, consumer key/secret
- **Magazine Luiza**: seller_id, API key
- **TikTok Shop**: tokens OAuth, shop_id

**Relacionamentos:**
- `users` (One-to-Many) → Usuários do workspace
- `products`, `sales`, `invoices`, etc. → Todos os dados da empresa

**Constraints:**
- `slug` é UNIQUE (garante URLs únicas)
- CASCADE DELETE em todos os relacionamentos (deletar workspace = deletar todos os dados)

---

### 2. User

**Arquivo:** `backend/app/models/user.py`
**Tabela:** `users`

**Descrição:** Usuários do sistema. Cada usuário pertence a um workspace e possui um papel (role).

**Campos Principais:**

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | Integer (PK) | Identificador único |
| `workspace_id` | Integer (FK) | Workspace do usuário |
| `email` | String (UNIQUE) | Email de login |
| `hashed_password` | String | Senha hasheada (bcrypt) |
| `full_name` | String | Nome completo |
| `role` | String | `user`, `admin`, `super_admin` |
| `active` | Boolean | Se usuário está ativo |

**Roles:**
- `super_admin`: Acesso total ao sistema, gerencia workspaces
- `admin`: Administrador do workspace
- `user`: Usuário comum

**Relacionamentos:**
- `workspace` (Many-to-One) → Workspace do usuário
- `notifications` (One-to-Many) → Notificações do usuário

**Constraints:**
- `email` é UNIQUE globalmente
- INDEX em `workspace_id` e `email`

---

## 💰 Financeiro

### 3. BankAccount

**Arquivo:** `backend/app/models/cash_flow.py`
**Tabela:** `bank_accounts`

**Descrição:** Conta bancária ou caixa da empresa.

**Campos Principais:**

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | Integer (PK) | ID |
| `workspace_id` | Integer (FK) | Workspace |
| `bank_name` | String(100) | Nome do banco |
| `account_type` | String(50) | corrente, poupanca, investimento, caixa |
| `account_number` | String(50) | Número da conta |
| `current_balance` | Float | Saldo atual |
| `initial_balance` | Float | Saldo inicial |
| `is_active` | Boolean | Se está ativa |

**Relacionamentos:**
- `transactions` (One-to-Many) → Movimentações da conta

**Constraints:**
- `CheckConstraint`: `current_balance >= 0 OR account_type = 'caixa'`

---

### 4. CashFlowTransaction

**Arquivo:** `backend/app/models/cash_flow.py`
**Tabela:** `cash_flow_transactions`

**Descrição:** Movimentação de fluxo de caixa (entrada ou saída).

**Campos Principais:**

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `transaction_date` | DateTime (INDEX) | Data da transação |
| `type` | Enum | `entrada` ou `saida` |
| `category` | String(100) (INDEX) | Categoria |
| `value` | Float | Valor (sempre positivo) |
| `account_id` | Integer (FK) | Conta bancária |
| `reference_type` | String(50) | invoice, sale, expense, etc. |
| `reference_id` | Integer | ID da referência |
| `is_recurring` | Boolean | Se é recorrente |
| `recurrence_rule` | JSON | Regra de recorrência |

**Propriedade Computada:**
- `net_value`: Retorna valor positivo (entrada) ou negativo (saída)

**Relacionamentos:**
- `account` (Many-to-One) → Conta bancária
- `parent_transaction` (Self-referencing) → Para transações recorrentes

---

### 5. AccountsReceivable

**Arquivo:** `backend/app/models/accounts_receivable.py`
**Tabela:** `accounts_receivable`

**Descrição:** Contas a receber de clientes.

**Campos Principais:**

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `document_number` | String(100) (INDEX) | Número do documento |
| `customer_name` | String(255) | Nome do cliente |
| `customer_document` | String(20) | CPF/CNPJ |
| `issue_date` | Date | Data de emissão |
| `due_date` | Date (INDEX) | Data de vencimento |
| `payment_date` | Date | Data de pagamento |
| `value` | Float | Valor total |
| `paid_value` | Float | Valor já pago |
| `status` | Enum (INDEX) | pendente, parcial, recebido, vencido, cancelado |
| `risk_category` | Enum (INDEX) | excelente, bom, regular, ruim, critico |
| `payment_method` | String(50) | boleto, pix, transferencia, etc. |
| `sale_id` | Integer (FK) | Venda relacionada |

**Propriedades Computadas:**
- `remaining_value`: Valor restante a receber
- `is_overdue`: Se está vencida
- `is_fully_paid`: Se foi totalmente paga

**Relacionamentos:**
- `sale` (Many-to-One) → Venda que originou o recebível

---

### 6. AccountsPayableInvoice

**Arquivo:** `backend/app/models/accounts_payable.py`
**Tabela:** `accounts_payable_invoices`

**Descrição:** Fatura a pagar para fornecedor.

**Campos Principais:**

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `supplier_id` | Integer (FK) | Fornecedor |
| `invoice_number` | String(100) (INDEX) | Número da NF |
| `invoice_key` | String(44) (INDEX) | Chave da NF-e |
| `invoice_date` | Date (INDEX) | Data de emissão |
| `due_date` | Date (INDEX) | Vencimento |
| `gross_value` | Float | Valor bruto |
| `discount_value` | Float | Desconto |
| `total_value` | Float | Valor total |
| `status` | Enum (INDEX) | pending, validated, approved, paid, cancelled |
| `payment_method` | Enum | bank_transfer, pix, boleto, etc. |
| `is_recurring` | Boolean | Se é recorrente |
| `category` | String(100) | Categoria de despesa |

**Relacionamentos:**
- `supplier` (Many-to-One) → Fornecedor
- `installments` (One-to-Many) → Parcelas
- `payment_history` (One-to-Many) → Histórico de pagamentos

---

### 7. Invoice

**Arquivo:** `backend/app/models/invoice_model.py`
**Tabela:** `invoices`

**Descrição:** Nota Fiscal de entrada (compra).

**Campos Principais:**

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `supplier_id` | Integer (FK) | Fornecedor |
| `invoice_number` | String (INDEX) | Número |
| `invoice_date` | Date | Data |
| `total_value` | Float | Valor total |
| `status` | String | pending, validated, paid, cancelled |
| `file_path` | String | Caminho do arquivo |

---

### 8. Supplier

**Arquivo:** `backend/app/models/supplier_model.py`
**Tabela:** `suppliers`

**Descrição:** Fornecedores.

**Campos Principais:**

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `name` | String (INDEX) | Nome |
| `document` | String | CNPJ/CPF |
| `email` | String | Email |
| `phone` | String | Telefone |
| `active` | Boolean | Ativo |

**Relacionamentos:**
- `invoices` (One-to-Many) → Notas fiscais
- `ap_invoices` (One-to-Many) → Contas a pagar

---

## 📦 Estoque e Inventário

### 9. Product

**Arquivo:** `backend/app/models/product.py`
**Tabela:** `products`

**Descrição:** Produtos do estoque.

**Campos Principais:**

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `name` | String (INDEX) | Nome do produto |
| `sku` | String (INDEX) | Código SKU |
| `category` | String (INDEX) | Categoria |
| `cost_price` | Float | Preço de custo |
| `sale_price` | Float | Preço de venda |
| `stock_quantity` | Integer | Quantidade em estoque |
| `min_stock_level` | Integer | Estoque mínimo |
| `unit` | String | Unidade (un, kg, l) |

**Dados Fiscais (obrigatórios para NF-e):**
- `ncm_code` (String(8)) - **OBRIGATÓRIO**
- `cest_code` (String(7))
- `origin` (Integer) - 0=Nacional, 1=Estrangeira
- `icms_csosn` / `icms_cst` - Tributação ICMS
- `pis_cst`, `cofins_cst` - Tributação PIS/COFINS
- Alíquotas de impostos

**Constraints:**
- UNIQUE em (`workspace_id`, `sku`)

---

### 10. ProductBatch

**Arquivo:** `backend/app/models/batch.py`
**Tabela:** `product_batches`

**Descrição:** Lote de produto com rastreabilidade.

**Campos Principais:**

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `product_id` | Integer (FK) | Produto |
| `batch_number` | String(100) (INDEX) | Número do lote |
| `manufacturing_date` | Date | Data de fabricação |
| `expiry_date` | Date (INDEX) | Validade |
| `quantity` | Integer | Quantidade |
| `status` | Enum | active, quarantine, expired, recalled |
| `warehouse_id` | Integer (FK) | Depósito |

**Relacionamentos:**
- `product` (Many-to-One)
- `movements` (One-to-Many) → Movimentações do lote

---

### 11. Warehouse

**Arquivo:** `backend/app/models/warehouse.py`
**Tabela:** `warehouses`

**Descrição:** Depósito/armazém.

**Campos Principais:**

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `name` | String(255) (INDEX) | Nome |
| `code` | String(50) (INDEX) | Código |
| `type` | Enum | principal, filial, terceirizado, consignado |
| `address` | JSON | Endereço completo |
| `is_main` | Boolean | Se é principal |
| `total_capacity` | Float | Capacidade total (m³) |
| `manager_id` | Integer (FK) | Gestor |

**Relacionamentos:**
- `areas` (One-to-Many) → Áreas do depósito
- `transfers_from`, `transfers_to` (One-to-Many) → Transferências

---

### 12. StockTransfer

**Arquivo:** `backend/app/models/warehouse.py`
**Tabela:** `stock_transfers`

**Descrição:** Transferência entre depósitos.

**Campos Principais:**

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `transfer_number` | String(100) (UNIQUE) | Número |
| `from_warehouse_id` | Integer (FK) | Origem |
| `to_warehouse_id` | Integer (FK) | Destino |
| `product_id` | Integer (FK) | Produto |
| `quantity` | Integer | Quantidade |
| `status` | Enum (INDEX) | pending, approved, in_transit, completed |

---

### 13. InventoryCycleCount

**Arquivo:** `backend/app/models/inventory.py`
**Tabela:** `inventory_cycle_counts`

**Descrição:** Contagem cíclica de inventário.

**Campos Principais:**

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `code` | String(50) (INDEX) | Código (INV-2024-001) |
| `status` | Enum (INDEX) | pending, in_progress, completed |
| `total_items` | Integer | Total de itens |
| `items_with_discrepancy` | Integer | Itens com divergência |

**Relacionamentos:**
- `count_items` (One-to-Many) → Itens contados

---

### 14. StockOptimization

**Arquivo:** `backend/app/models/automation.py`
**Tabela:** `stock_optimizations`

**Descrição:** Otimização de estoque com cálculos de ponto de pedido (EOQ).

**Campos Principais:**

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `product_id` | Integer (FK) | Produto |
| `reorder_point` | Integer | Ponto de reposição |
| `safety_stock` | Integer | Estoque de segurança |
| `optimal_order_quantity` | Integer | Quantidade ótima (EOQ) |
| `recommended_action` | Enum (INDEX) | order_now, order_soon, sufficient, excess |
| `days_until_stockout` | Integer | Dias até ruptura |

---

### 15. StockAlert

**Arquivo:** `backend/app/models/automation.py`
**Tabela:** `stock_alerts`

**Descrição:** Alertas inteligentes de estoque.

**Campos Principais:**

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `type` | Enum (INDEX) | low_stock, expiring_soon, expired, etc. |
| `severity` | Enum (INDEX) | critical, high, medium, low |
| `product_id` | Integer (FK) | Produto |
| `message` | Text | Mensagem do alerta |
| `recommended_action` | Text | Ação recomendada |
| `status` | Enum (INDEX) | active, acknowledged, resolved |

---

## 🛒 Vendas e CRM

### 16. Sale

**Arquivo:** `backend/app/models/sale.py`
**Tabela:** `sales`

**Descrição:** Venda realizada.

**Campos Principais:**

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `product_id` | Integer (FK) | Produto |
| `customer_name` | String | Nome do cliente |
| `customer_cpf_cnpj` | String(14) | CPF/CNPJ |
| `quantity` | Integer | Quantidade |
| `unit_price` | Float | Preço unitário |
| `total_value` | Float | Valor total |
| `status` | String | pending, completed, cancelled |
| `origin_channel` | String(50) | manual, shopify, mercadolivre, etc. |

**NF-e:**
- `nfe_status`: pending, processing, issued, rejected, cancelled
- `nfe_chave`: Chave de acesso da NF-e
- `nfe_numero`: Número da nota
- `nfe_xml_url`, `nfe_danfe_url`: URLs dos documentos

**Relacionamentos:**
- `receivables` (One-to-Many) → Contas a receber geradas

---

### 17. SalesPipeline

**Arquivo:** `backend/app/models/sales_pipeline.py`
**Tabela:** `sales_pipelines`

**Descrição:** Funil de vendas.

**Campos Principais:**

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `name` | String(255) | Nome do funil |
| `is_default` | Boolean | Se é padrão |
| `is_active` | Boolean | Se está ativo |

**Relacionamentos:**
- `stages` (One-to-Many) → Estágios do funil
- `opportunities` (One-to-Many) → Oportunidades

---

### 18. Opportunity

**Arquivo:** `backend/app/models/sales_pipeline.py`
**Tabela:** `opportunities`

**Descrição:** Oportunidade de venda.

**Campos Principais:**

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `pipeline_id` | Integer (FK) | Funil |
| `stage_id` | Integer (FK) | Estágio atual |
| `title` | String(255) | Título |
| `value` | Float | Valor estimado |
| `status` | Enum (INDEX) | open, won, lost |
| `priority` | Enum | low, medium, high, urgent |
| `expected_close_date` | Date | Data esperada de fechamento |

---

## 🚚 Logística e Expedição

### 19. PickingList

**Arquivo:** `backend/app/models/logistics.py`
**Tabela:** `picking_lists`

**Descrição:** Lista de separação de pedidos.

**Campos Principais:**

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `picking_number` | String(100) (UNIQUE) | Número |
| `type` | Enum | single_order, batch, wave |
| `sale_ids` | JSON | IDs das vendas |
| `items` | JSON | Produtos a separar |
| `picking_route` | JSON | Rota otimizada |
| `status` | Enum (INDEX) | pending, in_progress, completed |
| `assigned_to` | Integer (FK) | Operador |

---

### 20. PackingJob

**Arquivo:** `backend/app/models/logistics.py`
**Tabela:** `packing_jobs`

**Descrição:** Trabalho de embalagem.

**Campos Principais:**

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `sale_id` | Integer (FK) | Venda |
| `station_id` | Integer (FK) | Estação de embalagem |
| `selected_box_id` | Integer (FK) | Caixa selecionada |
| `weight` | Float | Peso (kg) |
| `status` | Enum (INDEX) | pending, in_progress, completed, problem |
| `shipping_label_url` | Text | URL da etiqueta |

---

### 21. DeliveryRoute

**Arquivo:** `backend/app/models/logistics.py`
**Tabela:** `delivery_routes`

**Descrição:** Rota de entrega.

**Campos Principais:**

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `route_number` | String(100) (UNIQUE) | Número |
| `vehicle_id` | Integer (FK) | Veículo |
| `driver_id` | Integer (FK) | Motorista |
| `total_distance_km` | Float | Distância total |
| `optimized` | Boolean | Se foi otimizada |
| `status` | Enum (INDEX) | planned, in_progress, completed |

**Relacionamentos:**
- `deliveries` (One-to-Many) → Entregas da rota

---

## 🌐 Marketplace e Integrações

### 22. MarketplaceIntegration

**Arquivo:** `backend/app/models/marketplace.py`
**Tabela:** `marketplace_integrations`

**Descrição:** Configuração de integração com marketplace.

**Campos Principais:**

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `marketplace` | Enum (INDEX) | mercado_livre, amazon, shopee, magalu, tiktok_shop, shopify, etc. |
| `name` | String(255) | Nome da integração |
| `credentials` | JSON | Credenciais - **CRIPTOGRAFADAS** |
| `is_active` | Boolean | Se está ativa |
| `auto_sync` | Boolean | Sincronização automática |
| `sync_frequency` | Integer | Frequência em minutos |
| `last_sync_status` | Enum | success, error, partial, pending |

**Relacionamentos:**
- `listings` (One-to-Many) → Anúncios
- `orders` (One-to-Many) → Pedidos
- `sync_jobs` (One-to-Many) → Jobs de sincronização

---

### 23. ProductListing

**Arquivo:** `backend/app/models/marketplace.py`
**Tabela:** `product_listings`

**Descrição:** Anúncio de produto em marketplace.

**Campos Principais:**

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `product_id` | Integer (FK) | Produto interno |
| `marketplace_integration_id` | Integer (FK) | Integração |
| `external_id` | String(255) (INDEX) | ID no marketplace |
| `price` | Float | Preço |
| `stock_quantity` | Integer | Estoque |
| `status` | Enum (INDEX) | active, paused, out_of_stock, error |
| `views` | Integer | Visualizações |
| `sales` | Integer | Vendas |

---

### 24. UnifiedOrder

**Arquivo:** `backend/app/models/marketplace.py`
**Tabela:** `unified_orders`

**Descrição:** Pedido importado de marketplace.

**Campos Principais:**

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `marketplace_integration_id` | Integer (FK) | Integração |
| `external_order_id` | String(255) (INDEX) | ID externo |
| `customer_data` | JSON | Dados do cliente |
| `items` | JSON | Itens do pedido |
| `total` | Float | Total |
| `status` | Enum (INDEX) | pending, processing, shipped, delivered |
| `sale_id` | Integer (FK) | Venda gerada |
| `processed` | Boolean (INDEX) | Se foi processado |

---

## 📊 Relatórios e Analytics

### 25. KPIDefinition

**Arquivo:** `backend/app/models/analytics.py`
**Tabela:** `kpi_definitions`

**Descrição:** Definição de KPI.

**Campos Principais:**

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `name` | String(255) | Nome |
| `category` | Enum (INDEX) | sales, inventory, customers, operations, financial |
| `metric_field` | String(255) | Campo métrico |
| `aggregation` | Enum | sum, avg, count, min, max |
| `target_value` | Float | Meta |
| `show_on_dashboard` | Boolean | Exibir no dashboard |

**Relacionamentos:**
- `kpi_values` (One-to-Many) → Valores históricos

---

### 26. DashboardAlert

**Arquivo:** `backend/app/models/analytics.py`
**Tabela:** `dashboard_alerts`

**Descrição:** Alerta do dashboard.

**Campos Principais:**

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `type` | Enum (INDEX) | info, warning, critical |
| `title` | String(255) | Título |
| `message` | Text | Mensagem |
| `action_required` | Boolean | Requer ação |
| `is_read` | Boolean (INDEX) | Lido |

---

### 27. CustomReport

**Arquivo:** `backend/app/models/analytics.py`
**Tabela:** `custom_reports`

**Descrição:** Relatório personalizado.

**Campos Principais:**

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `name` | String(255) | Nome |
| `type` | Enum (INDEX) | sales, inventory, customers, products, financial |
| `dimensions` | JSON | Dimensões |
| `metrics` | JSON | Métricas |
| `visualization` | Enum | table, chart, pivot, kpi |
| `schedule` | JSON | Agendamento |

**Relacionamentos:**
- `executions` (One-to-Many) → Execuções do relatório

---

## 🔔 Notificações

### 28. Notification

**Arquivo:** `backend/app/models/notification.py`
**Tabela:** `notifications`

**Descrição:** Notificação de usuário.

**Campos Principais:**

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `user_id` | Integer (FK) (INDEX) | Usuário |
| `type` | Enum | alert, warning, info, success |
| `priority` | Enum | low, medium, high, urgent |
| `title` | String(200) | Título |
| `message` | Text | Mensagem |
| `read` | Boolean (INDEX) | Lida |
| `link` | String(500) | Link de ação |
| `related_entity_type` | String(100) | Tipo (accounts_payable, product) |
| `related_entity_id` | Integer | ID da entidade |

---

## 🔗 Diagrama de Relacionamentos

### Diagrama Simplificado (Core + Principais)

```
┌─────────────┐
│  Workspace  │
└──────┬──────┘
       │
       ├───────────┬───────────────┬──────────────┬─────────────┐
       │           │               │              │             │
    ┌──▼───┐   ┌──▼───────┐  ┌───▼─────┐   ┌────▼─────┐  ┌───▼────────┐
    │ User │   │ Product  │  │ Supplier│   │   Sale   │  │ BankAccount│
    └──┬───┘   └────┬─────┘  └────┬────┘   └────┬─────┘  └─────┬──────┘
       │            │              │             │              │
       │       ┌────▼─────┐   ┌───▼──────────┐  │         ┌────▼─────────────┐
       │       │  Batch   │   │ AP Invoice   │  │         │ CashFlowTransaction│
       │       └──────────┘   └──────────────┘  │         └──────────────────┘
       │                                         │
       │                                    ┌────▼────────────┐
       │                                    │ AccountsReceivable│
       │                                    └─────────────────┘
       │
  ┌────▼────────┐
  │Notification │
  └─────────────┘
```

### Relacionamento Multi-Tenancy

```
Workspace (1) ─────< (N) User
  │
  ├─────< (N) Product
  │         └─────< (N) ProductBatch
  │         └─────< (N) ProductListing (marketplace)
  │
  ├─────< (N) Sale
  │         └─────< (N) AccountsReceivable
  │
  ├─────< (N) Supplier
  │         └─────< (N) AccountsPayableInvoice
  │         └─────< (N) Invoice
  │
  ├─────< (N) Warehouse
  │         └─────< (N) WarehouseArea
  │         └─────< (N) StockTransfer
  │
  └─────< (N) MarketplaceIntegration
            └─────< (N) ProductListing
            └─────< (N) UnifiedOrder
            └─────< (N) SyncJob
```

---

## 📚 Referências

- [Arquitetura Backend](arquitetura-backend.md)
- [Multi-Tenancy](multi-tenancy.md)
- [Referência de API](../06-api/referencia-endpoints.md)

---

**Última atualização:** 04/11/2025 | **Versão:** 2.0.0
