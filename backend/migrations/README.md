# Migração do Banco de Dados - Orion ERP

## Instruções para Migração Manual via pgweb

### Passo 1: Acessar o pgweb

1. Acesse seu pgweb
2. Conecte-se ao banco de dados PostgreSQL com as credenciais:
   - **Host**: `31.97.23.166`
   - **Port**: `5433`
   - **Database**: `orionerp`
   - **User**: `orionerp`
   - **Password**: `PAzo18**`

### Passo 2: Executar Scripts na Ordem

Execute os scripts SQL na seguinte ordem:

#### 1. Criar Tabelas (001_create_tables.sql)

```bash
# Abra o arquivo: backend/migrations/001_create_tables.sql
# Copie TODO o conteúdo
# Cole no pgweb e execute
```

**O que este script faz:**
- ✅ Cria 6 tabelas: `workspaces`, `users`, `suppliers`, `invoices`, `products`, `sales`
- ✅ Adiciona todos os indexes para performance
- ✅ Configura Foreign Keys para multi-tenant isolation
- ✅ Cria triggers para auto-update do campo `updated_at`
- ✅ Cria 1 workspace de demonstração

**Tempo estimado**: ~5 segundos

---

#### 2. Criar Usuário Admin (002_create_admin_user.sql)

```bash
# Abra o arquivo: backend/migrations/002_create_admin_user.sql
# Copie TODO o conteúdo
# Cole no pgweb e execute
```

**O que este script faz:**
- ✅ Cria workspace "Admin Workspace"
- ✅ Cria usuário administrador com credenciais:
  - **Email**: `admin@orion.com`
  - **Senha**: `admin123` (hasheada com bcrypt)

**Tempo estimado**: ~1 segundo

---

#### 3. Verificar Instalação (003_verify_installation.sql)

```bash
# Abra o arquivo: backend/migrations/003_verify_installation.sql
# Copie TODO o conteúdo
# Cole no pgweb e execute
```

**O que este script faz:**
- ✅ Lista todas as tabelas criadas
- ✅ Verifica Foreign Keys
- ✅ Lista indexes
- ✅ Conta registros em cada tabela
- ✅ Mostra o usuário admin criado
- ✅ Verifica triggers

**Tempo estimado**: ~2 segundos

---

### Passo 3: Verificar Resultados Esperados

Após executar o script de verificação, você deve ver:

#### Tabelas Criadas
| Tabela       | Colunas |
|--------------|---------|
| workspaces   | 6       |
| users        | 9       |
| suppliers    | 12      |
| invoices     | 13      |
| products     | 13      |
| sales        | 11      |

#### Foreign Keys (Multi-tenant)
Todas as tabelas (exceto `workspaces`) devem ter `workspace_id` referenciando `workspaces.id`

#### Dados Iniciais
- **Workspaces**: 2 registros (empresa-demo, admin-workspace)
- **Users**: 1 registro (admin@orion.com)
- **Outras tabelas**: 0 registros

---

### Passo 4: Testar Login

Após a migração, você pode testar o login via API:

```bash
POST http://localhost:8000/api/v1/auth/token
Content-Type: application/json

{
  "email": "admin@orion.com",
  "password": "admin123"
}
```

**Resposta esperada**:
```json
{
  "access_token": "eyJ...",
  "refresh_token": "eyJ...",
  "token_type": "bearer"
}
```

---

## Estrutura Multi-Tenant

### Como Funciona

Cada tabela de dados (users, suppliers, invoices, products, sales) possui:
- Campo `workspace_id` (Foreign Key para `workspaces.id`)
- Index em `workspace_id` para performance
- Constraints CASCADE para manter integridade

### Isolamento de Dados

```sql
-- Exemplo: Buscar produtos do workspace do usuário logado
SELECT * FROM products
WHERE workspace_id = <workspace_id_do_usuario_logado>;
```

### Diagrama de Relacionamentos

```
workspaces (1)
    ├── users (N)
    ├── suppliers (N)
    ├── invoices (N)
    ├── products (N)
    └── sales (N)

suppliers (1)
    └── invoices (N)

products (1)
    └── sales (N)
```

---

## Troubleshooting

### Erro: "relation already exists"
**Solução**: As tabelas já foram criadas. Você pode:
1. Executar apenas o script 002 (criar admin)
2. Ou dropar as tabelas e recriar tudo

### Erro: "duplicate key value violates unique constraint"
**Solução**: O usuário admin já existe. Isso é normal se você executar o script 002 mais de uma vez.

### Erro de conexão
**Solução**: Verifique se:
- O PostgreSQL está rodando
- As credenciais estão corretas
- A porta 5433 está acessível

---

## Próximos Passos

Após a migração bem-sucedida:

1. ✅ Banco de dados configurado
2. ▶️ Testar API localmente
3. ▶️ Implementar frontend Next.js
4. ▶️ Deploy para produção

---

## Arquivos da Migração

- `001_create_tables.sql` - Cria todas as tabelas e estrutura
- `002_create_admin_user.sql` - Cria usuário administrador
- `003_verify_installation.sql` - Verifica a instalação
- `README.md` - Este arquivo (instruções)

---

## Credenciais do Banco (Easypanel)

**Internal Connection** (dentro do Docker):
```
postgres://orionerp:PAzo18**@dados_orionerp:5432/orionerp?sslmode=disable
```

**External Connection** (acesso externo):
```
postgres://orionerp:PAzo18**@31.97.23.166:5433/orionerp?sslmode=disable
```

---

**Dúvidas?** Entre em contato com o time de desenvolvimento.
