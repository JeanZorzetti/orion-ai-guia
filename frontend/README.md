# Orion ERP - Frontend

Frontend do sistema Orion ERP construído com Next.js 14, TypeScript e Tailwind CSS.

## 🚀 Tecnologias

- **Next.js 14+** - Framework React com App Router
- **TypeScript** - Tipagem estática
- **Tailwind CSS v4** - Framework CSS utility-first
- **React 19** - Biblioteca de interface

## 📁 Estrutura do Projeto

```
frontend/
├── src/
│   ├── app/               # Rotas da aplicação (App Router)
│   │   ├── login/         # Página de login
│   │   ├── register/      # Página de registro
│   │   ├── dashboard/     # Dashboard principal
│   │   └── page.tsx       # Página inicial (redireciona para login)
│   ├── components/        # Componentes React
│   │   ├── ui/            # Componentes atômicos (Button, Input, Card, Badge)
│   │   └── layout/        # Componentes de layout (Header, Sidebar, MainLayout)
│   ├── lib/               # Utilitários e configurações
│   │   └── api.ts         # Cliente HTTP com interceptor de autenticação
│   ├── services/          # Serviços de API
│   │   └── auth.ts        # Serviço de autenticação
│   ├── types/             # Tipos TypeScript
│   │   └── index.ts       # Definições de tipos globais
│   ├── hooks/             # Custom React Hooks
│   └── middleware.ts      # Middleware de proteção de rotas
├── .env.local             # Variáveis de ambiente
└── package.json
```

## 🎨 Sistema de Design

### Cores

- **Primary**: `#3b82f6` (Blue)
- **Secondary**: `#8b5cf6` (Purple)
- **Success**: `#10b981` (Green)
- **Warning**: `#f59e0b` (Amber)
- **Danger**: `#ef4444` (Red)

### Componentes UI

#### Button
```tsx
<Button variant="primary" size="md" loading={false}>
  Click Me
</Button>
```
Variantes: `primary`, `secondary`, `success`, `warning`, `danger`, `outline`

#### Input
```tsx
<Input
  label="Email"
  type="email"
  error="Mensagem de erro"
  fullWidth
/>
```

#### Card
```tsx
<Card title="Título" subtitle="Subtítulo" padding="md">
  Conteúdo
</Card>
```

#### Badge
```tsx
<Badge variant="success" size="md">
  Active
</Badge>
```

## 🔒 Autenticação

O sistema utiliza JWT com dois tokens:

- **Access Token**: Armazenado em memória, expira em 30 minutos
- **Refresh Token**: Armazenado no localStorage, expira em 7 dias

### Fluxo de Autenticação

1. Login via `/api/v1/auth/token`
2. Tokens armazenados automaticamente
3. Access token incluído em todas as requisições via interceptor
4. Refresh automático quando access token expira
5. Redirecionamento para login se refresh falhar

### Proteção de Rotas

O middleware em `src/middleware.ts` protege rotas privadas:

```typescript
// Rotas públicas
publicRoutes = ['/login', '/register']

// Todas as outras rotas requerem autenticação
```

## 🌐 API Client

O cliente HTTP está configurado em `src/lib/api.ts`:

```typescript
import { api } from '@/lib/api';

// GET
const data = await api.get('/endpoint');

// POST
const result = await api.post('/endpoint', { data });

// PUT
await api.put('/endpoint/:id', { data });

// DELETE
await api.delete('/endpoint/:id');
```

## 🔧 Variáveis de Ambiente

Criar arquivo `.env.local` na raiz do projeto:

```env
NEXT_PUBLIC_API_URL=https://orionback.roilabs.com.br/api/v1
```

## 🚀 Executar Localmente

### Instalar dependências
```bash
npm install
```

### Desenvolvimento
```bash
npm run dev
```
Acesse: http://localhost:3000

### Build de Produção
```bash
npm run build
npm start
```

## 📝 Credenciais de Teste

**Admin**
- Email: `admin@orion.com`
- Senha: `admin123`

## 🔄 Próximas Implementações

- [ ] Telas de Fornecedores (CRUD completo)
- [ ] Telas de Notas Fiscais (Upload e listagem)
- [ ] Telas de Produtos (CRUD completo)
- [ ] Telas de Vendas (CRUD completo)
- [ ] Tela de Contas a Pagar
- [ ] Dashboard com gráficos e métricas reais
- [ ] Testes unitários e de integração
- [ ] Deploy na Vercel

## 📦 Deploy

O frontend será implantado na **Vercel** apontando para o domínio:
- **URL**: https://orionerp.roilabs.com.br

### Configuração de Deploy

1. Conectar repositório GitHub à Vercel
2. Definir diretório raiz: `frontend`
3. Configurar variável de ambiente: `NEXT_PUBLIC_API_URL`
4. Configurar domínio customizado
5. Deploy automático na branch `main`

## 🐛 Debug

### Problemas Comuns

**1. Erro de CORS**
- Verificar se o backend permite origem do frontend
- Backend deve incluir frontend URL em `CORS_ORIGINS`

**2. Token expirado**
- O sistema faz refresh automático
- Se persistir, limpar localStorage e fazer login novamente

**3. Rotas protegidas não funcionam**
- Verificar se refresh_token está no localStorage
- Verificar console do navegador para erros de API

## 📄 Licença

Propriedade da ROI Labs - Orion ERP
