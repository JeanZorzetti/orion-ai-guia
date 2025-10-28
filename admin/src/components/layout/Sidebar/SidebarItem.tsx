'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LucideIcon } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useSidebar } from '@/contexts/SidebarContext';
import { cn } from '@/lib/utils';

interface SidebarItemProps {
  icon: LucideIcon;
  label: string;
  href: string;
  badge?: string | number;
  className?: string;
}

export const SidebarItem: React.FC<SidebarItemProps> = ({
  icon: Icon,
  label,
  href,
  badge,
  className,
}) => {
  const pathname = usePathname();
  const { isCollapsed } = useSidebar();
  const isActive = pathname === href || pathname?.startsWith(href + '/');

  const content = (
    <Link
      href={href}
      aria-current={isActive ? 'page' : undefined}
      className={cn(
        'group relative flex items-center gap-3 rounded-lg px-3 py-2.5',
        'transition-all duration-200 ease-in-out',
        // Hover states
        'hover:bg-accent hover:text-accent-foreground',
        'hover:scale-[1.02] active:scale-[0.98]',
        // Focus states
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
        // Active states
        isActive && [
          'bg-primary text-primary-foreground',
          'hover:bg-primary/90',
          'shadow-sm',
          'before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2',
          'before:h-5 before:w-1 before:rounded-r-full before:bg-primary-foreground',
        ],
        // Collapsed mode
        isCollapsed && 'justify-center px-2',
        className
      )}
    >
      <Icon
        className={cn(
          'h-5 w-5 flex-shrink-0 transition-transform duration-200',
          'group-hover:scale-110',
          isCollapsed && 'h-6 w-6'
        )}
      />
      {!isCollapsed && (
        <>
          <span className="flex-1 truncate text-sm font-medium">{label}</span>
          {badge && (
            <span
              className={cn(
                'flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-xs font-medium',
                'transition-all duration-200',
                isActive
                  ? 'bg-primary-foreground/20 text-primary-foreground'
                  : 'bg-muted text-muted-foreground group-hover:bg-accent-foreground/10'
              )}
            >
              {badge}
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
          <TooltipContent side="right" className="flex items-center gap-2">
            {label}
            {badge && (
              <span className="ml-auto text-xs text-muted-foreground">
                {badge}
              </span>
            )}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return content;
};
