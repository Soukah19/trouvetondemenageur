import { useState, useEffect } from 'react';
import { X, Loader, CheckCircle, XCircle, Clock, AlertCircle, FileText, TrendingDown } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { showToast } from '../../utils/toast';

interface QuotesListModalProps {
  quoteRequestId: string;
  onClose: () => void;
  adminRole?: string;
}

interface Quote {
  id: string;
  mover_id: string;
  price: number;
  client_display_price: number;
  market_price_estimate: number | null;
  status: string;
  notes: string | null;
  created_at: string;
  movers: {
    company_name: string;
    email: string;
  };
}

export default function QuotesListModal({ quoteRequestId, onClose, adminRole = '' }: QuotesListModalProps) {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [applyingMarketPrice, setApplyingMarketPrice] = useState<string | null>(null);

  const isSuperAdmin = adminRole === 'super_admin';

  useEffect(() => {
    loadQuotes();
  }, [quoteRequestId]);

  const loadQuotes = async () => {
    try {
      const { data, error } = await supabase
        .from('quotes')
        .select(`
          id,
          mover_id,
          price,
          client_display_price,
          market_price_estimate,
          status,
          notes,
          created_at,
          movers!inner(
            company_name,
            email
          )
        `)
        .eq('quote_request_id', quoteRequestId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setQuotes(data || []);
    } catch (error) {
      console.error('Error loading quotes:', error);
      showToast('Erreur lors du chargement des devis', 'error');
    } finally {
      setLoading(false);
    }
  };

  const applyMarketPrice = async (quoteId: string, marketPrice: number) => {
    setApplyingMarketPrice(quoteId);
    try {
      const { error } = await supabase
        .from('quotes')
        .update({
          price: marketPrice,
          updated_at: new Date().toISOString()
        })
        .eq('id', quoteId);

      if (error) throw error;

      showToast('Prix du marché appliqué avec succès', 'success');
      await loadQuotes();
    } catch (error) {
      console.error('Error applying market price:', error);
      showToast('Erreur lors de l\'application du prix du marché', 'error');
    } finally {
      setApplyingMarketPrice(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <div className="flex items-center gap-2 px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
            <Clock className="w-4 h-4" />
            En attente
          </div>
        );
      case 'accepted':
        return (
          <div className="flex items-center gap-2 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
            <CheckCircle className="w-4 h-4" />
            Accepté
          </div>
        );
      case 'rejected':
        return (
          <div className="flex items-center gap-2 px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium">
            <XCircle className="w-4 h-4" />
            Rejeté
          </div>
        );
      case 'expired':
        return (
          <div className="flex items-center gap-2 px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm font-medium">
            <AlertCircle className="w-4 h-4" />
            Expiré
          </div>
        );
      default:
        return (
          <div className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm font-medium">
            {status}
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[80vh] overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <FileText className="w-6 h-6 text-white" />
            <h2 className="text-xl font-bold text-white">Devis reçus</h2>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(80vh-80px)]">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader className="w-8 h-8 animate-spin text-blue-600" />
            </div>
          ) : quotes.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">Aucun devis reçu pour cette demande</p>
            </div>
          ) : (
            <div className="space-y-4">
              {quotes.map((quote) => (
                <div
                  key={quote.id}
                  className="border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        {quote.movers.company_name}
                      </h3>
                      <p className="text-sm text-gray-500">{quote.movers.email}</p>
                    </div>
                    {getStatusBadge(quote.status)}
                  </div>

                  <div className={`grid ${isSuperAdmin ? 'grid-cols-3' : 'grid-cols-2'} gap-4 mb-4`}>
                    {isSuperAdmin && (
                      <div className="bg-orange-50 rounded-lg p-3">
                        <p className="text-xs text-gray-500 mb-1">Prix déménageur</p>
                        <p className="text-2xl font-bold text-orange-600">
                          {quote.price.toLocaleString('fr-FR')} €
                        </p>
                      </div>
                    )}
                    <div className="bg-blue-50 rounded-lg p-3">
                      <p className="text-xs text-gray-500 mb-1">Prix client (avec commission)</p>
                      <p className="text-2xl font-bold text-blue-600">
                        {quote.client_display_price.toLocaleString('fr-FR')} €
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-500 mb-1">Date de soumission</p>
                      <p className="text-sm font-medium text-gray-900">
                        {new Date(quote.created_at).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                        })}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(quote.created_at).toLocaleTimeString('fr-FR', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>

                  {isSuperAdmin && quote.market_price_estimate && (
                    <div className="mb-4 bg-purple-50 border border-purple-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-purple-600 font-medium mb-1">Prix du marché estimé</p>
                          <p className="text-2xl font-bold text-purple-700">
                            {quote.market_price_estimate.toLocaleString('fr-FR')} €
                          </p>
                          {quote.price !== quote.market_price_estimate && (
                            <p className="text-xs text-purple-600 mt-1">
                              Différence: {(quote.price - quote.market_price_estimate).toLocaleString('fr-FR')} €
                              {' '}({Math.round(((quote.price - quote.market_price_estimate) / quote.market_price_estimate) * 100)}%)
                            </p>
                          )}
                        </div>
                        {quote.status === 'pending' && quote.price !== quote.market_price_estimate && (
                          <button
                            onClick={() => applyMarketPrice(quote.id, quote.market_price_estimate!)}
                            disabled={applyingMarketPrice === quote.id}
                            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {applyingMarketPrice === quote.id ? (
                              <>
                                <Loader className="w-4 h-4 animate-spin" />
                                Application...
                              </>
                            ) : (
                              <>
                                <TrendingDown className="w-4 h-4" />
                                Appliquer le prix du marché
                              </>
                            )}
                          </button>
                        )}
                        {quote.price === quote.market_price_estimate && (
                          <div className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-lg">
                            <CheckCircle className="w-4 h-4" />
                            Prix du marché appliqué
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {quote.notes && (
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-500 mb-1">Notes du déménageur</p>
                      <p className="text-sm text-gray-700">{quote.notes}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}
