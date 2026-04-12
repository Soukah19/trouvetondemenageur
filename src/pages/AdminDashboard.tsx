import { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Users,
  Truck,
  DollarSign,
  BarChart3,
  Shield,
  AlertTriangle,
  Settings,
  LogOut,
  Menu,
  X,
  Search,
  User,
  HelpCircle,
  Download,
  Activity,
  UserPlus,
  Clock,
  FileText,
  Tag,
} from 'lucide-react';
import AdminOverview from '../components/admin/AdminOverview';
import AdminUserManagement from '../components/admin/AdminUserManagement';
import AdminFinancialManagement from '../components/admin/AdminFinancialManagement';
import AdminAnalyticsDashboard from '../components/admin/AdminAnalyticsDashboard';
import AdminSystemSettings from '../components/admin/AdminSystemSettings';
import AdminDamageReports from '../components/AdminDamageReports';
import AdminHelpSupport from '../components/admin/AdminHelpSupport';
import AdminExports from '../components/admin/AdminExports';
import AdminActivityLogs from '../components/admin/AdminActivityLogs';
import AdminMissions from '../components/admin/AdminMissions';
import AdminMoverSearch from '../components/admin/AdminMoverSearch';
import AdminMoverProspects from '../components/admin/AdminMoverProspects';
import AdminClientProspects from '../components/admin/AdminClientProspects';
import AdminPendingMovers from '../components/admin/AdminPendingMovers';
import AdminRecentQuoteRequests from '../components/admin/AdminRecentQuoteRequests';
import AdminDropboxSignContracts from '../components/admin/AdminDropboxSignContracts';
import AdminPromoCodesManagement from '../components/admin/AdminPromoCodesManagement';
import { NotificationBell } from '../components/NotificationBell';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useParams } from 'react-router-dom';

type ActiveTab =
  | 'overview'
  | 'users'
  | 'prospects'
  | 'pending_movers'
  | 'contracts'
  | 'missions'
  | 'financial'
  | 'analytics'
  | 'disputes'
  | 'settings'
  | 'help'
  | 'exports'
  | 'activity_logs'
  | 'mover_search'
  | 'client_prospects'
  | 'recent_quotes'
  | 'promo_codes';

interface NavItem {
  id: ActiveTab;
  label: string;
  icon: any;
  color: string;
}

export default function AdminDashboard() {
  const { tab: urlTab } = useParams<{ tab?: string }>();
  const navigate = useNavigate();
  const validTabs: ActiveTab[] = ['overview','users','prospects','client_prospects','pending_movers','contracts','missions','financial','analytics','disputes','settings','help','exports','activity_logs','mover_search','recent_quotes','promo_codes'];
  const initialTab = (urlTab && validTabs.includes(urlTab as ActiveTab)) ? urlTab as ActiveTab : 'overview';
  const [activeTab, setActiveTabState] = useState<ActiveTab>(initialTab);
  const setActiveTab = (tab: ActiveTab) => { setActiveTabState(tab); navigate(`/admin/dashboard/${tab}`, { replace: true }); };
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 1024);
  const [adminRole, setAdminRole] = useState<string>('');
  const [adminEmail, setAdminEmail] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [userTypeFilter, setUserTypeFilter] = useState<'all' | 'movers' | 'clients'>('all');
  const [userStatusFilter, setUserStatusFilter] = useState<'all' | 'active' | 'inactive' | 'suspended' | 'banned'>('all');
  const [notificationQuoteRequestId, setNotificationQuoteRequestId] = useState<string | null>(null);
  const [highlightPaymentId, setHighlightPaymentId] = useState<string | null>(null);
  const [disputeQuoteRequestId, setDisputeQuoteRequestId] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    const fetchAdminRole = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from('admins')
          .select('role, email')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error) {
          console.error('Erreur lors de la récupération du rôle admin:', error);
        } else if (data) {
          setAdminRole(data.role);
          setAdminEmail(data.email);
        }
      } catch (error) {
        console.error('Erreur:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAdminRole();
  }, [user]);

  const isSuperAdmin = adminRole === 'super_admin';
  const isAdminAgent = adminRole === 'admin_agent';

  const allNavItems: NavItem[] = [
    { id: 'overview', label: 'Vue d\'ensemble', icon: LayoutDashboard, color: 'text-blue-600' },
    // { id: 'mover_search', label: 'Recherche déménageur', icon: Search, color: 'text-indigo-600' },
    { id: 'users', label: 'Utilisateurs', icon: Users, color: 'text-purple-600' },
    { id: 'prospects', label: 'Prospects Déménageurs', icon: UserPlus, color: 'text-teal-600' },
    { id: 'client_prospects', label: 'Prospects Clients', icon: UserPlus, color: 'text-pink-600' },
    { id: 'pending_movers', label: 'Déménageurs en Attente', icon: Clock, color: 'text-amber-600' },
    { id: 'recent_quotes', label: 'Demandes de Devis Récentes', icon: FileText, color: 'text-sky-600' },
    { id: 'contracts', label: 'Contrats Dropbox Sign', icon: FileText, color: 'text-cyan-600' },
    { id: 'missions', label: 'Missions', icon: Truck, color: 'text-indigo-600' },
    { id: 'financial', label: 'Finances', icon: DollarSign, color: 'text-green-600' },
    { id: 'promo_codes', label: 'Codes Promo', icon: Tag, color: 'text-purple-600' },
    { id: 'analytics', label: 'Analytiques', icon: BarChart3, color: 'text-orange-600' },
    { id: 'disputes', label: 'Litiges', icon: AlertTriangle, color: 'text-yellow-600' },
    { id: 'settings', label: 'Paramètres', icon: Settings, color: 'text-gray-600' },
  ];

  const navItems = isAdminAgent
    ? allNavItems.filter(item => item.id !== 'financial' && item.id !== 'promo_codes')
    : allNavItems;

  const getRoleLabel = () => {
    switch (adminRole) {
      case 'super_admin':
        return 'Super Administrateur';
      case 'admin_agent':
        return 'Agent Administratif';
      case 'admin':
        return 'Administrateur';
      case 'support':
        return 'Support';
      default:
        return 'Administrateur';
    }
  };

  const handleLogout = async () => {
    if (confirm('Êtes-vous sûr de vouloir vous déconnecter ?')) {
      try {
        await supabase.auth.signOut();
      } catch (error) {
        console.error('Error signing out:', error);
      }
      // Clear all localStorage/sessionStorage data
      localStorage.clear();
      sessionStorage.clear();
      window.location.href = '/admin/login';
    }
  };

  const handleNavigateToUsers = (userType: 'all' | 'movers' | 'clients' = 'all', userStatus: 'all' | 'active' | 'inactive' | 'suspended' | 'banned' = 'all') => {
    setUserTypeFilter(userType);
    setUserStatusFilter(userStatus);
    setActiveTab('users');
  };

  const handleNavigateToFinances = (paymentId?: string) => {
    setHighlightPaymentId(paymentId || null);
    setActiveTab('financial');
  };

  const handleNavigateToAnalytics = () => {
    setActiveTab('analytics');
  };

  const handleNavigateToDisputesFromFinances = (quoteRequestId?: string) => {
    setDisputeQuoteRequestId(quoteRequestId || null);
    setActiveTab('disputes');
  };

  const handleNavigateToPendingApprovals = () => {
    setUserTypeFilter('movers');
    setUserStatusFilter('all');
    setActiveTab('users');
  };

  const handleNavigateToDisputes = (quoteRequestId?: string) => {
    setDisputeQuoteRequestId(quoteRequestId || null);
    setActiveTab('disputes');
  };

  const handleNavigateToExports = () => {
    setActiveTab('exports');
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return <AdminOverview
          adminRole={adminRole}
          onNavigateToUsers={handleNavigateToUsers}
          onNavigateToFinances={handleNavigateToFinances}
          onNavigateToAnalytics={handleNavigateToAnalytics}
          onNavigateToPendingApprovals={handleNavigateToPendingApprovals}
          notificationQuoteRequestId={notificationQuoteRequestId}
          onQuoteRequestModalClose={() => setNotificationQuoteRequestId(null)}
        />;
      case 'mover_search':
        return <AdminMoverSearch />;
      case 'prospects':
        return <AdminMoverProspects adminRole={adminRole} />;
      case 'client_prospects':
        return <AdminClientProspects adminRole={adminRole} />;
      case 'pending_movers':
        return <AdminPendingMovers />;
      case 'recent_quotes':
        return <AdminRecentQuoteRequests />;
      case 'contracts':
        return <AdminDropboxSignContracts />;
      case 'users':
        return <AdminUserManagement
          adminRole={adminRole}
          initialUserType={userTypeFilter}
          initialUserStatus={userStatusFilter}
        />;
      case 'missions':
        return <AdminMissions adminRole={adminRole} />;
      case 'financial':
        if (!isSuperAdmin) {
          return (
            <div className="flex items-center justify-center min-h-[60vh]">
              <div className="text-center">
                <Shield className="w-16 h-16 text-red-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Accès Restreint</h2>
                <p className="text-gray-600 dark:text-gray-400">Vous n'avez pas accès à cette section.</p>
              </div>
            </div>
          );
        }
        return <AdminFinancialManagement onNavigateToDisputes={handleNavigateToDisputesFromFinances} highlightPaymentId={highlightPaymentId} />;
      case 'analytics':
        return <AdminAnalyticsDashboard adminRole={adminRole} />;
      case 'disputes':
        return <AdminDamageReports
          onNavigateToFinances={handleNavigateToFinances}
          filterQuoteRequestId={disputeQuoteRequestId}
          onClearFilter={() => setDisputeQuoteRequestId(null)}
        />;
      case 'settings':
        return <AdminSystemSettings adminRole={adminRole} />;
      case 'help':
        return <AdminHelpSupport
          onNavigateToUsers={() => handleNavigateToUsers('all', 'all')}
          onNavigateToFinances={handleNavigateToFinances}
          onNavigateToAnalytics={handleNavigateToAnalytics}
          onNavigateToDisputes={handleNavigateToDisputes}
          onNavigateToExports={handleNavigateToExports}
          onNavigateToPendingApprovals={handleNavigateToPendingApprovals}
        />;
      case 'exports':
        return <AdminExports adminRole={adminRole} />;
      case 'activity_logs':
        return <AdminActivityLogs />;
      case 'promo_codes':
        return <AdminPromoCodesManagement adminRole={adminRole} />;
      default:
        return <AdminOverview
          adminRole={adminRole}
          onNavigateToUsers={handleNavigateToUsers}
          onNavigateToFinances={handleNavigateToFinances}
          onNavigateToAnalytics={handleNavigateToAnalytics}
          onNavigateToPendingApprovals={handleNavigateToPendingApprovals}
          notificationQuoteRequestId={notificationQuoteRequestId}
          onQuoteRequestModalClose={() => setNotificationQuoteRequestId(null)}
        />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="fixed top-0 left-0 right-0 h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 z-30">
        <div className="h-full px-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              title={sidebarOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
            >
              {sidebarOpen ? <X className="w-5 h-5 text-gray-600 dark:text-gray-400" /> : <Menu className="w-5 h-5 text-gray-600 dark:text-gray-400" />}
            </button>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden md:block relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Recherche..."
                className="pl-10 pr-4 py-2 w-64 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <NotificationBell
              userRole="admin"
              onNotificationClick={async (notification) => {
                // For 'new_quote' type from DB trigger, related_id is a quote ID, not quote_request_id
                // We need to resolve it to a quote_request_id
                if (notification.type === 'new_quote' && notification.related_id) {
                  try {
                    // First try as quote_request_id directly
                    const { data: qrDirect } = await supabase
                      .from('quote_requests')
                      .select('id')
                      .eq('id', notification.related_id)
                      .maybeSingle();

                    if (qrDirect) {
                      setActiveTab('overview');
                      setNotificationQuoteRequestId(qrDirect.id);
                    } else {
                      // It's a quote ID - resolve to quote_request_id
                      const { data: quoteData } = await supabase
                        .from('quotes')
                        .select('quote_request_id')
                        .eq('id', notification.related_id)
                        .maybeSingle();

                      if (quoteData?.quote_request_id) {
                        setActiveTab('overview');
                        setNotificationQuoteRequestId(quoteData.quote_request_id);
                      } else {
                        setActiveTab('overview');
                      }
                    }
                  } catch (err) {
                    console.error('Error resolving notification:', err);
                    setActiveTab('overview');
                  }
                } else if (notification.type === 'new_quote_request' && notification.related_id) {
                  setActiveTab('overview');
                  setNotificationQuoteRequestId(notification.related_id);
                } else if ((notification.type === 'quote_update' || notification.type === 'admin_modified_request') && notification.related_id) {
                  setActiveTab('overview');
                  setNotificationQuoteRequestId(notification.related_id);
                } else if (notification.type === 'payment' || notification.type === 'payment_received') {
                  setActiveTab('financial');
                  if (notification.related_id) {
                    setHighlightPaymentId(notification.related_id);
                  }
                } else if (notification.type === 'damage_report' || notification.type === 'damage_alert' || notification.type === 'dispute') {
                  setActiveTab('disputes');
                  if (notification.related_id) {
                    setDisputeQuoteRequestId(notification.related_id);
                  }
                } else if (notification.type === 'new_invited_client') {
                  navigate('/admin/dashboard/users');
                } else if (notification.type === 'mover_registration' || notification.type === 'new_mover' || notification.type === 'system') {
                  setActiveTab('pending_movers');
                } else if (notification.type === 'mission_started' || notification.type === 'mission_completed') {
                  setActiveTab('missions');
                } else if (notification.type === 'contract_sent' || notification.type === 'contract_signed') {
                  setActiveTab('contracts');
                } else if (notification.related_id) {
                  // Fallback: try to open as quote request
                  setActiveTab('overview');
                  setNotificationQuoteRequestId(notification.related_id);
                }
              }}
            />

            <div className="hidden md:flex items-center gap-3 pl-3 border-l border-gray-200 dark:border-gray-700">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900 dark:text-white">{getRoleLabel()}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{adminEmail || 'admin@trouveton.fr'}</p>
              </div>
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div
        className={`fixed top-16 left-0 bottom-0 w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transition-transform duration-300 z-20 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="h-full overflow-y-auto p-4">
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    if (item.id !== 'financial') setHighlightPaymentId(null);
                    if (window.innerWidth < 1024) {
                      setSidebarOpen(false);
                    }
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className={`font-medium ${item.id === 'pending_movers' ? 'text-xs' : ''}`}>{item.label}</span>
                </button>
              );
            })}
          </nav>

          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700 space-y-1">
            <button
              onClick={() => {
                setActiveTab('help');
                if (window.innerWidth < 1024) {
                  setSidebarOpen(false);
                }
              }}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                activeTab === 'help'
                  ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <HelpCircle className="w-5 h-5" />
              <span className="font-medium">Aide & Support</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('exports');
                if (window.innerWidth < 1024) {
                  setSidebarOpen(false);
                }
              }}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                activeTab === 'exports'
                  ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <Download className="w-5 h-5" />
              <span className="font-medium">Exports</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('activity_logs');
                if (window.innerWidth < 1024) {
                  setSidebarOpen(false);
                }
              }}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                activeTab === 'activity_logs'
                  ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <Activity className="w-5 h-5" />
              <span className="font-medium">Logs d'Activité</span>
            </button>

            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span className="font-medium">Déconnexion</span>
            </button>
          </div>
        </div>
      </div>

      <div
        className={`pt-16 transition-all duration-300 ${
          sidebarOpen ? 'lg:pl-64' : 'pl-0'
        }`}
      >
        <div className="p-3 sm:p-6">
          {renderContent()}
        </div>
      </div>

      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-10 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}