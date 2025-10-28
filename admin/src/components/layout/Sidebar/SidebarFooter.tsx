'use client';

import React from 'react';
import { useSidebar } from '@/contexts/SidebarContext';
import { useTheme } from '@/hooks/useTheme';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { Separator } from '@/components/ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export const SidebarFooter: React.FC = () => {
  const { isCollapsed } = useSidebar();
  const { theme, setTheme } = useTheme();

  if (isCollapsed) {
    return (
      <div className="mt-auto border-t p-4">
        <TooltipProvider delayDuration={0}>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex justify-center">
                <ThemeToggle
                  theme={theme}
                  onThemeChange={setTheme}
                  variant="ghost"
                  size="icon"
                />
              </div>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>Tema: {theme === 'light' ? 'Claro' : theme === 'dark' ? 'Escuro' : 'Sistema'}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    );
  }

  return (
    <div className="mt-auto border-t">
      <div className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Aparência</p>
            <p className="text-xs text-muted-foreground">
              {theme === 'light' ? 'Modo Claro' : theme === 'dark' ? 'Modo Escuro' : 'Auto (Sistema)'}
            </p>
          </div>
          <ThemeToggle
            theme={theme}
            onThemeChange={setTheme}
            variant="ghost"
            size="icon"
          />
        </div>
      </div>
    </div>
  );
};
