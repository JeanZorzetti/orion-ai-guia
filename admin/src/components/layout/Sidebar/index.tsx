'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { useSidebar } from '@/contexts/SidebarContext';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

interface SidebarProps {
  children: React.ReactNode;
  className?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({ children, className }) => {
  const { isCollapsed } = useSidebar();

  return (
    <aside
      className={cn(
        'relative flex flex-col border-r bg-card transition-all duration-300 ease-in-out',
        isCollapsed ? 'w-[72px]' : 'w-[280px]',
        className
      )}
    >
      {children}
    </aside>
  );
};

interface SidebarHeaderProps {
  children: React.ReactNode;
  className?: string;
}

export const SidebarHeader: React.FC<SidebarHeaderProps> = ({
  children,
  className,
}) => {
  return (
    <div
      className={cn(
        'flex h-16 items-center border-b px-4',
        className
      )}
    >
      {children}
    </div>
  );
};

interface SidebarContentProps {
  children: React.ReactNode;
  className?: string;
}

export const SidebarContent: React.FC<SidebarContentProps> = ({
  children,
  className,
}) => {
  return (
    <ScrollArea className={cn('flex-1', className)}>
      <div className="space-y-1 p-2">{children}</div>
    </ScrollArea>
  );
};

interface SidebarFooterProps {
  children: React.ReactNode;
  className?: string;
}

export const SidebarFooter: React.FC<SidebarFooterProps> = ({
  children,
  className,
}) => {
  return (
    <>
      <Separator />
      <div className={cn('p-4', className)}>{children}</div>
    </>
  );
};

interface SidebarGroupProps {
  children: React.ReactNode;
  label?: string;
  className?: string;
}

export const SidebarGroup: React.FC<SidebarGroupProps> = ({
  children,
  label,
  className,
}) => {
  const { isCollapsed } = useSidebar();

  return (
    <div className={cn('space-y-1', className)}>
      {label && !isCollapsed && (
        <div className="px-3 py-2">
          <h2 className="mb-1 text-xs font-semibold tracking-tight text-muted-foreground uppercase">
            {label}
          </h2>
        </div>
      )}
      {children}
    </div>
  );
};
