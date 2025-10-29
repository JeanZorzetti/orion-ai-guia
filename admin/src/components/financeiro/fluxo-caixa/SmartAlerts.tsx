'use client';

import React, { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Bell,
  AlertTriangle,
  AlertCircle,
  Info,
  TrendingUp,
  Calendar,
  Target,
  Activity,
  ArrowRight,
  CheckCheck
} from 'lucide-react';
import { useSmartAlerts } from '@/hooks/useSmartAlerts';
import { cn } from '@/lib/utils';

export const SmartAlerts: React.FC = () => {
  const { alerts, loading, markAsRead, unreadCount } = useSmartAlerts();
  const [filter, setFilter] = useState<'todos' | 'critico' | 'atencao' | 'informativo'>('todos');

  const filteredAlerts = filter === 'todos'
    ? alerts
    : alerts.filter(a => a.tipo === filter);

  const getAlertIcon = (categoria: string) => {
    switch (categoria) {
      case 'saldo':
        return <AlertCircle className="h-4 w-4" />;
      case 'vencimento':
        return <Calendar className="h-4 w-4" />;
      case 'meta':
        return <Target className="h-4 w-4" />;
      case 'anomalia':
        return <Activity className="h-4 w-4" />;
      case 'oportunidade':
        return <TrendingUp className="h-4 w-4" />;
      default:
        return <Info className="h-4 w-4" />;
    }
  };

  const getAlertVariant = (tipo: string): 'default' | 'destructive' => {
    return tipo === 'critico' ? 'destructive' : 'default';
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Alertas e Notificações</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[200px]">
            <p className="text-muted-foreground">Carregando alertas...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-blue-500" />
              Alertas e Notificações
              {unreadCount > 0 && (
                <Badge variant="destructive">
                  {unreadCount}
                </Badge>
              )}
            </CardTitle>
            <CardDescription className="mt-1">
              Alertas inteligentes sobre seu fluxo de caixa
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              variant={filter === 'todos' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('todos')}
            >
              Todos
            </Button>
            <Button
              variant={filter === 'critico' ? 'destructive' : 'outline'}
              size="sm"
              onClick={() => setFilter('critico')}
            >
              <AlertTriangle className="mr-2 h-4 w-4" />
              Críticos
            </Button>
            <Button
              variant={filter === 'atencao' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('atencao')}
            >
              Atenção
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {filteredAlerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <CheckCheck className="h-12 w-12 text-green-500 mb-4" />
            <p className="font-medium">Tudo certo!</p>
            <p className="text-sm text-muted-foreground mt-1">
              Não há alertas {filter !== 'todos' && `do tipo "${filter}"`} no momento
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredAlerts.map((alert) => (
              <Alert
                key={alert.id}
                variant={getAlertVariant(alert.tipo)}
                className={cn(
                  'transition-all',
                  !alert.lido && 'border-l-4 border-l-primary shadow-sm'
                )}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      {getAlertIcon(alert.categoria)}
                      <AlertTitle className="mb-0">{alert.titulo}</AlertTitle>
                      {!alert.lido && (
                        <Badge variant="outline" className="text-xs">
                          Novo
                        </Badge>
                      )}
                    </div>
                    <AlertDescription className="mt-2">
                      {alert.descricao}
                    </AlertDescription>
                    {alert.acao && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-3"
                        onClick={() => {
                          markAsRead(alert.id);
                          window.location.href = alert.acao!.href;
                        }}
                      >
                        {alert.acao.label}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatDistanceToNow(alert.data, { addSuffix: true, locale: ptBR })}
                    </span>
                    {!alert.lido && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => markAsRead(alert.id)}
                        className="text-xs"
                      >
                        Marcar como lido
                      </Button>
                    )}
                  </div>
                </div>
              </Alert>
            ))}
          </div>
        )}

        {/* Resumo por tipo */}
        {alerts.length > 0 && (
          <div className="mt-6 grid grid-cols-3 gap-3">
            <Card className="bg-red-50 dark:bg-red-950/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs text-muted-foreground flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  Críticos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {alerts.filter(a => a.tipo === 'critico').length}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-yellow-50 dark:bg-yellow-950/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs text-muted-foreground flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-yellow-600" />
                  Atenção
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">
                  {alerts.filter(a => a.tipo === 'atencao').length}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-blue-50 dark:bg-blue-950/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs text-muted-foreground flex items-center gap-2">
                  <Info className="h-4 w-4 text-blue-600" />
                  Informativos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {alerts.filter(a => a.tipo === 'informativo').length}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
