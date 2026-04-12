import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, QuoteRequest as BaseQuoteRequest } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Package, Calendar, MapPin, Building, ChevronDown, ChevronUp, MessageSquare, ArrowUp, Lock, Navigation, FileText, Truck, Map } from 'lucide-react';
import { MoverLayout } from '../components/MoverLayout';
import QuoteBidModal from '../components/QuoteBidModal';
import { SearchAndFilter, FilterOptions } from '../components/SearchAndFilter';
import RouteMap from '../components/RouteMap';
import { FurnitureInventoryModal } from '../components/FurnitureInventoryModal';
import { DistanceDisplay } from '../components/DistanceDisplay';
import type { FurnitureInventory } from '../components/VolumeCalculator';

const calculateDistance = (fromCity: string, toCity: string, fromPostal: string, toPostal: string): number => {
  const postalCoords: Record<string, { lat: number; lng: number }> = {
    '75': { lat: 48.8566, lng: 2.3522 },
    '33': { lat: 44.8378, lng: -0.5792 },
    '92': { lat: 48.8906, lng: 2.2392 },
    '93': { lat: 48.9106, lng: 2.4806 },
    '94': { lat: 48.7900, lng: 2.4597 },
    '95': { lat: 49.0397, lng: 2.0764 },
    '69': { lat: 45.7640, lng: 4.8357 },
    '13': { lat: 43.2965, lng: 5.3698 },
    '31': { lat: 43.6047, lng: 1.4442 },
    '44': { lat: 47.2184, lng: -1.5536 },
    '59': { lat: 50.6292, lng: 3.0573 },
    '67': { lat: 48.5734, lng: 7.7521 },
    '34': { lat: 43.6108, lng: 3.8767 },
    '06': { lat: 43.7102, lng: 7.2620 },
    '35': { lat: 48.1173, lng: -1.6778 },
    '49': { lat: 47.4784, lng: -0.5632 },
    '76': { lat: 49.4432, lng: 1.0993 },
    '78': { lat: 48.8014, lng: 2.1301 },
    '91': { lat: 48.6321, lng: 2.4387 },
  };

  const getDeptCode = (postal: string) => postal.substring(0, 2);

  const fromDept = getDeptCode(fromPostal);
  const toDept = getDeptCode(toPostal);

  const from = postalCoords[fromDept];
  const to = postalCoords[toDept];

  if (!from || !to) {
    return 0;
  }

  const R = 6371;
  const dLat = (to.lat - from.lat) * Math.PI / 180;
  const dLon = (to.lng - from.lng) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(from.lat * Math.PI / 180) * Math.cos(to.lat * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return Math.round(distance);
};

interface QuoteRequest extends BaseQuoteRequest {
  existing_quotes_count: number;
}

export default function MoverQuoteRequestsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [quoteRequests, setQuoteRequests] = useState<QuoteRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedRequest, setExpandedRequest] = useState<string | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<QuoteRequest | null>(null);
  const [showBidModal, setShowBidModal] = useState(false);
  const [moverVerified, setMoverVerified] = useState(false);
  const [showInventoryModal, setShowInventoryModal] = useState(false);
  const [selectedRequestForInventory, setSelectedRequestForInventory] = useState<QuoteRequest | null>(null);
  const [visibleMaps, setVisibleMaps] = useState<Set<string>>(new Set());
  const [filters, setFilters] = useState<FilterOptions>({
    searchQuery: '',
    minPrice: 0,
    maxPrice: 10000,
    minRating: 0,
    sortBy: 'date',
    fromCity: '',
    toCity: '',
    movingDate: '',
  });

  useEffect(() => {
    checkMoverVerification();
    fetchQuoteRequests();
  }, [user]);

  const checkMoverVerification = async () => {
    if (!user) return;

    const { data: mover } = await supabase
      .from('movers')
      .select('verification_status')
      .eq('user_id', user.id)
      .maybeSingle();

    setMoverVerified(mover?.verification_status === 'verified');
  };

  const fetchQuoteRequests = async () => {
    try {
      console.log('Fetching quote requests...');

      const { data: moverData } = await supabase
        .from('movers')
        .select('id')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (!moverData) {
        setQuoteRequests([]);
        setLoading(false);
        return;
      }

      const { data: myQuotes } = await supabase
        .from('quotes')
        .select('quote_request_id')
        .eq('mover_id', moverData.id);

      const quotedRequestIds = myQuotes?.map(q => q.quote_request_id) || [];

      const { data, error } = await supabase
        .from('quote_requests_with_privacy')
        .select(`
          id,
          client_user_id,
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
          furniture_inventory,
          furniture_photos,
          accepts_groupage,
          status,
          created_at,
          updated_at,
          is_data_masked
        `)
        .in('status', ['new', 'quoted'])
        .not('id', 'in', `(${quotedRequestIds.length > 0 ? quotedRequestIds.join(',') : '00000000-0000-0000-0000-000000000000'})`)
        .order('created_at', { ascending: false });

      console.log('Query result:', { data, error });

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      const requestsWithCount = await Promise.all(data.map(async (req) => {
        const { count } = await supabase
          .from('quotes')
          .select('*', { count: 'exact', head: true })
          .eq('quote_request_id', req.id);

        return {
          ...req,
          existing_quotes_count: count || 0,
        };
      }));

      console.log('Processed requests:', requestsWithCount);
      setQuoteRequests(requestsWithCount);
    } catch (error) {
      console.error('Error fetching quote requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const filteredAndSortedRequests = useMemo(() => {
    let filtered = [...quoteRequests];

    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      filtered = filtered.filter(
        (req) =>
          req.from_city?.toLowerCase().includes(query) ||
          req.to_city?.toLowerCase().includes(query) ||
          req.home_size?.toLowerCase().includes(query)
      );
    }

    if (filters.fromCity) {
      filtered = filtered.filter((req) =>
        req.from_city?.toLowerCase().includes(filters.fromCity.toLowerCase())
      );
    }

    if (filters.toCity) {
      filtered = filtered.filter((req) =>
        req.to_city?.toLowerCase().includes(filters.toCity.toLowerCase())
      );
    }

    if (filters.movingDate) {
      filtered = filtered.filter((req) => req.moving_date === filters.movingDate);
    }

    switch (filters.sortBy) {
      case 'date':
        filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
    }

    return filtered;
  }, [quoteRequests, filters]);

  const translateHomeSize = (size: string) => {
    const translations: Record<string, string> = {
      studio: 'Studio',
      t1: 'T1',
      t2: 'T2',
      t3: 'T3',
      t4: 'T4',
      t5: 'T5+',
      maison: 'Maison',
    };
    return translations[size] || size;
  };

  const translateService = (service: string) => {
    const translations: Record<string, string> = {
      packing: 'Emballage',
      furniture_disassembly: 'Démontage meubles',
      furniture_assembly: 'Montage meubles',
      storage: 'Stockage',
      piano: 'Piano',
      fragile_items: 'Objets fragiles',
      cleaning: 'Nettoyage',
    };
    return translations[service] || service;
  };

  const handleBidClick = (request: QuoteRequest) => {
    setSelectedRequest(request);
    setShowBidModal(true);
  };

  const handleBidSubmitted = () => {
    setShowBidModal(false);
    setSelectedRequest(null);
    fetchQuoteRequests();
  };

  if (loading) {
    return (
      <MoverLayout activeSection="quote-requests" title="Demandes de devis">
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-slate-600">Chargement des demandes...</p>
          </div>
        </div>
      </MoverLayout>
    );
  }

  if (!moverVerified) {
    return (
      <MoverLayout activeSection="quote-requests" title="Demandes de devis">
        <div className="flex items-center justify-center p-6">
          <div className="bg-white rounded-xl shadow-lg p-8 max-w-md text-center">
            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Package className="w-8 h-8 text-amber-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Compte en attente de vérification</h2>
            <p className="text-slate-600">
              Votre compte doit être vérifié par notre équipe avant de pouvoir soumettre des devis.
            </p>
          </div>
        </div>
      </MoverLayout>
    );
  }

  return (
    <MoverLayout activeSection="quote-requests" title="Demandes de devis disponibles">
      <div className="max-w-7xl mx-auto">

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800 mb-2">Demandes de devis disponibles</h1>
          <p className="text-slate-600">
            {filteredAndSortedRequests.length} demande{filteredAndSortedRequests.length > 1 ? 's' : ''} disponible{filteredAndSortedRequests.length > 1 ? 's' : ''}
            {filters.searchQuery || filters.fromCity || filters.toCity || filters.movingDate ? ` (${quoteRequests.length} au total)` : ''}
          </p>
        </div>

        <SearchAndFilter
          onFilterChange={setFilters}
          showPriceFilter={false}
          showRatingFilter={false}
          showLocationFilter={true}
          showDateFilter={true}
        />

        <div className="space-y-4">
          {filteredAndSortedRequests.map((request) => (
            <div
              key={request.id}
              className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow border border-slate-200"
            >
              <div className="p-6">
                {request.is_data_masked && (
                  <div className="mb-4 bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <Lock className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <h4 className="font-semibold text-amber-900 mb-1">
                          Informations client protégées
                        </h4>
                        <p className="text-sm text-amber-800">
                          Les coordonnées complètes du client (nom, email, téléphone, adresses exactes) seront visibles après l'encaissement du premier paiement.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid lg:grid-cols-[1fr,400px] gap-6 mb-4">
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-6">
                      <div className="flex items-center gap-3">
                        <span className="px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-base font-semibold">
                          {translateHomeSize(request.home_size)}
                        </span>
                        {!!request.volume_m3 && (
                          <div className="flex flex-col">
                            <span className="text-xs text-slate-500 font-medium">Cubage</span>
                            <span className="text-slate-800 text-base font-semibold">
                              {request.volume_m3} m³
                            </span>
                          </div>
                        )}
                        {!!request.surface_m2 && (
                          <div className="flex flex-col">
                            <span className="text-xs text-slate-500 font-medium">Surface</span>
                            <span className="text-slate-800 text-base font-semibold">
                              {request.surface_m2} m²
                            </span>
                          </div>
                        )}
                      </div>

                      <button
                        onClick={() => setExpandedRequest(expandedRequest === request.id ? null : request.id)}
                        className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                      >
                        {expandedRequest === request.id ? (
                          <ChevronUp className="w-5 h-5 text-slate-600" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-slate-600" />
                        )}
                      </button>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6 mb-6">
                      <div>
                        <div className="flex items-start gap-3 mb-3">
                          <MapPin className="w-5 h-5 text-green-600 mt-1 flex-shrink-0" />
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-slate-700 mb-1">Départ</p>
                            <p className="text-slate-900 font-medium text-base">
                              {request.from_city} ({request.from_postal_code})
                            </p>
                            <p className="text-sm text-slate-600 mt-1">{request.from_address}</p>
                          </div>
                        </div>
                        <div className="ml-8 space-y-2">
                          {((request as any).from_home_type || (request as any).from_home_size) && (
                            <div className="text-sm text-slate-700">
                              {(request as any).from_home_type && <span className="font-medium">{(request as any).from_home_type}</span>}
                              {(request as any).from_home_type && (request as any).from_home_size && <span> - </span>}
                              {(request as any).from_home_size && <span>{(request as any).from_home_size}</span>}
                              {(request as any).from_surface_m2 && <span className="text-slate-500"> ({(request as any).from_surface_m2}m²)</span>}
                            </div>
                          )}
                          <div className="flex items-center gap-2">
                            <Building className="w-4 h-4 text-slate-600" />
                            <span className="text-sm text-slate-700">
                              Étage {request.floor_from === 0 ? 'RDC' : request.floor_from}
                              {request.elevator_from && (
                                <span className="ml-2 inline-flex items-center gap-1 text-green-600">
                                  <ArrowUp className="w-3 h-3" />
                                  <span className="text-xs">Ascenseur</span>
                                </span>
                              )}
                              {!request.elevator_from && (
                                <span className="ml-2 text-xs text-slate-500">(sans ascenseur)</span>
                              )}
                            </span>
                          </div>
                          {(request as any).furniture_lift_needed_departure && (
                            <div className="text-sm text-orange-600 font-medium">
                              Monte-meuble nécessaire
                            </div>
                          )}
                        </div>
                      </div>

                      <div>
                        <div className="flex items-start gap-3 mb-3">
                          <MapPin className="w-5 h-5 text-red-600 mt-1 flex-shrink-0" />
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-slate-700 mb-1">Arrivée</p>
                            <p className="text-slate-900 font-medium text-base">
                              {request.to_city} ({request.to_postal_code})
                            </p>
                            <p className="text-sm text-slate-600 mt-1">{request.to_address}</p>
                          </div>
                        </div>
                        <div className="ml-8 space-y-2">
                          {((request as any).to_home_type || (request as any).to_home_size) && (
                            <div className="text-sm text-slate-700">
                              {(request as any).to_home_type && <span className="font-medium">{(request as any).to_home_type}</span>}
                              {(request as any).to_home_type && (request as any).to_home_size && <span> - </span>}
                              {(request as any).to_home_size && <span>{(request as any).to_home_size}</span>}
                              {(request as any).to_surface_m2 && <span className="text-slate-500"> ({(request as any).to_surface_m2}m²)</span>}
                            </div>
                          )}
                          <div className="flex items-center gap-2">
                            <Building className="w-4 h-4 text-slate-600" />
                            <span className="text-sm text-slate-700">
                              Étage {request.floor_to === 0 ? 'RDC' : request.floor_to}
                              {request.elevator_to && (
                                <span className="ml-2 inline-flex items-center gap-1 text-green-600">
                                  <ArrowUp className="w-3 h-3" />
                                  <span className="text-xs">Ascenseur</span>
                                </span>
                              )}
                              {!request.elevator_to && (
                                <span className="ml-2 text-xs text-slate-500">(sans ascenseur)</span>
                              )}
                            </span>
                          </div>
                          {(request as any).furniture_lift_needed_arrival && (
                            <div className="text-sm text-orange-600 font-medium">
                              Monte-meuble nécessaire
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {request.from_address && request.to_address && (
                      <div className="mb-4 pb-4 border-b border-slate-200">
                        <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3">
                          <DistanceDisplay
                            fromAddress={request.from_address}
                            fromCity={request.from_city}
                            fromPostalCode={request.from_postal_code}
                            toAddress={request.to_address}
                            toCity={request.to_city}
                            toPostalCode={request.to_postal_code}
                            showDuration={true}
                            className="text-base font-semibold"
                          />
                        </div>
                      </div>
                    )}

                    <div className="mb-4 pb-4 border-b border-slate-200">
                      <div className="flex items-center gap-2 mb-1">
                        <Calendar className="w-4 h-4 text-blue-600" />
                        <span className="text-base font-medium text-slate-800">
                          {formatDate(request.moving_date)}
                        </span>
                      </div>
                      {(request as any).date_flexibility_days > 0 && (
                        <p className="text-sm text-slate-600 ml-6">
                          Flexible ± {(request as any).date_flexibility_days} jour{(request as any).date_flexibility_days > 1 ? 's' : ''}
                        </p>
                      )}
                    </div>

                    {request.services_needed && request.services_needed.length > 0 && (
                      <div>
                        <p className="text-sm font-semibold text-slate-700 mb-2">Services demandés:</p>
                        <div className="flex flex-wrap gap-2">
                          {request.services_needed.map((service, idx) => (
                            <span
                              key={idx}
                              className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium border border-blue-200"
                            >
                              {translateService(service)}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Groupage preference */}
                    {(request as any).accepts_groupage !== undefined && (
                      <div className="mt-4 pt-4 border-t border-slate-200">
                        <div className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${
                          (request as any).accepts_groupage 
                            ? 'bg-green-50 text-green-700 border border-green-200' 
                            : 'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}>
                          <Truck className="w-4 h-4" />
                          {(request as any).accepts_groupage 
                            ? '✓ Accepte le groupage' 
                            : 'Groupage non souhaité'}
                        </div>
                        {(request as any).accepts_groupage && (
                          <p className="text-xs text-slate-500 mt-2">
                            Le client est ouvert à un déménagement groupé avec d'autres clients.
                          </p>
                        )}
                      </div>
                    )}

                    {request.existing_quotes_count > 0 && (
                      <div className="mt-4 text-xs text-slate-500 italic">
                        {request.existing_quotes_count} devis déjà soumis
                      </div>
                    )}
                  </div>

                  <div className="lg:border-l lg:border-slate-200 lg:pl-6">
                    {visibleMaps.has(request.id) ? (
                      <div className="h-[400px] rounded-lg overflow-hidden shadow-sm">
                        <RouteMap
                          fromAddress={request.from_address}
                          fromCity={request.from_city}
                          fromPostalCode={request.from_postal_code}
                          toAddress={request.to_address}
                          toCity={request.to_city}
                          toPostalCode={request.to_postal_code}
                        />
                      </div>
                    ) : (
                      <div className="h-[400px] rounded-lg border-2 border-dashed border-slate-200 bg-slate-50 flex flex-col items-center justify-center gap-3">
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                          <Map className="w-6 h-6 text-blue-600" />
                        </div>
                        <p className="text-sm text-slate-500 text-center px-4">
                          {request.from_city} → {request.to_city}
                        </p>
                        <button
                          onClick={() => setVisibleMaps(prev => new Set(prev).add(request.id))}
                          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                        >
                          <Navigation className="w-4 h-4" />
                          Voir la carte
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {expandedRequest === request.id && request.additional_info && (
                  <div className="mt-4 pt-4 border-t border-slate-200">
                    <div className="mb-4">
                      <div className="flex items-start gap-2">
                        <MessageSquare className="w-4 h-4 text-blue-600 mt-1" />
                        <div>
                          <p className="text-sm font-medium text-slate-700 mb-1">Informations complémentaires:</p>
                          <p className="text-slate-600 whitespace-pre-wrap">{request.additional_info}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="mt-4 pt-4 border-t border-slate-200 flex items-center space-x-3">
                  <button
                    onClick={() => handleBidClick(request)}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    Soumettre un devis
                  </button>
                  {request.furniture_inventory && (
                    <button
                      onClick={() => {
                        setSelectedRequestForInventory(request);
                        setShowInventoryModal(true);
                      }}
                      className="px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors font-medium flex items-center space-x-2"
                    >
                      <FileText className="w-4 h-4" />
                      <span>Inventaire mobilier</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}

          {quoteRequests.length === 0 && (
            <div className="bg-white rounded-xl shadow-sm p-12 text-center">
              <Package className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-700 mb-2">Aucune demande disponible</h3>
              <p className="text-slate-500">
                Il n'y a pas de nouvelles demandes de devis pour le moment.
              </p>
            </div>
          )}
        </div>
      </div>

      {showBidModal && selectedRequest && (
        <QuoteBidModal
          quoteRequest={selectedRequest}
          onClose={() => {
            setShowBidModal(false);
            setSelectedRequest(null);
          }}
          onSuccess={handleBidSubmitted}
        />
      )}

      {showInventoryModal && selectedRequestForInventory && (
        <FurnitureInventoryModal
          inventory={selectedRequestForInventory.furniture_inventory as FurnitureInventory}
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
    </MoverLayout>
  );
}