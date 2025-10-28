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
  items: SubmenuItem[];
  className?: string;
}

export const SidebarSubmenu: React.FC<SidebarSubmenuProps> = ({
  icon: Icon,
  label,
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

  const trigger = (
    <CollapsibleTrigger
      className={cn(
        'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 transition-all',
        'hover:bg-accent hover:text-accent-foreground',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        hasActiveChild && 'bg-accent text-accent-foreground',
        isCollapsed && 'justify-center px-2',
        className
      )}
    >
      <Icon className={cn('h-5 w-5 flex-shrink-0', isCollapsed && 'h-6 w-6')} />
      {!isCollapsed && (
        <>
          <span className="flex-1 truncate text-left text-sm font-medium">
            {label}
          </span>
          {isOpen ? (
            <ChevronDown className="h-4 w-4 transition-transform" />
          ) : (
            <ChevronRight className="h-4 w-4 transition-transform" />
          )}
        </>
      )}
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
                  'flex items-center justify-center rounded-lg px-2 py-2.5 transition-all',
                  'hover:bg-accent hover:text-accent-foreground',
                  hasActiveChild && 'bg-accent text-accent-foreground'
                )}
              >
                <Icon className="h-6 w-6 flex-shrink-0" />
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
                    className={cn(
                      'flex items-center gap-2 px-3 py-1.5 text-sm transition-colors',
                      'hover:bg-accent hover:text-accent-foreground',
                      isActive && 'bg-primary text-primary-foreground'
                    )}
                  >
                    {ItemIcon && <ItemIcon className="h-4 w-4" />}
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
              className={cn(
                'flex items-center gap-3 rounded-lg py-2 pl-11 pr-3 text-sm transition-all',
                'hover:bg-accent hover:text-accent-foreground',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                isActive &&
                  'bg-primary text-primary-foreground hover:bg-primary/90'
              )}
            >
              {ItemIcon && <ItemIcon className="h-4 w-4 flex-shrink-0" />}
              <span className="flex-1 truncate">{item.label}</span>
              {item.badge && (
                <span
                  className={cn(
                    'flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-xs font-medium',
                    isActive
                      ? 'bg-primary-foreground/20 text-primary-foreground'
                      : 'bg-muted text-muted-foreground'
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
