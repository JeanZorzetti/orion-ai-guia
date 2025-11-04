# Multi-tenancy no Orion ERP

> **Importante**: Esta documentação descreve como o sistema de multi-tenancy está REALMENTE implementado no Orion ERP, baseado no código em produção.

## Índice

1. [Conceito e Arquitetura](#1-conceito-e-arquitetura)
2. [Modelo de Dados](#2-modelo-de-dados)
3. [Isolamento de Dados](#3-isolamento-de-dados)
4. [Implementação em Código](#4-implementação-em-código)
5. [Fluxo de Autenticação](#5-fluxo-de-autenticação)
6. [Segurança e Prevenção de Vazamento](#6-segurança-e-prevenção-de-vazamento)
7. [Cascade Delete e Integridade](#7-cascade-delete-e-integridade)
8. [Melhores Práticas](#8-melhores-práticas)

---

## 1. Conceito e Arquitetura

### O que é Multi-tenancy?

Multi-tenancy (multi-inquilino) é uma arquitetura onde **uma única instância da aplicação serve múltiplos clientes (tenants)**, cada um com seus dados completamente isolados dos demais.

No Orion ERP:
- **Tenant = Workspace** (empresa/organização)
- Cada workspace possui seus próprios usuários, produtos, vendas, etc.
- Os dados são fisicamente armazenados na mesma base de dados
- O isolamento é garantido através de **Row-Level Security** via `workspace_id`

### Modelo Escolhido: Shared Database, Shared Schema

```
┌─────────────────────────────────────────────────┐
│              PostgreSQL Database                │
├─────────────────────────────────────────────────┤
│                                                 │
│  ┌──────────────┐  ┌──────────────┐            │
│  │  workspaces  │  │    users     │            │
│  ├──────────────┤  ├──────────────┤            │
│  │ id: 1        │←─┤workspace_id:1│            │
│  │ name: ABC    │  │email: user@..│            │
│  └──────────────┘  └──────────────┘            │
│                                                 │
│  ┌──────────────┐  ┌──────────────┐            │
│  │  products    │  │    sales     │            │
│  ├──────────────┤  ├──────────────┤            │
│  │workspace_id:1│  │workspace_id:1│            │
│  │sku: PROD-001 │  │total: 100.00 │            │
│  ├──────────────┤  ├──────────────┤            │
│  │workspace_id:2│  │workspace_id:2│            │
│  │sku: PROD-001 │  │total: 200.00 │            │
│  └──────────────┘  └──────────────┘            │
│                                                 │
└─────────────────────────────────────────────────┘
```

**Vantagens:**
- ✅ Gestão simplificada (uma única base de dados)
- ✅ Backups e manutenção centralizados
- ✅ Custo operacional reduzido
- ✅ Facilita análises cross-tenant (super admin)
- ✅ Facilita rollout de features

**Desvantagens:**
- ⚠️ Risco de vazamento de dados se implementado incorretamente
- ⚠️ Não há isolamento físico entre tenants
- ⚠️ Performance pode ser afetada por um tenant específico

---

## 2. Modelo de Dados

### Workspace - O Modelo Central

Localização: [backend/app/models/workspace.py](backend/app/models/workspace.py:7-137)

```python
class Workspace(Base):
    """
    Workspace model - Central para multi-tenancy.
    Cada workspace representa uma empresa/organização isolada.
    """
    __tablename__ = "workspaces"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    slug = Column(String, unique=True, nullable=False, index=True)
    active = Column(Boolean, default=True, nullable=False)

    # Dados Fiscais
    cnpj = Column(String(14), nullable=True)
    razao_social = Column(String(255), nullable=True)
    nome_fantasia = Column(String(255), nullable=True)
    inscricao_estadual = Column(String(20), nullable=True)
    regime_tributario = Column(Integer, nullable=True)

    # Configurações de NF-e
    nfe_serie = Column(Integer, default=1)
    nfe_next_number = Column(Integer, default=1)
    nfe_ambiente = Column(Integer, default=2)

    # Integrações (OAuth tokens criptografados)
    integration_shopify_api_key = Column(String(500), nullable=True)
    integration_mercadolivre_access_token = Column(String(500), nullable=True)
    integration_tiktokshop_access_token = Column(String(500), nullable=True)
    # ... mais integrações
```

**Características:**
- ID único e sequencial
- Slug único para URLs amigáveis
- Armazena configurações fiscais da empresa
- Armazena credenciais de integrações (criptografadas)
- 30+ relacionamentos com cascade delete

---

### User - Vínculo com Workspace

Localização: [backend/app/models/user.py](backend/app/models/user.py:7-34)

```python
class User(Base):
    """
    User model - Usuários do sistema.
    Cada usuário pertence a um workspace (multi-tenant).
    """
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    workspace_id = Column(Integer, ForeignKey("workspaces.id"), nullable=False, index=True)
    email = Column(String, unique=True, nullable=False, index=True)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=False)
    role = Column(String, default="user", nullable=False)  # user, admin, super_admin
    active = Column(Boolean, default=True, nullable=False)

    # Relacionamentos
    workspace = relationship("Workspace", back_populates="users", foreign_keys=[workspace_id])
```

**Pontos-chave:**
- `workspace_id` é **obrigatório** (NOT NULL)
- Foreign key para `workspaces.id`
- Índice em `workspace_id` para performance
- Email único globalmente (não por workspace)
- Role `super_admin` pode acessar todos os workspaces

---

### Padrão em Todos os Modelos

**Todos os 52 modelos** do sistema seguem o mesmo padrão:

```python
class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    workspace_id = Column(Integer, ForeignKey("workspaces.id"), nullable=False, index=True)
    # ... outros campos

    workspace = relationship("Workspace", back_populates="products")
```

**Exemplos de modelos com workspace_id:**
- `Product` (produtos)
- `Sale` (vendas)
- `AccountsPayableInvoice` (contas a pagar)
- `AccountsReceivable` (contas a receber)
- `BankAccount` (contas bancárias)
- `CashFlowTransaction` (transações)
- `ProductBatch` (lotes)
- `StockAdjustment` (ajustes de estoque)
- `MarketplaceIntegration` (integrações)
- `Notification` (notificações)
- ... **todos os 52 modelos**

---

## 3. Isolamento de Dados

### Níveis de Isolamento

#### Nível 1: Foreign Key Constraint
```sql
ALTER TABLE products
ADD CONSTRAINT fk_products_workspace
FOREIGN KEY (workspace_id) REFERENCES workspaces(id);
```

- Garante que `workspace_id` sempre aponta para workspace válido
- Previne orphan records

#### Nível 2: Índice para Performance
```python
workspace_id = Column(Integer, ForeignKey("workspaces.id"), nullable=False, index=True)
```

- Índice B-tree em `workspace_id`
- Otimiza consultas filtradas por workspace
- Essencial para performance em escala

#### Nível 3: Application-Level Filtering
```python
# Em TODOS os endpoints
def get_products(
    workspace_id: int = Depends(get_workspace_id),
    db: Session = Depends(get_db)
):
    products = db.query(Product).filter(Product.workspace_id == workspace_id).all()
    return products
```

- **TODAS as queries incluem filtro por workspace_id**
- Extraído automaticamente do JWT
- Não depende de input do usuário

#### Nível 4: Cascade Delete
```python
workspace = relationship("Workspace", back_populates="products", cascade="all, delete-orphan")
```

- Deletar workspace → deleta TODOS os dados associados
- Garante integridade referencial
- Previne dados órfãos

---

### Unique Constraints Scoped to Workspace

Para campos que devem ser únicos dentro do workspace (mas podem repetir entre workspaces):

```python
from sqlalchemy import UniqueConstraint

class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True)
    workspace_id = Column(Integer, ForeignKey("workspaces.id"), nullable=False)
    sku = Column(String, nullable=False)

    __table_args__ = (
        UniqueConstraint('workspace_id', 'sku', name='uq_workspace_product_sku'),
    )
```

**Exemplo:**
- Workspace 1: Produto SKU "CAM-001" ✅
- Workspace 2: Produto SKU "CAM-001" ✅
- Workspace 1: Outro produto SKU "CAM-001" ❌ (duplicado)

---

## 4. Implementação em Código

### Dependency Injection Pattern

Localização: [backend/app/core/deps.py](backend/app/core/deps.py:96-109)

```python
def get_workspace_id(
    current_user: User = Depends(get_current_user)
) -> int:
    """
    Dependency to get the workspace_id from the current user.
    This enforces multi-tenant isolation.

    Args:
        current_user: Current user from get_current_user dependency

    Returns:
        workspace_id of the current user
    """
    return current_user.workspace_id
```

**Como funciona:**
1. `get_current_user` extrai usuário do JWT
2. `get_workspace_id` extrai `workspace_id` do usuário
3. Endpoint recebe `workspace_id` automaticamente
4. Usa para filtrar dados

---

### Uso em Endpoints

**Exemplo 1: Listar Produtos**

```python
@router.get("/", response_model=List[ProductResponse])
def get_products(
    skip: int = 0,
    limit: int = 100,
    workspace_id: int = Depends(get_workspace_id),  # ← Automático
    db: Session = Depends(get_db)
):
    products = db.query(Product)\
        .filter(Product.workspace_id == workspace_id)\  # ← Filtro obrigatório
        .offset(skip)\
        .limit(limit)\
        .all()
    return products
```

**Exemplo 2: Obter Produto por ID**

```python
@router.get("/{product_id}", response_model=ProductResponse)
def get_product(
    product_id: int,
    workspace_id: int = Depends(get_workspace_id),
    db: Session = Depends(get_db)
):
    product = db.query(Product)\
        .filter(
            Product.id == product_id,
            Product.workspace_id == workspace_id  # ← Previne acesso cross-tenant
        )\
        .first()

    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    return product
```

**Por que 404 ao invés de 403?**
- Retornar 403 revelaria que o recurso existe em outro workspace
- 404 mantém a ilusão de que o recurso não existe
- Segurança através de obscuridade adicional

---

### Criação de Recursos

**Sempre atribui workspace_id automaticamente:**

```python
@router.post("/", response_model=ProductResponse, status_code=201)
def create_product(
    product_data: ProductCreate,
    workspace_id: int = Depends(get_workspace_id),
    db: Session = Depends(get_db)
):
    # Cria produto com workspace_id do usuário autenticado
    db_product = Product(
        **product_data.dict(),
        workspace_id=workspace_id  # ← Atribuído automaticamente
    )

    db.add(db_product)
    db.commit()
    db.refresh(db_product)

    return db_product
```

**Segurança:**
- Usuário **NUNCA** envia `workspace_id` no request body
- `workspace_id` sempre vem do JWT
- Impossível criar recurso em workspace de outro tenant

---

### Updates e Deletes

**Sempre valida ownership antes de modificar:**

```python
@router.put("/{product_id}", response_model=ProductResponse)
def update_product(
    product_id: int,
    product_update: ProductUpdate,
    workspace_id: int = Depends(get_workspace_id),
    db: Session = Depends(get_db)
):
    # Busca produto COM filtro de workspace
    product = db.query(Product)\
        .filter(
            Product.id == product_id,
            Product.workspace_id == workspace_id
        )\
        .first()

    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    # Atualiza apenas campos enviados
    for field, value in product_update.dict(exclude_unset=True).items():
        setattr(product, field, value)

    db.commit()
    db.refresh(product)

    return product
```

---

## 5. Fluxo de Autenticação

### Passo 1: Login

```http
POST /api/v1/auth/token
Content-Type: application/json

{
  "email": "user@empresa.com",
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

### Passo 2: Conteúdo do JWT

**Payload do Access Token:**
```json
{
  "user_id": 10,
  "email": "user@empresa.com",
  "workspace_id": 5,
  "role": "admin",
  "type": "access",
  "exp": 1737045600
}
```

**Importante:**
- `workspace_id` está **EMBUTIDO no token**
- Não pode ser alterado sem reautenticação
- Assinado com SECRET_KEY do servidor

### Passo 3: Requisições Subsequentes

```http
GET /api/v1/products/
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

**Fluxo interno:**
1. Middleware valida JWT
2. `get_current_user` decodifica token → extrai `user_id`
3. Busca usuário no banco → obtém `workspace_id`
4. `get_workspace_id` retorna `workspace_id`
5. Endpoint filtra por `workspace_id`

---

## 6. Segurança e Prevenção de Vazamento

### Ameaças e Mitigações

#### Ameaça 1: Manipulação de workspace_id no Request
**Ataque:**
```json
POST /api/v1/products/
{
  "name": "Produto",
  "workspace_id": 999  // ← Tentativa de injetar workspace_id
}
```

**Mitigação:**
```python
# Schema NÃO inclui workspace_id
class ProductCreate(BaseModel):
    name: str
    sku: str
    # workspace_id: int  ← NÃO ESTÁ NO SCHEMA

# Endpoint ignora qualquer workspace_id enviado
workspace_id=workspace_id  # ← Sempre do JWT
```

---

#### Ameaça 2: JWT Token Roubado
**Ataque:**
- Atacante intercepta JWT de Workspace A
- Tenta usar para acessar dados de Workspace B

**Mitigação:**
- `workspace_id` embutido no token (imutável)
- Todas as queries filtram por `workspace_id` do token
- Impossível acessar dados de outro workspace mesmo com token válido

---

#### Ameaça 3: SQL Injection em workspace_id
**Ataque:**
```python
# Código vulnerável (NÃO USADO)
query = f"SELECT * FROM products WHERE workspace_id = {workspace_id}"
```

**Mitigação:**
```python
# SQLAlchemy usa prepared statements
db.query(Product).filter(Product.workspace_id == workspace_id)

# SQL gerado:
# SELECT * FROM products WHERE workspace_id = ? [5]
```

- Todos os parâmetros são sanitizados
- SQLAlchemy previne SQL injection por design

---

#### Ameaça 4: Esquecimento de Filtro
**Ataque:**
```python
# BUG: Desenvolvedor esquece de filtrar por workspace
def get_all_products(db: Session):
    return db.query(Product).all()  # ← PERIGOSO!
```

**Mitigação:**
- **Code review obrigatório**
- Testes unitários validam isolamento
- Logging de queries suspeitas (sem WHERE workspace_id)
- Ferramentas de análise estática (pylint, mypy)

**Proteção adicional futura:**
```python
# Query Interceptor (não implementado ainda)
@event.listens_for(Session, "before_execute")
def check_workspace_filter(conn, clauseelement, multiparams, params):
    if "workspaces" not in str(clauseelement) and "workspace_id" not in str(clauseelement):
        logger.warning(f"Query without workspace filter: {clauseelement}")
```

---

#### Ameaça 5: Privilege Escalation via Role
**Ataque:**
- Usuário tenta elevar role de `user` para `admin`

**Mitigação:**
```python
# Schema de update NÃO inclui role
class UserUpdate(BaseModel):
    full_name: Optional[str]
    email: Optional[str]
    # role: Optional[str]  ← NÃO PERMITIDO

# Apenas super_admin pode alterar roles
@router.patch("/{user_id}/role")
def update_user_role(
    user_id: int,
    new_role: str,
    current_user: User = Depends(get_current_super_admin)  # ← Requer super_admin
):
    # ...
```

---

## 7. Cascade Delete e Integridade

### Relacionamentos com Cascade

Localização: [backend/app/models/workspace.py](backend/app/models/workspace.py:89-133)

```python
class Workspace(Base):
    # Relacionamentos com cascade delete
    users = relationship("User", back_populates="workspace", cascade="all, delete-orphan")
    products = relationship("Product", back_populates="workspace", cascade="all, delete-orphan")
    sales = relationship("Sale", back_populates="workspace", cascade="all, delete-orphan")
    bank_accounts = relationship("BankAccount", back_populates="workspace", cascade="all, delete-orphan")
    # ... mais 30+ relacionamentos
```

### O que acontece ao deletar um Workspace?

```python
# Super Admin deleta workspace
workspace = db.query(Workspace).filter(Workspace.id == 5).first()
db.delete(workspace)
db.commit()
```

**Efeito cascata:**
```
Workspace (id=5)
  └─ User (15 usuários) → DELETADOS
  └─ Product (250 produtos) → DELETADOS
      └─ ProductBatch (100 lotes) → DELETADOS
      └─ StockAdjustment (500 ajustes) → DELETADOS
  └─ Sale (1250 vendas) → DELETADAS
      └─ SaleItem (5000 itens) → DELETADOS
  └─ BankAccount (3 contas) → DELETADAS
      └─ CashFlowTransaction (2500 transações) → DELETADAS
  └─ Notification (450 notificações) → DELETADAS
  └─ ... TODOS os dados do workspace
```

**Segurança:**
- Operação **irreversível**
- Apenas `super_admin` pode executar
- Recomenda-se backup antes de deletar
- Usa transação SQL (all-or-nothing)

---

### Soft Delete vs Hard Delete

**Hard Delete** (atual):
```python
db.delete(workspace)
db.commit()
# Dados removidos permanentemente do banco
```

**Soft Delete** (não implementado):
```python
workspace.deleted_at = datetime.utcnow()
workspace.active = False
db.commit()
# Dados permanecem no banco, mas invisíveis
```

**Recomendação para produção:**
- Implementar soft delete em workspaces
- Permite recuperação de dados
- Compliance com LGPD (direito ao esquecimento após período)

---

## 8. Melhores Práticas

### Para Desenvolvedores

#### ✅ DO: Sempre use Dependency Injection
```python
def my_endpoint(
    workspace_id: int = Depends(get_workspace_id),  # ← BOM
    db: Session = Depends(get_db)
):
    items = db.query(Item).filter(Item.workspace_id == workspace_id).all()
```

#### ❌ DON'T: Nunca aceite workspace_id de input do usuário
```python
# RUIM
def my_endpoint(workspace_id: int, db: Session = Depends(get_db)):
    items = db.query(Item).filter(Item.workspace_id == workspace_id).all()
```

---

#### ✅ DO: Sempre filtre por workspace_id em queries
```python
# BOM
product = db.query(Product).filter(
    Product.id == product_id,
    Product.workspace_id == workspace_id
).first()
```

#### ❌ DON'T: Nunca consulte apenas por ID
```python
# RUIM - vazamento de dados!
product = db.query(Product).filter(Product.id == product_id).first()
```

---

#### ✅ DO: Use schemas Pydantic sem workspace_id
```python
class ProductCreate(BaseModel):
    name: str
    sku: str
    # workspace_id não está aqui
```

#### ❌ DON'T: Não inclua workspace_id em schemas de input
```python
# RUIM
class ProductCreate(BaseModel):
    name: str
    workspace_id: int  # ← PERIGOSO
```

---

#### ✅ DO: Teste isolamento em testes unitários
```python
def test_user_cannot_access_other_workspace_products():
    # Cria workspace 1 com produto
    workspace1 = create_workspace()
    product1 = create_product(workspace_id=workspace1.id)

    # Cria workspace 2 com usuário
    workspace2 = create_workspace()
    user2 = create_user(workspace_id=workspace2.id)

    # Tenta acessar produto do workspace 1
    response = client.get(
        f"/products/{product1.id}",
        headers=get_auth_headers(user2)
    )

    # Deve retornar 404 (não 403)
    assert response.status_code == 404
```

---

### Para Arquitetos

#### Considere Row-Level Security (RLS) no PostgreSQL
```sql
-- Exemplo de RLS (não implementado atualmente)
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY workspace_isolation ON products
    USING (workspace_id = current_setting('app.current_workspace_id')::int);
```

**Vantagens:**
- Proteção no nível do banco de dados
- Impossível esquecer filtro no código
- Performance (índice sempre usado)

**Desvantagens:**
- Maior complexidade
- Debugging mais difícil
- Requer configuração de sessão em cada conexão

---

#### Monitore Queries sem Filtro de Workspace
```python
import logging
from sqlalchemy import event
from sqlalchemy.engine import Engine

@event.listens_for(Engine, "before_cursor_execute")
def receive_before_cursor_execute(conn, cursor, statement, parameters, context, executemany):
    if "SELECT" in statement and "workspaces" not in statement.lower():
        if "workspace_id" not in statement.lower():
            logger.warning(f"Potential data leak query: {statement[:100]}")
```

---

## Diagrama de Fluxo Completo

```
┌─────────────┐
│   Cliente   │
│ (Frontend)  │
└──────┬──────┘
       │ 1. POST /auth/token
       │    {email, password}
       ↓
┌─────────────────────────────┐
│     Auth Endpoint           │
│  ┌──────────────────────┐   │
│  │ Valida credenciais   │   │
│  │ Busca user no DB     │   │
│  │ user.workspace_id=5  │   │
│  └──────────────────────┘   │
│           │                 │
│           ↓                 │
│  ┌──────────────────────┐   │
│  │ Gera JWT com:        │   │
│  │ - user_id: 10        │   │
│  │ - workspace_id: 5    │   │
│  │ - role: admin        │   │
│  └──────────────────────┘   │
└──────────┬──────────────────┘
           │ 2. Retorna JWT
           ↓
┌─────────────┐
│   Cliente   │ (armazena JWT)
└──────┬──────┘
       │ 3. GET /products/
       │    Authorization: Bearer JWT
       ↓
┌─────────────────────────────────────┐
│     Middleware Chain                │
│  ┌──────────────────────────────┐   │
│  │ HTTPBearer verifica Bearer   │   │
│  └─────────────┬────────────────┘   │
│                ↓                    │
│  ┌──────────────────────────────┐   │
│  │ decode_token(JWT)            │   │
│  │ → payload.user_id = 10       │   │
│  └─────────────┬────────────────┘   │
│                ↓                    │
│  ┌──────────────────────────────┐   │
│  │ get_current_user(user_id=10) │   │
│  │ → User(workspace_id=5)       │   │
│  └─────────────┬────────────────┘   │
│                ↓                    │
│  ┌──────────────────────────────┐   │
│  │ get_workspace_id()           │   │
│  │ → workspace_id = 5           │   │
│  └─────────────┬────────────────┘   │
└────────────────┼────────────────────┘
                 │
                 ↓
┌─────────────────────────────────────┐
│     Products Endpoint               │
│  ┌──────────────────────────────┐   │
│  │ Query:                       │   │
│  │ SELECT * FROM products       │   │
│  │ WHERE workspace_id = 5       │   │
│  │ LIMIT 100                    │   │
│  └──────────────────────────────┘   │
└─────────────┬───────────────────────┘
              │ 4. Retorna produtos do workspace 5
              ↓
        ┌─────────────┐
        │   Cliente   │
        └─────────────┘
```

---

## Checklist de Segurança Multi-tenancy

### Desenvolvimento
- [ ] Todos os modelos possuem `workspace_id`?
- [ ] Todos os endpoints usam `Depends(get_workspace_id)`?
- [ ] Todas as queries filtram por `workspace_id`?
- [ ] Schemas Pydantic NÃO incluem `workspace_id`?
- [ ] Unique constraints são scoped ao workspace?
- [ ] Cascade delete configurado corretamente?
- [ ] Testes unitários validam isolamento?

### Code Review
- [ ] Nenhuma query esquece filtro de workspace?
- [ ] Nenhum endpoint aceita `workspace_id` de input?
- [ ] Retornos usam 404 (não 403) para recursos de outro workspace?
- [ ] Indexes em `workspace_id` para performance?

### Produção
- [ ] Monitoring de queries sem filtro workspace?
- [ ] Logs de acessos cross-tenant (deveria ser zero)?
- [ ] Backups regulares antes de deletar workspaces?
- [ ] Política de retenção de dados definida?

---

## Recursos Adicionais

### Arquivos Relevantes
- [backend/app/models/workspace.py](backend/app/models/workspace.py) - Modelo Workspace
- [backend/app/models/user.py](backend/app/models/user.py) - Modelo User
- [backend/app/core/deps.py](backend/app/core/deps.py:96-109) - Dependency Injection
- [backend/app/core/security.py](backend/app/core/security.py) - JWT encoding/decoding
- [backend/app/api/api_v1/endpoints/](backend/app/api/api_v1/endpoints/) - Todos os endpoints

### Referências Externas
- [SQLAlchemy: Working with Foreign Keys](https://docs.sqlalchemy.org/en/14/orm/relationship_api.html)
- [FastAPI: Dependencies](https://fastapi.tiangolo.com/tutorial/dependencies/)
- [PostgreSQL: Row Security Policies](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [OWASP: Multi-Tenancy Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Multitenant_Architecture_Cheat_Sheet.html)

---

**Versão:** 1.0
**Última atualização:** 2025-01-15
**Autor:** Documentação Orion ERP
