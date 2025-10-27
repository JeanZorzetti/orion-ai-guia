# Guia de Configuração - Integrações

Este documento explica como configurar as integrações com marketplaces (Shopify, Mercado Livre, etc.) no backend do Orion ERP.

## 🔧 Variáveis de Ambiente Necessárias

### 1. Shopify Integration

```bash
# Versão da API do Shopify
SHOPIFY_API_VERSION=2024-01
```

**Observação:** As credenciais específicas da loja (Store URL e API Key) são configuradas por workspace através da interface web.

---

### 2. Mercado Livre Integration

```bash
# Client ID do aplicativo no Mercado Livre
MERCADOLIVRE_CLIENT_ID=seu-client-id-aqui

# Client Secret do aplicativo no Mercado Livre
MERCADOLIVRE_CLIENT_SECRET=seu-client-secret-aqui

# URL de callback OAuth (deve ser a mesma cadastrada no app ML)
MERCADOLIVRE_REDIRECT_URI=https://orionerp.roilabs.com.br/admin/integracoes/mercadolivre/callback
```

#### Como obter credenciais do Mercado Livre:

1. Acesse: https://developers.mercadolivre.com.br/
2. Faça login com sua conta Mercado Livre
3. Vá em "Meus Apps" > "Criar novo aplicativo"
4. Preencha os dados do aplicativo:
   - **Nome:** Orion ERP
   - **Descrição:** Sistema ERP integrado com Mercado Livre
   - **Redirect URI:** `https://orionerp.roilabs.com.br/admin/integracoes/mercadolivre/callback`
   - **Scopes necessários:**
     - `read` - Ler informações
     - `write` - Criar/modificar items
     - `offline_access` - Gerar refresh tokens
5. Após criar, você receberá:
   - **App ID** (use como `MERCADOLIVRE_CLIENT_ID`)
   - **Secret Key** (use como `MERCADOLIVRE_CLIENT_SECRET`)

---

## 🚀 Configuração no Servidor de Produção

### Opção 1: Usando Easypanel (Recomendado)

1. Acesse o painel do Easypanel
2. Navegue até o serviço do backend
3. Vá em **Environment Variables**
4. Adicione as variáveis:
   ```
   SHOPIFY_API_VERSION=2024-01
   MERCADOLIVRE_CLIENT_ID=<seu-client-id>
   MERCADOLIVRE_CLIENT_SECRET=<seu-client-secret>
   MERCADOLIVRE_REDIRECT_URI=https://orionerp.roilabs.com.br/admin/integracoes/mercadolivre/callback
   ```
5. Clique em **Save** e **Restart** o serviço

### Opção 2: Usando arquivo .env diretamente

Se você está usando um servidor tradicional com arquivo `.env`:

```bash
# SSH no servidor
ssh user@seu-servidor.com

# Navegue até o diretório do backend
cd /caminho/para/orion-erp/backend

# Edite o arquivo .env
nano .env

# Adicione as variáveis de ambiente
# (veja seção "Variáveis de Ambiente Necessárias" acima)

# Salve (Ctrl+O) e saia (Ctrl+X)

# Reinicie o serviço
sudo systemctl restart orion-backend
# ou
pm2 restart orion-backend
```

### Opção 3: Usando Docker Compose

Se você está usando Docker Compose:

```bash
# Edite o docker-compose.yml
nano docker-compose.yml

# Adicione no serviço backend, na seção environment:
services:
  backend:
    environment:
      - SHOPIFY_API_VERSION=2024-01
      - MERCADOLIVRE_CLIENT_ID=seu-client-id
      - MERCADOLIVRE_CLIENT_SECRET=seu-client-secret
      - MERCADOLIVRE_REDIRECT_URI=https://orionerp.roilabs.com.br/admin/integracoes/mercadolivre/callback

# Recrie os containers
docker-compose down
docker-compose up -d
```

---

## ✅ Verificação

Após configurar as variáveis, verifique se está funcionando:

1. Acesse: https://orionerp.roilabs.com.br/admin/integracoes
2. Clique em **"Conectar com Mercado Livre"**
3. Se as credenciais estiverem corretas, você será redirecionado para a página de autorização do Mercado Livre
4. Se aparecer erro 500, verifique os logs do backend:
   ```bash
   # Docker
   docker logs orion-backend

   # PM2
   pm2 logs orion-backend

   # Systemd
   sudo journalctl -u orion-backend -f
   ```

---

## 🔒 Segurança

**IMPORTANTE:**

1. **NUNCA** commite arquivos `.env` com credenciais reais no Git
2. As credenciais do Mercado Livre são **secretas** - não compartilhe
3. Use HTTPS em produção (já configurado em `orionerp.roilabs.com.br`)
4. O `MERCADOLIVRE_REDIRECT_URI` **DEVE** ser exatamente o mesmo cadastrado no app do ML
5. Os tokens OAuth são criptografados no banco de dados usando `ENCRYPTION_KEY`

---

## 🐛 Troubleshooting

### Erro 500: "Credenciais ML não configuradas"

**Causa:** Variáveis `MERCADOLIVRE_CLIENT_ID` ou `MERCADOLIVRE_REDIRECT_URI` não estão configuradas

**Solução:** Configure as variáveis de ambiente e reinicie o backend

### Erro 401: "Unauthorized" ao tentar conectar

**Causa:** Token de autenticação do usuário expirado

**Solução:** Faça logout e login novamente no sistema

### Redirect URI mismatch

**Causa:** A URL configurada no app do ML não corresponde ao `MERCADOLIVRE_REDIRECT_URI`

**Solução:**
1. Acesse https://developers.mercadolivre.com.br/apps
2. Edite seu aplicativo
3. Certifique-se que o Redirect URI é: `https://orionerp.roilabs.com.br/admin/integracoes/mercadolivre/callback`

### Erro ao sincronizar pedidos

**Causa:** Token OAuth expirado ou inválido

**Solução:**
1. Vá em **Integrações**
2. Clique em **Desconectar** no card do Mercado Livre
3. Clique em **Conectar** novamente e autorize

---

## 📋 Checklist de Deploy

- [ ] Criar aplicativo no Mercado Livre Developers
- [ ] Obter Client ID e Client Secret
- [ ] Configurar Redirect URI no app do ML
- [ ] Adicionar variáveis de ambiente no servidor
- [ ] Reiniciar o serviço backend
- [ ] Testar conexão pelo frontend
- [ ] Verificar se OAuth redirect está funcionando
- [ ] Testar sincronização de pedidos

---

## 📞 Suporte

Se você encontrar problemas não listados aqui, verifique:

1. Logs do backend para mensagens de erro detalhadas
2. Console do navegador (F12) para erros de frontend
3. Documentação oficial: https://developers.mercadolivre.com.br/pt_br/api-docs
