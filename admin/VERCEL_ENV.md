# Configuração de Variáveis de Ambiente na Vercel

## ⚠️ IMPORTANTE: Configurar na Vercel

O projeto precisa das seguintes variáveis de ambiente configuradas na Vercel:

### 🔧 Como Configurar

1. Acesse: https://vercel.com/dashboard
2. Selecione o projeto **Orion ERP**
3. Vá em **Settings** → **Environment Variables**
4. Adicione as variáveis abaixo

### 📝 Variáveis Obrigatórias

```bash
NEXT_PUBLIC_API_URL=https://orionback.roilabs.com.br/api/v1
NEXT_PUBLIC_FRONTEND_URL=https://orionerp.roilabs.com.br
NEXT_PUBLIC_APP_NAME=Orion ERP
NEXT_PUBLIC_APP_VERSION=2.0.0
```

### ⚡ Importante

- ✅ Use `https://` (com SSL) para a API
- ✅ Aplique para: Production, Preview e Development
- ✅ Após adicionar, faça **Redeploy** do projeto

### 🐛 Erro Comum

Se você ver o erro:
```
Mixed Content: The page at 'https://orionerp.roilabs.com.br' was loaded over HTTPS,
but requested an insecure resource 'http://orionback.roilabs.com.br/api/v1/users/'
```

**Causa:** A variável `NEXT_PUBLIC_API_URL` está configurada com `http://` em vez de `https://`

**Solução:** Verifique e corrija a URL na Vercel para usar `https://`

### 🔄 Após Configurar

1. Salve as variáveis
2. Vá em **Deployments**
3. Clique nos 3 pontos do último deploy
4. Selecione **Redeploy**
5. Aguarde o build completar
6. Teste novamente em https://orionerp.roilabs.com.br/register
