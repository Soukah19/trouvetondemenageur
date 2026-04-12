import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { FileText, MapPin, Calendar, Package, Eye, RefreshCw, Clock, CheckCircle, XCircle, Search } from 'lucide-react';
import QuoteRequestDetailModal from './QuoteRequestDetailModal';
import { showToast } from '../../utils/toast';

interface QuoteRequest {
  id: string;
  created_at: string;
  from_address: string;
  to_address: string;
  from_city?: string;
  to_city?: string;
  moving_date: string;
  volume_m3?: number;
  surface_m2?: number;
  status: string;
  client_name?: string;
  client_phone?: string;
  client_email?: string;
  client_user_id?: string;
  total_quotes?: number;
}

export default function AdminRecentQuoteRequests() {
  const [quoteRequests, setQuoteRequests] = useState<QuoteRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const loadQuoteRequests = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('quote_requests')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Get quote counts for each request
      const requestsWithCounts = await Promise.all(
        (data || []).map(async (q: any) => {
          const { count } = await supabase
            .from('quotes')
            .select('*', { count: 'exact', head: true })
            .eq('quote_request_id', q.id);

          return {
            id: q.id,
            created_at: q.created_at,
            from_address: q.from_address || q.departure_address || '',
            to_address: q.to_address || q.arrival_address || '',
            from_city: q.from_city,
            to_city: q.to_city,
            moving_date: q.moving_date,
            volume_m3: q.volume_m3,
            surface_m2: q.surface_m2,
            status: q.status,
            client_name: q.client_name,
            client_phone: q.client_phone,
            client_email: q.client_email,
            client_user_id: q.client_user_id,
            total_quotes: count || 0,
          };
        })
      );

      setQuoteRequests(requestsWithCounts);
    } catch (error) {
      console.error('Error loading quote requests:', error);
      showToast('Erreur lors du chargement des demandes de devis', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQuoteRequests();
  }, [statusFilter]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 text-amber-700 text-xs font-medium rounded-full border border-amber-200">
            <Clock className="w-3 h-3" /> En attente
          </span>
        );
      case 'quoted':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-full border border-blue-200">
            <FileText className="w-3 h-3" /> Devis reçus
          </span>
        );
      case 'accepted':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-50 text-green-700 text-xs font-medium rounded-full border border-green-200">
            <CheckCircle className="w-3 h-3" /> Accepté
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-50 text-red-700 text-xs font-medium rounded-full border border-red-200">
            <XCircle className="w-3 h-3" /> Annulé
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-50 text-gray-700 text-xs font-medium rounded-full border border-gray-200">
            {status}
          </span>
        );
    }
  };

  const filteredRequests = quoteRequests.filter((q) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      (q.client_name || '').toLowerCase().includes(term) ||
      (q.client_email || '').toLowerCase().includes(term) ||
      (q.from_address || '').toLowerCase().includes(term) ||
      (q.to_address || '').toLowerCase().includes(term) ||
      (q.from_city || '').toLowerCase().includes(term) ||
      (q.to_city || '').toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Demandes de Devis Récentes</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {quoteRequests.length} demande{quoteRequests.length > 1 ? 's' : ''} au total
          </p>
        </div>
        <button
          onClick={loadQuoteRequests}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          <RefreshCw className="w-4 h-4" />
          Actualiser
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Rechercher par nom, email, ville..."
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">Tous les statuts</option>
          <option value="pending">En attente</option>
          <option value="quoted">Devis reçus</option>
          <option value="accepted">Accepté</option>
          <option value="cancelled">Annulé</option>
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : filteredRequests.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400">Aucune demande de devis trouvée</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Date</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Client</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Départ → Arrivée</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Date déménagement</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Volume</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Devis</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Statut</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredRequests.map((q) => (
                  <tr key={q.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition">
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300 whitespace-nowrap">
                      {new Date(q.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{q.client_name || 'Non renseigné'}</p>
                      {q.client_email && <p className="text-xs text-gray-500">{q.client_email}</p>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 text-sm">
                        <span className="text-green-600 font-medium">{q.from_city || q.from_address?.split(',').slice(-2, -1)[0]?.trim() || '—'}</span>
                        <span className="text-gray-400">→</span>
                        <span className="text-red-600 font-medium">{q.to_city || q.to_address?.split(',').slice(-2, -1)[0]?.trim() || '—'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300 whitespace-nowrap">
                      {q.moving_date ? new Date(q.moving_date).toLocaleDateString('fr-FR') : '—'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300 whitespace-nowrap">
                      {q.volume_m3 ? `${q.volume_m3} m³` : '—'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                      <span className="font-medium">{q.total_quotes || 0}</span>
                    </td>
                    <td className="px-4 py-3">
                      {getStatusBadge(q.status)}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setSelectedRequestId(q.id)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 transition"
                      >
                        <Eye className="w-3 h-3" />
                        Voir
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selectedRequestId && (
        <QuoteRequestDetailModal
          quoteRequestId={selectedRequestId}
          onClose={() => setSelectedRequestId(null)}
          onUpdate={loadQuoteRequests}
        />
      )}
    </div>
  );
}
