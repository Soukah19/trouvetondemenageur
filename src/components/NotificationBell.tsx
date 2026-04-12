import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, X, Check } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  related_id: string | null;
  read: boolean;
  created_at: string;
  data?: any;
  user_type?: string;
}

interface NotificationBellProps {
  onNotificationClick?: (notification: Notification) => void;
  /** 'client' | 'mover' | 'admin' - determines redirect routes */
  userRole?: 'client' | 'mover' | 'admin';
}

export function NotificationBell({ onNotificationClick, userRole }: NotificationBellProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    loadNotifications();

    const subscription = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          loadNotifications();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user]);

  async function loadNotifications() {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;

      setNotifications(data || []);
      setUnreadCount(data?.filter(n => !n.read).length || 0);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  }

  async function markAsRead(notificationId: string) {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId);

      if (error) throw error;

      setNotifications(prev =>
        prev.map(n => (n.id === notificationId ? { ...n, read: true } : n))
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }

  async function markAllAsRead() {
    try {
      const unreadIds = notifications.filter(n => !n.read).map(n => n.id);

      if (unreadIds.length === 0) return;

      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .in('id', unreadIds);

      if (error) throw error;

      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  }

  function getNotificationIcon(type: string) {
    switch (type) {
      case 'new_quote':
        return '💰';
      case 'quote_accepted':
        return '✅';
      case 'quote_update':
      case 'quote_updated':
        return '🔄';
      case 'message':
        return '💬';
      case 'review':
        return '⭐';
      case 'payment':
      case 'payment_received':
        return '💳';
      case 'damage_report':
      case 'damage_alert':
        return '⚠️';
      case 'new_quote_request':
        return '📦';
      case 'mission_started':
        return '🚚';
      case 'mission_completed':
        return '✅';
      case 'contract_sent':
      case 'contract_signed':
        return '📄';
      case 'system':
      case 'mover_registration':
      case 'new_mover':
        return '🔔';
      case 'admin_modified_request':
        return '✏️';
      default:
        return '🔔';
    }
  }

  function getNotificationRoute(notification: Notification): string | null {
    const role = userRole || notification.user_type;
    const relId = notification.related_id;

    if (role === 'client') {
      switch (notification.type) {
        case 'new_quote':
        case 'quote_update':
        case 'quote_updated':
        case 'new_quote_request':
        case 'admin_modified_request':
          return relId ? `/client/quotes` : '/client/quotes';
        case 'quote_accepted':
          return relId ? `/client/payment/${relId}` : '/client/quotes';
        case 'payment_received':
        case 'payment':
          return relId ? `/client/payment/${relId}` : '/client/dashboard';
        case 'mission_started':
        case 'mission_completed':
          if (notification.data?.quote_request_id) return `/client/moving/${notification.data.quote_request_id}/tracking`;
          return relId ? `/client/moving/${relId}/tracking` : '/client/dashboard';
        case 'damage_report':
        case 'damage_alert':
          if (notification.data?.quote_request_id) return `/client/moving/${notification.data.quote_request_id}/damage-report`;
          return relId ? `/client/moving/${relId}/damage-report` : '/client/dashboard';
        case 'contract_sent':
        case 'contract_signed':
          return '/client/contracts';
        case 'message':
          return '/client/dashboard';
        default:
          return relId ? `/client/quotes` : '/client/dashboard';
      }
    } else if (role === 'mover') {
      switch (notification.type) {
        case 'new_quote_request':
          return '/mover/quote-requests';
        case 'new_quote':
        case 'quote_update':
        case 'quote_updated':
        case 'quote_accepted':
        case 'admin_modified_request':
          return relId ? `/mover/my-quotes/${relId}` : '/mover/my-quotes';
        case 'payment':
        case 'payment_received':
          return '/mover/finances';
        case 'mission_started':
        case 'mission_completed':
          return '/mover/movings';
        case 'damage_report':
        case 'damage_alert':
          return '/mover/damage-photos';
        case 'contract_sent':
        case 'contract_signed':
          return '/mover/contracts';
        case 'review':
          return '/mover/dashboard';
        case 'message':
          return '/mover/dashboard';
        case 'system':
          return '/mover/documents';
        case 'document_rejected':
          return '/mover/documents';
        default:
          return relId ? '/mover/quote-requests' : '/mover/dashboard';
      }
    } else if (role === 'admin') {
      // Admin notifications are handled via onNotificationClick callback
      return null;
    }

    return null;
  }

  function handleNotificationNavigation(notification: Notification) {
    markAsRead(notification.id);
    setShowDropdown(false);

    // If a custom handler is provided, use it
    if (onNotificationClick) {
      onNotificationClick(notification);
      return;
    }

    // Otherwise, use smart routing
    const route = getNotificationRoute(notification);
    if (route) {
      navigate(route);
    }
  }

  function formatTime(timestamp: string) {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'À l\'instant';
    if (minutes < 60) return `Il y a ${minutes}min`;
    if (hours < 24) return `Il y a ${hours}h`;
    if (days < 7) return `Il y a ${days}j`;
    return date.toLocaleDateString('fr-FR');
  }

  if (!user || loading) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
        aria-label="Notifications"
      >
        <Bell className="h-6 w-6" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 h-5 w-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {showDropdown && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setShowDropdown(false)}
          />
          <div className="absolute right-0 mt-2 w-96 bg-white rounded-xl shadow-2xl border border-gray-200 z-20 max-h-[600px] flex flex-col">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                Notifications
              </h3>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Tout marquer lu
                  </button>
                )}
                <button
                  onClick={() => setShowDropdown(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="overflow-y-auto flex-1">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <Bell className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p>Aucune notification</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {notifications.map(notification => (
                    <div
                      key={notification.id}
                      className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer ${
                        !notification.read ? 'bg-blue-50' : ''
                      }`}
                      onClick={() => handleNotificationNavigation(notification)}
                    >
                      <div className="flex items-start gap-3">
                        <div className="text-2xl flex-shrink-0">
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="font-semibold text-gray-900 text-sm">
                              {notification.title}
                            </h4>
                            {!notification.read && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  markAsRead(notification.id);
                                }}
                                className="text-blue-600 hover:text-blue-700 flex-shrink-0"
                                title="Marquer comme lu"
                              >
                                <Check className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            {notification.message}
                          </p>
                          <p className="text-xs text-gray-400 mt-2">
                            {formatTime(notification.created_at)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}