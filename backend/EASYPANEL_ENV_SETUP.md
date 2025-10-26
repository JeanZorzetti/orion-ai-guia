# Configuração de Variáveis de Ambiente - Easypanel

## ⚠️ AÇÃO URGENTE NECESSÁRIA

O backend está falhando porque a variável `ENCRYPTION_KEY` não está configurada no Easypanel.

## 🔧 Passos para Configurar

### 1. Acessar Easypanel
1. Faça login em: https://easypanel.io
2. Navegue até o projeto **Orion ERP**
3. Selecione o serviço **backend** (orionback)

### 2. Adicionar Variável de Ambiente

1. Clique em **Environment** no menu lateral
2. Adicione a seguinte variável:

```bash
ENCRYPTION_KEY=DhF6-mhaRxPtxkiFBo3OaKRj1z4y2bdvZUmc6WAbF0w=
```

### 3. Reiniciar o Backend

Após adicionar a variável:
1. Clique em **Save**
2. Clique em **Restart** ou **Rebuild**
3. Aguarde o serviço reiniciar (1-2 minutos)

---

## 📋 Variáveis de Ambiente Completas

Certifique-se de que **TODAS** estas variáveis estão configuradas no Easypanel:

```bash
# Database
DATABASE_URL=postgresql://orionerp:PAzo18**@dados_orionerp:5432/orionerp?sslmode=disable

# Security
SECRET_KEY=ALTERE_ESTA_CHAVE_SECRETA_EM_PRODUCAO_USE_OPENSSL_RAND_HEX_32

# Fiscal Module - NOVA VARIÁVEL
ENCRYPTION_KEY=DhF6-mhaRxPtxkiFBo3OaKRj1z4y2bdvZUmc6WAbF0w=

# JWT Configuration
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7

# CORS
BACKEND_CORS_ORIGINS=https://orionerp.roilabs.com.br,https://orionback.roilabs.com.br,http://localhost:3000

# Project Info
PROJECT_NAME=Orion ERP
VERSION=2.0.0
```

---

## 🐛 Diagnóstico de Erros

### Erro Atual
```
ValueError: Invalid encryption key format: Fernet key must be 32 url-safe base64-encoded bytes.
```

**Causa**: A variável `ENCRYPTION_KEY` não está definida ou está vazia no ambiente de produção.

**Solução**: Adicionar a variável conforme instruções acima.

---

## ✅ Verificação

Após configurar e reiniciar:

1. Acesse: https://orionback.roilabs.com.br/docs
2. Tente fazer login em: https://orionerp.roilabs.com.br
3. Verifique os logs do backend no Easypanel

Se ainda houver erros:
- Verifique se a variável foi salva corretamente
- Certifique-se de que o serviço foi reiniciado
- Verifique os logs em "Logs" no Easypanel

---

## 🔒 Segurança

A `ENCRYPTION_KEY` é usada para:
- Criptografar API keys de parceiros fiscais (PlugNotas, FocusNFe)
- Criptografar certificados digitais A1
- Proteger dados sensíveis de configuração fiscal

**NUNCA** compartilhe esta chave publicamente ou faça commit dela em repositórios públicos.

---

## 📞 Suporte

Se precisar gerar uma nova chave:

```bash
python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
```

Ou use este site: https://cryptography.io/en/latest/fernet/
