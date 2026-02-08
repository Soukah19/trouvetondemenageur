import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Package, Clock, CheckCircle, XCircle, FileText, Euro, 
  Bell, ChevronRight, TrendingUp, Star,
  Activity, Zap, BarChart3, ArrowUpRight
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { MoverLayout } from '../components/MoverLayout';
import { showToast } from '../utils/toast';

type MoverDashboardProps = {
  onLogout?: () => void;
  onNavigate?: (page: 'mover-quote-requests' | 'mover-my-quotes' | 'mover-movings-list' | 'mover-damage-photos' | 'mover-finances') => void;
  onNotificationQuoteRequest?: (quoteRequestId: string) => void;
};

interface Mover {
  id: string;
  company_name: string;
  verification_status: string;
  is_active: boolean;
  average_rating: number;
  total_reviews: number;
  years_experience: number;
  team_size: number;
  completed_moves: number;
}

export function MoverDashboard({ onNotificationQuoteRequest }: MoverDashboardProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [mover, setMover] = useState<Mover | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    availableRequests: 0,
    pendingQuotes: 0,
    acceptedQuotes: 0,
    totalEarnings: 0,
    completedMoves: 0,
    responseRate: 0,
  });
  const [recentQuotes, setRecentQuotes] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);

  const loadDashboardData = async () => {
    try {
      const { data: moverData, error: moverError } = await supabase
        .from('movers')
        .select('*')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (moverError) throw moverError;
      setMover(moverData);

      if (moverData?.verification_status === 'verified' && moverData?.is_active) {
        const { data: myQuotes } = await supabase
          .from('quotes')
          .select('*, payments(*)')
          .eq('mover_id', moverData.id)
          .order('created_at', { ascending: false });

        const quotedRequestIds = myQuotes?.map(q => q.quote_request_id) || [];

        const { count: availableCount } = await supabase
          .from('quote_requests')
          .select('*', { count: 'exact', head: true })
          .in('status', ['new', 'quoted'])
          .not('id', 'in', `(${quotedRequestIds.length > 0 ? quotedRequestIds.join(',') : '00000000-0000-0000-0000-000000000000'})`);

        const pendingQuotes = myQuotes?.filter(q => q.status === 'pending').length || 0;
        const acceptedQuotes = myQuotes?.filter(q => q.status === 'accepted').length || 0;
        const totalQuotes = myQuotes?.length || 0;
        const respondedQuotes = myQuotes?.filter(q => q.status !== 'draft').length || 0;

        const totalEarnings = myQuotes?.reduce((sum, quote) => {
          if (quote.status === 'accepted' && quote.payments && quote.payments.length > 0) {
            const payment = quote.payments[0];
            return sum + (payment.mover_deposit || 0) + (payment.remaining_amount || 0);
          }
          return sum;
        }, 0) || 0;

        setStats({
          availableRequests: availableCount || 0,
          pendingQuotes,
          acceptedQuotes,
          totalEarnings,
          completedMoves: moverData.completed_moves || 0,
          responseRate: totalQuotes > 0 ? Math.round((respondedQuotes / totalQuotes) * 100) : 100,
        });

        setRecentQuotes((myQuotes || []).slice(0, 5));
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getVerificationStatusBanner = () => {
    if (!mover) return null;
    if (mover.verification_status === 'pending') {
      return (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6 rounded-r-lg">
          <div className="flex items-center">
            <Clock className="w-5 h-5 text-yellow-600 mr-3" />
            <div>
              <p className="font-medium text-yellow-800">Vérification en cours</p>
              <p className="text-sm text-yellow-700">Votre dossier est en cours de vérification. Notification sous 48h.</p>
            </div>
          </div>
        </div>
      );
    }
    if (mover.verification_status === 'rejected') {
      return (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6 rounded-r-lg">
          <div className="flex items-center">
            <XCircle className="w-5 h-5 text-red-600 mr-3" />
            <div>
              <p className="font-medium text-red-800">Vérification échouée</p>
              <p className="text-sm text-red-700">Veuillez nous contacter pour plus d'informations.</p>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  const renderContent = () => {
    return renderDashboard();
  };

  const renderDashboard = () => (
    <>
      {getVerificationStatusBanner()}
      {mover?.verification_status === 'verified' && mover?.is_active ? (
        <>
          {/* Welcome Banner */}
          <div className="bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 rounded-2xl p-6 mb-6 text-white shadow-lg">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h2 className="text-2xl font-bold mb-1">Bonjour, {mover?.company_name} 👋</h2>
                <p className="text-emerald-100">
                  {stats.availableRequests > 0 
                    ? `${stats.availableRequests} nouvelle${stats.availableRequests > 1 ? 's' : ''} demande${stats.availableRequests > 1 ? 's' : ''} vous attend${stats.availableRequests > 1 ? 'ent' : ''}` 
                    : 'Aucune nouvelle demande pour le moment'}
                </p>
              </div>
              <div className="hidden md:flex items-center gap-4">
                <div className="text-center bg-white/15 rounded-xl px-4 py-2 backdrop-blur-sm">
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-yellow-300" />
                    <span className="text-xl font-bold">{mover?.average_rating?.toFixed(1) || 'N/A'}</span>
                  </div>
                  <p className="text-xs text-emerald-100">{mover?.total_reviews || 0} avis</p>
                </div>
                <div className="text-center bg-white/15 rounded-xl px-4 py-2 backdrop-blur-sm">
                  <span className="text-xl font-bold">{stats.responseRate}%</span>
                  <p className="text-xs text-emerald-100">Taux réponse</p>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div onClick={() => navigate('/mover/quote-requests')} className="bg-white rounded-xl shadow-sm p-5 border border-gray-100 hover:shadow-md hover:border-blue-200 transition cursor-pointer group">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Demandes disponibles</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.availableRequests}</p>
                  {stats.availableRequests > 0 && <p className="text-xs text-blue-600 mt-1 flex items-center gap-1"><Zap className="w-3 h-3" /> Répondez vite !</p>}
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center group-hover:bg-blue-200 transition">
                  <Package className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>
            <div onClick={() => navigate('/mover/my-quotes')} className="bg-white rounded-xl shadow-sm p-5 border border-gray-100 hover:shadow-md hover:border-yellow-200 transition cursor-pointer group">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Devis en attente</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.pendingQuotes}</p>
                  <p className="text-xs text-gray-400 mt-1">en cours de validation</p>
                </div>
                <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center group-hover:bg-yellow-200 transition">
                  <Clock className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
            </div>
            <div onClick={() => navigate('/mover/my-quotes')} className="bg-white rounded-xl shadow-sm p-5 border border-gray-100 hover:shadow-md hover:border-green-200 transition cursor-pointer group">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Devis acceptés</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.acceptedQuotes}</p>
                  <p className="text-xs text-green-600 mt-1 flex items-center gap-1"><TrendingUp className="w-3 h-3" /> missions confirmées</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center group-hover:bg-green-200 transition">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>
            <div onClick={() => navigate('/mover/finances')} className="bg-white rounded-xl shadow-sm p-5 border border-gray-100 hover:shadow-md hover:border-emerald-200 transition cursor-pointer group">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Gains totaux</p>
                  <p className="text-2xl font-bold text-emerald-600">{stats.totalEarnings.toFixed(0)} €</p>
                  <p className="text-xs text-gray-400 mt-1">{stats.completedMoves} déménagements</p>
                </div>
                <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center group-hover:bg-emerald-200 transition">
                  <Euro className="w-6 h-6 text-emerald-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions + Performance */}
          {/* <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <div className="lg:col-span-2 space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2"><Zap className="w-5 h-5 text-amber-500" /> Actions rapides</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button onClick={() => navigate('/mover/quote-requests')} className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl p-5 hover:from-blue-600 hover:to-blue-700 transition shadow-md text-left group">
                  <div className="flex items-center justify-between"><div><h3 className="text-lg font-bold mb-1">Voir les demandes</h3><p className="text-blue-100 text-sm">{stats.availableRequests} disponibles</p></div><ChevronRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" /></div>
                </button>
                <button onClick={() => navigate('/mover/my-quotes')} className="bg-gradient-to-r from-indigo-500 to-indigo-600 text-white rounded-xl p-5 hover:from-indigo-600 hover:to-indigo-700 transition shadow-md text-left group">
                  <div className="flex items-center justify-between"><div><h3 className="text-lg font-bold mb-1">Mes devis</h3><p className="text-indigo-100 text-sm">{stats.pendingQuotes} en attente</p></div><ChevronRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" /></div>
                </button>
                <button onClick={() => navigate('/mover/finances')} className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl p-5 hover:from-emerald-600 hover:to-emerald-700 transition shadow-md text-left group">
                  <div className="flex items-center justify-between"><div><h3 className="text-lg font-bold mb-1">Mes finances</h3><p className="text-emerald-100 text-sm">{stats.totalEarnings.toFixed(0)} € gagnés</p></div><ChevronRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" /></div>
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2"><BarChart3 className="w-5 h-5 text-indigo-500" /> Performance</h3>
              <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100 space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1"><span className="text-sm text-gray-600">Taux de réponse</span><span className="text-sm font-bold text-gray-900">{stats.responseRate}%</span></div>
                  <div className="w-full bg-gray-200 rounded-full h-2"><div className="bg-emerald-500 h-2 rounded-full transition-all" style={{ width: `${stats.responseRate}%` }}></div></div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1"><span className="text-sm text-gray-600">Note moyenne</span><span className="text-sm font-bold text-gray-900 flex items-center gap-1"><Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />{mover?.average_rating?.toFixed(1) || 'N/A'}</span></div>
                  <div className="w-full bg-gray-200 rounded-full h-2"><div className="bg-yellow-400 h-2 rounded-full transition-all" style={{ width: `${((mover?.average_rating || 0) / 5) * 100}%` }}></div></div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1"><span className="text-sm text-gray-600">Missions terminées</span><span className="text-sm font-bold text-gray-900">{stats.completedMoves}</span></div>
                  <div className="w-full bg-gray-200 rounded-full h-2"><div className="bg-blue-500 h-2 rounded-full transition-all" style={{ width: `${Math.min(stats.completedMoves * 10, 100)}%` }}></div></div>
                </div>
                <div className="pt-2 border-t border-gray-100">
                  <div className="flex items-center justify-between text-sm"><span className="text-gray-500">{mover?.total_reviews || 0} avis</span><span className="text-gray-500">{mover?.years_experience || 0} ans exp.</span></div>
                </div>
              </div>
            </div>
          </div> */}

          {/* Recent Activity */}
          {recentQuotes.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2"><Activity className="w-5 h-5 text-blue-500" /> Activité récente</h3>
                <button onClick={() => navigate('/mover/my-quotes')} className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">Voir tout <ArrowUpRight className="w-4 h-4" /></button>
              </div>
              <div className="space-y-3">
                {recentQuotes.map((quote) => (
                  <div key={quote.id} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${quote.status === 'accepted' ? 'bg-green-500' : quote.status === 'pending' ? 'bg-yellow-500' : quote.status === 'rejected' ? 'bg-red-500' : 'bg-gray-400'}`}></div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">Devis #{quote.id.slice(0, 8)}</p>
                        <p className="text-xs text-gray-500">{new Date(quote.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-gray-900">{quote.price ? `${Number(quote.price).toLocaleString('fr-FR')} €` : '— €'}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${quote.status === 'accepted' ? 'bg-green-100 text-green-700' : quote.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : quote.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'}`}>
                        {quote.status === 'accepted' ? 'Accepté' : quote.status === 'pending' ? 'En attente' : quote.status === 'rejected' ? 'Refusé' : quote.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="bg-white rounded-xl shadow-sm p-8 text-center">
          <Clock className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">En attente de vérification</h3>
          <p className="text-gray-600">Votre compte est en cours de vérification. Vous pourrez accéder à toutes les fonctionnalités une fois validé.</p>
        </div>
      )}
    </>
  );

  if (loading) {
    return (
      <MoverLayout>
        <div className="flex items-center justify-center py-32">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
        </div>
      </MoverLayout>
    );
  }

  return (
    <MoverLayout>
      {renderContent()}
    </MoverLayout>
  );
}

// Notifications Panel with Settings icon
function NotificationsPanel({ moverId }: { moverId: string }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [notifSettings, setNotifSettings] = useState({ email_notifications_enabled: true, return_trip_alerts_enabled: true });
  const [savingSettings, setSavingSettings] = useState(false);

  useEffect(() => { loadNotifications(); loadNotifSettings(); }, [user, moverId]);

  const loadNotifications = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase.from('notifications').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(50);
      if (error) throw error;
      setNotifications(data || []);
    } catch (error) { console.error('Error loading notifications:', error); } finally { setLoading(false); }
  };

  const loadNotifSettings = async () => {
    if (!moverId) return;
    try {
      const { data } = await supabase.from('movers').select('email_notifications_enabled, return_trip_alerts_enabled').eq('id', moverId).maybeSingle();
      if (data) { setNotifSettings({ email_notifications_enabled: data.email_notifications_enabled ?? true, return_trip_alerts_enabled: data.return_trip_alerts_enabled ?? true }); }
    } catch (error) { console.error('Error loading notification settings:', error); }
  };

  const saveNotifSettings = async () => {
    if (!moverId) return;
    setSavingSettings(true);
    try {
      const { error } = await supabase.from('movers').update({ email_notifications_enabled: notifSettings.email_notifications_enabled, return_trip_alerts_enabled: notifSettings.return_trip_alerts_enabled }).eq('id', moverId);
      if (error) throw error;
      showToast('Préférences de notifications enregistrées', 'success');
    } catch (error) { console.error('Error saving notification settings:', error); showToast('Erreur lors de la sauvegarde', 'error'); } finally { setSavingSettings(false); }
  };

  const markAsRead = async (id: string) => {
    try { await supabase.from('notifications').update({ read: true }).eq('id', id); setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n)); } catch (error) { console.error('Error marking notification as read:', error); }
  };

  if (loading) return <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-500">{notifications.length} notification{notifications.length !== 1 ? 's' : ''}</p>
        <button onClick={() => setShowSettings(!showSettings)} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition ${showSettings ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
          <Settings className="w-4 h-4" /> Paramètres
        </button>
      </div>

      {showSettings && (
        <div className="mb-6 bg-gray-50 border border-gray-200 rounded-xl p-5 space-y-4">
          <h4 className="font-semibold text-gray-900 flex items-center gap-2"><Settings className="w-5 h-5 text-gray-600" /> Préférences de notifications</h4>
          <label className="flex items-start gap-3 cursor-pointer p-3 bg-white rounded-lg border border-gray-100 hover:border-blue-200 transition">
            <input type="checkbox" checked={notifSettings.email_notifications_enabled} onChange={(e) => setNotifSettings(prev => ({ ...prev, email_notifications_enabled: e.target.checked }))} className="mt-1 h-5 w-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500" />
            <div><span className="font-medium text-gray-900">Notifications email pour nouvelles demandes</span><p className="text-sm text-gray-600 mt-0.5">Recevez un email pour chaque nouvelle demande correspondant à votre zone d'activité</p></div>
          </label>
          <label className="flex items-start gap-3 cursor-pointer p-3 bg-white rounded-lg border border-gray-100 hover:border-green-200 transition">
            <input type="checkbox" checked={notifSettings.return_trip_alerts_enabled} onChange={(e) => setNotifSettings(prev => ({ ...prev, return_trip_alerts_enabled: e.target.checked }))} className="mt-1 h-5 w-5 text-green-600 border-gray-300 rounded focus:ring-green-500" />
            <div><span className="font-medium text-gray-900">Alertes opportunités de retour</span><p className="text-sm text-gray-600 mt-0.5">Recevez une alerte quand un nouveau déménagement part de votre destination d'arrivée (évitez les retours à vide!)</p></div>
          </label>
          <div className="flex justify-end pt-2">
            <button onClick={saveNotifSettings} disabled={savingSettings} className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition text-sm font-medium disabled:opacity-50">
              {savingSettings ? 'Enregistrement...' : 'Enregistrer les préférences'}
            </button>
          </div>
        </div>
      )}

      {notifications.length === 0 ? (
        <div className="text-center py-12"><Bell className="w-12 h-12 text-gray-300 mx-auto mb-4" /><p className="text-gray-500">Aucune notification</p></div>
      ) : (
        <div className="space-y-3">
          {notifications.map((notification) => (
            <div key={notification.id} onClick={() => !notification.read && markAsRead(notification.id)} className={`p-4 rounded-lg border cursor-pointer transition ${notification.read ? 'bg-gray-50 border-gray-100' : 'bg-blue-50 border-blue-200 hover:bg-blue-100'}`}>
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
  );
}