'use client';

import React, { useEffect, useState } from 'react';
import { Check, ChevronsUpDown, Plus, Building2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { useSidebar } from '@/contexts/SidebarContext';

interface Workspace {
  id: number;
  name: string;
  role?: string;
}

interface WorkspaceSelectorProps {
  className?: string;
}

export const WorkspaceSelector: React.FC<WorkspaceSelectorProps> = ({
  className,
}) => {
  const { isCollapsed } = useSidebar();
  const [open, setOpen] = useState(false);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>(null);

  useEffect(() => {
    // Carregar workspace atual do localStorage
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      setCurrentWorkspace({
        id: user.workspace_id,
        name: user.workspace_name || 'Workspace',
        role: user.role,
      });
    }

    // TODO: Buscar lista de workspaces do usuário da API
    // Por enquanto, usar apenas o workspace atual
    if (currentWorkspace) {
      setWorkspaces([currentWorkspace]);
    }
  }, []);

  useEffect(() => {
    if (currentWorkspace && workspaces.length === 0) {
      setWorkspaces([currentWorkspace]);
    }
  }, [currentWorkspace]);

  const handleSelectWorkspace = (workspaceId: string) => {
    const workspace = workspaces.find((ws) => ws.id.toString() === workspaceId);
    if (workspace) {
      setCurrentWorkspace(workspace);
      setOpen(false);

      // TODO: Trocar workspace na API e recarregar dados
      console.log('Switching to workspace:', workspace);

      // Atualizar localStorage
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        user.workspace_id = workspace.id;
        user.workspace_name = workspace.name;
        localStorage.setItem('user', JSON.stringify(user));
      }

      // Recarregar a página para aplicar mudanças
      window.location.reload();
    }
  };

  const getRoleBadgeVariant = (role?: string) => {
    switch (role) {
      case 'super_admin':
        return 'default';
      case 'admin':
        return 'default';
      case 'member':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getRoleLabel = (role?: string) => {
    switch (role) {
      case 'super_admin':
        return 'Super Admin';
      case 'admin':
        return 'Admin';
      case 'member':
        return 'Membro';
      default:
        return role || 'Membro';
    }
  };

  if (!currentWorkspace) {
    return null;
  }

  // Modo colapsado: apenas ícone
  if (isCollapsed) {
    return (
      <div className={cn('flex justify-center p-2', className)}>
        <Avatar className="h-10 w-10">
          <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
            {currentWorkspace.name.substring(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
      </div>
    );
  }

  return (
    <div className={cn('px-2 py-3', className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            role="combobox"
            aria-expanded={open}
            className={cn(
              'group w-full justify-between px-3 h-auto py-2',
              'transition-all duration-200 ease-in-out',
              'hover:bg-accent hover:scale-[1.02]',
              'active:scale-[0.98]',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2'
            )}
          >
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <Avatar className="h-9 w-9 flex-shrink-0 transition-transform duration-200 group-hover:scale-110">
                <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
                  {currentWorkspace.name.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col items-start min-w-0 flex-1">
                <span className="text-sm font-medium truncate w-full text-left">
                  {currentWorkspace.name}
                </span>
                <Badge
                  variant={getRoleBadgeVariant(currentWorkspace.role)}
                  className="text-[10px] h-4 px-1.5 mt-0.5"
                >
                  {getRoleLabel(currentWorkspace.role)}
                </Badge>
              </div>
            </div>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50 transition-transform duration-200 group-hover:opacity-100" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[280px] p-0" align="start">
          <Command>
            {workspaces.length > 5 && (
              <CommandInput placeholder="Buscar workspace..." />
            )}
            <CommandList>
              <CommandEmpty>Nenhum workspace encontrado.</CommandEmpty>
              <CommandGroup heading="Seus Workspaces">
                {workspaces.map((workspace) => (
                  <CommandItem
                    key={workspace.id}
                    value={workspace.id.toString()}
                    onSelect={handleSelectWorkspace}
                    className={cn(
                      'group cursor-pointer',
                      'transition-all duration-200 ease-in-out',
                      'hover:scale-[1.02] active:scale-[0.98]'
                    )}
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <Avatar className="h-8 w-8 flex-shrink-0 transition-transform duration-200 group-hover:scale-110">
                        <AvatarFallback className="text-xs font-semibold">
                          {workspace.name.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col min-w-0 flex-1">
                        <span className="text-sm font-medium truncate">
                          {workspace.name}
                        </span>
                        <Badge
                          variant={getRoleBadgeVariant(workspace.role)}
                          className="text-[10px] h-4 px-1.5 w-fit mt-0.5"
                        >
                          {getRoleLabel(workspace.role)}
                        </Badge>
                      </div>
                    </div>
                    <Check
                      className={cn(
                        'ml-2 h-4 w-4 flex-shrink-0 transition-all duration-200',
                        currentWorkspace.id === workspace.id
                          ? 'opacity-100 scale-110'
                          : 'opacity-0 scale-0'
                      )}
                    />
                  </CommandItem>
                ))}
              </CommandGroup>
              <CommandGroup>
                <CommandItem
                  className={cn(
                    'group text-primary cursor-pointer',
                    'transition-all duration-200 ease-in-out',
                    'hover:scale-[1.02] active:scale-[0.98]'
                  )}
                  onSelect={() => {
                    setOpen(false);
                    // TODO: Implementar criação de workspace
                    console.log('Create new workspace');
                  }}
                >
                  <Plus className="mr-2 h-4 w-4 transition-transform duration-200 group-hover:scale-110" />
                  <span>Criar novo workspace</span>
                </CommandItem>
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
};
