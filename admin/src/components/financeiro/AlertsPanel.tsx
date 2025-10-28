'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  FinancialAlert,
  FinancialAlertData,
  AlertSeverity,
} from './FinancialAlert';
import { Bell, Filter, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AlertsPanelProps {
  alerts: FinancialAlertData[];
  onAlertAction?: (alert: FinancialAlertData) => void;
  onAlertDismiss?: (alertId: string) => void;
  onClearAll?: () => void;
  compact?: boolean;
  className?: string;
}

export const AlertsPanel: React.FC<AlertsPanelProps> = ({
  alerts,
  onAlertAction,
  onAlertDismiss,
  onClearAll,
  compact = false,
  className = '',
}) => {
  const [selectedTab, setSelectedTab] = useState<AlertSeverity | 'all'>('all');

  // Contadores por severidade
  const counts = {
    all: alerts.length,
    critical: alerts.filter((a) => a.severity === 'critical').length,
    warning: alerts.filter((a) => a.severity === 'warning').length,
    info: alerts.filter((a) => a.severity === 'info').length,
    success: alerts.filter((a) => a.severity === 'success').length,
  };

  // Filtrar alertas baseado na tab selecionada
  const filteredAlerts =
    selectedTab === 'all'
      ? alerts
      : alerts.filter((a) => a.severity === selectedTab);

  // Ordenar alertas: críticos primeiro, depois por data
  const sortedAlerts = [...filteredAlerts].sort((a, b) => {
    const severityOrder = { critical: 0, warning: 1, info: 2, success: 3 };
    const severityDiff =
      severityOrder[a.severity] - severityOrder[b.severity];
    if (severityDiff !== 0) return severityDiff;

    // Se mesma severidade, ordenar por data (mais recente primeiro)
    if (a.date && b.date) {
      return b.date.getTime() - a.date.getTime();
    }
    return 0;
  });

  if (compact) {
    return (
      <Card className={className}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-muted-foreground" />
              <CardTitle className="text-base">Alertas</CardTitle>
              {counts.all > 0 && (
                <Badge variant="destructive" className="ml-1">
                  {counts.all}
                </Badge>
              )}
            </div>
            {counts.all > 0 && onClearAll && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClearAll}
                className="text-xs"
              >
                Limpar Todos
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {sortedAlerts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Bell className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Nenhum alerta no momento</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {sortedAlerts.map((alert) => (
                <FinancialAlert
                  key={alert.id}
                  alert={alert}
                  onAction={onAlertAction}
                  onDismiss={onAlertDismiss}
                  compact
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-muted-foreground" />
            <CardTitle>Central de Alertas Financeiros</CardTitle>
          </div>
          {counts.all > 0 && onClearAll && (
            <Button variant="outline" size="sm" onClick={onClearAll}>
              <X className="h-4 w-4 mr-2" />
              Limpar Todos
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={selectedTab} onValueChange={(v) => setSelectedTab(v as AlertSeverity | 'all')}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="all" className="relative">
              Todos
              {counts.all > 0 && (
                <Badge
                  variant="secondary"
                  className="ml-2 h-5 min-w-[20px] px-1"
                >
                  {counts.all}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="critical" className="relative">
              Críticos
              {counts.critical > 0 && (
                <Badge
                  variant="destructive"
                  className="ml-2 h-5 min-w-[20px] px-1"
                >
                  {counts.critical}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="warning" className="relative">
              Avisos
              {counts.warning > 0 && (
                <Badge
                  variant="default"
                  className="ml-2 h-5 min-w-[20px] px-1 bg-orange-500"
                >
                  {counts.warning}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="info" className="relative">
              Info
              {counts.info > 0 && (
                <Badge
                  variant="secondary"
                  className="ml-2 h-5 min-w-[20px] px-1"
                >
                  {counts.info}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="success" className="relative">
              Sucesso
              {counts.success > 0 && (
                <Badge
                  variant="default"
                  className="ml-2 h-5 min-w-[20px] px-1 bg-green-500"
                >
                  {counts.success}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value={selectedTab} className="mt-6">
            {sortedAlerts.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Bell className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">Nenhum alerta</p>
                <p className="text-sm mt-1">
                  {selectedTab === 'all'
                    ? 'Você está em dia com suas finanças!'
                    : `Nenhum alerta de ${selectedTab} no momento`}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {sortedAlerts.map((alert) => (
                  <FinancialAlert
                    key={alert.id}
                    alert={alert}
                    onAction={onAlertAction}
                    onDismiss={onAlertDismiss}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Resumo de alertas críticos */}
        {counts.critical > 0 && selectedTab === 'all' && (
          <div className="mt-6 p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg">
            <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
              <Filter className="h-4 w-4" />
              <span className="text-sm font-semibold">
                {counts.critical} alerta{counts.critical > 1 ? 's' : ''} crítico
                {counts.critical > 1 ? 's' : ''} requer
                {counts.critical === 1 ? '' : 'm'} atenção imediata
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
