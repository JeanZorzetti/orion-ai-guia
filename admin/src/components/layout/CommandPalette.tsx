'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Calculator,
  Calendar,
  CreditCard,
  Settings,
  Smile,
  User,
  LayoutDashboard,
  DollarSign,
  Package,
  ShoppingCart,
  FileText,
  TrendingUp,
  Users,
  Truck,
  HelpCircle,
  Plus,
  BarChart3,
  ClipboardList,
  Boxes,
  Building2,
  Zap,
} from 'lucide-react';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';

interface CommandItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  onSelect: () => void;
  keywords?: string[];
}

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  open,
  onOpenChange,
}) => {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Páginas principais
  const pages: CommandItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      onSelect: () => {
        router.push('/admin/dashboard');
        onOpenChange(false);
      },
      keywords: ['home', 'início', 'painel'],
    },
    {
      id: 'financeiro',
      label: 'Financeiro',
      icon: DollarSign,
      onSelect: () => {
        router.push('/admin/financeiro');
        onOpenChange(false);
      },
      keywords: ['finanças', 'dinheiro', 'money'],
    },
    {
      id: 'contas-pagar',
      label: 'Contas a Pagar',
      icon: CreditCard,
      onSelect: () => {
        router.push('/admin/financeiro/contas-a-pagar');
        onOpenChange(false);
      },
      keywords: ['despesas', 'pagamentos', 'fornecedores'],
    },
    {
      id: 'contas-receber',
      label: 'Contas a Receber',
      icon: TrendingUp,
      onSelect: () => {
        router.push('/admin/financeiro/contas-a-receber');
        onOpenChange(false);
      },
      keywords: ['receitas', 'recebimentos', 'clientes'],
    },
    {
      id: 'fluxo-caixa',
      label: 'Fluxo de Caixa',
      icon: BarChart3,
      onSelect: () => {
        router.push('/admin/financeiro/fluxo-caixa');
        onOpenChange(false);
      },
      keywords: ['cash', 'fluxo', 'caixa'],
    },
    {
      id: 'vendas',
      label: 'Vendas',
      icon: ShoppingCart,
      onSelect: () => {
        router.push('/admin/vendas');
        onOpenChange(false);
      },
      keywords: ['sales', 'pedidos', 'orders'],
    },
    {
      id: 'produtos',
      label: 'Produtos',
      icon: Package,
      onSelect: () => {
        router.push('/admin/estoque/produtos');
        onOpenChange(false);
      },
      keywords: ['inventory', 'estoque', 'items'],
    },
    {
      id: 'inventario',
      label: 'Inventário',
      icon: Boxes,
      onSelect: () => {
        router.push('/admin/estoque/inventario');
        onOpenChange(false);
      },
      keywords: ['estoque', 'contagem', 'stock'],
    },
    {
      id: 'fornecedores',
      label: 'Fornecedores',
      icon: Truck,
      onSelect: () => {
        router.push('/admin/fornecedores');
        onOpenChange(false);
      },
      keywords: ['suppliers', 'vendors'],
    },
    {
      id: 'integracoes',
      label: 'Integrações',
      icon: Zap,
      onSelect: () => {
        router.push('/admin/integracoes');
        onOpenChange(false);
      },
      keywords: ['integrations', 'api', 'conectar'],
    },
    {
      id: 'configuracoes',
      label: 'Configurações',
      icon: Settings,
      onSelect: () => {
        router.push('/admin/configuracoes');
        onOpenChange(false);
      },
      keywords: ['settings', 'preferências', 'options'],
    },
    {
      id: 'ajuda',
      label: 'Ajuda e Suporte',
      icon: HelpCircle,
      onSelect: () => {
        router.push('/admin/ajuda');
        onOpenChange(false);
      },
      keywords: ['help', 'support', 'suporte', 'faq'],
    },
  ];

  // Ações rápidas
  const actions: CommandItem[] = [
    {
      id: 'nova-venda',
      label: 'Nova Venda',
      icon: Plus,
      onSelect: () => {
        router.push('/admin/vendas?action=new');
        onOpenChange(false);
      },
      keywords: ['criar', 'adicionar', 'pedido'],
    },
    {
      id: 'novo-produto',
      label: 'Novo Produto',
      icon: Plus,
      onSelect: () => {
        router.push('/admin/estoque/produtos?action=new');
        onOpenChange(false);
      },
      keywords: ['criar', 'adicionar', 'item'],
    },
    {
      id: 'nova-despesa',
      label: 'Nova Despesa',
      icon: Plus,
      onSelect: () => {
        router.push('/admin/financeiro/contas-a-pagar?action=new');
        onOpenChange(false);
      },
      keywords: ['criar', 'adicionar', 'pagamento'],
    },
    {
      id: 'novo-fornecedor',
      label: 'Novo Fornecedor',
      icon: Plus,
      onSelect: () => {
        router.push('/admin/fornecedores?action=new');
        onOpenChange(false);
      },
      keywords: ['criar', 'adicionar', 'supplier'],
    },
  ];

  // Relatórios
  const reports: CommandItem[] = [
    {
      id: 'relatorio-financeiro',
      label: 'Relatórios Financeiros',
      icon: FileText,
      onSelect: () => {
        router.push('/admin/financeiro/relatorios');
        onOpenChange(false);
      },
      keywords: ['dre', 'balanço', 'reports'],
    },
    {
      id: 'relatorio-estoque',
      label: 'Relatórios de Estoque',
      icon: ClipboardList,
      onSelect: () => {
        router.push('/admin/estoque/relatorios');
        onOpenChange(false);
      },
      keywords: ['inventory', 'movimentação'],
    },
  ];

  // Configurações
  const settings: CommandItem[] = [
    {
      id: 'config-fiscal',
      label: 'Configurações Fiscais',
      icon: FileText,
      onSelect: () => {
        router.push('/admin/configuracoes/fiscal');
        onOpenChange(false);
      },
      keywords: ['nfe', 'nfce', 'impostos', 'tributos'],
    },
    {
      id: 'minha-conta',
      label: 'Minha Conta',
      icon: User,
      onSelect: () => {
        router.push('/admin/perfil');
        onOpenChange(false);
      },
      keywords: ['perfil', 'profile', 'usuário'],
    },
    {
      id: 'workspaces',
      label: 'Gerenciar Workspaces',
      icon: Building2,
      onSelect: () => {
        router.push('/super-admin/workspaces');
        onOpenChange(false);
      },
      keywords: ['empresas', 'tenants', 'multi'],
    },
  ];

  if (!mounted) {
    return null;
  }

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Buscar páginas, ações ou comandos..." />
      <CommandList>
        <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>

        <CommandGroup heading="Páginas">
          {pages.map((item) => (
            <CommandItem
              key={item.id}
              onSelect={item.onSelect}
              className="cursor-pointer"
            >
              <item.icon className="mr-2 h-4 w-4" />
              <span>{item.label}</span>
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Ações Rápidas">
          {actions.map((item) => (
            <CommandItem
              key={item.id}
              onSelect={item.onSelect}
              className="cursor-pointer"
            >
              <item.icon className="mr-2 h-4 w-4" />
              <span>{item.label}</span>
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Relatórios">
          {reports.map((item) => (
            <CommandItem
              key={item.id}
              onSelect={item.onSelect}
              className="cursor-pointer"
            >
              <item.icon className="mr-2 h-4 w-4" />
              <span>{item.label}</span>
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Configurações">
          {settings.map((item) => (
            <CommandItem
              key={item.id}
              onSelect={item.onSelect}
              className="cursor-pointer"
            >
              <item.icon className="mr-2 h-4 w-4" />
              <span>{item.label}</span>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
};
