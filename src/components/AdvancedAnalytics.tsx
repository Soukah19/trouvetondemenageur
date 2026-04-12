import { useState, useEffect } from 'react';
import { TrendingUp, Users, FileText, DollarSign, AlertTriangle, CheckCircle, Loader, Shield } from 'lucide-react';
import { supabase } from '../lib/supabase';

type AnalyticsData = {
  totalUsers: number;
  totalMovers: number;
  totalQuotes: number;
  totalContracts: number;
  totalRevenue: number;
  commissionEarned: number;
  pendingPayments: number;
  escrowAmount: number;
  fraudAlerts: number;
  documentsVerified: number;
  activeMovings: number;
  completedMovings: number;
  averageQuoteValue: number;
  conversionRate: number;
};

export function AdvancedAnalytics() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');

  useEffect(() => {
    loadAnalytics();
  }, [timeRange]);

  const getDateFilter = () => {
    const now = new Date();
    switch (timeRange) {
      case '7d':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
      case '30d':
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
      case '90d':
        return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString();
      default:
        return null;
    }
  };

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const dateFilter = getDateFilter();

      const [
        usersCount,
        moversCount,
        quotesData,
        contractsData,
        paymentsData,
        fraudAlertsData,
        documentsData,
        movingsData,
      ] = await Promise.all([
        supabase.from('auth.users').select('*', { count: 'exact', head: true }),
        supabase.from('movers').select('*', { count: 'exact', head: true }),
        supabase.from('quotes').select('price, status, created_at'),
        supabase.from('contracts').select('*', { count: 'exact', head: true }),
        supabase.from('quotes').select('price, payment_status, commission_amount, escrow_amount'),
        supabase.from('fraud_alerts').select('*', { count: 'exact', head: true }),
        supabase.from('document_verifications').select('*', { count: 'exact', head: true }),
        supabase.from('quote_requests').select('status'),
      ]);

      let totalRevenue = 0;
      let commissionEarned = 0;
      let pendingPayments = 0;
      let escrowAmount = 0;
      let totalQuoteValue = 0;
      let acceptedQuotes = 0;

      if (paymentsData.data) {
        paymentsData.data.forEach((payment: any) => {
          if (payment.payment_status === 'paid') {
            totalRevenue += parseFloat(payment.price || 0);
            commissionEarned += parseFloat(payment.commission_amount || 0);
            escrowAmount += parseFloat(payment.escrow_amount || 0);
          } else if (payment.payment_status === 'pending') {
            pendingPayments += parseFloat(payment.price || 0);
          }
        });
      }

      if (quotesData.data) {
        quotesData.data.forEach((quote: any) => {
          totalQuoteValue += parseFloat(quote.price || 0);
          if (quote.status === 'accepted') {
            acceptedQuotes++;
          }
        });
      }

      const totalQuotes = quotesData.data?.length || 0;
      const averageQuoteValue = totalQuotes > 0 ? totalQuoteValue / totalQuotes : 0;
      const conversionRate = totalQuotes > 0 ? (acceptedQuotes / totalQuotes) * 100 : 0;

      const activeMovings = movingsData.data?.filter((m: any) => m.status === 'in_progress').length || 0;
      const completedMovings = movingsData.data?.filter((m: any) => m.status === 'completed').length || 0;

      setAnalytics({
        totalUsers: usersCount.count || 0,
        totalMovers: moversCount.count || 0,
        totalQuotes: totalQuotes,
        totalContracts: contractsData.count || 0,
        totalRevenue,
        commissionEarned,
        pendingPayments,
        escrowAmount,
        fraudAlerts: fraudAlertsData.count || 0,
        documentsVerified: documentsData.count || 0,
        activeMovings,
        completedMovings,
        averageQuoteValue,
        conversionRate,
      });
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="text-center p-12">
        <p className="text-gray-600">Impossible de charger les analytics</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Analytics Avancés</h2>
          <p className="text-sm text-gray-600">Vue d'ensemble complète de la plateforme</p>
        </div>
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value as any)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="7d">7 derniers jours</option>
          <option value="30d">30 derniers jours</option>
          <option value="90d">90 derniers jours</option>
          <option value="all">Tout</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 rounded-xl shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <Users className="w-8 h-8 opacity-80" />
            <TrendingUp className="w-5 h-5 opacity-60" />
          </div>
          <p className="text-sm opacity-80 mb-1">Utilisateurs Totaux</p>
          <p className="text-3xl font-bold">{analytics.totalUsers}</p>
          <p className="text-xs opacity-70 mt-2">
            {analytics.totalMovers} déménageurs
          </p>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-6 rounded-xl shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <DollarSign className="w-8 h-8 opacity-80" />
            <TrendingUp className="w-5 h-5 opacity-60" />
          </div>
          <p className="text-sm opacity-80 mb-1">Chiffre d'Affaires</p>
          <p className="text-3xl font-bold">{analytics.totalRevenue.toLocaleString('fr-FR')} €</p>
          <p className="text-xs opacity-70 mt-2">
            Commission: {analytics.commissionEarned.toLocaleString('fr-FR')} €
          </p>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-6 rounded-xl shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <FileText className="w-8 h-8 opacity-80" />
            <CheckCircle className="w-5 h-5 opacity-60" />
          </div>
          <p className="text-sm opacity-80 mb-1">Devis / Contrats</p>
          <p className="text-3xl font-bold">{analytics.totalQuotes}</p>
          <p className="text-xs opacity-70 mt-2">
            {analytics.totalContracts} contrats signés
          </p>
        </div>

        <div className="bg-gradient-to-br from-red-500 to-red-600 text-white p-6 rounded-xl shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <AlertTriangle className="w-8 h-8 opacity-80" />
            <Shield className="w-5 h-5 opacity-60" />
          </div>
          <p className="text-sm opacity-80 mb-1">Alertes de Fraude</p>
          <p className="text-3xl font-bold">{analytics.fraudAlerts}</p>
          <p className="text-xs opacity-70 mt-2">
            {analytics.documentsVerified} docs vérifiés
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white p-6 rounded-xl shadow-lg border-l-4 border-yellow-500">
          <h3 className="text-sm font-semibold text-gray-600 mb-2">Escrow en Attente</h3>
          <p className="text-2xl font-bold text-gray-900">
            {analytics.escrowAmount.toLocaleString('fr-FR')} €
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Montant en garantie pour déménagements actifs
          </p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-lg border-l-4 border-orange-500">
          <h3 className="text-sm font-semibold text-gray-600 mb-2">Paiements en Attente</h3>
          <p className="text-2xl font-bold text-gray-900">
            {analytics.pendingPayments.toLocaleString('fr-FR')} €
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Devis acceptés en attente de paiement
          </p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-lg border-l-4 border-blue-500">
          <h3 className="text-sm font-semibold text-gray-600 mb-2">Valeur Moyenne</h3>
          <p className="text-2xl font-bold text-gray-900">
            {analytics.averageQuoteValue.toLocaleString('fr-FR')} €
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Montant moyen par devis
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Statut des Déménagements</h3>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">En cours</span>
                <span className="text-sm font-bold text-blue-600">{analytics.activeMovings}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full"
                  style={{
                    width: `${(analytics.activeMovings / (analytics.activeMovings + analytics.completedMovings)) * 100}%`,
                  }}
                />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Terminés</span>
                <span className="text-sm font-bold text-green-600">{analytics.completedMovings}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-600 h-2 rounded-full"
                  style={{
                    width: `${(analytics.completedMovings / (analytics.activeMovings + analytics.completedMovings)) * 100}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-lg">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Taux de Conversion</h3>
          <div className="flex items-center justify-center">
            <div className="relative w-40 h-40">
              <svg className="transform -rotate-90 w-40 h-40">
                <circle
                  cx="80"
                  cy="80"
                  r="70"
                  stroke="#e5e7eb"
                  strokeWidth="12"
                  fill="none"
                />
                <circle
                  cx="80"
                  cy="80"
                  r="70"
                  stroke="#3b82f6"
                  strokeWidth="12"
                  fill="none"
                  strokeDasharray={`${analytics.conversionRate * 4.4} 440`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <p className="text-3xl font-bold text-gray-900">
                    {analytics.conversionRate.toFixed(1)}%
                  </p>
                  <p className="text-xs text-gray-500">Conversion</p>
                </div>
              </div>
            </div>
          </div>
          <p className="text-center text-sm text-gray-600 mt-4">
            Devis transformés en contrats signés
          </p>
        </div>
      </div>

      <div className="bg-gradient-to-r from-blue-50 to-green-50 border border-blue-200 rounded-xl p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Résumé des Performances</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">{analytics.totalQuotes}</p>
            <p className="text-xs text-gray-600">Devis envoyés</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">{analytics.totalContracts}</p>
            <p className="text-xs text-gray-600">Contrats signés</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-purple-600">
              {((analytics.commissionEarned / analytics.totalRevenue) * 100 || 0).toFixed(1)}%
            </p>
            <p className="text-xs text-gray-600">Marge commission</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-orange-600">{analytics.documentsVerified}</p>
            <p className="text-xs text-gray-600">Vérifications doc</p>
          </div>
        </div>
      </div>
    </div>
  );
}
