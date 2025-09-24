# 🚀 Orion ERP - Guia de Deploy para Produção

## 🌐 **URLs de Produção ROI Labs**

### **Domínios Configurados:**
- **🎯 Frontend Principal**: `https://orionerp.roilabs.com.br`
- **🔧 Backend API**: `https://orionback.roilabs.com.br`
- **⚙️ Admin Panel**: `https://orionerp.roilabs.com.br/admin`

### **URLs de Staging (Opcionais):**
- **Frontend Staging**: `https://staging-orionerp.roilabs.com.br`
- **Backend Staging**: `https://staging-orionback.roilabs.com.br`

---

## ✅ **CORS - Já Configurado!**

### **✅ Backend CORS Configurado para:**
```python
ALLOWED_ORIGINS = [
    # URLs de desenvolvimento
    "http://localhost:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:3001",

    # URLs de produção ROI Labs
    "https://orionerp.roilabs.com.br",
    "https://orionback.roilabs.com.br",
    "https://www.orionerp.roilabs.com.br",
    "https://www.orionback.roilabs.com.br",

    # URLs de staging
    "https://staging-orionerp.roilabs.com.br",
    "https://dev-orionerp.roilabs.com.br"
]
```

### **✅ Frontend Auto-detecta Ambiente:**
- **Desenvolvimento**: `http://localhost:8000`
- **Produção**: `https://orionback.roilabs.com.br`
- **Staging**: `https://staging-orionback.roilabs.com.br`

---

## 🔧 **Configuração para Deploy**

### **1. Backend (FastAPI)**

#### **Arquivo de Produção:**
```bash
# Copiar e configurar
cp backend/.env.example backend/.env
```

#### **Variáveis de Produção (.env):**
```env
# === AMBIENTE DE PRODUÇÃO ===
PROJECT_NAME=Orion ERP
VERSION=1.0.0
API_V1_STR=/api/v1

# === CORS PRODUÇÃO ===
BACKEND_CORS_ORIGINS=https://orionerp.roilabs.com.br,https://orionback.roilabs.com.br

# === URLs PRODUÇÃO ===
FRONTEND_PROD_URL=https://orionerp.roilabs.com.br
BACKEND_PROD_URL=https://orionback.roilabs.com.br
ADMIN_PROD_URL=https://orionerp.roilabs.com.br/admin

# === BANCO DE DADOS PRODUÇÃO ===
POSTGRES_SERVER=seu-postgres-host
POSTGRES_USER=seu-postgres-user
POSTGRES_PASSWORD=sua-senha-segura
POSTGRES_DB=orion_erp_prod
POSTGRES_PORT=5432

# === SEGURANÇA PRODUÇÃO ===
SECRET_KEY=sua-chave-secreta-super-segura-aqui
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

### **2. Frontend (Next.js)**

#### **Arquivo de Produção:**
```bash
# Copiar e configurar
cp admin/.env.local.example admin/.env.local
```

#### **Variáveis de Produção (.env.local):**
```env
# === PRODUÇÃO ===
NODE_ENV=production
NEXT_PUBLIC_API_URL=https://orionback.roilabs.com.br
NEXT_PUBLIC_FRONTEND_URL=https://orionerp.roilabs.com.br

# === CONFIGURAÇÕES ===
NEXT_PUBLIC_APP_NAME=Orion ERP
NEXT_PUBLIC_APP_VERSION=1.0.0
NEXT_PUBLIC_ENABLE_AI_PROCESSING=true
```

---

## 📦 **Comandos de Deploy**

### **Backend Deploy:**
```bash
# 1. Instalar dependências
cd backend
pip install -r requirements.txt

# 2. Para produção com múltiplos workers
uvicorn main-simple:app --host 0.0.0.0 --port 8000 --workers 4

# 3. Ou com Gunicorn (recomendado para produção)
gunicorn main-simple:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

### **Frontend Deploy:**
```bash
# 1. Instalar dependências
cd admin
npm install

# 2. Build de produção
npm run build

# 3. Iniciar produção
npm run start

# 4. Ou export para sites estáticos
npm run export
```

---

## 🔒 **Segurança para Produção**

### **✅ HTTPS Obrigatório:**
- Todos domínios `.roilabs.com.br` **DEVEM** usar HTTPS
- Certificados SSL configurados

### **✅ Variáveis Seguras:**
- `SECRET_KEY` única e forte
- Senhas de banco robustas
- JWT tokens com expiração adequada

### **✅ CORS Restritivo:**
- Apenas domínios autorizados
- Sem `allow_origins=["*"]` em produção

---

## 🌐 **Nginx/Proxy Reverso (Recomendado)**

### **Configuração Nginx:**
```nginx
# Backend API
server {
    listen 443 ssl;
    server_name orionback.roilabs.com.br;

    ssl_certificate /path/to/ssl/cert.pem;
    ssl_certificate_key /path/to/ssl/key.pem;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# Frontend
server {
    listen 443 ssl;
    server_name orionerp.roilabs.com.br;

    ssl_certificate /path/to/ssl/cert.pem;
    ssl_certificate_key /path/to/ssl/key.pem;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

---

## 🧪 **Teste de Deploy**

### **1. Verificar Endpoints:**
```bash
# Health check
curl https://orionback.roilabs.com.br/health

# API funcionando
curl https://orionback.roilabs.com.br/api/v1/dashboard/

# CORS funcionando
curl -H "Origin: https://orionerp.roilabs.com.br" \
     -H "Access-Control-Request-Method: POST" \
     -X OPTIONS https://orionback.roilabs.com.br/api/v1/auth/login
```

### **2. Verificar Frontend:**
- Acessar `https://orionerp.roilabs.com.br`
- Acessar `https://orionerp.roilabs.com.br/admin`
- Testar upload de fatura
- Verificar console do browser para erros

---

## 🎯 **Checklist de Deploy**

### **✅ Backend:**
- [ ] Variáveis de ambiente configuradas
- [ ] CORS com URLs de produção
- [ ] Banco de dados configurado
- [ ] SSL/HTTPS ativo
- [ ] Health checks funcionando

### **✅ Frontend:**
- [ ] Build de produção sem erros
- [ ] Variáveis de ambiente corretas
- [ ] URLs da API apontando para produção
- [ ] SSL/HTTPS ativo
- [ ] Admin panel acessível

### **✅ Integração:**
- [ ] Frontend conecta com backend
- [ ] CORS permite comunicação
- [ ] Upload de arquivos funciona
- [ ] Todas as páginas carregam

---

## ⚡ **Sistema Já Preparado!**

✅ **CORS configurado** para todos domínios ROI Labs
✅ **Auto-detecção de ambiente** no frontend
✅ **URLs dinâmicas** baseadas no domínio
✅ **Configurações separadas** por ambiente
✅ **Pronto para deploy** sem alterações de código

**🚀 Basta configurar as variáveis de ambiente e fazer o deploy!**