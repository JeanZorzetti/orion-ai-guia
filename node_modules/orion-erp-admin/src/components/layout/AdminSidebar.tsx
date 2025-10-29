'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Home,
  DollarSign,
  BarChart3,
  Settings,
  HelpCircle,
  FileText,
  Package,
  Shield,
  LogOut,
  ShoppingCart,
  Truck,
  Plug,
  TrendingUp,
  Calendar,
  FileBarChart,
  LayoutDashboard,
  Zap,
  Brain,
  CreditCard,
  CheckCircle,
  Users,
  Percent,
  type LucideIcon
} from 'lucide-react';
import { User } from '@/types';
import { authService } from '@/services/auth';
import { Sidebar, SidebarHeader, SidebarContent, SidebarFooter, SidebarGroup } from './Sidebar/index';
import { SidebarToggle } from './Sidebar/SidebarToggle';
import { SidebarItem } from './Sidebar/SidebarItem';
import { SidebarSubmenu } from './Sidebar/SidebarSubmenu';
import { NestedSubmenu } from './Sidebar/NestedSubmenu';
import { WorkspaceSelector } from './WorkspaceSelector';
import { useSidebar } from '@/contexts/SidebarContext';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { useTheme } from '@/hooks/useTheme';

interface NavChild {
  name: string;
  href: string;
  icon: LucideIcon;
  children?: NavChild[];
}

const navigation = [
  {
    name: 'Dashboard',
    href: '/admin/dashboard',
    icon: Home,
  },
  {
    name: 'Financeiro',
    href: '/admin/financeiro',
    icon: DollarSign,
    children: [
      {
        name: 'Contas a Pagar',
        href: '/admin/financeiro/contas-a-pagar',
        icon: FileText,
        children: [
          {
            name: 'Dashboard',
            href: '/admin/financeiro/contas-a-pagar/dashboard',
            icon: LayoutDashboard,
          },
          {
            name: 'Faturas',
            href: '/admin/financeiro/contas-a-pagar',
            icon: FileText,
          },
          {
            name: 'Aprovações',
            href: '/admin/financeiro/contas-a-pagar/aprovacoes',
            icon: CheckCircle,
          },
          {
            name: 'Fornecedores',
            href: '/admin/financeiro/contas-a-pagar/fornecedores',
            icon: Users,
          },
          {
            name: 'Descontos',
            href: '/admin/financeiro/contas-a-pagar/descontos',
            icon: Percent,
          },
        ],
      },
      {
        name: 'Contas a Receber',
        href: '/admin/financeiro/contas-a-receber',
        icon: TrendingUp,
        children: [
          {
            name: 'Dashboard',
            href: '/admin/financeiro/contas-a-receber',
            icon: LayoutDashboard,
          },
          {
            name: 'Automação',
            href: '/admin/financeiro/contas-a-receber/automacao',
            icon: Zap,
          },
          {
            name: 'Análise de Risco',
            href: '/admin/financeiro/contas-a-receber/analise-risco',
            icon: Brain,
          },
          {
            name: 'Meios de Pagamento',
            href: '/admin/financeiro/contas-a-receber/pagamentos',
            icon: CreditCard,
          },
        ],
      },
      {
        name: 'Fluxo de Caixa',
        href: '/admin/financeiro/fluxo-caixa',
        icon: Calendar,
      },
      {
        name: 'Relatórios',
        href: '/admin/financeiro/relatorios',
        icon: FileBarChart,
      },
      {
        name: 'Fornecedores',
        href: '/admin/fornecedores',
        icon: Truck,
      },
    ],
  },
  {
    name: 'Vendas & Estoque',
    href: '/admin/estoque',
    icon: BarChart3,
    children: [
      {
        name: 'Vendas',
        href: '/admin/vendas',
        icon: ShoppingCart,
      },
      {
        name: 'Produtos',
        href: '/admin/estoque/produtos',
        icon: Package,
      },
    ],
  },
];

const supportNavigation = [
  {
    name: 'Configurações',
    href: '/admin/configuracoes',
    icon: Settings,
    children: [
      {
        name: 'Configurações Fiscais',
        href: '/admin/configuracoes/fiscal',
        icon: Shield,
      },
      {
        name: 'Integrações',
        href: '/admin/integracoes',
        icon: Plug,
      },
    ],
  },
  {
    name: 'Ajuda',
    href: '/admin/ajuda',
    icon: HelpCircle,
  },
];

const AdminSidebar: React.FC = () => {
  const { isCollapsed } = useSidebar();
  const { theme, setTheme } = useTheme();
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    // Carregar usuário do localStorage
    const userStr = localStorage.getItem('user');
    if (userStr) {
      setCurrentUser(JSON.parse(userStr));
    }
  }, []);

  const isSuperAdmin = currentUser?.role === 'super_admin';

  const handleLogout = () => {
    // Limpar user do localStorage
    localStorage.removeItem('user');
    // Chamar logout do authService (limpa tokens e redireciona)
    authService.logout();
  };

  return (
    <Sidebar>
      {/* Header com Logo e Toggle */}
      <SidebarHeader>
        <div className="flex items-center justify-between w-full">
          {!isCollapsed ? (
            <Link href="/admin/dashboard" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary/80 rounded-lg flex items-center justify-center">
                <span className="text-primary-foreground text-sm font-bold">O</span>
              </div>
              <span className="text-lg font-semibold">Orion ERP</span>
            </Link>
          ) : (
            <Link href="/admin/dashboard" className="flex items-center justify-center w-full">
              <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary/80 rounded-lg flex items-center justify-center">
                <span className="text-primary-foreground text-sm font-bold">O</span>
              </div>
            </Link>
          )}
          {!isCollapsed && <SidebarToggle />}
        </div>
      </SidebarHeader>

      {/* Workspace Selector */}
      <WorkspaceSelector />
      <Separator className="mx-2" />

      {/* Navegação Principal */}
      <SidebarContent>
        <SidebarGroup label="Menu Principal">
          {navigation.map((item) => {
            const hasChildren = item.children && item.children.length > 0;

            // Verificar se algum child tem children (submenu aninhado)
            const hasNestedChildren = hasChildren && item.children.some((child: NavChild) => child.children && child.children.length > 0);

            if (hasNestedChildren) {
              // Usar NestedSubmenu para submenus aninhados
              return (
                <NestedSubmenu
                  key={item.name}
                  item={{
                    label: item.name,
                    href: item.href,
                    icon: item.icon,
                    children: item.children.map((child: NavChild) => ({
                      label: child.name,
                      href: child.href,
                      icon: child.icon,
                      children: child.children?.map((grandchild: NavChild) => ({
                        label: grandchild.name,
                        href: grandchild.href,
                        icon: grandchild.icon,
                      })),
                    })),
                  }}
                />
              );
            }

            if (hasChildren) {
              return (
                <SidebarSubmenu
                  key={item.name}
                  icon={item.icon}
                  label={item.name}
                  href={item.href}
                  items={item.children.map((child: NavChild) => ({
                    label: child.name,
                    href: child.href,
                    icon: child.icon,
                  }))}
                />
              );
            }

            return (
              <SidebarItem
                key={item.name}
                icon={item.icon}
                label={item.name}
                href={item.href}
              />
            );
          })}
        </SidebarGroup>

        <SidebarGroup label="Sistema">
          {supportNavigation.map((item) => {
            const hasChildren = item.children && item.children.length > 0;

            if (hasChildren) {
              return (
                <SidebarSubmenu
                  key={item.name}
                  icon={item.icon}
                  label={item.name}
                  href={item.href}
                  items={item.children.map((child) => ({
                    label: child.name,
                    href: child.href,
                    icon: child.icon,
                  }))}
                />
              );
            }

            return (
              <SidebarItem
                key={item.name}
                icon={item.icon}
                label={item.name}
                href={item.href}
              />
            );
          })}
        </SidebarGroup>
      </SidebarContent>

      {/* Footer com Theme, Super Admin e Logout */}
      <SidebarFooter>
        <div className="space-y-2">
          {/* Theme Toggle */}
          {!isCollapsed ? (
            <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-muted/50">
              <div>
                <p className="text-sm font-medium">Aparência</p>
                <p className="text-xs text-muted-foreground">
                  {theme === 'light' ? 'Claro' : theme === 'dark' ? 'Escuro' : 'Sistema'}
                </p>
              </div>
              <ThemeToggle
                theme={theme}
                onThemeChange={setTheme}
                variant="ghost"
                size="icon"
              />
            </div>
          ) : (
            <div className="flex justify-center">
              <ThemeToggle
                theme={theme}
                onThemeChange={setTheme}
                variant="ghost"
                size="icon"
              />
            </div>
          )}

          <Separator />

          {/* Super Admin Link - só aparece para super admins */}
          {isSuperAdmin && (
            <Link
              href="/super-admin"
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors w-full',
                'bg-purple-100 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400',
                'hover:bg-purple-200 dark:hover:bg-purple-900/30',
                'border border-purple-300 dark:border-purple-800',
                isCollapsed && 'justify-center px-2'
              )}
            >
              <Shield className="h-4 w-4" />
              {!isCollapsed && 'Super Admin'}
            </Link>
          )}

          {/* Botão de Logout */}
          <Button
            variant="ghost"
            onClick={handleLogout}
            className={cn(
              'w-full justify-start gap-3',
              'text-red-600 dark:text-red-400',
              'hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/20 dark:hover:text-red-400',
              isCollapsed && 'justify-center px-2'
            )}
          >
            <LogOut className="h-4 w-4" />
            {!isCollapsed && 'Sair'}
          </Button>

          {/* Toggle na parte inferior quando colapsado */}
          {isCollapsed && (
            <div className="flex justify-center pt-2 border-t">
              <SidebarToggle />
            </div>
          )}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
};

export default AdminSidebar;
