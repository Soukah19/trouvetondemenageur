import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Plus, FileText, Bell, ScrollText, LogOut, Menu,
  ChevronLeft, Home, Truck, CheckSquare, X, Settings
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigationHelpers } from '../hooks/useNavigationHelpers';
import { NotificationBell } from './NotificationBell';
import { supabase } from '../lib/supabase';

interface ClientLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
}

export function ClientLayout({ children, title, subtitle }: ClientLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { handleClientLogout } = useNavigationHelpers();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [desktopCollapsed, setDesktopCollapsed] = useState(false);
  const [clientName, setClientName] = useState('Espace Client');
  const [notificationCount, setNotificationCount] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      // Treat tablets, iPads, and phones as mobile (width < 1400 or touch device)
      const isTouchDevice = () => {
        return (
          (navigator.maxTouchPoints > 0) ||
          (navigator.msMaxTouchPoints > 0) ||
          window.matchMedia("(hover: none) and (pointer: coarse)").matches
        );
      };
      const mobile = window.innerWidth < 1400 || isTouchDevice();
      setIsMobile(mobile);
      if (!mobile) setSidebarOpen(false);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (user) {
      loadClientName();
      fetchNotificationCount();
    }
  }, [user]);

  const loadClientName = async () => {
    try {
      const { data } = await supabase
        .from('clients')
        .select('first_name, last_name')
        .eq('user_id', user?.id)
        .maybeSingle();
      if (data?.first_name) {
        setClientName(`${data.first_name} ${data.last_name || ''}`.trim());
      }
    } catch (error) {
      console.error('Error loading client name:', error);
    }
  };

  const fetchNotificationCount = async () => {
    try {
      const { data } = await supabase
        .from('notifications')
        .select('id')
        .eq('user_id', user?.id)
        .eq('read', false);
      setNotificationCount(data?.length || 0);
    } catch (error) {
      console.error('Error fetching notification count:', error);
    }
  };

  const menuItems = [
    { id: 'dashboard', label: 'Tableau de bord', icon: Home, color: 'text-blue-600', route: '/client/dashboard' },
    { id: 'new-request', label: 'Nouvelle demande', icon: Plus, color: 'text-cyan-600', route: '/client/quote' },
    { id: 'my-quotes', label: 'Mes devis', icon: FileText, color: 'text-indigo-600', route: '/client/quotes' },
    { id: 'checklist', label: 'Ma Checklist', icon: CheckSquare, color: 'text-green-600', route: '/client/checklist' },
    { id: 'contracts', label: 'Mes contrats', icon: ScrollText, color: 'text-orange-600', route: '/client/contracts' },
    { id: 'notifications', label: 'Notifications', icon: Bell, color: 'text-red-600', route: '/client/notifications', badge: notificationCount > 0 ? notificationCount : undefined },
    { id: 'settings', label: 'Paramètres', icon: Settings, color: 'text-gray-600', route: '/client/settings' },
  ];

  const getActiveId = (): string => {
    const path = location.pathname;
    if (path.includes('/client/quote') && !path.includes('/client/quotes')) return 'new-request';
    if (path.includes('/client/quotes')) return 'my-quotes';
    if (path.includes('/client/checklist')) return 'checklist';
    if (path.includes('/client/notifications')) return 'notifications';
    if (path.includes('/client/settings')) return 'settings';
    if (path.includes('/client/contracts')) return 'contracts';
    if (path.includes('/client/payment')) return 'my-quotes';
    if (path.includes('/client/photos')) return 'my-quotes';
    return 'dashboard';
  };

  const currentActiveId = getActiveId();
  const currentTitle = title || menuItems.find(m => m.id === currentActiveId)?.label || 'Tableau de bord';

  const handleNavClick = (route: string) => {
    navigate(route);
    if (isMobile) setSidebarOpen(false);
  };

  // Desktop sidebar width
  const desktopSidebarWidth = desktopCollapsed ? 'w-20' : 'w-64';
  const desktopMargin = desktopCollapsed ? 'lg:ml-20' : 'lg:ml-64';
  const showLabels = isMobile ? true : !desktopCollapsed;

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile overlay */}
      {sidebarOpen && isMobile && (
        <div className="fixed inset-0 bg-black/50 z-30" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`
        bg-white shadow-lg transition-all duration-300 left-0 top-0 h-full flex flex-col fixed
        ${isMobile
          ? `z-40 w-72 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`
          : `z-20 ${desktopSidebarWidth}`
        }
      `}>
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <button
              onClick={() => isMobile ? setSidebarOpen(false) : setDesktopCollapsed(!desktopCollapsed)}
              className="flex-shrink-0 w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition"
            >
              {isMobile ? <X className="w-5 h-5" /> : (desktopCollapsed ? <Menu className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />)}
            </button>
            {showLabels && <img src="/logo.png" alt="TrouveTonDemenageur" className="h-10 w-auto" />}

            {showLabels && (
              <div className="overflow-hidden min-w-0">
                <h1 className="font-bold text-gray-900 truncate">{clientName}</h1>
                <p className="text-xs text-gray-500 truncate">{user?.email}</p>
              </div>
            )}
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-4">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.route)}
              className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition ${
                currentActiveId === item.id ? 'bg-blue-50 border-r-4 border-blue-500' : ''
              }`}
            >
              <item.icon className={`w-5 h-5 flex-shrink-0 ${item.color}`} />
              {showLabels && <span className="text-sm text-gray-700 flex-1 truncate">{item.label}</span>}
              {showLabels && item.badge && (
                <span className="flex items-center justify-center min-w-[20px] h-5 px-1.5 bg-red-500 text-white text-xs font-bold rounded-full">
                  {item.badge > 99 ? '99+' : item.badge}
                </span>
              )}
            </button>
          ))}
        </nav>

        <div className="border-t border-gray-100 p-4">
          <button
            onClick={handleClientLogout}
            className="w-full flex items-center gap-3 px-2 py-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition"
          >
            <LogOut className="w-5 h-5" />
            {showLabels && <span className="text-sm">Déconnexion</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`flex-1 transition-all duration-300 ${isMobile ? 'ml-0' : desktopMargin}`}>
        <header className="bg-white shadow-sm sticky top-0 z-10">
          <div className="px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              {isMobile && (
                <button onClick={() => setSidebarOpen(true)} className="p-2 hover:bg-gray-100 rounded-lg transition flex-shrink-0">
                  <Menu className="w-5 h-5 text-gray-600" />
                </button>
              )}
              <div className="min-w-0">
                <h2 className="text-lg sm:text-xl font-bold text-gray-900 truncate">{currentTitle}</h2>
                {subtitle && <p className="text-xs sm:text-sm text-gray-500 mt-0.5 truncate">{subtitle}</p>}
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
              <NotificationBell userRole="client" />
            </div>
          </div>
        </header>
        <div className="p-3 sm:p-6">{children}</div>
      </main>
    </div>
  );
}
