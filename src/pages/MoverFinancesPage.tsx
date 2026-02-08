import { useState, useEffect } from 'react';
import { Euro, TrendingUp, Wallet, Clock, CheckCircle, Download, Calendar, ArrowUpRight } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { showToast } from '../utils/toast';
import SimpleLineChart from '../components/SimpleLineChart';
import { MoverLayout } from '../components/MoverLayout';

interface FinancialSummary {
  totalMoverReceived: number;
  directPayments: number;
  guaranteeReleased: number;
  guaranteePending: number;
  transactionCount: number;
}

interface Transaction {
  id: string;
  quote_request_id: string;
  client_name: string;
  from_city: string;
  to_city: string;
  moving_date: string;
  mover_price: number;
  total_amount: number;
  remaining_amount: number;
  guarantee_amount: number;
  guarantee_status: string;
  payment_status: string;
  mission_completion_status: string;
  created_at: string;
}

export default function MoverFinancesPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<FinancialSummary>({
    totalMoverReceived: 0,
    directPayments: 0,
    guaranteeReleased: 0,
    guaranteePending: 0,
    transactionCount: 0,
  });
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filter, setFilter] = useState<'all' | 'completed' | 'pending'>('all');

  useEffect(() => {
    fetchFinancialData();
  }, [user, filter]);

  const fetchFinancialData = async () => {
    if (!user) return;

    try {
      setLoading(true);

      const { data: moverData } = await supabase
        .from('movers')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!moverData) {
        setLoading(false);
        return;
      }

      const { data: quotesData } = await supabase
        .from('quotes')
        .select('id, quote_request_id')
        .eq('mover_id', moverData.id)
        .eq('status', 'accepted');

      if (!quotesData || quotesData.length === 0) {
        setLoading(false);
        return;
      }

      const quoteIds = quotesData.map(q => q.id);

      let query = supabase
        .from('payments')
        .select(`
          id,
          quote_request_id,
          quote_id,
          mover_price,
          total_amount,
          remaining_amount,
          guarantee_amount,
          guarantee_status,
          payment_status,
          mission_completion_status,
          created_at
        `)
        .in('quote_id', quoteIds)
        .order('created_at', { ascending: false });

      if (filter === 'completed') {
        query = query.eq('mission_completion_status', 'approved');
      } else if (filter === 'pending') {
        query = query.in('mission_completion_status', ['in_progress', 'completed_pending_review']);
      }

      const { data: paymentsData } = await query;

      if (!paymentsData) {
        setLoading(false);
        return;
      }

      const quoteRequestIds = paymentsData.map(p => p.quote_request_id);

      const { data: quoteRequestsData } = await supabase
        .from('quote_requests_with_privacy')
        .select('id, client_name, from_city, to_city, moving_date, is_data_masked')
        .in('id', quoteRequestIds);

      const transactionsWithDetails: Transaction[] = paymentsData.map(payment => {
        const qr = quoteRequestsData?.find(q => q.id === payment.quote_request_id);
        return {
          ...payment,
          client_name: qr?.client_name || 'Client',
          from_city: qr?.from_city || '',
          to_city: qr?.to_city || '',
          moving_date: qr?.moving_date || '',
        };
      });

      setTransactions(transactionsWithDetails);

      // Calculate summary
      const summaryCalc: FinancialSummary = {
        totalMoverReceived: 0,
        directPayments: 0,
        guaranteeReleased: 0,
        guaranteePending: 0,
        transactionCount: paymentsData.length,
      };

      paymentsData.forEach(payment => {
        const directPay = payment.remaining_amount || 0;
        const guarantee = payment.guarantee_amount || 0;

        // Direct payments from client — counted when mission is completed or approved
        if (payment.mission_completion_status === 'completed_pending_review' || payment.mission_completion_status === 'approved') {
          summaryCalc.directPayments += directPay;
        }

        // Guarantee released by admin
        if (payment.guarantee_status === 'released_to_mover' || payment.mission_completion_status === 'approved') {
          summaryCalc.guaranteeReleased += guarantee;
        } else if (payment.mission_completion_status === 'completed_pending_review' && payment.guarantee_status !== 'released_to_mover') {
          summaryCalc.guaranteePending += guarantee;
        }
      });

      summaryCalc.totalMoverReceived = summaryCalc.directPayments + summaryCalc.guaranteeReleased;

      setSummary(summaryCalc);
    } catch (error) {
      console.error('Error fetching financial data:', error);
      showToast('Erreur lors du chargement des finances', 'error');
    } finally {
      setLoading(false);
    }
  };

  const getStatusInfo = (transaction: Transaction) => {
    // If guarantee is released, mission is fully closed
    const guaranteeReleased = transaction.guarantee_status === 'released_to_mover';
    
    if (transaction.mission_completion_status === 'approved' || guaranteeReleased) {
      return { label: 'Terminé', color: 'bg-green-100 text-green-800', icon: CheckCircle };
    }
    if (transaction.mission_completion_status === 'completed_pending_review') {
      return { label: 'Vérification en cours', color: 'bg-yellow-100 text-yellow-800', icon: Clock };
    }
    if (transaction.payment_status === 'completed' || transaction.payment_status === 'deposit_released') {
      return { label: 'Mission en cours', color: 'bg-blue-100 text-blue-800', icon: Clock };
    }
    return { label: 'En attente', color: 'bg-gray-100 text-gray-800', icon: Clock };
  };

  const exportToCSV = () => {
    const csvContent = [
      ['Date', 'Client', 'Trajet', 'Prix déménageur', 'Reçu client', 'Garantie', 'Statut garantie', 'Statut'],
      ...transactions.map(t => [
        new Date(t.created_at).toLocaleDateString('fr-FR'),
        t.client_name,
        `${t.from_city} → ${t.to_city}`,
        `${t.mover_price}€`,
        `${t.remaining_amount}€`,
        `${t.guarantee_amount}€`,
        t.guarantee_status || 'held',
        t.mission_completion_status
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `finances_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    showToast('Rapport exporté', 'success');
  };

  if (loading) {
    return (
      <MoverLayout activeSection="earnings" title="Finances de l'entreprise">
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Chargement...</p>
          </div>
        </div>
      </MoverLayout>
    );
  }

  return (
    <MoverLayout activeSection="earnings" title="Finances de l'entreprise">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Finances de l'entreprise</h1>
            <p className="text-sm text-gray-600">Suivi complet de vos revenus</p>
          </div>
          <button
            onClick={exportToCSV}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Exporter</span>
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between mb-2">
              <Euro className="w-8 h-8 opacity-80" />
              <ArrowUpRight className="w-5 h-5 opacity-80" />
            </div>
            <h3 className="text-sm font-medium opacity-90 mb-1">Total reçu</h3>
            <p className="text-3xl font-bold">{summary.totalMoverReceived.toFixed(0)} €</p>
            <p className="text-xs opacity-80 mt-2">{summary.transactionCount} mission(s)</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <Wallet className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-sm font-medium text-gray-600 mb-1">Reçu du client</h3>
            <p className="text-3xl font-bold text-gray-900">{summary.directPayments.toFixed(0)} €</p>
            <p className="text-xs text-gray-500 mt-2">Paiement direct à la livraison</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-sm font-medium text-gray-600 mb-1">Garantie libérée</h3>
            <p className="text-3xl font-bold text-gray-900">{summary.guaranteeReleased.toFixed(0)} €</p>
            <p className="text-xs text-gray-500 mt-2">Versée par l'admin après vérification</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <Clock className="w-8 h-8 text-yellow-600" />
            </div>
            <h3 className="text-sm font-medium text-gray-600 mb-1">Garantie en attente</h3>
            <p className="text-3xl font-bold text-gray-900">{summary.guaranteePending.toFixed(0)} €</p>
            <p className="text-xs text-gray-500 mt-2">En cours de vérification</p>
          </div>
        </div>

        {/* Revenue breakdown + chart */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Répartition des revenus</h3>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Paiements directs</span>
                  <span className="text-sm font-bold text-gray-900">{summary.directPayments.toFixed(0)} €</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{ width: `${summary.totalMoverReceived > 0 ? (summary.directPayments / summary.totalMoverReceived) * 100 : 0}%` }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Garantie libérée</span>
                  <span className="text-sm font-bold text-gray-900">{summary.guaranteeReleased.toFixed(0)} €</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-600 h-2 rounded-full"
                    style={{ width: `${summary.totalMoverReceived > 0 ? (summary.guaranteeReleased / summary.totalMoverReceived) * 100 : 0}%` }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">En attente de vérification</span>
                  <span className="text-sm font-bold text-yellow-600">{summary.guaranteePending.toFixed(0)} €</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-yellow-500 h-2 rounded-full"
                    style={{ width: `${(summary.totalMoverReceived + summary.guaranteePending) > 0 ? (summary.guaranteePending / (summary.totalMoverReceived + summary.guaranteePending)) * 100 : 0}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Évolution des revenus</h3>
            <SimpleLineChart
              data={[
                { label: 'Jan', value: summary.totalMoverReceived * 0.6 },
                { label: 'Fév', value: summary.totalMoverReceived * 0.7 },
                { label: 'Mar', value: summary.totalMoverReceived * 0.8 },
                { label: 'Avr', value: summary.totalMoverReceived * 0.9 },
                { label: 'Mai', value: summary.totalMoverReceived },
              ]}
            />
          </div>
        </div>

        {/* Transactions table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-gray-900">Historique des missions</h3>
            <div className="flex gap-2">
              {(['all', 'pending', 'completed'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1 rounded-lg text-sm font-medium transition ${
                    filter === f
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {f === 'all' ? 'Tout' : f === 'pending' ? 'En cours' : 'Finalisés'}
                </button>
              ))}
            </div>
          </div>

          {transactions.length === 0 ? (
            <div className="text-center py-12">
              <Wallet className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Aucune mission</h3>
              <p className="text-gray-600">Vos missions apparaîtront ici une fois que vous aurez des devis acceptés.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trajet</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Votre prix</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Reçu client</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Garantie</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {transactions.map((transaction) => {
                    const statusInfo = getStatusInfo(transaction);
                    const StatusIcon = statusInfo.icon;
                    const guaranteeReleased = transaction.guarantee_status === 'released_to_mover' || transaction.mission_completion_status === 'approved';

                    return (
                      <tr key={transaction.id} className="hover:bg-gray-50 transition">
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                {new Date(transaction.moving_date).toLocaleDateString('fr-FR')}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <p className="text-sm font-medium text-gray-900">{transaction.client_name}</p>
                        </td>
                        <td className="px-4 py-4">
                          <p className="text-sm text-gray-900">{transaction.from_city} → {transaction.to_city}</p>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-right">
                          <p className="text-sm font-medium text-gray-900">{(transaction.mover_price || 0).toFixed(0)} €</p>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-right">
                          <div className="flex items-center justify-end gap-1">
                            {(transaction.mission_completion_status === 'completed_pending_review' || transaction.mission_completion_status === 'approved') && (
                              <ArrowUpRight className="w-4 h-4 text-green-500" />
                            )}
                            <p className={`text-sm font-medium ${
                              transaction.mission_completion_status === 'completed_pending_review' || transaction.mission_completion_status === 'approved'
                                ? 'text-green-600' : 'text-gray-400'
                            }`}>
                              {(transaction.remaining_amount || 0).toFixed(0)} €
                            </p>
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-right">
                          <p className={`text-sm font-medium ${
                            guaranteeReleased ? 'text-green-600' : 'text-yellow-600'
                          }`}>
                            {guaranteeReleased ? '✅' : '⏳'} {(transaction.guarantee_amount || 0).toFixed(0)} €
                          </p>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-center">
                          <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}>
                            <StatusIcon className="w-3 h-3" />
                            {statusInfo.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* How it works */}
        <div className="mt-8 bg-gradient-to-r from-blue-50 to-green-50 rounded-xl p-6 border border-blue-200">
          <h3 className="text-lg font-bold text-gray-900 mb-3">💡 Comment ça marche ?</h3>
          <div className="space-y-3 text-sm text-gray-700">
            <p><strong>1. Acompte client :</strong> Le client verse un acompte à la plateforme comme garantie de bonne exécution.</p>
            <p><strong>2. Livraison :</strong> Le client vous paie directement le solde restant à la fin du déménagement.</p>
            <p><strong>3. Fin de mission :</strong> Vous confirmez la livraison. Le client a 48h pour signaler un dommage avec justificatifs.</p>
            <p><strong>4. Libération de la garantie :</strong> Si aucun dommage n'est signalé dans les 48h (ou si le dossier est résolu), l'admin vous verse la garantie retenue. La mission passe alors au statut <strong>Terminé</strong>.</p>
          </div>
        </div>
      </div>
    </MoverLayout>
  );
}
