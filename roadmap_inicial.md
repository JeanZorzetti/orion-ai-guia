# Roadmap de Implementação Técnica - Orion ERP (MVP)

**Para:** Claude Code
**De:** CTO Orion ERP
**Assunto:** Fase 1 - Configuração do Ambiente e Arquitetura Central

Este documento detalha as tarefas técnicas prioritárias para estabelecer a fundação do Orion ERP. [cite_start]O objetivo é configurar os repositórios, serviços de hospedagem e implementar os pilares da nossa arquitetura: **Banco de Dados Multi-Tenant** [cite: 4] [cite_start]e **Autenticação JWT**[cite: 58].

---

## Fase 0: Configuração do Ambiente e Repositórios ✅

[cite_start]O objetivo é preparar nosso ambiente de desenvolvimento, versionamento e implantação (CI/CD)[cite: 1255].

1.  **Repositório (GitHub):**
    * [cite_start][x] Criar um **monorepo** no GitHub chamado `orion-erp`[cite: 1297].
    * [cite_start][x] Criar as pastas raiz: `/backend`, `/frontend`, e `/admin`[cite: 1298].
2.  **Estratégia de Branching:**
    * [cite_start][x] Configurar as branches principais[cite: 1300]:
        * `main`: Produção - Usando apenas main conforme solicitado.

---

## Fase 1: Backend (FastAPI) - API Central ✅

O cérebro do sistema. [cite_start]Foco total em segurança, multi-tenancy e na API de autenticação[cite: 1252].

* **Pasta:** `/backend`
* [cite_start]**Hospedagem:** VPS (Hostinger) via Easypanel[cite: 1252, 1288]. ✅
* [cite_start]**Domínio (Staging):** `orionback.roilabs.com.br`[cite: 1310]. ✅
* **Status:** 🟢 ONLINE E FUNCIONANDO

**Tarefas:**

1.  **Ambiente e Deploy (Easypanel):** ✅
    * [cite_start][x] Criar o `Dockerfile` na raiz do `/backend`[cite: 1274]. [cite_start]Este arquivo deve definir a build da nossa aplicação FastAPI com base no `Python 3.11+`[cite: 1260].
    * [cite_start][x] Configurar o serviço **PostgreSQL** no Easypanel[cite: 1254, 1312].
    * [cite_start][x] Configurar o projeto no Easypanel para buildar e implantar o `/backend` automaticamente a partir da branch `main`[cite: 1292, 1311].
2.  **Estrutura do Banco (SQLAlchemy):** ✅
    * [cite_start][x] Configurar o **SQLAlchemy** como nosso ORM[cite: 2].
    * [cite_start][x] Definir os *models* (classes Python) no `/backend` para o schema do MVP[cite: 3, 6]:
        * [cite_start][x] `Workspaces` [cite: 47]
        * [cite_start][x] `Users` (com `hashed_password`) [cite: 48, 62]
        * [cite_start][x] `Suppliers` [cite: 51]
        * [cite_start][x] `Invoices` [cite: 52]
        * [cite_start][x] `Products` [cite: 55]
        * [cite_start][x] `Sales` [cite: 56]
    * [cite_start][x] Garantir que todas as tabelas de dados (Suppliers, Invoices, Products, Sales) contenham a `ForeignKey('workspaces.id')` (`workspace_id`) para garantir o isolamento de dados (multi-tenancy)[cite: 4, 39, 43, 71].
3.  **Autenticação e Autorização (JWT):** ✅
    * [cite_start][x] Implementar o fluxo de **JWT** [cite: 58] [cite_start]usando `Passlib` (para hashing de senhas) [cite: 62] [cite_start]e `python-jose` (para criação/validação de tokens)[cite: 63].
    * [cite_start][x] Criar o endpoint `POST /api/v1/auth/token`[cite: 76]:
        * [cite_start][x] Recebe `email` e `senha`[cite: 61].
        * [cite_start][x] Verifica o usuário e o hash da senha[cite: 62].
        * [cite_start][x] Retorna `access_token` (curta duração) e `refresh_token` (longa duração)[cite: 64, 65].
4.  **Endpoints de Usuário e Workspace:** ✅
    * [cite_start][x] Criar o endpoint `POST /api/v1/users`[cite: 77]:
        * Função: Criação de um novo usuário e seu `Workspace` inicial.
    * [cite_start][x] Criar o endpoint `GET /api/v1/users/me`[cite: 78]:
        * Função: Retorna os dados do usuário logado.
        * [cite_start][x] Usa dependência do FastAPI que valida o `Authorization: Bearer <token>`, decodifica o JWT e extrai o `user_id` e `workspace_id`[cite: 68].
5.  **Segurança (Pydantic e Multi-Tenancy):** ✅
    * [cite_start][x] Garantir que todos os endpoints de API usem **Pydantic models** para validação automática de entrada e saída[cite: 73].
    * [cite_start][x] Estabelecer a dependência de segurança que injeta o `workspace_id` do usuário (obtido do JWT) em *todas as queries* de banco de dados, aplicando a cláusula `WHERE workspace_id = ...`[cite: 71].

**Migração SQL:** ✅
* Scripts SQL criados e prontos em `backend/migrations/`
* Usuário admin criado: `admin@orion.com` / `admin123`

---

## Fase 2: Frontend (Next.js) - Aplicação do Cliente ✅ (100% Completo)

A interface principal do nosso cliente. Foco na usabilidade e integração com a API de autenticação.

* **Pasta:** `/frontend`
* **Hospedagem:** Vercel
* **Domínio (Staging):** `orionerp.roilabs.com.br`
* **Status:** 🟢 ONLINE E FUNCIONANDO

**Tarefas:**

1.  **Setup do Projeto:**
    * [x] Inicializar o projeto **Next.js 14+** com **TypeScript**
    * [x] Instalar e configurar o **Tailwind CSS v4**
    * [x] Configurar o sistema de design Orion ERP (cores, fontes)
2.  **UI Base e Componentes:**
    * [x] Desenvolver os componentes atômicos reutilizáveis (`Button`, `Input`, `Card`, `Badge`)
    * [x] Desenvolver os componentes de layout principais: `Sidebar`, `Header`, `MainLayout`
3.  **Fluxo de Autenticação (Cliente):**
    * [x] Construir as telas de **Login** e **Cadastro**
    * [x] Implementar a lógica de *data fetching* para:
        * Chamar `POST /users` (no cadastro)
        * Chamar `POST /auth/token` (no login)
    * [x] Implementar o armazenamento de tokens: `access_token` em memória e `refresh_token` no localStorage
4.  **Rotas Protegidas e API Client:**
    * [x] Configurar um cliente HTTP que anexa automaticamente o `access_token` ao cabeçalho `Authorization: Bearer <token>`
    * [x] Implementar refresh automático de tokens
    * [x] Implementar a lógica de rotas protegidas no Next.js (middleware)
    * [x] Criar tela de Dashboard com proteção de rotas
5.  **Deploy (Vercel):**
    * [x] Conectar o projeto Vercel ao repositório GitHub, apontando para a pasta `/frontend`
    * [x] Configurar o deploy automático da branch `main` para o domínio `orionerp.roilabs.com.br`

---

## Fase 3: Frontend (Next.js) - Painel Administrativo ✅ (100% Completo)

Painel de administração interna (Super Admin).

* **Pasta:** `/admin` (integrado ao projeto principal)
* **Hospedagem:** Vercel ✅
* **Domínio:** `orionerp.roilabs.com.br/super-admin` ✅
* **Status:** 🟢 ONLINE E FUNCIONANDO

**Implementação:**

* Decidido integrar Super Admin ao projeto `/admin` existente ao invés de criar projeto separado
* Melhor para MVP: reutilização de componentes, deploy único, manutenção simplificada

**Tarefas:**

1.  **Backend - Endpoints de Super Admin:** ✅
    * [x] Criar dependência `get_current_super_admin()` para autorização
    * [x] Criar schemas: `WorkspaceAdmin`, `UserAdmin`, `SystemStats`
    * [x] Implementar endpoint `GET /api/v1/super-admin/stats`
    * [x] Implementar CRUD completo de Workspaces:
        * [x] `GET /api/v1/super-admin/workspaces` - Listar
        * [x] `GET /api/v1/super-admin/workspaces/{id}` - Detalhes
        * [x] `POST /api/v1/super-admin/workspaces` - Criar
        * [x] `PATCH /api/v1/super-admin/workspaces/{id}` - Atualizar
        * [x] `DELETE /api/v1/super-admin/workspaces/{id}` - Deletar
    * [x] Implementar CRUD completo de Usuários (cross-workspace):
        * [x] `GET /api/v1/super-admin/users` - Listar
        * [x] `GET /api/v1/super-admin/users/{id}` - Detalhes
        * [x] `POST /api/v1/super-admin/users` - Criar
        * [x] `PATCH /api/v1/super-admin/users/{id}` - Atualizar
        * [x] `DELETE /api/v1/super-admin/users/{id}` - Deletar

2.  **Frontend - Interface de Super Admin:** ✅
    * [x] Adicionar tipos TypeScript para `WorkspaceAdmin`, `UserAdmin`, `SystemStats`
    * [x] Criar service `superAdminService` com métodos para todos os endpoints
    * [x] Atualizar middleware para proteger rotas `/super-admin/*`
    * [x] Criar página `/super-admin` - Dashboard com estatísticas do sistema
    * [x] Criar página `/super-admin/workspaces` - Gerenciamento de workspaces
    * [x] Criar página `/super-admin/usuarios` - Gerenciamento de usuários
    * [x] Implementar proteção client-side verificando `role === 'super_admin'`

3.  **Autenticação de Admin:** ✅
    * [x] Reutilizar autenticação JWT existente com verificação de role
    * [x] Campo `role` já existe no modelo `User` (user, admin, super_admin)
    * [x] Proteção em todos os endpoints de super admin com dependência `get_current_super_admin()`

4.  **Deploy:** ✅
    * [x] Deploy automático configurado no Vercel (projeto já existente)
    * [x] Rotas acessíveis em `https://orionerp.roilabs.com.br/super-admin`

---

## Próximos Passos (Pós-Arquitetura Central)

Após a conclusão destas fases, a arquitetura central estará validada. O próximo sprint focará em:

1.  [cite_start]**Backend:** Implementar os endpoints RESTful dos módulos principais (Financeiro [cite: 79] [cite_start]e Vendas/Estoque [cite: 84]).
2.  [cite_start]**Frontend:** Construir as telas dos módulos (Contas a Pagar [cite: 540][cite_start], Detalhes do Produto [cite: 548]) e conectá-las às APIs.
3.  [cite_start]**IA Core:** Iniciar o desenvolvimento dos endpoints de IA: `POST /invoices/upload` [cite: 83] [cite_start]e `GET /products/{product_id}/demand-forecast`[cite: 87].