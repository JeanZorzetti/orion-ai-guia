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
  Loader2,
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
import { useNotifications, Notification, NotificationType } from '@/hooks/useNotifications';

// Icon mapping based on notification icon string or type
const getNotificationIcon = (notification: Notification) => {
  // Use icon field if provided
  if (notification.icon) {
    switch (notification.icon) {
      case 'DollarSign':
        return DollarSign;
      case 'Package':
        return Package;
      case 'TrendingUp':
        return TrendingUp;
      case 'Check':
        return Check;
      case 'AlertCircle':
        return AlertCircle;
    }
  }

  // Fallback to type-based icons
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

const getTypeColor = (type: NotificationType) => {
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

export const NotificationsPanel: React.FC = () => {
  const {
    notifications,
    loading,
    error,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refresh
  } = useNotifications();

  const [open, setOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const handleMarkAsRead = async (id: number) => {
    try {
      setActionLoading(id);
      await markAsRead(id);
    } catch (err) {
      console.error('Failed to mark as read:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      setActionLoading(-1);
      await markAllAsRead();
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleRemoveNotification = async (id: number) => {
    try {
      setActionLoading(id);
      await deleteNotification(id);
    } catch (err) {
      console.error('Failed to delete notification:', err);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-medium text-white">
              {unreadCount > 99 ? '99+' : unreadCount}
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
              onClick={handleMarkAllAsRead}
              disabled={actionLoading === -1}
              className="h-8 text-xs"
            >
              {actionLoading === -1 ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                'Marcar todas como lidas'
              )}
            </Button>
          )}
        </div>

        <ScrollArea className="h-[400px]">
          {loading && notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground">Carregando notificações...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
              <p className="text-sm text-muted-foreground mb-2">Erro ao carregar notificações</p>
              <Button variant="outline" size="sm" onClick={refresh}>
                Tentar novamente
              </Button>
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Bell className="h-12 w-12 text-muted-foreground/40 mb-4" />
              <p className="text-sm text-muted-foreground">
                Nenhuma notificação
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => {
                const Icon = getNotificationIcon(notification);
                const isProcessing = actionLoading === notification.id;

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
                          {formatDistanceToNow(new Date(notification.created_at), {
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
                          onClick={() => handleRemoveNotification(notification.id)}
                          disabled={isProcessing}
                        >
                          {isProcessing ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <X className="h-3 w-3" />
                          )}
                        </Button>
                      </div>
                    </div>
                    {!notification.read && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="mt-2 h-7 text-xs"
                        onClick={() => handleMarkAsRead(notification.id)}
                        disabled={isProcessing}
                      >
                        {isProcessing ? (
                          <Loader2 className="h-3 w-3 animate-spin mr-1" />
                        ) : null}
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
