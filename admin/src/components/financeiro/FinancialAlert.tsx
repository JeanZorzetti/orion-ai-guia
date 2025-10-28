'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  AlertTriangle,
  AlertCircle,
  Info,
  CheckCircle,
  X,
  ExternalLink,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export type AlertSeverity = 'critical' | 'warning' | 'info' | 'success';
export type AlertCategory = 'payment' | 'receipt' | 'cashflow' | 'budget' | 'tax';

export interface FinancialAlertData {
  id: string;
  severity: AlertSeverity;
  category: AlertCategory;
  title: string;
  message: string;
  value?: number;
  date?: Date;
  actionLabel?: string;
  actionUrl?: string;
  dismissable?: boolean;
  metadata?: Record<string, unknown>;
}

interface FinancialAlertProps {
  alert: FinancialAlertData;
  onAction?: (alert: FinancialAlertData) => void;
  onDismiss?: (alertId: string) => void;
  compact?: boolean;
  className?: string;
}

const SEVERITY_CONFIG = {
  critical: {
    icon: AlertTriangle,
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-50 dark:bg-red-950/20',
    borderColor: 'border-red-200 dark:border-red-800',
    badgeVariant: 'destructive' as const,
    label: 'Crítico',
  },
  warning: {
    icon: AlertCircle,
    color: 'text-orange-600 dark:text-orange-400',
    bgColor: 'bg-orange-50 dark:bg-orange-950/20',
    borderColor: 'border-orange-200 dark:border-orange-800',
    badgeVariant: 'default' as const,
    label: 'Atenção',
  },
  info: {
    icon: Info,
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-50 dark:bg-blue-950/20',
    borderColor: 'border-blue-200 dark:border-blue-800',
    badgeVariant: 'secondary' as const,
    label: 'Info',
  },
  success: {
    icon: CheckCircle,
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-50 dark:bg-green-950/20',
    borderColor: 'border-green-200 dark:border-green-800',
    badgeVariant: 'default' as const,
    label: 'Sucesso',
  },
};

const CATEGORY_LABELS: Record<AlertCategory, string> = {
  payment: 'Pagamento',
  receipt: 'Recebimento',
  cashflow: 'Fluxo de Caixa',
  budget: 'Orçamento',
  tax: 'Fiscal',
};

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
};

export const FinancialAlert: React.FC<FinancialAlertProps> = ({
  alert,
  onAction,
  onDismiss,
  compact = false,
  className = '',
}) => {
  const config = SEVERITY_CONFIG[alert.severity];
  const Icon = config.icon;

  const handleAction = () => {
    if (onAction) {
      onAction(alert);
    }
  };

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDismiss) {
      onDismiss(alert.id);
    }
  };

  if (compact) {
    return (
      <div
        className={cn(
          'flex items-start gap-3 p-3 rounded-lg border',
          config.bgColor,
          config.borderColor,
          className
        )}
      >
        <Icon className={cn('h-5 w-5 mt-0.5 flex-shrink-0', config.color)} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground">{alert.title}</p>
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
            {alert.message}
          </p>
          {alert.value !== undefined && (
            <p className={cn('text-sm font-bold mt-1', config.color)}>
              {formatCurrency(alert.value)}
            </p>
          )}
        </div>
        {alert.dismissable && onDismiss && (
          <button
            onClick={handleDismiss}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    );
  }

  return (
    <Card
      className={cn('border-l-4', config.borderColor, config.bgColor, className)}
    >
      <CardContent className="pt-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 flex-1">
            <div className={cn('p-2 rounded-full', config.bgColor)}>
              <Icon className={cn('h-5 w-5', config.color)} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Badge variant={config.badgeVariant} className="text-xs">
                  {config.label}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {CATEGORY_LABELS[alert.category]}
                </Badge>
              </div>
              <h3 className="text-base font-semibold text-foreground mb-1">
                {alert.title}
              </h3>
              <p className="text-sm text-muted-foreground">{alert.message}</p>

              {/* Informações adicionais */}
              <div className="flex flex-wrap items-center gap-4 mt-3">
                {alert.value !== undefined && (
                  <div>
                    <span className="text-xs text-muted-foreground">Valor: </span>
                    <span className={cn('text-sm font-bold', config.color)}>
                      {formatCurrency(alert.value)}
                    </span>
                  </div>
                )}
                {alert.date && (
                  <div>
                    <span className="text-xs text-muted-foreground">Data: </span>
                    <span className="text-sm font-medium text-foreground">
                      {formatDate(alert.date)}
                    </span>
                  </div>
                )}
              </div>

              {/* Ação */}
              {alert.actionLabel && (
                <div className="mt-4">
                  <Button
                    size="sm"
                    variant={alert.severity === 'critical' ? 'default' : 'outline'}
                    onClick={handleAction}
                    className="gap-2"
                  >
                    {alert.actionLabel}
                    <ExternalLink className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </div>
          </div>

          {alert.dismissable && onDismiss && (
            <button
              onClick={handleDismiss}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
