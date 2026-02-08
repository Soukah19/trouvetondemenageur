import { useState, useEffect } from 'react';
import { LogOut, Package, Plus, MapPin, Calendar, Home, Euro, CheckCircle, Clock, Truck, Camera, MessageCircle, Star, ArrowLeft, Trash2, AlertTriangle, X, Edit, CreditCard, Download, FileText, Receipt, Map, Eye, EyeOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase, QuoteRequest, Quote, Mover } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useNavigationHelpers } from '../hooks/useNavigationHelpers';
import { MessagingInterface } from '../components/MessagingInterface';
import { ReviewModal } from '../components/ReviewModal';
import { NotificationBell } from '../components/NotificationBell';
import { StatsCard } from '../components/StatsCard';
import DarkModeToggle from '../components/DarkModeToggle';
import ActivityTimeline from '../components/ActivityTimeline';
import { DistanceDisplay } from '../components/DistanceDisplay';
import { showToast } from '../utils/toast';
import { generateContractPDF, buildContractPDFData } from '../utils/generateContractPDF';
import { ConfirmationModal } from '../components/ConfirmationModal';
import RouteMap from '../components/RouteMap';
import { ClientLayout } from '../components/ClientLayout';

type QuoteWithMover = Quote & {
  mover?: Mover;
};

type RequestWithQuotes = QuoteRequest & {
  quotes?: QuoteWithMover[];
};

export function ClientDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { handleClientLogout } = useNavigationHelpers();
  const [requests, setRequests] = useState<RequestWithQuotes[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMessageQuote, setSelectedMessageQuote] = useState<{ quoteId: string; moverId: string; quoteRequestId: string } | null>(null);
  const [selectedReviewQuote, setSelectedReviewQuote] = useState<{ quoteId: string; moverId: string; quoteRequestId: string; moverName: string } | null>(null);
  const [reviewedQuotes, setReviewedQuotes] = useState<Set<string>>(new Set());
  const [processingAcceptance, setProcessingAcceptance] = useState(false);
  const [processingRejection, setProcessingRejection] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'accepted' | 'with_quotes'>('all');
  const [deletingRequestId, setDeletingRequestId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [confirmRejectQuoteId, setConfirmRejectQuoteId] = useState<string | null>(null);
  const [highlightedRequestId, setHighlightedRequestId] = useState<string | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [visibleMaps, setVisibleMaps] = useState<Set<string>>(new Set());
  const [selectedPaymentInfo, setSelectedPaymentInfo] = useState<{
    totalAmount: number;
    depositPaid: number;
    remainingAmount: number;
    moverName: string;
    movingDate: string;
    missionCompleted: boolean;
    missionStatus: string;
  } | null>(null);

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
      loadClientData();
      loadReviewedQuotes();
    }
  }, [user]);

  const loadReviewedQuotes = async () => {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select('quote_id')
        .eq('client_id', user?.id);

      if (error) throw error;
      setReviewedQuotes(new Set(data.map(r => r.quote_id)));
    } catch (error) {
      console.error('Error loading reviewed quotes:', error);
    }
  };

  const loadClientData = async () => {
    try {
      const { data: requestsData, error: requestsError } = await supabase
        .from('quote_requests')
        .select('*')
        .eq('client_user_id', user?.id)
        .order('created_at', { ascending: false });

      if (requestsError) throw requestsError;

      if (requestsData) {
        const requestsWithQuotes = await Promise.all(
          requestsData.map(async (request) => {
            const { data: quotesData, error: quotesError } = await supabase
              .from('quotes')
              .select('*')
              .eq('quote_request_id', request.id)
              .order('created_at', { ascending: false });

            if (quotesError) throw quotesError;

            const quotesWithMovers = await Promise.all(
              (quotesData || []).map(async (quote) => {
                const { data: moverData, error: moverError } = await supabase
                  .from('movers')
                  .select('*')
                  .eq('id', quote.mover_id)
                  .maybeSingle();

                if (moverError) throw moverError;

                return {
                  ...quote,
                  mover: moverData || undefined
                };
              })
            );

            return {
              ...request,
              quotes: quotesWithMovers
            };
          })
        );

        setRequests(requestsWithQuotes);
      }
    } catch (error) {
      console.error('Error loading client data:', error);
    } finally {
      setLoading(false);
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
        showToast('Devis introuvable', 'error');
        setProcessingAcceptance(false);
        return;
      }

      if (quoteData.status === 'expired') {
        showToast('Ce devis a expiré car vous avez modifié votre demande. Veuillez attendre un nouveau devis du déménageur.', 'error');
        setProcessingAcceptance(false);
        return;
      }

      if (quoteData.status === 'accepted') {
        // Quote already accepted, check if payment is done
        const { data: paymentData } = await supabase
          .from('payments')
          .select('payment_status')
          .eq('quote_id', quoteId)
          .maybeSingle();

        if (paymentData?.payment_status === 'completed' || paymentData?.payment_status === 'fully_paid') {
          showToast('Ce devis est déjà accepté et payé', 'info');
          setProcessingAcceptance(false);
          return;
        }
        // Payment not done, redirect to payment page
        navigate(`/client/payment/${quoteId}`);
        return;
      }

      if (quoteData.status !== 'pending') {
        showToast('Ce devis n\'est plus disponible.', 'error');
        setProcessingAcceptance(false);
        return;
      }

      const currentDate = new Date();
      const validityDate = new Date(quoteData.validity_date);
      // Set validity to end of day to allow same-day acceptance
      validityDate.setHours(23, 59, 59, 999);
      if (currentDate > validityDate) {
        showToast('Ce devis a expiré. Veuillez demander un nouveau devis au déménageur.', 'error');
        setProcessingAcceptance(false);
        return;
      }

      // Don't update status here - let the payment page handle it after payment
      navigate(`/client/payment/${quoteId}`);
    } catch (error) {
      console.error('Error accepting quote:', error);
      showToast('Erreur lors de l\'acceptation du devis', 'error');
    } finally {
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

      setRequests(prevRequests =>
        prevRequests.map(request => {
          if (!request.quotes) return request;

          return {
            ...request,
            quotes: request.quotes.filter(quote => quote.id !== quoteId)
          };
        })
      );

      showToast('Devis refusé', 'success');
    } catch (error) {
      console.error('Error rejecting quote:', error);
      showToast('Erreur lors du refus du devis', 'error');
    } finally {
      setProcessingRejection(false);
    }
  };

  const handleDeleteRequest = async (requestId: string) => {
    if (confirmDeleteId !== requestId) {
      setConfirmDeleteId(requestId);
      return;
    }

    setDeletingRequestId(requestId);
    try {
      const request = requests.find(r => r.id === requestId);

      if (request?.status === 'accepted' || request?.status === 'completed') {
        showToast('Impossible de supprimer une demande acceptée ou terminée', 'error');
        setConfirmDeleteId(null);
        setDeletingRequestId(null);
        return;
      }

      const { error } = await supabase
        .from('quote_requests')
        .delete()
        .eq('id', requestId);

      if (error) throw error;

      showToast('Demande supprimée avec succès', 'success');
      setConfirmDeleteId(null);
      await loadClientData();
    } catch (error) {
      console.error('Error deleting request:', error);
      showToast('Erreur lors de la suppression de la demande', 'error');
    } finally {
      setDeletingRequestId(null);
    }
  };

  const scrollToRequest = (quoteRequestId: string) => {
    const element = document.getElementById(`request-${quoteRequestId}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setHighlightedRequestId(quoteRequestId);
      setTimeout(() => setHighlightedRequestId(null), 3000);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      new: 'bg-blue-100 text-blue-800',
      assigned: 'bg-yellow-100 text-yellow-800',
      quoted: 'bg-purple-100 text-purple-800',
      accepted: 'bg-green-100 text-green-800',
      completed: 'bg-gray-100 text-gray-800',
      cancelled: 'bg-red-100 text-red-800'
    };

    const labels = {
      new: 'En attente',
      assigned: 'Assignée',
      quoted: 'Propositions reçues',
      accepted: 'Acceptée',
      completed: 'Terminée',
      cancelled: 'Annulée'
    };

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${styles[status as keyof typeof styles]}`}>
        {labels[status as keyof typeof labels]}
      </span>
    );
  };

  if (loading) {
    return (
      <ClientLayout title="Tableau de bord">
        <div className="flex items-center justify-center py-32">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </ClientLayout>
    );
  }

  return (
    <ClientLayout title="Tableau de bord">
      <div className="max-w-7xl mx-auto">
        {requests.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatsCard
              title="Demandes totales"
              value={requests.length}
              icon={Package}
              color="blue"
              onClick={() => setStatusFilter('all')}
            />
            <StatsCard
              title="En attente"
              value={requests.filter(r => r.status === 'new' || r.status === 'quoted').length}
              icon={Clock}
              color="yellow"
              onClick={() => setStatusFilter('pending')}
            />
            <StatsCard
              title="Acceptées"
              value={requests.filter(r => r.status === 'accepted').length}
              icon={CheckCircle}
              color="green"
              onClick={() => setStatusFilter('accepted')}
            />
            <StatsCard
              title="Devis reçus"
              value={requests.reduce((sum, r) => sum + (r.quotes?.length || 0), 0)}
              icon={Euro}

              color="green"
              onClick={() => setStatusFilter('with_quotes')}
            />
          </div>
        )}

        {requests.length > 0 && user && (
          <div className="mb-8">
            <div className="bg-white rounded-lg shadow-md p-6">
              <ActivityTimeline userId={user.id} />
            </div>
          </div>
        )}

        <h2 className="text-2xl font-bold text-gray-900 mb-6">Mes demandes de devis</h2>

        {requests.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 text-lg mb-4">Aucune demande de devis pour le moment</p>
            <button
              onClick={() => navigate('/client/quote')}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition font-semibold"
            >
              Créer ma première demande
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {requests
              .filter((request) => {
                if (statusFilter === 'all') return true;
                if (statusFilter === 'pending') return request.status === 'new' || request.status === 'quoted';
                if (statusFilter === 'accepted') return request.status === 'accepted';
                if (statusFilter === 'with_quotes') return request.quotes && request.quotes.length > 0;
                return true;
              })
              .map((request) => (
              <div
                id={`request-${request.id}`}
                key={request.id}
                className={`bg-white rounded-lg shadow-md overflow-hidden transition-all duration-300 ${
                  highlightedRequestId === request.id ? 'ring-4 ring-blue-500 ring-opacity-50' : ''
                }`}
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        Déménagement du {new Date(request.moving_date).toLocaleDateString('fr-FR')}
                      </h3>
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-4 h-4" />
                          <span>Demandé le {new Date(request.created_at).toLocaleDateString('fr-FR')}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {request.status !== 'completed' && request.status !== 'accepted' && (
                        <>
                          <button
                            onClick={() => navigate(`/client/quote/${request.id}/edit`)}
                            className="px-3 py-1.5 bg-blue-100 text-blue-700 text-xs rounded-lg hover:bg-blue-200 transition font-medium flex items-center gap-1"
                          >
                            <Edit className="w-3 h-3" />
                            <span>Modifier</span>
                          </button>
                          {confirmDeleteId === request.id ? (
                            <button
                              onClick={() => handleDeleteRequest(request.id)}
                              disabled={deletingRequestId === request.id}
                              className="px-3 py-1.5 bg-red-600 text-white text-xs rounded-lg hover:bg-red-700 transition font-medium flex items-center gap-1"
                            >
                              {deletingRequestId === request.id ? (
                                <>
                                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                                  <span>Suppression...</span>
                                </>
                              ) : (
                                <>
                                  <AlertTriangle className="w-3 h-3" />
                                  <span>Confirmer ?</span>
                                </>
                              )}
                            </button>
                          ) : (
                            <button
                              onClick={() => handleDeleteRequest(request.id)}
                              className="px-3 py-1.5 bg-red-100 text-red-700 text-xs rounded-lg hover:bg-red-200 transition font-medium flex items-center gap-1"
                            >
                              <Trash2 className="w-3 h-3" />
                              <span>Supprimer</span>
                            </button>
                          )}
                        </>
                      )}
                      {getStatusBadge(request.status)}
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4 mb-4">
                    <div className="flex items-start space-x-3">
                      <MapPin className="w-5 h-5 text-blue-600 flex-shrink-0 mt-1" />
                      <div>
                        <p className="text-sm font-medium text-gray-700">Départ</p>
                        <p className="text-sm text-gray-600">
                          {request.from_city} {request.from_postal_code}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3">
                      <MapPin className="w-5 h-5 text-green-600 flex-shrink-0 mt-1" />
                      <div>
                        <p className="text-sm font-medium text-gray-700">Arrivée</p>
                        <p className="text-sm text-gray-600">
                          {request.to_city} {request.to_postal_code}
                        </p>
                      </div>
                    </div>
                  </div>

                  {request.from_address && request.to_address && (
                    <div className="mb-4">
                      <DistanceDisplay
                        fromAddress={request.from_address}
                        fromCity={request.from_city}
                        fromPostalCode={request.from_postal_code}
                        toAddress={request.to_address}
                        toCity={request.to_city}
                        toPostalCode={request.to_postal_code}
                        showDuration={true}
                      />
                    </div>
                  )}

                  {/* Route Map Toggle Button & Map */}
                  {request.from_city && request.to_city && (
                    <div className="mb-4">
                      <button
                        onClick={() => toggleMapVisibility(request.id)}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition text-sm font-medium mb-2"
                      >
                        {visibleMaps.has(request.id) ? (
                          <>
                            <EyeOff className="w-4 h-4" />
                            Masquer le trajet
                          </>
                        ) : (
                          <>
                            <Map className="w-4 h-4" />
                            Voir le trajet
                          </>
                        )}
                      </button>
                      
                      {visibleMaps.has(request.id) && (
                        <div className="rounded-lg overflow-hidden border border-gray-200 shadow-sm animate-fadeIn">
                          <div className="h-[200px]">
                            <RouteMap
                              fromAddress={request.from_address || request.from_city}
                              fromCity={request.from_city}
                              fromPostalCode={request.from_postal_code}
                              toAddress={request.to_address || request.to_city}
                              toCity={request.to_city}
                              toPostalCode={request.to_postal_code}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex items-center space-x-4 text-sm text-gray-600 mb-4">
                    <div className="flex items-center space-x-1">
                      <Home className="w-4 h-4" />
                      <span>{request.home_size} - {request.home_type}</span>
                    </div>
                  </div>

                  {request.quotes && request.quotes.filter(q => q.status !== 'rejected').length > 0 && (
                    <div className="border-t pt-4 mt-4">
                      <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                        <Euro className="w-5 h-5 mr-2 text-green-600" />
                        Propositions reçues ({request.quotes.filter(q => q.status !== 'rejected').length})
                      </h4>
                      <div className="space-y-3">
                        {request.quotes.filter(q => q.status !== 'rejected').map((quote, quoteIndex) => (
                          <div
                            key={quote.id}
                            className="bg-gray-50 rounded-lg p-4 border border-gray-200"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h5 className="font-semibold text-gray-900 mb-1">
                                  {quote.status === 'accepted'
                                    ? (quote.mover?.company_name || 'Déménageur')
                                    : `Déménageur ${quoteIndex + 1}`
                                  }
                                </h5>
                                {quote.message && (
                                  <p className="text-sm text-gray-600 mb-2">{quote.message}</p>
                                )}
                                <div className="flex items-center space-x-4 text-xs text-gray-500">
                                  <span className="flex items-center space-x-1">
                                    <Clock className="w-3 h-3" />
                                    <span>Valide jusqu'au {new Date(quote.validity_date).toLocaleDateString('fr-FR')}</span>
                                  </span>
                                </div>
                              </div>
                              <div className="text-right ml-4">
                                <div className="text-2xl font-bold text-green-600">
                                  {(quote.client_display_price || Math.round(quote.price * 1.3)).toLocaleString('fr-FR')} €
                                </div>
                                {quote.status === 'pending' && (
                                  <div className="mt-2 flex gap-2">
                                    <button
                                      onClick={() => handleAcceptQuote(quote.id, request.id)}
                                      disabled={processingAcceptance || processingRejection}
                                      className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                      {processingAcceptance ? 'Traitement...' : 'Accepter'}
                                    </button>
                                    <button
                                      onClick={() => setConfirmRejectQuoteId(quote.id)}
                                      disabled={processingAcceptance || processingRejection}
                                      className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1"
                                    >
                                      <X className="w-4 h-4" />
                                      <span>Refuser</span>
                                    </button>
                                  </div>
                                )}
                                {quote.status === 'accepted' && (
                                  <div className="mt-2 space-y-2">
                                    <div className="flex items-center space-x-1 text-green-600 text-sm">
                                      <CheckCircle className="w-4 h-4" />
                                      <span>Accepté</span>
                                    </div>
                                    
                                    {/* Show payment button if not paid */}
                                    {request.payment_status !== 'deposit_paid' && request.payment_status !== 'fully_paid' && (
                                      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-2">
                                        <p className="text-amber-800 text-xs mb-2">
                                          Veuillez effectuer le paiement de l'acompte pour confirmer votre déménagement.
                                        </p>
                                        <button
                                          onClick={() => navigate(`/client/payment/${quote.id}`)}
                                          className="w-full flex items-center justify-center space-x-1 bg-amber-600 text-white px-3 py-2 rounded hover:bg-amber-700 transition text-sm font-medium"
                                        >
                                          <CreditCard className="w-4 h-4" />
                                          <span>Payer l'acompte</span>
                                        </button>
                                      </div>
                                    )}
                                    
                                    <div className="flex items-center space-x-2 flex-wrap gap-2">
                                      {/* Message only works if payment is done */}
                                      {(request.payment_status === 'deposit_paid' || request.payment_status === 'fully_paid') ? (
                                        <button
                                          onClick={() => setSelectedMessageQuote({ quoteId: quote.id, moverId: quote.mover_id, quoteRequestId: request.id })}
                                          className="flex items-center space-x-1 bg-green-600 text-white px-3 py-1.5 rounded hover:bg-green-700 transition text-xs"
                                        >
                                          <MessageCircle className="w-3 h-3" />
                                          <span>Message</span>
                                        </button>
                                      ) : (
                                        <button
                                          disabled
                                          className="flex items-center space-x-1 bg-gray-300 text-gray-500 px-3 py-1.5 rounded cursor-not-allowed text-xs"
                                          title="Effectuez le paiement pour débloquer la messagerie"
                                        >
                                          <MessageCircle className="w-3 h-3" />
                                          <span>Message</span>
                                        </button>
                                      )}
                                      
                                      {/* Download contract button - only works if payment is done */}
                                      {(request.payment_status === 'deposit_paid' || request.payment_status === 'fully_paid') ? (
                                        <button
                                          onClick={async () => {
                                            try {
                                              showToast('Chargement du contrat...', 'info');
                                              
                                              // Try to find contract by quote_id first
                                              let contractData: any = null;
                                              const { data: byQuoteId } = await supabase
                                                .from('contracts')
                                                .select('*')
                                                .eq('quote_id', quote.id)
                                                .maybeSingle();
                                              
                                              if (byQuoteId) {
                                                contractData = byQuoteId;
                                              } else {
                                                // Try by quote_request_id
                                                const { data: byReqId } = await supabase
                                                  .from('contracts')
                                                  .select('*')
                                                  .eq('quote_request_id', request.id)
                                                  .maybeSingle();
                                                
                                                if (byReqId) {
                                                  contractData = byReqId;
                                                }
                                              }

                                              // If still no contract found, create it from payment data
                                              if (!contractData) {
                                                const { data: paymentData } = await supabase
                                                  .from('payments')
                                                  .select('*')
                                                  .eq('quote_id', quote.id)
                                                  .maybeSingle();
                                                
                                                if (!paymentData) {
                                                  showToast('Contrat non trouvé - paiement en attente', 'error');
                                                  return;
                                                }

                                                const contractText = `CONTRAT DE DÉMÉNAGEMENT - TTD-${Date.now().toString(36).toUpperCase()}
================================================================================

Date de création: ${new Date().toLocaleDateString('fr-FR')}

INFORMATIONS CLIENT
-------------------
Nom: ${request.client_name || 'N/A'}
Email: ${request.client_email || 'N/A'}
Téléphone: ${request.client_phone || 'N/A'}

INFORMATIONS DÉMÉNAGEUR
-----------------------
Société: ${quote.mover?.company_name || 'N/A'}

DÉTAILS DU DÉMÉNAGEMENT
-----------------------
Date prévue: ${new Date(request.moving_date).toLocaleDateString('fr-FR')}
Trajet: ${request.from_city || 'N/A'} → ${request.to_city || 'N/A'}

Adresse de départ:
${request.from_address || 'N/A'}
${request.from_postal_code || ''} ${request.from_city || ''}
Étage: ${request.floor_from ?? 'RDC'} | Ascenseur: ${request.elevator_from ? 'Oui' : 'Non'}

Adresse d'arrivée:
${request.to_address || 'N/A'}
${request.to_postal_code || ''} ${request.to_city || ''}
Étage: ${request.floor_to ?? 'RDC'} | Ascenseur: ${request.elevator_to ? 'Oui' : 'Non'}

Type de logement: ${request.home_size || 'N/A'}
Volume estimé: ${request.volume_m3 || 'N/A'} m³
Services: ${request.services_needed?.join(', ') || 'Aucun'}

INFORMATIONS FINANCIÈRES
------------------------
Montant total: ${paymentData.total_amount?.toLocaleString('fr-FR')} €
Acompte versé: ${(paymentData.deposit_amount || paymentData.amount_paid)?.toLocaleString('fr-FR')} €
Solde à régler: ${paymentData.remaining_amount?.toLocaleString('fr-FR')} €

================================================================================
Ce document est un contrat de déménagement généré par TrouveTonDéménageur.`;

                                                // Try new schema first, then old
                                                let newContract: any = null;
                                                const contractNum = `TTD-${Date.now().toString(36).toUpperCase()}`;
                                                const contractDataJson = {
                                                  client: { name: request.client_name, email: request.client_email, phone: request.client_phone },
                                                  mover: { company_name: quote.mover?.company_name || 'N/A' },
                                                  departure: { city: request.from_city, address: request.from_address, postal_code: request.from_postal_code },
                                                  arrival: { city: request.to_city, address: request.to_address, postal_code: request.to_postal_code },
                                                  financial: { total_amount: paymentData.total_amount, deposit_amount: paymentData.deposit_amount || paymentData.amount_paid, remaining_amount: paymentData.remaining_amount },
                                                  moving_date: request.moving_date,
                                                };
                                                
                                                const { data: newSchemaResult, error: newSchemaErr } = await supabase
                                                  .from('contracts')
                                                  .insert({
                                                    quote_request_id: request.id,
                                                    quote_id: quote.id,
                                                    client_user_id: user?.id,
                                                    mover_id: paymentData.mover_id || quote.mover_id,
                                                    contract_number: contractNum,
                                                    contract_data: contractDataJson,
                                                    contract_text: contractText,
                                                    status: 'active',
                                                  })
                                                  .select()
                                                  .maybeSingle();

                                                if (newSchemaResult) {
                                                  newContract = newSchemaResult;
                                                } else if (newSchemaErr) {
                                                  const { data: oldResult } = await supabase
                                                    .from('contracts')
                                                    .insert({
                                                      quote_id: quote.id,
                                                      client_id: paymentData.client_id || user?.id,
                                                      mover_id: paymentData.mover_id || quote.mover_id,
                                                      contract_text: contractText,
                                                      status: 'pending_signature'
                                                    })
                                                    .select()
                                                    .maybeSingle();
                                                  newContract = oldResult;
                                                }

                                                if (!newContract) {
                                                  console.error('Error creating contract');
                                                  showToast('Erreur lors de la création du contrat', 'error');
                                                  return;
                                                }
                                                contractData = newContract;
                                              }
                                              
                                              if (!contractData) {
                                                showToast('Contrat non trouvé', 'error');
                                                return;
                                              }
                                              
                                              // Download contract as professional PDF
                                              // Get full quote request and mover data for PDF
                                              const { data: fullRequest } = await supabase
                                                .from('quote_requests')
                                                .select('*')
                                                .eq('id', request.id)
                                                .maybeSingle();
                                              
                                              const { data: moverInfo } = await supabase
                                                .from('movers')
                                                .select('*')
                                                .eq('id', quote.mover_id)
                                                .maybeSingle();
                                              
                                              const { data: paymentInfo } = await supabase
                                                .from('payments')
                                                .select('*')
                                                .eq('quote_id', quote.id)
                                                .maybeSingle();

                                              const pdfData = buildContractPDFData(
                                                contractData,
                                                fullRequest || request,
                                                quote,
                                                moverInfo,
                                                paymentInfo
                                              );
                                              generateContractPDF(pdfData);
                                              
                                              showToast('Contrat téléchargé', 'success');
                                            } catch (err) {
                                              console.error('Error downloading contract:', err);
                                              showToast('Erreur lors du téléchargement', 'error');
                                            }
                                          }}
                                          className="flex items-center space-x-1 bg-purple-600 text-white px-3 py-1.5 rounded hover:bg-purple-700 transition text-xs"
                                        >
                                          <FileText className="w-3 h-3" />
                                          <span>Contrat</span>
                                        </button>
                                      ) : (
                                        <button
                                          disabled
                                          className="flex items-center space-x-1 bg-gray-300 text-gray-500 px-3 py-1.5 rounded cursor-not-allowed text-xs"
                                          title="Effectuez le paiement pour télécharger le contrat"
                                        >
                                          <FileText className="w-3 h-3" />
                                          <span>Contrat</span>
                                        </button>
                                      )}
                                      
                                      {/* Photos only available if payment is done */}
                                      {(request.payment_status === 'deposit_paid' || request.payment_status === 'fully_paid') ? (
                                        <button
                                          onClick={() => navigate(`/client/moving/${request.id}/photos`)}
                                          className="flex items-center space-x-1 bg-orange-600 text-white px-3 py-1.5 rounded hover:bg-orange-700 transition text-xs"
                                        >
                                          <Camera className="w-3 h-3" />
                                          <span>Photos</span>
                                        </button>
                                      ) : (
                                        <button
                                          disabled
                                          className="flex items-center space-x-1 bg-gray-300 text-gray-500 px-3 py-1.5 rounded cursor-not-allowed text-xs"
                                          title="Effectuez le paiement pour accéder aux photos"
                                        >
                                          <Camera className="w-3 h-3" />
                                          <span>Photos</span>
                                        </button>
                                      )}
                                      
                                      {/* Review only available after payment */}
                                      {!reviewedQuotes.has(quote.id) && quote.status === 'accepted' && (request.payment_status === 'deposit_paid' || request.payment_status === 'fully_paid') && (
                                        <button
                                          onClick={() => setSelectedReviewQuote({
                                            quoteId: quote.id,
                                            moverId: quote.mover_id,
                                            quoteRequestId: request.id,
                                            moverName: quote.mover?.company_name || 'Déménageur'
                                          })}
                                          className="flex items-center space-x-1 bg-yellow-600 text-white px-3 py-1.5 rounded hover:bg-yellow-700 transition text-xs"
                                        >
                                          <Star className="w-3 h-3" />
                                          <span>Noter</span>
                                        </button>
                                      )}
                                      
                                      {/* Payment tracker button - show after accepting a quote */}
                                      {quote.status === 'accepted' && (request.payment_status === 'deposit_paid' || request.payment_status === 'fully_paid') && (
                                        <button
                                          onClick={async () => {
                                            try {
                                              const { data: paymentData, error } = await supabase
                                                .from('payments')
                                                .select('total_amount, deposit_amount, remaining_amount, mission_completion_status')
                                                .eq('quote_id', quote.id)
                                                .single();
                                              
                                              if (error || !paymentData) {
                                                showToast('Informations de paiement non trouvées', 'error');
                                                return;
                                              }
                                              
                                              const isDone = ['completed_pending_review', 'approved', 'completed'].includes(paymentData.mission_completion_status || '');
                                              
                                              setSelectedPaymentInfo({
                                                totalAmount: paymentData.total_amount,
                                                depositPaid: paymentData.deposit_amount,
                                                remainingAmount: paymentData.remaining_amount,
                                                moverName: quote.mover?.company_name || 'Déménageur',
                                                movingDate: request.moving_date,
                                                missionCompleted: isDone,
                                                missionStatus: paymentData.mission_completion_status || 'in_progress',
                                              });
                                              setShowPaymentModal(true);
                                            } catch (err) {
                                              console.error('Error loading payment info:', err);
                                              showToast('Erreur lors du chargement', 'error');
                                            }
                                          }}
                                          className="flex items-center space-x-1 bg-teal-600 text-white px-3 py-1.5 rounded hover:bg-teal-700 transition text-xs"
                                        >
                                          <Receipt className="w-3 h-3" />
                                          <span>Paiements</span>
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {(!request.quotes || request.quotes.length === 0) && request.status === 'new' && (
                    <div className="border-t pt-4 mt-4">
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                        <Clock className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                        <p className="text-blue-800 text-sm">
                          Votre demande a été envoyée. Les déménageurs vont vous envoyer leurs propositions sous 24h.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedMessageQuote && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-2xl">
            <MessagingInterface
              quoteRequestId={selectedMessageQuote.quoteRequestId}
              moverId={selectedMessageQuote.moverId}
              userType="client"
              onClose={() => setSelectedMessageQuote(null)}
            />
          </div>
        </div>
      )}

      {selectedReviewQuote && (
        <ReviewModal
          quoteId={selectedReviewQuote.quoteId}
          quoteRequestId={selectedReviewQuote.quoteRequestId}
          moverId={selectedReviewQuote.moverId}
          moverName={selectedReviewQuote.moverName}
          onClose={() => setSelectedReviewQuote(null)}
          onSubmitted={() => {
            setSelectedReviewQuote(null);
            loadReviewedQuotes();
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

      {/* Payment Tracker Modal */}
      {showPaymentModal && selectedPaymentInfo && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center">
                    <Receipt className="w-6 h-6 text-teal-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Suivi des paiements</h2>
                    <p className="text-sm text-gray-500">Déménagement du {new Date(selectedPaymentInfo.movingDate).toLocaleDateString('fr-FR')}</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowPaymentModal(false);
                    setSelectedPaymentInfo(null);
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Mover Info */}
              <div className="text-center text-gray-600 text-sm">
                Déménageur: <span className="font-medium text-gray-900">{selectedPaymentInfo.moverName}</span>
              </div>

              {/* Mission completed banner */}
              {selectedPaymentInfo.missionCompleted && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
                  <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
                  <div className="text-green-800 font-semibold text-lg">Mission terminée</div>
                  <div className="text-green-600 text-sm mt-1">
                    {selectedPaymentInfo.missionStatus === 'approved' 
                      ? 'Le déménagement est terminé et validé.'
                      : 'Le déménageur a confirmé la livraison. Vous disposez de 48h pour signaler un éventuel dommage.'}
                  </div>
                </div>
              )}

              {/* Payment Progress */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600">Progression des paiements</span>
                  <span className="text-sm font-medium text-teal-600">
                    {selectedPaymentInfo.missionCompleted ? '100' : Math.round((selectedPaymentInfo.depositPaid / selectedPaymentInfo.totalAmount) * 100)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                  <div 
                    className={`h-3 rounded-full transition-all ${selectedPaymentInfo.missionCompleted ? 'bg-gradient-to-r from-green-500 to-green-600' : 'bg-gradient-to-r from-teal-500 to-teal-600'}`}
                    style={{ width: selectedPaymentInfo.missionCompleted ? '100%' : `${(selectedPaymentInfo.depositPaid / selectedPaymentInfo.totalAmount) * 100}%` }}
                  ></div>
                </div>
              </div>

              {/* Payment Details */}
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Montant total du déménagement</span>
                    <span className="text-xl font-bold text-gray-900">{selectedPaymentInfo.totalAmount.toLocaleString('fr-FR')} €</span>
                  </div>
                </div>

                <div className="bg-green-50 rounded-xl p-4 border border-green-200">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="text-green-800 font-medium">✅ Acompte versé</div>
                      <div className="text-green-600 text-xs">Payé via la plateforme (sécurisé)</div>
                    </div>
                    <span className="text-xl font-bold text-green-700">{selectedPaymentInfo.depositPaid.toLocaleString('fr-FR')} €</span>
                  </div>
                </div>

                {selectedPaymentInfo.missionCompleted ? (
                  <div className="bg-green-50 rounded-xl p-4 border border-green-200">
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="text-green-800 font-medium">✅ Solde versé au déménageur</div>
                        <div className="text-green-600 text-xs">Réglé le jour du déménagement</div>
                      </div>
                      <span className="text-xl font-bold text-green-700">{selectedPaymentInfo.remainingAmount.toLocaleString('fr-FR')} €</span>
                    </div>
                  </div>
                ) : (
                  <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="text-amber-800 font-medium">⏳ Solde à payer</div>
                        <div className="text-amber-600 text-xs">À régler au déménageur le jour J</div>
                      </div>
                      <span className="text-xl font-bold text-amber-700">{selectedPaymentInfo.remainingAmount.toLocaleString('fr-FR')} €</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
                <p className="font-medium mb-1">💡 Information</p>
                {selectedPaymentInfo.missionCompleted ? (
                  <p>Le montant total de {selectedPaymentInfo.totalAmount.toLocaleString('fr-FR')} € a été versé. La garantie sera libérée après vérification par l'admin (sous 48h).</p>
                ) : (
                  <p>Le solde de {selectedPaymentInfo.remainingAmount.toLocaleString('fr-FR')} € sera à régler directement au déménageur le jour du déménagement (espèces ou virement).</p>
                )}
              </div>
            </div>

            <div className="p-6 border-t bg-gray-50 rounded-b-2xl">
              <button
                onClick={() => {
                  setShowPaymentModal(false);
                  setSelectedPaymentInfo(null);
                }}
                className="w-full py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition font-medium"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </ClientLayout>
  );
}
