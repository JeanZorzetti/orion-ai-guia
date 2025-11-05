# Setup Ambiente Frontend

> Guia completo para configurar o ambiente de desenvolvimento do frontend Orion ERP

**Última atualização:** 04/11/2025
**Versão:** 2.0.0

---

## 📋 Índice

1. [Pré-requisitos](#pré-requisitos)
2. [Instalação do Node.js](#instalação-do-nodejs)
3. [Configuração do Projeto](#configuração-do-projeto)
4. [Instalação de Dependências](#instalação-de-dependências)
5. [Variáveis de Ambiente](#variáveis-de-ambiente)
6. [Inicialização do Servidor](#inicialização-do-servidor)
7. [Verificação da Instalação](#verificação-da-instalação)
8. [Troubleshooting](#troubleshooting)

---

## 🔧 Pré-requisitos

Antes de começar, certifique-se de ter instalado:

- **Node.js 18 ou superior**
- **npm** (vem com Node.js) ou **yarn**
- **Git** (para clonar o repositório)
- **Backend rodando** (consulte [Setup Backend](../03-backend/setup-ambiente.md))

### Verificação de Pré-requisitos

```bash
# Verificar versão do Node.js
node --version
# Deve retornar v18.x.x ou superior

# Verificar versão do npm
npm --version
# Deve retornar 9.x.x ou superior

# Verificar versão do Git
git --version
```

---

## 🟢 Instalação do Node.js

### Windows

1. Baixe o instalador do Node.js em [nodejs.org](https://nodejs.org/)
2. Escolha a versão **LTS** (Long Term Support)
3. Execute o instalador
4. ✅ **IMPORTANTE**: Marque "Add to PATH" durante a instalação
5. Verifique a instalação:

```powershell
node --version
npm --version
```

### macOS

```bash
# Usando Homebrew (recomendado)
brew install node@18

# Ou usando nvm (Node Version Manager)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 18
nvm use 18

# Verificar instalação
node --version
npm --version
```

### Linux (Ubuntu/Debian)

```bash
# Método 1: Usar NodeSource
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Método 2: Usar nvm (recomendado)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
nvm install 18
nvm use 18

# Verificar instalação
node --version
npm --version
```

---

## 📦 Configuração do Projeto

### 1. Clonar o Repositório

```bash
# Clone o repositório (se ainda não fez)
git clone https://github.com/JeanZorzetti/orion-ai-guia.git

# Entre na pasta do frontend
cd orion-ai-guia/admin
```

### 2. Verificar Estrutura do Projeto

O projeto frontend segue a estrutura do Next.js 15 com App Router:

```
admin/
├── src/
│   ├── app/              # App Router (Next.js 15)
│   │   ├── admin/        # Páginas administrativas
│   │   ├── layout.tsx    # Layout raiz
│   │   └── page.tsx      # Página inicial
│   ├── components/       # Componentes React
│   │   ├── ui/          # Componentes Shadcn/UI
│   │   └── layout/      # Componentes de layout
│   ├── hooks/           # Custom hooks
│   ├── lib/             # Utilities e helpers
│   ├── services/        # Serviços de API
│   └── types/           # TypeScript types
├── public/              # Assets estáticos
├── package.json         # Dependências
├── tsconfig.json        # Configuração TypeScript
├── tailwind.config.ts   # Configuração Tailwind
└── next.config.mjs      # Configuração Next.js
```

---

## 📚 Instalação de Dependências

### Usando npm (padrão)

```bash
# Certifique-se de estar na pasta admin/
cd admin

# Limpar cache (se houver problemas)
npm cache clean --force

# Instalar todas as dependências
npm install
```

### Usando yarn (alternativo)

```bash
# Instalar yarn globalmente (se ainda não tem)
npm install -g yarn

# Instalar dependências
yarn install
```

### Dependências Principais

O projeto usa as seguintes tecnologias:

```json
{
  "next": "15.5.3",              // Framework React
  "react": "^18.3.1",            // React
  "react-dom": "^18.3.1",        // React DOM
  "typescript": "^5",            // TypeScript
  "tailwindcss": "^3.4.17",      // Estilização
  "lucide-react": "^0.544.0",    // Ícones
  "react-hook-form": "^7.65.0",  // Formulários
  "zod": "^4.1.12",              // Validação
  "@tanstack/react-query": "^5.90.1", // State management
  "date-fns": "^4.1.0",          // Manipulação de datas
  "recharts": "^3.3.0",          // Gráficos
  "framer-motion": "^12.23.24"   // Animações
}
```

### Componentes Radix UI

O projeto usa extensivamente componentes Radix UI para acessibilidade:

- Dialog, Dropdown Menu, Select
- Tabs, Accordion, Tooltip
- Alert Dialog, Popover, Sheet
- E muitos outros componentes acessíveis

### Verificação de Instalação

```bash
# Listar dependências instaladas
npm list --depth=0

# Verificar se há vulnerabilidades
npm audit

# Corrigir vulnerabilidades automaticamente (se houver)
npm audit fix
```

---

## 🔐 Variáveis de Ambiente

### 1. Copiar Arquivo de Exemplo

```bash
# Na pasta admin/
cp .env.local.example .env.local
```

### 2. Configurar Variáveis

Edite o arquivo `.env.local` com suas configurações:

#### Para Desenvolvimento Local

```env
# === AMBIENTE ===
NODE_ENV=development

# === URLs DA API ===
# Backend local (certifique-se de que está rodando)
NEXT_PUBLIC_API_URL=http://localhost:8000

# === URLs DO FRONTEND ===
NEXT_PUBLIC_FRONTEND_URL=http://localhost:3000

# === CONFIGURAÇÕES DA APLICAÇÃO ===
NEXT_PUBLIC_APP_NAME=Orion ERP
NEXT_PUBLIC_APP_VERSION=2.0.0

# === FEATURES FLAGS ===
NEXT_PUBLIC_ENABLE_AI_PROCESSING=true
NEXT_PUBLIC_ENABLE_GUIDED_TOUR=true
NEXT_PUBLIC_ENABLE_DEBUG_LOGS=true
```

#### Para Produção (Deploy)

```env
# === AMBIENTE ===
NODE_ENV=production

# === URLs DA API ===
NEXT_PUBLIC_API_URL=https://orionback.roilabs.com.br

# === URLs DO FRONTEND ===
NEXT_PUBLIC_FRONTEND_URL=https://orionerp.roilabs.com.br

# === CONFIGURAÇÕES DA APLICAÇÃO ===
NEXT_PUBLIC_APP_NAME=Orion ERP
NEXT_PUBLIC_APP_VERSION=2.0.0

# === FEATURES FLAGS ===
NEXT_PUBLIC_ENABLE_AI_PROCESSING=true
NEXT_PUBLIC_ENABLE_GUIDED_TOUR=false
NEXT_PUBLIC_ENABLE_DEBUG_LOGS=false
```

### 3. Entendendo as Variáveis

| Variável | Descrição | Exemplo |
|----------|-----------|---------|
| `NODE_ENV` | Ambiente de execução | `development`, `production` |
| `NEXT_PUBLIC_API_URL` | URL da API backend | `http://localhost:8000` |
| `NEXT_PUBLIC_FRONTEND_URL` | URL do frontend | `http://localhost:3000` |
| `NEXT_PUBLIC_APP_NAME` | Nome da aplicação | `Orion ERP` |
| `NEXT_PUBLIC_APP_VERSION` | Versão da aplicação | `2.0.0` |
| `NEXT_PUBLIC_ENABLE_AI_PROCESSING` | Habilitar processamento IA | `true`, `false` |
| `NEXT_PUBLIC_ENABLE_GUIDED_TOUR` | Habilitar tour guiado | `true`, `false` |
| `NEXT_PUBLIC_ENABLE_DEBUG_LOGS` | Habilitar logs de debug | `true`, `false` |

**Importante:**
- Todas as variáveis que começam com `NEXT_PUBLIC_` são expostas no navegador
- Nunca coloque senhas ou chaves secretas em variáveis `NEXT_PUBLIC_`
- O arquivo `.env.local` NÃO deve ser commitado no Git (já está no `.gitignore`)

---

## 🚀 Inicialização do Servidor

### 1. Certifique-se de que o Backend está Rodando

Antes de iniciar o frontend, o backend deve estar rodando em `http://localhost:8000`:

```bash
# Em outro terminal, vá para a pasta backend
cd backend

# Ative o ambiente virtual
source venv/bin/activate  # macOS/Linux
# ou
.\venv\Scripts\activate   # Windows

# Inicie o backend
python main.py
```

Você deve ver:
```
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
```

### 2. Iniciar Servidor de Desenvolvimento

```bash
# Na pasta admin/
npm run dev

# Ou com turbopack (mais rápido - recomendado)
npm run dev --turbopack
```

**Parâmetros disponíveis:**
- `--turbopack`: Usa o novo bundler Turbopack (muito mais rápido)
- `--port 3001`: Usa porta diferente se 3000 estiver ocupada

### 3. Verificar Inicialização

Você deve ver algo como:

```
  ▲ Next.js 15.5.3
  - Local:        http://localhost:3000
  - Environments: .env.local

 ✓ Ready in 2.1s
```

### 4. Scripts Disponíveis

```bash
# Desenvolvimento com hot reload
npm run dev

# Build para produção
npm run build

# Iniciar servidor de produção (após build)
npm run start

# Executar linter
npm run lint
```

---

## ✅ Verificação da Instalação

### 1. Acessar a Aplicação

Abra no navegador:

- **URL**: http://localhost:3000
- **Página de Login**: http://localhost:3000/auth/login
- **Dashboard Admin**: http://localhost:3000/admin/dashboard (após login)

### 2. Verificar Conexão com Backend

No navegador, abra as **DevTools** (F12) e vá para a aba **Console**.

Você deve ver logs de conexão com a API:

```
🔍 [API REQUEST DEBUG]
  Step 1 - Input:
    API_URL: http://localhost:8000
    endpoint: /health
    URL concatenada: http://localhost:8000/health
```

### 3. Testar Login

1. Vá para http://localhost:3000
2. Você será redirecionado para a página de login
3. Use as credenciais de teste (se criou um super admin no backend)
4. Ao fazer login com sucesso, você será redirecionado para o dashboard

### 4. Verificar Hot Reload

1. Abra um arquivo, por exemplo: `src/app/page.tsx`
2. Faça uma alteração simples (adicione um texto)
3. Salve o arquivo
4. O navegador deve recarregar automaticamente mostrando a alteração

### 5. Verificar Build de Produção

```bash
# Fazer build
npm run build

# Você deve ver:
# ✓ Compiled successfully
# ✓ Linting and checking validity of types
# ✓ Collecting page data
# ✓ Generating static pages
# ✓ Finalizing page optimization

# Iniciar em modo produção
npm run start
```

---

## 🐛 Troubleshooting

### Erro: "Cannot find module 'next'"

```bash
# Deletar node_modules e package-lock.json
rm -rf node_modules package-lock.json

# Limpar cache do npm
npm cache clean --force

# Reinstalar dependências
npm install
```

### Erro: "Port 3000 already in use"

```bash
# Método 1: Usar outra porta
npm run dev -- --port 3001

# Método 2: Encontrar e matar o processo na porta 3000
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# macOS/Linux
lsof -i :3000
kill -9 <PID>
```

### Erro: "Failed to fetch" ou "Network Error"

Verifique se:

1. Backend está rodando em `http://localhost:8000`
2. URL da API está correta no `.env.local`
3. CORS está configurado no backend

```bash
# Testar se backend está respondendo
curl http://localhost:8000/health

# Deve retornar:
# {"status":"healthy","database":"connected","version":"2.0.0"}
```

### Erro: "Module not found: Can't resolve '@/...'

O alias `@` aponta para a pasta `src/`. Verifique o `tsconfig.json`:

```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

Se o erro persistir:

```bash
# Reiniciar o servidor de desenvolvimento
# Ctrl+C para parar
npm run dev
```

### Erro: "TypeScript error" durante build

```bash
# Verificar erros de tipo
npm run lint

# Se houver muitos erros, você pode temporariamente ignorar (NÃO recomendado para produção)
# No next.config.mjs, adicione:
typescript: {
  ignoreBuildErrors: true,
},
```

### Erro: "Out of memory" durante build

```bash
# Aumentar limite de memória do Node.js
# Windows
set NODE_OPTIONS=--max-old-space-size=4096 && npm run build

# macOS/Linux
export NODE_OPTIONS=--max-old-space-size=4096
npm run build
```

### Problema: Mudanças não aparecem (cache)

```bash
# Deletar cache do Next.js
rm -rf .next

# Reiniciar servidor
npm run dev
```

### Problema: Estilos Tailwind não aparecem

1. Verifique se `tailwind.config.ts` aponta para os arquivos corretos:

```typescript
content: [
  './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
  './src/components/**/*.{js,ts,jsx,tsx,mdx}',
  './src/app/**/*.{js,ts,jsx,tsx,mdx}',
],
```

2. Verifique se `globals.css` importa Tailwind:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

3. Reinicie o servidor de desenvolvimento.

---

## 📝 Próximos Passos

Após configurar o ambiente frontend:

1. [Entender Estrutura do Projeto](estrutura-projeto.md)
2. [Explorar Componentes](componentes.md)
3. [Aprender sobre Hooks Customizados](hooks-customizados.md)
4. [Consultar Guia de Primeiros Passos](../../10-guias-usuario/primeiros-passos.md)

---

## 🔗 Referências

- [Documentação Next.js 15](https://nextjs.org/docs)
- [Documentação React 18](https://react.dev/)
- [Documentação TypeScript](https://www.typescriptlang.org/docs/)
- [Documentação Tailwind CSS](https://tailwindcss.com/docs)
- [Documentação Shadcn/UI](https://ui.shadcn.com/)

---

## 💡 Dicas de Desenvolvimento

### Usar um bom IDE

Recomendações:
- **VS Code** (recomendado) com extensões:
  - ESLint
  - Prettier
  - Tailwind CSS IntelliSense
  - TypeScript and JavaScript Language Features
  - Auto Rename Tag
  - Auto Close Tag
  - Path Intellisense

- **WebStorm** (alternativo)

### Configurar Prettier

Crie `.prettierrc` na raiz do projeto:

```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false
}
```

### Habilitar Auto-save

No VS Code, configure auto-save:
1. File > Preferences > Settings
2. Pesquise "auto save"
3. Selecione "afterDelay"
4. Configure o delay (ex: 1000ms)

### Usar React DevTools

Instale a extensão React DevTools no navegador:
- [Chrome](https://chrome.google.com/webstore/detail/react-developer-tools/fmkadmapgofadopljbjfkapdkoienihi)
- [Firefox](https://addons.mozilla.org/en-US/firefox/addon/react-devtools/)

### Atalhos Úteis do Next.js

```bash
# Verificar bundle size
npm run build

# Analisar bundle (instalar @next/bundle-analyzer)
npm install @next/bundle-analyzer
```

---

**Pronto!** Seu ambiente frontend está configurado e funcionando. 🎉
