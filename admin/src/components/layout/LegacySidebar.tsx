'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronDown, ChevronRight } from 'lucide-react';

interface SubMenuItem {
  label: string;
  href: string;
  icon?: string;
}

interface MenuItem {
  label: string;
  href?: string;
  icon: string;
  subItems?: SubMenuItem[];
}

const menuItems: MenuItem[] = [
  { label: 'Dashboard', href: '/admin/dashboard', icon: '📊' },
  {
    label: 'Financeiro',
    icon: '💳',
    subItems: [
      { label: 'Contas a Pagar', href: '/admin/financeiro', icon: '📄' },
      { label: 'Fornecedores', href: '/admin/fornecedores', icon: '🏢' },
    ],
  },
  {
    label: 'Vendas & Estoque',
    icon: '📦',
    subItems: [
      { label: 'Vendas', href: '/admin/vendas', icon: '💰' },
      { label: 'Produtos', href: '/admin/estoque/produtos', icon: '📦' },
    ],
  },
];

const Sidebar: React.FC = () => {
  const pathname = usePathname();
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({});

  // Initialize and update expanded state based on current path
  useEffect(() => {
    console.log('🔥 useEffect rodou! pathname:', pathname);
    const newExpanded: Record<string, boolean> = {};

    menuItems.forEach((item) => {
      if (item.subItems) {
        // Auto-expand if any subitem matches current path
        const shouldExpand = item.subItems.some((subItem) =>
          pathname === subItem.href || pathname?.startsWith(subItem.href + '/')
        );
        console.log(`🔥 Menu "${item.label}" shouldExpand:`, shouldExpand);
        newExpanded[item.label] = shouldExpand;
      }
    });

    console.log('🔥 useEffect setando novo estado:', newExpanded);
    setExpandedMenus(newExpanded);
  }, [pathname]);

  const toggleMenu = (label: string) => {
    console.log('🔥 TOGGLE MENU:', label);
    console.log('🔥 Estado ANTES:', expandedMenus);
    setExpandedMenus((prev) => {
      const newState = {
        ...prev,
        [label]: !prev[label],
      };
      console.log('🔥 Estado DEPOIS:', newState);
      return newState;
    });
  };

  const isMenuActive = (item: MenuItem): boolean => {
    if (item.href && pathname === item.href) return true;
    if (item.subItems) {
      return item.subItems.some((subItem) => pathname === subItem.href);
    }
    return false;
  };

  return (
    <aside className="w-64 bg-white border-r border-[var(--border)] min-h-screen">
      <nav className="p-4 space-y-1">
        {menuItems.map((item) => {
          const isActive = isMenuActive(item);
          const hasSubItems = item.subItems && item.subItems.length > 0;
          const isExpanded = expandedMenus[item.label] || false;

          console.log(`🔥 Renderizando "${item.label}": isExpanded=${isExpanded}`);

          if (hasSubItems) {
            return (
              <div key={item.label}>
                {/* Menu Item with Submenu */}
                <button
                  onClick={() => toggleMenu(item.label)}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-[var(--primary)] text-white'
                      : 'text-[var(--foreground)] hover:bg-[var(--muted)]'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-xl">{item.icon}</span>
                    <span className="font-medium">{item.label}</span>
                  </div>
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </button>

                {/* Submenu Items */}
                {isExpanded && (
                  <div className="ml-4 mt-1 space-y-1">
                    {item.subItems!.map((subItem) => {
                      const isSubActive = pathname === subItem.href;

                      return (
                        <Link
                          key={subItem.href}
                          href={subItem.href}
                          className={`flex items-center space-x-3 px-4 py-2 rounded-lg transition-colors ${
                            isSubActive
                              ? 'bg-[var(--primary)]/10 text-[var(--primary)] font-medium'
                              : 'text-[var(--foreground)] hover:bg-[var(--muted)]'
                          }`}
                        >
                          {subItem.icon && (
                            <span className="text-lg">{subItem.icon}</span>
                          )}
                          <span className="text-sm">{subItem.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }

          // Regular menu item without submenu
          return (
            <Link
              key={item.href}
              href={item.href!}
              className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? 'bg-[var(--primary)] text-white'
                  : 'text-[var(--foreground)] hover:bg-[var(--muted)]'
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
};

export default Sidebar;
