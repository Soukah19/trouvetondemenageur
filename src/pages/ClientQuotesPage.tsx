import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Package, TrendingUp, AlertCircle, CheckCircle, Clock, ArrowLeft, FileText, Calendar, X, ArrowUpDown, Star, Euro, Filter, MapPin, Building, Home, Truck, Phone, Mail, Download, Map, Eye, EyeOff, Camera, MessageCircle } from 'lucide-react';
import QuoteComparison from '../components/QuoteComparison';
import InventoryManager from '../components/InventoryManager';
import { FurnitureInventoryModal } from '../components/FurnitureInventoryModal';
import { DistanceDisplay } from '../components/DistanceDisplay';
import { ConfirmationModal } from '../components/ConfirmationModal';
import { ClientLayout } from '../components/ClientLayout';
import { MessagingInterface } from '../components/MessagingInterface';
import RouteMap from '../components/RouteMap';
import type { FurnitureInventory } from '../components/VolumeCalculator';
import { showToast } from '../utils/toast';

// Mover details interface
interface MoverDetails {
  id: string;
  company_name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  postal_code: string;
  siret: string;
  average_rating: number | null;
  total_moves: number;
  manager_firstname: string;
  manager_lastname: string;
}

interface Quote {
  id: string;
  quote_request_id: string;
  mover_id: string;
  price: number;
  client_display_price: number;
  market_price_estimate: number;
  price_indicator: 'green' | 'orange' | 'red';
  proposed_moving_date?: string;
  notes: string | null;
  status: string;
  created_at: string;
  movers: {
    company_name: string;
    average_rating: number | null;
    is_name_masked: boolean;
  };
  payments?: Array<{
    id: string;
    payment_status: string;
    paid_at: string | null;
  }>;
}

interface QuoteRequest {
  id: string;
  from_address: string;
  from_city: string;
  from_postal_code: string;
  to_address: string;
  to_city: string;
  to_postal_code: string;
  moving_date: string;
  status: string;
  payment_status?: string;
  volume_m3?: number | null;
  surface_m2?: number | null;
  furniture_inventory?: FurnitureInventory | null;
  // Additional fields for detailed display
  home_size?: string;
  home_type?: string;
  floor_from?: number;
  floor_to?: number;
  elevator_from?: boolean;
  elevator_to?: boolean;
  from_home_type?: string;
  from_home_size?: string;
  from_surface_m2?: number;
  to_home_type?: string;
  to_home_size?: string;
  to_surface_m2?: number;
  furniture_lift_needed_departure?: boolean;
  furniture_lift_needed_arrival?: boolean;
  date_flexibility_days?: number;
  services_needed?: string[];
  additional_info?: string;
  accepts_groupage?: boolean;
  quotes: Quote[];
}

export default function ClientQuotesPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [quoteRequests, setQuoteRequests] = useState<QuoteRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingAcceptance, setProcessingAcceptance] = useState(false);
  const [processingRejection, setProcessingRejection] = useState(false);
  const [confirmRejectQuoteId, setConfirmRejectQuoteId] = useState<string | null>(null);
  const [showInventoryModal, setShowInventoryModal] = useState(false);
  const [selectedRequestForInventory, setSelectedRequestForInventory] = useState<QuoteRequest | null>(null);
  const [sortBy, setSortBy] = useState<'price' | 'rating' | 'date'>('price');
  const [showMoverDetails, setShowMoverDetails] = useState(false);
  const [selectedMoverDetails, setSelectedMoverDetails] = useState<MoverDetails | null>(null);
  const [loadingMoverDetails, setLoadingMoverDetails] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'accepted' | 'expired'>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [visibleMaps, setVisibleMaps] = useState<Set<string>>(new Set());
  const [messagingQuote, setMessagingQuote] = useState<{ quoteRequestId: string; moverId: string } | null>(null);
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);

  const toggleMapVisibility = (requestId: string) => {
    setVisibleMaps(prev => {
      const newSet = new Set(prev);
      if (newSet.has(requestId)) {
        newSet.delete(requestId);
      } else {
        newSet.add(requestId);
      }
      return newSet;
    });
  };

  useEffect(() => {
    if (user) {
      setLoading(true);
      fetchQuoteRequests();
    }
  }, [user]);

  useEffect(() => {
    const refreshData = () => {
      if (user && document.visibilityState === 'visible') {
        fetchQuoteRequests();
      }
    };

    document.addEventListener('visibilitychange', refreshData);
    window.addEventListener('focus', refreshData);

    return () => {
      document.removeEventListener('visibilitychange', refreshData);
      window.removeEventListener('focus', refreshData);
    };
  }, [user]);

  const fetchQuoteRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('quote_requests')
        .select(`
          *,
          quotes!quote_request_id(
            id,
            quote_request_id,
            mover_id,
            price,
            client_display_price,
            market_price_estimate,
            price_indicator,
            proposed_moving_date,
            notes,
            status,
            created_at,
            movers:movers_with_privacy(company_name, average_rating, is_name_masked),
            payments!quote_id(id, payment_status, paid_at)
          )
        `)
        .eq('client_user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const requestsWithQuotes = data.filter(req => req.quotes && req.quotes.length > 0);
      setQuoteRequests(requestsWithQuotes);
    } catch (error) {
      console.error('Error fetching quotes:', error);
    } finally {
      setLoading(false);
    }
  };

  const getIndicatorStyles = (indicator: 'green' | 'orange' | 'red') => {
    switch (indicator) {
      case 'green':
        return {
          bg: 'bg-green-100',
          text: 'text-green-700',
          border: 'border-green-300',
          badge: 'bg-green-600',
        };
      case 'orange':
        return {
          bg: 'bg-blue-100',
          text: 'text-blue-700',
          border: 'border-blue-300',
          badge: 'bg-blue-600',
        };
      case 'red':
        return {
          bg: 'bg-amber-100',
          text: 'text-amber-700',
          border: 'border-amber-300',
          badge: 'bg-amber-600',
        };
    }
  };

  const getIndicatorLabel = (indicator: 'green' | 'orange' | 'red') => {
    switch (indicator) {
      case 'green':
        return '🌟 Très compétitif';
      case 'orange':
        return '📊 Prix du marché';
      case 'red':
        return '📈 Au-dessus du marché';
    }
  };

  const fetchMoverDetails = async (moverId: string) => {
    setLoadingMoverDetails(true);
    try {
      const { data, error } = await supabase
        .from('movers')
        .select('id, company_name, email, phone, address, city, postal_code, siret, average_rating, total_moves, manager_firstname, manager_lastname')
        .eq('id', moverId)
        .single();

      if (error) throw error;
      
      setSelectedMoverDetails(data);
      setShowMoverDetails(true);
    } catch (error) {
      console.error('Error fetching mover details:', error);
      showToast('Erreur lors du chargement des détails', 'error');
    } finally {
      setLoadingMoverDetails(false);
    }
  };

  const handleAcceptQuote = async (quoteId: string, quoteRequestId: string) => {
    setProcessingAcceptance(true);
    try {
      const { data: quoteData, error: quoteError } = await supabase
        .from('quotes')
        .select('status, validity_date')
        .eq('id', quoteId)
        .maybeSingle();

      if (quoteError) throw quoteError;

      if (!quoteData) {
        alert('Devis introuvable');
        setProcessingAcceptance(false);
        return;
      }

      if (quoteData.status === 'expired') {
        alert('❌ Ce devis a expiré car vous avez modifié votre demande.\n\n✅ Le déménageur a été notifié et vous recevrez un nouveau devis adapté à vos modifications sous peu.');
        await fetchQuoteRequests();
        setProcessingAcceptance(false);
        return;
      }

      if (quoteData.status !== 'pending') {
        alert('Ce devis n\'est plus disponible.');
        await fetchQuoteRequests();
        setProcessingAcceptance(false);
        return;
      }

      const currentDate = new Date();
      const validityDate = new Date(quoteData.validity_date);
      // Set validity to end of day to allow same-day acceptance
      validityDate.setHours(23, 59, 59, 999);
      if (currentDate > validityDate) {
        alert('Ce devis a expiré. Veuillez demander un nouveau devis au déménageur.');
        setProcessingAcceptance(false);
        return;
      }

      navigate(`/client/payment/${quoteId}`);
    } catch (error) {
      console.error('Error accepting quote:', error);
      alert('Erreur lors de l\'acceptation du devis');
      setProcessingAcceptance(false);
    }
  };

  const handleRejectQuote = async (quoteId: string) => {
    setProcessingRejection(true);
    setConfirmRejectQuoteId(null);

    try {
      const { error, data } = await supabase
        .from('quotes')
        .update({ status: 'rejected' })
        .eq('id', quoteId)
        .select();

      if (error) {
        console.error('Error updating quote:', error);
        throw error;
      }

      console.log('Quote updated successfully:', data);

      setQuoteRequests(prevRequests =>
        prevRequests.map(request => ({
          ...request,
          quotes: request.quotes.filter(quote => quote.id !== quoteId)
        }))
      );

      showToast('Devis refusé', 'success');
    } catch (error) {
      console.error('Error rejecting quote:', error);
      showToast('Erreur lors du refus du devis', 'error');
    } finally {
      setProcessingRejection(false);
    }
  };

  if (loading) {
    return (
      <ClientLayout title="Mes devis reçus">
        <div className="flex items-center justify-center py-32">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-slate-600">Chargement...</p>
          </div>
        </div>
      </ClientLayout>
    );
  }

  const selectedRequest = selectedRequestId ? quoteRequests.find(r => r.id === selectedRequestId) : null;

  return (
    <ClientLayout title="Mes devis reçus" subtitle={`${quoteRequests.length} demande${quoteRequests.length > 1 ? 's' : ''} avec des devis`}>
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800 mb-2">Mes devis reçus</h1>
          <p className="text-slate-600">
            {quoteRequests.length} demande{quoteRequests.length > 1 ? 's' : ''} avec des devis
          </p>
        </div>

        {/* LIST VIEW - show when no request is selected */}
        {!selectedRequest && (
          <div className="space-y-3">
            {quoteRequests
              .filter(request => request.quotes.some(quote => quote.status !== 'rejected'))
              .map((request) => {
                const activeQuotes = request.quotes.filter(q => q.status !== 'rejected');
                const hasAccepted = activeQuotes.some(q => q.status === 'accepted');
                const lowestPrice = activeQuotes.length > 0 
                  ? Math.min(...activeQuotes.map(q => q.client_display_price))
                  : 0;
                
                return (
                  <button
                    key={request.id}
                    onClick={() => setSelectedRequestId(request.id)}
                    className={`w-full text-left bg-white rounded-xl shadow-sm border-2 p-5 hover:shadow-md transition-all ${
                      hasAccepted ? 'border-green-300 bg-green-50/30' : 'border-slate-200 hover:border-blue-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-blue-600" />
                          <span className="font-semibold text-slate-800">{request.from_city}</span>
                          <span className="text-slate-400">→</span>
                          <MapPin className="w-4 h-4 text-green-600" />
                          <span className="font-semibold text-slate-800">{request.to_city}</span>
                        </div>
                        {hasAccepted && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                            <CheckCircle className="w-3 h-3" />
                            Accepté
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-xs text-slate-500">
                            {activeQuotes.length} devis reçu{activeQuotes.length > 1 ? 's' : ''}
                          </p>
                          {lowestPrice > 0 && (
                            <p className="text-sm font-semibold text-slate-800">
                              à partir de {lowestPrice.toLocaleString('fr-FR')} €
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <span className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">
                            {new Date(request.moving_date).toLocaleDateString('fr-FR')}
                          </span>
                        </div>
                        <ArrowUpDown className="w-4 h-4 text-slate-400" />
                      </div>
                    </div>
                  </button>
                );
              })}
            {quoteRequests.filter(r => r.quotes.some(q => q.status !== 'rejected')).length === 0 && (
              <div className="text-center py-12">
                <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500">Aucun devis reçu pour le moment</p>
              </div>
            )}
          </div>
        )}

        {/* DETAIL VIEW - show when a request is selected */}
        {selectedRequest && (
          <div>
            <button
              onClick={() => setSelectedRequestId(null)}
              className="flex items-center gap-2 text-slate-600 hover:text-blue-600 transition mb-6"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Retour à la liste</span>
            </button>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h2 className="text-xl font-bold text-slate-800 mb-2">
                      {selectedRequest.from_city} → {selectedRequest.to_city}
                    </h2>
                    {selectedRequest.from_address && selectedRequest.to_address && (
                      <DistanceDisplay
                        fromAddress={selectedRequest.from_address}
                        fromCity={selectedRequest.from_city}
                        fromPostalCode={selectedRequest.from_postal_code}
                        toAddress={selectedRequest.to_address}
                        toCity={selectedRequest.to_city}
                        toPostalCode={selectedRequest.to_postal_code}
                        showDuration={true}
                      />
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    {selectedRequest.furniture_inventory && (
                      <button
                        onClick={() => {
                          setSelectedRequestForInventory(selectedRequest);
                          setShowInventoryModal(true);
                        }}
                        className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium hover:bg-purple-200 transition flex items-center space-x-1"
                      >
                        <FileText className="w-4 h-4" />
                        <span>Inventaire</span>
                      </button>
                    )}
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                      {new Date(selectedRequest.moving_date).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                </div>
                <p className="text-sm text-slate-600 mb-4">
                  {selectedRequest.quotes.filter(q => q.status !== 'rejected').length} devis reçu{selectedRequest.quotes.filter(q => q.status !== 'rejected').length > 1 ? 's' : ''}
                </p>

                {/* Details Section */}
                <div className="bg-slate-50 rounded-lg p-4 mb-4">
                  <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Détails de la demande
                  </h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    {/* Departure */}
                    <div className="space-y-2">
                      <div className="flex items-start gap-2">
                        <MapPin className="w-4 h-4 text-blue-600 mt-1 flex-shrink-0" />
                        <div>
                          <p className="text-xs font-medium text-slate-500">Départ</p>
                          <p className="text-sm text-slate-800">{selectedRequest.from_address}</p>
                          <p className="text-sm text-slate-600">{selectedRequest.from_postal_code} {selectedRequest.from_city}</p>
                          {(selectedRequest.from_home_type || selectedRequest.floor_from !== undefined) && (
                            <div className="text-xs text-slate-500 mt-1">
                              {selectedRequest.from_home_type && <span>{selectedRequest.from_home_type}</span>}
                              {selectedRequest.from_home_size && <span> - {selectedRequest.from_home_size}</span>}
                              {selectedRequest.from_surface_m2 && <span> ({selectedRequest.from_surface_m2}m²)</span>}
                              {selectedRequest.floor_from !== undefined && (
                                <span className="block">
                                  Étage {selectedRequest.floor_from === 0 ? 'RDC' : selectedRequest.floor_from}
                                  {selectedRequest.elevator_from ? ' (avec ascenseur)' : ' (sans ascenseur)'}
                                </span>
                              )}
                              {selectedRequest.furniture_lift_needed_departure && (
                                <span className="block text-orange-600 font-medium">Monte-meuble nécessaire</span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    {/* Arrival */}
                    <div className="space-y-2">
                      <div className="flex items-start gap-2">
                        <MapPin className="w-4 h-4 text-green-600 mt-1 flex-shrink-0" />
                        <div>
                          <p className="text-xs font-medium text-slate-500">Arrivée</p>
                          <p className="text-sm text-slate-800">{selectedRequest.to_address}</p>
                          <p className="text-sm text-slate-600">{selectedRequest.to_postal_code} {selectedRequest.to_city}</p>
                          {(selectedRequest.to_home_type || selectedRequest.floor_to !== undefined) && (
                            <div className="text-xs text-slate-500 mt-1">
                              {selectedRequest.to_home_type && <span>{selectedRequest.to_home_type}</span>}
                              {selectedRequest.to_home_size && <span> - {selectedRequest.to_home_size}</span>}
                              {selectedRequest.to_surface_m2 && <span> ({selectedRequest.to_surface_m2}m²)</span>}
                              {selectedRequest.floor_to !== undefined && (
                                <span className="block">
                                  Étage {selectedRequest.floor_to === 0 ? 'RDC' : selectedRequest.floor_to}
                                  {selectedRequest.elevator_to ? ' (avec ascenseur)' : ' (sans ascenseur)'}
                                </span>
                              )}
                              {selectedRequest.furniture_lift_needed_arrival && (
                                <span className="block text-orange-600 font-medium">Monte-meuble nécessaire</span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Additional Info */}
                  <div className="mt-4 pt-3 border-t border-slate-200 grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                    {selectedRequest.volume_m3 && (
                      <div className="bg-white rounded-lg p-2">
                        <p className="text-slate-500">Volume</p>
                        <p className="font-semibold text-slate-800">{selectedRequest.volume_m3} m³</p>
                      </div>
                    )}
                    {selectedRequest.surface_m2 && (
                      <div className="bg-white rounded-lg p-2">
                        <p className="text-slate-500">Surface</p>
                        <p className="font-semibold text-slate-800">{selectedRequest.surface_m2} m²</p>
                      </div>
                    )}
                    {selectedRequest.date_flexibility_days !== undefined && selectedRequest.date_flexibility_days > 0 && (
                      <div className="bg-white rounded-lg p-2">
                        <p className="text-slate-500">Flexibilité</p>
                        <p className="font-semibold text-slate-800">±{selectedRequest.date_flexibility_days} jours</p>
                      </div>
                    )}
                    {selectedRequest.accepts_groupage !== undefined && (
                      <div className="bg-white rounded-lg p-2">
                        <p className="text-slate-500">Groupage</p>
                        <p className={`font-semibold ${selectedRequest.accepts_groupage ? 'text-green-600' : 'text-slate-600'}`}>
                          {selectedRequest.accepts_groupage ? 'Accepté' : 'Non souhaité'}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Services */}
                  {selectedRequest.services_needed && selectedRequest.services_needed.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-slate-200">
                      <p className="text-xs text-slate-500 mb-2">Services demandés</p>
                      <div className="flex flex-wrap gap-2">
                        {selectedRequest.services_needed.map((service, idx) => (
                          <span key={idx} className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs">
                            {service}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Additional Info */}
                  {selectedRequest.additional_info && (
                    <div className="mt-3 pt-3 border-t border-slate-200">
                      <p className="text-xs text-slate-500 mb-1">Informations complémentaires</p>
                      <p className="text-sm text-slate-700">{selectedRequest.additional_info}</p>
                    </div>
                  )}
                </div>
              </div>

              {selectedRequest.quotes.filter(q => q.status !== 'rejected').length > 1 && (
                <div className="mb-6">
                  <QuoteComparison
                    quoteRequestId={selectedRequest.id}
                    onAcceptQuote={(quoteId) => handleAcceptQuote(quoteId, selectedRequest.id)}
                  />
                </div>
              )}

              {user && (
                <div className="mb-6">
                  <InventoryManager
                    quoteRequestId={selectedRequest.id}
                    userId={user.id}
                    readOnly={selectedRequest.status === 'accepted' || selectedRequest.status === 'completed'}
                  />
                </div>
              )}

              <div className="grid gap-4">
                {selectedRequest.quotes
                  .filter(quote => quote.status !== 'rejected')
                  .filter(quote => {
                    if (filterStatus === 'all') return true;
                    return quote.status === filterStatus;
                  })
                  .sort((a, b) => {
                    if (sortBy === 'price') {
                      return a.client_display_price - b.client_display_price;
                    } else if (sortBy === 'date') {
                      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
                    } else if (sortBy === 'rating') {
                      const ratingA = a.movers.average_rating || 0;
                      const ratingB = b.movers.average_rating || 0;
                      return ratingB - ratingA;
                    }
                    return 0;
                  })
                  .map((quote, quoteIndex) => {
                    const moverNumber = quoteIndex + 1;

                    return (
                      <div
                        key={quote.id}
                        className={`border-2 rounded-lg p-6 border-slate-200 bg-white ${quote.status === 'accepted' ? 'ring-2 ring-green-500 bg-green-50/30' : ''}`}
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center font-bold text-slate-700">
                              {moverNumber}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                {(() => {
                                  const hasPaidPayment = quote.payments && quote.payments.length > 0 &&
                                    quote.payments.some(p => p.payment_status === 'completed' || p.payment_status === 'deposit_released' || p.payment_status === 'released_to_mover');
                                  const isRequestPaid = selectedRequest.payment_status === 'deposit_paid' || selectedRequest.payment_status === 'fully_paid';
                                  const showRealName = (quote.status === 'accepted' && (hasPaidPayment || isRequestPaid));
                                  
                                  return showRealName ? (
                                    <button
                                      onClick={() => fetchMoverDetails(quote.mover_id)}
                                      className="font-semibold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer flex items-center gap-1"
                                    >
                                      {quote.movers.company_name || `Déménageur ${moverNumber}`}
                                      <Building className="w-4 h-4" />
                                    </button>
                                  ) : (
                                    <h3 className="font-semibold text-slate-900">
                                      Déménageur {moverNumber}
                                    </h3>
                                  );
                                })()}
                                {quote.movers.average_rating && (
                                  <div className="flex items-center gap-1 bg-yellow-50 px-2 py-0.5 rounded-full">
                                    <Star className="w-3 h-3 text-yellow-600 fill-yellow-600" />
                                    <span className="text-xs font-semibold text-yellow-700">
                                      {quote.movers.average_rating.toFixed(1)}
                                    </span>
                                  </div>
                                )}
                              </div>
                              {quote.status === 'accepted' && (
                                <span className="inline-flex items-center gap-1 text-xs text-green-700 mt-1">
                                  <CheckCircle className="w-3 h-3" />
                                  Devis accepté
                                </span>
                              )}
                              {quote.status === 'pending' && (
                                <span className="inline-flex items-center gap-1 text-xs text-amber-700 mt-1">
                                  <Clock className="w-3 h-3" />
                                  En attente
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {quote.proposed_moving_date && (
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-blue-600" />
                              <div>
                                <p className="text-xs font-medium text-blue-900">Date proposée par le déménageur</p>
                                <p className="text-sm font-semibold text-blue-700">
                                  {new Date(quote.proposed_moving_date).toLocaleDateString('fr-FR', {
                                    weekday: 'long',
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                  })}
                                </p>
                              </div>
                            </div>
                          </div>
                        )}

                        <div className="bg-white rounded-lg p-4 mb-4">
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-slate-600">Prix total</span>
                            <span className="text-3xl font-bold text-slate-900">
                              {quote.client_display_price.toFixed(2)} €
                            </span>
                          </div>

                          <div className="space-y-2 text-sm border-t pt-3">
                            <div className="flex justify-between text-slate-600">
                              <span>Acompte (40% à verser maintenant)</span>
                              <span className="font-semibold">
                                {(quote.client_display_price * 0.4).toFixed(2)} €
                              </span>
                            </div>
                            <div className="flex justify-between text-slate-600">
                              <span>Reste à payer au déménageur (60%)</span>
                              <span className="font-semibold">
                                {(quote.client_display_price * 0.6).toFixed(2)} €
                              </span>
                            </div>
                          </div>

                        </div>

                        {quote.notes && (
                          <div className="bg-white rounded-lg p-4 mb-4">
                            <p className="text-sm font-medium text-slate-700 mb-2">Message du déménageur:</p>
                            <p className="text-slate-600 text-sm whitespace-pre-wrap">{quote.notes}</p>
                          </div>
                        )}

                        {(() => {
                          const hasPaidPayment = quote.payments && quote.payments.length > 0 &&
                            quote.payments.some(p => p.payment_status === 'completed' || p.payment_status === 'deposit_released' || p.payment_status === 'released_to_mover');
                          const isRequestPaid = selectedRequest.payment_status === 'completed';

                          if (hasPaidPayment || isRequestPaid) {
                            return (
                              <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
                                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                                <div>
                                  <p className="text-sm font-medium text-green-900 mb-1">
                                    Déménagement confirmé
                                  </p>
                                  <p className="text-xs text-green-700">
                                    Votre acompte a été versé avec succès. Le déménageur a reçu vos coordonnées.
                                  </p>
                                </div>
                              </div>
                            );
                          }

                          if (quote.status === 'expired') {
                            return (
                              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 flex items-start gap-3">
                                <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                                <div>
                                  <p className="text-sm font-medium text-orange-900 mb-1">
                                    Devis expiré
                                  </p>
                                  <p className="text-xs text-orange-700">
                                    Ce devis n'est plus valide car vous avez modifié votre demande. Le déménageur a été notifié et peut soumettre un nouveau devis adapté.
                                  </p>
                                </div>
                              </div>
                            );
                          }

                          if (quote.status === 'expired') {
                            return (
                              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 flex items-start gap-3">
                                <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                                <div>
                                  <p className="text-sm font-medium text-orange-900 mb-1">
                                    Devis expiré
                                  </p>
                                  <p className="text-xs text-orange-700">
                                    Vous avez modifié votre demande. Le déménageur a été notifié et vous recevrez un nouveau devis adapté à vos modifications.
                                  </p>
                                </div>
                              </div>
                            );
                          }

                          if (quote.status === 'pending') {
                            return (
                              <div className="flex gap-3">
                                <button
                                  onClick={() => handleAcceptQuote(quote.id, selectedRequest.id)}
                                  disabled={processingAcceptance || processingRejection}
                                  className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                  {processingAcceptance ? (
                                    <>
                                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                      Traitement...
                                    </>
                                  ) : (
                                    <>
                                      <CheckCircle className="w-5 h-5" />
                                      Accepter ce devis
                                    </>
                                  )}
                                </button>
                                <button
                                  onClick={() => setConfirmRejectQuoteId(quote.id)}
                                  disabled={processingAcceptance || processingRejection}
                                  className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                  {processingRejection ? (
                                    <>
                                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                      Refus...
                                    </>
                                  ) : (
                                    <>
                                      <X className="w-5 h-5" />
                                      Refuser ce devis
                                    </>
                                  )}
                                </button>
                              </div>
                            );
                          }

                          if (quote.status === 'accepted') {
                            return (
                              <div className="space-y-3">
                                <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
                                  <AlertCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                                  <div>
                                    <p className="text-sm font-medium text-green-900 mb-1">
                                      Vous avez accepté ce devis
                                    </p>
                                    <p className="text-xs text-green-700">
                                      Veuillez procéder au paiement de l'acompte pour confirmer votre réservation.
                                    </p>
                                  </div>
                                </div>
                                <button
                                  onClick={() => setMessagingQuote({
                                    quoteRequestId: selectedRequest.id,
                                    moverId: quote.mover_id
                                  })}
                                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium"
                                >
                                  <MessageCircle className="w-4 h-4" />
                                  Contacter le déménageur
                                </button>
                              </div>
                            );
                          }

                          if (quote.status === 'rejected') {
                            return (
                              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                                <X className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                                <div>
                                  <p className="text-sm font-medium text-red-900 mb-1">
                                    Devis refusé
                                  </p>
                                  <p className="text-xs text-red-700">
                                    Vous avez refusé ce devis.
                                  </p>
                                </div>
                              </div>
                            );
                          }

                          return null;
                        })()}
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        )}
      </div>

      {showInventoryModal && selectedRequestForInventory && (
        <FurnitureInventoryModal
          inventory={selectedRequestForInventory.furniture_inventory}
          onClose={() => {
            setShowInventoryModal(false);
            setSelectedRequestForInventory(null);
          }}
          requestInfo={{
            from_city: selectedRequestForInventory.from_city,
            to_city: selectedRequestForInventory.to_city,
            moving_date: selectedRequestForInventory.moving_date,
            volume_m3: selectedRequestForInventory.volume_m3
          }}
        />
      )}

      <ConfirmationModal
        isOpen={confirmRejectQuoteId !== null}
        title="Refuser ce devis"
        message="Êtes-vous sûr de vouloir refuser ce devis ? Cette action est irréversible."
        type="danger"
        confirmText="Valider"
        cancelText="Annuler"
        onConfirm={() => {
          if (confirmRejectQuoteId) {
            handleRejectQuote(confirmRejectQuoteId);
          }
        }}
        onCancel={() => setConfirmRejectQuoteId(null)}
      />

      {/* Mover Details Modal */}
      {showMoverDetails && selectedMoverDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between rounded-t-2xl">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <Building className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{selectedMoverDetails.company_name}</h2>
                  <p className="text-sm text-gray-500">Votre déménageur</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowMoverDetails(false);
                  setSelectedMoverDetails(null);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Rating */}
              {selectedMoverDetails.average_rating && (
                <div className="flex items-center gap-3 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                  <Star className="w-8 h-8 text-yellow-500 fill-yellow-500" />
                  <div>
                    <div className="text-2xl font-bold text-yellow-700">{selectedMoverDetails.average_rating.toFixed(1)}/5</div>
                    <div className="text-sm text-yellow-600">{selectedMoverDetails.total_moves || 0} déménagements réalisés</div>
                  </div>
                </div>
              )}

              {/* Contact Info */}
              <div className="space-y-3">
                <h3 className="font-semibold text-gray-900">Coordonnées</h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <Phone className="w-5 h-5 text-blue-600" />
                    <a href={`tel:${selectedMoverDetails.phone}`} className="text-blue-600 hover:underline font-medium">
                      {selectedMoverDetails.phone}
                    </a>
                  </div>
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-blue-600" />
                    <a href={`mailto:${selectedMoverDetails.email}`} className="text-blue-600 hover:underline font-medium">
                      {selectedMoverDetails.email}
                    </a>
                  </div>
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">
                      {selectedMoverDetails.address}, {selectedMoverDetails.postal_code} {selectedMoverDetails.city}
                    </span>
                  </div>
                </div>
              </div>

              {/* Company Info */}
              <div className="space-y-3">
                <h3 className="font-semibold text-gray-900">Informations entreprise</h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Responsable</span>
                    <span className="font-medium text-gray-900">
                      {selectedMoverDetails.manager_firstname} {selectedMoverDetails.manager_lastname}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">SIRET</span>
                    <span className="font-mono text-gray-900">{selectedMoverDetails.siret}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t bg-gray-50 rounded-b-2xl">
              <button
                onClick={() => {
                  setShowMoverDetails(false);
                  setSelectedMoverDetails(null);
                }}
                className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {messagingQuote && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-2xl">
            <MessagingInterface
              quoteRequestId={messagingQuote.quoteRequestId}
              moverId={messagingQuote.moverId}
              userType="client"
              onClose={() => setMessagingQuote(null)}
            />
          </div>
        </div>
      )}
    </ClientLayout>
  );
}
