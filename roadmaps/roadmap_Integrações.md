# Roadmap de Integrações - Orion ERP

**Objetivo:** Conectar o Orion ERP com os principais canais de venda do Brasil, permitindo sincronização automática de pedidos, produtos e estoque.

**Estratégia:** Implementação incremental, começando pelos canais mais utilizados pelos nossos design partners.

---

## 🎯 Visão Geral

### Status Atual
- ✅ **Shopify** - 100% COMPLETO
- ✅ **Mercado Livre** - 100% COMPLETO
- ✅ **WooCommerce** - 100% COMPLETO
- ⏳ Magazine Luiza (Magalu) - Planejado (Prioridade Alta)
- ⏳ TikTok Shop - Planejado (Prioridade Baixa)

### Ordem de Implementação Recomendada
1. **Shopify** ✅ (Completo)
2. **Mercado Livre** ✅ (Completo)
3. **WooCommerce** ✅ (Completo)
4. **Magalu** (marketplace crescente)
5. **TikTok Shop** (tendência emergente)

---

## ✅ Integração 1: Shopify - COMPLETO

### Status: 100% Implementado

**Funcionalidades:**
- ✅ Sincronização de pedidos pagos
- ✅ Mapeamento por SKU
- ✅ Importação incremental (desde última sync)
- ✅ Dados do cliente (nome, email, telefone, endereço)
- ✅ Criptografia de credenciais
- ✅ Teste de conexão

**Commits:**
- `973a0da4` - Backend (IntegrationService + 5 endpoints)
- `fc68ddec` - Frontend (Página + Botão Sync)

**Documentação API:**
- [Shopify Admin API](https://shopify.dev/api/admin-rest)
- Versão: 2024-01

---

## ✅ Integração 2: Mercado Livre - COMPLETO

### Status: 100% Implementado

### Por que implementar?
- **Maior marketplace do Brasil** (60% market share)
- **Volume de pedidos**: Muito alto
- **Complexidade**: Média-Alta (OAuth 2.0, webhooks)
- **Impacto**: CRÍTICO para adoção do Orion

### 2.1 Backend (FastAPI) ✅

#### Models (/models/workspace.py) ✅
```python
# Adicionar campos ao Workspace
integration_mercadolivre_access_token = Column(String(500), nullable=True)  # ENCRYPTED
integration_mercadolivre_refresh_token = Column(String(500), nullable=True)  # ENCRYPTED
integration_mercadolivre_user_id = Column(String(50), nullable=True)
integration_mercadolivre_last_sync = Column(DateTime, nullable=True)
integration_mercadolivre_token_expires_at = Column(DateTime, nullable=True)
```

#### Service (/services/integration_service.py) ✅
- ✅ Criar classe `MercadoLivreIntegrationService`
- ✅ Implementar OAuth 2.0 flow (authorization + refresh token)
- ✅ Implementar `sync_orders()`
  - Buscar pedidos desde `last_sync`
  - Filtrar por status: `paid`, `confirmed`
  - Mapear produtos por SKU do ML
  - Criar Sales no Orion
- ⏳ Implementar `sync_stock()` (opcional - futuro)
  - Atualizar estoque no ML quando vender no Orion
- ✅ Implementar `get_product_by_sku()`
- ✅ Tratamento de erros específicos do ML

#### Endpoints (/api/v1/endpoints/integrations.py) ✅
- ✅ `GET /integrations/mercadolivre/auth-url` - Retorna URL de autorização
- ✅ `POST /integrations/mercadolivre/callback` - Recebe código OAuth
- ✅ `GET /integrations/mercadolivre/config` - Status da integração
- ✅ `POST /integrations/mercadolivre/sync-orders` - Sincronizar pedidos
- ✅ `POST /integrations/mercadolivre/test-connection` - Testar conexão
- ✅ `DELETE /integrations/mercadolivre/config` - Desconectar

#### Desafios Técnicos (Resolvidos)
1. ✅ **OAuth 2.0**: Fluxo completo com authorization code
2. ✅ **Refresh Token**: Renovação automática antes de expirar
3. ✅ **Rate Limiting**: ML tem limites de requests/minuto
4. ⏳ **Webhooks** (opcional): Notificações em tempo real (futuro)
5. ✅ **Múltiplos Sellers**: Um usuário pode ter várias contas ML

### 2.2 Frontend (Next.js) ✅

#### Página /admin/integracoes ✅
- ✅ Card "Mercado Livre" com status
- ✅ Botão "Conectar com Mercado Livre" (OAuth flow)
- ✅ Exibir `user_id` e status do token
- ✅ Badge: "Conectado" / "Token Expirado" / "Desconectado"
- ✅ Botão "Testar Conexão"
- ✅ Botão "Desconectar"
- ✅ Última sincronização

#### Service (/services/integration.ts) ✅
- ✅ `getMercadoLivreAuthUrl()` - Obter URL OAuth
- ✅ `connectMercadoLivre(code)` - Processar callback
- ✅ `getMercadoLivreConfig()` - Status
- ✅ `syncMercadoLivreOrders()` - Sincronizar
- ✅ `testMercadoLivreConnection()` - Testar conexão
- ✅ `deleteMercadoLivreConfig()` - Desconectar

#### Botão Sincronizar (página de vendas) ✅
- ✅ Adicionar "Sincronizar Mercado Livre" ao lado do Shopify

### 2.3 Recursos Adicionais ✅
- ✅ Documentação: Como obter Client ID e Secret do ML (CONFIGURACAO_INTEGRACOES.md)
- ✅ Tratamento de erros de autorização
- ✅ Logs de sincronização
- ✅ Migration script (apply_migration_008.py)
- ✅ Deploy guide (DEPLOY_ML_EASYPANEL.md)

**Commits Principais:**
- `975d3919` - Service Implementation
- `d3880063` - API Endpoints
- `afc47db1` - Frontend Service
- `1277b6ec` - Vendas Sync Button
- `1b04dba3` - Fix Token Key
- `b38d74df` - Migration Script

**Tempo Real:** ~2 semanas (incluindo correções e debug)

**Referências:**
- [Mercado Livre Developers](https://developers.mercadolivre.com.br/)
- [API de Pedidos](https://developers.mercadolivre.com.br/pt_br/ordens-e-pagamentos)
- [OAuth 2.0](https://developers.mercadolivre.com.br/pt_br/autenticacao-e-autorizacao)

---

## ✅ Integração 3: WooCommerce - COMPLETO

### Status: 100% Implementado

### Por que implementar?
- **Plataforma WordPress mais usada** (30% do e-commerce mundial)
- **Lojas próprias**: Muitos clientes têm WooCommerce
- **Complexidade**: Baixa (REST API simples)
- **Impacto**: Médio-Alto

### 3.1 Backend (FastAPI) ✅

#### Models (/models/workspace.py) ✅
```python
# Adicionar campos ao Workspace
integration_woocommerce_store_url = Column(String(255), nullable=True)
integration_woocommerce_consumer_key = Column(String(500), nullable=True)  # ENCRYPTED
integration_woocommerce_consumer_secret = Column(String(500), nullable=True)  # ENCRYPTED
integration_woocommerce_last_sync = Column(DateTime, nullable=True)
```

#### Service (/services/integration_service.py) ✅
- ✅ Criar classe `WooCommerceIntegrationService`
- ✅ Implementar autenticação (Consumer Key + Secret via Basic Auth)
- ✅ Implementar `sync_orders()`
  - Buscar pedidos com status: `processing`, `completed`
  - Mapear produtos por SKU
  - Criar Sales no Orion
- ✅ Implementar `test_connection()` com /system_status
- ⏳ Implementar `sync_products()` (opcional - futuro)
- ⏳ Suporte a webhooks do WooCommerce (futuro)

#### Endpoints ✅
- ✅ `POST /integrations/woocommerce/config`
- ✅ `GET /integrations/woocommerce/config`
- ✅ `POST /integrations/woocommerce/test-connection`
- ✅ `POST /integrations/woocommerce/sync-orders`
- ✅ `DELETE /integrations/woocommerce/config`

### 3.2 Frontend (Next.js) ✅

#### Página /admin/integracoes ✅
- ✅ Card "WooCommerce" com ícone ShoppingBag purple
- ✅ Campos: Store URL, Consumer Key, Consumer Secret
- ✅ Botão "Testar Conexão"
- ✅ Botão "Salvar e Conectar"
- ✅ Badge de status (Conectado/Desconectado/Erro)
- ✅ Instruções: Como gerar API keys no WooCommerce

#### Service ✅
- ✅ `saveWooCommerceConfig()`
- ✅ `getWooCommerceConfig()`
- ✅ `testWooCommerceConnection()`
- ✅ `syncWooCommerceOrders()`
- ✅ `deleteWooCommerceConfig()`

#### Botão Sincronizar (página de vendas) ✅
- ✅ Adicionar "Sincronizar WC" ao lado de ML e Shopify

### 3.3 Vantagens Confirmadas
- ✅ API REST simples (similar ao Shopify)
- ✅ Sem OAuth complicado (Basic Auth)
- ✅ Webhooks disponíveis (não implementado ainda)
- ✅ Boa documentação

### 3.4 Recursos Adicionais ✅
- ✅ Migration 009: migration_009_woocommerce.sql
- ✅ Script de aplicação: apply_migration_009.py
- ✅ Documentação inline de configuração
- ✅ Tratamento de erros
- ✅ Criptografia de credenciais

**Commits Principais:**
- `755518c3` - Implementação completa WooCommerce

**Tempo Real:** ~3 horas (muito mais rápido que estimativa de 1-2 semanas)

**Referências:**
- [WooCommerce REST API](https://woocommerce.github.io/woocommerce-rest-api-docs/)
- [Authentication](https://woocommerce.github.io/woocommerce-rest-api-docs/#authentication)

---

## 🏬 Integração 4: Magazine Luiza - Magalu (Prioridade Média)

### Por que implementar?
- **3º maior marketplace do Brasil**
- **Crescimento rápido**: +50% ao ano
- **Sellers**: Muitas PMEs vendem no Magalu
- **Complexidade**: Média (API proprietária)
- **Impacto**: Médio

### 4.1 Backend (FastAPI)

#### Models (/models/workspace.py)
```python
# Adicionar campos ao Workspace
integration_magalu_seller_id = Column(String(100), nullable=True)
integration_magalu_api_key = Column(String(500), nullable=True)  # ENCRYPTED
integration_magalu_last_sync = Column(DateTime, nullable=True)
```

#### Service (/services/integration_service.py)
- [ ] Criar classe `MagaluIntegrationService`
- [ ] Implementar autenticação (API Key do Seller)
- [ ] Implementar `sync_orders()`
  - Buscar pedidos com status: `approved`, `invoiced`
  - Mapear produtos por código Magalu
  - Criar Sales no Orion
- [ ] Implementar `update_tracking()` (opcional)
  - Enviar código de rastreio para Magalu
- [ ] Tratamento de cancelamentos

#### Endpoints
- [ ] `POST /integrations/magalu/config`
- [ ] `GET /integrations/magalu/config`
- [ ] `POST /integrations/magalu/test-connection`
- [ ] `POST /integrations/magalu/sync-orders`
- [ ] `DELETE /integrations/magalu/config`

### 4.2 Frontend (Next.js)

#### Página /admin/integracoes
- [ ] Card "Magazine Luiza"
- [ ] Campos: Seller ID, API Key
- [ ] Botão "Testar Conexão"
- [ ] Badge de status
- [ ] Instruções: Como obter credenciais no Magalu Marketplace

#### Service
- [ ] `saveMagaluConfig()`
- [ ] `getMagaluConfig()`
- [ ] `testMagaluConnection()`
- [ ] `syncMagaluOrders()`

### 4.3 Desafios
- API não tão bem documentada quanto ML
- Precisa ser Seller homologado no Magalu
- Webhooks limitados

**Estimativa:** 2-3 semanas (8-12 dias úteis)

**Referências:**
- [Magalu Sellers](https://marketplace.magazineluiza.com.br/)
- Documentação: Disponível após homologação

---

## 🎵 Integração 5: TikTok Shop (Prioridade Baixa)

### Por que implementar?
- **Tendência emergente**: Social commerce
- **Público jovem**: Z e Millennials
- **Crescimento**: +300% no Brasil em 2024
- **Complexidade**: Alta (API nova, em evolução)
- **Impacto**: Baixo (por enquanto)

### 5.1 Backend (FastAPI)

#### Models (/models/workspace.py)
```python
# Adicionar campos ao Workspace
integration_tiktokshop_access_token = Column(String(500), nullable=True)  # ENCRYPTED
integration_tiktokshop_refresh_token = Column(String(500), nullable=True)  # ENCRYPTED
integration_tiktokshop_shop_id = Column(String(100), nullable=True)
integration_tiktokshop_last_sync = Column(DateTime, nullable=True)
integration_tiktokshop_token_expires_at = Column(DateTime, nullable=True)
```

#### Service (/services/integration_service.py)
- [ ] Criar classe `TikTokShopIntegrationService`
- [ ] Implementar OAuth 2.0 flow
- [ ] Implementar `sync_orders()`
  - Buscar pedidos com status: `PAID`, `SHIPPING`
  - Mapear produtos por SKU
  - Criar Sales no Orion
- [ ] Implementar `update_fulfillment()`
  - Marcar pedido como enviado no TikTok
- [ ] Webhooks do TikTok Shop

#### Endpoints
- [ ] `GET /integrations/tiktokshop/auth-url`
- [ ] `POST /integrations/tiktokshop/callback`
- [ ] `GET /integrations/tiktokshop/config`
- [ ] `POST /integrations/tiktokshop/sync-orders`
- [ ] `POST /integrations/tiktokshop/refresh-token`
- [ ] `DELETE /integrations/tiktokshop/config`

### 5.2 Frontend (Next.js)

#### Página /admin/integracoes
- [ ] Card "TikTok Shop"
- [ ] Botão "Conectar com TikTok"
- [ ] Status do token
- [ ] Badge de status
- [ ] Shop ID

#### Service
- [ ] `getTikTokShopAuthUrl()`
- [ ] `connectTikTokShop(code)`
- [ ] `getTikTokShopConfig()`
- [ ] `syncTikTokShopOrders()`

### 5.3 Considerações
- API ainda em beta no Brasil
- Documentação limitada em PT-BR
- Requer aprovação do TikTok para Sellers
- Foco em vídeos e live commerce

**Estimativa:** 3-4 semanas (12-16 dias úteis)

**Referências:**
- [TikTok Shop Seller Center](https://seller.tiktokglobalshop.com/)
- [TikTok Shop API](https://partner.tiktokshop.com/doc/page/262526)

---

## 🔮 Futuras Integrações (Backlog)

### Marketplaces
- [ ] **Amazon Brasil** - Complexo, requer aprovação da Amazon
- [ ] **Americanas** - Marketplace tradicional
- [ ] **Shopee** - Crescente, público jovem
- [ ] **Casas Bahia** - Marketplace Via Varejo
- [ ] **Carrefour** - Marketplace novo

### Plataformas de E-commerce
- [ ] **Nuvemshop** - Plataforma SaaS brasileira
- [ ] **VTEX** - Enterprise e-commerce
- [ ] **Tray** - Plataforma Locaweb

### Outros Canais
- [ ] **iFood** - Para restaurantes (futuro)
- [ ] **Rappi** - Delivery multi-categoria
- [ ] **WhatsApp Business API** - Vendas diretas
- [ ] **Instagram Shopping** - Social commerce

---

## 📊 Matriz de Priorização

| Integração | Prioridade | Complexidade | Impacto | Estimativa | Status |
|------------|-----------|--------------|---------|------------|--------|
| **Shopify** | ⭐⭐⭐⭐⭐ | Média | Alto | 2 semanas | ✅ Completo |
| **Mercado Livre** | ⭐⭐⭐⭐⭐ | Alta | CRÍTICO | 3-4 semanas | ✅ Completo |
| **WooCommerce** | ⭐⭐⭐⭐ | Baixa | Médio-Alto | 1-2 semanas | ✅ Completo |
| **Magalu** | ⭐⭐⭐ | Média | Médio | 2-3 semanas | ⏳ Próximo |
| **TikTok Shop** | ⭐⭐ | Alta | Baixo | 3-4 semanas | ⏳ Planejado |
| Amazon | ⭐⭐ | Muito Alta | Alto | 4-6 semanas | 📋 Backlog |
| Nuvemshop | ⭐⭐⭐ | Média | Médio | 2 semanas | 📋 Backlog |

---

## 🏗️ Arquitetura Comum de Integrações

### Padrão de Implementação

Todas as integrações seguem o mesmo padrão:

#### 1. Backend (FastAPI)
```
/models/workspace.py
  └─ Campos de credenciais (criptografados)
  └─ Timestamp de última sync

/services/integration_service.py
  └─ Classe {PlatformName}IntegrationService
      ├─ __init__(workspace, db)
      ├─ test_connection() → bool
      ├─ sync_orders() → stats
      ├─ sync_products() (opcional)
      └─ _map_order_to_sale() → Sale

/api/v1/endpoints/integrations.py
  └─ Router /integrations/{platform}/
      ├─ POST /config
      ├─ GET /config
      ├─ POST /test-connection
      ├─ POST /sync-orders
      └─ DELETE /config
```

#### 2. Frontend (Next.js)
```
/services/integration.ts
  └─ Métodos para cada endpoint

/app/admin/integracoes/page.tsx
  └─ Card para cada plataforma
      ├─ Formulário de credenciais
      ├─ Badge de status
      ├─ Botão "Testar Conexão"
      ├─ Botão "Salvar"
      └─ Instruções

/app/admin/vendas/page.tsx
  └─ Botão "Sincronizar {Platform}"
```

### Princípios
1. **Criptografia**: Todas as credenciais são criptografadas com Fernet
2. **Incremental**: Sincronizar apenas novos pedidos (last_sync)
3. **Mapeamento por SKU**: Relacionar produtos das plataformas com Orion
4. **Estatísticas**: Retornar sempre `{new_orders, skipped, errors}`
5. **Idempotência**: Não duplicar pedidos já importados
6. **Logs**: Registrar todas tentativas de sincronização
7. **Testes**: Sempre ter endpoint de test_connection

---

## 📅 Cronograma Sugerido

### Fase 1: MVP Completo (CONCLUÍDO)
- ✅ Shopify (2 semanas)

### Fase 2: Marketplaces Principais (CONCLUÍDO)
- ✅ **Semanas 1-2**: Mercado Livre (Completo)
- ✅ **Semanas 3**: WooCommerce (Completo)
- **Próximo**: Magalu

### Fase 3: Expansão (12 semanas)
- **Semanas 1-4**: TikTok Shop
- **Semanas 5-8**: Nuvemshop
- **Semanas 9-12**: Amazon (se aprovado)

---

## ✅ Checklist de Implementação (por integração)

### Backend
- [ ] Adicionar campos ao Workspace model
- [ ] Criar IntegrationService class
- [ ] Implementar autenticação
- [ ] Implementar sync_orders()
- [ ] Implementar test_connection()
- [ ] Criar 5 endpoints de API
- [ ] Testes unitários
- [ ] Testes de integração (sandbox)
- [ ] Documentação API

### Frontend
- [ ] Criar Card na página /integracoes
- [ ] Formulário de credenciais
- [ ] Badge de status
- [ ] Botão "Testar Conexão"
- [ ] Service methods
- [ ] Botão "Sincronizar" na página de vendas
- [ ] Toasts e loading states
- [ ] Instruções para usuário
- [ ] Tratamento de erros

### Infraestrutura
- [ ] Variáveis de ambiente
- [ ] Criptografia de credenciais
- [ ] Logs de auditoria
- [ ] Rate limiting (se necessário)
- [ ] Webhooks (se disponível)
- [ ] Documentação de usuário

---

**Última atualização:** 2025-10-27
**Versão:** 3.0
**Status:** 60% Completo (3 de 5 integrações principais)
