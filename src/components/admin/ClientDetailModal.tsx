import { useState, useEffect } from 'react';
import { X, Download, User, Mail, Phone, Calendar, MapPin, Package, FileText, Edit, Navigation } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { showToast } from '../../utils/toast';
import QuoteRequestDetailModal from './QuoteRequestDetailModal';
import QuotesListModal from './QuotesListModal';

interface ClientDetailModalProps {
  clientId: string;
  onClose: () => void;
  onUpdate: () => void;
  adminRole?: string;
}

interface ClientInfo {
  id: string;
  email: string;
  created_at: string;
  name?: string;
  phone?: string;
}

interface QuoteRequest {
  id: string;
  created_at: string;
  departure_address: string;
  arrival_address: string;
  moving_date: string;
  surface_area: number;
  volume: number;
  floor_departure: number;
  floor_arrival: number;
  has_elevator_departure: boolean;
  has_elevator_arrival: boolean;
  status: string;
  total_quotes: number;
  client_name?: string;
  client_phone?: string;
  from_home_type?: string;
  from_home_size?: string;
  from_surface_m2?: number;
  to_home_type?: string;
  to_home_size?: string;
  to_surface_m2?: number;
  furniture_lift_needed_departure?: boolean;
  furniture_lift_needed_arrival?: boolean;
  elevator_capacity_from?: string;
  elevator_capacity_to?: string;
  date_flexibility_days?: number;
  services_needed?: string[];
  additional_info?: string;
}

export default function ClientDetailModal({ clientId, onClose, onUpdate, adminRole = '' }: ClientDetailModalProps) {
  const [clientInfo, setClientInfo] = useState<ClientInfo | null>(null);
  const [quoteRequests, setQuoteRequests] = useState<QuoteRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedQuoteId, setSelectedQuoteId] = useState<string | null>(null);
  const [selectedQuoteRequestForQuotes, setSelectedQuoteRequestForQuotes] = useState<string | null>(null);
  const [distances, setDistances] = useState<{ [key: string]: number }>({});

  useEffect(() => {
    loadClientData();
  }, [clientId]);

  const loadClientData = async () => {
    setLoading(true);
    try {
      const { data: userEmail, error: emailError } = await supabase.rpc('get_user_email', {
        user_id_param: clientId
      });

      const [{ data: quotes }, { data: authUsers }, { data: clientProfile }] = await Promise.all([
        supabase
          .from('quote_requests')
          .select('*')
          .eq('client_user_id', clientId)
          .order('created_at', { ascending: false }),
        supabase.rpc('get_all_users'),
        supabase
          .from('clients')
          .select('first_name, last_name, phone')
          .eq('user_id', clientId)
          .maybeSingle()
      ]);

      const authUser = authUsers?.find((u: any) => u.id === clientId);

      const clientInfoData = {
        id: clientId,
        email: userEmail || '',
        created_at: authUser?.created_at || '',
        name: clientProfile ? `${clientProfile.first_name || ''} ${clientProfile.last_name || ''}`.trim() : 'Non renseigné',
        phone: clientProfile?.phone || 'Non renseigné',
      };

      setClientInfo(clientInfoData);

      const formattedQuotes: QuoteRequest[] = await Promise.all(
        (quotes || []).map(async (q: any) => {
          const { count } = await supabase
            .from('quotes')
            .select('*', { count: 'exact', head: true })
            .eq('quote_request_id', q.id);

          return {
            id: q.id,
            created_at: q.created_at,
            departure_address: q.from_address || q.departure_address,
            arrival_address: q.to_address || q.arrival_address,
            moving_date: q.moving_date,
            surface_area: q.surface_m2 || q.surface_area || 0,
            volume: q.volume_m3 || q.volume || 0,
            floor_departure: q.floor_from || q.floor_departure || 0,
            floor_arrival: q.floor_to || q.floor_arrival || 0,
            has_elevator_departure: q.elevator_from || q.has_elevator_departure || false,
            has_elevator_arrival: q.elevator_to || q.has_elevator_arrival || false,
            status: q.status,
            total_quotes: count || 0,
            client_name: q.client_name,
            client_phone: q.client_phone,
            from_home_type: q.from_home_type,
            from_home_size: q.from_home_size,
            from_surface_m2: q.from_surface_m2,
            to_home_type: q.to_home_type,
            to_home_size: q.to_home_size,
            to_surface_m2: q.to_surface_m2,
            furniture_lift_needed_departure: q.furniture_lift_needed_departure,
            furniture_lift_needed_arrival: q.furniture_lift_needed_arrival,
            elevator_capacity_from: q.elevator_capacity_from,
            elevator_capacity_to: q.elevator_capacity_to,
            date_flexibility_days: q.date_flexibility_days,
            services_needed: q.services_needed,
            additional_info: q.additional_info,
          };
        })
      );

      setQuoteRequests(formattedQuotes);

      formattedQuotes.forEach(quote => {
        calculateDistance(quote.id, quote.departure_address, quote.arrival_address);
      });
    } catch (error) {
      console.error('Error loading client data:', error);
      showToast('Erreur lors du chargement des données', 'error');
    } finally {
      setLoading(false);
    }
  };

  const calculateDistance = async (quoteId: string, from: string, to: string) => {
    if (!from || !to) return;

    try {
      const service = new google.maps.DistanceMatrixService();
      const result = await service.getDistanceMatrix({
        origins: [from],
        destinations: [to],
        travelMode: google.maps.TravelMode.DRIVING,
        unitSystem: google.maps.UnitSystem.METRIC,
      });

      if (result.rows[0]?.elements[0]?.distance) {
        const distanceInKm = Math.round(result.rows[0].elements[0].distance.value / 1000);
        setDistances(prev => ({ ...prev, [quoteId]: distanceInKm }));
      }
    } catch (error) {
      console.error('Error calculating distance:', error);
    }
  };

  const handleExport = () => {
    if (!clientInfo) return;

    const data = {
      'Informations Client': {
        'ID': clientInfo.id,
        'Email': clientInfo.email,
        'Date d\'inscription': new Date(clientInfo.created_at).toLocaleDateString('fr-FR'),
      },
      'Demandes de Déménagement': quoteRequests.map((q, index) => ({
        [`Demande ${index + 1}`]: {
          'Date de création': new Date(q.created_at).toLocaleDateString('fr-FR'),
          'Date du déménagement': new Date(q.moving_date).toLocaleDateString('fr-FR'),
          'Nom du client': q.client_name || 'Non renseigné',
          'Téléphone': q.client_phone || 'Non renseigné',
          'Départ': q.departure_address,
          'Arrivée': q.arrival_address,
          'Surface': `${q.surface_area} m²`,
          'Volume': `${q.volume} m³`,
          'Étage départ': q.floor_departure,
          'Ascenseur départ': q.has_elevator_departure ? 'Oui' : 'Non',
          'Étage arrivée': q.floor_arrival,
          'Ascenseur arrivée': q.has_elevator_arrival ? 'Oui' : 'Non',
          'Statut': q.status,
          'Nombre de devis reçus': q.total_quotes,
        },
      })),
    };

    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `client_${clientInfo.email}_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    showToast('Fiche client exportée avec succès', 'success');
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-8">
          <div className="flex items-center gap-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span className="text-gray-900 dark:text-white">Chargement...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!clientInfo) {
    return null;
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'accepted':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending':
        return 'En attente';
      case 'accepted':
        return 'Acceptée';
      case 'completed':
        return 'Terminée';
      case 'cancelled':
        return 'Annulée';
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-8">
          <div className="flex items-center gap-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <p className="text-gray-900 dark:text-white">Chargement des données...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!clientInfo) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-8">
          <p className="text-gray-900 dark:text-white">Aucune information trouvée pour ce client.</p>
          <button
            onClick={onClose}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Fermer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-7xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Fiche Client Complète
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              Exporter
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
            <div className="flex items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <User className="w-5 h-5 text-blue-600" />
                Informations du Compte
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <User className="w-5 h-5 text-gray-400 mt-1" />
                <div className="flex-1">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Nom complet</p>
                  <p className="text-gray-900 dark:text-white font-medium">{clientInfo.name || 'Non renseigné'}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Phone className="w-5 h-5 text-gray-400 mt-1" />
                <div className="flex-1">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Téléphone</p>
                  <p className="text-gray-900 dark:text-white font-medium">{clientInfo.phone || 'Non renseigné'}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-gray-400 mt-1" />
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Email</p>
                  <p className="text-gray-900 dark:text-white font-medium">{clientInfo.email}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-gray-400 mt-1" />
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Date du déménagement</p>
                  <p className="text-gray-900 dark:text-white font-medium">
                    {quoteRequests.length > 0 ? (
                      <>
                        {new Date(quoteRequests[0].moving_date).toLocaleDateString('fr-FR')}
                        {quoteRequests[0].date_flexibility_days && quoteRequests[0].date_flexibility_days > 0 && (
                          <span className="ml-2 text-sm text-blue-600 dark:text-blue-400">
                            (±{quoteRequests[0].date_flexibility_days} jour{quoteRequests[0].date_flexibility_days > 1 ? 's' : ''})
                          </span>
                        )}
                      </>
                    ) : (
                      'Aucune demande'
                    )}
                  </p>
                </div>
              </div>
            </div>

            {quoteRequests.length === 0 && (
              <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  Ce client ne s'est pas encore inscrit via le formulaire de demande de déménagement.
                  Les informations de contact (nom et téléphone) seront disponibles après sa première demande.
                </p>
              </div>
            )}
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
              <FileText className="w-5 h-5 text-blue-600" />
              Demandes de Déménagement ({quoteRequests.length})
            </h3>

            {quoteRequests.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <Package className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500 dark:text-gray-400">Aucune demande de déménagement</p>
              </div>
            ) : (
              <div className="space-y-4">
                {quoteRequests.map((quote) => (
                  <div
                    key={quote.id}
                    className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-4"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Créée le {new Date(quote.created_at).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(quote.status)}`}>
                          {getStatusLabel(quote.status)}
                        </span>
                        <button
                          onClick={() => setSelectedQuoteId(quote.id)}
                          className="flex items-center gap-1 px-3 py-1 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          <Edit className="w-3 h-3" />
                          Modifier
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3 bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-blue-600" />
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Nom du client</p>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {quote.client_name || 'Non renseigné'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-blue-600" />
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Téléphone</p>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {quote.client_phone || 'Non renseigné'}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
                      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                        <div className="flex items-start gap-2 mb-3">
                          <MapPin className="w-5 h-5 text-green-600 mt-1" />
                          <div className="flex-1">
                            <p className="font-semibold text-gray-900 dark:text-white mb-1">Adresse de Départ</p>
                            <p className="text-sm text-gray-900 dark:text-white mb-2">{quote.departure_address}</p>

                            <div className="space-y-2">
                              {quote.from_home_type && (
                                <div className="flex items-center gap-2 text-sm">
                                  <span className="text-gray-500 dark:text-gray-400">Type:</span>
                                  <span className="font-medium text-gray-900 dark:text-white">{quote.from_home_type}</span>
                                </div>
                              )}
                              {quote.from_home_size && (
                                <div className="flex items-center gap-2 text-sm">
                                  <span className="text-gray-500 dark:text-gray-400">Taille:</span>
                                  <span className="font-medium text-gray-900 dark:text-white">{quote.from_home_size}</span>
                                </div>
                              )}
                              {quote.from_surface_m2 && (
                                <div className="flex items-center gap-2 text-sm">
                                  <span className="text-gray-500 dark:text-gray-400">Surface:</span>
                                  <span className="font-medium text-gray-900 dark:text-white">{quote.from_surface_m2} m²</span>
                                </div>
                              )}
                              <div className="flex items-center gap-2 text-sm">
                                <span className="text-gray-500 dark:text-gray-400">Étage:</span>
                                <span className="font-medium text-gray-900 dark:text-white">{quote.floor_departure}</span>
                              </div>
                              <div className="flex items-center gap-2 text-sm">
                                <span className="text-gray-500 dark:text-gray-400">Ascenseur:</span>
                                <span className="font-medium text-gray-900 dark:text-white">
                                  {quote.has_elevator_departure ? 'Oui' : 'Non'}
                                  {quote.has_elevator_departure && quote.elevator_capacity_from && (
                                    <span className="ml-1 text-gray-500">({quote.elevator_capacity_from})</span>
                                  )}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-sm">
                                <span className="text-gray-500 dark:text-gray-400">Monte-meuble:</span>
                                <span className="font-medium text-gray-900 dark:text-white">
                                  {quote.furniture_lift_needed_departure ? 'Oui' : 'Non'}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                        <div className="flex items-start gap-2 mb-3">
                          <MapPin className="w-5 h-5 text-red-600 mt-1" />
                          <div className="flex-1">
                            <p className="font-semibold text-gray-900 dark:text-white mb-1">Adresse d'Arrivée</p>
                            <p className="text-sm text-gray-900 dark:text-white mb-2">{quote.arrival_address}</p>

                            <div className="space-y-2">
                              {quote.to_home_type && (
                                <div className="flex items-center gap-2 text-sm">
                                  <span className="text-gray-500 dark:text-gray-400">Type:</span>
                                  <span className="font-medium text-gray-900 dark:text-white">{quote.to_home_type}</span>
                                </div>
                              )}
                              {quote.to_home_size && (
                                <div className="flex items-center gap-2 text-sm">
                                  <span className="text-gray-500 dark:text-gray-400">Taille:</span>
                                  <span className="font-medium text-gray-900 dark:text-white">{quote.to_home_size}</span>
                                </div>
                              )}
                              {quote.to_surface_m2 && (
                                <div className="flex items-center gap-2 text-sm">
                                  <span className="text-gray-500 dark:text-gray-400">Surface:</span>
                                  <span className="font-medium text-gray-900 dark:text-white">{quote.to_surface_m2} m²</span>
                                </div>
                              )}
                              <div className="flex items-center gap-2 text-sm">
                                <span className="text-gray-500 dark:text-gray-400">Étage:</span>
                                <span className="font-medium text-gray-900 dark:text-white">{quote.floor_arrival}</span>
                              </div>
                              <div className="flex items-center gap-2 text-sm">
                                <span className="text-gray-500 dark:text-gray-400">Ascenseur:</span>
                                <span className="font-medium text-gray-900 dark:text-white">
                                  {quote.has_elevator_arrival ? 'Oui' : 'Non'}
                                  {quote.has_elevator_arrival && quote.elevator_capacity_to && (
                                    <span className="ml-1 text-gray-500">({quote.elevator_capacity_to})</span>
                                  )}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-sm">
                                <span className="text-gray-500 dark:text-gray-400">Monte-meuble:</span>
                                <span className="font-medium text-gray-900 dark:text-white">
                                  {quote.furniture_lift_needed_arrival ? 'Oui' : 'Non'}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {distances[quote.id] && (
                      <div className="mb-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 flex items-center gap-3">
                        <Navigation className="w-5 h-5 text-blue-600" />
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Distance estimée</p>
                          <p className="text-lg font-bold text-blue-600">{distances[quote.id]} km</p>
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Volume estimé</p>
                        <p className="text-lg font-bold text-gray-900 dark:text-white">{quote.volume} m³</p>
                      </div>
                      <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-3">
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Flexibilité de date</p>
                        <p className="text-lg font-bold text-gray-900 dark:text-white">
                          {quote.date_flexibility_days ? `${quote.date_flexibility_days} jour${quote.date_flexibility_days > 1 ? 's' : ''}` : 'Aucune'}
                        </p>
                      </div>
                      <button
                        onClick={() => setSelectedQuoteRequestForQuotes(quote.id)}
                        className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-3 hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-colors cursor-pointer text-left w-full"
                      >
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Devis reçus</p>
                        <p className="text-lg font-bold text-gray-900 dark:text-white">
                          {quote.total_quotes}
                        </p>
                        <p className="text-xs text-orange-600 dark:text-orange-400 mt-1 font-medium">
                          Cliquez pour voir les devis
                        </p>
                      </button>
                    </div>

                    {quote.services_needed && quote.services_needed.length > 0 && (
                      <div className="mb-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Services demandés</p>
                        <div className="flex flex-wrap gap-2">
                          {quote.services_needed.map((service: string, idx: number) => (
                            <span
                              key={idx}
                              className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 text-xs rounded"
                            >
                              {service}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {quote.additional_info && (
                      <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Informations complémentaires</p>
                        <p className="text-sm text-gray-900 dark:text-white">{quote.additional_info}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {selectedQuoteId && (
        <QuoteRequestDetailModal
          quoteRequestId={selectedQuoteId}
          onClose={() => setSelectedQuoteId(null)}
          onSave={() => {
            loadClientData();
            onUpdate();
          }}
        />
      )}

      {selectedQuoteRequestForQuotes && (
        <QuotesListModal
          quoteRequestId={selectedQuoteRequestForQuotes}
          onClose={() => setSelectedQuoteRequestForQuotes(null)}
          adminRole={adminRole}
        />
      )}
    </div>
  );
}
