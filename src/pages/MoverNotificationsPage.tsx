import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Settings } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { MoverLayout } from '../components/MoverLayout';
import { showToast } from '../utils/toast';

export default function MoverNotificationsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [moverId, setMoverId] = useState('');
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [notifSettings, setNotifSettings] = useState({ email_notifications_enabled: true, return_trip_alerts_enabled: true });
  const [savingSettings, setSavingSettings] = useState(false);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    try {
      const { data: moverData } = await supabase.from('movers').select('id, email_notifications_enabled, return_trip_alerts_enabled').eq('user_id', user!.id).maybeSingle();
      if (moverData) {
        setMoverId(moverData.id);
        setNotifSettings({
          email_notifications_enabled: moverData.email_notifications_enabled ?? true,
          return_trip_alerts_enabled: moverData.return_trip_alerts_enabled ?? true
        });
      }

      const { data: notifData } = await supabase.from('notifications').select('*').eq('user_id', user!.id).order('created_at', { ascending: false }).limit(50);
      setNotifications(notifData || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveNotifSettings = async () => {
    if (!moverId) return;
    setSavingSettings(true);
    try {
      const { error } = await supabase.from('movers').update({
        email_notifications_enabled: notifSettings.email_notifications_enabled,
        return_trip_alerts_enabled: notifSettings.return_trip_alerts_enabled
      }).eq('id', moverId);
      if (error) throw error;
      showToast('Préférences de notifications enregistrées', 'success');
    } catch (error) {
      console.error('Error saving:', error);
      showToast('Erreur lors de la sauvegarde', 'error');
    } finally {
      setSavingSettings(false);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await supabase.from('notifications').update({ read: true }).eq('id', id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return (
    <MoverLayout title="Notifications">
      {loading ? (
        <div className="flex justify-center py-32">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Notifications</h2>
            <button onClick={() => setShowSettings(!showSettings)} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition ${showSettings ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              <Settings className="w-4 h-4" /> Paramètres
            </button>
          </div>

          {showSettings && (
            <div className="mb-6 bg-gray-50 border border-gray-200 rounded-xl p-5 space-y-4">
              <h4 className="font-semibold text-gray-900 flex items-center gap-2"><Settings className="w-5 h-5 text-gray-600" /> Préférences de notifications</h4>
              <label className="flex items-start gap-3 cursor-pointer p-3 bg-white rounded-lg border border-gray-100 hover:border-blue-200 transition">
                <input type="checkbox" checked={notifSettings.email_notifications_enabled} onChange={(e) => setNotifSettings(prev => ({ ...prev, email_notifications_enabled: e.target.checked }))} className="mt-1 h-5 w-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500" />
                <div><span className="font-medium text-gray-900">Notifications email pour nouvelles demandes</span><p className="text-sm text-gray-600 mt-0.5">Recevez un email pour chaque nouvelle demande correspondant à votre zone</p></div>
              </label>
              <label className="flex items-start gap-3 cursor-pointer p-3 bg-white rounded-lg border border-gray-100 hover:border-green-200 transition">
                <input type="checkbox" checked={notifSettings.return_trip_alerts_enabled} onChange={(e) => setNotifSettings(prev => ({ ...prev, return_trip_alerts_enabled: e.target.checked }))} className="mt-1 h-5 w-5 text-green-600 border-gray-300 rounded focus:ring-green-500" />
                <div><span className="font-medium text-gray-900">Alertes opportunités de retour</span><p className="text-sm text-gray-600 mt-0.5">Alerte quand un déménagement part de votre destination d'arrivée</p></div>
              </label>
              <div className="flex justify-end pt-2">
                <button onClick={saveNotifSettings} disabled={savingSettings} className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition text-sm font-medium disabled:opacity-50">
                  {savingSettings ? 'Enregistrement...' : 'Enregistrer les préférences'}
                </button>
              </div>
            </div>
          )}

          <p className="text-sm text-gray-500 mb-4">{notifications.length} notification{notifications.length !== 1 ? 's' : ''}</p>

          {notifications.length === 0 ? (
            <div className="text-center py-12"><Bell className="w-12 h-12 text-gray-300 mx-auto mb-4" /><p className="text-gray-500">Aucune notification</p></div>
          ) : (
            <div className="space-y-3">
              {notifications.map((notification) => (
                <div key={notification.id} onClick={() => {
                  if (!notification.read) markAsRead(notification.id);
                  if (notification.type === 'quote_update' || notification.type === 'quote_updated') {
                    navigate('/mover/my-quotes');
                  } else if (notification.type === 'new_quote_request') {
                    navigate('/mover/quote-requests');
                  }
                }} className={`p-4 rounded-lg border cursor-pointer transition ${notification.read ? 'bg-gray-50 border-gray-100' : 'bg-blue-50 border-blue-200 hover:bg-blue-100'}`}>
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900">{notification.title}</h4>
                      <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                      <p className="text-xs text-gray-400 mt-2">{new Date(notification.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                    {!notification.read && <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </MoverLayout>
  );
}
