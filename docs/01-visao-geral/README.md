# Visão Geral - Orion ERP

> Documentação completa sobre o que é e como funciona o Orion ERP

**Última atualização:** 04/11/2025
**Versão:** 2.0.0

---

## 📋 Índice

1. [O que é Orion ERP](#o-que-é-orion-erp)
2. [Funcionalidades Principais](#funcionalidades-principais)
3. [Arquitetura Geral](#arquitetura-geral)
4. [Tecnologias Utilizadas](#tecnologias-utilizadas)
5. [Módulos Disponíveis](#módulos-disponíveis)

---

## 🎯 O que é Orion ERP

O **Orion ERP** é um sistema completo de gestão empresarial (Enterprise Resource Planning) desenvolvido para atender empresas de pequeno a médio porte que precisam de:

- Gestão financeira integrada
- Controle total de estoque
- Integração com marketplaces
- Automação de processos
- Relatórios e analytics em tempo real

### Proposta de Valor

**Para Empresas:**
- Centralização de todos os processos em uma única plataforma
- Redução de erros manuais através de automação
- Visibilidade completa do negócio com dashboards e relatórios
- Integração nativa com principais marketplaces
- Escalabilidade para crescimento

**Para Gestores:**
- Tomada de decisão baseada em dados
- Acompanhamento de KPIs em tempo real
- Análise de cenários e projeções
- Alertas automáticos de situações críticas

**Para Equipes:**
- Interface intuitiva e moderna
- Workflows otimizados
- Colaboração entre departamentos
- Acesso mobile (em desenvolvimento)

---

## ⚡ Funcionalidades Principais

### 1. Multi-Tenancy
- **Isolamento completo** de dados por workspace/empresa
- Cada empresa tem seu próprio ambiente
- Compartilhamento de infraestrutura com segurança
- Escalabilidade horizontal

### 2. Gestão Financeira Completa
- Contas a Pagar e Receber
- Fluxo de Caixa com projeções
- Conciliação bancária automática
- Análise de cenários financeiros
- KPIs financeiros

### 3. Controle de Estoque Inteligente
- Gestão completa de produtos
- Controle de lotes e validade
- Múltiplos armazéns
- Inventário cíclico
- Rastreabilidade completa

### 4. Integrações com Marketplaces
- **Shopify** - Integração completa
- **Mercado Livre** - Sincronização de pedidos
- **Magazine Luiza** - Gestão de produtos
- **TikTok Shop** - Vendas integradas
- **WooCommerce** - E-commerce

### 5. Vendas e CRM
- Funil de vendas
- Pipeline de oportunidades
- Analytics de vendas
- Métricas de performance

### 6. Logística
- Picking (separação)
- Packing (embalagem)
- Expedição
- Tracking de entregas

### 7. Fiscal
- Emissão de NF-e
- Integração com APIs fiscais
- Auditoria automatizada
- Gestão de certificados

---

## 🏗️ Arquitetura Geral

### Visão de Alto Nível

```
┌─────────────────────────────────────────────────────────────┐
│                         FRONTEND                             │
│                       Next.js 15.5.3                         │
│                    TypeScript + React                        │
│                      Tailwind CSS                            │
└──────────────────────┬──────────────────────────────────────┘
                       │ HTTPS/REST API
                       │
┌──────────────────────▼──────────────────────────────────────┐
│                         BACKEND                              │
│                      FastAPI + Python                        │
│                     SQLAlchemy ORM                           │
│                   JWT Authentication                         │
└──────────────────────┬──────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────┐
│                       BANCO DE DADOS                         │
│                      PostgreSQL 15+                          │
│                    Multi-tenant Schema                       │
└─────────────────────────────────────────────────────────────┘
```

### Características Arquiteturais

**Frontend:**
- SPA (Single Page Application)
- Server-side Rendering (SSR) quando necessário
- Static Generation para páginas públicas
- API Routes para funcionalidades específicas

**Backend:**
- RESTful API
- Async/await para operações I/O
- Middleware de autenticação
- Validação automática de dados (Pydantic)
- Documentação automática (Swagger/OpenAPI)

**Banco de Dados:**
- Modelo relacional normalizado
- Isolamento por workspace_id
- Índices otimizados
- Migrations versionadas (Alembic)

---

## 🛠️ Tecnologias Utilizadas

### Backend Stack

| Tecnologia | Versão | Uso |
|-----------|--------|-----|
| Python | 3.11+ | Linguagem principal |
| FastAPI | Latest | Framework web |
| SQLAlchemy | 2.0+ | ORM |
| Pydantic | v2 | Validação de dados |
| PostgreSQL | 15+ | Banco de dados |
| JWT | - | Autenticação |
| Alembic | - | Migrations |

### Frontend Stack

| Tecnologia | Versão | Uso |
|-----------|--------|-----|
| Next.js | 15.5.3 | Framework React |
| React | 18 | UI Library |
| TypeScript | 5+ | Type safety |
| Tailwind CSS | Latest | Estilização |
| Shadcn/UI | Latest | Componentes |
| React Hook Form | Latest | Formulários |
| Date-fns | Latest | Datas |

### Infraestrutura

| Tecnologia | Uso |
|-----------|-----|
| Docker | Containerização |
| Vercel | Deploy frontend |
| Railway/Render | Deploy backend |
| GitHub Actions | CI/CD |
| PostgreSQL Cloud | Banco de dados produção |

---

## 📦 Módulos Disponíveis

### Módulo Financeiro

**Contas a Pagar**
- Cadastro de fornecedores
- Lançamento de contas
- Aprovações por workflow
- Conciliação bancária
- Análise de desconto
- Portal do fornecedor

**Contas a Receber**
- Gestão de clientes
- Emissão de boletos
- Cobrança automatizada
- Análise de risco
- Automação de processos

**Fluxo de Caixa**
- Lançamentos manuais e automáticos
- Projeções futuras
- Análise de cenários
- Simulador de impacto
- Dashboards executivos

### Módulo de Estoque

**Produtos**
- Cadastro completo
- Categorias e subcategorias
- Variações de produtos
- Imagens e descrições
- Preços e custos

**Movimentações**
- Entradas de estoque
- Saídas de estoque
- Ajustes e transferências
- Histórico completo
- Rastreabilidade

**Lotes**
- Controle por lote
- Validade e fabricação
- Rastreamento FIFO/FEFO
- Recall automatizado

**Armazéns**
- Múltiplos locais
- Áreas de armazenagem
- Transferências entre armazéns
- Ocupação e capacidade

**Inventário**
- Contagem cíclica
- Conciliação automática
- Ajustes de divergências
- Relatórios de acuracidade

### Módulo de Vendas

**Marketplace**
- Integração com canais
- Sincronização de produtos
- Gestão unificada de pedidos
- Resolução de conflitos
- Tracking de sincronização

**Funil de Vendas**
- Pipeline de oportunidades
- Estágios customizáveis
- Conversão e métricas
- CRM básico

**Analytics**
- Métricas de vendas
- KPIs personalizáveis
- Dashboards interativos
- Ações recomendadas

**Logística**
- Picking lists
- Estações de packing
- Gestão de caixas
- Rotas de entrega
- Tracking de veículos

### Módulo Fiscal

**Emissão de NF-e**
- Integração com APIs fiscais
- Emissão automática
- Gestão de certificados
- Contingência

**Auditoria**
- Log de operações
- Rastreamento de notas
- Relatórios fiscais
- Compliance

### Sistema de Notificações

**Notificações em Tempo Real**
- Alertas de contas vencendo
- Avisos de estoque baixo
- Notificações de metas
- Mensagens do sistema

**Configuração**
- Tipos de notificação
- Prioridades
- Filtros personalizados
- Preferências de usuário

---

## 📊 Próximos Passos

Para começar a usar o Orion ERP, consulte:

- [Setup Backend](../03-backend/setup-ambiente.md)
- [Setup Frontend](../04-frontend/setup-ambiente.md)
- [Primeiros Passos](../10-guias-usuario/primeiros-passos.md)

Para entender melhor a arquitetura:

- [Arquitetura Backend](../02-arquitetura/arquitetura-backend.md)
- [Arquitetura Frontend](../02-arquitetura/arquitetura-frontend.md)
- [Multi-tenancy](../02-arquitetura/multi-tenancy.md)

---

## 📞 Referências

- [README Principal](../../README.md)
- [Roadmap de Documentação](../../roadmaps/roadmap_doc.md)
- [API Reference](../06-api/README.md)
