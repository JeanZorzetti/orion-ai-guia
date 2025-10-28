'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronDown, ChevronRight, LucideIcon } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useSidebar } from '@/contexts/SidebarContext';
import { cn } from '@/lib/utils';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

export interface SubmenuItem {
  label: string;
  href: string;
  icon?: LucideIcon;
  badge?: string | number;
}

interface SidebarSubmenuProps {
  icon: LucideIcon;
  label: string;
  href?: string; // URL da página pai (opcional)
  items: SubmenuItem[];
  className?: string;
}

export const SidebarSubmenu: React.FC<SidebarSubmenuProps> = ({
  icon: Icon,
  label,
  href,
  items,
  className,
}) => {
  const pathname = usePathname();
  const { isCollapsed } = useSidebar();
  const [isOpen, setIsOpen] = useState(false);

  // Auto-open if any submenu item is active
  const hasActiveChild = items.some(
    (item) => pathname === item.href || pathname?.startsWith(item.href + '/')
  );

  useEffect(() => {
    if (hasActiveChild && !isCollapsed) {
      setIsOpen(true);
    }
  }, [hasActiveChild, isCollapsed]);

  // Reset open state when sidebar is collapsed
  useEffect(() => {
    if (isCollapsed) {
      setIsOpen(false);
    }
  }, [isCollapsed]);

  // Área clicável para navegação (quando href existe)
  const navigationContent = (
    <>
      <Icon
        className={cn(
          'h-5 w-5 flex-shrink-0 transition-transform duration-200',
          'group-hover:scale-110',
          isCollapsed && 'h-6 w-6'
        )}
      />
      {!isCollapsed && (
        <span className="flex-1 truncate text-left text-sm font-medium">
          {label}
        </span>
      )}
    </>
  );

  // Botão de toggle separado (apenas quando não colapsado)
  const toggleButton = !isCollapsed && (
    <CollapsibleTrigger asChild>
      <button
        className={cn(
          'flex items-center justify-center h-9 w-9 rounded-md',
          'transition-all duration-200',
          'hover:bg-accent/50 hover:scale-110',
          'active:scale-95',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary'
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {isOpen ? (
          <ChevronDown className="h-4 w-4 transition-transform duration-200" />
        ) : (
          <ChevronRight className="h-4 w-4 transition-transform duration-200" />
        )}
      </button>
    </CollapsibleTrigger>
  );

  const trigger = href ? (
    // Com href: Link para navegação + botão separado para toggle
    <div className="relative">
      <Link
        href={href}
        aria-current={pathname === href ? 'page' : undefined}
        className={cn(
          'group relative flex items-center gap-3 rounded-lg px-3 py-2.5 pr-10',
          'transition-all duration-200 ease-in-out',
          // Hover states
          'hover:bg-accent hover:text-accent-foreground',
          'hover:scale-[1.02] active:scale-[0.98]',
          // Focus states
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
          // Active states - página pai
          pathname === href && [
            'bg-primary text-primary-foreground hover:bg-primary/90',
            'shadow-sm',
            'before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2',
            'before:h-5 before:w-1 before:rounded-r-full before:bg-primary-foreground',
          ],
          // Active child
          !pathname?.includes(href) && hasActiveChild && 'bg-accent text-accent-foreground',
          isCollapsed && 'justify-center px-2 pr-2'
        )}
      >
        {navigationContent}
      </Link>
      {!isCollapsed && (
        <div className="absolute right-1 top-1/2 -translate-y-1/2">
          {toggleButton}
        </div>
      )}
    </div>
  ) : (
    // Sem href: apenas trigger do collapsible (comportamento original)
    <CollapsibleTrigger
      className={cn(
        'group flex w-full items-center gap-3 rounded-lg px-3 py-2.5',
        'transition-all duration-200 ease-in-out',
        'hover:bg-accent hover:text-accent-foreground',
        'hover:scale-[1.02] active:scale-[0.98]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
        hasActiveChild && 'bg-accent text-accent-foreground',
        isCollapsed && 'justify-center px-2'
      )}
    >
      {navigationContent}
      {!isCollapsed && (isOpen ? (
        <ChevronDown className="h-4 w-4 transition-transform duration-200" />
      ) : (
        <ChevronRight className="h-4 w-4 transition-transform duration-200" />
      ))}
    </CollapsibleTrigger>
  );

  // When collapsed, show tooltip with submenu items
  if (isCollapsed) {
    return (
      <TooltipProvider delayDuration={0}>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className={className}>
              <div
                className={cn(
                  'group flex items-center justify-center rounded-lg px-2 py-2.5',
                  'transition-all duration-200 ease-in-out',
                  'hover:bg-accent hover:text-accent-foreground',
                  'hover:scale-110 active:scale-95',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
                  hasActiveChild && 'bg-accent text-accent-foreground'
                )}
              >
                <Icon className="h-6 w-6 flex-shrink-0 transition-transform duration-200 group-hover:scale-110" />
              </div>
            </div>
          </TooltipTrigger>
          <TooltipContent side="right" className="p-0">
            <div className="flex flex-col gap-0.5 py-1">
              <div className="px-3 py-1.5 text-sm font-semibold">{label}</div>
              {items.map((item) => {
                const isActive =
                  pathname === item.href || pathname?.startsWith(item.href + '/');
                const ItemIcon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={isActive ? 'page' : undefined}
                    className={cn(
                      'group flex items-center gap-2 px-3 py-1.5 text-sm',
                      'transition-all duration-200 ease-in-out',
                      'hover:bg-accent hover:text-accent-foreground',
                      'hover:scale-[1.02] active:scale-[0.98]',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
                      isActive && 'bg-primary text-primary-foreground hover:bg-primary/90'
                    )}
                  >
                    {ItemIcon && <ItemIcon className="h-4 w-4 transition-transform duration-200 group-hover:scale-110" />}
                    <span>{item.label}</span>
                    {item.badge && (
                      <span className="ml-auto text-xs text-muted-foreground">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className={className}>
      {trigger}
      <CollapsibleContent className="space-y-0.5 pt-0.5">
        {items.map((item) => {
          const isActive =
            pathname === item.href || pathname?.startsWith(item.href + '/');
          const ItemIcon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? 'page' : undefined}
              className={cn(
                'group flex items-center gap-3 rounded-lg py-2 pl-11 pr-3 text-sm',
                'transition-all duration-200 ease-in-out',
                'hover:bg-accent hover:text-accent-foreground',
                'hover:scale-[1.02] active:scale-[0.98]',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
                isActive && [
                  'bg-primary text-primary-foreground hover:bg-primary/90',
                  'shadow-sm',
                ]
              )}
            >
              {ItemIcon && <ItemIcon className="h-4 w-4 flex-shrink-0 transition-transform duration-200 group-hover:scale-110" />}
              <span className="flex-1 truncate">{item.label}</span>
              {item.badge && (
                <span
                  className={cn(
                    'flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-xs font-medium',
                    'transition-all duration-200',
                    isActive
                      ? 'bg-primary-foreground/20 text-primary-foreground'
                      : 'bg-muted text-muted-foreground group-hover:bg-accent-foreground/10'
                  )}
                >
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </CollapsibleContent>
    </Collapsible>
  );
};
