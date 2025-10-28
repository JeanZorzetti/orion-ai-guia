'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronDown, ChevronRight, LucideIcon } from 'lucide-react';
import { useSidebar } from '@/contexts/SidebarContext';
import { cn } from '@/lib/utils';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

export interface NestedMenuItem {
  label: string;
  href: string;
  icon?: LucideIcon;
  children?: NestedMenuItem[];
}

interface NestedSubmenuProps {
  item: NestedMenuItem;
  level?: number;
  className?: string;
}

export const NestedSubmenu: React.FC<NestedSubmenuProps> = ({
  item,
  level = 0,
  className,
}) => {
  const pathname = usePathname();
  const { isCollapsed } = useSidebar();
  const [isOpen, setIsOpen] = useState(false);

  const hasChildren = item.children && item.children.length > 0;

  // Auto-open if any child is active
  const hasActiveChild = (items: NestedMenuItem[] | undefined): boolean => {
    if (!items) return false;
    return items.some(
      (child) =>
        pathname === child.href ||
        pathname?.startsWith(child.href + '/') ||
        hasActiveChild(child.children)
    );
  };

  const isActive = pathname === item.href;
  const hasActiveDescendant = hasActiveChild(item.children);

  useEffect(() => {
    if ((hasActiveDescendant || isActive) && !isCollapsed) {
      setIsOpen(true);
    }
  }, [hasActiveDescendant, isActive, isCollapsed]);

  // Reset open state when sidebar is collapsed
  useEffect(() => {
    if (isCollapsed) {
      setIsOpen(false);
    }
  }, [isCollapsed]);

  const Icon = item.icon;
  const paddingLeft = level === 0 ? 'pl-3' : level === 1 ? 'pl-11' : 'pl-16';

  // Se não tiver children, renderiza como link simples
  if (!hasChildren) {
    return (
      <Link
        href={item.href}
        aria-current={isActive ? 'page' : undefined}
        className={cn(
          'group flex items-center gap-3 rounded-lg py-2 pr-3 text-sm',
          paddingLeft,
          'transition-all duration-200 ease-in-out',
          'hover:bg-accent hover:text-accent-foreground',
          'hover:scale-[1.02] active:scale-[0.98]',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
          isActive && [
            'bg-primary text-primary-foreground hover:bg-primary/90',
            'shadow-sm',
          ],
          className
        )}
      >
        {Icon && (
          <Icon className="h-4 w-4 flex-shrink-0 transition-transform duration-200 group-hover:scale-110" />
        )}
        <span className="flex-1 truncate">{item.label}</span>
      </Link>
    );
  }

  // Se tiver children, renderiza como collapsible
  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className={className}>
      <CollapsibleTrigger
        className={cn(
          'group flex w-full items-center gap-3 rounded-lg py-2 pr-3',
          paddingLeft,
          'transition-all duration-200 ease-in-out',
          'hover:bg-accent hover:text-accent-foreground',
          'hover:scale-[1.02] active:scale-[0.98]',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
          (isActive || hasActiveDescendant) && 'bg-accent text-accent-foreground',
          level === 0 ? 'text-sm font-medium' : 'text-sm'
        )}
      >
        {Icon && (
          <Icon
            className={cn(
              'flex-shrink-0 transition-transform duration-200 group-hover:scale-110',
              level === 0 ? 'h-5 w-5' : 'h-4 w-4'
            )}
          />
        )}
        <span className="flex-1 truncate text-left">{item.label}</span>
        {isOpen ? (
          <ChevronDown className="h-4 w-4 transition-transform duration-200" />
        ) : (
          <ChevronRight className="h-4 w-4 transition-transform duration-200" />
        )}
      </CollapsibleTrigger>

      <CollapsibleContent className="space-y-0.5 pt-0.5">
        {item.children?.map((child) => (
          <NestedSubmenu key={child.href} item={child} level={level + 1} />
        ))}
      </CollapsibleContent>
    </Collapsible>
  );
};
