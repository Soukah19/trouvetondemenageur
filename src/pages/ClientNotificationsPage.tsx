import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCircle, Clock, FileText, MessageSquare, AlertCircle, Trash2, Check, RefreshCw } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { ClientLayout } from '../components/ClientLayout';
import { showToast } from '../utils/toast';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  created_at: string;
  related_id?: string;
  data?: any;
}

export default function ClientNotificationsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');

  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [user]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNotifications(data || []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      showToast('Erreur lors du chargement des notifications', 'error');
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId);

      if (error) throw error;

      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', user?.id)
        .eq('read', false);

      if (error) throw error;

      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      showToast('Toutes les notifications marquées comme lues', 'success');
    } catch (error) {
      console.error('Error marking all as read:', error);
      showToast('Erreur', 'error');
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      if (error) throw error;

      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      showToast('Notification supprimée', 'success');
    } catch (error) {
      console.error('Error deleting notification:', error);
      showToast('Erreur lors de la suppression', 'error');
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    // Mark as read
    if (!notification.read) {
      await markAsRead(notification.id);
    }

    // Navigate based on notification type
    switch (notification.type) {
      case 'new_quote':
      case 'quote_update':
        navigate('/client/quotes');
        break;
      case 'quote_accepted':
      case 'payment_received':
        if (notification.related_id) {
          navigate(`/client/payment/${notification.related_id}`);
        }
        break;
      case 'mission_started':
      case 'mission_completed':
        if (notification.data?.quote_request_id) {
          navigate(`/client/moving/${notification.data.quote_request_id}/tracking`);
        }
        break;
      default:
        navigate('/client/dashboard');
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'new_quote':
        return <FileText className="w-5 h-5 text-blue-600" />;
      case 'quote_update':
        return <RefreshCw className="w-5 h-5 text-purple-600" />;
      case 'quote_accepted':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'payment_received':
        return <CheckCircle className="w-5 h-5 text-emerald-600" />;
      case 'mission_started':
        return <Clock className="w-5 h-5 text-orange-600" />;
      case 'mission_completed':
        return <CheckCircle className="w-5 h-5 text-teal-600" />;
      case 'message':
        return <MessageSquare className="w-5 h-5 text-indigo-600" />;
      default:
        return <Bell className="w-5 h-5 text-gray-600" />;
    }
  };

  const getNotificationColor = (type: string, read: boolean) => {
    if (read) return 'bg-gray-50';
    
    switch (type) {
      case 'new_quote':
        return 'bg-blue-50 border-l-4 border-l-blue-500';
      case 'quote_update':
        return 'bg-purple-50 border-l-4 border-l-purple-500';
      case 'quote_accepted':
        return 'bg-green-50 border-l-4 border-l-green-500';
      case 'payment_received':
        return 'bg-emerald-50 border-l-4 border-l-emerald-500';
      case 'mission_started':
        return 'bg-orange-50 border-l-4 border-l-orange-500';
      case 'mission_completed':
        return 'bg-teal-50 border-l-4 border-l-teal-500';
      default:
        return 'bg-white border-l-4 border-l-gray-300';
    }
  };

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'unread') return !n.read;
    if (filter === 'read') return n.read;
    return true;
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  if (loading) {
    return (
      <ClientLayout title="Notifications">
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </ClientLayout>
    );
  }

  return (
    <ClientLayout title="Notifications" subtitle={`${unreadCount} non lue${unreadCount > 1 ? 's' : ''}`}>
      <div className="max-w-4xl mx-auto">
        {/* Filters & Actions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  filter === 'all' 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Toutes ({notifications.length})
              </button>
              <button
                onClick={() => setFilter('unread')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  filter === 'unread' 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Non lues ({unreadCount})
              </button>
              <button
                onClick={() => setFilter('read')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  filter === 'read' 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Lues ({notifications.length - unreadCount})
              </button>
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="flex items-center gap-2 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition text-sm font-medium"
              >
                <Check className="w-4 h-4" />
                Tout marquer comme lu
              </button>
            )}
          </div>
        </div>

        {/* Notifications List */}
        {filteredNotifications.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              {filter === 'unread' ? 'Aucune notification non lue' : 'Aucune notification'}
            </h3>
            <p className="text-gray-500">
              {filter === 'unread' 
                ? 'Toutes vos notifications ont été lues.' 
                : 'Vous n\'avez pas encore reçu de notifications.'
              }
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`
                  rounded-xl shadow-sm border border-gray-200 overflow-hidden
                  ${getNotificationColor(notification.type, notification.read)}
                  ${!notification.read ? 'hover:shadow-md' : ''}
                  transition cursor-pointer
                `}
              >
                <div 
                  className="p-4 flex items-start gap-4"
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className={`font-semibold ${notification.read ? 'text-gray-600' : 'text-gray-900'}`}>
                        {notification.title}
                      </h4>
                      {!notification.read && (
                        <span className="flex-shrink-0 w-2 h-2 rounded-full bg-blue-600 mt-2"></span>
                      )}
                    </div>
                    <p className={`text-sm mt-1 ${notification.read ? 'text-gray-500' : 'text-gray-700'}`}>
                      {notification.message}
                    </p>
                    <p className="text-xs text-gray-400 mt-2">
                      {new Date(notification.created_at).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteNotification(notification.id);
                    }}
                    className="flex-shrink-0 p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </ClientLayout>
  );
}
