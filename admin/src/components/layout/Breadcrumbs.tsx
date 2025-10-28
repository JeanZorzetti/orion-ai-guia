'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BreadcrumbItem {
  label: string;
  href: string;
}

// Mapa de rotas para labels legíveis
const routeLabels: Record<string, string> = {
  admin: 'Admin',
  dashboard: 'Dashboard',
  financeiro: 'Financeiro',
  'contas-a-pagar': 'Contas a Pagar',
  fornecedores: 'Fornecedores',
  vendas: 'Vendas',
  estoque: 'Estoque',
  produtos: 'Produtos',
  configuracoes: 'Configurações',
  fiscal: 'Configurações Fiscais',
  integracoes: 'Integrações',
  ajuda: 'Ajuda',
};

function formatLabel(segment: string): string {
  // Tentar obter do mapa primeiro
  if (routeLabels[segment]) {
    return routeLabels[segment];
  }

  // Fallback: capitalizar e substituir hífens
  return segment
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export function generateBreadcrumbs(pathname: string): BreadcrumbItem[] {
  const segments = pathname.split('/').filter(Boolean);
  const breadcrumbs: BreadcrumbItem[] = [];

  // Adicionar Home/Dashboard como primeiro item
  if (segments[0] === 'admin') {
    breadcrumbs.push({
      label: 'Dashboard',
      href: '/admin/dashboard',
    });
  }

  // Construir breadcrumbs das demais rotas
  let href = '';
  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i];
    href += `/${segment}`;

    // Pular 'admin' pois já adicionamos como Dashboard
    if (segment === 'admin') continue;

    // Pular 'dashboard' pois já está no primeiro item
    if (segment === 'dashboard') continue;

    breadcrumbs.push({
      label: formatLabel(segment),
      href,
    });
  }

  return breadcrumbs;
}

interface BreadcrumbsProps {
  className?: string;
  maxItems?: number;
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({
  className,
  maxItems = 4,
}) => {
  const pathname = usePathname();
  const breadcrumbs = generateBreadcrumbs(pathname || '');

  // Se exceder maxItems, colapsar os do meio
  let displayBreadcrumbs = breadcrumbs;
  if (breadcrumbs.length > maxItems) {
    displayBreadcrumbs = [
      breadcrumbs[0], // Primeiro
      { label: '...', href: '#' }, // Elipsis
      ...breadcrumbs.slice(-(maxItems - 2)), // Últimos
    ];
  }

  if (displayBreadcrumbs.length === 0) {
    return null;
  }

  return (
    <nav className={cn('flex items-center gap-2 text-sm', className)} aria-label="Breadcrumb">
      {displayBreadcrumbs.map((crumb, index) => {
        const isLast = index === displayBreadcrumbs.length - 1;
        const isFirst = index === 0;
        const isEllipsis = crumb.label === '...';

        return (
          <React.Fragment key={`${crumb.href}-${index}`}>
            {index > 0 && (
              <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            )}

            {isEllipsis ? (
              <span className="text-muted-foreground">...</span>
            ) : isLast ? (
              <span className="font-medium text-foreground truncate">
                {crumb.label}
              </span>
            ) : (
              <Link
                href={crumb.href}
                className={cn(
                  'text-muted-foreground hover:text-foreground transition-colors truncate',
                  'flex items-center gap-1.5'
                )}
              >
                {isFirst && <Home className="h-3.5 w-3.5" />}
                {crumb.label}
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
};
