'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
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
  ChevronDown,
  ChevronRight,
  Plug
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { User } from '@/types';
import { authService } from '@/services/auth';

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
  const pathname = usePathname();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({});

  useEffect(() => {
    // Carregar usuário do localStorage
    const userStr = localStorage.getItem('user');
    if (userStr) {
      setCurrentUser(JSON.parse(userStr));
    }
  }, []);

  // Auto-expand menus based on current path
  useEffect(() => {
    const newExpanded: Record<string, boolean> = {};

    // Check navigation items
    navigation.forEach((item) => {
      if (item.children) {
        const shouldExpand = item.children.some((child) =>
          pathname === child.href || pathname?.startsWith(child.href + '/')
        );
        newExpanded[item.name] = shouldExpand;
      }
    });

    // Check support navigation items
    supportNavigation.forEach((item) => {
      if (item.children) {
        const shouldExpand = item.children.some((child) =>
          pathname === child.href || pathname?.startsWith(child.href + '/')
        );
        newExpanded[item.name] = shouldExpand;
      }
    });

    setExpandedMenus(newExpanded);
  }, [pathname]);

  const toggleMenu = (name: string) => {
    setExpandedMenus((prev) => ({
      ...prev,
      [name]: !prev[name],
    }));
  };

  const isActive = (href: string) => {
    return pathname === href || pathname?.startsWith(href + '/');
  };

  const isSuperAdmin = currentUser?.role === 'super_admin';

  const handleLogout = () => {
    // Limpar user do localStorage
    localStorage.removeItem('user');
    // Chamar logout do authService (limpa tokens e redireciona)
    authService.logout();
  };

  const NavItem = ({ item, isChild = false }: { item: { name: string; href: string; icon: React.ComponentType<{ className?: string }> }; isChild?: boolean }) => {
    const Icon = item.icon;
    const active = isActive(item.href);

    return (
      <Link
        href={item.href}
        className={cn(
          'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
          isChild && 'ml-6 text-muted-foreground',
          active
            ? 'bg-primary text-primary-foreground'
            : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
        )}
      >
        <Icon className="h-4 w-4" />
        {item.name}
      </Link>
    );
  };

  return (
    <div className="w-64 bg-sidebar-background border-r border-sidebar-border flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-sidebar-border">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary/80 rounded-lg flex items-center justify-center">
            <span className="text-primary-foreground text-sm font-bold">O</span>
          </div>
          <span className="text-lg font-semibold text-sidebar-foreground">Orion ERP</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {navigation.map((item) => {
          const hasChildren = item.children && item.children.length > 0;
          const isExpanded = expandedMenus[item.name] || false;
          const Icon = item.icon;
          // Para itens com children, só marca como ativo se a URL for EXATAMENTE a do item pai
          const active = hasChildren
            ? pathname === item.href
            : isActive(item.href);

          return (
            <div key={item.name}>
              {hasChildren ? (
                <div className="relative">
                  {/* Área de navegação - clica no link */}
                  <Link
                    href={item.href}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2 pr-10 rounded-lg text-sm font-medium transition-colors',
                      active
                        ? 'bg-primary text-primary-foreground'
                        : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {item.name}
                  </Link>

                  {/* Botão de toggle separado - só expande/colapsa */}
                  <button
                    onClick={() => toggleMenu(item.name)}
                    className={cn(
                      'absolute right-0 top-0 h-full px-3 rounded-r-lg transition-colors',
                      active
                        ? 'text-primary-foreground hover:bg-primary/90'
                        : 'text-sidebar-foreground hover:bg-sidebar-accent/50'
                    )}
                    aria-label={isExpanded ? 'Recolher submenu' : 'Expandir submenu'}
                  >
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </button>
                </div>
              ) : (
                <NavItem item={item} />
              )}

              {hasChildren && isExpanded && (
                <div className="mt-1 space-y-1">
                  {item.children!.map((child) => (
                    <NavItem key={child.name} item={child} isChild />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Support Navigation */}
      <div className="p-4 border-t border-sidebar-border space-y-1">
        {supportNavigation.map((item) => {
          const hasChildren = item.children && item.children.length > 0;
          const isExpanded = expandedMenus[item.name] || false;
          const Icon = item.icon;
          const active = hasChildren
            ? pathname === item.href
            : isActive(item.href);

          return (
            <div key={item.name}>
              {hasChildren ? (
                <div className="relative">
                  <Link
                    href={item.href}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2 pr-10 rounded-lg text-sm font-medium transition-colors',
                      active
                        ? 'bg-primary text-primary-foreground'
                        : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {item.name}
                  </Link>

                  <button
                    onClick={() => toggleMenu(item.name)}
                    className={cn(
                      'absolute right-0 top-0 h-full px-3 rounded-r-lg transition-colors',
                      active
                        ? 'text-primary-foreground hover:bg-primary/90'
                        : 'text-sidebar-foreground hover:bg-sidebar-accent/50'
                    )}
                    aria-label={isExpanded ? 'Recolher submenu' : 'Expandir submenu'}
                  >
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </button>
                </div>
              ) : (
                <NavItem item={item} />
              )}

              {hasChildren && isExpanded && (
                <div className="mt-1 space-y-1">
                  {item.children!.map((child) => (
                    <NavItem key={child.name} item={child} isChild />
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {/* Super Admin Link - só aparece para super admins */}
        {isSuperAdmin && (
          <Link
            href="/super-admin"
            className={cn(
              'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
              'bg-purple-100 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400',
              'hover:bg-purple-200 dark:hover:bg-purple-900/30',
              'border border-purple-300 dark:border-purple-800'
            )}
          >
            <Shield className="h-4 w-4" />
            Super Admin
          </Link>
        )}

        {/* Botão de Logout */}
        <button
          onClick={handleLogout}
          className={cn(
            'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors w-full',
            'text-red-600 dark:text-red-400',
            'hover:bg-red-50 dark:hover:bg-red-950/20'
          )}
        >
          <LogOut className="h-4 w-4" />
          Sair
        </button>
      </div>
    </div>
  );
};

export default AdminSidebar;
