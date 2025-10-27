# 🚀 Deploy - Mercado Livre Integration no Easypanel

## Credenciais Recebidas

```
App ID (Client ID): 6740292523389463
Secret Key: cP2M0JaFos4Rs3wrWecsBlSYUpouawwB
```

## 📝 Passo a Passo - Configuração no Easypanel

### 1. Acessar o Painel

1. Faça login no Easypanel
2. Selecione o projeto do Orion ERP
3. Localize o serviço **backend**

### 2. Configurar Variáveis de Ambiente

1. Clique no serviço **backend**
2. Vá na aba **Environment** ou **Variables**
3. Adicione as seguintes variáveis:

```bash
# Shopify
SHOPIFY_API_VERSION=2024-01

# Mercado Livre
MERCADOLIVRE_CLIENT_ID=6740292523389463
MERCADOLIVRE_CLIENT_SECRET=cP2M0JaFos4Rs3wrWecsBlSYUpouawwB
MERCADOLIVRE_REDIRECT_URI=https://orionerp.roilabs.com.br/admin/integracoes/mercadolivre/callback
```

### 3. Salvar e Reiniciar

1. Clique em **Save** ou **Update**
2. Clique em **Restart** ou **Redeploy**
3. Aguarde o serviço reiniciar (normalmente 30-60 segundos)

### 4. Verificar Logs

1. Na aba **Logs** do serviço backend
2. Verifique se aparecem mensagens de erro
3. Procure por linhas como:
   - ✅ `"Application startup complete"`
   - ❌ `"MERCADOLIVRE_CLIENT_ID not configured"` (indica erro)

## ✅ Testar a Integração

### 1. Acessar Página de Integrações

Abra: https://orionerp.roilabs.com.br/admin/integracoes

### 2. Testar Mercado Livre

1. No card **Mercado Livre**, clique em **"Conectar com Mercado Livre"**
2. Você será redirecionado para: `https://auth.mercadolivre.com.br/authorization?...`
3. Faça login com sua conta Mercado Livre
4. Autorize o aplicativo "Orion ERP"
5. Você será redirecionado de volta para: `https://orionerp.roilabs.com.br/admin/integracoes/mercadolivre/callback`
6. Aguarde a mensagem: **"Mercado Livre conectado com sucesso!"**
7. Você será redirecionado automaticamente para `/admin/integracoes`

### 3. Verificar Conexão

No card do Mercado Livre você deverá ver:
- ✅ Badge amarelo "Mercado Livre"
- ✅ User ID da conta conectada
- ✅ Data da última sincronização
- ✅ Botões: **Testar Conexão**, **Desconectar**

### 4. Sincronizar Pedidos

1. Vá em **Vendas** (`/admin/vendas`)
2. Clique no botão **"Sincronizar ML"**
3. Aguarde a sincronização
4. Verifique os pedidos importados na lista

## 🐛 Troubleshooting

### Erro 500 ao clicar em "Conectar"

**Causa:** Variáveis não foram salvas corretamente

**Solução:**
1. Verifique se as variáveis foram adicionadas no Easypanel
2. Verifique se o serviço foi reiniciado
3. Verifique os logs do backend

### Erro "redirect_uri_mismatch"

**Causa:** URL de callback não corresponde à cadastrada no app do ML

**Solução:**
1. Acesse: https://developers.mercadolivre.com.br/apps
2. Edite o app **Orion ERP**
3. Certifique-se que o Redirect URI é exatamente:
   ```
   https://orionerp.roilabs.com.br/admin/integracoes/mercadolivre/callback
   ```
4. Salve as alterações

### Erro 401 "Unauthorized"

**Causa:** Token de autenticação do usuário expirou

**Solução:**
1. Faça logout do sistema
2. Faça login novamente
3. Tente conectar o Mercado Livre novamente

### Pedidos não estão sincronizando

**Causa:** Token OAuth pode ter expirado

**Solução:**
1. Vá em **Integrações**
2. Clique em **Desconectar** no card do Mercado Livre
3. Clique em **Conectar** novamente
4. Autorize o app novamente
5. Tente sincronizar os pedidos

## 📋 Checklist Final

- [x] ~~Obter credenciais do Mercado Livre~~
- [ ] Acessar Easypanel
- [ ] Adicionar variáveis de ambiente
- [ ] Reiniciar serviço backend
- [ ] Verificar logs (sem erros)
- [ ] Testar conexão OAuth
- [ ] Autorizar aplicativo no ML
- [ ] Verificar se aparece User ID no card
- [ ] Testar sincronização de pedidos
- [ ] Verificar pedidos importados em Vendas

## 🎯 Resultado Esperado

Após concluir todos os passos:

1. ✅ O card do Mercado Livre mostra status **Conectado**
2. ✅ User ID da conta aparece no card
3. ✅ Botão **Sincronizar ML** funciona em Vendas
4. ✅ Pedidos do ML são importados como vendas no sistema
5. ✅ Produtos são mapeados por SKU automaticamente

## 📞 Suporte

Se você encontrar problemas:

1. Verifique os logs do backend no Easypanel
2. Abra o Console do navegador (F12) e verifique erros
3. Verifique o arquivo [CONFIGURACAO_INTEGRACOES.md](./CONFIGURACAO_INTEGRACOES.md) para mais detalhes

---

**Documentação gerada em:** 2025-01-26
