# Migração 004 - Fix Product SKU Constraint

## Problema

O campo `sku` na tabela `products` tem uma constraint `UNIQUE` global, o que causa erro quando múltiplos produtos têm SKU vazio (`''`), pois o PostgreSQL considera todos como duplicados.

**Erro:**
```
sqlalchemy.exc.IntegrityError: duplicate key value violates unique constraint "products_sku_key"
DETAIL:  Key (sku)=() already exists.
```

## Solução

1. Remover a constraint `UNIQUE` global do SKU
2. Converter todos os SKUs vazios para `NULL` (PostgreSQL permite múltiplos NULLs em constraints UNIQUE)
3. Criar uma constraint `UNIQUE` composta `(workspace_id, sku)` para garantir que SKUs sejam únicos **por workspace**

## Como Aplicar (no servidor Easypanel)

### Opção 1: Via Script Python (Recomendado)

1. Faça SSH no servidor Easypanel
2. Entre no container do backend:
   ```bash
   docker exec -it <container_name> bash
   ```
3. Execute o script de migração:
   ```bash
   python apply_migration_004.py
   ```

### Opção 2: Via SQL Direto (Manual)

1. Conecte ao banco de dados PostgreSQL:
   ```bash
   psql postgresql://orionerp:PAzo18**@dados_orionerp:5432/orionerp
   ```

2. Execute os seguintes comandos SQL:

```sql
-- 1. Remover a constraint antiga
ALTER TABLE products DROP CONSTRAINT IF EXISTS products_sku_key;

-- 2. Converter SKUs vazios para NULL
UPDATE products SET sku = NULL WHERE sku = '';

-- 3. Criar nova constraint composta
ALTER TABLE products
ADD CONSTRAINT uq_workspace_sku
UNIQUE (workspace_id, sku);

-- 4. Verificar (opcional)
SELECT
    COUNT(*) as total_products,
    COUNT(sku) as products_with_sku,
    COUNT(*) - COUNT(sku) as products_without_sku
FROM products;
```

### Opção 3: Via Easypanel UI

1. Acesse o painel do Easypanel
2. Vá para o serviço PostgreSQL
3. Abra o console SQL
4. Execute os comandos SQL da Opção 2

## Verificação

Após aplicar a migração, verifique se:

1. ✅ Você consegue criar múltiplos produtos com SKU vazio no mesmo workspace
2. ✅ SKUs únicos continuam funcionando (não pode ter dois produtos com mesmo SKU não-vazio no mesmo workspace)
3. ✅ Workspaces diferentes podem ter produtos com o mesmo SKU

## Teste Manual

```bash
# Criar produto 1 com SKU vazio - deve funcionar
curl -X POST "https://orionback.roilabs.com.br/api/v1/products/" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Produto Teste 1",
    "sku": "",
    "sale_price": 10.0,
    "stock_quantity": 5
  }'

# Criar produto 2 com SKU vazio - deve funcionar também
curl -X POST "https://orionback.roilabs.com.br/api/v1/products/" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Produto Teste 2",
    "sku": "",
    "sale_price": 20.0,
    "stock_quantity": 10
  }'

# Criar produto 3 com SKU "ABC123" - deve funcionar
curl -X POST "https://orionback.roilabs.com.br/api/v1/products/" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Produto Teste 3",
    "sku": "ABC123",
    "sale_price": 30.0,
    "stock_quantity": 15
  }'

# Criar produto 4 com SKU "ABC123" - deve FALHAR (SKU duplicado)
curl -X POST "https://orionback.roilabs.com.br/api/v1/products/" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Produto Teste 4",
    "sku": "ABC123",
    "sale_price": 40.0,
    "stock_quantity": 20
  }'
```

## Arquivos Modificados

- ✅ `backend/app/models/product.py` - Adicionada constraint composta `uq_workspace_sku`
- ✅ `backend/app/api/api_v1/endpoints/products.py` - Conversão de SKU vazio para NULL em CREATE e UPDATE
- ✅ `backend/migrations/004_fix_product_sku_constraint.sql` - SQL da migração
- ✅ `backend/apply_migration_004.py` - Script Python para aplicar migração

## Status

- ⏳ **Pendente:** Aplicar migração no servidor de produção
- ✅ **Completo:** Código atualizado e commitado no Git
