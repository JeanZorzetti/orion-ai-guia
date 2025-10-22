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

## Fase 2: Frontend (Next.js) - Aplicação do Cliente

A interface principal do nosso cliente. [cite_start]Foco na usabilidade e integração com a API de autenticação[cite: 1250].

* **Pasta:** `/frontend`
* [cite_start]**Hospedagem:** Vercel[cite: 1250, 1289].
* [cite_start]**Domínio (Staging):** `orionerp.roilabs.com.br`[cite: 1307].

**Tarefas:**

1.  **Setup do Projeto:**
    * [cite_start][ ] Inicializar o projeto **Next.js 14+** com **TypeScript**[cite: 1276, 1279].
    * [cite_start][ ] Instalar e configurar o **Tailwind CSS**.
    * [cite_start][ ] Configurar o `tailwind.config.js` com as bases do nosso sistema de design (cores, fontes).
2.  **UI Base e Componentes:**
    * [cite_start][ ] Integrar os componentes básicos gerados pelo `loveble`[cite: 1285, 573].
    * [cite_start][ ] Desenvolver os componentes atômicos reutilizáveis (ex: `Button`, `Input`, `Card`, `Badge`) [cite: 561-564].
    * [cite_start][ ] Desenvolver os componentes de layout principais: `Sidebar` e `Header`[cite: 568, 575].
3.  **Fluxo de Autenticação (Cliente):**
    * [cite_start][ ] Construir as telas de **Login** e **Cadastro**[cite: 523, 527, 576].
    * [ ] Implementar a lógica de *data fetching* para:
        * [cite_start]Chamar `POST /users` (no cadastro)[cite: 77].
        * [cite_start]Chamar `POST /auth/token` (no login)[cite: 61].
    * [cite_start][ ] Implementar o armazenamento de tokens: `access_token` em memória (estado do React) e `refresh_token` em um cookie **HttpOnly**[cite: 66].
4.  **Rotas Protegidas e API Client:**
    * [cite_start][ ] Configurar um *interceptor* (ex: em um cliente Axios) que anexa automaticamente o `access_token` ao cabeçalho `Authorization: Bearer <token>` em todas as requisições autenticadas[cite: 67].
    * [cite_start][ ] Implementar a lógica de rotas protegidas no Next.js (middleware ou wrapper de página) que redireciona usuários não logados para a página de login[cite: 577].
5.  **Deploy (Vercel):**
    * [cite_start][ ] Conectar o projeto Vercel ao repositório GitHub, apontando para a pasta `/frontend`[cite: 1291].
    * [cite_start][ ] Configurar o deploy automático da branch `develop` para o domínio `orionerp.roilabs.com.br`[cite: 1309].

---

## Fase 3: Frontend (Next.js) - Painel Administrativo

Painel de administração interna (Super Admin).

* **Pasta:** `/admin`
* [cite_start]**Hospedagem:** Vercel[cite: 1289].
* **Domínio (Staging):** `orionadmin.roilabs.com.br`

**Tarefas:**

1.  **Setup do Projeto:**
    * [ ] Inicializar um projeto **Next.js 14+** separado com **TypeScript** e **Tailwind CSS** na pasta `/admin`.
2.  **Autenticação de Admin:**
    * [ ] Construir uma tela de login simples (endpoint de autenticação de admin a ser definido no Backend, separado do `/auth/token` do cliente).
3.  **Deploy (Vercel):**
    * [ ] Conectar um **novo projeto Vercel** ao repositório GitHub, apontando para a pasta `/admin`.
    * [ ] Configurar o deploy automático da branch `develop` para o domínio `orionadmin.roilabs.com.br`.

---

## Próximos Passos (Pós-Arquitetura Central)

Após a conclusão destas fases, a arquitetura central estará validada. O próximo sprint focará em:

1.  [cite_start]**Backend:** Implementar os endpoints RESTful dos módulos principais (Financeiro [cite: 79] [cite_start]e Vendas/Estoque [cite: 84]).
2.  [cite_start]**Frontend:** Construir as telas dos módulos (Contas a Pagar [cite: 540][cite_start], Detalhes do Produto [cite: 548]) e conectá-las às APIs.
3.  [cite_start]**IA Core:** Iniciar o desenvolvimento dos endpoints de IA: `POST /invoices/upload` [cite: 83] [cite_start]e `GET /products/{product_id}/demand-forecast`[cite: 87].