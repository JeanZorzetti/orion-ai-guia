# Orion ERP

> Sistema completo de gestão empresarial (ERP) com arquitetura multi-tenant e integração com principais marketplaces

[![Version](https://img.shields.io/badge/version-2.0.0-blue.svg)](https://github.com/JeanZorzetti/orion-ai-guia)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Python](https://img.shields.io/badge/python-3.11+-blue.svg)](https://www.python.org/)
[![Next.js](https://img.shields.io/badge/next.js-15.5.3-black.svg)](https://nextjs.org/)

---

## 📋 Índice

- [Sobre o Projeto](#sobre-o-projeto)
- [Funcionalidades Principais](#funcionalidades-principais)
- [Tecnologias Utilizadas](#tecnologias-utilizadas)
- [Começando](#começando)
- [Documentação](#documentação)
- [Estrutura do Projeto](#estrutura-do-projeto)
- [Contribuindo](#contribuindo)
- [Licença](#licença)

---

## 🎯 Sobre o Projeto

**Orion ERP** é um sistema de gestão empresarial completo desenvolvido com tecnologias modernas, focado em:

- **Multi-tenancy**: Isolamento completo de dados por workspace
- **Integrações**: Conexão com principais marketplaces (Shopify, Mercado Livre, Magazine Luiza, TikTok Shop, WooCommerce)
- **Gestão Financeira**: Contas a pagar/receber, fluxo de caixa, análise de cenários
- **Gestão de Estoque**: Controle de lotes, múltiplos armazéns, inventário cíclico
- **Vendas e CRM**: Funil de vendas, analytics, automação
- **Fiscal**: Emissão de NF-e, integração com APIs fiscais

### Diferenciais

✅ **Arquitetura moderna** com FastAPI e Next.js 15
✅ **Real-time** com notificações e atualizações automáticas
✅ **Escalável** preparado para crescimento
✅ **Seguro** com autenticação JWT e criptografia
✅ **Integrações nativas** com marketplaces

---

## 🚀 Funcionalidades Principais

### 💰 Módulo Financeiro
- Contas a Pagar com aprovações e conciliação bancária
- Contas a Receber com automação de cobrança
- Fluxo de Caixa com projeções e cenários
- Relatórios financeiros e KPIs
- Break-even analysis e simulador de impacto

### 📦 Módulo de Estoque
- Cadastro completo de produtos com variações
- Movimentações (entradas, saídas, ajustes)
- Controle de lotes e rastreabilidade
- Múltiplos armazéns e transferências
- Inventário cíclico com conciliação
- Relatórios de posição e giro de estoque

### 🛒 Módulo de Vendas
- Integração com marketplaces
- Funil de vendas e pipeline
- Analytics e métricas de vendas
- Logística (picking, packing, expedição)
- Gestão de pedidos unificada

### 📄 Módulo Fiscal
- Emissão de NF-e
- Integração com PlugNotas/FocusNFe
- Auditoria fiscal automatizada
- Gestão de certificados digitais

### 🔔 Sistema de Notificações
- Notificações em tempo real
- Alertas personalizáveis
- Priorização de mensagens
- Histórico completo

---

## 🛠️ Tecnologias Utilizadas

### Backend
- **Python 3.11+**
- **FastAPI** - Framework web moderno e rápido
- **SQLAlchemy 2.0** - ORM com suporte a async
- **PostgreSQL** - Banco de dados relacional
- **Pydantic v2** - Validação de dados
- **JWT** - Autenticação e autorização
- **Alembic** - Migrations de banco de dados

### Frontend
- **Next.js 15.5.3** - Framework React com App Router
- **React 18** - Biblioteca UI
- **TypeScript** - Type safety
- **Tailwind CSS** - Estilização
- **Shadcn/UI** - Componentes
- **React Hook Form** - Formulários
- **Date-fns** - Manipulação de datas

### Infraestrutura
- **Docker** - Containerização
- **Vercel** - Deploy frontend
- **Railway/Render** - Deploy backend
- **GitHub Actions** - CI/CD

---

## 🏁 Começando

### Pré-requisitos

- **Node.js** 18+ e npm/yarn
- **Python** 3.11+
- **PostgreSQL** 15+
- **Git**

### Instalação Rápida

```bash
# Clone o repositório
git clone https://github.com/JeanZorzetti/orion-ai-guia.git
cd orion-ai-guia

# Backend
cd backend
python -m venv venv
source venv/bin/activate  # No Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# Configure as variáveis de ambiente
python main.py

# Frontend (em outro terminal)
cd admin
npm install
cp .env.local.example .env.local
# Configure as variáveis de ambiente
npm run dev
```

### Acesso

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **Documentação API**: http://localhost:8000/docs

---

## 📚 Documentação

A documentação completa está organizada na pasta `docs/`:

### Documentação Essencial
- [Visão Geral](docs/01-visao-geral/README.md) - O que é o Orion ERP
- [Setup Backend](docs/03-backend/setup-ambiente.md) - Como configurar o backend
- [Setup Frontend](docs/04-frontend/setup-ambiente.md) - Como configurar o frontend
- [Primeiros Passos](docs/10-guias-usuario/primeiros-passos.md) - Guia inicial

### Documentação Técnica
- [Arquitetura](docs/02-arquitetura/README.md) - Arquitetura do sistema
- [API Reference](docs/06-api/README.md) - Documentação completa da API
- [Banco de Dados](docs/07-banco-dados/README.md) - Modelagem e migrations
- [Integrações](docs/08-integracao/README.md) - Integrações com marketplaces

### Guias
- [Guias do Usuário](docs/10-guias-usuario/README.md) - Como usar o sistema
- [Guias do Desenvolvedor](docs/11-guias-desenvolvedor/README.md) - Como contribuir

### Roadmaps
- [Roadmap de Documentação](roadmaps/roadmap_doc.md) - Plano de documentação

---

## 📁 Estrutura do Projeto

```
orion-erp/
├── backend/              # Backend FastAPI
│   ├── app/
│   │   ├── api/         # Endpoints da API
│   │   ├── core/        # Configurações core
│   │   ├── models/      # Modelos SQLAlchemy
│   │   ├── schemas/     # Schemas Pydantic
│   │   └── services/    # Lógica de negócio
│   ├── migrations/      # Migrations Alembic
│   ├── tests/          # Testes
│   └── main.py         # Entry point
│
├── admin/              # Frontend Next.js
│   ├── src/
│   │   ├── app/        # App Router (Next.js 15)
│   │   ├── components/ # Componentes React
│   │   ├── hooks/      # Custom hooks
│   │   ├── lib/        # Utilities
│   │   └── services/   # API services
│   └── public/         # Assets estáticos
│
├── docs/               # Documentação
├── roadmaps/           # Roadmaps do projeto
└── README.md           # Este arquivo
```

---

## 🤝 Contribuindo

Contribuições são bem-vindas! Por favor, leia o [Guia de Contribuição](docs/11-guias-desenvolvedor/contribuindo.md) antes de submeter um PR.

### Processo

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'feat: Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

### Padrões de Commit

Seguimos o padrão [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` Nova funcionalidade
- `fix:` Correção de bug
- `docs:` Mudanças na documentação
- `refactor:` Refatoração de código
- `test:` Adição ou modificação de testes
- `chore:` Mudanças em ferramentas, configs, etc

---

## 📊 Status do Projeto

### Módulos Implementados

- ✅ Autenticação e Multi-tenancy
- ✅ Gestão Financeira (Contas a Pagar/Receber, Fluxo de Caixa)
- ✅ Gestão de Estoque (Produtos, Movimentações, Lotes, Armazéns)
- ✅ Inventário Cíclico
- ✅ Relatórios de Estoque
- ✅ Marketplace (Integrações)
- ✅ Vendas e Analytics
- ✅ Logística (Picking, Packing)
- ✅ Sistema de Notificações
- ✅ Fiscal (Emissão NF-e)

### Em Desenvolvimento

- 🚧 Automações avançadas
- 🚧 BI e Analytics expandido
- 🚧 Mobile app

---

## 📄 Licença

Este projeto está licenciado sob a Licença MIT - veja o arquivo [LICENSE](LICENSE) para detalhes.

---

## 📞 Suporte

- **Documentação**: [docs/](docs/)
- **Issues**: [GitHub Issues](https://github.com/JeanZorzetti/orion-ai-guia/issues)
- **Email**: contato@roilabs.com.br

---

## 🙏 Agradecimentos

- Equipe ROI Labs
- Comunidade FastAPI
- Comunidade Next.js
- Todos os contribuidores

---

**Desenvolvido com ❤️ pela equipe ROI Labs**

**Última atualização:** 04/11/2025 | **Versão:** 2.0.0
