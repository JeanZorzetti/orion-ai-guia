# 🚀 Orion ERP - Quick Start Guide

## ✅ **Status Atual**

**✅ BACKEND FUNCIONANDO** - Todos os endpoints operacionais
**✅ FRONTEND FUNCIONANDO** - Interface admin completa
**✅ INTEGRAÇÃO FUNCIONAL** - Frontend conectado ao backend

---

## 🎯 **Como Iniciar o Sistema**

### **1. Backend API**

#### **🔥 Para DESENVOLVIMENTO (Recomendado):**
```bash
# Auto-reload ATIVO - Detecta mudanças automaticamente!
start-backend-dev.bat

# Ou no terminal:
cd backend
py -m uvicorn main-simple:app --reload --host 0.0.0.0 --port 8000
```

#### **⚡ Para PRODUÇÃO:**
```bash
# Performance otimizada - Sem auto-reload
start-backend.bat

# Ou no terminal:
cd backend
py main-simple.py
```

**URLs do Backend:**
- **API**: http://localhost:8000
- **Documentação Swagger**: http://localhost:8000/docs
- **Health Check**: http://localhost:8000/health

### **2. Frontend Admin**
```bash
# Em outro terminal
cd admin
npm run dev
```

**URLs do Frontend:**
- **Home**: http://localhost:3000
- **Admin**: http://localhost:3000/admin
- **Financeiro**: http://localhost:3000/financeiro

---

## 🔗 **Endpoints Implementados e Testados**

### **✅ Autenticação**
- `POST /api/v1/auth/login` - Login (admin@orion.com / admin123)
- `POST /api/v1/auth/logout` - Logout
- `GET /api/v1/auth/me` - Usuário atual

### **✅ Usuários**
- `GET /api/v1/users/` - Listar usuários
- `POST /api/v1/users/` - Criar usuário
- `GET /api/v1/users/{id}` - Buscar usuário

### **✅ Dashboard**
- `GET /api/v1/dashboard/` - Dados completos do dashboard

### **✅ Financeiro (CORE MVP)**
- `POST /api/v1/financials/invoices/upload` - **Upload de fatura com processamento simulado**
- `POST /api/v1/financials/invoices` - **Salvar fatura validada**
- `GET /api/v1/financials/invoices` - **Listar faturas**
- `POST /api/v1/financials/test-data-cleaning` - Teste limpeza de dados

### **✅ Fornecedores**
- `POST /api/v1/suppliers/search` - **Busca fuzzy de fornecedores**
- `POST /api/v1/suppliers/create-or-merge` - **Criar/merge inteligente**
- `GET /api/v1/suppliers/list` - Listar fornecedores
- `GET /api/v1/suppliers/statistics` - Estatísticas
- `GET /api/v1/suppliers/{id}` - Detalhes do fornecedor

---

## 🧪 **Como Testar**

### **1. Via Interface Web (Recomendado)**
1. Abra http://localhost:3000/financeiro
2. Teste o upload de arquivo
3. Valide o formulário de fatura
4. Teste o salvamento

### **2. Via Swagger UI**
1. Abra http://localhost:8000/docs
2. Teste qualquer endpoint
3. Veja as respostas em tempo real

### **3. Via cURL**
```bash
# Test login
curl -X POST "http://localhost:8000/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@orion.com","password":"admin123"}'

# Test dashboard
curl -X GET "http://localhost:8000/api/v1/dashboard/"

# Test invoices
curl -X GET "http://localhost:8000/api/v1/financials/invoices"
```

---

## 📊 **Funcionalidades Implementadas**

### **✅ Frontend Admin**
- ✅ Upload de arquivos com drag & drop
- ✅ Validação de tipos de arquivo
- ✅ Processamento com status em tempo real
- ✅ Formulário de validação de fatura
- ✅ Sistema de notificações (toast)
- ✅ Interface responsiva e moderna

### **✅ Backend API**
- ✅ Processamento simulado de IA
- ✅ Validação de arquivos
- ✅ CORS configurado
- ✅ Documentação automática
- ✅ Estrutura para expansão com IA real
- ✅ Mocks realísticos para desenvolvimento

---

## 🎯 **Próximos Passos**

### **Implementações Futuras:**
1. **Banco de dados real** (PostgreSQL)
2. **Autenticação JWT completa**
3. **IA real** (LayoutLM, OCR)
4. **Testes automatizados**
5. **Deploy em produção**

### **Para Desenvolvimento:**
O sistema atual é **perfeitamente funcional** para desenvolvimento e demo do MVP financeiro com processamento de faturas.

---

## ⚠️ **Notas Importantes**

- **Sistema Funcional**: Todos endpoints testados e operacionais
- **Dados Mock**: Usando dados simulados para desenvolvimento rápido
- **IA Simulada**: Processamento de documentos retorna dados realísticos
- **CORS Ativo**: Frontend e backend integrados
- **Pronto para Demo**: Sistema completo para apresentação

---

**✅ Status: SISTEMA TOTALMENTE OPERACIONAL PARA DESENVOLVIMENTO** 🎉