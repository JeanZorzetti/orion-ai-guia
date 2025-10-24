'use client';

import React from 'react';
import { Button } from './button';
import { Moon, Sun, Monitor } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './tooltip';
import { Theme } from '@/hooks/useTheme';

interface ThemeToggleProps {
  /**
   * Tema atual
   */
  theme: Theme;
  /**
   * Callback quando o tema muda
   */
  onThemeChange: (theme: Theme) => void;
  /**
   * Variante do botão
   */
  variant?: 'default' | 'outline' | 'ghost';
  /**
   * Tamanho do botão
   */
  size?: 'default' | 'sm' | 'lg' | 'icon';
  /**
   * Classes CSS adicionais
   */
  className?: string;
}

/**
 * Toggle de tema com dropdown para selecionar light/dark/system
 *
 * @example
 * const { theme, setTheme } = useTheme();
 * <ThemeToggle theme={theme} onThemeChange={setTheme} />
 */
export function ThemeToggle({
  theme,
  onThemeChange,
  variant = 'ghost',
  size = 'icon',
  className = '',
}: ThemeToggleProps) {
  const getIcon = () => {
    switch (theme) {
      case 'light':
        return <Sun className="h-5 w-5" />;
      case 'dark':
        return <Moon className="h-5 w-5" />;
      case 'system':
        return <Monitor className="h-5 w-5" />;
    }
  };

  return (
    <DropdownMenu>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <Button variant={variant} size={size} className={className}>
                {getIcon()}
                <span className="sr-only">Alternar tema</span>
              </Button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent>
            <p>Alternar tema</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={() => onThemeChange('light')}
          className={theme === 'light' ? 'bg-accent' : ''}
        >
          <Sun className="mr-2 h-4 w-4" />
          <span>Claro</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => onThemeChange('dark')}
          className={theme === 'dark' ? 'bg-accent' : ''}
        >
          <Moon className="mr-2 h-4 w-4" />
          <span>Escuro</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => onThemeChange('system')}
          className={theme === 'system' ? 'bg-accent' : ''}
        >
          <Monitor className="mr-2 h-4 w-4" />
          <span>Sistema</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/**
 * Toggle simples que alterna apenas entre light e dark (sem dropdown)
 */
export function SimpleThemeToggle({
  theme,
  onToggle,
  variant = 'ghost',
  size = 'icon',
  className = '',
}: {
  theme: 'light' | 'dark';
  onToggle: () => void;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
}) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={variant}
            size={size}
            onClick={onToggle}
            className={className}
          >
            {theme === 'light' ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
            <span className="sr-only">Alternar tema</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{theme === 'light' ? 'Modo escuro' : 'Modo claro'}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/**
 * Toggle com texto (para uso em menus)
 */
export function ThemeToggleWithLabel({
  theme,
  onThemeChange,
}: {
  theme: Theme;
  onThemeChange: (theme: Theme) => void;
}) {
  return (
    <div className="flex items-center justify-between p-2">
      <span className="text-sm font-medium">Tema</span>
      <div className="flex gap-1">
        <Button
          variant={theme === 'light' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => onThemeChange('light')}
        >
          <Sun className="h-4 w-4" />
        </Button>
        <Button
          variant={theme === 'dark' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => onThemeChange('dark')}
        >
          <Moon className="h-4 w-4" />
        </Button>
        <Button
          variant={theme === 'system' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => onThemeChange('system')}
        >
          <Monitor className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
