# Setup Ambiente Backend

> Guia completo para configurar o ambiente de desenvolvimento do backend Orion ERP

**Última atualização:** 04/11/2025
**Versão:** 2.0.0

---

## 📋 Índice

1. [Pré-requisitos](#pré-requisitos)
2. [Instalação do Python](#instalação-do-python)
3. [Configuração do Projeto](#configuração-do-projeto)
4. [Instalação de Dependências](#instalação-de-dependências)
5. [Configuração do Banco de Dados](#configuração-do-banco-de-dados)
6. [Variáveis de Ambiente](#variáveis-de-ambiente)
7. [Inicialização do Servidor](#inicialização-do-servidor)
8. [Verificação da Instalação](#verificação-da-instalação)
9. [Troubleshooting](#troubleshooting)

---

## 🔧 Pré-requisitos

Antes de começar, certifique-se de ter instalado:

- **Python 3.11 ou superior**
- **PostgreSQL 15 ou superior**
- **Git** (para clonar o repositório)
- **pip** (gerenciador de pacotes Python)
- **virtualenv** ou **venv** (recomendado para isolamento)

### Verificação de Pré-requisitos

```bash
# Verificar versão do Python
python --version
# ou
python3 --version

# Verificar versão do PostgreSQL
psql --version

# Verificar versão do Git
git --version

# Verificar pip
pip --version
```

---

## 🐍 Instalação do Python

### Windows

1. Baixe o instalador do Python em [python.org](https://www.python.org/downloads/)
2. Execute o instalador
3. ✅ **IMPORTANTE**: Marque "Add Python to PATH"
4. Clique em "Install Now"
5. Verifique a instalação:

```powershell
python --version
pip --version
```

### macOS

```bash
# Usando Homebrew (recomendado)
brew install python@3.11

# Verificar instalação
python3 --version
pip3 --version
```

### Linux (Ubuntu/Debian)

```bash
# Atualizar repositórios
sudo apt update

# Instalar Python 3.11
sudo apt install python3.11 python3.11-venv python3-pip

# Verificar instalação
python3.11 --version
pip3 --version
```

---

## 📦 Configuração do Projeto

### 1. Clonar o Repositório

```bash
# Clone o repositório
git clone https://github.com/JeanZorzetti/orion-ai-guia.git

# Entre na pasta do backend
cd orion-ai-guia/backend
```

### 2. Criar Ambiente Virtual

**Por que usar ambiente virtual?**
- Isola as dependências do projeto
- Evita conflitos com outros projetos Python
- Facilita o gerenciamento de versões de pacotes

#### Windows

```powershell
# Criar ambiente virtual
python -m venv venv

# Ativar ambiente virtual
.\venv\Scripts\activate

# Você verá (venv) no início do prompt
```

#### macOS/Linux

```bash
# Criar ambiente virtual
python3 -m venv venv

# Ativar ambiente virtual
source venv/bin/activate

# Você verá (venv) no início do prompt
```

---

## 📚 Instalação de Dependências

Com o ambiente virtual ativado:

```bash
# Atualizar pip (recomendado)
pip install --upgrade pip

# Instalar todas as dependências
pip install -r requirements.txt
```

### Dependências Principais

```
fastapi==0.104.1          # Framework web
uvicorn[standard]==0.24.0 # Servidor ASGI
sqlalchemy==2.0.23        # ORM
psycopg2-binary==2.9.9    # Driver PostgreSQL
pydantic==2.5.0           # Validação de dados
python-jose[cryptography] # JWT
passlib[bcrypt]           # Hash de senhas
python-multipart          # Upload de arquivos
python-dotenv             # Variáveis de ambiente
alembic==1.13.0           # Migrations
```

### Verificação de Instalação

```bash
# Listar pacotes instalados
pip list

# Verificar versão do FastAPI
python -c "import fastapi; print(fastapi.__version__)"
```

---

## 🗄️ Configuração do Banco de Dados

### 1. Instalar PostgreSQL

#### Windows

1. Baixe o instalador em [postgresql.org](https://www.postgresql.org/download/windows/)
2. Execute e siga o wizard de instalação
3. Anote a senha do usuário `postgres`
4. Use pgAdmin 4 (instalado junto) para gerenciar

#### macOS

```bash
# Usando Homebrew
brew install postgresql@15

# Iniciar serviço
brew services start postgresql@15
```

#### Linux (Ubuntu/Debian)

```bash
# Instalar PostgreSQL
sudo apt install postgresql postgresql-contrib

# Iniciar serviço
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### 2. Criar Banco de Dados

```bash
# Conectar ao PostgreSQL
psql -U postgres

# Criar banco de dados
CREATE DATABASE orion_erp;

# Criar usuário (opcional)
CREATE USER orion_user WITH PASSWORD 'sua_senha_segura';

# Conceder permissões
GRANT ALL PRIVILEGES ON DATABASE orion_erp TO orion_user;

# Sair do psql
\q
```

### 3. Testar Conexão

```bash
# Conectar ao banco criado
psql -U postgres -d orion_erp

# Listar bancos de dados
\l

# Sair
\q
```

---

## 🔐 Variáveis de Ambiente

### 1. Copiar Arquivo de Exemplo

```bash
# Na pasta backend/
cp .env.example .env
```

### 2. Configurar Variáveis

Edite o arquivo `.env` com suas configurações:

```env
# Database
DATABASE_URL=postgresql://postgres:sua_senha@localhost:5432/orion_erp

# JWT
SECRET_KEY=sua_chave_secreta_super_segura_aqui
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7

# API
API_V1_STR=/api/v1
PROJECT_NAME=Orion ERP
VERSION=2.0.0

# CORS
BACKEND_CORS_ORIGINS=["http://localhost:3000","https://orionerp.roilabs.com.br"]

# Environment
ENVIRONMENT=development

# Email (opcional para desenvolvimento)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=seu_email@gmail.com
SMTP_PASSWORD=sua_senha_app

# Fiscal (opcional)
PLUGNOTAS_API_KEY=
FOCUSNFE_API_KEY=
```

### 3. Gerar SECRET_KEY

```bash
# Gerar uma chave segura
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

---

## 🚀 Inicialização do Servidor

### 1. Aplicar Migrations

```bash
# Criar as tabelas no banco de dados
alembic upgrade head
```

### 2. Iniciar Servidor de Desenvolvimento

```bash
# Método 1: Usando uvicorn diretamente
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Método 2: Usando o script Python
python main.py
```

**Parâmetros:**
- `--reload`: Reinicia automaticamente ao detectar mudanças no código
- `--host 0.0.0.0`: Permite acesso de qualquer IP (útil para testes)
- `--port 8000`: Porta do servidor

### 3. Verificar Inicialização

Você deve ver algo como:

```
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
INFO:     Started reloader process [xxxxx] using StatReload
INFO:     Started server process [xxxxx]
INFO:     Waiting for application startup.
INFO:     Application startup complete.
```

---

## ✅ Verificação da Instalação

### 1. Testar API Root

```bash
# Abrir no navegador ou usar curl
curl http://localhost:8000

# Resposta esperada:
{
  "message": "Orion ERP API",
  "version": "2.0.0",
  "status": "running",
  "architecture": "multi-tenant with JWT authentication"
}
```

### 2. Acessar Documentação Interativa

Abra no navegador:

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

### 3. Testar Health Check

```bash
curl http://localhost:8000/health

# Resposta esperada:
{
  "status": "healthy",
  "database": "connected",
  "version": "2.0.0"
}
```

### 4. Criar Primeiro Usuário (Super Admin)

```bash
# Endpoint de criação de super admin (apenas em development)
curl -X POST http://localhost:8000/api/v1/super-admin/create-first-admin \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "SenhaSegura123!",
    "full_name": "Administrador"
  }'
```

---

## 🐛 Troubleshooting

### Erro: "ModuleNotFoundError"

```bash
# Certifique-se de estar com o ambiente virtual ativado
source venv/bin/activate  # macOS/Linux
.\venv\Scripts\activate   # Windows

# Reinstale as dependências
pip install -r requirements.txt
```

### Erro: "Connection refused" (PostgreSQL)

```bash
# Verificar se PostgreSQL está rodando
# Windows
pg_ctl status

# macOS
brew services list | grep postgresql

# Linux
sudo systemctl status postgresql

# Iniciar PostgreSQL se não estiver rodando
# Windows: inicie pelo Services
# macOS: brew services start postgresql@15
# Linux: sudo systemctl start postgresql
```

### Erro: "Could not connect to database"

1. Verifique se o banco de dados existe:
```bash
psql -U postgres -l
```

2. Verifique a `DATABASE_URL` no arquivo `.env`
3. Teste a conexão manualmente:
```bash
psql -U postgres -d orion_erp
```

### Erro: "Port 8000 already in use"

```bash
# Encontrar processo na porta 8000
# Windows
netstat -ano | findstr :8000

# macOS/Linux
lsof -i :8000

# Matar o processo ou use outra porta
uvicorn main:app --reload --port 8001
```

### Erro: "alembic command not found"

```bash
# Certifique-se de estar com ambiente virtual ativado
# Reinstale alembic
pip install alembic
```

---

## 📝 Próximos Passos

Após configurar o ambiente backend:

1. [Configurar Frontend](../../04-frontend/setup-ambiente.md)
2. [Entender Estrutura do Projeto](estrutura-projeto.md)
3. [Explorar Modelos de Banco de Dados](modelos-banco-dados.md)
4. [Consultar API Reference](../../06-api/README.md)

---

## 🔗 Referências

- [Documentação FastAPI](https://fastapi.tiangolo.com/)
- [Documentação SQLAlchemy](https://docs.sqlalchemy.org/)
- [Documentação PostgreSQL](https://www.postgresql.org/docs/)
- [Documentação Uvicorn](https://www.uvicorn.org/)

---

## 💡 Dicas de Desenvolvimento

### Ativar Auto-reload

O Uvicorn já vem com `--reload` por padrão no modo desenvolvimento, que reinicia automaticamente quando detecta mudanças.

### Usar um bom IDE

Recomendações:
- **VS Code** com extensões:
  - Python
  - Pylance
  - autoDocstring
  - GitLens

- **PyCharm Professional**

### Configurar Linting

```bash
# Instalar ferramentas de desenvolvimento
pip install black flake8 mypy

# Formatar código
black .

# Verificar style guide
flake8 .

# Verificar tipos
mypy app/
```

---

**Pronto!** Seu ambiente backend está configurado e funcionando. 🎉
