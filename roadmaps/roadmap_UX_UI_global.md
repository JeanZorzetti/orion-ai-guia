# 🎨 Roadmap UX/UI Global - Orion ERP

> Aprimoramento da navegação, sidebar e header do sistema
>
> **Baseado em:** Pesquisa profunda de best practices 2025
>
> **Foco:** Sidebar colapsável, header modernizado, branding e navegação

---

## 📋 Sumário Executivo

Este roadmap visa transformar a experiência global do usuário no Orion ERP através de melhorias na sidebar, header e navegação. Baseado em pesquisas das melhores práticas de 2025, implementaremos:

- **Sidebar colapsável** com modo mini (icon-only)
- **Header modernizado** com breadcrumbs e melhor organização
- **Workspace selector** aprimorado para multi-tenancy
- **Branding** sutil e profissional
- **Dark mode** nativo e bem integrado
- **Responsividade** mobile-first completa

---

## 🎯 Análise da Situação Atual

### Problemas Identificados (Screenshot fornecido):

**Sidebar (Retângulo Vermelho Esquerdo):**
- ❌ Não é colapsável (ocupa espaço fixo)
- ❌ Sem modo mini (icon-only)
- ❌ Sem hover states claros
- ❌ Ícones pouco expressivos
- ❌ Workspace selector sem destaque visual
- ❌ Sem indicadores de seção ativa

**Header (Retângulo Vermelho Superior):**
- ❌ Branding genérico ("Empresa Exemplo Ltda")
- ❌ Falta breadcrumb navigation
- ❌ User profile pouco informativo
- ❌ Busca global pouco destacada
- ❌ Sem notificações ou quick actions
- ❌ Layout desperdiçando espaço

### Oportunidades Baseadas em Best Practices 2025:

✅ **Sidebar colapsável** (standard em 2025)
✅ **Icon-only mini mode** para maximizar espaço
✅ **Sticky sidebar** com scroll independente
✅ **Hover states** e feedback visual
✅ **Breadcrumbs** no header
✅ **Global search** proeminente
✅ **User menu** com avatar e dropdown
✅ **Workspace switcher** visual

---

## 📐 Arquitetura das Fases

### **FASE 1: Sidebar Colapsável com Modo Mini** ✅ **CONCLUÍDA**

**Objetivo:** Implementar sidebar responsiva com toggle e modo icon-only

**Status:** ✅ Implementada (commits `7d57748c` e `69d6fa53`)

- ✅ SidebarContext com localStorage
- ✅ Componentes modulares (Sidebar, SidebarItem, SidebarSubmenu, SidebarToggle)
- ✅ Estados: 280px (expandido) → 72px (colapsado)
- ✅ Tooltips no modo colapsado
- ✅ Navegação separada de toggle (fix)
- ✅ Auto-expansão de submenus ativos

### **FASE 2: Header Modernizado com Breadcrumbs** ✅ **CONCLUÍDA**

**Objetivo:** Refatorar header com navegação hierárquica e branding

**Status:** ✅ Implementada (commit `[próximo]`)

- ✅ Breadcrumbs component com geração automática de rotas
- ✅ UserMenu component com avatar, dropdown e logout
- ✅ AdminHeader refatorado com novo layout
- ✅ Logo clicável para dashboard
- ✅ Global Search com placeholder "Buscar... (Ctrl+K)"
- ✅ Quick Actions (Notificações com badge, Help)
- ✅ Header sticky (z-40)
- ✅ Layout: Logo | Breadcrumbs | Search | Actions | User

### **FASE 3: Workspace Selector Aprimorado** ✅ **CONCLUÍDA**

**Objetivo:** Melhorar UX do seletor de workspace multi-tenant

**Status:** ✅ Implementada (commit `[próximo]`)

- ✅ WorkspaceSelector component com dropdown
- ✅ Avatar com iniciais do workspace
- ✅ Badge de role (Super Admin, Admin, Membro)
- ✅ Posicionado após header na sidebar
- ✅ Modo colapsado: apenas avatar
- ✅ Command menu com busca (>5 workspaces)
- ✅ Opção "Criar novo workspace"
- ✅ Lógica de troca com reload
- ✅ Integrado no AdminSidebar com Separator

### **FASE 4: Estados Visuais e Interações** 🎯 **PRÓXIMA**

**Objetivo:** Implementar hover, active, focus states consistentes

### **FASE 5: Global Search e Quick Actions**

**Objetivo:** Adicionar busca global e ações rápidas

### **FASE 6: Responsividade Mobile**

**Objetivo:** Adaptar sidebar e header para mobile

### **FASE 7: Tema e Personalização**

**Objetivo:** Dark mode nativo e preferências do usuário

---

## 🚀 FASE 1: Sidebar Colapsável com Modo Mini

### 📊 Análise de Mercado

**Referências de 2025:**
- **shadcn/ui Sidebar Component** - Collapsible, themeable, customizable
- **Material Angular Responsive Sidebar** - Mini mode com icons
- **Next.js Retractable Sidebar** - Mini (85px) e Wide (250px) layouts

**Padrões Identificados:**
- Largura Full: 240-280px
- Largura Mini: 64-85px
- Transição suave: 300-400ms
- Icons de 20-24px
- Hover trigger para expandir temporariamente

### 🎨 Especificações de Design

**Estados da Sidebar:**

```typescript
enum SidebarState {
  EXPANDED = 'expanded',  // 280px - desktop padrão
  COLLAPSED = 'collapsed', // 72px - modo mini
  HIDDEN = 'hidden'       // 0px - mobile fechado
}
```

**Visual Specs:**

| Estado | Largura | Conteúdo Visível |
|--------|---------|------------------|
| Expanded | 280px | Icons + Labels + Submenu |
| Collapsed | 72px | Icons only |
| Hidden | 0px | Overlay mobile |

**Componentes:**

1. **Toggle Button**
   - Posição: Top da sidebar
   - Icon: ChevronLeft/ChevronRight
   - Size: 40x40px
   - Sticky: Sim

2. **Menu Items**
   - Height: 44px
   - Padding: 12px 16px
   - Border-radius: 8px
   - Transition: all 300ms ease

3. **Icons**
   - Size: 24x24px
   - Stroke-width: 2px
   - Color: text-muted-foreground
   - Active: text-foreground

4. **Labels**
   - Font: 14px medium
   - Truncate: ellipsis
   - Fade out: opacity transition

### 💻 Implementação Técnica

**Estrutura de Arquivos:**

```
admin/src/components/layout/
├── Sidebar/
│   ├── Sidebar.tsx          # Container principal
│   ├── SidebarToggle.tsx    # Botão de toggle
│   ├── SidebarItem.tsx      # Item de menu
│   ├── SidebarSubmenu.tsx   # Submenu colapsável
│   └── SidebarFooter.tsx    # Footer com user/logout
├── Header/
│   └── (Fase 2)
└── Layout.tsx               # Layout wrapper
```

**Código Base - Sidebar.tsx:**

```typescript
'use client';

import React, { useState, createContext, useContext } from 'react';
import { cn } from '@/lib/utils';
import { ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SidebarContextType {
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  isMobile: boolean;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) throw new Error('useSidebar must be used within SidebarProvider');
  return context;
};

interface SidebarProps {
  children: React.ReactNode;
  defaultCollapsed?: boolean;
  className?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  children,
  defaultCollapsed = false,
  className = '',
}) => {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);
  const [isMobile] = useState(false); // Detectar com useMediaQuery

  return (
    <SidebarContext.Provider value={{ isCollapsed, setIsCollapsed, isMobile }}>
      <aside
        className={cn(
          'relative flex flex-col border-r bg-card transition-all duration-300',
          isCollapsed ? 'w-[72px]' : 'w-[280px]',
          className
        )}
      >
        {/* Toggle Button */}
        <div className="flex h-16 items-center justify-between px-4">
          {!isCollapsed && (
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-primary" />
              <span className="text-lg font-semibold">Orion ERP</span>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={cn('transition-all', isCollapsed && 'mx-auto')}
          >
            <ChevronLeft
              className={cn(
                'h-5 w-5 transition-transform',
                isCollapsed && 'rotate-180'
              )}
            />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {children}
        </nav>

        {/* Footer será adicionado aqui */}
      </aside>
    </SidebarContext.Provider>
  );
};
```

**SidebarItem.tsx:**

```typescript
'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSidebar } from './Sidebar';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface SidebarItemProps {
  icon: LucideIcon;
  label: string;
  href: string;
  badge?: number;
}

export const SidebarItem: React.FC<SidebarItemProps> = ({
  icon: Icon,
  label,
  href,
  badge,
}) => {
  const pathname = usePathname();
  const { isCollapsed } = useSidebar();
  const isActive = pathname === href || pathname.startsWith(href + '/');

  const content = (
    <Link
      href={href}
      className={cn(
        'group flex h-11 items-center gap-3 rounded-lg px-3 transition-all',
        'hover:bg-accent hover:text-accent-foreground',
        isActive && 'bg-accent text-accent-foreground font-medium',
        isCollapsed && 'justify-center px-2'
      )}
    >
      <Icon className="h-5 w-5 shrink-0" />
      {!isCollapsed && (
        <>
          <span className="truncate">{label}</span>
          {badge && badge > 0 && (
            <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground">
              {badge > 99 ? '99+' : badge}
            </span>
          )}
        </>
      )}
    </Link>
  );

  if (isCollapsed) {
    return (
      <TooltipProvider delayDuration={0}>
        <Tooltip>
          <TooltipTrigger asChild>{content}</TooltipTrigger>
          <TooltipContent side="right">
            <p>{label}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return content;
};
```

**SidebarSubmenu.tsx:**

```typescript
'use client';

import React, { useState } from 'react';
import { ChevronDown, LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSidebar } from './Sidebar';
import { SidebarItem } from './SidebarItem';

interface SubmenuItem {
  icon: LucideIcon;
  label: string;
  href: string;
}

interface SidebarSubmenuProps {
  icon: LucideIcon;
  label: string;
  items: SubmenuItem[];
  defaultOpen?: boolean;
}

export const SidebarSubmenu: React.FC<SidebarSubmenuProps> = ({
  icon: Icon,
  label,
  items,
  defaultOpen = false,
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const { isCollapsed } = useSidebar();

  if (isCollapsed) {
    // Em modo collapsed, mostrar items diretamente sem agrupamento
    return (
      <>
        {items.map((item) => (
          <SidebarItem key={item.href} {...item} />
        ))}
      </>
    );
  }

  return (
    <div className="space-y-1">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="group flex h-11 w-full items-center gap-3 rounded-lg px-3 transition-all hover:bg-accent hover:text-accent-foreground"
      >
        <Icon className="h-5 w-5 shrink-0" />
        <span className="flex-1 truncate text-left">{label}</span>
        <ChevronDown
          className={cn(
            'h-4 w-4 transition-transform',
            isOpen && 'rotate-180'
          )}
        />
      </button>
      {isOpen && (
        <div className="ml-6 space-y-1">
          {items.map((item) => (
            <SidebarItem key={item.href} {...item} />
          ))}
        </div>
      )}
    </div>
  );
};
```

### 📱 Responsividade

**Breakpoints:**

```typescript
// tailwind.config.js
screens: {
  'sm': '640px',   // Mobile large
  'md': '768px',   // Tablet
  'lg': '1024px',  // Desktop
  'xl': '1280px',  // Desktop large
  '2xl': '1536px', // Desktop XL
}
```

**Comportamento:**

| Tamanho | Sidebar Behavior |
|---------|------------------|
| < 768px | Hidden by default, overlay quando aberta |
| 768px - 1024px | Collapsed by default |
| > 1024px | Expanded by default |

**Mobile Overlay:**

```typescript
// Em mobile, sidebar vira overlay
{isMobile && !isCollapsed && (
  <div
    className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm"
    onClick={() => setIsCollapsed(true)}
  />
)}

<aside
  className={cn(
    'fixed lg:relative z-50',
    isMobile && isCollapsed && '-translate-x-full',
    'transition-transform duration-300'
  )}
>
  {/* Conteúdo */}
</aside>
```

### ✅ Checklist de Implementação

**Componentes:**
- [ ] Sidebar container com context
- [ ] SidebarToggle button
- [ ] SidebarItem básico
- [ ] SidebarSubmenu colapsável
- [ ] Tooltip para modo collapsed
- [ ] Badge de notificação
- [ ] SidebarFooter

**Estados:**
- [ ] Expanded state (280px)
- [ ] Collapsed state (72px)
- [ ] Mobile overlay
- [ ] Hover states
- [ ] Active state
- [ ] Focus states

**Persistência:**
- [ ] LocalStorage para salvar estado
- [ ] User preference API
- [ ] Restore state on load

**Acessibilidade:**
- [ ] Keyboard navigation (Tab, Arrow keys)
- [ ] ARIA labels
- [ ] Focus trap em mobile overlay
- [ ] Escape para fechar mobile

**Performance:**
- [ ] React.memo nos items
- [ ] Lazy load de submenus
- [ ] Debounce no toggle
- [ ] CSS transitions (não JS)

### 🎨 Variantes de Tema

**Light Mode:**
```css
--sidebar-bg: hsl(0 0% 100%);
--sidebar-border: hsl(214.3 31.8% 91.4%);
--sidebar-item-hover: hsl(210 40% 96%);
--sidebar-item-active: hsl(210 40% 92%);
```

**Dark Mode:**
```css
--sidebar-bg: hsl(222.2 84% 4.9%);
--sidebar-border: hsl(217.2 32.6% 17.5%);
--sidebar-item-hover: hsl(217.2 32.6% 12%);
--sidebar-item-active: hsl(217.2 32.6% 15%);
```

### 📊 Métricas de Sucesso

**Performance:**
- Toggle animation: < 300ms
- First paint: < 100ms
- Interaction to next paint: < 100ms

**UX:**
- Redução de cliques para acessar páginas: -30%
- Aumento de espaço útil em collapsed: +15%
- Satisfação do usuário: > 4.5/5

**Acessibilidade:**
- Lighthouse Accessibility Score: 100
- WCAG 2.1 Level AA: Compliant
- Keyboard navigation: 100% funcional

---

## 🎯 FASE 2: Header Modernizado com Breadcrumbs

### 📊 Análise de Mercado

**Best Practices 2025:**
- Breadcrumb navigation para contexto hierárquico
- Global search bar proeminente
- User menu com avatar e dropdown
- Notificações em tempo real
- Quick actions rápidos
- Branding sutil (logo pequeno)

**Referências:**
- Admin dashboards mantêm branding pequeno (logo ou icon)
- Header sticky para manter contexto
- Altura ideal: 60-64px
- Layout: Logo | Breadcrumbs | Search | Actions | User

### 🎨 Especificações de Design

**Layout do Header:**

```
┌─────────────────────────────────────────────────────────────────┐
│ [Logo] [Breadcrumbs...] [🔍 Search] [🔔] [⚡] [👤 User ▼] │
│  64px      flex-1         300px      40  40    auto          │
└─────────────────────────────────────────────────────────────────┘
     Height: 64px
```

**Componentes:**

1. **Logo/Brand**
   - Size: 32x32px
   - Clickable → /admin/dashboard
   - Tooltip: "Ir para Dashboard"

2. **Breadcrumbs**
   - Max items: 4 (auto collapse com ...)
   - Separator: ChevronRight (16px)
   - Font: 14px regular
   - Last item: 14px medium

3. **Global Search**
   - Width: 300px (expandable to 400px)
   - Placeholder: "Buscar... (Ctrl+K)"
   - Keyboard shortcut: Ctrl/Cmd + K
   - Results: Dropdown com categories

4. **Quick Actions**
   - Notificações badge
   - Quick add (+)
   - Help (?)
   - Size: 40x40px each

5. **User Menu**
   - Avatar 36x36px
   - Name + Role
   - Dropdown: Profile, Settings, Logout

### 💻 Implementação Técnica

**Header.tsx:**

```typescript
'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Search, Bell, Plus, HelpCircle, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export const Header: React.FC = () => {
  const pathname = usePathname();

  // Gerar breadcrumbs do pathname
  const breadcrumbs = generateBreadcrumbs(pathname);

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b bg-background px-6">
      {/* Logo */}
      <Link
        href="/admin/dashboard"
        className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary hover:opacity-90 transition-opacity"
      >
        <span className="text-lg font-bold text-primary-foreground">O</span>
      </Link>

      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 text-sm">
        {breadcrumbs.map((crumb, index) => (
          <React.Fragment key={crumb.href}>
            {index > 0 && (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )}
            {index === breadcrumbs.length - 1 ? (
              <span className="font-medium text-foreground">{crumb.label}</span>
            ) : (
              <Link
                href={crumb.href}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                {crumb.label}
              </Link>
            )}
          </React.Fragment>
        ))}
      </nav>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Global Search */}
      <div className="relative w-80">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Buscar... (Ctrl+K)"
          className="pl-10"
          onClick={() => {
            // Abrir command palette
          }}
        />
      </div>

      {/* Quick Actions */}
      <Button variant="ghost" size="icon" className="relative">
        <Bell className="h-5 w-5" />
        <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-medium text-white">
          3
        </span>
      </Button>

      <Button variant="ghost" size="icon">
        <Plus className="h-5 w-5" />
      </Button>

      <Button variant="ghost" size="icon">
        <HelpCircle className="h-5 w-5" />
      </Button>

      {/* User Menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="gap-2 px-2">
            <Avatar className="h-8 w-8">
              <AvatarImage src="/avatars/user.jpg" />
              <AvatarFallback>JS</AvatarFallback>
            </Avatar>
            <div className="hidden text-left lg:block">
              <div className="text-sm font-medium">João Silva</div>
              <div className="text-xs text-muted-foreground">
                joao@empresa.com
              </div>
            </div>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem>
            <Link href="/admin/perfil" className="w-full">
              Perfil
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Link href="/admin/configuracoes" className="w-full">
              Configurações
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="text-red-600">
            Sair
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
};

// Helper function
function generateBreadcrumbs(pathname: string) {
  const segments = pathname.split('/').filter(Boolean);
  const breadcrumbs = [];

  let href = '';
  for (const segment of segments) {
    href += `/${segment}`;
    breadcrumbs.push({
      label: formatSegment(segment),
      href,
    });
  }

  return breadcrumbs;
}

function formatSegment(segment: string): string {
  // admin → Dashboard
  // financeiro → Financeiro
  // contas-a-pagar → Contas a Pagar
  const map: Record<string, string> = {
    admin: 'Dashboard',
    financeiro: 'Financeiro',
    estoque: 'Estoque',
    vendas: 'Vendas',
    'contas-a-pagar': 'Contas a Pagar',
    'contas-a-receber': 'Contas a Receber',
  };

  return map[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);
}
```

### 🔍 Global Search (Command Palette)

**CommandPalette.tsx:**

```typescript
'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  LayoutDashboard,
  DollarSign,
  Package,
  ShoppingCart,
  FileText,
} from 'lucide-react';

export const CommandPalette: React.FC = () => {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const handleSelect = (href: string) => {
    setOpen(false);
    router.push(href);
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Buscar páginas, ações..." />
      <CommandList>
        <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>

        <CommandGroup heading="Páginas">
          <CommandItem onSelect={() => handleSelect('/admin/dashboard')}>
            <LayoutDashboard className="mr-2 h-4 w-4" />
            <span>Dashboard</span>
          </CommandItem>
          <CommandItem onSelect={() => handleSelect('/admin/financeiro')}>
            <DollarSign className="mr-2 h-4 w-4" />
            <span>Financeiro</span>
          </CommandItem>
          <CommandItem onSelect={() => handleSelect('/admin/estoque')}>
            <Package className="mr-2 h-4 w-4" />
            <span>Estoque</span>
          </CommandItem>
          <CommandItem onSelect={() => handleSelect('/admin/vendas')}>
            <ShoppingCart className="mr-2 h-4 w-4" />
            <span>Vendas</span>
          </CommandItem>
        </CommandGroup>

        <CommandGroup heading="Ações Rápidas">
          <CommandItem onSelect={() => handleSelect('/admin/vendas/nova')}>
            <ShoppingCart className="mr-2 h-4 w-4" />
            <span>Nova Venda</span>
          </CommandItem>
          <CommandItem onSelect={() => handleSelect('/admin/estoque/produtos/novo')}>
            <Package className="mr-2 h-4 w-4" />
            <span>Novo Produto</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
};
```

### ✅ Checklist Fase 2

**Componentes:**
- [ ] Header container
- [ ] Breadcrumbs dinâmicos
- [ ] Global search input
- [ ] Command palette (Ctrl+K)
- [ ] Notification bell com badge
- [ ] Quick actions buttons
- [ ] User menu dropdown
- [ ] Avatar component

**Funcionalidades:**
- [ ] Breadcrumbs auto-gerados
- [ ] Search keyboard shortcut
- [ ] Notification center
- [ ] User profile dropdown
- [ ] Logout functionality
- [ ] Sticky header

**Responsividade:**
- [ ] Mobile: hide breadcrumbs
- [ ] Tablet: hide user name
- [ ] Desktop: full layout

---

## 🏢 FASE 3: Workspace Selector Aprimorado

### 📊 Análise

**Multi-tenancy Pattern:**
- Usuário pode ter acesso a múltiplos workspaces
- Workspace atual deve estar sempre visível
- Troca rápida entre workspaces
- Indicação visual clara

**Best Practices:**
- Dropdown com lista de workspaces
- Avatar/Logo do workspace
- Badge de role (Admin, Member, Guest)
- Search se > 5 workspaces

### 🎨 Design

**Posicionamento:** Topo da sidebar, após toggle

```
┌──────────────────────────┐
│ [☰] Orion ERP          │ ← Toggle
├──────────────────────────┤
│ [🏢] Empresa XYZ    [▼]│ ← Workspace Selector
├──────────────────────────┤
│ Dashboard               │
│ Financeiro              │
│ ...                     │
```

**WorkspaceSelector.tsx:**

```typescript
'use client';

import React from 'react';
import { Check, ChevronsUpDown, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';

interface Workspace {
  id: string;
  name: string;
  role: 'admin' | 'member' | 'guest';
}

const workspaces: Workspace[] = [
  { id: '1', name: 'Empresa Exemplo Ltda', role: 'admin' },
  { id: '2', name: 'Meu Negócio', role: 'member' },
  { id: '3', name: 'Projeto Beta', role: 'guest' },
];

export const WorkspaceSelector: React.FC = () => {
  const [open, setOpen] = React.useState(false);
  const [value, setValue] = React.useState('1');

  const selectedWorkspace = workspaces.find((ws) => ws.id === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between px-3 h-12"
        >
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                {selectedWorkspace?.name.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col items-start">
              <span className="text-sm font-medium truncate max-w-[160px]">
                {selectedWorkspace?.name}
              </span>
              <span className="text-xs text-muted-foreground">
                {selectedWorkspace?.role}
              </span>
            </div>
          </div>
          <ChevronsUpDown className="ml-auto h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[280px] p-0">
        <Command>
          <CommandInput placeholder="Buscar workspace..." />
          <CommandEmpty>Nenhum workspace encontrado.</CommandEmpty>
          <CommandGroup>
            {workspaces.map((workspace) => (
              <CommandItem
                key={workspace.id}
                value={workspace.id}
                onSelect={(currentValue) => {
                  setValue(currentValue);
                  setOpen(false);
                  // Trocar workspace e recarregar dados
                }}
              >
                <div className="flex items-center gap-3 flex-1">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-xs">
                      {workspace.name.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{workspace.name}</span>
                    <Badge variant="secondary" className="w-fit text-[10px]">
                      {workspace.role}
                    </Badge>
                  </div>
                </div>
                <Check
                  className={cn(
                    'ml-auto h-4 w-4',
                    value === workspace.id ? 'opacity-100' : 'opacity-0'
                  )}
                />
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandGroup>
            <CommandItem className="text-primary">
              <Plus className="mr-2 h-4 w-4" />
              <span>Criar novo workspace</span>
            </CommandItem>
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
};
```

---

## 🎨 FASE 4: Estados Visuais e Interações

### Especificações de Estados

**Hover:**
```css
.sidebar-item:hover {
  background-color: hsl(var(--accent));
  color: hsl(var(--accent-foreground));
  transition: all 150ms ease;
}
```

**Active:**
```css
.sidebar-item[aria-current="page"] {
  background-color: hsl(var(--accent));
  color: hsl(var(--accent-foreground));
  font-weight: 500;
  border-left: 3px solid hsl(var(--primary));
}
```

**Focus:**
```css
.sidebar-item:focus-visible {
  outline: 2px solid hsl(var(--primary));
  outline-offset: 2px;
}
```

**Disabled:**
```css
.sidebar-item[aria-disabled="true"] {
  opacity: 0.5;
  cursor: not-allowed;
  pointer-events: none;
}
```

### Animações

```typescript
// framer-motion variants
const sidebarVariants = {
  expanded: {
    width: 280,
    transition: { duration: 0.3, ease: 'easeInOut' }
  },
  collapsed: {
    width: 72,
    transition: { duration: 0.3, ease: 'easeInOut' }
  }
};

const itemVariants = {
  hover: {
    scale: 1.02,
    transition: { duration: 0.15 }
  }
};
```

---

## 🔍 FASE 5: Global Search e Quick Actions

### Command Palette Features

**Categorias de Busca:**
- Páginas (Dashboard, Financeiro, etc.)
- Ações (Nova Venda, Novo Produto)
- Relatórios (DRE, Fluxo de Caixa)
- Configurações
- Ajuda/Documentação

**Keyboard Shortcuts:**
- `Ctrl/Cmd + K` - Abrir
- `Esc` - Fechar
- `↑/↓` - Navegar
- `Enter` - Selecionar
- `Ctrl/Cmd + Number` - Ação rápida

### Quick Actions

**Botões no Header:**
1. **Nova Venda** (Plus icon)
2. **Notificações** (Bell icon + badge)
3. **Ajuda** (Help icon)
4. **Config Rápida** (Settings)

---

## 📱 FASE 6: Responsividade Mobile

### Breakpoint Behavior

**Mobile (< 768px):**
- Sidebar como drawer/overlay
- Hamburger menu no header
- Breadcrumbs hidden
- Search full-width quando ativo
- User menu icon-only

**Tablet (768px - 1024px):**
- Sidebar collapsed por padrão
- Breadcrumbs com max 2 items
- Search normal

**Desktop (> 1024px):**
- Sidebar expanded
- Full breadcrumbs
- Tudo visível

### Mobile Header

```typescript
// MobileHeader.tsx
export const MobileHeader = () => {
  return (
    <header className="lg:hidden">
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon">
            <Menu />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-[280px] p-0">
          {/* Sidebar content aqui */}
        </SheetContent>
      </Sheet>

      {/* Logo, Search, User */}
    </header>
  );
};
```

---

## 🌓 FASE 7: Tema e Personalização

### Dark Mode

**Toggle no Sidebar Footer:**
```typescript
<Button
  variant="ghost"
  size="icon"
  onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
>
  {theme === 'dark' ? <Sun /> : <Moon />}
</Button>
```

### User Preferences

**Configurações Persistidas:**
- Sidebar collapsed/expanded
- Tema (light/dark/system)
- Densidade (comfortable/compact)
- Ordem dos menu items (drag & drop)

**LocalStorage:**
```typescript
const savePreference = (key: string, value: any) => {
  localStorage.setItem(`orion-erp-${key}`, JSON.stringify(value));
};

const loadPreference = (key: string, defaultValue: any) => {
  const saved = localStorage.getItem(`orion-erp-${key}`);
  return saved ? JSON.parse(saved) : defaultValue;
};
```

---

## 📊 Métricas de Sucesso Global

### Performance
- First Contentful Paint: < 1.5s
- Time to Interactive: < 3s
- Lighthouse Score: > 90

### UX
- Task Success Rate: > 95%
- Time on Task: -20%
- User Satisfaction: > 4.5/5
- Accessibility Score: 100

### Adoption
- Feature Discovery: > 80%
- Daily Active Users: +15%
- Support Tickets: -30%

---

## 🎯 Resumo das Prioridades

| Fase | Prioridade | Impacto | Esforço | ROI |
|------|-----------|---------|---------|-----|
| 1. Sidebar Colapsável | 🔴 ALTA | Alto | Médio | ⭐⭐⭐⭐⭐ |
| 2. Header + Breadcrumbs | 🟡 MÉDIA | Alto | Médio | ⭐⭐⭐⭐ |
| 3. Workspace Selector | 🟡 MÉDIA | Médio | Baixo | ⭐⭐⭐⭐ |
| 4. Estados Visuais | 🟢 BAIXA | Médio | Baixo | ⭐⭐⭐ |
| 5. Command Palette | 🟡 MÉDIA | Alto | Alto | ⭐⭐⭐⭐ |
| 6. Mobile | 🔴 ALTA | Alto | Alto | ⭐⭐⭐⭐⭐ |
| 7. Tema | 🟢 BAIXA | Médio | Baixo | ⭐⭐⭐ |

---

## 🚀 Ordem de Implementação Recomendada

1. **FASE 1** - Sidebar Colapsável (Base de tudo)
2. **FASE 3** - Workspace Selector (Depende da Fase 1)
3. **FASE 2** - Header + Breadcrumbs (Independente)
4. **FASE 4** - Estados Visuais (Polish)
5. **FASE 6** - Mobile (Crítico para UX)
6. **FASE 5** - Command Palette (Nice to have)
7. **FASE 7** - Personalização (Final polish)

---

## 📚 Referências

**Pesquisa Realizada:**
- Sidebar Navigation Best Practices 2025
- Admin Dashboard UI/UX Principles
- shadcn/ui Sidebar Component
- Material Angular Responsive Sidebar
- Multi-tenant Workspace Design Patterns
- Command Palette UX Patterns
- Mobile Dashboard Navigation
- Dark Mode Implementation Best Practices

**Ferramentas Utilizadas:**
- shadcn/ui components
- Tailwind CSS
- Framer Motion
- React Context
- Local Storage API

---

**🎉 Com este roadmap, o Orion ERP terá uma navegação moderna, eficiente e alinhada com as melhores práticas de 2025!**
