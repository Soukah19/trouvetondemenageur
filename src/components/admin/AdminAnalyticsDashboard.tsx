import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import {
  Activity,
  Target,
  BarChart3,
  PieChart,
  RefreshCw,
} from 'lucide-react';

interface AnalyticsData {
  conversionFunnel: { stage: string; count: number; rate: number }[];
  userCohorts: { month: string; users: number; retained: number }[];
  topRoutes: { route: string; count: number; revenue: number }[];
  moverPerformance: { name: string; quotes: number; successRate: number }[];
  revenueByMonth: { month: string; revenue: number }[];
}

interface AdminAnalyticsDashboardProps {
  adminRole?: string;
}

export default function AdminAnalyticsDashboard({ adminRole = '' }: AdminAnalyticsDashboardProps) {
  const isSuperAdmin = adminRole === 'super_admin';
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    conversionFunnel: [],
    userCohorts: [],
    topRoutes: [],
    moverPerformance: [],
    revenueByMonth: [],
  });
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'7d' | '30d' | '90d' | '1y'>('30d');

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const [
        { data: quoteRequests },
        { data: quotes },
        { data: payments },
        { data: users },
        { data: movers },
      ] = await Promise.all([
        supabase.from('quote_requests').select('*'),
        supabase.from('quotes').select('*'),
        supabase.from('payments').select('*'),
        supabase.from('users').select('*').eq('role', 'client'),
        supabase.from('movers').select('*'),
      ]);

      const totalRequests = quoteRequests?.length || 0;
      const quotesReceived = quotes?.length || 0;
      const quotesAccepted = quotes?.filter((q: any) => q.status === 'accepted').length || 0;
      const paymentsCompleted = payments?.length || 0;

      const conversionFunnel = [
        {
          stage: 'Demandes de Devis',
          count: totalRequests,
          rate: 100,
        },
        {
          stage: 'Devis Reçus',
          count: quotesReceived,
          rate: totalRequests > 0 ? Math.min((quotesReceived / totalRequests) * 100, 100) : 0,
        },
        {
          stage: 'Devis Acceptés',
          count: quotesAccepted,
          rate: quotesReceived > 0 ? Math.min((quotesAccepted / quotesReceived) * 100, 100) : 0,
        },
        {
          stage: 'Paiements',
          count: paymentsCompleted,
          rate: quotesAccepted > 0 ? Math.min((paymentsCompleted / quotesAccepted) * 100, 100) : 0,
        },
      ];

      const routeCounts: { [key: string]: { count: number; revenue: number } } = {};
      quoteRequests?.forEach((req: any) => {
        const route = `${req.from_city} → ${req.to_city}`;
        if (!routeCounts[route]) {
          routeCounts[route] = { count: 0, revenue: 0 };
        }
        routeCounts[route].count++;
      });

      payments?.forEach((payment: any) => {
        const quote = quotes?.find((q: any) => q.id === payment.quote_id);
        if (quote) {
          const request = quoteRequests?.find((r: any) => r.id === quote.quote_request_id);
          if (request) {
            const route = `${request.from_city} → ${request.to_city}`;
            if (routeCounts[route]) {
              routeCounts[route].revenue += payment.total_amount || 0;
            }
          }
        }
      });

      const topRoutes = Object.entries(routeCounts)
        .map(([route, data]) => ({
          route,
          count: data.count,
          revenue: data.revenue,
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      const moverStats: {
        [key: string]: { name: string; quotes: number; accepted: number };
      } = {};

      movers?.forEach((mover: any) => {
        const moverQuotes = quotes?.filter((q: any) => q.mover_id === mover.id) || [];
        const acceptedQuotes = moverQuotes.filter((q: any) => q.status === 'accepted');

        moverStats[mover.id] = {
          name: mover.company_name,
          quotes: moverQuotes.length,
          accepted: acceptedQuotes.length,
        };
      });

      const moverPerformance = Object.values(moverStats)
        .map((stat) => ({
          name: stat.name,
          quotes: stat.quotes,
          successRate: stat.quotes > 0 ? (stat.accepted / stat.quotes) * 100 : 0,
        }))
        .sort((a, b) => b.successRate - a.successRate)
        .slice(0, 10);

      const monthlyRevenue: { [key: string]: number } = {};
      payments?.forEach((payment: any) => {
        const month = new Date(payment.created_at).toLocaleDateString('fr-FR', {
          year: 'numeric',
          month: 'short',
        });
        monthlyRevenue[month] = (monthlyRevenue[month] || 0) + (payment.total_amount || 0);
      });

      const revenueByMonth = Object.entries(monthlyRevenue)
        .map(([month, revenue]) => ({ month, revenue }))
        .slice(-12);

      setAnalytics({
        conversionFunnel,
        userCohorts: [],
        topRoutes,
        moverPerformance,
        revenueByMonth,
      });
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, [period]);

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
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Analytiques Avancées</h2>
        <div className="flex items-center gap-3">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value as any)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
          >
            <option value="7d">7 jours</option>
            <option value="30d">30 jours</option>
            <option value="90d">90 jours</option>
            <option value="1y">1 an</option>
          </select>
          <button
            onClick={loadAnalytics}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <RefreshCw className="w-4 h-4" />
            Actualiser
          </button>
        </div>
      </div>

      {/* Conversion Funnel as Performance Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {analytics.conversionFunnel.map((stage, index) => {
          const colors = ['bg-blue-600', 'bg-indigo-600', 'bg-purple-600', 'bg-green-600'];
          const bgColors = ['bg-blue-50 dark:bg-blue-900/20', 'bg-indigo-50 dark:bg-indigo-900/20', 'bg-purple-50 dark:bg-purple-900/20', 'bg-green-50 dark:bg-green-900/20'];
          const icons = [Target, Activity, Target, Activity];
          const Icon = icons[index] || Target;

          return (
            <div key={stage.stage} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-5 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-3">
                <div className={`p-2 rounded-lg ${bgColors[index]}`}>
                  <Icon className={`w-5 h-5 ${colors[index].replace('bg-', 'text-')}`} />
                </div>
                {index > 0 && (
                  <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full">
                    {stage.rate.toFixed(1)}% conv.
                  </span>
                )}
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stage.count}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{stage.stage}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-5 h-5 text-green-600" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Performance Déménageurs
            </h3>
          </div>
          <div className="space-y-3">
            {analytics.moverPerformance.slice(0, 5).map((mover, index) => (
              <div key={mover.name} className="flex items-center gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center text-sm font-bold text-blue-600 dark:text-blue-400">
                  #{index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {mover.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {mover.quotes} devis • {mover.successRate.toFixed(1)}% succès
                  </p>
                </div>
                <div className="flex-shrink-0">
                  <div className="w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-green-600 h-2 rounded-full"
                      style={{ width: `${mover.successRate}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
            {analytics.moverPerformance.length === 0 && (
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">Aucune donnée disponible</p>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 mb-4">
            <PieChart className="w-5 h-5 text-orange-600" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Trajets les Plus Demandés</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                    #
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                    Trajet
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                    Demandes
                  </th>
                  {isSuperAdmin && (
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                      Revenu
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {analytics.topRoutes.map((route, index) => (
                  <tr key={route.route} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">{index + 1}</td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                      {route.route}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{route.count}</td>
                    {isSuperAdmin && (
                      <td className="px-4 py-3 text-sm font-semibold text-green-600 dark:text-green-400">
                        {route.revenue.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
