'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  DollarSign,
  BarChart3,
  Settings,
  HelpCircle,
  FileText,
  Package
} from 'lucide-react';
import { cn } from '@/lib/utils';

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
    ],
  },
  {
    name: 'Vendas & Estoque',
    href: '/admin/estoque',
    icon: BarChart3,
    children: [
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
  },
  {
    name: 'Ajuda',
    href: '/admin/ajuda',
    icon: HelpCircle,
  },
];

const AdminSidebar: React.FC = () => {
  const pathname = usePathname();

  const isActive = (href: string) => {
    return pathname === href || pathname?.startsWith(href + '/');
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
        {navigation.map((item) => (
          <div key={item.name}>
            <NavItem item={item} />
            {item.children && (
              <div className="mt-1 space-y-1">
                {item.children.map((child) => (
                  <NavItem key={child.name} item={child} isChild />
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>

      {/* Support Navigation */}
      <div className="p-4 border-t border-sidebar-border space-y-1">
        {supportNavigation.map((item) => (
          <NavItem key={item.name} item={item} />
        ))}
      </div>
    </div>
  );
};

export default AdminSidebar;