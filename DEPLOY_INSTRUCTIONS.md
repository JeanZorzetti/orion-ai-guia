# Instruções de Deploy - Orion ERP

## Problema Atual

❌ **CORS Error:** Backend no Easypanel não tem o novo endpoint `/generate-fake-sales`

**Causa:** Código não foi atualizado no servidor de produção após o commit.

## Solução: Atualizar Backend no Easypanel

### Opção 1: Via Interface Easypanel (Recomendado)

1. Acesse o dashboard do Easypanel: https://easypanel.roilabs.com.br
2. Localize o serviço do **Backend** (Orion ERP API)
3. Vá para a aba **"Deploy"** ou **"Build"**
4. Clique em **"Redeploy"** ou **"Rebuild"**
5. Aguarde o build completar (2-5 minutos)
6. Verifique os logs para confirmar que iniciou sem erros

### Opção 2: Via SSH (Manual)

```bash
# 1. Conectar ao servidor
ssh usuario@31.97.23.166

# 2. Encontrar o container do backend
docker ps | grep orion

# 3. Entrar no container
docker exec -it <container_id> bash

# 4. Atualizar código
cd /app
git pull origin main

# 5. Reiniciar aplicação
# Sair do container
exit

# Reiniciar container
docker restart <container_id>
```

### Opção 3: Via Git Webhook (Automático)

Se você configurou webhooks do GitHub:

1. O Easypanel deve detectar automaticamente o novo commit
2. Aguarde alguns minutos para o deploy automático
3. Verifique os logs de deploy

## Verificação

Após o deploy, teste se o endpoint está funcionando:

```bash
# Teste 1: Health check
curl https://orionback.roilabs.com.br/health

# Teste 2: CORS test
curl https://orionback.roilabs.com.br/api/v1/cors-test

# Teste 3: Novo endpoint (com autenticação)
curl -X POST "https://orionback.roilabs.com.br/api/v1/products/1/generate-fake-sales?weeks=12" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

## Checklist de Deploy

- [ ] Backend atualizado no Easypanel
- [ ] Backend reiniciado com sucesso
- [ ] Logs não mostram erros
- [ ] Endpoint `/generate-fake-sales` responde (404 → 200/201)
- [ ] CORS error desapareceu do console do navegador
- [ ] Frontend pode gerar dados fake com sucesso

## Pendências Anteriores

### Migração 004 - SKU Constraint

⚠️ **IMPORTANTE:** A migração 004 ainda precisa ser aplicada!

**Arquivo:** `backend/migrations/004_fix_product_sku_constraint.sql`

**Como aplicar:**

```bash
# Via container Docker
docker exec -it <backend_container> bash
cd /app/backend
python apply_migration_004.py
```

**Ou via SQL direto:**

```sql
-- Conectar ao PostgreSQL
psql postgresql://orionerp:PAzo18**@dados_orionerp:5432/orionerp

-- Executar comandos
ALTER TABLE products DROP CONSTRAINT IF EXISTS products_sku_key;
UPDATE products SET sku = NULL WHERE sku = '';
ALTER TABLE products ADD CONSTRAINT uq_workspace_sku UNIQUE (workspace_id, sku);
```

## Comandos Úteis

### Ver logs do backend
```bash
docker logs <backend_container> --tail 100 -f
```

### Verificar variáveis de ambiente
```bash
docker exec -it <backend_container> env | grep -E "DATABASE|OPENAI|CORS"
```

### Reiniciar apenas backend (não rebuild)
```bash
docker restart <backend_container>
```

### Fazer rebuild completo
```bash
docker-compose down
docker-compose up -d --build
```

## Troubleshooting

### CORS ainda não funciona após deploy

1. Verificar se o backend realmente atualizou:
   ```bash
   docker exec -it <backend_container> bash
   cd /app
   git log -1 --oneline
   # Deve mostrar o commit mais recente
   ```

2. Verificar se o endpoint existe:
   ```bash
   docker exec -it <backend_container> bash
   grep -n "generate-fake-sales" app/api/api_v1/endpoints/products.py
   # Deve encontrar o endpoint
   ```

3. Verificar logs de erro:
   ```bash
   docker logs <backend_container> | grep -i error
   ```

### Frontend ainda mostra React error #418

- Isso é um erro separado de rendering
- Valores undefined sendo renderizados
- Já foi corrigido no código, aguardar deploy do Vercel

### Vercel não atualizou

1. Acesse: https://vercel.com/dashboard
2. Vá para o projeto Orion ERP Admin
3. Veja a aba "Deployments"
4. Se necessário, clique em "Redeploy"

## Contatos de Suporte

- **Easypanel:** dashboard do próprio servidor
- **GitHub:** https://github.com/JeanZorzetti/orion-ai-guia
- **Vercel:** https://vercel.com/dashboard

---

**Última atualização:** 2025-10-25
**Commits recentes:**
- `efc1c830` - feat: Adicionar botão de debug para gerar dados fake
- `39594556` - fix: Remover testes de debug que causavam erro 405
- `8bb2d46f` - fix: Corrigir React error #418 em DemandForecastView
- `7d9ad45e` - fix: Corrigir constraint de SKU único
