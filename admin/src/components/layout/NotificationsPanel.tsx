'use client';

import React, { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Bell,
  Check,
  AlertCircle,
  DollarSign,
  Package,
  TrendingUp,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface Notification {
  id: string;
  type: 'alert' | 'info' | 'success' | 'warning';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  icon?: React.ComponentType<{ className?: string }>;
  action?: {
    label: string;
    onClick: () => void;
  };
}

// Mock data - substituir por dados reais da API
const mockNotifications: Notification[] = [
  {
    id: '1',
    type: 'alert',
    title: 'Conta a Pagar Vencendo',
    message: 'Fornecedor XYZ - R$ 1.500,00 vence amanhã',
    timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 min atrás
    read: false,
    icon: DollarSign,
  },
  {
    id: '2',
    type: 'warning',
    title: 'Estoque Baixo',
    message: 'Produto "Notebook Dell" com apenas 3 unidades',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2h atrás
    read: false,
    icon: Package,
  },
  {
    id: '3',
    type: 'success',
    title: 'Meta Atingida',
    message: 'Vendas do mês ultrapassaram R$ 50.000!',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5), // 5h atrás
    read: true,
    icon: TrendingUp,
  },
];

export const NotificationsPanel: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);
  const [open, setOpen] = useState(false);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const removeNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const getTypeColor = (type: Notification['type']) => {
    switch (type) {
      case 'alert':
        return 'text-red-500';
      case 'warning':
        return 'text-yellow-500';
      case 'success':
        return 'text-green-500';
      case 'info':
      default:
        return 'text-blue-500';
    }
  };

  const getTypeIcon = (notification: Notification) => {
    if (notification.icon) {
      return notification.icon;
    }
    switch (notification.type) {
      case 'alert':
      case 'warning':
        return AlertCircle;
      case 'success':
        return Check;
      case 'info':
      default:
        return Bell;
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-medium text-white">
              {unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[380px] p-0" align="end">
        <div className="flex items-center justify-between border-b p-4">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold">Notificações</h3>
            {unreadCount > 0 && (
              <Badge variant="secondary" className="h-5 px-1.5 text-xs">
                {unreadCount}
              </Badge>
            )}
          </div>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllAsRead}
              className="h-8 text-xs"
            >
              Marcar todas como lidas
            </Button>
          )}
        </div>

        <ScrollArea className="h-[400px]">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Bell className="h-12 w-12 text-muted-foreground/40 mb-4" />
              <p className="text-sm text-muted-foreground">
                Nenhuma notificação
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => {
                const Icon = getTypeIcon(notification);
                return (
                  <div
                    key={notification.id}
                    className={cn(
                      'group relative p-4 transition-colors hover:bg-accent',
                      !notification.read && 'bg-accent/50'
                    )}
                  >
                    <div className="flex gap-3">
                      <div className={cn('flex-shrink-0', getTypeColor(notification.type))}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1 space-y-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-medium leading-none">
                            {notification.title}
                          </p>
                          {!notification.read && (
                            <div className="h-2 w-2 rounded-full bg-primary flex-shrink-0 mt-1" />
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {notification.message}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(notification.timestamp, {
                            addSuffix: true,
                            locale: ptBR,
                          })}
                        </p>
                      </div>
                      <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => removeNotification(notification.id)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    {!notification.read && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="mt-2 h-7 text-xs"
                        onClick={() => markAsRead(notification.id)}
                      >
                        Marcar como lida
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>

        {notifications.length > 0 && (
          <div className="border-t p-2">
            <Button variant="ghost" className="w-full justify-center text-xs">
              Ver todas as notificações
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
};
