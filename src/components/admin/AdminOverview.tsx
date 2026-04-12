import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import {
  DollarSign,
  TrendingUp,
  Users,
  Truck,
  FileText,
  Activity,
  ArrowUp,
  ArrowDown,
  Clock,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Eye,
} from 'lucide-react';
import AdminVerificationAlerts from './AdminVerificationAlerts';
import QuoteRequestDetailModal from './QuoteRequestDetailModal';
import UrgentQuoteRequestsAlert from './UrgentQuoteRequestsAlert';
import { PendingMoverDetailModal } from './PendingMoverDetailModal';

interface KPIData {
  value: number | string;
  change: number;
  trend: 'up';
}

interface RecentActivity {
  id: string;
  type: string;
  description: string;
  timestamp: string;
  severity?: 'info' | 'warning' | 'success' | 'error';
}

interface AdminOverviewProps {
  adminRole?: string;
  onNavigateToUsers?: (userType?: 'all' | 'movers' | 'clients', userStatus?: 'all' | 'active' | 'inactive' | 'suspended' | 'banned') => void;
  onNavigateToFinances?: () => void;
  onNavigateToAnalytics?: () => void;
  onNavigateToPendingApprovals?: () => void;
  notificationQuoteRequestId?: string | null;
  onQuoteRequestModalClose?: () => void;
}

export default function AdminOverview({
  adminRole = '',
  onNavigateToUsers,
  onNavigateToFinances,
  onNavigateToAnalytics,
  onNavigateToPendingApprovals,
  notificationQuoteRequestId,
  onQuoteRequestModalClose
}: AdminOverviewProps) {
  const isSuperAdmin = adminRole === 'super_admin';

  const [kpis, setKpis] = useState({
    totalRevenue: { value: 0, change: 0, trend: 'up' as const },
    monthlyRevenue: { value: 0, change: 0, trend: 'up' as const },
    totalMovers: { value: 0, change: 0, trend: 'up' as const },
    activeMovers: { value: 0, change: 0, trend: 'up' as const },
    totalClients: { value: 0, change: 0, trend: 'up' as const },
    activeClients: { value: 0, change: 0, trend: 'up' as const },
    totalQuotes: { value: 0, change: 0, trend: 'up' as const },
    pendingQuotes: { value: 0, change: 0, trend: 'up' as const },
    conversionRate: { value: '0%', change: 0, trend: 'up' as const },
    avgQuoteValue: { value: 0, change: 0, trend: 'up' as const },
    escrowBalance: { value: 0, change: 0, trend: 'up' as const },
    pendingApprovals: { value: 0, change: 0, trend: 'up' as const },
  });

  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const loadData = async () => {
    try {
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

      const [
        { data: payments },
        { data: paymentsLastMonth },
        { data: paymentsPreviousMonth },
        { data: movers },
        { data: moversLastMonth },
        { data: quoteRequests },
        { data: quoteRequestsLastMonth },
        { data: quotes },
        { data: quotesLastMonth },
        { data: acceptedQuotes },
        { data: pendingMovers },
        { data: activities },
        { data: adminUsers },
        { data: moverUsers },
        allUsersResult,
        recentUsersResult,
      ] = await Promise.all([
        supabase.from('payments').select('total_amount, created_at'),
        supabase.from('payments').select('total_amount').gte('created_at', thirtyDaysAgo.toISOString()),
        supabase
          .from('payments')
          .select('total_amount')
          .gte('created_at', sixtyDaysAgo.toISOString())
          .lt('created_at', thirtyDaysAgo.toISOString()),
        supabase.from('movers').select('id, created_at, is_active'),
        supabase.from('movers').select('id').gte('created_at', thirtyDaysAgo.toISOString()),
        supabase.from('quote_requests').select('id, client_user_id, created_at'),
        supabase.from('quote_requests').select('id, client_user_id').gte('created_at', thirtyDaysAgo.toISOString()),
        supabase.from('quote_requests').select('id, created_at'),
        supabase.from('quote_requests').select('id').gte('created_at', thirtyDaysAgo.toISOString()),
        supabase.from('quotes').select('id, status').eq('status', 'accepted'),
        supabase
          .from('movers')
          .select('id, company_name, created_at')
          .eq('verification_status', 'pending')
          .order('created_at', { ascending: false }),
        supabase.from('activity_logs').select('*').order('created_at', { ascending: false }).limit(20),
        supabase.from('admins').select('user_id'),
        supabase.from('movers').select('user_id'),
        supabase.rpc('get_all_users'),
        supabase.rpc('get_recent_users', { days: 30 }),
      ]);

      const totalRevenue = payments?.reduce((sum, p) => sum + (p.total_amount || 0), 0) || 0;
      const monthlyRevenue = paymentsLastMonth?.reduce((sum, p) => sum + (p.total_amount || 0), 0) || 0;
      const previousMonthRevenue =
        paymentsPreviousMonth?.reduce((sum, p) => sum + (p.total_amount || 0), 0) || 0;

      const revenueChange =
        previousMonthRevenue > 0
          ? ((monthlyRevenue - previousMonthRevenue) / previousMonthRevenue) * 100
          : 0;

      const activeMovers = movers?.filter((m) => m.is_active).length || 0;
      const moverGrowth =
        movers && moversLastMonth
          ? movers.length > 0
            ? ((moversLastMonth.length || 0) / movers.length) * 100
            : 0
          : 0;

      const totalQuotesCount = quotes?.length || 0;
      const acceptedCount = acceptedQuotes?.length || 0;
      const conversionRate = totalQuotesCount > 0 ? (acceptedCount / totalQuotesCount) * 100 : 0;

      interface PaymentType {
  total_amount: number;
  created_at: string;
  escrow_amount?: number;
  escrow_released?: boolean;
}

const escrowBalance =
        (payments as PaymentType[])
          ?.filter((p) => p.escrow_released === false)
          .reduce((sum, p) => sum + (p.escrow_amount || 0), 0) || 0;

      const adminUserIds = new Set(adminUsers?.map((a: any) => a.user_id) || []);
      const moverUserIds = new Set(moverUsers?.map((m: any) => m.user_id) || []);

      const allUsers = allUsersResult.data || [];
      const recentUsers = recentUsersResult.data || [];

      const clientUsers = allUsers.filter((u: any) =>
        !adminUserIds.has(u.id) && !moverUserIds.has(u.id) && !u.email?.endsWith('@trouveton.fr')
      );

      const recentClientUsers = recentUsers.filter((u: any) =>
        !adminUserIds.has(u.id) && !moverUserIds.has(u.id) && !u.email?.endsWith('@trouveton.fr')
      );

      const totalClients = clientUsers.length;
      const activeClients = recentClientUsers.length;

      setKpis({
        totalRevenue: {
          value: totalRevenue,
          change: Math.max(0, revenueChange),
          trend: 'up',
        },
        monthlyRevenue: {
          value: monthlyRevenue,
          change: Math.max(0, revenueChange),
          trend: 'up',
        },
        totalMovers: {
          value: movers?.length || 0,
          change: Math.max(0, moverGrowth),
          trend: 'up',
        },
        activeMovers: {
          value: activeMovers,
          change: 0,
          trend: 'up',
        },
        totalClients: {
          value: totalClients,
          change: activeClients,
          trend: 'up',
        },
        activeClients: {
          value: activeClients,
          change: 0,
          trend: 'up',
        },
        totalQuotes: {
          value: totalQuotesCount,
          change: Math.max(0, ((quotesLastMonth?.length || 0) / totalQuotesCount) * 100) || 0,
          trend: 'up',
        },
        pendingQuotes: {
          value: quotes?.filter((q: any) => q.status === 'pending').length || 0,
          change: 0,
          trend: 'up',
        },
        conversionRate: {
          value: `${conversionRate.toFixed(1)}%`,
          change: 0,
          trend: 'up', // Always 'up' as per type constraint
        },
        avgQuoteValue: {
          value: acceptedCount > 0 ? totalRevenue / acceptedCount : 0,
          change: 0,
          trend: 'up',
        },
        escrowBalance: {
          value: escrowBalance,
          change: 0,
          trend: 'up',
        },
        pendingApprovals: {
          value: pendingMovers?.length || 0,
          change: 0,
          trend: 'up', // Changed from 'down' to 'up' to match type constraint
        },
      });

      const formattedActivities: RecentActivity[] =
        activities?.map((activity: any) => ({
          id: activity.id,
          type: activity.action_type || 'system',
          description: activity.description || activity.action_type,
          timestamp: activity.created_at,
          severity: getSeverity(activity.action_type),
        })) || [];

      setRecentActivities(formattedActivities);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error loading overview data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSeverity = (type: string): 'info' | 'warning' | 'success' | 'error' => {
    if (type?.includes('fraud') || type?.includes('suspend')) return 'error';
    if (type?.includes('warning') || type?.includes('pending')) return 'warning';
    if (type?.includes('approve') || type?.includes('complete')) return 'success';
    return 'info';
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 60000);
    return () => clearInterval(interval);
  }, []);

const KPICard = ({
    title,
    value,
    change,
    trend,
    icon: Icon,
    color,
    onClick,
  }: {
    title: string;
    value: number | string;
    change: number;
    trend: 'up' | 'down';
    icon: any;
    color: string;
    onClick?: () => void;
  }) => (
    <div
      className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700 ${onClick ? 'cursor-pointer hover:shadow-lg transition-shadow' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        {change !== 0 && (
          <div
            className={`flex items-center gap-1 text-sm font-medium ${
              trend === 'up' ? 'text-green-600' : 'text-red-600'
            }`}
          >
            {trend === 'up' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
            {Math.abs(change).toFixed(1)}%
          </div>
        )}
      </div>
      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</h3>
      <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
        {typeof value === 'number' ? (title.includes('Revenue') || title.includes('Balance') || title.includes('Value') ? `${value.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}` : value.toLocaleString()) : value}
      </p>
    </div>
  );

  const PendingMoversSection = () => {
    const [pendingMovers, setPendingMovers] = useState<any[]>([]);
    const [loadingMovers, setLoadingMovers] = useState(true);
    const [selectedMoverId, setSelectedMoverId] = useState<string | null>(null);

    useEffect(() => {
      loadPendingMovers();
    }, []);

    const loadPendingMovers = async () => {
      const { data } = await supabase
        .from('movers')
        .select('id, company_name, email, phone, created_at')
        .eq('verification_status', 'pending')
        .order('created_at', { ascending: false })
        .limit(5);
      const filteredData = (data || []).filter((m) => !m.email?.endsWith('@trouveton.fr'));
      setPendingMovers(filteredData);
      setLoadingMovers(false);
    };

    const handleApprove = async (moverId: string) => {
      // Find the mover to get their email and company name
      const mover = pendingMovers.find(m => m.id === moverId);
      
      const { error } = await supabase
        .from('movers')
        .update({ verification_status: 'verified', is_active: true })
        .eq('id', moverId);

      if (!error) {
        // Send welcome/validation email
        if (mover?.email) {
          try {
            const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
            const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
            
            await fetch(`${supabaseUrl}/functions/v1/send-welcome-email`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${supabaseAnonKey}`,
              },
              body: JSON.stringify({
                userType: 'mover',
                email: mover.email,
                companyName: mover.company_name,
                isValidation: true
              }),
            });
          } catch (emailError) {
            console.error('Error sending welcome email:', emailError);
            // Non-blocking, continue even if email fails
          }
        }
        
        setPendingMovers(prev => prev.filter(m => m.id !== moverId));
        loadData();
      }
    };

    const handleReject = async (moverId: string) => {
      const { error } = await supabase
        .from('movers')
        .update({ verification_status: 'rejected' })
        .eq('id', moverId);

      if (!error) {
        setPendingMovers(prev => prev.filter(m => m.id !== moverId));
        loadData();
      }
    };

    return (
      <>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Déménageurs en Attente</h3>
          </div>
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {loadingMovers ? (
              <div className="p-8 text-center">
                <RefreshCw className="w-6 h-6 animate-spin text-blue-600 mx-auto" />
              </div>
            ) : pendingMovers.length > 0 ? (
              pendingMovers.map((mover) => (
                <div key={mover.id} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{mover.company_name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{mover.email}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{mover.phone}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        Inscrit le {new Date(mover.created_at).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                    <button
                      onClick={() => setSelectedMoverId(mover.id)}
                      className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                      Voir détails
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-gray-500 dark:text-gray-400">Aucun déménageur en attente</div>
            )}
          </div>
        </div>

        {selectedMoverId && (
          <PendingMoverDetailModal
            moverId={selectedMoverId}
            onClose={() => setSelectedMoverId(null)}
            onStatusUpdate={() => {
              loadPendingMovers();
              loadData();
            }}
          />
        )}
      </>
    );
  };

  const QuoteRequestsSection = () => {
    const [quoteRequests, setQuoteRequests] = useState<any[]>([]);
    const [loadingRequests, setLoadingRequests] = useState(true);
    const [selectedQuoteId, setSelectedQuoteId] = useState<string | null>(null);

    useEffect(() => {
      loadQuoteRequests();
    }, []);

    useEffect(() => {
      if (notificationQuoteRequestId) {
        setSelectedQuoteId(notificationQuoteRequestId);
      }
    }, [notificationQuoteRequestId]);

    const loadQuoteRequests = async () => {
      const { data } = await supabase
        .from('quote_requests')
        .select('id, from_city, to_city, moving_date, status, created_at')
        .order('created_at', { ascending: false })
        .limit(10);
      setQuoteRequests(data || []);
      setLoadingRequests(false);
    };

    return (
      <>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Demandes de Devis Récentes</h3>
          </div>
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {loadingRequests ? (
              <div className="p-8 text-center">
                <RefreshCw className="w-6 h-6 animate-spin text-blue-600 mx-auto" />
              </div>
            ) : quoteRequests.length > 0 ? (
              quoteRequests.map((request) => (
                <div key={request.id} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {request.from_city} → {request.to_city}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Date: {new Date(request.moving_date).toLocaleDateString('fr-FR')}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <span
                          className={`text-xs px-2 py-1 rounded ${
                            request.status === 'new'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-green-100 text-green-700'
                          }`}
                        >
                          {request.status === 'new' ? 'Nouveau' : 'Devis reçu'}
                        </span>
                        <span className="text-xs text-gray-400">
                          {new Date(request.created_at).toLocaleDateString('fr-FR')}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedQuoteId(request.id)}
                      className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                      Visualiser
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-gray-500 dark:text-gray-400">Aucune demande de devis</div>
            )}
          </div>
        </div>

        {selectedQuoteId && (
          <QuoteRequestDetailModal
            quoteRequestId={selectedQuoteId}
            onClose={() => {
              setSelectedQuoteId(null);
              if (onQuoteRequestModalClose) {
                onQuoteRequestModalClose();
              }
            }}
            onSave={() => {
              loadQuoteRequests();
              loadData();
            }}
            readOnly={true}
          />
        )}
      </>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Vue d'ensemble</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Dernière mise à jour: {lastUpdate.toLocaleTimeString('fr-FR')}
          </p>
        </div>
        <button
          onClick={loadData}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Actualiser
        </button>
      </div>

      <UrgentQuoteRequestsAlert />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {isSuperAdmin && (
          <>
            <KPICard
              title="Revenu Total"
              value={kpis.totalRevenue.value}
              change={kpis.totalRevenue.change}
              trend={kpis.totalRevenue.trend}
              icon={DollarSign}
              color="bg-green-500"
              onClick={onNavigateToFinances}
            />
            <KPICard
              title="Revenu Mensuel"
              value={kpis.monthlyRevenue.value}
              change={kpis.monthlyRevenue.change}
              trend={kpis.monthlyRevenue.trend}
              icon={TrendingUp}
              color="bg-blue-500"
              onClick={onNavigateToFinances}
            />
          </>
        )}
        <KPICard
          title="Déménageurs Actifs"
          value={kpis.activeMovers.value}
          change={kpis.activeMovers.change}
          trend={kpis.activeMovers.trend}
          icon={Truck}
          color="bg-purple-500"
          onClick={() => onNavigateToUsers?.('movers', 'all')}
        />
        <KPICard
          title="Clients Actifs"
          value={kpis.activeClients.value}
          change={kpis.activeClients.change}
          trend={kpis.activeClients.trend}
          icon={Users}
          color="bg-orange-500"
          onClick={() => onNavigateToUsers?.('clients', 'all')}
        />
        <KPICard
          title="Taux de Conversion"
          value={kpis.conversionRate.value}
          change={kpis.conversionRate.change}
          trend={kpis.conversionRate.trend}
          icon={Activity}
          color="bg-pink-500"
          onClick={onNavigateToAnalytics}
        />
        {isSuperAdmin && (
          <>
            <KPICard
              title="Valeur Moyenne Devis"
              value={kpis.avgQuoteValue.value}
              change={kpis.avgQuoteValue.change}
              trend={kpis.avgQuoteValue.trend}
              icon={FileText}
              color="bg-indigo-500"
              onClick={onNavigateToAnalytics}
            />
            <KPICard
              title="Balance Escrow"
              value={kpis.escrowBalance.value}
              change={kpis.escrowBalance.change}
              trend={kpis.escrowBalance.trend}
              icon={Clock}
              color="bg-yellow-500"
              onClick={onNavigateToFinances}
            />
          </>
        )}
        <KPICard
          title="Approbations en Attente"
          value={kpis.pendingApprovals.value}
          change={kpis.pendingApprovals.change}
          trend={kpis.pendingApprovals.trend}
          icon={AlertCircle}
          color="bg-red-500"
          onClick={onNavigateToPendingApprovals}
        />
      </div>

      <AdminVerificationAlerts />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PendingMoversSection />
        <QuoteRequestsSection />
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Activité Récente</h3>
        </div>
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {recentActivities.length > 0 ? (
            recentActivities.slice(0, 10).map((activity) => (
              <div key={activity.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                <div className="flex items-start gap-3">
                  <div
                    className={`p-2 rounded-lg ${
                      activity.severity === 'error'
                        ? 'bg-red-100 dark:bg-red-900/20'
                        : activity.severity === 'warning'
                        ? 'bg-yellow-100 dark:bg-yellow-900/20'
                        : activity.severity === 'success'
                        ? 'bg-green-100 dark:bg-green-900/20'
                        : 'bg-blue-100 dark:bg-blue-900/20'
                    }`}
                  >
                    {activity.severity === 'error' ? (
                      <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
                    ) : activity.severity === 'success' ? (
                      <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                    ) : (
                      <Activity className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{activity.description}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {new Date(activity.timestamp).toLocaleString('fr-FR')}
                    </p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">Aucune activité récente</div>
          )}
        </div>
      </div>
    </div>
  );
}
