# 🚀 GUIA DE EXECUÇÃO - Migration 012: Accounts Receivable

## 📋 PRÉ-REQUISITOS

Antes de executar a migration, certifique-se de que:

- ✅ Backend está parado (para evitar conflitos)
- ✅ Banco de dados PostgreSQL está rodando
- ✅ Você tem as credenciais de acesso ao banco
- ✅ Python 3.9+ está instalado
- ✅ Dependências do backend estão instaladas

---

## 🎯 OPÇÃO 1: Executar via Python (Recomendado)

### Passo 1: Navegar até a pasta de migrations

```powershell
cd "C:\Users\jeanz\OneDrive\Desktop\ROI Labs\ERP\backend\migrations"
```

### Passo 2: Executar o script Python

```powershell
py apply_migration_012.py
```

### Output Esperado:

```
============================================================
🗄️  Orion ERP - Migration 012: Accounts Receivable
============================================================

✅ Imports carregados com sucesso
🔌 Conectando ao banco de dados...
✅ Conectado com sucesso!
🚀 Executando migration 012...
✅ Migration 012 aplicada com sucesso!

📊 Verificando resultados:
   ✅ Tabela 'accounts_receivable' criada
   ✅ 32 colunas criadas
   ✅ 8 índices criados
   ✅ 3 triggers criados
   ✅ 6 constraints criados

🎉 Migration 012 concluída com sucesso!

📝 Próximos passos:
   1. Reiniciar o backend (se estiver rodando)
   2. Testar os endpoints em: http://localhost:8000/docs
   3. Verificar: GET /api/v1/accounts-receivable/
```

### Se der erro de import:

```powershell
# Instalar dependências
cd ..\
py -m pip install sqlalchemy psycopg2-binary python-dotenv
cd migrations
py apply_migration_012.py
```

---

## 🎯 OPÇÃO 2: Executar via psql

### Passo 1: Abrir PowerShell/CMD

### Passo 2: Executar via psql

```powershell
# Substitua pelos seus dados
psql -h localhost -U seu_usuario -d orion_erp -f "C:\Users\jeanz\OneDrive\Desktop\ROI Labs\ERP\backend\migrations\migration_012_accounts_receivable.sql"
```

Você será solicitado a digitar a senha do PostgreSQL.

### Output esperado:

```
CREATE TABLE
CREATE INDEX
CREATE INDEX
...
NOTICE:  ✅ Tabela accounts_receivable criada com sucesso
NOTICE:  ✅ Índices criados com sucesso
NOTICE:  ✅ Triggers criados com sucesso
NOTICE:  🎉 Migration 012 concluída com sucesso!
```

---

## 🎯 OPÇÃO 3: Executar via PgAdmin/DBeaver

### Passo 1: Abrir PgAdmin ou DBeaver

### Passo 2: Conectar ao banco `orion_erp`

### Passo 3: Abrir Query Tool/SQL Editor

### Passo 4: Carregar o arquivo

```
C:\Users\jeanz\OneDrive\Desktop\ROI Labs\ERP\backend\migrations\migration_012_accounts_receivable.sql
```

### Passo 5: Executar (F5 ou botão Run)

### Passo 6: Verificar mensagens

Você verá mensagens como:
- `✅ Tabela accounts_receivable criada com sucesso`
- `✅ Índices criados com sucesso`
- `🎉 Migration 012 concluída com sucesso!`

---

## ✅ VERIFICAÇÃO PÓS-MIGRATION

### 1. Verificar se a tabela foi criada

```sql
SELECT table_name, table_type
FROM information_schema.tables
WHERE table_name = 'accounts_receivable';
```

### 2. Verificar colunas

```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'accounts_receivable'
ORDER BY ordinal_position;
```

### 3. Verificar índices

```sql
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'accounts_receivable';
```

### 4. Verificar triggers

```sql
SELECT trigger_name, event_manipulation, action_timing
FROM information_schema.triggers
WHERE event_object_table = 'accounts_receivable';
```

### 5. Teste rápido de INSERT

```sql
-- Inserir um registro de teste (ajuste o workspace_id)
INSERT INTO accounts_receivable (
    workspace_id, document_number, customer_name,
    issue_date, due_date, value
) VALUES (
    1, 'TEST-001', 'Cliente Teste',
    CURRENT_DATE, CURRENT_DATE + INTERVAL '30 days', 1000.00
);

-- Verificar se foi criado
SELECT id, document_number, customer_name, value, status, days_overdue, net_value
FROM accounts_receivable
WHERE document_number = 'TEST-001';

-- Deletar o teste
DELETE FROM accounts_receivable WHERE document_number = 'TEST-001';
```

---

## 🚀 TESTAR OS ENDPOINTS

### 1. Iniciar o backend

```powershell
cd "C:\Users\jeanz\OneDrive\Desktop\ROI Labs\ERP\backend"
py -m uvicorn app.main:app --reload
```

### 2. Acessar Swagger UI

Abra no navegador:
```
http://localhost:8000/docs
```

### 3. Testar os endpoints

Na seção **accounts-receivable**, você verá 11 endpoints:

#### CRUD:
- `GET /api/v1/accounts-receivable/` - Listar
- `GET /api/v1/accounts-receivable/{id}` - Buscar
- `POST /api/v1/accounts-receivable/` - Criar
- `PATCH /api/v1/accounts-receivable/{id}` - Atualizar
- `DELETE /api/v1/accounts-receivable/{id}` - Deletar

#### Pagamentos:
- `POST /api/v1/accounts-receivable/{id}/receive` - Registrar recebimento
- `POST /api/v1/accounts-receivable/{id}/partial-payment` - Pagamento parcial

#### Analytics:
- `GET /api/v1/accounts-receivable/analytics/summary` - KPIs
- `GET /api/v1/accounts-receivable/analytics/aging` - Aging report
- `GET /api/v1/accounts-receivable/analytics/by-customer` - Por cliente
- `GET /api/v1/accounts-receivable/analytics/overdue` - Vencidas

### 4. Criar uma conta a receber de teste

Clique em `POST /api/v1/accounts-receivable/` → "Try it out"

JSON de exemplo:

```json
{
  "document_number": "NF-2025-001",
  "customer_name": "Empresa ABC Ltda",
  "customer_document": "12.345.678/0001-90",
  "customer_email": "contato@empresaabc.com",
  "customer_phone": "(11) 98765-4321",
  "issue_date": "2025-01-30",
  "due_date": "2025-02-28",
  "value": 5000.00,
  "description": "Venda de produtos - Pedido #1234",
  "payment_method": "boleto",
  "category": "Vendas",
  "tags": ["venda", "produtos"]
}
```

Execute → Você deve receber um `201 Created` com o registro criado.

---

## ⚠️ TROUBLESHOOTING

### Erro: "No module named 'app'"

**Solução:**
```powershell
cd backend
set PYTHONPATH=%CD%
py migrations\apply_migration_012.py
```

### Erro: "could not connect to database"

**Solução:**
1. Verifique se o PostgreSQL está rodando
2. Verifique o arquivo `.env` ou `.env.production` no backend
3. Confirme as credenciais: host, port, database, user, password

### Erro: "relation already exists"

**Solução:**
A tabela já foi criada. Você pode:
1. Ignorar (tudo ok)
2. Ou dropar e recriar:

```sql
DROP TABLE IF EXISTS accounts_receivable CASCADE;
-- Depois execute a migration novamente
```

### Erro: "permission denied"

**Solução:**
O usuário do PostgreSQL não tem permissões. Execute como superuser:

```sql
-- Conectar como postgres
psql -U postgres -d orion_erp

-- Dar permissões
GRANT ALL PRIVILEGES ON DATABASE orion_erp TO seu_usuario;
GRANT ALL ON ALL TABLES IN SCHEMA public TO seu_usuario;
```

---

## 📊 STATUS DO PROJETO

Após aplicar a migration, a estrutura ficará:

```
📦 orion_erp (database)
├── 📋 workspaces
├── 👤 users
├── 🏢 suppliers
├── 📄 invoices
├── 📦 products
├── 🛒 sales
└── 💰 accounts_receivable  ← NOVO!
    ├── 🔑 8 índices otimizados
    ├── ⚡ 3 triggers automáticos
    ├── 🔒 6 constraints
    └── 📊 2 views de analytics
```

---

## 🎯 PRÓXIMOS PASSOS

Depois que a migration estiver aplicada:

1. ✅ Testar todos os endpoints no Swagger
2. ✅ Criar algumas contas a receber de teste
3. ✅ Testar analytics e aging reports
4. ✅ Verificar performance dos índices
5. 🚀 Continuar para **Fase 2**: APIs de Fluxo de Caixa

Ou:

6. 🎨 Começar **Fase 3**: Integração do Frontend

---

## 📞 SUPORTE

Se encontrar problemas:

1. Verifique os logs do backend
2. Consulte o arquivo `ROADMAP_FINANCEIRO_INTEGRACAO.md`
3. Revise a documentação da migration no próprio arquivo SQL

---

**Boa sorte! 🚀**

---

**Última atualização:** 2025-01-30
**Migration:** 012_accounts_receivable
**Status:** Pronta para execução ✅
