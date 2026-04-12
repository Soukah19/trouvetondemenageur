import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, CheckCircle, XCircle, Clock, Calendar, MapPin, Euro, MessageSquare, FileText, Filter, Search, AlertCircle, Edit, X, Package, Trash2, Loader2, Download, Map, Navigation } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { MoverLayout } from '../components/MoverLayout';
import { showToast } from '../utils/toast';
import { generateContractPDF, buildContractPDFData } from '../utils/generateContractPDF';
import { generateInvoicePDF, buildInvoiceData } from '../utils/generateInvoicePDF';
import { MissionCompletionButton } from '../components/MissionCompletionButton';
import { MessagingInterface } from '../components/MessagingInterface';
import { DistanceDisplay } from '../components/DistanceDisplay';
import { QuoteRequestChangesDisplay } from '../components/QuoteRequestChangesDisplay';
import { FurnitureInventoryViewer } from '../components/FurnitureInventoryViewer';
import { FurnitureInventoryModal } from '../components/FurnitureInventoryModal';
import RouteMap from '../components/RouteMap';
import { validateQuotePricing } from '../utils/marketPriceCalculation';

type AIIndicator = 'conforme' | 'proche' | 'eloigne_bas' | 'eloigne_haut';

interface AIEstimation {
  indicator: AIIndicator;
  confidence?: number;
  reasoning?: string;
  method: string;
}

type QuoteStatus = 'pending' | 'accepted' | 'rejected' | 'expired';

type QuoteWithRequest = {
  id: string;
  quote_request_id: string;
  mover_id: string;
  price: number;
  client_display_price: number;
  market_price_estimate: number;
  price_indicator: 'green' | 'orange' | 'red';
  proposed_moving_date?: string;
  notes?: string;
  message?: string;
  validity_date: string;
  status: QuoteStatus;
  created_at: string;
  quote_request: {
    id: string;
    client_name: string;
    client_email: string;
    client_phone: string;
    from_address: string;
    from_city: string;
    from_postal_code: string;
    to_address: string;
    to_city: string;
    to_postal_code: string;
    moving_date: string;
    home_size: string;
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
    volume_m3?: number;
    surface_m2?: number;
    furniture_lift_needed_departure?: boolean;
    furniture_lift_needed_arrival?: boolean;
    date_flexibility_days?: number;
    additional_info?: string;
    services_needed: string[];
    status: string;
    created_at: string;
    is_data_masked?: boolean;
    client_user_id?: string;
    furniture_inventory?: any;
  };
};

export default function MoverMyQuotesPage({ notificationQuoteRequestId, onQuoteRequestHandled  }: any) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [quotes, setQuotes] = useState<QuoteWithRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<QuoteStatus | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [moverId, setMoverId] = useState<string | null>(null);
  const [editingQuote, setEditingQuote] = useState<QuoteWithRequest | null>(null);
  const [editPrice, setEditPrice] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [updating, setUpdating] = useState(false);
  const [showInventoryModal, setShowInventoryModal] = useState(false);
  const [showListInventoryModal, setShowListInventoryModal] = useState(false);
  const [selectedQuoteForInventory, setSelectedQuoteForInventory] = useState<QuoteWithRequest | null>(null);
  const [deletingQuoteId, setDeletingQuoteId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [visibleMaps, setVisibleMaps] = useState<Set<string>>(new Set());
  const [editPriceAnalysis, setEditPriceAnalysis] = useState<{
    marketPrice: number;
    priceIndicator: 'green' | 'orange' | 'red';
    clientDisplayPrice: number;
  } | null>(null);
  const [editAiEstimation, setEditAiEstimation] = useState<AIEstimation | null>(null);
  const [editEstimationLoading, setEditEstimationLoading] = useState(false);
  const [messagingQuote, setMessagingQuote] = useState<{ quoteRequestId: string; clientId: string } | null>(null);

  // Function to get AI indicator display info - Updated with better labels
  const getAIIndicatorDisplay = (indicator: AIIndicator | string) => {
    switch (indicator) {
      case 'excellent':
        return {
          label: 'Prix excellent',
          icon: '🌟',
          color: 'bg-emerald-100 text-emerald-800 border-emerald-300',
          description: 'Offre très avantageuse, bien en-dessous du marché.'
        };
      case 'tres_competitif':
        return {
          label: 'Très compétitif',
          icon: '✅',
          color: 'bg-green-100 text-green-800 border-green-300',
          description: 'Prix attractif, en-dessous de la moyenne du marché.'
        };
      case 'competitif':
        return {
          label: 'Prix compétitif',
          icon: '👍',
          color: 'bg-teal-100 text-teal-800 border-teal-300',
          description: 'Légèrement sous la moyenne, bon rapport qualité-prix.'
        };
      case 'conforme':
        return {
          label: 'Prix du marché',
          icon: '📊',
          color: 'bg-blue-100 text-blue-800 border-blue-300',
          description: 'Dans la moyenne du marché, tarif standard.'
        };
      case 'proche':
        return {
          label: 'Prix proche du marché',
          icon: '📊',
          color: 'bg-blue-100 text-blue-800 border-blue-300',
          description: 'Votre prix est proche de la moyenne du marché.'
        };
      case 'legerement_eleve':
        return {
          label: 'Légèrement élevé',
          icon: '📈',
          color: 'bg-amber-100 text-amber-800 border-amber-300',
          description: 'Un peu au-dessus de la moyenne du marché.'
        };
      case 'eleve':
        return {
          label: 'Prix élevé',
          icon: '💰',
          color: 'bg-orange-100 text-orange-800 border-orange-300',
          description: 'Significativement au-dessus du marché.'
        };
      case 'tres_eleve':
        return {
          label: 'Prix très élevé',
          icon: '⚠️',
          color: 'bg-red-100 text-red-800 border-red-300',
          description: 'Bien au-dessus du marché, à comparer avec d\'autres offres.'
        };
      case 'eloigne_bas':
        return {
          label: 'Prix très bas',
          icon: '⚠️',
          color: 'bg-amber-100 text-amber-800 border-amber-300',
          description: 'Votre prix est significativement en-dessous du marché.'
        };
      case 'eloigne_haut':
        return {
          label: 'Prix élevé',
          icon: '💰',
          color: 'bg-orange-100 text-orange-800 border-orange-300',
          description: 'Votre prix est au-dessus du marché.'
        };
      default:
        return {
          label: 'Prix du marché',
          icon: '📊',
          color: 'bg-blue-100 text-blue-800 border-blue-300',
          description: 'Estimation du prix marché.'
        };
    }
  };

  // Fallback indicator from basic analysis
  const getFallbackIndicator = (priceAnalysis: any, price: number): AIIndicator => {
    if (!priceAnalysis) return 'conforme';
    switch (priceAnalysis.priceIndicator) {
      case 'green': return 'conforme';
      case 'orange': return 'proche';
      case 'red': 
        return price < priceAnalysis.marketPrice ? 'eloigne_bas' : 'eloigne_haut';
      default: return 'conforme';
    }
  };

  // Fetch AI estimation for edit modal
  const fetchEditAIEstimation = async (price: number, quoteRequest: any) => {
    setEditEstimationLoading(true);
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      const response = await fetch(`${supabaseUrl}/functions/v1/estimate-market-price`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseAnonKey}`,
        },
        body: JSON.stringify({
          quoteRequest: {
            volume_m3: quoteRequest.volume_m3,
            surface_m2: quoteRequest.surface_m2,
            from_city: quoteRequest.from_city,
            to_city: quoteRequest.to_city,
            floor_from: quoteRequest.floor_from,
            floor_to: quoteRequest.floor_to,
            elevator_from: quoteRequest.elevator_from,
            elevator_to: quoteRequest.elevator_to,
            services_needed: quoteRequest.services_needed,
            furniture_lift_needed_departure: quoteRequest.furniture_lift_needed_departure,
            furniture_lift_needed_arrival: quoteRequest.furniture_lift_needed_arrival,
            moving_date: quoteRequest.moving_date,
          },
          moverPrice: price,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setEditAiEstimation(data);
      }
    } catch (err) {
      console.error('Error fetching AI estimation:', err);
    } finally {
      setEditEstimationLoading(false);
    }
  };

  // Effect to calculate price analysis when edit price changes
  useEffect(() => {
    if (editingQuote && editPrice && !isNaN(parseFloat(editPrice))) {
      const price = parseFloat(editPrice);
      const analysis = validateQuotePricing(editingQuote.quote_request as any, price);
      setEditPriceAnalysis(analysis);
      
      // Debounced AI estimation
      const timer = setTimeout(() => {
        fetchEditAIEstimation(price, editingQuote.quote_request);
      }, 500);
      
      return () => clearTimeout(timer);
    } else {
      setEditPriceAnalysis(null);
      setEditAiEstimation(null);
    }
  }, [editPrice, editingQuote]);

  useEffect(() => {
    if (user) {
      loadMoverIdAndQuotes();
    }
  }, [user]);

  useEffect(() => {
    if (notificationQuoteRequestId && quotes.length > 0) {
      const quote = quotes.find(q => q.quote_request_id === notificationQuoteRequestId);
      if (quote) {
        setEditingQuote(quote);
        setEditPrice(quote.price.toString());
        setEditNotes(quote.notes || '');
        if (onQuoteRequestHandled) {
          onQuoteRequestHandled();
        }
      }
    }
  }, [notificationQuoteRequestId, quotes]);

  const loadMoverIdAndQuotes = async () => {
    try {
      const { data: moverData, error: moverError } = await supabase
        .from('movers')
        .select('id')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (moverError) throw moverError;

      if (moverData) {
        setMoverId(moverData.id);
        await loadQuotes(moverData.id);
      }
    } catch (error) {
      console.error('Error loading mover data:', error);
      showToast('Erreur lors du chargement des données', 'error');
    }
  };

  const loadQuotes = async (moverId: string) => {
    setLoading(true);
    try {
      const { data: quotesData, error: quotesError } = await supabase
        .from('quotes')
        .select('*')
        .eq('mover_id', moverId)
        .order('created_at', { ascending: false });

      if (quotesError) throw quotesError;

      if (!quotesData || quotesData.length === 0) {
        setQuotes([]);
        return;
      }

      const quotesWithRequests = await Promise.all(
        quotesData.map(async (quote) => {
          const { data: requestData, error: requestError } = await supabase
            .from('quote_requests_with_privacy')
            .select(`
              id,
              client_name,
              client_email,
              client_phone,
              from_address,
              from_city,
              from_postal_code,
              to_address,
              to_city,
              to_postal_code,
              moving_date,
              home_size,
              home_type,
              floor_from,
              floor_to,
              elevator_from,
              elevator_to,
              from_home_type,
              from_home_size,
              from_surface_m2,
              to_home_type,
              to_home_size,
              to_surface_m2,
              volume_m3,
              surface_m2,
              furniture_lift_needed_departure,
              furniture_lift_needed_arrival,
              date_flexibility_days,
              additional_info,
              services_needed,
              status,
              created_at,
              updated_at,
              is_data_masked,
              client_user_id,
              furniture_inventory
            `)
            .eq('id', quote.quote_request_id)
            .maybeSingle();

          if (requestError) throw requestError;

          return {
            ...quote,
            quote_request: requestData || {} as any
          };
        })
      );

      setQuotes(quotesWithRequests as QuoteWithRequest[] || []);
    } catch (error) {
      console.error('Error loading quotes:', error);
      showToast('Erreur lors du chargement des devis', 'error');
    } finally {
      setLoading(false);
    }
  };

  const getStatusLabel = (status: QuoteStatus) => {
    const labels = {
      pending: 'En attente',
      accepted: 'Accepté',
      rejected: 'Refusé',
      expired: 'Expiré'
    };
    return labels[status];
  };

  const getStatusColor = (status: QuoteStatus) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      accepted: 'bg-green-100 text-green-800 border-green-300',
      rejected: 'bg-red-100 text-red-800 border-red-300',
      expired: 'bg-gray-100 text-gray-800 border-gray-300'
    };
    return colors[status];
  };

  const getStatusIcon = (status: QuoteStatus) => {
    const icons = {
      pending: <Clock className="w-4 h-4" />,
      accepted: <CheckCircle className="w-4 h-4" />,
      rejected: <XCircle className="w-4 h-4" />,
      expired: <Clock className="w-4 h-4" />
    };
    return icons[status];
  };

  const getPriceIndicatorLabel = (indicator: 'green' | 'orange' | 'red') => {
    const labels = {
      green: 'Très compétitif',
      orange: 'Compétitif',
      red: 'Au-dessus du marché'
    };
    return labels[indicator];
  };

  const getPriceIndicatorColor = (indicator: 'green' | 'orange' | 'red') => {
    const colors = {
      green: 'text-green-600 bg-green-50',
      orange: 'text-orange-600 bg-orange-50',
      red: 'text-red-600 bg-red-50'
    };
    return colors[indicator];
  };

  const filteredQuotes = quotes.filter(quote => {
    const matchesStatus = filterStatus === 'all' || quote.status === filterStatus;
    const matchesSearch = searchTerm === '' ||
      quote.quote_request.from_city.toLowerCase().includes(searchTerm.toLowerCase()) ||
      quote.quote_request.to_city.toLowerCase().includes(searchTerm.toLowerCase()) ||
      quote.quote_request.client_name.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesStatus && matchesSearch;
  });

  const handleEditClick = (quote: QuoteWithRequest) => {
    setEditingQuote(quote);
    setEditPrice(quote.price.toString());
    setEditNotes(quote.notes || '');
  };

  const handleCancelEdit = () => {
    setEditingQuote(null);
    setEditPrice('');
    setEditNotes('');
  };

  const handleUpdateQuote = async () => {
    if (!editingQuote) return;

    const price = parseFloat(editPrice);
    if (isNaN(price) || price <= 0) {
      showToast('Veuillez entrer un prix valide', 'error');
      return;
    }

    const oldPrice = editingQuote.price;
    const newClientPrice = Math.round(price * 1.3);
    const oldClientPrice = editingQuote.client_display_price;

    setUpdating(true);
    try {
      // Prepare update data
      const updateData: any = {
        price: price,
        client_display_price: newClientPrice,
        notes: editNotes || null,
        updated_at: new Date().toISOString()
      };

      // If the quote was expired, reactivate it with a new validity date
      if (editingQuote.status === 'expired') {
        // Get the quote request to calculate new validity date
        const { data: qrData } = await supabase
          .from('quote_requests')
          .select('moving_date, date_flexibility_days')
          .eq('id', editingQuote.quote_request_id)
          .single();

        if (qrData) {
          const movingDate = new Date(qrData.moving_date);
          const flexibilityDays = qrData.date_flexibility_days || 0;
          const maxValidityDate = new Date(movingDate.getTime() + (flexibilityDays * 24 * 60 * 60 * 1000));
          // Set to end of day to allow same-day acceptance
          maxValidityDate.setHours(23, 59, 59, 999);
          
          // Only reactivate if the moving date is still in the future or today
          if (maxValidityDate >= new Date()) {
            updateData.status = 'pending';
            updateData.validity_date = maxValidityDate.toISOString().split('T')[0];
          }
        }
      }

      const { error } = await supabase
        .from('quotes')
        .update(updateData)
        .eq('id', editingQuote.id)
        .eq('mover_id', editingQuote.mover_id); // Ensure mover owns this quote

      if (error) {
        console.error('Update error:', error);
        throw error;
      }

      const { data: quoteRequest } = await supabase
        .from('quote_requests')
        .select('client_user_id, from_city, to_city')
        .eq('id', editingQuote.quote_request_id)
        .single();

      if (quoteRequest) {
        const { data: moverData } = await supabase
          .from('movers')
          .select('company_name')
          .eq('id', editingQuote.mover_id)
          .single();

        const companyName = moverData?.company_name || 'Un déménageur';

        if (quoteRequest.client_user_id) {
          const notificationMessage = editingQuote.status === 'expired' && updateData.status === 'pending'
            ? `${companyName} a soumis un nouveau devis pour votre déménagement ${quoteRequest.from_city} → ${quoteRequest.to_city}. Montant : ${newClientPrice.toLocaleString('fr-FR')}€`
            : `${companyName} a modifié son devis pour votre déménagement ${quoteRequest.from_city} → ${quoteRequest.to_city}. Nouveau montant : ${newClientPrice.toLocaleString('fr-FR')}€`;

          const { error: notifError } = await supabase.from('notifications').insert({
            user_id: quoteRequest.client_user_id,
            user_type: 'client',
            type: 'quote_update',
            title: editingQuote.status === 'expired' ? 'Nouveau devis reçu' : 'Devis modifié',
            message: notificationMessage,
            related_id: editingQuote.id,
            read: false
          });

          if (notifError) {
            console.error('Error creating client notification:', notifError);
          }
        }

        const { data: admins } = await supabase
          .from('admins')
          .select('user_id');

        if (admins && admins.length > 0) {
          const adminNotifications = admins.map(admin => ({
            user_id: admin.user_id,
            user_type: 'admin' as const,
            type: 'quote_update',
            title: 'Devis modifié',
            message: `${companyName} a modifié son devis ${quoteRequest.from_city} → ${quoteRequest.to_city} : ${oldClientPrice}€ → ${newClientPrice}€`,
            related_id: editingQuote.id,
            read: false
          }));

          const { error: adminNotifError } = await supabase.from('notifications').insert(adminNotifications);

          if (adminNotifError) {
            console.error('Error creating admin notifications:', adminNotifError);
          }
        }
      }

      showToast('Devis modifié avec succès', 'success');
      handleCancelEdit();

      if (moverId) {
        await loadQuotes(moverId);
      }
    } catch (error: any) {
      console.error('Error updating quote:', error);
      showToast(`Erreur lors de la modification du devis: ${error.message || 'Erreur inconnue'}`, 'error');
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteQuote = async (quoteId: string) => {
    setDeletingQuoteId(quoteId);
    try {
      const { error } = await supabase
        .from('quotes')
        .delete()
        .eq('id', quoteId);

      if (error) throw error;

      showToast('Devis supprimé avec succès', 'success');
      setShowDeleteConfirm(false);
      setDeletingQuoteId(null);
      
      // Reload quotes
      if (moverId) {
        await loadQuotes(moverId);
      }
    } catch (error) {
      console.error('Error deleting quote:', error);
      showToast('Erreur lors de la suppression du devis', 'error');
    }
  };

  const stats = {
    total: quotes.length,
    pending: quotes.filter(q => q.status === 'pending').length,
    accepted: quotes.filter(q => q.status === 'accepted').length,
    rejected: quotes.filter(q => q.status === 'rejected').length,
    acceptanceRate: quotes.length > 0
      ? Math.round((quotes.filter(q => q.status === 'accepted').length / quotes.length) * 100)
      : 0,
    totalRevenue: quotes
      .filter(q => q.status === 'accepted')
      .reduce((sum, q) => sum + q.price, 0)
  };

  if (loading) {
    return (
      <MoverLayout activeSection="my-quotes" title="Mes devis">
        <div className="flex items-center justify-center py-20">
          <LoadingSpinner />
        </div>
      </MoverLayout>
    );
  }

  return (
    <MoverLayout activeSection="my-quotes" title="Mes devis">
      <div className="max-w-7xl mx-auto">

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Mes devis</h1>
          <p className="text-slate-600">Gérez tous vos devis soumis et suivez leur statut</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <FileText className="w-8 h-8 text-blue-600" />
            </div>
            <div className="text-3xl font-bold text-slate-900 mb-1">{stats.total}</div>
            <div className="text-sm text-slate-600">Devis total</div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <Clock className="w-8 h-8 text-yellow-600" />
            </div>
            <div className="text-3xl font-bold text-slate-900 mb-1">{stats.pending}</div>
            <div className="text-sm text-slate-600">En attente</div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <div className="text-3xl font-bold text-slate-900 mb-1">{stats.accepted}</div>
            <div className="text-sm text-slate-600">Acceptés</div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="w-8 h-8 text-green-600" />
            </div>
            <div className="text-3xl font-bold text-slate-900 mb-1">{stats.acceptanceRate}%</div>
            <div className="text-sm text-slate-600">Taux d'acceptation</div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <Euro className="w-8 h-8 text-green-600" />
            </div>
            <div className="text-3xl font-bold text-slate-900 mb-1">
              {stats.totalRevenue.toLocaleString('fr-FR')}€
            </div>
            <div className="text-sm text-slate-600">Chiffre d'affaires</div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 mb-6 p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <input
                type="text"
                placeholder="Rechercher par ville ou client..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-slate-600" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as QuoteStatus | 'all')}
                className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">Tous les statuts</option>
                <option value="pending">En attente</option>
                <option value="accepted">Accepté</option>
                <option value="rejected">Refusé</option>
                <option value="expired">Expiré</option>
              </select>
            </div>
          </div>
        </div>

        {filteredQuotes.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
            <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-900 mb-2">
              {searchTerm || filterStatus !== 'all' ? 'Aucun devis trouvé' : 'Aucun devis soumis'}
            </h3>
            <p className="text-slate-600">
              {searchTerm || filterStatus !== 'all'
                ? 'Essayez de modifier vos critères de recherche'
                : 'Consultez les demandes de devis disponibles pour commencer'}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredQuotes.map((quote) => (
              <div
                key={quote.id}
                className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition"
              >
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
                  <div className="flex-1 space-y-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-slate-900">
                            {quote.quote_request.from_city} → {quote.quote_request.to_city}
                          </h3>
                          <div className={`px-3 py-1 rounded-full text-xs font-medium border flex items-center gap-1 ${
                            quote.status === 'expired' && quote.quote_request.updated_at && 
                            new Date(quote.quote_request.updated_at).getTime() > new Date(quote.created_at).getTime()
                              ? 'bg-orange-100 text-orange-800 border-orange-300'
                              : getStatusColor(quote.status)
                          }`}>
                            {getStatusIcon(quote.status)}
                            {quote.status === 'expired' && quote.quote_request.updated_at && 
                            new Date(quote.quote_request.updated_at).getTime() > new Date(quote.created_at).getTime()
                              ? 'À mettre à jour'
                              : getStatusLabel(quote.status)}
                          </div>
                        </div>
                        {quote.quote_request.from_address && quote.quote_request.to_address && (
                          <div className="mb-2">
                            <DistanceDisplay
                              fromAddress={quote.quote_request.from_address}
                              fromCity={quote.quote_request.from_city}
                              fromPostalCode={quote.quote_request.from_postal_code}
                              toAddress={quote.quote_request.to_address}
                              toCity={quote.quote_request.to_city}
                              toPostalCode={quote.quote_request.to_postal_code}
                              showDuration={true}
                            />
                          </div>
                        )}
                        <div className="flex items-center gap-4 text-sm text-slate-600">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            Déménagement: {new Date(quote.quote_request.moving_date).toLocaleDateString('fr-FR')}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            Devis soumis: {new Date(quote.created_at).toLocaleDateString('fr-FR')}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Warning: Quote expired due to request modification */}
                    {quote.status === 'expired' && quote.quote_request.updated_at && 
                      new Date(quote.quote_request.updated_at).getTime() > new Date(quote.created_at).getTime() && (
                      <div className="bg-orange-50 border border-orange-300 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                          <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                          <div className="text-sm flex-1">
                            <div className="font-semibold text-orange-900 mb-1">
                              ⚠️ Ce devis doit être mis à jour
                            </div>
                            <div className="text-orange-800">
                              La demande de déménagement a été modifiée après votre soumission de devis. Cliquez sur « Modifier mon devis » pour soumettre une nouvelle proposition basée sur les informations actualisées.
                            </div>
                            <div className="text-orange-600 text-xs mt-1">
                              Demande mise à jour le {new Date(quote.quote_request.updated_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {quote.quote_request.is_data_masked && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                          <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                          <div className="text-sm">
                            <div className="font-semibold text-yellow-900 mb-1">
                              Informations du client masquées
                            </div>
                            <div className="text-yellow-800">
                              Les coordonnées complètes du client (nom, téléphone, email, adresses exactes) seront démasquées automatiquement lorsque le client aura payé la commission plateforme.
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div className="flex items-start gap-2">
                          <MapPin className="w-4 h-4 text-blue-600 mt-1 flex-shrink-0" />
                          <div className="text-sm">
                            <div className="font-medium text-slate-900">Départ</div>
                            <div className="text-slate-600">
                              {quote.quote_request.is_data_masked ? (
                                <span>{quote.quote_request.from_postal_code} {quote.quote_request.from_city}</span>
                              ) : (
                                <span>{quote.quote_request.from_address}, {quote.quote_request.from_postal_code} {quote.quote_request.from_city}</span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          <MapPin className="w-4 h-4 text-green-600 mt-1 flex-shrink-0" />
                          <div className="text-sm">
                            <div className="font-medium text-slate-900">Arrivée</div>
                            <div className="text-slate-600">
                              {quote.quote_request.is_data_masked ? (
                                <span>{quote.quote_request.to_postal_code} {quote.quote_request.to_city}</span>
                              ) : (
                                <span>{quote.quote_request.to_address}, {quote.quote_request.to_postal_code} {quote.quote_request.to_city}</span>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        {/* Route Map - lazy loaded on demand */}
                        {quote.quote_request.from_city && quote.quote_request.to_city && (
                          visibleMaps.has(quote.id) ? (
                            <div className="mt-3 rounded-lg overflow-hidden border border-slate-200 shadow-sm">
                              <div className="h-[300px]">
                                <RouteMap
                                  fromAddress={quote.quote_request.from_address || quote.quote_request.from_city}
                                  fromCity={quote.quote_request.from_city}
                                  fromPostalCode={quote.quote_request.from_postal_code}
                                  toAddress={quote.quote_request.to_address || quote.quote_request.to_city}
                                  toCity={quote.quote_request.to_city}
                                  toPostalCode={quote.quote_request.to_postal_code}
                                />
                              </div>
                            </div>
                          ) : (
                            <div className="mt-3 h-[300px] rounded-lg border-2 border-dashed border-slate-200 bg-slate-50 flex flex-col items-center justify-center gap-3">
                              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                                <Map className="w-6 h-6 text-blue-600" />
                              </div>
                              <p className="text-sm text-slate-500 text-center px-4">
                                {quote.quote_request.from_city} → {quote.quote_request.to_city}
                              </p>
                              <button
                                onClick={() => setVisibleMaps(prev => new Set(prev).add(quote.id))}
                                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                              >
                                <Navigation className="w-4 h-4" />
                                Voir la carte
                              </button>
                            </div>
                          )
                        )}
                      </div>

                      <div className="space-y-3">
                        <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                          <div className="font-medium text-slate-900 mb-2 text-sm">Logement de départ</div>
                          <div className="space-y-1 text-xs text-slate-600">
                            {quote.quote_request.from_home_type && (
                              <div><span className="font-medium">Type:</span> {quote.quote_request.from_home_type}</div>
                            )}
                            {quote.quote_request.from_home_size && (
                              <div><span className="font-medium">Taille:</span> {quote.quote_request.from_home_size}</div>
                            )}
                            {quote.quote_request.from_surface_m2 && (
                              <div><span className="font-medium">Surface:</span> {quote.quote_request.from_surface_m2}m²</div>
                            )}
                            {quote.quote_request.floor_from !== null && quote.quote_request.floor_from !== undefined && (
                              <div><span className="font-medium">Étage:</span> {quote.quote_request.floor_from === 0 ? 'RDC' : `${quote.quote_request.floor_from}e`}</div>
                            )}
                            {quote.quote_request.elevator_from !== null && quote.quote_request.elevator_from !== undefined && (
                              <div><span className="font-medium">Ascenseur:</span> {quote.quote_request.elevator_from ? 'Oui' : 'Non'}</div>
                            )}
                            {quote.quote_request.furniture_lift_needed_departure && (
                              <div className="text-orange-600"><span className="font-medium">Monte-meuble nécessaire</span></div>
                            )}
                          </div>
                        </div>

                        <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                          <div className="font-medium text-slate-900 mb-2 text-sm">Logement d'arrivée</div>
                          <div className="space-y-1 text-xs text-slate-600">
                            {quote.quote_request.to_home_type && (
                              <div><span className="font-medium">Type:</span> {quote.quote_request.to_home_type}</div>
                            )}
                            {quote.quote_request.to_home_size && (
                              <div><span className="font-medium">Taille:</span> {quote.quote_request.to_home_size}</div>
                            )}
                            {quote.quote_request.to_surface_m2 && (
                              <div><span className="font-medium">Surface:</span> {quote.quote_request.to_surface_m2}m²</div>
                            )}
                            {quote.quote_request.floor_to !== null && quote.quote_request.floor_to !== undefined && (
                              <div><span className="font-medium">Étage:</span> {quote.quote_request.floor_to === 0 ? 'RDC' : `${quote.quote_request.floor_to}e`}</div>
                            )}
                            {quote.quote_request.elevator_to !== null && quote.quote_request.elevator_to !== undefined && (
                              <div><span className="font-medium">Ascenseur:</span> {quote.quote_request.elevator_to ? 'Oui' : 'Non'}</div>
                            )}
                            {quote.quote_request.furniture_lift_needed_arrival && (
                              <div className="text-orange-600"><span className="font-medium">Monte-meuble nécessaire</span></div>
                            )}
                          </div>
                        </div>

                        {!!quote.quote_request.volume_m3 && (
                          <div className="text-sm">
                            <span className="font-medium text-slate-900">Volume estimé:</span>{' '}
                            <span className="text-slate-600">{quote.quote_request.volume_m3}m³</span>
                          </div>
                        )}

                        {quote.quote_request.furniture_inventory && (
                          <button
                            onClick={() => {
                              setSelectedQuoteForInventory(quote);
                              setShowListInventoryModal(true);
                            }}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors text-sm font-medium"
                          >
                            <FileText className="w-4 h-4" />
                            Voir l'inventaire mobilier
                          </button>
                        )}

                        {quote.quote_request.date_flexibility_days && quote.quote_request.date_flexibility_days > 0 && (
                          <div className="text-sm">
                            <span className="font-medium text-slate-900">Flexibilité:</span>{' '}
                            <span className="text-slate-600">±{quote.quote_request.date_flexibility_days} jours</span>
                          </div>
                        )}

                        {quote.quote_request.services_needed && quote.quote_request.services_needed.length > 0 && (
                          <div className="text-sm">
                            <div className="font-medium text-slate-900 mb-1">Services demandés:</div>
                            <div className="flex flex-wrap gap-2">
                              {quote.quote_request.services_needed.map((service, idx) => (
                                <span
                                  key={idx}
                                  className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs"
                                >
                                  {service}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {quote.quote_request.additional_info && (
                          <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                            <div className="font-medium text-blue-900 mb-1 text-sm">Informations complémentaires:</div>
                            <div className="text-xs text-blue-800">{quote.quote_request.additional_info}</div>
                          </div>
                        )}
                      </div>
                    </div>

                    {quote.notes && (
                      <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                        <div className="flex items-start gap-2">
                          <MessageSquare className="w-4 h-4 text-slate-600 mt-1 flex-shrink-0" />
                          <div className="text-sm">
                            <div className="font-medium text-slate-900 mb-1">Votre message:</div>
                            <div className="text-slate-600">{quote.notes}</div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="lg:w-80 space-y-4">
                    <div className={`rounded-xl p-6 border ${
                      quote.status === 'expired' && quote.quote_request.updated_at && 
                      new Date(quote.quote_request.updated_at).getTime() > new Date(quote.created_at).getTime()
                        ? 'bg-gradient-to-br from-orange-50 to-red-50 border-orange-300'
                        : 'bg-gradient-to-br from-blue-50 to-green-50 border-blue-200'
                    }`}>
                      <div className="text-center mb-4">
                        <div className="text-sm text-slate-600 mb-1">Votre prix HT</div>
                        <div className={`text-4xl font-bold ${
                          quote.status === 'expired' && quote.quote_request.updated_at && 
                          new Date(quote.quote_request.updated_at).getTime() > new Date(quote.created_at).getTime()
                            ? 'text-slate-400 line-through'
                            : 'text-slate-900'
                        }`}>
                          {quote.price.toLocaleString('fr-FR')}€ HT
                        </div>
                        {quote.status === 'expired' && quote.quote_request.updated_at && 
                          new Date(quote.quote_request.updated_at).getTime() > new Date(quote.created_at).getTime() && (
                          <div className="text-xs text-orange-600 font-medium mt-1">
                            ⚠️ Devis obsolète — la demande a été modifiée
                          </div>
                        )}
                      </div>

                      <div className={`px-3 py-2 rounded-lg text-center text-sm font-medium ${getPriceIndicatorColor(quote.price_indicator)}`}>
                        {getPriceIndicatorLabel(quote.price_indicator)}
                      </div>

                      {quote.proposed_moving_date && (
                        <div className="mt-3 pt-3 border-t border-slate-200">
                          <div className="flex items-center justify-center gap-2 text-xs text-slate-600">
                            <Calendar className="w-4 h-4" />
                            <div>
                              <div className="font-medium">Date proposée</div>
                              <div className="font-semibold text-slate-900">
                                {new Date(quote.proposed_moving_date).toLocaleDateString('fr-FR', {
                                  weekday: 'short',
                                  day: 'numeric',
                                  month: 'short'
                                })}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {quote.status !== 'rejected' && quote.status !== 'accepted' && (
                        <>
                          {quote.status === 'pending' && (
                            <div className="mt-3 text-xs text-center text-slate-600">
                              Valide jusqu'au {new Date(quote.validity_date).toLocaleDateString('fr-FR')}
                            </div>
                          )}
                          <button
                            onClick={() => handleEditClick(quote)}
                            className="mt-3 w-full px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition flex items-center justify-center gap-2 text-sm"
                          >
                            <Edit className="w-4 h-4" />
                            Modifier le devis
                          </button>
                          {quote.status === 'pending' && (
                            <button
                              onClick={() => {
                                setDeletingQuoteId(quote.id);
                                setShowDeleteConfirm(true);
                              }}
                              className="mt-2 w-full px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition flex items-center justify-center gap-2 text-sm"
                            >
                              <Trash2 className="w-4 h-4" />
                              Supprimer le devis
                            </button>
                          )}
                        </>
                      )}
                    </div>

                    {quote.status === 'accepted' && (
                      <div className="space-y-3">
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                          <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
                          <div className="font-semibold text-green-900 mb-1">Devis accepté</div>
                          <div className="text-sm text-green-700">Le client a accepté votre proposition</div>
                        </div>

                        <MissionCompletionButton
                          quoteId={quote.id}
                          quoteRequestId={quote.quote_request.id}
                        />

                        <button
                          onClick={async () => {
                            try {
                              showToast('Chargement du contrat...', 'info');
                              
                              // Try to find contract by quote_id first
                              let contractData: any = null;
                              const { data: byQuoteId, error: err1 } = await supabase
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
                                  .eq('quote_request_id', quote.quote_request_id)
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

                                // Get mover data
                                const { data: moverData } = await supabase
                                  .from('movers')
                                  .select('*')
                                  .eq('id', quote.mover_id)
                                  .maybeSingle();

                                const contractText = `CONTRAT DE DÉMÉNAGEMENT - TTD-${Date.now().toString(36).toUpperCase()}
================================================================================

Date de création: ${new Date().toLocaleDateString('fr-FR')}

INFORMATIONS CLIENT
-------------------
Nom: ${quote.quote_request.client_name || 'N/A'}
Email: ${quote.quote_request.client_email || 'N/A'}
Téléphone: ${quote.quote_request.client_phone || 'N/A'}

INFORMATIONS DÉMÉNAGEUR
-----------------------
Société: ${moverData?.company_name || 'N/A'}
SIRET: ${moverData?.siret || 'N/A'}
Responsable: ${moverData?.manager_firstname || ''} ${moverData?.manager_lastname || ''}
Email: ${moverData?.email || 'N/A'}
Téléphone: ${moverData?.phone || 'N/A'}

DÉTAILS DU DÉMÉNAGEMENT
-----------------------
Date prévue: ${new Date(quote.quote_request.moving_date).toLocaleDateString('fr-FR')}
Trajet: ${quote.quote_request.from_city || 'N/A'} → ${quote.quote_request.to_city || 'N/A'}

Adresse de départ:
${quote.quote_request.from_address || 'N/A'}
${quote.quote_request.from_postal_code || ''} ${quote.quote_request.from_city || ''}
Étage: ${quote.quote_request.floor_from ?? 'RDC'} | Ascenseur: ${quote.quote_request.elevator_from ? 'Oui' : 'Non'}

Adresse d'arrivée:
${quote.quote_request.to_address || 'N/A'}
${quote.quote_request.to_postal_code || ''} ${quote.quote_request.to_city || ''}
Étage: ${quote.quote_request.floor_to ?? 'RDC'} | Ascenseur: ${quote.quote_request.elevator_to ? 'Oui' : 'Non'}

Type de logement: ${quote.quote_request.home_size || 'N/A'}
Volume estimé: ${quote.quote_request.volume_m3 || 'N/A'} m³
Services: ${quote.quote_request.services_needed?.join(', ') || 'Aucun'}

INFORMATIONS FINANCIÈRES
------------------------
Montant total: ${paymentData.total_amount?.toLocaleString('fr-FR')} €
Commission plateforme: ${(paymentData.deposit_amount || paymentData.amount_paid)?.toLocaleString('fr-FR')} €
Solde à régler: ${paymentData.remaining_amount?.toLocaleString('fr-FR')} €

================================================================================
Ce document est un contrat de déménagement généré par TrouveTonDéménageur.`;

                                const { data: newContract, error: insertErr } = await supabase
                                  .from('contracts')
                                  .insert({
                                    quote_id: quote.id,
                                    client_id: paymentData.client_id,
                                    mover_id: quote.mover_id,
                                    contract_text: contractText,
                                    status: 'pending_signature'
                                  })
                                  .select()
                                  .single();

                                if (insertErr) {
                                  console.error('Error creating contract:', insertErr);
                                  showToast('Erreur lors de la création du contrat', 'error');
                                  return;
                                }
                                contractData = newContract;
                              }
                              
                              // Download contract as professional PDF
                              const { data: fullRequest } = await supabase
                                .from('quote_requests')
                                .select('*')
                                .eq('id', quote.quote_request_id)
                                .maybeSingle();
                              
                              const { data: paymentInfo } = await supabase
                                .from('payments')
                                .select('*')
                                .eq('quote_id', quote.id)
                                .maybeSingle();

                              // Always fetch mover data for PDF generation
                              const { data: moverInfo } = await supabase
                                .from('movers')
                                .select('*')
                                .eq('id', quote.mover_id)
                                .maybeSingle();

                              const pdfData = buildContractPDFData(
                                contractData,
                                fullRequest || quote.quote_request,
                                quote,
                                moverInfo,
                                paymentInfo,
                                'mover'
                              );
                              generateContractPDF(pdfData);
                              
                              showToast('Lettre de mission téléchargée', 'success');
                            } catch (err) {
                              console.error('Error downloading contract:', err);
                              showToast('Erreur lors du téléchargement', 'error');
                            }
                          }}
                          className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition flex items-center justify-center gap-2"
                        >
                          <Download className="w-4 h-4" />
                          Télécharger la lettre de mission
                        </button>

                        {/* <button
                          onClick={async () => {
                            try {
                              const { data: paymentInfo } = await supabase
                                .from('payments')
                                .select('*')
                                .eq('quote_id', quote.id)
                                .maybeSingle();
                              const invoiceData = buildInvoiceData(
                                paymentInfo,
                                quote,
                                quote.quote_request,
                                quote.contract?.contract_number || ''
                              );
                              generateInvoicePDF(invoiceData);
                              showToast('Facture téléchargée', 'success');
                            } catch (err) {
                              console.error('Error downloading invoice:', err);
                              showToast('Erreur lors du téléchargement', 'error');
                            }
                          }}
                          className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center justify-center gap-2"
                        >
                          <Download className="w-4 h-4" />
                          Télécharger la facture
                        </button> */}

                        <button
                          onClick={() => {
                            setMessagingQuote({
                              quoteRequestId: quote.quote_request_id,
                              clientId: quote.quote_request.client_user_id || ''
                            });
                          }}
                          className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-2"
                        >
                          <MessageSquare className="w-4 h-4" />
                          Contacter le client
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {editingQuote && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-slate-900">Modifier le devis</h2>
              <button
                onClick={handleCancelEdit}
                className="p-2 hover:bg-slate-100 rounded-lg transition"
              >
                <X className="w-5 h-5 text-slate-600" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {editingQuote.status === 'accepted' && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm">
                      <div className="font-semibold text-green-900 mb-1">
                        Devis accepté
                      </div>
                      <div className="text-green-800">
                        Ce devis a été accepté par le client. Si vous le modifiez, le client et les administrateurs recevront une notification de la modification.
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {editingQuote.status === 'expired' && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm">
                      <div className="font-semibold text-orange-900 mb-1">
                        Devis expiré
                      </div>
                      <div className="text-orange-800">
                        Ce devis est expiré. En le modifiant, le client et les administrateurs seront notifiés de votre nouvelle proposition.
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <QuoteRequestChangesDisplay quoteRequestId={editingQuote.quote_request_id} />

              <button
                onClick={() => setShowInventoryModal(true)}
                className="w-full px-4 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all flex items-center justify-center gap-2 font-medium shadow-lg"
              >
                <Package className="w-5 h-5" />
                Voir l'inventaire mobilier
              </button>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-2">Demande de déménagement</h3>
                <div className="text-sm text-blue-800">
                  <div><strong>Trajet:</strong> {editingQuote.quote_request.from_city} → {editingQuote.quote_request.to_city}</div>
                  <div><strong>Date:</strong> {new Date(editingQuote.quote_request.moving_date).toLocaleDateString('fr-FR')}</div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Votre prix HT (€)
                </label>
                <input
                  type="number"
                  value={editPrice}
                  onChange={(e) => setEditPrice(e.target.value)}
                  min="0"
                  step="10"
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Ex: 1500"
                />
              </div>

              {/* Price Estimation Display */}
              {editPriceAnalysis && (
                <div className="space-y-3">
                  {/* Price Summary */}
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between items-center py-1 border-b border-slate-200">
                        <span className="text-slate-700">Votre prix HT :</span>
                        <span className="font-bold text-lg text-slate-900">{parseFloat(editPrice).toFixed(2)} € HT</span>
                      </div>
                      <div className="flex justify-between items-center py-1">
                        <span className="text-slate-700">Prix affiché au client TTC :</span>
                        <span className="font-semibold text-slate-800">{editPriceAnalysis.clientDisplayPrice.toLocaleString('fr-FR')} € TTC</span>
                      </div>
                    </div>
                  </div>

                  {/* AI Price Indicator */}
                  {(() => {
                    const currentIndicator = editAiEstimation?.indicator || getFallbackIndicator(editPriceAnalysis, parseFloat(editPrice));
                    const indicatorDisplay = getAIIndicatorDisplay(currentIndicator);
                    return (
                      <div className={`border-2 rounded-lg p-4 ${
                        editEstimationLoading ? 'bg-slate-50 border-slate-200' : indicatorDisplay.color
                      }`}>
                        <div className="flex items-center gap-2 mb-2">
                          {editEstimationLoading ? (
                            <>
                              <Loader2 className="w-5 h-5 text-slate-500 animate-spin" />
                              <span className="font-semibold text-slate-600">Analyse du prix...</span>
                            </>
                          ) : (
                            <>
                              <span className="text-xl">{indicatorDisplay.icon}</span>
                              <span className="font-semibold">{indicatorDisplay.label}</span>
                            </>
                          )}
                        </div>
                        
                        {!editEstimationLoading && (
                          <p className="text-sm">{indicatorDisplay.description}</p>
                        )}

                        {editAiEstimation?.reasoning && !editEstimationLoading && (
                          <p className="mt-2 text-xs text-slate-600 italic border-t border-current/20 pt-2">
                            💡 {editAiEstimation.reasoning}
                          </p>
                        )}
                      </div>
                    );
                  })()}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Message pour le client (optionnel)
                </label>
                <textarea
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Ajoutez un message pour le client..."
                />
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <div className="font-semibold text-blue-900 mb-1">
                      Notification automatique
                    </div>
                    <div className="text-blue-800">
                      Le client et tous les administrateurs recevront automatiquement une notification par email et sur la plateforme concernant cette modification de devis.
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleCancelEdit}
                  className="flex-1 px-6 py-3 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition font-medium"
                >
                  Annuler
                </button>
                <button
                  onClick={handleUpdateQuote}
                  disabled={updating}
                  className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {updating ? 'Mise à jour...' : 'Enregistrer les modifications'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showInventoryModal && editingQuote && (
        <FurnitureInventoryViewer
          quoteRequestId={editingQuote.quote_request_id}
          onClose={() => setShowInventoryModal(false)}
        />
      )}

      {showListInventoryModal && selectedQuoteForInventory && selectedQuoteForInventory.quote_request.furniture_inventory && (
        <FurnitureInventoryModal
          inventory={selectedQuoteForInventory.quote_request.furniture_inventory}
          onClose={() => {
            setShowListInventoryModal(false);
            setSelectedQuoteForInventory(null);
          }}
          requestInfo={{
            from_city: selectedQuoteForInventory.quote_request.from_city,
            to_city: selectedQuoteForInventory.quote_request.to_city,
            moving_date: selectedQuoteForInventory.quote_request.moving_date,
            volume_m3: selectedQuoteForInventory.quote_request.volume_m3
          }}
        />
      )}

      {showDeleteConfirm && deletingQuoteId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Supprimer le devis</h3>
                <p className="text-sm text-slate-600">Cette action est irréversible</p>
              </div>
            </div>
            
            <p className="text-slate-600 mb-6">
              Êtes-vous sûr de vouloir supprimer ce devis ? Cette action ne peut pas être annulée.
            </p>
            
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDeletingQuoteId(null);
                }}
                className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition font-medium"
              >
                Annuler
              </button>
              <button
                onClick={() => handleDeleteQuote(deletingQuoteId)}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium"
              >
                Supprimer
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
              clientId={messagingQuote.clientId}
              userType="mover"
              onClose={() => setMessagingQuote(null)}
            />
          </div>
        </div>
      )}

    </MoverLayout>
  );
}