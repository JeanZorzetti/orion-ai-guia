'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Bell, HelpCircle, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Breadcrumbs } from './Breadcrumbs';
import { UserMenu } from './UserMenu';
import { CommandPalette } from './CommandPalette';
import { NotificationsPanel } from './NotificationsPanel';
import { QuickActionsMenu } from './QuickActionsMenu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

const AdminHeader: React.FC = () => {
  const [commandOpen, setCommandOpen] = useState(false);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setCommandOpen((open) => !open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  return (
    <>
      <CommandPalette open={commandOpen} onOpenChange={setCommandOpen} />
      <header className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b bg-background px-6">
      {/* Logo */}
      <Link
        href="/admin/dashboard"
        className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary/80 hover:opacity-90 transition-opacity"
      >
        <span className="text-lg font-bold text-primary-foreground">O</span>
      </Link>

      {/* Breadcrumbs */}
      <Breadcrumbs className="flex-1 min-w-0" />

      {/* Global Search */}
      <div className="relative w-80 max-w-sm hidden md:block">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
        <Input
          type="search"
          placeholder="Buscar... (Ctrl+K)"
          className="pl-10 cursor-pointer"
          readOnly
          onClick={() => setCommandOpen(true)}
        />
      </div>

      {/* Quick Actions */}
      <div className="flex items-center gap-1">
        {/* Quick Actions Menu */}
        <QuickActionsMenu />

        {/* Notifications */}
        <NotificationsPanel />

        {/* Help */}
        <TooltipProvider delayDuration={0}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" asChild>
                <Link href="/admin/ajuda">
                  <HelpCircle className="h-5 w-5" />
                </Link>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Ajuda e Suporte</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* User Menu */}
      <UserMenu />
    </header>
    </>
  );
};

export default AdminHeader;
