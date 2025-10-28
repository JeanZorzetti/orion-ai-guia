'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { User, Settings, LogOut, Shield } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { User as UserType } from '@/types';
import { authService } from '@/services/auth';

interface UserMenuProps {
  className?: string;
  showName?: boolean;
}

export const UserMenu: React.FC<UserMenuProps> = ({
  className,
  showName = true,
}) => {
  const [currentUser, setCurrentUser] = useState<UserType | null>(null);

  useEffect(() => {
    // Carregar usuário do localStorage
    const userStr = localStorage.getItem('user');
    if (userStr) {
      setCurrentUser(JSON.parse(userStr));
    }
  }, []);

  const handleLogout = () => {
    // Limpar user do localStorage
    localStorage.removeItem('user');
    // Chamar logout do authService (limpa tokens e redireciona)
    authService.logout();
  };

  if (!currentUser) {
    return null;
  }

  const isSuperAdmin = currentUser.role === 'super_admin';
  const initials = currentUser.full_name
    ?.split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'U';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className={cn(
            'gap-2 px-2 h-auto py-1.5',
            className
          )}
        >
          <Avatar className="h-8 w-8">
            <AvatarImage src="" alt={currentUser.full_name} />
            <AvatarFallback className="bg-primary text-primary-foreground text-xs">
              {initials}
            </AvatarFallback>
          </Avatar>
          {showName && (
            <div className="hidden text-left lg:block">
              <div className="text-sm font-medium leading-none">
                {currentUser.full_name}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {currentUser.email}
              </div>
            </div>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{currentUser.full_name}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {currentUser.email}
            </p>
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        <DropdownMenuItem asChild>
          <Link href="/admin/perfil" className="cursor-pointer">
            <User className="mr-2 h-4 w-4" />
            Minha Conta
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem asChild>
          <Link href="/admin/configuracoes" className="cursor-pointer">
            <Settings className="mr-2 h-4 w-4" />
            Configurações
          </Link>
        </DropdownMenuItem>

        {isSuperAdmin && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link
                href="/super-admin"
                className="cursor-pointer text-purple-600 dark:text-purple-400"
              >
                <Shield className="mr-2 h-4 w-4" />
                Super Admin
              </Link>
            </DropdownMenuItem>
          </>
        )}

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={handleLogout}
          className="cursor-pointer text-red-600 dark:text-red-400"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sair
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
