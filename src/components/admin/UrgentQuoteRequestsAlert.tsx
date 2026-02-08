import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { AlertTriangle, Calendar, MapPin, User, Eye } from 'lucide-react';
import QuoteRequestDetailModal from './QuoteRequestDetailModal';

interface UrgentQuoteRequest {
  id: string;
  client_name: string;
  client_email: string;
  client_phone: string;
  from_address: string;
  from_city: string;
  to_address: string;
  to_city: string;
  moving_date: string;
  date_flexibility_days: number | null;
  days_until_move: number;
  quote_count: number;
}

export default function UrgentQuoteRequestsAlert() {
  const [urgentRequests, setUrgentRequests] = useState<UrgentQuoteRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedQuoteId, setSelectedQuoteId] = useState<string | null>(null);

  useEffect(() => {
    loadUrgentRequests();

    const interval = setInterval(() => {
      loadUrgentRequests();
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  const loadUrgentRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('urgent_quote_requests')
        .select('*')
        .order('days_until_move', { ascending: true });

      if (error) throw error;

      setUrgentRequests(data || []);

      if (data && data.length > 0) {
        await supabase.rpc('create_admin_alerts_for_urgent_quote_requests');
      }
    } catch (error) {
      console.error('Error loading urgent requests:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return null;
  }

  if (urgentRequests.length === 0) {
    return null;
  }

  return (
    <>
      <div className="bg-orange-50 dark:bg-orange-900/20 border-2 border-orange-500 rounded-xl p-4 sm:p-6 mb-6">
        <div className="flex items-start gap-3 sm:gap-4">
          <div className="p-2 sm:p-3 bg-orange-500 rounded-lg flex-shrink-0">
            <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base sm:text-lg font-bold text-orange-900 dark:text-orange-100 mb-2">
              Demandes Urgentes Sans Devis ({urgentRequests.length})
            </h3>
            <p className="text-xs sm:text-sm text-orange-800 dark:text-orange-200 mb-4">
              Les demandes suivantes approchent de leur date de déménagement et n'ont reçu aucun devis de la part des déménageurs.
            </p>

            <div className="space-y-3">
              {urgentRequests.map((request) => (
                <div
                  key={request.id}
                  className="bg-white dark:bg-gray-800 border border-orange-200 dark:border-orange-800 rounded-lg p-3 sm:p-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <User className="w-4 h-4 text-gray-500 flex-shrink-0" />
                        <span className="font-semibold text-gray-900 dark:text-white truncate">
                          {request.client_name}
                        </span>
                        <span className="text-sm text-gray-500 truncate">
                          {request.client_phone}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 gap-2 text-sm">
                        <div className="flex items-start gap-2">
                          <MapPin className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                          <div className="min-w-0">
                            <p className="text-gray-500 dark:text-gray-400 text-xs">Départ</p>
                            <p className="text-gray-900 dark:text-white font-medium truncate">
                              {request.from_address}, {request.from_city}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start gap-2">
                          <MapPin className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                          <div className="min-w-0">
                            <p className="text-gray-500 dark:text-gray-400 text-xs">Arrivée</p>
                            <p className="text-gray-900 dark:text-white font-medium truncate">
                              {request.to_address}, {request.to_city}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-3">
                        <div className="flex items-center gap-1 sm:gap-2">
                          <Calendar className="w-4 h-4 text-orange-600 flex-shrink-0" />
                          <span className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white">
                            {new Date(request.moving_date).toLocaleDateString('fr-FR')}
                            {request.date_flexibility_days && request.date_flexibility_days > 0 && (
                              <span className="ml-1 text-orange-600">
                                (±{request.date_flexibility_days}j)
                              </span>
                            )}
                          </span>
                        </div>

                        <div className="px-2 sm:px-3 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200 rounded-full text-xs font-bold">
                          Dans {request.days_until_move}j
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => setSelectedQuoteId(request.id)}
                      className="flex items-center justify-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors flex-shrink-0 w-full sm:w-auto"
                    >
                      <Eye className="w-4 h-4" />
                      Voir
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {selectedQuoteId && (
        <QuoteRequestDetailModal
          quoteRequestId={selectedQuoteId}
          onClose={() => setSelectedQuoteId(null)}
          onSave={loadUrgentRequests}
        />
      )}
    </>
  );
}
