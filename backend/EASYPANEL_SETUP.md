# Configuração do Backend no Easypanel

## 🎯 Objetivo
Fazer o container backend ficar com a **bolinha verde** (operacional) no Easypanel.

---

## 📋 Pré-requisitos

1. ✅ PostgreSQL configurado no Easypanel (nome: `dados_orionerp`)
2. ✅ Migração SQL executada (tabelas criadas)
3. ✅ Repositório GitHub conectado ao Easypanel

---

## 🔧 Configuração Passo a Passo

### 1. Configurar Variáveis de Ambiente

No Easypanel, vá em **orion > Environment** e adicione:

```bash
# Database Connection (Internal)
DATABASE_URL=postgresql://orionerp:PAzo18**@dados_orionerp:5432/orionerp?sslmode=disable

# Security - JWT
SECRET_KEY=seu_secret_key_aqui_use_openssl_rand_hex_32
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7

# CORS
BACKEND_CORS_ORIGINS=https://orionerp.roilabs.com.br,https://orionback.roilabs.com.br

# Project
PROJECT_NAME=Orion ERP
VERSION=2.0.0
```

**🔐 IMPORTANTE - Gerar SECRET_KEY:**
```bash
# Execute localmente ou em qualquer terminal Linux:
openssl rand -hex 32

# Exemplo de resultado:
# a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6
```

---

### 2. Configurar Build Settings

No Easypanel, vá em **orion > Source**:

- **Build Path**: `/backend`
- **Dockerfile Path**: `/backend/Dockerfile` (ou deixe padrão se detectar automaticamente)
- **Build Context**: `/backend`

---

### 3. Verificar Dockerfile

Confirme que o Dockerfile está correto (já atualizado no commit):

```dockerfile
FROM python:3.11-slim
WORKDIR /app

# System dependencies (incluindo curl para health check)
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        build-essential \
        libpq-dev \
        curl \
    && rm -rf /var/lib/apt/lists/*

# Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip \
    && pip install --no-cache-dir -r requirements.txt

# Application code
COPY . .

# Non-root user
RUN adduser --disabled-password --gecos '' appuser \
    && chown -R appuser:appuser /app
USER appuser

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Run
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

---

### 4. Deploy

1. Clique em **Deploy** no Easypanel
2. Aguarde o build (pode levar 2-3 minutos)
3. Monitore os logs em tempo real

---

## 📊 Monitoramento dos Logs

### ✅ Logs Esperados (Sucesso)

```
INFO:     Started server process [1]
INFO:     Waiting for application startup.
✓ Database tables created successfully
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
```

### ❌ Logs de Erro Comuns

#### Erro 1: Falha na Conexão com PostgreSQL
```
sqlalchemy.exc.OperationalError: could not connect to server
```

**Solução:**
- Verifique se `dados_orionerp` está rodando (bolinha verde)
- Confirme que `DATABASE_URL` está correta
- Use o **Internal Connection URL** (não o External)

---

#### Erro 2: Health Check Falhando
```
Unhealthy
Health check failed
```

**Solução:**
- Aguarde 40 segundos (start-period do health check)
- Verifique se a porta 8000 está exposta
- Teste manualmente: `curl http://localhost:8000/health`

---

#### Erro 3: Módulo não encontrado
```
ModuleNotFoundError: No module named 'xxx'
```

**Solução:**
- Verifique se o módulo está no `requirements.txt`
- Force rebuild: delete o serviço e recrie

---

## 🧪 Testes de Validação

### 1. Health Check

```bash
curl https://orionback.roilabs.com.br/health
```

**Resposta esperada:**
```json
{
  "status": "healthy",
  "database": "connected",
  "version": "2.0.0"
}
```

---

### 2. API Root

```bash
curl https://orionback.roilabs.com.br/
```

**Resposta esperada:**
```json
{
  "message": "Orion ERP API",
  "version": "2.0.0",
  "status": "running",
  "architecture": "multi-tenant with JWT authentication"
}
```

---

### 3. Login de Teste

```bash
curl -X POST https://orionback.roilabs.com.br/api/v1/auth/token \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@orion.com",
    "password": "admin123"
  }'
```

**Resposta esperada:**
```json
{
  "access_token": "eyJ...",
  "refresh_token": "eyJ...",
  "token_type": "bearer"
}
```

---

## 🎯 Checklist Final

Antes de considerar o deploy bem-sucedido:

- [ ] Container com **bolinha verde** no Easypanel
- [ ] Logs mostram "Application startup complete"
- [ ] Health check retorna status 200
- [ ] Endpoint `/` retorna JSON correto
- [ ] Login com admin@orion.com funciona
- [ ] Nenhum erro nos logs

---

## 🔍 Debug Avançado

### Acessar Shell do Container

No Easypanel, vá em **orion > Terminal** e execute:

```bash
# Verificar se a aplicação está rodando
ps aux | grep uvicorn

# Testar conexão com PostgreSQL
curl -f http://localhost:8000/health

# Ver logs em tempo real
tail -f /var/log/app.log
```

### Testar Localmente

```bash
cd backend

# Instalar dependências
pip install -r requirements.txt

# Rodar localmente
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

---

## 📝 Notas Importantes

1. **Startup Time**: O container pode levar até 40 segundos para ficar "healthy" (configurado no health check)

2. **Database Connection**: Sempre use o **Internal Connection URL** dentro do Docker

3. **CORS**: Adicione todos os domínios necessários em `BACKEND_CORS_ORIGINS`

4. **SECRET_KEY**: **NUNCA** use a chave padrão em produção!

---

## 🆘 Suporte

Se após seguir todos os passos o container ainda estiver com problemas:

1. Copie os logs completos do Easypanel
2. Verifique se todas as variáveis de ambiente estão configuradas
3. Confirme que o PostgreSQL está acessível
4. Tente fazer rebuild do zero

---

## ✅ Status Esperado

Após configuração correta:

```
sites / orion
  🟢 orion (APP) - Running
  🟢 dados_orionerp (POSTGRES) - Running
```

**CPU**: ~0.2%
**Memory**: ~40 MB
**Network**: I/O normal

---

**Última atualização**: 2025-10-22
**Versão do Backend**: 2.0.0
