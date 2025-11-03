/**
 * useNotifications hook
 * Manages notifications for the current user with real-time updates
 * NO MOCK DATA - All data comes from backend API
 */
import { useState, useCallback, useEffect } from 'react';
import { api } from '@/lib/api';

export type NotificationType = 'alert' | 'info' | 'success' | 'warning';
export type NotificationPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Notification {
  id: number;
  workspace_id: number;
  user_id: number;
  type: NotificationType;
  priority: NotificationPriority;
  title: string;
  message: string;
  read: boolean;
  read_at: string | null;
  link: string | null;
  action_label: string | null;
  icon: string | null;
  related_entity_type: string | null;
  related_entity_id: number | null;
  created_at: string;
  expires_at: string | null;
}

export interface NotificationStats {
  total: number;
  unread: number;
  by_type: Record<string, number>;
  by_priority: Record<string, number>;
}

export interface CreateNotificationRequest {
  type: NotificationType;
  priority?: NotificationPriority;
  title: string;
  message: string;
  link?: string;
  action_label?: string;
  icon?: string;
  related_entity_type?: string;
  related_entity_id?: number;
  user_id?: number;
  expires_at?: string;
}

interface UseNotificationsReturn {
  notifications: Notification[];
  stats: NotificationStats | null;
  loading: boolean;
  error: string | null;
  unreadCount: number;
  fetchNotifications: (filters?: {
    unread_only?: boolean;
    type?: NotificationType;
    priority?: NotificationPriority;
  }) => Promise<void>;
  fetchStats: () => Promise<void>;
  markAsRead: (notificationId: number) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (notificationId: number) => Promise<void>;
  deleteAllRead: () => Promise<void>;
  createNotification: (data: CreateNotificationRequest) => Promise<void>;
  refresh: () => Promise<void>;
}

export const useNotifications = (): UseNotificationsReturn => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [stats, setStats] = useState<NotificationStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch notifications with optional filters
   */
  const fetchNotifications = useCallback(async (filters?: {
    unread_only?: boolean;
    type?: NotificationType;
    priority?: NotificationPriority;
  }) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.append('limit', '100');

      if (filters?.unread_only) {
        params.append('unread_only', 'true');
      }
      if (filters?.type) {
        params.append('type', filters.type);
      }
      if (filters?.priority) {
        params.append('priority', filters.priority);
      }

      const response = await api.get<Notification[]>(
        `/notifications?${params.toString()}`
      );
      setNotifications(response);
    } catch (err: any) {
      console.error('Error fetching notifications:', err);
      setError(err.response?.data?.detail || 'Failed to fetch notifications');
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Fetch notification statistics
   */
  const fetchStats = useCallback(async () => {
    try {
      const response = await api.get<NotificationStats>('/notifications/stats');
      setStats(response);
    } catch (err: any) {
      console.error('Error fetching notification stats:', err);
    }
  }, []);

  /**
   * Mark a notification as read
   */
  const markAsRead = useCallback(async (notificationId: number) => {
    try {
      await api.put(`/notifications/${notificationId}`, { read: true });

      // Update local state
      setNotifications(prev =>
        prev.map(n =>
          n.id === notificationId
            ? { ...n, read: true, read_at: new Date().toISOString() }
            : n
        )
      );

      // Update stats
      await fetchStats();
    } catch (err: any) {
      console.error('Error marking notification as read:', err);
      throw err;
    }
  }, [fetchStats]);

  /**
   * Mark all notifications as read
   */
  const markAllAsRead = useCallback(async () => {
    try {
      await api.post('/notifications/mark-all-read');

      // Update local state
      const now = new Date().toISOString();
      setNotifications(prev =>
        prev.map(n => ({ ...n, read: true, read_at: now }))
      );

      // Update stats
      await fetchStats();
    } catch (err: any) {
      console.error('Error marking all notifications as read:', err);
      throw err;
    }
  }, [fetchStats]);

  /**
   * Delete a notification
   */
  const deleteNotification = useCallback(async (notificationId: number) => {
    try {
      await api.delete(`/notifications/${notificationId}`);

      // Remove from local state
      setNotifications(prev => prev.filter(n => n.id !== notificationId));

      // Update stats
      await fetchStats();
    } catch (err: any) {
      console.error('Error deleting notification:', err);
      throw err;
    }
  }, [fetchStats]);

  /**
   * Delete all read notifications
   */
  const deleteAllRead = useCallback(async () => {
    try {
      await api.delete('/notifications');

      // Remove read notifications from local state
      setNotifications(prev => prev.filter(n => !n.read));

      // Update stats
      await fetchStats();
    } catch (err: any) {
      console.error('Error deleting read notifications:', err);
      throw err;
    }
  }, [fetchStats]);

  /**
   * Create a new notification
   */
  const createNotification = useCallback(async (data: CreateNotificationRequest) => {
    try {
      await api.post('/notifications', data);

      // Refresh notifications
      await fetchNotifications();
      await fetchStats();
    } catch (err: any) {
      console.error('Error creating notification:', err);
      throw err;
    }
  }, [fetchNotifications, fetchStats]);

  /**
   * Refresh all notification data
   */
  const refresh = useCallback(async () => {
    await Promise.all([
      fetchNotifications(),
      fetchStats()
    ]);
  }, [fetchNotifications, fetchStats]);

  /**
   * Initial fetch on mount
   */
  useEffect(() => {
    refresh();
  }, [refresh]);

  /**
   * Calculate unread count from local state
   */
  const unreadCount = notifications.filter(n => !n.read).length;

  return {
    notifications,
    stats,
    loading,
    error,
    unreadCount,
    fetchNotifications,
    fetchStats,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteAllRead,
    createNotification,
    refresh
  };
};
