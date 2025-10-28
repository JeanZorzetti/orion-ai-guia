'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import {
  Plus,
  ShoppingCart,
  Package,
  DollarSign,
  FileText,
  Truck,
  Users,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface QuickAction {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  shortcut?: string;
  onClick: () => void;
}

interface ActionGroup {
  group: string;
  items: QuickAction[];
}

export const QuickActionsMenu: React.FC = () => {
  const router = useRouter();

  const actions: ActionGroup[] = [
    {
      group: 'Vendas',
      items: [
        {
          icon: ShoppingCart,
          label: 'Nova Venda',
          shortcut: '⌘N',
          onClick: () => router.push('/admin/vendas?action=new'),
        },
      ],
    },
    {
      group: 'Estoque',
      items: [
        {
          icon: Package,
          label: 'Novo Produto',
          onClick: () => router.push('/admin/estoque/produtos?action=new'),
        },
      ],
    },
    {
      group: 'Financeiro',
      items: [
        {
          icon: DollarSign,
          label: 'Nova Despesa',
          onClick: () => router.push('/admin/financeiro/contas-a-pagar?action=new'),
        },
        {
          icon: FileText,
          label: 'Nova Receita',
          onClick: () => router.push('/admin/financeiro/contas-a-receber?action=new'),
        },
      ],
    },
    {
      group: 'Cadastros',
      items: [
        {
          icon: Truck,
          label: 'Novo Fornecedor',
          onClick: () => router.push('/admin/fornecedores?action=new'),
        },
        {
          icon: Users,
          label: 'Novo Cliente',
          onClick: () => router.push('/admin/clientes?action=new'),
        },
      ],
    },
  ];

  return (
    <DropdownMenu>
      <TooltipProvider delayDuration={0}>
        <Tooltip>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="transition-all duration-200 hover:scale-110 active:scale-95"
              >
                <Plus className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent>
            <p>Ações Rápidas</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Criar Novo</DropdownMenuLabel>
        <DropdownMenuSeparator />

        {actions.map((group, groupIndex) => (
          <React.Fragment key={group.group}>
            <DropdownMenuGroup>
              <DropdownMenuLabel className="text-xs text-muted-foreground px-2 py-1.5">
                {group.group}
              </DropdownMenuLabel>
              {group.items.map((item, itemIndex) => {
                const Icon = item.icon;
                return (
                  <DropdownMenuItem
                    key={`${group.group}-${itemIndex}`}
                    onClick={item.onClick}
                    className="cursor-pointer"
                  >
                    <Icon className="mr-2 h-4 w-4" />
                    <span>{item.label}</span>
                    {item.shortcut && (
                      <span className="ml-auto text-xs text-muted-foreground">
                        {item.shortcut}
                      </span>
                    )}
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuGroup>
            {groupIndex < actions.length - 1 && <DropdownMenuSeparator />}
          </React.Fragment>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
