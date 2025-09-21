# Orion ERP - Interface Administrativa

Esta é a interface administrativa completa do Orion ERP, um sistema de gestão inteligente para PMEs desenvolvido com React, TypeScript e Tailwind CSS.

## 🎯 Características Principais

### Design "IA-First"
- **Automação como Foco**: As funcionalidades de IA são o ponto de partida das ações mais importantes
- **Usabilidade Radical**: Interface projetada para extração de valor com mínimo treinamento
- **Clareza e Foco**: Design livre de desordem, focado nos fluxos essenciais

### Funcionalidades Implementadas

#### 🏠 Dashboard
- **Ações Rápidas**: Card principal com botão de importação de faturas
- **Contas a Vencer**: Lista das próximas contas a pagar
- **Alertas de Estoque**: Produtos com baixo estoque
- **Visão de Vendas**: Gráfico das vendas semanais

#### 💰 Financeiro
- **Contas a Pagar**: Gestão completa de faturas com filtros por status
- **Automação por IA**: Processamento inteligente de documentos
- **Interface Limpa**: Foco no fluxo de validação e aprovação

#### 📦 Estoque & Vendas
- **Detalhes do Produto**: Visão 360º com informações completas
- **Previsão de Demanda**: Card principal com insights preditivos da IA
- **Histórico de Vendas**: Análise de transações passadas
- **Gráficos Intuitivos**: Visualização de histórico vs previsão

### 🎓 Sistema de Onboarding

#### Modal de Boas-Vindas
- Apresentação personalizada do sistema
- Opção de tour guiado ou pular
- Design acolhedor com ícones e animações

#### Tour Guiado Interativo
- **6 Passos Principais**: Desde importação de fatura até previsão de demanda
- **Navegação Automática**: O tour navega pelas páginas automaticamente
- **Highlights Visuais**: Elementos são destacados durante o tour
- **Tooltips Contextuais**: Explicações claras em cada etapa

### 🎨 Design System

#### Arquitetura Visual
- **Layout Master**: Sidebar fixa + Header + Área de conteúdo
- **Sidebar Inteligente**: Navegação com ícones e agrupamento lógico
- **Header Contextual**: Informações da empresa e menu do usuário

#### Componentes Reutilizáveis
- Cards responsivos e modulares
- Tabelas com ações inline
- Badges de status coloridos
- Botões com estados visuais
- Modais e tooltips consistentes

## 🚀 Como Executar

```bash
# Instalar dependências
cd frontend/admin
npm install

# Executar em modo desenvolvimento
npm run dev

# Build para produção
npm run build
```

## 📁 Estrutura de Arquivos

```
frontend/admin/
├── src/
│   ├── components/
│   │   ├── layout/           # Layout master da aplicação
│   │   │   ├── AdminLayout.tsx
│   │   │   ├── AdminSidebar.tsx
│   │   │   └── AdminHeader.tsx
│   │   └── onboarding/       # Sistema de onboarding
│   │       ├── OnboardingProvider.tsx
│   │       ├── WelcomeModal.tsx
│   │       └── GuidedTour.tsx
│   ├── pages/                # Páginas principais
│   │   ├── Dashboard.tsx
│   │   ├── ContasAPagar.tsx
│   │   └── ProdutoDetalhes.tsx
│   ├── App.tsx              # Aplicação principal
│   └── main.tsx             # Entry point
├── package.json
├── vite.config.ts
└── tailwind.config.ts
```

## 🔗 Integração

A aplicação admin reutiliza:
- **Design System**: CSS e tokens do frontend principal
- **Componentes UI**: Shadcn/ui do diretório pai
- **Utilitários**: Funções compartilhadas
- **Assets**: Imagens e ícones

## 🎯 Próximos Passos

1. **Backend Integration**: Conectar com APIs reais
2. **Autenticação**: Sistema de login e permissões
3. **Notificações**: Sistema de alertas em tempo real
4. **Analytics**: Dashboards mais avançados
5. **Mobile**: Versão responsiva otimizada