# Arquitetura Backend - Orion ERP

> Documentação completa da arquitetura backend do Orion ERP

**Última atualização:** 04/11/2025
**Versão:** 2.0.0

---

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Stack Tecnológico](#stack-tecnológico)
3. [Estrutura de Camadas](#estrutura-de-camadas)
4. [Arquitetura de Pastas](#arquitetura-de-pastas)
5. [Padrões Arquiteturais](#padrões-arquiteturais)
6. [Fluxo de Requisição](#fluxo-de-requisição)
7. [Configurações](#configurações)
8. [Dependências e Injeção](#dependências-e-injeção)

---

## 🎯 Visão Geral

O backend do Orion ERP é construído com **FastAPI**, um framework Python moderno e de alta performance, seguindo princípios de arquitetura limpa e separação de responsabilidades.

### Características Principais

- **Framework**: FastAPI com suporte async/await
- **ORM**: SQLAlchemy 2.0 com Alembic para migrations
- **Validação**: Pydantic v2 para schemas e validação de dados
- **Autenticação**: JWT (JSON Web Tokens) com refresh tokens
- **Multi-tenancy**: Isolamento completo por workspace_id
- **API REST**: OpenAPI/Swagger com documentação automática
- **Banco de Dados**: PostgreSQL 15+

---

## 🛠️ Stack Tecnológico

### Core

| Tecnologia | Versão | Propósito |
|-----------|--------|-----------|
| **Python** | 3.11+ | Linguagem principal |
| **FastAPI** | Latest | Framework web assíncrono |
| **Uvicorn** | Latest | Servidor ASGI |
| **SQLAlchemy** | 2.0+ | ORM e query builder |
| **Alembic** | Latest | Migrations de banco de dados |
| **Pydantic** | v2 | Validação e serialização de dados |
| **PostgreSQL** | 15+ | Banco de dados relacional |

### Segurança

| Tecnologia | Propósito |
|-----------|-----------|
| **python-jose** | JWT encoding/decoding |
| **passlib** | Hash de senhas (bcrypt) |
| **cryptography** | Criptografia field-level |

### Integrações

| Tecnologia | Propósito |
|-----------|-----------|
| **httpx** | Cliente HTTP assíncrono |
| **python-multipart** | Upload de arquivos |
| **python-dotenv** | Variáveis de ambiente |

---

## 🏗️ Estrutura de Camadas

A arquitetura backend segue uma estrutura em camadas bem definida:

```
┌─────────────────────────────────────────┐
│         API Layer (FastAPI)             │
│  - Routers (endpoints)                  │
│  - Request/Response handling            │
│  - Dependency injection                 │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│       Schema Layer (Pydantic)           │
│  - Input validation                     │
│  - Output serialization                 │
│  - Type checking                        │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│      Business Logic (Services)          │
│  - Domain logic                         │
│  - Orchestration                        │
│  - External integrations                │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│    Data Access Layer (Models/ORM)       │
│  - SQLAlchemy models                    │
│  - Database queries                     │
│  - Relationships                        │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│         Database (PostgreSQL)           │
│  - Tables and indexes                   │
│  - Constraints                          │
│  - Data storage                         │
└─────────────────────────────────────────┘
```

### Separação de Responsabilidades

**API Layer (`app/api/`):**
- Define rotas e endpoints HTTP
- Trata requests e responses
- Aplica middlewares
- Gerencia dependências

**Schema Layer (`app/schemas/`):**
- Valida dados de entrada
- Serializa dados de saída
- Define contratos de API
- Type hints para IDE

**Business Logic (`app/services/`):**
- Lógica de negócio
- Orquestração de operações
- Integrações externas
- Processamento de dados

**Data Layer (`app/models/`):**
- Modelos SQLAlchemy
- Relacionamentos entre entidades
- Queries ao banco de dados
- Constraints e validações de DB

---

## 📁 Arquitetura de Pastas

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py                  # Entry point da aplicação
│   │
│   ├── api/                     # API Layer
│   │   ├── __init__.py
│   │   └── api_v1/
│   │       ├── __init__.py
│   │       ├── api.py          # API router principal
│   │       └── endpoints/       # Endpoints por domínio
│   │           ├── auth.py              # Autenticação
│   │           ├── users.py             # Usuários
│   │           ├── accounts_payable.py  # Contas a Pagar
│   │           ├── accounts_receivable.py # Contas a Receber
│   │           ├── cash_flow.py         # Fluxo de Caixa
│   │           ├── products.py          # Produtos
│   │           ├── sales.py             # Vendas
│   │           ├── invoices.py          # Faturas
│   │           ├── suppliers.py         # Fornecedores
│   │           ├── marketplace.py       # Marketplace
│   │           ├── logistics.py         # Logística
│   │           ├── analytics.py         # Analytics
│   │           ├── inventory.py         # Inventário
│   │           ├── fiscal.py            # Fiscal
│   │           ├── integrations.py      # Integrações
│   │           ├── notifications.py     # Notificações
│   │           └── super_admin.py       # Super Admin
│   │
│   ├── core/                    # Core Layer
│   │   ├── __init__.py
│   │   ├── config.py           # Configurações (Settings)
│   │   ├── database.py         # Database connection
│   │   ├── security.py         # JWT, passwords
│   │   ├── deps.py             # Dependencies (auth, workspace)
│   │   └── encryption.py       # Field-level encryption
│   │
│   ├── models/                  # Data Layer (SQLAlchemy Models)
│   │   ├── __init__.py
│   │   ├── user.py
│   │   ├── workspace.py
│   │   ├── accounts_payable.py
│   │   ├── accounts_receivable.py
│   │   ├── cash_flow.py
│   │   ├── product.py
│   │   ├── sale.py
│   │   ├── invoice_model.py
│   │   ├── supplier_model.py
│   │   ├── batch.py             # Lotes
│   │   ├── warehouse.py         # Armazéns
│   │   ├── marketplace.py       # Marketplace integrations
│   │   ├── logistics.py         # Logistics (picking, packing)
│   │   ├── sales_pipeline.py    # Funil de vendas
│   │   ├── analytics.py         # Analytics e KPIs
│   │   ├── inventory.py         # Inventário
│   │   ├── automation.py        # Automações
│   │   ├── notification.py      # Notificações
│   │   └── fiscal_audit_log.py  # Auditoria fiscal
│   │
│   ├── schemas/                 # Schema Layer (Pydantic)
│   │   ├── __init__.py
│   │   ├── user.py
│   │   ├── workspace.py
│   │   ├── accounts_payable.py
│   │   ├── accounts_receivable.py
│   │   ├── cash_flow.py
│   │   ├── product.py
│   │   ├── sale.py
│   │   ├── invoice.py
│   │   ├── supplier.py
│   │   ├── fiscal.py
│   │   └── report.py
│   │
│   ├── services/                # Business Logic Layer
│   │   ├── ai_service.py           # Serviços de IA
│   │   ├── invoice_processor.py    # Processamento de faturas
│   │   ├── supplier_matcher.py     # Match de fornecedores
│   │   ├── demand_forecaster.py    # Previsão de demanda
│   │   ├── fiscal_service.py       # Serviços fiscais
│   │   ├── fiscal_validator.py     # Validação fiscal
│   │   ├── integration_service.py  # Integrações
│   │   ├── document_processor.py   # Processamento de docs
│   │   ├── data_cleaner.py         # Limpeza de dados
│   │   └── layout_lm_service.py    # LayoutLM (OCR/ML)
│   │
│   └── utils/                   # Utilities
│       └── file_utils.py        # File handling
│
├── migrations/                  # Alembic Migrations
│   ├── versions/
│   └── env.py
│
├── tests/                       # Testes
│   ├── __init__.py
│   └── test_*.py
│
├── main.py                      # FastAPI app initialization
├── requirements.txt             # Python dependencies
├── alembic.ini                  # Alembic config
└── .env                         # Environment variables
```

---

## 🎨 Padrões Arquiteturais

### 1. Dependency Injection

FastAPI usa injeção de dependência nativa para:

- Autenticação e autorização
- Conexão com banco de dados
- Isolamento multi-tenant
- Reutilização de código

**Exemplo:**

```python
from fastapi import Depends
from app.core.deps import get_current_user, get_workspace_id

@router.get("/products")
def list_products(
    workspace_id: int = Depends(get_workspace_id),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # workspace_id automaticamente extraído do token JWT
    products = db.query(Product).filter(
        Product.workspace_id == workspace_id
    ).all()
    return products
```

### 2. Repository Pattern (Implícito)

Embora não haja classes Repository explícitas, o padrão é seguido através de:

- **Models** = Data mappers (SQLAlchemy)
- **Endpoints** = Controllers
- **Queries** = Encapsuladas nos endpoints ou services

### 3. Multi-Tenancy por Design

TODAS as queries incluem automaticamente `workspace_id`:

```python
def get_workspace_id(current_user: User = Depends(get_current_user)) -> int:
    """
    Dependency que extrai workspace_id do usuário autenticado.
    Garante isolamento multi-tenant.
    """
    return current_user.workspace_id
```

### 4. Schema Validation

Pydantic valida TODOS os dados de entrada/saída:

```python
class ProductCreate(BaseModel):
    name: str
    sku: str
    sale_price: float = Field(gt=0)  # Deve ser > 0
    stock_quantity: int = Field(ge=0)  # Deve ser >= 0

@router.post("/products", response_model=ProductResponse)
def create_product(
    product: ProductCreate,  # Validado automaticamente
    workspace_id: int = Depends(get_workspace_id),
    db: Session = Depends(get_db)
):
    # Se chegou aqui, product está válido
    ...
```

### 5. Middleware Chain

```
Request
  ↓
CORS Middleware (HTTPS enforcement)
  ↓
HTTPSRedirectMiddleware (força HTTPS em redirects)
  ↓
Dependency: Security (Bearer token)
  ↓
Dependency: get_current_user (valida JWT)
  ↓
Dependency: get_workspace_id (extrai workspace)
  ↓
Endpoint Handler
  ↓
Response
```

---

## 🔄 Fluxo de Requisição

### Exemplo Completo: Criar Produto

```
1. Cliente → POST /api/v1/products
   Headers: Authorization: Bearer <token>
   Body: {"name": "Produto X", "sku": "PROD-001", ...}

2. FastAPI recebe request
   ↓
3. CORS Middleware valida origem
   ↓
4. HTTPSRedirectMiddleware garante HTTPS
   ↓
5. Dependency: security extrai token do header
   ↓
6. Dependency: get_current_user
   - Decodifica JWT
   - Busca user no DB
   - Verifica se está ativo
   ↓
7. Dependency: get_workspace_id
   - Extrai workspace_id do user
   ↓
8. Pydantic valida body (ProductCreate schema)
   ↓
9. Endpoint Handler:
   - Cria Product model
   - Define workspace_id
   - Salva no DB
   - Retorna ProductResponse
   ↓
10. FastAPI serializa response (Pydantic)
   ↓
11. Cliente ← 201 Created + JSON response
```

---

## ⚙️ Configurações

### Settings (app/core/config.py)

```python
class Settings(BaseSettings):
    PROJECT_NAME: str = "Orion ERP"
    VERSION: str = "2.0.0"
    API_V1_STR: str = "/api/v1"

    # CORS
    BACKEND_CORS_ORIGINS: str = "http://localhost:3000,..."

    # Database
    POSTGRES_SERVER: str
    POSTGRES_USER: str
    POSTGRES_PASSWORD: str
    POSTGRES_DB: str
    POSTGRES_PORT: str

    @property
    def DATABASE_URL(self) -> str:
        return f"postgresql://{self.POSTGRES_USER}:..."

    # Security - JWT
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # Encryption (field-level para dados sensíveis)
    ENCRYPTION_KEY: str

    # OAuth Integrations
    MERCADOLIVRE_CLIENT_ID: str
    MERCADOLIVRE_CLIENT_SECRET: str
    TIKTOKSHOP_APP_KEY: str
    TIKTOKSHOP_APP_SECRET: str

    class Config:
        env_file = ".env"
```

**Configurações carregadas de `.env`** com fallback para valores padrão.

---

## 🔌 Dependências e Injeção

### Dependencies Principais (app/core/deps.py)

#### 1. get_current_user

```python
def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    """
    Extrai e valida JWT token do header Authorization.
    Retorna User autenticado.

    Raises:
        HTTPException 401: Token inválido
        HTTPException 403: User inativo
    """
    token = credentials.credentials
    payload = decode_token(token)  # Valida e decodifica JWT

    if payload.get("type") != "access":
        raise HTTPException(401, "Invalid token type")

    user_id = payload.get("user_id")
    user = db.query(User).filter(User.id == user_id).first()

    if not user or not user.active:
        raise HTTPException(403, "Inactive user")

    return user
```

#### 2. get_workspace_id

```python
def get_workspace_id(current_user: User = Depends(get_current_user)) -> int:
    """
    Extrai workspace_id do usuário autenticado.
    Garante isolamento multi-tenant em TODAS as queries.
    """
    return current_user.workspace_id
```

#### 3. get_current_super_admin

```python
def get_current_super_admin(
    current_user: User = Depends(get_current_user)
) -> User:
    """
    Verifica se user é super_admin.

    Raises:
        HTTPException 403: Se não for super admin
    """
    if current_user.role != "super_admin":
        raise HTTPException(403, "Super admin access required")
    return current_user
```

### Uso nos Endpoints

```python
@router.get("/sensitive-data")
def get_sensitive_data(
    current_user: User = Depends(get_current_super_admin),  # Apenas super admins
    db: Session = Depends(get_db)
):
    # Se chegou aqui, user É super admin
    ...

@router.get("/products")
def list_products(
    workspace_id: int = Depends(get_workspace_id),  # Isolamento automático
    db: Session = Depends(get_db)
):
    # workspace_id já vem do JWT, não pode ser falsificado
    products = db.query(Product).filter(
        Product.workspace_id == workspace_id
    ).all()
    return products
```

---

## 📊 API Router Structure

### Main Router (app/api/api_v1/api.py)

```python
api_router = APIRouter()

# Authentication
api_router.include_router(auth.router, prefix="/auth", tags=["authentication"])

# Core entities
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(products.router, prefix="/products", tags=["products"])
api_router.include_router(sales.router, prefix="/sales", tags=["sales"])

# Financeiro
api_router.include_router(accounts_payable.router, prefix="/accounts-payable", ...)
api_router.include_router(accounts_receivable.router, prefix="/accounts-receivable", ...)
api_router.include_router(cash_flow.router, prefix="/cash-flow", ...)

# Estoque
api_router.include_router(stock_movements.router, prefix="/stock", ...)
api_router.include_router(inventory.router, prefix="/inventory", ...)
api_router.include_router(stock_reports.router, prefix="/stock-reports", ...)

# Vendas
api_router.include_router(marketplace.router, prefix="/marketplace", ...)
api_router.include_router(logistics.router, prefix="/logistics", ...)
api_router.include_router(sales_pipeline.router, prefix="/sales-pipeline", ...)

# Outros
api_router.include_router(notifications.router, prefix="/notifications", ...)
api_router.include_router(fiscal.router, prefix="/fiscal", ...)
api_router.include_router(integrations.router, prefix="/integrations", ...)
api_router.include_router(super_admin.router, prefix="/super-admin", ...)
```

**Todas as rotas são prefixadas com `/api/v1`** no `main.py`:

```python
app.include_router(api_router, prefix="/api/v1")
```

---

## 🔒 Segurança

### Multi-Layered Security

1. **HTTPS Enforcement**: Middleware força HTTPS em todos os redirects
2. **CORS**: Configurado para permitir apenas origens autorizadas
3. **JWT**: Tokens assinados e com expiração
4. **Bcrypt**: Senhas hasheadas com salt
5. **Field Encryption**: Dados sensíveis (API keys fiscais) criptografados
6. **Row-Level Security**: workspace_id em TODAS as queries
7. **Role-Based Access**: super_admin, admin, member

---

## 📖 Próximos Passos

- [Modelos de Banco de Dados](modelos-banco-dados.md)
- [Referência de API](../06-api/referencia-endpoints.md)
- [Multi-Tenancy](multi-tenancy.md)
- [Autenticação JWT](autenticacao-jwt.md)

---

**Última atualização:** 04/11/2025 | **Versão:** 2.0.0
